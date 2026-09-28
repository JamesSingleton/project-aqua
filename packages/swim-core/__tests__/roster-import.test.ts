import { describe, expect, it } from "vitest";
import {
  collectRosterImportRowErrors,
  formatRosterImportField,
  serializeRosterImportErrorsCsv,
  validateRosterImportRows,
} from "../src/roster-import";
import { rosterRowSchema } from "../src/validators";

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

  it("splits valid and invalid rows, keeping optional fields", () => {
    const { valid, invalid } = validateRosterImportRows([
      {
        row: 2,
        data: {
          firstName: "",
          lastName: "Bad",
          dateOfBirth: "not-a-date",
          gender: "male",
        },
      },
      {
        row: 3,
        data: {
          firstName: " Ada ",
          lastName: "Lovelace",
          middleName: " B ",
          preferredName: " ",
          dateOfBirth: "1990-01-01",
          gender: "female",
          practiceGroup: " Senior ",
          classYear: "SO",
          usaMemberId: " ABC123 ",
        },
      },
      {
        row: 4,
        data: {
          firstName: "Grace",
          lastName: "Hopper",
          dateOfBirth: "1990-01-01",
          gender: "female",
          classYear: "not-a-class",
        },
      },
    ]);
    expect(invalid.length).toBeGreaterThan(0);
    expect(invalid.every((e) => e.row === 2)).toBe(true);
    expect(invalid.some((e) => e.field === "firstName")).toBe(true);
    expect(valid.map((v) => v.row)).toEqual([3, 4]);
    expect(valid[0]?.data).toMatchObject({
      firstName: "Ada",
      middleName: "B",
      preferredName: undefined,
      practiceGroup: "Senior",
      classYear: "SO",
      usaMemberId: "ABC123",
    });
    expect(valid[1]?.data.classYear).toBeUndefined();
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
