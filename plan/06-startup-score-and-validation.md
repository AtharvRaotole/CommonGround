# Common Ground: startup score and validation

Research checked October 3, 2026. This document uses the user's relative eight-week planning horizon. All experimental counts, prices, and thresholds below are proposed decision rules, not observed results or market facts.

## Current verdict

**Common Ground is a promising hackathon project and an unvalidated startup hypothesis. The current evidence supports 4.7/10 on the explicit weighted startup rubric below. A ≥9/10 rating is a graduation target requiring new evidence.** Arithmetic precision does not make the judgment objective. No interviews, repeat-use outcomes, paid commitments, or live API measurements are claimed here.

The intended buyer is a paid recurring local community/dinner host serving an existing, opt-in group of 4–8. Start with NYC and a curated pool of 20–30 venues. Members supply interests and practical constraints; Qloo informs taste ranking; a deterministic policy makes group tradeoffs visible; vetoes cause a replan; the host reviews practical evidence and approves the handoff. The decisive startup question is whether this removes enough repeated work to justify another tool.

### Requested skill limitation

The exact `rate my startup` skill was not available in the session catalog or the local skill searches reported by the parent agent. Public exact-name and `SKILL.md` searches did not locate a verified source. A related skill called `evaluate` contains that phrase as a trigger but is not the requested exact skill: https://www.skillsdirectory.com/skills/neotherapper-evaluate . It was not installed or silently substituted. This document uses a clearly identified evidence-constrained fallback rubric.

## Facts, competitors, and inference

- **Prior Qloo project:** Duddle already collects participant preferences, generates group restaurant candidates through Qloo, and explains them with Claude. A generic group-restaurant recommender therefore has direct demo overlap. Source: https://devpost.com/software/duddle
- **Adjacent operator:** 222's partner page describes compatible groups of six, restaurant matching, reservations, and restaurant feedback. It already operates the people-plus-place workflow. Source: https://partners.222.place/
- **Adjacent consumer product:** Timeleft describes small-group matching, venue selection based on vibe/zone/budget, and repeat social experiences. Source: https://timeleft.com/about/
- **Existing organizer substitutes:** Partiful advertises free event coordination, polls, RSVP tracking, guest updates, and dietary information. Luma offers free event hosting and reserves API access for Plus. Sources: https://partiful.com/ and https://luma.com/pricing
- **Qloo overlap:** Qloo itself markets cross-category recommendations and place facts plus taste for agents. It also describes Tablet Hotels personalization and a client event recommender. Sources: https://www.qloo.com/capabilities , https://www.qloo.com/use-cases/overcome-cold-start-challenges , https://www.qloo.com/team-spotlights/tala-khoury

**Inference:** Common Ground's testable distinction is helping existing independent hosts make repeated, inspectable decisions for known groups. Fairness, veto recovery, verified local inventory, and saved host effort form a coherent wedge. None is yet a proven moat. Do not pitch “AI matches people to restaurants” as novel, or use a Qloo affinity as a percentage chance of a successful evening.

## Weighted rubric

Scores are editorial judgments of the evidence available today. Anchor meanings: 0 = unsupported or incoherent; 3 = specific hypothesis; 5 = coherent design with indirect evidence; 7 = observed pilot evidence; 9 = repeated direct evidence sufficient for a bounded go/no-go decision; 10 = unusually strong evidence within the tested scope. The anchor is adapted to each category; published product capability can support technical design but does not establish buyer behavior.

Formula: overall score = sum(weight × category score) / 100.

| Category | Weight | Today / 10 | Evidence and missing proof |
|---|---:|---:|---|
| Recurring buyer pain | 15% | 5 | Specific host workflow; actual workload and urgency unobserved. |
| Willingness to pay | 15% | 3 | Paid host is a plausible buyer; no purchase evidence or agreed offer. |
| Incremental value of Qloo | 10% | 6 | Cross-domain ranking is central; no fair ablation yet. |
| Agent behavior and task completion | 10% | 8 | Stateful missing-input collection, veto replan, and host approval are well specified. |
| Technical feasibility in eight weeks | 10% | 7 | Bounded web scope; live key, venue coverage, and deployment still need testing. |
| Differentiation and competitive position | 10% | 5 | Host workflow is more specific; Duddle/222/Timeleft and free tools overlap. |
| Distribution access | 10% | 4 | Reachable buyer type; no demonstrated founder channel or recruited cohort. |
| Sustainable rights and unit economics | 10% | 2 | Post-hackathon permission/pricing and real cost per plan unknown. |
| Repeat use and retention | 5% | 3 | Recurring use is built into the hypothesis; no returning host observed. |
| Defensibility | 5% | 3 | Potential trusted host venue pool and outcome history; easy to copy today. |
| **Weighted score** | **100%** | **4.7** | **A hypothesis to validate, not a proven ≥9 business.** |

