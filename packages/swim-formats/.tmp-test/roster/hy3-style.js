import {
  estimateDobFromClassYear,
  extractSeasonYear,
  mergeSwimmer,
} from "./utils";

/** Hy-Tek Team Manager HY3 roster lines: D1M / D1F */
function parseHy3D1Line(line, seasonYear) {
  if (!/^D1[MF]/.test(line)) return null;
  const gender = line.charAt(2) === "F" ? "female" : "male";
  const lastName = line.substring(8, 28).trim();
  const firstName = line.substring(28, 48).trim();
  const classMatch = line.match(/\b(FR|SO|JR|SR)\b/);
  const classYear = classMatch?.[1];
  if (!lastName && !firstName) return null;
  return {
    firstName: firstName || "Unknown",
    lastName: lastName || "Swimmer",
    gender,
    dateOfBirth: classYear
      ? estimateDobFromClassYear(classYear, seasonYear)
      : undefined,
    practiceGroup: classYear,
  };
}
/** Hy-Tek .HY3 roster extraction (Rosters Only & meet entry files). */
export function parseHy3Roster(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const swimmers = new Map();
  const seasonYear = extractSeasonYear(content) ?? new Date().getFullYear();
  for (const line of lines) {
    if (line.startsWith("D1")) {
      const parsed = parseHy3D1Line(line, seasonYear);
      if (parsed) mergeSwimmer(swimmers, parsed);
    }
  }
  return [...swimmers.values()];
}
/** @deprecated Use parseHy3Roster */
export const parseHy3StyleRoster = parseHy3Roster;
