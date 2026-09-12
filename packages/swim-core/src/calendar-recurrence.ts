export type CalendarEventDraft = {
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt?: Date;
  eventType?: "practice" | "meet" | "other";
  createdByUserId?: string;
};

/** JS `Date#getDay()` values: 0 = Sunday … 6 = Saturday. */
export type WeeklyCalendarSlot = {
  weekdays: number[];
  /** Local wall time `HH:mm`. */
  startTime: string;
  /** Local wall time `HH:mm`. */
  endTime: string;
};

export type RecurringCalendarScheduleInput = {
  title: string;
  description?: string;
  location?: string;
  eventType?: "practice" | "meet" | "other";
  /** Inclusive range as YYYY-MM-DD (local calendar days). */
  rangeStart: string;
  rangeEnd: string;
  slots: WeeklyCalendarSlot[];
  createdByUserId?: string;
};

export const MAX_BULK_CALENDAR_EVENTS = 250;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseTimeParts(time: string): { hours: number; minutes: number } {
  const match = TIME_RE.exec(time.trim());
  if (!match) {
    throw new Error(`Invalid time: ${time}`);
  }
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

function parseLocalDateOnlyStrict(value: string): Date {
  if (!DATE_RE.test(value)) {
    throw new Error(`Invalid date: ${value}`);
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function atLocalTime(day: Date, time: string): Date {
  const { hours, minutes } = parseTimeParts(time);
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}

/**
 * Expand weekly day/time slots across an inclusive local date range into
 * concrete calendar events (rows are materialised — no RRULE storage).
 */
export function expandWeeklyCalendarSlots(
  input: RecurringCalendarScheduleInput,
): CalendarEventDraft[] {
  if (!input.title.trim()) {
    throw new Error("Title is required");
  }
  if (!input.slots.length) {
    throw new Error("Add at least one weekly time slot");
  }

  const rangeStart = parseLocalDateOnlyStrict(input.rangeStart);
  const rangeEnd = parseLocalDateOnlyStrict(input.rangeEnd);
  if (rangeEnd < rangeStart) {
    throw new Error("End date must be on or after the start date");
  }

  const events: CalendarEventDraft[] = [];
  const cursor = new Date(rangeStart);

  while (cursor <= rangeEnd) {
    const weekday = cursor.getDay();
    for (const slot of input.slots) {
      if (!slot.weekdays.includes(weekday)) continue;

      const startsAt = atLocalTime(cursor, slot.startTime);
      let endsAt = atLocalTime(cursor, slot.endTime);
      if (endsAt <= startsAt) {
        endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
      }

      events.push({
        title: input.title.trim(),
        description: input.description,
        location: input.location,
        startsAt,
        endsAt,
        eventType: input.eventType ?? "practice",
        createdByUserId: input.createdByUserId,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (events.length === 0) {
    throw new Error("No dates matched the selected weekdays in that range");
  }
  if (events.length > MAX_BULK_CALENDAR_EVENTS) {
    throw new Error(
      `That schedule would create ${events.length} events (max ${MAX_BULK_CALENDAR_EVENTS}). Narrow the date range or weekdays.`,
    );
  }

  return events;
}

/**
 * Count how many occurrences a weekly schedule would produce without building
 * full event drafts. Returns null when the range is incomplete/invalid.
 */
export function countWeeklyCalendarOccurrences(input: {
  rangeStart: string;
  rangeEnd: string;
  slots: Pick<WeeklyCalendarSlot, "weekdays">[];
}): number | null {
  if (
    !input.rangeStart ||
    !input.rangeEnd ||
    input.rangeEnd < input.rangeStart
  ) {
    return null;
  }
  if (!DATE_RE.test(input.rangeStart) || !DATE_RE.test(input.rangeEnd)) {
    return null;
  }

  const rangeStart = parseLocalDateOnlyStrict(input.rangeStart);
  const rangeEnd = parseLocalDateOnlyStrict(input.rangeEnd);
  const cursor = new Date(rangeStart);
  let count = 0;

  while (cursor <= rangeEnd) {
    const weekday = cursor.getDay();
    for (const slot of input.slots) {
      if (slot.weekdays.includes(weekday)) count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}