## Pre-register the experiments

Write the protocol and analysis sheet before viewing formal-study outcomes. Week-five alpha observations are exploratory usability data, explicitly separate and excluded from the later pre-registered confirmatory/comparative analysis. The formal study starts only after P24 freezes the protocol; if alpha observations inform its design, record that fact. Record recruitment channel, eligibility, member overlap, exclusions, model/prompt version, venue-pool version, evidence timestamp, and missing-data handling. Freeze the primary metric and decision thresholds; disclose deviations. Keep failed sessions and withdrawals in the denominator. Synthetic personas can test software, but they cannot count as customers.

### A. Problem and buyer interviews

Target **12 independent recurring paid hosts**. Ask for the last event and next scheduled event, actual tools used, minutes spent choosing/replanning, specific vetoes, missed attendance, and money already spent. Avoid leading with the product or asking whether an idea sounds useful. Qualify hosts who own venue decisions and run repeated events for opt-in known groups. Record whether their group is actually recurring rather than inferring it from a job title.

Provisional continuation gate: at least **8 of 12** describe repeated venue/replanning pain and provide a concrete recent example, and at least **6** offer a real upcoming planning session. If the strongest problem is acquiring attendees or filling seats, the current ranking wedge is wrong; either pivot explicitly to that buyer's problem or stop the startup claim.

### B. Isolate Qloo ranking value

Target **12 independent groups**, with two eligible planning occasions per group where feasible. Existing members must opt in. Group members may overlap within their group's repeated occasions; count the group as the independent unit, not every rating as an independent customer.

Hold fixed:

- The same feasible candidate slate drawn from the curated NYC pool, same explicit member constraints, same taste inputs, same verified venue facts and freshness labels.
- The same deterministic fairness policy, veto rule, and shortlist size.
- The same explanation template; hide condition labels and model-generated persuasion.

Compare:

1. **LLM-only ranking baseline:** the fixed LLM receives member interests and the same candidate facts, ranks candidates for each member, and then uses the shared deterministic fairness policy. It cannot invent venues or receive less useful factual context.
2. **Qloo ranking condition:** Qloo ranks the identical candidate slate for each member; within-person ranks feed that same fairness policy. Additional Qloo factual enrichment must either be given to both conditions or evaluated separately.

Randomize shortlist display order, blind members to the condition, and freeze the LLM version/prompt. Score venues from neutral cards before revealing which method chose them. If a venue appears in both shortlists, collect its rating once rather than letting repetition change the response. Resolve no-match cases with the pre-registered rule and log them as coverage failures.

**Primary external metric:** the lowest member's explicit 1–5 willingness-to-attend rating for the method's first recommendation, using member ratings rather than Qloo affinity. A useful secondary metric is whether every member accepts at least one top-three option. Capture host blind preference, veto reason, constraint violations, and actual event attendance/feedback where available.

Proposed bounded graduation signal: the Qloo condition improves the group-level lowest-member score in **at least 8 of 12 groups**, with a median paired improvement of **at least 0.5 points**, and no increase in verified hard-constraint failures. Compute each group's result across its repeated occasions before aggregating. Report ties, losses, raw group differences, and uncertainty; a small exploratory study cannot establish a general performance guarantee. If taste has no incremental value against this baseline, drop the Qloo-value thesis or change the use case.

### C. Evaluate the whole workflow

Run the deployed intake → candidate ranking → veto → replan → evidence review → host-approved handoff for **12 independent groups**, seeking two real planning occasions per group. These repeated occasions are observed workflow trials; the 8-of-12 voluntary return measure is assessed on a subsequent, unprompted event, not a researcher-mandated second session. Compare against the host's existing manual/LLM/poll process, counterbalancing order across hosts when possible. Dates, venue availability, and learning differ across occasions; report those limits and keep this evidence separate from the controlled same-slate test.

Measure active host minutes to an acceptable plan, total elapsed coordination time, intake completion, abandoned sessions, number/reason of vetoes, explicit member acceptance, confirmed practical facts, and subsequent voluntary use. Stop the timer consistently; do not subtract manual checking or troubleshooting from the product condition.

