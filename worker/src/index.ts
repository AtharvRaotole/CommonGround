import {
  CONSENT_TASTE_VERSION,
  ConstraintSchema,
  EntityIdSchema,
  EntitySearchRequestSchema,
  EntitySearchResponseSchema,
  PreferencesPutSchema,
  HealthResponseSchema,
} from "@common-ground/contracts";
import {
  assertSameOrigin,
  genericUnauthorized,
  toEventDto,
} from "./auth/authorize";
import {
  SESSION_COOKIE,
  SESSION_TTL_SEC,
  cookieHeader,
  parseCookies,
} from "./auth/capabilities";
import { Repository, type D1Like } from "./db/repository";
import { remainingLookups, reserveLookup } from "./planning/budget";
import {
  assertModelCannotWaive,
  assessSlateReadiness,
} from "./planning/constraints";
import { discoverBoundedCandidates } from "./planning/discover";
import { toPublicRankDto } from "./planning/rank";
import { rankProfiledMembersOnSlate } from "./planning/score";
import { QlooClient } from "./providers/qloo";
import { deleteOwnMemberInputs } from "./privacy/delete";
import type { VenueRecord } from "./venues/facts";

export interface Env {
  ENVIRONMENT?: string;
  GIT_SHA?: string;
  ALLOWED_ORIGINS?: string;
  QLOO_API_KEY?: string;
  QLOO_BASE_URL?: string;
  ASSETS?: Fetcher;
  DB: D1Like;
}

function revision(env: Env): string {
  return env.GIT_SHA?.slice(0, 12) || "local-dev";
}

function mode(env: Env): "local" | "preview" | "production" {
  const value = (env.ENVIRONMENT || "local").toLowerCase();
  if (value === "production") return "production";
  if (value === "preview") return "preview";
  return "local";
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      ...headers,
    },
  });
}

function allowedOrigins(env: Env, requestUrl: URL): string[] {
  const configured = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    requestUrl.origin,
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ];
  return [...new Set([...configured, ...defaults])];
}

function secureCookies(requestUrl: URL): boolean {
  return requestUrl.protocol === "https:";
}

