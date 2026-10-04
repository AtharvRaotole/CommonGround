# P16 — Render provenance-backed shortlists

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Explain the decision clearly without inventing reasons or exposing individual preferences.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 4 · **Effort estimate:** 4 founder hours · **Depends on:** P05, P14, P15 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `apps/web/src/features/planning/shortlist.tsx`
- `worker/src/providers/openai.ts`
- `tests/integration/explanations.test.ts`

Consumes the completed evidence and contracts from P05, P14, P15. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Render neutral venue cards with verified facts, timestamps, source links and unresolved items.
- [ ] Implement template explanations first; add at most two optional schema-constrained OpenAI rounds for language if testing justifies them.
- [ ] Permit only validated candidate/evidence IDs in generated output; reject invented claims and personal inferences.
- [ ] Show each participant their own relative ranking privately and only an aggregate compromise summary to the host.
- [ ] Label live vs synthetic mode persistently; keep a usable plain explanation when the model fails.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: LLM-01 through LLM-04 pass; every factual explanation clause has evidence or is removed.
- [ ] AC02: Host card contains no name-linked taste, rank matrix, objection reason or sensitive inference.
- [ ] AC03: OpenAI failure leaves a valid Qloo result usable with a deterministic explanation.

## CI and verification

- C1–C4 and manual provenance/copy audit of five outputs.
- No LLM-as-judge alone can pass factual correctness.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Explanation schema and rejection logs
- Source-linked card screenshots
- Language-off comparison

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

Attractive prose must not change the evaluated venue selection or imply unsupported causal affinity explanations.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
