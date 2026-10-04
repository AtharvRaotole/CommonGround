# P02 — Interview the buyer and recruit real pilots

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Find whether recurring venue choice is a painful paid-host job rather than a plausible story.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 1 · **Effort estimate:** 8 founder hours · **Depends on:** P01 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `docs/research/hosts-private.json`
- `docs/research/interview-notes/`
- `docs/research/discovery-decision.md`

Consumes the completed evidence and contracts from P01. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Screen 15 publicly identifiable operators against the five customer conditions; keep source URL and reason for inclusion.
- [ ] Founder sends or explicitly authorizes the prepared outreach; track attempted, replied, qualified and interviewed separately.
- [ ] Complete at least five behavior interviews for the first gate; continue toward the 12-host evidence target during the pilot period.
- [ ] Ask to reconstruct the last event and view redacted planning artifacts; separate venue-selection pain from attendee acquisition and booking.
- [ ] Seek three real upcoming outings with opt-in participants, a date and a responsible host; record rejections.
- [ ] Ask budget ownership after discussing actual behavior; seek a nonbinding commercial next step, never an unauthorized payment.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: At least three of five qualified first interviews substantiate recurring planning/rework pain with a concrete recent example.
- [ ] AC02: At least three operators commit a real outing and voluntary input collection; at least one identifies a budget approver or exact-offer intent.
- [ ] AC03: Notes explicitly cover the strongest disconfirming evidence, channel bias and whether the current workaround is sufficient.

## CI and verification

- C0 verifies artifact structure only; customer truth is a manual evidence gate.
- Audit one interview against original consented notes. Do not count friends, synthetic personas or unqualified hosts as target buyers.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- De-identified interview synthesis
- Private consent/commitment records
- Recruitment funnel with denominators and objections

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If recruitment or pain gate fails, spend the week-one reserve on one revised customer hypothesis; pause broad implementation rather than adjusting thresholds after the fact.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
