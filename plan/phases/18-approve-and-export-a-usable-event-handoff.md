# P18 — Approve and export a usable event handoff

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Finish the host job without unauthorized booking, messaging or calendar mutation.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 5 · **Effort estimate:** 5 founder hours · **Depends on:** P17 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `worker/src/export/ics.ts`
- `apps/web/src/routes/export.tsx`
- `tests/unit/ics.test.ts`
- `tests/e2e/approval-export.spec.ts`

Consumes the completed evidence and contracts from P17. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Require an exact current revision and explicit acceptance of the selected venue from every member; recheck all readiness predicates and invalidate acceptances on material changes.
- [ ] Generate a summary with date, timezone, venue, source links, budget basis and reservation-unconfirmed status.
- [ ] Create a tentative export path that visibly preserves unknown required facts and does not mark the plan ready.
- [ ] Escape ICS text/line breaks, fold lines correctly and resolve timezone/DST explicitly.
- [ ] Make copy/download user-clicked; test two calendar import clients manually using synthetic events.
- [ ] Begin exploratory alpha usability pilots, recording baseline/support effort separately; exclude their outcomes from formal comparisons frozen later in P24.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Stale approval returns conflict and cannot export an old ready plan.
- [ ] AC02: EXPORT-01 through EXPORT-03 pass; calendar file imports as one correct event.
- [ ] AC03: No outbound invitation, reservation or payment occurs; tentative and ready states remain distinct.

## CI and verification

- C1–C4 calendar/approval checks and two-client import verification.
- Manual pilot-ready core smoke from a fresh browser.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Validated ICS sample
- Cold-start core walkthrough
- First product pilot enrollment record

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Do not add provider booking links that imply available inventory. The host owns final verification and reservation.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
