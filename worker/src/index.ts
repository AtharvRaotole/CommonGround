import {
  AcceptanceRequestSchema,
  ApproveRequestSchema,
  CONSENT_TASTE_VERSION,
  ConstraintSchema,
  CreateRunRequestSchema,
  EntityIdSchema,
  EntitySearchRequestSchema,
  EntitySearchResponseSchema,
  FeedbackRequestSchema,
  PreferencesPutSchema,
  HealthResponseSchema,
  VetoRequestSchema,
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
import {
  REQUEST_CAPS,
  clientIpKey,
  contentLengthOf,
  reserveRequest,
} from "./auth/ratelimit";
import { Repository, type D1Like } from "./db/repository";
import { remainingLookups, reserveLookup } from "./planning/budget";
import { recordTelemetry } from "./telemetry/events";
import {
  assertModelCannotWaive,
  assessSlateReadiness,
} from "./planning/constraints";
import { discoverBoundedCandidates } from "./planning/discover";
import { cancelRun, createOrGetRun, getRun, stepRun } from "./planning/machine";
import { toPublicRankDto } from "./planning/rank";
import { rankProfiledMembersOnSlate } from "./planning/score";
import { assessDstLocalTime, buildIcs } from "./export/ics";
import { OpenAIClient } from "./providers/openai";
import { QlooClient } from "./providers/qloo";
import { deleteOwnMemberInputs } from "./privacy/delete";
import type { VenueRecord } from "./venues/facts";

export interface Env {
  ENVIRONMENT?: string;
  GIT_SHA?: string;
  ALLOWED_ORIGINS?: string;
  QLOO_API_KEY?: string;
  QLOO_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
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
      "x-content-type-options": "nosniff",
      "permissions-policy": "geolocation=(), microphone=(), camera=()",
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

function openaiClient(env: Env): OpenAIClient {
  return new OpenAIClient({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  });
}

async function loadMachineContext(repo: Repository, eventId: string) {
  const event = await repo.getEvent(eventId);
  if (!event) return null;
  const prefs = await repo.listPreferences(eventId);
  const consents = await repo.listConsents(eventId);
  const participants = await repo.listParticipants(eventId);
  const constraints = await repo.listConstraints(eventId);
  const catalogEntityIds = await repo.listConfirmedCatalogEntityIds();
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
  return {
    event,
    members,
    constraints,
    participants,
    catalogEntityIds,
  };
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

    // Peek session early for rate meters (mutating API only).
    const earlySession = url.pathname.startsWith("/api/")
      ? await repo.sessionFromToken(parseCookies(request.headers.get("cookie"))[SESSION_COOKIE])
      : null;

    if (
      url.pathname.startsWith("/api/") &&
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      url.pathname !== "/api/health"
    ) {
      const meter = await reserveRequest({
        db: env.DB,
        sessionId: earlySession?.sessionId,
        ipKey: clientIpKey(request),
        contentLength: contentLengthOf(request),
      });
      if (!meter.ok) {
        await recordTelemetry({
          db: env.DB,
          eventId: earlySession?.eventId,
          kind: "quota_exhausted",
          detail: { code: meter.which, dataMode: env.QLOO_API_KEY ? "live" : "synthetic" },
        });
        const status = meter.which === "body" ? 413 : 429;
        return json(
          {
            code: meter.which === "body" ? "payload_too_large" : "rate_limited",
            message:
              meter.which === "body"
                ? `Request body exceeds ${REQUEST_CAPS.maxBodyBytes} bytes`
                : "Request budget exhausted for this demo window",
            retryable: meter.which !== "body",
            requestId: crypto.randomUUID(),
          },
          status,
        );
      }
    }

    if (request.method === "POST" && url.pathname === "/api/events") {
      const body = (await request.json().catch(() => null)) as {
        title?: string;
        groupSize?: number;
        area?: string;
        timezone?: string;
        startsAtLocal?: string;
      } | null;
      const title = body?.title?.trim();
      const groupSize = Number(body?.groupSize);
      if (!title || !Number.isFinite(groupSize) || groupSize < 4 || groupSize > 8) {
        return json(
          { code: "invalid", message: "title and groupSize 4–8 required", retryable: false, requestId: crypto.randomUUID() },
          422,
        );
      }
      const startsAtLocal = body?.startsAtLocal?.trim();
      if (startsAtLocal && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAtLocal)) {
        return json(
          {
            code: "invalid",
            message: "startsAtLocal must be YYYY-MM-DDTHH:mm",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }
      const created = await repo.createEvent({
        title,
        groupSize,
        area: body?.area,
        timezone: body?.timezone,
        startsAtLocal: startsAtLocal || undefined,
      });
      await recordTelemetry({
        db: env.DB,
        eventId: created.eventId,
        kind: "event_started",
        detail: { dataMode: env.QLOO_API_KEY ? "live" : "synthetic" },
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

    const session =
      earlySession ??
      (await repo.sessionFromToken(
        parseCookies(request.headers.get("cookie"))[SESSION_COOKIE],
      ));

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
      await recordTelemetry({
        db: env.DB,
        eventId: session.eventId,
        kind: "intake_dropout",
        detail: { dataMode: env.QLOO_API_KEY ? "live" : "synthetic" },
      });
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

    const runsMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/runs$/);
    if (request.method === "POST" && runsMatch) {
      if (!session || session.role !== "host" || session.eventId !== runsMatch[1]) {
        return genericUnauthorized();
      }
      const body = await request.json().catch(() => null);
      const parsed = CreateRunRequestSchema.safeParse(body);
      if (!parsed.success) {
        return json(
          {
            code: "invalid",
            message: "idempotencyKey required (8–128 chars)",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }
      const event = await repo.getEvent(session.eventId);
      if (!event) return genericUnauthorized();
      const { run, created } = await createOrGetRun({
        deps: { db: env.DB, qloo: qlooClient(env), openai: openaiClient(env) },
        eventId: session.eventId,
        eventVersion: event.version,
        idempotencyKey: parsed.data.idempotencyKey,
        preferAgent: !!env.OPENAI_API_KEY,
      });
      // Stash candidates on first create. Prefer client slate; else confirmed catalog for live demos.
      if (created) {
        const catalogIds = await repo.listConfirmedCatalogEntityIds();
        const candidateEntityIds =
          parsed.data.candidateEntityIds?.length
            ? parsed.data.candidateEntityIds
            : catalogIds.slice(0, 30);
        if (candidateEntityIds.length || parsed.data.familiarVenueIds?.length) {
          await env.DB.prepare(
            `UPDATE runs SET last_safe_json = ? WHERE id = ? AND event_id = ?`,
          )
            .bind(
              JSON.stringify({
                candidateEntityIds,
                familiarVenueIds: parsed.data.familiarVenueIds ?? [],
              }),
              run.id,
              run.event_id,
            )
            .run();
        }
      }
      if (created) {
        await recordTelemetry({
          db: env.DB,
          eventId: session.eventId,
          kind: "run_started",
          detail: {
            dataMode: env.QLOO_API_KEY ? "live" : "synthetic",
            stage: run.stage,
          },
        });
      }
      return json(
        {
          runId: run.id,
          state: run.state,
          mode: run.mode,
          stage: run.stage,
          deadlineAt: run.deadline_at,
          created,
        },
        created ? 202 : 200,
      );
    }

    const runGetMatch = url.pathname.match(/^\/api\/runs\/([^/]+)$/);
    if (request.method === "GET" && runGetMatch) {
      if (!session) return genericUnauthorized();
      const run = await getRun(env.DB, runGetMatch[1]);
      if (!run || run.event_id !== session.eventId) return genericUnauthorized();
      let lastSafe: Record<string, unknown> = {};
      try {
        lastSafe = run.last_safe_json ? JSON.parse(run.last_safe_json) : {};
      } catch {
        lastSafe = {};
      }
      return json({
        runId: run.id,
        state: run.state,
        mode: run.mode,
        stage: run.stage,
        deadlineAt: run.deadline_at,
        qlooCallsUsed: run.qloo_calls_used,
        errorCode: run.error_code,
        revisionId: typeof lastSafe.revisionId === "string" ? lastSafe.revisionId : null,
        // Redacted trace — tool names/notes only, no private reasoning.
        trace: (() => {
          try {
            return (JSON.parse(run.trace_json) as { name: string; note: string; at: string }[]).map(
              (t) => ({ name: t.name, note: t.note, at: t.at }),
            );
          } catch {
            return [];
          }
        })(),
      });
    }

    const runStepMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/step$/);
    if (request.method === "POST" && runStepMatch) {
      if (!session || session.role !== "host") return genericUnauthorized();
      const run = await getRun(env.DB, runStepMatch[1]);
      if (!run || run.event_id !== session.eventId) return genericUnauthorized();
      const ctxBundle = await loadMachineContext(repo, session.eventId);
      if (!ctxBundle) return genericUnauthorized();
      let lastSafe: Record<string, unknown> = {};
      try {
        lastSafe = run.last_safe_json ? JSON.parse(run.last_safe_json) : {};
      } catch {
        lastSafe = {};
      }
      const catalogVenues = await repo.listConfirmedVenues();
      const venues = catalogVenues.map((v) => ({
        id: v.qloo_entity_id,
        name: v.name,
        neighborhood: v.neighborhood,
        borough: v.borough,
        address: v.address,
        category: v.category,
        priceBand: v.price_band,
        officialUrl: v.official_url,
        qlooEntityId: v.qloo_entity_id,
        qlooMappingStatus: "confirmed" as const,
        facts: [],
      }));
      const result = await stepRun({
        deps: { db: env.DB, qloo: qlooClient(env), openai: openaiClient(env) },
        runId: run.id,
        ctx: {
          members: ctxBundle.members,
          constraints: ctxBundle.constraints,
          venues,
          catalogEntityIds: ctxBundle.catalogEntityIds,
          candidateEntityIds: (lastSafe.candidateEntityIds as string[] | undefined) ?? undefined,
          familiarVenueIds: (lastSafe.familiarVenueIds as string[] | undefined) ?? undefined,
          totalMemberCount: ctxBundle.participants.length,
          currentEventVersion: ctxBundle.event.version,
        },
      });
      return json({
        runId: result.run.id,
        state: result.run.state,
        mode: result.run.mode,
        stage: result.run.stage,
        progress: result.progress,
        revisionId: result.revisionId ?? null,
        errorCode: result.run.error_code,
      });
    }

    const runCancelMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/cancel$/);
    if (request.method === "POST" && runCancelMatch) {
      if (!session || session.role !== "host") return genericUnauthorized();
      const run = await getRun(env.DB, runCancelMatch[1]);
      if (!run || run.event_id !== session.eventId) return genericUnauthorized();
      const cancelled = await cancelRun(
        { db: env.DB, qloo: qlooClient(env), openai: openaiClient(env) },
        run.id,
      );
      return json({
        runId: cancelled?.id,
        state: cancelled?.state,
        externalCallsPending: cancelled?.external_calls_pending ?? 0,
      });
    }

    const revisionMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/revision$/);
    if (request.method === "GET" && revisionMatch) {
      if (!session || session.eventId !== revisionMatch[1]) return genericUnauthorized();
      const rev = await repo.latestRevision(session.eventId);
      if (!rev) {
        return json(
          { code: "not_found", message: "No revision yet", retryable: false, requestId: crypto.randomUUID() },
          404,
        );
      }
      const veto = await repo.vetoSummary(session.eventId);
      const alternatives = JSON.parse(rev.alternatives_json) as {
        venueId: string;
        role: string;
        explanation: string;
      }[];
      const explanations = JSON.parse(rev.explanations_json);
      const venueIds = JSON.parse(rev.venue_ids_json) as string[];
      const venueNames = await repo.listVenueNamesByEntityIds([
        ...venueIds,
        ...alternatives.map((a) => a.venueId),
      ]);
      // Host: aggregate only. Member: same public cards (private ranks never stored).
      return json({
        revisionId: rev.id,
        eventVersion: rev.event_version,
        dataMode: rev.data_mode,
        tasteMode: rev.taste_mode,
        profiledMemberCount: rev.profiled_member_count,
        totalMemberCount: rev.total_member_count,
        readiness: rev.readiness,
        venueIds,
        venueNames,
        unknownFactIds: JSON.parse(rev.unknown_fact_ids_json),
        alternatives,
        explanations,
        vetoSummary: veto,
        parentRevisionId: rev.parent_revision_id,
        diff: rev.diff_json ? JSON.parse(rev.diff_json) : null,
        expiresAt: rev.expires_at,
        notice:
          rev.data_mode === "synthetic"
            ? "Synthetic example — not a live recommendation"
            : "Live planning",
      });
    }

    const vetoMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/vetoes$/);
    if (request.method === "POST" && vetoMatch) {
      if (!session || session.eventId !== vetoMatch[1]) return genericUnauthorized();
      const body = await request.json().catch(() => null);
      const parsed = VetoRequestSchema.safeParse(body);
      if (!parsed.success) {
        return json(
          {
            code: "invalid",
            message: "venueId and reasonCategory required",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }
      const { version } = await repo.putVeto(
        session,
        parsed.data.venueId,
        parsed.data.reasonCategory,
      );
      const summary = await repo.vetoSummary(session.eventId);
      await recordTelemetry({
        db: env.DB,
        eventId: session.eventId,
        kind: "veto",
        detail: { count: summary.activeVetoCount, dataMode: env.QLOO_API_KEY ? "live" : "synthetic" },
      });
      return json({
        ok: true,
        version,
        // Generic group summary — never identity or reason (P17).
        groupSummary: `Removed one venue after a participant objection. ${summary.activeVetoCount} active objection(s).`,
        activeVetoCount: summary.activeVetoCount,
      });
    }

    const acceptMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/acceptances$/);
    if (request.method === "POST" && acceptMatch) {
      if (!session || session.eventId !== acceptMatch[1]) return genericUnauthorized();
      const body = await request.json().catch(() => null);
      const parsed = AcceptanceRequestSchema.safeParse(body);
      if (!parsed.success) {
        return json(
          {
            code: "invalid",
            message: "revisionId and venueId required",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }
      try {
        await repo.putAcceptance(session, parsed.data.revisionId, parsed.data.venueId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "invalid";
        return json(
          { code: "conflict", message: msg, retryable: false, requestId: crypto.randomUUID() },
          409,
        );
      }
      return json({ ok: true });
    }

    const approveMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/approve$/);
    if (request.method === "POST" && approveMatch) {
      if (!session || session.role !== "host" || session.eventId !== approveMatch[1]) {
        return genericUnauthorized();
      }
      const body = await request.json().catch(() => null);
      const parsed = ApproveRequestSchema.safeParse(body);
      if (!parsed.success) {
        return json(
          {
            code: "invalid",
            message: "revisionId and expectedVersion required",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }
      const result = await repo.approveRevision({
        session,
        revisionId: parsed.data.revisionId,
        expectedVersion: parsed.data.expectedVersion,
      });
      if (!result.ok) {
        const status = result.reason === "conflict" ? 409 : 422;
        return json(
          {
            code: result.reason,
            message:
              result.reason === "conflict"
                ? "Stale approval — event changed; re-review the current revision"
                : result.reason === "missing_acceptance"
                  ? "Every participant must accept the selected venue on this revision"
                  : "Plan not ready for approval",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          status,
        );
      }
      await recordTelemetry({
        db: env.DB,
        eventId: session.eventId,
        kind: "approval",
        detail: { dataMode: env.QLOO_API_KEY ? "live" : "synthetic" },
      });
      return json({
        ok: true,
        approvalId: result.approvalId,
        exportReady: result.exportReady,
        notice:
          "Approving confirms the group's plan inside Common Ground. It does not reserve a table, charge a card, or message the venue.",
      });
    }

    const exportMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/export$/);
    if (request.method === "GET" && exportMatch) {
      if (!session || session.role !== "host" || session.eventId !== exportMatch[1]) {
        return genericUnauthorized();
      }
      const format = url.searchParams.get("format") || "json";
      const tentative = url.searchParams.get("tentative") === "1";
      const approval = await repo.getActiveApproval(session.eventId);
      const rev = approval
        ? await repo.getRevision(session.eventId, approval.revision_id)
        : await repo.latestRevision(session.eventId);
      if (!rev) {
        return json(
          { code: "not_found", message: "Nothing to export", retryable: false, requestId: crypto.randomUUID() },
          404,
        );
      }
      if (!tentative && (!approval || !approval.export_ready)) {
        return json(
          {
            code: "not_ready",
            message: "Export ready requires host approval with all acceptances and no unknown required facts. Use tentative=1 for a planning brief.",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          409,
        );
      }
      const event = await repo.getEvent(session.eventId);
      const venueIds = JSON.parse(rev.venue_ids_json) as string[];
      const selected = venueIds[0] ?? "venue";
      const venueNames = await repo.listVenueNamesByEntityIds([selected]);
      const venueLabel = venueNames[selected] ?? selected;
      const timezone = event?.timezone?.trim() || "America/New_York";
      const localStart = event?.starts_at_local?.trim() || "2026-10-18T19:00";
      const dst = assessDstLocalTime(localStart, timezone);
      const summary = {
        revisionId: rev.id,
        title: event?.title ?? "Outing",
        venueId: selected,
        venueName: venueLabel,
        timezone,
        localStart,
        dataMode: rev.data_mode,
        reservationStatus: "unconfirmed" as const,
        exportKind: tentative || !approval?.export_ready ? ("tentative" as const) : ("ready" as const),
        banner:
          tentative || !approval?.export_ready
            ? "Tentative planning brief — not host-approved / not a reservation."
            : "Approved plan — reservation still unconfirmed. Host must book.",
        unknownFactIds: JSON.parse(rev.unknown_fact_ids_json),
      };
      if (format === "ics") {
        if (dst !== "ok") {
          return json(
            {
              code: "dst_choice_required",
              message: "Ambiguous or nonexistent daylight-saving time — choose an explicit local time.",
              retryable: false,
              requestId: crypto.randomUUID(),
              dstStatus: dst,
            },
            422,
          );
        }
        const ics = buildIcs({
          uid: `${rev.id}@common-ground`,
          summary: event?.title ?? "Common Ground outing",
          description: `${summary.banner}\nVenue: ${venueLabel}`,
          location: venueLabel,
          localStart,
          timezone,
          dstStatus: dst,
        });
        if (!ics.ok) {
          return json(
            { code: ics.reason, message: "Calendar export blocked", retryable: false, requestId: crypto.randomUUID() },
            422,
          );
        }
        return new Response(ics.ics, {
          status: 200,
          headers: {
            "content-type": "text/calendar; charset=utf-8",
            "content-disposition": 'attachment; filename="common-ground.ics"',
            "cache-control": "no-store",
          },
        });
      }
      return json(summary);
    }

    const feedbackMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/feedback$/);
    if (request.method === "POST" && feedbackMatch) {
      if (!session || session.eventId !== feedbackMatch[1]) return genericUnauthorized();
      const body = await request.json().catch(() => null);
      const parsed = FeedbackRequestSchema.safeParse(body);
      if (!parsed.success) {
        return json(
          {
            code: "invalid",
            message: "feedback fields optional but must match schema when present",
            retryable: false,
            requestId: crypto.randomUUID(),
          },
          422,
        );
      }
      await repo.putFeedback(session, parsed.data);
      return json({ ok: true });
    }

    const repeatMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/repeat$/);
    if (request.method === "POST" && repeatMatch) {
      if (!session || session.role !== "host" || session.eventId !== repeatMatch[1]) {
        return genericUnauthorized();
      }
      const dup = await repo.duplicateEventSettings(session);
      return json(
        {
          eventId: dup.eventId,
          hostClaimSecret: dup.hostClaimSecret,
          hostRecoverySecret: dup.hostRecoverySecret,
          notice:
            "Settings copied. Private taste seeds were not copied — members consent again for the new outing.",
        },
        201,
      );
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
