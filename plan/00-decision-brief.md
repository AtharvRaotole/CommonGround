# Common Ground: the decision to test

Planning date: 3 October 2026. Horizon: eight relative weeks, as requested. Status: researched proposal; no product, customer interviews, live API tests, or revenue exist yet.

## Recommendation

Build **Common Ground**, a venue-planning agent for independent hosts of recurring paid local dinners and cultural outings. It helps a host choose somewhere a small, already-formed group can agree to go, explains the tradeoffs, handles a veto, and prepares the host's final event handoff.

The first customer is an organizer who runs at least two outings a month, regularly chooses external venues for four to eight adults, already earns revenue or controls an event budget, and can introduce consenting participants. These are recruitment criteria, not a description of a market that has already been measured. Start with one accessible city; New York City is the planning assumption, not evidence about the founder's location or customer access.

Participants privately select up to three favorite artists, films, books, or places. Qloo connects those cultural signals to real venue candidates. Common Ground compares the same shortlist for each participant, applies practical requirements, presents three distinct compromises, and asks the host to confirm the choice. A participant can object without disclosing their private taste profile to the group. The agent then revises the slate and says exactly what changed.

**The promise to test:** “Get your next small-group outing agreed, with less back-and-forth and fewer people settling for a venue they dislike.” This is positioning, not a verified performance claim.

## Why this direction

The cultural problem is visible and testable: individual preferences can differ across domains; a restaurant star rating or a generic prompt may miss that. The business problem is recurring: the host repeats the planning workflow. The product can demonstrate a complete agent loop in a few minutes: gather signals → call Qloo → apply constraints → explain → receive objection → replan → prepare an approved handoff.

The idea also has serious competition. Duddle already used Qloo for group restaurant decisions. Timeleft and 222 already combine people, restaurants, and group experiences. We are not claiming to have invented group recommendations, group matching, or taste-aware dining. The proposed difference is an organizer-controlled workflow for existing communities, with private inputs, explicit uncertainty, repeatable revision, and measured outcomes. That difference might be too small; the first week is designed to find out. See [the competition analysis](01-opportunity-and-competition.md).

We rejected a general travel planner as the default because of obvious prior art and broad operational dependencies. Boutique-hotel personalization has an identifiable buyer but stronger integration and sales friction. Venue audience development could become a bigger business but requires attribution, historical demand data, and customer access that we do not have. Medical or medication-aware recommendations introduce factual obligations Qloo affinity does not satisfy. Consumer lighting recommendations risk making Qloo decorative relative to room geometry and product specifications.

## What makes Qloo essential

The mechanism under test is Qloo's cross-domain ranking of a common venue slate from each participant's voluntarily provided cultural seeds. The LLM proposes bounded next actions and handles structured language and succinct explanations; it does not invent affinities, invent venues, or decide whether a safety-critical practical requirement is satisfied.

Removing Qloo must measurably reduce human-rated venue fit or increase time to a satisfactory decision when everything else is held constant. If the Qloo-free baseline does just as well, the central hypothesis fails. We will not rescue the pitch by showing Qloo-generated scores as proof that Qloo works.

## What we will ship in eight weeks

1. A responsive public web demo with an honest synthetic walkthrough and a bounded live path.
2. A host flow for four to eight participants, up to three confirmed seeds each, one city, and one outing at a time.
3. A small source-backed venue catalog plus Qloo candidate discovery and ranking, subject to verified coverage and data rights.
4. Three feasible alternatives, private vetoes, revision history, and host approval.
5. A copyable event summary and downloadable calendar file; the host sends invitations and makes any reservation.
6. An auditable provider trace, bounded usage, access controls, meaningful CI, and replayable failure cases.
7. A small, pre-registered human comparison and real pilot evidence, with honest uncertainty.
8. A public repository with source code, appropriate open-source license, setup instructions, and documentation that excludes proprietary data and personal records.

## What must be proven before deeper investment

| Gate | Evidence required | Consequence of failure |
|---|---|---|
| Customer | At least three qualified hosts agree to test an actual upcoming outing; understand their existing workaround | Change the customer or stop, before polishing software |
| Qloo capability | Approved key; intended seed types and local places work; candidate-filtered rankings behave as documented | Narrow the city/domain or stop this concept |
| Data and access rights | Clarify demo display, processing/storage, judging access, and whether commercial use needs another agreement | Keep work within confirmed rights; no paid service without permission |
| Incremental value | Human evaluation favors Qloo on the pre-registered primary metric, with no practical-constraint regressions | Investigate signals; pivot or reject if a second controlled iteration still fails |
| Recurrence | Hosts use the workflow again for a different event | Reconsider subscription and ongoing product value |
| Commercial path | Budget-owner intent and acceptable provider economics; actual payment only if terms permit | Do not call it a validated startup |

All numeric thresholds here and elsewhere are proposed decision rules, not external facts or accomplished results.

## The score constraint

The exact “rate my startup” skill was not found in the available local catalogs or the public source searches documented in the research. A transparent replacement rubric is provided in [the score and validation chapter](06-startup-score-and-validation.md). It does not masquerade as that skill. A 9/10 score is a graduation target, conditional on evidence; no responsible analysis can guarantee either that score or a hackathon win today.

## Scope and capacity

Assume one technical founder, 30 hours a week for eight weeks: 240 hours. The schedule assigns 192 hours to 32 concrete phases and keeps 48 hours as contingency, six hours each week. This is an estimate, not a promise. Recruitment and provider approval may take elapsed days even when they consume little engineering time. The same founder owns product, engineering, interviews, and launch; the role labels in the plan are hats, not imaginary employees.

At 15 hours a week, use the cuts in the roadmap or extend the calendar. Do not pretend automation doubles available founder time. The core deadline is the user's hypothetical week eight; the actual hackathon calendar is recorded separately in the release chapter so the two are not confused.

## Start here

Read the opportunity and validation chapters before architecture. Run the first-week customer and Qloo probes before committing to a full build. The smallest meaningful evidence is a real host, a real upcoming group decision, two comparable slates, and an honest record of which one the people prefer.
