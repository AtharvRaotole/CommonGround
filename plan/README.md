# Common Ground — startup and hackathon plan

**A taste-aware planning agent for recurring local hosts.** Prepared 3 October 2026. Eight hypothetical weeks. Status: researched plan; no product or customer results claimed.

Start with the [decision brief](00-decision-brief.md). The selected customer is a paid local dinner/cultural-community host choosing external venues for an existing opt-in group of 4–8. Qloo supplies individual cultural rankings; the app checks practical constraints, handles private vetoes and prepares a host-approved handoff.

**Honest score:** 4.7/10 on the disclosed current-evidence rubric. At least 9/10 is a graduation target that requires actual demand, comparison, repeat-use and sustainable-permission evidence. The exact requested rate-my-startup skill was unavailable; the replacement rubric is explicitly labeled.

## Read the plan

- [Complete typeset PDF](../output/pdf/common-ground-master-plan.pdf)
- [Single consolidated Markdown copy](MASTER-PLAN.md)
- [32-phase execution index](phases/README.md)
- [Machine-readable phases and dependencies](phases.json)
- [Working research and verification templates](templates/README.md)
- [Source index](SOURCES.md)

## Chapters

- [Common Ground: the decision to test](00-decision-brief.md)
- [01 — Opportunity and competition](01-opportunity-and-competition.md)
- [Product specification](02-product-spec.md)
- [03 — Qloo integration and honest group compromise](03-qloo-and-ranking.md)
- [Architecture and data contracts](04-architecture-and-data.md)
- [05 — Free infrastructure, bounded usage and commercial conditions](05-free-tier-and-costs.md)
- [Common Ground: startup score and validation](06-startup-score-and-validation.md)
- [Quality, CI, and verification](07-quality-ci-and-verification.md)
- [Business, discovery, and go-to-market](08-business-and-go-to-market.md)
- [Eight-week roadmap and dependencies](09-roadmap-and-dependencies.md)
- [Demo, release, and operations](10-demo-release-and-operations.md)
- [Risks and decision log](11-risks-and-decision-log.md)
- [Research method and claim register](12-research-method-and-claim-register.md)

## Deliverable boundaries

The plan assigns 192 hours of work and 48 hours of contingency at 30 hours/week. Every phase includes dependencies, deliverables, work steps, measurable AC, CI/manual checks, evidence and a stop rule. Hosting/database/CI use verified free tiers; existing OpenAI usage remains metered, and Qloo free access/rights are conditional.

The actual event deadline is documented separately; the main schedule honors the requested two-month horizon. No registration, outreach, deployment, purchases or submission occurred.

## Verify this package

```sh
python3 plan/tools/verify_plan.py
```

This checks phase completeness, dependency order, links, hours and score arithmetic. It does not certify market demand, live API access or future product tests.

Edit the chapter/phase sources first, then regenerate reading copies. The combined document and PDF are derived deliverables.
