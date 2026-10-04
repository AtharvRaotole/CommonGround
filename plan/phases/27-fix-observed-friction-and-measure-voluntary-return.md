# P27 — Fix observed friction and measure voluntary return

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Improve demonstrated failures and test whether hosts choose to use the product again.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 7 · **Effort estimate:** 6 founder hours · **Depends on:** P25, P26 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `docs/pilots/repeat-use.md`
- `docs/decisions/004-pilot-fixes.md`
- `tests/e2e/regressions.spec.ts`

Consumes the completed evidence and contracts from P25, P26. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Rank observed problems by affected real users and severity; select at most three changes that address evidence.
- [ ] Write regressions for consequential failures and rerun affected suites after each fix.
- [ ] Offer hosts a normal opportunity to plan another event without mandatory study instructions or founder doing the input.
- [ ] Count scheduled research sessions separately from voluntary product returns.
- [ ] Re-score impacted rubric categories with traceable evidence and record unchanged weaknesses.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Each change cites an observed problem and measured resolution; no unrelated scope expansion.
- [ ] AC02: Return gate is 8/12 hosts voluntarily starting and completing a subsequent real event; researcher-mandated second trials do not count.
- [ ] AC03: If the elapsed window prevents measurement, retention remains unvalidated and score cannot assume success.

## CI and verification

- C1–C4 affected regression suite; C8 repeat-use denominator check.
- Manual review of whether researcher effort drove the return.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Before/after friction cases
- Voluntary return ledger
- Updated rubric with citations

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Do not spam reminders to manufacture retention. A host who returns only when the founder does the work is a service signal, not self-serve retention.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
