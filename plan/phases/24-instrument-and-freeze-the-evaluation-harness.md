# P24 — Instrument and freeze the evaluation harness

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Make Qloo-value and workflow claims testable without bias or circular metrics.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 6 · **Effort estimate:** 6 founder hours · **Depends on:** P19, P23 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `eval/manifest.json`
- `eval/run.ts`
- `eval/report.ts`
- `docs/evaluation/protocol.md`
- `tests/unit/eval-analysis.test.ts`

Consumes the completed evidence and contracts from P19, P23. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Freeze the same-slate LLM baseline, Qloo condition, policy version, neutral cards and primary human metric.
- [ ] Record group as the independent unit; repeated occasions and members do not inflate sample size.
- [ ] Randomize display order, deduplicate repeated venues for rating, and store consented labels separately from provider outputs.
- [ ] Define missing inputs, ties, losses, exclusions, withdrawals and technical failures before data collection.
- [ ] Implement descriptive paired group analysis and uncertainty reporting; never use Qloo score increase as outcome improvement.
- [ ] Add event telemetry for started/completed/intake/dropout/replan/approval/export/return with synthetic/live separation.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Manifest fixes models/prompts/slate/metric before outcomes; deviations are logged.
- [ ] AC02: Report includes every enrolled group, ties/losses/missing outcomes and clustered repeats.
- [ ] AC03: Test data with known differences produces the hand-calculated result; zero data yields no uplift claim.

## CI and verification

- C1/C2 plus C8 on clearly synthetic analysis fixtures only.
- Independent manual review of baseline information parity and rating-card neutrality.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Pre-registered protocol
- Analysis unit tests
- Telemetry data dictionary

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Persuasive explanation differences, weaker baseline facts or excluded failures can invalidate the study. Fix design before recruiting more groups.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
