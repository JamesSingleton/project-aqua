import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  expandWeeklyCalendarSlots,
  MAX_BULK_CALENDAR_EVENTS,
} from "./calendar-recurrence.ts";

describe("expandWeeklyCalendarSlots", () => {
  it("expands MWF morning and TTh afternoon across a short range", () => {
    const events = expandWeeklyCalendarSlots({
      title: "Practice",
      eventType: "practice",
      rangeStart: "2026-08-10", // Monday
      rangeEnd: "2026-08-16", // Sunday
      slots: [
        { weekdays: [1, 3, 5], startTime: "05:00", endTime: "06:30" },
        { weekdays: [2, 4], startTime: "15:45", endTime: "18:00" },
      ],
    });

    assert.equal(events.length, 5);
    assert.equal(events[0]?.startsAt.getDay(), 1);
    assert.equal(events[0]?.startsAt.getHours(), 5);
    assert.equal(events[0]?.endsAt?.getMinutes(), 30);
    assert.equal(events[1]?.startsAt.getDay(), 2);
    assert.equal(events[1]?.startsAt.getHours(), 15);
    assert.equal(events[1]?.startsAt.getMinutes(), 45);
  });

  it("rejects schedules that exceed the bulk cap", () => {
    assert.throws(
      () =>
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
      new RegExp(String(MAX_BULK_CALENDAR_EVENTS)),
    );
  });
});
