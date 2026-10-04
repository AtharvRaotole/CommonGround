# Constraint decision table (P13)

| Kind | Required unknown | Confirmed mismatch | Notes |
|---|---|---|---|
| budget | needs_confirmation | infeasible (exact cents) | price_band alone ≠ exact cost; all-in `unknown` blocks |
| radius | needs_confirmation | infeasible outside | straight-line meters only |
| time | needs_confirmation | infeasible | expired hours → needs_confirmation |
| access | needs_confirmation | infeasible | field/expected match |
| dietary | needs_confirmation | schema reject if allergy claim | tags never prove allergy safety |
| category | needs_confirmation if missing | infeasible mismatch | |
| veto | n/a | infeasible | always required; removes venue from slate |
