# 01 — Opportunity and competition

Decision: use **Common Ground** as the working hypothesis for an eight-week build. It is a taste-aware planning agent for independent paid local dinner/cultural communities that already choose outside venues for opt-in groups of 4–8. We have desk evidence that the workflow exists. We do not yet have evidence that buyers need another tool, will pay for one, or that Qloo improves their choices.

Research date: October 3, 2026. No interviews or outreach have been conducted. See [the detailed research and source ledger](research/opportunity-research.md) for evidence types and alternative wedges.

## Exact initial customer

An owner/operator or authorized community host who:

1. Already hosts at least two outside-venue dinners or cultural outings monthly.
2. Regularly selects among venues for 4–8-person groups supplied by their own community.
3. Has event/membership revenue or an explicit operations budget.
4. Can show recent planning decisions and recruit an opt-in pilot group.
5. Can approve a plan and carry out the booking/handoff themselves.

These are selection criteria, not observed market facts. Start in one compact catchment. NYC is a provisional assumption based on observed operators; use a different city if the founder has stronger access there. Coworking is eligible only when an operator passes these criteria. A coworking manager who mostly hosts events at their own space is a poor initial target.

The customer supplies an already formed group. We do not infer personalities or match strangers. We do not supply the audience, replace ticketing, promise inventory, or execute reservations in the initial product.

## The job and the proposed offer

“Help me choose an outside venue that this group can actually use, understand the tradeoffs, and finish the plan without another long round of individual messages.”

The host creates an outing and sets location, time, group size, budget, explicit needs, and a candidate pool. Guests optionally submit a few cultural seeds and explicit vetoes. Qloo supplies cross-domain venue orderings. The agent checks required facts against curated official sources, flags uncertainty, compares candidates, explains compromises, requests useful missing information, and replans when a guest vetoes or a source invalidates a candidate. The host approves the final handoff.

No available source means “unverified,” not “satisfied.” A menu, accessibility statement, or opening-hours page cannot prove table availability. Important constraints lacking adequate evidence require host verification before approval. Preference inference cannot establish diet/allergy safety, accessibility, willingness to spend, or interpersonal compatibility.

An initial commercial experiment can offer a time-saving planning pilot to the operator. Any price proposed during discovery is an experimental offer, not a researched market-clearing price. Do not use hypothetical enthusiasm as willingness to pay.

## Why this hypothesis, with its limits

