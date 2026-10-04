import {
  CLAIM_TTL_SEC,
  mintCapability,
  randomId,
  SESSION_TTL_SEC,
  sha256Hex,
} from "../auth/capabilities";
import type { Role, SessionContext } from "../auth/authorize";
import { CONSENT_TASTE_VERSION, type ConfirmedSeed } from "@common-ground/contracts";

export type D1Like = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      run(): Promise<{ meta?: { changes?: number } }>;
    };
  };
  batch(
    statements: {
      bind(...values: unknown[]): unknown;
    }[],
  ): Promise<unknown>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function plusSeconds(sec: number): string {
  return new Date(Date.now() + sec * 1000).toISOString();
}

export class Repository {
  constructor(private readonly db: D1Like) {}

  async createEvent(input: {
    title: string;
    groupSize: number;
    area?: string;
    timezone?: string;
  }): Promise<{
    eventId: string;
    hostParticipantId: string;
    hostRecoverySecret: string;
    hostClaimSecret: string;
  }> {
    const eventId = randomId();
    const hostParticipantId = randomId();
    const recovery = await mintCapability();
    const claim = await mintCapability();
    const ts = nowIso();

    await this.db
      .prepare(
        `INSERT INTO events (id, title, group_size, timezone, area, state, version, host_recovery_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'draft', 1, ?, ?, ?)`,
      )
      .bind(
        eventId,
        input.title,
        input.groupSize,
        input.timezone ?? null,
        input.area ?? null,
        recovery.hash,
        ts,
        ts,
      )
      .run();

    await this.db
      .prepare(
        `INSERT INTO participants (id, event_id, display_label, role, created_at)
         VALUES (?, ?, 'host', 'host', ?)`,
      )
      .bind(hostParticipantId, eventId, ts)
      .run();

    await this.db
      .prepare(
        `INSERT INTO claims (id, event_id, participant_id, role, secret_hash, expires_at, created_at)
         VALUES (?, ?, ?, 'host', ?, ?, ?)`,
      )
      .bind(randomId(), eventId, hostParticipantId, claim.hash, plusSeconds(CLAIM_TTL_SEC), ts)
      .run();

    return {
      eventId,
      hostParticipantId,
      hostRecoverySecret: recovery.secret,
      hostClaimSecret: claim.secret,
    };
  }

  async createMemberInvite(eventId: string): Promise<{ claimSecret: string; claimId: string }> {
    const claim = await mintCapability();
    const claimId = randomId();
    const ts = nowIso();
    await this.db
      .prepare(
        `INSERT INTO claims (id, event_id, participant_id, role, secret_hash, expires_at, created_at)
         VALUES (?, ?, NULL, 'member', ?, ?, ?)`,
      )
      .bind(claimId, eventId, claim.hash, plusSeconds(CLAIM_TTL_SEC), ts)
      .run();
    return { claimSecret: claim.secret, claimId };
  }

