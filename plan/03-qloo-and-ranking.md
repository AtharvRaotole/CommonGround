# 03 — Qloo integration and honest group compromise

This is a proposed design, verified against public documentation on 2026-10-03. It has not been run with a Qloo key. Common Ground helps recurring local community hosts plan for 4–8 people in one city, using a 20–30-venue catalog the host has checked. Qloo supplies cross-domain taste ranking; the application turns independent rankings into a transparent compromise and collects actual participant responses.

## Why Qloo is essential

A participant can name favorite artists, films, books, or brands even when they cannot name local venues. Qloo connects those cultural entities to places. The first useful proof is that changing those resolved seeds changes venue ordering in a way participants find relevant. The product's distinct contribution is preserving individual preferences while making a group decision, with a private account of each participant’s own tradeoff and a non-identifying group summary.

Removing Qloo should materially change the result. A comparison mode should keep the same venue inventory, operational eligibility rules, screen design and participants, but replace Qloo ranking with the required competent OpenAI-only baseline, which infers taste from the same inputs but must pick only existing catalog venues. A popularity/host-order baseline is an optional secondary comparison, not a substitute for the required LLM baseline. Evaluate all modes with blinded venue slates; do not let better prose masquerade as better venue selection.

## Contract to verify during the first-week spike

Use the [current hackathon guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide), not old staging examples:

- Base: `https://hackathon.api.qloo.com`; header: `X-Api-Key`.
- Insights: GET `/v2/insights`, parameters in the URL. The guide rejects POST despite generic pages containing POST examples.
- Resolve cultural names with `/search`; resolve tags with `/v2/tags`. Search types and Insights types differ. Use the actual lookup results, with participant confirmation of ambiguous matches.
- Invalid parameters may be silently ignored. Test both inclusion and exclusion with deliberately contrasting inputs; a 200 response alone does not verify a filter.
- No numerical rate allowance is published. Document the approved key's scope and validity; do not assume perpetual free access.

