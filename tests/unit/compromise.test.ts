import { describe, expect, it } from "vitest";
import type { RankCell } from "../../packages/contracts/src/index";
import {
  assertHonestCompromiseCopy,
  COMPROMISE_POLICY,
  selectCompromiseAlternatives,
  sortByCompromise,
  sortByMeanRank,
} from "../../worker/src/planning/compromise";
import {
  affinitiesToOrdinalRanks,
  buildComparableRanks,
  orderByCompromise,
} from "../../worker/src/planning/rank";

const A = "00000000-0000-4000-8000-0000000000aa";
const B = "00000000-0000-4000-8000-0000000000bb";
const C = "00000000-0000-4000-8000-0000000000cc";
const D = "00000000-0000-4000-8000-0000000000dd";

const members = ["member-aaaaaaa1", "member-aaaaaaa2", "member-aaaaaaa3", "member-aaaaaaa4"];

function cellsFromMatrix(
  venueIds: string[],
  matrix: number[][], // members × venues ranks
): RankCell[] {
  const cells: RankCell[] = [];
  for (let mi = 0; mi < members.length; mi++) {
    for (let vi = 0; vi < venueIds.length; vi++) {
      cells.push({
        memberId: members[mi]!,
        venueId: venueIds[vi]!,
        rank: matrix[mi]![vi]!,
        slateSize: venueIds.length,
        status: "ranked",
        queryFingerprint: "hand-calc",
        source: "qloo",
      });
    }
  }
  return cells;
}

