# P25 — Run the controlled Qloo comparison

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Find whether cultural ranking improves human decisions against a competent baseline.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 7 · **Effort estimate:** 8 founder hours · **Depends on:** P24 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `eval/private/ratings.json`
- `docs/evaluation/ranking-results.md`
- `docs/evaluation/deviations.md`

Consumes the completed evidence and contracts from P24. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Recruit toward 12 independent eligible groups with voluntary participants; continue missing interviews toward the 12-host target.
- [ ] Run neutral randomized same-slate comparisons using frozen baseline and Qloo versions.
- [ ] Collect venue willingness-to-attend ratings once per venue and compute the lowest member score per group/method.
- [ ] Aggregate repeated occasions within group before comparing; show individual group differences, wins, ties and losses.
- [ ] Log technical/coverage failures and missing responses without removing them to improve headline results.
- [ ] Apply the chapter06 gate and record whether result is supportive, inconclusive or negative.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Every reported rating is actual consented human data; study size/conditions/exclusions are visible.
- [ ] AC02: Graduation signal requires improvement in at least 8/12 groups and median paired improvement at least 0.5 on the 1–5 external rating, with no hard-constraint regression.
- [ ] AC03: Failure to reach the sample or threshold is reported as incomplete/inconclusive/negative, not rounded into success.

## CI and verification

- C8 report integrity; manual blinded-protocol audit and consent check.
- No CI job can fabricate or approve customer ratings.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Private raw ratings and de-identified aggregate
- Condition randomization record
- Results with uncertainty and limitations

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If Qloo offers no lift, inspect signal quality once under a newly registered iteration; repeated failure kills the central thesis.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
