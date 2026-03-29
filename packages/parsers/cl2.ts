// ─────────────────────────────────────────────────────────────────────────────
// CL2 Parser — Hy-Tek's variant of the SDIF standard
//
// Spec reference: SDIF Version 3 (April 28, 1998)
// https://www.usms.org/admin/sdifv3f.txt
//
// CL2 is Hy-Tek's implementation of SDIF with proprietary field width changes.
// The FILE Code in the A01 header (SDIF Code Table 003) determines content:
//
//   "01" = Meet Registrations/Entries  — A01, B11, C11, D01, D3, Z01
//   "02" = Meet Results                — A01, B11, C11, D01, D3, G01, Z01
//   "20" = Vendor-defined (Hy-Tek)     — A01, C11, D01, D3, Z01
//           Hy-Tek uses "20" for "Swimmers Only" roster exports.
//           No B11 meet record is present.
//
// Returns a discriminated union on `fileType` — callers never need to
// know the fileCode upfront; just call parseCl2() and switch on fileType.
//
// Field positions forensically verified against:
//   - CFILE01.CL2  (Hy-Tek Win-TM 8.0D, roster export, fileCode "20")
//   - Meet_Results...cl2 (Hy-Tek MM 8.0, results export, fileCode "02")
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Cl2Meet,
  Cl2Result,
  Cl2Team,
  GradeYear,
  RosterAthlete,
  Stroke,
  SwimTeamInfo,
} from "./types";
import {
  decodeHytekBuffer,
  field,
  numField,
  parseCourse,
  parseGender,
  parseHytekDate,
  parseStroke,
  parseTime,
  splitLines,
} from "./utils";

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Parse stroke code from CL2 D01 field.
 * Hy-Tek uses letter codes (A-G) in HY3/E1 records and for meet entries.
 * SDIF standard uses digits 1-7 (STROKE Code 012).
 * Both are supported.
 */
function parseStrokeCode(raw: string): Stroke {
  const c = raw.trim();
  if (!c) {
    return "I";
  }
  if (/^[A-Ga-g]$/.test(c)) {
    return parseStroke(c);
  }
  // SDIF STROKE Code 012: 1=Free, 2=Back, 3=Breast, 4=Fly, 5=IM, 6=FreeRel, 7=MedRel
  const numMap: Record<string, Stroke> = {
    "1": "A",
    "2": "B",
    "3": "C",
    "4": "D",
    "5": "E",
    "6": "F",
    "7": "G",
    "8": "B",
  };
  return numMap[c] ?? "I";
}

function parseAgeGroup(raw: string): { min: number; max: number } {
  const s = raw.trim();
  if (!s || s.length < 3) {
    return { min: 0, max: 0 };
  }
  // SDIF EVENT AGE Code 025: first two bytes = lower limit, last two = upper limit
  // "UN" prefix = no lower limit (under age)
  if (s.startsWith("UN") || s.startsWith("un")) {
    return { min: 0, max: Number(s.slice(2)) || 0 };
  }
  return { min: Number(s.slice(0, 2)) || 0, max: Number(s.slice(2, 4)) || 0 };
}

function parseName(raw: string): {
  lastName: string;
  firstName: string;
  middleInitial: string;
} {
  // SDIF NAME format: "last, first [MI]" (SDIF spec page 4)
  const commaIdx = raw.indexOf(",");
  const lastName = commaIdx >= 0 ? raw.slice(0, commaIdx).trim() : raw.trim();
  const firstAndMI = commaIdx >= 0 ? raw.slice(commaIdx + 1).trim() : "";
  const parts = firstAndMI.split(/\s+/);
  const firstName = parts[0] ?? "";
  // Middle initial: last token if single alpha char
  const lastPart = parts[parts.length - 1] ?? "";
  const middleInitial =
    parts.length > 1 && lastPart.length === 1 && /^[A-Za-z]$/.test(lastPart)
      ? lastPart.toUpperCase()
      : "";
  return { lastName, firstName, middleInitial };
}

