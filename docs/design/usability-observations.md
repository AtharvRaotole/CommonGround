# Usability observations (P05)

**Date:** 2026-10-04  
**Method:** Cognitive walkthrough (provisional). Three representative personas.  
**Expert decision:** Real Path A members will re-run this cold when intakes arrive. Not claiming lab usability study.

## Personas

| ID | Role | Device | Goal |
|---|---|---|---|
| T1 | Host "Irina-type" | Desktop 1280 | Create outing, invite, approve, export |
| T2 | Participant willing | Mobile 360 | Join, add 2 seeds, accept plan |
| T3 | Participant privacy-anxious | Mobile 360 | Skip seeds, set vegetarian hard need, veto once |

## Tasks & findings

### T1 Host

| Step | Confusion | Time (est.) | Fix frozen into design |
|---|---|---|---|
| Create outing | "Is this booking?" risk | 45s | Permanent approval≠booking line on S10/S11 |
| Waiting room | Unclear who finished | 30s | Completion `claimed/profiled/total` counts |
| Shortlist | Affinity as % temptation | 60s | Explicit non-% copy on cards |
| Export | Might think ICS = reserved | 20s | ICS + UI both say unconfirmed |

### T2 Participant

| Step | Confusion | Time (est.) | Fix |
|---|---|---|---|
| Claim link | Fear of account signup | 20s | "No password — one-time join for this outing" |
| Seed search | Ambiguous artist names | 40s | Force disambiguation; never silent UUID |
| Accept | Thinks host already booked | 15s | Accept copy: "I'm willing — host still reserves" |

### T3 Skip + veto

| Step | Confusion | Time (est.) | Fix |
|---|---|---|---|
| Skip profiling | Worry skip blocks join | 10s | Skip is primary secondary CTA, equal visual weight |
| Veto privacy | "Will they know it was me?" | 25s | Pre-submit helper + post aggregate-only message |
| Delete | Can't find | 20s | Footer link on S05/S07 always visible |

## Largest comprehension failures resolved

1. Booking confusion → permanent teaching copy (AC03).
2. Affinity-as-probability → banned % framing in content.md.
3. Skip shame → skip path elevated in S05 wire.

## AC03 status

Provisional pass on design/copy freeze. **Live tester confirmation still required** when Path A group scores cards — then update `docs/verification/p05/AC03.md`.
