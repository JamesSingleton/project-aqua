// ─────────────────────────────────────────────────────────────────────────────
// EV3 Parser — Extended meet event export from Hy-Tek Meet Manager
//
// Format: semicolon-delimited CSV, similar to HYV but more fields
//
// Line 1: meet header (more fields than HYV)
// Lines 2+: one event per line
//
// Example header:
//   "AZSI 2025 Short Course Regional Championship;CHS Kerry Croswhite Aquatic Center;02/21/2025;..."
//
// Example event line:
//   "1;1A;F;1;I;G;13;14;400;E;0;;;N;8.5;5:37.39;6:43.39;5:30.99;6:32.09;4:58.19;6:08.49;1;1;1;04:00PM;Y;4;3;1;0*>"
//
// Note: Lines end with "*>" which is the EV3 line terminator.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Ev3Event,
  Ev3File,
  Ev3MeetHeader,
  EventType,
  Gender,
  Stroke,
} from "./types";
import {
  decodeHytekBuffer,
  parseCourse,
  parseHytekDate,
  parseStroke,
  parseTime,
  splitLines,
} from "./utils";

// ─── Stroke mapping ───────────────────────────────────────────────────────────

/**
 * EV3 uses gender codes G/B (Girls/Boys) instead of F/M.
 */
function parseEv3Gender(s: string): Gender {
  const upper = s.toUpperCase();
  if (upper === "G") {
    return "F";
  }
  if (upper === "B") {
    return "M";
  }
  if (upper === "F") {
    return "F";
  }
  if (upper === "M") {
    return "M";
  }
  return "F";
}

/**
 * EV3 stroke is a single letter A-G in the event descriptor.
 */
function parseEv3Stroke(s: string): Stroke {
  return parseStroke(s);
}

// ─── Header parsing ───────────────────────────────────────────────────────────

/**
 * EV3 header fields (semicolon-delimited):
 *  0: meetName
 *  1: facility
 *  2: startDate (MM/DD/YYYY)
 *  3: endDate
 *  4: firstDayDate
 *  5: course (YLS)
 *  6: (unknown, usually "0")
 *  7: laneCount
 *  8: (unknown)
 *  9: software name
 * 10: hostClub
 * 11: softwareVersion
 * 12: creationDate
 * 13: sessionCount
 * 14: meetSanction (e.g. "AZ24-75")
 * ...more fields
 */
function parseEv3Header(line: string): Ev3MeetHeader {
  // Strip *> terminator if present
  const cleaned = line.replace(/\*>$/, "").trim();
  const parts = cleaned.split(";");

  return {
    name: parts[0]?.trim() ?? "",
    facility: parts[1]?.trim() ?? "",
    startDate: parseHytekDate(parts[2]?.trim() ?? ""),
    endDate: parseHytekDate(parts[3]?.trim() ?? ""),
    firstDayDate: parseHytekDate(parts[4]?.trim() ?? ""),
    course: parseCourse(parts[5]?.trim() ?? "Y"),
    lscCode: "",
    hostClub: parts[10]?.trim() ?? "",
    softwareVersion: parts[11]?.trim() ?? "",
    creationDate: parseHytekDate(parts[12]?.trim() ?? ""),
    sessionCount: Number(parts[13]?.trim() ?? "0") || 0,
    meetSanction: parts[14]?.trim() ?? "",
  };
}

// ─── Event parsing ────────────────────────────────────────────────────────────

/**
 * EV3 event line fields (semicolon-delimited, *> terminated):
 *  0: sequential event number e.g. "1"
 *  1: eventCode e.g. "1A"
 *  2: round "F"=Finals, "P"=Prelims
 *  3: session number
 *  4: eventType "I"=Individual, "R"=Relay
 *  5: gender "G"=Girls(F), "B"=Boys(M)
 *  6: ageMin
 *  7: ageMax
 *  8: distance
 *  9: stroke letter (A-G)
 * 10: entryLimit (0=no limit)
 * 11: (empty)
 * 12: (empty)
 * 13: "N" = no qualifying time required
 * 14: entryFee
 * 15: slow5 (5th heat time standard, slow end)
 * 16: fast5
 * 17: slow4
 * 18: fast4
 * 19: aCut (fastest qualifying time)
 * 20: bCut (slowest qualifying time)
 * 21: (unknown)
 * 22: session order
 * 23: (unknown)
 * 24: startTime e.g. "04:00PM"
 * 25: "Y"/"N"
 * 26: laneCount
 * 27: heatCount estimate
 * 28: (unknown)
 * 29: "0"
 */
