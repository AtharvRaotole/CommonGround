# Production smoke record

| Field | Record |
|---|---|
| URL | https://common-ground.issue-atharva.workers.dev |
| Date | 2026-10-06 |
| Notes | Qloo key installed as Worker secret; 23 confirmed venue rows / 22 distinct Qloo IDs; GitHub public |

| Check | Result |
|---|---|
| `/api/health` | 200 `ok:true` · revision wired via `GIT_SHA` |
| `/` `/demo` `/example` `/privacy` `/host/new` | 200 |
| Live `/search` (server-side key) | 200 |
| Remote D1 confirmed venues | 23 rows · 22 distinct Qloo entity IDs (Xi'an Second Ave + N 8th share) |
