# P22 — Rehearse provider and data failures

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Prove failure states preserve honesty and allow recovery.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 6 · **Effort estimate:** 4 founder hours · **Depends on:** P15, P17, P21 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `tests/integration/provider-faults.test.ts`
- `tests/e2e/outages.spec.ts`
- `docs/operations/provider-failures.md`

Consumes the completed evidence and contracts from P15, P17, P21. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Inject Qloo 401,403,429,500, timeout, malformed JSON, extra candidates and empty rankings.
- [ ] Inject OpenAI refusal, schema failure, excessive text and timeout; exercise template fallback.
- [ ] Expire venue evidence during a run and revoke a member before approval.
- [ ] Exhaust budgets and cancel while calls are in flight; verify no later automatic outbound work.
- [ ] Reopen the browser after interruption and verify stale/current run handling.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: OPS-01 to OPS-03 and LLM failure cases pass with correct retry/stop behavior.
- [ ] AC02: Failed or synthetic paths never display live-success claims.
- [ ] AC03: Uncertain spend remains counted; retries cannot loop indefinitely.

## CI and verification

- C2–C4 fault suite; manual check of user-facing recovery messages.
- Inspect bounded call trace for every fault, not just response status.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Fault matrix
- Per-failure call counts
- Recovery screenshots

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Avoid hiding provider failure behind an unrelated generic recommendation; that invalidates the Qloo differentiator.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
