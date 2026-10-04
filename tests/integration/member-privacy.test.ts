import { describe, expect, it } from "vitest";
import { CONSENT_TASTE_VERSION, type ConfirmedSeed } from "../../packages/contracts/src/index";
import { toEventDto } from "../../worker/src/auth/authorize";
import { Repository } from "../../worker/src/db/repository";
import { deleteOwnMemberInputs } from "../../worker/src/privacy/delete";
import { openTestDb } from "../helpers/test-db";

const seed = (n: string): ConfirmedSeed => ({
  entityId: `00000000-0000-4000-8000-0000000000a${n}`,
  name: `Synthetic Artist ${n}`,
  type: "urn:entity:artist",
  confirmedAt: "2026-10-04T12:00:00.000Z",
});

describe("P10 member intake privacy", () => {
  it("AC01: four members join; host sees counts without taste lists", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Cohort", groupSize: 6 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host");

    const members = [];
    for (let i = 0; i < 4; i++) {
      const invite = await repo.createMemberInvite(created.eventId);
      const claim = await repo.consumeClaim(invite.claimSecret);
      if (!claim.ok) throw new Error("claim");
      members.push(claim.session);
      await repo.putOwnPreferences(claim.session, [seed(String(i + 1))], true, {
        consentVersion: CONSENT_TASTE_VERSION,
      });
    }

    const dto = toEventDto({
      event: (await repo.getEvent(created.eventId))!,
      viewer: host.session,
      preferences: await repo.listPreferences(created.eventId),
      participants: await repo.listParticipants(created.eventId),
      consents: await repo.listConsents(created.eventId),
    });

    expect(dto.membersProfiled).toBe(4);
    expect(dto.membersTotal).toBe(5); // host + 4
    expect(dto.membersCompleted).toBe(4);
    expect(members).toHaveLength(4);
    expect(JSON.stringify(dto)).not.toMatch(/Synthetic Artist/);
    expect(dto).not.toHaveProperty("objectionReasons");
  });

  it("AC02: skip-profiling members remain in coverage; no invented ranks/seeds", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Skip", groupSize: 4 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host");
    const invite = await repo.createMemberInvite(created.eventId);
    const member = await repo.consumeClaim(invite.claimSecret);
    if (!member.ok) throw new Error("member");

    await repo.putOwnPreferences(member.session, [], false, {
      skipProfiling: true,
      consentVersion: CONSENT_TASTE_VERSION,
    });

    const dto = toEventDto({
      event: (await repo.getEvent(created.eventId))!,
      viewer: host.session,
      preferences: await repo.listPreferences(created.eventId),
      participants: await repo.listParticipants(created.eventId),
      consents: await repo.listConsents(created.eventId),
    });
    expect(dto.membersSkipped).toBe(1);
    expect(dto.membersProfiled).toBe(0);
    expect(dto.membersCompleted).toBe(1);
    expect(dto.membersTotal).toBe(2);

    const own = await repo.getPreferenceScoped(created.eventId, member.session.participantId);
    expect(JSON.parse(own!.seeds_json)).toEqual([]);
  });

  it("AC03/DATA-01: delete removes own input and invalidates results; others untouched", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Delete", groupSize: 4 });
    await repo.consumeClaim(created.hostClaimSecret);

    const aInvite = await repo.createMemberInvite(created.eventId);
    const a = await repo.consumeClaim(aInvite.claimSecret);
    const bInvite = await repo.createMemberInvite(created.eventId);
    const b = await repo.consumeClaim(bInvite.claimSecret);
    if (!a.ok || !b.ok) throw new Error("claims");

    await repo.putOwnPreferences(a.session, [seed("1")], true, {
      consentVersion: CONSENT_TASTE_VERSION,
    });
    await repo.putOwnPreferences(b.session, [seed("2")], true, {
      consentVersion: CONSENT_TASTE_VERSION,
    });

    await deleteOwnMemberInputs(repo, a.session);

    expect(await repo.getPreferenceScoped(created.eventId, a.session.participantId)).toBeNull();
    expect(await repo.getConsentScoped(created.eventId, a.session.participantId)).toBeNull();
    const bPref = await repo.getPreferenceScoped(created.eventId, b.session.participantId);
    expect(bPref?.seeds_json).toContain("Synthetic Artist 2");

    const event = await repo.getEvent(created.eventId);
    expect(event?.results_invalid_at).toBeTruthy();
    expect(await repo.sessionFromToken(a.sessionToken)).toBeNull();
    // Unrelated member session still valid
    expect(await repo.sessionFromToken(b.sessionToken)).not.toBeNull();
  });
});
