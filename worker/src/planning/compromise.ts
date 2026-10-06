import type { RankCell } from "@common-ground/contracts";

/** Versioned compromise policy — change only with a decision record. */
export const COMPROMISE_POLICY = {
  version: "2026-10-04-v1",
  maxAlternatives: 3,
  /** Honest limitations shown with every shortlist. */
  limitations: [
    "Ordinal ranks lose preference intensity — a 1st vs 2nd gap is not measured.",
    "Equal weight across profiled members is a disclosed design choice, not proven fairness.",
    "Results are relative compromises on one slate, not calibrated happiness or visit likelihood.",
    "Participant acceptance can override the algorithm’s top result.",
  ],
} as const;

export type AlternativeRole = "best_compromise" | "mean_rank_alternative" | "familiar_fallback";

export type VenueScore = {
  venueId: string;
  worstRank: number;
  meanRank: number;
  suitability: number;
};

export type CompromiseAlternative = {
  venueId: string;
  role: AlternativeRole;
  worstMemberRank: number;
  meanMemberRank: number;
  /** Host-safe aggregate copy — never individual rank vectors. */
  explanation: string;
};

export type CompromiseSelection = {
  policyVersion: string;
  alternatives: CompromiseAlternative[];
  limitations: readonly string[];
};

function ranksForVenue(
  venueId: string,
  cells: RankCell[],
  profiledMemberIds: string[],
): number[] | null {
  const ranks = profiledMemberIds.map((memberId) => {
    const cell = cells.find((c) => c.memberId === memberId && c.venueId === venueId);
    return cell?.rank;
  });
  if (ranks.some((r) => r == null)) return null;
  return ranks as number[];
}

export function scoreVenues(input: {
  venueIds: string[];
  cells: RankCell[];
  profiledMemberIds: string[];
  suitabilityByVenueId?: Record<string, number>;
}): VenueScore[] {
  const out: VenueScore[] = [];
  if (!input.profiledMemberIds.length) return out;
  for (const venueId of input.venueIds) {
    const ranks = ranksForVenue(venueId, input.cells, input.profiledMemberIds);
    if (!ranks?.length) continue;
    out.push({
      venueId,
      worstRank: Math.max(...ranks),
      meanRank: ranks.reduce((a, b) => a + b, 0) / ranks.length,
      suitability: input.suitabilityByVenueId?.[venueId] ?? 0,
    });
  }
  return out;
}

/** Primary sort: lowest worst-member rank, then mean, then higher suitability, then stable id. */
export function sortByCompromise(scores: VenueScore[]): VenueScore[] {
  return [...scores].sort((a, b) => {
    if (a.worstRank !== b.worstRank) return a.worstRank - b.worstRank;
    if (a.meanRank !== b.meanRank) return a.meanRank - b.meanRank;
    if (a.suitability !== b.suitability) return b.suitability - a.suitability;
    return a.venueId.localeCompare(b.venueId);
  });
}

/** Secondary sort: lowest mean rank, then worst, suitability, id — for the mean-rank alternative. */
export function sortByMeanRank(scores: VenueScore[]): VenueScore[] {
  return [...scores].sort((a, b) => {
    if (a.meanRank !== b.meanRank) return a.meanRank - b.meanRank;
    if (a.worstRank !== b.worstRank) return a.worstRank - b.worstRank;
    if (a.suitability !== b.suitability) return b.suitability - a.suitability;
    return a.venueId.localeCompare(b.venueId);
  });
}

function explainCompromise(score: VenueScore, slateSize: number, role: AlternativeRole): string {
  if (!Number.isFinite(score.worstRank) || !Number.isFinite(score.meanRank) || slateSize < 1) {
    return "Relative taste ranking unavailable for this slate — profiled members or ranks are missing. This is not a calibrated likelihood.";
  }
  const worst = formatOrdinal(score.worstRank);
  const mean = score.meanRank.toFixed(2);
  if (role === "best_compromise") {
    return `Balances everyone's relative taste ranking on this slate. The worst relative position among profiled members is ${worst} of ${slateSize} (mean rank ${mean}). This is an ordinal compromise — not a percent likelihood or a fairness guarantee.`;
  }
  if (role === "mean_rank_alternative") {
    return `Mean-rank alternative: lower average relative position (mean rank ${mean}) while accepting a worse worst-case (${worst} of ${slateSize}). Still ordinal — not calibrated satisfaction.`;
  }
  return `Familiar fallback justified by an explicit prior visit or participant-provided familiarity — not popularity alone. Worst relative position ${worst} of ${slateSize}.`;
}

