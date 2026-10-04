# Setup — Common Ground product app

**Runtime pin:** Node ≥ 22 · pnpm 9.15.0  
**Hosting target:** Cloudflare Worker + D1. Not Supabase.

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
- Guided demo: http://127.0.0.1:5173/demo  

## Environment

Copy `.env.example` → `.env`. Keep values empty in git. Live Qloo/OpenAI are optional until keys exist; default CI never needs them.

Worker secrets (preview/production only, never commit):

- `QLOO_API_KEY` — when issued  
- `OPENAI_API_KEY` — optional explanations  

## Preview deploy

```sh
export GIT_SHA="$(git rev-parse HEAD)"
pnpm --filter @common-ground/worker exec wrangler deploy
pnpm --filter @common-ground/worker exec wrangler d1 migrations apply common-ground --remote
```

Stay on Workers Free (`docs/ops/free-tier.md`). If Cloudflare prompts to upgrade, **stop**.

## Synthetic fixtures

Use `/demo` and `/example` plus `fixtures/synthetic/` — never commit proprietary raw Qloo responses.
