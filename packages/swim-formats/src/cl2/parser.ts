import { parseCl2Roster } from "../roster/cl2";
import type { ParsedEntry, ParsedMeet, ParsedResult } from "../types";

/**
 * Parse Hy-Tek CL2 meet results / entries.
 * Reuses D01 athlete lines where present; extracts G0-style result times when available.
 */
export function parseCl2Meet(content: string): ParsedMeet {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const meet: ParsedMeet = {
    name: "CL2 Import",
    course: "SCY",
    events: [],
    entries: [],
    results: [],
    // entryLimits: CL2 meet files do not expose entry-limit fields here
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
    }
  }

  // Prefer structured result lines (G0 / E0 / F0 style in SDIF-compatible CL2)
  for (const line of lines) {
    const type = line.substring(0, 2);
    if (type === "D0" || type === "D1") {
      const last = line.substring(11, 31).trim();
      const first = line.substring(31, 51).trim();
      const name = `${first} ${last}`.trim() || line.substring(11, 51).trim();
      const usaMemberId = line.substring(51, 65).trim() || undefined;
      const seedTime = line.substring(72, 82).trim() || undefined;
      const eventNumber =
        Number.parseInt(line.substring(2, 6).trim(), 10) || undefined;
      const entry: ParsedEntry = {
        eventNumber,
        swimmerName: name,
        seedTime,
        usaMemberId,
      };
      meet.entries.push(entry);
    }
    if (type === "G0" || type === "F0") {
      const last = line.substring(11, 31).trim();
      const first = line.substring(31, 51).trim();
      const name = `${first} ${last}`.trim() || line.substring(11, 51).trim();
      const time = line.substring(72, 82).trim();
      if (!time) continue;
      const result: ParsedResult = {
        eventNumber:
          Number.parseInt(line.substring(2, 6).trim(), 10) || undefined,
        swimmerName: name,
        time,
        place: Number.parseInt(line.substring(82, 86).trim(), 10) || undefined,
        isDq: /DQ|NS|SCR/i.test(line),
      };
      meet.results.push(result);
    }
  }

  // Fallback: if no athletes found via D0, use roster-style CL2 extraction as entries
  if (meet.entries.length === 0 && meet.results.length === 0) {
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
