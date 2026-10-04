# Common Ground — flows (P05)

**Status:** Frozen for implementation 2026-10-04 (provisional on P04 Path A; design does not wait on Qloo key).  
**Data mode for examples:** synthetic.  
**Audience:** host (laptop) + participants (mobile).

## Design thesis

The product object is the **shared plan**, not a chat thread. Cultural taste is private fuel; the host sees compromises and unknowns, never raw seeds.

**Visual direction (tokens):** cool limestone paper `#E8ECF0`, ink `#14181C`, venue copper accent `#B85C38` used sparingly on CTAs only, moss confirm `#2F5D50`. Display: **Fraunces**. Body: **Source Serif 4**. UI/meta: **IBM Plex Sans**. Signature: a single full-width **Plan strip** that updates stage labels (`Collecting → Shortlist → Approved`) without dashboard chrome.

*(Avoided generic purple SaaS and cream+terracotta template pairing by using cool paper + copper only on actions.)*

---

## End-to-end loop

```text
Host create → Invite links → Member input (or skip) → Waiting
    → Plan run → Shortlist (3) → Optional private veto → Revision
    → Acceptances → Host approve → Export (copy/ICS) → Feedback / Delete
```

Hard requirements filter **before** taste ranking. Unknown fact ≠ passed. Approval ≠ booking.

---

## Host path (desktop ~1280px)

```text
┌─────────────────────────────────────────────────────────────┐
│ COMMON GROUND                              [Example] [Live] │
│                                                             │
│  Plan strip: Draft · Collecting · Shortlist · Approved      │
├───────────────────────────────┬─────────────────────────────┤
│ Brief                         │ Participants 3/6 claimed    │
│ Title / when / where / $      │ [Copy invite]               │
│ Hard needs                    │                             │
│ [Save brief]                  │ Waiting for inputs…         │
└───────────────────────────────┴─────────────────────────────┘
         │ host starts run (idempotent)
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Shortlist — 3 distinct options                              │
│ [Compromise] [Discovery] [Familiar*]   *only if prior visit │
│ Each: facts · unknowns · sources · no affinity %            │
│ [Request revision]              [Approve current revision]  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ Export: plain text + ICS · "You still reserve the table"
```

## Participant path (mobile ~360px)

```text
┌──────────────────────┐
│ You're invited       │
│ [Join outing]        │
└──────────┬───────────┘
           ▼ claim once → session cookie
┌──────────────────────┐
│ Your tastes (private)│
│ Search ≤3 seeds      │
│ [Skip for now]       │
│ Hard needs form      │
│ [Save]               │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Your view of plan    │
│ Personal fit notes   │
│ [Doesn't work for me]│
│ [I'm in — accept]    │
│ [Delete my inputs]   │
└──────────────────────┘
```

## Screen inventory (must-have)

| ID | Screen | Primary actor |
|---|---|---|
| S00 | Landing / demo | public |
| S01 | Host create | host |
| S02 | Host brief edit | host |
| S03 | Invite / waiting room | host |
| S04 | Claim / join | participant |
| S05 | Member preferences | participant |
| S06 | Planning progress | host (+ participant read-only) |
| S07 | Shortlist | both (role-filtered) |
| S08 | Veto reason (private) | participant |
| S09 | Revision diff | both |
| S10 | Approval checklist | host |
| S11 | Export | host |
| S12 | Feedback | both |
| S13 | Delete / leave | participant or host |

## State machine (user-visible)

`draft → collecting → ready_to_plan → planning → shortlisted → (needs_input) → approved → deleted`  
Material change (member, constraint, venue fact, slate) → invalidate approval and acceptances.

## ASCII mockups note

All names/venues in mockups are **synthetic**. Live Qloo labels appear only when `mode: live` and a key exists; otherwise show **Guided example** or **Provider unavailable**.
