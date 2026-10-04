# P04 intake forms

Use pseudonyms `M1…M8` in shared files. Put real names only in gitignored `roster-private.json` if you must.

---

## Member intake (one per person)

```
Member ID: M_
Outing ID: CG-P04-001
Consent: I am 18+ and opt in to this planning experiment. My cultural seeds stay private from the group. [Y/N]
Date submitted:

--- Cultural seeds (optional, ≤3) ---
For each: name + type (artist / film / book / place) + disambiguation note if needed
1.
2.
3.
Skipped cultural seeds: [Y/N]

--- Practical (answer even if seeds skipped) ---
Max spend per person USD (tax/tip/drinks?):
Neighborhoods OK:
Neighborhoods NO:
Hard diet needs (vegetarian / vegan / allergen — do not write medical history):
Atmosphere want (3 words max):
Hard veto cuisines/venues:
Accessibility needs (step-free etc.): [none / needs confirmation / describe]
Other hard constraint:

--- Willingness to continue ---
OK to rate shortlists later this week: [Y/N]
```

---

## Explicit-preference tags (founder encodes after intake)

Map free text into tags for Arm E only:

| Tag | Values |
|---|---|
| `budget_max` | integer USD or unknown |
| `veg` | none / vegetarian / vegan |
| `borough_pref` | manhattan / brooklyn / either |
| `vibe` | casual / lively / quiet / classic / adventurous |
| `exclude_ids` | venue ids hard-excluded |
| `require_tags` | e.g. `vegetarian_menu_supported` |

Encoding rules:

- Unknown budget → do not treat price_band as pass/fail.
- Vegetarian hard need → venues without supported vegetarian evidence are `needs_confirmation` or fail if host marks hard.
- Odeon (V05) fails if group_size > 6.
- Clinton St (V07) fails Sunday dinner.
- Closed Xi'an Greenpoint address never enters the live slate.

---

## Arm E scoring (manual spreadsheet OK)

For each member × feasible venue:

1. Start score 0.
2. +3 if price_band within budget_max (when both known).
3. +3 if veg requirement matched with supported evidence; −99 if hard fail.
4. +2 if neighborhood matches pref.
5. +1 if vibe keywords overlap category/notes.
6. −5 if in exclude list.

Convert scores to ordinal ranks per member (1 = best). Apply fairness policy in `concierge-protocol.md` §3.
