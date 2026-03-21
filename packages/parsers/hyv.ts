// ─────────────────────────────────────────────────────────────────────────────
// HYV Parser — Meet event export files from Hy-Tek Meet Manager
//
// Format: semicolon-delimited CSV
// Line 1: meet header
// Lines 2+: one event per line
//
// Example header:
//   "AZSI 2025 Short Course Regional Championship;02/21/2025;02/23/2025;02/21/2025;Y;CHS Kerry Croswhite Aquatic Center;;Hy-Tek Sports Software;8.0Fd;CN;9179S"
//
// Example event line:
//   "1A;F;F;I;13;14;400;5;4:58.19;6:08.49;;8.5;5:37.39;6:43.39;5:30.99;6:32.09;;"
//
//   Fields: eventCode; roundType; gender; eventType; ageMin; ageMax; distance;
//            stroke; aCut; bCut; (empty); entryFee; slow5; fast5; slow4; fast4; (extra)...
//
// Stroke in HYV is numeric position in event code:
//   Event code "1A" → stroke = A (col [1] of eventCode)
//   Event code "13B" → stroke = B (last char of eventCode)
// ─────────────────────────────────────────────────────────────────────────────

import type { EventType, HyvEvent, HyvFile, HyvMeet, Stroke } from "./types";
import {
  decodeHytekBuffer,
  parseCourse,
  parseGender,
  parseHytekDate,
  parseStroke,
  parseTime,
  splitLines,
} from "./utils";

const UPPERCASE_A_G_REGEX = /[A-G]/;

// ─── Stroke from event code ───────────────────────────────────────────────────

/**
 * In HYV files, the stroke is the LAST character of the event code for
 * individual events (e.g. "1A" = freestyle, "13B" = backstroke).
 * For relay events, the event code is a plain number like "25".
 * The stroke field (col 7, 0-indexed) is the numeric stroke code:
 *   1=Free, 2=Back, 3=Breast, 4=Fly, 5=IM, 6=Free Relay, 7=Medley Relay
 */
function parseHyvStroke(strokeField: string, eventCode: string): Stroke {
  // Prefer the stroke number field if present
  const n = Number(strokeField);
  if (!Number.isNaN(n) && n >= 1 && n <= 7) {
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

  // Fall back to last char of event code
  const lastChar = eventCode.slice(-1).toUpperCase();
  if (UPPERCASE_A_G_REGEX.test(lastChar)) {
    return parseStroke(lastChar);
  }

  return "I";
}

// ─── Header parsing ───────────────────────────────────────────────────────────

function parseHyvHeader(line: string): HyvMeet {
  // Strip trailing checksum if present (last token after final ;)
  const parts = line.split(";");

  return {
    name: parts[0]?.trim() ?? "",
    startDate: parseHytekDate(parts[1]?.trim() ?? ""),
    endDate: parseHytekDate(parts[2]?.trim() ?? ""),
    firstDayDate: parseHytekDate(parts[3]?.trim() ?? ""),
    course: parseCourse(parts[4]?.trim() ?? "Y"),
    facility: parts[5]?.trim() ?? "",
    softwareName: parts[7]?.trim() ?? "",
    softwareVersion: parts[8]?.trim() ?? "",
  };
}

// ─── Event parsing ────────────────────────────────────────────────────────────

/**
 * Parse one HYV event line.
 *
 * Column layout (semicolon-delimited, 0-indexed):
 *  0: eventCode      e.g. "1A", "13B", "25"
 *  1: roundType      "F" = finals, "P" = prelims
 *  2: gender         "F" | "M"
 *  3: eventType      "I" = individual, "R" = relay
 *  4: ageMin         e.g. "13"
 *  5: ageMax         e.g. "14" (99 = open/senior)
 *  6: distance       e.g. "400"
 *  7: stroke         numeric: 1-7 (A-G)
 *  8: aCut           e.g. "4:58.19" (fastest required time)
 *  9: bCut           e.g. "6:08.49" (slowest allowed time)
 * 10: (empty)
 * 11: entryFee       e.g. "8.5"
 * 12: slow5          5th heat time standard (slow end)
 * 13: fast5          5th heat time standard (fast end)
 * 14: slow4          4th heat time standard
 * 15: fast4          4th heat time standard
 * 16: (empty or more standards)
 */
function parseHyvEvent(line: string): HyvEvent | null {
  // Strip trailing checksum-like token (e.g. ";9179S" at end of header)
  const parts = line.split(";");
  if (parts.length < 7) {
    return null;
  }

  const eventCode = parts[0]?.trim() ?? "";
  if (!eventCode) {
    return null;
  }

  const roundType = (parts[1]?.trim() ?? "F") as "F" | "P";
  const gender = parseGender(parts[2]?.trim() ?? "F");
  const eventType = (parts[3]?.trim() ?? "I") as EventType;
  const ageMin = Number(parts[4]?.trim() ?? "0") || 0;
  const ageMax = Number(parts[5]?.trim() ?? "0") || 0;
  const distance = Number(parts[6]?.trim() ?? "0") || 0;
  const stroke = parseHyvStroke(parts[7]?.trim() ?? "", eventCode);

  const aCut = parseTime(parts[8]?.trim() ?? "");
  const bCut = parseTime(parts[9]?.trim() ?? "");
  const entryFee = Number(parts[11]?.trim() ?? "0") || 0;

  // Time standards: cols 12+ in pairs (slow, fast) for each heat tier
  const timeStandards: (number | null)[] = [];
  for (let i = 12; i < parts.length; i++) {
    const t = parts[i]?.trim();
    if (t !== undefined && t !== "") {
      timeStandards.push(parseTime(t));
    }
  }

  return {
    eventCode,
    roundType,
    gender,
    eventType,
    ageMin,
    ageMax,
    distance,
    stroke,
    entryLimit: 0, // HYV doesn't carry this; EV3 does
    aCut,
    bCut,
    entryFee,
    timeStandards,
  };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parse a HYV file buffer into a structured object.
 *
 * Usage:
 *   const buf = fs.readFileSync("meet.hyv");
 *   const hyv = parseHyv(buf);
 */
export function parseHyv(buf: Buffer): HyvFile {
  const content = decodeHytekBuffer(buf);
  const lines = splitLines(content).filter((l: string) => l.length > 0);

  if (lines.length === 0) {
    throw new Error("HYV parse error: empty file");
  }

  const meet = parseHyvHeader(lines[0]);
  const events: HyvEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 5) {
      continue;
    }
    try {
      const event = parseHyvEvent(line);
      if (event) {
        events.push(event);
      }
    } catch {
      // Skip malformed event lines
    }
  }

  return { meet, events };
}
