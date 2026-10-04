# Common Ground

Venue-planning agent for hosts of recurring small-group dinners. Taste signals stay private; hard requirements come before ranking; approving a plan is **not** a reservation.

## Status

| Area | State |
|---|---|
| Planning (32 phases) | [plan/](plan/README.md) |
| P05 UX freeze | [docs/design/](docs/design/flows.md) |
| P06–P08 product | Worker + D1 + venue ledger |
| Live preview (FREE) | https://common-ground.issue-atharva.workers.dev |
| Live Qloo | Waiting on hackathon API key |
| Customer interviews | Incomplete (desk/Reddit only) |
| Cloudflare spend | **$0** — Workers Free + D1 Free only ([policy](docs/ops/free-tier.md)) |

## Quick start

See [docs/setup.md](docs/setup.md).

```sh
pnpm install --frozen-lockfile
pnpm dev:web
```

## Verification

```sh
python3 plan/tools/verify_plan.py   # C0
pnpm verify:ci                      # C1–C3 + release scan (e2e separate)
```

## License

MIT for original application source — see [LICENSE](LICENSE). Qloo/OpenAI/venue content are **not** relicensed.
