import { describe, expect, it } from "vitest";
import { CONSENT_TASTE_VERSION, LOOKUP_CAPS, type ConfirmedSeed } from "../../packages/contracts/src";
import { Repository } from "../../worker/src/db/repository";
import { remainingLookups, reserveLookup, reserveRunQlooCall } from "../../worker/src/planning/budget";
import {
  cancelRun,
  createOrGetRun,
  stepRun,
} from "../../worker/src/planning/machine";
import { OpenAIClient } from "../../worker/src/providers/openai";
import { QlooClient } from "../../worker/src/providers/qloo";
import { openTestDb } from "../helpers/test-db";

const seed: ConfirmedSeed = {
  entityId: "00000000-0000-4000-8000-0000000000a1",
  name: "Synthetic Artist Alpha",
  type: "urn:entity:artist",
  confirmedAt: "2026-10-04T12:00:00.000Z",
};

/** Coverage gate requires ≥8 fully ranked venues. */
const SLATE = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
  "66666666-6666-4666-8666-666666666666",
  "77777777-7777-4777-8777-777777777777",
  "88888888-8888-4888-8888-888888888888",
];

async function bootstrap() {
  const { db } = openTestDb();
  const repo = new Repository(db);
  const created = await repo.createEvent({ title: "Machine night", groupSize: 4 });
  const claim = await repo.consumeClaim(created.hostClaimSecret);
  if (!claim.ok) throw new Error("host claim failed");
  const session = claim.session;
  await repo.putOwnPreferences(session, [seed], true, {
    consentVersion: CONSENT_TASTE_VERSION,
  });
  // Fresh version after prefs invalidation
  const event = await repo.getEvent(session.eventId);
  const deps = {
    db,
    qloo: new QlooClient({}),
    openai: new OpenAIClient({}),
  };
  return { db, repo, session, event: event!, deps, created };
}

