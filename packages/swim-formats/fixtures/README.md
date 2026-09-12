# Swim format fixtures

Golden corpus for parser/integration testing. Families map to Hy-Tek export kinds.

## Meet Results (post-meet times)

| File | Purpose |
|------|---------|
| `ctcc-meet-results-2005.cl2` / `.zip` | Legacy Meet Manager CL2-only results (D0 times, no G0) |
| `azsi-results.cl2` / `azsi-results.hy3` | Modern Meet Manager results (D0 + G0) |

## Meet Entries / Roster (Team Manager packs)

| File | Purpose |
|------|---------|
| `ctcc-entries.cl2` / `.hy3` / `.zip` | Dual pack: CL2 + HY3 meet entries (E0/F0 relays) |
| `ctcc-roster.cl2` / `.hy3` / `.zip` | Swimmers Only + Rosters Only + nested entries ZIP |
| `mari-entries.cl2` / `mari-entries.hy3` | Modern Team Manager meet entries |
| `roster-swimmers.cl2` / `roster-only.hy3` | Roster-only exports |

## Meet Events (pre-meet event lists)

| File | Purpose |
|------|---------|
| `sonoran-events.ev3` | Bare EV3 |
| `charger-events.ev3` / `.hyv` / `.zip` | EV3+HYV with dive events (stroke F) |
| `croswhite-2025-events.*` / `croswhite-2026-events.*` | Swim/Dive invite EV3+HYV |
| `desert-sunrise-events.*` | Swim-only EV3+HYV |
| `azsi-events.ev3` / `.hyv` | Championship events with QTs |

## SDIF

| File | Purpose |
|------|---------|
| `AZAZSL_ext7716201449890453768.sd3` | TeamUnify SDIF meet entries |

### CL2 A0 file kinds

- `02Meet Results` — results (legacy D0 times or modern G0)
- `20Meet Entries` — entries + optional relays (E0/F0)
- `20Swimmers Only` — roster, not meet import
