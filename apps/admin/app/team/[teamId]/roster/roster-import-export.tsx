"use client";

import {
  detectRosterFileFormat,
  isRosterSharePack,
} from "@project-aqua/swim-formats/roster";
import { Button } from "@project-aqua/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@project-aqua/ui/components/dialog";
import { Progress } from "@project-aqua/ui/components/progress";
import { cn } from "@project-aqua/ui/lib/utils";
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  FileText,
  Loader,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { importRosterFileAction } from "./actions";

const ROSTER_ACCEPT =
  ".csv,.sd3,.sdif,.cl2,.hy3,.zip,.json,.aqua.json,application/json,application/vnd.ms-excel,text/csv,text/plain";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

type ImportEntry = {
  id: string;
  name: string;
  sizeLabel: string;
  status: "uploading" | "success" | "failed";
  progress: number;
  message?: string;
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function RosterImportButton({ teamId }: { teamId: string }) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [entries, setEntries] = useState<ImportEntry[]>([]);
  const busy = entries.some((e) => e.status === "uploading");

  function handleExportTemplate() {
    const blob = new Blob(
      [
        "first_name,last_name,middle_name,preferred_name,date_of_birth,gender,practice_group,class_year,usa_member_id,parent_name,parent_email\n",
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roster-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    const id = `${file.name}-${file.size}-${Date.now()}`;
    const sizeLabel = formatBytes(file.size);

    if (file.size > MAX_FILE_BYTES) {
      setEntries((prev) => [
        {
          id,
          name: file.name,
          sizeLabel,
          status: "failed",
          progress: 60,
          message: `The file exceeds the ${MAX_FILE_BYTES / (1024 * 1024)} MB size limit.`,
        },
        ...prev,
      ]);
      return;
    }

    setEntries((prev) => [
      {
        id,
        name: file.name,
        sizeLabel,
        status: "uploading",
        progress: 35,
      },
      ...prev,
    ]);

    try {
      const isZip = file.name.toLowerCase().endsWith(".zip");
      let content: string;
      let encoding: "utf8" | "base64" = "utf8";
      if (isZip) {
        const buffer = await file.arrayBuffer();
        content = btoa(
          Array.from(new Uint8Array(buffer), (b) =>
            String.fromCharCode(b),
          ).join(""),
        );
        encoding = "base64";
      } else {
        content = await file.text();
        if (!isRosterSharePack(content)) {
          const format = detectRosterFileFormat(file.name, content);
          if (!format) {
            setEntries((prev) =>
              prev.map((entry) =>
                entry.id === id
                  ? {
                      ...entry,
                      status: "failed",
                      progress: 100,
                      message:
                        "Not a roster file. Use a Project Aqua share pack (.aqua.json), Team Manager Swimmers Only (CL2/HY3), CSV, or a roster ZIP.",
                    }
                  : entry,
              ),
            );
            return;
          }
        }
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, progress: 75 } : entry,
        ),
      );

      const result = await importRosterFileAction(
        teamId,
        file.name,
        content,
        encoding,
      );
      let successMessage = `Imported ${result.added} swimmers`;
      if ("sourceTeamName" in result) {
        const parts: string[] = [`From ${result.sourceTeamName}`];
        if (result.merged > 0) {
          parts.push(
            `merged ${result.merged} duplicate${result.merged === 1 ? "" : "s"}`,
          );
        }
        if (result.linked > 0) {
          parts.push(`linked ${result.linked} new`);
        }
        if (result.merged === 0 && result.linked === 0) {
          parts.push(`processed ${result.added}`);
        }
        if (result.alreadyOnTeam > 0) {
          parts.push(`${result.alreadyOnTeam} already on team`);
        }
        if (result.failed.length > 0) {
          parts.push(`${result.failed.length} failed`);
        }
        successMessage = parts.join(" · ");
      }
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: "success",
                progress: 100,
                message: successMessage,
              }
            : entry,
        ),
      );
      router.refresh();
    } catch (err) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: "failed",
                progress: 100,
                message: err instanceof Error ? err.message : "Import failed",
              }
            : entry,
        ),
      );
    }
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).slice(0, 1);
    for (const file of files) {
      await importFile(file);
    }
  }

  const uploading = entries.filter((e) => e.status === "uploading");
  const failed = entries.filter((e) => e.status === "failed");
  const succeeded = entries.filter((e) => e.status === "success");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Upload data-icon="inline-start" />
        Import
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import roster</DialogTitle>
          <DialogDescription>
            Import a Project Aqua share pack (.aqua.json) to link athletes by
            opaque ID. If this team already has the same person (name + DOB), we
            merge into the shared profile instead of creating a duplicate. CSV /
            SD3 / CL2 / HY3 from Team Manager are also supported.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div
            role="button"
            tabIndex={0}
            data-dragging={dragging || undefined}
            aria-disabled={busy}
            className={cn(
              "border-input has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 flex min-h-52 flex-col items-center justify-center gap-4 overflow-hidden rounded-sm border border-dashed p-6 text-center has-[input:focus]:ring-[3px]",
              busy && "pointer-events-none opacity-60",
            )}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files?.length) {
                void handleFiles(e.dataTransfer.files);
              }
            }}
          >
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={ROSTER_ACCEPT}
              disabled={busy}
              className="sr-only"
              aria-label="Upload roster file"
              onChange={(e) => {
                if (e.target.files?.length) {
                  void handleFiles(e.target.files);
                }
                e.target.value = "";
              }}
            />
            <Upload className="size-10 stroke-1" aria-hidden />
            <p className="text-base font-medium">
              Drag &amp; Drop or Choose file to upload
            </p>
            <p className="text-muted-foreground text-sm">
              Share pack, CSV, SD3, CL2, or HY3 · Up to{" "}
              {MAX_FILE_BYTES / (1024 * 1024)} MB
            </p>
          </div>

          <div className="flex justify-center">
            <Button type="button" variant="link" onClick={handleExportTemplate}>
              Download CSV template
            </Button>
          </div>

          {uploading.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-sm uppercase">
                <Loader className="size-4 animate-spin" aria-hidden />
                Uploading
              </h3>
              <div className="flex flex-col gap-2.5">
                {uploading.map((entry) => (
                  <ImportFileCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ) : null}

          {succeeded.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-sm uppercase">
                <CircleCheck className="size-4" aria-hidden />
                Imported
              </h3>
              <div className="flex flex-col gap-2.5">
                {succeeded.map((entry) => (
                  <ImportFileCard
                    key={entry.id}
                    entry={entry}
                    onDismiss={() =>
                      setEntries((prev) =>
                        prev.filter((e) => e.id !== entry.id),
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {failed.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-sm uppercase">
                <CircleX className="size-4" aria-hidden />
                Failed
              </h3>
              <div className="flex flex-col gap-2">
                {failed.map((entry) => (
                  <ImportFileCard
                    key={entry.id}
                    entry={entry}
                    onDismiss={() =>
                      setEntries((prev) =>
                        prev.filter((e) => e.id !== entry.id),
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportFileCard({
  entry,
  onDismiss,
}: {
  entry: ImportEntry;
  onDismiss?: () => void;
}) {
  return (
    <div className="bg-muted flex flex-col gap-2 rounded-lg p-3">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-8 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-col">
            <p className="truncate font-medium">{entry.name}</p>
            <p
              className={cn(
                "text-xs",
                entry.status === "failed"
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {entry.sizeLabel}
            </p>
          </div>
        </div>
        {onDismiss || entry.status === "uploading" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Dismiss"
            disabled={entry.status === "uploading"}
            onClick={onDismiss}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {entry.status === "uploading" ? (
        <div className="flex w-full flex-col gap-2">
          <span className="text-muted-foreground flex justify-end text-sm">
            {entry.progress}%
          </span>
          <Progress
            value={entry.progress}
            className="**:data-[slot=progress-track]:bg-primary/20 **:data-[slot=progress-track]:h-2"
          />
        </div>
      ) : null}

      {entry.status === "success" && entry.message ? (
        <p className="text-muted-foreground text-sm">{entry.message}</p>
      ) : null}

      {entry.status === "failed" && entry.message ? (
        <div className="flex flex-col gap-2">
          <div className="text-destructive flex items-center gap-1 text-sm">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {entry.message}
          </div>
          <div className="bg-destructive/10 h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-destructive h-full transition-all duration-300 ease-out"
              style={{ width: `${entry.progress}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
