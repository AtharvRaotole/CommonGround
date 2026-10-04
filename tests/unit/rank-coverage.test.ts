import { describe, expect, it } from "vitest";
import { RANK_COVERAGE_POLICY } from "../../packages/contracts/src/index";
import {
  affinitiesToOrdinalRanks,
  assertNoAffinitySatisfactionAverage,
  buildComparableRanks,
  freezeSubmittedSlate,
  orderByCompromise,
  toPublicRankDto,
} from "../../worker/src/planning/rank";

const v = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function slate(n: number): string[] {
  return Array.from({ length: n }, (_, i) => v(i + 1));
}

describe("P12 comparable rankings", () => {
  it("RANK-03: refuses raw affinity satisfaction averages", () => {
    expect(() =>
      assertNoAffinitySatisfactionAverage([{ [v(1)]: 0.9 }, { [v(1)]: 0.1 }]),
    ).toThrow(/must not be averaged/);
  });

  it("RANK-04: monotonic affinity transform preserves ordinal output", () => {
    const ids = slate(4);
    const base = { [ids[0]!]: 0.2, [ids[1]!]: 0.5, [ids[2]!]: 0.9, [ids[3]!]: 0.1 };
    const scaled: Record<string, number> = {};
    for (const id of ids) scaled[id] = Math.log1p(base[id]! * 10);
    const a = affinitiesToOrdinalRanks(ids, base);
    const b = affinitiesToOrdinalRanks(ids, scaled);
    for (const id of ids) expect(a.get(id)).toBe(b.get(id));
  });

  it("RANK-05: every profiled member shares the same frozen candidate universe", () => {
    const ids = slate(10);
    const frozen = freezeSubmittedSlate([...ids].reverse());
    expect(frozen).toEqual([...ids].sort((a, b) => a.localeCompare(b)));

    const result = buildComparableRanks({
      totalMemberCount: 2,
      candidateEntityIds: ids,
      memberRows: [
        {
          memberId: "member-aaaaaaa1",
          profiled: true,
          affinities: Object.fromEntries(ids.map((id, i) => [id, 1 - i * 0.05])),
          queryFingerprint: "q1",
        },
        {
          memberId: "member-aaaaaaa2",
          profiled: true,
          affinities: Object.fromEntries(ids.map((id, i) => [id, 0.1 + i * 0.05])),
          queryFingerprint: "q1",
        },
      ],
    });
    expect(result.submittedSlate).toEqual(frozen);
    expect(new Set(result.cells.map((c) => c.slateSize))).toEqual(new Set([10]));
  });

  it("RANK-06: ties use average rank and stable venue-id tie-break in compromise", () => {
    const ids = [v(1), v(2), v(3)];
    const ranks = affinitiesToOrdinalRanks(ids, {
      [ids[0]!]: 0.5,
      [ids[1]!]: 0.5,
      [ids[2]!]: 0.1,
    });
    expect(ranks.get(ids[0]!)).toBe(1.5);
    expect(ranks.get(ids[1]!)).toBe(1.5);
    expect(ranks.get(ids[2]!)).toBe(3);

    const cells = [
      {
        memberId: "member-aaaaaaa1",
        venueId: ids[0]!,
        rank: 1,
        slateSize: 2,
        status: "ranked" as const,
        queryFingerprint: "q",
        source: "qloo" as const,
      },
      {
        memberId: "member-aaaaaaa1",
        venueId: ids[1]!,
        rank: 2,
        slateSize: 2,
        status: "ranked" as const,
        queryFingerprint: "q",
        source: "qloo" as const,
      },
      {
        memberId: "member-aaaaaaa2",
        venueId: ids[0]!,
        rank: 2,
        slateSize: 2,
        status: "ranked" as const,
        queryFingerprint: "q",
        source: "qloo" as const,
      },
      {
        memberId: "member-aaaaaaa2",
        venueId: ids[1]!,
        rank: 1,
        slateSize: 2,
        status: "ranked" as const,
        queryFingerprint: "q",
        source: "qloo" as const,
      },
    ];
    // Equal max and mean → stable id order
    const ordered = orderByCompromise([ids[1]!, ids[0]!], cells, [
      "member-aaaaaaa1",
      "member-aaaaaaa2",
    ]);
    expect(ordered[0]).toBe(ids[0]!);
  });

  it("RANK-07: missing profiled response blocks; mixed mode requires all-member acceptance", () => {
    const ids = slate(10);
    const blocked = buildComparableRanks({
      totalMemberCount: 3,
      candidateEntityIds: ids,
      memberRows: [
        {
          memberId: "member-aaaaaaa1",
          profiled: true,
          affinities: Object.fromEntries(ids.map((id) => [id, 0.5])),
          queryFingerprint: "q",
        },
        {
          memberId: "member-aaaaaaa2",
          profiled: true,
          failed: true,
          affinities: {},
          queryFingerprint: "q",
        },
        {
          memberId: "member-aaaaaaa3",
          profiled: false,
          affinities: {},
          queryFingerprint: "skip",
        },
      ],
    });
    expect(blocked.status).toBe("blocked_profiled_failure");
    expect(blocked.publicSummary.requiresAllMemberAcceptance).toBe(true);
    expect(blocked.tasteMode).toBe("mixed");
  });

  it("AC02: coverage below gate → needs_input; host DTO has no private rank rows", () => {
    const ids = slate(5); // below 8 shared + can't hit 80% of large slate meaningfully
    const result = buildComparableRanks({
      totalMemberCount: 2,
      candidateEntityIds: ids,
      memberRows: [
        {
          memberId: "member-aaaaaaa1",
          profiled: true,
          affinities: Object.fromEntries(ids.map((id) => [id, 0.8])),
          queryFingerprint: "q",
        },
        {
          memberId: "member-aaaaaaa2",
          profiled: true,
          affinities: Object.fromEntries(ids.map((id) => [id, 0.4])),
          queryFingerprint: "q",
        },
      ],
    });
    expect(result.commonVenueIds.length).toBe(5);
    expect(result.commonVenueIds.length < RANK_COVERAGE_POLICY.minSharedFullyRanked).toBe(true);
    expect(result.status).toBe("needs_input");
    const pub = toPublicRankDto(result);
    expect(pub).not.toHaveProperty("cells");
    expect(JSON.stringify(pub)).not.toContain("member-aaaaaaa1");
  });

  it("AC01/AC03: missing affinities stay unknown; compromise never uses affinity means", () => {
    const ids = slate(10);
    const affinitiesA = Object.fromEntries(ids.map((id, i) => [id, 1 - i * 0.05]));
    const affinitiesB = { ...affinitiesA };
    delete affinitiesB[ids[9]!]; // B missing one → not in common set

    const result = buildComparableRanks({
      totalMemberCount: 2,
      candidateEntityIds: ids,
      memberRows: [
        {
          memberId: "member-aaaaaaa1",
          profiled: true,
          affinities: affinitiesA,
          queryFingerprint: "q",
        },
        {
          memberId: "member-aaaaaaa2",
          profiled: true,
          affinities: affinitiesB,
          queryFingerprint: "q",
        },
      ],
    });
    expect(result.commonVenueIds).not.toContain(ids[9]!);
    expect(result.cells.some((c) => c.venueId === ids[9]! && c.status === "missing")).toBe(true);
    // With 9 common of 10 → 90% but only 9 < 8? 9 >= 8 and 0.9 >= 0.8 → ok
    expect(result.status).toBe("ok");
    expect(result.compromiseVenueIds.length).toBe(9);
  });

  it("does not silently drop a person to improve coverage", () => {
    const ids = slate(10);
    const result = buildComparableRanks({
      totalMemberCount: 2,
      candidateEntityIds: ids,
      memberRows: [
        {
          memberId: "member-aaaaaaa1",
          profiled: true,
          affinities: Object.fromEntries(ids.map((id) => [id, 0.5])),
          queryFingerprint: "q",
        },
        {
          memberId: "member-aaaaaaa2",
          profiled: true,
          affinities: { [ids[0]!]: 0.9 }, // only one returned — coverage collapses
          queryFingerprint: "q",
        },
      ],
    });
    expect(result.profiledMemberCount).toBe(2);
    expect(result.commonVenueIds.length).toBe(1);
    expect(result.status).toBe("needs_input");
  });
});
