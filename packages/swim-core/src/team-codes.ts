/** Hy-Tek team abbreviation: 2–5 letters/digits, typically 4 (MARI, DSUN, AZSL). */
export const TEAM_CODE_MAX_LENGTH = 5;
export const LSC_CODE_LENGTH = 2;

export function normalizeTeamCode(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const raw = value.trim().toUpperCase();
  const combined = raw.match(/^([A-Z0-9]{2,5})-([A-Z]{2})$/);
  if (combined) return combined[1]!;
  const code = raw.replace(/[^A-Z0-9]/g, "");
  if (code.length < 2) return null;
  return code.slice(0, TEAM_CODE_MAX_LENGTH);
}

/** USA Swimming LSC: exactly 2 letters (AZ, GA, PC). */
export function normalizeLscCode(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const code = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (code.length !== LSC_CODE_LENGTH) return null;
  return code;
}

/** CL2 concatenates LSC + abbrev (`AZMARI`). HY3 uses abbrev alone (`MARI`). */
export function cl2TeamId(
  teamCode: string | null | undefined,
  lscCode: string | null | undefined,
): string {
  const code = normalizeTeamCode(teamCode) ?? "TEAM";
  const lsc = normalizeLscCode(lscCode);
  return lsc ? `${lsc}${code}`.slice(0, 8) : code;
}

/** Folder/file stem like `MARI-AZ-Entries-…`. */
export function teamFilePrefix(
  teamCode: string | null | undefined,
  lscCode: string | null | undefined,
): string {
  const code = normalizeTeamCode(teamCode);
  if (!code) return "TEAM";
  const lsc = normalizeLscCode(lscCode);
  return lsc ? `${code}-${lsc}` : code;
}
