# Quality, CI, and verification

**AC** means acceptance criteria: observable conditions required to accept a phase. **CI** means continuous integration: automated checks run on proposed software changes. Research and customer phases also have a manual evidence gate; passing a file-format check cannot prove customer demand.

This repository currently contains a plan. The commands below define the future product's verification contract and become runnable during phase 06. The only implemented check at planning time is `python3 plan/tools/verify_plan.py`, which validates the planning package itself. Do not report future product tests as passed.

## Evidence hierarchy

1. A successful real user workflow and independently rated outcome is product evidence.
2. Live provider tests establish access and response behavior for the tested account, location, and date.
3. Integration/browser tests establish behavior under their fixtures and environment.
4. Unit/property tests establish specific invariants; they do not establish recommendation usefulness.
5. Type checking, linting, and static scans find narrower classes of defects.
6. A written plan, screenshot, model-generated score, or synthetic trace does not establish a working live product.

Each phase closes with its AC IDs mapped to a command output, inspectable artifact, or signed-off human observation. Record the exact revision, environment, time, data mode, evaluator, result, and limitations. A screenshot without a setup description is not a reproducible test.

## CI profiles

| Profile | Planned command | When and secrets | Failure policy |
|---|---|---|---|
| C0: documentation | `python3 plan/tools/verify_plan.py` | Every planning change; no secrets | Missing phase field, broken local link, invalid dependency, schedule mismatch blocks merge |
| C1: static | `pnpm lint && pnpm typecheck && pnpm build` | Every product PR; no secrets | Any error blocks merge |
| C2: domain | `pnpm test:unit` | Every product PR; synthetic inputs | Constraint, budget, privacy DTO, state or ranking invariant failure blocks merge |
| C3: integration | `pnpm test:integration` | Every product PR; local D1 and mock providers | Authorization, migration, schema, idempotency failure blocks merge |
| C4: browser | `pnpm test:e2e` | Every merge candidate; local app, synthetic data | Broken core journey, inaccessible primary controls, stale approval blocks release |
| C5: release | `pnpm verify:release` | Release candidate; no live provider credentials by default | Missing license/setup, secret leakage, bundle check, migration or artifact failure blocks release |
| C6: live contract | `pnpm test:live:qloo` | Manually approved protected environment, bounded budget | Access/contract/coverage mismatch blocks claims dependent on that behavior |
| C7: performance | `pnpm test:performance` | Before pilot/release; deploy preview and synthetic load | Free-plan CPU failures, uncontrolled quota use, unbounded latency blocks release |
| C8: evaluation | `pnpm eval:report --manifest eval/manifest.json` | Explicitly run on consented private dataset | Protocol deviations or missing arms block comparative marketing claim |

The command names are deliverables, not magic existing tools. Phase 06 implements scripts that invoke chosen test runners; phase 24 implements the evaluation runner. Freeze the scripts before relying on their outputs. Use Vitest for pure/integration tests, Playwright for browser paths, and axe-core as one accessibility aid, with manual keyboard/screen-reader checks. Pin action commit SHAs or reviewed immutable versions, use minimal permissions, and never expose secrets to untrusted fork PRs.

## Required test inventory

