import { describe, expect, it } from "vitest";
import { CONSENT_TASTE_VERSION, type ConfirmedSeed } from "../../packages/contracts/src";
import { Repository } from "../../worker/src/db/repository";
import { purgeExpiredDerived } from "../../worker/src/privacy/delete";
import { openTestDb } from "../helpers/test-db";

const seed: ConfirmedSeed = {
  entityId: "00000000-0000-4000-8000-0000000000a1",
  name: "Synthetic Artist Alpha",
  type: "urn:entity:artist",
  confirmedAt: "2026-10-04T12:00:00.000Z",
};

describe("P19 feedback + repeat + retention", () => {
  it("AC01: repeat event does not copy private seeds by default", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Original", groupSize: 4, area: "EV" });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("claim");
    await repo.putOwnPreferences(host.session, [seed], true, {
      consentVersion: CONSENT_TASTE_VERSION,
    });
    const prefsBefore = await repo.listPreferences(created.eventId);
    expect(prefsBefore.length).toBe(1);

    const dup = await repo.duplicateEventSettings(host.session);
    const prefsAfter = await repo.listPreferences(dup.eventId);
    expect(prefsAfter.length).toBe(0);
    const event = await repo.getEvent(dup.eventId);
    expect(event?.title).toMatch(/repeat/i);
  });

  it("AC02: missing feedback stays missing; no-show is not dislike", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Feedback", groupSize: 4 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("claim");
    await repo.putFeedback(host.session, { attended: "skipped" });
    const row = await db
      .prepare(
        `SELECT attended, actual_fit FROM feedback WHERE event_id = ? AND participant_id = ?`,
      )
      .bind(host.session.eventId, host.session.participantId)
      .first<{ attended: string; actual_fit: string | null }>();
    expect(row?.attended).toBe("skipped");
    expect(row?.actual_fit).toBeNull();
  });

  it("DATA-02: expired revisions are purged", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Expire", groupSize: 4 });
    await db
      .prepare(
        `INSERT INTO revisions (
           id, event_id, run_id, event_version, venue_ids_json, evidence_ids_json,
           unknown_fact_ids_json, alternatives_json, explanations_json, taste_mode,
           profiled_member_count, total_member_count, readiness, data_mode,
           parent_revision_id, diff_json, expires_at, created_at
         ) VALUES (?, ?, NULL, 1, '[]', '[]', '[]', '[]', '[]', 'mixed', 0, 4,
                   'needs_confirmation', 'synthetic', NULL, NULL, ?, ?)`,
      )
      .bind(
        "rev-expired-0001",
        created.eventId,
        "2020-01-01T00:00:00.000Z",
        "2020-01-01T00:00:00.000Z",
      )
      .run();
    const purged = await purgeExpiredDerived(repo);
    expect(purged.purged).toBe(1);
    const gone = await repo.getRevision(created.eventId, "rev-expired-0001");
    expect(gone).toBeNull();
  });
});
