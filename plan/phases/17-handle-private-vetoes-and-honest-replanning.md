# P17 — Handle private vetoes and honest replanning

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Demonstrate an agent that revises a shared decision when a person objects.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 5 · **Effort estimate:** 6 founder hours · **Depends on:** P15, P16 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `worker/src/planning/machine.ts`
- `apps/web/src/features/planning/revisions.tsx`
- `tests/e2e/veto-replan.spec.ts`

Consumes the completed evidence and contracts from P15, P16. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Store veto ownership and private reason category; generic group summaries reveal neither identity nor reason.
- [ ] Invalidate old approval and recompute after veto without reintroducing vetoed venues.
- [ ] Reindex ranks on a changed common set; fetch again only when required and within a new explicitly initiated run budget.
- [ ] Show concise added/removed/changed information and preserve previous permitted revision metadata.
- [ ] Handle all-veto/no-feasible-candidate with an explicit participant-approved constraint-change request.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Two-member simultaneous vetoes remain effective; neither is lost in a last-write race.
- [ ] AC02: Vetoed venue never appears in revised card, explanation or export until its owner withdraws the veto.
- [ ] AC03: Replanning exposes what changed and requires host review on the new version.

## CI and verification

- C1–C4; RANK-01, FLOW-01/02 and private DTO integration cases.
- Cold observer sees a real change in venue choices, not merely rewritten prose.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Versioned veto/replan trace
- Concurrency test
- No-feasible-state observation

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Small-group inference can reveal who objected despite generic copy; disclose this privacy limit and avoid detailed aggregate breakdowns.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
