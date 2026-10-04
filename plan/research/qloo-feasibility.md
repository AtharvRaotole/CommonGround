# Qloo and free infrastructure: feasibility evidence

Verified 2026-10-03. This is planning research, not an integration test. No API key or secret was read or used. Live Qloo pages were read through Jina; the official GitHub documentation mirror was useful for discovery but contains stale details. Current guide wins where they differ.

## Confirmed Qloo facts

- The [current hackathon developer guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide) requires the `https://hackathon.api.qloo.com` base and `X-Api-Key` header. Keys do not work on production or staging. It says all documented endpoints are available during the event; `/recs` and `/recommendations` are unsupported. `/v2/insights` must use GET and query parameters. Keys follow approval of a request form, typically within a few business days. Rate limits exist, but the guide provides no numerical quota. Invalid parameters can be silently ignored. Not every entity or region has coverage. Field projection is unavailable, so clients must trim verbose responses themselves.
- [Entity search](https://docs.qloo.com/reference/get-search) uses `/search`, `query`, and `types`. Search and Insights do not accept identical category vocabularies. Search accepts geographic coordinates, WKT, or a Qloo UUID; `filter.radius` is measured in miles.
- [Insights reference](https://docs.qloo.com/reference/insights-api-deep-dive) documents `signal.interests.entities` as comma-separated input IDs and `filter.results.entities` as comma-separated candidate IDs. This supports a request for one person's cultural seeds against a fixed venue shortlist. `take` tops out at 50. `feature.explainability=true` can attach input-entity influence under each result's `query.explainability`; it may return a warning instead. This is supporting influence metadata, not a causal explanation of an individual's preference.
- [Parameters](https://docs.qloo.com/reference/parameters) distinguish input signals from output filters. Location filters constrain venue geography; `filter.location.query` resolves locality names, while WKT uses longitude first. `filter.location.radius` is in meters; zero prevents boundary padding for a locality. Place filters include coarse restaurant price tiers 1–4 and day-of-week hours. Tags have union/intersection operators. These fields do not establish live availability, an exact event cost, food safety, or accessibility suitability.
- [Current score interpretation](https://docs.qloo.com/docs/interpreting-affinity-scores) uses the range 0–1 and explicitly says scores are normalized per query. A score is context-dependent affinity, not attendance probability or a satisfaction measurement. Raw scores should not be averaged across participants as if they were calibrated comparable utilities. Identical candidate sets and within-person rank aggregation offer an honest engineering alternative, still requiring user validation.
- [Analysis Compare](https://docs.qloo.com/reference/analysis-compare) accepts groups `a.signal.interests.entities` and `b.signal.interests.entities`. Its purpose is comparison of entity groups; the public description does not establish a ready-made person-by-venue utility matrix. Common Ground does not need to depend on this route.
- [Taste Analysis](https://docs.qloo.com/reference/taste-analysis) uses Insights with `filter.type=urn:tag` and entity/tag/location signals. [Tag search](https://docs.qloo.com/reference/get-tags-1) resolves valid tag IDs. Use lookup results; do not invent cuisine, mood, or accessibility URNs. The hackathon guide's category list and the generic Insights reference differ on some non-entity uses, so tag analysis is an optional spike, not an MVP dependency.

## Rights and access questions that remain unresolved

[Qloo's public terms](https://www.qloo.com/legal/terms), last updated December 19, 2024, incorporate account-specific additional terms and allow a signed agreement to supersede them. They identify outputs as Qloo intellectual property, prohibit resale/redistribution of the Services, and grant Qloo broad rights over anonymized input signals. They do not give a clear general-purpose caching TTL or permission to publish a reusable output dataset. Do not infer that a hackathon key grants an unrestricted commercial SaaS license.

Ask Qloo for written answers before a paid pilot or output retention: public multi-user demo rights; charging for a community planning workflow; API access duration after judging; per-minute/day/concurrency allowance; allowed retention of entity IDs, rankings, explainability, screenshots and exported plans; permitted client display/image use; requirements for attribution; and use of output in an OpenAI request. These are actual business dependencies, not reasons to defer a planning document.

## Confirmed free infrastructure

| Dependency | Verified allowance / constraint | Source |
|---|---|---|
| Cloudflare account | Free signup; no credit card needed in official workshop prerequisites | [Learn Workers](https://developers.cloudflare.com/labs/workers) |
| Workers Free | 100,000 dynamic requests/day; 10 ms CPU/request; 128 MB memory; 50 external subrequests; six connections waiting for headers | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| CPU distinction | Network and database waiting do not consume CPU time; parsing and running JavaScript do | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| Static assets | Asset requests free and unlimited; no asset storage charge; Worker invocations remain metered | [Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) |
| Asset upload limits | 20,000 files/version on Free; 25 MiB/file | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| D1 Free | 5 million rows read/day; 100,000 written/day; 5 GB total; indexed scans matter; no egress charge | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) |
| D1 database limits | 10 databases/account; 500 MB/database; seven-day Time Travel; 50 queries/Free invocation | [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |
| D1 limit behavior | Free daily quota exhaustion produces errors until reset at 00:00 UTC, rather than automatically upgrading | [D1 release notes](https://developers.cloudflare.com/d1/platform/release-notes/) |
| Public demo hostname | Account includes `workers.dev`; domain purchase unnecessary for hobby demo | [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) |
| Public GitHub CI | Standard hosted runners free for public repos; larger runners always charged; storage has separate included limits | [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) |

## Hypotheses requiring first-week evidence

1. Enough of a manually verified 20–30-venue city catalog resolves to Qloo place IDs and returns comparable rank order for all 4–8 participants.
2. Diverse cultural seed sets produce meaningful differences, and the proposed compromise improves host decisions against a popularity-only baseline.
3. Missing candidates are uncommon enough to form a complete comparison table. Absence is unknown, not zero affinity or dislike.
4. Lean response parsing, bounded fan-out and a small rank matrix fit Workers Free's CPU limit. The CPU budget must be measured on a deployed representative run.
5. The key's quota and validity cover a public demo and judging. A permanently free Qloo production tier is not verified.

## Calendar appendix, separate from the hypothetical eight-week plan

The [current event rules](https://qloo.devpost.com/rules) list September 30–October 30, 2026 registration/submission; the deadline is 11:45 pm Eastern on October 30. Judging ends November 16. A working demo must remain freely accessible to judges through judging, with public source and an open-source license. The [overview](https://qloo.devpost.com/) additionally specifies external hosting and says a video is not required. An eight-week project begun on October 3 is not calendar-compatible with submission to this specific event; the main plan remains the user's requested relative W1–W8 horizon.
