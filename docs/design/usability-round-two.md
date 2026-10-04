# Usability round two (P20) — 2026-10-04

## Scope observed

Primary journey: landing → host create / join → waiting → plan shortlist → accept/veto → export → feedback.

## Automated checks

- Playwright keyboard focus on landing + example shortlist at 360px width.
- Copy audit: ordinal compromise language; no percent-likelihood claims; approval ≠ reservation.
- Touch targets: primary buttons use `min-height: 44px`.
- `prefers-reduced-motion` respected in `tokens.css`.

## Manual findings (founder walkthrough)

| Finding | Severity | Fix |
|---|---|---|
| Waiting room had no path to plan | Serious | Added “Open plan” link |
| Export vs tentative state easy to miss | Serious | Persistent banner on export page |
| Unknown facts looked like soft suggestions | Moderate | “Unknown:” styling + readiness gate |
| Veto privacy limit for groups of 4–8 | Known | Helper copy: host sees objection count only |

## Testers

Three cold passes by founder using synthetic mode (no live Qloo key yet). Formal external testers deferred until key + pilot schedule (P02 residual).

## Assets

No third-party photography. Atmosphere from CSS gradients + typography only; provenance: original.

## Remaining

- Screen-reader pass on live Worker after deploy.
- axe-core in CI once `@axe-core/playwright` budget allows (deferred; keyboard/role checks ship now).
