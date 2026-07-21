import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseHy3 } from "../../src/hy3/parser";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function padHy3(line: string, len = 130): string {
  return line.padEnd(len, " ");
}

describe("parseHy3", () => {
  it("parses Sonoran entries with correct offsets and names", () => {
    const content = readFileSync(join(fixturesDir, "mari-entries.hy3"), "utf8");
    const meet = parseHy3(content);

    expect(meet.name).toBe("2025 Sonoran Desert Invitational");
    expect(meet.location).toBe("Copper Sky Aquatic Center");
    expect(meet.course).toBe("SCY");
    expect(meet.startDate).toBe("2025-10-25");
    expect(meet.entries.length > 10).toBeTruthy();

    const marlie = meet.entries.find((e) => e.swimmerName.includes("Marlie"));
    expect(marlie).toBeTruthy();
    expect(marlie?.eventNumber).toBe(11);
    expect(marlie?.seedTime).toBe("1:16.69");
    expect(marlie?.exhibition).toBe(false);

    const event11 = meet.events.find((e) => e.eventNumber === 11);
    expect(event11?.distance).toBe(100);
    expect(event11?.stroke).toBe("free");
    expect(event11?.gender).toBe("female");
  });

  it("parses AZSI results with E2 times and places", () => {
    const content = readFileSync(join(fixturesDir, "azsi-results.hy3"), "utf8");
    const meet = parseHy3(content);

    expect(meet.name).toMatch(/AZSI 2025 Short Course Regional/);
    expect(meet.course).toBe("SCY");
    expect(meet.results.length > 5).toBeTruthy();

    const bailey = meet.results.find(
      (r) => r.swimmerName.includes("Bailey") && r.eventNumber === 17,
    );
    expect(bailey).toBeTruthy();
    expect(bailey?.time).toBe("1:20.41");
    expect(bailey?.place).toBe(6);
    expect(bailey?.resultType).toBe("finals");
    expect(bailey?.isDq).toBe(false);
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
    expect(meet.entries.length).toBe(1);
    expect(meet.entries[0]?.exhibition).toBe(true);
    expect(meet.entries[0]?.eventNumber).toBe(6);
    expect(meet.entries[0]?.swimmerName).toBe("Max Hanse");
    expect(meet.events[0]?.stroke).toBe("free");
    expect(meet.events[0]?.distance).toBe(50);
  });

  it("parses prelim/finals metadata from results fixtures", () => {
    const content = readFileSync(join(fixturesDir, "azsi-results.hy3"), "utf8");
    const meet = parseHy3(content);

    expect(meet.results.some((r) => r.resultType === "prelim")).toBe(true);
    expect(meet.results.some((r) => r.resultType === "finals")).toBe(true);
    expect(meet.results.some((r) => r.swimmerName.includes("Bailey"))).toBe(true);
    expect(meet.sanctionNumber).toMatch(/AZ24-75/);
  });

  it("handles empty content and Z0 terminator", () => {
    expect(parseHy3("").entries).toEqual([]);
    const truncated = [
      "A102Meet Entries             Hy-Tek",
      "B1Test Meet                                   Test Pool                                    01012025",
      "D1M    5Smith               Bob                                                                  017   17",
      "Z0",
      "D1M   99Ignored           Swimmer                                                                  17",
    ].join("\n");
    expect(parseHy3(truncated).entries).toHaveLength(0);
  });

  it("covers nickName, split-only G1, H1/H2, and age-group branches", () => {
    const azsi = readFileSync(join(fixturesDir, "azsi-results.hy3"), "utf8").split("\n");
    const content = [
      azsi[0],
      azsi[1],
      azsi[2],
      azsi[3],
      azsi[4],
      "D1M   28Hanse               Robert              Maxie                                                                  0SR                           17",
      "E1M   28HanseMM    50A 15    0U  0.00  6B   27.76S   27.76S    0.00    0.00  0NN              N                               60",
      "G1P 1   28.00 2   58.00",
      "E2P   58.00S       4   5   6   7",
      "H1DQ",
      "H2Disqualification detail text",
      "E1F   10Doe                 Jane                                                                  017   17",
    ].join("\n");

    const meet = parseHy3(content);
    expect(meet.entries[0]?.swimmerName).toBe("Maxie Hanse");
    expect(meet.results[0]?.resultType).toBe("prelim");
    expect(meet.events.some((e) => e.ageGroup === "15&O")).toBe(true);
    expect(meet.events.some((e) => e.ageGroup === "17&U")).toBe(true);
  });

  it("includes relay teams from full results exports", () => {
    const content = readFileSync(join(fixturesDir, "azsi-results.hy3"), "utf8");
    const meet = parseHy3(content);
    expect(meet.relays?.length).toBeGreaterThan(0);
    expect(meet.results.some((r) => r.resultType === "swimoff" || r.resultType === "finals")).toBe(
      true,
    );
  });
});
