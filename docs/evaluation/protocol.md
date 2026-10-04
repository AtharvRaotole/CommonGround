# Evaluation protocol (frozen) — 2026-10-04-v1

Manifest: [`eval/manifest.json`](../../eval/manifest.json)

## Question

On the **same venue slate**, does Qloo-ordered compromise improve the group’s lowest willingness-to-attend rating versus a competent baseline (manual/LLM same-slate shortlist), without hard-constraint regressions?

## Unit of analysis

**Group** (independent outing organizer + consented members). Repeated occasions aggregate within group before comparison. Members are not independent samples.

## Conditions

1. **Baseline** — same slate, neutral cards, randomized display order.
2. **Qloo** — same slate, ordinal compromise policy `2026-10-04-v1`, neutral cards, randomized display order.

## Primary metric

Lowest member willingness-to-attend on a 1–5 scale for the chosen/shortlisted venues under each method. **Forbidden proxies:** Qloo affinity mean increase, explanation persuasiveness, CTR.

## Graduation gate (pre-registered)

- ≥12 enrolled independent groups with complete paired outcomes
- Wins in ≥8/12 groups
- Median paired Δ ≥ 0.5
- Zero hard-constraint regressions

Failure to reach sample or thresholds → report **incomplete / inconclusive / negative** — never round into success.

## Telemetry dictionary

See `TELEMETRY_DICTIONARY` in `worker/src/telemetry/events.ts`. Synthetic vs live separated via `dataMode`.

## Deviations

Logged in `docs/evaluation/deviations.md` and `manifest.deviations`.