describe("P14 compromise policy", () => {
  it("AC01 hand-calc: [1,1,1,12] loses compromise to [5,5,5,5]; wins mean-rank alternative", () => {
    // Columns are venues A,B for four members.
    // A = [1,1,1,12] → worst 12, mean 3.75
    // B = [5,5,5,5] → worst 5, mean 5
    const cells = cellsFromMatrix(
      [A, B],
      [
        [1, 5],
        [1, 5],
        [1, 5],
        [12, 5],
      ],
    );
    const selection = selectCompromiseAlternatives({
      venueIds: [A, B],
      cells,
      profiledMemberIds: members,
    });
    expect(selection.alternatives[0]?.role).toBe("best_compromise");
    expect(selection.alternatives[0]?.venueId).toBe(B);
    expect(selection.alternatives[1]?.role).toBe("mean_rank_alternative");
    expect(selection.alternatives[1]?.venueId).toBe(A);
  });

  it("RANK-01: hard-vetoed venue never appears in alternatives", () => {
    const cells = cellsFromMatrix(
      [A, B],
      [
        [1, 2],
        [1, 2],
        [1, 2],
        [1, 2],
      ],
    );
    const selection = selectCompromiseAlternatives({
      venueIds: [A, B],
      cells,
      profiledMemberIds: members,
      vetoedVenueIds: [A],
    });
    expect(selection.alternatives.map((a) => a.venueId)).not.toContain(A);
    expect(selection.alternatives[0]?.venueId).toBe(B);
  });

  it("RANK-02/AC02: permuting participant order does not change ordering", () => {
    const cells = cellsFromMatrix(
      [A, B, C],
      [
        [1, 2, 3],
        [2, 1, 3],
        [3, 2, 1],
        [2, 3, 1],
      ],
    );
    const forward = orderByCompromise([A, B, C], cells, members);
    const backward = orderByCompromise([C, A, B], cells, [...members].reverse());
    expect(forward).toEqual(backward);
  });

  it("AC02: identical inputs + policy version → identical venue ordering", () => {
    const cells = cellsFromMatrix(
      [A, B, C],
      [
        [1, 3, 2],
        [2, 1, 3],
        [3, 2, 1],
        [1, 2, 3],
      ],
    );
    const once = selectCompromiseAlternatives({
      venueIds: [C, A, B],
      cells,
      profiledMemberIds: [...members].reverse(),
      suitabilityByVenueId: { [A]: 1, [B]: 1, [C]: 1 },
    });
    const twice = selectCompromiseAlternatives({
      venueIds: [B, C, A],
      cells,
      profiledMemberIds: members,
      suitabilityByVenueId: { [A]: 1, [B]: 1, [C]: 1 },
    });
    expect(once.policyVersion).toBe(COMPROMISE_POLICY.version);
    expect(once.alternatives.map((a) => a.venueId)).toEqual(
      twice.alternatives.map((a) => a.venueId),
    );
    expect(once.alternatives.map((a) => a.role)).toEqual(twice.alternatives.map((a) => a.role));
  });

  it("familiar fallback only when familiarity inputs justify the label", () => {
    const cells = cellsFromMatrix(
      [A, B, C],
      [
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3],
      ],
    );
    const without = selectCompromiseAlternatives({
      venueIds: [A, B, C],
      cells,
      profiledMemberIds: members,
    });
    expect(without.alternatives.some((a) => a.role === "familiar_fallback")).toBe(false);
    expect(without.alternatives.length).toBeLessThanOrEqual(2);

    const withFamiliar = selectCompromiseAlternatives({
      venueIds: [A, B, C],
      cells,
      profiledMemberIds: members,
      familiarVenueIds: [C],
    });
    expect(withFamiliar.alternatives.some((a) => a.role === "familiar_fallback")).toBe(true);
    expect(withFamiliar.alternatives.find((a) => a.role === "familiar_fallback")?.venueId).toBe(C);
    expect(withFamiliar.alternatives).toHaveLength(3);
  });

  it("shows fewer than three when fewer are supported; keeps results unique", () => {
    const one = cellsFromMatrix([A], [[1], [1], [1], [1]]);
    const selection = selectCompromiseAlternatives({
      venueIds: [A],
      cells: one,
      profiledMemberIds: members,
      familiarVenueIds: [A],
    });
    expect(selection.alternatives).toHaveLength(1);
    expect(new Set(selection.alternatives.map((a) => a.venueId)).size).toBe(1);
  });

  it("all-veto yields empty alternatives", () => {
    const cells = cellsFromMatrix(
      [A, B],
      [
        [1, 2],
        [1, 2],
        [1, 2],
        [1, 2],
      ],
    );
    const selection = selectCompromiseAlternatives({
      venueIds: [A, B],
      cells,
      profiledMemberIds: members,
      vetoedVenueIds: [A, B],
    });
    expect(selection.alternatives).toEqual([]);
  });

  it("candidate-set change changes ordering when ranks differ", () => {
    const full = cellsFromMatrix(
      [A, B, C],
      [
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3],
      ],
    );
    const withC = orderByCompromise([A, B, C], full, members);
    const withoutC = orderByCompromise([A, B], full, members);
    expect(withC[0]).toBe(A);
    expect(withoutC[0]).toBe(A);
    expect(withC).toContain(C);
    expect(withoutC).not.toContain(C);
  });

  it("exact ties break by suitability then stable venue id", () => {
    const scores = sortByCompromise([
      { venueId: B, worstRank: 2, meanRank: 2, suitability: 0 },
      { venueId: A, worstRank: 2, meanRank: 2, suitability: 0 },
      { venueId: C, worstRank: 2, meanRank: 2, suitability: 3 },
    ]);
    expect(scores[0]?.venueId).toBe(C);
    expect(scores[1]?.venueId).toBe(A);
    expect(scores[2]?.venueId).toBe(B);
  });

  it("RANK-04 style: monotonic affinity transform keeps compromise order", () => {
    const ids = [A, B, D];
    const base = { [A]: 0.9, [B]: 0.5, [D]: 0.1 };
    const scaled = { [A]: 0.99, [B]: 0.55, [D]: 0.11 };
    const members2 = ["member-aaaaaaa1", "member-aaaaaaa2"];
    const rows = (affinities: Record<string, number>) => [
      {
        memberId: members2[0]!,
        profiled: true,
        affinities,
        queryFingerprint: "q",
      },
      {
        memberId: members2[1]!,
        profiled: true,
        affinities: { [A]: affinities[A]! - 0.05, [B]: affinities[B]!, [D]: affinities[D]! + 0.05 },
        queryFingerprint: "q",
      },
    ];
    // Pad slate to pass coverage gate with 10 venues of matching ranks
    const pad = Array.from({ length: 7 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i + 20).padStart(12, "0")}`,
    );
    const slate = [...ids, ...pad];
    const expand = (aff: Record<string, number>) => {
      const out = { ...aff };
      for (const id of pad) out[id] = 0.01;
      return out;
    };
    const r1 = buildComparableRanks({
      totalMemberCount: 2,
      candidateEntityIds: slate,
      memberRows: rows(expand(base)),
    });
    const r2 = buildComparableRanks({
      totalMemberCount: 2,
      candidateEntityIds: slate,
      memberRows: rows(expand(scaled)),
    });
    expect(r1.compromiseVenueIds).toEqual(r2.compromiseVenueIds);
    expect(affinitiesToOrdinalRanks(ids, base).get(A)).toBe(
      affinitiesToOrdinalRanks(ids, scaled).get(A),
    );
  });

  it("AC03: explanations avoid percent-likelihood and fairness guarantees", () => {
    const cells = cellsFromMatrix(
      [A, B],
      [
        [1, 5],
        [1, 5],
        [1, 5],
        [12, 5],
      ],
    );
    const selection = selectCompromiseAlternatives({
      venueIds: [A, B],
      cells,
      profiledMemberIds: members,
      familiarVenueIds: [A],
    });
    for (const alt of selection.alternatives) {
      expect(() => assertHonestCompromiseCopy(alt.explanation)).not.toThrow();
      expect(alt.explanation).toMatch(/ordinal|relative/i);
      expect(alt.explanation).not.toMatch(/%/);
    }
    for (const line of selection.limitations) {
      expect(() => assertHonestCompromiseCopy(line)).not.toThrow();
    }
  });

  it("host public summary never includes individual rank vectors", () => {
    const pad = Array.from({ length: 10 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    );
    const result = buildComparableRanks({
      totalMemberCount: 2,
      candidateEntityIds: pad,
      memberRows: [
        {
          memberId: "member-aaaaaaa1",
          profiled: true,
          affinities: Object.fromEntries(pad.map((id, i) => [id, 1 - i * 0.05])),
          queryFingerprint: "q",
        },
        {
          memberId: "member-aaaaaaa2",
          profiled: true,
          affinities: Object.fromEntries(pad.map((id, i) => [id, 0.2 + i * 0.05])),
          queryFingerprint: "q",
        },
      ],
      familiarVenueIds: [pad[9]!],
    });
    expect(result.status).toBe("ok");
    expect(result.alternatives.length).toBeGreaterThanOrEqual(2);
    const json = JSON.stringify(result.publicSummary);
    expect(json).not.toContain("member-aaaaaaa1");
    expect(json).not.toContain('"cells"');
    expect(result.publicSummary.compromisePolicyVersion).toBe(COMPROMISE_POLICY.version);
  });

  it("mean-rank sort differs from compromise sort on the classic matrix", () => {
    const scores = [
      { venueId: A, worstRank: 12, meanRank: 3.75, suitability: 0 },
      { venueId: B, worstRank: 5, meanRank: 5, suitability: 0 },
    ];
    expect(sortByCompromise(scores)[0]?.venueId).toBe(B);
    expect(sortByMeanRank(scores)[0]?.venueId).toBe(A);
  });
});
