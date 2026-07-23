import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseCl2Roster, parseSdifStyleRoster } from "../../src/roster/cl2";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

describe("parseCl2Roster", () => {
  it("parses roster-swimmers.cl2 fixture", () => {
    const content = readFileSync(
      join(fixturesDir, "roster-swimmers.cl2"),
      "utf8",
    );
    const rows = parseCl2Roster(content);
    expect(rows.length).toBeGreaterThan(10);
    const marlie = rows.find((r) => r.lastName === "McNamee");
    expect(marlie?.firstName).toBe("Marlie");
    expect(marlie?.gender).toBe("female");
    expect(marlie?.classYear).toBe("JR");
  });

  it("parses D01 without class using event gender and AUSA birth date", () => {
    const line =
      "D01AZ      Smith, Jane                 ABCD1234567890AUSA04152012FF 1001 11 UNOV         1:16.69Y                                                            N26";
    const rows = parseCl2Roster(line);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      firstName: "Jane",
      lastName: "Smith",
      gender: "female",
      dateOfBirth: "2012-04-15",
      usaMemberId: "ABCD1234567890",
    });
  });

  it("parses D01 with class using roster M/F gender code", () => {
    const line =
      "D01AZ  FR  Jones, Tim                                          0 M                                                                                           N33";
    const rows = parseCl2Roster(line);
    expect(rows[0]).toMatchObject({
      firstName: "Tim",
      lastName: "Jones",
      gender: "male",
      classYear: "FR",
    });
  });

  it("parses D01 with class using MM event gender code", () => {
    const line =
      "D01AZ  SO  Doe, Pat                                            MM 1001  1 UNOV                                                                               N33";
    const rows = parseCl2Roster(line);
    expect(rows[0]?.gender).toBe("male");
    expect(rows[0]?.classYear).toBe("SO");
  });

  it("skips D01 lines without gender or DOB", () => {
    expect(parseCl2Roster("D01AZ  FR  NoGender, Pat                                      0 X   N33")).toEqual([]);
    expect(
      parseCl2Roster(
        "D01AZ      NoDob, Pat                                          MM 1001  1 UNOV   N33",
      ),
    ).toEqual([]);
  });

  it("updates preferred name when D31 matches usa member id", () => {
    const usaId = "ABCDEF01234567";
    const content = [
      `D01AZ  FR  Smith, Jane                 ${usaId}AUSA04152012FF 1001 11 UNOV         1:16.69Y                                                            N26`,
      `D31${usaId}  JoJo                                                                                                                                       N61`,
    ].join("\n");
    const rows = parseCl2Roster(content);
    expect(rows.find((r) => r.usaMemberId === usaId)?.firstName).toBe("JoJo");
  });

  it("skips D31 rows missing usa id or preferred name", () => {
    const content = [
      "D01AZ  FR  Smith, Jane                                         0 F                                                                                           N33",
      "D31                JoJo                                                                                                                                       N61",
    ].join("\n");
    expect(parseCl2Roster(content)[0]?.firstName).toBe("Jane");
  });

  it("exports deprecated alias parseSdifStyleRoster", () => {
    expect(parseSdifStyleRoster).toBe(parseCl2Roster);
  });

  it("covers unmatched D01 patterns, alternate FF placement, and non-matching D31", () => {
    expect(parseCl2Roster("D01AZ  onlyonefield")).toEqual([]);

    // Classless D01 where only `\d{2}(FF|MM)\s` matches (no `FF 1` style).
    const altGender =
      "D01AZ      Smith, Jane                 ABCD1234567890AUSA04152012  13FF  rest                                                                      N26";
    expect(parseCl2Roster(altGender)[0]).toMatchObject({
      firstName: "Jane",
      lastName: "Smith",
      gender: "female",
      dateOfBirth: "2012-04-15",
    });

    // Classless D01 with DOB but no gender codes → gender ternary else branch.
    expect(
      parseCl2Roster(
        "D01AZ      NoGender, Pat               ABCD1234567890AUSA04152012                                                                            N26",
      ),
    ).toEqual([]);

    const usaId = "ABCDEF01234567";
    const content = [
      `D01AZ  FR  Smith, Jane                 ${usaId}AUSA04152012FF 1001 11 UNOV         1:16.69Y                                                            N26`,
      "D31ZZZZZZZZZZZZZZ  Nick                                                                                                                                       N61",
    ].join("\n");
    expect(parseCl2Roster(content)[0]?.firstName).toBe("Jane");
  });
});
