# Business, discovery, and go-to-market

## Buyer and job

Initial buyer hypothesis: an independent local dinner/cultural-community organizer who operates recurring paid outings, controls the event budget, and personally spends time reconciling group preferences and venue constraints. The participant is an end user; the host is the operator; the budget owner may be a separate club founder. Record all three in discovery instead of assuming that praise from a participant proves willingness to pay.

Qualification requires an actual upcoming event, a known four-to-eight-person group, at least two relevant outings per month, external venue choice, and willingness to collect opt-in inputs. A coworking manager qualifies only if they already organize such offsite outings. A host who exclusively uses their own room does not fit this first product.

The buyer's job is to finish a group plan with confidence and less coordination. Their alternatives include choosing personally, recycling known venues, messaging the group, running a simple poll, using general AI, or choosing a platform that runs the whole dinner. Our adoption hurdle includes those free and familiar workflows.

## Discovery without selling the answer

Recruit 12 qualified hosts as a target, expecting outreach conversion to be unknown. Start from communities the founder can actually access; then public organizer pages and introductions. Build a researched prospect list of 30 potential hosts with source URLs, city, qualifying evidence, and a reason each might have the problem. These are targets, not acquired users. Stop mass outreach if replies indicate poor fit; revise the screener.

Ask about the most recent event before showing the concept. Request a walk-through of the actual planning sequence, with private details removed. Capture time ranges and evidence rather than demanding a falsely precise estimate. Ask which decision was hard, who vetoed, what was changed, what made the final venue acceptable, what happened on the day, and who had budget authority. Ask for contrary cases where choosing a venue was easy.

Interview template and outreach drafts are in [templates](templates/README.md). They are prepared for the founder to use; no messages have been sent during this planning task. Obtain consent for any notes or recording and never turn an interview into a claimed pilot without the host's agreement.

## Concierge pilot before software

For three qualified hosts, run the same process manually: collect voluntary seed choices, resolve them, retrieve a Qloo-supported slate if access permits, check venue facts, present alternatives, handle one revision, and record the decision. A spreadsheet is not required; use local structured records and a plain form. Do not make up live Qloo results if the key is delayed.

Collect a baseline from their preceding comparable planning workflow or a timed task with the current workaround. Baseline recall is weaker than direct timing; label it. Manual labor can mask product friction, so record all founder minutes as well as host minutes. A concierge success does not prove the automated version succeeds.

Give the host a usable artifact on each visit: a three-option plan with evidence, not a hypothetical pitch deck. Ask them to use the next event without being chased. In week five, transition willing hosts to the product. By week eight, measure whether they returned for another distinct event.

## Pricing and willingness to pay

No price is validated. Proposed interview anchors, used only after problem discovery, are **$19 / $49 / $99 per organizer per month**. These are experimental offers, not market facts or revenue forecasts. Rotate which anchor is shown first across interviews and record it to reduce anchoring bias. Ask what budget it would come from, what would be displaced, and who would approve. Compare against per-event pricing only if event frequency makes subscriptions unnatural.

Do not charge for a Qloo-backed service before the applicable provider terms permit the intended commercial arrangement. Qloo's public terms include restrictions on resale/charging for access and refer to additional agreements; the interpretation for a value-added application needs confirmation ([Qloo terms](https://www.qloo.com/legal/terms)). Use nonbinding written intent during unresolved access/rights work. Such intent is weaker evidence than a paid pilot; report it honestly.

The first commercially useful offer might be a host workspace with a capped number of events, shared participant links, private inputs, decision history, and exports. Do not promise unlimited AI use. Per-event variable cost includes OpenAI tokens, any eventual Qloo license/usage charge, support time, venue fact maintenance, and payment processing if introduced. “Free hosting” is not equivalent to free delivery.

## Unit economics without invented forecasts

Use this model with observed values:

```text
Monthly contribution per host
  = price collected
  - payment fees
  - Qloo allocated monthly/license/usage cost
  - OpenAI measured token cost
  - other variable infrastructure cost
  - support_minutes * actual_loaded_hourly_cost / 60
  - venue_maintenance_minutes_allocated * actual_loaded_hourly_cost / 60
```

Until a Qloo commercial quote exists, leave that input unknown and mark contribution “not calculable.” Do not set it to zero to produce an attractive gross margin. Founder time is an economic cost even when it does not leave the bank account. Use ranges for uncertain support and maintenance inputs.

Do not invent TAM, conversion, CAC, LTV, or retention. A bottom-up reachable market model starts with a sourced count of qualifying operators in one city; manually deduplicate, apply the screener, and multiply only by tested pricing under explicit adoption scenarios. A sensitivity table is a scenario, not a forecast. The plan prioritizes repeat use and payable value over market-size theater.

## Distribution tests

1. **Founder-led pilot:** directly recruit qualified organizers with specific event evidence. Measure outreach attempts, replies, qualified interviews, actual pilots, and repeat events separately.
2. **Host referral:** after an actually useful event, ask whether the host would introduce another operator. A volunteered introduction is stronger than “I would recommend it.” Draft referral copy, but ask before sending any message on a user's behalf.
3. **Workflow artifact distribution:** let a host share a clean event summary; a discreet product credit links to the demo only if the host opts in. Never expose participant taste or use invites to spam them.
4. **Existing-platform complement:** copy/import/export around the host's current event platform. No integration partnership is assumed. Only build an API integration after a repeated manual step becomes the adoption bottleneck.

Organic content can demonstrate a before/after planning decision using clearly synthetic participants or consented pilots. It must show practical tradeoffs and the revision loop; unsupported “boosts retention” claims are forbidden. Paid advertising is outside the free-budget plan.

## Startup defensibility: realistic version

There is no defensible moat at launch. Qloo is available to others; LLM tool calling and ranking policies are replicable. Potential defensibility could come from relationships with repeat organizers, excellent interaction design, workflow integration, a reliable curated venue ledger, and consented outcome data. None exists today. Proprietary Qloo data cannot be claimed as our moat, redistributed freely, or used for training without rights.

An outcome dataset is only valuable if it links a real occasion, explicit preferences, chosen venue, practical constraints, and observed participant response with consent and enough context to interpret it. Small, biased early data does not justify training a personalization model. Use it first to discover failure patterns and improve the workflow.

## Pivot paths

If hosts value revisions and constraint checking but not cultural fit, the product may be a general event-planning tool; it then fails the Qloo differentiation thesis and should not be dressed up as the same hackathon concept. If Qloo improves fit but hosts do not want another tool, consider a narrowly scoped agent tool embedded in a host's existing workflow after validating access. If paid organizers reject the value but consumers like it, reassess monetization rather than assuming virality. If the practical venue data workload dominates, narrow categories and geography before adding providers.

Do not broaden to enterprise HR, hotels, health, travel, or every cultural category because the initial buyer is difficult. A pivot needs a new falsifiable customer hypothesis, a reachable distribution path, and a cheap test.