// ─── A01 — File Header ────────────────────────────────────────────────────────
// SDIF A0 record, Hy-Tek variant with "1" suffix.
// Forensically verified positions (0-indexed):
//  [3:5]    SDIF version "V3"
//  [11:13]  FILE Code 003 (fileCode)
//  [13:43]  file description (30 chars)
//  [43:63]  software name (20 chars)
//  [63:73]  software version (10 chars)
//  [73:93]  contact name (20 chars)
//  [93:105] contact phone (12 chars)
//  [105:113] creation date MMDDYYYY

function parseA01(line: string): {
  fileCode: string;
  fileDescription: string;
  softwareName: string;
  softwareVersion: string;
  creationDate: string;
} {
  return {
    fileCode: field(line, 11, 13),
    fileDescription: field(line, 13, 43),
    softwareName: field(line, 43, 63),
    softwareVersion: field(line, 63, 73),
    creationDate: parseHytekDate(field(line, 105, 113)),
  };
}

// ─── B11 — Meet Record ────────────────────────────────────────────────────────
// SDIF B1 record, Hy-Tek CL2 variant.
// Present in fileCode "01" and "02". Absent in "20" (roster).
// Forensically verified positions:
//  [11:41]   meet name (30 chars)
//  [41:85]   address (44 chars)
//  [85:105]  city (20 chars)
//  [105:107] state
//  [107:112] zip
//  [117:120] country
//  [121:129] start date MMDDYYYY
//  [129:137] end date MMDDYYYY
//  [149]     course Y/S/L
//  [157]     masters flag Y/N

function parseB11(line: string): Cl2Meet {
  return {
    name: field(line, 11, 41),
    address: field(line, 41, 85),
    city: field(line, 85, 105),
    state: field(line, 105, 107),
    zip: field(line, 107, 112),
    country: field(line, 117, 120),
    startDate: parseHytekDate(field(line, 121, 129)),
    endDate: parseHytekDate(field(line, 129, 137)),
    course: parseCourse(line.length > 149 ? field(line, 149, 150) : "Y"),
    altitude: 0,
    masters: line.length > 157 && field(line, 157, 158) === "Y",
  };
}

// ─── C11 — Team Record ───────────────────────────────────────────────────────
// SDIF C1 record, Hy-Tek CL2 variant.
// Forensically verified positions:
//  [3:5]    LSC code
//  [11:13]  LSC code (repeated)
//  [13:17]  team abbreviation (4 chars in results; some roster files use 4-6)
//  [17:47]  full team name (30 chars)
//  [47:50]  short name (3 chars, roster exports only)
//  [107:127] city (20 chars)
//  [127:129] state
//  [129:134] zip (5 chars)
//  [139:142] country

function parseC11(line: string): SwimTeamInfo {
  return {
    lsc: field(line, 11, 13),
    abbreviation: field(line, 13, 17),
    name: field(line, 17, 47),
    shortName: field(line, 47, 50),
    address: field(line, 51, 89),
    city: field(line, 107, 127),
    state: field(line, 127, 129),
    zip: field(line, 129, 134),
    country: field(line, 139, 142),
    coachName: "",
    schoolType: "",
    email: "",
  };
}

