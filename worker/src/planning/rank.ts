import { RANK_COVERAGE_POLICY, type RankCell } from "@common-ground/contracts";
import {
  COMPROMISE_POLICY,
  selectCompromiseAlternatives,
  sortByCompromise,
  type CompromiseAlternative,
} from "./compromise";

export type MemberScoreRow = {
  memberId: string;
  /** Opted into taste profiling with seeds. */
  profiled: boolean;
  /** Provider call failed for a profiled member — blocks the run. */
  failed?: boolean;
  /**
   * Affinity by venue entity id for this member's query only.
   * Absent keys are unknown — never treated as zero.
   */
  affinities: Record<string, number>;
  queryFingerprint: string;
  source?: "qloo" | "explicit_preference";
};

export type RankBuildResult = {
  status: "ok" | "blocked_profiled_failure" | "needs_input" | "empty";
  tasteMode: "full" | "mixed";
  profiledMemberCount: number;
  totalMemberCount: number;
  submittedSlate: string[];
  /** Venues ranked for every profiled member. */
  commonVenueIds: string[];
  coverageRatio: number;
  cells: RankCell[];
  /** Compromise order using ordinal ranks only (never raw affinity averages). */
  compromiseVenueIds: string[];
  alternatives: CompromiseAlternative[];
  /** Host-safe summary — no per-member private rank rows. */
  publicSummary: {
    tasteMode: "full" | "mixed";
    profiledMemberCount: number;
    totalMemberCount: number;
    submittedSlateSize: number;
    commonFullyRankedCount: number;
    coverageRatio: number;
    readiness: "ready_for_host_review" | "needs_input" | "blocked";
    compromiseVenueIds: string[];
    alternatives: CompromiseAlternative[];
    limitations: readonly string[];
    requiresAllMemberAcceptance: true;
    policyVersion: string;
    compromisePolicyVersion: string;
  };
};

/**
 * Convert per-query affinities into ordinal ranks on the submitted slate.
 * Ties receive average rank. Missing affinities stay null (unknown), never 0.
 */
export function affinitiesToOrdinalRanks(
  submittedSlate: string[],
  affinities: Record<string, number>,
): Map<string, number | null> {
  const known = submittedSlate
    .filter((id) => typeof affinities[id] === "number" && Number.isFinite(affinities[id]))
    .map((id) => ({ id, affinity: affinities[id]! }));

  known.sort((a, b) => {
    if (b.affinity !== a.affinity) return b.affinity - a.affinity;
    return a.id.localeCompare(b.id);
  });

  const ranks = new Map<string, number | null>();
  for (const id of submittedSlate) ranks.set(id, null);

  let i = 0;
  while (i < known.length) {
    let j = i + 1;
    while (j < known.length && known[j]!.affinity === known[i]!.affinity) j += 1;
    // Average of 1-based positions i+1 .. j
    const avg = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) ranks.set(known[k]!.id, avg);
    i = j;
  }
  return ranks;
}

export function freezeSubmittedSlate(candidateEntityIds: string[]): string[] {
  const unique = [...new Set(candidateEntityIds.filter(Boolean))];
  unique.sort((a, b) => a.localeCompare(b));
  return unique.slice(0, RANK_COVERAGE_POLICY.maxSlateSize);
}

/**
 * Build comparable per-member ranks on one frozen slate.
 * RANK-03: never averages raw affinities across members for satisfaction.
 * RANK-07: failed profiled query blocks; mixed mode is explicit.
 */
