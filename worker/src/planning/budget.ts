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
  if (by < 0) {
    // Refund path — never INSERT a negative row; clamp at zero.
    await db
      .prepare(
        `UPDATE usage_daily SET count = MAX(0, count + ?)
         WHERE scope = ? AND scope_id = ? AND day = ? AND kind = ?`,
      )
      .bind(by, scope, scopeId, day, kind)
      .run();
    return getCount(db, scope, scopeId, day, kind);
  }
  // Upsert so concurrent first-writers do not trip the UNIQUE constraint (FLOW-04).
  await db
    .prepare(
      `INSERT INTO usage_daily (id, scope, scope_id, day, kind, count)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(scope, scope_id, day, kind) DO UPDATE SET
         count = count + excluded.count`,
    )
    .bind(randomId(), scope, scopeId, day, kind, by)
    .run();
  return getCount(db, scope, scopeId, day, kind);
}

/**
 * Atomically reserve one lookup against member/event/global daily caps.
 * Charged before the provider call; retries must call again.
 * Concurrent writers upsert then refund on overshoot (FLOW-04).
 */
export async function reserveLookup(input: {
  db: D1Like;
  memberId: string;
  eventId: string;
}): Promise<ReserveResult> {
  const day = utcDay();
  const memberNext = await increment(input.db, "member", input.memberId, day, "lookup", 1);
  if (memberNext > LOOKUP_CAPS.perMemberDay) {
    await increment(input.db, "member", input.memberId, day, "lookup", -1);
    return { ok: false, reason: "quota", which: "member" };
  }
  const eventNext = await increment(input.db, "event", input.eventId, day, "lookup", 1);
  if (eventNext > LOOKUP_CAPS.perEventDay) {
    await increment(input.db, "member", input.memberId, day, "lookup", -1);
    await increment(input.db, "event", input.eventId, day, "lookup", -1);
    return { ok: false, reason: "quota", which: "event" };
  }
  const globalNext = await increment(input.db, "global", "app", day, "lookup", 1);
  if (globalNext > LOOKUP_CAPS.globalDay) {
    await increment(input.db, "member", input.memberId, day, "lookup", -1);
    await increment(input.db, "event", input.eventId, day, "lookup", -1);
    await increment(input.db, "global", "app", day, "lookup", -1);
    return { ok: false, reason: "quota", which: "global" };
  }

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
