import { describe, expect, it } from "vitest";
import {
  canAddMeetEntry,
  checkQualifyingTime,
  formatEntryLimitsSummary,
  isRelayStroke,
} from "../src/entry-limits";

describe("isRelayStroke", () => {
  it("detects relay strokes and keys", () => {
    expect(isRelayStroke("free_relay")).toBe(true);
    expect(isRelayStroke("medley_relay")).toBe(true);
    expect(isRelayStroke("200_medley_relay")).toBe(true);
    expect(isRelayStroke("free", "200_free_relay_scy_m")).toBe(true);
    expect(isRelayStroke("free")).toBe(false);
  });
});

describe("canAddMeetEntry", () => {
  it("allows when limits are null", () => {
    expect(canAddMeetEntry(null, { individual: 0, relay: 0 }, false)).toEqual({
      ok: true,
    });
    expect(
      canAddMeetEntry(undefined, { individual: 0, relay: 0 }, true),
    ).toEqual({ ok: true });
  });

  it("enforces entry limit packages", () => {
    const limits = {
      maxIndividualEntries: null,
      maxRelayEntries: null,
      maxCombinedEntries: null,
      entryLimitPackages: [{ individual: 2, relay: 1 }],
    };
    expect(canAddMeetEntry(limits, { individual: 1, relay: 0 }, false)).toEqual(
      { ok: true },
    );
    expect(canAddMeetEntry(limits, { individual: 1, relay: 1 }, false)).toEqual(
      { ok: true },
    );
    expect(canAddMeetEntry(limits, { individual: 2, relay: 0 }, false)).toEqual(
      {
        ok: false,
        reason: expect.stringContaining("Entry limits exceeded"),
      },
    );
    expect(canAddMeetEntry(limits, { individual: 2, relay: 1 }, true)).toEqual({
      ok: false,
      reason: expect.stringContaining("Entry limits exceeded"),
    });
  });

  it("ignores malformed packages and uses scalar limits", () => {
    const limits = {
      maxIndividualEntries: 2,
      maxRelayEntries: 1,
      maxCombinedEntries: 2,
      entryLimitPackages: [{ individual: "x" as unknown as number, relay: 1 }],
    };
    expect(canAddMeetEntry(limits, { individual: 1, relay: 0 }, false)).toEqual(
      { ok: true },
    );
    expect(canAddMeetEntry(limits, { individual: 1, relay: 1 }, true)).toEqual({
      ok: false,
      reason: "Maximum relay entries is 1.",
    });
    expect(canAddMeetEntry(limits, { individual: 1, relay: 1 }, false)).toEqual(
      {
        ok: false,
        reason: "Maximum combined entries is 2.",
      },
    );
    expect(canAddMeetEntry(limits, { individual: 2, relay: 0 }, false)).toEqual(
      {
        ok: false,
        reason: "Maximum individual entries is 2.",
      },
    );
  });
});

describe("checkQualifyingTime", () => {
  it("allows when there is no qualifying time", () => {
    expect(checkQualifyingTime(null, 65000)).toEqual({ ok: true });
    expect(checkQualifyingTime(undefined, 65000)).toEqual({ ok: true });
    expect(checkQualifyingTime(0, 65000)).toEqual({ ok: true });
  });

  it("allows no-time (NT) entries even when a QT is set", () => {
    expect(checkQualifyingTime(60000, null)).toEqual({ ok: true });
    expect(checkQualifyingTime(60000, undefined)).toEqual({ ok: true });
    expect(checkQualifyingTime(60000, 0)).toEqual({ ok: true });
  });

  it("allows a seed at or faster than the QT", () => {
    expect(checkQualifyingTime(60000, 60000)).toEqual({ ok: true });
    expect(checkQualifyingTime(60000, 59500)).toEqual({ ok: true });
  });

  it("flags a submitted seed slower than the QT with an explanation", () => {
    const result = checkQualifyingTime(60000, 65000);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; reason: string }).reason).toBe(
      "Seed time 1:05.00 is slower than the meet qualifying time 1:00.00. Enter a faster time, or clear the seed to submit as no-time (NT).",
    );
  });
});

describe("formatEntryLimitsSummary", () => {
  it("formats packages and scalar limits", () => {
    expect(formatEntryLimitsSummary(null)).toBeNull();
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: null,
        maxRelayEntries: null,
        maxCombinedEntries: null,
        entryLimitPackages: [{ individual: 3, relay: 2 }],
      }),
    ).toBe("3I + 2R");
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: 3,
        maxRelayEntries: 2,
        maxCombinedEntries: 4,
        entryLimitPackages: null,
      }),
    ).toBe("3 individual · 2 relay · 4 combined");
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: null,
        maxRelayEntries: null,
        maxCombinedEntries: null,
        entryLimitPackages: null,
      }),
    ).toBeNull();
  });
});
