# P06 — Create the product repository and honest CI

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Establish a reproducible local and preview build with secret-free default checks.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 2 · **Effort estimate:** 4 founder hours · **Depends on:** P03, P05 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `package.json`
- `pnpm-lock.yaml`
- `apps/web/`
- `worker/src/index.ts`
- `wrangler.jsonc`
- `.github/workflows/ci.yml`
- `.env.example`
- `LICENSE`

Consumes the completed evidence and contracts from P03, P05. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Pin supported runtime/dependency versions after a compatibility check; use one package manager and commit the lockfile.
- [ ] Create the minimal React/Vite asset app and Worker health route; isolate preview and production configuration.
- [ ] Define lint, typecheck, build, unit, integration and browser scripts; add the first meaningful health/access smoke.
- [ ] Configure C1–C4 on a standard public Linux runner, minimal permissions and no secrets on fork PRs.
- [ ] Add an app-code license and dependency notices; document vendor data and third-party assets are not relicensed.
- [ ] Run a clean install/build locally and preview deployment from written setup instructions.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: A fresh checkout installs with the frozen lockfile and builds using documented commands.
- [ ] AC02: Default CI needs no paid service or live API key; an intentionally broken type or core test fails the job.
- [ ] AC03: Empty environment examples and compiled assets contain no secret; the preview health route returns the intended revision.

## CI and verification

- C1, initial C2/C3/C4 and C5 secret scan; manually verify CI failure propagation.
- Live checks remain a separate protected/manual workflow with a bounded budget.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Clean build log
- CI green and intentional-failure evidence
- Preview URL and tested SHA

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Do not upgrade the hosting plan to make scaffolding work. Keep only dependencies used by the product.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
