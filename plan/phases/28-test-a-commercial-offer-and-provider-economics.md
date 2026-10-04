# P28 — Test a commercial offer and provider economics

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Determine whether a credible payable service exists under actual provider terms.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 7 · **Effort estimate:** 4 founder hours · **Depends on:** P25, P26 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `docs/business/offer-test.md`
- `docs/business/unit-economics.json`
- `docs/vendor-rights.md`

Consumes the completed evidence and contracts from P25, P26. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Use the pricing anchors to choose one concrete bounded offer informed by measured usage and support.
- [ ] Seek five dated nonbinding exact-offer commitments from budget owners, including rejection reasons.
- [ ] Obtain actual Qloo commercial permission/pricing through a founder-authorized exchange before charging anything.
- [ ] Calculate contribution under typical and heavier measured usage including provider cost, support and venue maintenance.
- [ ] Compare results to the provisional 70% contribution target and document unknown inputs instead of zeroing them.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Offer, price, usage cap, budget owner and start condition are explicit for every commitment.
- [ ] AC02: No payment/deposit occurs before intended use is permitted; intent is not labeled revenue.
- [ ] AC03: Economics uses an actual provider quote or remains not calculable; a 9 score cannot bypass this gate.

## CI and verification

- C0/manual arithmetic and source audit; no automated purchase or billing flow.
- Verify the score uses actual evidence rather than generic stated interest.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Private nonbinding intent records
- Cost sensitivity model
- Commercial rights decision

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If rights/pricing cannot support free-tier prototype or sustainable business, separate the hackathon artifact from the startup thesis and stop commercial claims.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
