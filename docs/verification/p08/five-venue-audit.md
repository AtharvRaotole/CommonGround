# P08 five-venue source audit

Sampled 2026-10-04 from `data/venues-private.json`.

| ID | Name | Official URL checked | Material facts | Gaps |
|---|---|---|---|---|
| V01 | Joe's Pizza Carmine | joespizzanyc.com | name/address confirmed | seating unknown; step_free unknown |
| V03 | Momofuku Noodle Bar EV | momofuku.com | address + reservation FAQ | vegetarian coverage unknown |
| V04 | Superiority Burger | superiorityburger.com | vegetarian confirmed | walk-in confirmation needs_confirmation |
| V05 | The Odeon | theodeonrestaurant.com | max party 6 confirmed | step_free unknown |
| V08 | Lilia | lilianewyork.com | reservations via Resy | hours conflict across pages → treat hours unknown until re-check |

**Verdict:** No unsupported allergy/booking claims marked confirmed. Qloo mappings all `unknown` (key pending).
