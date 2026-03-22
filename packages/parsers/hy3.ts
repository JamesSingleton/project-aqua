// ─────────────────────────────────────────────────────────────────────────────
// HY3 Parser — Hy-Tek's proprietary meet/roster data format
//
// Spec reference: SDIF Version 3 (April 28, 1998)
// https://www.usms.org/admin/sdifv3f.txt
//
// HY3 uses Hy-Tek-specific record names but the same logical structure as SDIF.
// Mapping to SDIF:
//   A1  = SDIF A0 (file header)
//   B1  = SDIF B1 (meet record)
//   B2  = SDIF B2 (meet host record)
//   C1  = SDIF C1 (team ID)
//   C2  = SDIF C2 (team entry / address)
//   C3  = Hy-Tek extension (team email, not in SDIF)
//   D1  = SDIF D1 (individual admin record — athlete info)
//   E1  = SDIF D0 entry portion (individual event — entry data)
//   E2  = SDIF D0 result portion (individual event — result data)
//   G1  = SDIF G0 (splits record)
//   Z1  = SDIF Z0 (file terminator)
//
// The FILE Code in A1[2:4] (SDIF Code Table 003) determines content:
//   "01" = Meet Entries (TM → MM, pre-meet merge)
//   "02" = Meet Entries (alternate)
//   "03" = Roster Only — C1, C2, C3, D1 only; no B1 meet record
//   "07" = Results (MM → TM, post-meet)
//
// Returns a discriminated union on `fileType`.
//
// Field positions forensically verified against:
//   - HFILE001.HY3  (Hy-Tek Win-TM 8.0De, roster export, fileCode "03")
//   - Meet_Results...hy3 (Hy-Tek MM 8.0, results export, fileCode "07")
// ─────────────────────────────────────────────────────────────────────────────

