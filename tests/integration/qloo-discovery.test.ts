import { describe, expect, it } from "vitest";
import { QLOO_RUN_CALL_CEILING } from "../../packages/contracts/src/index";
import { reserveRunQlooCall } from "../../worker/src/planning/budget";
import { discoverBoundedCandidates } from "../../worker/src/planning/discover";
import { QlooClient, intersectWithCatalog } from "../../worker/src/providers/qloo";
import { openTestDb } from "../helpers/test-db";

const catalog = [
  "00000000-0000-4000-8000-0000000000d1",
  "00000000-0000-4000-8000-0000000000d2",
];

describe("P11 Qloo discovery", () => {
  it("QLOO-01/02: unsupported params fail closed; key never in URL", async () => {
    const calls: string[] = [];
    const client = new QlooClient({
      apiKey: "x".repeat(12),
      fetchImpl: async (input) => {
        const url = String(input);
        calls.push(url);
        expect(url.includes("xxxxxxxxx")).toBe(false);
        expect(/[?&]key=/.test(url)).toBe(false);
        return new Response(JSON.stringify({ results: { entities: [] } }), { status: 200 });
      },
    });
    await client.discoverPlaces({
      seedEntityIds: ["00000000-0000-4000-8000-0000000000a1"],
      catalogEntityIds: catalog,
    });
    expect(calls[0]).toContain("/v2/insights?");
    expect(calls[0]).toContain("filter.type=urn%3Aentity%3Aplace");
  });

  it("AC01/QLOO-03: surfaced candidates are ∩ checked catalog; extras rejected", () => {
    const { allowed, rejected } = intersectWithCatalog(
      [
        "00000000-0000-4000-8000-0000000000d1",
        "11111111-1111-4111-8111-111111111111",
      ],
      catalog,
    );
    expect(allowed).toEqual(["00000000-0000-4000-8000-0000000000d1"]);
    expect(rejected).toEqual(["11111111-1111-4111-8111-111111111111"]);
  });

  it("AC02/QLOO-05: failure and empty never fabricate affinity rows", async () => {
    const { db } = openTestDb();
    const authFail = new QlooClient({
      apiKey: "x",
      forceStatus: 401,
      fetchImpl: async () => new Response("nope", { status: 401 }),
    });
    const out = await discoverBoundedCandidates({
      db,
      client: authFail,
      members: [
        {
          participantId: "member-aaaaaaaa",
          skipProfiling: false,
          seeds: [
            {
              entityId: "00000000-0000-4000-8000-0000000000a1",
              name: "Synthetic Artist Alpha",
              type: "urn:entity:artist",
              confirmedAt: "2026-10-04T12:00:00.000Z",
            },
          ],
        },
      ],
      raw: {
        eventId: "event-aaaaaaaa",
        runId: "run-aaaaaaaaaa",
        profiledMemberIds: ["member-aaaaaaaa"],
        catalogEntityIds: catalog,
      },
    });
    expect(out.status).toBe("unavailable");
    expect(out.candidateEntityIds).toEqual([]);
    expect(out.catalogFallbackIds).toEqual(catalog);
  });

  it("QLOO-04: 401/403 zero retries (single call counted)", async () => {
    let hits = 0;
    const client = new QlooClient({
      apiKey: "x",
      fetchImpl: async () => {
        hits += 1;
        return new Response("nope", { status: 403 });
      },
    });
    const outcome = await client.discoverPlaces({
      seedEntityIds: ["00000000-0000-4000-8000-0000000000a1"],
      catalogEntityIds: catalog,
    });
    expect(outcome.status).toBe("auth");
    expect(outcome.callCount).toBe(1);
    expect(hits).toBe(1);
  });

  it("AC03: discovery consumes ≤ member count calls and respects 24-call run ceiling", async () => {
    const { db } = openTestDb();
    const runId = "run-budget-test-01";
    for (let i = 0; i < QLOO_RUN_CALL_CEILING; i++) {
      const r = await reserveRunQlooCall({ db, runId });
      expect(r.ok).toBe(true);
    }
    const blocked = await reserveRunQlooCall({ db, runId });
    expect(blocked.ok).toBe(false);

    const client = new QlooClient();
    const members = ["member-aaaaaaa1", "member-aaaaaaa2", "member-aaaaaaa3"].map((id) => ({
      participantId: id,
      skipProfiling: false,
      seeds: [
        {
          entityId: "00000000-0000-4000-8000-0000000000a1",
          name: "Synthetic Artist Alpha",
          type: "urn:entity:artist" as const,
          confirmedAt: "2026-10-04T12:00:00.000Z",
        },
      ],
    }));
    const { db: db2 } = openTestDb();
    const out = await discoverBoundedCandidates({
      db: db2,
      client,
      members,
      raw: {
        eventId: "event-bbbbbbbb",
        runId: "run-bbbbbbbbbb",
        profiledMemberIds: members.map((m) => m.participantId),
        catalogEntityIds: catalog,
      },
    });
    expect(out.qlooCallsUsed).toBeLessThanOrEqual(3);
    expect(out.qlooCallsUsed).toBe(3);
  });

  it("rejects invalid location units / lon-lat order before provider call", async () => {
    const client = new QlooClient({ apiKey: "x" });
    const bad = await client.discoverPlaces({
      seedEntityIds: ["00000000-0000-4000-8000-0000000000a1"],
      catalogEntityIds: catalog,
      locationWkt: "POINT(40.7 -74.0)",
      radiusMeters: -5,
    });
    expect(bad.status).toBe("invalid");
    expect(bad.callCount).toBe(0);
  });
});
