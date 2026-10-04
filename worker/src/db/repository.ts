import {
  CLAIM_TTL_SEC,
  mintCapability,
  randomId,
  SESSION_TTL_SEC,
  sha256Hex,
} from "../auth/capabilities";
import type { Role, SessionContext } from "../auth/authorize";
import {
  CONSENT_TASTE_VERSION,
  ConstraintSchema,
  type ConfirmedSeed,
  type Constraint,
} from "@common-ground/contracts";

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

  async listConstraints(eventId: string): Promise<Constraint[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, owner_participant_id, kind, required, value_json
         FROM constraints WHERE event_id = ?`,
      )
      .bind(eventId)
      .all<{
        id: string;
        owner_participant_id: string;
        kind: string;
        required: number;
        value_json: string;
      }>();
    const out: Constraint[] = [];
    for (const row of results) {
      let value: unknown = null;
      try {
        value = JSON.parse(row.value_json);
      } catch {
        continue;
      }
      const parsed = ConstraintSchema.safeParse({
        id: row.id,
        ownerId: row.owner_participant_id,
        kind: row.kind,
        required: !!row.required,
        value,
      });
      if (parsed.success) out.push(parsed.data);
    }
    return out;
  }

  /**
   * Owner-authorized constraint upsert. Increments event version and invalidates results.
   * Models cannot call this without a participant session.
   */
  async putConstraint(session: SessionContext, constraint: Constraint): Promise<void> {
    const parsed = ConstraintSchema.parse(constraint);
    if (parsed.ownerId !== session.participantId && session.role !== "host") {
      throw new Error("constraint owner mismatch");
    }
    // Members may only write their own; hosts may write host-owned constraints.
    if (session.role === "member" && parsed.ownerId !== session.participantId) {
      throw new Error("members may only own their constraints");
    }
    const ownerId = session.role === "host" ? parsed.ownerId : session.participantId;
    const ts = nowIso();
    await this.db
      .prepare(
        `INSERT INTO constraints (id, event_id, owner_participant_id, kind, required, value_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           kind = excluded.kind,
           required = excluded.required,
           value_json = excluded.value_json
         WHERE constraints.event_id = excluded.event_id
           AND constraints.owner_participant_id = excluded.owner_participant_id`,
      )
      .bind(
        parsed.id,
        session.eventId,
        ownerId,
        parsed.kind,
        parsed.required ? 1 : 0,
        JSON.stringify(parsed.value),
        ts,
      )
      .run();
    await this.invalidateEventResults(session.eventId);
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
      .prepare(`DELETE FROM vetoes WHERE event_id = ? AND owner_participant_id = ?`)
      .bind(session.eventId, session.participantId)
      .run();
    await this.db
      .prepare(`DELETE FROM feedback WHERE event_id = ? AND participant_id = ?`)
      .bind(session.eventId, session.participantId)
      .run();
    await this.db
      .prepare(`DELETE FROM acceptances WHERE event_id = ? AND participant_id = ?`)
      .bind(session.eventId, session.participantId)
      .run();
    await this.db
      .prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ? AND event_id = ?`)
      .bind(ts, session.sessionId, session.eventId)
      .run();
    await this.invalidateEventResults(session.eventId);
    await this.invalidateApprovals(session.eventId);
  }

  /** FLOW-01: material change clears export-ready approvals and acceptances. */
  async invalidateApprovals(eventId: string): Promise<void> {
    const ts = nowIso();
    await this.db
      .prepare(
        `UPDATE approvals SET invalidated_at = ?, export_ready = 0
         WHERE event_id = ? AND invalidated_at IS NULL`,
      )
      .bind(ts, eventId)
      .run();
    await this.db
      .prepare(`DELETE FROM acceptances WHERE event_id = ?`)
      .bind(eventId)
      .run();
  }

  async invalidateEventResults(eventId: string): Promise<void> {
    const ts = nowIso();
    await this.db
      .prepare(
        `UPDATE events SET results_invalid_at = ?, version = version + 1, updated_at = ? WHERE id = ?`,
      )
      .bind(ts, ts, eventId)
      .run();
    await this.invalidateApprovals(eventId);
  }

  async putVeto(
    session: SessionContext,
    venueId: string,
    reasonCategory: string,
  ): Promise<{ vetoId: string; version: number }> {
    const ts = nowIso();
    const vetoId = randomId();
    await this.db
      .prepare(
        `INSERT INTO vetoes (id, event_id, owner_participant_id, venue_id, reason_category, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_id, owner_participant_id, venue_id) DO UPDATE SET
           reason_category = excluded.reason_category,
           withdrawn_at = NULL,
           created_at = excluded.created_at`,
      )
      .bind(vetoId, session.eventId, session.participantId, venueId, reasonCategory, ts)
      .run();
    // Also persist as hard veto constraint for readiness filtering.
    const constraintId = `veto-${session.participantId.slice(0, 8)}-${venueId}`.slice(0, 64);
    await this.putConstraint(session, {
      id: constraintId.length >= 8 ? constraintId : randomId(),
      ownerId: session.participantId,
      kind: "veto",
      required: true,
      value: { venueId },
    });
    const event = await this.getEvent(session.eventId);
    return { vetoId, version: event?.version ?? 0 };
  }

  async listActiveVetoVenueIds(eventId: string): Promise<string[]> {
    const { results } = await this.db
      .prepare(
        `SELECT venue_id FROM vetoes WHERE event_id = ? AND withdrawn_at IS NULL`,
      )
      .bind(eventId)
      .all<{ venue_id: string }>();
    return results.map((r) => r.venue_id);
  }

  /** Host-safe aggregate — never identity or reason. */
  async vetoSummary(eventId: string): Promise<{ activeVetoCount: number }> {
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) AS n FROM vetoes WHERE event_id = ? AND withdrawn_at IS NULL`,
      )
      .bind(eventId)
      .first<{ n: number }>();
    return { activeVetoCount: Number(row?.n ?? 0) };
  }

  async getRevision(eventId: string, revisionId: string) {
    return this.db
      .prepare(
        `SELECT id, event_id, run_id, event_version, venue_ids_json, evidence_ids_json,
                unknown_fact_ids_json, alternatives_json, explanations_json, taste_mode,
                profiled_member_count, total_member_count, readiness, data_mode,
                parent_revision_id, diff_json, expires_at, created_at
         FROM revisions WHERE id = ? AND event_id = ?`,
      )
      .bind(revisionId, eventId)
      .first<{
        id: string;
        event_id: string;
        run_id: string | null;
        event_version: number;
        venue_ids_json: string;
        evidence_ids_json: string;
        unknown_fact_ids_json: string;
        alternatives_json: string;
        explanations_json: string;
        taste_mode: string;
        profiled_member_count: number;
        total_member_count: number;
        readiness: string;
        data_mode: string;
        parent_revision_id: string | null;
        diff_json: string | null;
        expires_at: string;
        created_at: string;
      }>();
  }

  async latestRevision(eventId: string) {
    return this.db
      .prepare(
        `SELECT id, event_id, run_id, event_version, venue_ids_json, evidence_ids_json,
                unknown_fact_ids_json, alternatives_json, explanations_json, taste_mode,
                profiled_member_count, total_member_count, readiness, data_mode,
                parent_revision_id, diff_json, expires_at, created_at
         FROM revisions WHERE event_id = ? ORDER BY created_at DESC LIMIT 1`,
      )
      .bind(eventId)
      .first<{
        id: string;
        event_id: string;
        run_id: string | null;
        event_version: number;
        venue_ids_json: string;
        evidence_ids_json: string;
        unknown_fact_ids_json: string;
        alternatives_json: string;
        explanations_json: string;
        taste_mode: string;
        profiled_member_count: number;
        total_member_count: number;
        readiness: string;
        data_mode: string;
        parent_revision_id: string | null;
        diff_json: string | null;
        expires_at: string;
        created_at: string;
      }>();
  }

  async putAcceptance(
    session: SessionContext,
    revisionId: string,
    venueId: string,
  ): Promise<void> {
    const rev = await this.getRevision(session.eventId, revisionId);
    if (!rev) throw new Error("revision_not_found");
    if (Date.parse(rev.expires_at) < Date.now()) throw new Error("revision_expired");
    const venues = JSON.parse(rev.venue_ids_json) as string[];
    if (!venues.includes(venueId)) throw new Error("venue_not_in_revision");
    await this.db
      .prepare(
        `INSERT INTO acceptances (id, event_id, participant_id, revision_id, venue_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_id, participant_id, revision_id) DO UPDATE SET
           venue_id = excluded.venue_id,
           created_at = excluded.created_at`,
      )
      .bind(randomId(), session.eventId, session.participantId, revisionId, venueId, nowIso())
      .run();
  }

  async listAcceptances(eventId: string, revisionId: string) {
    const { results } = await this.db
      .prepare(
        `SELECT participant_id, venue_id FROM acceptances
         WHERE event_id = ? AND revision_id = ?`,
      )
      .bind(eventId, revisionId)
      .all<{ participant_id: string; venue_id: string }>();
    return results;
  }

  async approveRevision(input: {
    session: SessionContext;
    revisionId: string;
    expectedVersion: number;
  }): Promise<
    | { ok: true; exportReady: boolean; approvalId: string }
    | { ok: false; reason: "conflict" | "not_ready" | "missing_acceptance" }
  > {
    const event = await this.getEvent(input.session.eventId);
    if (!event || event.version !== input.expectedVersion) {
      return { ok: false, reason: "conflict" };
    }
    const rev = await this.getRevision(input.session.eventId, input.revisionId);
    if (!rev || rev.event_version !== event.version) {
      return { ok: false, reason: "conflict" };
    }
    const participants = await this.listParticipants(input.session.eventId);
    const acceptances = await this.listAcceptances(input.session.eventId, input.revisionId);
    if (acceptances.length < participants.length) {
      return { ok: false, reason: "missing_acceptance" };
    }
    const venueIds = new Set(acceptances.map((a) => a.venue_id));
    if (venueIds.size !== 1) return { ok: false, reason: "not_ready" };
    const unknown = JSON.parse(rev.unknown_fact_ids_json) as string[];
    const exportReady = rev.readiness === "ready_for_host_review" && unknown.length === 0;
    const approvalId = randomId();
    await this.db
      .prepare(
        `INSERT INTO approvals (id, event_id, revision_id, host_participant_id, export_ready, approved_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_id, revision_id) DO UPDATE SET
           export_ready = excluded.export_ready,
           approved_at = excluded.approved_at,
           invalidated_at = NULL,
           host_participant_id = excluded.host_participant_id`,
      )
      .bind(
        approvalId,
        input.session.eventId,
        input.revisionId,
        input.session.participantId,
        exportReady ? 1 : 0,
        nowIso(),
      )
      .run();
    await this.db
      .prepare(`UPDATE events SET state = 'approved', updated_at = ? WHERE id = ?`)
      .bind(nowIso(), input.session.eventId)
      .run();
    return { ok: true, exportReady, approvalId };
  }

  async getActiveApproval(eventId: string) {
    return this.db
      .prepare(
        `SELECT id, revision_id, export_ready, approved_at, invalidated_at
         FROM approvals WHERE event_id = ? AND invalidated_at IS NULL
         ORDER BY approved_at DESC LIMIT 1`,
      )
      .bind(eventId)
      .first<{
        id: string;
        revision_id: string;
        export_ready: number;
        approved_at: string;
        invalidated_at: string | null;
      }>();
  }

  async putFeedback(
    session: SessionContext,
    data: {
      attended?: "yes" | "no" | "skipped";
      actualFit?: "good" | "ok" | "poor";
      planningExperience?: "smooth" | "ok" | "frustrating";
      hostActiveMinutes?: number;
      supportMinutes?: number;
      venueChanged?: boolean;
    },
  ): Promise<void> {
    // Missing fields stay null — never infer dislike from no-show (P19 AC02).
    await this.db
      .prepare(
        `INSERT INTO feedback (
           id, event_id, participant_id, attended, actual_fit, planning_experience,
           host_active_minutes, support_minutes, venue_changed, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_id, participant_id) DO UPDATE SET
           attended = COALESCE(excluded.attended, feedback.attended),
           actual_fit = COALESCE(excluded.actual_fit, feedback.actual_fit),
           planning_experience = COALESCE(excluded.planning_experience, feedback.planning_experience),
           host_active_minutes = COALESCE(excluded.host_active_minutes, feedback.host_active_minutes),
           support_minutes = COALESCE(excluded.support_minutes, feedback.support_minutes),
           venue_changed = COALESCE(excluded.venue_changed, feedback.venue_changed)`,
      )
      .bind(
        randomId(),
        session.eventId,
        session.participantId,
        data.attended ?? null,
        data.actualFit ?? null,
        data.planningExperience ?? null,
        session.role === "host" ? (data.hostActiveMinutes ?? null) : null,
        session.role === "host" ? (data.supportMinutes ?? null) : null,
        session.role === "host" ? (data.venueChanged ? 1 : data.venueChanged === false ? 0 : null) : null,
        nowIso(),
      )
      .run();
  }

  /**
   * Duplicate host settings into a new event. Private seeds are NOT copied (P19 AC01).
   */
  async duplicateEventSettings(
    session: SessionContext,
  ): Promise<{ eventId: string; hostClaimSecret: string; hostRecoverySecret: string }> {
    const src = await this.db
      .prepare(
        `SELECT title, group_size, timezone, area, budget_cents, currency, starts_at_local
         FROM events WHERE id = ?`,
      )
      .bind(session.eventId)
      .first<{
        title: string;
        group_size: number;
        timezone: string | null;
        area: string | null;
        budget_cents: number | null;
        currency: string | null;
        starts_at_local: string | null;
      }>();
    if (!src) throw new Error("event_not_found");
    const created = await this.createEvent({
      title: `${src.title} (repeat)`,
      groupSize: src.group_size,
      area: src.area ?? undefined,
      timezone: src.timezone ?? undefined,
    });
    const ts = nowIso();
    await this.db
      .prepare(
        `UPDATE events SET parent_event_id = ?, budget_cents = ?, currency = ?,
         starts_at_local = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(
        session.eventId,
        src.budget_cents,
        src.currency,
        src.starts_at_local,
        ts,
        created.eventId,
      )
      .run();
    return {
      eventId: created.eventId,
      hostClaimSecret: created.hostClaimSecret,
      hostRecoverySecret: created.hostRecoverySecret,
    };
  }

  /** DATA-02: drop expired vendor-derived revisions. */
  async purgeExpiredRevisions(now = new Date()): Promise<number> {
    const result = await this.db
      .prepare(`DELETE FROM revisions WHERE expires_at < ?`)
      .bind(now.toISOString())
      .run();
    return Number(result.meta?.changes ?? 0);
  }
}
