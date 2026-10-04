# P08 — Build a small venue evidence ledger

> Implementation plan for a product phase. This phase is currently **complete** (2026-10-04). Qloo entity IDs remain unknown until the hackathon key arrives.

**Goal:** Make venue facts traceable and keep practical unknowns visible.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 2 · **Effort estimate:** 6 founder hours · **Depends on:** P03, P06 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `worker/src/venues/facts.ts`
- `docs/data/venue-policy.md`
- `data/venues-private.json`
- `tests/unit/venue-facts.test.ts`

Consumes the completed evidence and contracts from P03, P06. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [x] Choose 20–30 venues in the selected catchment and verify independently sourced name, address, official URL and category.
- [x] Resolve venue identity to Qloo only under confirmed mapping rights; manually check branches and duplicate names. (all mappings `unknown` until key)
- [x] Record source kind, observation time, expiry, exact field, value and confidence state rather than a single verified badge.
- [x] Implement configurable freshness: recheck time-sensitive facts before outing; conflicting sources remain conflicts.
- [x] Keep exact all-in price, seat availability and special requirements unknown unless the appropriate evidence exists.
- [x] Prepare public synthetic venue fixtures independent of proprietary provider output.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [x] AC01: Every material catalog fact has a source/time or an explicit unknown state; no unsupported booking/health/accessibility claim exists.
- [x] AC02: All candidate venue IDs map to the intended location; unknown mappings cannot enter the live Qloo slate.
- [x] AC03: Expired/conflicting facts stop ready status when required.

## CI and verification

- C1/C2 fact-state tests and manual audit of five sampled venues.
- Verify rights ledger permits every retained/displayed field.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Catalog coverage summary
- Five-venue source audit
- Freshness policy and synthetic provenance

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If 20 credible venues cannot be sourced in scope, narrow categories or select a better-covered catchment; do not scrape around blocked sources.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
