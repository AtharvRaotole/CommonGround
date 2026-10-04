# Free-tier deploy policy (hard)

**Rule:** Common Ground uses only Cloudflare **Free** plan resources. Zero dollars.

Allowed:
- Workers Free (`workers.dev` subdomain)
- D1 Free database(s)
- Local `wrangler dev` / `--local` D1

Forbidden without explicit founder written approval:
- Workers Paid / Workers for Platforms billed usage
- Queues, Workflows, Containers, Browser Rendering, Images, Stream
- Workers AI / Vectorize / AI Search (even if free credits exist — avoid surprise bills)
- R2 (not needed; skip)
- Custom domains that require a paid zone/add-on we don't already own
- Logpush, cache reserve, Argo, Load Balancing, Waiting Room
- Increasing account plan in the dashboard

Deploy command must stay on Free Workers. If Cloudflare prompts to upgrade, **stop**.
