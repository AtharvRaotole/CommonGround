# Rollback and restore rehearsal

**Owner:** founder · **Updated:** 2026-10-04 · **Environment:** disposable preview / local D1

## Principles

- A git revert alone does **not** restore D1 data.
- Prefer forward recovery with a tested migration when down-migration is unsafe.
- Revoke disposable capabilities when authorization or session semantics change.
- Preserve research evidence while honoring deletion/consent.

## Worker rollback

```sh
# Identify last known-good Worker version in Cloudflare dashboard or wrangler deployments list
pnpm --filter @common-ground/worker exec wrangler deployments list
# Roll back via dashboard "Rollback" or redeploy the tagged SHA:
GIT_SHA=<known-good> pnpm --filter @common-ground/worker exec wrangler deploy
```

## D1 recovery

1. Prefer restore from a pre-migration backup taken on a **disposable** database.
2. If only forward migrations exist, apply the recovery migration and re-validate auth.
3. Never run untested destructive SQL against production participant data.

## Rehearsal checklist (disposable env)

| Step | Result | When |
|---|---|---|
| Snapshot / note schema version before change | recorded | pre-release |
| Deploy candidate Worker SHA | | |
| Create synthetic test event + capability | | |
| Approve + export | | |
| Roll Worker to previous SHA | | |
| Confirm auth cookies / deletion still coherent | | |
| Re-apply forward migration if required | | |
| Delete synthetic event / run delete-my-inputs | | |

## Auth / version / deletion revalidation

After restore:

- Redeem invite → session cookie scoped to event
- Host cannot read member seeds
- Delete-my-inputs removes prefs and revokes session
- Health endpoint reports expected git SHA when configured

## Status

Full production rollback rehearsal log: `docs/verification/release/rollback-rehearsal.md`.
