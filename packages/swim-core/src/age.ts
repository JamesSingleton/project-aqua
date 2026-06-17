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

export function currentSeasonYear(asOf: Date = new Date()): string {
  const year = asOf.getFullYear();
  const month = asOf.getMonth();
  // USA swimming season typically Sep–Aug
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}
