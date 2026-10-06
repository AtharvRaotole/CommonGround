# Submission package draft (Devpost)

**Status:** Draft for founder review · **Not auto-submitted**  
**Updated:** 2026-10-04

## Links

| Field | Value |
|---|---|
| Public app | https://common-ground.issue-atharva.workers.dev |
| Guided demo | https://common-ground.issue-atharva.workers.dev/demo |
| Synthetic shortlist | https://common-ground.issue-atharva.workers.dev/example |
| Privacy | https://common-ground.issue-atharva.workers.dev/privacy |
| Source | https://github.com/AtharvRaotole/CommonGround |
| Release SHA | fill at submit time (`git rev-parse HEAD`) |

## One-paragraph description

Common Ground helps hosts of recurring small-group dinners agree on a venue without another endless thread. Members share optional taste seeds privately; hard requirements are checked before ranking; the agent returns an ordinal compromise shortlist with unknowns labeled; private vetoes trigger an honest replan; export is a handoff, not a reservation.

## Built with

React, Vite, TypeScript, Cloudflare Workers, D1, Vitest, Playwright, Qloo (when key issued), optional OpenAI for language (template explanations first).

## Honest limitations (must paste)

- Live Qloo key is installed; Insights may rate-limit under burst — product fail-closes and retries within caps.
- Controlled preference study: incomplete (0 consented group ratings) unless filled for narrative.
- Full workflow pilots / voluntary return / commercial intents: incomplete unless filled for narrative.
- Unit economics: not calculable without commercial provider quote.
- The planning document’s eight-week schedule is a **hypothetical** operating plan; it does **not** claim to match the actual October hackathon cutoff.
- **Make the GitHub repo public** before Devpost submit (currently private).

## What judges can do without a key

1. Open `/demo` and complete the synthetic agent loop.
2. Open `/example` for the static shortlist.
3. Read threat model, privacy notice, evaluation protocol, and evidence map.
4. Clone repo → `pnpm install --frozen-lockfile` → `pnpm verify:ci`.

## What requires the key

- Live Insights ranking over a real venue slate
- C6 live provider tests
- Any Qloo uplift claim (still requires human ratings)

## Published-state checklist

- [ ] No private pilot PII or emails in git
- [ ] No API keys in git (verify-release PASS)
- [ ] LICENSE visible (MIT for app code)
- [ ] Free-tier only (`docs/ops/free-tier.md`)
- [ ] Production smoke recorded
- [ ] Founder reviews Devpost fields before submit
