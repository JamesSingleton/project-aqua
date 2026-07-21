const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export function swimmerAge(
  dateOfBirth: string | Date,
  asOf: Date = new Date(),
): number {
  const dob =
    typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  return Math.floor((asOf.getTime() - dob.getTime()) / MS_PER_YEAR);
}

export function isMinorSwimmer(
  dateOfBirth: string | Date,
  asOf: Date = new Date(),
): boolean {
  return swimmerAge(dateOfBirth, asOf) < 18;
}

/** USA Swimming style season label, e.g. "2025-2026" (Sep–Aug). */
export function currentSeasonYear(asOf: Date = new Date()): string {
  const year = asOf.getFullYear();
  const month = asOf.getMonth();
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export type SeasonDateRange = {
  label: string;
  startsOn: string;
  endsOn: string;
};

function padDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Sep 1 – Aug 31 range for a season label like "2025-2026". */
export function seasonRangeFromLabel(label: string): SeasonDateRange | null {
  const match = /^(\d{4})-(\d{4})$/.exec(label.trim());
  if (!match) return null;
  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1) return null;
  return {
    label: `${startYear}-${endYear}`,
    startsOn: padDate(startYear, 9, 1),
    endsOn: padDate(endYear, 8, 31),
  };
}

export function currentSeasonRange(asOf: Date = new Date()): SeasonDateRange {
  const label = currentSeasonYear(asOf);
  const range = seasonRangeFromLabel(label);
  if (!range) {
    throw new Error(`Invalid current season label: ${label}`);
  }
  return range;
}

/** Next season after a label like "2025-2026" → "2026-2027". */
export function nextSeasonLabel(label: string): string | null {
  const range = seasonRangeFromLabel(label);
  if (!range) return null;
  const startYear = Number(range.label.split("-")[0]);
  return `${startYear + 1}-${startYear + 2}`;
}

export function nextSeasonRange(fromLabel: string): SeasonDateRange | null {
  const next = nextSeasonLabel(fromLabel);
  return next ? seasonRangeFromLabel(next) : null;
}
