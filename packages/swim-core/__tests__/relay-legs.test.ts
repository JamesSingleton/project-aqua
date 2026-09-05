import { describe, expect, it } from "vitest";
import {
  canAssignRacingRelayLeg,
  deriveRelayLetter,
  formatAssignmentCountLine,
  isRelayAlternateSlot,
  racingRelayCount,
  racingRelayKeysByMember,
  racingRelayTeamKey,
  relayLegRoleLabel,
  relayLetterFromIndex,
  relaySlotLabel,
  strokeForRelayLeg,
} from "../src/relay-legs";

describe("relay slots", () => {
  it("labels primary legs and alternates #5–#8", () => {
    expect(isRelayAlternateSlot(4)).toBe(false);
    expect(isRelayAlternateSlot(5)).toBe(true);
    expect(relaySlotLabel(1)).toBe("Leg 1");
    expect(relaySlotLabel(8)).toBe("Alt 8");
    expect(relayLegRoleLabel("medley_relay", 1)).toBe("Back");
    expect(relayLegRoleLabel("medley_relay", 2)).toBe("Breast");
    expect(relayLegRoleLabel("medley_relay", 3)).toBe("Fly");
    expect(relayLegRoleLabel("medley_relay", 4)).toBe("Free");
    expect(relayLegRoleLabel("free_relay", 1)).toBe("Free");
    expect(relayLegRoleLabel("free_relay", 4)).toBe("Free");
    expect(relayLegRoleLabel("medley_relay", 5)).toBe("Alt 5");
  });

  it("formats lane-board event and alt counts", () => {
    expect(formatAssignmentCountLine(0, 0)).toBe("0 events");
    expect(formatAssignmentCountLine(1, 0)).toBe("1 event");
    expect(formatAssignmentCountLine(2, 1)).toBe("2 events · 1 alt");
    expect(formatAssignmentCountLine(0, 1)).toBe("1 alt");
    expect(formatAssignmentCountLine(1, 2)).toBe("1 event · 2 alts");
  });

  it("maps medley and free-relay slots onto split strokes", () => {
    expect(strokeForRelayLeg("medley_relay", 1)).toBe("back");
    expect(strokeForRelayLeg("200_medley_relay", 3)).toBe("fly");
    expect(strokeForRelayLeg("free_relay", 4)).toBe("free");
    expect(strokeForRelayLeg("medley_relay", 6)).toBe("breast");
  });

  it("derives team letters from stored values or legacy 4-leg packing", () => {
    expect(relayLetterFromIndex(0)).toBe("A");
    expect(relayLetterFromIndex(2)).toBe("C");
    expect(relayLetterFromIndex(9)).toBe("A");
    expect(deriveRelayLetter(" b ", 1)).toBe("B");
    expect(deriveRelayLetter("", 5)).toBe("B");
    expect(deriveRelayLetter(null, 9)).toBe("C");
  });

  it("counts unique named racing teams, ignoring alternates", () => {
    const legs = [
      {
        membershipId: "xaria",
        meetEventId: "mr",
        relayLetter: "A",
        legOrder: 3,
      },
      {
        membershipId: "xaria",
        meetEventId: "mr",
        relayLetter: "A",
        legOrder: 5,
      },
      {
        membershipId: "xaria",
        meetEventId: "fr",
        relayLetter: "A",
        legOrder: 1,
      },
    ];
    expect(racingRelayCount(legs, "xaria")).toBe(2);
    expect(racingRelayCount(legs, "nobody")).toBe(0);
    expect(racingRelayTeamKey("mr", "  ")).toBe("mr:A");
    expect(
      racingRelayKeysByMember([
        {
          membershipId: "xaria",
          meetEventId: "mr",
          relayLetter: "A",
          legOrder: 0,
        },
      ]).size,
    ).toBe(0);
    expect(
      canAssignRacingRelayLeg({
        limits: {
          maxIndividualEntries: null,
          maxRelayEntries: 2,
          maxCombinedEntries: null,
          entryLimitPackages: null,
        },
        individualCount: 2,
        legs,
        membershipId: "xaria",
        meetEventId: "mr",
        relayLetter: "A",
      }),
    ).toEqual({ ok: true });
    expect(
      canAssignRacingRelayLeg({
        limits: {
          maxIndividualEntries: null,
          maxRelayEntries: 2,
          maxCombinedEntries: null,
          entryLimitPackages: null,
        },
        individualCount: 2,
        legs,
        membershipId: "xaria",
        meetEventId: "im",
        relayLetter: "A",
      }).ok,
    ).toBe(false);
    expect(
      canAssignRacingRelayLeg({
        limits: null,
        individualCount: 0,
        legs: [],
        membershipId: "a",
        meetEventId: "e",
        relayLetter: "A",
      }),
    ).toEqual({ ok: true });
  });
});
