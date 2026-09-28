import { parseClassYear } from "@lane4hq/swim-core/team-types";
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

function optionalContacts(values: {
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  emergencyName?: string;
  emergencyPhone?: string;
}) {
  const parentName = values.parentName?.trim();
  const parentEmail = values.parentEmail?.trim();
  const parentPhone = values.parentPhone?.trim();
  const emergencyName = values.emergencyName?.trim();
  const emergencyPhone = values.emergencyPhone?.trim();
  if (
    !parentName &&
    !parentEmail &&
    !parentPhone &&
    !emergencyName &&
    !emergencyPhone
  ) {
    return undefined;
  }
  return {
    parentName: parentName || undefined,
    parentEmail: parentEmail || undefined,
    parentPhone: parentPhone || undefined,
    emergencyName: emergencyName || undefined,
    emergencyPhone: emergencyPhone || undefined,
  };
}

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

    const middleName = get("middle_name") || undefined;
    const preferredName = get("preferred_name") || undefined;
    const contacts = optionalContacts({
      parentName: get("parent_name"),
      parentEmail: get("parent_email"),
      parentPhone: get("parent_phone"),
      emergencyName: get("emergency_name"),
      emergencyPhone: get("emergency_phone"),
    });

    rows.push({
      firstName,
      lastName,
      ...(middleName ? { middleName } : {}),
      ...(preferredName ? { preferredName } : {}),
      dateOfBirth: get(map.dateOfBirth),
      gender: parseGender(get(map.gender)),
      practiceGroup: classFromGroup ? undefined : practiceGroup,
      classYear: classYear ?? undefined,
      usaMemberId: map.usaMemberId ? get(map.usaMemberId) : undefined,
      sourceLine: i + 1,
      ...(contacts ? { contacts } : {}),
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
