import type { ConfirmedSeed } from "@common-ground/contracts";
import {
  DiscoverCandidatesInputSchema,
  type DiscoverCandidatesOutput,
} from "./contracts";
import { reserveRunQlooCall } from "./budget";
import { QlooClient, intersectWithCatalog } from "../providers/qloo";
import type { D1Like } from "../db/repository";

export type MemberProfile = {
  participantId: string;
  seeds: ConfirmedSeed[];
  skipProfiling: boolean;
};

/**
 * One discovery call per profiled member within run budget.
 * Merge unique IDs ∩ checked catalog; retain catalog fallback so truncation cannot wipe options.
 */
export async function discoverBoundedCandidates(input: {
  db: D1Like;
  client: QlooClient;
  raw: unknown;
  members: MemberProfile[];
}): Promise<DiscoverCandidatesOutput> {
  const parsed = DiscoverCandidatesInputSchema.safeParse(input.raw);
  if (!parsed.success) {
    return {
      status: "invalid",
      dataMode: input.client.hasLiveKey ? "live" : "synthetic",
      candidateEntityIds: [],
      catalogFallbackIds: [],
      rejectedUnexpectedIds: [],
      missingCoverageMemberIds: [],
      qlooCallsUsed: 0,
    };
  }

  const req = parsed.data;
  const catalog = req.catalogEntityIds;
  const profiled = input.members.filter(
    (m) =>
      req.profiledMemberIds.includes(m.participantId) &&
      !m.skipProfiling &&
      m.seeds.length > 0,
  );

  const missingCoverageMemberIds: string[] = [];
  const merged = new Set<string>();
  const rejected = new Set<string>();
  let qlooCallsUsed = 0;
  let dataMode: "synthetic" | "live" = input.client.hasLiveKey ? "live" : "synthetic";
  let sawAuthFailure = false;
  let sawUnavailable = false;

  for (const member of profiled) {
    const reserve = await reserveRunQlooCall({ db: input.db, runId: req.runId });
    if (!reserve.ok) {
      return {
        status: "quota",
        dataMode,
        candidateEntityIds: [...merged],
        catalogFallbackIds: catalog,
        rejectedUnexpectedIds: [...rejected],
        missingCoverageMemberIds: profiled.map((member) => member.participantId),
        qlooCallsUsed,
      };
    }

    const outcome = await input.client.discoverPlaces({
      seedEntityIds: member.seeds.map((s) => s.entityId),
      catalogEntityIds: catalog,
      locationWkt: req.locationWkt,
      radiusMeters: req.radiusMeters,
    });
    qlooCallsUsed += outcome.callCount;
    dataMode = outcome.dataMode;

    if (outcome.status === "auth") {
      sawAuthFailure = true;
      missingCoverageMemberIds.push(member.participantId);
      continue;
    }
    if (outcome.status === "unavailable" || outcome.status === "rate_limited") {
      sawUnavailable = true;
      missingCoverageMemberIds.push(member.participantId);
      continue;
    }
    if (outcome.status === "invalid") {
      return {
        status: "invalid",
        dataMode,
        candidateEntityIds: [],
        catalogFallbackIds: catalog,
        rejectedUnexpectedIds: [],
        missingCoverageMemberIds: [member.participantId],
        qlooCallsUsed,
      };
    }
    if (outcome.status === "no_results") {
      missingCoverageMemberIds.push(member.participantId);
      continue;
    }

    const { allowed, rejected: bad } = intersectWithCatalog(outcome.entityIds, catalog);
    for (const id of allowed) merged.add(id);
    for (const id of bad) rejected.add(id);
    if (!allowed.length) missingCoverageMemberIds.push(member.participantId);
  }

  if (sawAuthFailure || sawUnavailable) {
    return {
      status: "unavailable",
      dataMode,
      // Never fabricate candidates on failure.
      candidateEntityIds: [],
      catalogFallbackIds: catalog,
      rejectedUnexpectedIds: [...rejected],
      missingCoverageMemberIds,
      qlooCallsUsed,
    };
  }

  if (!merged.size) {
    return {
      status: "no_coverage",
      dataMode,
      candidateEntityIds: [],
      catalogFallbackIds: catalog,
      rejectedUnexpectedIds: [...rejected],
      missingCoverageMemberIds,
      qlooCallsUsed,
    };
  }

  return {
    status: "ok",
    dataMode,
    candidateEntityIds: [...merged],
    catalogFallbackIds: catalog,
    rejectedUnexpectedIds: [...rejected],
    missingCoverageMemberIds,
    qlooCallsUsed,
  };
}
