import { AgentToolNameSchema, type AgentToolName } from "@common-ground/contracts";
import type { RunState } from "@common-ground/contracts";

/** Tools permitted from each durable stage. Policy — not model judgment. */
const TOOLS_BY_STATE: Record<RunState, readonly AgentToolName[]> = {
  queued: ["request_missing_input", "resolve_entities", "discover_candidates"],
  discovering: ["discover_candidates", "request_missing_input"],
  checking: ["check_constraints", "request_missing_input"],
  ranking: ["rank_common_slate", "request_missing_input"],
  explaining: ["propose_revision", "prepare_handoff"],
  complete: [],
  needs_input: ["request_missing_input"],
  failed: [],
  cancelled: [],
};

export type ToolCall = {
  name: AgentToolName;
  args: Record<string, unknown>;
};

export type ToolTraceEntry = {
  name: AgentToolName;
  args: Record<string, unknown>;
  ok: boolean;
  note: string;
  at: string;
};

export function allowedTools(state: RunState): readonly AgentToolName[] {
  return TOOLS_BY_STATE[state] ?? [];
}

export function parseToolChoice(
  raw: unknown,
  state: RunState,
): { ok: true; call: ToolCall } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "not_object" };
  const nameRaw = (raw as { name?: unknown }).name;
  const parsedName = AgentToolNameSchema.safeParse(nameRaw);
  if (!parsedName.success) return { ok: false, reason: "unknown_tool" };
  if (!allowedTools(state).includes(parsedName.data)) {
    return { ok: false, reason: "tool_not_permitted_in_state" };
  }
  const args = (raw as { args?: unknown }).args;
  if (args != null && (typeof args !== "object" || Array.isArray(args))) {
    return { ok: false, reason: "args_not_object" };
  }
  return { ok: true, call: { name: parsedName.data, args: (args as Record<string, unknown>) ?? {} } };
}

/**
 * Deterministic guided-planning chooser — never presented as an agent trace.
 * Picks the first pipeline tool for the current state.
 */
export function guidedToolChoice(state: RunState): ToolCall | null {
  const allowed = allowedTools(state);
  if (!allowed.length) return null;
  const preferred: AgentToolName[] = [
    "discover_candidates",
    "check_constraints",
    "rank_common_slate",
    "propose_revision",
    "prepare_handoff",
    "request_missing_input",
    "resolve_entities",
  ];
  for (const name of preferred) {
    if (allowed.includes(name)) return { name, args: {} };
  }
  return { name: allowed[0]!, args: {} };
}

/** Forbidden side-effects — model/tool output cannot trigger these. */
export const FORBIDDEN_SIDE_EFFECTS = [
  "approve",
  "send",
  "book",
  "charge",
  "invite_outbound",
  "waive_constraint",
] as const;

export function assertsNoForbiddenSideEffect(action: string): void {
  if ((FORBIDDEN_SIDE_EFFECTS as readonly string[]).includes(action)) {
    throw new Error(`forbidden_side_effect:${action}`);
  }
}
