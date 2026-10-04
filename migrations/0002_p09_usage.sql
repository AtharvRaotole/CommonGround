-- P09 — lookup budgets + consent records (Free D1 only)
PRAGMA foreign_keys = ON;

CREATE TABLE usage_daily (
  id TEXT PRIMARY KEY NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('member', 'event', 'global', 'run')),
  scope_id TEXT NOT NULL,
  day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('lookup', 'qloo_call')),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  UNIQUE (scope, scope_id, day, kind)
);
CREATE INDEX idx_usage_daily_lookup ON usage_daily(scope, scope_id, day, kind);

CREATE TABLE consents (
  participant_id TEXT PRIMARY KEY NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL,
  taste_opt_in INTEGER NOT NULL DEFAULT 0,
  skip_profiling INTEGER NOT NULL DEFAULT 0,
  accepted_at TEXT NOT NULL
);
CREATE INDEX idx_consents_event ON consents(event_id);

-- Invalidation flag for derived planning results (P10 delete / preference edits).
ALTER TABLE events ADD COLUMN results_invalid_at TEXT;
