import { unzipSync } from "fflate";

export type MeetZipFormat = "sdif" | "hy3" | "ev3" | "hyv" | "cl2" | "xls";

const MEET_EXT_PRIORITY: Array<{ ext: string; format: MeetZipFormat }> = [
  { ext: ".ev3", format: "ev3" },
  { ext: ".hyv", format: "hyv" },
  { ext: ".hy3", format: "hy3" },
  { ext: ".sd3", format: "sdif" },
  { ext: ".sdif", format: "sdif" },
  { ext: ".cl2", format: "cl2" },
  { ext: ".xls", format: "xls" },
  { ext: ".xlsx", format: "xls" },
];

export type ExtractedMeetFile = {
  filename: string;
  bytes: Uint8Array;
  format: MeetZipFormat;
};

export function isZipFilename(filename: string): boolean {
  return filename.toLowerCase().endsWith(".zip");
}

export function isZipBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
    (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08)
  );
}

function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1]!;
}

function isJunkPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  const name = basename(normalized);
  if (!name || name.endsWith("/")) return true;
  if (normalized.includes("__MACOSX/")) return true;
  if (name === ".DS_Store" || name.startsWith("._")) return true;
  return false;
}

function formatForFilename(filename: string): MeetZipFormat | null {
  const lower = filename.toLowerCase();
  for (const { ext, format } of MEET_EXT_PRIORITY) {
    if (lower.endsWith(ext)) return format;
  }
  return null;
}

/** Prefer EV3, then HYV, then other known meet formats inside a ZIP. */
export function extractMeetFileFromZip(bytes: Uint8Array): ExtractedMeetFile {
  if (!isZipBytes(bytes)) {
    throw new Error("Not a valid ZIP archive.");
  }

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    throw new Error("Could not read ZIP archive.");
  }

  const candidates: ExtractedMeetFile[] = [];
  for (const [path, fileBytes] of Object.entries(entries)) {
    if (isJunkPath(path)) continue;
    if (!fileBytes || fileBytes.length === 0) continue;
    const filename = basename(path);
    const format = formatForFilename(filename);
    if (!format) continue;
    candidates.push({ filename, bytes: fileBytes, format });
  }

  for (const { ext, format } of MEET_EXT_PRIORITY) {
    const match = candidates.find((c) =>
      c.filename.toLowerCase().endsWith(ext),
    );
    if (match) {
      return { ...match, format };
    }
  }

  throw new Error(
    "No supported meet file in ZIP. Expected EV3, HYV, HY3, SD3/SDIF, CL2, or XLS.",
  );
}
