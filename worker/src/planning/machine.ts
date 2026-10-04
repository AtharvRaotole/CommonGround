import {
  PLANNING_POLICY_VERSION,
  RUN_DEADLINE_MS,
  RUN_MAX_EXTERNAL_PER_STEP,
  RUN_MAX_ACTIVE_PROVIDER_CALLS,
  REVISION_TTL_MS,
  type RunState,
} from "@common-ground/contracts";
import type { D1Like } from "../db/repository";
import { randomId } from "../auth/capabilities";
import { reserveRunQlooCall } from "./budget";
import { discoverBoundedCandidates } from "./discover";
import { assessSlateReadiness } from "./constraints";
import { rankProfiledMembersOnSlate } from "./score";
import { buildTemplateExplanations, mergeModelExplanation } from "./explanations";
import {
  assertsNoForbiddenSideEffect,
  guidedToolChoice,
  parseToolChoice,
  type ToolTraceEntry,
} from "./tools";
import type { QlooClient } from "../providers/qloo";
import type { OpenAIClient } from "../providers/openai";
import type { VenueRecord } from "../venues/facts";
import type { Constraint } from "@common-ground/contracts";
import type { ConfirmedSeed } from "@common-ground/contracts";

export type RunRow = {
  id: string;
  event_id: string;
  idempotency_key: string;
  state: RunState;
  mode: "guided" | "agent";
  event_version: number;
  policy_version: string;
  stage: string;
  deadline_at: string;
  qloo_calls_used: number;
  external_calls_pending: number;
  cancelled_at: string | null;
  last_safe_json: string | null;
  trace_json: string;
  error_code: string | null;
  created_at: string;
  updated_at: string;
};

export type MachineMember = {
  participantId: string;
  seeds: ConfirmedSeed[];
  skipProfiling: boolean;
};

export type MachineDeps = {
  db: D1Like;
  qloo: QlooClient;
  openai: OpenAIClient;
  now?: () => number;
};

function nowIso(now: number): string {
  return new Date(now).toISOString();
}

async function getRun(db: D1Like, runId: string): Promise<RunRow | null> {
  return db
    .prepare(
      `SELECT id, event_id, idempotency_key, state, mode, event_version, policy_version,
              stage, deadline_at, qloo_calls_used, external_calls_pending, cancelled_at,
              last_safe_json, trace_json, error_code, created_at, updated_at
       FROM runs WHERE id = ?`,
    )
    .bind(runId)
    .first<RunRow>();
}

async function saveRun(
  db: D1Like,
  run: RunRow,
  patch: Partial<RunRow>,
): Promise<RunRow> {
  const next = { ...run, ...patch, updated_at: nowIso(Date.now()) };
  await db
    .prepare(
      `UPDATE runs SET state = ?, mode = ?, stage = ?, qloo_calls_used = ?,
       external_calls_pending = ?, cancelled_at = ?, last_safe_json = ?,
       trace_json = ?, error_code = ?, updated_at = ?
       WHERE id = ? AND event_id = ?`,
    )
    .bind(
      next.state,
      next.mode,
      next.stage,
      next.qloo_calls_used,
      next.external_calls_pending,
      next.cancelled_at,
      next.last_safe_json,
      next.trace_json,
      next.error_code,
      next.updated_at,
      next.id,
      next.event_id,
    )
    .run();
  return next;
}

function appendTrace(run: RunRow, entry: ToolTraceEntry): string {
  let trace: ToolTraceEntry[] = [];
  try {
    trace = JSON.parse(run.trace_json) as ToolTraceEntry[];
  } catch {
    trace = [];
  }
  trace.push(entry);
  return JSON.stringify(trace).slice(0, 8000);
}

/**
 * Create or return existing run for (event, idempotencyKey). FLOW-03.
 */
