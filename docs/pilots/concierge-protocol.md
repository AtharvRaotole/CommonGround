# P04 Concierge protocol (pre-registered)

**Status:** Locked 2026-10-04 before outcome collection.  
**Owner:** founder (Atharv Raotole)  
**Phase:** P04 — Run the concierge test and week-one decision  
**Product:** Common Ground

Sections 1–5 are frozen before viewing formal outcomes. Deviations after outcomes must be logged, not silently rewritten.

---

## 1. Hypothesis and stop rule

**Hypothesis:** For one real upcoming small-group outing (4–8 adults), a manual Common Ground-style plan (constraints first, then taste ranking on a shared venue slate, three distinct options, private veto path, host decision) produces an actionable plan people will explicitly accept or reject — and Qloo-caused shortlist differences (when available) are valued differently from a competent non-Qloo baseline.

**Stop / change rules (from Decision 001; not rewritten here):**

- Venue checking consumes all saved effort → change hypothesis.
- Competent non-Qloo baseline preferred equally under identical constraints → Qloo-indispensability fails (record honestly; do not rescue with UI polish).
- Group will not submit any signals and will not decide → intake assumption fails.
- No real upcoming outing can be recruited → P04 remains incomplete; do not invent a completed pilot.

---

## 2. Population

| Field | Rule |
|---|---|
| Independent unit | One outing / one host decision |
| Size | 4–8 consenting adults |
| Path A (primary) | Founder-accessible friend/colleague group with a **real** upcoming meal/outing date |
| Path B (stretch) | Near-ICP operator from `docs/research/hosts-private.json` (H02 → H01 → H16 → H03 → H05 → H09) |
| Buyer label | Path A **does not** count as a qualified buyer interview for P02. Path B might, if they also complete research questions. |
| Consent | Adults only; voluntary; may skip cultural seeds; may withdraw; private seeds not shared with group |
| Exclusions | Synthetic personas; strangers matched by us; events already booked with zero venue choice left; groups that refuse any feedback |
| Planned sample for P04 | **n = 1** outing (exploratory). Not the later n=12 study. |

---

## 3. Conditions (arms)

Hold fixed across arms: same outing constraints, same checked venue slate (`venue-slate.json` version), same member inputs, same shortlist size (up to 3), same neutral card template, same fairness policy below.

| Arm | Method | Label shown to participants |
|---|---|---|
| **H** | Host's current baseline shortlist (what they would pick today, before seeing our ranks) | Method A / Method B (blind) |
| **E** | Explicit-preference ranker only (budget, diet tags, neighborhood, atmosphere keywords). No Qloo. No LLM inventing venues. | Method A / Method B (blind) |
| **Q** | Live Qloo candidate-restricted ranking of the **same** slate from confirmed cultural seeds | Deferred until key; never replace with synthetic affinities |

**Blinding:** When presenting H vs E (or later E vs Q), shuffle display order; hide method names. Collect willingness-to-attend **before** revealing method labels.

**Fairness policy (deterministic, manual for P04):**

1. Drop any venue that fails a hard requirement with verified evidence (unknown ≠ pass).
2. For each remaining venue, compute each member's ordinal rank under the arm.
3. Primary group score = **minimum** member ordinal position (1 = best). Prefer higher min (closer to 1) then lower sum of ranks.
4. Emit up to three distinct venues: best compromise, discovery (best among venues not in anyone's top-2 if possible), familiar fallback (explicit prior visit only; else skip that slot).

---

## 4. Metrics

| Role | Metric | Notes |
|---|---|---|
| **Primary** | Lowest member's 1–5 willingness-to-attend for the arm's first recommendation | Member ratings, not affinities |
| Secondary | Host chooses a preferred shortlist (blind); whether a veto occurs; whether host would use this again; founder minutes; host minutes |
| Denominator | All invited members who consented; abandoned intake counts as incomplete, not success |
| Ties | Record tie; do not invent lift |
| Missing data | Nonresponse ≠ acceptance |

**Week-one gates applied at the end (not changed after results):**

1. ≥1 real group receives actionable evidence-backed plan + explicit feedback (AC01).
2. Qloo-caused candidate changes observed and human value recorded — even if negative (AC02; **blocked** without live key).
3. Memo states which gates passed / failed / unresolved; broad build needs explicit continue/narrow (AC03).

---

## 5. Protocol sequence

1. Host fills host brief (date, catchment, budget, hard needs, current baseline shortlist of 3).
2. Members receive intake; cultural seeds optional (≤3); practical needs required if any hard constraint exists.
3. Freeze inputs + slate version. Timestamp.
4. Run hard-requirement filter; preserve unknowns.
5. Produce Arm H cards (host baseline) and Arm E cards (explicit ranker). Blind labels.
6. Members rate willingness-to-attend for each arm's #1 (and optionally top-3). Host picks preferred shortlist blind.
7. Reveal labels. Offer private veto on chosen plan; if veto, one manual revision.
8. Host decides: approve tentative plan / park / stop. Record that approval ≠ booking.
9. When Qloo key arrives: replay Arm Q on frozen inputs/slate; collect a short preference vs E without changing prior H/E answers; append to results.
10. Write Decision 002 build-gate from observed gates only.

**Assistance allowed:** Founder may clarify instructions; may not fill taste seeds for members or coach ratings.

**Privacy:** Pseudonyms `M1…Mn` in shared files. Real roster only in gitignored `roster-private.json` if needed.

**Promises forbidden in copy:** availability, allergy safety guarantees, completed reservation.

---

## 6. Observed results

See `concierge-results-private.json` (filled only after real responses).

## 7. Deviations

Log here with timestamp if anything in §§1–5 changes after outcomes begin.

| When | Change | Why | Before/after outcomes |
|---|---|---|---|
| — | — | — | — |

## 8. Decision

Reserved for Decision 002. Provisional path while waiting: **narrow continue build scaffolding** is allowed (P05/P06) with honest incomplete customer/Qloo gates; claiming “validated startup” is not.
