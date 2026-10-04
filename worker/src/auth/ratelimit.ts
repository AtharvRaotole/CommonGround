import type { D1Like } from "../db/repository";
import { randomId } from "./capabilities";

/** Public demo request caps — fail closed before provider work. */
export const REQUEST_CAPS = {
  perSessionDay: 120,
  perIpDay: 300,
  globalDay: 2_000,
  maxBodyBytes: 48_000,
} as const;

function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

async function getCount(
  db: D1Like,
  scope: "session" | "ip" | "global",
  scopeId: string,
  day: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT count FROM request_meters WHERE scope = ? AND scope_id = ? AND day = ?`,
    )
    .bind(scope, scopeId, day)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

async function bump(
  db: D1Like,
  scope: "session" | "ip" | "global",
  scopeId: string,
  day: string,
  by: number,
): Promise<number> {
  if (by < 0) {
    await db
      .prepare(
        `UPDATE request_meters SET count = MAX(0, count + ?)
         WHERE scope = ? AND scope_id = ? AND day = ?`,
      )
      .bind(by, scope, scopeId, day)
      .run();
    return getCount(db, scope, scopeId, day);
  }
  await db
    .prepare(
      `INSERT INTO request_meters (id, scope, scope_id, day, count)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(scope, scope_id, day) DO UPDATE SET count = count + excluded.count`,
    )
    .bind(randomId(), scope, scopeId, day, by)
    .run();
  return getCount(db, scope, scopeId, day);
}

export type RateLimitResult =
  | { ok: true; remaining: { session: number; ip: number; global: number } }
  | { ok: false; which: "session" | "ip" | "global" | "body" };

/**
 * Reserve one mutating API request against session/IP/global caps.
 * Must run before outbound provider calls.
 */
export async function reserveRequest(input: {
  db: D1Like;
  sessionId?: string | null;
  ipKey: string;
  contentLength: number | null;
}): Promise<RateLimitResult> {
  if (
    input.contentLength != null &&
    Number.isFinite(input.contentLength) &&
    input.contentLength > REQUEST_CAPS.maxBodyBytes
  ) {
    return { ok: false, which: "body" };
  }

  const day = utcDay();
  const sessionId = input.sessionId?.trim() || null;

  if (sessionId) {
    const sessionNext = await bump(input.db, "session", sessionId, day, 1);
    if (sessionNext > REQUEST_CAPS.perSessionDay) {
      await bump(input.db, "session", sessionId, day, -1);
      return { ok: false, which: "session" };
    }
  }

  const ipNext = await bump(input.db, "ip", input.ipKey.slice(0, 128), day, 1);
  if (ipNext > REQUEST_CAPS.perIpDay) {
    if (sessionId) await bump(input.db, "session", sessionId, day, -1);
    await bump(input.db, "ip", input.ipKey.slice(0, 128), day, -1);
    return { ok: false, which: "ip" };
  }

  const globalNext = await bump(input.db, "global", "app", day, 1);
  if (globalNext > REQUEST_CAPS.globalDay) {
    if (sessionId) await bump(input.db, "session", sessionId, day, -1);
    await bump(input.db, "ip", input.ipKey.slice(0, 128), day, -1);
    await bump(input.db, "global", "app", day, -1);
    return { ok: false, which: "global" };
  }

  return {
    ok: true,
    remaining: {
      session: sessionId
        ? Math.max(0, REQUEST_CAPS.perSessionDay - (await getCount(input.db, "session", sessionId, day)))
        : REQUEST_CAPS.perSessionDay,
      ip: Math.max(0, REQUEST_CAPS.perIpDay - ipNext),
      global: Math.max(0, REQUEST_CAPS.globalDay - globalNext),
    },
  };
}

export function clientIpKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function contentLengthOf(request: Request): number | null {
  const raw = request.headers.get("content-length");
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