The [Insights reference](https://docs.qloo.com/reference/insights-api-deep-dive) supports comma-separated seeds in `signal.interests.entities`, output restriction in `filter.results.entities`, and at most 50 returned records via `take`. `feature.explainability=true` can return input influence; missing explainability has a warning path. Use GET only and treat extra features as optional until verified with the issued key.

Schematic request shape, with placeholders rather than invented working IDs:

```text
GET /v2/insights
  filter.type=urn:entity:place
  signal.interests.entities=<participant's confirmed seed UUIDs>
  filter.results.entities=<the same candidate place UUIDs for every person>
  take=50
  feature.explainability=true
```

Build the query with `URLSearchParams`. Validate every parameter against the current category guide. Determine the returned affinity field and ordered entity array from an actual response before writing a parser; this plan deliberately does not invent a response schema. Schema validation should tolerate additional fields while rejecting missing identity/order data required by the ranking step.

## Venue inventory and candidate generation

Choose one city the builder can personally research. Maintain 20–30 real venues, their independently sourced name/address/website, category, approximate cost, suitable event formats, and date of host verification. Resolve each to a Qloo place ID, inspecting address and category rather than accepting the first text match. Retention of mappings depends on the applicable data rights.

The [parameter reference](https://docs.qloo.com/reference/parameters) offers location/tag restrictions, coarse price tiers and day-of-week hours. Search distance is miles, while Insights location radius is meters; WKT coordinates are longitude first. These are useful discovery filters. They do not establish current seating, reservations, exact event price, accessible facilities, or allergen safety. The host catalog and direct venue confirmation must supply those facts.

Proposed pipeline:

1. Host selects date, event format, maximum spend, travel area and explicit access/dietary requirements. Unknown material requirements need venue confirmation before a venue becomes selectable.
2. Each participant chooses up to three cultural entities from search results and can add a directly stated preference. Require equal maximum seed counts; do not flatten everyone's seeds into one large profile.
3. Form an eligible catalog slate. Optional discovery makes one call per person, then intersects returned identities with the checked catalog. Merge without prioritizing the person with the most seeds or broadening the catalog to unchecked venues.
4. Score the identical eligible slate once for each person. For a 30-venue maximum, `take=50` avoids normal top-page truncation. Check that every requested ID was returned, with no unexpected candidate admitted through ignored filters.
5. Create a common comparison set containing only candidates with known ranking for every participant who opted into Qloo profiling. Reindex each person's ordering on this same set. Report coverage and removed unknowns.
6. Compute compromise locally, present tradeoffs, request explicit participant acceptance or veto, and let the host choose the final plan.

Proposed coverage gate: at least eight operationally eligible, fully ranked venues and at least 80% coverage of the submitted eligible slate. These are product thresholds to validate, not Qloo promises. If the gate fails, show a data-coverage state and host-led choices; avoid displaying a confident group recommendation. The rank-coverage denominator is the submitted venue slate for the deliberately profiled cohort; separately display profiled members / all members. A failed query for a consenting profiled participant is a blocked run, not permission to drop that person. With at least two profiled members, an intentional opt-out creates mixed mode: all practical constraints still apply, but the taste ordering is described as based only on the profiled subset. It is never called whole-group taste coverage. Every participant, profiled or not, must explicitly accept the chosen venue on the current revision before the host can mark it ready. Missing acceptance allows only a clearly tentative handoff. Changing venue or material facts invalidates acceptances. Collecting opt-out votes does not invent missing rank values.

## Ranking without false precision

The [current affinity guide](https://docs.qloo.com/docs/interpreting-affinity-scores) uses 0–1 scores and says normalization occurs per query. They are contextual correlations, not probabilities. Raw score averages/minima across participants have no documented satisfaction interpretation. An omitted candidate is unknown, not zero.

Use relative ranks from the same candidate set. For profiled person `i` and venue `v`, let `r_i(v)` be its rank among `m` shared candidates, best rank 1. Exact ties receive their average rank. Store/display the raw affinity only when permitted and contextualized; the decision rule uses rank.

Proposed default ordering, clearly labeled as a product policy:

1. Minimize `max_i r_i(v)`: avoid a venue that falls especially low in any person's inferred list.
2. Among tied venues, minimize `mean_i r_i(v)`.
3. Use the host's independently checked suitability, then a stable venue ID, to break remaining ties.

Use mean rank internally to identify an alternative tradeoff; expose only a non-identifying summary to the host. Example: venue A ranks `[1,1,1,12]`; B ranks `[5,5,5,5]`. A wins average rank (3.75 versus 5), while B wins the proposed compromise rule. This is a hypothetical explanation of the rule, not a Qloo test result. Ranks express order, not how strongly a person prefers one venue over another; treating each participant's ranks equally is a disclosed design choice.

Do not call this mathematically optimal happiness or fairness. Call it “balances everyone's relative taste ranking,” explain the worst rank, and collect explicit acceptance. In the participant’s private view, their own rank position can be displayed as “5th of 24 options,” not “83% likely to enjoy.” Broad tastes, weak seed coverage and cultural correlations can still make the list wrong.

## Explanations, vetoes and replanning

Where verified, use Qloo's returned explainability to say which input influenced the ranking. A high influence is not permission to invent a causal story, a personality judgment, or a venue amenity. If absent, say only that Qloo ranked it using the selected cultural interests. Ground every displayed venue fact in the checked catalog, with source and verification date.

An optional OpenAI call converts already computed facts/tradeoffs into concise copy. It cannot change eligibility, create a venue, override a veto or reinterpret affinity as probability. Validate that every mentioned venue and fact exists in the allowed inputs. Template copy is the fallback if the model is unavailable.

A veto excludes the venue or a user-confirmed constraint. Do not convert a single dislike into invented demographic or personality inferences. Rerank the remaining slate. Ask for acceptance on the revised plan; the host approves venue selection, event announcement copy and ICS download. Downloading an ICS file does not send invitations, book a venue or guarantee availability.

## Bounded execution and evidence

Target 4–8 people and at most 30 candidate venues. An initial run needs at most eight discovery calls plus eight scoring calls. Reserve at most eight additional calls for one verified refinement; the application cap is 24 Qloo calls per run, including retries and optional features. Seed lookup has a separate finite budget and happens before planning. A new user-initiated run consumes a new budget; the system must also enforce a total daily budget.

No more than three external calls run concurrently. Retries consume remaining budget, use bounded backoff, and stop on repeated errors. A partial result remains partial. Permit at most two OpenAI rounds per run; the deterministic core needs none. Do not include all-pairs seed analysis, heatmaps, demographic inference, or group-comparison endpoints in the core. [Analysis Compare](https://docs.qloo.com/reference/analysis-compare) is documented for two entity groups, but does not remove the need for per-participant common-slate ranking.

First-week evidence to record without making unsupported claims:

- Coverage for the checked venue inventory and representative seed types; ambiguity rate in lookup.
- Complete common-slate scoring, filter effectiveness, response sizes and explainability availability.
- Different seed sets change ordering; participant feedback supports those differences.
- Latency, CPU, call counts, and quota/error behavior of a deployed representative run.
- Rights for public display, retention, export, OpenAI processing and paid workflow use.

Before pilot release, test the decision rule on fully known rank matrices, exact ties, one candidate, unknown results, a missing person, full veto exhaustion and contradictory hard constraints. Check that no vetoed venue can appear in copy/export, and that failures never silently substitute made-up scores. Human outcome evaluation must measure acceptance, actual event choice, decision time and repeat host use; synthetic tests establish algorithm behavior only.
