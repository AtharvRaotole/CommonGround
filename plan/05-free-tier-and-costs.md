# 05 — Free infrastructure, bounded usage and commercial conditions

Verified 2026-10-03. This is a budgeted architecture proposal, not a deployed cost measurement. The claim is **zero incremental infrastructure subscription cost for a small pilot**, conditional on staying inside the listed free allowances. Existing OpenAI access remains metered; owning a key does not make inference free. Qloo access depends on hackathon approval and terms; perpetual free production access is unverified.

## Recommended minimal stack

| Component | Choice | Why / cost condition |
|---|---|---|
| UI | React + Vite + TypeScript | Build static assets; browser handles ordinary interaction and presentation |
| Hosting/API | Cloudflare Workers Free with Static Assets | One provider, server-side secrets, no paid domain required for demo |
| Persistence | Cloudflare D1 Free | Rooms, consent, host-owned constraints, catalog facts, usage counters; output retention only if permitted |
| CI/source | Public GitHub repo + standard Linux Actions runner | Public CI minutes free; include an open-source license for app code |
| Taste inference | Approved Qloo hackathon key | Essential; access duration/quotas/rights must be confirmed |
| Agent decisions / language | Existing OpenAI project/key | At most two bounded rounds; one tool-choice round required in agent mode; labeled guided fallback works without a model |
| Identity | Anonymous invite/member/host capabilities | No paid auth, email delivery, SMS, or calendar integration |
| Distribution | Copy link, approved announcement text, ICS file download | No send API, booking API or messaging bill |
| Location UI | Catalog list, addresses, optional outbound map links | No maps API, route engine or paid geocoding |

Avoid Redis, vector storage, queues, file-upload services, recommendation frameworks and extra analytics vendors in the MVP. No background cultural-profile crawler or social-account imports. A host can share an invitation through their existing channel manually. No external message is sent automatically.

## Verified allowances and practical implications

Cloudflare's [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) specify 100,000 dynamic requests per day, 10 ms CPU per request, 128 MB memory, 50 external subrequests and six simultaneously waiting outgoing connections on Free. Network/database waiting does not consume CPU; JSON parsing, validation, sorting and serialization do. Static upload limits are 20,000 files/version and 25 MiB/file.

The [Static Assets billing page](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) says normal asset requests are free/unlimited and asset storage has no added charge. Invoke the Worker for `/api/*` only. Do not put every asset behind `run_worker_first`; that spends dynamic quota and can make assets fail when the account allowance is exhausted.

