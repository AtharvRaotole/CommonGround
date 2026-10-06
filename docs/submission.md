# Submission package draft (Devpost)

**Status:** Ready for founder paste into Devpost · **Not auto-submitted**  
**Updated:** 2026-10-06

## Links

| Field | Value |
|---|---|
| Public app | https://common-ground.issue-atharva.workers.dev |
| Guided demo | https://common-ground.issue-atharva.workers.dev/demo |
| Synthetic shortlist | https://common-ground.issue-atharva.workers.dev/example |
| Privacy | https://common-ground.issue-atharva.workers.dev/privacy |
| Source | https://github.com/AtharvRaotole/CommonGround |
| Release SHA | `3c3dd74ce5a0bc31804f1365a522e836dcd3b7e3` (bump at final submit) |

## One-paragraph description

Common Ground helps hosts of recurring small-group dinners agree on a venue without another endless thread. Members share optional taste seeds privately; hard requirements are checked before ranking; the agent returns an ordinal compromise shortlist with unknowns labeled; private vetoes trigger an honest replan; export is a handoff, not a reservation.

## Built with

React, Vite, TypeScript, Cloudflare Workers, D1, Vitest, Playwright, Qloo (live key on deploy), optional OpenAI for agent tool-choice (`/v1/chat/completions`, `store:false`; template explanations first).

## Honest limitations (must paste)

- Live Qloo key is installed; Insights may rate-limit under burst — product fail-closes and retries within caps.
- Controlled preference study: incomplete (0 consented group ratings).
- Full workflow pilots / voluntary return / commercial intents: incomplete.
- Unit economics: not calculable without commercial provider quote.
- The planning document’s eight-week schedule is a **hypothetical** operating plan; it does **not** claim to match the actual October hackathon cutoff.
- Confirm the GitHub repo is **public** before Devpost submit.

## What judges can do without a key

1. Open `/demo` and complete the synthetic agent loop (or `/example` for the static shortlist).
2. Read threat model, privacy notice, evaluation protocol, and evidence map.
3. Clone repo → `pnpm install --frozen-lockfile` → `pnpm verify:ci`.

## What the live deploy already shows

1. Plan an outing → mint invite → private hard needs + taste seeds → guided/agent planning → veto reason → approve → ICS export.
2. `pnpm smoke:live` against production (create → Qloo search → plan → approve → export).
3. `/api/health/providers` reports Qloo/OpenAI readiness and catalog counts (23 confirmed rows / 22 distinct Qloo IDs).

## Published-state checklist

- [x] No private pilot PII or emails in git
- [x] No API keys in git (verify-release PASS)
- [x] LICENSE visible (MIT for app code)
- [x] Free-tier only (`docs/ops/free-tier.md`)
- [x] Production smoke recorded (`docs/verification/release/production-smoke.md` + `pnpm smoke:live`)
- [ ] Founder reviews Devpost fields before submit
- [ ] Confirm GitHub repo is public
