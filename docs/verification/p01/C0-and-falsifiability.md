# P01 CI / manual checks

## C0 plan validation

```sh
python3 plan/tools/verify_plan.py
```

Observed (2026-10-03):

```json
{
  "result": "PASS",
  "phases": 32,
  "planned_hours": 192,
  "contingency_hours": 48,
  "weekly_hours": 30,
  "startup_score": 4.7,
  "markdown_files_checked": 59,
  "errors": []
}
```

External factual assertions in the scope lock are traced in `docs/research/source-ledger.json` (S01–S06) back to URLs also indexed in `plan/SOURCES.md`.

## Manual product review — falsifiability

| Stop result that would kill or force change | Why it falsifies |
|---|---|
| ≥3/5 qualified interviews show no recurring venue-selection rework (fixed venues or acquisition-only pain) | Buyer/job hypothesis fails |
| Concierge/controlled comparison: competent non-Qloo baseline preferred equally under identical constraints | Qloo-indispensability fails |
| Founder cannot access a city with verifiable venues and reachable hosts | City/access assumption fails → change city or stop |
| Terms/key deny required demo processing or commercial path when claiming a startup | Rights assumption fails |
| Intake abandonment makes voluntary seeds unavailable after reducing questions | Intake assumption fails |

**Verdict:** Stop conditions exist; hypothesis is falsifiable on paper. No interview or live API evidence yet—week-one gates remain untested.
