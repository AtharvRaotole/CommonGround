# Qloo capability matrix — P03 (updated)

**Date:** 2026-10-06  
**Observer:** founder (agent-assisted)  
**Key status:** **Issued and installed** (Worker secret + local `.env`, never in git).

## Environment

| Item | Value |
|---|---|
| Documented base | `https://hackathon.api.qloo.com` |
| Auth | `X-Api-Key` header (not query, not Bearer) |
| Insights method | GET + query string only |
| Local runtime | Node ≥22 · `npx tsx spikes/qloo-contract.ts --live` |
| Wrangler / Workers deploy | Live at `common-ground.issue-atharva.workers.dev` |
| Key storage | Cloudflare secret `QLOO_API_KEY` · gitignored `.env` |

## Probe results (2026-10-06)

| Capability | Mode | Result | Evidence |
|---|---|---|---|
| Host reachable | live | **Pass** | prior + live |
| Entity search (`/search`) | live authed | **Pass** — artist/place/movie 200 | `p03-private/live-contract-redacted.json` |
| Place Insights candidate-restricted | live authed | **Rate-limited (429)** on burst after search storm | same report; retry with backoff in product |
| Missing/extra candidate detection | live | Blocked by 429 on first Insights wave | re-run after cool-down |
| Contradictory filter silent-ignore probe | live | Blocked by 429 | re-run after cool-down |
| Venue catalog mapping | live search | **23/25 confirmed rows** (22 distinct Qloo IDs; Xi'an branches collide) | `data/venues-private.json` · redacted map in p03-private |
| Parse verbose responses | synthetic | Pass | prior |
| Free Worker deploy | live | Pass | workers.dev |
| Numerical quotas | issued terms | **Unknown** — observed 429 under burst | Ask Q2 / measure |
| Demo display / persistence rights | terms | Ephemeral run state + catalog entity IDs only; no raw dumps in git | `docs/vendor-rights.md` |
| Commercial SaaS rights | terms | **Not assumed** | unchanged |

## Seed / venue slate

Confirmed NYC place IDs seeded to D1 (`scripts/seed-venues.mjs --remote`). Unconfirmed: Olga's Cup & Saucer, Diner (generic name collision).

## Re-run

```sh
# key only in gitignored .env / wrangler secret
node --env-file=.env --import tsx spikes/qloo-contract.ts --live
node --env-file=.env scripts/map-venues-qloo.mjs
node scripts/seed-venues.mjs --remote
```

## Affinity interpretation

Scores 0–1 normalized **per query**; not attendance probability. Do not average raw scores across members.