[table for one(s)](https://forones.co/) advertises recurring Thursday/Sunday NYC dinners for 4–6 people at named restaurants, with observed prices of $50/$65. [Table 315](https://www.table315.com/) operates monthly 4–6-person dinner tables across restaurants. Its monthly cadence fails our frequency screener, but it confirms that independent operators organize this format. [New York Dinner Club's listing](https://www.meetup.com/meetup-group-yyedoizw/) also describes small local groups.

These pages establish observable services. They do not establish planning pain, profits, customer numbers, SaaS budgets, or repeat-member behavior. Some operators may use a fixed set of venues and care primarily about filling seats. That would kill the proposed planning wedge.

| Candidate | Qualitative assessment under eight-week, solo-founder constraints |
|---|---|
| Paid local dinner/cultural-community hosts | Selected as most directly testable: repeat external venue job, named potential buyer, opt-in data collection possible. Budget and Qloo lift unknown. |
| Independent cultural venue audience development | Clear sector pressure, but a cultural insight does not create a reachable audience. Needs campaign/channel access and enough time to measure sales. |
| Boutique hotel group concierge | Concrete named buyers of software, but Mindtrip already serves the exact small-team concierge job. Integration and procurement could exceed the build window. |
| Arts/event sponsorship prospecting | Clear revenue job and plausible cross-domain brand relevance. Contact access, budget/timing signals, seasonal demand, and established competitors weaken a free-data-only approach. |
| Coworking offsite outings | Real community-programming work, but often the venue is already their property. Keep only screened offsite operators. |

Original sector research supplies context: [NIVA's 2025 study](https://www.nivassoc.org/stateoflive) examines independent live entertainment economics, while [Wallace/University of Texas](https://wallacefoundation.org/report/search-magic-bullet-results-building-audiences-sustainability-initiative-results-building) shows audience-building is complex and slow. Neither proves demand for our product. [Mindtrip's hotel page](https://mindtrip.ai/business/hotels) includes a named small-hotel-team customer testimonial; it is vendor-selected evidence, not an independent outcome study. [Greater Manchester Chamber](https://manchester-chamber.org/taco-tour-manchester-2025-date-announced/) documents sponsorship activity; [SponsorPitch](https://www.sponsorpitch.com/how-it-works) supplies contacts and sponsorship intelligence we cannot assume are freely available.

## The serious competitors

- **[Timeleft](https://timeleft.com/dinners-with-strangers/):** already handles matching, restaurants, booking, and recurring social dinners. Its [current description](https://timeleft.com/blog/how-does-timeleft-work/) includes group and partner-venue selection. Our operator tool must prove a benefit to communities that retain their own members and operating model.
- **[222](https://partners.222.place/):** says it uses AI to match groups of six to restaurants, integrates Resy/OpenTable, sells experiences, and charges partners by checked-in guests. This is a particularly strong substitute because it promises customer flow/revenue. A planning tool that saves a few minutes may lose to a platform that fills the restaurant.
- **[Duddle](https://devpost.com/software/duddle):** prior Qloo hackathon product combines participants' preferences, group restaurant recommendations, and Claude explanations. This means the core taste-to-group-venue demo is already prior art.
- **[Partiful](https://partiful.com/ticketing) and [Meetup](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event):** already provide substantial organizer operations. [Partiful collects guest answers and polls times](https://help.partiful.com/en-us/articles/15525422-can-i-poll-or-survey-my-guests). Complement existing event links instead of rebuilding RSVP, communications, or payments.
- **[Mindtrip](https://mindtrip.ai/business/hotels) and [Wanderlog](https://help.wanderlog.com/hc/en-us/articles/4625495771163-Add-friends-to-plan-together):** cover hotel concierge/trip planning and collaborative itinerary workflows. Do not pitch generic group travel.
- **[Qloo itself](https://www.qloo.com/capabilities/taste-analysis):** markets group activities and taste inference; its [recommendations offering](https://www.qloo.com/capabilities/recommendations) covers travel and events. A generic interface around Qloo is not an independent business moat.

Potential differentiation is an operator-owned workflow: traceable feasibility checks, explicit guest vetoes, accountable compromises, repeat-group preference history, replan actions, and a reviewable host handoff. This is a proposition to test. Competitors can add features, and software policy alone is weak defensibility. A later advantage would require sustained operator relationships and consented evidence about which planning decisions work—not a claim to own Qloo's graph.

## Qloo must earn its place

Run the same groups, candidates, constraints, verification process, and explanation quality through:

1. The host's current shortlist/process.
2. Explicit venue preferences plus a competent LLM or simple ranker.
3. The same workflow with Qloo cultural signals.

Collect guest choices before showing persuasive explanations where practical. Compare planning time, feasible candidates, guest completion, host acceptance, veto/replan cycles, and blind shortlist preference. Inspect failure reasons rather than collapsing everything into one flattering score.

Qloo scores/ranks are recommendation evidence, not calibrated happiness or compatibility probabilities. Aggregate ordinal choices transparently. “Minimize repeatedly giving a member their worst option” is a proposed policy; do not claim it improves fairness, attendance, retention, or satisfaction without measurement.

If option 2 performs equally well with less guest friction, Qloo is not indispensable for this workflow. Do not keep it as a decorative API call just to qualify for the hackathon.

## Ready-to-use discovery script

Ask about recent behavior before introducing Common Ground. With permission, examine screenshots, calendars, and actual planning artifacts. Avoid leading questions and requests for unnecessary personal guest information.

1. What kinds of paid/member outings did you run in the last 30 days, and how many involved choosing an outside venue?
2. Walk me through the most recent one: who was coming, how big was the group, and what decision did you have to make?
3. Which venues did you consider, and how did you find them? How often do you simply reuse the same places?
4. How much time did that choice take, including messages, checks, changes, and booking work? Can we reconstruct it from what you sent?
5. What were the hardest non-negotiable requirements, and how did you verify them?
6. When did someone reject a plan recently? What was the reason, and what happened next?
7. How do you know what guests want today? What questions do they actually answer, and what gets ignored?
8. How much does choosing a better venue matter compared with getting attendees, pricing, timing, and handling no-shows?
9. Which software or paid services do you use for this work? Who chose them, pays, and can approve an additional purchase?
10. Have you tried delegating venue research or using AI, polling, Timeleft/222, or another tool? What happened in the last attempt?
11. If we helped plan your next real outing, what information could you and guests voluntarily provide, and what result would make you use it again?
12. After showing a concrete relevant example: would you commit the next outing to a pilot, introduce the budget approver, or pay for an agreed planning service? What would block that commitment?

Do not interpret a “yes” to interest as a purchase. Record exact objections, existing costs, actual pilot dates, and the approval process.

## Seven-day falsification plan

The thresholds below are **proposed go/no-go rules**, not researched market norms. Set them before reviewing results. This document authorizes no outreach; the founder conducts or explicitly authorizes it separately.

| Day | Work | Evidence/artifact |
|---|---|---|
| 1 | Find 15 local operators from official event pages; apply the screener. Choose a catchment based on access. | Source-linked list, reason each qualifies/fails. If fewer than five plausible reachable operators qualify, reconsider city or customer. |
| 2 | Founder conducts/authorizes invitations to discovery; prepare two manual planning examples from official venue sources. | Concrete brief, source timestamps, uncertainty notes. No claimed availability. |
| 3 | Conduct behavior interviews with qualified operators, aiming for five completed over the week. | Last-three-outings evidence, time/rework, current alternatives, buyer/budget map. |
| 4 | Run manual planning on a real upcoming group for willing operators. Ask for actual opt-in preference submissions. | Submission/abandonment count, usable seeds, host candidate pool, hard constraints. |
| 5 | Compare the three evaluation arms on identical candidates; get blind guest/host choices. | Raw preferences and feasible-plan comparisons, including failures. No significance claim from tiny samples. |
| 6 | Present an approved-plan artifact and a clearly experimental commercial offer. Seek next-outing/date and payment/approver commitment. | Actual commitment or rejection; avoid projected revenue. |
| 7 | Review the predefined gates and choose continue/change/stop. | One-page evidence memo with counterexamples and remaining assumptions. |

**Continue only if:** at least three of five qualified interviews substantiate recurring planning/rework pain with a recent artifact, at least three operators commit a real next outing and can recruit opt-in guests, at least one takes a meaningful commercial step (a dated nonbinding exact-offer or budget-approver commitment; no payment or deposit before Qloo commercial rights are confirmed), and Qloo supplies useful shortlist differences that survive constraints and are preferred in the pilot comparisons. An approver commitment is weaker evidence than payment and should be reported as such.

**Stop or change if:** venues are nearly fixed; acquisition/no-shows dominate; groups will not submit signals; sources cannot verify essential constraints; manual vetting consumes all saved time; hosts want automatic inventory/booking as a prerequisite; or the explicit-preference baseline works as well. A failed test is a useful result. Do not redefine thresholds after seeing weak evidence just to preserve the idea.

At day seven, Qloo pilot comparisons can only be exploratory. Larger repeat-group tests are needed before any claim about general preference lift or attendance. If operator access is not secured, label the eventual hackathon demo as a prototype hypothesis and do not present synthetic groups as customers.
