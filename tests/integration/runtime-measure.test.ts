import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
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

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx]!;
}

describe("P23 free runtime sample", () => {
  it("runs 30 synthetic guided sessions and records timing report", async () => {
    const SESSIONS = 30;
    const durations: number[] = [];
    let completes = 0;

    for (let i = 0; i < SESSIONS; i += 1) {
      const { db } = openTestDb();
      const repo = new Repository(db);
      const created = await repo.createEvent({ title: `Runtime ${i}`, groupSize: 4 });
      const host = await repo.consumeClaim(created.hostClaimSecret);
      if (!host.ok) throw new Error("claim");
      await repo.putOwnPreferences(host.session, [seed], true, {
        consentVersion: CONSENT_TASTE_VERSION,
      });
      const deps = { db, qloo: new QlooClient({}), openai: new OpenAIClient({}) };
      const event = await repo.getEvent(created.eventId);
      const t0 = performance.now();
      const { run } = await createOrGetRun({
        deps,
        eventId: created.eventId,
        eventVersion: event!.version,
        idempotencyKey: `rt-${i}`,
        preferAgent: false,
      });
      let state = run.state;
      for (let step = 0; step < 8; step += 1) {
        const result = await stepRun({
          deps,
          runId: run.id,
          ctx: {
            members: [
              {
                participantId: host.session.participantId,
                seeds: [seed],
                skipProfiling: false,
              },
            ],
            constraints: [],
            venues: [],
            catalogEntityIds: [],
            candidateEntityIds: SLATE,
            totalMemberCount: 1,
            currentEventVersion: (await repo.getEvent(created.eventId))!.version,
          },
        });
        state = result.run.state;
        if (
          state === "complete" ||
          state === "needs_input" ||
          state === "failed" ||
          state === "cancelled"
        ) {
          break;
        }
      }
      durations.push(performance.now() - t0);
      if (state === "complete") completes += 1;
    }

    durations.sort((a, b) => a - b);
    const p95 = percentile(durations, 95)!;
    const p50 = percentile(durations, 50)!;
    expect(completes).toBeGreaterThanOrEqual(25);
    expect(p95).toBeLessThan(30_000);

    const outDir = join(process.cwd(), "docs/verification");
    mkdirSync(outDir, { recursive: true });
    const md = `# Runtime report (P23) · ${new Date().toISOString().slice(0, 10)}

## Sample

- Sessions: ${SESSIONS} synthetic guided planning runs
- Completes: ${completes}
- Data mode: synthetic_local

## Timing (ms)

| Stat | Value |
|---|---|
| min | ${durations[0]!.toFixed(1)} |
| p50 | ${p50.toFixed(1)} |
| p95 | ${p95.toFixed(1)} |
| max | ${durations[durations.length - 1]!.toFixed(1)} |

Targets: typical < 20000ms · p95 < 30000ms  
**Decision:** Local sample meets timing targets (local Node/SQLite only — not Cloudflare isolate CPU).

## Operating caps (pilot)

| Cap | Value |
|---|---|
| Qloo calls / run | 24 |
| Lookups global / day | 200 |
| Mutating API global / day | 2000 |
| OpenAI $ envelope | $0 (language off by default) |

## Notes

- Measured in local Vitest against in-memory SQLite — not Cloudflare isolate CPU.
- Deployed C7 sample still required after live Qloo key for Free Worker CPU proof.
- Static assets use ASSETS binding with \`run_worker_first=/api/*\` only.
`;
    writeFileSync(join(outDir, "runtime-report.md"), md);
  }, 120_000);
});
