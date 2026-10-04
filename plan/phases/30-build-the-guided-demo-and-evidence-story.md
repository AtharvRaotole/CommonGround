# P30 — Build the guided demo and evidence story

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Make the problem, Qloo contribution and full agent loop understandable to a new judge.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 8 · **Effort estimate:** 6 founder hours · **Depends on:** P25, P26, P29 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `apps/web/src/routes/demo.tsx`
- `docs/demo/script.md`
- `docs/demo/evidence-map.md`

Consumes the completed evidence and contracts from P25, P26, P29. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Create a persistent synthetic-example label and an immediate four-person guided flow.
- [ ] Demonstrate resolved inputs, actual bounded tools, practical checks, private veto, changed plan and approved export.
- [ ] Add a live-start path that uses genuine provider calls within quotas; show honest unavailable state if blocked.
- [ ] Connect each judging criterion to a real artifact, screenshot or measured result.
- [ ] Write the concise product description and limitations; include a comparison only if the study supports it.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: A cold visitor can understand the value and complete example without founder narration.
- [ ] AC02: Live and example outputs/traces cannot be confused; timestamps and claims are truthful.
- [ ] AC03: No fabricated testimonial, customer logo, uplift, revenue or novelty claim appears.

## CI and verification

- C1/C4/C5 plus manual claim-by-claim evidence review.
- Optional walkthrough recording is secondary to the externally hosted working app.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Demo observation
- Claim-to-evidence matrix
- Approved release copy

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If the study is inconclusive, show that honestly; a stronger narrative cannot substitute for missing evidence.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
