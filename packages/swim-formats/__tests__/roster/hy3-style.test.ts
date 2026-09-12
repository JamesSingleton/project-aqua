import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parseHy3Roster,
  parseHy3StyleRoster,
} from "../../src/roster/hy3-style";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

describe("parseHy3Roster", () => {
  it("parses roster-only.hy3 fixture", () => {
    const content = readFileSync(join(fixturesDir, "roster-only.hy3"), "utf8");
    const rows = parseHy3Roster(content);
    expect(rows.length).toBeGreaterThan(10);
    const marlie = rows.find((r) => r.lastName === "McNamee");
    expect(marlie).toMatchObject({
      firstName: "Marlie",
      gender: "female",
      classYear: "JR",
    });
    expect(marlie?.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses male and female D1 lines with class year variants", () => {
    const content = [
      "A103Rosters Only             Hy-Tek, Ltd    Win-TM 8.0De  03212026 12:06 PM",
      "D1M   21Smith               John                                                                  0FR                           77",
      "D1F   27Doe                 Jane                                                                  0SO                           09",
    ].join("\n");

    const rows = parseHy3Roster(content);
    expect(rows.find((r) => r.lastName === "Smith")).toMatchObject({
      gender: "male",
      classYear: "FR",
    });
    expect(rows.find((r) => r.lastName === "Doe")).toMatchObject({
      gender: "female",
      classYear: "SO",
    });
  });

  it("skips blank D1 name lines", () => {
    const content =
      "D1M                                                                                                    77\n";
    expect(parseHy3Roster(content)).toEqual([]);
  });

  it("skips hy3-style D1 rows without class year (no DOB to merge)", () => {
    const content = [
      "A103Rosters Only             Hy-Tek",
      "D1M    9NoClass             Pat                                                                                                   98",
    ].join("\n");
    // parseHy3D1Line yields no dateOfBirth without class year; mergeSwimmer requires DOB.
    expect(parseHy3Roster(content)).toEqual([]);
  });

  it("exports deprecated alias parseHy3StyleRoster", () => {
    expect(parseHy3StyleRoster).toBe(parseHy3Roster);
  });

  it("covers non-MF D1 lines and first/last name fallbacks", () => {
    expect(parseHy3Roster("D1X   21NotParsed          Name")).toEqual([]);

    // D1 layout: last at 8-28, first at 28-48.
    const lastOnlyLine =
      "D1M   21" +
      "OnlyLast".padEnd(20, " ") +
      "".padEnd(20, " ") +
      " ".repeat(40) +
      "0JR";
    expect(parseHy3Roster(`A103Rosters Only\n${lastOnlyLine}`)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          firstName: "Unknown",
          lastName: "OnlyLast",
          classYear: "JR",
        }),
      ]),
    );

    const firstOnlyLine =
      "D1F   27" +
      "".padEnd(20, " ") +
      "OnlyFirst".padEnd(20, " ") +
      " ".repeat(40) +
      "0SR";
    expect(parseHy3Roster(`A103Rosters Only\n${firstOnlyLine}`)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          firstName: "OnlyFirst",
          lastName: "Swimmer",
          classYear: "SR",
        }),
      ]),
    );
  });
});
