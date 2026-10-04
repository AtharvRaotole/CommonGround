import type { D1Like } from "../db/repository";
import { randomId } from "../auth/capabilities";

/** Allowed telemetry kinds — never store seeds, veto reasons, or keys. */
export const TELEMETRY_KINDS = [
  "event_started",
  "intake_completed",
  "intake_dropout",
  "run_started",
  "run_completed",
  "run_failed",
  "replan",
  "veto",
  "approval",
  "export",
  "feedback",
  "return_repeat",
  "quota_exhausted",
  "provider_fault",
] as const;

export type TelemetryKind = (typeof TELEMETRY_KINDS)[number];

export type TelemetryDetail = {
  dataMode?: "live" | "synthetic";
  stage?: string;
  code?: string;
  /** Counts only — never private matrices. */
  count?: number;
};

const FORBIDDEN_DETAIL_KEYS = /seed|affinity|rank|reason|secret|key|token|password|email|name/i;

/**
 * Persist a redacted product telemetry row.
 * Rejects detail keys that look like private fields.
 */
export async function recordTelemetry(input: {
  db: D1Like;
  eventId?: string | null;
  kind: TelemetryKind;
  detail?: TelemetryDetail;
}): Promise<void> {
  const detail = scrubDetail(input.detail ?? {});
  await input.db
    .prepare(
      `INSERT INTO audit_events (id, event_id, kind, detail_json, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      randomId(),
      input.eventId ?? null,
      input.kind,
      JSON.stringify(detail).slice(0, 1000),
      new Date().toISOString(),
    )
    .run();
}

export function scrubDetail(detail: Record<string, unknown>): TelemetryDetail {
  const out: TelemetryDetail = {};
  for (const [k, v] of Object.entries(detail)) {
    if (FORBIDDEN_DETAIL_KEYS.test(k)) continue;
    if (k === "dataMode" && (v === "live" || v === "synthetic")) out.dataMode = v;
    if (k === "stage" && typeof v === "string") out.stage = v.slice(0, 40);
    if (k === "code" && typeof v === "string") out.code = v.slice(0, 40);
    if (k === "count" && typeof v === "number" && Number.isFinite(v)) {
      out.count = Math.max(0, Math.floor(v));
    }
  }
  return out;
}

/** Data dictionary for P24 — keep in sync with TELEMETRY_KINDS. */
export const TELEMETRY_DICTIONARY: Record<TelemetryKind, string> = {
  event_started: "Host created an outing",
  intake_completed: "Member finished preferences or skip",
  intake_dropout: "Member deleted own inputs",
  run_started: "Planning run created",
  run_completed: "Planning run reached complete",
  run_failed: "Planning run failed or cancelled",
  replan: "Host initiated replan after change/veto",
  veto: "Participant veto recorded (count only)",
  approval: "Host approved a revision",
  export: "Host fetched export/ICS",
  feedback: "Feedback saved",
  return_repeat: "Host duplicated settings for a new outing",
  quota_exhausted: "Request or provider budget denied",
  provider_fault: "Upstream provider fault surfaced to user",
};
