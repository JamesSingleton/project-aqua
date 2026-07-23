import type { ParsedRosterRow } from "../types";
import {
  estimateDobFromClassYear,
  extractSeasonYear,
  genderFromEventCode,
  mergeSwimmer,
  parseAusaBirthDate,
  parseGenderCode,
  parseLastFirstName,
  parseUsaMemberIdFromLine,
} from "./utils";

function parseCl2D01Line(
  line: string,
  seasonYear: number,
): (Partial<ParsedRosterRow> & { firstName: string; lastName: string }) | null {
  // Caller only invokes for D01 lines.
  const withClass = line.match(
    /^D01[A-Z0-9]{2}\s+(FR|SO|JR|SR)\s+([^,]+),\s*(.+?)(?:\s{2,})/i,
  );
  if (withClass) {
    const classYear = withClass[1]!;
    const lastName = withClass[2]!.trim();
    const firstPart = withClass[3]!;
    const firstName = firstPart
      .trim()
      .split(/\s{2,}/)[0]!
      .trim();
    const eventGender =
      line.match(/(FF|MM)\s+\d/) ?? line.match(/\d{2}(FF|MM)\s/);
    const rosterGender = line.match(/\s0\s+([MF])\s/);
    const genderCode = eventGender?.[1] ?? rosterGender?.[1];
    const gender = genderCode
      ? eventGender
        ? genderFromEventCode(eventGender[1]!)
        : parseGenderCode(genderCode)
      : undefined;

    if (!gender) return null;

    const dateOfBirth =
      parseAusaBirthDate(line) ??
      estimateDobFromClassYear(classYear!, seasonYear);

    return {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      classYear,
      usaMemberId: parseUsaMemberIdFromLine(line),
    };
  }

  const results = line.match(/^D01[A-Z0-9]{2}\s+([^,]+),\s*(.+?)\s{2,}/i);
  if (!results) return null;

  const parsedName = parseLastFirstName(
    `${results[1]}, ${results[2]!.trim().split(/\s{2,}/)[0]}`,
  );
  const eventGender =
    line.match(/(FF|MM)\s+\d/) ?? line.match(/\d{2}(FF|MM)\s/);
  const gender = eventGender
    ? genderFromEventCode(eventGender[1]!)
    : undefined;
  const dateOfBirth = parseAusaBirthDate(line);
  const usaMemberId = parseUsaMemberIdFromLine(line);

  if (!gender || !dateOfBirth) return null;

  return {
    firstName: parsedName.firstName,
    lastName: parsedName.lastName,
    gender,
    dateOfBirth,
    usaMemberId,
  };
}

/** Hy-Tek CL2 / SD3 roster extraction (Team Manager & Meet Manager exports). */
export function parseCl2Roster(content: string): ParsedRosterRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const swimmers = new Map<string, ParsedRosterRow>();
  const seasonYear = extractSeasonYear(content) ?? new Date().getFullYear();

  for (const line of lines) {
    if (line.startsWith("D01")) {
      const parsed = parseCl2D01Line(line, seasonYear);
      if (parsed) mergeSwimmer(swimmers, parsed);
      continue;
    }

    if (line.startsWith("D31")) {
      const usaMemberId = line.substring(3, 17).trim();
      const preferredName = line.substring(19, 23).trim();
      if (!usaMemberId || !preferredName) continue;

      for (const [key, row] of swimmers) {
        if (row.usaMemberId === usaMemberId) {
          swimmers.set(key, { ...row, firstName: preferredName });
        }
      }
    }
  }

  return [...swimmers.values()];
}

/** @deprecated Use parseCl2Roster */
export const parseSdifStyleRoster = parseCl2Roster;
