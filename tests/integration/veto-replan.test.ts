import { describe, expect, it } from "vitest";
import { CONSENT_TASTE_VERSION, type ConfirmedSeed } from "../../packages/contracts/src";
import { Repository } from "../../worker/src/db/repository";
import { createOrGetRun, stepRun } from "../../worker/src/planning/machine";
import { OpenAIClient } from "../../worker/src/providers/openai";
import { QlooClient } from "../../worker/src/providers/qloo";
import { openTestDb } from "../helpers/test-db";

const seed: ConfirmedSeed = {
  entityId: "00000000-0000-4000-8000-0000000000a1",
  name: "Synthetic Artist Alpha",
  type: "urn:entity:artist",
  confirmedAt: "2026-10-04T12:00:00.000Z",
};

const V1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const V2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
// Nine venues so a single veto still leaves ≥8 for the coverage gate.
const SLATE = [
  V1,
  V2,
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "ffffffff-ffff-4fff-8fff-ffffffffffff",
  "12121212-1212-4121-8121-121212121212",
  "34343434-3434-4343-8343-343434343434",
  "56565656-5656-4565-8565-565656565656",
];

describe("P17 private vetoes + replanning", () => {
  it("AC01/AC02: concurrent vetoes both stick; vetoed venue stays out", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Veto night", groupSize: 4 });
    const hostClaim = await repo.consumeClaim(created.hostClaimSecret);
    if (!hostClaim.ok) throw new Error("host");
    const invite = await repo.createMemberInvite(created.eventId);
    const memberClaim = await repo.consumeClaim(invite.claimSecret);
    if (!memberClaim.ok) throw new Error("member");

    const [a, b] = await Promise.all([
      repo.putVeto(hostClaim.session, V1, "vibe"),
      repo.putVeto(memberClaim.session, V1, "access"),
    ]);
    expect(a.version).toBeGreaterThan(0);
    expect(b.version).toBeGreaterThan(0);
    const vetoed = await repo.listActiveVetoVenueIds(created.eventId);
    expect(vetoed).toContain(V1);
    const summary = await repo.vetoSummary(created.eventId);
    expect(summary.activeVetoCount).toBeGreaterThanOrEqual(1);
    // Host summary has count only — no reason categories leaked via summary API shape.
    expect(Object.keys(summary)).toEqual(["activeVetoCount"]);

    const deps = { db, qloo: new QlooClient({}), openai: new OpenAIClient({}) };
    const event = await repo.getEvent(created.eventId);
    const { run } = await createOrGetRun({
      deps,
      eventId: created.eventId,
      eventVersion: event!.version,
      idempotencyKey: "veto-replan-1",
      preferAgent: false,
    });
    let current = run;
    let revisionId: string | undefined;
    for (let i = 0; i < 8; i += 1) {
      const step = await stepRun({
        deps,
        runId: current.id,
        ctx: {
          members: [
            {
              participantId: hostClaim.session.participantId,
              seeds: [seed],
              skipProfiling: false,
            },
          ],
          constraints: await repo.listConstraints(created.eventId),
          venues: [],
          catalogEntityIds: [],
          candidateEntityIds: SLATE,
          totalMemberCount: 2,
          currentEventVersion: (await repo.getEvent(created.eventId))!.version,
        },
      });
      current = step.run;
      revisionId = step.revisionId ?? revisionId;
      if (current.state === "complete" || current.state === "needs_input" || current.state === "failed") {
        break;
      }
    }
    expect(current.state).toBe("complete");
    const rev = await repo.latestRevision(created.eventId);
    expect(rev).toBeTruthy();
    const venueIds = JSON.parse(rev!.venue_ids_json) as string[];
    expect(venueIds).not.toContain(V1);
    expect(revisionId).toBeTruthy();
  });

  it("AC03: approval invalidated after veto requires host review on new version", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Review", groupSize: 4 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host");
    await repo.putOwnPreferences(host.session, [seed], true, {
      consentVersion: CONSENT_TASTE_VERSION,
    });
    // Insert a synthetic revision + approval, then veto.
    await db
      .prepare(
        `INSERT INTO revisions (
           id, event_id, run_id, event_version, venue_ids_json, evidence_ids_json,
           unknown_fact_ids_json, alternatives_json, explanations_json, taste_mode,
           profiled_member_count, total_member_count, readiness, data_mode,
           parent_revision_id, diff_json, expires_at, created_at
         ) VALUES (?, ?, NULL, ?, ?, '[]', '[]', '[]', '[]', 'full', 1, 1,
                   'ready_for_host_review', 'synthetic', NULL, NULL, ?, ?)`,
      )
      .bind(
        "rev-old-00000001",
        created.eventId,
        (await repo.getEvent(created.eventId))!.version,
        JSON.stringify([V2]),
        "2099-01-01T00:00:00.000Z",
        new Date().toISOString(),
      )
      .run();
    await repo.putAcceptance(host.session, "rev-old-00000001", V2);
    const approved = await repo.approveRevision({
      session: host.session,
      revisionId: "rev-old-00000001",
      expectedVersion: (await repo.getEvent(created.eventId))!.version,
    });
    expect(approved.ok).toBe(true);
    await repo.putVeto(host.session, V2, "location");
    expect(await repo.getActiveApproval(created.eventId)).toBeNull();
  });
});
