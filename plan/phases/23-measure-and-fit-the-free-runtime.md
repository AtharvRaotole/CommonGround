# P23 — Measure and fit the free runtime

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Verify real CPU latency and quota use under realistic small-pilot behavior.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 6 · **Effort estimate:** 6 founder hours · **Depends on:** P18, P21, P22 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `scripts/measure-runtime.ts`
- `docs/verification/runtime-report.md`
- `worker/src/planning/machine.ts`

Consumes the completed evidence and contracts from P18, P21, P22. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Run at least 30 representative bounded staging sessions with permitted data and record timing distribution/sample composition.
- [ ] Measure dynamic requests, Qloo attempts including lookups/retries, OpenAI tokens, D1 scans/writes/storage and Worker CPU.
- [ ] Include eight-member/30-venue input, empty responses, verbose payloads, replan and concurrent sessions.
- [ ] Reduce response take, stage size, libraries or catalog size when CPU fails; retest affected cases.
- [ ] Set measured pilot global caps below confirmed provider ceilings, with owner-approved OpenAI monetary envelope.
- [ ] Verify normal static asset delivery does not unnecessarily invoke the Worker.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Selected configuration meets Free CPU and subrequest limits with no quota error in tested workload.
- [ ] AC02: Typical recommendation target under 20s and provisional p95 under 30s are met or honestly revised with evidence before release.
- [ ] AC03: Cost ledger includes all attempts and lookups; no paid upgrade or unapproved overage exists.

## CI and verification

- C7 deployed measurement plus C1–C4 after any optimization change.
- Review report as a bounded sample, not an internet-scale load guarantee.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Runtime/cost measurements
- Chosen operating caps
- Measured-versus-target decision

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If Free CPU remains insufficient after reducing scope, do not promise this architecture is viable; choose a verified free alternative or stop the live release.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
