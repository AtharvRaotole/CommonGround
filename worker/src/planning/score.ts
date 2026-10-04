import type { ConfirmedSeed } from "@common-ground/contracts";
import { reserveRunQlooCall } from "./budget";
import { buildComparableRanks, type RankBuildResult } from "./rank";
import type { QlooClient } from "../providers/qloo";
import type { D1Like } from "../db/repository";

export type ScoreMember = {
  participantId: string;
  seeds: ConfirmedSeed[];
  skipProfiling: boolean;
};

/**
 * Score every profiled member on the identical frozen slate, then build ordinal ranks.
 * Hard-constraint filtering must happen before this (P13).
 */
export async function rankProfiledMembersOnSlate(input: {
  db: D1Like;
  client: QlooClient;
  runId: string;
  members: ScoreMember[];
  candidateEntityIds: string[];
  totalMemberCount: number;
}): Promise<RankBuildResult & { qlooCallsUsed: number; dataMode: "synthetic" | "live" }> {
  let qlooCallsUsed = 0;
  let dataMode: "synthetic" | "live" = input.client.hasLiveKey ? "live" : "synthetic";
  const rows = [];

  for (const member of input.members) {
    if (member.skipProfiling || !member.seeds.length) {
      rows.push({
        memberId: member.participantId,
        profiled: false,
        affinities: {},
        queryFingerprint: `opt-out:${member.participantId}`,
        source: "explicit_preference" as const,
      });
      continue;
    }

    const reserve = await reserveRunQlooCall({ db: input.db, runId: input.runId });
    if (!reserve.ok) {
      rows.push({
        memberId: member.participantId,
        profiled: true,
        failed: true,
        affinities: {},
        queryFingerprint: `quota:${member.participantId}`,
        source: "qloo" as const,
      });
      continue;
    }

    const outcome = await input.client.scoreCommonSlate({
      seedEntityIds: member.seeds.map((s) => s.entityId),
      candidateEntityIds: input.candidateEntityIds,
    });
    qlooCallsUsed += outcome.callCount;
    dataMode = outcome.dataMode;

    if (outcome.status !== "ok") {
      rows.push({
        memberId: member.participantId,
        profiled: true,
        failed: true,
        affinities: {},
        queryFingerprint: `fail:${outcome.status}:${member.participantId}`,
        source: "qloo" as const,
      });
      continue;
    }

    rows.push({
      memberId: member.participantId,
      profiled: true,
      affinities: outcome.affinities,
      queryFingerprint: `slate:${input.candidateEntityIds.slice().sort().join(",")}`,
      source: "qloo" as const,
    });
  }

  const ranked = buildComparableRanks({
    memberRows: rows,
    candidateEntityIds: input.candidateEntityIds,
    totalMemberCount: input.totalMemberCount,
  });

  return { ...ranked, qlooCallsUsed, dataMode };
}
