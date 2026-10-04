# P07 role / DTO access matrix

| Field | Host | Member (self) | Member (other) |
|---|---|---|---|
| Event title/state/version | yes | yes | yes (same event) |
| Own seeds | yes (own only) | yes | no |
| Other seeds | **never** | never | never |
| membersProfiled count | yes | yes | yes |
| Host recovery secret | once at create | never | never |
| Member claim secret | when minting invite | never after claim | never |

API never returns raw DB rows.
