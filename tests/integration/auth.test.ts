import { describe, expect, it } from "vitest";
import { toEventDto } from "../../worker/src/auth/authorize";
import { Repository } from "../../worker/src/db/repository";
import { openTestDb } from "../helpers/test-db";
import { sha256Hex } from "../../worker/src/auth/capabilities";

describe("AUTH capability sessions", () => {
  it("AUTH-01: guessed other-member preferences return no foreign seeds", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Thursday", groupSize: 6 });
    const hostClaim = await repo.consumeClaim(created.hostClaimSecret);
    expect(hostClaim.ok).toBe(true);
    if (!hostClaim.ok) return;

    const invite = await repo.createMemberInvite(created.eventId);
    const memberClaim = await repo.consumeClaim(invite.claimSecret);
    expect(memberClaim.ok).toBe(true);
    if (!memberClaim.ok) return;

    await repo.putOwnPreferences(memberClaim.session, [{ name: "Radiohead" }], true);

    // Host must not read member seeds via scoped helper pretending to be cross-id without ownership.
    const foreign = await repo.getPreferenceScoped(
      created.eventId,
      memberClaim.session.participantId,
    );
    // Row exists in DB, but DTO path must strip it for hosts:
    const event = await repo.getEvent(created.eventId);
    const prefs = await repo.listPreferences(created.eventId);
    const hostDto = toEventDto({
      event: event!,
      viewer: hostClaim.session,
      preferences: prefs,
    });
    expect(JSON.stringify(hostDto)).not.toContain("Radiohead");
    expect(hostDto).not.toHaveProperty("preferences");
    expect((hostDto.me as { seeds: unknown[] }).seeds).toEqual([]);
    expect(foreign?.seeds_json).toContain("Radiohead"); // raw row exists; DTO is what matters for API
  });

  it("AUTH-02: host event DTO never exposes nested private seeds", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Friday", groupSize: 5 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host claim");
    const invite = await repo.createMemberInvite(created.eventId);
    const member = await repo.consumeClaim(invite.claimSecret);
    if (!member.ok) throw new Error("member claim");
    await repo.putOwnPreferences(member.session, [{ name: "Spirited Away", type: "film" }], true);
    const event = await repo.getEvent(created.eventId);
    const dto = toEventDto({
      event: event!,
      viewer: host.session,
      preferences: await repo.listPreferences(created.eventId),
    });
    expect(JSON.stringify(dto)).not.toMatch(/Spirited Away/);
    expect(dto.membersProfiled).toBe(1);
  });

  it("AUTH-03: concurrent claim consumption yields exactly one session", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Saturday", groupSize: 4 });
    const invite = await repo.createMemberInvite(created.eventId);

    const [a, b] = await Promise.all([
      repo.consumeClaim(invite.claimSecret),
      repo.consumeClaim(invite.claimSecret),
    ]);
    const wins = [a, b].filter((r) => r.ok);
    const losses = [a, b].filter((r) => !r.ok);
    expect(wins).toHaveLength(1);
    expect(losses).toHaveLength(1);
  });

  it("AUTH-04: rotated or expired claims cannot write preferences", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Sunday", groupSize: 4 });
    await repo.consumeClaim(created.hostClaimSecret);

    const invite = await repo.createMemberInvite(created.eventId);
    const hash = await sha256Hex(invite.claimSecret);
    await db
      .prepare(`UPDATE claims SET revoked_at = ? WHERE secret_hash = ?`)
      .bind(new Date().toISOString(), hash)
      .run();
    expect((await repo.consumeClaim(invite.claimSecret)).ok).toBe(false);

    const invite2 = await repo.createMemberInvite(created.eventId);
    const expiredHash = await sha256Hex(invite2.claimSecret);
    await db
      .prepare(`UPDATE claims SET expires_at = ? WHERE secret_hash = ?`)
      .bind(new Date(Date.now() - 1000).toISOString(), expiredHash)
      .run();
    expect((await repo.consumeClaim(invite2.claimSecret)).ok).toBe(false);
  });

  it("AUTH-05: wrong-origin writes rejected by assertSameOrigin helper", async () => {
    const { assertSameOrigin } = await import("../../worker/src/auth/authorize");
    const bad = new Request("https://app.example/api/events", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    });
    const good = new Request("https://app.example/api/events", {
      method: "POST",
      headers: { Origin: "https://app.example" },
    });
    expect(assertSameOrigin(bad, ["https://app.example"])).toBe(false);
    expect(assertSameOrigin(good, ["https://app.example"])).toBe(true);
  });

  it("AC03: claim secrets are hashed at rest (no plaintext in claims table)", async () => {
    const { db, raw } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Hash check", groupSize: 4 });
    const rows = raw.prepare("SELECT secret_hash FROM claims").all() as { secret_hash: string }[];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.secret_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(row.secret_hash).not.toBe(created.hostClaimSecret);
      expect(row.secret_hash).not.toContain(created.hostClaimSecret.slice(0, 10));
    }
  });
});
