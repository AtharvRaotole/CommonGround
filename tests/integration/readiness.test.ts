import { describe, expect, it } from "vitest";
import { CONSENT_TASTE_VERSION, type ConfirmedSeed } from "../../packages/contracts/src/index";
import { Repository } from "../../worker/src/db/repository";
import { assessSlateReadiness, parseConstraint } from "../../worker/src/planning/constraints";
import { rankProfiledMembersOnSlate } from "../../worker/src/planning/score";
import { QlooClient } from "../../worker/src/providers/qloo";
import type { VenueRecord } from "../../worker/src/venues/facts";
import { openTestDb } from "../helpers/test-db";

const seed: ConfirmedSeed = {
  entityId: "00000000-0000-4000-8000-0000000000a1",
  name: "Synthetic Artist Alpha",
  type: "urn:entity:artist",
  confirmedAt: "2026-10-04T12:00:00.000Z",
};

function venue(id: string, extras: Partial<VenueRecord> = {}): VenueRecord {
  return {
    id,
    name: id,
    neighborhood: null,
    borough: null,
    address: null,
    category: "restaurant",
    priceBand: "$$",
    officialUrl: null,
    qlooEntityId: null,
    qlooMappingStatus: "unknown",
    facts: [],
    ...extras,
  };
}

describe("P13 readiness integration", () => {
  it("hard constraints filter slate before ranking; unknown access blocks ready", async () => {
    const access = parseConstraint({
      id: "constraint-access-9",
      ownerId: "member-aaaaaaa1",
      kind: "access",
      required: true,
      value: { field: "step_free", expected: true },
    })!;

    const venues = [
      venue("V-ready", {
        facts: [
          {
            id: "a",
            venueId: "V-ready",
            field: "step_free",
            value: true,
            state: "confirmed",
            sourceUrl: "https://example.invalid",
            sourceKind: "host_confirmation",
            observedAt: "2026-10-04T12:00:00.000Z",
            expiresAt: null,
            note: null,
          },
        ],
      }),
      venue("V-unknown", {
        facts: [
          {
            id: "b",
            venueId: "V-unknown",
            field: "step_free",
            value: null,
            state: "unknown",
            sourceUrl: null,
            sourceKind: "official_site",
            observedAt: "2026-10-04T12:00:00.000Z",
            expiresAt: null,
            note: null,
          },
        ],
      }),
    ];

    const feasibility = assessSlateReadiness({ venues, constraints: [access] });
    expect(feasibility.eligibleVenueIds).toEqual(["V-ready"]);
    expect(feasibility.needsConfirmationVenueIds).toEqual(["V-unknown"]);
    expect(feasibility.readiness).toBe("needs_confirmation");
  });

  it("owner constraint write increments event version and invalidates results", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Ready", groupSize: 4 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host");
    const before = await repo.getEvent(created.eventId);
    await repo.putConstraint(host.session, {
      id: "constraint-budget-9",
      ownerId: host.session.participantId,
      kind: "budget",
      required: true,
      value: {
        maxCents: 6000,
        currency: "USD",
        includesTaxTipDrinks: "excluded",
      },
    });
    const after = await repo.getEvent(created.eventId);
    expect(after!.version).toBe((before!.version ?? 1) + 1);
    expect(after!.results_invalid_at).toBeTruthy();
  });

  it("ranking public summary never includes private rank cells", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Rank", groupSize: 4 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host");
    const members = [];
    for (let i = 0; i < 2; i++) {
      const invite = await repo.createMemberInvite(created.eventId);
      const claim = await repo.consumeClaim(invite.claimSecret);
      if (!claim.ok) throw new Error("claim");
      await repo.putOwnPreferences(claim.session, [seed], true, {
        consentVersion: CONSENT_TASTE_VERSION,
      });
      members.push(claim.session);
    }

    const candidateEntityIds = Array.from({ length: 10 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    );

    const ranked = await rankProfiledMembersOnSlate({
      db,
      client: new QlooClient(),
      runId: "run-readiness-01",
      totalMemberCount: 3,
      candidateEntityIds,
      members: members.map((m) => ({
        participantId: m.participantId,
        seeds: [seed],
        skipProfiling: false,
      })),
    });

    expect(ranked.qlooCallsUsed).toBe(2);
    expect(ranked.publicSummary).not.toHaveProperty("cells");
    expect(JSON.stringify(ranked.publicSummary)).not.toContain(members[0]!.participantId);
  });
});
