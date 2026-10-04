# P32 — Make the startup continue pivot or stop decision

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** End the eight weeks with an evidence-based business decision and a focused next investment.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 8 · **Effort estimate:** 6 founder hours · **Depends on:** P25, P26, P27, P28, P31 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `docs/business/eight-week-review.md`
- `docs/business/next-experiment.md`
- `docs/research/assumptions.json`

Consumes the completed evidence and contracts from P25, P26, P27, P28, P31. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Re-score the same 10-category rubric and link every changed score to evidence; preserve unsupported categories.
- [ ] Compare buyer pain, Qloo lift, workflow time, voluntary returns, exact-price intent, rights and contribution gates.
- [ ] Separate product delivery from business validation and record which results remain unobserved.
- [ ] Choose continue with one next experiment, pivot with a new explicit buyer/job, or stop with preserved learning.
- [ ] If continuing, design a 90-day plan only around the demonstrated bottleneck; do not auto-add integrations or cities.
- [ ] Review retention/deletion, provider expiry and operating caps so an abandoned demo does not silently retain data or spend.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: ≥9 is claimed only if weighted score reaches 9 with all hard commercial, customer and technical gates met; otherwise report the actual score.
- [ ] AC02: The next action has an owner, time/cost limit, hypothesis and stop rule.
- [ ] AC03: All unfinished outcomes remain marked incomplete, and operations/deletion responsibilities are assigned.

## CI and verification

- C0/C8 and manual founder evidence review; no automated score inflation.
- Reconcile all phase statuses with actual evidence rather than scheduled week numbers.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Eight-week decision memo
- Final rubric and unresolved risks
- Next experiment or shutdown runbook

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

A hackathon award cannot replace customer evidence. A failed startup thesis can still leave a useful open-source artifact.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
