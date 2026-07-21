/**
 * Helpers for calendar dates stored as timestamps at UTC midnight.
 *
 * Meet/import files give date-only values (YYYY-MM-DD). Persisting via
 * `new Date("YYYY-MM-DD")` yields UTC midnight. Formatting with local
 * getters (`getDate()`, `toLocaleDateString()`) shifts the day in US
 * timezones — always use these helpers for meet start/end dates.
 */

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse YYYY-MM-DD as UTC midnight. Returns null if invalid. */
export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_RE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Format a UTC-midnight calendar date as YYYY-MM-DD. */
export function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Human-readable label for a UTC-midnight calendar date. */
export function formatDateOnlyLabel(
  date: Date,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleDateString(locales, {
    timeZone: "UTC",
    ...options,
  });
}

/** True when `date`'s UTC calendar day matches year/month/day (0-based month). */
export function isUtcCalendarDay(
  date: Date,
  year: number,
  month: number,
  day: number,
): boolean {
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month &&
    date.getUTCDate() === day
  );
}

/** Drop end date when it matches start (single-day meet). */
export function normalizeMeetEndDate(
  startDate: string | undefined,
  endDate: string | undefined,
): string | undefined {
  if (!endDate) return undefined;
  if (startDate && endDate.slice(0, 10) === startDate.slice(0, 10)) {
    return undefined;
  }
  return endDate.slice(0, 10);
}

/** Whole days between two YYYY-MM-DD values (to − from). */
export function daysBetweenDateOnly(from: string, to: string): number | null {
  const start = parseDateOnly(from);
  const end = parseDateOnly(to);
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export type SeasonTrainingPhase =
  | { status: "before"; startsOn: string }
  | { status: "during"; week: number; startsOn: string; endsOn: string }
  | { status: "after"; endsOn: string };

/** Where `todayKey` sits relative to a season date range. Week 1 begins on startsOn. */
export function seasonTrainingPhase(
  todayKey: string,
  startsOn: string,
  endsOn: string,
): SeasonTrainingPhase | null {
  if (!DATE_ONLY_RE.test(todayKey)) return null;
  if (!DATE_ONLY_RE.test(startsOn) || !DATE_ONLY_RE.test(endsOn)) return null;
  if (todayKey < startsOn) return { status: "before", startsOn };
  if (todayKey > endsOn) return { status: "after", endsOn };
  const days = daysBetweenDateOnly(startsOn, todayKey);
  /* v8 ignore start -- defensive guard; unreachable with valid date-only inputs */
  if (days == null || days < 0) {
    return null;
  }
  /* v8 ignore stop */
  return {
    status: "during",
    week: Math.floor(days / 7) + 1,
    startsOn,
    endsOn,
  };
}

// --- Local wall-clock date helpers (forms / pickers; not UTC midnight) ---

/** Parse YYYY-MM-DD as a local calendar day. */
export function parseLocalDateOnly(value: string): Date | undefined {
  if (!value) return undefined;
  const match = DATE_ONLY_RE.exec(value.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
}

/** Format a local Date as YYYY-MM-DD. */
export function formatLocalDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Human-readable label for a local YYYY-MM-DD value. */
export function formatLocalDateOnlyLabel(
  value: string,
  month: "short" | "long" = "short",
): string | null {
  const date = parseLocalDateOnly(value);
  if (!date) return null;
  return date.toLocaleDateString("en-US", {
    month,
    day: "numeric",
    year: "numeric",
  });
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse `YYYY-MM-DDTHH:mm` (datetime-local) into local date + HH:mm. */
export function parseDateTimeLocal(value: string): {
  date: Date | undefined;
  time: string;
} {
  if (!value) return { date: undefined, time: "" };
  const [datePart, timePart = ""] = value.split("T");
  const date = parseLocalDateOnly(datePart /* v8 ignore next */ ?? "");
  if (!date) return { date: undefined, time: timePart };
  const time = timePart.slice(0, 5);
  return {
    date,
    time: /^\d{2}:\d{2}$/.test(time) ? time : "",
  };
}

/** Format local date + HH:mm as datetime-local value. */
export function formatDateTimeLocal(date: Date, time: string): string {
  const datePart = formatLocalDateOnly(date);
  const timePart = time || "00:00";
  return `${datePart}T${timePart}`;
}

/** Human-readable label for a datetime-local value. */
export function formatDateTimeLocalLabel(value: string): string | null {
  const { date, time } = parseDateTimeLocal(value);
  if (!date) return null;
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (!time) return dateLabel;
  const [hours, minutes] = time.split(":").map(Number);
  const withTime = new Date(date);
  withTime.setHours(
    hours /* v8 ignore next */ ?? 0,
    minutes /* v8 ignore next */ ?? 0,
    0,
    0,
  );
  const timeLabel = withTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateLabel} · ${timeLabel}`;
}

/** Current local moment as datetime-local string. */
export function toDateTimeLocalValue(date: Date = new Date()): string {
  return formatDateTimeLocal(
    date,
    `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
  );
}

/**
 * Whole days from todayKey to dateOnly using noon local anchors
 * (avoids DST edge cases on date-only strings).
 */
export function daysUntilDateOnly(dateOnly: string, todayKey: string): number {
  const start = new Date(`${dateOnly}T12:00:00`);
  const today = new Date(`${todayKey}T12:00:00`);
  return Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
}

export type DeadlineUrgency = "done" | "urgent" | "soon" | "ok";

/** Bucket a deadline by days remaining (and completion). */
export function deadlineUrgencyLevel(
  days: number | null,
  complete: boolean,
): DeadlineUrgency {
  if (complete) return "done";
  if (days == null) return "ok";
  if (days < 0) return "urgent";
  if (days <= 7) return "urgent";
  if (days <= 14) return "soon";
  return "ok";
}
