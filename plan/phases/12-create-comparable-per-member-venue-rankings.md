# P12 — Create comparable per-member venue rankings

> Implementation plan executed **2026-10-04**. Ordinal common-slate ranking + coverage gates green (synthetic); live C6 awaits Qloo key.

**Goal:** Obtain honest ordinal evidence for every included member on one common slate.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 3 · **Effort estimate:** 6 founder hours · **Depends on:** P11 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `worker/src/planning/rank.ts`
- `worker/src/providers/qloo.ts`
- `tests/unit/rank-coverage.test.ts`

Consumes the completed evidence and contracts from P11. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Freeze an eligible candidate UUID set of at most 30 and pass the same filter.results.entities list to each profiled member query.
- [ ] Validate returned identity/order and preserve missing candidates as unknown, never score zero.
- [ ] Compute a fully ranked common comparison set and reindex each person’s order on it; preserve tie handling.
- [ ] Apply the proposed gate of at least eight shared eligible venues and 80% submitted-slate coverage.
- [ ] Separate full and mixed taste modes: compute rank coverage over the opted-in cohort, display profiled/total counts, block any failed profiled query, and require every member’s explicit acceptance before readiness.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: RANK-03 to RANK-07 pass, and no person is silently dropped to improve coverage.
- [ ] AC02: Coverage below either gate yields needs-input/data-coverage state; mixed mode is explicit, all-member acceptance is required, and host cannot see private rank rows.
- [ ] AC03: Raw scores across separate queries never enter an arithmetic satisfaction average.

## CI and verification

- C1–C3 rank-coverage tests and one bounded C6 identical-slate check.
- Manual review compares requested/returned IDs and documents absent explainability.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Coverage report with honest denominator
- Ordinal transformation tests
- Private/public DTO audit

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If an 8-venue/80% gate is unrealistic, revise it openly with new evidence and version the policy before the human study; do not quietly lower it per run.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