  async rotateInvite(claimId: string, eventId: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE claims SET revoked_at = ? WHERE id = ? AND event_id = ? AND consumed_at IS NULL`,
      )
      .bind(nowIso(), claimId, eventId)
      .run();
  }

  /**
   * Consume a one-time claim. Concurrent winners: only the first UPDATE that
   * sees consumed_at IS NULL succeeds (changes === 1).
   */
  async consumeClaim(secret: string): Promise<
    | { ok: true; sessionToken: string; session: SessionContext }
    | { ok: false; reason: "invalid" | "conflict" }
  > {
    const hash = await sha256Hex(secret);
    const claim = await this.db
      .prepare(
        `SELECT id, event_id, participant_id, role, expires_at, consumed_at, revoked_at
         FROM claims WHERE secret_hash = ?`,
      )
      .bind(hash)
      .first<{
        id: string;
        event_id: string;
        participant_id: string | null;
        role: Role;
        expires_at: string;
        consumed_at: string | null;
        revoked_at: string | null;
      }>();

    if (!claim || claim.revoked_at || claim.consumed_at) return { ok: false, reason: "invalid" };
    if (Date.parse(claim.expires_at) < Date.now()) return { ok: false, reason: "invalid" };

    const consume = await this.db
      .prepare(
        `UPDATE claims SET consumed_at = ?
         WHERE id = ? AND consumed_at IS NULL AND revoked_at IS NULL`,
      )
      .bind(nowIso(), claim.id)
      .run();

    if (!consume.meta?.changes) return { ok: false, reason: "conflict" };

    let participantId = claim.participant_id;
    if (!participantId) {
      participantId = randomId();
      const label = `member-${participantId.slice(0, 8)}`;
      await this.db
        .prepare(
          `INSERT INTO participants (id, event_id, display_label, role, created_at)
           VALUES (?, ?, ?, 'member', ?)`,
        )
        .bind(participantId, claim.event_id, label, nowIso())
        .run();
      await this.db
        .prepare(`UPDATE claims SET participant_id = ? WHERE id = ? AND event_id = ?`)
        .bind(participantId, claim.id, claim.event_id)
        .run();
    }

    const sessionTokenMint = await mintCapability();
    const sessionId = randomId();
    await this.db
      .prepare(
        `INSERT INTO sessions (id, event_id, participant_id, role, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        sessionId,
        claim.event_id,
        participantId,
        claim.role,
        sessionTokenMint.hash,
        plusSeconds(SESSION_TTL_SEC),
        nowIso(),
      )
      .run();

    return {
      ok: true,
      sessionToken: sessionTokenMint.secret,
      session: {
        sessionId,
        eventId: claim.event_id,
        participantId,
        role: claim.role,
      },
    };
  }

  async sessionFromToken(token: string | undefined): Promise<SessionContext | null> {
    if (!token) return null;
    const hash = await sha256Hex(token);
    const row = await this.db
      .prepare(
        `SELECT id, event_id, participant_id, role, expires_at, revoked_at
         FROM sessions WHERE token_hash = ?`,
      )
      .bind(hash)
      .first<{
        id: string;
        event_id: string;
        participant_id: string;
        role: Role;
        expires_at: string;
        revoked_at: string | null;
      }>();
    if (!row || row.revoked_at) return null;
    if (Date.parse(row.expires_at) < Date.now()) return null;
    return {
      sessionId: row.id,
      eventId: row.event_id,
      participantId: row.participant_id,
      role: row.role,
    };
  }

