import {
  buildEventKey,
  parseEventGender,
  type RelayStroke,
  type Stroke,
} from "@project-aqua/swim-core/events";
import { parseTime } from "@project-aqua/swim-core/times";
import type {
  ParsedEntry,
  ParsedEvent,
  ParsedMeet,
  ParsedResult,
} from "../types";

const STROKE_MAP: Record<string, string> = {
  FR: "free",
  FREE: "free",
  BK: "back",
  BACK: "back",
  BR: "breast",
  BREAST: "breast",
  FL: "fly",
  FLY: "fly",
  IM: "im",
};

function parseStroke(code: string): string {
  return STROKE_MAP[code.toUpperCase()] ?? code.toLowerCase();
}

function parseSdifDate(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(4, 8)}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
  }
  return undefined;
}

/** Parse SDIF/SD3 file content into structured meet data */
export function parseSdif(content: string): ParsedMeet {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const meet: ParsedMeet = {
    name: "Imported Meet",
    course: "SCY",
    events: [],
    entries: [],
    results: [],
    // entryLimits: not present in typical SDIF meet records
  };

  for (const line of lines) {
    const recordType = line.substring(0, 2);

    switch (recordType) {
      case "A0": {
        const title = line.substring(43, 73).trim();
        if (title) meet.name = title;
        break;
      }
      case "B1": {
        const name = line.substring(11, 41).trim();
        if (name) meet.name = name;
        const loc = line.substring(41, 71).trim();
        if (loc) meet.location = loc;
        const start = parseSdifDate(line.substring(71, 79));
        if (start) meet.startDate = start;
        if (line.includes("LCM")) meet.course = "LCM";
        else if (line.includes("SCM")) meet.course = "SCM";
        else meet.course = "SCY";
        break;
      }
      case "E1": {
        const gender = parseEventGender(
          line.substring(25, 26).trim() || line.substring(16, 17).trim(),
        );
        const distance =
          Number.parseInt(line.substring(26, 30).trim(), 10) ||
          Number.parseInt(line.substring(17, 21).trim(), 10) ||
          0;
        const stroke = parseStroke(
          line.substring(30, 33).trim() || line.substring(21, 24).trim(),
        );
        const event: ParsedEvent = {
          eventNumber:
            Number.parseInt(line.substring(9, 13).trim(), 10) ||
            Number.parseInt(line.substring(2, 6).trim(), 10) ||
            undefined,
          distance,
          stroke,
          gender,
          eventKey: buildEventKey(
            distance,
            stroke as Stroke | RelayStroke,
            meet.course,
            gender,
          ),
        };
        meet.events.push(event);
        break;
      }
      case "D0": {
        const entry: ParsedEntry = {
          eventNumber:
            Number.parseInt(line.substring(9, 13).trim(), 10) ||
            Number.parseInt(line.substring(2, 6).trim(), 10) ||
            undefined,
          swimmerName:
            `${line.substring(48, 68).trim()} ${line.substring(68, 88).trim()}`.trim() ||
            `${line.substring(31, 51).trim()} ${line.substring(11, 31).trim()}`.trim(),
          seedTime:
            line.substring(99, 107).trim() ||
            line.substring(72, 82).trim() ||
            undefined,
          usaMemberId:
            line.substring(16, 28).trim() ||
            line.substring(51, 65).trim() ||
            undefined,
        };
        meet.entries.push(entry);
        break;
      }
      case "G0": {
        const result: ParsedResult = {
          eventNumber:
            Number.parseInt(line.substring(9, 13).trim(), 10) ||
            Number.parseInt(line.substring(2, 6).trim(), 10) ||
            undefined,
          swimmerName:
            `${line.substring(48, 68).trim()} ${line.substring(68, 88).trim()}`.trim() ||
            `${line.substring(31, 51).trim()} ${line.substring(11, 31).trim()}`.trim(),
          time: line.substring(99, 107).trim() || line.substring(72, 82).trim(),
          place:
            Number.parseInt(line.substring(113, 117).trim(), 10) ||
            Number.parseInt(line.substring(82, 86).trim(), 10) ||
            undefined,
          isDq: line.substring(117, 118).trim() === "D" || /DQ/i.test(line),
        };
        if (result.time) meet.results.push(result);
        break;
      }
    }
  }

  return meet;
}

export { exportSdif } from "../export/meet";
export { parseTime };
