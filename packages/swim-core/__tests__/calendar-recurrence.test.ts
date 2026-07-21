import { describe, expect, it } from "vitest";
import {
  countWeeklyCalendarOccurrences,
  expandWeeklyCalendarSlots,
  MAX_BULK_CALENDAR_EVENTS,
} from "../src/calendar-recurrence";

describe("expandWeeklyCalendarSlots", () => {
  it("expands MWF morning and TTh afternoon across a short range", () => {
    const events = expandWeeklyCalendarSlots({
      title: "Practice",
      eventType: "practice",
      rangeStart: "2026-08-10",
      rangeEnd: "2026-08-16",
      slots: [
        { weekdays: [1, 3, 5], startTime: "05:00", endTime: "06:30" },
        { weekdays: [2, 4], startTime: "15:45", endTime: "18:00" },
      ],
    });

    expect(events).toHaveLength(5);
    expect(events[0]?.startsAt.getDay()).toBe(1);
    expect(events[0]?.startsAt.getHours()).toBe(5);
    expect(events[0]?.endsAt?.getMinutes()).toBe(30);
    expect(events[1]?.startsAt.getDay()).toBe(2);
    expect(events[1]?.startsAt.getHours()).toBe(15);
    expect(events[1]?.startsAt.getMinutes()).toBe(45);
  });

  it("rolls overnight end times to the next day", () => {
    const events = expandWeeklyCalendarSlots({
      title: "Night practice",
      rangeStart: "2026-08-10",
      rangeEnd: "2026-08-10",
      slots: [{ weekdays: [1], startTime: "22:00", endTime: "06:00" }],
    });

    expect(events).toHaveLength(1);
    const start = events[0]!.startsAt;
    const end = events[0]!.endsAt!;
    expect(end.getTime() - start.getTime()).toBe(8 * 60 * 60 * 1000);
  });

  it("rejects schedules that exceed the bulk cap", () => {
    expect(() =>
      expandWeeklyCalendarSlots({
        title: "Practice",
        rangeStart: "2026-01-01",
        rangeEnd: "2027-12-31",
        slots: [
          {
            weekdays: [0, 1, 2, 3, 4, 5, 6],
            startTime: "05:00",
            endTime: "06:00",
          },
        ],
      }),
    ).toThrow(new RegExp(String(MAX_BULK_CALENDAR_EVENTS)));
  });

  it("rejects empty title", () => {
    expect(() =>
      expandWeeklyCalendarSlots({
        title: "   ",
        rangeStart: "2026-08-10",
        rangeEnd: "2026-08-10",
        slots: [{ weekdays: [1], startTime: "05:00", endTime: "06:00" }],
      }),
    ).toThrow("Title is required");
  });

  it("rejects no slots", () => {
    expect(() =>
      expandWeeklyCalendarSlots({
        title: "Practice",
        rangeStart: "2026-08-10",
        rangeEnd: "2026-08-16",
        slots: [],
      }),
    ).toThrow("Add at least one weekly time slot");
  });

  it("rejects invalid dates and end before start", () => {
    expect(() =>
      expandWeeklyCalendarSlots({
        title: "Practice",
        rangeStart: "bad-date",
        rangeEnd: "2026-08-16",
        slots: [{ weekdays: [1], startTime: "05:00", endTime: "06:00" }],
      }),
    ).toThrow("Invalid date");

    expect(() =>
      expandWeeklyCalendarSlots({
        title: "Practice",
        rangeStart: "2026-08-16",
        rangeEnd: "2026-08-10",
        slots: [{ weekdays: [1], startTime: "05:00", endTime: "06:00" }],
      }),
    ).toThrow("End date must be on or after the start date");
  });

  it("rejects invalid time", () => {
    expect(() =>
      expandWeeklyCalendarSlots({
        title: "Practice",
        rangeStart: "2026-08-10",
        rangeEnd: "2026-08-10",
        slots: [{ weekdays: [1], startTime: "25:00", endTime: "06:00" }],
      }),
    ).toThrow("Invalid time");
  });

  it("rejects when no weekdays match the range", () => {
    expect(() =>
      expandWeeklyCalendarSlots({
        title: "Practice",
        rangeStart: "2026-08-10",
        rangeEnd: "2026-08-10",
        slots: [{ weekdays: [0], startTime: "05:00", endTime: "06:00" }],
      }),
    ).toThrow("No dates matched the selected weekdays in that range");
  });
});

describe("countWeeklyCalendarOccurrences", () => {
  it("counts occurrences across a range", () => {
    expect(
      countWeeklyCalendarOccurrences({
        rangeStart: "2026-08-10",
        rangeEnd: "2026-08-16",
        slots: [{ weekdays: [1, 3, 5] }, { weekdays: [2, 4] }],
      }),
    ).toBe(5);
  });

  it("returns null for incomplete or invalid ranges", () => {
    expect(
      countWeeklyCalendarOccurrences({
        rangeStart: "",
        rangeEnd: "2026-08-16",
        slots: [{ weekdays: [1] }],
      }),
    ).toBeNull();
    expect(
      countWeeklyCalendarOccurrences({
        rangeStart: "2026-08-16",
        rangeEnd: "2026-08-10",
        slots: [{ weekdays: [1] }],
      }),
    ).toBeNull();
    expect(
      countWeeklyCalendarOccurrences({
        rangeStart: "2026-08-10",
        rangeEnd: "bad-end",
        slots: [{ weekdays: [1] }],
      }),
    ).toBeNull();
    expect(
      countWeeklyCalendarOccurrences({
        rangeStart: "bad-start",
        rangeEnd: "2026-08-16",
        slots: [{ weekdays: [1] }],
      }),
    ).toBeNull();
  });
});
