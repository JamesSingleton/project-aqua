import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateRosterImportRows } from "@lane4hq/swim-core/roster-import";
import { describe, expect, it } from "vitest";
import { detectRosterFileFormat, parseRosterFile } from "../../src/roster";
import {
  parsedRosterRowToImportRaw,
  rosterImportRowNumber,
} from "../../src/roster/import-rows";
import type { ParsedRosterRow } from "../../src/types";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function importRowsFromFile(filename: string, content: string) {
  const format = detectRosterFileFormat(filename, content);
  if (!format) throw new Error(`unsupported format: ${filename}`);
  const parsed = parseRosterFile(content, format);
  return parsed.map((row, index) => ({
    row: rosterImportRowNumber(row, index + 2),
    data: parsedRosterRowToImportRaw(row),
  }));
}

describe("import-rows helpers", () => {
  it("maps parsed roster rows for validation", () => {
    const row: ParsedRosterRow = {
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "2012-04-15",
      gender: "female",
      sourceLine: 4,
      contacts: { parentName: "Parent", parentEmail: "p@example.com" },
    };
    expect(parsedRosterRowToImportRaw(row)).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "2012-04-15",
      gender: "female",
      contacts: { parentName: "Parent", parentEmail: "p@example.com" },
    });
    expect(rosterImportRowNumber(row, 9)).toBe(4);
    expect(rosterImportRowNumber({ ...row, sourceLine: undefined }, 9)).toBe(9);
  });
});

describe("roster import validation against fixtures", () => {
  it("collects field errors for malformed CSV rows", () => {
    const csv =
      "first_name,last_name,date_of_birth,gender\n,Bad,not-a-date,invalid\nAda,Lovelace,1990-01-01,female";
    const { valid, invalid } = validateRosterImportRows(
      importRowsFromFile("team.csv", csv),
    );
    expect(valid).toHaveLength(1);
    expect(invalid.length).toBeGreaterThan(0);
    expect(invalid.every((e) => e.row === 2)).toBe(true);
    expect(invalid.some((e) => e.field === "firstName")).toBe(true);
  });

  it("validates CL2 roster fixture with source line numbers", () => {
    const cl2 = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    const rows = importRowsFromFile("roster-swimmers.cl2", cl2);
    const { valid, invalid } = validateRosterImportRows(rows);
    expect(rows.length).toBeGreaterThan(5);
    for (const row of valid) {
      expect(row.row).toBeGreaterThan(0);
    }
    expect(valid.length).toBeGreaterThan(0);
    expect(invalid).toHaveLength(0);
    expect(valid.some((r) => r.row === 3)).toBe(true);
  });

  it("validates HY3 roster fixture", () => {
    const hy3 = readFileSync(join(fixturesDir, "roster-only.hy3"), "utf8");
    const { valid, invalid } = validateRosterImportRows(
      importRowsFromFile("roster-only.hy3", hy3),
    );
    expect(valid.length).toBeGreaterThan(5);
    expect(invalid).toHaveLength(0);
  });
});
