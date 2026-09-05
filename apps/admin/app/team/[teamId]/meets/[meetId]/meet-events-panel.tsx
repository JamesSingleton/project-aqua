"use client";

import {
  formatEventName,
  formatGenderLabel,
} from "@project-aqua/swim-core/events";
import { BUILT_IN_MEET_EVENT_PRESETS } from "@project-aqua/swim-core/meet-event-presets";
import { formatTime } from "@project-aqua/swim-core/times";
import { MANUAL_EVENT_STROKES } from "@project-aqua/swim-core/validators";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@project-aqua/ui/components/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addManualMeetEventAction,
  applyBuiltInMeetTemplateAction,
  applyTeamEventTemplateAction,
  copyMeetEventsFromMeetAction,
  deleteManualMeetEventAction,
  deleteTeamEventTemplateAction,
  saveMeetAsEventTemplateAction,
  suggestMeetEventNumberAction,
  updateManualMeetEventAction,
} from "../meet-events-actions";

type MeetEventRow = {
  id: string;
  eventNumber: number | null;
  stroke: string;
  distance: number;
  gender: string;
  ageGroup: string | null;
  qualifyingTimeMs: number | null;
  eventKey: string;
  entryCount: number;
};

type TeamTemplate = {
  id: string;
  name: string;
  course: string;
  events: unknown[];
};

type OtherMeet = {
  id: string;
  name: string;
};

const STROKE_LABELS: Record<string, string> = {
  free: "Freestyle",
  back: "Backstroke",
  breast: "Breaststroke",
  fly: "Butterfly",
  im: "IM",
  free_relay: "Free relay",
  medley_relay: "Medley relay",
};

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "mixed", label: "Mixed" },
] as const;

