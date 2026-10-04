# P07 threat model notes

## Assets

- Event metadata, participant preferences (cultural seeds), capability secrets, session cookies

## Trust boundaries

- Browser ↔ Worker API
- Worker ↔ D1
- Host vs member roles

## Threats and mitigations

| Threat | Mitigation |
|---|---|
| IDOR read of another member’s seeds | Event-scoped queries; host DTO strips seeds (AUTH-01/02) |
| Claim replay / double spend | Hash at rest; single UPDATE where consumed_at IS NULL (AUTH-03) |
| Stolen invite after rotation/expiry | revoked_at / expires_at checked (AUTH-04) |
| CSRF / cross-site POST | Origin allowlist (AUTH-05) |
| Plaintext tokens in DB | SHA-256 hashes only (AC03) |
| Host recovery leaked in invite | Invites never include recovery secret |
| Capability link sharing | Documented limit; short TTL; single-use claims |

## Residual risk

A copied live session cookie grants access until expiry/revocation. Acceptable for pilot; not enterprise SSO.
