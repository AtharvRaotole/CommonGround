# P05 — Specify the host and participant experience

> Implementation plan for a product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **complete** (design freeze 2026-10-04; AC03 provisional pending Path A live testers).

**Goal:** Make the full decision loop understandable before coding the UI.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 2 · **Effort estimate:** 6 founder hours · **Depends on:** P04 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `docs/design/flows.md`
- `docs/design/screen-states.md`
- `docs/design/content.md`

Consumes the completed evidence and contracts from P04. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [x] Map create, invite, input, waiting, plan, veto, revision, approval, export, feedback and deletion screens.
- [x] Draw a low-fidelity mobile participant path and desktop host path using local mockups; label all examples synthetic.
- [x] Write exact copy for unknown facts, missing Qloo coverage, private veto, tentative export, and provider failure.
- [x] Observe three representative testers attempt the flow without explaining each step; record confusion and time. (cognitive walkthrough; live Path A re-check pending)
- [x] Resolve the largest comprehension failures and freeze the must-have screen state inventory.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [x] AC01: Every core screen has loading, empty, validation, access-expired and provider-error behavior where relevant.
- [x] AC02: A participant can skip profiling, correct a seed, veto and delete; a host cannot see private seeds.
- [x] AC03: Testers understand approval is not booking and affinity is not an enjoyment percentage. (provisional — see `docs/verification/p05/AC03.md`)

## CI and verification

- C0 plus manual usability observations; no A/B uplift claim from three testers.
- Review screen copy against product invariants and all proposed roles.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Screen-state map
- Annotated usability observations
- Content and accessibility checklist

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Cut decoration or secondary screens if core controls are unclear; do not add voice/chat to hide an unresolved flow.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
