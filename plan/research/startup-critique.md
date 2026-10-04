# Qloo startup critique — evidence checked 2026-10-03

## Recommendation and honesty boundary

**Build an organizer copilot for recurring, small community outings in one city. Treat it as a startup hypothesis requiring validation, not a proven 9/10 business.** The initial buyer hypothesis is an independent paid community/supper-club host who repeatedly organizes existing opt-in groups of 4–8 in NYC and currently makes the venue decision themselves. Keep the members and the recurring host in control; do not begin with matching strangers, booking inventory, or replacing an event platform.

The sharper promise is: “Choose a venue your members can actually attend, see who compromises, and recover quickly when someone vetoes the plan.” Cross-domain interests produce Qloo-grounded venue rankings; explicit member constraints and organizer-confirmed venue facts determine feasibility; a deterministic group policy and event history make tradeoffs inspectable. No public evidence collected here establishes that hosts will pay for this promise.

### Requested skill status

The parent agent reports that the exact `rate my startup` skill was absent from the available skill catalog and local `.agents`, `.codex`, and `.claude` searches. Public searches for `"rate my startup" "SKILL.md"`, `"rate-my-startup" skill github`, and exact GitHub/skills.sh variants did not locate a verifiable exact skill source. A related skill named **evaluate** includes “rate my startup” among its triggers, but this is a different skill. No skill was installed, and this report does not claim to have executed the requested exact skill. Related listing: https://www.skillsdirectory.com/skills/neotherapper-evaluate . Its presence is discovery evidence, not startup validation.

Use the transparent rubric below as an explicitly named fallback. A ≥9 target is a decision gate; it cannot be obtained honestly by changing prose or giving unobserved customer evidence full credit.

## Published facts and what they imply

### Prior Qloo hackathon projects

The 2025 gallery marks four winners: GeoTaste (location/business intelligence), Resonance AI (campaign messaging), Zesty (discovery outside normal recommendations), and Alloy (cultural due diligence). Its first page also contains numerous travel, culture-profile, fashion, and media recommendation projects. **Inference:** generic taste-chat, travel-itinerary, and profile-generation concepts face substantial demo overlap. The gallery alone does not establish commercial traction or product quality.

Source: https://qloo-hackathon.devpost.com/project-gallery

The closest overlap is **Duddle**: participants supply preferences, Qloo generates restaurant options for the group, and Claude explains the recommendations. The author describes group decision paralysis as the problem. **Inference:** combining group interests, restaurants, and an LLM explanation is already demonstrated prior art. Differentiate through a recurring buyer’s process and evidence, not the word “group.”

Source: https://devpost.com/software/duddle

GeoTaste’s submission describes a map-based agent for location and competitive insights. Alloy describes a ReAct analyst combining Gemini and Qloo for brand/cultural compatibility reports. **Inference:** an autonomous research loop or a cultural compatibility score alone is not new within Qloo projects; a score needs a clear operational interpretation and external evaluation.

Sources: https://devpost.com/software/geotaste-your-agentic-qloo-taste-business-consultant and https://devpost.com/software/axiom-2bn391

### Qloo’s own offering

Qloo currently advertises cross-category discovery, entity enrichment, locality intelligence, and agent grounding with place facts and taste together. Its capabilities page includes hours, locations, attributes, personalized dining, and an illustrative booking flow; it explicitly distinguishes illustration from a real reservation. **Inference:** “real places,” “facts plus taste,” and “Qloo as an agent tool” are useful foundations, not defensible differentiation. Publicly advertised capabilities do not establish that every feature is available under a hackathon key or that local venue records are complete/current.

Source: https://www.qloo.com/capabilities

Qloo’s cold-start case study names Tablet Hotels as a hotel recommendation client. Its employee spotlight describes building a custom events recommender through catalog mapping and tags. **Inference:** hotel concierge and venue-programming alternatives overlap existing Qloo use cases. Hotel procurement and event inventory integration add risk to an eight-week, zero-cash project; they become plausible pivots only if the builder already has direct buyer access and a catalog.

Sources: https://www.qloo.com/use-cases/overcome-cold-start-challenges and https://www.qloo.com/team-spotlights/tala-khoury

### Adjacent competitors and substitutes

Partiful advertises free invitations, date polling, RSVP tracking, guest updates, and collecting dietary preferences. Luma currently offers free unlimited events/guests; its paid Plus plan includes API access. **Inference:** hosts have inexpensive coordination substitutes. Build a useful decision artifact that can be linked from their existing event, with manual export initially; avoid making a paid platform API a prerequisite.

Sources: https://partiful.com/ and https://luma.com/pricing

Meetup’s organizer pricing page lists paid plans and existing community/event management, analytics, templates, and AI event features. **Inference:** organizer spending exists in adjacent categories, but paying Meetup does not establish willingness to buy a second tool or the ability to afford Qloo-backed unit costs.