import type {
  GradeYear,
  RosterAthlete,
  Stroke,
  SwimAthlete,
  SwimAthleteEntry,
  SwimAthleteResult,
  SwimMeet,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseStrokeCode(raw: string): Stroke {
  const c = raw.trim();
  if (!c) {
    return "I";
  }
  if (/^[A-Ga-g]$/.test(c)) {
    return parseStroke(c);
  }
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

function blankTeam(): SwimTeamInfo {
  return {
    abbreviation: "",
    name: "",
    lsc: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    shortName: "",
    coachName: "",
    schoolType: "",
    email: "",
  };
}

// ─── A1 — File Header ────────────────────────────────────────────────────────
// Hy-Tek's A1 maps to SDIF A0 record.
// Forensically verified positions:
//  [2:4]    FILE Code 003 (fileCode)
//  [4:29]   file description (25 chars)
//  [29:44]  software name (15 chars)
//  [44:57]  software version (13 chars)
//  [58:66]  creation date MMDDYYYY (position varies slightly by product)

function parseA1(line: string): {
  fileCode: string;
  fileDescription: string;
  softwareName: string;
  softwareVersion: string;
  creationDate: string;
} {
  // Date field position varies between Win-TM and MM exports; find 8-digit run
  let creationDate = "";
  const dateMatch = line.slice(55, 80).match(/\d{8}/);
  if (dateMatch) {
    creationDate = parseHytekDate(dateMatch[0]);
  }
  return {
    fileCode: field(line, 2, 4),
    fileDescription: field(line, 4, 29),
    softwareName: field(line, 29, 44),
    softwareVersion: field(line, 44, 57),
    creationDate,
  };
}

// ─── B1 — Meet Record ────────────────────────────────────────────────────────
// SDIF B1. Present in fileCode "07","01","02". Absent in "03" (roster).
// Forensically verified positions:
//  [2:47]   meet name (45 chars)
//  [47:91]  facility (44 chars)
//  [91:99]  start date MMDDYYYY
//  [99:107] end date MMDDYYYY
//  [115:116] COURSE Code 013

function parseB1(line: string): SwimMeet {
  return {
    name: field(line, 2, 47),
    facility: field(line, 47, 91),
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    startDate: parseHytekDate(field(line, 91, 99)),
    endDate: parseHytekDate(field(line, 99, 107)),
    course: parseCourse(line.length > 115 ? field(line, 115, 116) : "Y"),
    altitude: 0,
    masters: false,
  };
}

// ─── C1 — Team ID Record ─────────────────────────────────────────────────────
// SDIF C1. Layout varies between results and roster files.
//
// Results variant (fileCode "07"):
//  [2:7]   TEAM Code 006 (5 chars including optional 5th char)
//  [7:53]  full team name (46 chars)
//  [53:55] LSC code
//
// Roster variant (fileCode "03"):
//  [2:7]   team abbreviation (5 chars)
//  [7:37]  team name (30 chars)
//  [37:53] short name (16 chars)
//  [53:55] LSC
//  [55:83] coach name (SDIF C2 "coach name" moved here by Hy-Tek)
//  [120:122] school type "HS"
//
// Both variants parsed by same function — extra fields trim to empty string.

// C1 name field is 30 chars [7:37] in both roster and results variants.
// shortName follows at [37:53] (populated in roster, blank in results).
// Using [7:53] would bleed shortName into the name in roster files.
function parseC1(line: string): Partial<SwimTeamInfo> {
  return {
    abbreviation: field(line, 2, 7),
    name: field(line, 7, 37),
    shortName: field(line, 37, 53),
    lsc: field(line, 53, 55),
    coachName: field(line, 55, 83),
    schoolType: line.length > 122 ? field(line, 120, 122) : "",
  };
}

// ─── C2 — Team Address Record ────────────────────────────────────────────────
// SDIF C2 (team entry / address). Used in both results and roster files.
// Forensically verified positions:
//  [2:62]  address (60 chars)
//  [62:92] city (30 chars)
//  [92:94] state
//  [94:99] zip (5 chars)

function parseC2(line: string): Partial<SwimTeamInfo> {
  return {
    address: field(line, 2, 62),
    city: field(line, 62, 92),
    state: field(line, 92, 94),
    zip: field(line, 94, 99),
  };
}

// ─── C3 — Team Email Record ───────────────────────────────────────────────────
// Hy-Tek extension, no SDIF equivalent. Roster files only.
// Email address is the sole non-blank content after stripping the record type.

function parseC3(line: string): Partial<SwimTeamInfo> {
  return { email: line.slice(2, -2).trim() };
}

// ─── D1 — Individual Admin Record ────────────────────────────────────────────
// SDIF D1. In HY3, D1 carries athlete identity info.
// Layout differs significantly between results and roster exports.
//
// Results variant (fileCode "07"):
//  [2]      SEX Code 010: M/F
//  [4:8]    Hy-Tek internal athlete ID (4 chars)
//  [8:28]   last name (20 chars)
//  [28:48]  first name (20 chars)
//  [48:68]  preferred first name (20 chars)
//  [69:81]  USS# / member ID (12 hex chars)
//  [88:96]  DOB MMDDYYYY
//  [97:99]  age (2 chars)
//
// Roster variant (fileCode "03"):
//  [2]      SEX Code 010: M/F
//  [3:8]    jersey/squad number (5 chars, right-justified)
//  [8:28]   last name (20 chars)
//  [28:48]  first name (20 chars)
//  [98]     age (1 char — usually 0 in HS rosters)
//  [99:101] grade/year "FR","SO","JR","SR"

function parseD1Results(line: string): SwimAthlete {
  return {
    gender: parseGender(field(line, 2, 3)),
    athleteId: numField(line, 4, 8),
    lastName: field(line, 8, 28),
    firstName: field(line, 28, 48),
    preferredName: field(line, 48, 68) || field(line, 28, 48),
    memberId: field(line, 69, 81),
    dob: parseHytekDate(field(line, 88, 96)),
    age: numField(line, 97, 99),
    teamAbbr: "",
  };
}

function parseD1Roster(line: string): RosterAthlete {
  const gradeRaw = field(line, 99, 101);
  return {
    gender: parseGender(field(line, 2, 3)),
    jerseyNumber: Number(field(line, 3, 8)) || 0,
    lastName: field(line, 8, 28),
    firstName: field(line, 28, 48),
    middleInitial: "",
    memberId: "",
    dob: "",
    age: Number(line[98]) || 0,
    gradeYear: (["FR", "SO", "JR", "SR"].includes(gradeRaw)
      ? gradeRaw
      : "") as GradeYear,
    lsc: "",
  };
}

// ─── E1 — Entry Record ───────────────────────────────────────────────────────
// SDIF D0 entry portion. Present in fileCode "01","02","07".
// Forensically verified positions:
//  [2]      SEX Code 010
//  [4:8]    athlete ID
//  [8:13]   last name truncated (5 chars)
//  [13:15]  team abbreviation
//  [18:21]  event distance (3 chars) — SDIF field 68/4
//  [21]     STROKE Code 012 (Hy-Tek letter A-G)
//  [23:25]  age group lower limit — SDIF EVENT AGE Code 025
//  [26:28]  age group upper limit
//  [31]     PRELIMS/FINALS Code 019
//  [33:38]  entry fee
//  [39:41]  event number
//  [41]     seed rank letter (A/B)
//  [42:50]  seed/qualifying time (8 chars)
//  [50]     COURSE Code 013
//  [51:59]  alternate qualifying time
//  [60:68]  points scored
//  [68:76]  reaction time

function parseE1(line: string): SwimAthleteEntry["entry"] & {
  teamAbbr: string;
  lastNameShort: string;
  points: number;
  reactionTime: number;
  seedRank: string;
} {
  return {
    gender: parseGender(field(line, 2, 3)),
    athleteId: numField(line, 4, 8),
    lastNameShort: field(line, 8, 13),
    teamAbbr: field(line, 13, 15),
    distance: Number(field(line, 18, 21)) || 0,
    stroke: parseStrokeCode(field(line, 21, 22)),
    ageGroupMin: numField(line, 23, 25),
    ageGroupMax: numField(line, 26, 28),
    round: field(line, 31, 32),
    entryFee: Number(field(line, 33, 38)) || 0,
    eventNumber: numField(line, 39, 41),
    seedRank: field(line, 41, 42),
    qualifyingTime: parseTime(field(line, 42, 50)),
    qualifyingCourse: parseCourse(line.length > 50 ? field(line, 50, 51) : "Y"),
    altQualifyingTime: parseTime(field(line, 51, 59)),
    points: Number(field(line, 60, 68)) || 0,
    reactionTime: Number(field(line, 68, 76)) || 0,
  };
}

// ─── E2 — Result Record ──────────────────────────────────────────────────────
// SDIF D0 result portion. Present in fileCode "07".
// Forensically verified positions:
//  [2]      PRELIMS/FINALS Code 019: F/P/S
//  [3:11]   finals time (8 chars right-justified)
//  [11]     COURSE Code 013
//  [19]     DQ indicator ('0' = clean)
//  [20:23]  heat number
//  [23:26]  heat place
//  [26:29]  lane number
//  [29:33]  entry count
//  [33:36]  overall place
//  [36:45]  adjusted time
//  [87:95]  date of swim MMDDYYYY

function parseE2(line: string): SwimAthleteResult {
  const round = (field(line, 2, 3) || "F") as "F" | "P" | "S";
  const dqInd = line.length > 19 ? field(line, 19, 20) : "0";
  return {
    round,
    finishTime: parseTime(field(line, 3, 11)),
    course: parseCourse(line.length > 11 ? field(line, 11, 12) : "Y"),
    exhibition: false,
    heat: numField(line, 20, 23),
    heatPlace: numField(line, 23, 26),
    lane: numField(line, 26, 29),
    entryCount: numField(line, 29, 33),
    overallPlace: numField(line, 33, 36),
    adjustedTime: parseTime(field(line, 36, 45)),
    splits: [],
    swimDate: parseHytekDate(field(line, 87, 95)),
    dqCode: dqInd !== "0" && dqInd !== " " ? dqInd : "",
  };
}

// ─── G1 — Splits Record ──────────────────────────────────────────────────────
// SDIF G0 record. Contains cumulative split times.

function parseG1(line: string): { round: "F" | "P" | "S"; splits: number[] } {
  const round = (field(line, 2, 3) || "F") as "F" | "P" | "S";
  const splits: number[] = [];
  const re = /[FPS]\s+\d+\s+([\d:.]+)/g;
  let m: RegExpExecArray | null;
  const content = line.slice(2, -2);
  while ((m = re.exec(content)) !== null) {
    const t = parseTime(m[1] ?? "");
    if (t !== null) {
      splits.push(t);
    }
  }
  return { round, splits };
}

// ─── Shared meet+results parser ───────────────────────────────────────────────

type Hy3EntryFull = SwimAthleteEntry["entry"] & {
  teamAbbr: string;
  lastNameShort: string;
  points: number;
  reactionTime: number;
  seedRank: string;
};

interface Hy3AthleteRecordFull {
  athlete: SwimAthlete;
  entries: { entry: Hy3EntryFull; results: SwimAthleteResult[] }[];
}

function parseMeetFile(lines: string[]): {
  meet: SwimMeet | undefined;
  teams: Map<string, { team: SwimTeamInfo; athletes: Hy3AthleteRecordFull[] }>;
} {
  let meet: SwimMeet | undefined;
  const teamMap = new Map<
    string,
    { team: SwimTeamInfo; athletes: Hy3AthleteRecordFull[] }
  >();
  let curTeamAbbr = "";
  let partialTeam: Partial<SwimTeamInfo> = {};
  let curAthRec: Hy3AthleteRecordFull | undefined;
  let curEntry: Hy3EntryFull | undefined;
  let curResults: SwimAthleteResult[] = [];

  function flushEntry() {
    if (curEntry && curAthRec) {
      curAthRec.entries.push({ entry: curEntry, results: curResults });
      curEntry = undefined;
      curResults = [];
    }
  }
  function flushAth() {
    flushEntry();
    if (curAthRec && curTeamAbbr) {
      teamMap.get(curTeamAbbr)?.athletes.push(curAthRec);
      curAthRec = undefined;
    }
  }

  for (const line of lines) {
    if (!line || line.length < 2) {
      continue;
    }
    const rt = line.slice(0, 2);
    if (rt === "B1") {
      try {
        meet = parseB1(line);
      } catch {
        /* skip */
      }
    } else if (rt === "C1") {
      flushAth();
      partialTeam = parseC1(line);
      curTeamAbbr = partialTeam.abbreviation ?? "";
    } else if (rt === "C2") {
      partialTeam = { ...partialTeam, ...parseC2(line) };
      const abbr = partialTeam.abbreviation ?? curTeamAbbr;
      if (abbr) {
        teamMap.set(abbr, {
          team: { ...blankTeam(), ...partialTeam },
          athletes: [],
        });
        curTeamAbbr = abbr;
      }
    } else if (rt === "C3") {
      partialTeam = { ...partialTeam, ...parseC3(line) };
    } else if (rt === "D1") {
      flushAth();
      try {
        const ath = parseD1Results(line);
        ath.teamAbbr = curTeamAbbr;
        curAthRec = { athlete: ath, entries: [] };
        if (curTeamAbbr && !teamMap.has(curTeamAbbr)) {
          teamMap.set(curTeamAbbr, {
            team: { ...blankTeam(), ...partialTeam },
            athletes: [],
          });
        }
      } catch {
        curAthRec = undefined;
      }
    } else if (rt === "E1") {
      flushEntry();
      try {
        curEntry = parseE1(line);
      } catch {
        curEntry = undefined;
      }
    } else if (rt === "E2") {
      try {
        curResults.push(parseE2(line));
      } catch {
        /* skip */
      }
    } else if (rt === "G1") {
      try {
        const g1 = parseG1(line);
        const target = [...curResults]
          .reverse()
          .find((r) => r.round === g1.round);
        if (target) {
          target.splits = g1.splits;
        }
      } catch {
        /* skip */
      }
    } else if (rt === "Z1") {
      flushAth();
    }
  }
  flushAth();
  return { meet, teams: teamMap };
}

// ─── Return types (discriminated union on fileType) ───────────────────────────

export interface Hy3ResultsFile {
  creationDate: string;
  fileCode: "07";
  /** SDIF fileCode "07" — results from MM to TM */
  fileType: "results";
  meet: SwimMeet;
  softwareName: string;
  teams: Map<string, { team: SwimTeamInfo; athletes: Hy3AthleteRecordFull[] }>;
}

export interface Hy3EntriesFile {
  creationDate: string;
  fileCode: "01" | "02";
  /** SDIF fileCode "01" or "02" — meet entries */
  fileType: "entries";
  meet: SwimMeet;
  softwareName: string;
  teams: Map<string, { team: SwimTeamInfo; athletes: Hy3AthleteRecordFull[] }>;
}

export interface Hy3RosterFile {
  athletes: RosterAthlete[];
  creationDate: string;
  fileCode: "03";
  /** Hy-Tek fileCode "03" — roster only export */
  fileType: "roster";
  softwareName: string;
  team: SwimTeamInfo;
}

export interface Hy3UnknownFile {
  creationDate: string;
  fileCode: string;
  fileType: "unknown";
  rawLines: string[];
  softwareName: string;
}

export type ParsedHy3File =
  | Hy3ResultsFile
  | Hy3EntriesFile
  | Hy3RosterFile
  | Hy3UnknownFile;

// Re-export for consumers
export type { Hy3AthleteRecordFull };

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parse any HY3 file. Returns a discriminated union based on the SDIF FILE Code.
 *
 * @example
 *   const parsed = parseHy3(buf);
 *   switch (parsed.fileType) {
 *     case "results": for (const [abbr, {athletes}] of parsed.teams) { ... } break;
 *     case "roster":  for (const a of parsed.athletes) { ... } break;
 *   }
 */
export function parseHy3(buf: Buffer): ParsedHy3File {
  const content = decodeHytekBuffer(buf);
  const lines = splitLines(content);

  const firstLine = lines[0] ?? "";
  if (!firstLine.startsWith("A1")) {
    throw new Error("HY3 parse error: file does not begin with A1 record");
  }

  const { fileCode, softwareName, creationDate } = parseA1(firstLine);

  // ── Roster (fileCode "03") ──────────────────────────────────────────────────
  if (fileCode === "03") {
    let partialTeam: Partial<SwimTeamInfo> = {};
    const athletes: RosterAthlete[] = [];
    for (const line of lines) {
      if (!line || line.length < 2) {
        continue;
      }
      const rt = line.slice(0, 2);
      if (rt === "C1") {
        try {
          partialTeam = { ...partialTeam, ...parseC1(line) };
        } catch {
          /* skip */
        }
      } else if (rt === "C2") {
        try {
          partialTeam = { ...partialTeam, ...parseC2(line) };
        } catch {
          /* skip */
        }
      } else if (rt === "C3") {
        try {
          partialTeam = { ...partialTeam, ...parseC3(line) };
        } catch {
          /* skip */
        }
      } else if (rt === "D1") {
        try {
          athletes.push(parseD1Roster(line));
        } catch {
          /* skip */
        }
      }
    }
    const team: SwimTeamInfo = { ...blankTeam(), ...partialTeam };
    return {
      fileType: "roster",
      fileCode: "03",
      softwareName,
      creationDate,
      team,
      athletes,
    };
  }

  // ── Results ("07") or Entries ("01","02") ───────────────────────────────────
  if (fileCode === "07" || fileCode === "01" || fileCode === "02") {
    const { meet, teams } = parseMeetFile(lines);
    if (!meet) {
      throw new Error(
        `HY3 parse error: missing B1 meet record (fileCode=${fileCode})`
      );
    }

    if (fileCode === "07") {
      return {
        fileType: "results",
        fileCode: "07",
        softwareName,
        creationDate,
        meet,
        teams,
      };
    }
    return {
      fileType: "entries",
      fileCode: fileCode as "01" | "02",
      softwareName,
      creationDate,
      meet,
      teams,
    };
  }

  return {
    fileType: "unknown",
    fileCode,
    softwareName,
    creationDate,
    rawLines: lines,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export interface Hy3FlatResult {
  athlete: SwimAthlete;
  entry: Hy3EntryFull;
  results: SwimAthleteResult[];
  teamAbbr: string;
}

export function flattenHy3Results(
  hy3: Hy3ResultsFile | Hy3EntriesFile
): Hy3FlatResult[] {
  const out: Hy3FlatResult[] = [];
  for (const [abbr, { athletes }] of hy3.teams) {
    for (const rec of athletes) {
      for (const { entry, results } of rec.entries) {
        out.push({ teamAbbr: abbr, athlete: rec.athlete, entry, results });
      }
    }
  }
  return out;
}
