# P03 — Verify Qloo access rights and deployed feasibility

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Prove the technical and permission assumptions with the actual approved account before treating Qloo as usable infrastructure.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 1 · **Effort estimate:** 8 founder hours · **Depends on:** P01 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `spikes/qloo-contract.ts`
- `docs/verification/qloo-capability-matrix.md`
- `docs/vendor-rights.md`
- `fixtures/synthetic/qloo-contract.json`

Consumes the completed evidence and contracts from P01. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Request a hackathon key through the official form if needed; the founder submits account details and retains the actual applicable terms.
- [ ] Use the documented hackathon host, GET and X-Api-Key; test search disambiguation and place Insights with confirmed real IDs.
- [ ] Resolve representative seed types and a preliminary venue slate; measure returned/missing candidate IDs and contradictory filter probes.
- [ ] Run one candidate-restricted query per test member on the same slate; inspect actual schema, affinity meaning and optional explainability.
- [ ] Deploy a tiny free Worker probe and measure response size, parse CPU, latency and failure behavior without logging seeds/keys.
- [ ] Record numerical quotas only when issued; clarify public display, temporary state, normalized output, exports, OpenAI processing and commercial use in a draft question list the founder can send.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Redacted live evidence proves entity lookup and candidate-restricted rankings; missing/extra rows and silently ignored filters are detected.
- [ ] AC02: A representative provider response can be parsed within Free Worker limits or a smaller workable configuration is demonstrated.
- [ ] AC03: Demo-processing rights and required persistence are confirmed or explicitly block the dependent implementation; commercial rights are not assumed.
- [ ] AC04: No API secret or proprietary response has entered public fixtures, logs or git.

## CI and verification

- Bounded C6 live contract; C7 deployed CPU probe; no brute-force quota test.
- Manual rights review against the actual issued terms, with unresolved items and owner. Test synthetics cannot establish live access.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Capability matrix with dates and tested IDs redacted as required
- Observed latency/CPU/payload sample
- Applicable terms references and unanswered provider questions

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Key delays are elapsed-time blockers. Continue discovery/design in parallel, but never replace missing live evidence with fabricated fixtures or pay for access silently.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
