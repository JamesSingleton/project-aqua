"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatDateOnly,
  isUtcCalendarDay,
} from "@project-aqua/swim-core/calendar-date";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@project-aqua/ui/components/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { Textarea } from "@project-aqua/ui/components/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  DateTimePickerField,
  toDateTimeLocalValue,
} from "@/components/date-time-picker-field";
import {
  createCalendarEventAction,
  deleteCalendarEventAction,
  updateCalendarEventAction,
} from "./actions";
import { RecurringScheduleForm } from "./recurring-schedule-form";

const eventTypes = [
  { label: "Other", value: "other" },
  { label: "Practice", value: "practice" },
  { label: "Meet", value: "meet" },
] as const;

const calendarEventFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  startsAt: z.string().min(1, "Start date and time are required"),
  endsAt: z.string(),
  location: z.string().max(200),
  notes: z.string().max(2000),
  eventType: z.enum(["other", "practice", "meet"]),
});

type CalendarEventFormValues = z.infer<typeof calendarEventFormSchema>;

type CalEvent = {
  id: string;
  source: string;
  title: string;
  location: string | null;
  description: string | null;
  startsAt: Date | string;
  endsAt: Date | string | null;
  eventType: string;
  meetId: string | null;
  practiceSessionId: string | null;
};

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Meet rows are date-only (UTC midnight); match them by UTC calendar day. */
function eventFallsOnLocalDay(
  event: CalEvent,
  year: number,
  month: number,
  day: number,
): boolean {
  const startsAt = asDate(event.startsAt);
  if (event.source === "meet") {
    return isUtcCalendarDay(startsAt, year, month, day);
  }
  return (
    startsAt.getFullYear() === year &&
    startsAt.getMonth() === month &&
    startsAt.getDate() === day
  );
}

function eventFallsOnDate(event: CalEvent, day: Date): boolean {
  if (event.source === "meet") {
    return formatDateOnly(asDate(event.startsAt)) === formatDateOnlyLocal(day);
  }
  return asDate(event.startsAt).toDateString() === day.toDateString();
}

function formatDateOnlyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Meets are date-only; hide midnight. Practices/custom show start–end. */
function formatEventWhen(event: CalEvent): string | null {
  if (event.source === "meet") return null;
  const start = asDate(event.startsAt);
  const startLabel = formatTimeLabel(start);
  if (!event.endsAt) return startLabel;
  return `${startLabel}–${formatTimeLabel(asDate(event.endsAt))}`;
}

