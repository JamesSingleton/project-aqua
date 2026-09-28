import type { RosterImportRawRow } from "@lane4hq/swim-core/roster-import";
import type { ParsedRosterRow } from "../types";

export function parsedRosterRowToImportRaw(
  row: ParsedRosterRow,
): RosterImportRawRow {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    middleName: row.middleName,
    preferredName: row.preferredName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    practiceGroup: row.practiceGroup,
    classYear: row.classYear,
    usaMemberId: row.usaMemberId,
    contacts: row.contacts,
  };
}

export function rosterImportRowNumber(
  row: ParsedRosterRow,
  fallback: number,
): number {
  return row.sourceLine ?? fallback;
}