function formatOrdinal(n: number): string {
  if (!Number.isFinite(n)) return "unknown";
  if (Number.isInteger(n)) return `${n}`;
  return n.toFixed(1);
}

/**
 * Build up to three distinct alternatives:
 * 1) best compromise (min worst rank)
 * 2) mean-rank alternative when it differs
 * 3) familiar fallback only when familiarity inputs justify the label
 *
 * Show fewer than three when fewer are supported. Never invent venues.
 */
export function selectCompromiseAlternatives(input: {
  venueIds: string[];
  cells: RankCell[];
  profiledMemberIds: string[];
  suitabilityByVenueId?: Record<string, number>;
  /** Explicit prior visit / participant-stated familiarity only. */
  familiarVenueIds?: string[];
  /** Hard-vetoed venue ids — never appear. */
  vetoedVenueIds?: string[];
}): CompromiseSelection {
  const vetoed = new Set(input.vetoedVenueIds ?? []);
  const feasible = input.venueIds.filter((id) => !vetoed.has(id));
  const slateSize = feasible.length || 1;

  // Honest catalog fallback when nobody has profiled taste seeds yet.
  if (!input.profiledMemberIds.length && feasible.length) {
    const sorted = [...feasible].sort((a, b) => {
      const sa = input.suitabilityByVenueId?.[a] ?? 0;
      const sb = input.suitabilityByVenueId?.[b] ?? 0;
      if (sa !== sb) return sb - sa;
      return a.localeCompare(b);
    });
    return {
      policyVersion: COMPROMISE_POLICY.version,
      alternatives: sorted.slice(0, COMPROMISE_POLICY.maxAlternatives).map((venueId, index) => ({
        venueId,
        role: (index === 0 ? "best_compromise" : "mean_rank_alternative") as AlternativeRole,
        worstMemberRank: 0,
        meanMemberRank: 0,
        explanation:
          "No profiled taste signals yet — showing catalog options that clear hard requirements. Add member seeds for ordinal taste ranking. Not a percent likelihood.",
      })),
      limitations: COMPROMISE_POLICY.limitations,
    };
  }

  const scores = scoreVenues({
    venueIds: feasible,
    cells: input.cells,
    profiledMemberIds: input.profiledMemberIds,
    suitabilityByVenueId: input.suitabilityByVenueId,
  });
  const picked = new Set<string>();
  const alternatives: CompromiseAlternative[] = [];

  const byCompromise = sortByCompromise(scores);
  const best = byCompromise[0];
  if (best) {
    picked.add(best.venueId);
    alternatives.push({
      venueId: best.venueId,
      role: "best_compromise",
      worstMemberRank: best.worstRank,
      meanMemberRank: best.meanRank,
      explanation: explainCompromise(best, slateSize, "best_compromise"),
    });
  }

  const byMean = sortByMeanRank(scores);
  const meanAlt = byMean.find((s) => !picked.has(s.venueId));
  if (meanAlt) {
    picked.add(meanAlt.venueId);
    alternatives.push({
      venueId: meanAlt.venueId,
      role: "mean_rank_alternative",
      worstMemberRank: meanAlt.worstRank,
      meanMemberRank: meanAlt.meanRank,
      explanation: explainCompromise(meanAlt, slateSize, "mean_rank_alternative"),
    });
  }

  const familiarSet = new Set(input.familiarVenueIds ?? []);
  if (familiarSet.size > 0) {
    const familiarScores = sortByCompromise(scores.filter((s) => familiarSet.has(s.venueId)));
    const familiar = familiarScores.find((s) => !picked.has(s.venueId));
    if (familiar) {
      alternatives.push({
        venueId: familiar.venueId,
        role: "familiar_fallback",
        worstMemberRank: familiar.worstRank,
        meanMemberRank: familiar.meanRank,
        explanation: explainCompromise(familiar, slateSize, "familiar_fallback"),
      });
    }
  }

  return {
    policyVersion: COMPROMISE_POLICY.version,
    alternatives: alternatives.slice(0, COMPROMISE_POLICY.maxAlternatives),
    limitations: COMPROMISE_POLICY.limitations,
  };
}

/** Copy lint: reject probability / unqualified fairness language. */
export function assertHonestCompromiseCopy(text: string): void {
  const banned = [
    /\d+\s*%\s*likely/i,
    /probability/i,
    /guaranteed fairness/i,
    /mathematically optimal/i,
    /optimal happiness/i,
    /will enjoy/i,
  ];
  for (const re of banned) {
    if (re.test(text)) {
      throw new Error(`Compromise copy violates honesty policy: matched ${re}`);
    }
  }
}
