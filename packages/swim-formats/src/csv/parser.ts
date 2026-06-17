import type { ParsedRosterRow } from "../types.js";

export interface CsvColumnMapping {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  practiceGroup?: string;
  usaMemberId?: string;
}

const DEFAULT_MAPPING: CsvColumnMapping = {
  firstName: "first_name",
  lastName: "last_name",
  dateOfBirth: "date_of_birth",
  gender: "gender",
  practiceGroup: "practice_group",
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

    rows.push({
      firstName,
      lastName,
      dateOfBirth: get(map.dateOfBirth),
      gender: parseGender(get(map.gender)),
      practiceGroup: map.practiceGroup ? get(map.practiceGroup) : undefined,
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
        row.usaMemberId ?? "",
      ].join(delimiter),
    );
  }

  return lines.join("\n");
}
