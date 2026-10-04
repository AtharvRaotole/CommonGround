/**
 * Frozen paired analysis for Qloo vs baseline (P24/P25).
 * Group is the independent unit. Never treat Qloo affinity deltas as outcomes.
 */

export type Method = "baseline" | "qloo";

export type VenueRating = {
  venueId: string;
  /** 1–5 willingness-to-attend from a consented participant */
  score: number;
};

export type GroupOccasion = {
  groupId: string;
  occasionId: string;
  method: Method;
  /** Per-member ratings for venues on the shared slate */
  memberRatings: VenueRating[][];
  technicalFailure?: boolean;
  missingOutcome?: boolean;
  withdrawn?: boolean;
};

export type GroupSummary = {
  groupId: string;
  baselineMin: number | null;
  qlooMin: number | null;
  /** qlooMin - baselineMin when both present */
  pairedDelta: number | null;
  outcome: "win" | "loss" | "tie" | "missing" | "excluded";
  occasions: number;
};

export type StudyReport = {
  protocolVersion: string;
  enrolledGroups: number;
  analyzedGroups: number;
  wins: number;
  losses: number;
  ties: number;
  missing: number;
  excluded: number;
  medianPairedDelta: number | null;
  graduation: "supportive" | "inconclusive" | "negative" | "incomplete";
  groups: GroupSummary[];
  limitations: string[];
};

/** Lowest member score for a method occasion (primary human metric). */
export function lowestMemberScore(memberRatings: VenueRating[][]): number | null {
  if (!memberRatings.length) return null;
  const perMember = memberRatings.map((ratings) => {
    if (!ratings.length) return null;
    return Math.min(...ratings.map((r) => r.score));
  });
  if (perMember.some((s) => s == null)) return null;
  return Math.min(...(perMember as number[]));
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Aggregate occasions within group, then compare methods.
 * Known-diff fixtures must reproduce hand-calculated results (P24 AC03).
 */
export function analyzeStudy(input: {
  protocolVersion: string;
  occasions: GroupOccasion[];
  targetGroups?: number;
  winThreshold?: number;
  medianDeltaThreshold?: number;
}): StudyReport {
  const target = input.targetGroups ?? 12;
  const winThreshold = input.winThreshold ?? 8;
  const medianDeltaThreshold = input.medianDeltaThreshold ?? 0.5;

  const byGroup = new Map<string, GroupOccasion[]>();
  for (const occ of input.occasions) {
    const list = byGroup.get(occ.groupId) ?? [];
    list.push(occ);
    byGroup.set(occ.groupId, list);
  }

  const groups: GroupSummary[] = [];
  for (const [groupId, occasions] of byGroup) {
    if (occasions.some((o) => o.withdrawn || o.technicalFailure)) {
      groups.push({
        groupId,
        baselineMin: null,
        qlooMin: null,
        pairedDelta: null,
        outcome: "excluded",
        occasions: occasions.length,
      });
      continue;
    }
    if (occasions.some((o) => o.missingOutcome)) {
      groups.push({
        groupId,
        baselineMin: null,
        qlooMin: null,
        pairedDelta: null,
        outcome: "missing",
        occasions: occasions.length,
      });
      continue;
    }

    const baselineScores = occasions
      .filter((o) => o.method === "baseline")
      .map((o) => lowestMemberScore(o.memberRatings))
      .filter((s): s is number => s != null);
    const qlooScores = occasions
      .filter((o) => o.method === "qloo")
      .map((o) => lowestMemberScore(o.memberRatings))
      .filter((s): s is number => s != null);

    const baselineMin = baselineScores.length ? median(baselineScores) : null;
    const qlooMin = qlooScores.length ? median(qlooScores) : null;
    if (baselineMin == null || qlooMin == null) {
      groups.push({
        groupId,
        baselineMin,
        qlooMin,
        pairedDelta: null,
        outcome: "missing",
        occasions: occasions.length,
      });
      continue;
    }
    const pairedDelta = qlooMin - baselineMin;
    const outcome: GroupSummary["outcome"] =
      pairedDelta > 1e-9 ? "win" : pairedDelta < -1e-9 ? "loss" : "tie";
    groups.push({
      groupId,
      baselineMin,
      qlooMin,
      pairedDelta,
      outcome,
      occasions: occasions.length,
    });
  }

  const wins = groups.filter((g) => g.outcome === "win").length;
  const losses = groups.filter((g) => g.outcome === "loss").length;
  const ties = groups.filter((g) => g.outcome === "tie").length;
  const missing = groups.filter((g) => g.outcome === "missing").length;
  const excluded = groups.filter((g) => g.outcome === "excluded").length;
  const deltas = groups
    .map((g) => g.pairedDelta)
    .filter((d): d is number => d != null);
  const medianPairedDelta = median(deltas);
  const enrolledGroups = byGroup.size;

  let graduation: StudyReport["graduation"] = "incomplete";
  if (enrolledGroups === 0) {
    graduation = "incomplete";
  } else if (enrolledGroups < target || missing + excluded > 0 && wins + losses + ties < target) {
    // Not enough complete pairs for the pre-registered gate.
    if (enrolledGroups < target) graduation = "incomplete";
    else if (wins >= winThreshold && (medianPairedDelta ?? 0) >= medianDeltaThreshold) {
      graduation = "supportive";
    } else if (wins === 0 && losses > wins) graduation = "negative";
    else graduation = "inconclusive";
  } else if (wins >= winThreshold && (medianPairedDelta ?? 0) >= medianDeltaThreshold) {
    graduation = "supportive";
  } else if (wins < losses) {
    graduation = "negative";
  } else {
    graduation = "inconclusive";
  }

  // Zero data ⇒ no uplift claim.
  if (enrolledGroups === 0 || deltas.length === 0) {
    graduation = "incomplete";
  }

  return {
    protocolVersion: input.protocolVersion,
    enrolledGroups,
    analyzedGroups: wins + losses + ties,
    wins,
    losses,
    ties,
    missing,
    excluded,
    medianPairedDelta,
    graduation,
    groups: groups.sort((a, b) => a.groupId.localeCompare(b.groupId)),
    limitations: [
      "Group is the independent unit; members/occasions do not inflate N.",
      "Primary metric is lowest member willingness-to-attend (1–5), not Qloo affinity.",
      "Synthetic fixtures never count as customer evidence.",
    ],
  };
}
