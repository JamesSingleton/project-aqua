import { describe, expect, it } from "vitest";
import {
  associationCountWithinCap,
  canAddRelayTeam,
  canAddScoringEntry,
  formatAssociationCapLine,
  resolveAssociationEventCaps,
} from "../src/association-event-caps";

describe("resolveAssociationEventCaps", () => {
  const team = {
    maxScoringEntriesPerIndividualEvent: 4,
    maxRelayTeamsPerEvent: 1,
  };

  it("uses team defaults when the meet has no override", () => {
    expect(resolveAssociationEventCaps(team, null)).toEqual(team);
    expect(resolveAssociationEventCaps(team, {})).toEqual(team);
  });

  it("lets a meet override one field and inherit the other", () => {
    expect(
      resolveAssociationEventCaps(team, {
        maxScoringEntriesPerIndividualEvent: 3,
      }),
    ).toEqual({
      maxScoringEntriesPerIndividualEvent: 3,
      maxRelayTeamsPerEvent: 1,
    });
    expect(
      resolveAssociationEventCaps(team, { maxRelayTeamsPerEvent: 2 }),
    ).toEqual({
      maxScoringEntriesPerIndividualEvent: 4,
      maxRelayTeamsPerEvent: 2,
    });
    expect(
      resolveAssociationEventCaps(team, { maxRelayTeamsPerEvent: null }),
    ).toEqual(team);
  });
});

describe("canAddScoringEntry", () => {
  it("allows exhibition even at the cap", () => {
    expect(
      canAddScoringEntry({
        cap: 4,
        currentScoringCount: 4,
        candidateIsExhibition: true,
      }).ok,
    ).toBe(true);
  });

  it("allows a scoring entry under the cap", () => {
    expect(
      canAddScoringEntry({
        cap: 4,
        currentScoringCount: 3,
        candidateIsExhibition: false,
      }).ok,
    ).toBe(true);
  });

  it("uses singular copy at cap 1", () => {
    const result = canAddScoringEntry({
      cap: 1,
      currentScoringCount: 1,
      candidateIsExhibition: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/1 scoring entry/);
  });

  it("blocks a scoring entry at the cap", () => {
    const result = canAddScoringEntry({
      cap: 4,
      currentScoringCount: 4,
      candidateIsExhibition: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/4 scoring entries/);
    }
  });

  it("treats blank or zero cap as unlimited", () => {
    expect(
      canAddScoringEntry({
        cap: null,
        currentScoringCount: 10,
        candidateIsExhibition: false,
      }).ok,
    ).toBe(true);
    expect(
      canAddScoringEntry({
        cap: 0,
        currentScoringCount: 10,
        candidateIsExhibition: false,
      }).ok,
    ).toBe(true);
  });
});

describe("canAddRelayTeam", () => {
  it("blocks a second team when the cap is 1", () => {
    const result = canAddRelayTeam({ cap: 1, currentRacingTeamCount: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/1 relay team/);
  });

  it("allows a first team", () => {
    expect(canAddRelayTeam({ cap: 1, currentRacingTeamCount: 0 }).ok).toBe(
      true,
    );
  });

  it("is unlimited when blank", () => {
    expect(canAddRelayTeam({ cap: null, currentRacingTeamCount: 9 }).ok).toBe(
      true,
    );
  });

  it("uses plural copy at cap 2", () => {
    const result = canAddRelayTeam({ cap: 2, currentRacingTeamCount: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/2 relay teams/);
  });
});

describe("associationCountWithinCap", () => {
  it("blocks scoring counts over the cap", () => {
    const result = associationCountWithinCap(4, 5, "scoring");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/4 scoring entries/);
  });

  it("uses singular scoring copy at cap 1", () => {
    const result = associationCountWithinCap(1, 2, "scoring");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/1 scoring entry/);
  });
});

describe("formatAssociationCapLine", () => {
  it("returns null when unlimited", () => {
    expect(
      formatAssociationCapLine({
        maxScoringEntriesPerIndividualEvent: null,
        maxRelayTeamsPerEvent: null,
      }),
    ).toBeNull();
  });

  it("summarizes both caps", () => {
    expect(
      formatAssociationCapLine({
        maxScoringEntriesPerIndividualEvent: 4,
        maxRelayTeamsPerEvent: 1,
      }),
    ).toBe(
      "4 scoring swimmers per individual event; 1 relay team per relay event",
    );
  });

  it("summarizes a single individual cap", () => {
    expect(
      formatAssociationCapLine({
        maxScoringEntriesPerIndividualEvent: 1,
        maxRelayTeamsPerEvent: null,
      }),
    ).toBe("1 scoring swimmer per individual event");
  });

  it("summarizes a single relay cap", () => {
    expect(
      formatAssociationCapLine({
        maxScoringEntriesPerIndividualEvent: null,
        maxRelayTeamsPerEvent: 2,
      }),
    ).toBe("2 relay teams per relay event");
  });
});
