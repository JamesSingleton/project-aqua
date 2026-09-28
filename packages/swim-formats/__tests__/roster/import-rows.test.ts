import { describe, expect, it } from "vitest";
import type { ParsedRosterRow } from "../../src/types";
import {
  parsedRosterRowToImportRaw,
  rosterImportRowNumber,
} from "../../src/roster/import-rows";

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
