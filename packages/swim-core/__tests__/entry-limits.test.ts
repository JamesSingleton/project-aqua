import { describe, expect, it } from "vitest";
import {
  canAddMeetEntry,
  checkMeetEntryCounts,
  checkQualifyingTime,
  formatEntryCountsSentence,
  formatEntryLimitsSummary,
  formatFilledCapAdvice,
  isRelayStroke,
  maximalEntryLimitMixes,
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

describe("checkMeetEntryCounts", () => {
  it("accepts counts that already fit", () => {
    expect(
      checkMeetEntryCounts(
        {
          maxIndividualEntries: 3,
          maxRelayEntries: 2,
          maxCombinedEntries: 4,
          entryLimitPackages: null,
        },
        { individual: 2, relay: 2 },
      ),
    ).toEqual({ ok: true });
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

describe("maximalEntryLimitMixes", () => {
  it("returns Pareto-maximal mixes for 2 individual, 3 relay, 4 combined", () => {
    expect(maximalEntryLimitMixes(null)).toEqual([]);
    expect(
      maximalEntryLimitMixes({
        maxIndividualEntries: 2,
        maxRelayEntries: 3,
        maxCombinedEntries: 4,
        entryLimitPackages: null,
      }),
    ).toEqual([
      { individual: 2, relay: 2 },
      { individual: 1, relay: 3 },
    ]);
  });

  it("uses combined as the missing type cap", () => {
    expect(
      maximalEntryLimitMixes({
        maxIndividualEntries: 2,
        maxRelayEntries: null,
        maxCombinedEntries: 4,
        entryLimitPackages: null,
      }),
    ).toEqual([
      { individual: 2, relay: 2 },
      { individual: 1, relay: 3 },
      { individual: 0, relay: 4 },
    ]);
    expect(
      maximalEntryLimitMixes({
        maxIndividualEntries: null,
        maxRelayEntries: 2,
        maxCombinedEntries: 4,
        entryLimitPackages: null,
      }),
    ).toEqual([
      { individual: 4, relay: 0 },
      { individual: 3, relay: 1 },
      { individual: 2, relay: 2 },
    ]);
  });

  it("skips mixes that would exceed the combined cap", () => {
    expect(
      maximalEntryLimitMixes({
        maxIndividualEntries: 3,
        maxRelayEntries: 1,
        maxCombinedEntries: 1,
        entryLimitPackages: null,
      }),
    ).toEqual([
      { individual: 1, relay: 0 },
      { individual: 0, relay: 1 },
    ]);
  });
});

describe("formatEntryLimitsSummary", () => {
  it("formats packages and scalar limit mixes", () => {
    expect(formatEntryLimitsSummary(null)).toBeNull();
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: null,
        maxRelayEntries: null,
        maxCombinedEntries: null,
        entryLimitPackages: [{ individual: 3, relay: 2 }],
      }),
    ).toBe("3 individual + 2 relay");
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: 2,
        maxRelayEntries: 3,
        maxCombinedEntries: 4,
        entryLimitPackages: null,
      }),
    ).toBe("2 individual + 2 relay, or 1 individual + 3 relay");
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: 3,
        maxRelayEntries: 2,
        maxCombinedEntries: 4,
        entryLimitPackages: null,
      }),
    ).toBe("3 individual + 1 relay, or 2 individual + 2 relay");
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: 3,
        maxRelayEntries: 2,
        maxCombinedEntries: null,
        entryLimitPackages: null,
      }),
    ).toBe("3 individual + 2 relay");
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: 3,
        maxRelayEntries: null,
        maxCombinedEntries: null,
        entryLimitPackages: null,
      }),
    ).toBe("up to 3 individual");
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: null,
        maxRelayEntries: 3,
        maxCombinedEntries: null,
        entryLimitPackages: null,
      }),
    ).toBe("up to 3 relay");
    expect(
      formatEntryLimitsSummary({
        maxIndividualEntries: null,
        maxRelayEntries: null,
        maxCombinedEntries: 4,
        entryLimitPackages: null,
      }),
    ).toBe("up to 4 events in any mix of individual and relay");
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

describe("formatFilledCapAdvice", () => {
  const limits = {
    maxIndividualEntries: 2,
    maxRelayEntries: 3,
    maxCombinedEntries: 4,
    entryLimitPackages: null,
  };

  it("only advises a swap that stays within each type max", () => {
    expect(formatFilledCapAdvice(limits, { individual: 2, relay: 2 })).toBe(
      "To add a racing relay, remove an individual.",
    );
    expect(formatFilledCapAdvice(limits, { individual: 1, relay: 3 })).toBe(
      "To add an individual, unassign a racing relay.",
    );
  });

  it("advises either swap when only the combined cap is binding", () => {
    expect(
      formatFilledCapAdvice(
        {
          maxIndividualEntries: null,
          maxRelayEntries: null,
          maxCombinedEntries: 4,
          entryLimitPackages: null,
        },
        { individual: 2, relay: 2 },
      ),
    ).toBe(
      "To add a racing relay, remove an individual. To add an individual, unassign a racing relay.",
    );
  });
});

describe("formatEntryCountsSentence", () => {
  it("spells out this swimmer's racing individual and relay counts", () => {
    expect(formatEntryCountsSentence({ individual: 2, relay: 0 })).toBe(
      "2 individual, 0 relay",
    );
    expect(formatEntryCountsSentence({ individual: 1, relay: 3 })).toBe(
      "1 individual, 3 relay",
    );
  });
});