Proposed gate: **8 of 12 hosts voluntarily use the product for a second real event**, median paired active-host-time reduction is **at least 20%**, and member acceptance does not decline. At least **10 of 12 groups** must complete member intake without the researcher entering responses for them. Distinguish planned event acceptance from actual attendance and satisfaction. If the tool saves no effort, remove friction or simplify before adding integrations.

### D. Payment intent without unauthorized charging

Choose a concrete offer only after measuring actual service costs; a **$19/month** organizer offer can be an initial **pricing hypothesis**, not a market fact. Seek **five dated, nonbinding paid-pilot commitments** naming the exact offer, buyer, start condition, and budget owner. Ask for a commitment conditional on commercial Qloo permission, not a generic survey “yes.” Keep counts of declines and reasons. This is stronger than praise and weaker than collected revenue.

Do not collect subscription money, deposits, or sell access until the actual Qloo agreement allows the intended service. Once rights are clear, replace intent with observed payments and continued use. If hosts repeat but will not agree to a specific price, try a bounded service/package or a different buyer; do not count free usage as proven monetization.

## Technical, permission, and economic gates

Qloo's public terms allow bespoke Additional Terms and negotiated agreements. They prohibit resale/redistribution or charging third parties for access to Services and disclaim data accuracy. The intended SaaS permission must therefore be confirmed against the actual key agreement; the public page alone does not establish approval. Source: https://www.qloo.com/legal/terms

By the end of week one, prove actual key access, entity resolution, city coverage, supported candidate scoring, missing-field behavior, quota handling, and a public deployment. Pre-register a **40-case technical suite** including no-match interests, sparse member inputs, no feasible venue, conflicting constraints, veto-all, stale evidence, vendor timeout, rate limit, and replan. Ship only with **zero hard-constraint bypasses** and **at least 38/40 correctly completed or explicitly blocked cases**. Explicitly blocking unsupported constraints is successful behavior; silently treating them as verified is failure.

Before commercial graduation, record written permission and actual price for the intended application, storage/caching/display rules, access duration, quotas, and public demo users. Preserve identity separately from anonymous taste inputs. Capacity, dietary accommodation, accessibility, hours, and actual booking status need source/time evidence and appropriate host confirmation. A correlated taste signal does not verify these facts.

Measure requests per completed plan, requests per failed/replanned session, token use, hosting/storage, and support effort. Model cost per paid host using observed typical usage plus a heavier scenario; include support time and replacement of temporary credits. The provisional economic gate is **at least 70% projected contribution margin under the confirmed commercial quote at the tested price**, after variable support and vendor costs, with a hard spend cap. Label this forecast, not realized margin. If it fails, change the price/scope/buyer or stop; a free infrastructure tier cannot rescue unknown paid API economics.

## ≥9/10 graduation and kill rules

A future rating can reach ≥9 only after re-scoring the same weighted rubric from the evidence ledger, reaching **at least 90/100 weighted points**. Passing the targets does not automatically assign every category 9: explain why each score changed. Buyer/payment, Qloo incremental value, repeat use, technical reliability, and sustainable rights/economics must each score at least **8/10**; a serious unresolved permission or reliability issue blocks graduation regardless of the total.

For a credible bounded ≥9 assessment, require all of the following: the interview gate; the controlled ranking gate; the full-workflow and voluntary repeat gates; five exact-price paid-intent commitments; explicit commercial permission and acceptable forecast costs; a functioning public app; and an observable acquisition channel that recruits the tested hosts without unsustainable individual researcher labor. Build a defensibility case from first-party, consented host workflow/venue/outcome data and trusted distribution. Do not call an algorithm or open-source UI a moat.

Pivot to an organizer-owned venue-pool copilot if public discovery coverage is weak but hosts already maintain reliable inventory. Pivot buyer only after repeated evidence points to a budget owner with a more urgent use case. Kill the commercial thesis if Qloo adds no value, hosts do not voluntarily return, intake friction persists, permission is unavailable, or costs fail at a realistic tested price. Complete a useful hackathon artifact separately if desired; do not convert that accomplishment into unearned business evidence.

**Factual calendar footnote only:** the currently published hackathon cutoff is October 30, 2026, with judging November 2–16. The main plan intentionally follows the user's requested relative eight weeks. Source: https://qloo.devpost.com/rules
