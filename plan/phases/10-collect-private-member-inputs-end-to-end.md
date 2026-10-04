# P10 — Collect private member inputs end to end

> Implementation plan for a future product phase. Use the available Superpowers executing-plans workflow task by task; review the linked specification and evidence gates before coding. This phase is currently **planned**, not complete.

**Goal:** Let real group members join and provide voluntary preferences with privacy and deletion.

**Architecture:** One TypeScript web app, a bounded Cloudflare Worker state machine, D1 application state, Qloo cultural ranking and optional OpenAI language handling. Customer/research phases produce evidence instead of software.

**Tech stack:** React, Vite, TypeScript, Worker/D1, Vitest, Playwright; versions pinned in P06.

**Spec:** [Product](../02-product-spec.md), [architecture](../04-architecture-and-data.md), [quality](../07-quality-ci-and-verification.md), [validation](../06-startup-score-and-validation.md).

**Week:** 3 · **Effort estimate:** 6 founder hours · **Depends on:** P07, P09 · **Owner:** founder, with consenting pilot host/reviewer when required.

## Global constraints

- A changed member, constraint, venue fact, or candidate slate invalidates the previous approval.
- Hard requirements are evaluated before taste ranking. An unknown requirement is not a passed requirement.
- No non-OpenAI paid dependency is required for the planned prototype; Qloo access is conditional on the event program and its terms.
- Numerical thresholds are proposed targets; synthetic results never count as customer or live-provider evidence.

## Deliverables and interfaces

Create or change these proposed product paths (not present merely because this plan names them):

- `apps/web/src/routes/join.tsx`
- `apps/web/src/routes/waiting.tsx`
- `worker/src/privacy/delete.ts`
- `tests/e2e/member-intake.spec.ts`

Consumes the completed evidence and contracts from P07, P09. Produces the artifacts below for dependent phases. Use the shared types and routes in chapter 04; any contract change requires updating the spec and affected tests first.

## Work steps

- [ ] Implement invitation claim, explicit consent, optional seeds and structured practical requirements.
- [ ] Show aggregate completion counts to the host and only the member’s own profile to that member.
- [ ] Add a skip-profiling mode that uses explicit votes/preferences and remains in coverage counts.
- [ ] Implement edit/delete and derived-result invalidation; never infer acceptance from nonresponse.
- [ ] Test two browser identities and a host simultaneously using separate contexts.

For consequential code changes, first write the specific failing assertion described by the AC, run the focused test to demonstrate the failure, implement the smallest behavior, rerun the focused and affected integration checks, then commit the self-contained result. For research, complete the recorded observation and counterexample review instead of manufacturing a software test.

## Acceptance criteria

- [ ] AC01: Four synthetic participants can join independently; host sees counts without taste lists or individual objection reasons.
- [ ] AC02: Opt-out participants remain in the group and are not assigned invented ranks.
- [ ] AC03: Delete removes own input and invalidates dependent results; unrelated members are unaffected.

## CI and verification

- C1–C4 including DATA-01 and AUTH-02; inspect server JSON for privacy leaks.
- Manual mobile and keyboard intake walkthrough.

CI profile commands are defined in [chapter 07](../07-quality-ci-and-verification.md). Customer acceptance requires human evidence even when C0 passes.

## Evidence required for completion

- Multi-session browser report
- Deletion verification
- Consent text version

For each AC, use [the verification record](../templates/verification-record.md) to capture observed result, command or observation, revision, data mode, date and limitations. Do not check the box because its scheduled week has arrived.

## Risk, rollback and stop rule

If private inputs leak, stop group testing. If intake is too burdensome, reduce questions before optimizing ranking.

Rollback software with the last compatible Worker version and tested migration recovery; revoke affected disposable capabilities when authorization changes. Preserve research evidence, including failed hypotheses, while honoring deletion/consent rules. A failed mandatory gate blocks dependent work; independent research can continue.
