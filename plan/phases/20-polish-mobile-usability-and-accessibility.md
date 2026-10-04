# P20 — Polish mobile usability and accessibility

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Make the complete experience usable and coherent enough for unassisted participants.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 5 · **Effort estimate:** 7 founder hours · **Depends on:** P16, P18, P19 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `apps/web/src/styles/`
- `apps/web/src/components/`
- `tests/e2e/accessibility.spec.ts`
- `docs/design/usability-round-two.md`

Consumes the completed evidence and contracts from P16, P18, P19. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Apply consistent typography, spacing, one accent and meaningful motion to the approved flow.
- [ ] Check 360px and 1280px layouts, 200% zoom, touch targets and no horizontal trapping.
- [ ] Run axe-core and then keyboard/screen-reader walkthroughs for invite, seed selection, plan and export.
- [ ] Observe three new testers; prioritize confusing privacy, unknown-fact and approval states.
- [ ] Replace unauthorized imagery with text/original CSS or properly licensed assets and record provenance.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: UI-01 to UI-03 pass for the primary journey; automated critical/serious issues are fixed and manual findings logged.
- [ ] AC02: No key action requires hover, color alone, fine pointer accuracy or a voice/chat response.
- [ ] AC03: Content consistently distinguishes preference, verified fact, unknown and actual action.

## CI and verification

- C1/C4 plus manual assistive-technology observations.
- Visual regression is reviewed for meaning, not accepted solely by snapshot update.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Desktop/mobile screenshots
- Accessibility audit
- Usability fixes with observed rationale

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If behind schedule, reduce visual novelty; do not cut legibility, keyboard access or privacy controls.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