| Test ID | Scenario and actual assertion | Level |
|---|---|---|
| AUTH-01 | Participant A requests participant B preferences by guessed ID; response contains no B data and uses generic unauthorized/not-found behavior | Integration |
| AUTH-02 | Host requests private seed fields through event DTO; fields are absent, including nested objects | Integration |
| AUTH-03 | Claim token consumed concurrently; exactly one session is issued | Integration |
| AUTH-04 | Rotated or expired invite and revoked cookie cannot mutate event | Integration |
| AUTH-05 | Wrong-origin write rejected; same-site authenticated write succeeds | Integration |
| DATA-01 | Deleting a participant invalidates derived revisions and removes own raw inputs and outstanding capabilities | Integration |
| DATA-02 | Expiry removes vendor-derived data at the permitted deadline; aggregate metadata excludes profiles | Integration |
| DATA-03 | Fixture/recording contains no key pattern, consented live input, or copied proprietary response | Static/manual |
| QLOO-01 | HTTP request uses current hackathon host, GET path and X-Api-Key; no key in URL or log | Unit/live |
| QLOO-02 | Unsupported application parameter is rejected before provider request | Unit |
| QLOO-03 | Filtered output contains only submitted candidate IDs; unexplained extras fail closed | Integration/live |
| QLOO-04 | 401/403 produces setup state with zero retries; 429 uses bounded retry policy | Integration |
| QLOO-05 | Empty result is no evidence, never a fabricated zero-affinity row | Unit/integration |
| QLOO-06 | Missing rank cells remain unknown and block unsupported all-member fit claims | Unit |
| RANK-01 | A hard-vetoed venue never appears in any valid slate | Property |
| RANK-02 | Permuting participant order does not change ranking under equal weights | Property |
| RANK-03 | Raw Qloo scores from separate queries are never averaged or interpreted as probability | Unit/code review |
| RANK-04 | Same ordered preferences under a monotonic score transform produce same output | Property |
| RANK-05 | Every participant is compared on the same candidate universe; candidate changes trigger full reranking | Unit |
| RANK-06 | All ties have a documented stable tie break independent of member identity | Unit |
| RANK-07 | A missing profiled response blocks the run; mixed mode shows profiled/total counts and requires every person’s explicit acceptance | Unit |
| FACT-01 | Required unknown, conflicting, or expired fact prevents ready status | Unit |
| FACT-02 | Dietary tag alone never confirms allergy suitability or medication compatibility | Unit/copy review |
| FACT-03 | Radius uses validated coordinates and is labeled straight-line, never route duration | Unit/browser |
| FLOW-01 | Changing a constraint after approval invalidates export-ready state | Integration/browser |
| FLOW-02 | A stale approval returns conflict; no state mutation occurs | Integration |
| FLOW-03 | Duplicate run request with same idempotency key returns same run and one budget reservation | Integration |
| FLOW-04 | Concurrent budget reservations never exceed global cap | Integration/property |
| FLOW-05 | Cancellation blocks future provider calls and records possible in-flight cost | Integration |
| FLOW-07 | Missing participant acceptance blocks ready approval; revision changes invalidate all acceptances | Integration/browser |
| FLOW-06 | Closing/reopening page resumes only a still-valid run; expired version cannot continue | Browser |
| LLM-01 | Model invents candidate ID; output rejected, deterministic output remains available | Integration |
| LLM-02 | Venue text contains “ignore rules”; no additional tools or secret-bearing action occurs | Integration |
| LLM-03 | Schema violation/refusal/incomplete response causes bounded repair or plain template fallback | Integration |
| AGENT-01 | Agent mode executes a real validated model-selected tool; model-off fallback is labeled guided planning and cannot show a fake agent trace | Integration/live |
| LLM-04 | Explanation lacks provenance for a factual clause; clause removed or output rejected | Integration/manual |
| EXPORT-01 | ICS CRLF and delimiter injection cannot create extra calendar properties/events | Unit |
| EXPORT-02 | Ambiguous/nonexistent DST time prompts user; valid event opens correctly in two calendar clients | Unit/manual |
| EXPORT-03 | Export labels reservation as unconfirmed; never claims a booking | Browser |
| UI-01 | Host and member complete flow by keyboard at desktop and mobile width | Manual/browser |
| UI-02 | Core pages work at 200% zoom; no hidden CTA or clipped validation | Manual/browser |
| UI-03 | Screen reader announces errors and run status without reading hidden private data | Manual |
| OPS-01 | Qloo or OpenAI unavailable yields honest recoverable status and no live success banner | Fault/browser |
| OPS-02 | Synthetic example is labeled on input, output and trace; contains no fake live timestamp | Browser |
| OPS-03 | All budgets exhausted: fail closed before new provider request; example remains available | Integration |

## Concrete domain-test examples

The following examples define intended behavior; they are not a claim that the proposed imports exist yet. The implementation phases create the named modules and tests.

```ts
// tests/unit/constraints.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateRequiredFact } from '../../worker/src/planning/constraints';
describe('required venue facts', () => {
  it('does not pass an unknown accessibility requirement', () => {
    expect(evaluateRequiredFact({required: true, state: 'unknown', matches: null}))
      .toEqual('needs_confirmation');
  });
  it('rejects a known mismatch', () => {
    expect(evaluateRequiredFact({required: true, state: 'confirmed', matches: false}))
      .toEqual('infeasible');
  });
});
```

`evaluateRequiredFact(input)` returns `pass | needs_confirmation | infeasible`; non-required unknowns do not block readiness but remain visible. Each code task follows a red/green cycle on the meaningful behavior, then integration where appropriate. Do not create snapshot tests that merely freeze accidental markup.

## Planned CI skeleton

Store an executable workflow during phase 06, after selecting reviewed action versions. Use `pull_request` and pushes to the main branch for C1–C4, with concurrency cancellation on superseded runs. Use a separate manually triggered protected job for C6. Do not use `pull_request_target` with untrusted checked-out code and secrets. Keep CI artifact retention short and ensure reports contain synthetic data. Standard hosted public-repository runners are the default; do not choose paid larger runners.

The deployment job runs only after relevant checks pass. Keep application deployment and database migration staged. Preview uses a distinct D1 database and keys from production. A rollback reverts the Worker version; schema rollback needs an explicit migration plan and backup/restore procedure. A successful HTTP health check is necessary but insufficient: run an end-to-end synthetic smoke after deployment.

## Performance budgets: targets, not observed results

Target input validation below 500ms excluding user network, first visible progress within 1s, and a typical completed live recommendation below 20s. Treat p95 below 30s as a provisional product target measured over at least 30 bounded staging runs; report sample size and provider effects. Do not claim statistical stability from that sample. Cloudflare Free CPU limits must be met per request, including JSON parsing and schema validation; wall-clock waiting does not make CPU free.

Abort a run at its configured 45s deadline and expose retry. If provider latency makes this unrealistic, increase the labeled user-facing budget only after measuring it and updating AC; do not silently keep a spinner alive. Slice provider stages to fit runtime limits. Reduce candidates/results and trim payloads before adding infrastructure. If the Free plan still fails, reduce scope or stop the public live path rather than quietly upgrade billing.

## Release signoff

Engineering signs C1–C7; product verifies the real core flow; data review checks consent/rights; the founder reviews the four judging criteria and all public claims. These may be the same person, but record the checks separately. A real user or independent reviewer should perform the final cold-start test because the builder knows shortcuts.

Store release evidence under `docs/verification/<release-id>/`: command outputs, redacted live contract summary, limitations, screenshots with data mode, tested commit SHA, measured costs, and rollback rehearsal result. Do not mark all phases complete based on a green CI badge.
