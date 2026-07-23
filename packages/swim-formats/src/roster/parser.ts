import { parseRosterCsv } from "../csv/parser";
import {
  extractAllMeetFilesFromZip,
  isZipBytes,
  isZipFilename,
} from "../meet/zip";
import type { ParsedRosterRow } from "../types";
import { parseCl2Roster } from "./cl2";
import { parseHy3Roster } from "./hy3-style";
import { swimmerKey } from "./utils";

export type RosterFileFormat = "csv" | "sdif" | "hy3" | "cl2";

function isMeetEventsFile(content: string): boolean {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return false;
  const first = lines[0]!;
  const second = lines[1]!;
  return first.includes(";") && /^\d+;/.test(second);
}

function sniffRosterFormat(content: string): RosterFileFormat | null {
  const firstLine = content.trim().split(/\r?\n/)[0]!;

  if (isMeetEventsFile(content)) return null;

  if (
    firstLine.startsWith("A10") ||
    firstLine.includes("Rosters Only") ||
    /^D1[MF]\s/.test(content)
  ) {
    return "hy3";
  }

  if (firstLine.startsWith("A01") || content.includes("D01")) {
    return "cl2";
  }

  return null;
}

export function detectRosterFileFormat(
  filename: string,
  content?: string,
): RosterFileFormat | null {
  if (content) {
    const sniffed = sniffRosterFormat(content);
    if (sniffed) return sniffed;
    if (isMeetEventsFile(content)) return null;
  }

  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "csv":
      return "csv";
    case "sd3":
    case "sdif":
      return "sdif";
    case "hy3":
      return "hy3";
    case "cl2":
      return "cl2";
    case "ev3":
    case "hyv":
      return null;
    default:
      return content ? sniffRosterFormat(content) : null;
  }
}

export function parseRosterFile(
  content: string,
  format: RosterFileFormat,
): ParsedRosterRow[] {
  switch (format) {
    case "csv":
      return parseRosterCsv(content);
    case "sdif":
    case "cl2":
      return parseCl2Roster(content);
    case "hy3":
      return parseHy3Roster(content);
    default:
      return [];
  }
}

export function rosterImportErrorForFile(
  filename: string,
  content: string,
): string | null {
  if (isMeetEventsFile(content)) {
    return `${filename} is a meet events file (EV3/HYV), not a roster. Export "Swimmers Only" or a CL2/HY3 roster from Team Manager.`;
  }
  if (!detectRosterFileFormat(filename, content)) {
    return `Unsupported file type: ${filename}`;
  }
  return null;
}

/** Parse roster rows from a ZIP (CL2/HY3 Swimmers Only / Rosters Only packs). */
export function parseRosterFileFromBytes(
  bytes: Uint8Array,
  filename: string,
): ParsedRosterRow[] {
  if (!(isZipFilename(filename) || isZipBytes(bytes))) {
    const content = new TextDecoder("utf-8").decode(bytes);
    const format = detectRosterFileFormat(filename, content);
    if (!format) {
      throw new Error(
        "Unsupported file type. Use CSV, SD3, CL2, HY3, or a roster ZIP.",
      );
    }
    return parseRosterFile(content, format);
  }

  const bundle = extractAllMeetFilesFromZip(bytes);
  const byKey = new Map<string, ParsedRosterRow>();
  for (const file of bundle.files) {
    if (
      file.format !== "cl2" &&
      file.format !== "hy3" &&
      file.format !== "sdif"
    ) {
      continue;
    }
    const content = new TextDecoder("utf-8").decode(file.bytes);
    const format: RosterFileFormat =
      file.format === "hy3" ? "hy3" : file.format === "sdif" ? "sdif" : "cl2";
    for (const row of parseRosterFile(content, format)) {
      byKey.set(swimmerKey(row), row);
    }
  }
  if (byKey.size === 0) {
    throw new Error(
      "No roster swimmers found in ZIP. Export Swimmers Only / Rosters Only from Team Manager.",
    );
  }
  return [...byKey.values()];
}