function parseEv3Event(line: string): Ev3Event | null {
  const cleaned = line.replace(/\*>$/, "").trim();
  const parts = cleaned.split(";");
  if (parts.length < 10) {
    return null;
  }

  const eventNumber = Number(parts[0]?.trim() ?? "0") || 0;
  const eventCode = parts[1]?.trim() ?? "";
  if (!eventCode) {
    return null;
  }

  const round = (parts[2]?.trim() ?? "F") as "F" | "P";
  const session = Number(parts[3]?.trim() ?? "1") || 1;
  const eventType = (parts[4]?.trim() ?? "I") as EventType;
  const gender = parseEv3Gender(parts[5]?.trim() ?? "G");
  const ageMin = Number(parts[6]?.trim() ?? "0") || 0;
  const ageMax = Number(parts[7]?.trim() ?? "0") || 0;
  const distance = Number(parts[8]?.trim() ?? "0") || 0;
  const stroke = parseEv3Stroke(parts[9]?.trim() ?? "A");
  const entryLimit = Number(parts[10]?.trim() ?? "0") || 0;
  const entryFee = Number(parts[14]?.trim() ?? "0") || 0;

  // Time standards
  const slow5 = parseTime(parts[15]?.trim() ?? "");
  const fast5 = parseTime(parts[16]?.trim() ?? "");
  const slow4 = parseTime(parts[17]?.trim() ?? "");
  const fast4 = parseTime(parts[18]?.trim() ?? "");
  const aCut = parseTime(parts[19]?.trim() ?? "");
  const bCut = parseTime(parts[20]?.trim() ?? "");

  const timeStandards: (number | null)[] = [
    slow5,
    fast5,
    slow4,
    fast4,
    aCut,
    bCut,
  ];

  const startTime = parts[24]?.trim() ?? "";
  const laneCount = Number(parts[26]?.trim() ?? "0") || 0;
  const heatCount = Number(parts[27]?.trim() ?? "0") || 0;

  return {
    eventNumber,
    eventCode,
    round,
    session,
    eventType,
    gender,
    ageMin,
    ageMax,
    distance,
    stroke,
    entryLimit,
    entryFee,
    timeStandards,
    startTime,
    laneCount,
    heatCount,
  };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parse an EV3 file buffer into a structured object.
 *
 * Usage:
 *   const buf = fs.readFileSync("meet.ev3");
 *   const ev3 = parseEv3(buf);
 */
export function parseEv3(buf: Buffer): Ev3File {
  const content = decodeHytekBuffer(buf);
  const lines = splitLines(content).filter((l: string) => l.length > 0);

  if (lines.length === 0) {
    throw new Error("EV3 parse error: empty file");
  }

  const header = parseEv3Header(lines[0]);
  const events: Ev3Event[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 5) {
      continue;
    }
    try {
      const event = parseEv3Event(line);
      if (event) {
        events.push(event);
      }
    } catch {
      // Skip malformed lines
    }
  }

  return { header, events };
}

/**
 * Convert EV3 events to HYV-compatible format for unified processing.
 * Useful when you have an EV3 but not a HYV.
 */
export function ev3EventsToHyvStyle(events: Ev3Event[]) {
  return events.map((e) => ({
    eventCode: e.eventCode,
    eventNumber: e.eventNumber,
    round: e.round,
    gender: e.gender,
    eventType: e.eventType,
    ageMin: e.ageMin,
    ageMax: e.ageMax,
    distance: e.distance,
    stroke: e.stroke,
    entryLimit: e.entryLimit,
    entryFee: e.entryFee,
    aCut: e.timeStandards[4] ?? null,
    bCut: e.timeStandards[5] ?? null,
    timeStandards: e.timeStandards,
    session: e.session,
    startTime: e.startTime,
  }));
}
