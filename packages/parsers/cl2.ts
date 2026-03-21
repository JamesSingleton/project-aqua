// ─────────────────────────────────────────────────────────────────────────────
// CL2 Parser — Meet results export from Hy-Tek Meet Manager
// All field positions forensically verified against real CL2 files.
// ─────────────────────────────────────────────────────────────────────────────

import type { Cl2File, Cl2Meet, Cl2Result, Cl2Team, Stroke } from "./types";
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
const WHITE_SPACE_REGEX = /\s+/;

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

function parseAgeGroup(raw: string): { min: number; max: number } {
  const s = raw.trim();
  if (!s || s.length < 3) {
    return { min: 0, max: 0 };
  }
  if (s.startsWith("UN") || s.startsWith("un")) {
    return { min: 0, max: Number(s.slice(2)) || 0 };
  }
  return { min: Number(s.slice(0, 2)) || 0, max: Number(s.slice(2, 4)) || 0 };
}

// ─── B11 — Meet Info ──────────────────────────────────────────────────────────
// [11:41]   meet name (30 chars)
// [41:85]   address (44 chars)
// [85:105]  city (20 chars)
// [105:107] state, [107:112] zip
// [117:120] country
// [121:129] start date MMDDYYYY, [129:137] end date
// [149]     course Y/S/L
// [157]     masters flag Y/N

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

// ─── C11 — Team Info ──────────────────────────────────────────────────────────
// [3:5] LSC, [13:19] abbr (6 chars), [19:51] name, [51:89] addr, [89:107] city
// [107:109] state, [109:119] zip

function parseC11(line: string): Cl2Team {
  return {
    lsc: field(line, 3, 5),
    abbreviation: field(line, 13, 19),
    name: field(line, 19, 51),
    address: field(line, 51, 89),
    city: field(line, 89, 107),
    state: field(line, 107, 109),
    zip: field(line, 109, 119),
  };
}

// ─── D01 — Athlete Result ────────────────────────────────────────────────────
// Forensically verified layout (0-indexed):
//  [11:39]   name "Last, First MI" (28 chars)
//  [39:51]   member ID (12 hex), [51] suffix, [52:55] citizenship
//  [55:63]   DOB MMDDYYYY, [63:65] age, [65] gender, [66] club flag
//  [67:71]   distance (4 chars right-justified)
//  [71:75]   event catalog number (4 chars, strip spaces) — 4 chars in CL2 vs 3 in SD3
//  [75]      stroke code (letter or digit)
//  [76:80]   age group ("1314","1518","UN10")
//  [80:88]   swim date MMDDYYYY
//  [88:96]   seed time (8 chars), [96] seed course
//  [97:105]  finals time (8 chars), [105] finals course / 'S' for exhibition
//  [116:124] best/alt time (8 chars), [124] alt course
//  [125:127] prelim heat place, [127:129] prelim heat
//  [129:131] finals heat place, [131:133] finals lane
//  [133:136] heat count, [136:139] entry count
//  [156:158] DQ code ("NN" = clean), [158:160] checksum

function parseD01(line: string): Cl2Result {
  const nameRaw = field(line, 11, 39);
  const commaIdx = nameRaw.indexOf(",");
  const lastName =
    commaIdx >= 0 ? nameRaw.slice(0, commaIdx).trim() : nameRaw.trim();
  const firstName =
    (commaIdx >= 0 ? nameRaw.slice(commaIdx + 1).trim() : "").split(
      WHITE_SPACE_REGEX
    )[0] ?? "";

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
  const course = parseCourse(exhibition ? "Y" : finCourseRaw);

  const altTime = parseTime(field(line, 116, 124));

  const prelimHeatPlace = numField(line, 125, 127);
  const prelimHeat = numField(line, 127, 129);
  const finalsHeatPlace = numField(line, 129, 131);
  const finalsLane = numField(line, 131, 133);
  const heatCount = numField(line, 133, 136);
  const entryCount = numField(line, 136, 139);

  const dqRaw = line.length > 158 ? field(line, 156, 158) : "NN";
  const dqCode = dqRaw === "NN" || dqRaw === "  " ? "" : dqRaw;

  const hasFinals = finishTime !== null && finalsHeatPlace > 0;
  const hasPrelim = prelimHeatPlace > 0;
  const round: "F" | "P" | "S" = hasFinals ? "F" : "P";

  // Suppress unused variable warning
  void course;
  void seedCourse;
  void entryCount;

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

// ─── G01 — Split Times ────────────────────────────────────────────────────────
// [39:51]  member ID (12 hex)
// [51]     split count (1 digit)
// [59:]    cumulative split times, each 9 chars wide
// [147]    round indicator F/P/S

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

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseCl2(buf: Buffer): Cl2File {
  const content = decodeHytekBuffer(buf);
  const lines = splitLines(content);

  let meet: Cl2Meet | undefined;
  const teams: Cl2Team[] = [];
  const results: Cl2Result[] = [];
  let pendingResult: Cl2Result | null = null;

  function flushPending() {
    if (pendingResult) {
      results.push(pendingResult);
      pendingResult = null;
    }
  }

  for (const line of lines) {
    if (!line || line.length < 3) {
      continue;
    }
    const rt = line.slice(0, 3);

    if (rt === "A01") {
      /* header — skip */
    } else if (rt === "B11") {
      try {
        meet = parseB11(line);
      } catch {
        /* skip */
      }
    } else if (rt === "C11") {
      try {
        teams.push(parseC11(line));
      } catch {
        /* skip */
      }
    } else if (rt === "D01") {
      flushPending();
      try {
        pendingResult = parseD01(line);
      } catch {
        pendingResult = null;
      }
    } else if (rt === "G01") {
      if (pendingResult) {
        try {
          const g01 = parseG01(line);
          if (g01 && g01.memberId === pendingResult.memberId) {
            if (pendingResult.splits.length === 0) {
              pendingResult.splits = g01.splits;
              pendingResult.round = g01.round;
            } else {
              // Second G01 = second round — flush and create sibling
              const flushed: Cl2Result = pendingResult;
              results.push(flushed);
              pendingResult = {
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
      flushPending();
    }
  }

  flushPending();

  if (!meet) {
    throw new Error("CL2 parse error: missing B11 meet record");
  }
  return { meet, teams, results };
}

export function groupCl2ByAthlete(
  cl2: Cl2File
): Map<string, { name: string; results: Cl2Result[] }> {
  const map = new Map<string, { name: string; results: Cl2Result[] }>();
  for (const result of cl2.results) {
    const existing = map.get(result.memberId);
    if (existing) {
      existing.results.push(result);
    } else {
      map.set(result.memberId, {
        name: `${result.lastName}, ${result.firstName}`,
        results: [result],
      });
    }
  }
  return map;
}