// ─── D01 — Individual Event Record (results/entries variant) ─────────────────
// SDIF D0 record, Hy-Tek CL2 variant. Used for both entries and results.
// Field positions differ from the SDIF spec due to Hy-Tek field width changes.
//
// Forensically verified positions (0-indexed):
//  [11:39]   SDIF NAME: "Last, First MI" (28 chars)
//  [39:51]   USS# / member ID (12 hex chars — Hy-Tek's new USS# format)
//  [51]      member ID suffix flag
//  [52:55]   CITIZEN Code 009 (3 chars)
//  [55:63]   DOB MMDDYYYY
//  [63:65]   age (2 chars)
//  [65]      SEX Code 010: M/F
//  [66]      club type flag
//  [67:71]   event distance (4 chars, right-justified) — SDIF field 68/4
//  [71:75]   USA-S SWIMS event catalog number (4 chars, strip spaces)
//            NOTE: This is NOT the SDIF Event Number (SDIF 73/4).
//            It encodes stroke+distance as a composite key from USA-S SWIMS DB.
//  [75]      Age group SECTION LETTER (A/B/C) — NOT the stroke code.
//            This is the HYV event code suffix (e.g. "23A" → section "A").
//  [76:80]   EVENT AGE Code 025: "1314","1518","UN10" (age group min+max)
//  [80:88]   date of swim MMDDYYYY
//  [88:96]   seed time (8 chars right-justified, includes leading spaces for short times)
//  [96]      seed COURSE Code 013
//  [97:105]  finals time (8 chars right-justified)
//  [105]     finals COURSE Code 013 (or 'S' = exhibition)
//  [116:124] best/prelim time (8 chars)
//  [125:127] prelim heat place
//  [127:129] prelim heat number
//  [129:131] finals heat place
//  [131:133] finals lane
//  [133:136] heat count
//  [136:139] entry count
//  [156:158] DQ code ("NN" = clean), [158:160] checksum

function parseD01Result(line: string): Cl2Result {
  const { lastName, firstName, middleInitial } = parseName(field(line, 11, 39));
  const memberId = field(line, 39, 51);
  const citizenship = field(line, 52, 55);
  const dob = parseHytekDate(field(line, 55, 63));
  const age = numField(line, 63, 65);
  const gender = parseGender(field(line, 65, 66));
  const distance = Number(field(line, 67, 71)) || 0;
  const eventNumber =
    Number(field(line, 71, 75).replace(/\s/g, "") || "0") || 0;
  const stroke = parseStrokeCode(field(line, 75, 76));
  const ageGroup = parseAgeGroup(field(line, 76, 80));
  const swimDate = parseHytekDate(field(line, 80, 88));

  const seedTime = parseTime(field(line, 88, 96));
  const seedCourse = parseCourse(line.length > 96 ? (line[96] ?? "Y") : "Y");

  const finRaw = field(line, 97, 105);
  const finishTime = parseTime(finRaw);
  const finCourseRaw = line.length > 105 ? (line[105] ?? "Y") : "Y";
  const exhibition = finCourseRaw === "S";

  const altTime = parseTime(field(line, 116, 124));

  const prelimHeatPlace = numField(line, 125, 127);
  const prelimHeat = numField(line, 127, 129);
  const finalsHeatPlace = numField(line, 129, 131);
  const finalsLane = numField(line, 131, 133);
  const heatCount = numField(line, 133, 136);

  const dqRaw = line.length > 158 ? field(line, 156, 158) : "NN";
  const dqCode = dqRaw === "NN" || dqRaw === "  " ? "" : dqRaw;

  const hasFinals = finishTime !== null && finalsHeatPlace > 0;
  const hasPrelim = prelimHeatPlace > 0;
  const round: "F" | "P" | "S" = hasFinals ? "F" : "P";

  void seedCourse;

  return {
    lsc: field(line, 3, 5),
    lastName,
    firstName,
    memberId,
    citizenship,
    dob,
    age,
    gender,
    eventNumber,
    stroke,
    distance,
    ageGroupMin: ageGroup.min,
    ageGroupMax: ageGroup.max,
    swimDate,
    seedTime,
    finishTime,
    prelimTime: hasPrelim && !hasFinals ? finishTime : (altTime ?? null),
    round,
    heatPlace: hasFinals ? finalsHeatPlace : prelimHeatPlace,
    heat: hasFinals ? heatCount : prelimHeat,
    lane: finalsLane,
    overallPlace: 0,
    splits: [],
    dqCode,
    exhibition,
  };
}

// ─── D01 — Individual Record (roster variant, fileCode "20") ─────────────────
// SDIF D1 record equivalent — only basic athlete info, no event data.
// Forensically verified positions:
//  [3:5]   LSC
//  [7:9]   grade/year: "FR","SO","JR","SR" (high school) or blank
//  [11:39] NAME: "Last, First MI" (28 chars)
//  [63]    age (usually 0 in roster exports)
//  [65]    SEX Code 010: M/F