describe("P15 bounded agent state machine", () => {
  it("FLOW-03: duplicate idempotency key returns same run", async () => {
    const { deps, session, event } = await bootstrap();
    const a = await createOrGetRun({
      deps,
      eventId: session.eventId,
      eventVersion: event.version,
      idempotencyKey: "idem-key-flow-03",
      preferAgent: false,
    });
    const b = await createOrGetRun({
      deps,
      eventId: session.eventId,
      eventVersion: event.version,
      idempotencyKey: "idem-key-flow-03",
      preferAgent: false,
    });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.run.id).toBe(a.run.id);
    expect(a.run.mode).toBe("guided");
  });

  it("FLOW-05: cancellation blocks future provider steps", async () => {
    const { deps, session, event } = await bootstrap();
    const { run } = await createOrGetRun({
      deps,
      eventId: session.eventId,
      eventVersion: event.version,
      idempotencyKey: "idem-cancel",
      preferAgent: false,
    });
    const cancelled = await cancelRun(deps, run.id);
    expect(cancelled?.state).toBe("cancelled");
    const stepped = await stepRun({
      deps,
      runId: run.id,
      ctx: {
        members: [{ participantId: session.participantId, seeds: [seed], skipProfiling: false }],
        constraints: [],
        venues: [],
        catalogEntityIds: [],
        candidateEntityIds: SLATE,
        totalMemberCount: 1,
        currentEventVersion: event.version,
      },
    });
    expect(stepped.run.state).toBe("cancelled");
  });

  it("FLOW-06: stale event version cannot continue", async () => {
    const { deps, session, event } = await bootstrap();
    const { run } = await createOrGetRun({
      deps,
      eventId: session.eventId,
      eventVersion: event.version,
      idempotencyKey: "idem-stale",
      preferAgent: false,
    });
    const stepped = await stepRun({
      deps,
      runId: run.id,
      ctx: {
        members: [{ participantId: session.participantId, seeds: [seed], skipProfiling: false }],
        constraints: [],
        venues: [],
        catalogEntityIds: [],
        candidateEntityIds: SLATE,
        totalMemberCount: 1,
        currentEventVersion: event.version + 99,
      },
    });
    expect(stepped.run.state).toBe("failed");
    expect(stepped.run.error_code).toBe("stale_version");
  });

  it("FLOW-01/02: constraint change invalidates approval; stale approve conflicts", async () => {
    const { repo, session, deps, event } = await bootstrap();
    const { run } = await createOrGetRun({
      deps,
      eventId: session.eventId,
      eventVersion: event.version,
      idempotencyKey: "idem-approve",
      preferAgent: false,
    });

    // Drive machine to completion with host-supplied slate.
    let current = run;
    for (let i = 0; i < 8; i += 1) {
      const step = await stepRun({
        deps,
        runId: current.id,
        ctx: {
          members: [{ participantId: session.participantId, seeds: [seed], skipProfiling: false }],
          constraints: [],
          venues: [],
          catalogEntityIds: [],
          candidateEntityIds: SLATE,
          totalMemberCount: 1,
          currentEventVersion: (await repo.getEvent(session.eventId))!.version,
        },
      });
      current = step.run;
      if (current.state === "complete") break;
    }
    expect(current.state).toBe("complete");
    const rev = await repo.latestRevision(session.eventId);
    expect(rev).toBeTruthy();
    await repo.putAcceptance(session, rev!.id, JSON.parse(rev!.venue_ids_json)[0]);
    const approved = await repo.approveRevision({
      session,
      revisionId: rev!.id,
      expectedVersion: (await repo.getEvent(session.eventId))!.version,
    });
    expect(approved.ok).toBe(true);

    // FLOW-01: constraint change invalidates export-ready
    await repo.putConstraint(session, {
      id: "constraint-budget-1",
      ownerId: session.participantId,
      kind: "budget",
      required: true,
      value: {
        maxCents: 5000,
        currency: "USD",
        includesTaxTipDrinks: "unknown",
      },
    });
    const active = await repo.getActiveApproval(session.eventId);
    expect(active).toBeNull();

    // FLOW-02: stale approval expectedVersion conflicts
    const stale = await repo.approveRevision({
      session,
      revisionId: rev!.id,
      expectedVersion: 1,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.reason).toBe("conflict");
  });

  it("FLOW-04: concurrent budget reservations never exceed global cap", async () => {
    const { db } = openTestDb();
    const eventId = "event-budget-bbbb";
    // Distinct members so the global day cap (not per-member) is the binding limit.
    const results = await Promise.all(
      Array.from({ length: LOOKUP_CAPS.globalDay + 40 }, (_, i) =>
        reserveLookup({ db, memberId: `member-budget-${String(i).padStart(4, "0")}`, eventId }),
      ),
    );
    const ok = results.filter((r) => r.ok).length;
    expect(ok).toBeLessThanOrEqual(LOOKUP_CAPS.globalDay);
    const day = new Date().toISOString().slice(0, 10);
    const global = await db
      .prepare(
        `SELECT count FROM usage_daily WHERE scope = 'global' AND scope_id = 'app' AND day = ? AND kind = 'lookup'`,
      )
      .bind(day)
      .first<{ count: number }>();
    expect(Number(global?.count ?? 0)).toBeLessThanOrEqual(LOOKUP_CAPS.globalDay);
  });

  it("AC02: run qloo ceiling includes reserved calls; cannot bypass via extra steps", async () => {
    const { deps } = await bootstrap();
    const runId = "run-ceiling-test-01";
    for (let i = 0; i < 24; i += 1) {
      const r = await reserveRunQlooCall({ db: deps.db, runId });
      expect(r.ok).toBe(true);
    }
    const over = await reserveRunQlooCall({ db: deps.db, runId });
    expect(over.ok).toBe(false);
  });

  it("AC03: guided mode never invents approve/send/book from model output", async () => {
    const { deps, session, event } = await bootstrap();
    const { run } = await createOrGetRun({
      deps,
      eventId: session.eventId,
      eventVersion: event.version,
      idempotencyKey: "idem-guided",
      preferAgent: true, // no OpenAI key → guided
    });
    expect(run.mode).toBe("guided");
    const openai = new OpenAIClient({
      apiKey: "test",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({ name: "approve", args: {} }),
                },
              },
            ],
          }),
        ),
    });
    const choice = await openai.chooseTool({ state: "explaining" });
    // "approve" is not an allowlisted tool → invalid
    expect(choice.status === "invalid" || choice.status === "unavailable").toBe(true);
  });
});
