"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@project-aqua/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@project-aqua/ui/components/dropdown-menu";
import { Separator } from "@project-aqua/ui/components/separator";
import { ChevronDown, Download, FileText } from "lucide-react";
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

type ExportAction = {
  key: string;
  label: string;
  needsLineup?: boolean;
  job?: ExportJob;
  report?: boolean;
};

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

const LINEUP_ACTIONS: ExportAction[] = [
  { key: "report", label: "Entry report", needsLineup: true, report: true },
  {
    key: "hy3",
    label: TEXT_FORMAT_META.hy3.label,
    needsLineup: true,
    job: { kind: "text", format: "hy3" },
  },
  {
    key: "sdif",
    label: TEXT_FORMAT_META.sdif.label,
    needsLineup: true,
    job: { kind: "text", format: "sdif" },
  },
  {
    key: "csv-entries",
    label: "Entries CSV",
    needsLineup: true,
    job: { kind: "csv", format: "entry_list" },
  },
  {
    key: "csv-event",
    label: "By event CSV",
    needsLineup: true,
    job: { kind: "csv", format: "by_event" },
  },
  {
    key: "cl2",
    label: TEXT_FORMAT_META.cl2.label,
    needsLineup: true,
    job: { kind: "text", format: "cl2" },
  },
];

const EVENT_FILE_ACTIONS: ExportAction[] = [
  {
    key: "ev3",
    label: TEXT_FORMAT_META.ev3.label,
    job: { kind: "text", format: "ev3" },
  },
  {
    key: "hyv",
    label: TEXT_FORMAT_META.hyv.label,
    job: { kind: "text", format: "hyv" },
  },
];

const ZIP_ACTIONS: ExportAction[] = [
  {
    key: "zip-entries",
    label: ZIP_KIND_META.entries.label,
    needsLineup: true,
    job: { kind: "zip", zip: "entries" },
  },
  {
    key: "zip-results",
    label: ZIP_KIND_META.results.label,
    needsLineup: true,
    job: { kind: "zip", zip: "results" },
  },
  {
    key: "zip-events",
    label: ZIP_KIND_META.events.label,
    job: { kind: "zip", zip: "events" },
  },
];

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

function actionDisabled(
  action: ExportAction,
  busy: boolean,
  lineupLocked: boolean,
) {
  return busy || Boolean(action.needsLineup && lineupLocked);
}

export function MeetExportButtons({
  teamId,
  meetId,
  meetName,
  hasLineup,
}: {
  teamId: string;
  meetId: string;
  meetName: string;
  hasLineup: boolean;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const baseName = meetName.replace(/[^\w.-]+/g, "_");
  const reportHref = `/team/${teamId}/meets/${meetId}/report`;

  async function runJob(job: ExportJob) {
    const needsLineup =
      job.kind === "csv" ||
      (job.kind === "text" &&
        (job.format === "hy3" ||
          job.format === "sdif" ||
          job.format === "cl2")) ||
      (job.kind === "zip" && job.zip !== "events");
    if (needsLineup && !hasLineup) return;

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
        const { base64, filename } = await exportMeetZipAction(
          teamId,
          meetId,
          job.zip,
        );
        downloadBlob(
          new Blob([base64ToBytes(base64).buffer as ArrayBuffer], {
            type: "application/zip",
          }),
          filename,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(null);
    }
  }

  function choose(action: ExportAction) {
    if (action.report) {
      setDrawerOpen(false);
      return;
    }
    if (action.job) {
      setDrawerOpen(false);
      void runJob(action.job);
    }
  }

  const busy = loading !== null;
  const lineupLocked = !hasLineup;
  const lineupHint = "Add entries before exporting a lineup.";

  function renderMenuItems(actions: ExportAction[]) {
    return actions.map((action) => (
      <DropdownMenuItem
        key={action.key}
        disabled={actionDisabled(action, busy, lineupLocked)}
        closeOnClick
        render={
          action.report && !lineupLocked ? (
            <Link href={reportHref} />
          ) : undefined
        }
        onClick={() => {
          if (action.job) void runJob(action.job);
        }}
      >
        {action.report ? <FileText data-icon="inline-start" /> : null}
        {action.label}
      </DropdownMenuItem>
    ));
  }

  function renderDrawerItems(actions: ExportAction[]) {
    return actions.map((action) => {
      const disabled = actionDisabled(action, busy, lineupLocked);
      if (action.report && !disabled) {
        return (
          <Button
            key={action.key}
            variant="ghost"
            className="w-full justify-start"
            nativeButton={false}
            render={<Link href={reportHref} />}
            onClick={() => setDrawerOpen(false)}
          >
            <FileText data-icon="inline-start" />
            {action.label}
          </Button>
        );
      }
      return (
        <Button
          key={action.key}
          type="button"
          variant="ghost"
          className="w-full justify-start"
          disabled={disabled}
          onClick={() => choose(action)}
        >
          {action.report ? <FileText data-icon="inline-start" /> : null}
          {action.label}
        </Button>
      );
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" disabled={busy}>
                <Download data-icon="inline-start" />
                Export
                <ChevronDown data-icon="inline-end" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-max min-w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Lineup</DropdownMenuLabel>
              {lineupLocked ? (
                <p className="text-muted-foreground px-1.5 py-1 text-xs">
                  {lineupHint}
                </p>
              ) : null}
              {renderMenuItems(LINEUP_ACTIONS)}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Event files</DropdownMenuLabel>
              {renderMenuItems(EVENT_FILE_ACTIONS)}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>ZIP packs</DropdownMenuLabel>
              {renderMenuItems(ZIP_ACTIONS)}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="md:hidden">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} showSwipeHandle>
          <DrawerTrigger
            render={
              <Button variant="outline" size="sm" disabled={busy}>
                <Download data-icon="inline-start" />
                Export
              </Button>
            }
          />
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Export</DrawerTitle>
              <DrawerDescription>
                Meet Manager, SwimTopia, CSVs, and event files.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-xs">Lineup</p>
                {lineupLocked ? (
                  <p className="text-muted-foreground text-sm">{lineupHint}</p>
                ) : null}
                {renderDrawerItems(LINEUP_ACTIONS)}
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-xs">Event files</p>
                {renderDrawerItems(EVENT_FILE_ACTIONS)}
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-xs">ZIP packs</p>
                {renderDrawerItems(ZIP_ACTIONS)}
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose render={<Button variant="outline" />}>
                Cancel
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      {error ? (
        <p className="text-destructive max-w-56 text-right text-sm">{error}</p>
      ) : null}
    </div>
  );
}
