# Decision 001 — Scope lock (hypothesis and evidence rules)

- **Date and owner:** 2026-10-03 · founder (Atharv Raotole) via planning workspace execution
- **Decision under consideration:** Lock the first customer, primary job, city assumption, claim boundaries, capacity reconciliation, score weights, and week-one continuation thresholds before interviews or build work.
- **Status:** Locked for week one. No customer interviews, live API tests, outreach, or measured uplift have occurred. This record freezes planning rules; it does not validate demand.

## Buyer / job statement (exactly one)

**First customer:** An independent owner/operator or authorized community host of recurring paid local dinners or cultural outings who (1) already hosts at least two outside-venue outings per month, (2) regularly selects among external venues for opt-in groups of **4–8** adults from their own community, (3) has event/membership revenue or an explicit operations budget, (4) can show recent planning decisions and recruit consenting participants, and (5) can approve a plan and complete booking/handoff themselves.

**Primary job:** Help the host choose an outside venue this formed group can actually use, understand the tradeoffs, and finish the plan without another long round of individual messages—with private voluntary taste seeds (at most **three** confirmed seeds per participant), practical constraints, private vetoes, and a host-approved handoff.

**Working product name:** Common Ground.

These are recruitment criteria and a positioning statement, not observed market facts.

## City assumption

| Field | Value | Label |
|---|---|---|
| Selected catchment | New York City (compact neighborhood/catchment to be chosen before catalog work in P08) | **assumption** |
| Why NYC | Desk research shows publicly identifiable operators (e.g. forones.co, Meetup NY Dinner Club); plan default | design / desk evidence of operator existence only |
| Primary catchment | Manhattan south of 59th St + Brooklyn (Williamsburg / Prospect Heights / Park Slope corridor) | **locked decision 2026-10-03** |
| Founder can personally verify venues in NYC | Assumed yes for public official-site verification (web + in-city visit later); not claiming physical presence today | assumption |
| Founder can recruit qualified hosts in NYC | Public operator density is high; live recruitment still unproven (P02 outreach not sent) | assumption |

**Owner lock rationale:** NYC has the densest publicly documented external-venue dinner/cultural hosts in the desk screen; starting elsewhere would discard the richest competitive learning set. Catchment is narrowed so P08 can verify 20–30 venues without citywide scrape fantasy.

**Stop/rollback rule (from P01):** If founder access contradicts NYC, change city now and propagate; do not buy data or invent access.

## Capacity reconciliation

| Item | Value | Label |
|---|---|---|
| Planning horizon | 8 relative weeks | plan parameter |
| Assumed weekly capacity | 30 founder hours/week | **locked decision 2026-10-03** (owner judgment; treat as operating capacity unless a later dated note revises it) |
| Planned phase work | 192 hours | estimate from phase manifest |
| Contingency | 48 hours (6 h/week) | estimate |
| Total budget | 240 hours | 192 + 48 |
| Reconciliation | 8 × 30 = 240; planned + contingency matches assumed capacity | arithmetic check |
| Missing capacity info | Hackathon calendar vs relative eight weeks remains an explicit schedule distinction; weekly hours locked at 30 by owner judgment on 2026-10-03 | locked + residual assumption on event cutoff |

If actual capacity is ~15 h/week, use roadmap cuts or extend calendar; do not pretend automation doubles founder time.

## Five competing concepts (retained vs rejected)

| Concept | Disposition | Design opinion vs customer evidence |
|---|---|---|
| Paid local dinner/cultural-community hosts (Common Ground) | **Retained** as sole first customer | Design selection under eight-week solo-founder constraints. Desk evidence shows operators exist; **no** interview pain, WTP, or Qloo-lift evidence yet. |
| Independent cultural venue audience development | **Rejected** for v1 | Sector pressure is documented (e.g. NIVA/Wallace context); needs campaign access and attribution time the window likely lacks. Opinion, not buyer interview. |
| Boutique hotel group concierge | **Rejected** for v1 | Named software buyers exist (vendor-hosted Mindtrip testimony); Mindtrip already covers small-team concierge; procurement/integration risk. Not customer-validated rejection. |
| Arts/event sponsorship prospecting | **Rejected** for v1 | Clear revenue job; contact/budget data and competitors dominate; affinity ≠ intent. Desk judgment. |
| Coworking offsite outings | **Rejected as default**; eligible only if an operator passes the same five customer conditions | Many dinners are on-property (e.g. Zoku listing). Keep screen, do not treat as default buyer. |

