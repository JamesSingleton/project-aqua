import { parseCl2Meet } from "../cl2/parser";
import { parseEv3, parseHyv } from "../ev3/parser";
import { parseHy3 } from "../hy3/parser";
import { parseSdif } from "../sdif/parser";
import type { ParsedMeet } from "../types";
import { parseEventExportXls } from "../xls/parser";

export type MeetFileFormat = "sdif" | "hy3" | "ev3" | "hyv" | "cl2" | "xls";

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

export function parseMeetFileFromBytes(
  bytes: Uint8Array,
  filename: string,
): ParsedMeet {
  const format = detectMeetFileFormat(filename);
  if (format === "xls") {
    return parseEventExportXls(bytes);
  }
  if (!format) {
    throw new Error(
      "Unsupported meet file. Use SD3/SDIF, HY3, EV3, HYV, CL2, or XLS.",
    );
  }
  const content = new TextDecoder("utf-8").decode(bytes);
  return parseMeetFile(content, format);
}