  async revokeSession(sessionId: string, eventId: string): Promise<void> {
    await this.db
      .prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ? AND event_id = ?`)
      .bind(nowIso(), sessionId, eventId)
      .run();
  }

  async getEvent(eventId: string) {
    return this.db
      .prepare(
        `SELECT id, title, group_size, state, version, area, results_invalid_at FROM events WHERE id = ?`,
      )
      .bind(eventId)
      .first<{
        id: string;
        title: string;
        group_size: number;
        state: string;
        version: number;
        area: string | null;
        results_invalid_at: string | null;
      }>();
  }

  async listParticipants(eventId: string) {
    const { results } = await this.db
      .prepare(
        `SELECT id, event_id, display_label, role FROM participants WHERE event_id = ?`,
      )
      .bind(eventId)
      .all<{
        id: string;
        event_id: string;
        display_label: string;
        role: Role;
      }>();
    return results;
  }

  async listConfirmedCatalogEntityIds(): Promise<string[]> {
    const { results } = await this.db
      .prepare(
        `SELECT qloo_entity_id FROM venues
         WHERE qloo_mapping_status = 'confirmed' AND qloo_entity_id IS NOT NULL`,
      )
      .bind()
      .all<{ qloo_entity_id: string }>();
    return results.map((r) => r.qloo_entity_id).filter(Boolean);
  }

  async listAllCatalogEntityIds(): Promise<string[]> {
    const { results } = await this.db
      .prepare(
        `SELECT qloo_entity_id FROM venues WHERE qloo_entity_id IS NOT NULL AND qloo_entity_id != ''`,
      )
      .bind()
      .all<{ qloo_entity_id: string }>();
    return results.map((r) => r.qloo_entity_id).filter(Boolean);
  }

  async invalidateEventResults(eventId: string): Promise<void> {
    const ts = nowIso();
    await this.db
      .prepare(
        `UPDATE events SET results_invalid_at = ?, version = version + 1, updated_at = ? WHERE id = ?`,
      )
      .bind(ts, ts, eventId)
      .run();
  }

  async listPreferences(eventId: string) {
    const { results } = await this.db
      .prepare(
        `SELECT participant_id, event_id, seeds_json, consent_taste FROM preferences WHERE event_id = ?`,
      )
      .bind(eventId)
      .all<{
        participant_id: string;
        event_id: string;
        seeds_json: string;
        consent_taste: number;
      }>();
    return results;
  }

  async putOwnPreferences(
    session: SessionContext,
    seeds: ConfirmedSeed[],
    consentTaste: boolean,
    opts?: { skipProfiling?: boolean; consentVersion?: string },
  ): Promise<void> {
    const ts = nowIso();
    const skip = !!opts?.skipProfiling;
    const storedSeeds = skip ? [] : seeds;
    await this.db
      .prepare(
        `INSERT INTO preferences (participant_id, event_id, seeds_json, consent_taste, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(participant_id) DO UPDATE SET
           seeds_json = excluded.seeds_json,
           consent_taste = excluded.consent_taste,
           updated_at = excluded.updated_at`,
      )
      .bind(
        session.participantId,
        session.eventId,
        JSON.stringify(storedSeeds).slice(0, 4000),
        consentTaste && !skip ? 1 : 0,
        ts,
      )
      .run();

    await this.db
      .prepare(
        `INSERT INTO consents (participant_id, event_id, consent_version, taste_opt_in, skip_profiling, accepted_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(participant_id) DO UPDATE SET
           consent_version = excluded.consent_version,
           taste_opt_in = excluded.taste_opt_in,
           skip_profiling = excluded.skip_profiling,
           accepted_at = excluded.accepted_at`,
      )
      .bind(
        session.participantId,
        session.eventId,
        opts?.consentVersion ?? CONSENT_TASTE_VERSION,
        consentTaste && !skip ? 1 : 0,
        skip ? 1 : 0,
        ts,
      )
      .run();

    await this.invalidateEventResults(session.eventId);
  }

  /** Child lookup always requires event_id scope (AUTH IDOR guard). */
  async getPreferenceScoped(eventId: string, participantId: string) {
    return this.db
      .prepare(
        `SELECT participant_id, event_id, seeds_json, consent_taste
         FROM preferences WHERE event_id = ? AND participant_id = ?`,
      )
      .bind(eventId, participantId)
      .first<{
        participant_id: string;
        event_id: string;
        seeds_json: string;
        consent_taste: number;
      }>();
  }

  async getConsentScoped(eventId: string, participantId: string) {
    return this.db
      .prepare(
        `SELECT participant_id, event_id, consent_version, taste_opt_in, skip_profiling, accepted_at
         FROM consents WHERE event_id = ? AND participant_id = ?`,
      )
      .bind(eventId, participantId)
      .first<{
        participant_id: string;
        event_id: string;
        consent_version: string;
        taste_opt_in: number;
        skip_profiling: number;
        accepted_at: string;
      }>();
  }

  async listConsents(eventId: string) {
    const { results } = await this.db
      .prepare(
        `SELECT participant_id, event_id, consent_version, taste_opt_in, skip_profiling, accepted_at
         FROM consents WHERE event_id = ?`,
      )
      .bind(eventId)
      .all<{
        participant_id: string;
        event_id: string;
        consent_version: string;
        taste_opt_in: number;
        skip_profiling: number;
        accepted_at: string;
      }>();
    return results;
  }

  /**
   * DATA-01: remove own preferences/consent/constraints, revoke session.
   * Does not delete the participant row (they remain in group coverage counts).
   */
  async deleteOwnInputs(session: SessionContext): Promise<void> {
    const ts = nowIso();
    await this.db
      .prepare(`DELETE FROM preferences WHERE event_id = ? AND participant_id = ?`)
      .bind(session.eventId, session.participantId)
      .run();
    await this.db
      .prepare(`DELETE FROM consents WHERE event_id = ? AND participant_id = ?`)
      .bind(session.eventId, session.participantId)
      .run();
    await this.db
      .prepare(`DELETE FROM constraints WHERE event_id = ? AND owner_participant_id = ?`)
      .bind(session.eventId, session.participantId)
      .run();
    await this.db
      .prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ? AND event_id = ?`)
      .bind(ts, session.sessionId, session.eventId)
      .run();
    await this.invalidateEventResults(session.eventId);
  }
}
