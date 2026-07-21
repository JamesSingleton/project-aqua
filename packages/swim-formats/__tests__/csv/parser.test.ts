import { describe, expect, it } from "vitest";
import { exportRosterCsv, parseRosterCsv } from "../../src/csv/parser";
import type { ParsedRosterRow } from "../../src/types";

describe("parseRosterCsv", () => {
  it("returns empty for header-only or blank input", () => {
    expect(parseRosterCsv("first_name,last_name\n")).toEqual([]);
    expect(parseRosterCsv("")).toEqual([]);
  });

  it("parses default column mapping with comma delimiter", () => {
    const csv = [
      "first_name,last_name,date_of_birth,gender,practice_group,class_year,usa_member_id",
      "Ada,Lovelace,2012-04-15,female,Gold,FR,ABC123",
      "Bob,Smith,2010-01-01,m,Grey,,",
      " , ,2010-01-01,male,,,", // skipped — no name
    ].join("\n");

    const rows = parseRosterCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "2012-04-15",
      gender: "female",
      practiceGroup: "Gold",
      classYear: "FR",
      usaMemberId: "ABC123",
    });
    expect(rows[1]?.gender).toBe("male");
  });

  it("handles quoted fields and custom delimiter/mapping", () => {
    const csv = [
      "First;Last;DOB;Sex;Group",
      '"Jane";"Doe";"2011-05-05";"boy";"Senior"',
    ].join("\n");

    const rows = parseRosterCsv(
      csv,
      {
        firstName: "First",
        lastName: "Last",
        dateOfBirth: "DOB",
        gender: "Sex",
        practiceGroup: "Group",
      },
      ";",
    );
    expect(rows[0]?.gender).toBe("male");
    expect(rows[0]?.practiceGroup).toBe("Senior");
  });

  it("derives class year from practice group and clears group when class parsed", () => {
    const csv = [
      "first_name,last_name,date_of_birth,gender,practice_group",
      "Ada,Lovelace,2012-04-15,female,JR",
    ].join("\n");

    const rows = parseRosterCsv(csv);
    expect(rows[0]?.classYear).toBe("JR");
    expect(rows[0]?.practiceGroup).toBeUndefined();
  });

  it("prefers explicit class_year over practice group", () => {
    const csv = [
      "first_name,last_name,date_of_birth,gender,practice_group,class_year",
      "Ada,Lovelace,2012-04-15,female,Gold,SR",
    ].join("\n");

    const rows = parseRosterCsv(csv);
    expect(rows[0]?.classYear).toBe("SR");
    expect(rows[0]?.practiceGroup).toBe("Gold");
  });

  it("omits optional columns when mapping excludes them", () => {
    const csv = [
      "first_name,last_name,date_of_birth,gender",
      "Ada,Lovelace,2012-04-15,w",
    ].join("\n");

    const rows = parseRosterCsv(csv, {
      firstName: "first_name",
      lastName: "last_name",
      dateOfBirth: "date_of_birth",
      gender: "gender",
      usaMemberId: "",
      practiceGroup: "",
      classYear: "",
    });
    expect(rows[0]?.gender).toBe("female");
    expect(rows[0]?.usaMemberId).toBeUndefined();
    expect(rows[0]?.practiceGroup).toBeUndefined();
  });
});

describe("exportRosterCsv", () => {
  it("round-trips roster rows", () => {
    const rows: ParsedRosterRow[] = [
      {
        firstName: "Ada",
        lastName: "Lovelace",
        dateOfBirth: "2012-04-15",
        gender: "female",
        practiceGroup: "Gold",
        classYear: "FR",
        usaMemberId: "ABC",
      },
    ];
    const csv = exportRosterCsv(rows);
    expect(csv).toContain("first_name,last_name");
    expect(parseRosterCsv(csv)[0]).toEqual(rows[0]);
  });

  it("uses custom delimiter", () => {
    const rows: ParsedRosterRow[] = [
      {
        firstName: "A",
        lastName: "B",
        dateOfBirth: "2010-01-01",
        gender: "male",
      },
    ];
    expect(exportRosterCsv(rows, "|").split("|")[0]).toBe("first_name");
  });
});
