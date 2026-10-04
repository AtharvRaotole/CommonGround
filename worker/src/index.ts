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
import { HealthResponseSchema } from "@common-ground/contracts";

export interface Env {
  ENVIRONMENT?: string;
  GIT_SHA?: string;
  ALLOWED_ORIGINS?: string;
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
          // Host recovery shown once — never embed in participant invite URLs.
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
      if (!secret) return json({ code: "invalid", message: "secret required", retryable: false, requestId: crypto.randomUUID() }, 422);
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

    const session = await repo.sessionFromToken(parseCookies(request.headers.get("cookie"))[SESSION_COOKIE]);

    const inviteMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/invites$/);
    if (request.method === "POST" && inviteMatch) {
      if (!session || session.role !== "host" || session.eventId !== inviteMatch[1]) {
        return genericUnauthorized();
      }
      const invite = await repo.createMemberInvite(session.eventId);
      return json({
        claimSecret: invite.claimSecret,
        // Fragment-style client usage recommended; server never puts host recovery here.
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
      return json(toEventDto({ event, viewer: session, preferences }));
    }

    const prefsMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/me\/preferences$/);
    if (request.method === "PUT" && prefsMatch) {
      if (!session || session.eventId !== prefsMatch[1]) return genericUnauthorized();
      const body = (await request.json().catch(() => null)) as {
        seeds?: unknown[];
        consentTaste?: boolean;
      } | null;
      const seeds = Array.isArray(body?.seeds) ? body!.seeds!.slice(0, 3) : [];
      await repo.putOwnPreferences(session, seeds, !!body?.consentTaste);
      return json({ ok: true });
    }

    // IDOR probe surface: never return cross-member preference by guessed id.
    const otherPrefs = url.pathname.match(/^\/api\/events\/([^/]+)\/participants\/([^/]+)\/preferences$/);
    if (request.method === "GET" && otherPrefs) {
      if (!session || session.eventId !== otherPrefs[1]) return genericUnauthorized();
      if (session.participantId !== otherPrefs[2] && session.role !== "host") {
        return genericUnauthorized();
      }
      // Hosts still must not read seeds — only the owner can.
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
