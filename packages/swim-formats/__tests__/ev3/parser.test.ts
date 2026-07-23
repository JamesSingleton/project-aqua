import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseEv3, parseHyv } from "../../src/ev3/parser";
import type { ParsedEvent } from "../../src/types";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function byEventNumber(events: ParsedEvent[], n: number) {
  return events.find((e) => e.eventNumber === n);
}

describe("parseEv3", () => {
  it("parses Sonoran gender, strokes, and relays correctly", () => {
    const content = readFileSync(
      join(fixturesDir, "sonoran-events.ev3"),
      "utf8",
    );
    const meet = parseEv3(content);

    expect(meet.name).toBe("2025 Sonoran Desert Invitational");
    expect(meet.events.length).toBe(22);
    expect(meet.location).toBe("Copper Sky Aquatic Center");
    expect(meet.address).toBe("44345 M.L.K Jr. Blvd, Maricopa, AZ 85138, USA");
    expect(meet.entryDeadline).toBe("2025-10-15");
    expect(meet.entryLimits).toEqual({
      maxIndividualEntries: 2,
      maxRelayEntries: 3,
      maxCombinedEntries: 4,
    });
    expect(meet.events[0]?.ageGroup).toBe(undefined);

    const e1 = byEventNumber(meet.events, 1);
    expect({
      gender: e1?.gender,
      distance: e1?.distance,
      stroke: e1?.stroke,
      eventKey: e1?.eventKey,
    }).toEqual({
      gender: "female",
      distance: 200,
      stroke: "medley_relay",
      eventKey: "200_medley_relay_scy_f",
    });

    const e2 = byEventNumber(meet.events, 2);
    expect({
      gender: e2?.gender,
      distance: e2?.distance,
      stroke: e2?.stroke,
    }).toEqual({ gender: "male", distance: 200, stroke: "medley_relay" });

    const e3 = byEventNumber(meet.events, 3);
    expect({
      gender: e3?.gender,
      distance: e3?.distance,
      stroke: e3?.stroke,
    }).toEqual({ gender: "female", distance: 200, stroke: "free" });

    const e15 = byEventNumber(meet.events, 15);
    expect({
      gender: e15?.gender,
      distance: e15?.distance,
      stroke: e15?.stroke,
    }).toEqual({ gender: "female", distance: 200, stroke: "free_relay" });

    const e21 = byEventNumber(meet.events, 21);
    expect({
      gender: e21?.gender,
      distance: e21?.distance,
      stroke: e21?.stroke,
    }).toEqual({ gender: "female", distance: 400, stroke: "free_relay" });

    // Alternating girls/boys across all 22 events
    for (let i = 0; i < meet.events.length; i++) {
      const expected = i % 2 === 0 ? "female" : "male";
      expect(meet.events[i]?.gender, `event ${i + 1} gender`).toBe(expected);
      const suffix = expected === "female" ? "_f" : "_m";
      expect(
        meet.events[i]?.eventKey.endsWith(suffix),
        `event ${i + 1} eventKey ends with ${suffix}`,
      ).toBeTruthy();
    }
  });
});

describe("parseHyv", () => {
  it("reads gender from F/M field, not round", () => {
    const content = readFileSync(join(fixturesDir, "azsi-events.hyv"), "utf8");
    const meet = parseHyv(content);

    // 1A: F;F;I → female; 2A: F;M;I → male (parts[1]=round F, parts[2]=gender)
    const e1 = meet.events.find((e) => e.eventNumber === 1);
    const e2 = meet.events.find((e) => e.eventNumber === 2);
    expect(e1?.gender).toBe("female");
    expect(e2?.gender).toBe("male");
    expect(e1?.eventKey.endsWith("_f")).toBeTruthy();
    expect(e2?.eventKey.endsWith("_m")).toBeTruthy();
    expect(e1?.stroke).toBe("im");
    expect(e1?.ageGroup).toBe("13-14");
    expect(meet.course).toBe("SCY");
    expect(meet.startDate).toBe("2025-02-21");
    expect(meet.endDate).toBe("2025-02-23");
    expect(meet.location ?? "").toMatch(/Kerry Croswhite/);
    expect(e1?.roundType).toBe("finals");
  });

  it("parses AZSI primary qualifying times", () => {
    const content = readFileSync(join(fixturesDir, "azsi-events.hyv"), "utf8");
    const meet = parseHyv(content);
    const e1 = meet.events.find((e) => e.eventNumber === 1);
    // 4:58.19 → 298190 ms
    expect(e1?.qualifyingTimeMs).toBe(4 * 60_000 + 58_190);
  });

  it("parses Charger invitational QT from second HYV slot", () => {
    const content = readFileSync(
      join(fixturesDir, "charger-events.hyv"),
      "utf8",
    );
    const meet = parseHyv(content);
    const e13 = byEventNumber(meet.events, 13);
    const e7 = byEventNumber(meet.events, 7);
    expect(e13?.qualifyingTimeMs).toBe(6 * 60_000 + 30_000);
    expect(e7?.qualifyingTimeMs).toBe(undefined);
  });

  it("skips diving stroke code 6", () => {
    const content = readFileSync(
      join(fixturesDir, "charger-events.hyv"),
      "utf8",
    );
    const meet = parseHyv(content);
    expect(meet.skippedDiveEvents).toBe(2);
    expect(byEventNumber(meet.events, 23)).toBe(undefined);
    expect(byEventNumber(meet.events, 24)).toBe(undefined);
  });
});

