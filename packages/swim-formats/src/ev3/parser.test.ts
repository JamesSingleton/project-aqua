import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import type { ParsedEvent } from "../types.ts";
import { parseEv3, parseHyv } from "./parser.ts";

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

    assert.equal(meet.name, "2025 Sonoran Desert Invitational");
    assert.equal(meet.events.length, 22);
    assert.equal(meet.location, "Copper Sky Aquatic Center");
    assert.equal(meet.address, "44345 M.L.K Jr. Blvd, Maricopa, AZ 85138, USA");
    assert.equal(meet.entryDeadline, "2025-10-15");
    assert.deepEqual(meet.entryLimits, {
      maxIndividualEntries: 2,
      maxRelayEntries: 3,
      maxCombinedEntries: 4,
    });
    assert.equal(meet.events[0]?.ageGroup, undefined);

    const e1 = byEventNumber(meet.events, 1);
    assert.deepEqual(
      {
        gender: e1?.gender,
        distance: e1?.distance,
        stroke: e1?.stroke,
        eventKey: e1?.eventKey,
      },
      {
        gender: "female",
        distance: 200,
        stroke: "medley_relay",
        eventKey: "200_medley_relay_scy_f",
      },
    );

    const e2 = byEventNumber(meet.events, 2);
    assert.deepEqual(
      {
        gender: e2?.gender,
        distance: e2?.distance,
        stroke: e2?.stroke,
      },
      { gender: "male", distance: 200, stroke: "medley_relay" },
    );

    const e3 = byEventNumber(meet.events, 3);
    assert.deepEqual(
      {
        gender: e3?.gender,
        distance: e3?.distance,
        stroke: e3?.stroke,
      },
      { gender: "female", distance: 200, stroke: "free" },
    );

    const e15 = byEventNumber(meet.events, 15);
    assert.deepEqual(
      {
        gender: e15?.gender,
        distance: e15?.distance,
        stroke: e15?.stroke,
      },
      { gender: "female", distance: 200, stroke: "free_relay" },
    );

    const e21 = byEventNumber(meet.events, 21);
    assert.deepEqual(
      {
        gender: e21?.gender,
        distance: e21?.distance,
        stroke: e21?.stroke,
      },
      { gender: "female", distance: 400, stroke: "free_relay" },
    );

    // Alternating girls/boys across all 22 events
    for (let i = 0; i < meet.events.length; i++) {
      const expected = i % 2 === 0 ? "female" : "male";
      assert.equal(meet.events[i]?.gender, expected, `event ${i + 1} gender`);
      const suffix = expected === "female" ? "_f" : "_m";
      assert.ok(
        meet.events[i]?.eventKey.endsWith(suffix),
        `event ${i + 1} eventKey ends with ${suffix}`,
      );
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
    assert.equal(e1?.gender, "female");
    assert.equal(e2?.gender, "male");
    assert.ok(e1?.eventKey.endsWith("_f"));
    assert.ok(e2?.eventKey.endsWith("_m"));
    assert.equal(e1?.stroke, "im");
    assert.equal(e1?.ageGroup, "13-14");
    assert.equal(meet.course, "SCY");
    assert.equal(meet.startDate, "2025-02-21");
    assert.equal(meet.endDate, "2025-02-23");
    assert.match(meet.location ?? "", /Kerry Croswhite/);
    assert.equal(e1?.roundType, "finals");
  });

  it("parses AZSI primary qualifying times", () => {
    const content = readFileSync(join(fixturesDir, "azsi-events.hyv"), "utf8");
    const meet = parseHyv(content);
    const e1 = meet.events.find((e) => e.eventNumber === 1);
    // 4:58.19 → 298190 ms
    assert.equal(e1?.qualifyingTimeMs, 4 * 60_000 + 58_190);
  });

  it("parses Charger invitational QT from second HYV slot", () => {
    const content = readFileSync(
      join(fixturesDir, "charger-events.hyv"),
      "utf8",
    );
    const meet = parseHyv(content);
    const e13 = byEventNumber(meet.events, 13);
    const e7 = byEventNumber(meet.events, 7);
    assert.equal(e13?.qualifyingTimeMs, 6 * 60_000 + 30_000);
    assert.equal(e7?.qualifyingTimeMs, undefined);
  });

  it("skips diving stroke code 6", () => {
    const content = readFileSync(
      join(fixturesDir, "charger-events.hyv"),
      "utf8",
    );
    const meet = parseHyv(content);
    assert.equal(meet.skippedDiveEvents, 2);
    assert.equal(byEventNumber(meet.events, 23), undefined);
    assert.equal(byEventNumber(meet.events, 24), undefined);
  });
});

describe("parseEv3 qualifying times", () => {
  it("parses AZSI primary QT from EV3 slots [19]/[20]", () => {
    const content = readFileSync(join(fixturesDir, "azsi-events.ev3"), "utf8");
    const meet = parseEv3(content);
    const e1 = meet.events.find((e) => e.eventNumber === 1);
    assert.equal(e1?.qualifyingTimeMs, 4 * 60_000 + 58_190);
  });

  it("parses Charger 500 free QT and leaves open events empty", () => {
    const content = readFileSync(
      join(fixturesDir, "charger-events.ev3"),
      "utf8",
    );
    const meet = parseEv3(content);
    assert.equal(meet.entryDeadline, "2025-10-15");
    const e13 = byEventNumber(meet.events, 13);
    const e14 = byEventNumber(meet.events, 14);
    const e7 = byEventNumber(meet.events, 7);
    assert.equal(e13?.qualifyingTimeMs, 6 * 60_000 + 30_000);
    assert.equal(e14?.qualifyingTimeMs, 6 * 60_000 + 10_000);
    assert.equal(e7?.qualifyingTimeMs, undefined);
  });

  it("skips diving events instead of mapping them to freestyle", () => {
    const content = readFileSync(
      join(fixturesDir, "charger-events.ev3"),
      "utf8",
    );
    const meet = parseEv3(content);
    assert.equal(meet.skippedDiveEvents, 2);
    assert.equal(meet.events.length, 22);
    assert.equal(byEventNumber(meet.events, 23), undefined);
    assert.equal(byEventNumber(meet.events, 24), undefined);
  });

  it("leaves Sonoran invitational events without QTs", () => {
    const content = readFileSync(
      join(fixturesDir, "sonoran-events.ev3"),
      "utf8",
    );
    const meet = parseEv3(content);
    assert.ok(meet.events.every((e) => e.qualifyingTimeMs == null));
    assert.equal(meet.skippedDiveEvents, undefined);
  });
});
