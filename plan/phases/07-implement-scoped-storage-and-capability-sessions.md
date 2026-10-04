# P07 — Implement scoped storage and capability sessions

> Implementation plan for a product phase. This phase is currently **complete** (2026-10-04). Free-tier D1 + Workers only.

**Goal:** Persist events securely without paid authentication or exposing member data.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 2 · **Effort estimate:** 8 founder hours · **Depends on:** P06 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `migrations/0001_core.sql`
- `worker/src/auth/capabilities.ts`
- `worker/src/auth/authorize.ts`
- `worker/src/db/repository.ts`
- `tests/integration/auth.test.ts`

Consumes the completed evidence and contracts from P06. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [x] Create event/member/session/claim tables and scoped indexes with foreign-key constraints.
- [x] Generate 32-byte random capability secrets, hash at rest, exchange one-time fragments, set secure cookies and clear URL fragments.
- [x] Add Origin/CSRF checks, role-filtered DTOs, expiry, host recovery-code handling, invite rotation and revocation.
- [x] Implement authorization helpers requiring event scope as well as row identity for every child lookup.
- [x] Write cross-event, cross-member, replay and simultaneous-claim failures before implementing the success paths.
- [x] Document capability sharing and recovery limitations in the UI; test migration on an empty and populated disposable database.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [x] AC01: AUTH-01 through AUTH-05 pass; a host DTO never exposes another person’s seeds.
- [x] AC02: Exactly one concurrent claim succeeds; rotated/expired tokens cannot write.
- [x] AC03: No token is stored in plaintext in D1/logs or included in participant-visible host links.

## CI and verification

- C1–C3, with tests/integration/auth.test.ts; C4 invite claim smoke.
- Inspect network responses for hidden private fields, not just rendered UI.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Migration and auth test logs
- Threat-model notes
- Role/DTO access matrix

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Any cross-tenant disclosure blocks all pilot access. Revoke all disposable tokens before retesting after a fix.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
