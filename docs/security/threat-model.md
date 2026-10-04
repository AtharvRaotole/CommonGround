# Threat model — public demo (P21) · 2026-10-04

Extends [P07 notes](../verification/p07/threat-model.md) for public preview spend and privacy.

## Assets

| Asset | Sensitivity |
|---|---|
| Cultural seeds / preferences | High — never in host DTO, logs, or telemetry detail |
| Veto reason category | High — host sees aggregate count only |
| Capability secrets / session cookies | High — hashed at rest; HttpOnly cookies |
| Qloo / OpenAI API keys | Critical — Worker secrets only |
| Approved export / ICS | Medium — host-only; reservation unconfirmed |

## Trust boundaries

Browser ↔ Worker (`/api/*`) · Worker ↔ D1 · Worker ↔ Qloo/OpenAI · Host vs member roles · Static assets (no Worker on normal asset hits when `run_worker_first` is `/api/*` only).

## Mitigations

| Threat | Mitigation | Test |
|---|---|---|
| CSRF / cross-site write | Origin allowlist on mutating `/api/*` | AUTH-05 |
| IDOR preference read | Event-scoped queries; generic 404 | AUTH-01/02 |
| Claim replay | Single-consume UPDATE | AUTH-03 |
| Token theft (copied cookie) | Short TTL; deletion revokes; documented residual | AUTH-04 + notice |
| Unbounded body / DoS | 48KB body cap; session/IP/global request meters | abuse suite |
| Provider spend runaway | Lookup + run Qloo ceilings reserved before outbound | FLOW-04, OPS-03 |
| Log leakage of seeds/keys | Telemetry scrub; no raw provider payloads logged | abuse AC01 |
| Prompt injection via venue text | Scrub + allowlisted tools only | LLM-02 |
| ICS injection | Escape + structural token neutralize | EXPORT-01 |
| Arbitrary URL fetch | No model-driven URL fetcher | code review |

## Residual risks (disclosed)

1. A copied live session cookie works until expiry/revocation.
2. Small groups (4–8) can statistically infer who objected despite generic copy.
3. OpenAI/Qloo may retain prompts/responses under their terms — we do **not** promise zero vendor retention (`store:false` is best-effort, not a guarantee).

## Incident rule

Confirmed secret or private-input exposure → revoke affected capabilities, rotate disposable secrets, halt public demo until patched.
