# Provider failure runbook (P22)

## Fault matrix

| Fault | User-visible behavior | Retry? | Budget |
|---|---|---|---|
| Qloo 401/403 | `unavailable` / auth failure; guided or synthetic path; no live-success banner | No (config) | Attempt counted |
| Qloo 429 | Rate-limited status; stop or back off within deadline | Bounded | Attempt counted |
| Qloo 500 / timeout / malformed | Unavailable/timeout; honest message | Bounded | Attempt counted |
| Qloo extra/unexpected IDs | Rejected; catalog allowlist only | N/A | Attempt counted |
| Qloo empty rankings | `needs_input` / no fabricated affinities | N/A | Attempt counted |
| OpenAI down / schema fail | Template explanations remain; mode labeled guided if tool choice fails | No unbounded loop | Language optional |
| Budget exhausted | 429 before outbound | No | Fail closed |
| Cancel mid-run | No new outbound steps | N/A | In-flight may still cost |
| Stale event version | Run fails `stale_version` | Fresh run | N/A |

## Recovery copy (product)

- Qloo: “Cultural ranking is temporarily unavailable. Retry, or continue in guided mode.”
- OpenAI: “Explanations are offline. Rankings and constraints still apply.”
- Example route `/example` always available and labeled synthetic.

## Rule

Never replace a provider failure with an unlabeled “live” recommendation. Synthetic and guided paths must stay labeled.
