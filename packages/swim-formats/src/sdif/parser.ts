import { parseTime } from "@project-aqua/swim-core/times";
import type {
  ParsedEntry,
  ParsedEvent,
  ParsedMeet,
  ParsedResult,
} from "../types.js";

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

function parseGender(code: string): string {
  const upper = code.toUpperCase();
  if (upper === "M" || upper === "MALE") return "m";
  if (upper === "F" || upper === "FEMALE") return "f";
  return code.toLowerCase();
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
  };

  for (const line of lines) {
    const recordType = line.substring(0, 2);

    switch (recordType) {
      case "A0": {
        meet.name = line.substring(12, 52).trim() || meet.name;
        break;
      }
      case "B1": {
        const courseCode = line.substring(11, 12).trim();
        if (courseCode === "1") meet.course = "SCY";
        else if (courseCode === "2") meet.course = "SCM";
        else if (courseCode === "3") meet.course = "LCM";
        break;
      }
      case "E1": {
        const event: ParsedEvent = {
          eventNumber:
            Number.parseInt(line.substring(9, 13).trim(), 10) || undefined,
          distance: Number.parseInt(line.substring(26, 30).trim(), 10) || 0,
          stroke: parseStroke(line.substring(30, 33).trim()),
          gender: parseGender(line.substring(25, 26).trim()),
          eventKey: "",
        };
        event.eventKey = `${event.distance}_${event.stroke}_${meet.course.toLowerCase()}_${event.gender}`;
        meet.events.push(event);
        break;
      }
      case "D0": {
        const entry: ParsedEntry = {
          eventNumber:
            Number.parseInt(line.substring(9, 13).trim(), 10) || undefined,
          swimmerName:
            `${line.substring(48, 68).trim()} ${line.substring(68, 88).trim()}`.trim(),
          seedTime: line.substring(99, 107).trim() || undefined,
          usaMemberId: line.substring(16, 28).trim() || undefined,
        };
        meet.entries.push(entry);
        break;
      }
      case "G0": {
        const result: ParsedResult = {
          eventNumber:
            Number.parseInt(line.substring(9, 13).trim(), 10) || undefined,
          swimmerName:
            `${line.substring(48, 68).trim()} ${line.substring(68, 88).trim()}`.trim(),
          time: line.substring(99, 107).trim(),
          place:
            Number.parseInt(line.substring(113, 117).trim(), 10) || undefined,
          isDq: line.substring(117, 118).trim() === "D",
        };
        meet.results.push(result);
        break;
      }
    }
  }

  return meet;
}

export function exportSdif(meet: ParsedMeet): string {
  const lines: string[] = [];
  lines.push(`A01.0${" ".repeat(10)}${meet.name.padEnd(40)}`);
  lines.push(
    `B11${meet.course === "SCY" ? "1" : meet.course === "SCM" ? "2" : "3"}`,
  );

  for (const event of meet.events) {
    lines.push(
      `E1${String(event.eventNumber ?? 0).padStart(4, "0")}${event.gender}${String(event.distance).padStart(4, "0")}${event.stroke.toUpperCase().slice(0, 3)}`,
    );
  }

  return lines.join("\n");
}

export { parseTime };