export function buildComparableRanks(input: {
  memberRows: MemberScoreRow[];
  candidateEntityIds: string[];
  totalMemberCount: number;
  suitabilityByVenueId?: Record<string, number>;
  familiarVenueIds?: string[];
  vetoedVenueIds?: string[];
}): RankBuildResult {
  const submittedSlate = freezeSubmittedSlate(input.candidateEntityIds);
  const profiled = input.memberRows.filter((m) => m.profiled);
  const optedOut = input.memberRows.filter((m) => !m.profiled);
  const tasteMode: "full" | "mixed" =
    optedOut.length > 0 || profiled.length < input.totalMemberCount ? "mixed" : "full";

  if (!submittedSlate.length) {
    return emptyResult(tasteMode, profiled.length, input.totalMemberCount, submittedSlate);
  }

  if (profiled.some((m) => m.failed)) {
    return {
      status: "blocked_profiled_failure",
      tasteMode,
      profiledMemberCount: profiled.length,
      totalMemberCount: input.totalMemberCount,
      submittedSlate,
      commonVenueIds: [],
      coverageRatio: 0,
      cells: [],
      compromiseVenueIds: [],
      alternatives: [],
      publicSummary: {
        tasteMode,
        profiledMemberCount: profiled.length,
        totalMemberCount: input.totalMemberCount,
        submittedSlateSize: submittedSlate.length,
        commonFullyRankedCount: 0,
        coverageRatio: 0,
        readiness: "blocked",
        compromiseVenueIds: [],
        alternatives: [],
        limitations: COMPROMISE_POLICY.limitations,
        requiresAllMemberAcceptance: true,
        policyVersion: RANK_COVERAGE_POLICY.version,
        compromisePolicyVersion: COMPROMISE_POLICY.version,
      },
    };
  }

  const cells: RankCell[] = [];
  for (const row of input.memberRows) {
    if (!row.profiled) {
      for (const venueId of submittedSlate) {
        cells.push({
          memberId: row.memberId,
          venueId,
          rank: null,
          slateSize: submittedSlate.length,
          status: "opted_out",
          queryFingerprint: row.queryFingerprint,
          source: row.source ?? "explicit_preference",
        });
      }
      continue;
    }
    const ranks = affinitiesToOrdinalRanks(submittedSlate, row.affinities);
    for (const venueId of submittedSlate) {
      const rank = ranks.get(venueId) ?? null;
      cells.push({
        memberId: row.memberId,
        venueId,
        rank,
        slateSize: submittedSlate.length,
        status: rank == null ? "missing" : "ranked",
        queryFingerprint: row.queryFingerprint,
        source: row.source ?? "qloo",
      });
    }
  }

  // Common set: ranked for every profiled member (missing ⇒ excluded).
  const commonVenueIds = submittedSlate.filter((venueId) =>
    profiled.every((m) => {
      const cell = cells.find((c) => c.memberId === m.memberId && c.venueId === venueId);
      return cell?.status === "ranked" && cell.rank != null;
    }),
  );

  const coverageRatio =
    submittedSlate.length === 0 ? 0 : commonVenueIds.length / submittedSlate.length;

  const gateOk =
    commonVenueIds.length >= RANK_COVERAGE_POLICY.minSharedFullyRanked &&
    coverageRatio + 1e-9 >= RANK_COVERAGE_POLICY.minSubmittedCoverage;

  const profiledIds = profiled.map((m) => m.memberId);
  // When the hard coverage gate fails but we still have a usable common set, produce a
  // shortlist for host review with readiness=needs_input (honest — not a full pass).
  const shortlistVenueIds =
    gateOk
      ? commonVenueIds
      : commonVenueIds.length >= 3
        ? commonVenueIds
        : [];

  const selection = shortlistVenueIds.length
    ? selectCompromiseAlternatives({
        venueIds: shortlistVenueIds,
        cells,
        profiledMemberIds: profiledIds,
        suitabilityByVenueId: input.suitabilityByVenueId,
        familiarVenueIds: input.familiarVenueIds,
        vetoedVenueIds: input.vetoedVenueIds,
      })
    : {
        policyVersion: COMPROMISE_POLICY.version,
        alternatives: [] as CompromiseAlternative[],
        limitations: COMPROMISE_POLICY.limitations,
      };

  const compromiseVenueIds = shortlistVenueIds.length
    ? orderByCompromise(shortlistVenueIds, cells, profiledIds, input.suitabilityByVenueId)
    : [];

  const status: RankBuildResult["status"] = !profiled.length
    ? "needs_input"
    : gateOk
      ? "ok"
      : shortlistVenueIds.length
        ? "needs_input"
        : "needs_input";

  const readiness: RankBuildResult["publicSummary"]["readiness"] =
    status === "ok" ? "ready_for_host_review" : "needs_input";

  return {
    status,
    tasteMode,
    profiledMemberCount: profiled.length,
    totalMemberCount: input.totalMemberCount,
    submittedSlate,
    commonVenueIds,
    coverageRatio,
    cells,
    compromiseVenueIds,
    alternatives: selection.alternatives,
    publicSummary: {
      tasteMode,
      profiledMemberCount: profiled.length,
      totalMemberCount: input.totalMemberCount,
      submittedSlateSize: submittedSlate.length,
      commonFullyRankedCount: commonVenueIds.length,
      coverageRatio,
      readiness,
      compromiseVenueIds,
      alternatives: selection.alternatives,
      limitations: selection.limitations,
      requiresAllMemberAcceptance: true,
      policyVersion: RANK_COVERAGE_POLICY.version,
      compromisePolicyVersion: COMPROMISE_POLICY.version,
    },
  };
}

