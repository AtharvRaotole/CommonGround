# Rollback rehearsal log

| Field | Record |
|---|---|
| Date | 2026-10-04 |
| Environment | local / disposable D1 intent |
| Release SHA | fill after commit |
| Observer | founder (agent-assisted) |

## Steps performed

1. Documented Worker rollback via `wrangler deployments` / redeploy known-good SHA (`docs/operations/rollback.md`).
2. Confirmed migrations are forward-only (`0003_p15_planning.sql`, `0004_p21_hardening.sql`) — restore path is forward recovery + capability revalidation, not blind down-migrate.
3. Auth/deletion behaviors covered by existing integration suites (abuse, delete path); full preview rollback to be re-run when keys allow a live event.

## Result

| AC | Result |
|---|---|
| Procedure written and rehearsable | **pass** (procedure) |
| Disposable env restore of known test event | **incomplete** pending keyed live event on disposable D1 |
| Auth/version/deletion revalidated post-restore | **partial** — covered by automated tests on current schema |

## Limitation

Without a disposable remote D1 snapshot exercise in this session, do not claim production restore was executed end-to-end. Block any schema change that lacks a tested forward recovery path.
