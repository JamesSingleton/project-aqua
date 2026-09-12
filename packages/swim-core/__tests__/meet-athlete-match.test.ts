import { describe, expect, it } from "vitest";
import {
  fileAthleteKey,
  type MatchFileAthlete,
  type MatchRosterAthlete,
  matchResultAthletes,
} from "../src/meet-athlete-match";

const roster: MatchRosterAthlete[] = [
  {
    membershipId: "m1",
    swimmerId: "s1",
    firstName: "Will",
    lastName: "Burns",
    dateOfBirth: "1989-11-15",
    governingBodyId: "ABCD1234567890",
  },
  {
    membershipId: "m2",
    swimmerId: "s2",
    firstName: "Ellen",
    lastName: "Currin",
    preferredName: "Ellie",
    dateOfBirth: "1988-06-18",
  },
  {
    membershipId: "m3",
    swimmerId: "s3",
    firstName: "Sam",
    lastName: "Smith",
    dateOfBirth: "2012-01-01",
  },
  {
    membershipId: "m4",
    swimmerId: "s4",
    firstName: "Alex",
    lastName: "Smith",
    dateOfBirth: "2012-01-01",
  },
];

describe("fileAthleteKey", () => {
  it("prefers USA member id", () => {
    expect(
      fileAthleteKey({
        swimmerName: "Will Burns",
        usaMemberId: "abcd1234567890",
      }),
    ).toBe("usa:ABCD1234567890");
  });

  it("falls back to name and dob", () => {
    expect(
      fileAthleteKey({
        swimmerName: "Will Burns",
        dateOfBirth: "1989-11-15",
      }),
    ).toBe("name:will burns|dob:1989-11-15");
  });
});

describe("matchResultAthletes", () => {
  it("matches on USA Swimming id", () => {
    const results: MatchFileAthlete[] = [
      {
        swimmerName: "W. Burns",
        usaMemberId: "ABCD1234567890",
        dateOfBirth: "1989-11-15",
      },
    ];
    const matched = matchResultAthletes(roster, results);
    expect(matched.matched).toHaveLength(1);
    expect(matched.matched[0]?.matched?.reason).toBe("usa_id");
    expect(matched.matched[0]?.matched?.membershipId).toBe("m1");
  });

  it("matches on name and date of birth", () => {
    const results: MatchFileAthlete[] = [
      {
        swimmerName: "Will Burns",
        dateOfBirth: "1989-11-15",
      },
    ];
    const matched = matchResultAthletes(roster, results);
    expect(matched.matched[0]?.matched?.reason).toBe("name_dob");
  });

  it("matches unique exact name without dob", () => {
    const results: MatchFileAthlete[] = [{ swimmerName: "Ellie Currin" }];
    const matched = matchResultAthletes(roster, results);
    expect(matched.matched).toHaveLength(1);
    expect(matched.matched[0]?.matched?.reason).toBe("name");
    expect(matched.matched[0]?.matched?.membershipId).toBe("m2");
  });

  it("marks ambiguous when last name and dob collide", () => {
    const results: MatchFileAthlete[] = [
      {
        swimmerName: "Sammy Smith",
        dateOfBirth: "2012-01-01",
      },
    ];
    const matched = matchResultAthletes(roster, results);
    expect(matched.ambiguous.length).toBeGreaterThanOrEqual(1);
    expect(matched.matched).toHaveLength(0);
    expect(matched.ambiguous[0]?.candidates.length).toBeGreaterThanOrEqual(1);
  });

  it("leaves unknown athletes unmatched", () => {
    const results: MatchFileAthlete[] = [
      {
        swimmerName: "Paterson Jensen",
        dateOfBirth: "1988-11-01",
        teamCode: "PDC",
      },
    ];
    const matched = matchResultAthletes(roster, results);
    expect(matched.unmatched).toHaveLength(1);
    expect(matched.unmatched[0]?.teamCode).toBe("PDC");
    expect(matched.matched).toHaveLength(0);
  });

  it("dedupes multiple results for the same athlete", () => {
    const results: MatchFileAthlete[] = [
      { swimmerName: "Will Burns", dateOfBirth: "1989-11-15" },
      { swimmerName: "Will Burns", dateOfBirth: "1989-11-15" },
      { swimmerName: "Will Burns", dateOfBirth: "1989-11-15" },
    ];
    const matched = matchResultAthletes(roster, results);
    expect(matched.athletes).toHaveLength(1);
    expect(matched.athletes[0]?.resultCount).toBe(3);
  });
});
