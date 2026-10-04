-- P21 — request meters for session/global rate limits (separate from provider budgets)
PRAGMA foreign_keys = ON;

CREATE TABLE request_meters (
  id TEXT PRIMARY KEY NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('session', 'ip', 'global')),
  scope_id TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  UNIQUE (scope, scope_id, day)
);
CREATE INDEX idx_request_meters ON request_meters(scope, scope_id, day);
