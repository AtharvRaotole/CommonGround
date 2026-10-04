# P04 founder runbook (next 15 minutes)

You own recruitment. Everything else is ready.

## Now (5 min)

1. Pick a real outing in the next 3–14 days with 4–8 people.
2. Open `docs/pilots/recruitment.md` → Path A message.
3. Fill `[DAY/DATE]` and send in your group chat.
4. Fill host brief (same file) into `concierge-results-private.json` → `outing.host_brief`, including **your baseline top 3** before anyone ranks.
5. Set `recruitment.invite_sent_at` and `path_A_invited`.

## As replies arrive (10 min total)

1. Assign `M1…Mn`; paste intakes into results `members` (titles of seeds OK; no medical essays).
2. Tick abandonment: invited but silent after 24h → `path_A_abandoned++`.
3. Ping me (or continue solo): freeze inputs, filter hard requirements using the slate, build Arm E ranks per `intake.md`, emit blind cards from `neutral-cards.md`.
4. Collect 1–5 WTA scores; host picks Method X or Y blind; then reveal.
5. Update `docs/verification/p04/AC01.md` and close Decision 002 Chosen option (narrow/continue/stop). Leave AC02 blocked until the Qloo key.

## When the Qloo key lands

```sh
export QLOO_API_KEY='…'   # gitignored .env only
npx --yes tsx spikes/qloo-contract.ts --live
```

Replay Arm Q on the **frozen** slate + seeds. Append diffs and a short preference vs Arm E. Do not rewrite prior H/E answers.

## Do not

- Invent member ratings
- Call synthetic affinities "Qloo"
- Mark P04 complete before AC01 feedback exists
- Claim Path A friends as ICP buyer interviews
