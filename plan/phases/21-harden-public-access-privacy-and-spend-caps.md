# P21 — Harden public access privacy and spend caps

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Make a bounded public demo resistant to accidental leakage and uncontrolled provider usage.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 6 · **Effort estimate:** 8 founder hours · **Depends on:** P07, P15, P19 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `worker/src/auth/`
- `worker/src/planning/budget.ts`
- `worker/src/telemetry/events.ts`
- `tests/integration/abuse.test.ts`
- `docs/security/threat-model.md`

Consumes the completed evidence and contracts from P07, P15, P19. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Trace every private field from intake through storage/provider/log/browser and delete unnecessary copies.
- [ ] Add global/event/session usage reservations, finite request bodies, rate limits, Origin controls and no-referrer policy.
- [ ] Test host/member token theft scenarios, guessed IDs, duplicate/replayed operations and mutation races.
- [ ] Use server-side secrets only, no arbitrary URL fetcher, and strict rendering/ICS escaping.
- [ ] Scan source/history/build artifacts and review dependencies/actions; rotate any disposable test secret that leaked.
- [ ] Write the actual privacy notice and user deletion procedure from the implemented data flow.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Auth/private-data/CSRF tests pass; no raw key/profile appears in network-visible unauthorized output or log.
- [ ] AC02: Concurrent requests cannot exceed configured provider caps; quota exhaustion fails before outbound calls.
- [ ] AC03: The privacy notice matches observed behavior and does not promise zero vendor retention.

## CI and verification

- C1–C5, abuse concurrency suite and manual threat review.
- Run a cold untrusted-browser test against preview with disposable data.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Threat model and mitigation table
- Secret-scan logs
- Spend-cap concurrency proof

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Any confirmed secret/private-input exposure blocks public release and triggers revocation plus incident review.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
