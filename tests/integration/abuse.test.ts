import { describe, expect, it } from "vitest";
import { LOOKUP_CAPS } from "../../packages/contracts/src";
import { REQUEST_CAPS, reserveRequest } from "../../worker/src/auth/ratelimit";
import { toEventDto } from "../../worker/src/auth/authorize";
import { Repository } from "../../worker/src/db/repository";
import { reserveLookup } from "../../worker/src/planning/budget";
import { recordTelemetry, scrubDetail } from "../../worker/src/telemetry/events";
import { openTestDb } from "../helpers/test-db";
import type { ConfirmedSeed } from "../../packages/contracts/src";

const seed: ConfirmedSeed = {
  entityId: "00000000-0000-4000-8000-0000000000a1",
  name: "SecretSeedName",
  type: "urn:entity:artist",
  confirmedAt: "2026-10-04T12:00:00.000Z",
};

describe("P21 abuse / privacy / spend caps", () => {
  it("AC01: host DTO and telemetry scrub private seeds/keys", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Abuse", groupSize: 4 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host");
    const invite = await repo.createMemberInvite(created.eventId);
    const member = await repo.consumeClaim(invite.claimSecret);
    if (!member.ok) throw new Error("member");
    await repo.putOwnPreferences(member.session, [seed], true);

    const dto = toEventDto({
      event: (await repo.getEvent(created.eventId))!,
      viewer: host.session,
      preferences: await repo.listPreferences(created.eventId),
      participants: await repo.listParticipants(created.eventId),
    });
    expect(JSON.stringify(dto)).not.toContain("SecretSeedName");
    expect(JSON.stringify(dto)).not.toMatch(/sk-|api[_-]?key/i);

    const scrubbed = scrubDetail({
      seeds: ["nope"],
      reason: "vibe",
      dataMode: "synthetic",
      count: 2,
    });
    expect(scrubbed).toEqual({ dataMode: "synthetic", count: 2 });

    await recordTelemetry({
      db,
      eventId: created.eventId,
      kind: "veto",
      detail: { count: 1, dataMode: "synthetic" },
    });
    const row = await db
      .prepare(`SELECT detail_json FROM audit_events WHERE event_id = ?`)
      .bind(created.eventId)
      .first<{ detail_json: string }>();
    expect(row?.detail_json).not.toContain("SecretSeedName");
    expect(row?.detail_json).not.toContain("vibe");
  });

  it("AC02: request meters and provider caps fail closed before overshoot", async () => {
    const { db } = openTestDb();
    // Body too large
    const body = await reserveRequest({
      db,
      sessionId: "sess-body",
      ipKey: "1.2.3.4",
      contentLength: REQUEST_CAPS.maxBodyBytes + 1,
    });
    expect(body.ok).toBe(false);
    if (!body.ok) expect(body.which).toBe("body");

    // Session meter
    for (let i = 0; i < REQUEST_CAPS.perSessionDay; i += 1) {
      const ok = await reserveRequest({
        db,
        sessionId: "sess-cap",
        ipKey: `ip-${i}`,
        contentLength: 100,
      });
      expect(ok.ok).toBe(true);
    }
    const denied = await reserveRequest({
      db,
      sessionId: "sess-cap",
      ipKey: "ip-final",
      contentLength: 100,
    });
    expect(denied.ok).toBe(false);

    // Provider lookup global still enforced
    const lookups = await Promise.all(
      Array.from({ length: LOOKUP_CAPS.globalDay + 10 }, (_, i) =>
        reserveLookup({ db, memberId: `m-${i}`, eventId: `e-${i % 3}` }),
      ),
    );
    expect(lookups.filter((r) => r.ok).length).toBeLessThanOrEqual(LOOKUP_CAPS.globalDay);
  });

  it("AC03: privacy notice promises match implemented deletion/retention behavior", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const notice = readFileSync(join(process.cwd(), "docs/privacy/notice.md"), "utf8");
    expect(notice).toMatch(/do not promise that providers retain nothing/i);
    expect(notice).toMatch(/Delete my inputs/i);
    expect(notice).not.toMatch(/zero retention guarantee|we never send data to vendors/i);

    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Delete", groupSize: 4 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host");
    await repo.putOwnPreferences(host.session, [seed], true);
    await repo.deleteOwnInputs(host.session);
    const prefs = await repo.listPreferences(created.eventId);
    expect(prefs.length).toBe(0);
  });
});
