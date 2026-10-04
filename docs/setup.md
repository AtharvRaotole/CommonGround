# Setup — Common Ground product app

**Runtime pin:** Node ≥ 22 · pnpm 9.15.0  
**Hosting target:** Cloudflare Worker (+ D1 in P07). Not Supabase.

## Fresh checkout

```sh
pnpm install --frozen-lockfile
pnpm verify:ci
```

Optional browser smoke:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

## Local development

```sh
# terminal A — API / health
pnpm dev:worker

# terminal B — web UI (proxies /api → :8787)
pnpm dev:web
```

- Web: http://127.0.0.1:5173  
- Health: http://127.0.0.1:8787/api/health  

## Environment

Copy `.env.example` → `.env`. Keep values empty in git. Live Qloo/OpenAI are optional until keys exist; default CI never needs them.

## Preview deploy

Requires a Cloudflare account + `wrangler login` (not available in this scaffold session).

```sh
export GIT_SHA="$(git rev-parse HEAD)"
pnpm --filter @common-ground/worker exec wrangler deploy
```

Set `ENVIRONMENT=preview` and a distinct D1 database before any real participant data (P07).

## What is intentionally missing

- D1 schema / capability auth → P07  
- Live Qloo ranking → blocked on hackathon key (P03/P11)  
- Full host/member flows → later phases; landing + synthetic shortlist ship now