export async function createOrGetRun(input: {
  deps: MachineDeps;
  eventId: string;
  eventVersion: number;
  idempotencyKey: string;
  preferAgent: boolean;
}): Promise<{ run: RunRow; created: boolean }> {
  const now = input.deps.now?.() ?? Date.now();
  const existing = await input.deps.db
    .prepare(
      `SELECT id, event_id, idempotency_key, state, mode, event_version, policy_version,
              stage, deadline_at, qloo_calls_used, external_calls_pending, cancelled_at,
              last_safe_json, trace_json, error_code, created_at, updated_at
       FROM runs WHERE event_id = ? AND idempotency_key = ?`,
    )
    .bind(input.eventId, input.idempotencyKey)
    .first<RunRow>();
  if (existing) return { run: existing, created: false };

  const agentOk = input.preferAgent && input.deps.openai.available;
  const run: RunRow = {
    id: randomId(),
    event_id: input.eventId,
    idempotency_key: input.idempotencyKey,
    state: "queued",
    mode: agentOk ? "agent" : "guided",
    event_version: input.eventVersion,
    policy_version: PLANNING_POLICY_VERSION,
    stage: "queued",
    deadline_at: nowIso(now + RUN_DEADLINE_MS),
    qloo_calls_used: 0,
    external_calls_pending: 0,
    cancelled_at: null,
    last_safe_json: null,
    trace_json: "[]",
    error_code: null,
    created_at: nowIso(now),
    updated_at: nowIso(now),
  };

  await input.deps.db
    .prepare(
      `INSERT INTO runs (
         id, event_id, idempotency_key, state, mode, event_version, policy_version,
         stage, deadline_at, qloo_calls_used, external_calls_pending, cancelled_at,
         last_safe_json, trace_json, error_code, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      run.id,
      run.event_id,
      run.idempotency_key,
      run.state,
      run.mode,
      run.event_version,
      run.policy_version,
      run.stage,
      run.deadline_at,
      run.qloo_calls_used,
      run.external_calls_pending,
      run.cancelled_at,
      run.last_safe_json,
      run.trace_json,
      run.error_code,
      run.created_at,
      run.updated_at,
    )
    .run();

  return { run, created: true };
}

export async function cancelRun(deps: MachineDeps, runId: string): Promise<RunRow | null> {
  const run = await getRun(deps.db, runId);
  if (!run) return null;
  if (run.state === "complete" || run.state === "cancelled") return run;
  const now = deps.now?.() ?? Date.now();
  return saveRun(deps.db, run, {
    state: "cancelled",
    stage: "cancelled",
    cancelled_at: nowIso(now),
    // FLOW-05: record possible in-flight cost
    external_calls_pending: run.external_calls_pending,
    error_code: "cancelled",
  });
}

export type StepContext = {
  members: MachineMember[];
  constraints: Constraint[];
  venues: VenueRecord[];
  catalogEntityIds: string[];
  candidateEntityIds?: string[];
  familiarVenueIds?: string[];
  totalMemberCount: number;
  currentEventVersion: number;
};

export type StepResult = {
  run: RunRow;
  revisionId?: string;
  progress: { stage: string; count: number; of: number };
};

const STAGE_ORDER = [
  "queued",
  "discovering",
  "checking",
  "ranking",
  "explaining",
  "complete",
] as const;

/**
 * Execute at most one stage / ≤2 external requests. Resume only if still current.
 */
export async function stepRun(input: {
  deps: MachineDeps;
  runId: string;
  ctx: StepContext;
}): Promise<StepResult> {
  const { deps, ctx } = input;
  let run = await getRun(deps.db, input.runId);
  if (!run) throw new Error("run_not_found");

  const now = deps.now?.() ?? Date.now();
  if (run.state === "cancelled") {
    return { run, progress: progressOf(run) };
  }
  if (Date.parse(run.deadline_at) < now) {
    run = await saveRun(deps.db, run, {
      state: "failed",
      stage: "failed",
      error_code: "deadline",
    });
    return { run, progress: progressOf(run) };
  }
  // FLOW-06: stale event version cannot continue
  if (ctx.currentEventVersion !== run.event_version) {
    run = await saveRun(deps.db, run, {
      state: "failed",
      stage: "failed",
      error_code: "stale_version",
    });
    return { run, progress: progressOf(run) };
  }
  if (run.state === "complete" || run.state === "failed" || run.state === "needs_input") {
    return { run, progress: progressOf(run) };
  }

  // Choose tool: agent mode requires a real validated model choice; else guided.
  let toolName = guidedToolChoice(run.state)?.name;
  let mode = run.mode;
  if (run.mode === "agent") {
    const choice = await deps.openai.chooseTool({
      state: run.state,
      untrustedContext: ctx.venues.map((v) => v.name).join("; "),
    });
    if (choice.status === "ok") {
      toolName = choice.call.name;
      run = await saveRun(deps.db, run, {
        trace_json: appendTrace(run, {
          name: choice.call.name,
          args: sanitizeArgs(choice.call.args),
          ok: true,
          note: "model_tool_choice",
          at: nowIso(now),
        }),
      });
    } else {
      // Fall back to guided — never fake an agent trace.
      mode = "guided";
      toolName = guidedToolChoice(run.state)?.name;
      run = await saveRun(deps.db, run, {
        mode: "guided",
        trace_json: appendTrace(run, {
          name: toolName ?? "request_missing_input",
          args: {},
          ok: true,
          note: "guided_fallback_model_unavailable",
          at: nowIso(now),
        }),
      });
    }
  } else {
    run = await saveRun(deps.db, run, {
      trace_json: appendTrace(run, {
        name: toolName ?? "request_missing_input",
        args: {},
        ok: true,
        note: "guided_planning",
        at: nowIso(now),
      }),
    });
  }

  if (!toolName) {
    run = await saveRun(deps.db, run, { state: "failed", stage: "failed", error_code: "no_tool" });
    return { run, progress: progressOf(run) };
  }

  // Model/tool output cannot approve, send, book, or charge.
  try {
    assertsNoForbiddenSideEffect(toolName);
  } catch {
    run = await saveRun(deps.db, run, {
      state: "failed",
      stage: "failed",
      error_code: "forbidden_side_effect",
    });
    return { run, progress: progressOf(run) };
  }
  // Ensure chosen tool still permitted (defense if state drifted).
  const permitted = parseToolChoice({ name: toolName, args: {} }, run.state);
  if (!permitted.ok && run.state !== "queued") {
    // queued allows multiple; continue
  }

  let external = 0;
  const bumpExternal = () => {
    external += 1;
    if (external > RUN_MAX_EXTERNAL_PER_STEP) throw new Error("step_external_cap");
    if (run!.external_calls_pending + 1 > RUN_MAX_ACTIVE_PROVIDER_CALLS) {
      throw new Error("global_active_cap");
    }
  };

  let lastSafe: Record<string, unknown> = {};
  try {
    lastSafe = run.last_safe_json ? JSON.parse(run.last_safe_json) : {};
  } catch {
    lastSafe = {};
  }

  if (toolName === "request_missing_input") {
    run = await saveRun(deps.db, run, {
      state: "needs_input",
      stage: "needs_input",
      mode,
      last_safe_json: JSON.stringify({
        ...lastSafe,
        missing: ["profiled_members_or_candidates"],
      }),
    });
    return { run, progress: progressOf(run) };
  }

  if (toolName === "resolve_entities" || toolName === "discover_candidates") {
    run = await saveRun(deps.db, run, { state: "discovering", stage: "discovering", mode });
    const profiled = ctx.members.filter((m) => m.seeds.length && !m.skipProfiling);
    const preexisting = ctx.candidateEntityIds?.length
      ? ctx.candidateEntityIds
      : (lastSafe.candidateEntityIds as string[] | undefined);

    // Host-supplied slate: skip provider discovery (still advances stage).
    if (preexisting?.length) {
      run = await saveRun(deps.db, run, {
        state: "checking",
        stage: "checking",
        last_safe_json: JSON.stringify({
          ...lastSafe,
          candidateEntityIds: preexisting.slice(0, 30),
          dataMode: deps.qloo.hasLiveKey ? "live" : "synthetic",
        }),
      });
      return { run, progress: progressOf(run) };
    }

    if (!profiled.length) {
      run = await saveRun(deps.db, run, {
        state: "needs_input",
        stage: "needs_input",
        last_safe_json: JSON.stringify({ missing: ["seeds_or_candidates"] }),
      });
      return { run, progress: progressOf(run) };
    }

    bumpExternal();
    run = await saveRun(deps.db, run, {
      external_calls_pending: run.external_calls_pending + 1,
    });
    const discovered = await discoverBoundedCandidates({
      db: deps.db,
      client: deps.qloo,
      members: ctx.members,
      raw: {
        eventId: run.event_id,
        runId: run.id,
        profiledMemberIds: profiled.map((m) => m.participantId),
        catalogEntityIds: ctx.catalogEntityIds,
      },
    });
    const candidates = [
      ...discovered.candidateEntityIds,
      ...discovered.catalogFallbackIds,
    ].slice(0, 30);
    run = await saveRun(deps.db, run, {
      state: "checking",
      stage: "checking",
      qloo_calls_used: run.qloo_calls_used + (discovered.qlooCallsUsed || 0),
      external_calls_pending: Math.max(0, run.external_calls_pending - 1),
      last_safe_json: JSON.stringify({
        ...lastSafe,
        candidateEntityIds: candidates,
        dataMode: discovered.dataMode,
      }),
    });
    return { run, progress: progressOf(run) };
  }

  if (toolName === "check_constraints") {
    run = await saveRun(deps.db, run, { state: "checking", stage: "checking", mode });
    const candidateIds = (lastSafe.candidateEntityIds as string[] | undefined) ??
      ctx.candidateEntityIds ??
      [];
    const venues =
      ctx.venues.length > 0
        ? ctx.venues
        : candidateIds.map(
            (id): VenueRecord => ({
              id,
              name: id,
              neighborhood: null,
              borough: null,
              address: null,
              category: "restaurant",
              priceBand: null,
              officialUrl: null,
              qlooEntityId: id,
              qlooMappingStatus: "confirmed",
              facts: [],
            }),
          );
    const feasibility = assessSlateReadiness({ venues, constraints: ctx.constraints });
    if (feasibility.readiness === "infeasible" && !feasibility.eligibleVenueIds.length) {
      run = await saveRun(deps.db, run, {
        state: "needs_input",
        stage: "needs_input",
        last_safe_json: JSON.stringify({
          ...lastSafe,
          feasibility,
          missing: ["feasible_candidates"],
        }),
      });
      return { run, progress: progressOf(run) };
    }
    run = await saveRun(deps.db, run, {
      state: "ranking",
      stage: "ranking",
      last_safe_json: JSON.stringify({
        ...lastSafe,
        candidateEntityIds: feasibility.eligibleVenueIds.length
          ? feasibility.eligibleVenueIds
          : candidateIds,
        feasibility,
      }),
    });
    return { run, progress: progressOf(run) };
  }

  if (toolName === "rank_common_slate") {
    run = await saveRun(deps.db, run, { state: "ranking", stage: "ranking", mode });
    const candidateIds = (lastSafe.candidateEntityIds as string[] | undefined) ?? [];
    if (!candidateIds.length) {
      run = await saveRun(deps.db, run, {
        state: "needs_input",
        stage: "needs_input",
        last_safe_json: JSON.stringify({ ...lastSafe, missing: ["candidates"] }),
      });
      return { run, progress: progressOf(run) };
    }
    bumpExternal();
    // Reserve against run ceiling before provider work (retries count).
    const reserve = await reserveRunQlooCall({ db: deps.db, runId: run.id });
    if (!reserve.ok) {
      run = await saveRun(deps.db, run, {
        state: "failed",
        stage: "failed",
        error_code: "quota",
      });
      return { run, progress: progressOf(run) };
    }
    const vetoed = ctx.constraints.filter((c) => c.kind === "veto").map((c) => c.value.venueId);
    const ranked = await rankProfiledMembersOnSlate({
      db: deps.db,
      client: deps.qloo,
      runId: run.id,
      members: ctx.members,
      candidateEntityIds: candidateIds,
      totalMemberCount: ctx.totalMemberCount,
      familiarVenueIds: ctx.familiarVenueIds,
      vetoedVenueIds: vetoed,
    });
    run = await saveRun(deps.db, run, {
      state: "explaining",
      stage: "explaining",
      qloo_calls_used: run.qloo_calls_used + ranked.qlooCallsUsed,
      last_safe_json: JSON.stringify({
        ...lastSafe,
        ranked: {
          status: ranked.status,
          dataMode: ranked.dataMode,
          tasteMode: ranked.tasteMode,
          profiledMemberCount: ranked.profiledMemberCount,
          alternatives: ranked.alternatives,
          compromiseVenueIds: ranked.compromiseVenueIds,
          publicSummary: ranked.publicSummary,
        },
      }),
    });
    return { run, progress: progressOf(run) };
  }

  if (toolName === "propose_revision" || toolName === "prepare_handoff") {
    run = await saveRun(deps.db, run, { state: "explaining", stage: "explaining", mode });
    const ranked = lastSafe.ranked as
      | {
          alternatives: {
            venueId: string;
            role: "best_compromise" | "mean_rank_alternative" | "familiar_fallback";
            explanation: string;
            worstMemberRank: number;
            meanMemberRank: number;
          }[];
          tasteMode: "full" | "mixed";
          profiledMemberCount: number;
          dataMode: "live" | "synthetic";
          publicSummary: { readiness: string };
        }
      | undefined;
    if (!ranked?.alternatives?.length) {
      run = await saveRun(deps.db, run, {
        state: "needs_input",
        stage: "needs_input",
        last_safe_json: JSON.stringify({ ...lastSafe, missing: ["ranked_alternatives"] }),
      });
      return { run, progress: progressOf(run) };
    }

    const factsByVenueId: Record<string, Parameters<typeof buildTemplateExplanations>[0]["factsByVenueId"][string]> = {};
    const allowedEvidenceIds = new Set<string>();
    for (const v of ctx.venues) {
      factsByVenueId[v.id] = v.facts.map((f) => {
        allowedEvidenceIds.add(f.id);
        return {
          id: f.id,
          venueId: v.id,
          field: f.field,
          value: f.value,
          state: f.state,
          sourceUrl: f.sourceUrl,
        };
      });
      // Also key by qloo entity id when present.
      if (v.qlooEntityId) factsByVenueId[v.qlooEntityId] = factsByVenueId[v.id]!;
    }

    let explanations = buildTemplateExplanations({
      alternatives: ranked.alternatives,
      factsByVenueId,
      allowedEvidenceIds,
      mixedTaste: ranked.tasteMode === "mixed",
      profiledCount: ranked.profiledMemberCount,
      totalCount: ctx.totalMemberCount,
    });

    // Optional OpenAI language — never invents IDs (LLM-01/03/04).
    if (deps.openai.available && external < RUN_MAX_EXTERNAL_PER_STEP) {
      bumpExternal();
      const polished = [];
      for (const tmpl of explanations) {
        const model = await deps.openai.polishExplanation({
          template: tmpl,
          allowedVenueIds: ranked.alternatives.map((a) => a.venueId),
          allowedEvidenceIds: [...allowedEvidenceIds],
        });
        if (model.status === "ok") {
          polished.push(
            mergeModelExplanation({
              template: tmpl,
              model: model.explanation,
              allowedVenueIds: new Set(ranked.alternatives.map((a) => a.venueId)),
              allowedEvidenceIds,
            }),
          );
        } else {
          polished.push(tmpl);
        }
      }
      explanations = polished;
    }

    const venueIds = ranked.alternatives.map((a) => a.venueId);
    const unknownFactIds = ctx.venues
      .filter((v) => venueIds.includes(v.id) || venueIds.includes(v.qlooEntityId ?? ""))
      .flatMap((v) => v.facts.filter((f) => f.state === "unknown" || f.state === "expired").map((f) => f.id));

    const revisionId = randomId();
    const expiresAt = nowIso(now + REVISION_TTL_MS);
    const readiness =
      ranked.publicSummary?.readiness === "ready_for_host_review"
        ? "ready_for_host_review"
        : unknownFactIds.length
          ? "needs_confirmation"
          : "ready_for_host_review";

    await deps.db
      .prepare(
        `INSERT INTO revisions (
           id, event_id, run_id, event_version, venue_ids_json, evidence_ids_json,
           unknown_fact_ids_json, alternatives_json, explanations_json, taste_mode,
           profiled_member_count, total_member_count, readiness, data_mode,
           parent_revision_id, diff_json, expires_at, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        revisionId,
        run.event_id,
        run.id,
        run.event_version,
        JSON.stringify(venueIds),
        JSON.stringify([...allowedEvidenceIds]),
        JSON.stringify(unknownFactIds),
        JSON.stringify(ranked.alternatives),
        JSON.stringify(explanations),
        ranked.tasteMode,
        ranked.profiledMemberCount,
        ctx.totalMemberCount,
        readiness,
        ranked.dataMode,
        null,
        null,
        expiresAt,
        nowIso(now),
      )
      .run();

    await deps.db
      .prepare(`UPDATE events SET state = 'shortlisted', updated_at = ? WHERE id = ?`)
      .bind(nowIso(now), run.event_id)
      .run();

    run = await saveRun(deps.db, run, {
      state: "complete",
      stage: "complete",
      mode,
      last_safe_json: JSON.stringify({
        ...lastSafe,
        revisionId,
        explanations,
        venueIds,
      }),
    });
    return { run, revisionId, progress: progressOf(run) };
  }

  run = await saveRun(deps.db, run, {
    state: "failed",
    stage: "failed",
    error_code: "unhandled_tool",
  });
  return { run, progress: progressOf(run) };
}

function progressOf(run: RunRow): { stage: string; count: number; of: number } {
  const idx = STAGE_ORDER.indexOf(run.stage as (typeof STAGE_ORDER)[number]);
  return {
    stage: run.stage,
    count: idx < 0 ? 0 : idx + 1,
    of: STAGE_ORDER.length,
  };
}

function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === "string") out[k] = v.slice(0, 80);
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (Array.isArray(v)) out[k] = v.slice(0, 8).map(String);
  }
  return out;
}

export { getRun };
