import { parseCl2Meet } from "../cl2/parser";
import { parseEv3, parseHyv } from "../ev3/parser";
import { parseHy3 } from "../hy3/parser";
import { parseSdif } from "../sdif/parser";
import type { ParsedMeet } from "../types";
import { parseEventExportXls } from "../xls/parser";
import {
  type ExtractedMeetFile,
  extractAllMeetFilesFromZip,
  isZipBytes,
  isZipFilename,
  mergeParsedMeets,
} from "./zip";

export type MeetFileFormat = "sdif" | "hy3" | "ev3" | "hyv" | "cl2" | "xls";

export {
  type ExtractedMeetFile,
  extractAllMeetFilesFromZip,
  extractMeetFileFromZip,
  isZipBytes,
  isZipFilename,
  type MeetZipBundle,
  mergeParsedMeets,
} from "./zip";

const UNSUPPORTED_MEET_FILE =
  "Unsupported meet file. Use SD3/SDIF, HY3, EV3, HYV, CL2, XLS, or ZIP.";

const ROSTER_ONLY_ZIP_ERROR =
  "This ZIP looks like a Team Manager roster export (Swimmers Only / Rosters Only). Import it from Roster, not Meet import.";

export function detectMeetFileFormat(
  filename: string,
  content?: string,
): MeetFileFormat | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".ev3")) return "ev3";
  if (lower.endsWith(".hyv")) return "hyv";
  if (lower.endsWith(".hy3")) return "hy3";
  if (lower.endsWith(".sd3") || lower.endsWith(".sdif")) return "sdif";
  if (lower.endsWith(".cl2")) return "cl2";
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) return "xls";

  if (!content) return null;
  const head = content.slice(0, 200).toUpperCase();
  if (head.includes("MEET MANAGER") && content.includes(";")) return "ev3";
  if (head.startsWith("A1") && head.includes("HY-TEK")) return "hy3";
  if (head.startsWith("A0") && head.includes("SDIF")) return "sdif";
  if (head.startsWith("A0") || head.startsWith("A01")) return "cl2";
  return null;
}

export function parseMeetFile(
  content: string,
  format: MeetFileFormat,
): ParsedMeet {
  switch (format) {
    case "sdif":
      return parseSdif(content);
    case "hy3":
      return parseHy3(content);
    case "ev3":
      return parseEv3(content);
    case "hyv":
      return parseHyv(content);
    case "cl2":
      return parseCl2Meet(content);
    case "xls":
      throw new Error(
        "XLS meet reports require binary input. Use parseMeetFileFromBytes.",
      );
    default:
      throw new Error(`Unsupported meet format: ${format}`);
  }
}

function parseExtractedFile(file: ExtractedMeetFile): ParsedMeet {
  if (file.format === "xls") {
    return parseEventExportXls(file.bytes);
  }
  const content = new TextDecoder("utf-8").decode(file.bytes);
  return parseMeetFile(content, file.format);
}

export type ParseMeetBytesResult = ParsedMeet & {
  sourceFiles?: string[];
  zipFormat?: MeetFileFormat;
};

export function parseMeetFileFromBytes(
  bytes: Uint8Array,
  filename: string,
): ParsedMeet {
  if (isZipFilename(filename) || isZipBytes(bytes)) {
    const bundle = extractAllMeetFilesFromZip(bytes);
    if (bundle.isRosterOnly) {
      throw new Error(ROSTER_ONLY_ZIP_ERROR);
    }

    // Meet Events: EV3 primary is enough (HYV is alternate representation).
    // Entries/results: merge companion CL2/HY3/SD3 files.
    const primary = parseExtractedFile(bundle.primary);
    const supplements = bundle.files
      .filter((f) => f !== bundle.primary)
      .filter((f) => {
        // Skip alternate event template when EV3 already chosen
        if (bundle.primary.format === "ev3" && f.format === "hyv") return false;
        if (bundle.primary.format === "hyv" && f.format === "ev3") return false;
        return true;
      })
      .map(parseExtractedFile);

    const merged =
      supplements.length > 0 ? mergeParsedMeets(primary, supplements) : primary;

    (merged as ParseMeetBytesResult).sourceFiles = bundle.files.map(
      (f) => f.filename,
    );
    (merged as ParseMeetBytesResult).zipFormat = bundle.primary.format;
    return merged;
  }

  const format = detectMeetFileFormat(filename);
  if (format === "xls") {
    return parseEventExportXls(bytes);
  }
  if (!format) {
    throw new Error(UNSUPPORTED_MEET_FILE);
  }
  const content = new TextDecoder("utf-8").decode(bytes);
  return parseMeetFile(content, format);
}
