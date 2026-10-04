# Production smoke — public Worker

**URL:** https://common-ground.issue-atharva.workers.dev  
**Policy:** Cloudflare Free only

## Cold-browser checklist

| # | Step | Expected | Result | When |
|---|---|---|---|---|
| 1 | `GET /api/health` | 200 + ok | | |
| 2 | `GET /` | Landing brand + CTAs | | |
| 3 | `GET /demo` | Guided synthetic demo | | |
| 4 | `GET /example` | Synthetic shortlist + Unknown: | | |
| 5 | `GET /privacy` | Privacy notice | | |
| 6 | `GET /host/new` | Host create form | | |
| 7 | Create outing (synthetic) | Invite / waiting path | | |
| 8 | Live ranking (if key) | Shortlist or honest unavailable | | |

## Commands

```sh
curl -sS https://common-ground.issue-atharva.workers.dev/api/health
curl -sS -o /dev/null -w "%{http_code}\n" https://common-ground.issue-atharva.workers.dev/
curl -sS -o /dev/null -w "%{http_code}\n" https://common-ground.issue-atharva.workers.dev/demo
curl -sS -o /dev/null -w "%{http_code}\n" https://common-ground.issue-atharva.workers.dev/example
curl -sS -o /dev/null -w "%{http_code}\n" https://common-ground.issue-atharva.workers.dev/privacy
```

## Latest recorded smoke

2026-10-04 — health OK; `/` `/demo` `/example` `/privacy` all 200.  
Details: `docs/verification/release/production-smoke.md`.
