// ─────────────────────────────────────────────────────────────────────────────
// SD3 Parser — Meet Entry files from Team Manager / TeamUnify
//
// Record types:
//   A01 — File header
//   B11 — Meet info
//   C11 — Team info
//   D01 — Athlete entry (one per event)
//   D3  — Athlete extended info (preferred name, middle name, etc.)
//   Z01 — File footer/summary
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Gender,
  Sd3AthleteExtended,
  Sd3Entry,
  Sd3File,
  Sd3FileHeader,
  Sd3Meet,
  Sd3Team,
  Stroke,
} from "./types";
import {
  decodeHytekBuffer,
  field,
  numField,
  parseCourse,
  parseGender,
  parseHytekDate,
  parseTime,
  splitLines,
} from "./utils";

const WHITE_SPACE_REGEX = /\s+/;
const SINGLE_LETTER_A_TO_G_REGEX = /^[A-Ga-g]$/;
const SINGLE_LETTER_A_TO_Z_REGEX = /^[A-Za-z]$/;

// ─── USA-S SWIMS Event Catalog → Stroke mapping ───────────────────────────────
//
// The SD3 D01 record stores a USA Swimming SWIMS event catalog number (evnum),
// not a meet event number. This number encodes the event stroke and distance
// and is standardized across all USA Swimming meets.
//
// Position [74] in D01 is the AGE GROUP SECTION LETTER (A/B/C), NOT the stroke.
// The stroke must be derived from the SWIMS catalog number using this table.
//
// These numbers are derived forensically from real SD3 files and cross-referenced
// with known seed times. Standard SCY catalog numbers:

const SWIMS_STROKE_MAP: Record<number, Stroke> = {
  // Freestyle
  1: "A", // 50 Free (short-age-group variant)
  2: "A", // 100 Free (short-age-group variant)
  3: "A", // 200 Free (short-age-group variant)
  4: "A", // 500 Free (short-age-group variant)
  5: "A", // 1000 Free (short-age-group variant)
  6: "A", // 1650 Free
  18: "A", // 1000 Free (seen in files)
  124: "A", // 100 Free
  140: "A", // 500 Free
  168: "A", // 200 Free
  176: "A", // 50 Free
  // Backstroke
  14: "B", // 100 Back (short-age-group variant)
  101: "B", // 50 Back
  102: "B", // 100 Back
  103: "B", // 200 Back
  328: "B", // 100 Back
  422: "B", // 50 Back
  // Breaststroke
  31: "C", // 50 Breast (short-age-group variant)
  35: "C", // 100 Breast (short-age-group variant)
  201: "C", // 50 Breast
  202: "C", // 100 Breast
  203: "C", // 200 Breast
  366: "C", // 50 Breast
  474: "C", // 100 Breast
  // Butterfly
  59: "D", // 100 Fly (short-age-group variant)
  232: "D", // 50 Fly
  270: "D", // 100 Fly
  301: "D", // 50 Fly
  302: "D", // 100 Fly
  303: "D", // 200 Fly
  // IM
  52: "E", // 400 IM
  401: "E", // 200 IM
  402: "E", // 400 IM
  534: "E", // 200 IM
  // Additional evnums from 11-12 age group entries
  21: "B", // 50 Back (11-12 age group)
  28: "B", // 100 Back (11-12 age group)
};

/**
 * Resolve the stroke for an SD3 entry using the SWIMS event catalog number.
 * Returns "I" (unknown) if the event number is not in the lookup table.
 *
 * Pass distance to disambiguate event numbers that appear at multiple distances
 * (e.g. evnum=18 = 1000 Free for older swimmers, 200 IM for younger age groups).
 */
export function resolveStroke(eventNumber: number, distance?: number): Stroke {
  // Distance-aware disambiguation for ambiguous event numbers
  if (distance !== undefined) {
    if (eventNumber === 18 && distance === 200) {
      return "E"; // 200 IM
    }
    if (eventNumber === 18 && distance === 1000) {
      return "A"; // 1000 Free
    }
  }
  return SWIMS_STROKE_MAP[eventNumber] ?? "I";
}

/**
 * Resolve stroke for an SD3 entry by matching against a HYV/EV3 event list.
 * This is more accurate than the SWIMS catalog lookup when you have the meet's
 * event file available.
 *
 * Match criteria: same distance + same gender + eventSection matches event code suffix.
 */
