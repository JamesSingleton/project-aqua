"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@project-aqua/ui/components/dropdown-menu";
import { ChevronDown, Download, Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { exportMeetAction, exportMeetZipAction } from "../actions";
import { exportMeetEntriesCsvAction } from "../meet-events-actions";

type TextFormat = "sdif" | "hy3" | "cl2" | "ev3" | "hyv";
type CsvFormat = "entry_list" | "by_event";
type ZipKind = "entries" | "results" | "events";
type ExportJob =
  | { kind: "text"; format: TextFormat }
  | { kind: "csv"; format: CsvFormat }
  | { kind: "zip"; zip: ZipKind };

const TEXT_FORMAT_META: Record<
  TextFormat,
  { label: string; extension: string }
> = {
  hy3: { label: "For Meet Manager (HY3)", extension: "hy3" },
  sdif: { label: "For SwimTopia / SDIF (SD3)", extension: "sd3" },
  cl2: { label: "CL2 (SDIF entries/results)", extension: "cl2" },
  ev3: { label: "EV3 (event template)", extension: "ev3" },
  hyv: { label: "HYV (qualifying times)", extension: "hyv" },
};

const ZIP_KIND_META: Record<ZipKind, { label: string }> = {
  entries: { label: "Entries pack (HY3 + CL2)" },
  results: { label: "Results pack (HY3 + CL2)" },
  events: { label: "Events pack (EV3 + HYV + HY3 + CL2)" },
};

function jobKey(job: ExportJob): string {
  if (job.kind === "text") return `text:${job.format}`;
  if (job.kind === "csv") return `csv:${job.format}`;
  return `zip:${job.zip}`;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function MeetExportButtons({
  teamId,
  meetId,
  meetName,
}: {
  teamId: string;
  meetId: string;
  meetName: string;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const baseName = meetName.replace(/[^\w.-]+/g, "_");

  async function runJob(job: ExportJob) {
    setLoading(jobKey(job));
    setError("");
    try {
      if (job.kind === "text") {
        const content = await exportMeetAction(teamId, meetId, job.format);
        const { extension } = TEXT_FORMAT_META[job.format];
        downloadBlob(
          new Blob([content], { type: "text/plain" }),
          `${baseName}.${extension}`,
        );
      } else if (job.kind === "csv") {
        const content = await exportMeetEntriesCsvAction(
          teamId,
          meetId,
          job.format,
        );
        const suffix = job.format === "by_event" ? "by_event" : "entries";
        downloadBlob(
          new Blob([content], { type: "text/csv;charset=utf-8" }),
          `${baseName}_${suffix}.csv`,
        );
      } else {
        const base64 = await exportMeetZipAction(teamId, meetId, job.zip);
        downloadBlob(
          new Blob([base64ToBytes(base64).buffer as ArrayBuffer], {
            type: "application/zip",
          }),
          `${baseName}_${job.zip}.zip`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href={`/team/${teamId}/meets/${meetId}/report`} />}
      >
        <Printer data-icon="inline-start" />
        Entry report
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => runJob({ kind: "text", format: "hy3" })}
      >
        {loading === jobKey({ kind: "text", format: "hy3" })
          ? "Exporting…"
          : TEXT_FORMAT_META.hy3.label}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => runJob({ kind: "text", format: "sdif" })}
      >
        {loading === jobKey({ kind: "text", format: "sdif" })
          ? "Exporting…"
          : TEXT_FORMAT_META.sdif.label}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => runJob({ kind: "csv", format: "entry_list" })}
      >
        {loading === jobKey({ kind: "csv", format: "entry_list" })
          ? "Exporting…"
          : "Entries CSV"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => runJob({ kind: "csv", format: "by_event" })}
      >
        {loading === jobKey({ kind: "csv", format: "by_event" })
          ? "Exporting…"
          : "By event CSV"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" disabled={busy}>
              <Download data-icon="inline-start" />
              More exports
              <ChevronDown className="ml-1 size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-max min-w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>SDIF-style</DropdownMenuLabel>
            <DropdownMenuItem
              className="whitespace-nowrap"
              onClick={() => runJob({ kind: "text", format: "cl2" })}
            >
              {TEXT_FORMAT_META.cl2.label}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="whitespace-nowrap"
              onClick={() => runJob({ kind: "text", format: "ev3" })}
            >
              {TEXT_FORMAT_META.ev3.label}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="whitespace-nowrap"
              onClick={() => runJob({ kind: "text", format: "hyv" })}
            >
              {TEXT_FORMAT_META.hyv.label}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>ZIP packs</DropdownMenuLabel>
            {(Object.keys(ZIP_KIND_META) as ZipKind[]).map((zip) => (
              <DropdownMenuItem
                key={zip}
                className="whitespace-nowrap"
                onClick={() => runJob({ kind: "zip", zip })}
              >
                {ZIP_KIND_META[zip].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
