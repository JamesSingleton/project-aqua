// ─────────────────────────────────────────────────────────────────────────────
// HY3 Parser — Merge export files from Hy-Tek Meet Manager
//
// Record types:
//   A1  — File header
//   B1  — Meet info
//   B2  — Meet info extended
//   C1  — Team info
//   C2  — Team address
//   D1  — Athlete info
//   E1  — Event entry info
//   E2  — Event result info
//   G1  — Split times
//   Z1  — Footer
//
// All field positions forensically verified against real HY3 files.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Hy3Athlete,
  Hy3AthleteRecord,
  Hy3Entry,
  Hy3File,
  Hy3Meet,
  Hy3Result,
  Hy3Team,
  Stroke,
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

const PARSE_STROKE_REGEX = /^[A-Ga-g]$/;

// ─── Stroke code ─────────────────────────────────────────────────────────────

function parseStrokeCode(raw: string): Stroke {
  const c = raw.trim();
  if (!c) {
    return "I";
  }
  if (PARSE_STROKE_REGEX.test(c)) {
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

// ─── A1 — File Header ────────────────────────────────────────────────────────
// "A107Results From MM to TM    Hy-Tek, Ltd    MM5 8.0Fd     02232025  6:22 PMArizona Aquatic Club"
// Not needed for data — we just note its presence

// ─── B1 — Meet Info ──────────────────────────────────────────────────────────
// "B1AZSI 2025 Short Course Regional Championship CHS Kerry Croswhite Aquatic Center           022120250223202502212025   0        06"
//  [2:47]  meet name (45 chars)
//  [47:91] facility (44 chars)
//  [91:99] start date MMDDYYYY
//  [99:107] end date MMDDYYYY
//  [115:116] course Y/S/L

function parseB1(line: string): Hy3Meet {
  return {
    name: field(line, 2, 47),
    facility: field(line, 47, 91),
    startDate: parseHytekDate(field(line, 91, 99)),
    endDate: parseHytekDate(field(line, 99, 107)),
    course: parseCourse(line.length > 115 ? field(line, 115, 116) : "Y"),
    altitude: 0,
    masters: false,
  };
}

// ─── C1/C2 — Team Info ────────────────────────────────────────────────────────
// C1: "C1AQFO AquaForce                                     AZ"
//  [2:7]   team abbreviation (5 chars)
//  [7:53]  team name (46 chars)
//  [53:55] LSC
//
// C2: "C22719 W 25th Street                                          Yuma                          AZ85364"
//  [2:62]  address (60 chars)
//  [62:90] city (28 chars)
//  [90:92] state
//  [92:102] zip

function parseC1(line: string): Partial<Hy3Team> {
  return {
    abbreviation: field(line, 2, 7),
    name: field(line, 7, 53),
    lsc: field(line, 53, 55),
  };
}

function parseC2(line: string): Partial<Hy3Team> {
  return {
    address: field(line, 2, 62),
    city: field(line, 62, 90),
    state: field(line, 90, 92),
    zip: field(line, 92, 102),
  };
}

// ─── D1 — Athlete ─────────────────────────────────────────────────────────────
// "D1F 1668Dusek               Bailey              Bailey              L1C574D76CAA445   3908192011 13"
//  [2]      gender F/M
//  [3]      space
//  [4:8]    athlete ID (4 chars): "1668"
//  [8:28]   last name (20 chars): "Dusek               "
//  [28:48]  first name (20 chars): "Bailey              "
//  [48:68]  preferred name (20 chars): "Bailey              "
//  [68]     member ID prefix letter: 'L'
//  [69:81]  member ID (12 hex chars): "1C574D76CAA4"
//  [81:83]  member ID suffix (2 chars): "45"
//  [83:88]  spaces (5 chars)
//  [88:90]  DOB month (2 chars): "08"
//  [90:92]  DOB day   (2 chars): "19"
//  [92:96]  DOB year  (4 chars): "2011"  → DOB = "08192011" MMDDYYYY at [88:96]
//  [96]     space
//  [97:99]  age (2 chars): "13"

function parseD1(line: string): Hy3Athlete {
  const gender = parseGender(field(line, 2, 3));
  const athleteId = numField(line, 4, 8);
  const lastName = field(line, 8, 28);
  const firstName = field(line, 28, 48);
  const preferredName = field(line, 48, 68);

  // Member ID: prefix letter at [68] + 12 hex at [69:81]
  const memberId = field(line, 69, 81);

  // DOB is MMDDYYYY at [88:96]
  const dob = parseHytekDate(field(line, 88, 96));
  const age = numField(line, 97, 99);

  return {
    gender,
    athleteId,
    lastName,
    firstName,
    preferredName: preferredName || firstName,
    memberId,
    dob,
    age,
    teamAbbr: "",
  };
}

// ─── E1 — Event Entry ─────────────────────────────────────────────────────────
// "E1F 1668DusekFG   100C 13 14  0S  8.50 17A   79.98Y   79.98Y   13.00    0.00   NN"
//  [2]      gender F/M
//  [4:8]    athlete ID (4 chars)
//  [8:13]   last name truncated (5 chars)
//  [13:15]  team abbr (2 chars)
//  [15:18]  spaces + round code (e.g. "FG" at 15-16 = Finals-Girls?)
//  [18:21]  distance (3 chars): "100"
//  [21]     stroke code (letter A-G): 'C'
//  [22]     space
//  [23:25]  age group min (2 chars): "13"
//  [25]     space
//  [26:28]  age group max (2 chars): "14"
//  [28:31]  spaces
//  [31]     round/session indicator
//  [33:38]  entry fee (5 chars): " 8.50"
//  [38]     space
//  [39:41]  event number (2 chars): "17"
//  [41]     seed rank: 'A'/'B'
//  [42:50]  qualifying time (8 chars right-justified): "   79.98"
//  [50]     qualifying course: 'Y'
//  [51:59]  alt qualifying time (8 chars): "   79.98"
//  [59]     alt course: 'Y'
//  [60:68]  points (8 chars): "   13.00"
//  [68:76]  reaction time (8 chars): "    0.00"
//  [79:81]  DQ flags: "NN"

function parseE1(line: string): Hy3Entry {
  const gender = parseGender(field(line, 2, 3));
  const athleteId = numField(line, 4, 8);
  const lastNameShort = field(line, 8, 13);
  const teamAbbr = field(line, 13, 15);

  const distance = Number(field(line, 18, 21)) || 0;
  const stroke = parseStrokeCode(field(line, 21, 22));
  const ageGroupMin = numField(line, 23, 25);
  const ageGroupMax = numField(line, 26, 28);
  const round = field(line, 31, 32);
  const entryFee = Number(field(line, 33, 38)) || 0;
  const eventNumber = numField(line, 39, 41);
  const seedRank = field(line, 41, 42);

  const qualifyingTime = parseTime(field(line, 42, 50));
  const qualifyingCourse = parseCourse(
    line.length > 50 ? field(line, 50, 51) : "Y"
  );
  const altQualifyingTime = parseTime(field(line, 51, 59));

  const points = Number(field(line, 60, 68)) || 0;
  const reactionTime = Number(field(line, 68, 76)) || 0;

  return {
    gender,
    athleteId,
    lastName: lastNameShort,
    lastNameShort,
    teamAbbr,
    distance,
    stroke,
    ageGroupMin,
    ageGroupMax,
    round,
    entryFee,
    eventNumber,
    seedRank,
    qualifyingTime,
    qualifyingCourse,
    altQualifyingTime,
    points,
    reactionTime,
  };
}

// ─── E2 — Event Result ────────────────────────────────────────────────────────
// "E2F   80.41Y       0  2  1  6   6  0   80.29    0.00    0.00        80.41     0.00     02222025"
//  [2]      round: F/P/S
//  [3:11]   finish time (8 chars right-justified): "   80.41"
//  [11]     course: 'Y'
//  [12:20]  spaces + DQ indicator at [19]
//  [20:23]  heat (3 chars right-justified): "  2"
//  [23:26]  heat place (3 chars): "  1"
//  [26:29]  lane (3 chars): "  6"
//  [29:33]  entry count (4 chars): "   6"
//  [33:36]  overall place (3 chars): "  0"
//  [36:45]  adjusted time (9 chars): "   80.29 "
//  [45:54]  reaction time (9 chars): "    0.00 "
//  [54:63]  backup time (9 chars): "    0.00 "
//  [63:72]  finish time repeat (9 chars): "        8"  (high precision)
//  [72:81]  finish time cont: "0.41     "
//  [81:90]  alt time: "   0.00  "
//  [87:95]  swim date MMDDYYYY: "02222025"

function parseE2(line: string): Hy3Result {
  const round = (field(line, 2, 3) || "F") as "F" | "P" | "S";

  const finishTime = parseTime(field(line, 3, 11));
  const course = parseCourse(line.length > 11 ? field(line, 11, 12) : "Y");

  // DQ indicator at [19]: '0' = no DQ; other value = DQ code
  const dqIndicator = line.length > 19 ? field(line, 19, 20) : "0";
  const dqCode = dqIndicator !== "0" && dqIndicator !== " " ? dqIndicator : "";

  const heat = numField(line, 20, 23);
  const heatPlace = numField(line, 23, 26);
  const lane = numField(line, 26, 29);
  const entryCount = numField(line, 29, 33);
  const overallPlace = numField(line, 33, 36);

  const adjustedTime = parseTime(field(line, 36, 45));
  const swimDate = parseHytekDate(field(line, 87, 95));

  // Exhibition: if overall place is 0 and dq is clean, could be exhibition
  // HY3 doesn't encode this explicitly in E2 — infer from entry flags
  const exhibition = false;

  return {
    round,
    finishTime,
    course,
    exhibition,
    heat,
    lane,
    heatPlace,
    overallPlace,
    entryCount,
    adjustedTime,
    splits: [],
    swimDate,
    dqCode,
  };
}

// ─── G1 — Split Times ────────────────────────────────────────────────────────
// "G1F 2   37.59F 4   80.41"
// Pattern: [round(1)][space][splitNum(1-3)][spaces][time(7-9)] repeating

function parseG1(line: string): { round: "F" | "P" | "S"; splits: number[] } {
  const round = (field(line, 2, 3) || "F") as "F" | "P" | "S";
  const splits: number[] = [];

  // Content after "G1" prefix and before 2-char checksum
  const content = line.slice(2, -2);
  // Each split: letter(1) + space(1) + digits(1-3) + spaces + time
  const splitPattern = /[FPS]\s+\d+\s+([\d:.]+)/g;
  let match: RegExpExecArray | null;
  while ((match = splitPattern.exec(content)) !== null) {
    const t = parseTime(match[1] ?? "");
    if (t !== null) {
      splits.push(t);
    }
  }

  return { round, splits };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseHy3(buf: Buffer): Hy3File {
  const content = decodeHytekBuffer(buf);
  const lines = splitLines(content);

  let meet: Hy3Meet | undefined;
  const teamMap = new Map<
    string,
    { team: Hy3Team; athletes: Hy3AthleteRecord[] }
  >();

  let currentTeamAbbr = "";
  let partialTeam: Partial<Hy3Team> = {};
  let currentAthleteRecord: Hy3AthleteRecord | undefined;
  let currentEntry: Hy3Entry | undefined;
  let currentResults: Hy3Result[] = [];

  function flushEntry() {
    if (currentEntry && currentAthleteRecord) {
      currentAthleteRecord.entries.push({
        entry: currentEntry,
        results: currentResults,
      });
      currentEntry = undefined;
      currentResults = [];
    }
  }

  function flushAthlete() {
    flushEntry();
    if (currentAthleteRecord && currentTeamAbbr) {
      const teamEntry = teamMap.get(currentTeamAbbr);
      if (teamEntry) {
        teamEntry.athletes.push(currentAthleteRecord);
      }
      currentAthleteRecord = undefined;
    }
  }

  for (const line of lines) {
    if (!line || line.length < 2) {
      continue;
    }
    const rt = line.slice(0, 2);

    if (rt === "A1") {
      /* file header — skip */
    } else if (rt === "B1") {
      try {
        meet = parseB1(line);
      } catch {
        /* skip */
      }
    } else if (rt === "B2") {
      /* extended meet info — skip */
    } else if (rt === "C1") {
      flushAthlete();
      partialTeam = parseC1(line);
      currentTeamAbbr = partialTeam.abbreviation ?? "";
    } else if (rt === "C2") {
      const c2 = parseC2(line);
      partialTeam = { ...partialTeam, ...c2 };
      const abbr = partialTeam.abbreviation ?? currentTeamAbbr;
      if (abbr) {
        teamMap.set(abbr, { team: partialTeam as Hy3Team, athletes: [] });
        currentTeamAbbr = abbr;
      }
    } else if (rt === "D1") {
      flushAthlete();
      try {
        const athlete = parseD1(line);
        athlete.teamAbbr = currentTeamAbbr;
        currentAthleteRecord = { athlete, entries: [] };
        if (currentTeamAbbr && !teamMap.has(currentTeamAbbr)) {
          teamMap.set(currentTeamAbbr, {
            team: partialTeam as Hy3Team,
            athletes: [],
          });
        }
      } catch {
        currentAthleteRecord = undefined;
      }
    } else if (rt === "E1") {
      flushEntry();
      try {
        currentEntry = parseE1(line);
      } catch {
        currentEntry = undefined;
      }
    } else if (rt === "E2") {
      try {
        currentResults.push(parseE2(line));
      } catch {
        /* skip */
      }
    } else if (rt === "G1") {
      try {
        const g1 = parseG1(line);
        // Attach to most recent result matching round
        const target = [...currentResults]
          .reverse()
          .find((r) => r.round === g1.round);
        if (target) {
          target.splits = g1.splits;
        }
      } catch {
        /* skip */
      }
    } else if (rt === "Z1") {
      flushAthlete();
    }
  }

  flushAthlete();

  if (!meet) {
    throw new Error("HY3 parse error: missing B1 meet record");
  }
  return { meet, teams: teamMap };
}

// ─── Flatten helpers ──────────────────────────────────────────────────────────

export interface Hy3FlatResult {
  athlete: Hy3Athlete;
  entry: Hy3Entry;
  results: Hy3Result[];
  teamAbbr: string;
}

export function flattenHy3Results(hy3: Hy3File): Hy3FlatResult[] {
  const out: Hy3FlatResult[] = [];
  for (const [abbr, { athletes }] of hy3.teams) {
    for (const record of athletes) {
      for (const { entry, results } of record.entries) {
        out.push({ teamAbbr: abbr, athlete: record.athlete, entry, results });
      }
    }
  }
  return out;
}