/**
 * Disclosed compromise order: minimize worst ordinal rank, then mean rank,
 * then host suitability, then stable venue id. Ranks only — never affinity arithmetic.
 */
export function orderByCompromise(
  venueIds: string[],
  cells: RankCell[],
  profiledMemberIds: string[],
  suitabilityByVenueId?: Record<string, number>,
): string[] {
  const scored = venueIds.map((venueId) => {
    const ranks = profiledMemberIds.map((memberId) => {
      const cell = cells.find((c) => c.memberId === memberId && c.venueId === venueId);
      return cell?.rank;
    });
    if (ranks.some((r) => r == null)) {
      return {
        venueId,
        worstRank: Number.POSITIVE_INFINITY,
        meanRank: Number.POSITIVE_INFINITY,
        suitability: suitabilityByVenueId?.[venueId] ?? 0,
      };
    }
    const nums = ranks as number[];
    return {
      venueId,
      worstRank: Math.max(...nums),
      meanRank: nums.reduce((a, b) => a + b, 0) / nums.length,
      suitability: suitabilityByVenueId?.[venueId] ?? 0,
    };
  });
  return sortByCompromise(scored).map((s) => s.venueId);
}

/** Host DTO must never include private per-member rank rows. */
export function toPublicRankDto(result: RankBuildResult): RankBuildResult["publicSummary"] {
  return { ...result.publicSummary };
}

/** RANK-03 guard: refuse any caller that tries to average raw affinities. */
export function assertNoAffinitySatisfactionAverage(_affinitiesByMember: Record<string, number>[]): never {
  throw new Error(
    "Raw Qloo affinities from separate queries must not be averaged as satisfaction. Use ordinal ranks on a common slate.",
  );
}

function emptyResult(
  tasteMode: "full" | "mixed",
  profiledMemberCount: number,
  totalMemberCount: number,
  submittedSlate: string[],
): RankBuildResult {
  return {
    status: "empty",
    tasteMode,
    profiledMemberCount,
    totalMemberCount,
    submittedSlate,
    commonVenueIds: [],
    coverageRatio: 0,
    cells: [],
    compromiseVenueIds: [],
    alternatives: [],
    publicSummary: {
      tasteMode,
      profiledMemberCount,
      totalMemberCount,
      submittedSlateSize: submittedSlate.length,
      commonFullyRankedCount: 0,
      coverageRatio: 0,
      readiness: "needs_input",
      compromiseVenueIds: [],
      alternatives: [],
      limitations: COMPROMISE_POLICY.limitations,
      requiresAllMemberAcceptance: true,
      policyVersion: RANK_COVERAGE_POLICY.version,
      compromisePolicyVersion: COMPROMISE_POLICY.version,
    },
  };
}