describe("parseEv3 qualifying times", () => {
  it("parses AZSI primary QT from EV3 slots [19]/[20]", () => {
    const content = readFileSync(join(fixturesDir, "azsi-events.ev3"), "utf8");
    const meet = parseEv3(content);
    const e1 = meet.events.find((e) => e.eventNumber === 1);
    expect(e1?.qualifyingTimeMs).toBe(4 * 60_000 + 58_190);
  });

  it("parses Charger 500 free QT and leaves open events empty", () => {
    const content = readFileSync(
      join(fixturesDir, "charger-events.ev3"),
      "utf8",
    );
    const meet = parseEv3(content);
    expect(meet.entryDeadline).toBe("2025-10-15");
    const e13 = byEventNumber(meet.events, 13);
    const e14 = byEventNumber(meet.events, 14);
    const e7 = byEventNumber(meet.events, 7);
    expect(e13?.qualifyingTimeMs).toBe(6 * 60_000 + 30_000);
    expect(e14?.qualifyingTimeMs).toBe(6 * 60_000 + 10_000);
    expect(e7?.qualifyingTimeMs).toBe(undefined);
  });

  it("skips diving events instead of mapping them to freestyle", () => {
    const content = readFileSync(
      join(fixturesDir, "charger-events.ev3"),
      "utf8",
    );
    const meet = parseEv3(content);
    expect(meet.skippedDiveEvents).toBe(2);
    expect(meet.events.length).toBe(22);
    expect(byEventNumber(meet.events, 23)).toBe(undefined);
    expect(byEventNumber(meet.events, 24)).toBe(undefined);
  });

  it("leaves Sonoran invitational events without QTs", () => {
    const content = readFileSync(
      join(fixturesDir, "sonoran-events.ev3"),
      "utf8",
    );
    const meet = parseEv3(content);
    expect(meet.events.every((e) => e.qualifyingTimeMs == null)).toBeTruthy();
    expect(meet.skippedDiveEvents).toBe(undefined);
  });
});

