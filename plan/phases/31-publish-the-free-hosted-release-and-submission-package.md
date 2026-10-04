# P31 — Publish the free hosted release and submission package

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Deliver an accessible public application and inspectable source within the confirmed access conditions.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 8 · **Effort estimate:** 6 founder hours · **Depends on:** P28, P29, P30 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `README.md`
- `docs/setup.md`
- `docs/privacy.md`
- `docs/submission.md`
- `docs/operations/production-smoke.md`

Consumes the completed evidence and contracts from P28, P29, P30. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Prepare production config, separate D1, allowed secrets and measured quotas with no paid upgrade.
- [ ] Publish code with license, setup, synthetic fixtures and exclusions for proprietary data; founder reviews any external publication.
- [ ] Deploy the verified Worker/assets and run cold-browser end-to-end smoke on public URL.
- [ ] Verify legitimate judges have usable live access and provider approval lasts for the required testing window.
- [ ] Prepare the Devpost fields and source/demo links; actual submission is a reviewed founder action.
- [ ] Record the requested hypothetical week-eight schedule separately from the real event deadline.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Public URL supports the core live task; repository is inspectable and reproducible with approved keys.
- [ ] AC02: No private pilot record, key or proprietary raw response is published; app-code license is visible.
- [ ] AC03: Submission package truthfully states measured results and limitations; no claim that the eight-week schedule meets the actual October cutoff.

## CI and verification

- C5 plus production synthetic smoke and bounded live smoke.
- Manual new-user/judge access and public-source audit.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Public URLs and release SHA
- Production smoke report
- Submission draft and published-state checklist

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If permitted public live access is missing, the project is not submission-ready; do not call a local app or replay-only page compliant.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
