# Release evidence bundle (P29)

| Artifact | Path |
|---|---|
| CI / verify-release | this folder · commands below |
| Rollback rehearsal | [rollback-rehearsal.md](./rollback-rehearsal.md) |
| Cold-start notes | [cold-start.md](./cold-start.md) |
| Production smoke | [production-smoke.md](./production-smoke.md) |

## Mandatory commands (release SHA)

```sh
pnpm verify:ci
pnpm exec playwright test tests/e2e
node --experimental-strip-types scripts/verify-release.ts
```

Record the exact `git rev-parse HEAD` and environment for every pass.
