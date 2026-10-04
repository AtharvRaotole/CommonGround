# Decision 004 — Compromise ranking policy

**Status:** Accepted · **Date:** 2026-10-04 · **Phase:** P14  
**Policy version:** `2026-10-04-v1` (`COMPROMISE_POLICY`)

## Decision

Group shortlists are produced from **ordinal ranks on one common slate**, not from averaged raw Qloo affinities.

Primary ordering (best compromise):

1. Minimize worst-member rank (`max_i r_i(v)`)
2. Then minimize mean rank
3. Then prefer higher host-checked suitability
4. Then stable venue id

A second **mean-rank alternative** is offered when a different venue wins on mean rank.  
A **familiar fallback** appears only when an explicit prior visit or participant-provided familiarity id is supplied — popularity alone does not justify the label.

Show at most three distinct venues; show fewer when fewer are supported. Hard-vetoed venues never appear.

## Consequences

- Classic case: ranks `[1,1,1,12]` vs `[5,5,5,5]` → compromise picks the second (lower worst); mean-rank alternative picks the first.
- Copy must describe relative compromise and uncertainty. Forbidden: percent likelihood, “will enjoy”, mathematically optimal happiness, unqualified fairness guarantees.
- Host APIs expose aggregate alternatives only — never per-member rank vectors.
- Changing this rule requires a new policy version and decision record before human studies.

## Limitations (shown in product)

- Ordinal ranks lose preference intensity.
- Equal member weight is a design choice, not proven fairness.
- Results are relative on one slate, not calibrated visit probability.
- Participant acceptance can override the algorithm’s top result.
