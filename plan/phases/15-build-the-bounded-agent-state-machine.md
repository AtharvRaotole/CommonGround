# P15 — Build the bounded agent state machine

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Turn recommendation into a resumable tool-using workflow with enforceable budgets and approvals.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 4 · **Effort estimate:** 8 founder hours · **Depends on:** P07, P11, P13, P14 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `worker/src/planning/machine.ts`
- `worker/src/planning/tools.ts`
- `worker/src/planning/budget.ts`
- `tests/integration/run-machine.test.ts`

Consumes the completed evidence and contracts from P07, P11, P13, P14. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Implement typed state transitions and stage outputs, event versions, deadlines, idempotency and cancellation.
- [ ] Register the seven allowlisted tools, including request_missing_input. In agent mode, require one real schema-validated model tool choice from permitted current-state actions, with at most two model rounds; enforce role/consent independently. Label the model-off fallback guided planning.
- [ ] Slice work into at most two external requests per step and at most three active provider calls globally per run.
- [ ] Reserve budgets atomically before each outbound call; keep unknown outcomes charged pending reconciliation.
- [ ] Persist only permitted normalized state; stop if necessary storage/display rights are unresolved.
- [ ] Expose real stage/count progress and resume only still-current, unexpired runs.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: FLOW-01 through FLOW-06 pass under concurrent and retry scenarios.
- [ ] AC02: 24 Qloo attempts/run includes retries; deadline and global quotas cannot be bypassed by extra step requests.
- [ ] AC03: State machine cannot approve, send, book or charge from a model output; cancellation stops new outbound calls.

## CI and verification

- C1–C4, concurrency/fault tests and code review of every external call site.
- Inspect a real redacted trace to distinguish executed tools from decorative status text.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Transition table and trace
- Atomic-budget concurrency test
- Resume/cancel browser recording

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If free runtime cannot support a durable stage, reduce the stage/input size; never add unbounded background work or a paid queue unnoticed.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
