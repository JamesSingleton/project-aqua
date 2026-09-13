import { describe, expect, it } from "vitest";
import * as age from "../src/age";

describe("swimmerAge", () => {
  it("computes approximate age in years", () => {
    const dob = new Date("2010-06-15");
    const asOf = new Date("2025-06-15");
    expect(age.swimmerAge(dob, asOf)).toBe(15);
    expect(age.swimmerAge("2010-06-15", asOf)).toBe(15);
  });
});

describe("swimmerAgeOnDate", () => {
  it("returns null for missing or invalid DOB", () => {
    expect(age.swimmerAgeOnDate(null, new Date())).toBeNull();
    expect(age.swimmerAgeOnDate(undefined, new Date())).toBeNull();
    expect(age.swimmerAgeOnDate("not-a-date", new Date())).toBeNull();
  });

  it("subtracts one before birthday in calendar year", () => {
    const dob = new Date(2010, 5, 15);
    expect(age.swimmerAgeOnDate(dob, new Date(2025, 5, 14))).toBe(14);
    expect(age.swimmerAgeOnDate(dob, new Date(2025, 5, 15))).toBe(15);
    expect(age.swimmerAgeOnDate(dob, new Date(2025, 4, 15))).toBe(14);
  });
});

describe("isMinorSwimmer", () => {
  it("returns true under 18", () => {
    const asOf = new Date("2025-01-01");
    expect(age.isMinorSwimmer("2010-01-01", asOf)).toBe(true);
    expect(age.isMinorSwimmer("2000-01-01", asOf)).toBe(false);
  });
});

describe("season helpers", () => {
  it("currentSeasonYear uses Sep–Aug boundary", () => {
    expect(age.currentSeasonYear(new Date(2025, 8, 1))).toBe("2025-2026");
    expect(age.currentSeasonYear(new Date(2025, 7, 31))).toBe("2024-2025");
  });

  it("seasonRangeFromLabel validates label shape", () => {
    expect(age.seasonRangeFromLabel("2025-2026")).toEqual({
      label: "2025-2026",
      startsOn: "2025-09-01",
      endsOn: "2026-08-31",
    });
    expect(age.seasonRangeFromLabel("2025-2027")).toBeNull();
    expect(age.seasonRangeFromLabel("bad")).toBeNull();
  });

  it("currentSeasonRange returns range for current season", () => {
    const range = age.currentSeasonRange(new Date(2025, 8, 1));
    expect(range.label).toBe("2025-2026");
    expect(range.startsOn).toBe("2025-09-01");
  });

  it("nextSeasonLabel and nextSeasonRange advance one season", () => {
    expect(age.nextSeasonLabel("2025-2026")).toBe("2026-2027");
    expect(age.nextSeasonLabel("bad")).toBeNull();
    expect(age.nextSeasonRange("bad")).toBeNull();
    expect(age.nextSeasonRange("2025-2026")).toEqual({
      label: "2026-2027",
      startsOn: "2026-09-01",
      endsOn: "2027-08-31",
    });
  });
});
