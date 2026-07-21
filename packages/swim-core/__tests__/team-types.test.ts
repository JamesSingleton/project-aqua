import { describe, expect, it } from "vitest";
import {
  advanceAcademicStanding,
  advanceClassYear,
  advanceSeasonsOfCompetitionUsed,
  formatBestTimeEventLabel,
  formatEventGenderLabel,
  parseAcademicStanding,
  parseClassYear,
  parseEligibilityStatus,
  parseTeamType,
  requiresSafeSportCompliance,
  supportsClassYear,
  supportsCollegeEligibility,
  supportsUsaSwimmingIntegration,
  teamTypeLabel,
} from "../src/team-types";

describe("team compliance helpers", () => {
  it("requires SafeSport for club and national", () => {
    expect(requiresSafeSportCompliance("club")).toBe(true);
    expect(requiresSafeSportCompliance("national")).toBe(true);
    expect(requiresSafeSportCompliance("high_school")).toBe(false);
    expect(requiresSafeSportCompliance(null)).toBe(true);
  });

  it("supportsUsaSwimmingIntegration mirrors SafeSport", () => {
    expect(supportsUsaSwimmingIntegration("club")).toBe(true);
    expect(supportsUsaSwimmingIntegration("college")).toBe(false);
  });

  it("supportsClassYear for high school only", () => {
    expect(supportsClassYear("high_school")).toBe(true);
    expect(supportsClassYear("club")).toBe(false);
  });

  it("supportsCollegeEligibility for college only", () => {
    expect(supportsCollegeEligibility("college")).toBe(true);
    expect(supportsCollegeEligibility("club")).toBe(false);
  });
});

describe("parsers", () => {
  it("parseTeamType defaults to club", () => {
    expect(parseTeamType("college")).toBe("college");
    expect(parseTeamType("unknown")).toBe("club");
  });

  it("parseClassYear", () => {
    expect(parseClassYear(" jr ")).toBe("JR");
    expect(parseClassYear(123)).toBeNull();
    expect(parseClassYear("XX")).toBeNull();
  });

  it("parseAcademicStanding", () => {
    expect(parseAcademicStanding("gr")).toBe("GR");
    expect(parseAcademicStanding(null)).toBeNull();
    expect(parseAcademicStanding("not-standing")).toBeNull();
  });

  it("parseEligibilityStatus", () => {
    expect(parseEligibilityStatus(" Redshirt ")).toBe("redshirt");
    expect(parseEligibilityStatus("bad")).toBeNull();
    expect(parseEligibilityStatus(42)).toBeNull();
  });
});

describe("advance helpers", () => {
  it("advanceClassYear", () => {
    expect(advanceClassYear("FR")).toBe("SO");
    expect(advanceClassYear("SR")).toBeNull();
    expect(advanceClassYear(null)).toBeNull();
  });

  it("advanceAcademicStanding", () => {
    expect(advanceAcademicStanding("JR")).toBe("SR");
    expect(advanceAcademicStanding("GR")).toBe("GR");
    expect(advanceAcademicStanding(null)).toBeNull();
    expect(advanceAcademicStanding("INVALID" as "FR")).toBe("INVALID");
  });

  it("advanceSeasonsOfCompetitionUsed", () => {
    expect(advanceSeasonsOfCompetitionUsed(2, "competing")).toBe(3);
    expect(advanceSeasonsOfCompetitionUsed(2, "redshirt")).toBe(2);
    expect(advanceSeasonsOfCompetitionUsed(null, "competing")).toBe(1);
    expect(advanceSeasonsOfCompetitionUsed(null, "redshirt")).toBeNull();
  });
});

describe("labels", () => {
  it("teamTypeLabel", () => {
    expect(teamTypeLabel("college")).toBe("College");
    expect(teamTypeLabel("unknown")).toBe("USA Swimming Club");
    expect(teamTypeLabel(null)).toBe("USA Swimming Club");
  });

  it("formatEventGenderLabel by team type", () => {
    expect(formatEventGenderLabel("mixed", "club")).toBe("Mixed");
    expect(formatEventGenderLabel("", "club")).toBe("Boys");
    expect(formatEventGenderLabel(null, "club")).toBe("Boys");
    expect(formatEventGenderLabel("female", "college")).toBe("Women");
    expect(formatEventGenderLabel("male", "college")).toBe("Men");
    expect(formatEventGenderLabel("female", "high_school")).toBe("Girls");
    expect(formatEventGenderLabel("male", "club")).toBe("Boys");
    expect(formatEventGenderLabel("f", "national")).toBe("Women");
    expect(formatEventGenderLabel("g", "club")).toBe("Girls");
  });

  it("formatBestTimeEventLabel", () => {
    expect(formatBestTimeEventLabel("100 Back", "SCY", "female", "club")).toBe(
      "100 Back - SCY - Girls",
    );
    expect(formatBestTimeEventLabel(null, "LCM", "male", "college")).toBe(
      "Event - LCM - Men",
    );
  });
});
