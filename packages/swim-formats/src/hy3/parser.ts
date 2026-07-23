import { normalizeMeetEndDate } from "@project-aqua/swim-core/calendar-date";
import {
  buildEventKey,
  type Course,
  type EventGender,
  parseEventGender,
  type RelayStroke,
  type Stroke,
} from "@project-aqua/swim-core/events";
import { formatTime as formatMs } from "@project-aqua/swim-core/times";
import type {
  ParsedEntry,
  ParsedEvent,
  ParsedMeet,
  ParsedRelayEntry,
  ParsedResult,
} from "../types";

/** 1-based extract matching hytek-parser's `extract`. */
function extract(line: string, start: number, length: number): string {
  const from = start - 1;
  return line.slice(from, from + length).trim();
}

function safeInt(raw: string, fallback = 0): number {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function safeFloat(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

function parseMmDdYyyy(raw: string): string | undefined {
  const cleaned = raw.trim();
  if (!/^\d{8}$/.test(cleaned)) return undefined;
  const month = cleaned.slice(0, 2);
  const day = cleaned.slice(2, 4);
  const year = cleaned.slice(4, 8);
  return `${year}-${month}-${day}`;
}

type ResultKind = "prelim" | "swimoff" | "finals";

const STROKE_CODES: Record<string, string> = {
  A: "free",
  B: "back",
  C: "breast",
  D: "fly",
  E: "im",
  "1": "free",
  "2": "back",
  "3": "breast",
  "4": "fly",
  "5": "im",
};

const COURSE_CODES: Record<string, Course> = {
  Y: "SCY",
  "2": "SCY",
  S: "SCM",
  M: "SCM",
  "1": "SCM",
  L: "LCM",
  "3": "LCM",
};

const DQ_TIME_CODES = new Set(["Q", "F", "D"]);

type Hy3Swimmer = {
  meetId: number;
  firstName: string;
  lastName: string;
  nickName?: string;
  usaMemberId?: string;
  gender: EventGender;
  age?: number;
  classYear?: string;
  teamCode?: string;
};

type Hy3Entry = {
  eventNumber?: number;
  meetId?: number;
  relay: boolean;
  seedSeconds?: number;
  seedCourse?: Course;
  exhibition: boolean;
  meetDivision?: string;
  teamCode?: string;
  relayLetter?: string;
  legSwimmers: Map<number, number>;
  prelim?: RoundResult;
  swimoff?: RoundResult;
  finals?: RoundResult;
};

type RoundResult = {
  timeSeconds?: number;
  timeCode?: string;
  dqCode?: string;
  heat?: number;
  lane?: number;
  heatPlace?: number;
  overallPlace?: number;
  splits: Map<number, number>;
};

type Hy3Event = {
  number: string;
  eventNumber?: number;
  distance: number;
  stroke: string;
  course: Course;
  gender: EventGender;
  ageMin?: number;
  ageMax?: number;
  relay: boolean;
};

type ParseState = {
  meet: ParsedMeet;
  swimmers: Map<number, Hy3Swimmer>;
  events: Map<string, Hy3Event>;
  entries: Hy3Entry[];
  lastTeamCode?: string;
  lastEventKey?: string;
  lastEntry?: Hy3Entry;
  endDate?: string;
  altitude?: number;
  sanctionNumber?: string;
  notes?: string;
};

function mapStroke(code: string, isRelay: boolean): string {
  const base = STROKE_CODES[code.toUpperCase()] ?? "free";
  if (!isRelay) return base;
  return base === "im" ? "medley_relay" : "free_relay";
}

function mapCourse(code: string, fallback: Course = "SCY"): Course {
  return COURSE_CODES[code.toUpperCase()] ?? fallback;
}

function formatAgeGroup(
  ageMin: number | undefined,
  ageMax: number | undefined,
): string | undefined {
  if (ageMin == null && ageMax == null) return undefined;
  const low = ageMin ?? 0;
  const high = ageMax ?? 109;
  if (low <= 0 && high >= 99) return undefined;
  if (ageMin != null && ageMax != null) return `${ageMin}-${ageMax}`;
  if (ageMin != null) return `${ageMin}&O`;
  return `${ageMax}&U`;
}

function swimmerDisplayName(swimmer: Hy3Swimmer): string {
  const first = swimmer.nickName || swimmer.firstName;
  return `${first} ${swimmer.lastName}`.trim();
}

function secondsToTimeString(seconds: number | undefined): string | undefined {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return undefined;
  }
  return formatMs(Math.round(seconds * 1000));
}

function parseNumericEventNumber(raw: string): number | undefined {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return undefined;
  return Number.parseInt(digits, 10);
}

function parseTimeField(raw: string): number | undefined {
  const cleaned = raw.trim();
  if (!cleaned || /^[A-Z]+$/i.test(cleaned)) return undefined;
  return safeFloat(cleaned);
}

function ensureEvent(
  state: ParseState,
  key: string,
  event: Hy3Event,
): Hy3Event {
  const existing = state.events.get(key);
  if (existing) return existing;
  state.events.set(key, event);
  return event;
}

function applyRound(
  entry: Hy3Entry,
  kind: ResultKind,
  result: RoundResult,
): void {
  entry[kind] = result;
}

function parseResultKind(code: string): ResultKind | undefined {
  if (code === "P") return "prelim";
  if (code === "S") return "swimoff";
  if (code === "F") return "finals";
  return undefined;
}

function bestResult(entry: Hy3Entry): {
  kind: ResultKind;
  result: RoundResult;
} | null {
  if (entry.finals?.timeSeconds != null || entry.finals?.timeCode) {
    return { kind: "finals", result: entry.finals };
  }
  if (entry.swimoff?.timeSeconds != null || entry.swimoff?.timeCode) {
    return { kind: "swimoff", result: entry.swimoff };
  }
  if (entry.prelim?.timeSeconds != null || entry.prelim?.timeCode) {
    return { kind: "prelim", result: entry.prelim };
  }
  return null;
}

function parseA1(_line: string, _state: ParseState): void {
  // File metadata not needed for ParsedMeet flatten.
}

function parseB1(line: string, state: ParseState): void {
  const name = extract(line, 3, 45);
  const facility = extract(line, 48, 45);
  const start = parseMmDdYyyy(extract(line, 93, 8));
  const end = parseMmDdYyyy(extract(line, 101, 8));
  const altitudeRaw = extract(line, 117, 5);
  if (name) state.meet.name = name;
  if (facility) state.meet.location = facility;
  if (start) state.meet.startDate = start;
  if (end) state.endDate = end;
  const altitude = safeInt(altitudeRaw, -1);
  if (altitude >= 0) state.altitude = altitude;
}

function parseB2(line: string, state: ParseState): void {
  const notes = extract(line, 3, 45);
  const course = mapCourse(extract(line, 99, 1), state.meet.course);
  const sanction = extract(line, 109, 20);
  state.meet.course = course;
  if (notes) state.notes = notes;
  if (sanction) state.sanctionNumber = sanction;
}

function parseC1(line: string, state: ParseState): void {
  const code = extract(line, 3, 5);
  if (code) state.lastTeamCode = code;
}

function parseC2(_line: string, _state: ParseState): void {
  // Team address retained in full parse path later if needed.
}

function parseC3(_line: string, _state: ParseState): void {
  // Team contact retained in full parse path later if needed.
}

function parseD1(line: string, state: ParseState): void {
  const meetId = safeInt(extract(line, 4, 5), -1);
  if (meetId < 0) return;
  const gender = parseEventGender(extract(line, 3, 1));
  const lastName = extract(line, 9, 20);
  const firstName = extract(line, 29, 20);
  const nickName = extract(line, 49, 20) || undefined;
  const usaMemberId = extract(line, 70, 14) || undefined;
  const age = safeInt(extract(line, 97, 3), -1);
  const classYear = extract(line, 100, 2) || undefined;

  state.swimmers.set(meetId, {
    meetId,
    firstName,
    lastName,
    nickName,
    usaMemberId,
    gender,
    age: age >= 0 ? age : undefined,
    classYear,
    teamCode: state.lastTeamCode,
  });
}

function parseE1(line: string, state: ParseState): void {
  const meetId = safeInt(extract(line, 4, 5), -1);
  const eventGender = parseEventGender(extract(line, 14, 1));
  const distance = safeInt(extract(line, 16, 6));
  const strokeCode = extract(line, 22, 1);
  const ageMin = safeInt(extract(line, 23, 3), -1);
  const ageMax = safeInt(extract(line, 26, 3), -1);
  const eventNumberRaw = extract(line, 39, 4);
  const eventCourse = mapCourse(extract(line, 51, 1), state.meet.course);
  const seedSeconds = parseTimeField(extract(line, 52, 8));
  const seedCourse = mapCourse(extract(line, 60, 1), eventCourse);
  const meetDivision =
    extract(line, 77, 3) || extract(line, 92, 2) || undefined;
  const exhibition = extract(line, 84, 1).toUpperCase() === "X";
  const stroke = mapStroke(strokeCode, false);
  const eventNumber = parseNumericEventNumber(eventNumberRaw);
  const eventKey = eventNumberRaw || `${distance}-${stroke}-${eventGender}`;

  ensureEvent(state, eventKey, {
    number: eventKey,
    eventNumber,
    distance,
    stroke,
    course: eventCourse,
    gender: eventGender,
    ageMin: ageMin >= 0 ? ageMin : undefined,
    ageMax: ageMax >= 0 ? ageMax : undefined,
    relay: false,
  });

  const entry: Hy3Entry = {
    eventNumber,
    meetId: meetId >= 0 ? meetId : undefined,
    relay: false,
    seedSeconds,
    seedCourse,
    exhibition,
    meetDivision,
    legSwimmers: new Map(),
  };
  state.entries.push(entry);
  state.lastEventKey = eventKey;
  state.lastEntry = entry;
}

function parseE2(line: string, state: ParseState): void {
  const entry = state.lastEntry;
  if (!entry) return;
  const kind = parseResultKind(extract(line, 3, 1));
  if (!kind) return;

  const timeSeconds = parseTimeField(extract(line, 4, 8));
  const timeCode = extract(line, 13, 1) || undefined;
  const dqCode = DQ_TIME_CODES.has(timeCode ?? "")
    ? extract(line, 14, 2) || undefined
    : undefined;
  const heat = safeInt(extract(line, 21, 3), -1);
  const lane = safeInt(extract(line, 24, 3), -1);
  const heatPlace = safeInt(extract(line, 27, 3), -1);
  const overallPlace = safeInt(extract(line, 30, 4), -1);

  applyRound(entry, kind, {
    timeSeconds,
    timeCode,
    dqCode,
    heat: heat >= 0 ? heat : undefined,
    lane: lane >= 0 ? lane : undefined,
    heatPlace: heatPlace >= 0 ? heatPlace : undefined,
    overallPlace: overallPlace >= 0 ? overallPlace : undefined,
    splits: new Map(),
  });
}

function parseF1(line: string, state: ParseState): void {
  const teamCode = extract(line, 3, 5);
  const relayLetter = extract(line, 8, 1);
  const eventGender = parseEventGender(extract(line, 14, 1));
  const distance = safeInt(extract(line, 16, 6));
  const strokeCode = extract(line, 22, 1);
  const ageMin = safeInt(extract(line, 23, 3), -1);
  const ageMax = safeInt(extract(line, 26, 3), -1);
  const eventNumberRaw = extract(line, 39, 4);
  const eventCourse = mapCourse(extract(line, 51, 1), state.meet.course);
  const seedSeconds = parseTimeField(extract(line, 52, 8));
  const seedCourse = mapCourse(extract(line, 60, 1), eventCourse);
  const stroke = mapStroke(strokeCode, true);
  const eventNumber = parseNumericEventNumber(eventNumberRaw);
  const eventKey = eventNumberRaw || `${distance}-${stroke}-${eventGender}-R`;

  ensureEvent(state, eventKey, {
    number: eventKey,
    eventNumber,
    distance,
    stroke,
    course: eventCourse,
    gender: eventGender,
    ageMin: ageMin >= 0 ? ageMin : undefined,
    ageMax: ageMax >= 0 ? ageMax : undefined,
    relay: true,
  });

  const entry: Hy3Entry = {
    eventNumber,
    relay: true,
    seedSeconds,
    seedCourse,
    exhibition: false,
    teamCode,
    relayLetter,
    legSwimmers: new Map(),
  };
  state.entries.push(entry);
  state.lastEventKey = eventKey;
  state.lastEntry = entry;
}

function parseF2(line: string, state: ParseState): void {
  parseE2(line, state);
}

function parseF3(line: string, state: ParseState): void {
  const entry = state.lastEntry;
  if (!entry?.relay) return;
  for (let x = 0; x < 8; x++) {
    const offset = x * 13;
    const meetId = safeInt(extract(line, 4 + offset, 5), -1);
    if (meetId < 0) break;
    const leg = safeInt(extract(line, 15 + offset, 1), x + 1);
    entry.legSwimmers.set(leg, meetId);
  }
}

function parseG1(line: string, state: ParseState): void {
  const entry = state.lastEntry;
  if (!entry) return;
  const kind = parseResultKind(extract(line, 3, 1));
  if (!kind) return;
  const round = entry[kind] ?? {
    splits: new Map(),
  };
  let linePos = 4;
  while (linePos < 124 && line[linePos] != null && line[linePos] !== " ") {
    const splitNum = safeInt(extract(line, linePos, 2), -1);
    const splitTime = safeFloat(extract(line, linePos + 2, 8));
    if (splitNum >= 0 && splitTime != null) {
      round.splits.set(splitNum, splitTime);
    }
    linePos += 11;
  }
  entry[kind] = round;
}

function parseH1(line: string, state: ParseState): void {
  const entry = state.lastEntry;
  if (!entry) return;
  const dqCode = extract(line, 3, 2) || undefined;
  const target =
    entry.finals?.dqCode != null
      ? entry.finals
      : entry.swimoff?.dqCode != null
        ? entry.swimoff
        : entry.prelim;
  if (target && dqCode) target.dqCode = dqCode;
}

function parseH2(_line: string, _state: ParseState): void {
  // Detail string not flattened into ParsedMeet yet.
}

function flatten(state: ParseState): ParsedMeet {
  const events: ParsedEvent[] = [];
  const seenEventKeys = new Set<string>();

  for (const event of state.events.values()) {
    const gender = event.gender;
    const stroke = event.stroke;
    const course = event.course;
    const eventKey = buildEventKey(
      event.distance,
      stroke as Stroke | RelayStroke,
      course,
      gender,
    );
    if (seenEventKeys.has(eventKey + String(event.eventNumber ?? ""))) continue;
    seenEventKeys.add(eventKey + String(event.eventNumber ?? ""));
    events.push({
      eventNumber: event.eventNumber,
      distance: event.distance,
      stroke,
      gender,
      ageGroup: formatAgeGroup(event.ageMin, event.ageMax),
      eventKey,
    });
  }

  const entries: ParsedEntry[] = [];
  const results: ParsedResult[] = [];
  const relays: ParsedRelayEntry[] = [];

  for (const entry of state.entries) {
    if (entry.relay) {
      const names = [...entry.legSwimmers.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, id]) => state.swimmers.get(id))
        .filter((s): s is Hy3Swimmer => !!s)
        .map(swimmerDisplayName);
      relays.push({
        eventNumber: entry.eventNumber,
        swimmerNames: names,
        seedTime: secondsToTimeString(entry.seedSeconds),
        teamCode: entry.teamCode,
        relayLetter: entry.relayLetter,
      });
      continue;
    }

    const swimmer =
      entry.meetId != null ? state.swimmers.get(entry.meetId) : undefined;
    if (!swimmer) continue;
    const swimmerName = swimmerDisplayName(swimmer);

    entries.push({
      eventNumber: entry.eventNumber,
      swimmerName,
      seedTime: secondsToTimeString(entry.seedSeconds),
      usaMemberId: swimmer.usaMemberId,
      exhibition: entry.exhibition,
      meetDivision: entry.meetDivision,
    });

    const best = bestResult(entry);
    if (!best) continue;
    const time = secondsToTimeString(best.result.timeSeconds);
    const isDq =
      !!best.result.dqCode ||
      DQ_TIME_CODES.has(best.result.timeCode ?? "") ||
      best.result.timeCode === "Q";
    if (!time && !isDq) continue;
    results.push({
      eventNumber: entry.eventNumber,
      swimmerName,
      time: time ?? "DQ",
      place: best.result.overallPlace,
      isDq,
      usaMemberId: swimmer.usaMemberId,
      resultType: best.kind,
      heat: best.result.heat,
      lane: best.result.lane,
      dqCode: best.result.dqCode,
      exhibition: entry.exhibition,
    });
  }

  return {
    name: state.meet.name,
    startDate: state.meet.startDate,
    endDate: normalizeMeetEndDate(state.meet.startDate, state.endDate),
    course: state.meet.course,
    location: state.meet.location,
    altitude: state.altitude,
    sanctionNumber: state.sanctionNumber,
    notes: state.notes,
    events,
    entries,
    results,
    relays: relays.length > 0 ? relays : undefined,
  };
}

const LINE_PARSERS: Record<string, (line: string, state: ParseState) => void> =
  {
    A1: parseA1,
    B1: parseB1,
    B2: parseB2,
    C1: parseC1,
    C2: parseC2,
    C3: parseC3,
    D1: parseD1,
    E1: parseE1,
    E2: parseE2,
    F1: parseF1,
    F2: parseF2,
    F3: parseF3,
    G1: parseG1,
    H1: parseH1,
    H2: parseH2,
  };

/** Parse Hy-Tek Meet Manager .HY3 merge/entry/results exports. */
export function parseHy3(content: string): ParsedMeet {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const state: ParseState = {
    meet: {
      name: "HY-TEK Import",
      course: "SCY",
      events: [],
      entries: [],
      results: [],
    },
    swimmers: new Map(),
    events: new Map(),
    entries: [],
  };

  for (const line of lines) {
    if (line.length < 2) continue;
    const code = line.slice(0, 2);
    if (code === "Z0") break;
    const parser = LINE_PARSERS[code];
    if (parser) parser(line, state);
  }

  return flatten(state);
}
