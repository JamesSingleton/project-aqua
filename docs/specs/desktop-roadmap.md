# Lane4 Desktop roadmap

`apps/desktop` (`@lane4hq/desktop`) is a local-first Tauri app for macOS and Windows ([ADR 0001](../adr/0001-tauri-for-desktop.md)). It is Lane4's **meet manager**. Team management stays on the web in `apps/admin`, and the desktop app does not copy admin screens ([ADR 0002](../adr/0002-desktop-is-for-running-meets.md)).

## Milestone 1: Meet file inspector (shipped in the scaffold)

**Goal:** open any Hy-Tek / SDIF file and see exactly what Lane4 parses, fully offline. It is also the first practical way to validate admin's imports and exports against real Team Manager / Meet Manager files.

- Opening files:
  - native Open dialog and window drag-and-drop;
  - one ZIP pack, or companion files together (EV3 + CL2, HY3 + CL2);
  - Team Manager roster exports fall back to a roster view.
- Views:
  - meet summary (events, entries, results, relays, athletes, teams);
  - filterable tables for each.
- Parsing reuses `@lane4hq/swim-formats` unchanged (`parseMeetFilesFromBytes`, `parseRosterFileFromBytes`).

**Next steps inside this milestone**

- [ ] [#66](https://github.com/JamesSingleton/lane4-hq/issues/66): "Compare" mode. Open an original TM/MM file next to Lane4's own export of the same meet (from admin), and diff events, entries, and times. This checks export → re-import round-trips without a coach in the loop (related: [#56](https://github.com/JamesSingleton/lane4-hq/issues/56)).
- [ ] [#67](https://github.com/JamesSingleton/lane4-hq/issues/67): export from desktop (HY3, CL2, SD3, ZIP) using `@lane4hq/swim-formats/export`, so round-trips can be checked locally.
- [ ] [#75](https://github.com/JamesSingleton/lane4-hq/issues/75): signed installers and auto-update (see the companion spec, "Distribution").

## Milestone 2: Run a meet (documented, not yet built)

**Goal:** a meet director runs a meet from the desktop app, with or without internet at the pool: seeding, heat sheets, live results from the timing console, and results export. It works like Hy-Tek Meet Manager with Meet Mobile:

- the deck machine holds the meet and never needs a network to run it;
- results publish when a connection is available, either automatically after each heat or pushed manually once official.

Scope:

- Meet database (MMDB-style) for events, heats, lanes, and results, stored locally.
- Timing console integration with Colorado Time Systems consoles. See the [companion spec](desktop-companion-v1.spec.md) and [ADR 0003](../adr/0003-cts-timing-interface-split.md).
- Export to Hy-Tek formats.
- A small admin API, built on the team operations module ([ADR 0002](../adr/0002-desktop-is-for-running-meets.md) decisions 4 and 6):
  - download a meet onto the deck machine;
  - publish results.

  This is where the `/api/v1` adapter and bearer auth get built.
- How offline works (source of truth, check-out, publishing, conflicts) is decided in a follow-up ADR before building.
- Host-side entry merge (other clubs' entry packs) stays **out of scope** until explicitly picked up. See AGENTS.md.

## Milestone 3: Follow a meet (web first)

**Goal:** parents and visiting clubs follow a meet live without installing anything.

- A public live-results page shows psych sheets, heat sheets, and results as the deck machine publishes them.
- A native Meet Mobile–style app comes later, if push notifications ("your swimmer's heat is next") justify it.

## Not on the desktop

- Team management (roster, entries, results, workouts, calendar) lives in `apps/admin`. It should work well on phones and tablets and be installable as a PWA. It is not rebuilt in desktop or as a native mobile app until real demand shows up.

## Non-goals (for now)

- Linux builds. Tauri supports them; there's just no user need yet.
- Family or parent portal, dues, messaging.
