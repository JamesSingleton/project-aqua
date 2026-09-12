import { describe, expect, it } from "vitest";
import {
  estimateDobFromClassYear,
  extractSeasonYear,
  genderFromEventCode,
  mergeSwimmer,
  parseAusaBirthDate,
  parseDobFromUsaMemberId,
  parseGenderCode,
  parseLastFirstName,
  parseSdifBirthDate,
  parseUsaMemberIdFromLine,
  splitSwimmerName,
  swimmerKey,
} from "../../src/roster/utils";
import type { ParsedRosterRow } from "../../src/types";

describe("parseGenderCode", () => {
  it("maps female codes", () => {
    expect(parseGenderCode("F")).toBe("female");
    expect(parseGenderCode("female")).toBe("female");
    expect(parseGenderCode("GIRL")).toBe("female");
    expect(parseGenderCode("W")).toBe("female");
  });

  it("defaults to male", () => {
    expect(parseGenderCode("M")).toBe("male");
    expect(parseGenderCode("")).toBe("male");
  });
});

describe("genderFromEventCode", () => {
  it("detects female and male prefixes", () => {
    expect(genderFromEventCode("FF50")).toBe("female");
    expect(genderFromEventCode("FW100")).toBe("female");
    expect(genderFromEventCode("FG200")).toBe("female");
    expect(genderFromEventCode("MM50")).toBe("male");
    expect(genderFromEventCode("MW100")).toBe("male");
    expect(genderFromEventCode("MB200")).toBe("male");
  });

  it("returns undefined for unknown", () => {
    expect(genderFromEventCode("XX")).toBeUndefined();
  });
});

describe("parseSdifBirthDate", () => {
  it("parses 8 and 6 digit forms", () => {
    expect(parseSdifBirthDate("04152012")).toBe("2012-04-15");
    expect(parseSdifBirthDate("041512")).toBe("2012-04-15");
    expect(parseSdifBirthDate("041595")).toBe("1995-04-15");
  });

  it("rejects empty/invalid", () => {
    expect(parseSdifBirthDate("")).toBeUndefined();
    expect(parseSdifBirthDate("abc")).toBeUndefined();
  });
});

describe("parseDobFromUsaMemberId", () => {
  it("parses leading MMDDYY", () => {
    expect(parseDobFromUsaMemberId("041512JOH*DOE*")).toBe("2012-04-15");
    expect(parseDobFromUsaMemberId("041595JOH*DOE*")).toBe("1995-04-15");
  });

  it("returns undefined without digits", () => {
    expect(parseDobFromUsaMemberId("ABC")).toBeUndefined();
  });
});

describe("parseAusaBirthDate / parseUsaMemberIdFromLine", () => {
  it("parses AUSA and member id tokens", () => {
    expect(parseAusaBirthDate("foo AUSA08192011 bar")).toBe("2011-08-19");
    expect(parseAusaBirthDate("none")).toBeUndefined();
    expect(parseUsaMemberIdFromLine("ABCDEF01234567AUSA08192011")).toBe(
      "ABCDEF01234567",
    );
    expect(parseUsaMemberIdFromLine("nope")).toBeUndefined();
  });
});

describe("estimateDobFromClassYear", () => {
  it("estimates DOB from class year", () => {
    expect(estimateDobFromClassYear("FR", 2026)).toBe("2012-07-01");
    expect(estimateDobFromClassYear("SR", 2026)).toBe("2009-07-01");
    expect(estimateDobFromClassYear("XX", 2026)).toBe("2011-07-01");
  });
});

describe("name helpers", () => {
  it("splits and parses last, first", () => {
    expect(splitSwimmerName("")).toEqual({
      firstName: "Unknown",
      lastName: "Swimmer",
    });
    expect(splitSwimmerName("Ada")).toEqual({
      firstName: "Ada",
      lastName: "Swimmer",
    });
    expect(splitSwimmerName("Ada Lovelace")).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
    });
    expect(parseLastFirstName("Lovelace, Ada")).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      middleName: undefined,
    });
    expect(parseLastFirstName("Lovelace, Ada Byron")).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      middleName: "Byron",
    });
    expect(parseLastFirstName("Solo,")).toEqual({
      firstName: "Unknown",
      lastName: "Solo",
      middleName: undefined,
    });
    expect(parseLastFirstName("Ada Lovelace")).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
    });
  });
});

describe("swimmerKey / mergeSwimmer", () => {
  it("keys by usa id or name+dob", () => {
    expect(
      swimmerKey({
        usaMemberId: "ABC",
        firstName: "A",
        lastName: "B",
        dateOfBirth: "2010-01-01",
      }),
    ).toBe("usa:ABC");
    expect(
      swimmerKey({
        firstName: "A",
        lastName: "B",
        dateOfBirth: "2010-01-01",
      }),
    ).toBe("name:B|A|2010-01-01");
  });

  it("merges preferring newer optional fields when provided", () => {
    const map = new Map<string, ParsedRosterRow>();
    mergeSwimmer(map, { firstName: "Ada", lastName: "Lovelace" });
    expect(map.size).toBe(0);

    mergeSwimmer(map, {
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "2012-04-15",
      gender: "female",
    });
    expect(map.size).toBe(1);

    mergeSwimmer(map, {
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "2012-04-15",
      gender: "female",
      practiceGroup: "Gold",
      classYear: "FR",
    });
    expect([...map.values()][0]).toMatchObject({
      practiceGroup: "Gold",
      classYear: "FR",
    });

    mergeSwimmer(map, {
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "2012-04-15",
      gender: "female",
    });
    expect([...map.values()][0]).toMatchObject({
      practiceGroup: "Gold",
      classYear: "FR",
    });
  });

  it("derives DOB from usa member id when missing", () => {
    const map = new Map<string, ParsedRosterRow>();
    mergeSwimmer(map, {
      firstName: "Ada",
      lastName: "Lovelace",
      gender: "female",
      usaMemberId: "041512ADA*LOVE",
    });
    expect([...map.values()][0]?.dateOfBirth).toBe("2012-04-15");
  });
});

describe("extractSeasonYear", () => {
  it("extracts year from 20YYMMDD-like tokens", () => {
    expect(extractSeasonYear("Meet 20251025")).toBe(2025);
    expect(extractSeasonYear("none")).toBeUndefined();
  });
});