Source: https://help.meetup.com/hc/en-us/articles/28677808413197-Organizer-Subscription-prices-overview

Timeleft already describes matching small dinner groups, selecting a restaurant for vibe/location/budget, managing booking, collecting feedback, and helping people meet again. **Inference:** a consumer “find people and dine together” startup has serious adjacent competition and operational work. Serve existing independent hosts first; that distinction itself still needs testing.

Sources: https://timeleft.com/about/ and https://timeleft.com/blog/how-timeleft-matches-you/

## Ruthless assessment

| Question | Current assessment | What would change the verdict |
|---|---|---|
| Who pays? | The repeat host is identifiable; independent paid hosts are a hypothesis. Occasional friend groups are weak first buyers. | Observe actual paid hosts using the workflow for a real upcoming event, then returning for another. |
| Is the pain urgent? | Coordination and veto recovery sound plausible. They may be minor compared with selling tickets, attendance, or securing capacity. | Record what the host did for their last event, actual time spent, veto examples, and which task they would buy relief from. |
| Does Qloo matter? | Strong cross-domain discovery story, unproven outcome uplift. Cuisine, price, and travel time might explain the whole choice. | Compare blind shortlists from the same venue pool and constraints, with and without Qloo taste ranking; collect reasons and final choices. |
| Is it agentic? | Yes if it identifies a missing constraint, calls tools, changes the candidate set after a veto, and produces an actionable host decision. | A live trace shows a stateful replan and a material decision change. Tool count alone earns no credit. |
| Can it ship? | A web workflow for one city is plausible. Live booking, inbox integrations, and guaranteed venue suitability make scope fragile. | A working API spike and a public end-to-end deployment early in week one. |
| Is it differentiated? | Somewhat, through repeated fairness and host outcomes. Generic group recommendations overlap Duddle. | Demonstrate a concrete case where majority averaging repeatedly disappoints one member and a transparent policy changes the next choice. |
| Can incumbents copy it? | Easily. Affinity ranking and a fairness formula are features. Open-source submission also exposes implementation. | Own a trusted host relationship, their reusable verified venue pool, consented outcome history, and distribution. These are prospective advantages. |
| Can it be free? | An initial bounded demo may use free infrastructure. Post-hackathon API economics and commercial permission are unresolved. | Confirm actual access duration, quotas, public demo rights, caching/display terms, and commercial quote before taking paid commitments. |

### Critical licensing and API dependencies

Qloo’s public terms distinguish a negotiated agreement and bespoke Additional Terms. They prohibit resale/redistribution of Services or charging third parties for access, allow service/fee changes, and disclaim data accuracy. **Interpretation:** these clauses do not establish the commercial permission needed for this SaaS; check the actual key agreement and obtain explicit permission for the intended paid application. Do not assume a free key is a perpetual commercial license. Clarify storage/caching/display of outputs and continued judge access as well. Keep anonymous taste identifiers separate from local member identities.

Source: https://www.qloo.com/legal/terms

Confirm missing field behavior with live calls. Qloo’s affinity is a ranking signal, not a calibrated percentage of satisfaction. Cross-person raw scores may not be comparable. A defensible first version can use each member’s candidate percentile/rank within the same feasible set, then minimize severe dissatisfaction or show the Pareto alternatives. Report missing taste matches and never label a member’s weak coverage as strong evidence of dislike.

Budget, hours, capacity, availability, quietness, dietary accommodation, and accessibility have different evidence requirements. Store a source and checked-at date for host-confirmed facts. Missing or stale facts remain unknown. The host’s direct confirmation can complete a plan; neither taste correlation nor an LLM explanation verifies a reservation, allergy accommodation, or current accessibility.

## Rating and validation

Use the weighted rubric and pre-registered experiments in [06-startup-score-and-validation.md](../06-startup-score-and-validation.md). That document supersedes this report's early validation draft and uses the final Common Ground scope: existing opt-in groups of 4–8, paid recurring NYC hosts, and a curated pool of 20–30 venues. Its current weighted subjective evidence score is 4.7/10, with a ≥9 graduation gate requiring new direct evidence. No customer or outcome evidence was collected during this research.

## Factual calendar footnote

The current hackathon registration/submission window ends **October 30, 2026 at 11:45 pm Eastern**, with judging November 2–16 and winners around November 23. The user explicitly requested ignoring the real deadline in the main relative eight-week plan. These dates are a factual footnote and do not override that planning instruction. Official rules prevail over ancillary descriptions.

Source: https://qloo.devpost.com/rules

## Retrieval notes

Used the installed agent-reach search/web routing instructions at `/Users/atharvraotole/.agents/skills/agent-reach/SKILL.md`; its Exa/Jina paths had DNS failures as reported by the parent. Retrieved primary pages through the available web tool. `agent-reach check-update` also failed with DNS resolution after retries; no version update status established. No accounts created, integrations installed, messages sent, or paid services used.
