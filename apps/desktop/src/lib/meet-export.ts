import type { ParsedMeet } from "@lane4hq/swim-formats";
import {
  exportCl2,
  exportHy3,
  exportMeetZip,
  exportSdif,
  meetZipDownloadFilename,
} from "@lane4hq/swim-formats/export";
import type { SourceFile } from "./meet-file";

export const EXPORT_FORMATS = ["hy3", "cl2", "sd3", "zip"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  hy3: "Hy-Tek HY3",
  cl2: "Hy-Tek CL2",
  sd3: "SDIF (SD3)",
  zip: "ZIP pack (HY3 + CL2)",
};

export function meetPackKind(
  meet: ParsedMeet,
): "entries" | "results" | "events" {
  if (meet.results.length > 0) return "results";
  if (meet.entries.length > 0 || (meet.relays?.length ?? 0) > 0) {
    return "entries";
  }
  return "events";
}

/** Serialize a parsed meet into one of Lane4's interchange formats. */
export function exportMeet(meet: ParsedMeet, format: ExportFormat): SourceFile {
  const kind = meetPackKind(meet);
  const zipName = meetZipDownloadFilename(meet, kind);
  if (format === "zip") {
    return { filename: zipName, bytes: exportMeetZip(meet, kind) };
  }
  const stem = zipName.replace(/\.zip$/i, "");
  const text =
    format === "hy3"
      ? exportHy3(meet)
      : format === "cl2"
        ? exportCl2(meet)
        : exportSdif(meet);
  return {
    filename: `${stem}.${format}`,
    bytes: new TextEncoder().encode(text),
  };
}
