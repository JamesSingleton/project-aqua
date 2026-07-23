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

    function e1(ageMin: string, ageMax: string, eventNum: string): string {
      const line = Array.from({ length: 120 }, () => " ");
      const put = (oneBased: number, s: string) => {
        for (let i = 0; i < s.length; i++) line[oneBased - 1 + i] = s[i]!;
      };
      put(1, "E1");
      put(3, "M");
      put(4, "   28");
      put(9, "Hanse");
      put(14, "M");
      put(15, "M");
      put(16, "    50");
      put(22, "A");
      put(23, ageMin.padStart(3));
      put(26, ageMax.padStart(3));
      put(39, eventNum.padStart(4));
      put(51, "S");
      put(52, "  27.76S");
      return line.join("");
    }

    const content = [
      azsi[0],
      azsi[1],
      azsi[2],
      azsi[3],
      azsi[4],
      "D1M   28Hanse               Robert              Maxie                                                                  0SR                           17",
      e1("15", "   ", "6"),
      "G1P 1   28.00 2   58.00",
      "E2P   58.00S       4   5   6   7",
      "H1DQ",
      "H2Disqualification detail text",
      e1("   ", "17", "7"),
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

  it("covers swimoff-best results, invalid kinds, and sparse record branches", () => {
    function put(line: string[], oneBased: number, s: string) {
      for (let i = 0; i < s.length; i++) line[oneBased - 1 + i] = s[i]!;
    }
    function blank(len = 130): string[] {
      return Array.from({ length: len }, () => " ");
    }

    const b1 = blank();
    put(b1, 1, "B1");
    put(b1, 117, "-1");

    const b2 = blank();
    put(b2, 1, "B2");
    put(b2, 3, "Altitude notes for meet");
    put(b2, 99, "Y");
    put(b2, 109, "SANCTION-1");

    const c1Empty = blank();
    put(c1Empty, 1, "C1");

    const d1 = blank();
    put(d1, 1, "D1");
    put(d1, 3, "M");
    put(d1, 4, "   10");
    put(d1, 9, "Smith");
    put(d1, 29, "Pat");

    const e1NoMeetId = blank();
    put(e1NoMeetId, 1, "E1");
    put(e1NoMeetId, 3, "M");
    put(e1NoMeetId, 4, "  -1"); // meetId < 0 → entry.meetId undefined
    put(e1NoMeetId, 14, "M");
    put(e1NoMeetId, 16, "    50");
    put(e1NoMeetId, 22, "Z");
    put(e1NoMeetId, 52, "NT");

    const e1 = blank();
    put(e1, 1, "E1");
    put(e1, 3, "M");
    put(e1, 4, "   10");
    put(e1, 14, "M");
    put(e1, 16, "    50");
    put(e1, 22, "A");
    put(e1, 39, "   8");
    put(e1, 52, "  28.00");

    const e2Swimoff = blank();
    put(e2Swimoff, 1, "E2");
    put(e2Swimoff, 3, "S");
    put(e2Swimoff, 4, "  28.50");
    put(e2Swimoff, 13, "S");

    const e2Invalid = blank();
    put(e2Invalid, 1, "E2");
    put(e2Invalid, 3, "Z");

    const g1Invalid = blank();
    put(g1Invalid, 1, "G1");
    put(g1Invalid, 3, "Z");

    const g1EmptySplit = blank();
    put(g1EmptySplit, 1, "G1");
    put(g1EmptySplit, 3, "S");
    put(g1EmptySplit, 4, "01"); // enter split loop; blank time → safeFloat empty
    put(g1EmptySplit, 15, "02");
    put(g1EmptySplit, 17, "Infinity"); // non-finite safeFloat

    const g1BeforeEntry = blank();
    put(g1BeforeEntry, 1, "G1");
    put(g1BeforeEntry, 3, "P");

    const h1BeforeEntry = blank();
    put(h1BeforeEntry, 1, "H1");
    put(h1BeforeEntry, 3, "DQ");

    const f3NotRelay = blank();
    put(f3NotRelay, 1, "F3");

    const e2BeforeEntry = blank();
    put(e2BeforeEntry, 1, "E2");
    put(e2BeforeEntry, 3, "F");

    const d1Bad = blank();
    put(d1Bad, 1, "D1");
    put(d1Bad, 3, "M");
    put(d1Bad, 4, "  -1");

    const h1Empty = blank();
    put(h1Empty, 1, "H1");

    const e1FinalsDq = blank();
    put(e1FinalsDq, 1, "E1");
    put(e1FinalsDq, 3, "M");
    put(e1FinalsDq, 4, "   10");
    put(e1FinalsDq, 14, "M");
    put(e1FinalsDq, 16, "   100");
    put(e1FinalsDq, 22, "A");
    put(e1FinalsDq, 39, "   9");

    const e2FinalsDq = blank();
    put(e2FinalsDq, 1, "E2");
    put(e2FinalsDq, 3, "F");
    put(e2FinalsDq, 4, "  60.00");
    put(e2FinalsDq, 13, "Q");
    put(e2FinalsDq, 14, "1L");

    const h1OverrideFinals = blank();
    put(h1OverrideFinals, 1, "H1");
    put(h1OverrideFinals, 3, "2L");

    const e1SwimoffDq = blank();
    put(e1SwimoffDq, 1, "E1");
    put(e1SwimoffDq, 3, "M");
    put(e1SwimoffDq, 4, "   10");
    put(e1SwimoffDq, 14, "M");
    put(e1SwimoffDq, 16, "   200");
    put(e1SwimoffDq, 22, "A");
    put(e1SwimoffDq, 39, "  10");

    const e2SwimoffDq = blank();
    put(e2SwimoffDq, 1, "E2");
    put(e2SwimoffDq, 3, "S");
    put(e2SwimoffDq, 4, "  61.00");
    put(e2SwimoffDq, 13, "D");
    put(e2SwimoffDq, 14, "3L");

    const h1OverrideSwimoff = blank();
    put(h1OverrideSwimoff, 1, "H1");
    put(h1OverrideSwimoff, 3, "4L");

    const f1 = blank();
    put(f1, 1, "F1");
    put(f1, 3, "TEAM");
    put(f1, 8, "A");
    put(f1, 14, "M");
    put(f1, 16, "   200");
    put(f1, 22, "E");
    // blank ages + blank event number → synthetic key + undefined ageMin/Max
    put(f1, 51, "Y");
    put(f1, 52, " 120.00");

    const f3 = blank();
    put(f3, 1, "F3");
    put(f3, 4, "   10");
    put(f3, 15, "1");
    put(f3, 17, "   -1");

    const content = [
      "A102Meet Entries             Hy-Tek",
      "X",
      "QQ ignored code",
      b1.join(""),
      b2.join(""),
      c1Empty.join(""),
      "C2 team address",
      "C3 team contact",
      g1BeforeEntry.join(""),
      h1BeforeEntry.join(""),
      f3NotRelay.join(""),
      e2BeforeEntry.join(""),
      d1Bad.join(""),
      d1.join(""),
      e1NoMeetId.join(""),
      e1.join(""),
      e2Swimoff.join(""),
      e2Invalid.join(""),
      g1Invalid.join(""),
      g1EmptySplit.join(""),
      h1Empty.join(""),
      e1FinalsDq.join(""),
      e2FinalsDq.join(""),
      h1OverrideFinals.join(""),
      e1SwimoffDq.join(""),
      e2SwimoffDq.join(""),
      h1OverrideSwimoff.join(""),
      f1.join(""),
      f3.join(""),
      e1.join(""),
      f3NotRelay.join(""),
      "C1TEST",
    ].join("\n");

    const meet = parseHy3(content);
    expect(meet.notes).toMatch(/Altitude notes/);
    expect(meet.sanctionNumber).toBe("SANCTION-1");
    expect(meet.results.some((r) => r.resultType === "swimoff")).toBe(true);
    expect(meet.results.some((r) => r.isDq)).toBe(true);
    expect(meet.events.some((e) => e.stroke === "medley_relay")).toBe(true);
    expect(meet.entries.some((e) => e.swimmerName === "Pat Smith")).toBe(true);
  });

  it("covers age-only-max, empty seed float, and DQ without time", () => {
    function put(line: string[], oneBased: number, s: string) {
      for (let i = 0; i < s.length; i++) line[oneBased - 1 + i] = s[i]!;
    }
    function blank(len = 130): string[] {
      return Array.from({ length: len }, () => " ");
    }

    const d1 = blank();
    put(d1, 1, "D1");
    put(d1, 3, "F");
    put(d1, 4, "    1");
    put(d1, 9, "Lee");
    put(d1, 29, "Sam");

    const e1 = blank();
    put(e1, 1, "E1");
    put(e1, 3, "F");
    put(e1, 4, "    1");
    put(e1, 14, "F");
    put(e1, 16, "    50");
    put(e1, 22, "A");
    put(e1, 26, " 12"); // ageMax only
    put(e1, 39, "   5");
    put(e1, 52, "        "); // empty seed

    const e2 = blank();
    put(e2, 1, "E2");
    put(e2, 3, "F");
    put(e2, 4, "        "); // no time
    put(e2, 13, "D"); // DQ code without time still emits result

    const meet = parseHy3(["A1", d1.join(""), e1.join(""), e2.join("")].join("\n"));
    expect(meet.events[0]?.ageGroup).toBe("12&U");
    expect(meet.results[0]).toMatchObject({ time: "DQ", isDq: true });
  });
});
