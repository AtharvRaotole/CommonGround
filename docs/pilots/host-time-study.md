# P26 — Host time study

**Status:** Protocol ready · observations **incomplete** (0/12 groups)  
**Date:** 2026-10-04 · **Owner:** founder

## Purpose

Measure whether Common Ground reduces *active* host work versus the host’s current workaround on a paired occasion, without counting researcher labor as product success.

## What counts as host active time

Include:

- Checking member completion
- Correcting constraints / venue facts
- Troubleshooting join links, exports, and calendar handoff
- Reading shortlist explanations and deciding

Exclude from the product arm total:

- Founder fact maintenance
- Founder support chat that the host did not initiate as a normal user
- Study-instruction reading unique to research

## Pairing

| Arm | Description |
|---|---|
| Workaround | Host’s usual thread / spreadsheet / gut shortlist |
| Product | Common Ground end-to-end through export |

Counterbalance order across groups when practical. Record differing event conditions (size, neighborhood, hard needs) in the ledger; do not pool unequal occasions without a note.

## Recording

1. Start timer when host begins planning work for that arm.
2. Pause only for unrelated interruptions; do not pause for product confusion.
3. Log minutes in `workflow-ledger-private.json` under `host_active_minutes` and separately `founder_support_minutes`.
4. Keep abandoned sessions with `abandoned: true` — they stay in the denominator.

## Gate (P26 AC02)

- Median paired host-time reduction ≥ 20% **and** acceptance not lower.
- ≥ 10/12 groups complete intake without researcher data entry.

Until N≥12 with complete pairs, report **incomplete** — never invent uplift.

## Current sample

| Metric | Value |
|---|---|
| Enrolled groups | 0 |
| Paired observations | 0 |
| Median Δ host minutes | n/a |
| Intake without researcher | 0/0 |

## Limitations

- Calendars may exceed eight weeks; launch assessment must stay honest if repeat events have not happened.
- P04 Path A alpha (if any) is recruitment practice, not comparative evidence.
