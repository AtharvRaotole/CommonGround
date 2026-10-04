# P01 — Lock the hypothesis and evidence rules

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Make the customer, claim boundaries, and eight-week scope explicit before spending build time.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 1 · **Effort estimate:** 2 founder hours · **Depends on:** None · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `docs/decisions/001-scope.md`
- `docs/research/source-ledger.json`
- `docs/research/assumptions.json`

Consumes the completed evidence and contracts from None. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Read chapters 00, 01 and 06; write one buyer/job statement and record the founder’s real weekly capacity.
- [ ] Record the five competing concepts and why each was rejected or retained; distinguish a design opinion from customer evidence.
- [ ] Assign an owner and falsification test to key, coverage, willingness-to-pay, intake, and free-runtime assumptions.
- [ ] Choose one accessible city; record whether the founder can personally verify venues and recruit qualified hosts.
- [ ] Freeze the score weights and first-week continuation thresholds before seeing any interview results.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Exactly one first customer, one primary job and one city assumption are named; group size is 4–8 and seeds are at most three per participant.
- [ ] AC02: Every numerical target is labeled target/estimate/scenario; no invented customers, market size or measured uplift appears.
- [ ] AC03: The 192-hour work budget plus 48-hour contingency is reconciled to actual capacity; missing capacity information remains an explicit assumption.

## CI and verification

- C0 plan validation; manually trace every external factual assertion to a source.
- Manual product review: identify a result that would cause us to stop. If none exists, the hypothesis is not falsifiable.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Scope decision with date/owner
- Source and assumption registers
- Frozen initial scoring rubric

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If founder access contradicts NYC, change city now and propagate the change; do not buy data or invent access.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
