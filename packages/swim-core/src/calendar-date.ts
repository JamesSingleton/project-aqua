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
  if (days == null || days < 0) return null;
  return {
    status: "during",
    week: Math.floor(days / 7) + 1,
    startsOn,
    endsOn,
  };
}
