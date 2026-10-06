# Vendor rights — Qloo (P03)

**Date:** 2026-10-06 (updated)  
**Owner:** founder  
**Status:** Public terms reviewed; **hackathon key issued and installed** (Worker secret). Additional Terms email not separately filed — treat public Terms + hackathon guide as controlling until written answers arrive.

## Controlling documents (known)

| Document | URL / location | Role |
|---|---|---|
| Public Terms of Use | https://www.qloo.com/legal/terms (updated 2024-12-19) | Baseline; may be superseded by signed/Additional Terms |
| Hackathon developer guide | https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide | Host, auth, GET Insights, silent ignore of bad params |
| Devpost starter kit email (2026-10-03) | inbox · support@devpost.com | Key request form; personal key; no personal data to Qloo; results are group tendencies |
| Key request form | https://forms.gle/zz12orkLHTAneLGz6 · also docs.google.com form in starter email | Founder must submit |
| Privacy policy | https://www.qloo.com/legal/privacy | Input handling (review before pilots) |
| Actual key email / Additional Terms | **Key received 2026-10-06** (hackathon starter email) | Installed as Worker secret; Additional Terms still not a separate attachment |

## What public terms clearly constrain

From the public Terms (not a substitute for the hackathon Additional Terms):

1. **Access keys are confidential**; accounts/seats are licensed and not to be shared.  
2. **Prohibition:** sell, resell, redistribute, or sublicense the Services, or charge third parties for access to the Services.  
3. **Qloo IP** includes Qloo Output and Data; Qloo asserts ownership interests in outputs and related IP.  
4. **Additional Terms** for APIs/Data may be provided with bespoke documentation at client login — those control if present.  
5. A **negotiated signed agreement** can supersede the public Terms.  
6. Qloo may **modify/discontinue services** and introduce fees with notice.  
7. **Site Data** (marketing site content) is not a license to build a product dataset from the website.

## Explicit product policy until written answers arrive (BLOCK)

| Use | Decision now |
|---|---|
| Call hackathon API from server with approved key | Allowed once key issued; keep key server-side only |
| Persist raw proprietary Qloo JSON in public git/fixtures | **Blocked** |
| Persist normalized ranks / entity IDs for demo TTL | **Hackathon demo allow:** confirmed place entity IDs in private venue catalog + ephemeral run/revision TTL; **no** raw proprietary response dumps in git |
| Display names + relative ranks in UI for consenting users | **Conditional** — likely intended for hackathon demos; still ask (Q3) |
| Send Qloo output subset to OpenAI for explanations | **Blocked until Q5 answered** — ship template explanations first (P16) |
| Public synthetic fixtures | **Allowed** if fully fabricated (see `fixtures/synthetic/`) |
| Charge organizers / paid SaaS | **Not assumed; blocked for commercial claims** until separate commercial agreement (Q7) |
| Publish raw responses or dump datasets | **Blocked** |

## Numerical quotas

**Unknown.** Guide states rate limits exist but publishes no numbers. Record only when issued on the key email or support reply. Do not brute-force probe.

## Unanswered provider questions (founder to send)

Ready copy: `docs/vendor/provider-questions-ready.md` (adapted from plan template).  
Channels named by Qloo: Discord `#api-help` / `#qloo-hackathon` (https://discord.gg/rF9PKsD5Q7); private key issues → ian@qloo.com per starter email.

## Commercial rights

**Not assumed.** Public Terms’ anti-resale/charge-for-access language plus “Additional Terms” pattern means a paid Common Ground organizer product needs an explicit commercial path. Hackathon demo ≠ SaaS license.

### P28 commercial decision (2026-10-04)

| Question | Decision |
|---|---|
| May we charge organizers while using hackathon Qloo? | **No** until written commercial permission |
| May we collect nonbinding exact-offer intent? | Yes, privately, with explicit start condition |
| May we record deposits/payments in-product? | **Blocked** — no billing flow ships |
| Unit economics / 70% contribution | **not_calculable** — see `docs/business/unit-economics.json` |
| Separate hackathon artifact from startup thesis if rights fail? | **Yes** |

## Owner actions remaining

1. Submit API key request form (if not already).  
2. Retain the key email + any attached terms privately (not in git).  
3. Send rights questions; paste answers into a private addendum and update this file’s status table.  
4. Re-run `QLOO_API_KEY=… npx tsx spikes/qloo-contract.ts --live` and fill the capability matrix.
5. Obtain commercial quote/permission before any paid offer or contribution claim (P28).
