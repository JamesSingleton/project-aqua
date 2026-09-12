import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyResultToBestTime } from "@project-aqua/swim-core/best-times";
import { parseTime } from "@project-aqua/swim-core/times";
import { describe, expect, it } from "vitest";
import { parseCl2Meet } from "../../src/cl2/parser";
import { parseEv3 } from "../../src/ev3/parser";
import { exportCl2, exportHy3 } from "../../src/export/meet";
import { parseHy3 } from "../../src/hy3/parser";
import type { ParsedMeet } from "../../src/types";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

/**
 * Primary visiting-team seam: import EV3 → meet roster (relay-only +
 * alternates) → lineup with auto seed times → export HY3/CL2 → import
 * results → best times.
 */
describe("primary meet pipeline seam", () => {
  const events = parseEv3(
    readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8"),
  );

  const individual = events.events.find(
    (e) => e.eventNumber === 3 && !e.stroke.includes("relay"),
  );
  const relay = events.events.find(
    (e) => e.eventNumber === 1 && e.stroke.includes("relay"),
  );

  const bestTimes = new Map<string, number>([
    ["Ada Lovelace|3", parseTime("2:15.00")],
  ]);

  const lineup: ParsedMeet = {
    name: events.name,
    startDate: events.startDate,
    course: events.course,
    location: events.location,
    events: events.events.filter((e) => e.eventKind !== "dive"),
    entries: [
      {
        eventNumber: individual?.eventNumber,
        swimmerName: "Ada Lovelace",
        seedTime: "2:15.00",
        dateOfBirth: "2012-03-01",
        gender: "female",
      },
    ],
    results: [],
    athletes: [
      {
        name: "Relay Only",
        dateOfBirth: "2011-06-15",
        gender: "female",
        relayOnly: true,
      },
    ],
    relays: [
      {
        eventNumber: relay?.eventNumber,
        relayLetter: "A",
        swimmerNames: [
          "Ada Lovelace",
          "Bea Two",
          "Cate Three",
          "Dee Four",
          "Eve Alt",
          "Fay Alt",
          "Gia Alt",
          "Relay Only",
        ],
      },
    ],
  };

  it("exports a host-importable HY3/CL2 pack from the EV3 lineup", () => {
    expect(events.events.length).toBeGreaterThan(0);
    expect(individual).toBeTruthy();
    expect(relay).toBeTruthy();

    const hy3 = exportHy3(lineup);
    const cl2 = exportCl2(lineup);
    const fromHy3 = parseHy3(hy3);
    const fromCl2 = parseCl2Meet(cl2);

    expect(fromHy3.entries.some((e) => e.swimmerName === "Ada Lovelace")).toBe(
      true,
    );
    expect(
      fromHy3.athletes?.some(
        (a) => a.name.includes("Relay Only") && a.relayOnly,
      ),
    ).toBe(true);
    expect(fromHy3.relays?.[0]?.swimmerNames).toHaveLength(8);
    expect(fromCl2.entries.length).toBeGreaterThan(0);
    expect(cl2).toContain("Relay");
  });

  it("updates per-team best times when results import faster than seed", () => {
    const resultMs = parseTime("2:10.00");
    const seedKey = "Ada Lovelace|3";
    const update = applyResultToBestTime(bestTimes.get(seedKey), resultMs);
    expect(update.isPersonalBest).toBe(true);
    expect(update.nextMs).toBe(resultMs);

    const slower = applyResultToBestTime(update.nextMs, parseTime("2:20.00"));
    expect(slower.isPersonalBest).toBe(false);
    expect(slower.nextMs).toBe(resultMs);
  });
});
