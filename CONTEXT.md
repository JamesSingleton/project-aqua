# Project Aqua

Visiting-team coach workspace: roster, meet entries, results, and progression for meets a team attends.

## Language

**Meet lineup snapshot**:
The visiting team's entered lineup for one meet, including individual entries, grouped relay teams, and going / eligibility / scratch status as data.
_Avoid_: export payload, entry list, projection

**Host pack**:
The Hy-Tek / SDIF files a coach sends to a meet host (HY3, CL2, SDIF). Built by filtering a meet lineup snapshot, not by rebuilding it.
_Avoid_: event file, EV3, HYV

**Paper report**:
The Team Manager–style individual meet entries document a coach reviews, plus a split sheet with blank write-in boxes for race splits. Both read the same meet lineup snapshot and do not drop not-going swimmers. Default omits relay alternates; coaches can include them. Split cadence (25/50/100) is a print-only override and is not saved.
_Avoid_: CSV, host pack, timing console

**Program view**:
Entries grouped by meet event number, individuals and relays together in the order of the meet.
_Avoid_: matrix, by-name board

**Association event cap**:
Max scoring (non-exhibition) names per individual event, and max relay teams (A/B/C) per relay event, from the team’s high-school association. Not the per-athlete EV3 entry limits, and not a governing-body lookup table.
_Avoid_: AIA table, CIF table, max entries per athlete
