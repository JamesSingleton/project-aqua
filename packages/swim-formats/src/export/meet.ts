import {
  eventGenderToCode,
  parseEventGender,
} from "@project-aqua/swim-core/events";
import type { ParsedMeet } from "../types";

function pad(value: string, len: number): string {
  return value.slice(0, len).padEnd(len, " ");
}

function strokeCode(stroke: string): string {
  const map: Record<string, string> = {
    free: "FR ",
    back: "BK ",
    breast: "BR ",
    fly: "FL ",
    im: "IM ",
  };
  return map[stroke] ?? "FR ";
}

/** Compact M/F/X code for SDIF/HY3 event records. */
function exportGenderCode(gender: string): string {
  return eventGenderToCode(parseEventGender(gender)).toUpperCase();
}

/** Export a meet (events + entries + results) as SDIF-ish text. */
export function exportSdif(meet: ParsedMeet): string {
  const lines: string[] = [];
  lines.push(`A01V3      02Meet Entries                  Project Aqua`);
  const courseDigit =
    meet.course === "SCY" ? "1" : meet.course === "SCM" ? "2" : "3";
  lines.push(
    `B11${pad("", 8)}${pad(meet.name, 30)}${pad(meet.location ?? "", 30)}${courseDigit}`,
  );

  for (const event of meet.events) {
    const num = String(event.eventNumber ?? 0).padStart(4, "0");
    const gender = exportGenderCode(event.gender);
    const distance = String(event.distance).padStart(4, "0");
    lines.push(
      `E1${pad("", 7)}${num}${pad("", 12)}${gender}${distance}${strokeCode(event.stroke)}`,
    );
  }

  for (const entry of meet.entries) {
    const num = String(entry.eventNumber ?? 0).padStart(4, "0");
    const [first = "", ...rest] = entry.swimmerName.split(" ");
    const last = rest.join(" ") || first;
    lines.push(
      `D0${pad("", 7)}${num}${pad(entry.usaMemberId ?? "", 12)}${pad(last, 20)}${pad(first, 20)}${pad(entry.seedTime ?? "", 8)}`,
    );
  }

  for (const result of meet.results) {
    const num = String(result.eventNumber ?? 0).padStart(4, "0");
    const [first = "", ...rest] = result.swimmerName.split(" ");
    const last = rest.join(" ") || first;
    lines.push(
      `G0${pad("", 7)}${num}${pad("", 12)}${pad(last, 20)}${pad(first, 20)}${pad(result.time, 8)}${String(result.place ?? 0).padStart(4, "0")}${result.isDq ? "D" : " "}`,
    );
  }

  lines.push("Z0");
  return lines.join("\r\n");
}

/** Export meet entries as a basic HY3 file. */
export function exportHy3(meet: ParsedMeet): string {
  const lines: string[] = [];
  lines.push(
    `A102Meet Entries             Project Aqua Win-TM 1.0    ${new Date().toLocaleString()}`,
  );
  const courseDigit =
    meet.course === "SCY" ? "1" : meet.course === "SCM" ? "2" : "3";
  lines.push(
    `B1${courseDigit}${pad(meet.name, 45)}${pad(meet.location ?? "", 45)}`,
  );

  for (const event of meet.events) {
    const num = String(event.eventNumber ?? 0).padStart(4, " ");
    const gender = exportGenderCode(event.gender);
    const distance = String(event.distance).padStart(4, " ");
    const stroke =
      event.stroke === "free"
        ? "FR "
        : event.stroke === "back"
          ? "BK "
          : event.stroke === "breast"
            ? "BR "
            : event.stroke === "fly"
              ? "FL "
              : "IM ";
    lines.push(`E1${num}${gender}${distance}${stroke}`);
  }

  for (const entry of meet.entries) {
    const num = String(entry.eventNumber ?? 0).padStart(4, " ");
    lines.push(
      `D0${num}${pad("", 14)}${pad(entry.swimmerName, 40)}${pad(entry.seedTime ?? "", 10)}`,
    );
  }

  for (const relay of meet.relays ?? []) {
    const num = String(relay.eventNumber ?? 0).padStart(4, " ");
    lines.push(
      `F0${num}${pad("", 14)}${pad(relay.swimmerNames.join(" / "), 40)}${pad(relay.seedTime ?? "", 10)}`,
    );
    relay.swimmerNames.forEach((name, i) => {
      lines.push(`G0${num}${String(i + 1).padStart(2, " ")}${pad(name, 40)}`);
    });
  }

  return lines.join("\r\n");
}
