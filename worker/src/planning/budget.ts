import { LOOKUP_CAPS, QLOO_RUN_CALL_CEILING } from "@common-ground/contracts";
import type { D1Like } from "../db/repository";
import { randomId } from "../auth/capabilities";

export type BudgetKind = "lookup" | "qloo_call";
export type BudgetScope = "member" | "event" | "global" | "run";

export type ReserveResult =
  | {
      ok: true;
      memberRemaining: number;
      eventRemaining: number;
      globalRemaining: number;
    }
  | { ok: false; reason: "quota"; which: "member" | "event" | "global" | "run" };

function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

async function getCount(
  db: D1Like,
  scope: BudgetScope,
  scopeId: string,
  day: string,
  kind: BudgetKind,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT count FROM usage_daily
       WHERE scope = ? AND scope_id = ? AND day = ? AND kind = ?`,
    )
    .bind(scope, scopeId, day, kind)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

async function increment(
  db: D1Like,
  scope: BudgetScope,
  scopeId: string,
  day: string,
  kind: BudgetKind,
  by: number,
): Promise<number> {
  const current = await getCount(db, scope, scopeId, day, kind);
  const next = current + by;
  if (current === 0) {
    await db
      .prepare(
        `INSERT INTO usage_daily (id, scope, scope_id, day, kind, count)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(randomId(), scope, scopeId, day, kind, next)
      .run();
  } else {
    await db
      .prepare(
        `UPDATE usage_daily SET count = ?
         WHERE scope = ? AND scope_id = ? AND day = ? AND kind = ?`,
      )
      .bind(next, scope, scopeId, day, kind)
      .run();
  }
  return next;
}

/**
 * Atomically reserve one lookup against member/event/global daily caps.
 * Charged before the provider call; retries must call again.
 */
export async function reserveLookup(input: {
  db: D1Like;
  memberId: string;
  eventId: string;
}): Promise<ReserveResult> {
  const day = utcDay();
  const member = await getCount(input.db, "member", input.memberId, day, "lookup");
  if (member >= LOOKUP_CAPS.perMemberDay) {
    return { ok: false, reason: "quota", which: "member" };
  }
  const event = await getCount(input.db, "event", input.eventId, day, "lookup");
  if (event >= LOOKUP_CAPS.perEventDay) {
    return { ok: false, reason: "quota", which: "event" };
  }
  const global = await getCount(input.db, "global", "app", day, "lookup");
  if (global >= LOOKUP_CAPS.globalDay) {
    return { ok: false, reason: "quota", which: "global" };
  }

  const memberNext = await increment(input.db, "member", input.memberId, day, "lookup", 1);
  const eventNext = await increment(input.db, "event", input.eventId, day, "lookup", 1);
  const globalNext = await increment(input.db, "global", "app", day, "lookup", 1);

  return {
    ok: true,
    memberRemaining: Math.max(0, LOOKUP_CAPS.perMemberDay - memberNext),
    eventRemaining: Math.max(0, LOOKUP_CAPS.perEventDay - eventNext),
    globalRemaining: Math.max(0, LOOKUP_CAPS.globalDay - globalNext),
  };
}

/** Reserve one Qloo provider call against a run ceiling (incl. retries). */
export async function reserveRunQlooCall(input: {
  db: D1Like;
  runId: string;
}): Promise<ReserveResult> {
  const day = "run";
  const used = await getCount(input.db, "run", input.runId, day, "qloo_call");
  if (used >= QLOO_RUN_CALL_CEILING) {
    return { ok: false, reason: "quota", which: "run" };
  }
  const next = await increment(input.db, "run", input.runId, day, "qloo_call", 1);
  return {
    ok: true,
    memberRemaining: 0,
    eventRemaining: 0,
    globalRemaining: Math.max(0, QLOO_RUN_CALL_CEILING - next),
  };
}

export async function remainingLookups(input: {
  db: D1Like;
  memberId: string;
  eventId: string;
}): Promise<{ memberRemaining: number; eventRemaining: number }> {
  const day = utcDay();
  const member = await getCount(input.db, "member", input.memberId, day, "lookup");
  const event = await getCount(input.db, "event", input.eventId, day, "lookup");
  return {
    memberRemaining: Math.max(0, LOOKUP_CAPS.perMemberDay - member),
    eventRemaining: Math.max(0, LOOKUP_CAPS.perEventDay - event),
  };
}
