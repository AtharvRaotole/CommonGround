import type { SessionContext } from "../auth/authorize";
import type { Repository } from "../db/repository";

/**
 * Scope-aware removal of a participant's private inputs.
 * Invalidates derived results; leaves the participant in the group roster.
 */
export async function deleteOwnMemberInputs(
  repo: Repository,
  session: SessionContext,
): Promise<{ ok: true }> {
  await repo.deleteOwnInputs(session);
  return { ok: true };
}

/** DATA-02: purge expired vendor-derived revisions (aggregate metadata kept on events). */
export async function purgeExpiredDerived(repo: Repository): Promise<{ purged: number }> {
  const purged = await repo.purgeExpiredRevisions();
  return { purged };
}