function parseD01Roster(line: string): RosterAthlete {
  const { lastName, firstName, middleInitial } = parseName(field(line, 11, 39));
  const gradeRaw = field(line, 7, 9);
  return {
    lsc: field(line, 3, 5),
    lastName,
    firstName,
    middleInitial,
    gender: parseGender(field(line, 65, 66)),
    memberId: "", // not present in CL2 roster D01
    dob: "", // not present in CL2 roster D01
    age: Number(line[63]) || 0,
    gradeYear: (["FR", "SO", "JR", "SR"].includes(gradeRaw)
      ? gradeRaw
      : "") as GradeYear,
    jerseyNumber: 0, // not present in CL2 format
  };
}

// ─── G01 — Splits Record ─────────────────────────────────────────────────────
// SDIF G0 record, Hy-Tek CL2 variant.
// Forensically verified positions:
//  [39:51]  USS# / member ID (12 hex, links back to D01)
//  [51]     split count (1 digit)
//  [59:]    cumulative split times (9 chars each)
//  [147]    PRELIMS/FINALS Code 019: F/P/S

interface G01Record {
  memberId: string;
  round: "F" | "P" | "S";
  splits: number[];
}

function parseG01(line: string): G01Record | null {
  const memberId = field(line, 39, 51);
  if (!memberId) {
    return null;
  }
  const roundRaw = line.length > 147 ? field(line, 147, 148) : "";
  const round: "F" | "P" | "S" =
    roundRaw === "P" ? "P" : roundRaw === "S" ? "S" : "F";
  const splitCount = Number(line[51]) || 0;
  const splits: number[] = [];
  let pos = 59;
  for (let i = 0; i < splitCount && pos + 7 < line.length; i++) {
    const t = parseTime(field(line, pos, pos + 9));
    if (t !== null) {
      splits.push(t);
    }
    pos += 9;
  }
  return { memberId, round, splits };
}

// ─── Return types (discriminated union on fileType) ───────────────────────────
//
// Callers use fileType to narrow:
//   const result = parseCl2(buf);
//   if (result.fileType === "results")  { /* result.meet, result.teams, result.results */ }
//   if (result.fileType === "entries")  { /* result.meet, result.teams, result.results */ }
//   if (result.fileType === "roster")   { /* result.team, result.athletes */ }
//   if (result.fileType === "unknown")  { /* result.fileCode, result.rawLines */ }

export interface Cl2ResultsFile {
  creationDate: string;
  fileCode: "02";
  /** SDIF fileCode "02" — meet results */
  fileType: "results";
  meet: Cl2Meet;
  results: Cl2Result[];
  softwareName: string;
  teams: Cl2Team[];
}

export interface Cl2EntriesFile {
  creationDate: string;
  fileCode: "01";
  /** SDIF fileCode "01" — meet entries */
  fileType: "entries";
  meet: Cl2Meet;
  results: Cl2Result[];
  softwareName: string;
  teams: Cl2Team[];
}

export interface Cl2RosterFile {
  athletes: RosterAthlete[];
  creationDate: string;
  fileCode: "20";
  /** Hy-Tek fileCode "20" — "Swimmers Only" roster export */
  fileType: "roster";
  softwareName: string;
  team: SwimTeamInfo;
}

export interface Cl2UnknownFile {
  creationDate: string;
  fileCode: string;
  fileType: "unknown";
  rawLines: string[];
  softwareName: string;
}

export type ParsedCl2File =
  | Cl2ResultsFile
  | Cl2EntriesFile
  | Cl2RosterFile
  | Cl2UnknownFile;

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parse any CL2 file. Returns a discriminated union based on the SDIF FILE Code.
 *
 * @example
 *   const parsed = parseCl2(buf);
 *   switch (parsed.fileType) {
 *     case "results": console.log(parsed.results.length); break;
 *     case "entries": console.log(parsed.results.length); break;
 *     case "roster":  console.log(parsed.athletes.length); break;
 *   }
 */
