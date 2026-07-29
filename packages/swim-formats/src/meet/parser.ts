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
  selectPrimaryMeetFile,
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
  selectPrimaryMeetFile,
} from "./zip";

const UNSUPPORTED_MEET_FILE =
  "Unsupported meet file. Export an SD3/SDIF, HY3, EV3, HYV, CL2, XLS, or ZIP file from Meet Manager or Team Manager and upload that instead.";

const ROSTER_ONLY_ZIP_ERROR =
  "This ZIP is a Team Manager roster export (Swimmers Only / Rosters Only), not a meet pack. Import it from Roster import instead.";

const ROSTER_ONLY_HY3_ERROR =
  "This HY3 file is a Rosters Only export, not a meet file. Import it from Roster import instead.";

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
    case "hy3": {
      const meet = parseHy3(content);
      // Meet import path only — roster import still uses parseHy3 / parseHy3Roster directly.
      if (meet.importKind === "roster") {
        throw new Error(ROSTER_ONLY_HY3_ERROR);
      }
      return meet;
    }
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

/**
 * Merge a set of already-extracted/selected meet files into one ParsedMeet,
 * applying the roster-only guardrail and preferring EV3 over HYV (and vice
 * versa) when both are present. Shared by ZIP extraction and multi-file
 * (non-ZIP pack) uploads.
 */
function mergeExtractedFiles(files: ExtractedMeetFile[]): ParseMeetBytesResult {
  const { primary, isRosterOnly } = selectPrimaryMeetFile(files);
  if (isRosterOnly) {
    throw new Error(ROSTER_ONLY_ZIP_ERROR);
  }

  // Meet Events: EV3 primary is enough (HYV is alternate representation).
  // Entries/results: merge companion CL2/HY3/SD3 files.
  const primaryParsed = parseExtractedFile(primary);
  const supplements = files
    .filter((f) => f !== primary)
    .filter((f) => {
      // Skip alternate event template when EV3 already chosen (HYV never wins
      // primary while an EV3 is present — see MEET_EXT_PRIORITY / pickPrimary).
      if (primary.format === "ev3" && f.format === "hyv") return false;
      return true;
    })
    .map(parseExtractedFile);

  const merged =
    supplements.length > 0
      ? mergeParsedMeets(primaryParsed, supplements)
      : primaryParsed;

  (merged as ParseMeetBytesResult).sourceFiles = files.map((f) => f.filename);
  (merged as ParseMeetBytesResult).zipFormat = primary.format;
  return merged;
}

export function parseMeetFileFromBytes(
  bytes: Uint8Array,
  filename: string,
): ParsedMeet {
  if (isZipFilename(filename) || isZipBytes(bytes)) {
    const bundle = extractAllMeetFilesFromZip(bytes);
    return mergeExtractedFiles(bundle.files);
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

/**
 * Parse and merge multiple companion meet files uploaded together (e.g. a
 * Hy-Tek HFILE + CFILE pair, or EV3 + CL2), without requiring coaches to zip
 * them first. A single file is delegated to `parseMeetFileFromBytes`.
 */
export function parseMeetFilesFromBytes(
  files: Array<{ filename: string; bytes: Uint8Array }>,
): ParsedMeet {
  if (files.length === 0) {
    throw new Error("Select at least one meet file to import.");
  }
  if (files.length === 1) {
    const [file] = files;
    return parseMeetFileFromBytes(file!.bytes, file!.filename);
  }

  const extracted: ExtractedMeetFile[] = files.map((file) => {
    if (isZipFilename(file.filename) || isZipBytes(file.bytes)) {
      throw new Error(
        "Upload one ZIP meet pack, or multiple non-ZIP files — not both together.",
      );
    }
    const format = detectMeetFileFormat(file.filename);
    if (!format) {
      throw new Error(
        `"${file.filename}" isn't a supported meet file. Use SD3/SDIF, HY3, EV3, HYV, CL2, or XLS files.`,
      );
    }
    return { filename: file.filename, bytes: file.bytes, format, depth: 0 };
  });

  return mergeExtractedFiles(extracted);
}
