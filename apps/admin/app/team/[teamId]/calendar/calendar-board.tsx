"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  createCalendarEventAction,
  deleteCalendarEventAction,
} from "./actions";

const eventTypes = [
  { label: "Other", value: "other" },
  { label: "Practice", value: "practice" },
  { label: "Meet", value: "meet" },
] as const;

const calendarEventFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  startsAt: z.string().min(1, "Start date and time are required"),
  endsAt: z.string(),
  location: z.string(),
  eventType: z.enum(["other", "practice", "meet"]),
});

type CalendarEventFormValues = z.infer<typeof calendarEventFormSchema>;

type CalEvent = {
  id: string;
  source: string;
  title: string;
  location: string | null;
  startsAt: Date | string;
  endsAt: Date | string | null;
  eventType: string;
  meetId: string | null;
  practiceSessionId: string | null;
};

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
}: {
  teamId: string;
  initialYear: number;
  initialMonth: number;
  events: CalEvent[];
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
      startsAt: "",
      endsAt: "",
      location: "",
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
        eventType: values.eventType,
      });
      router.refresh();
      reset();
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
                : monthEvents.filter((e) => {
                    const d = e.startsAt;
                    return (
                      d.getFullYear() === anchor.getFullYear() &&
                      d.getMonth() === anchor.getMonth() &&
                      d.getDate() === day
                    );
                  });
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
            const dayEvents = monthEvents.filter(
              (e) => e.startsAt.toDateString() === day.toDateString(),
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
                <Input
                  id="startsAt"
                  type="datetime-local"
                  aria-invalid={!!errors.startsAt}
                  {...register("startsAt")}
                />
                <FieldError errors={[errors.startsAt]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="endsAt">Ends</FieldLabel>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  {...register("endsAt")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <Input id="location" {...register("location")} />
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
            <Button type="submit" className="w-fit" disabled={pending}>
              {pending ? "Saving…" : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function EventChip({
  teamId,
  event,
}: {
  teamId: string;
  event: {
    id: string;
    title: string;
    eventType: string;
    source: string;
    meetId: string | null;
    practiceSessionId: string | null;
  };
}) {
  const router = useRouter();
  const href = event.meetId
    ? `/team/${teamId}/meets/${event.meetId}`
    : event.practiceSessionId
      ? `/team/${teamId}/attendance/${event.practiceSessionId}`
      : null;

  return (
    <div className="rounded bg-primary/10 px-1 py-0.5">
      {href ? (
        <Link href={href} className="block truncate hover:underline">
          {event.title}
        </Link>
      ) : (
        <div className="flex items-center justify-between gap-1">
          <span className="truncate">{event.title}</span>
          {event.source === "custom" && (
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                void deleteCalendarEventAction(teamId, event.id).then(() =>
                  router.refresh(),
                );
              }}
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