export function parseCl2(buf: Buffer): ParsedCl2File {
  const content = decodeHytekBuffer(buf);
  const lines = splitLines(content);

  const firstLine = lines[0] ?? "";
  if (!firstLine.startsWith("A01")) {
    throw new Error("CL2 parse error: file does not begin with A01 record");
  }

  const { fileCode, softwareName, creationDate } = parseA01(firstLine);

  // ── Roster (fileCode "20") ──────────────────────────────────────────────────
  if (fileCode === "20") {
    let team: SwimTeamInfo | undefined;
    const athletes: RosterAthlete[] = [];
    for (const line of lines) {
      if (!line || line.length < 3) {
        continue;
      }
      const rt = line.slice(0, 3);
      if (rt === "C11") {
        try {
          team = parseC11(line);
        } catch {
          /* skip */
        }
      } else if (rt === "D01") {
        try {
          athletes.push(parseD01Roster(line));
        } catch {
          /* skip */
        }
      }
    }
    if (!team) {
      throw new Error("CL2 roster parse error: missing C11 team record");
    }
    return {
      fileType: "roster",
      fileCode: "20",
      softwareName,
      creationDate,
      team,
      athletes,
    };
  }

  // ── Results ("02") or Entries ("01") ───────────────────────────────────────
  if (fileCode === "02" || fileCode === "01") {
    let meet: Cl2Meet | undefined;
    const teams: Cl2Team[] = [];
    const results: Cl2Result[] = [];
    let pending: Cl2Result | null = null;

    function flush() {
      if (pending) {
        results.push(pending);
        pending = null;
      }
    }

    for (const line of lines) {
      if (!line || line.length < 3) {
        continue;
      }
      const rt = line.slice(0, 3);
      if (rt === "B11") {
        try {
          meet = parseB11(line);
        } catch {
          /* skip */
        }
      } else if (rt === "C11") {
        try {
          teams.push(parseC11(line) as Cl2Team);
        } catch {
          /* skip */
        }
      } else if (rt === "D01") {
        flush();
        try {
          pending = parseD01Result(line);
        } catch {
          pending = null;
        }
      } else if (rt === "G01") {
        if (pending) {
          try {
            const g01 = parseG01(line);
            if (g01 && g01.memberId === pending.memberId) {
              if (pending.splits.length === 0) {
                pending.splits = g01.splits;
                pending.round = g01.round;
              } else {
                const flushed: Cl2Result = pending;
                results.push(flushed);
                pending = {
                  ...flushed,
                  round: g01.round,
                  splits: g01.splits,
                  finishTime:
                    g01.round === "P" ? flushed.prelimTime : flushed.finishTime,
                };
              }
            }
          } catch {
            /* skip */
          }
        }
      } else if (rt === "Z01") {
        flush();
      }
    }
    flush();

    if (!meet) {
      throw new Error(
        `CL2 parse error: missing B11 meet record (fileCode=${fileCode})`
      );
    }

    if (fileCode === "02") {
      return {
        fileType: "results",
        fileCode: "02",
        softwareName,
        creationDate,
        meet,
        teams,
        results,
      };
    }
    return {
      fileType: "entries",
      fileCode: "01",
      softwareName,
      creationDate,
      meet,
      teams,
      results,
    };
  }

  // ── Unknown ─────────────────────────────────────────────────────────────────
  return {
    fileType: "unknown",
    fileCode,
    softwareName,
    creationDate,
    rawLines: lines,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function groupCl2ByAthlete(
  cl2: Cl2ResultsFile | Cl2EntriesFile
): Map<string, { name: string; results: Cl2Result[] }> {
  const map = new Map<string, { name: string; results: Cl2Result[] }>();
  for (const r of cl2.results) {
    const ex = map.get(r.memberId);
    if (ex) {
      ex.results.push(r);
    } else {
      map.set(r.memberId, {
        name: `${r.lastName}, ${r.firstName}`,
        results: [r],
      });
    }
  }
  return map;
}