## Claim boundaries

- No invented customers, market size, revenue, or measured uplift.
- Every numerical gate below is a **target** / **estimate** / **scenario**, not an observed result.
- Qloo affinity is recommendation evidence, not enjoyment probability or safety fact.
- Approval ≠ booking; the host owns reservation and invitations.
- Synthetic personas test software only; they never count as customers.
- Current startup score **4.7/10** is an editorial judgment on disclosed current evidence (see frozen rubric). A ≥9/10 is a graduation **target**, not a promise.

## Frozen initial scoring rubric (pre-interview)

Formula: overall = Σ(weight × category score) / 100. Anchors: 0 unsupported; 3 specific hypothesis; 5 coherent design + indirect evidence; 7 observed pilot; 9 repeated direct evidence for bounded go/no-go; 10 unusually strong within tested scope.

| Category | Weight | Frozen score today /10 | Notes |
|---|---:|---:|---|
| Recurring buyer pain | 15% | 5 | Hypothesis + desk workflow existence |
| Willingness to pay | 15% | 3 | Plausible buyer; no purchase evidence |
| Incremental value of Qloo | 10% | 6 | Mechanism central; no ablation yet |
| Agent behavior and task completion | 10% | 8 | Spec completeness, not shipped proof |
| Technical feasibility in eight weeks | 10% | 7 | Bounded scope; live key/deploy untested |
| Differentiation and competitive position | 10% | 5 | Host workflow more specific; Duddle/222/Timeleft overlap |
| Distribution access | 10% | 4 | Reachable type; no recruited cohort |
| Sustainable rights and unit economics | 10% | 2 | Commercial permission/pricing unknown |
| Repeat use and retention | 5% | 3 | Built into hypothesis; unobserved |
| Defensibility | 5% | 3 | Easy to copy today |
| **Weighted total** | **100%** | **4.7** | (15×5+15×3+10×6+10×8+10×7+10×5+10×4+10×2+5×3+5×3)/100 = 470/100 = 4.7 |

**Do not change weights or these initial scores after seeing interview results without a new dated decision record.** Later re-scores must cite evidence IDs.

## Frozen week-one continuation thresholds (pre-result)

Set before any interview outcomes. Labels: all **targets**.

**Continue only if all of the following:**

1. At least **3 of 5** qualified first interviews substantiate recurring planning/rework pain with a concrete recent example (**target**).
2. At least **three** operators commit a real upcoming outing and voluntary input collection; at least **one** identifies a budget approver or exact-offer intent—not payment before commercial Qloo rights (**target**).
3. Qloo access/rights probe (P03) shows usable entity lookup and candidate-restricted ranking under confirmed terms, or an explicit narrow/stop is recorded (**gate**).
4. Concierge test (P04) produces at least one real-group actionable plan with honest feedback on whether Qloo-caused differences were valued (**target**).

**Stop or change if:** venues are nearly fixed; acquisition/no-shows dominate; groups will not submit signals; essential constraints cannot be verified; manual vetting consumes all saved time; hosts require inventory/booking as prerequisite; or explicit-preference baseline works as well.

**Falsification stop (manual product review):** If no result would cause us to stop, the hypothesis is not falsifiable. Concrete stop results include: (a) qualified hosts report no venue-selection rework; (b) Qloo adds no preferred shortlist difference vs competent baseline under identical constraints; (c) founder cannot access a city with verifiable venues and reachable hosts; (d) commercial/demo rights block the intended use.

## Consequences

- Customer, scope, costs: single wedge; no multi-city or hotel/sponsorship build in weeks 1–2.
- Data rights: no paid Qloo commercial claims until terms confirmed (P03/P28).
- Timeline: week-one discovery (P02–P04) before broad implementation (P05+).
- Phase files/contracts: none changed beyond creating this decision and research registers.
- **Reversal trigger:** Failed week-one gates, or founder access contradicts NYC → new decision record; do not quietly lower thresholds.

## Next verification and owner

- Founder confirms or revises weekly capacity and city access in writing.
- P02 interviews and P03 Qloo probe (parallel after this lock).
- Owner: founder for outreach authorization and account/key submission.
