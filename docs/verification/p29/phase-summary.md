# P29 phase summary

| AC | Result | Evidence |
|---|---|---|
| AC01 mandatory CI on release SHA | run `pnpm verify:ci` on ship commit | release bundle |
| AC02 live functionality under permissions | **partial** — synthetic OK; live Qloo blocked on key | cold-start notes |
| AC03 rollback recovers known event | **procedure pass / restore incomplete** | rollback.md · rehearsal log |
