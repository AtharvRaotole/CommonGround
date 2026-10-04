import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeStudy, lowestMemberScore, type GroupOccasion } from "../../eval/analysis";
import { runEvaluation } from "../../eval/run";

describe("P24 evaluation harness", () => {
  it("AC03: known-diff fixture matches hand-calc (2 wins, median Δ 1.0)", () => {
    const fixture = JSON.parse(
      readFileSync(join(process.cwd(), "eval/fixtures/known-diff.json"), "utf8"),
    ) as { protocolVersion: string; occasions: GroupOccasion[] };
    const report = analyzeStudy({
      protocolVersion: fixture.protocolVersion,
      occasions: fixture.occasions,
      targetGroups: 12,
    });
    expect(report.wins).toBe(2);
    expect(report.losses).toBe(0);
    expect(report.medianPairedDelta).toBe(1);
    expect(report.groups.map((g) => g.groupId)).toEqual(["g1", "g2"]);
  });

  it("AC03: zero data yields incomplete — no uplift claim", () => {
    const report = runEvaluation({
      ratingsPath: join(process.cwd(), "eval/private/ratings.json"),
    });
    expect(report.enrolledGroups).toBe(0);
    expect(report.graduation).toBe("incomplete");
    expect(report.medianPairedDelta).toBeNull();
  });

  it("AC01: manifest freezes metric before outcomes", () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), "eval/manifest.json"), "utf8"),
    ) as {
      primaryMetric: string;
      forbiddenOutcomeProxies: string[];
      deviations: unknown[];
    };
    expect(manifest.primaryMetric).toBe("lowest_member_willingness_to_attend_1_to_5");
    expect(manifest.forbiddenOutcomeProxies).toContain("qloo_affinity_mean_increase");
    expect(Array.isArray(manifest.deviations)).toBe(true);
  });

  it("lowest member score is the primary metric unit", () => {
    expect(
      lowestMemberScore([
        [
          { venueId: "a", score: 4 },
          { venueId: "b", score: 5 },
        ],
        [{ venueId: "a", score: 2 }],
      ]),
    ).toBe(2);
  });
});