export function resolveStrokeFromEvents(
  entry: {
    distance: number;
    gender: import("./types.js").Gender;
    eventSection: string;
    eventNumber: number;
  },
  events: Array<{
    eventCode: string;
    distance: number;
    gender: import("./types.js").Gender;
    stroke: Stroke;
  }>
): Stroke {
  // Try matching by eventSection letter suffix in event code (e.g. "23A", "14B")
  const match = events.find(
    (ev) =>
      ev.distance === entry.distance &&
      ev.gender === entry.gender &&
      ev.eventCode.endsWith(entry.eventSection)
  );
  if (match) {
    return match.stroke;
  }

  // Fall back to SWIMS catalog lookup
  return resolveStroke(entry.eventNumber);
}

// ─── A01 — File Header ────────────────────────────────────────────────────────
// Example:
// "A01V3      01Meet Entries                  TeamUnify, LLC      2.0       Gehrke, Adam        651 442-960902102026"
//  ^  ^       ^  ^                            ^                   ^         ^                   ^           ^
//  0  3       10 12                           44                  62        72                  92          104

// A01 forensically verified layout:
//  [3:5]    version "V3"
//  [11:13]  fileCode "01"
//  [13:43]  fileDescription (30 chars)
//  [43:63]  softwareName (20 chars)
//  [63:73]  softwareVersion (10 chars)
//  [73:93]  contactName (20 chars)
//  [93:105] contactPhone (12 chars)
//  [105:113]creationDate MMDDYYYY
function parseA01(line: string): Sd3FileHeader {
  return {
    version: field(line, 3, 5),
    fileCode: field(line, 11, 13),
    fileDescription: field(line, 13, 43),
    softwareName: field(line, 43, 63),
    softwareVersion: field(line, 63, 73),
    contactName: field(line, 73, 93),
    contactPhone: field(line, 93, 105),
    creationDate: field(line, 105, 113),
  };
}

// ─── B11 — Meet Info ──────────────────────────────────────────────────────────
// Example:
// "B11        AZSI Swimming 2026 SCY Regiona                                                                                0220202602222026   0        Y"
//  ^          ^                                                                                                             ^       ^       ^           ^
//  0          11                                                                                                            110     118     126         138

// Forensically verified B11 layout:
//  [11:41]  = meet name (30 chars)
//  [121:129]= start date MMDDYYYY
//  [129:137]= end date MMDDYYYY
//  [140]    = altitude
//  [149]    = course flag Y/S/L
//  [150]    = masters flag Y/N
function parseB11(line: string): Sd3Meet {
  return {
    name: field(line, 11, 41),
    startDate: field(line, 121, 129),
    endDate: field(line, 129, 137),
    courseCode: field(line, 149, 150) || "Y",
    altitude: numField(line, 140, 141) || 0,
    masters: line.length > 150 && field(line, 150, 151) === "Y",
  };
}

// ─── C11 — Team Info ──────────────────────────────────────────────────────────
// Forensically verified layout (0-indexed):
// "C11        AZAZSLArizona Seals Swimming Academy                37730 W Vera Cruz Dr                        Maricopa            AZ85138"
//
//  [11:13]  = LSC code: "AZ"
//  [13:17]  = team abbreviation: "AZSL" (4 chars)
//  [17:63]  = team name (46 chars)
//  [63:107] = address (44 chars)
//  [107:127]= city (20 chars)
//  [127:129]= state (2 chars)
//  [129:134]= zip (5 chars)

function parseC11(line: string): Sd3Team {
  return {
    lsc: field(line, 11, 13),
    abbreviation: field(line, 13, 17),
    name: field(line, 17, 63),
    address1: field(line, 63, 107),
    city: field(line, 107, 127),
    state: field(line, 127, 129),
    zip: field(line, 129, 134),
  };
}

