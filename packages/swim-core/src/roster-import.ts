import { parseClassYear } from "./team-types";
import {
  type RosterFileImportRow,
  rosterFileImportRowSchema,
  type SwimmerContactsInput,
} from "./validators";

export type RosterImportRowError = {
  row: number;
  name: string;
  field: string;
  message: string;
};

/** Parsed roster file row before `rosterRowSchema` validation. */
export type RosterImportRawRow = {
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth: string;
  gender: "male" | "female";
  practiceGroup?: string;
  classYear?: string;
  usaMemberId?: string;
  contacts?: SwimmerContactsInput;
};

export type RosterImportValidatedRow = {
  row: number;
  data: RosterFileImportRow;
};

export type RosterImportValidationResult = {
  valid: RosterImportValidatedRow[];
  invalid: RosterImportRowError[];
};

function rosterImportRowName(raw: RosterImportRawRow): string {
  const parts = [raw.firstName, raw.lastName]
    .map((p) => p?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown swimmer";
}

function zodPathToField(path: PropertyKey[]): string {
  if (path.length === 0) return "row";
  return path.map(String).join(".");
}

function rawToRosterRow(raw: RosterImportRawRow): RosterFileImportRow {
  const classYear = raw.classYear ? parseClassYear(raw.classYear) : null;
  return {
    firstName: raw.firstName.trim(),
    lastName: raw.lastName.trim(),
    middleName: raw.middleName?.trim() || undefined,
    preferredName: raw.preferredName?.trim() || undefined,
    dateOfBirth: raw.dateOfBirth.trim(),
    gender: raw.gender,
    practiceGroup: raw.practiceGroup?.trim() || undefined,
    classYear: classYear ?? undefined,
    usaMemberId: raw.usaMemberId?.trim() || undefined,
    contacts: raw.contacts,
  };
}

export function formatRosterImportField(path: PropertyKey[]): string {
  return zodPathToField(path);
}

export function collectRosterImportRowErrors(
  row: number,
  raw: RosterImportRawRow,
): RosterImportRowError[] {
  const name = rosterImportRowName(raw);
  const parsed = rosterFileImportRowSchema.safeParse(rawToRosterRow(raw));
  if (parsed.success) return [];

  return parsed.error.issues.map((issue) => ({
    row,
    name,
    field: zodPathToField(issue.path),
    message: issue.message,
  }));
}

export function validateRosterImportRows(
  rows: Array<{ row: number; data: RosterImportRawRow }>,
): RosterImportValidationResult {
  const valid: RosterImportValidatedRow[] = [];
  const invalid: RosterImportRowError[] = [];

  for (const entry of rows) {
    const rowErrors = collectRosterImportRowErrors(entry.row, entry.data);
    if (rowErrors.length > 0) {
      invalid.push(...rowErrors);
      continue;
    }
    const parsed = rosterFileImportRowSchema.parse(rawToRosterRow(entry.data));
    valid.push({ row: entry.row, data: parsed });
  }

  return { valid, invalid };
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeRosterImportErrorsCsv(
  errors: RosterImportRowError[],
): string {
  const header = "row,name,field,message";
  const lines = errors.map((e) =>
    [e.row, e.name, e.field, e.message]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );
  return [header, ...lines].join("\n");
}
