"use client";

import {
  formatBestTimeAchievedLabel,
  formatDateOnly,
  formatDateOnlyLabel,
  formatLocalDateOnly,
  formatLocalDateOnlyLabel,
  parseLocalDateOnly,
} from "@project-aqua/swim-core/calendar-date";
import { EVENT_CATALOG } from "@project-aqua/swim-core/event-catalog";
import { formatBestTimeEventLabel } from "@project-aqua/swim-core/team-types";
import { formatTime } from "@project-aqua/swim-core/times";
import { Button } from "@project-aqua/ui/components/button";
import { Calendar } from "@project-aqua/ui/components/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@project-aqua/ui/components/dialog";
import { Input } from "@project-aqua/ui/components/input";
import { Label } from "@project-aqua/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@project-aqua/ui/components/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { cn } from "@project-aqua/ui/lib/utils";
import { CalendarIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  deleteSwimmerBestTimeAction,
  setSwimmerBestTimeAction,
} from "@/app/team/[teamId]/progression/best-times-actions";
import { LabeledCombobox } from "@/components/labeled-combobox";

export type BestTimeRow = {
  id: string;
  eventKey: string;
  eventLabel: string | null;
  eventGender: string | null;
  course: string;
  timeMs: number;
  achievedAt: Date;
  meetName?: string | null;
};

type EditorMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; row: BestTimeRow };

function AchievedDatePicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseLocalDateOnly(value);
  const label = formatLocalDateOnlyLabel(value, "long");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {label ?? "Pick a date"}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            onChange(date ? formatLocalDateOnly(date) : "");
            setOpen(false);
          }}
          disabled={{ after: new Date() }}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

export function BestTimesCard({
  teamId,
  swimmerId,
  swimmerGender,
  bestTimes,
  teamType,
  canEdit,
}: {
  teamId: string;
  swimmerId: string;
  swimmerGender: "male" | "female";
  bestTimes: BestTimeRow[];
  teamType?: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<EditorMode>({ kind: "closed" });
  const [eventKey, setEventKey] = useState("");
  const [time, setTime] = useState("");
  const [achievedOn, setAchievedOn] = useState(() =>
    formatLocalDateOnly(new Date()),
  );
  const [error, setError] = useState("");

  const eventOptions = useMemo(() => {
    return EVENT_CATALOG.filter(
      (e) => e.eventType === "individual" && e.gender === swimmerGender,
    ).map((e) => ({
      value: e.eventKey,
      label: `${e.label} · ${e.course}`,
    }));
  }, [swimmerGender]);

  function openAdd() {
    setError("");
    setEventKey("");
    setTime("");
    setAchievedOn(formatLocalDateOnly(new Date()));
    setMode({ kind: "add" });
  }

  function openEdit(row: BestTimeRow) {
    setError("");
    setEventKey(row.eventKey);
    const formatted = formatTime(row.timeMs);
    setTime(formatted === "NT" ? "" : formatted);
    setAchievedOn(formatDateOnly(new Date(row.achievedAt)));
    setMode({ kind: "edit", row });
  }

  function close() {
    setMode({ kind: "closed" });
    setError("");
  }

  function onSave() {
    setError("");
    if (!eventKey) {
      setError("Select an event");
      return;
    }
    if (!time.trim()) {
      setError("Enter a time");
      return;
    }
    if (!achievedOn) {
      setError("Pick a date");
      return;
    }

    startTransition(async () => {
      try {
        await setSwimmerBestTimeAction(teamId, swimmerId, {
          eventKey,
          time: time.trim(),
          achievedOn,
        });
        close();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save time");
      }
    });
  }

  function onDelete(row: BestTimeRow) {
    const label = formatBestTimeEventLabel(
      row.eventLabel,
      row.course,
      row.eventGender,
      teamType,
    );
    const confirmed = window.confirm(`Remove best time for ${label}?`);
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteSwimmerBestTimeAction(teamId, swimmerId, row.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete time");
      }
    });
  }

  const open = mode.kind !== "closed";
  const editing = mode.kind === "edit";

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Best times</CardTitle>
          <CardDescription>
            Personal records
            {canEdit
              ? " — add club or other times that aren’t in meet results"
              : null}
          </CardDescription>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" variant="outline" onClick={openAdd}>
            <PlusIcon data-icon="inline-start" />
            Add time
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {error && mode.kind === "closed" ? (
          <p className="text-destructive mb-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}

        {bestTimes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No times recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Achieved</TableHead>
                {canEdit ? <TableHead className="w-24"> </TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bestTimes.map((bt) => (
                <TableRow key={bt.id}>
                  <TableCell>
                    {formatBestTimeEventLabel(
                      bt.eventLabel,
                      bt.course,
                      bt.eventGender,
                      teamType,
                    )}
                  </TableCell>
                  <TableCell>{bt.course}</TableCell>
                  <TableCell className="font-mono font-timing">
                    {formatTime(bt.timeMs)}
                  </TableCell>
                  <TableCell>
                    {formatBestTimeAchievedLabel(
                      new Date(bt.achievedAt),
                      bt.meetName,
                      (date) =>
                        formatDateOnlyLabel(date, undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }),
                    )}
                  </TableCell>
                  {canEdit ? (
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Edit best time"
                          disabled={pending}
                          onClick={() => openEdit(bt)}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Delete best time"
                          disabled={pending}
                          onClick={() => onDelete(bt)}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit best time" : "Add best time"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the time or date for this personal record."
                : "Enter a time from another team or meet that isn’t imported here."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="best-time-event">Event</Label>
              {editing ? (
                <Input
                  id="best-time-event"
                  value={formatBestTimeEventLabel(
                    mode.row.eventLabel,
                    mode.row.course,
                    mode.row.eventGender,
                    teamType,
                  )}
                  disabled
                />
              ) : (
                <LabeledCombobox
                  id="best-time-event"
                  items={eventOptions}
                  value={eventKey}
                  onChange={setEventKey}
                  placeholder="Search events…"
                  emptyText="No events found."
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="best-time-value">Time</Label>
              <Input
                id="best-time-value"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="1:02.34 or 28.50"
                className="font-mono"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="best-time-date">Achieved on</Label>
              <AchievedDatePicker
                id="best-time-date"
                value={achievedOn}
                onChange={setAchievedOn}
              />
            </div>

            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="button" disabled={pending} onClick={onSave}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
