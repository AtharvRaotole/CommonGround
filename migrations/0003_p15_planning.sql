-- P15–P19 — runs, revisions, vetoes, acceptances, approvals, feedback
PRAGMA foreign_keys = ON;

CREATE TABLE runs (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN (
    'queued', 'discovering', 'checking', 'ranking', 'explaining',
    'complete', 'needs_input', 'failed', 'cancelled'
  )),
  mode TEXT NOT NULL CHECK (mode IN ('guided', 'agent')),
  event_version INTEGER NOT NULL,
  policy_version TEXT NOT NULL,
  stage TEXT NOT NULL,
  deadline_at TEXT NOT NULL,
  qloo_calls_used INTEGER NOT NULL DEFAULT 0,
  external_calls_pending INTEGER NOT NULL DEFAULT 0,
  cancelled_at TEXT,
  last_safe_json TEXT,
  trace_json TEXT NOT NULL DEFAULT '[]',
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (event_id, idempotency_key)
);
CREATE INDEX idx_runs_event ON runs(event_id);
CREATE INDEX idx_runs_state ON runs(state);

CREATE TABLE revisions (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
  event_version INTEGER NOT NULL,
  venue_ids_json TEXT NOT NULL,
  evidence_ids_json TEXT NOT NULL DEFAULT '[]',
  unknown_fact_ids_json TEXT NOT NULL DEFAULT '[]',
  alternatives_json TEXT NOT NULL DEFAULT '[]',
  explanations_json TEXT NOT NULL DEFAULT '[]',
  taste_mode TEXT NOT NULL CHECK (taste_mode IN ('full', 'mixed')),
  profiled_member_count INTEGER NOT NULL,
  total_member_count INTEGER NOT NULL,
  readiness TEXT NOT NULL CHECK (readiness IN (
    'ready_for_host_review', 'needs_confirmation', 'infeasible'
  )),
  data_mode TEXT NOT NULL CHECK (data_mode IN ('live', 'synthetic')),
  parent_revision_id TEXT,
  diff_json TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_revisions_event ON revisions(event_id);

CREATE TABLE vetoes (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  owner_participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,
  reason_category TEXT NOT NULL CHECK (reason_category IN (
    'access', 'budget', 'vibe', 'location', 'dietary', 'other'
  )),
  withdrawn_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (event_id, owner_participant_id, venue_id)
);
CREATE INDEX idx_vetoes_event ON vetoes(event_id);

CREATE TABLE acceptances (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  revision_id TEXT NOT NULL REFERENCES revisions(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (event_id, participant_id, revision_id)
);
CREATE INDEX idx_acceptances_event ON acceptances(event_id);
CREATE INDEX idx_acceptances_revision ON acceptances(revision_id);

CREATE TABLE approvals (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  revision_id TEXT NOT NULL REFERENCES revisions(id) ON DELETE CASCADE,
  host_participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  export_ready INTEGER NOT NULL DEFAULT 0,
  approved_at TEXT NOT NULL,
  invalidated_at TEXT,
  UNIQUE (event_id, revision_id)
);
CREATE INDEX idx_approvals_event ON approvals(event_id);

CREATE TABLE feedback (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  attended TEXT CHECK (attended IN ('yes', 'no', 'skipped') OR attended IS NULL),
  actual_fit TEXT CHECK (actual_fit IN ('good', 'ok', 'poor') OR actual_fit IS NULL),
  planning_experience TEXT CHECK (
    planning_experience IN ('smooth', 'ok', 'frustrating') OR planning_experience IS NULL
  ),
  host_active_minutes INTEGER,
  support_minutes INTEGER,
  venue_changed INTEGER,
  created_at TEXT NOT NULL,
  UNIQUE (event_id, participant_id)
);
CREATE INDEX idx_feedback_event ON feedback(event_id);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT,
  kind TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_event ON audit_events(event_id);

ALTER TABLE events ADD COLUMN parent_event_id TEXT REFERENCES events(id);
ALTER TABLE events ADD COLUMN outing_at TEXT;
ALTER TABLE events ADD COLUMN expires_at TEXT;
