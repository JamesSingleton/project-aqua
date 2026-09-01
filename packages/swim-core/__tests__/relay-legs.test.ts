import { describe, expect, it } from "vitest";
import {
  deriveRelayLetter,
  isRelayAlternateSlot,
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
});
