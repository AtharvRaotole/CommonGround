# P26 — Operate the full workflow pilots

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Observe the actual host/member flow over real events including friction and practical verification.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 7 · **Effort estimate:** 6 founder hours · **Depends on:** P18, P24 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `docs/pilots/workflow-ledger-private.json`
- `docs/pilots/host-time-study.md`
- `docs/pilots/support-log.md`

Consumes the completed evidence and contracts from P18, P24. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Continue recruitment from the early alpha, but start formal comparative enrollment only after P24; seek 12 independent groups and two eligible occasions where practical. Do not pool earlier alpha outcomes.
- [ ] Counterbalance current workaround and product use where possible; record differing group/event conditions.
- [ ] Time host activity and founder support/fact maintenance separately; keep abandoned sessions in the ledger.
- [ ] Observe whether members complete intake without researcher data entry and whether host can export unassisted.
- [ ] Collect actual attendance and optional post-event fit separately from intention to attend.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Measured active time includes checking, correction and troubleshooting, not just clicking generate.
- [ ] AC02: Workflow target is at least 20% median paired host-time reduction without lower acceptance; at least 10/12 groups complete intake without researcher entry.
- [ ] AC03: Actual venue use, predicted preference and stated intention are separate fields with missing values preserved.

## CI and verification

- C8 data integrity and manual observation audit.
- If code changes during trial, version the condition and report results separately.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Workflow timing ledger
- Intake/dropout denominator
- Support effort and practical-failure cases

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

External calendars can exceed eight weeks. Keep the launch assessment honest if repeat events have not yet happened.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
