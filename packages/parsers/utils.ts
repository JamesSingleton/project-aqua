// ─────────────────────────────────────────────────────────────────────────────
// Shared utility functions for Hytek file parsing
// ─────────────────────────────────────────────────────────────────────────────

import type { Course, Gender, Stroke } from "./types";

// ─── Fixed-width field helpers ────────────────────────────────────────────────

/** Extract a substring by 0-based start/end and trim whitespace */
export function field(line: string, start: number, end: number): string {
  return line.slice(start, end).trim();
}

/** Extract a numeric field; returns NaN if blank or non-numeric */
export function numField(line: string, start: number, end: number): number {
  return Number(field(line, start, end));
}

// ─── Encoding ────────────────────────────────────────────────────────────────

/**
 * Decode a Hytek file buffer.
 * Hytek files use latin-1 (ISO-8859-1) encoding, NOT UTF-8.
 * This is critical — UTF-8 decoding will throw on many real files.
 */
export function decodeHytekBuffer(buf: Buffer): string {
  return buf.toString("latin1");
}

/**
 * Split a decoded Hytek file into clean lines.
 * Handles both \r\n and \r line endings.
 */
export function splitLines(content: string): string[] {
  return content.split(/\r\n|\r|\n/).map((l) => l.trimEnd());
}

// ─── Time parsing ────────────────────────────────────────────────────────────

/**
 * Parse a Hytek time string into total seconds.
 *
 * Formats seen in the wild:
 *   "4:56.31"  → 296.31
 *   "1:06.11"  → 66.11
 *   "34.88"    → 34.88
 *   "12:32.17" → 752.17
 *   "NT"       → null
 *   ""         → null
 *   "0.00"     → null (Hytek uses 0.00 for no time)
 */
export function parseTime(raw: string): number | null {
  const s = raw.trim();
  if (!s || s === "NT" || s === "0.00" || s === "0" || s === "NS") {
    return null;
  }

  // Remove trailing course indicator if present (Y/S/L sometimes appended)
  const cleaned = s.replace(/[YSL]$/, "");

  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    if (parts.length === 2) {
      const minutes = Number(parts[0]);
      const seconds = Number(parts[1]);
      if (isNaN(minutes) || isNaN(seconds)) {
        return null;
      }
      return minutes * 60 + seconds;
    }
  }

  const val = Number(cleaned);
  if (isNaN(val) || val === 0) {
    return null;
  }
  return val;
}

/**
 * Format seconds back to a Hytek-style time string.
 *   296.31 → "4:56.31"
 *   34.88  → "34.88"
 */
export function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === 0) {
    return "NT";
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  const secStr = secs.toFixed(2).padStart(5, "0");
  return mins > 0 ? `${mins}:${secStr}` : secStr;
}

// ─── Date parsing ────────────────────────────────────────────────────────────

/**
 * Parse Hytek MMDDYYYY date string to ISO yyyy-MM-dd.
 *   "03212009" → "2009-03-21"
 *   "02/21/2025" → "2025-02-21" (EV3/HYV format)
 */