function eventTypeValue(value: string): CalendarEventFormValues["eventType"] {
  if (value === "practice" || value === "meet" || value === "other") {
    return value;
  }
  return "other";
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function CalendarBoard({
  teamId,
  initialYear,
  initialMonth,
  events,
  defaultLocation = "",
}: {
  teamId: string;
  initialYear: number;
  initialMonth: number;
  events: CalEvent[];
  defaultLocation?: string;
}) {
  const router = useRouter();
  const [anchor, setAnchor] = useState(new Date(initialYear, initialMonth, 1));
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"month" | "week">("month");
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CalendarEventFormValues>({
    resolver: zodResolver(calendarEventFormSchema),
    defaultValues: {
      title: "",
      startsAt: toDateTimeLocalValue(),
      endsAt: "",
      location: defaultLocation,
      notes: "",
      eventType: "other",
    },
  });

  const monthEvents = useMemo(() => {
    return events.map((e) => ({
      ...e,
      startsAt: new Date(e.startsAt),
      endsAt: e.endsAt ? new Date(e.endsAt) : null,
    }));
  }, [events]);

  function navigate(delta: number) {
    const next = new Date(anchor);
    if (view === "month") next.setMonth(next.getMonth() + delta);
    else next.setDate(next.getDate() + delta * 7);
    setAnchor(next);
    router.push(
      `/team/${teamId}/calendar?year=${next.getFullYear()}&month=${next.getMonth()}`,
    );
  }

  function handleCreate(values: CalendarEventFormValues) {
    startTransition(async () => {
      await createCalendarEventAction(teamId, {
        title: values.title,
        startsAt: values.startsAt,
        endsAt: values.endsAt || undefined,
        location: values.location || undefined,
        description: values.notes || undefined,
        eventType: values.eventType,
      });
      router.refresh();
      reset({
        title: "",
        startsAt: toDateTimeLocalValue(),
        endsAt: "",
        location: defaultLocation,
        notes: "",
        eventType: "other",
      });
    });
  }

  const first = startOfMonth(anchor);
  const totalDays = daysInMonth(anchor);
  const startWeekday = first.getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() - anchor.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Prev
          </Button>
          <h2 className="min-w-48 text-center text-lg font-semibold">
            {anchor.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <Button variant="outline" onClick={() => navigate(1)}>
            Next
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            onClick={() => setView("month")}
          >
            Month
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            onClick={() => setView("week")}
          >
            Week
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="bg-muted px-2 py-1 text-center text-xs font-medium"
            >
              {d}
            </div>
          ))}
          {cells.map((day, idx) => {
            const dayEvents =
              day == null
                ? []
                : monthEvents.filter((e) =>
                    eventFallsOnLocalDay(
                      e,
                      anchor.getFullYear(),
                      anchor.getMonth(),
                      day,
                    ),
                  );
            return (
              <div
                key={`${idx}-${day}`}
                className="min-h-24 bg-background p-1 text-xs"
              >
                {day != null && (
                  <div className="mb-1 font-medium text-muted-foreground">
                    {day}
                  </div>
                )}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <EventChip key={event.id} teamId={teamId} event={event} />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {weekDays.map((day) => {
            const dayEvents = monthEvents.filter((e) =>
              eventFallsOnDate(e, day),
            );
            return (
              <Card key={day.toISOString()}>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">
                    {day.toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-3 pt-0">
                  {dayEvents.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No events</p>
                  ) : (
                    dayEvents.map((event) => (
                      <EventChip key={event.id} teamId={teamId} event={event} />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add event</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(handleCreate)}
            className="flex flex-col gap-4"
          >
            <FieldGroup className="sm:grid sm:grid-cols-2 lg:grid-cols-5">
              <Field data-invalid={!!errors.title}>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  id="title"
                  aria-invalid={!!errors.title}
                  {...register("title")}
                />
                <FieldError errors={[errors.title]} />
              </Field>
              <Field data-invalid={!!errors.startsAt}>
                <FieldLabel htmlFor="startsAt">Starts</FieldLabel>
                <Controller
                  name="startsAt"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DateTimePickerField
                      id="startsAt"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                  )}
                />
                <FieldError errors={[errors.startsAt]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="endsAt">Ends</FieldLabel>
                <Controller
                  name="endsAt"
                  control={control}
                  render={({ field }) => (
                    <DateTimePickerField
                      id="endsAt"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Optional"
                      allowClear
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <Input
                  id="location"
                  maxLength={200}
                  {...register("location")}
                />
              </Field>
              <Field data-invalid={!!errors.eventType}>
                <FieldLabel htmlFor="eventType">Type</FieldLabel>
                <Controller
                  name="eventType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      items={eventTypes}
                      value={field.value}
                      onValueChange={(value) => {
                        if (value != null) field.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id="eventType"
                        className="w-full"
                        aria-invalid={!!errors.eventType}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {eventTypes.map((eventType) => (
                            <SelectItem
                              key={eventType.value}
                              value={eventType.value}
                            >
                              {eventType.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.eventType]} />
              </Field>
            </FieldGroup>
            <Field data-invalid={!!errors.notes}>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea
                id="notes"
                rows={2}
                maxLength={2000}
                placeholder="Optional"
                aria-invalid={!!errors.notes}
                {...register("notes")}
              />
              <FieldError errors={[errors.notes]} />
            </Field>
            <Button type="submit" className="w-fit" disabled={pending}>
              {pending ? "Saving…" : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <RecurringScheduleForm
        teamId={teamId}
        defaultLocation={defaultLocation}
      />
    </div>
  );
}

function EventChip({ teamId, event }: { teamId: string; event: CalEvent }) {
  const [editOpen, setEditOpen] = useState(false);
  const when = formatEventWhen(event);
  const location = event.location?.trim() || null;
  const notes = event.description?.trim() || null;
  const href = event.meetId
    ? `/team/${teamId}/meets/${event.meetId}`
    : event.practiceSessionId
      ? `/team/${teamId}/attendance/${event.practiceSessionId}`
      : null;
  const isCustom = event.source === "custom";

  const details = (
    <div className="min-w-0 flex-1">
      {when ? (
        <div className="truncate text-[10px] font-medium text-primary/80">
          {when}
        </div>
      ) : null}
      <div className="truncate font-medium leading-tight">{event.title}</div>
      {location ? (
        <div className="truncate text-[10px] text-muted-foreground">
          {location}
        </div>
      ) : null}
      {notes ? (
        <div className="truncate text-[10px] text-muted-foreground">
          {notes}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="flex items-start gap-1 rounded bg-primary/10 px-1.5 py-1 text-left">
        {href ? (
          <Link href={href} className="min-w-0 flex-1 hover:underline">
            {details}
          </Link>
        ) : isCustom ? (
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => setEditOpen(true)}
          >
            {details}
          </button>
        ) : (
          details
        )}
        {isCustom ? (
          <button
            type="button"
            className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => setEditOpen(true)}
          >
            Edit
          </button>
        ) : null}
      </div>
      {isCustom ? (
        <EditCalendarEventDialog
          teamId={teamId}
          event={event}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
    </>
  );
}

function EditCalendarEventDialog({
  teamId,
  event,
  open,
  onOpenChange,
}: {
  teamId: string;
  event: CalEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CalendarEventFormValues>({
    resolver: zodResolver(calendarEventFormSchema),
    defaultValues: {
      title: event.title,
      startsAt: toDateTimeLocalValue(asDate(event.startsAt)),
      endsAt: event.endsAt ? toDateTimeLocalValue(asDate(event.endsAt)) : "",
      location: event.location ?? "",
      notes: event.description ?? "",
      eventType: eventTypeValue(event.eventType),
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: event.title,
      startsAt: toDateTimeLocalValue(asDate(event.startsAt)),
      endsAt: event.endsAt ? toDateTimeLocalValue(asDate(event.endsAt)) : "",
      location: event.location ?? "",
      notes: event.description ?? "",
      eventType: eventTypeValue(event.eventType),
    });
  }, [open, event, reset]);

  function onSave(values: CalendarEventFormValues) {
    startTransition(async () => {
      await updateCalendarEventAction(teamId, event.id, {
        title: values.title,
        startsAt: values.startsAt,
        endsAt: values.endsAt || null,
        location: values.location.trim() || null,
        description: values.notes.trim() || null,
        eventType: values.eventType,
      });
      onOpenChange(false);
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      await deleteCalendarEventAction(teamId, event.id);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor={`edit-title-${event.id}`}>Title</FieldLabel>
              <Input
                id={`edit-title-${event.id}`}
                aria-invalid={!!errors.title}
                {...register("title")}
              />
              <FieldError errors={[errors.title]} />
            </Field>
            <Field data-invalid={!!errors.startsAt}>
              <FieldLabel htmlFor={`edit-startsAt-${event.id}`}>
                Starts
              </FieldLabel>
              <Controller
                name="startsAt"
                control={control}
                render={({ field, fieldState }) => (
                  <DateTimePickerField
                    id={`edit-startsAt-${event.id}`}
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                )}
              />
              <FieldError errors={[errors.startsAt]} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-endsAt-${event.id}`}>Ends</FieldLabel>
              <Controller
                name="endsAt"
                control={control}
                render={({ field }) => (
                  <DateTimePickerField
                    id={`edit-endsAt-${event.id}`}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Optional"
                    allowClear
                  />
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-location-${event.id}`}>
                Location
              </FieldLabel>
              <Input
                id={`edit-location-${event.id}`}
                maxLength={200}
                {...register("location")}
              />
            </Field>
            <Field data-invalid={!!errors.notes}>
              <FieldLabel htmlFor={`edit-notes-${event.id}`}>Notes</FieldLabel>
              <Textarea
                id={`edit-notes-${event.id}`}
                rows={3}
                maxLength={2000}
                placeholder="Optional"
                aria-invalid={!!errors.notes}
                {...register("notes")}
              />
              <FieldError errors={[errors.notes]} />
            </Field>
            <Field data-invalid={!!errors.eventType}>
              <FieldLabel htmlFor={`edit-eventType-${event.id}`}>
                Type
              </FieldLabel>
              <Controller
                name="eventType"
                control={control}
                render={({ field }) => (
                  <Select
                    items={eventTypes}
                    value={field.value}
                    onValueChange={(value) => {
                      if (value != null) field.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id={`edit-eventType-${event.id}`}
                      className="w-full"
                      aria-invalid={!!errors.eventType}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {eventTypes.map((eventType) => (
                          <SelectItem
                            key={eventType.value}
                            value={eventType.value}
                          >
                            {eventType.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.eventType]} />
            </Field>
          </FieldGroup>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={onDelete}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