function qlooClient(env: Env): QlooClient {
  return new QlooClient({
    apiKey: env.QLOO_API_KEY,
    baseUrl: env.QLOO_BASE_URL,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const repo = new Repository(env.DB);

    if (request.method === "GET" && url.pathname === "/api/health") {
      const body = HealthResponseSchema.parse({
        ok: true as const,
        service: "common-ground" as const,
        revision: revision(env),
        mode: mode(env),
        time: new Date().toISOString(),
      });
      return json(body);
    }

    if (url.pathname.startsWith("/api/") && !assertSameOrigin(request, allowedOrigins(env, url))) {
      return json(
        { code: "forbidden_origin", message: "Origin not allowed", retryable: false, requestId: crypto.randomUUID() },
        403,
      );
    }

    if (request.method === "POST" && url.pathname === "/api/events") {
      const body = (await request.json().catch(() => null)) as {
        title?: string;
        groupSize?: number;
        area?: string;
        timezone?: string;
      } | null;
      const title = body?.title?.trim();
      const groupSize = Number(body?.groupSize);
      if (!title || !Number.isFinite(groupSize) || groupSize < 4 || groupSize > 8) {
        return json(
          { code: "invalid", message: "title and groupSize 4–8 required", retryable: false, requestId: crypto.randomUUID() },
          422,
        );
      }
      const created = await repo.createEvent({
        title,
        groupSize,
        area: body?.area,
        timezone: body?.timezone,
      });
      return json(
        {
          eventId: created.eventId,
          hostRecoverySecret: created.hostRecoverySecret,
          hostClaimSecret: created.hostClaimSecret,
          notice:
            "Save the host recovery secret. Losing it can mean losing host access. Participant invites never include this value.",
        },
        201,
      );
    }

    if (request.method === "POST" && url.pathname === "/api/claims") {
      const body = (await request.json().catch(() => null)) as { secret?: string } | null;
      const secret = body?.secret?.trim();
      if (!secret) {
        return json(
          { code: "invalid", message: "secret required", retryable: false, requestId: crypto.randomUUID() },
          422,
        );
      }
      const result = await repo.consumeClaim(secret);
      if (!result.ok) {
        return result.reason === "conflict"
          ? json({ code: "conflict", message: "Claim already used", retryable: false, requestId: crypto.randomUUID() }, 409)
          : genericUnauthorized();
      }
      return json(
        { eventId: result.session.eventId, role: result.session.role, participantId: result.session.participantId },
        200,
        {
          "set-cookie": cookieHeader(SESSION_COOKIE, result.sessionToken, {
            maxAgeSec: SESSION_TTL_SEC,
            secure: secureCookies(url),
          }),
        },
      );
    }

    const session = await repo.sessionFromToken(
      parseCookies(request.headers.get("cookie"))[SESSION_COOKIE],
    );

    const inviteMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/invites$/);
    if (request.method === "POST" && inviteMatch) {
      if (!session || session.role !== "host" || session.eventId !== inviteMatch[1]) {
        return genericUnauthorized();
      }
      const invite = await repo.createMemberInvite(session.eventId);
      return json({
        claimSecret: invite.claimSecret,
        claimPath: `/join#${invite.claimSecret}`,
        expiresInSec: 72 * 3600,
      });
    }

    const eventMatch = url.pathname.match(/^\/api\/events\/([^/]+)$/);
    if (request.method === "GET" && eventMatch) {
      if (!session || session.eventId !== eventMatch[1]) return genericUnauthorized();
      const event = await repo.getEvent(session.eventId);
      if (!event) return genericUnauthorized();
      const preferences = await repo.listPreferences(session.eventId);
      const participants = await repo.listParticipants(session.eventId);
      const consents = await repo.listConsents(session.eventId);
      return json(
        toEventDto({
          event,
          viewer: session,
          preferences,
          participants,
          consents,
        }),
      );
    }

    const searchMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/me\/entity-search$/);
    if (request.method === "POST" && searchMatch) {
      if (!session || session.eventId !== searchMatch[1]) return genericUnauthorized();
      const body = await request.json().catch(() => null);
      const parsed = EntitySearchRequestSchema.safeParse(body);
      if (!parsed.success) {
        return json(
          {
            code: "invalid",
            message: "query (2–80 chars) and optional types required",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }

      const reserved = await reserveLookup({
        db: env.DB,
        memberId: session.participantId,
        eventId: session.eventId,
      });
      if (!reserved.ok) {
        const budgets = await remainingLookups({
          db: env.DB,
          memberId: session.participantId,
          eventId: session.eventId,
        });
        const payload = EntitySearchResponseSchema.parse({
          status: "quota" as const,
          dataMode: env.QLOO_API_KEY ? ("live" as const) : ("synthetic" as const),
          candidates: [],
          budgets,
        });
        return json(payload, 429);
      }

      const client = qlooClient(env);
      const outcome = await client.searchEntities({
        query: parsed.data.query,
        types: parsed.data.types,
      });
      const payload = EntitySearchResponseSchema.parse({
        status: outcome.status === "unavailable" ? "unavailable" : outcome.status,
        dataMode: outcome.dataMode,
        candidates: outcome.candidates,
        budgets: {
          memberRemaining: reserved.memberRemaining,
          eventRemaining: reserved.eventRemaining,
        },
      });
      if (outcome.status === "unavailable") return json(payload, 503);
      if (outcome.status === "timeout") return json(payload, 504);
      return json(payload);
    }

    const prefsMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/me\/preferences$/);
    if (request.method === "PUT" && prefsMatch) {
      if (!session || session.eventId !== prefsMatch[1]) return genericUnauthorized();
      const body = await request.json().catch(() => null);
      const parsed = PreferencesPutSchema.safeParse(body);
      if (!parsed.success) {
        return json(
          {
            code: "invalid",
            message:
              "seeds must be ≤3 confirmed entities with UUID ids; consentVersion required; wrong-type/malformed ids rejected",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }
      if (parsed.data.skipProfiling) {
        await repo.putOwnPreferences(session, [], false, {
          skipProfiling: true,
          consentVersion: parsed.data.consentVersion,
        });
      } else {
        await repo.putOwnPreferences(session, parsed.data.seeds, parsed.data.consentTaste, {
          skipProfiling: false,
          consentVersion: parsed.data.consentVersion,
        });
      }
      return json({
        ok: true,
        consentVersion: CONSENT_TASTE_VERSION,
        skipProfiling: !!parsed.data.skipProfiling,
      });
    }

    const deleteMe = url.pathname.match(/^\/api\/events\/([^/]+)\/me$/);
    if (request.method === "DELETE" && deleteMe) {
      if (!session || session.eventId !== deleteMe[1]) return genericUnauthorized();
      await deleteOwnMemberInputs(repo, session);
      return json(
        { ok: true },
        200,
        {
          "set-cookie": cookieHeader(SESSION_COOKIE, "", {
            maxAgeSec: 0,
            secure: secureCookies(url),
          }),
        },
      );
    }

    const discoverMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/discover$/);
    if (request.method === "POST" && discoverMatch) {
      if (!session || session.role !== "host" || session.eventId !== discoverMatch[1]) {
        return genericUnauthorized();
      }
      const body = (await request.json().catch(() => null)) as {
        runId?: string;
        profiledMemberIds?: string[];
        locationWkt?: string;
        radiusMeters?: number;
      } | null;
      const prefs = await repo.listPreferences(session.eventId);
      const consents = await repo.listConsents(session.eventId);
      const consentSkip = new Set(
        consents.filter((c) => c.skip_profiling).map((c) => c.participant_id),
      );
      const members = prefs.map((p) => {
        let seeds: import("@common-ground/contracts").ConfirmedSeed[] = [];
        try {
          seeds = JSON.parse(p.seeds_json);
        } catch {
          seeds = [];
        }
        return {
          participantId: p.participant_id,
          seeds,
          skipProfiling: consentSkip.has(p.participant_id),
        };
      });
      // Live candidates require confirmed mappings; unknown mappings stay out of live slates (P08).
      const catalogEntityIds = await repo.listConfirmedCatalogEntityIds();
      const result = await discoverBoundedCandidates({
        db: env.DB,
        client: qlooClient(env),
        members,
        raw: {
          eventId: session.eventId,
          runId: body?.runId || crypto.randomUUID(),
          profiledMemberIds:
            body?.profiledMemberIds ||
            members.filter((m) => m.seeds.length && !m.skipProfiling).map((m) => m.participantId),
          catalogEntityIds,
          locationWkt: body?.locationWkt,
          radiusMeters: body?.radiusMeters,
        },
      });
      return json(result, result.status === "invalid" ? 422 : result.status === "quota" ? 429 : 200);
    }

    const constraintMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/constraints$/);
    if (request.method === "PUT" && constraintMatch) {
      if (!session || session.eventId !== constraintMatch[1]) return genericUnauthorized();
      const body = await request.json().catch(() => null);
      // Reject model-style waive payloads explicitly.
      try {
        assertModelCannotWaive(
          (body && typeof body === "object" ? body : {}) as {
            waiveConstraintIds?: string[];
            rewrite?: unknown;
          },
        );
      } catch {
        return json(
          {
            code: "forbidden_policy",
            message: "Hard requirements cannot be waived by the model",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }
      const parsed = ConstraintSchema.safeParse(body);
      if (!parsed.success) {
        return json(
          {
            code: "invalid",
            message: "constraint failed schema validation",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }
      try {
        await repo.putConstraint(session, parsed.data);
      } catch {
        return genericUnauthorized();
      }
      const event = await repo.getEvent(session.eventId);
      return json({ ok: true, version: event?.version ?? null });
    }

    if (request.method === "GET" && constraintMatch) {
      if (!session || session.eventId !== constraintMatch[1]) return genericUnauthorized();
      const constraints = await repo.listConstraints(session.eventId);
      // Members see only own; host sees kinds/required without inventing ranks.
      const visible =
        session.role === "host"
          ? constraints.map((c) => ({
              id: c.id,
              ownerId: c.ownerId,
              kind: c.kind,
              required: c.required,
            }))
          : constraints.filter((c) => c.ownerId === session.participantId);
      return json({ constraints: visible });
    }

    const readinessMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/readiness$/);
    if (request.method === "POST" && readinessMatch) {
      if (!session || session.role !== "host" || session.eventId !== readinessMatch[1]) {
        return genericUnauthorized();
      }
      const body = (await request.json().catch(() => null)) as {
        venues?: VenueRecord[];
      } | null;
      const constraints = await repo.listConstraints(session.eventId);
      const venues = Array.isArray(body?.venues) ? body!.venues! : [];
      const feasibility = assessSlateReadiness({ venues, constraints });
      return json(feasibility);
    }

    const rankMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/rank$/);
    if (request.method === "POST" && rankMatch) {
      if (!session || session.role !== "host" || session.eventId !== rankMatch[1]) {
        return genericUnauthorized();
      }
      const body = (await request.json().catch(() => null)) as {
        runId?: string;
        candidateEntityIds?: string[];
        familiarVenueIds?: string[];
        suitabilityByVenueId?: Record<string, number>;
      } | null;
      const candidates = Array.isArray(body?.candidateEntityIds)
        ? body!.candidateEntityIds!.filter((id) => EntityIdSchema.safeParse(id).success).slice(0, 30)
        : [];
      if (candidates.length < 1) {
        return json(
          {
            code: "invalid",
            message: "candidateEntityIds required (UUID place ids, ≤30)",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }

      const constraints = await repo.listConstraints(session.eventId);
      const vetoedVenueIds = constraints
        .filter((c) => c.kind === "veto")
        .map((c) => c.value.venueId);

      const prefs = await repo.listPreferences(session.eventId);
      const consents = await repo.listConsents(session.eventId);
      const participants = await repo.listParticipants(session.eventId);
      const skip = new Set(consents.filter((c) => c.skip_profiling).map((c) => c.participant_id));
      const members = prefs.map((p) => {
        let seeds: import("@common-ground/contracts").ConfirmedSeed[] = [];
        try {
          seeds = JSON.parse(p.seeds_json);
        } catch {
          seeds = [];
        }
        return {
          participantId: p.participant_id,
          seeds,
          skipProfiling: skip.has(p.participant_id),
        };
      });

      const familiarVenueIds = Array.isArray(body?.familiarVenueIds)
        ? body!.familiarVenueIds!.filter((id) => EntityIdSchema.safeParse(id).success)
        : [];

      const ranked = await rankProfiledMembersOnSlate({
        db: env.DB,
        client: qlooClient(env),
        runId: body?.runId || crypto.randomUUID(),
        members,
        candidateEntityIds: candidates,
        totalMemberCount: participants.length,
        suitabilityByVenueId: body?.suitabilityByVenueId,
        familiarVenueIds,
        vetoedVenueIds,
      });

      // Host response is public summary only — never private rank rows.
      return json({
        ...toPublicRankDto(ranked),
        status: ranked.status,
        dataMode: ranked.dataMode,
        qlooCallsUsed: ranked.qlooCallsUsed,
      });
    }

    // IDOR probe surface: never return cross-member preference by guessed id.
    const otherPrefs = url.pathname.match(
      /^\/api\/events\/([^/]+)\/participants\/([^/]+)\/preferences$/,
    );
    if (request.method === "GET" && otherPrefs) {
      if (!session || session.eventId !== otherPrefs[1]) return genericUnauthorized();
      if (session.participantId !== otherPrefs[2] && session.role !== "host") {
        return genericUnauthorized();
      }
      if (session.participantId !== otherPrefs[2]) return genericUnauthorized();
      const row = await repo.getPreferenceScoped(session.eventId, session.participantId);
      return json({
        seeds: row ? JSON.parse(row.seeds_json) : [],
        consentTaste: row ? !!row.consent_taste : false,
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json(
        { code: "not_found", message: "Unknown API route", retryable: false, requestId: crypto.randomUUID() },
        404,
      );
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return new Response(landingHtml(revision(env)), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};

function landingHtml(rev: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Common Ground</title>
  <style>
    :root { color-scheme: light; --ink:#14181C; --paper:#E8ECF0; --copper:#B85C38; }
    body { margin:0; font-family: Georgia, serif; background:linear-gradient(165deg,#E8ECF0,#C5D0DB); color:var(--ink); min-height:100vh; }
    main { max-width:40rem; margin:0 auto; padding:18vh 1.5rem; }
    h1 { font-size:clamp(2.75rem,8vw,4.5rem); letter-spacing:-0.03em; margin:0 0 0.5rem; }
    a { display:inline-block; background:var(--copper); color:#fff; text-decoration:none; padding:0.85rem 1.25rem; }
    .meta { margin-top:2rem; font-family:system-ui,sans-serif; font-size:0.8rem; }
  </style>
</head>
<body>
  <main>
    <p class="meta">FREE-TIER WORKER</p>
    <h1>Common Ground</h1>
    <p>Agree on where the group goes — without another endless thread.</p>
    <a href="/api/health">Check health</a>
    <p class="meta">revision ${rev} · approval is not a reservation · capability sharing is a known limit</p>
  </main>
</body>
</html>`;
}
