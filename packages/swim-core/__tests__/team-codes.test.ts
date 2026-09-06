import { describe, expect, it } from "vitest";
import {
  normalizeLscCode,
  normalizeTeamCode,
  teamFilePrefix,
} from "../src/team-codes";

describe("team codes", () => {
  it("normalizes Hy-Tek abbreviations and LSCs", () => {
    expect(normalizeTeamCode(" mari-az ")).toBe("MARI");
    expect(normalizeTeamCode("DSUN")).toBe("DSUN");
    expect(normalizeTeamCode("AZSL")).toBe("AZSL");
    expect(normalizeTeamCode("x")).toBeNull();
    expect(normalizeLscCode("az")).toBe("AZ");
    expect(normalizeLscCode("AZI")).toBeNull();
  });

  it("builds filename prefixes", () => {
    expect(teamFilePrefix("MARI", "AZ")).toBe("MARI-AZ");
    expect(teamFilePrefix("MARI", null)).toBe("MARI");
    expect(teamFilePrefix(null, "AZ")).toBe("TEAM");
  });
});