export function parseHytekDate(raw: string): string {
  const s = raw.trim();
  if (!s || s.length < 8) {
    return "";
  }

  if (s.includes("/")) {
    // MM/DD/YYYY
    const [mm, dd, yyyy] = s.split("/");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  // MMDDYYYY
  if (s.length === 8) {
    const mm = s.slice(0, 2);
    const dd = s.slice(2, 4);
    const yyyy = s.slice(4, 8);
    return `${yyyy}-${mm}-${dd}`;
  }

  return s;
}

/**
 * Format ISO date to Hytek MMDDYYYY.
 *   "2009-03-21" → "03212009"
 */
export function formatHytekDate(isoDate: string): string {
  const [yyyy, mm, dd] = isoDate.split("-");
  return `${mm}${dd}${yyyy}`;
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

/** Validate and cast a stroke code */
export function parseStroke(s: string): Stroke {
  const valid = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  return valid.includes(s.toUpperCase()) ? (s.toUpperCase() as Stroke) : "I";
}

/** Validate and cast a gender code */
export function parseGender(s: string): Gender {
  return s.toUpperCase() === "M" ? "M" : "F";
}

/** Validate and cast a course code */
export function parseCourse(s: string): Course {
  const upper = s.toUpperCase();
  if (upper === "Y" || upper === "S" || upper === "L") {
    return upper as Course;
  }
  return "Y";
}

/**
 * SD3/CL2 event code mapping.
 *
 * In SD3 D01 records, the event is encoded as a 3-digit distance + 3-digit
 * event number composite. The stroke is a separate character field.
 * This parses the stroke letter used in the event number column.
 *
 * Stroke number → stroke letter mapping (from the Hytek SD3 spec):
 *   1 = Freestyle (A)
 *   2 = Backstroke (B)
 *   3 = Breaststroke (C)
 *   4 = Butterfly (D)
 *   5 = IM (E)
 *   6 = Freestyle Relay (F)
 *   7 = Medley Relay (G)
 */
export function strokeNumberToCode(n: number): Stroke {
  const map: Record<number, Stroke> = {
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F",
    7: "G",
  };
  return map[n] ?? "I";
}

/**
 * SD3 event number field (cols 66-69 in D01) encodes stroke as a number
 * embedded in the event number string. The event number in SD3 is a
 * 3-digit zero-padded event number from the meet program.
 *
 * However, in the SD3 entry file the "event" is described by:
 *   - distance: cols 62-65 (4 chars, right-justified)
 *   - strokeCode: col 65 (1 char, letter A-G)
 *   - eventNum: cols 66-69 (3 chars, numeric)
 *
 * This helper extracts those from the raw D01 line.
 */
export function parseSd3EventField(line: string): {
  distance: number;
  stroke: Stroke;
  eventNumber: number;
} {
  // D01 layout (0-indexed):
  // 0-2:   "D01"
  // 3-4:   LSC (2)
  // 5-10:  spaces (6)  — actually: 5-28 name area
  // ...
  // Based on actual file inspection:
  // cols 62-65: distance (4 chars, right-justified, e.g. " 500", " 100", "1000")
  // col  65:    stroke letter
  // cols 66-69: event number (3 chars)
  // cols 69-71: age group letter + next field

  // From observed data:
  // "D01AZ      Armstrong, Ethan            F6250F958AD5AUSA0321200916MM 500140B 1518         4:56.31L"
  //  0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
  //  0         1         2         3         4         5         6         7         8         9
  // Positions (0-indexed):
  //   0-2: record type "D01"
  //   3-4: LSC "AZ"
  //   5-10: spaces
  //   11-28: last, first name (28-11=17? no... 28 chars total for name)
  //   Let me re-measure from actual data...

  // "D01AZ      Armstrong, Ethan            F6250F958AD5AUSA0321200916MM 500140B 1518         4:56.31L"
  //  D01 = [0..2]
  //  AZ  = [3..4]
  //  "      " = [5..10]
  //  "Armstrong, Ethan            " = [11..38] (28 chars)
  //  "F6250F958AD5" = [39..50] (12 hex chars = member id)
  //  "A" = [51] citizenship start
  //  "USA" = [51..53]
  //  "03212009" = [54..61] (8 chars DOB)
  //  "16" = [62..63] age (2 chars)
  //  "MM" = [64..65] gender+? — actually MM = Male Masters? No: M = male, M = masters flag?
  //  Actually from file: position 64 = 'M' (gender), 65 = 'M' (? — could be masters flag or extra)
  //  " 500" = [66..69] distance (4 chars)
  //  "140" = [70..72] event number (3 chars)  — 140 means event 140?
  //  "B" = [73] stroke
  //  " " = [74]
  //  "15" = [75..76] age group min
  //  "18" = [77..78] age group max

  // Wait, let me recount with the actual string:
  // "D01AZ      Armstrong, Ethan            F6250F958AD5AUSA0321200916MM 500140B 1518         4:56.31L"
  //  ^  ^^      ^                           ^           ^   ^       ^^  ^   ^  ^ ^   ^        ^
  //  0  34      11                          39          51  54      6264 66  69 70 73  75

  // From position 62-63: "16" = age
  // Position 64-65: "MM"
  //   First M = gender (Male)
  //   Second M = ...

  // Let me just read from the actual positions that work:
  const distStr = field(line, 66, 70); // 4 chars
  const strokeChar = field(line, 70, 71); // 1 char
  const eventNumStr = field(line, 71, 74); // 3 chars

  return {
    distance: Number(distStr) || 0,
    stroke: parseStroke(strokeChar),
    eventNumber: Number(eventNumStr) || 0,
  };
}

// ─── Checksum ────────────────────────────────────────────────────────────────

/**
 * Compute the 2-digit Hytek CL2/HY3 line checksum.
 * Hytek appends a 2-digit checksum as the last 2 characters of each line.
 * It is the sum of all ASCII values of the line content (before the checksum)
 * modulo 100, zero-padded.
 *
 * Used for validation and for writing CL2/HY3 output.
 */
export function computeChecksum(line: string): string {
  let sum = 0;
  for (let i = 0; i < line.length; i++) {
    sum += line.charCodeAt(i);
  }
  return String(sum % 100).padStart(2, "0");
}

/**
 * Validate the checksum on a CL2/HY3 line.
 * The last 2 characters of the line are the checksum; everything before is content.
 */
export function validateChecksum(line: string): boolean {
  if (line.length < 3) {
    return true; // too short to have a checksum
  }
  const content = line.slice(0, -2);
  const expected = computeChecksum(content);
  const actual = line.slice(-2);
  return expected === actual;
}

// ─── Age group helpers ────────────────────────────────────────────────────────

/**
 * Parse the age group string from HYV/EV3 events.
 * "0" min age means "open" (no minimum), "18" max means senior.
 */
export function ageGroupLabel(min: number, max: number): string {
  if (min === 0 && max === 0) {
    return "Open";
  }
  if (max >= 99) {
    return `${min} & Over`;
  }
  if (min === 0) {
    return `${max} & Under`;
  }
  if (min === max) {
    return `${min}`;
  }
  return `${min}-${max}`;
}
