# P14 — Implement and explain the compromise policy

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Choose useful group alternatives without claiming calibrated happiness or guaranteed fairness.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 4 · **Effort estimate:** 6 founder hours · **Depends on:** P12, P13 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `worker/src/planning/rank.ts`
- `tests/unit/compromise.test.ts`
- `docs/decisions/003-ranking-policy.md`

Consumes the completed evidence and contracts from P12, P13. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Sort feasible common candidates by lowest worst-member rank, then mean rank, checked suitability and stable ID.
- [ ] Create a second mean-rank alternative and a genuinely familiar fallback only when the inputs justify those labels.
- [ ] Keep results unique; show fewer than three when fewer are supported.
- [ ] Test participant permutation, monotonic score transformations, exact ties, all-veto, one candidate and candidate-set changes.
- [ ] Version the policy and publish its limitations; do not display individual rank vectors to the host.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: RANK-01 to RANK-07 pass on explicit matrices including [1,1,1,12] versus [5,5,5,5].
- [ ] AC02: Identical inputs and policy version produce identical venue ordering; identity order cannot alter it.
- [ ] AC03: Copy describes relative compromise and uncertainty, never a percent likelihood or an unqualified fairness guarantee.

## CI and verification

- C1–C3 deterministic/property tests and manual explanation review.
- Compare output against hand-calculated synthetic cases, not snapshots of current implementation.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Policy decision record
- Property-test results
- Hand-calculated reference cases

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Ordinal ranking loses preference intensity. Participant acceptance can override an inferred order; do not force the algorithm’s top result.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
