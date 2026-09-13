import { parseTime } from "./times";

export type ParsedResultCsvRow = {
  eventNumber: number;
  swimmerName: string;
  timeMs: number;
  place: number | null;
  line: number;
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function headerIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx >= 0) return idx;
  }
  return -1;
}

/** Parse a simple results CSV: Event #, Swimmer, Time, optional Place. */
export function parseMeetResultsCsv(content: string): ParsedResultCsvRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]!);
  const eventIdx = headerIndex(headers, [
    "event_#",
    "event_number",
    "event",
    "event_no",
  ]);
  const swimmerIdx = headerIndex(headers, [
    "swimmer",
    "athlete",
    "name",
    "swimmer_name",
  ]);
  const timeIdx = headerIndex(headers, ["time", "result", "swim_time"]);
  const placeIdx = headerIndex(headers, ["place", "finish", "rank"]);

  if (eventIdx < 0 || swimmerIdx < 0 || timeIdx < 0) {
    throw new Error(
      "Results CSV must include Event #, Swimmer, and Time columns.",
    );
  }

  const rows: ParsedResultCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!);
    const eventRaw = values[eventIdx] ?? "";
    const swimmerName = values[swimmerIdx] ?? "";
    const timeRaw = values[timeIdx] ?? "";
    if (!eventRaw.trim() || !swimmerName.trim() || !timeRaw.trim()) continue;

    const eventNumber = Number.parseInt(eventRaw, 10);
    if (!Number.isFinite(eventNumber)) continue;

    let timeMs: number;
    try {
      timeMs = parseTime(timeRaw);
    } catch {
      continue;
    }

    const placeRaw = placeIdx >= 0 ? values[placeIdx] : "";
    const placeParsed = placeRaw ? Number.parseInt(placeRaw, 10) : null;
    const place =
      placeParsed != null && Number.isFinite(placeParsed) ? placeParsed : null;

    rows.push({
      eventNumber,
      swimmerName: swimmerName.trim(),
      timeMs,
      place,
      line: i + 1,
    });
  }

  return rows;
}
