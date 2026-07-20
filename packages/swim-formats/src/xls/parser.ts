import { formatTime } from "@project-aqua/swim-core/times";
import * as XLSX from "xlsx";
import type { ParsedMeet, ParsedResult } from "../types";

export class ExportXlsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportXlsParseError";
  }
}

const DEFAULT_ELEMENTS = [
  "name",
  "age",
  "team",
  "seed time",
  "prelim time",
  "finals time",
] as const;

type ParsingElement = (typeof DEFAULT_ELEMENTS)[number];

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function parseTimeCell(value: unknown): number | undefined {
  const raw = cellString(value);
  if (!raw) return undefined;
  if (raw.includes(":")) {
    const [minutes, seconds] = raw.split(":");
    const m = Number.parseInt(minutes ?? "0", 10);
    const s = Number.parseFloat(seconds ?? "0");
    if (!Number.isFinite(m) || !Number.isFinite(s)) return undefined;
    return m * 60 + s;
  }
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

function getFirstRowIndex(rows: unknown[][], headerRowIndex: number): number {
  const next = rows[headerRowIndex + 1]?.[0];
  if (cellString(next).toLowerCase().includes("final")) {
    return headerRowIndex + 2;
  }
  return headerRowIndex + 1;
}

function getOffsetsFromHeader(
  headerRow: string[],
  sampleRow: unknown[],
  parsingElements: string[],
): Record<string, number> {
  const offsets: Record<string, number> = {};
  for (const elem of parsingElements) {
    let offset = 0;
    for (const cell of headerRow) {
      if (cell === elem) break;
      offset += cell.includes("time") ? 3 : 1;
    }
    if (offset >= sampleRow.length) {
      throw new ExportXlsParseError(
        `Invalid header row offset for "${elem}" (offset ${offset}).`,
      );
    }
    offsets[elem] = offset + 1;
  }
  return offsets;
}

function pickResultTime(
  row: unknown[],
  offsets: Record<string, number>,
): { seconds?: number; resultType?: ParsedResult["resultType"] } {
  if (offsets["finals time"] != null) {
    const seconds = parseTimeCell(row[offsets["finals time"]]);
    if (seconds != null) return { seconds, resultType: "finals" };
  }
  if (offsets["prelim time"] != null) {
    const seconds = parseTimeCell(row[offsets["prelim time"]]);
    if (seconds != null) return { seconds, resultType: "prelim" };
  }
  if (offsets["seed time"] != null) {
    const seconds = parseTimeCell(row[offsets["seed time"]]);
    if (seconds != null) return { seconds };
  }
  return {};
}

/** Parse Hy-Tek Meet Manager individual event report data-only XLS/XLSX. */
export function parseEventExportXls(
  data: ArrayBuffer | Uint8Array | Buffer,
  parsingElements: readonly ParsingElement[] = DEFAULT_ELEMENTS,
): ParsedMeet {
  const workbook = XLSX.read(data, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new ExportXlsParseError("Workbook has no sheets.");
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new ExportXlsParseError("Missing first sheet.");

  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const eventName = cellString(rows[1]?.[0]) || "Imported Event Results";

  let headerRow: string[] | undefined;
  let headerRowIndex = -1;
  for (let rx = 0; rx < rows.length; rx++) {
    const row = rows[rx] ?? [];
    if (cellString(row[0]).toLowerCase() === "name") {
      headerRow = row.map((c) => cellString(c).toLowerCase());
      headerRowIndex = rx;
      break;
    }
  }
  if (!headerRow || headerRowIndex < 0) {
    throw new ExportXlsParseError("Could not find header row.");
  }

  const elements = [...parsingElements].filter((elem) => {
    if (!elem.includes("time")) return true;
    return headerRow.includes(elem);
  });

  const firstRowIndex = getFirstRowIndex(rows, headerRowIndex);
  const sampleRow = rows[firstRowIndex] ?? [];
  const offsets = getOffsetsFromHeader(headerRow, sampleRow, elements);

  const results: ParsedResult[] = [];
  for (let rx = firstRowIndex; rx < rows.length; rx++) {
    const row = rows[rx] ?? [];
    if (cellString(row[0]) === "") break;

    const placeRaw = cellString(row[0]);
    const place = Number.parseInt(placeRaw, 10);
    if (!Number.isFinite(place) && placeRaw !== "---") continue;

    const name =
      offsets.name != null ? cellString(row[offsets.name]) : undefined;
    if (!name) continue;

    const { seconds, resultType } = pickResultTime(row, offsets);
    if (seconds == null) continue;

    results.push({
      swimmerName: name,
      time: formatTime(Math.round(seconds * 1000)),
      place: Number.isFinite(place) ? place : undefined,
      resultType,
    });
  }

  return {
    name: eventName,
    course: "SCY",
    events: [],
    entries: [],
    results,
  };
}
