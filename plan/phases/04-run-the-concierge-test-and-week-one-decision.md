# P04 — Run the concierge test and week-one decision

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Deliver one real manual planning artifact and decide whether software is worth building.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 1 · **Effort estimate:** 6 founder hours · **Depends on:** P02, P03 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `docs/pilots/concierge-protocol.md`
- `docs/pilots/concierge-results-private.json`
- `docs/decisions/002-build-gate.md`

Consumes the completed evidence and contracts from P02, P03. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Collect consented inputs from at least one committed real group and document abandonment as well as submissions.
- [ ] Prepare a checked venue slate with host constraints and source dates; preserve unknown facts.
- [ ] Produce equivalent neutral cards for host/current baseline and Qloo-informed choices; blind method labels where possible.
- [ ] Ask participants for explicit willingness to attend and the host for a decision; record a veto and revision if it occurs.
- [ ] Measure founder and host effort separately, including fact verification and messaging.
- [ ] Apply the first-week gates; document continue, narrow, pivot or stop and reasons without rewriting thresholds.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: At least one actual upcoming group receives an actionable evidence-backed plan and returns explicit feedback; no fake completed pilot is counted.
- [ ] AC02: Candidate changes caused by Qloo are observed, and whether humans value those changes is recorded—even if negative.
- [ ] AC03: Week-one memo states which gates passed, failed or remain unresolved; broad build depends on an explicit continue/narrow decision.

## CI and verification

- C0 and manual paired-card/provenance review; small sample is exploratory only.
- Verify the plan does not promise availability, allergy safety or a completed reservation.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Completed manual plan with permitted data
- Time ledger and feedback
- Signed week-one go/no-go memo

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If venue checking consumes all saved effort or the baseline is equally good, change the hypothesis; the startup score cannot rise merely because the prototype looks appealing.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
