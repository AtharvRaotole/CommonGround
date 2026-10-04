-- P07 core schema — Common Ground
-- Forward-only. Rollback = restore snapshot / recreate disposable DB.

PRAGMA foreign_keys = ON;

CREATE TABLE events (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  group_size INTEGER NOT NULL CHECK (group_size BETWEEN 4 AND 8),
  starts_at_local TEXT,
  timezone TEXT,
  area TEXT,
  budget_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  state TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  host_recovery_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE participants (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  display_label TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('host', 'member')),
  created_at TEXT NOT NULL,
  UNIQUE (event_id, display_label)
);
CREATE INDEX idx_participants_event ON participants(event_id);

CREATE TABLE claims (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id TEXT REFERENCES participants(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('host', 'member')),
  secret_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_claims_event ON claims(event_id);
CREATE INDEX idx_claims_hash ON claims(secret_hash);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'member')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_event ON sessions(event_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);

CREATE TABLE preferences (
  participant_id TEXT PRIMARY KEY NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  seeds_json TEXT NOT NULL DEFAULT '[]',
  consent_taste INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_preferences_event ON preferences(event_id);

CREATE TABLE constraints (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  owner_participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1,
  value_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_constraints_event ON constraints(event_id);

CREATE TABLE venues (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  neighborhood TEXT,
  borough TEXT,
  address TEXT,
  category TEXT,
  price_band TEXT,
  official_url TEXT,
  qloo_entity_id TEXT,
  qloo_mapping_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (qloo_mapping_status IN ('unknown', 'confirmed', 'rejected')),
  created_at TEXT NOT NULL
);

CREATE TABLE venue_facts (
  id TEXT PRIMARY KEY NOT NULL,
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  value_json TEXT,
  state TEXT NOT NULL CHECK (state IN ('confirmed', 'unknown', 'conflicting', 'expired')),
  source_url TEXT,
  source_kind TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  expires_at TEXT,
  note TEXT,
  UNIQUE (venue_id, field)
);
CREATE INDEX idx_venue_facts_venue ON venue_facts(venue_id);