// ─── D01 — Athlete Entry ──────────────────────────────────────────────────────
// Forensically verified field layout (0-indexed):
//
// "D01AZ      Armstrong, Ethan            F6250F958AD5AUSA0321200916MM 500140B 1518         4:56.31L"
//
//  [0:3]   = "D01" record type
//  [3:5]   = LSC code: "AZ"
//  [5:11]  = spaces
//  [11:39] = athlete name "Last, First MI" (28 chars)
//  [39:51] = USA-S member ID (12 hex chars): "F6250F958AD5"
//  [51]    = member ID suffix/flag (1 char)
//  [52:55] = citizenship (3 chars): "USA"
//  [55:63] = DOB MMDDYYYY (8 chars): "03212009"
//  [63:65] = age (2 chars): "16"
//  [65]    = gender: "M" or "F"
//  [66]    = club type flag: "M"=Masters, "U"=USS
//  [67:71] = distance (4 chars, right-justified): " 500", "  50", "1000"
//  [71:74] = USA-S event catalog number (3 chars, strip spaces before parsing)
//  [74]    = stroke code: letter A-G (Hy-Tek) or digit 1-8 (TeamUnify)
//  [75]    = space
//  [76:80] = age group (4 chars): "1518", "1314", "1112", "UN10"
//  [80:89] = spaces (9 chars)
//  [89:97] = seed time (8 chars, right-justified): "4:56.31" or "  34.88"
//  [97]    = seed course: Y/S/L

// parseStrokeCode removed — SD3[74] is the event section letter, not stroke

/** Parse the 4-char age group field from SD3 D01.
 *  "1518" → {min:15, max:18}  |  "UN10" → {min:0, max:10}
 */
function parseAgeGroup(raw: string): { min: number; max: number } {
  const s = raw.trim();
  if (!s || s.length < 3) {
    return { min: 0, max: 0 };
  }
  if (s.startsWith("UN") || s.startsWith("un")) {
    return { min: 0, max: Number(s.slice(2)) || 0 };
  }
  return {
    min: Number(s.slice(0, 2)) || 0,
    max: Number(s.slice(2, 4)) || 0,
  };
}

function parseD01(line: string): Sd3Entry {
  const nameRaw = field(line, 11, 39);
  const commaIdx = nameRaw.indexOf(",");
  const lastName =
    commaIdx >= 0 ? nameRaw.slice(0, commaIdx).trim() : nameRaw.trim();
  const firstAndMI = commaIdx >= 0 ? nameRaw.slice(commaIdx + 1).trim() : "";
  const nameParts = firstAndMI.split(WHITE_SPACE_REGEX);
  const firstName = nameParts[0] ?? "";
  // Middle initial: last token if it's a single alpha char (e.g. "Damien R" → "R")
  const middleInitialFromName =
    nameParts.length > 1 &&
    nameParts[nameParts.length - 1]!.length === 1 &&
    SINGLE_LETTER_A_TO_Z_REGEX.test(nameParts[nameParts.length - 1]!)
      ? nameParts[nameParts.length - 1]!.toUpperCase()
      : "";

  const memberId = field(line, 39, 51);
  const citizenship = field(line, 52, 55);
  const dob = parseHytekDate(field(line, 55, 63));
  const age = numField(line, 63, 65);
  const gender = parseGender(field(line, 65, 66));

  const distance = Number(field(line, 67, 71)) || 0;
  // [71:74] = USA-S SWIMS event catalog number (3 chars, may contain spaces — strip before parsing)
  const eventNumber =
    Number(field(line, 71, 74).replace(/\s/g, "") || "0") || 0;
  // [74] = age group section letter (A/B/C) — NOT the stroke code
  const eventSection = field(line, 74, 75);
  // Resolve the actual stroke from the SWIMS event catalog number
  const stroke = resolveStroke(eventNumber, distance);
  const ageGroup = parseAgeGroup(field(line, 76, 80));
  // Seed time: 9-char right-justified field at [87:96], course at [96]
  // Must use [87:96] (not [89:97]) to capture times >= 10:00 (e.g. "12:32.17")
  const seedTime = parseTime(field(line, 87, 96));
  const seedCourse = line.length > 96 ? parseCourse(field(line, 96, 97)) : "Y";

  return {
    lsc: field(line, 3, 5),
    lastName,
    firstName,
    middleInitial: middleInitialFromName,
    memberId,
    citizenship,
    dob,
    age,
    gender,
    distance,
    eventNumber,
    eventSection,
    stroke,
    ageGroupMin: ageGroup.min,
    ageGroupMax: ageGroup.max,
    seedTime,
    seedCourse,
  };
}

// ─── D3 — Athlete Extended ────────────────────────────────────────────────────
// Forensically verified layout:
//  [2:14]  = member ID (12 hex chars)
//  [14:16] = 2-char suffix/flags
//  [16:32] = preferred first name (16 chars, space-padded)
//  [33:46] = "FFFFFFFFFFFFF" (13-char placeholder — always this value, ignore it)
//  [46:60] = middle name field (space-padded):
//            - single alpha char → middle initial (e.g. "J", "R", "P")
//            - multi char        → middle name    (e.g. "Reed", "Robert", "Perry")
//            - empty             → no middle name