describe("parseEv3 edge cases", () => {
  it("handles empty files, partial limits, and LCM headers", () => {
    expect(parseEv3("").events).toEqual([]);
    const header = Array(21).fill("");
    header[0] = "Meet";
    header[1] = "Loc";
    header[2] = "1/1/2025";
    header[3] = "1/2/2025";
    header[4] = "Y";
    header[18] = "3";
    header[20] = "2";
    const partial = parseEv3(`${header.join(";")}\n1;F;F;I;0;18;0;99;50;1;`);
    expect(partial.entryLimits).toEqual({
      maxCombinedEntries: 3,
      maxIndividualEntries: undefined,
      maxRelayEntries: 2,
    });
    expect(partial.events[0]?.ageGroup).toBeUndefined();

    header[5] = "LCM";
    expect(parseEv3(`${header.join(";")}\n1;F;F;I;0;0;0;0;50;1;`).course).toBe("LCM");
  });

  it("formats single-sided EV3 age groups", () => {
    const header = Array(21).fill("");
    header[0] = "Meet";
    header[2] = "1/1/2025";
    header[5] = "Y";
    const onlyLow = parseEv3(`${header.join(";")}\n1;F;F;I;0;G;15;;50;1;`);
    expect(onlyLow.events[0]?.ageGroup).toBe("15");
  });

  it("covers SCM course, skip paths, and header/event defaults", () => {
    const header = Array(6).fill("");
    header[0] = "";
    header[5] = "M";
    const scm = parseEv3(
      [
        header.join(";"),
        "no-semicolons",
        "1;2;3",
        "NaN;F;F;I;0;G;0;18;50;1;;;;;;;",
        ";F;F;I;0;G;0;18;50;1;;;;;;;",
        "1;F;F;I;0;G;;18;50;1;;;;;;;",
        "2;F;F;;;;;;;;;",
        `3;F;F;I;0;G;10;12;100;FR${";".repeat(10)}1:05.00`,
        `4;F;F;I;0;G;10;12;100;FR${";".repeat(10)}0.00`,
      ].join("\n"),
    );
    expect(scm.name).toBe("Imported Events");
    expect(scm.course).toBe("SCM");
    expect(scm.startDate).toBeUndefined();
    expect(scm.events.some((e) => e.eventNumber === 1 && e.ageGroup === undefined)).toBe(
      true,
    );
    expect(scm.events.find((e) => e.eventNumber === 2)?.stroke).toBe("free");
    expect(scm.events.find((e) => e.eventNumber === 3)?.qualifyingTimeMs).toBe(
      65_000,
    );
    expect(scm.events.find((e) => e.eventNumber === 4)?.qualifyingTimeMs).toBeUndefined();

    const lOnly = Array(6).fill("");
    lOnly[0] = "L Meet";
    lOnly[5] = "L";
    expect(parseEv3(`${lOnly.join(";")}\n1;F;F;I;0;G;0;18;50;1;;;;;;;`).course).toBe(
      "LCM",
    );

    const scyWithM = Array(6).fill("");
    scyWithM[0] = "Y Meet";
    scyWithM[5] = "MY";
    expect(parseEv3(`${scyWithM.join(";")}\n1;F;F;I;0;G;0;18;50;1;;;;;;;`).course).toBe(
      "SCY",
    );
  });
});

describe("parseHyv edge cases", () => {
  it("maps swimoff, time trial, and single-sided age groups", () => {
    const meet = parseHyv(
      "Meet;1/1/2025;1/2/2025;;S;Pool\n1A;S;F;I;0;0;0;0;50;1\n2A;X;M;I;15;0;0;0;100;2",
    );
    expect(meet.events[0]?.roundType).toBe("swimoff");
    expect(meet.events[1]?.roundType).toBe("time_trial");
    expect(meet.events[1]?.ageGroup).toBe("15-0");
    expect(meet.course).toBe("SCM");
  });

  it("covers empty HYV, LCM/course defaults, and skip paths", () => {
    expect(parseHyv("").events).toEqual([]);

    const bare = parseHyv(
      "Meet\nshort\n;F;F;I;0;18;50;1\n3A;;F;;;;;;\n4A;P;F;R;8;10;200;E;1:10.00\n5A;F;;I;0;18;50;1",
    );
    expect(bare.name).toBe("Meet");
    expect(bare.course).toBe("SCY");
    expect(bare.location).toBeUndefined();
    expect(bare.startDate).toBeUndefined();
    expect(bare.events.find((e) => e.eventNumber === 3)?.roundType).toBe("finals");
    expect(bare.events.find((e) => e.eventNumber === 3)?.stroke).toBe("free");
    expect(bare.events.find((e) => e.eventNumber === 4)?.roundType).toBe("prelim");
    expect(bare.events.find((e) => e.eventNumber === 4)?.stroke).toBe("medley_relay");
    expect(bare.events.find((e) => e.eventNumber === 4)?.qualifyingTimeMs).toBe(
      70_000,
    );
    expect(bare.events.find((e) => e.eventNumber === 5)?.gender).toBe("male");

    const lcmBare = parseHyv(";;;;LCM\n1A;F;F;I;0;18;50;1");
    expect(lcmBare.course).toBe("LCM");

    const letterL = parseHyv("Meet;1/1/2025;1/1/2025;;L;Pool\n1A;F;M;I;0;18;50;1");
    expect(letterL.course).toBe("LCM");

    const letterM = parseHyv("Meet;1/1/2025;1/1/2025;;M;\n1A;F;M;I;;;50;1");
    expect(letterM.course).toBe("SCM");
    expect(letterM.location).toBeUndefined();

    const open109 = parseHyv("Meet;1/1/2025;1/1/2025;;Y;Pool\n1A;F;F;I;0;109;50;1");
    expect(open109.events[0]?.ageGroup).toBeUndefined();
  });
});