[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) includes 5 million rows read/day, 100,000 written/day and 5 GB account storage. Scanned rows count, not just returned records. Index room IDs, membership tokens, expiry and usage-counter keys. Index maintenance also writes rows. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) cap each Free database at 500 MB and each Free account at ten databases; seven-day Time Travel and a 50-query-per-invocation bound also apply. The [release notes](https://developers.cloudflare.com/d1/platform/release-notes/) say daily quota exhaustion returns errors until the 00:00 UTC reset.

Use separate production and preview D1 databases initially and retain little data. [Cloudflare's official workshop](https://developers.cloudflare.com/labs/workers) states free-account signup needs no credit card. The account provides a [workers.dev subdomain](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/); it is suitable for a hobby/demo, with no domain purchase. Cloudflare recommends custom domains for business-critical production, so a commercial deployment may change this assumption.

[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) makes standard public-repository runners free; larger runners are always charged. GitHub Free includes 500 MB artifact storage and 10 GB cache storage per repo. Keep short retention for screenshots/test reports, avoid routine bulky uploads, and use standard `ubuntu-latest`. Paid runner classes are unnecessary.

## Plan limits are application policy, not provider quotas

The [current Qloo hackathon guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide) gives no numeric request limit and makes access conditional on approval. It says all documented endpoints are available during the event. It also warns that output field suppression is unavailable and invalid parameters can be silently ignored. Treat Qloo response size and issued-key behavior as first-week measurements.

Proposed limits:

- Room: 4–8 participants; each confirms up to three cultural seeds; candidate inventory 20–30 verified venues in one city.
- Planning run: at most 24 Qloo requests, including retries; normally up to eight discovery plus eight fixed-slate scoring calls, with up to eight reserved refinements.
- Lookup: proposed ceiling of 20 requests/member/day and 60/room/day, plus the configurable global allowance. These are application caps, to lower if the issued key needs it. Debounce typing, require a minimum query length, and reuse the participant's current selection within the live session where permitted. Do not issue a query per keystroke.
- Outbound concurrency: three calls at a time; failed requests consume the reservation. Stop cleanly at the cap.
- OpenAI: zero required for the ranking calculation; one tool-choice round required for agent mode, maximum two bounded rounds per run, finite input/output and timeout; no open-ended agent loop.
- Daily global usage: a configurable backend ceiling below the approved Qloo allowance and the owner's OpenAI spend envelope. Start the pilot conservatively; provider approval determines its final value.
- No periodic background replanning or live group polling every second. Replan only when a person deliberately changes the decision.

Reserve request budget atomically before making an external call. Record consumed/refunded reservations consistently, use idempotency keys for accidental repeat submissions, and release expired reservations only when no outbound request was issued; uncertain outcomes remain charged until reconciled. Count retries and model tool calls; UI counters alone cannot enforce spend. A capability token plus server-side room membership and per-room/global counters restricts a public trial without buying an auth service.

## Handling the 10 ms CPU constraint

A single Worker request fetching and parsing 24 full Qloo responses is an unnecessary risk. Use small API steps that fetch one response or a small bounded batch, validate/trim it immediately, and send only a narrow DTO to the browser. The UI can coordinate these steps under a server-issued run budget. Keep final rank aggregation over at most `8 × 30` entries. Do not persist the matrix unless rights permit it.

Measure CPU on deployed representative requests using actual verbose responses. Start with lightweight fetch/schema code, avoid SSR, large SDK startup, rich full-response logging and per-request library initialization. If a response is too large, reduce discovery `take`, split participant scoring across invocations, or use a smaller catalog. Full field projection is unavailable, so merely requesting fewer output fields is not a solution.

The free runtime is a hypothesis until measured. Ship a reduced bounded configuration that meets the CPU budget if necessary; do not silently move to a paid plan. Display partial/failure states if an upstream provider fails, and preserve manually verified host choices. Templates should render an approved result even if OpenAI is unavailable.

## Illustrative accounting, not a traffic forecast

For `R` planning runs/day, `Q` Qloo requests/run, `L` separately capped lookups, total Qloo demand is `R × Q + L`. With 100 runs, a worst-case `Q=24` yields 2,400 planning calls plus lookups. This arithmetic does **not** establish that the issued Qloo key permits that load.

If a run generates 50 dynamic HTTP requests including room/member steps, 100 runs consume about 5,000 dynamic requests/day: 5% of the Workers allowance, before ordinary trial traffic. If it performs 100 D1 row writes including index overhead, the same volume uses about 10,000 writes/day: 10% of that allowance. Actual scans, indexes, user revisits, errors and abuse must be measured; these are capacity examples, not guarantees. Do not use a budget model as evidence of demand.

Define an owner-approved OpenAI envelope before publishing. Let `P_in`, `P_cached`, and `P_out` be the chosen model's verified USD/million-token prices. Cost is `(uncached_input × P_in + cached_input × P_cached + output × P_out) / 1,000,000`. Multiply by rounds and runs, then include bounded retry reserve. No model price is invented here. Verify the selected model and current price at implementation time; build a per-run token cap and global application spend counter. Account alerts are supplementary controls.

## Persistence, exports and paid pilots

The [public Qloo terms](https://www.qloo.com/legal/terms) incorporate additional account terms, claim rights in output, restrict redistribution/resale of Services, and grant broad usage rights over anonymized input signals. They do not establish a generic cache TTL. Obtain written, use-case-specific terms before charging or retaining/redistributing outputs; app-code open sourcing does not license Qloo's dataset.

Default storage design: keep independently researched venue facts, participant consent, host-owned constraints, random room/run IDs, expiry and aggregate operational counters. Treat Qloo mappings, request hashes derived from Qloo identities, scores, ranks, explanation objects and output-derived announcement/ICS content as requiring an explicit retention/display/export policy. Hashing does not make a license restriction or privacy obligation disappear. Keep processing ephemeral while that policy is unresolved; do not commit raw API responses as public fixtures.

Resolve these questions before a public paid pilot: permission for multi-user demo and commercial workflow; key lifetime through judging and beyond; numerical quotas/concurrency; client display and image rights; allowed output retention/TTL; export and screenshots; attribution; sending minimized output to OpenAI. Public terms alone are insufficient to price a sustainable Qloo-backed business.

The free infrastructure pilot can establish demand. A later commercial business case must include Qloo's actual license quote, permitted usage, OpenAI marginal cost, support effort and any paid production hosting requirement. Do not describe an indefinitely free startup or recurring revenue until those dependencies are known.

## Launch acceptance checks

Measure representative CPU, payloads, fan-out and actual counters on Free. Exercise duplicates, exhausted budgets, failed calls, timeouts, concurrent members, expired invitations and cross-room access. Verify static assets survive deliberate API budget refusal. Audit bundles/logs for secrets and explanations for unsupported claims. Test deletion, expiry and the agreed output policy; export only permitted, host-approved content. Increase usage only when confirmed limits, rights and measured costs support it. The detailed test cases and evidence requirements are in chapters 07 and the phase files.