function parseD3(line: string): Sd3AthleteExtended {
  const memberId = field(line, 2, 14);
  const preferredName = field(line, 16, 32);

  // [46:60] is the middle name/initial field
  const middleRaw = field(line, 46, 60);
  // A single alpha character is a middle initial; longer strings are middle names
  const middleInitial =
    middleRaw.length === 1 && SINGLE_LETTER_A_TO_Z_REGEX.test(middleRaw)
      ? middleRaw.toUpperCase()
      : "";
  const middleName = middleRaw.length > 1 ? middleRaw : "";

  return {
    memberId,
    preferredName: preferredName || "",
    middleInitial,
    middleName,
  };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parse an SD3 file buffer into a structured object.
 *
 * Usage:
 *   const buf = fs.readFileSync("entries.sd3");
 *   const sd3 = parseSd3(buf);
 */
export function parseSd3(buf: Buffer): Sd3File {
  const content = decodeHytekBuffer(buf);
  const lines = splitLines(content);

  let header: Sd3FileHeader | undefined;
  let meet: Sd3Meet | undefined;
  let team: Sd3Team | undefined;
  const entries: Sd3Entry[] = [];
  const athletes: Sd3AthleteExtended[] = [];

  for (const line of lines) {
    if (!line || line.length < 2) {
      continue;
    }

    const recordType = line.slice(0, 3);

    if (recordType === "A01") {
      header = parseA01(line);
    } else if (recordType === "B11") {
      meet = parseB11(line);
    } else if (recordType === "C11") {
      team = parseC11(line);
    } else if (recordType === "D01") {
      try {
        entries.push(parseD01(line));
      } catch {
        // Skip malformed lines
      }
    } else if (line.slice(0, 2) === "D3") {
      try {
        athletes.push(parseD3(line));
      } catch {
        // Skip malformed lines
      }
    }
    // Z01 (footer) is intentionally ignored — it's summary-only
  }

  if (!header) {
    throw new Error("SD3 parse error: missing A01 file header record");
  }
  if (!meet) {
    throw new Error("SD3 parse error: missing B11 meet record");
  }
  if (!team) {
    throw new Error("SD3 parse error: missing C11 team record");
  }

  return { header, meet, team, entries, athletes };
}

// ─── Roster extraction ────────────────────────────────────────────────────────

export interface Sd3Athlete {
  age: number;
  citizenship: string;
  dob: string;
  entries: Sd3Entry[];
  firstName: string;
  gender: Gender;
  lastName: string;
  lsc: string;
  memberId: string;
  /** Single-char middle initial from the D01 name field, e.g. "R" */
  middleInitial: string;
  /** Full middle name from the D3 record, e.g. "Reed". Empty if only initial known. */
  middleName: string;
  preferredName: string;
}

/**
 * Group parsed SD3 entries by athlete (deduplicating by memberId).
 * Returns a map of memberId → athlete with all their entries attached.
 */
export function groupSd3ByAthlete(sd3: Sd3File): Map<string, Sd3Athlete> {
  const athleteMap = new Map<string, Sd3Athlete>();
  const extendedMap = new Map<string, Sd3AthleteExtended>(
    sd3.athletes.map((a: Sd3AthleteExtended) => [a.memberId, a])
  );

  for (const entry of sd3.entries) {
    const existing = athleteMap.get(entry.memberId);
    if (existing) {
      existing.entries.push(entry);
    } else {
      const ext = extendedMap.get(entry.memberId);
      athleteMap.set(entry.memberId, {
        memberId: entry.memberId,
        lastName: entry.lastName,
        firstName: entry.firstName,
        // Prefer D3 preferred name; fall back to D01 first name
        preferredName: ext?.preferredName || entry.firstName,
        // Middle initial: prefer D01 name field; D3 single-char field is same data
        middleInitial: entry.middleInitial || ext?.middleInitial || "",
        // Middle name only comes from D3 (multi-char field like "Reed", "Robert")
        middleName: ext?.middleName || "",
        dob: entry.dob,
        age: entry.age,
        gender: entry.gender,
        citizenship: entry.citizenship,
        lsc: entry.lsc,
        entries: [entry],
      });
    }
  }

  return athleteMap;
}
