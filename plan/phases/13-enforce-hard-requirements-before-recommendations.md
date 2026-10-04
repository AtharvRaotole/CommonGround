# P13 — Enforce hard requirements before recommendations

> Implementation plan executed **2026-10-04**. Discriminated hard constraints + readiness suite green under free-tier Worker/D1.

**Goal:** Make practical feasibility deterministic and auditable.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 4 · **Effort estimate:** 6 founder hours · **Depends on:** P08, P12 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `worker/src/planning/constraints.ts`
- `tests/unit/constraints.test.ts`
- `tests/integration/readiness.test.ts`

Consumes the completed evidence and contracts from P08, P12. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Implement discriminated schemas for budget, radius, time, category, access, dietary requirements and veto.
- [ ] Separate required vs optional and confirmed vs unknown/conflicting/expired facts.
- [ ] Apply the strictest participant-owned hard constraints; require the owner to authorize changes.
- [ ] Block ready status for unknown material facts and present a specific confirmation request.
- [ ] Test price levels versus exact cost, daylight-saving times, expired hours and all-candidate infeasibility.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: FACT-01 through FACT-03 and the documented budget/access examples pass.
- [ ] AC02: The model cannot waive or rewrite hard requirements; owner changes increment version.
- [ ] AC03: No feasible result is a valid explicit state with no fabricated backup venue.

## CI and verification

- C1–C3 constraints and readiness suites; property-test veto exclusion and required-unknown rejection.
- Manual sample review against actual evidence record.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Constraint decision table
- Failing-then-passing negative tests
- Infeasible-state screenshot

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Any hard-constraint bypass blocks release regardless of overall test pass rate.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
