# Runtime report (P23) · 2026-10-06

## Sample

- Sessions: 30 synthetic guided planning runs
- Completes: 30
- Data mode: synthetic_local

## Timing (ms)

| Stat | Value |
|---|---|
| min | 0.6 |
| p50 | 0.7 |
| p95 | 6.2 |
| max | 10.4 |

Targets: typical < 20000ms · p95 < 30000ms  
**Decision:** Local sample meets timing targets (local Node/SQLite only — not Cloudflare isolate CPU).

## Operating caps (pilot)

| Cap | Value |
|---|---|
| Qloo calls / run | 24 |
| Lookups global / day | 200 |
| Mutating API global / day | 2000 |
| OpenAI $ envelope | $0 (language off by default) |

## Notes

- Measured in local Vitest against in-memory SQLite — not Cloudflare isolate CPU.
- Deployed C7 sample still required after live Qloo key for Free Worker CPU proof.
- Static assets use ASSETS binding with `run_worker_first=/api/*` only.
