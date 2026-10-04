# P09 — Resolve voluntary taste inputs precisely

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Convert user selections into confirmed Qloo identities without hidden inference.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 3 · **Effort estimate:** 6 founder hours · **Depends on:** P07, P08 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `apps/web/src/features/taste/`
- `worker/src/providers/qloo.ts`
- `tests/integration/entity-search.test.ts`

Consumes the completed evidence and contracts from P07, P08. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Add debounced, minimum-length search and type filters from the documented lookup contract.
- [ ] Display candidates with distinguishing type/name/context, and require explicit confirmation.
- [ ] Enforce up to three active seeds, bounded text length, per-member and per-event lookup budgets, and edit/remove.
- [ ] Keep no-match as unresolved and offer skip or another query; never invent UUIDs or auto-map a brand into a diagnosis.
- [ ] Record consent version and keep lookup/provider errors free of secrets and raw query logs.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Ambiguous names require a choice; wrong-type or malformed IDs are rejected server-side.
- [ ] AC02: No-match, timeout and quota states preserve the user’s ability to edit or skip.
- [ ] AC03: Search respects 20/member/day and 60/event/day application caps including retries, plus the configured global cap.

## CI and verification

- C1–C3 entity-search tests; C4 keyboard selection/remove/no-match cases.
- One bounded C6 lookup smoke verifies current endpoint behavior.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Disambiguation UI recording with synthetic data
- Budget and no-match test logs
- Redacted live lookup result

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Entity-resolution friction can invalidate the value proposition. Measure completion instead of adding more cultural categories.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