function EventForm({
  teamId,
  meetId,
  initial,
  suggestedEventNumber,
  entryCount,
  onDone,
}: {
  teamId: string;
  meetId: string;
  initial?: MeetEventRow;
  suggestedEventNumber?: number | null;
  entryCount: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const locked = entryCount > 0;
  const [eventNumber, setEventNumber] = useState(
    initial?.eventNumber?.toString() ?? suggestedEventNumber?.toString() ?? "",
  );
  const [stroke, setStroke] = useState(initial?.stroke ?? "free");
  const [distance, setDistance] = useState(
    initial?.distance?.toString() ?? "50",
  );
  const [gender, setGender] = useState(initial?.gender ?? "female");
  const [ageGroup, setAgeGroup] = useState(initial?.ageGroup ?? "");
  const [qualifyingTime, setQualifyingTime] = useState(
    initial?.qualifyingTimeMs != null && initial.qualifyingTimeMs > 0
      ? formatTime(initial.qualifyingTimeMs)
      : "",
  );

  function submit() {
    setError("");
    const formData = new FormData();
    formData.set("eventNumber", eventNumber);
    formData.set("stroke", stroke);
    formData.set("distance", distance);
    formData.set("gender", gender);
    formData.set("ageGroup", ageGroup);
    formData.set("qualifyingTime", qualifyingTime);

    startTransition(async () => {
      try {
        if (initial) {
          await updateManualMeetEventAction(
            teamId,
            meetId,
            initial.id,
            formData,
          );
        } else {
          await addManualMeetEventAction(teamId, meetId, formData);
        }
        router.refresh();
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save event");
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="eventNumber">Event #</Label>
          <Input
            id="eventNumber"
            type="number"
            min={1}
            value={eventNumber}
            disabled={locked}
            onChange={(e) => setEventNumber(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Gender</Label>
          <Select
            value={gender}
            disabled={locked}
            onValueChange={(value) => value && setGender(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Stroke</Label>
          <Select
            value={stroke}
            disabled={locked}
            onValueChange={(value) => value && setStroke(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MANUAL_EVENT_STROKES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STROKE_LABELS[value] ?? value}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="distance">Distance</Label>
          <Input
            id="distance"
            type="number"
            min={0}
            value={distance}
            disabled={locked}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ageGroup">Age group (optional)</Label>
          <Input
            id="ageGroup"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            placeholder="11-12, JV, Open…"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qualifyingTime">QT (optional)</Label>
          <Input
            id="qualifyingTime"
            value={qualifyingTime}
            onChange={(e) => setQualifyingTime(e.target.value)}
            placeholder="1:23.45"
          />
        </div>
      </div>
      {locked ? (
        <p className="text-muted-foreground text-sm">
          This event has entries. Only age group and QT can be edited until
          entries are removed.
        </p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={pending} onClick={submit}>
          {pending ? "Saving…" : initial ? "Save changes" : "Add event"}
        </Button>
      </div>
    </div>
  );
}

export function MeetEventsPanel({
  teamId,
  meetId,
  events,
  canManage,
  teamTemplates,
  otherMeets,
}: {
  teamId: string;
  meetId: string;
  events: MeetEventRow[];
  canManage: boolean;
  teamTemplates: TeamTemplate[];
  otherMeets: OtherMeet[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<MeetEventRow | null>(null);
  const [suggestedNumber, setSuggestedNumber] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  async function openAddDialog() {
    setError("");
    try {
      const next = await suggestMeetEventNumberAction(teamId, meetId);
      setSuggestedNumber(next);
      setAddOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open form");
    }
  }

  function runTemplateAction(action: () => Promise<void>) {
    setError("");
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function deleteEvent(event: MeetEventRow, force = false) {
    setError("");
    startTransition(async () => {
      try {
        await deleteManualMeetEventAction(teamId, meetId, event.id, { force });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not delete";
        if (!force && event.entryCount > 0) {
          const confirmed = window.confirm(
            `${message}\n\nRemove this event and its entries?`,
          );
          if (confirmed) deleteEvent(event, true);
          return;
        }
        setError(message);
      }
    });
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => void openAddDialog()}>
            <Plus data-icon="inline-start" />
            Add event
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" disabled={pending}>
                  Add from template
                  <ChevronDown className="ml-1 size-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Built-in</DropdownMenuLabel>
                {BUILT_IN_MEET_EVENT_PRESETS.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    onClick={() =>
                      runTemplateAction(() =>
                        applyBuiltInMeetTemplateAction(
                          teamId,
                          meetId,
                          preset.id,
                        ),
                      )
                    }
                  >
                    {preset.label} ({preset.events.length})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {teamTemplates.length > 0 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Team templates</DropdownMenuLabel>
                    {teamTemplates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() =>
                          runTemplateAction(() =>
                            applyTeamEventTemplateAction(
                              teamId,
                              meetId,
                              template.id,
                            ),
                          )
                        }
                      >
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              ) : null}
              {otherMeets.length > 0 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Copy from meet</DropdownMenuLabel>
                    {otherMeets.map((meet) => (
                      <DropdownMenuItem
                        key={meet.id}
                        onClick={() =>
                          runTemplateAction(() =>
                            copyMeetEventsFromMeetAction(
                              teamId,
                              meetId,
                              meet.id,
                            ),
                          )
                        }
                      >
                        {meet.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={events.length === 0}
                >
                  Save as template
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save event list as team template</DialogTitle>
                <DialogDescription>
                  Reuse this event list on future meets (max 20 per team).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="templateName">Template name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Home SCY dual"
                />
              </div>
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : null}
              <Button
                disabled={pending || !templateName.trim()}
                onClick={() =>
                  runTemplateAction(async () => {
                    await saveMeetAsEventTemplateAction(
                      teamId,
                      meetId,
                      templateName.trim(),
                    );
                    setTemplateName("");
                    setSaveTemplateOpen(false);
                  })
                }
              >
                Save template
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}

      {error && !addOpen && !editEvent ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : null}

      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No events yet. Add events manually, start from a template, or import a
          meet file.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age group</TableHead>
              <TableHead>QT</TableHead>
              <TableHead className="w-20 text-right">Entries</TableHead>
              {canManage ? (
                <TableHead className="w-24">
                  <span className="sr-only">Actions</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...events]
              .sort((a, b) => (a.eventNumber ?? 9999) - (b.eventNumber ?? 9999))
              .map((event) => {
                const eventName = formatEventName(event.distance, event.stroke);
                const eventRef =
                  event.eventNumber != null
                    ? `#${event.eventNumber} ${eventName}`
                    : eventName;
                return (
                  <TableRow key={event.id}>
                    <TableCell>{event.eventNumber ?? "—"}</TableCell>
                    <TableCell>{eventName}</TableCell>
                    <TableCell>{formatGenderLabel(event.gender)}</TableCell>
                    <TableCell>{event.ageGroup ?? "—"}</TableCell>
                    <TableCell>
                      {event.qualifyingTimeMs != null &&
                      event.qualifyingTimeMs > 0
                        ? formatTime(event.qualifyingTimeMs)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {event.entryCount}
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${eventRef}`}
                            onClick={() => setEditEvent(event)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${eventRef}`}
                            onClick={() => deleteEvent(event)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add event</DialogTitle>
            <DialogDescription>
              {suggestedNumber != null
                ? `Suggested event number: ${suggestedNumber}`
                : "Define a new event for this meet."}
            </DialogDescription>
          </DialogHeader>
          <EventForm
            teamId={teamId}
            meetId={meetId}
            suggestedEventNumber={suggestedNumber}
            entryCount={0}
            onDone={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editEvent}
        onOpenChange={(open) => !open && setEditEvent(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit event</DialogTitle>
          </DialogHeader>
          {editEvent ? (
            <EventForm
              teamId={teamId}
              meetId={meetId}
              initial={editEvent}
              entryCount={editEvent.entryCount}
              onDone={() => setEditEvent(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {canManage && teamTemplates.length > 0 ? (
        <div className="text-muted-foreground text-sm">
          Team templates:{" "}
          {teamTemplates.map((template, index) => (
            <span key={template.id}>
              {index > 0 ? ", " : ""}
              {template.name}
              <Button
                variant="link"
                className="text-muted-foreground h-auto px-1 text-sm"
                onClick={() =>
                  runTemplateAction(() =>
                    deleteTeamEventTemplateAction(teamId, template.id),
                  )
                }
              >
                (delete)
              </Button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
