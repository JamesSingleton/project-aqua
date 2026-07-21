"use client";

import {
  buildEventKey,
  type Course,
  type EventGender,
  formatEventName,
  parseEventGender,
  type RelayStroke,
  type Stroke,
} from "@project-aqua/swim-core/events";
import { formatTime } from "@project-aqua/swim-core/times";
import {
  detectMeetFileFormat,
  isZipFilename,
} from "@project-aqua/swim-formats/meet";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@project-aqua/ui/components/alert";
import { Button } from "@project-aqua/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@project-aqua/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { Label } from "@project-aqua/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { cn } from "@project-aqua/ui/lib/utils";
import { AlertTriangleIcon, Loader, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { DatePickerField } from "@/components/date-picker-field";
import {
  importMeetFileAction,
  type MeetImportPreview,
  parseMeetFilePreviewAction,
} from "./actions";

const MEET_ACCEPT = ".sd3,.sdif,.cl2,.hy3,.ev3,.hyv,.xls,.xlsx,.txt,.zip";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "mixed", label: "Mixed" },
] as const;

export type MeetImportOption = {
  id: string;
  name: string;
  startDateLabel: string;
};

type ReviewState = {
  name: string;
  startDate: string;
  endDate: string;
  entryDeadline: string;
  course: "SCY" | "SCM" | "LCM";
  location: string;
  address: string;
  maxIndividualEntries: string;
  maxRelayEntries: string;
  maxCombinedEntries: string;
  events: MeetImportPreview["events"];
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function optionalLimit(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

function rebuildEventKey(
  event: MeetImportPreview["events"][number],
  course: Course,
  gender: EventGender,
) {
  return buildEventKey(
    event.distance,
    event.stroke as Stroke | RelayStroke,
    course,
    gender,
  );
}

export function MeetImportButton({
  teamId,
  meets,
  defaultMeetId,
  triggerLabel = "Import",
  triggerVariant = "outline",
  triggerSize = "sm",
}: {
  teamId: string;
  meets: MeetImportOption[];
  /** When set (e.g. meet detail page), default target to that meet */
  defaultMeetId?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
  triggerSize?: "default" | "sm";
}) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{
    name: string;
    label: string;
    sizeLabel: string;
    content: string;
    encoding: "utf8" | "base64";
  } | null>(null);
  const [preview, setPreview] = useState<MeetImportPreview | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultMeetId, setResultMeetId] = useState<string | null>(null);
  const [target, setTarget] = useState<string>(
    defaultMeetId ? defaultMeetId : "auto",
  );

  function resetFlow() {
    setStep("upload");
    setBusy(false);
    setError(null);
    setFileMeta(null);
    setPreview(null);
    setReview(null);
    setResultMessage(null);
    setResultMeetId(null);
  }

  async function handleFiles(fileList: FileList | File[]) {
    const file = Array.from(fileList)[0];
    if (!file) return;

    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError(
        `The file exceeds the ${MAX_FILE_BYTES / (1024 * 1024)} MB size limit.`,
      );
      return;
    }

    setBusy(true);
    try {
      const lower = file.name.toLowerCase();
      const isBinary =
        lower.endsWith(".xls") ||
        lower.endsWith(".xlsx") ||
        lower.endsWith(".zip");
      const encoding = isBinary ? ("base64" as const) : ("utf8" as const);
      let content: string;
      if (isBinary) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        content = btoa(binary);
      } else {
        content = await file.text();
      }
      if (!isZipFilename(file.name)) {
        const format = detectMeetFileFormat(
          file.name,
          isBinary ? undefined : content,
        );
        if (!format) {
          setError(
            "Not a meet file. Use SD3/SDIF, HY3, EV3, HYV, CL2, XLS, or ZIP.",
          );
          return;
        }
      }

      const parsed = await parseMeetFilePreviewAction(
        teamId,
        content,
        file.name,
        encoding,
      );
      setFileMeta({
        name: file.name,
        label: parsed.sourceFilename
          ? `${file.name} → ${parsed.sourceFilename}`
          : file.name,
        sizeLabel: formatBytes(file.size),
        content,
        encoding,
      });
      setPreview(parsed);
      setReview({
        name: parsed.name,
        startDate: parsed.startDate?.slice(0, 10) ?? "",
        endDate: parsed.endDate?.slice(0, 10) ?? "",
        entryDeadline: parsed.entryDeadline?.slice(0, 10) ?? "",
        course: parsed.course,
        location: parsed.location ?? "",
        address: parsed.address ?? "",
        maxIndividualEntries:
          parsed.entryLimits?.maxIndividualEntries?.toString() ?? "",
        maxRelayEntries: parsed.entryLimits?.maxRelayEntries?.toString() ?? "",
        maxCombinedEntries:
          parsed.entryLimits?.maxCombinedEntries?.toString() ?? "",
        events: parsed.events.map((e) => ({ ...e })),
      });
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setBusy(false);
    }
  }

  async function commitImport() {
    if (!fileMeta || !review) return;
    setBusy(true);
    setError(null);
    try {
      const options =
        target === "auto"
          ? { target: "auto" as const }
          : target === "new"
            ? { target: "new" as const }
            : { target: "existing" as const, meetId: target };

      const result = await importMeetFileAction(
        teamId,
        fileMeta.content,
        fileMeta.name,
        {
          ...options,
          encoding: fileMeta.encoding,
          review: {
            name: review.name,
            startDate: review.startDate || undefined,
            endDate: review.endDate,
            entryDeadline: review.entryDeadline,
            course: review.course,
            location: review.location || undefined,
            address: review.address || undefined,
            maxIndividualEntries: optionalLimit(review.maxIndividualEntries),
            maxRelayEntries: optionalLimit(review.maxRelayEntries),
            maxCombinedEntries: optionalLimit(review.maxCombinedEntries),
            events: review.events,
          },
        },
      );

      const parts = [
        result.events ? `${result.events} events` : null,
        result.entries ? `${result.entries} entries` : null,
        result.results ? `${result.results} results` : null,
        result.unmatched ? `${result.unmatched} unmatched` : null,
      ].filter(Boolean);

      setResultMeetId(result.meetId);
      setResultMessage(
        result.linkedExisting
          ? `Linked to existing meet · ${parts.join(" · ") || "done"}`
          : `Created meet · ${parts.join(" · ") || "done"}`,
      );
      setStep("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function updateEventGender(index: number, genderRaw: string) {
    setReview((prev) => {
      if (!prev) return prev;
      const gender = parseEventGender(genderRaw);
      const events = prev.events.map((event, i) => {
        if (i !== index) return event;
        return {
          ...event,
          gender,
          eventKey: rebuildEventKey(event, prev.course, gender),
        };
      });
      return { ...prev, events };
    });
  }

  function updateEventAgeGroup(index: number, ageGroup: string) {
    setReview((prev) => {
      if (!prev) return prev;
      const events = prev.events.map((event, i) =>
        i === index
          ? { ...event, ageGroup: ageGroup.trim() || undefined }
          : event,
      );
      return { ...prev, events };
    });
  }

  const reviewHasAgeGroups =
    review?.events.some((event) => event.ageGroup != null) ?? false;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetFlow();
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant={triggerVariant} size={triggerSize} />
        }
      >
        <Upload data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto overflow-x-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {step === "review"
              ? "Review import"
              : step === "done"
                ? "Import complete"
                : "Import meet file"}
          </DialogTitle>
          <DialogDescription>
            {step === "review"
              ? "Confirm meet details and entry limits before adding."
              : step === "done"
                ? "Your file has been imported."
                : "Upload event templates (EV3/HYV), entries, results (SD3, HY3, CL2), or XLS reports."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-4">
          {step === "upload" ? (
            <>
              <Field className="min-w-0">
                <FieldLabel htmlFor={`${inputId}-target`}>Attach to</FieldLabel>
                <Select
                  items={[
                    {
                      value: "auto",
                      label: "Auto (match results if possible)",
                    },
                    { value: "new", label: "Always create a new meet" },
                    ...meets.map((meet) => ({
                      value: meet.id,
                      label: `${meet.name} · ${meet.startDateLabel}`,
                    })),
                  ]}
                  value={target}
                  onValueChange={(v) => {
                    if (v != null) setTarget(v);
                  }}
                >
                  <SelectTrigger id={`${inputId}-target`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="auto">
                        Auto (match results if possible)
                      </SelectItem>
                      <SelectItem value="new">
                        Always create a new meet
                      </SelectItem>
                      {meets.map((meet) => (
                        <SelectItem key={meet.id} value={meet.id}>
                          {meet.name} · {meet.startDateLabel}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <div
                role="button"
                tabIndex={0}
                data-dragging={dragging || undefined}
                aria-disabled={busy}
                className={cn(
                  "border-input has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 flex min-h-40 w-full min-w-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-sm border border-dashed p-6 text-center has-[input:focus]:ring-[3px]",
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
                  accept={MEET_ACCEPT}
                  disabled={busy}
                  className="sr-only"
                  aria-label="Upload meet file"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      void handleFiles(e.target.files);
                    }
                    e.target.value = "";
                  }}
                />
                {busy ? (
                  <Loader
                    className="size-10 animate-spin stroke-1"
                    aria-hidden
                  />
                ) : (
                  <Upload className="size-10 shrink-0 stroke-1" aria-hidden />
                )}
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-base font-medium text-balance">
                    {busy
                      ? "Parsing file…"
                      : "Drag & Drop or Choose file to upload"}
                  </p>
                  <p className="text-muted-foreground text-sm text-balance">
                    SD3, HY3, EV3, HYV, CL2, XLS, or ZIP · Up to{" "}
                    {MAX_FILE_BYTES / (1024 * 1024)} MB
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {step === "review" && review && preview && fileMeta ? (
            <>
              <p className="text-muted-foreground text-sm">
                {fileMeta.label} · {fileMeta.sizeLabel} · {preview.format} ·{" "}
                {preview.events.length} events
                {preview.entryCount ? ` · ${preview.entryCount} entries` : ""}
                {preview.resultCount ? ` · ${preview.resultCount} results` : ""}
                {preview.exhibitionCount
                  ? ` · ${preview.exhibitionCount} exhibition`
                  : ""}
              </p>

              {preview.skippedDiveEvents != null &&
              preview.skippedDiveEvents > 0 ? (
                <Alert>
                  <AlertTriangleIcon />
                  <AlertTitle>Diving events skipped</AlertTitle>
                  <AlertDescription>
                    {preview.skippedDiveEvents === 1
                      ? "1 diving event was found in this file and was not imported."
                      : `${preview.skippedDiveEvents} diving events were found in this file and were not imported.`}{" "}
                    Project Aqua currently supports swim events only; diving
                    support is planned.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`${inputId}-name`}>Meet name</Label>
                  <Input
                    id={`${inputId}-name`}
                    value={review.name}
                    onChange={(e) =>
                      setReview((prev) =>
                        prev ? { ...prev, name: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <Field>
                  <FieldLabel htmlFor={`${inputId}-start`}>
                    Start date
                  </FieldLabel>
                  <DatePickerField
                    id={`${inputId}-start`}
                    value={review.startDate}
                    onChange={(startDate) =>
                      setReview((prev) =>
                        prev ? { ...prev, startDate } : prev,
                      )
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${inputId}-end`}>End date</FieldLabel>
                  <DatePickerField
                    id={`${inputId}-end`}
                    value={review.endDate}
                    onChange={(endDate) =>
                      setReview((prev) => (prev ? { ...prev, endDate } : prev))
                    }
                    placeholder="Same as start (optional)"
                    allowClear
                  />
                  <FieldDescription>
                    Clear if the Hy-Tek file lists an extra day you don’t want.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${inputId}-deadline`}>
                    Entry deadline
                  </FieldLabel>
                  <DatePickerField
                    id={`${inputId}-deadline`}
                    value={review.entryDeadline}
                    onChange={(entryDeadline) =>
                      setReview((prev) =>
                        prev ? { ...prev, entryDeadline } : prev,
                      )
                    }
                    placeholder="Optional"
                    allowClear
                  />
                  <FieldDescription>
                    When entries are due to the meet host.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${inputId}-course`}>Course</FieldLabel>
                  <Select
                    value={review.course}
                    onValueChange={(v) => {
                      if (v == null) return;
                      const course = v as Course;
                      setReview((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          course,
                          events: prev.events.map((event) => ({
                            ...event,
                            eventKey: rebuildEventKey(
                              event,
                              course,
                              parseEventGender(event.gender),
                            ),
                          })),
                        };
                      });
                    }}
                  >
                    <SelectTrigger id={`${inputId}-course`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="SCY">SCY</SelectItem>
                        <SelectItem value="SCM">SCM</SelectItem>
                        <SelectItem value="LCM">LCM</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="space-y-2">
                  <Label htmlFor={`${inputId}-location`}>Venue</Label>
                  <Input
                    id={`${inputId}-location`}
                    value={review.location}
                    onChange={(e) =>
                      setReview((prev) =>
                        prev ? { ...prev, location: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${inputId}-address`}>Address</Label>
                  <Input
                    id={`${inputId}-address`}
                    value={review.address}
                    onChange={(e) =>
                      setReview((prev) =>
                        prev ? { ...prev, address: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`${inputId}-max-ind`}>Max individual</Label>
                  <Input
                    id={`${inputId}-max-ind`}
                    inputMode="numeric"
                    placeholder="—"
                    value={review.maxIndividualEntries}
                    onChange={(e) =>
                      setReview((prev) =>
                        prev
                          ? {
                              ...prev,
                              maxIndividualEntries: e.target.value,
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${inputId}-max-relay`}>Max relay</Label>
                  <Input
                    id={`${inputId}-max-relay`}
                    inputMode="numeric"
                    placeholder="—"
                    value={review.maxRelayEntries}
                    onChange={(e) =>
                      setReview((prev) =>
                        prev
                          ? { ...prev, maxRelayEntries: e.target.value }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${inputId}-max-combined`}>
                    Max combined
                  </Label>
                  <Input
                    id={`${inputId}-max-combined`}
                    inputMode="numeric"
                    placeholder="—"
                    value={review.maxCombinedEntries}
                    onChange={(e) =>
                      setReview((prev) =>
                        prev
                          ? {
                              ...prev,
                              maxCombinedEntries: e.target.value,
                            }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              {review.events.length > 0 ? (
                <div className="flex max-h-48 min-w-0 flex-col gap-2 overflow-y-auto rounded-md border p-2">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Events ({review.events.length})
                  </p>
                  {review.events.map((event, index) => (
                    <div
                      key={`${event.eventKey}-${index}`}
                      className={cn(
                        "grid items-center gap-2 text-sm",
                        reviewHasAgeGroups
                          ? "grid-cols-[auto_1fr_auto_auto]"
                          : "grid-cols-[auto_1fr_auto]",
                      )}
                    >
                      <span className="text-muted-foreground tabular-nums">
                        #{event.eventNumber ?? "—"}
                      </span>
                      <span className="truncate">
                        {formatEventName(event.distance, event.stroke)}
                        {event.qualifyingTimeMs != null &&
                        event.qualifyingTimeMs > 0 ? (
                          <span className="text-muted-foreground ml-1.5 tabular-nums">
                            QT {formatTime(event.qualifyingTimeMs)}
                          </span>
                        ) : null}
                      </span>
                      <Select
                        items={GENDER_OPTIONS}
                        value={parseEventGender(event.gender)}
                        onValueChange={(v) => {
                          if (v != null) updateEventGender(index, v);
                        }}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {reviewHasAgeGroups ? (
                        <Input
                          className="h-8 w-20"
                          aria-label={`Age group for event ${event.eventNumber ?? index + 1}`}
                          placeholder="Age"
                          value={event.ageGroup ?? ""}
                          onChange={(e) =>
                            updateEventAgeGroup(index, e.target.value)
                          }
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No events in this file (entries/results only).
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setStep("upload");
                    setPreview(null);
                    setReview(null);
                    setFileMeta(null);
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={busy || !review.name.trim()}
                  onClick={() => void commitImport()}
                >
                  {busy ? "Importing…" : "Confirm import"}
                </Button>
              </div>
            </>
          ) : null}

          {step === "done" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm">{resultMessage}</p>
              <div className="flex flex-wrap gap-2">
                {resultMeetId ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/team/${teamId}/meets/${resultMeetId}`);
                    }}
                  >
                    Open meet
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetFlow()}
                >
                  Import another
                </Button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
