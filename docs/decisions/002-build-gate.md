# Decision 002 — Week-one build gate (P04)

- **Date and owner:** 2026-10-04 · founder (Atharv Raotole)
- **Decision under consideration:** Whether evidence from the concierge test + prior week-one gates is enough to continue broad product build, narrow scope, pivot, or stop.
- **Status:** **OPEN — awaiting Path A outing outcomes.** Scaffold and protocol locked; results not yet collected. This file must not be marked continue/stop until AC records are filled from real feedback.

## Current hypothesis / previous decisions

- Decision 001: Common Ground scope lock (NYC catchment, 4–8, ≤3 seeds, 30 h/week).
- P02 discovery decision: **Narrow continue (provisional)** with interview AC fail/incomplete; P04 was blocked until a real outing exists.
- P03: Live Qloo blocked on key; rights persistence/commercial still constrained.
- P04 path lock (this session): **Path A primary** (real friend/colleague outing). Path B stretch.

## Evidence IDs (so far)

| ID | Artifact | Class |
|---|---|---|
| E-P01 | `docs/decisions/001-scope.md` | Scope lock |
| E-P02 | `docs/research/discovery-decision.md` | Customer gate incomplete |
| E-P03 | `docs/verification/qloo-capability-matrix.md` | Key pending |
| E-P04-PROTO | `docs/pilots/concierge-protocol.md` | Pre-registered protocol |
| E-P04-SLATE | `docs/pilots/venue-slate.json` | Desk-checked slate |
| E-P04-RES | `docs/pilots/concierge-results-private.json` | Outcomes (empty) |

## Options (to choose after results)

1. **Continue** broad build (P05+) with week-one gates passed.
2. **Narrow continue** — build for hackathon demo with explicit unresolved customer and/or Qloo-lift gates.
3. **Pivot** buyer or job.
4. **Stop** startup claim (hackathon artifact only, if desired).

## Chosen option

**Pending outcomes.** Working operating rule until then:

- Do **not** fake-pass AC01–AC03.
- Path A recruitment and Arm H/E run immediately.
- Arm Q deferred until key; AC02 stays blocked until then.
- Provisional engineering (P05 UX spec, P06 repo/CI) may proceed **labeled provisional**, because waiting idle for a Sunday key wastes the only scarce resource (founder hours). Claims in public copy must match evidence.

## Gate scorecard (frozen rules; fill Observed after run)

| Gate | Required | Observed | Status |
|---|---|---|---|
| AC01 real outing + feedback | ≥1 actionable plan + explicit feedback | — | incomplete |
| AC02 Qloo-caused changes valued | Observe diffs; record human value even if negative | — | blocked (no key) |
| AC03 week-one memo | Explicit continue/narrow/pivot/stop | this file open | incomplete |
| P02 interview pain | ≥3/5 qualified | 0 | fail / incomplete |
| P03 live Qloo | usable lookup + candidate rank | key pending | blocked |

## Consequences (pre-committed)

| Area | Rule |
|---|---|
| Customer | Path A success ≠ buyer validation. Keep P02 incomplete until real host interviews. |
| Scope | Catchment and slate v1 locked for this outing. |
| Data rights | No persistence of Qloo payloads; no commercial claims. |
| Timeline | Recruit today; score cards within 48h of intakes; Decision 002 closed within 24h of scores (or explicitly deferred if Q-only pending). |

## Reversal trigger

Any fabricated pilot, silent threshold rewrite, or labeling synthetic affinities as Qloo voids this decision and requires a new record.

## Next verification and owner

1. Founder sends Path A invite (see `docs/pilots/recruitment.md`).
2. Fill host brief + member intakes.
3. Run Arms H/E; update AC01 verification.
4. On key arrival: Arm Q replay; update AC02.
5. Close this decision with a dated Chosen option.
