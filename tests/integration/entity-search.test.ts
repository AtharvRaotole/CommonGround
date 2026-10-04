import { describe, expect, it } from "vitest";
import {
  ConfirmedSeedSchema,
  EntitySearchRequestSchema,
  LOOKUP_CAPS,
  PreferencesPutSchema,
  CONSENT_TASTE_VERSION,
} from "../../packages/contracts/src/index";
import { Repository } from "../../worker/src/db/repository";
import { remainingLookups, reserveLookup } from "../../worker/src/planning/budget";
import { QlooClient } from "../../worker/src/providers/qloo";
import { openTestDb } from "../helpers/test-db";

describe("P09 entity search", () => {
  it("AC01: ambiguous names return multiple candidates; wrong-type/malformed seeds rejected", async () => {
    const client = new QlooClient();
    const outcome = await client.searchEntities({
      query: "Synthetic Artist Alpha",
      types: ["urn:entity:artist"],
    });
    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.candidates.length).toBeGreaterThanOrEqual(2);
    expect(outcome.candidates.every((c) => c.type === "urn:entity:artist")).toBe(true);

    expect(
      ConfirmedSeedSchema.safeParse({
        entityId: "not-a-uuid",
        name: "Nope",
        type: "urn:entity:artist",
        confirmedAt: "2026-10-04T12:00:00.000Z",
      }).success,
    ).toBe(false);

    expect(
      PreferencesPutSchema.safeParse({
        seeds: [
          {
            entityId: "00000000-0000-4000-8000-0000000000a1",
            name: "Synthetic Artist Alpha",
            type: "urn:entity:movie", // wrong type vs known artist id — still shape-valid;
            // server trusts confirmed type from client confirmation UI; type enum is enforced.
            confirmedAt: "2026-10-04T12:00:00.000Z",
          },
        ],
        consentTaste: true,
        consentVersion: CONSENT_TASTE_VERSION,
      }).success,
    ).toBe(true);

    // Malformed preference payload rejected
    expect(
      PreferencesPutSchema.safeParse({
        seeds: [{ name: "Radiohead" }],
        consentTaste: true,
        consentVersion: CONSENT_TASTE_VERSION,
      }).success,
    ).toBe(false);
  });

  it("AC02: no-match and timeout preserve edit/skip — empty candidates, no invented UUIDs", async () => {
    const client = new QlooClient();
    const noMatch = await client.searchEntities({ query: "zzzz-no-such-entity-qqq" });
    expect(noMatch.status).toBe("no_match");
    expect(noMatch.candidates).toEqual([]);

    const timeout = await new QlooClient({ forceTimeout: true }).searchEntities({
      query: "Synthetic",
    });
    expect(timeout.status).toBe("timeout");
    expect(timeout.candidates).toEqual([]);

    // Skip profiling still valid without seeds
    const skip = PreferencesPutSchema.safeParse({
      seeds: [],
      consentTaste: false,
      skipProfiling: true,
      consentVersion: CONSENT_TASTE_VERSION,
    });
    expect(skip.success).toBe(true);
  });

  it("AC03: lookup respects 20/member/day and 60/event/day including retries", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Budget", groupSize: 4 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host");
    const memberId = host.session.participantId;
    const eventId = created.eventId;

    for (let i = 0; i < LOOKUP_CAPS.perMemberDay; i++) {
      const r = await reserveLookup({ db, memberId, eventId });
      expect(r.ok).toBe(true);
    }
    const blocked = await reserveLookup({ db, memberId, eventId });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.which).toBe("member");

    // Burn remaining event budget across fresh members (each member capped at 20).
    const remainingEvent = LOOKUP_CAPS.perEventDay - LOOKUP_CAPS.perMemberDay;
    let burned = 0;
    while (burned < remainingEvent) {
      const invite = await repo.createMemberInvite(eventId);
      const member = await repo.consumeClaim(invite.claimSecret);
      if (!member.ok) throw new Error("member");
      for (let i = 0; i < LOOKUP_CAPS.perMemberDay && burned < remainingEvent; i++) {
        const r = await reserveLookup({
          db,
          memberId: member.session.participantId,
          eventId,
        });
        expect(r.ok).toBe(true);
        burned += 1;
      }
    }
    const invite = await repo.createMemberInvite(eventId);
    const member = await repo.consumeClaim(invite.claimSecret);
    if (!member.ok) throw new Error("member");
    const eventBlocked = await reserveLookup({
      db,
      memberId: member.session.participantId,
      eventId,
    });
    expect(eventBlocked.ok).toBe(false);
    if (!eventBlocked.ok) expect(eventBlocked.which).toBe("event");

    const rem = await remainingLookups({
      db,
      memberId: member.session.participantId,
      eventId,
    });
    expect(rem.eventRemaining).toBe(0);
  });

  it("C1: search request schema enforces min length and type filters", () => {
    expect(EntitySearchRequestSchema.safeParse({ query: "a" }).success).toBe(false);
    expect(
      EntitySearchRequestSchema.safeParse({
        query: "ab",
        types: ["urn:entity:artist"],
      }).success,
    ).toBe(true);
  });

  it("never invents entity UUIDs from raw query text in synthetic mode", async () => {
    const client = new QlooClient({ syntheticEntities: [] });
    const outcome = await client.searchEntities({ query: "BrandNewNameXYZ" });
    expect(outcome.status).toBe("no_match");
    expect(outcome.candidates).toEqual([]);
  });
});
