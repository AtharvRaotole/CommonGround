import { describe, expect, it } from "vitest";
import { mergeModelExplanation, buildTemplateExplanations } from "../../worker/src/planning/explanations";
import { cancelRun, createOrGetRun, stepRun } from "../../worker/src/planning/machine";
import { reserveRunQlooCall } from "../../worker/src/planning/budget";
import { OpenAIClient } from "../../worker/src/providers/openai";
import { QlooClient } from "../../worker/src/providers/qloo";
import { Repository } from "../../worker/src/db/repository";
import { QLOO_RUN_CALL_CEILING, type ConfirmedSeed } from "../../packages/contracts/src";
import { openTestDb } from "../helpers/test-db";

const seed: ConfirmedSeed = {
  entityId: "00000000-0000-4000-8000-0000000000a1",
  name: "Synthetic Artist Alpha",
  type: "urn:entity:artist",
  confirmedAt: "2026-10-04T12:00:00.000Z",
};

describe("P22 provider fault rehearsal", () => {
  it("OPS-01: Qloo 401/429/500 yield non-ok live statuses (no success banner path)", async () => {
    for (const status of [401, 403, 429, 500]) {
      const client = new QlooClient({
        apiKey: "demo",
        forceStatus: status,
        fetchImpl: async () => new Response("{}", { status: 200 }),
      });
      const search = await client.searchEntities({ query: "alpha" });
      expect(search.dataMode).toBe("live");
      expect(search.status).not.toBe("ok");
      const score = await client.scoreCommonSlate({
        seedEntityIds: [seed.entityId],
        candidateEntityIds: ["11111111-1111-4111-8111-111111111111"],
      });
      expect(score.status).not.toBe("ok");
      expect(score.dataMode).toBe("live");
    }
  });

  it("OPS-02/LLM: OpenAI failure keeps template; never live-success claim", async () => {
    const template = buildTemplateExplanations({
      alternatives: [
        {
          venueId: "v1",
          role: "best_compromise",
          worstMemberRank: 2,
          meanMemberRank: 2,
          explanation: "Lowest worst-member rank.",
        },
      ],
      factsByVenueId: {},
      allowedEvidenceIds: new Set(),
      mixedTaste: false,
      profiledCount: 1,
      totalCount: 1,
    })[0]!;
    const openai = new OpenAIClient({
      apiKey: "demo",
      fetchImpl: async () => new Response("{}", { status: 503 }),
    });
    const polish = await openai.polishExplanation({
      template,
      allowedVenueIds: ["v1"],
      allowedEvidenceIds: [],
    });
    expect(polish.status).toBe("unavailable");
    const merged = mergeModelExplanation({
      template,
      model: { venueId: "v1", role: "best_compromise", clauses: [], source: "openai" },
      allowedVenueIds: new Set(["v1"]),
      allowedEvidenceIds: new Set(),
    });
    expect(merged.source).toBe("template");
  });

  it("OPS-03/AC03: exhausted run budget fails closed; cancel blocks later steps", async () => {
    const { db } = openTestDb();
    const repo = new Repository(db);
    const created = await repo.createEvent({ title: "Fault", groupSize: 4 });
    const host = await repo.consumeClaim(created.hostClaimSecret);
    if (!host.ok) throw new Error("host");
    const deps = { db, qloo: new QlooClient({}), openai: new OpenAIClient({}) };
    const event = await repo.getEvent(created.eventId);
    const { run } = await createOrGetRun({
      deps,
      eventId: created.eventId,
      eventVersion: event!.version,
      idempotencyKey: "fault-budget",
      preferAgent: false,
    });
    for (let i = 0; i < QLOO_RUN_CALL_CEILING; i += 1) {
      expect((await reserveRunQlooCall({ db, runId: run.id })).ok).toBe(true);
    }
    expect((await reserveRunQlooCall({ db, runId: run.id })).ok).toBe(false);

    await cancelRun(deps, run.id);
    const stepped = await stepRun({
      deps,
      runId: run.id,
      ctx: {
        members: [{ participantId: host.session.participantId, seeds: [seed], skipProfiling: false }],
        constraints: [],
        venues: [],
        catalogEntityIds: [],
        candidateEntityIds: ["11111111-1111-4111-8111-111111111111"],
        totalMemberCount: 1,
        currentEventVersion: event!.version,
      },
    });
    expect(stepped.run.state).toBe("cancelled");
  });

  it("AC02: synthetic client path stays labeled synthetic", async () => {
    const client = new QlooClient({});
    const search = await client.searchEntities({ query: "alpha" });
    expect(search.dataMode).toBe("synthetic");
  });
});
