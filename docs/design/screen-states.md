# Screen states inventory (P05)

Every core screen lists loading / empty / validation / access-expired / provider-error where relevant.  
**Frozen must-have set** for P06+ implementation.

Legend: ● required · ○ n/a for this screen

| Screen | Loading | Empty | Validation | Access expired | Provider error |
|---|---|---|---|---|---|
| S00 Landing | ● demo assets | ● no live trial capacity | ○ | ○ | ● live unavailable; example still works |
| S01 Create | ● | ○ | ● title, size 4–8, datetime+tz | ○ | ○ |
| S02 Brief | ● save | ● new event defaults | ● budget currency, radius, hard needs | ● host session | ○ |
| S03 Waiting | ● invite mint | ● 0 claimed | ● slot count | ● host session | ○ |
| S04 Claim | ● exchanging token | ○ | ● malformed token | ● used/expired/rotated link | ○ |
| S05 Preferences | ● search | ● 0 seeds (allowed) | ● ≤3 seeds; disambiguation required | ● participant session | ● Qloo search down → unresolved text kept, no fake UUID |
| S06 Planning | ● stage labels | ○ | ○ | ● | ● fail closed; resume if version valid |
| S07 Shortlist | ● | ● 0 feasible → change constraint | ○ | ● | ● never label fallback as Qloo |
| S08 Veto | ● | ○ | ● reason category required | ● | ○ |
| S09 Revision | ● | ● no prior revision | ○ | ● | ○ |
| S10 Approval | ● | ● missing acceptances | ● stale revision → 409 | ● host only | ○ |
| S11 Export | ● | ● not approved → tentative only | ● bad tz blocks ICS | ● | ○ |
| S12 Feedback | ● | ● skip allowed | ● length limits | ● | ○ |
| S13 Delete | ● | ○ | ● confirm phrase for host delete | ● | ○ |

## Role privacy matrix

| Data | Host sees | Participant sees |
|---|---|---|
| Private cultural seeds | **Never** | Own only |
| Individual rank matrix | **Never** | Own compatibility view only |
| Aggregate hard-need flags | Yes ("1 access need needs confirmation") | Own need + public unknowns on cards |
| Veto identity / reason | Aggregate only ("1 objection") | Own |
| Affinity scores | Not as % enjoyment | Not as % enjoyment |
| Export booking status | Always "unconfirmed / you reserve" | n/a |

## Participant capabilities (AC02)

- **Skip profiling:** S05 primary secondary action; can continue with hard needs only → `tasteMode: mixed`.
- **Correct a seed:** remove slot → search again → save; never silent UUID accept.
- **Veto:** S08 categories: taste | cost | distance | schedule | practical | prefer_not_to_say.
- **Delete:** S13 removes own inputs, revokes session, invalidates derived revisions.

## Wire: shortlist card states

```text
┌──────────────────────────────────────────┐
│ 2 · Discovery              [synthetic]   │
│ Venue Name                               │
│ East Village · $$ · noodles              │
│ Fit: …factual, sourced…                  │
│ Unknown: step-free access                │
│ Source: official site (observed date)    │
│                                          │
│  ! Affinity is a ranking signal,         │
│    not a chance you'll enjoy dinner.     │
└──────────────────────────────────────────┘
```

## Accessibility checklist (implementation contract)

- [ ] Visible focus rings on all controls
- [ ] Keyboard-complete host + member happy paths
- [ ] Touch targets ≥44px on member flow
- [ ] `prefers-reduced-motion` disables Plan strip animation
- [ ] Errors announced (`aria-live`) without explaining private peer data
- [ ] 360px and 1280px layouts; 200% zoom keeps primary CTA visible
- [ ] Contrast: ink on limestone ≥ 4.5:1; copper on limestone checked for large text/CTA
