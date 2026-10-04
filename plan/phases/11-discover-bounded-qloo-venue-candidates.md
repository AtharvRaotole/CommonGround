# P11 — Discover bounded Qloo venue candidates

> Implementation plan executed **2026-10-04**. Catalog intersection + 24-call run ceiling verified; live discovery awaits Qloo key.

**Goal:** Retrieve relevant place candidates while retaining a trustworthy bounded inventory.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 3 · **Effort estimate:** 6 founder hours · **Depends on:** P08, P09, P10 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `worker/src/providers/qloo.ts`
- `worker/src/planning/contracts.ts`
- `tests/integration/qloo-discovery.test.ts`

Consumes the completed evidence and contracts from P08, P09, P10. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Define an allowlist of documented query parameters for place discovery; validate location units and coordinate order.
- [ ] Call once per profiled member within budget, merge unique candidates and intersect with the checked catalog.
- [ ] Keep independently feasible catalog options so discovery truncation does not eliminate all familiar alternatives.
- [ ] Reject unexpected identities and record missing coverage; trim vendor response before application output.
- [ ] Test ignored filters, schema additions, absent fields, 401/403/429 and no-results behavior.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Every surfaced live candidate is both a real resolved place and an allowed checked-catalog entry.
- [ ] AC02: No parameter is silently constructed from unvalidated model text; no result is fabricated on failure.
- [ ] AC03: Discovery consumes at most the member count in normal calls and counts retries toward the 24-call run ceiling.

## CI and verification

- C1–C3 QLOO-01 to QLOO-05 and bounded C6 contrasting-filter test.
- Check provider logs contain only permitted redacted metadata.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Normalized contract fixtures authored synthetically
- Live discovery coverage summary
- Per-run call trace

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Poor coverage triggers host-pool mode or a gate failure. Expanding unchecked geographic inventory is not a legitimate fix.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
