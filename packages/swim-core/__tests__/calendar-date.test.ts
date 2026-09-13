import { describe, expect, it } from "vitest";
import * as calendarDate from "../src/calendar-date";

describe("calendar-date", () => {
  it("parses YYYY-MM-DD as UTC midnight", () => {
    const date = calendarDate.parseDateOnly("2025-10-25");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2025-10-25T00:00:00.000Z");
  });

  it("rejects invalid calendar dates", () => {
    expect(calendarDate.parseDateOnly("2025-02-30")).toBeNull();
    expect(calendarDate.parseDateOnly("10/25/2025")).toBeNull();
    expect(calendarDate.parseDateOnly("")).toBeNull();
  });

  it("formats UTC midnight without local shift", () => {
    const date = new Date("2025-10-25T00:00:00.000Z");
    expect(calendarDate.formatDateOnly(date)).toBe("2025-10-25");
    expect(calendarDate.formatDateOnlyLabel(date, "en-US")).toMatch(
      /10\/25\/2025/,
    );
    expect(calendarDate.isUtcCalendarDay(date, 2025, 9, 25)).toBe(true);
    expect(calendarDate.isUtcCalendarDay(date, 2025, 9, 26)).toBe(false);
  });

  it("drops end date when it matches start", () => {
    expect(
      calendarDate.normalizeMeetEndDate("2025-10-21", "2025-10-21"),
    ).toBeUndefined();
    expect(calendarDate.normalizeMeetEndDate("2025-10-21", "2025-10-22")).toBe(
      "2025-10-22",
    );
    expect(calendarDate.normalizeMeetEndDate(undefined, "2025-10-22")).toBe(
      "2025-10-22",
    );
    expect(
      calendarDate.normalizeMeetEndDate("2025-10-21", undefined),
    ).toBeUndefined();
  });

  it("computes days between date-only values", () => {
    expect(calendarDate.daysBetweenDateOnly("2026-08-10", "2026-08-10")).toBe(
      0,
    );
    expect(calendarDate.daysBetweenDateOnly("2026-08-10", "2026-08-17")).toBe(
      7,
    );
    expect(
      calendarDate.daysBetweenDateOnly("invalid", "2026-08-17"),
    ).toBeNull();
  });

  it("resolves season training phase from start/end", () => {
    expect(
      calendarDate.seasonTrainingPhase(
        "2026-07-20",
        "2026-08-10",
        "2026-11-07",
      ),
    ).toEqual({
      status: "before",
      startsOn: "2026-08-10",
    });
    expect(
      calendarDate.seasonTrainingPhase(
        "2026-08-10",
        "2026-08-10",
        "2026-11-07",
      ),
    ).toEqual({
      status: "during",
      week: 1,
      startsOn: "2026-08-10",
      endsOn: "2026-11-07",
    });
    expect(
      calendarDate.seasonTrainingPhase(
        "2026-08-17",
        "2026-08-10",
        "2026-11-07",
      ),
    ).toEqual({
      status: "during",
      week: 2,
      startsOn: "2026-08-10",
      endsOn: "2026-11-07",
    });
    expect(
      calendarDate.seasonTrainingPhase(
        "2026-11-08",
        "2026-08-10",
        "2026-11-07",
      ),
    ).toEqual({
      status: "after",
      endsOn: "2026-11-07",
    });
  });

  it("returns null for invalid season training phase inputs", () => {
    expect(
      calendarDate.seasonTrainingPhase("bad", "2026-08-10", "2026-11-07"),
    ).toBeNull();
    expect(
      calendarDate.seasonTrainingPhase("2026-08-10", "bad", "2026-11-07"),
    ).toBeNull();
    expect(
      calendarDate.seasonTrainingPhase("2026-08-10", "2026-08-10", "bad"),
    ).toBeNull();
  });

  describe("local date helpers", () => {
    it("parseLocalDateOnly parses and rejects invalid values", () => {
      const date = calendarDate.parseLocalDateOnly("2025-10-25");
      expect(date).toBeInstanceOf(Date);
      expect(calendarDate.formatLocalDateOnly(date!)).toBe("2025-10-25");
      expect(calendarDate.parseLocalDateOnly("")).toBeUndefined();
      expect(calendarDate.parseLocalDateOnly("2025-02-30")).toBeUndefined();
      expect(calendarDate.parseLocalDateOnly("not-a-date")).toBeUndefined();
    });

    it("formatLocalDateOnlyLabel formats short and long months", () => {
      expect(calendarDate.formatLocalDateOnlyLabel("2025-10-25")).toMatch(
        /Oct/,
      );
      expect(
        calendarDate.formatLocalDateOnlyLabel("2025-10-25", "long"),
      ).toMatch(/October/);
      expect(calendarDate.formatLocalDateOnlyLabel("invalid")).toBeNull();
    });

    it("parseDateTimeLocal splits date and time", () => {
      expect(calendarDate.parseDateTimeLocal("")).toEqual({
        date: undefined,
        time: "",
      });
      const parsed = calendarDate.parseDateTimeLocal("2025-10-25T14:30");
      expect(parsed.date).toBeInstanceOf(Date);
      expect(parsed.time).toBe("14:30");
      expect(calendarDate.parseDateTimeLocal("2025-10-25Tbad")).toEqual({
        date: calendarDate.parseLocalDateOnly("2025-10-25"),
        time: "",
      });
      expect(calendarDate.parseDateTimeLocal("badT14:30")).toEqual({
        date: undefined,
        time: "14:30",
      });
      expect(calendarDate.parseDateTimeLocal("T14:30")).toEqual({
        date: undefined,
        time: "14:30",
      });
    });

    it("formatDateTimeLocal and toDateTimeLocalValue", () => {
      const date = new Date(2025, 9, 25, 9, 5);
      expect(calendarDate.formatDateTimeLocal(date, "09:05")).toBe(
        "2025-10-25T09:05",
      );
      expect(calendarDate.formatDateTimeLocal(date, "")).toBe(
        "2025-10-25T00:00",
      );
      expect(calendarDate.toDateTimeLocalValue(date)).toBe("2025-10-25T09:05");
    });

    it("formatDateTimeLocalLabel with and without time", () => {
      expect(calendarDate.formatDateTimeLocalLabel("2025-10-25T14:30")).toMatch(
        /·/,
      );
      expect(calendarDate.formatDateTimeLocalLabel("2025-10-25T")).toMatch(
        /Oct/,
      );
      expect(calendarDate.formatDateTimeLocalLabel("2025-10-25T14")).toMatch(
        /Oct/,
      );
      expect(calendarDate.formatDateTimeLocalLabel("invalid")).toBeNull();
    });

    it("daysUntilDateOnly counts whole days", () => {
      expect(calendarDate.daysUntilDateOnly("2026-08-17", "2026-08-10")).toBe(
        7,
      );
      expect(calendarDate.daysUntilDateOnly("2026-08-10", "2026-08-10")).toBe(
        0,
      );
    });

    it("deadlineUrgencyLevel buckets urgency", () => {
      expect(calendarDate.deadlineUrgencyLevel(3, true)).toBe("done");
      expect(calendarDate.deadlineUrgencyLevel(null, false)).toBe("ok");
      expect(calendarDate.deadlineUrgencyLevel(-1, false)).toBe("urgent");
      expect(calendarDate.deadlineUrgencyLevel(5, false)).toBe("urgent");
      expect(calendarDate.deadlineUrgencyLevel(10, false)).toBe("soon");
      expect(calendarDate.deadlineUrgencyLevel(30, false)).toBe("ok");
    });
  });

  it("formats best-time achieved labels with optional meet name", () => {
    const date = new Date("2026-03-12T00:00:00.000Z");
    const formatDate = () => "Mar 12, 2026";
    expect(
      calendarDate.formatBestTimeAchievedLabel(
        date,
        "State Championships",
        formatDate,
      ),
    ).toBe("State Championships · Mar 12, 2026");
    expect(
      calendarDate.formatBestTimeAchievedLabel(date, "  ", formatDate),
    ).toBe("Mar 12, 2026");
    expect(
      calendarDate.formatBestTimeAchievedLabel(date, null, formatDate),
    ).toBe("Mar 12, 2026");
  });

  it("snapshots meet names without a live meet join", () => {
    expect(
      calendarDate.snapshotBestTimeMeetName({
        nextMeetId: null,
        resolvedName: "Invite",
      }),
    ).toBeNull();
    expect(
      calendarDate.snapshotBestTimeMeetName({
        nextMeetId: "meet-1",
        resolvedName: "  Dual  ",
      }),
    ).toBe("Dual");
    expect(
      calendarDate.snapshotBestTimeMeetName({
        nextMeetId: "meet-1",
        resolvedName: null,
        existing: { meetId: "meet-1", meetName: "State Championships" },
      }),
    ).toBe("State Championships");
    expect(
      calendarDate.snapshotBestTimeMeetName({
        nextMeetId: "meet-2",
        resolvedName: null,
        existing: { meetId: "meet-1", meetName: "State Championships" },
      }),
    ).toBeNull();
    expect(
      calendarDate.snapshotBestTimeMeetName({
        nextMeetId: "meet-1",
        resolvedName: "",
        existing: { meetId: "meet-1", meetName: null },
      }),
    ).toBeNull();
  });
});
