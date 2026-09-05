import { describe, expect, it } from "vitest";
import {
  cl2TeamId,
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

  it("builds CL2 and filename prefixes", () => {
    expect(cl2TeamId("MARI", "AZ")).toBe("AZMARI");
    expect(cl2TeamId("MARI", null)).toBe("MARI");
    expect(cl2TeamId(null, "AZ")).toBe("AZTEAM");
    expect(teamFilePrefix("MARI", "AZ")).toBe("MARI-AZ");
    expect(teamFilePrefix("MARI", null)).toBe("MARI");
    expect(teamFilePrefix(null, "AZ")).toBe("TEAM");
  });
});
