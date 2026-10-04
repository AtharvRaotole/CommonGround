# Qloo capability matrix — P03

**Date:** 2026-10-03  
**Observer:** founder/owner execution  
**Key status:** Request submitted via official form (`formResponse` confirmation). **Key not yet in inbox.** Typical issuance: few business days / ~1 business day per starter kit.

## Environment

| Item | Value |
|---|---|
| Documented base | `https://hackathon.api.qloo.com` |
| Auth | `X-Api-Key` header (not query, not Bearer) |
| Insights method | GET + query string only |
| Local runtime | Node v22.14.0 · `npx tsx spikes/qloo-contract.ts` |
| Wrangler / Workers deploy | **Not installed** — C7 deploy probe blocked |
| Key storage | Pending `.env` (gitignored); never in fixtures |

## Probe results

| Capability | Mode | Result | Evidence |
|---|---|---|---|
| Host reachable | live unauth | **Pass** — HTTP 401 `API keys mismatch` in ~170ms | curl probe 2026-10-03 |
| Entity search (`/search`) | live authed | **Blocked** — no key | — |
| Place Insights candidate-restricted | live authed | **Blocked** — no key | — |
| Missing/extra candidate detection | live | **Blocked** | Spike implements checks for when key arrives |
| Contradictory filter silent-ignore probe | live | **Blocked** | Spike step ready |
| Parse verbose ~126KB / 30 entities | synthetic local | **Pass on this machine** — 0.086ms CPU trim ≪ 10ms Free budget | `docs/verification/p03-synthetic-parse.json` |
| Free Worker CPU on deploy | live C7 | **Blocked** — no wrangler/account deploy | — |
| Numerical quotas | issued terms | **Unknown** — not on public guide | Ask Q2 |
| Demo display / persistence rights | terms | **Unresolved / block persistence** | `docs/vendor-rights.md` |
| Commercial SaaS rights | terms | **Not assumed** | Public Terms anti-resale/charge language |

## Seed / venue slate (planned for live run)

| Role | Query examples (not yet resolved to live IDs) |
|---|---|
| Cultural seeds | Artist `Radiohead`; movie `Spirited Away` |
| NYC places | `Joe's Pizza New York`; `Katz's Delicatessen`; `Peter Luger Steak House` |

Live IDs will be redacted in `docs/verification/p03-private/live-contract-redacted.json` after `--live`.

## Hackathon form submission

| Field | Submitted |
|---|---|
| Email | atharva.r29@gmail.com |
| Name | Atharv Raotole |
| Devpost / GitHub | AtharvRaotole |
| Country | United States |
| Project | Common Ground (hackathon demo) |
| Agreements | Hackathon-only + Devpost rules accepted |
| Confirmation URL | `.../formResponse` — “request has been received” |

## Re-run when key arrives

```sh
# put key only in gitignored .env
export QLOO_API_KEY='…'   # do not paste into chat/git
npx --yes tsx spikes/qloo-contract.ts --live
# then update this matrix rows from blocked → observed
```

## Affinity interpretation (docs, not live-validated)

Per https://docs.qloo.com/docs/interpreting-affinity-scores — scores 0–1 normalized **per query**; not attendance probability. Do not average raw scores across members.
