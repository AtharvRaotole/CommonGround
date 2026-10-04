# Demo, release, and operations

## What judges should experience

The product should make a complete decision loop legible without requiring a pitch. A first-time visitor can open a labeled example immediately, then try a bounded live path with real inputs when provider access is available. The example teaches the interaction; it does not substitute for a functioning hosted app.

Use a four-person synthetic scenario with explicit “fictional participants” labeling. Give them overlapping cultural interests, different price ceilings, and one practical requirement. Do not preclaim that real artists or movies imply a specific real venue; populate live affinities only from real permitted provider responses, or use obviously synthetic identifiers in example mode.

Suggested guided sequence, with durations as a storytelling target rather than measured timing:

| Segment | What happens | What it proves |
|---|---|---|
| Opening, ~20s | Host's actual job and upcoming outing appear | Specific audience and concrete task |
| Inputs, ~30s | Voluntary cultural seeds plus constraints | Cultural grounding and user control |
| First plan, ~35s | Tool trace resolves IDs, calls Qloo, checks constraints, ranks common slate | Real Qloo integration and bounded agent workflow |
| Objection, ~25s | Participant veto; plan revises, old approval invalidates | Agent responds to feedback rather than one-shot generation |
| Handoff, ~20s | Host sees remaining practical task and approves copy/ICS | Complete product experience |
| Evidence, ~30s | Show real baseline comparison and limitations | Honest potential impact |

If an evaluation is inconclusive, show that result and what was learned. Never put fictional lifts, testimonials, customer logos, or a mock live trace into the demo as if real.

## Map the product to judging

The event lists four equally weighted criteria: technological implementation, design, potential impact, and quality of idea ([official rules](https://qloo.devpost.com/rules)). Build an evidence packet for each:

- **Implementation:** reviewed Qloo adapter; entity disambiguation; identical-slate per-member queries; constraints; state transitions; bounded retries; live contract evidence and meaningful tests.
- **Design:** coherent host/member experience, mobile input, honest uncertainty, privacy, accessible controls, readable revised plan and a usable export.
- **Impact:** qualified host interviews, actual upcoming events, measured active planning time, human-rated venue fit, repeat use and budget-owner intent. Distinguish exploratory results from proven business outcomes.
- **Idea:** explain the existing organizer workflow, acknowledge Duddle/Timeleft/222, and demonstrate the specific improvement rather than calling taste-aware group planning novel by itself.

The overview currently requires an externally hosted functional demo, public code, a description, and an open-source license; it explicitly says a demo video is not required ([event overview](https://qloo.devpost.com/)). A short optional walkthrough can help, but it must not displace a usable live product.

## Release checklist

- [ ] All must-have requirements have AC evidence; unresolved limitations are visible.
- [ ] A fresh user completes the public flow without the founder narrating.
- [ ] Live path works with the actual approved Qloo key and permitted OpenAI model.
- [ ] Production has no development keys or synthetic/live data ambiguity.
- [ ] The source repository includes code, lockfile, migrations, setup, architecture, privacy notice, license, `.env.example` with empty values, and synthetic fixtures only.
- [ ] The chosen code license is compatible with dependencies; proprietary provider data and third-party assets are excluded from that license.
- [ ] No secret appears in source, git history, browser bundle, source map, test artifact, or URL.
- [ ] Demo usage caps and provider usage counters are visible to the operator.
- [ ] Public judges can try the required functionality without a founder-only allowlist or payment; application safety limits are explained and sized for judging.
- [ ] Provider approval covers the intended public demo and duration; the free-tier quota plan has been measured.
- [ ] Export says reservation unconfirmed and requires no paid external account.
- [ ] Production rollback and deletion are rehearsed with disposable data.
- [ ] Submission copy makes only claims supported by evidence IDs.

If free quotas cannot support a usable public demo, resolve that with the provider before claiming the submission is ready. A quota-exhausted static replay alone is not equivalent to a live end-to-end application. No alternate billing account, auto-upgrade, or paid plan is a fallback under the user's constraint.

## Submission description template

**Problem:** Independent hosts repeatedly reconcile a small group's preferences and practical needs when choosing venues. Our pilot work will establish whether this is costly enough to matter.

**Product:** Common Ground collects voluntary cultural signals, uses Qloo to rank venue alternatives for the same group, applies practical requirements, and revises the plan after a private objection. The host controls the final handoff.

**Qloo contribution:** State exactly which endpoints were tested and how per-person rankings enter the policy. Explain why raw affinity values are not enjoyment percentages.

**Evidence:** Insert only completed experiment outcomes, denominator, study setup, date, and caveats. If no measured result exists, say “evaluation pending” and do not imply a benefit was established.

**Limitations:** One city, limited group size, curated facts, no booking, small evaluation sample, provider availability and rights conditions. Explain what would be needed to expand.

This is a structure to populate at release, not finished factual marketing copy. Submission itself is an external action the founder reviews and performs or explicitly authorizes.

## Operations runbooks

**Qloo authentication fails:** distinguish wrong hackathon base URL, missing header, expired key, and unsupported type. Disable live creation, preserve private state within its retention rules, show a clear setup/outage message, and investigate without exposing the key. Do not retry 401/403 repeatedly.

**Qloo rate-limits:** count the failed attempt; honor Retry-After within remaining deadline; reduce concurrent runs; stop at the application cap. Contact the event support route only when the founder authorizes an outgoing message. Never rotate identities to evade limits.

**OpenAI unavailable or over budget:** use deterministic templates for explanatory prose if the underlying Qloo result is valid. Say language assistance is unavailable. Do not charge ahead with extra model retries.

**No feasible venue:** report the constraint conflict, identify what confirmation or participant-approved change would help, and keep “ready” disabled. This is a valid outcome, not a system error to hide.

**Bad venue fact:** mark conflicting/expired, invalidate affected approvals, request host confirmation, record source correction. Do not send automatic attendee messages. Provide a clear notice the host can share.

**Credential exposure:** immediately disable affected routes, revoke/rotate provider or capability keys, inspect redacted usage, remove exposed artifacts and history as appropriate, and document impact. Do not claim rotation erases an earlier leak.

**Database or migration failure:** stop writes, retain safe read-only behavior, restore a verified backup within provider capabilities, and deploy the previous compatible Worker. Test restored foreign keys, version checks and deletion. Keep the outage record and explain lost state honestly.

**Abusive public traffic:** apply bounded creation, per-event and global reservations, and additional anti-abuse friction if needed. Avoid collecting unnecessary personal data. Keep the clearly labeled example available, but retain enough live capacity for legitimate judging.

## Real calendar, separate from the requested plan

The actual current event lists a submission deadline of **30 October 2026, 11:45pm America/New_York**, and judging through **16 November 2026** ([rules](https://qloo.devpost.com/rules)). The main roadmap intentionally uses the user's requested hypothetical eight weeks and does not compress the scope to that real deadline. Starting an eight-week build on 3 October would not meet the listed submission date. If actual participation becomes the priority, select and schedule a smaller release separately; do not relabel the eight-week plan as calendar-compatible.

## Eight-week exit

Produce a release, evidence packet, current startup score, unresolved risks, and a written continue/pivot/stop decision. A hackathon result is not proof of product-market fit. A polished product with no repeat use is not a startup success. Continue only with a credible customer and provider path.
