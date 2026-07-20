import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parseHy3 } from "./parser.ts";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

describe("parseHy3", () => {
  it("parses Sonoran entries with correct offsets and names", () => {
    const content = readFileSync(join(fixturesDir, "mari-entries.hy3"), "utf8");
    const meet = parseHy3(content);

    assert.equal(meet.name, "2025 Sonoran Desert Invitational");
    assert.equal(meet.location, "Copper Sky Aquatic Center");
    assert.equal(meet.course, "SCY");
    assert.equal(meet.startDate, "2025-10-25");
    assert.ok(meet.entries.length > 10);

    const marlie = meet.entries.find((e) => e.swimmerName.includes("Marlie"));
    assert.ok(marlie);
    assert.equal(marlie?.eventNumber, 11);
    assert.equal(marlie?.seedTime, "1:16.69");
    assert.equal(marlie?.exhibition, false);

    const event11 = meet.events.find((e) => e.eventNumber === 11);
    assert.equal(event11?.distance, 100);
    assert.equal(event11?.stroke, "free");
    assert.equal(event11?.gender, "female");
  });

  it("parses AZSI results with E2 times and places", () => {
    const content = readFileSync(join(fixturesDir, "azsi-results.hy3"), "utf8");
    const meet = parseHy3(content);

    assert.match(meet.name, /AZSI 2025 Short Course Regional/);
    assert.equal(meet.course, "SCY");
    assert.ok(meet.results.length > 5);

    const bailey = meet.results.find(
      (r) => r.swimmerName.includes("Bailey") && r.eventNumber === 17,
    );
    assert.ok(bailey);
    assert.equal(bailey?.time, "1:20.41");
    assert.equal(bailey?.place, 6);
    assert.equal(bailey?.resultType, "finals");
    assert.equal(bailey?.isDq, false);
  });

  it("detects exhibition from E1 column 84", () => {
    const content = [
      "A102Meet Entries             Hy-Tek, Ltd    Win-TM 8.0De  10112025  7:47 PMTEAM MANAGER Lite                                    50",
      "B1Test Meet                                   Test Pool                                    1025202510252025070120251100        08",
      "B2                                                                                                Y   0.00YO                    51",
      "C1TEST Test Team                    TST                                                             86",
      "D1M   28Hanse               Max                                                                    0SR                           17",
      "E1M   28HanseMM    50A 15 18  0U  0.00  6B   27.76S   27.76S    0.00    0.00  0NN  X            N                               60",
    ].join("\n");

    const meet = parseHy3(content);
    assert.equal(meet.entries.length, 1);
    assert.equal(meet.entries[0]?.exhibition, true);
    assert.equal(meet.entries[0]?.eventNumber, 6);
    assert.equal(meet.entries[0]?.swimmerName, "Max Hanse");
    assert.equal(meet.events[0]?.stroke, "free");
    assert.equal(meet.events[0]?.distance, 50);
  });
});
