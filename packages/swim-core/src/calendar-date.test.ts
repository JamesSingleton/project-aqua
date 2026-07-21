import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  daysBetweenDateOnly,
  formatDateOnly,
  formatDateOnlyLabel,
  isUtcCalendarDay,
  normalizeMeetEndDate,
  parseDateOnly,
  seasonTrainingPhase,
} from "./calendar-date.ts";

describe("calendar-date", () => {
  it("parses YYYY-MM-DD as UTC midnight", () => {
    const date = parseDateOnly("2025-10-25");
    assert.ok(date);
    assert.equal(date.toISOString(), "2025-10-25T00:00:00.000Z");
  });

  it("rejects invalid calendar dates", () => {
    assert.equal(parseDateOnly("2025-02-30"), null);
    assert.equal(parseDateOnly("10/25/2025"), null);
    assert.equal(parseDateOnly(""), null);
  });

  it("formats UTC midnight without local shift", () => {
    const date = new Date("2025-10-25T00:00:00.000Z");
    assert.equal(formatDateOnly(date), "2025-10-25");
    assert.match(formatDateOnlyLabel(date, "en-US"), /10\/25\/2025/);
    assert.equal(isUtcCalendarDay(date, 2025, 9, 25), true);
  });

  it("drops end date when it matches start", () => {
    assert.equal(
      normalizeMeetEndDate("2025-10-21", "2025-10-21"),
      undefined,
    );
    assert.equal(
      normalizeMeetEndDate("2025-10-21", "2025-10-22"),
      "2025-10-22",
    );
  });

  it("computes days between date-only values", () => {
    assert.equal(daysBetweenDateOnly("2026-08-10", "2026-08-10"), 0);
    assert.equal(daysBetweenDateOnly("2026-08-10", "2026-08-17"), 7);
  });

  it("resolves season training phase from start/end", () => {
    assert.deepEqual(seasonTrainingPhase("2026-07-20", "2026-08-10", "2026-11-07"), {
      status: "before",
      startsOn: "2026-08-10",
    });
    assert.deepEqual(seasonTrainingPhase("2026-08-10", "2026-08-10", "2026-11-07"), {
      status: "during",
      week: 1,
      startsOn: "2026-08-10",
      endsOn: "2026-11-07",
    });
    assert.deepEqual(seasonTrainingPhase("2026-08-17", "2026-08-10", "2026-11-07"), {
      status: "during",
      week: 2,
      startsOn: "2026-08-10",
      endsOn: "2026-11-07",
    });
    assert.deepEqual(seasonTrainingPhase("2026-11-08", "2026-08-10", "2026-11-07"), {
      status: "after",
      endsOn: "2026-11-07",
    });
  });
});
