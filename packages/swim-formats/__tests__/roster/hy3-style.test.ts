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
    const content = "D1M                                                                                                    77\n";
    expect(parseHy3Roster(content)).toEqual([]);
  });

  it("covers hy3-style D1 rows without class year", () => {
    const content = [
      "A103Rosters Only             Hy-Tek",
      "D1M    9NoClass             Pat                                                                                                   98",
    ].join("\n");
    const rows = parseHy3Roster(content);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.dateOfBirth).toBeUndefined();
    expect(rows[0]?.classYear).toBeUndefined();
  });

  it("exports deprecated alias parseHy3StyleRoster", () => {
    expect(parseHy3StyleRoster).toBe(parseHy3Roster);
  });
});
