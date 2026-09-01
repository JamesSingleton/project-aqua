import { parseClassYear } from "@project-aqua/swim-core/team-types";
import type { ParsedRosterRow } from "../types";

export interface CsvColumnMapping {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  practiceGroup?: string;
  classYear?: string;
  usaMemberId?: string;
}

const DEFAULT_MAPPING: CsvColumnMapping = {
  firstName: "first_name",
  lastName: "last_name",
  dateOfBirth: "date_of_birth",
  gender: "gender",
  practiceGroup: "practice_group",
  classYear: "class_year",
  usaMemberId: "usa_member_id",
};

function parseGender(value: string): "male" | "female" {
  const v = value.toLowerCase().trim();
  if (v === "m" || v === "male" || v === "boy") return "male";
  return "female";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseRosterCsv(
  content: string,
  mapping: Partial<CsvColumnMapping> = {},
  delimiter = ",",
): ParsedRosterRow[] {
  const map = { ...DEFAULT_MAPPING, ...mapping };
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]!, delimiter).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_"),
  );

  const getIndex = (key: string) => headers.indexOf(key.toLowerCase());

  const rows: ParsedRosterRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!, delimiter);
    const get = (key: string) => values[getIndex(key)] ?? "";

    const firstName = get(map.firstName);
    const lastName = get(map.lastName);
    if (!firstName && !lastName) continue;

    const practiceGroup = map.practiceGroup
      ? get(map.practiceGroup) || undefined
      : undefined;
    const explicitClass = map.classYear
      ? parseClassYear(get(map.classYear))
      : null;
    const classFromGroup = practiceGroup ? parseClassYear(practiceGroup) : null;
    const classYear = explicitClass ?? classFromGroup ?? undefined;

    rows.push({
      firstName,
      lastName,
      dateOfBirth: get(map.dateOfBirth),
      gender: parseGender(get(map.gender)),
      practiceGroup: classFromGroup ? undefined : practiceGroup,
      classYear: classYear ?? undefined,
      usaMemberId: map.usaMemberId ? get(map.usaMemberId) : undefined,
    });
  }

  return rows;
}

export function exportRosterCsv(
  rows: ParsedRosterRow[],
  delimiter = ",",
): string {
  const headers = [
    "first_name",
    "last_name",
    "date_of_birth",
    "gender",
    "practice_group",
    "class_year",
    "usa_member_id",
  ];
  const lines = [headers.join(delimiter)];

  for (const row of rows) {
    lines.push(
      [
        row.firstName,
        row.lastName,
        row.dateOfBirth,
        row.gender,
        row.practiceGroup ?? "",
        row.classYear ?? "",
        row.usaMemberId ?? "",
      ].join(delimiter),
    );
  }

  return lines.join("\n");
}

export type ParsedTimesCsvRow = {
  firstName: string;
  lastName: string;
  eventKey: string;
  time: string;
  course?: string;
  achievedOn?: string;
};

export function parseTimesCsv(
  content: string,
  delimiter = ",",
): ParsedTimesCsvRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]!, delimiter).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_"),
  );
  const getIndex = (key: string) => headers.indexOf(key);

  const rows: ParsedTimesCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!, delimiter);
    const get = (key: string) => values[getIndex(key)] ?? "";

    const firstName = get("first_name");
    const lastName = get("last_name");
    const eventKey = get("event_key");
    const time = get("time");
    if (!firstName && !lastName) continue;
    if (!eventKey.trim() || !time.trim()) continue;

    const course = get("course").trim() || undefined;
    const achievedOn = get("achieved_on").trim() || undefined;
    rows.push({
      firstName,
      lastName,
      eventKey: eventKey.trim(),
      time: time.trim(),
      course,
      achievedOn,
    });
  }

  return rows;
}
