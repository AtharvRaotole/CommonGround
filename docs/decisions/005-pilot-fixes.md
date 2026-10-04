# Decision 005 — Pilot friction fixes (≤3)

**Status:** Accepted for product regressions · retention gate **incomplete**  
**Date:** 2026-10-04 · **Phase:** P27  
**Note:** Spec path said `004-pilot-fixes.md`; `004` is already ranking policy — this record is `005`.

## Evidence source

Observed in P20 founder cold passes (`docs/design/usability-round-two.md`) and locked by e2e regressions. Not from 12 live pilot hosts (those remain unenrolled).

## Selected changes (max three)

| # | Observed problem | Severity | Change | Resolution measure |
|---|---|---|---|---|
| 1 | Waiting room had no path to plan | Serious | “Open plan” affordance on waiting page | e2e: waiting exposes plan navigation |
| 2 | Export vs tentative state easy to miss | Serious | Persistent export banner + reservation disclaimer | e2e: export page shows tentative/ready banner language |
| 3 | Unknown facts read as soft suggestions | Moderate | “Unknown:” styling + readiness gate before treat-as-ready | e2e: example/demo surfaces Unknown: labels |

## Explicitly out of scope

- New cities, paid billing, OpenAI-required explanations
- Researcher-mandated second trials counted as retention
- Fake voluntary-return rows

## Retention gate (AC02)

8/12 hosts voluntarily starting and completing a subsequent real event. Researcher-mandated seconds do not count. Elapsed window has not produced measurements → **unvalidated** (AC03).

## Rubric impact

| Category | Before | After | Citation |
|---|---|---|---|
| Workflow clarity | weak on waiting→plan | improved (synthetic) | P20 + regressions |
| Export honesty | easy to miss tentative | improved (synthetic) | ExportPage banner |
| Voluntary return | unknown | **still unknown** | `docs/pilots/repeat-use.md` |
