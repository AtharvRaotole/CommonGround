# Venue evidence policy (P08)

## Scope

Catchment: Manhattan south of 59th St + Brooklyn (Williamsburg / Prospect Heights / Park Slope corridor). Target catalog size: **20–30** venues.

## What a “fact” is

Each material claim is a row with:

- `field` (e.g. `address`, `hours`, `vegetarian_menu`, `step_free`, `max_party_reservation`)
- `value` (nullable)
- `state`: `confirmed` | `unknown` | `conflicting` | `expired`
- `source_url`, `source_kind`, `observed_at`, `expires_at`, `note`

**Unknown ≠ satisfied.** Required unknowns block ready status.

## Forbidden claims (never mark confirmed)

- Allergy / medical safety guarantees
- “Table is available / reserved”
- Exact all-in price including tax/tip/drinks unless an official current menu total is dated
- Accessibility as confirmed without a dated official statement or host confirmation record

## Freshness

| Field class | Default expiry |
|---|---|
| Address, name, category | 180 days |
| Hours, reservation policy | 30 days |
| Menu / vegetarian evidence | 60 days |
| Host confirmation | 14 days |

Before an outing, re-check time-sensitive required facts. Conflicting sources stay `conflicting` until resolved.

## Qloo identity mapping

- `qloo_mapping_status = unknown` by default until live resolve with a key.
- Only `confirmed` mappings with a non-null `qloo_entity_id` may enter a **live** Qloo slate.
- Branches and similarly named venues require manual disambiguation.

## Public vs private

- `fixtures/synthetic/venues.json` — synthetic, public, no proprietary Qloo payloads.
- `data/venues-private.json` — desk-checked real venues for pilots; may be committed without personal data; still not a rights grant to scrape.

## Rights

Display and storage of Qloo-derived fields remain blocked until P03 rights answers allow them. Official-site URLs as evidence links are fine.
