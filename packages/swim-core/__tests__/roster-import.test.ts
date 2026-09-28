import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  detectRosterFileFormat,
  parsedRosterRowToImportRaw,
  parseRosterFile,
  rosterImportRowNumber,
} from "@lane4hq/swim-formats/roster";
import { describe, expect, it } from "vitest";
import { rosterRowSchema } from "../src/validators";
import {
  collectRosterImportRowErrors,
  formatRosterImportField,
  serializeRosterImportErrorsCsv,
  validateRosterImportRows,
} from "../src/roster-import";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../swim-formats/fixtures",
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

describe("validateRosterImportRows", () => {
  it("maps empty zod paths to row field", () => {
    expect(formatRosterImportField([])).toBe("row");
    expect(formatRosterImportField(["gender"])).toBe("gender");
  });

  it("accepts minors without contacts while shared schema rejects them", () => {
    const minorRow = {
      firstName: "Sam",
      lastName: "Swimmer",
      dateOfBirth: "2015-01-01",
      gender: "male" as const,
    };
    expect(rosterRowSchema.safeParse(minorRow).success).toBe(false);
    expect(
      validateRosterImportRows([{ row: 2, data: minorRow }]).valid,
    ).toHaveLength(1);
  });

  it("labels empty names as Unknown swimmer", () => {
    const errors = collectRosterImportRowErrors(1, {
      firstName: " ",
      lastName: "",
      dateOfBirth: "",
      gender: "male",
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.name).toBe("Unknown swimmer");
  });

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

  it("serializes errors to CSV", () => {
    const csv = serializeRosterImportErrorsCsv([
      {
        row: 3,
        name: "Ada Lovelace",
        field: "dateOfBirth",
        message: "Required",
      },
      {
        row: 4,
        name: "O'Brien, Pat",
        field: "gender",
        message: "Invalid, expected male or female",
      },
    ]);
    expect(csv).toContain("row,name,field,message");
    expect(csv).toContain("Ada Lovelace");
    expect(csv).toContain('"O\'Brien, Pat"');
  });
});
