# Common Ground

Venue-planning agent for hosts of recurring small-group dinners. Taste signals stay private; hard requirements come before ranking; approving a plan is **not** a reservation.

## Public demo

| Surface | URL |
|---|---|
| App | https://common-ground.issue-atharva.workers.dev |
| Guided demo | https://common-ground.issue-atharva.workers.dev/demo |
| Synthetic shortlist | https://common-ground.issue-atharva.workers.dev/example |
| Privacy | https://common-ground.issue-atharva.workers.dev/privacy |

## Status

| Area | State |
|---|---|
| Planning (32 phases) | [plan/](plan/README.md) |
| Product loop P07–P23 | Worker + D1 + planning machine + export |
| Hardening / eval P21–P25 | Abuse caps, fault suite, frozen harness — study **incomplete** |
| Pilots / commercial P26–P28 | Protocols ready — human evidence **incomplete** |
| Release / submission P29–P31 | [docs/submission.md](docs/submission.md) |
| Startup decision P32 | Continue artifact; hold SaaS claims — [review](docs/business/eight-week-review.md) |
| Live Qloo | Key installed · 23 confirmed NYC venue rows (22 distinct Qloo IDs; Xi'an branches share one) · Insights subject to rate limits |
| Customer interviews | Incomplete (desk/Reddit only) |
| Cloudflare spend | **$0** — Workers Free + D1 Free only ([policy](docs/ops/free-tier.md)) |

## Quick start

See [docs/setup.md](docs/setup.md).

```sh
pnpm install --frozen-lockfile
pnpm verify:ci
pnpm dev:web
```

## Verification

```sh
python3 plan/tools/verify_plan.py   # C0
pnpm verify:ci                      # lint, types, build, unit, integration, release scan
pnpm test:e2e                       # Playwright (separate)
```

## License

MIT for original application source — see [LICENSE](LICENSE). Qloo/OpenAI/venue content are **not** relicensed.
