import {
  buildEventKey,
  type Course,
  type EventGender,
  type RelayStroke,
  type Stroke,
} from "@project-aqua/swim-core/events";
import { parseResultRoundType, parseSdifHeatLane } from "../g0-meta";
import { parseCl2Roster } from "../roster/cl2";
import {
  genderFromEventCode,
  parseAusaBirthDate,
  parseLastFirstName,
  parseSdifBirthDate,
  parseUsaMemberIdFromLine,
} from "../roster/utils";
import type { ParsedMeet, ParsedRelayEntry, ParsedResult } from "../types";

import { type Cl2FileKind, detectCl2FileKind } from "./kind";

const STROKE_DIGIT: Record<string, string> = {
  "1": "free",
  "2": "back",
  "3": "breast",
  "4": "fly",
  "5": "im",
};

const RELAY_STROKE_DIGIT: Record<string, string> = {
  "6": "free_relay",
  "7": "medley_relay",
  "8": "medley_relay",
};

const TIME_RE = /(\d{0,2}:?\d{1,2}\.\d{2}|NT|DQ|NS|SCR|DNF)([YSL])?/gi;

function parseMmDdYyyy(raw: string): string {
  // Callers only pass `\d{8}` matches from B1 date scanning.
  const digits = raw.replace(/\D/g, "");
  return `${digits.slice(4, 8)}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
}

function courseFromSuffix(suffix: string): Course {
  const c = suffix.toUpperCase();
  if (c === "L") return "LCM";
  if (c === "S") return "SCM";
  return "SCY";
}

function decodeEventCode(code: string): {
  eventNumber: number;
  distance?: number;
  stroke?: string;
  relay?: boolean;
} | null {
  const digits = code.replace(/\D/g, "");
  // extractEventCode / relay parsers only pass digit strings.
  const eventNumber = Number.parseInt(digits, 10);
  if (!Number.isFinite(eventNumber) || eventNumber <= 0) return null;

  const strokeDigit = digits.slice(-1);
  const distanceRaw = digits.slice(0, -1);
  const distance = Number.parseInt(distanceRaw, 10);
  if (!Number.isFinite(distance) || distance <= 0) {
    return { eventNumber };
  }

  if (RELAY_STROKE_DIGIT[strokeDigit]) {
    return {
      eventNumber,
      distance,
      stroke: RELAY_STROKE_DIGIT[strokeDigit],
      relay: true,
    };
  }

  const stroke = STROKE_DIGIT[strokeDigit];
  if (!stroke) return { eventNumber };
  return { eventNumber, distance, stroke, relay: false };
}

function genderFromLine(line: string): EventGender | undefined {
  if (/\bFF\b/.test(line) || /\d{2}FF\b/.test(line)) return "female";
  if (/\bMM\b/.test(line) || /\d{2}MM\b/.test(line)) return "male";
  if (/\bX[XF]\b|\bMixed\b/i.test(line)) return "mixed";
  return undefined;
}

/** Hy-Tek D0 packs DOB+age+sex as `MMDDYYYY{age}MM|FF` (e.g. `1115198912MM`). */
function parseAthleteIdentity(line: string): {
  dateOfBirth?: string;
  gender?: "male" | "female";
} {
  const packed = line.match(/\b(\d{8})\d{0,2}(MM|FF)\b/);
  if (packed) {
    return {
      dateOfBirth: parseSdifBirthDate(packed[1]!),
      gender: genderFromEventCode(packed[2]!),
    };
  }

  const eventGender =
    line.match(/(FF|MM)\s+\d/) ?? line.match(/\d{2}(FF|MM)\s/);
  const gender = eventGender ? genderFromEventCode(eventGender[1]!) : undefined;
  const sdifDobMatch = line.match(/\b(\d{8})\d?\s+[MF]\b/);
  const dateOfBirth =
    parseAusaBirthDate(line) ??
    (sdifDobMatch ? parseSdifBirthDate(sdifDobMatch[1]!) : undefined);

  return { dateOfBirth, gender };
}

function parseCl2TeamCode(line: string): string | undefined {
  const m = line.match(/^C1\d?[A-Z0-9]{0,2}\s+([A-Z0-9]{2,8})/);
  return m?.[1];
}

type AthleteIdentityCache = {
  dateOfBirth?: string;
  gender?: "male" | "female";
  usaMemberId?: string;
  teamCode?: string;
};

/** Extract "Last, First …" from Hy-Tek D0/G0 name field (cols 11–51-ish). */
function parseHytekSwimmerName(line: string): {
  swimmerName: string;
  usaMemberId?: string;
} {
  const nameRegion = line.length > 11 ? line.substring(11, 55) : line;
  const commaMatch = nameRegion.match(
    /([A-Za-z][^,]{0,30}),\s*([A-Za-z][A-Za-z.\-']*(?:\s+[A-Za-z][A-Za-z.\-']*)?)/,
  );
  if (commaMatch) {
    const parsed = parseLastFirstName(`${commaMatch[1]}, ${commaMatch[2]}`);
    // Trailing single-letter exhibition flags (A/X) are not middle names.
    const middle =
      parsed.middleName && parsed.middleName.length > 1
        ? ` ${parsed.middleName}`
        : "";
    return {
      swimmerName: `${parsed.firstName}${middle} ${parsed.lastName}`.trim(),
      usaMemberId: parseUsaMemberIdFromLine(line),
    };
  }

  const last = line.substring(11, 31).trim();
  const first = line.substring(31, 51).trim();
  if (last || first) {
    return {
      swimmerName: `${first} ${last}`.trim(),
      usaMemberId:
        line.substring(51, 65).trim() || parseUsaMemberIdFromLine(line),
    };
  }

  return { swimmerName: "", usaMemberId: parseUsaMemberIdFromLine(line) };
}

function extractTimes(line: string): Array<{ time: string; course?: Course }> {
  const out: Array<{ time: string; course?: Course }> = [];
  for (const match of line.matchAll(TIME_RE)) {
    const raw = match[1]!.toUpperCase();
    const suffix = match[2];
    out.push({
      time: raw,
      course: suffix ? courseFromSuffix(suffix) : undefined,
    });
  }
  return out;
}

function isNoTime(time: string): boolean {
  return /^(NT|NS|SCR|DNF|DQ)?$/i.test(time.trim()) || time.trim() === "";
}

function isDqTime(time: string, line: string): boolean {
  return /^(DQ|NS|SCR|DNF)$/i.test(time.trim()) || /\bDQ\b/i.test(line);
}

/** Event code after FF/MM on D0 lines, e.g. `FF 1003 17` or `MM  501 18`. */
function extractEventCode(line: string): string | undefined {
  const m =
    line.match(/\b(?:FF|MM|XF|FM|MF)\s+(\d{3,4})\b/) ??
    line.match(/\d{2}(?:FF|MM)\s+(\d{3,4})\b/);
  return m?.[1];
}

function ensureEvent(
  meet: ParsedMeet,
  eventNumber: number,
  opts: {
    distance?: number;
    stroke?: string;
    gender?: EventGender;
    course?: Course;
  },
): void {
  if (meet.events.some((e) => e.eventNumber === eventNumber)) return;
  /* v8 ignore start -- @preserve */
  const distance = opts.distance ?? 50;
  const stroke = opts.stroke ?? "free";
  const gender = opts.gender ?? "mixed";
  const course = opts.course ?? meet.course;
  /* v8 ignore stop -- @preserve */
  meet.events.push({
    eventNumber,
    distance,
    stroke,
    gender,
    eventKey: buildEventKey(
      distance,
      stroke as Stroke | RelayStroke,
      course,
      gender,
    ),
  });
}

function parseRelayTeamLine(line: string): ParsedRelayEntry | null {
  const m = line.match(/^E0\S*\s+([A-Z])\s*([A-Z0-9]+)\s+([A-Z])\s+(\d{3,4})/i);
  if (!m) return null;
  const decoded = decodeEventCode(m[4]!);
  const times = extractTimes(line);
  const seed = times.find((t) => !isNoTime(t.time) && t.time !== "NT");
  return {
    eventNumber: decoded?.eventNumber,
    swimmerNames: [],
    seedTime: seed?.time,
    teamCode: m[2],
    relayLetter: m[1],
  };
}

function parseRelayLegLine(line: string): {
  teamCode?: string;
  relayLetter?: string;
  swimmerName: string;
  legOrder?: number;
} | null {
  const m = line.match(
    /^F0\S*\s+(\d+)\s+([A-Z0-9]+?)([A-Z])([A-Za-z][^,]*,\s*\S+)/,
  );
  if (!m) {
    const name = parseHytekSwimmerName(line);
    if (!name.swimmerName) return null;
    return { swimmerName: name.swimmerName };
  }
  const parsed = parseLastFirstName(m[4]!);
  return {
    legOrder: Number.parseInt(m[1]!, 10) || undefined,
    teamCode: m[2],
    relayLetter: m[3],
    swimmerName: `${parsed.firstName} ${parsed.lastName}`.trim(),
  };
}

function parseG0Result(line: string): ParsedResult | null {
  const { swimmerName, usaMemberId } = parseHytekSwimmerName(line);
  const times = extractTimes(line);
  const swimTimes = times.filter((t) => !isNoTime(t.time));
  const special = times.find((t) => /^(DQ|NS|SCR|DNF)$/i.test(t.time));
  if (swimTimes.length === 0 && !special && !/\bDQ\b/i.test(line)) return null;

  const primary =
    swimTimes.find((t) => t.time.includes(":")) ??
    swimTimes[swimTimes.length - 1] ??
    swimTimes[0] ??
    special;

  const time = primary!.time;
  const eventCode = extractEventCode(line);
  let eventNumber = eventCode ? Number.parseInt(eventCode, 10) : undefined;
  if (eventNumber == null) {
    const raw = line.substring(2, 6).trim();
    if (/^\d+$/.test(raw)) eventNumber = Number.parseInt(raw, 10);
  }

  let place: number | undefined;
  const placeMatch = line.match(
    /(?:\d{0,2}:?\d{1,2}\.\d{2})[YSL]?\s+(\d{1,3})\b/,
  );
  if (placeMatch) place = Number.parseInt(placeMatch[1]!, 10);
  else {
    const p = Number.parseInt(line.substring(82, 86).trim(), 10);
    if (Number.isFinite(p) && p > 0) place = p;
  }

  const { heat, lane } = parseSdifHeatLane(line);
  const resultType = parseResultRoundType(line);

  return {
    eventNumber: eventNumber && eventNumber > 0 ? eventNumber : undefined,
    swimmerName,
    time,
    place,
    isDq: isDqTime(time, line),
    usaMemberId: usaMemberId || undefined,
    ...(resultType ? { resultType } : {}),
    ...(heat != null ? { heat } : {}),
    ...(lane != null ? { lane } : {}),
  };
}

function parseD0Athlete(
  line: string,
  kind: Cl2FileKind,
  hasG0: boolean,
  meet: ParsedMeet,
  teamCode: string | undefined,
  identityByName: Map<string, AthleteIdentityCache>,
): void {
  const { swimmerName, usaMemberId } = parseHytekSwimmerName(line);
  if (!swimmerName) return;

  const eventCode = extractEventCode(line);
  const decoded = eventCode ? decodeEventCode(eventCode) : null;
  const gender = genderFromLine(line);
  const times = extractTimes(line);
  const course = times.find((t) => t.course)?.course ?? meet.course;
  const identity = parseAthleteIdentity(line);
  const rosterGender = identity.gender;

  identityByName.set(swimmerName.toLowerCase(), {
    dateOfBirth: identity.dateOfBirth,
    gender: rosterGender,
    usaMemberId: usaMemberId || undefined,
    teamCode,
  });

  if (
    decoded?.eventNumber &&
    decoded.distance &&
    decoded.stroke &&
    !decoded.relay
  ) {
    ensureEvent(meet, decoded.eventNumber, {
      distance: decoded.distance,
      stroke: decoded.stroke,
      gender,
      course,
    });
  } else if (decoded?.eventNumber) {
    ensureEvent(meet, decoded.eventNumber, { gender, course });
  }

  const eventNumber = decoded?.eventNumber;
  const swimTimes = times.filter((t) => !isNoTime(t.time) && t.time !== "NT");
  const special = times.find((t) => /^(DQ|NS|SCR|DNF)$/i.test(t.time));
  const seedTime = swimTimes[0]?.time;

  // Legacy Meet Results without G0: final time (or DQ/NS) on D0
  if (kind === "meet_results" && !hasG0) {
    const finalTime = swimTimes[swimTimes.length - 1] ?? special;
    if (!finalTime) return;

    let place: number | undefined;
    const placeMatch = line.match(
      /(?:\d{0,2}:?\d{1,2}\.\d{2})[YSL]?\s+(\d{1,3})\b/,
    );
    if (placeMatch) place = Number.parseInt(placeMatch[1]!, 10);

    meet.results.push({
      eventNumber,
      swimmerName,
      time: finalTime.time,
      place,
      isDq: isDqTime(finalTime.time, line),
      usaMemberId: usaMemberId || undefined,
      dateOfBirth: identity.dateOfBirth,
      gender: rosterGender,
      teamCode,
    });

    meet.entries.push({
      eventNumber,
      swimmerName,
      seedTime: swimTimes.length > 1 ? swimTimes[0]!.time : undefined,
      usaMemberId: usaMemberId || undefined,
    });

    const courseFromTimes = [...swimTimes]
      .reverse()
      .find((t) => t.course)?.course;
    if (courseFromTimes) meet.course = courseFromTimes;
    return;
  }

  meet.entries.push({
    eventNumber,
    swimmerName,
    seedTime,
    usaMemberId: usaMemberId || undefined,
  });
}

/**
 * Parse Hy-Tek CL2 meet results / entries.
 * Handles legacy D0-embedded results and modern G0 results; E0/F0 are relays.
 */
export function parseCl2Meet(content: string): ParsedMeet {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const kind = detectCl2FileKind(content);

  if (kind === "swimmers_only") {
    throw new Error(
      "This CL2 file is a Swimmers Only roster export, not a meet file. Import it from Roster import instead.",
    );
  }

  const hasG0 = lines.some((l) => l.startsWith("G0"));

  const meet: ParsedMeet = {
    name: "CL2 Import",
    course: "SCY",
    events: [],
    entries: [],
    results: [],
    importKind:
      kind === "meet_results"
        ? "results"
        : kind === "meet_entries"
          ? "entries"
          : undefined,
  };

  for (const line of lines) {
    const type = line.substring(0, 2);
    if (type === "A0") {
      const fileType = line.substring(11, 30).trim().toLowerCase();
      if (fileType.includes("result")) meet.name = "Meet Results";
      else if (fileType.includes("entries")) meet.name = "Meet Entries";
      const title = line.substring(43, 73).trim();
      if (title) meet.name = title;
    }
    if (type === "B1") {
      const name = line.substring(11, 41).trim();
      if (name) meet.name = name;
      const loc = line.substring(41, 71).trim();
      if (loc) meet.location = loc;
      const dateMatches = line.substring(40).match(/(\d{8})/g) ?? [];
      if (dateMatches[0]) {
        meet.startDate = parseMmDdYyyy(dateMatches[0]);
      }
      if (dateMatches[1]) {
        meet.endDate = parseMmDdYyyy(dateMatches[1]);
      }
      const courseFlag = line.substring(87, 100);
      if (courseFlag.includes("L") || /\bLCM\b/.test(line)) meet.course = "LCM";
      else if (
        (courseFlag.includes("S") && !courseFlag.includes("Y")) ||
        /\bSCM\b/.test(line)
      ) {
        meet.course = "SCM";
      } else {
        meet.course = "SCY";
      }
    }
  }

  const relays: ParsedRelayEntry[] = [];
  const identityByName = new Map<string, AthleteIdentityCache>();
  let lastTeamCode: string | undefined;

  for (const line of lines) {
    const type = line.substring(0, 2);
    if (type === "C1") {
      lastTeamCode = parseCl2TeamCode(line) ?? lastTeamCode;
    } else if (type === "D0" || type === "D1") {
      parseD0Athlete(line, kind, hasG0, meet, lastTeamCode, identityByName);
    } else if (type === "G0" && kind !== "meet_entries") {
      const result = parseG0Result(line);
      if (result?.time) {
        const cached = identityByName.get(result.swimmerName.toLowerCase());
        if (cached) {
          result.dateOfBirth ??= cached.dateOfBirth;
          result.gender ??= cached.gender;
          result.usaMemberId ??= cached.usaMemberId;
          result.teamCode ??= cached.teamCode;
        } else if (lastTeamCode) {
          result.teamCode = lastTeamCode;
        }
        meet.results.push(result);
      }
    } else if (type === "E0") {
      const relay = parseRelayTeamLine(line);
      if (relay) relays.push(relay);
    } else if (type === "F0") {
      const leg = parseRelayLegLine(line);
      if (!leg) continue;
      let attached = false;
      for (let i = relays.length - 1; i >= 0; i--) {
        const r = relays[i]!;
        const teamOk = !leg.teamCode || r.teamCode === leg.teamCode;
        const letterOk = !leg.relayLetter || r.relayLetter === leg.relayLetter;
        if (teamOk && letterOk) {
          r.swimmerNames.push(leg.swimmerName);
          attached = true;
          break;
        }
      }
      if (!attached && relays.length > 0) {
        relays[relays.length - 1]!.swimmerNames.push(leg.swimmerName);
      }
    }
  }

  if (relays.length > 0) {
    meet.relays = relays.filter((r) => r.swimmerNames.length > 0 || r.teamCode);
  }

  if (
    kind === "meet_entries" &&
    meet.entries.length === 0 &&
    meet.results.length === 0
  ) {
    const roster = parseCl2Roster(content);
    for (const row of roster) {
      meet.entries.push({
        swimmerName: `${row.firstName} ${row.lastName}`,
        usaMemberId: row.usaMemberId,
      });
    }
  }

  return meet;
}

export { type Cl2FileKind, detectCl2FileKind } from "./kind";
