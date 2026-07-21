"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@project-aqua/ui/components/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { Textarea } from "@project-aqua/ui/components/textarea";
import { cn } from "@project-aqua/ui/lib/utils";
import { Clock2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { DatePickerField } from "@/components/date-picker-field";
import { createRecurringCalendarEventsAction } from "./actions";

const WEEKDAYS = [
  { value: 0, label: "Sun", short: "S" },
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
] as const;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const slotSchema = z.object({
  weekdays: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Pick at least one day"),
  startTime: z.string().regex(TIME_RE, "Use HH:mm"),
  endTime: z.string().regex(TIME_RE, "Use HH:mm"),
});

const recurringScheduleSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    location: z.string().max(200),
    notes: z.string().max(2000),
    eventType: z.enum(["practice", "meet", "other"]),
    rangeStart: z.string().min(1, "Start date is required"),
    rangeEnd: z.string().min(1, "End date is required"),
    slots: z.array(slotSchema).min(1, "Add at least one weekly slot"),
  })
  .refine((value) => value.rangeEnd >= value.rangeStart, {
    message: "End date must be on or after the start date",
    path: ["rangeEnd"],
  });

type RecurringScheduleValues = z.infer<typeof recurringScheduleSchema>;

const eventTypes = [
  { label: "Practice", value: "practice" },
  { label: "Meet", value: "meet" },
  { label: "Other", value: "other" },
] as const;

function countExpandedOccurrences(
  values: RecurringScheduleValues,
): number | null {
  if (
    !values.rangeStart ||
    !values.rangeEnd ||
    values.rangeEnd < values.rangeStart
  ) {
    return null;
  }
  const [sy, sm, sd] = values.rangeStart.split("-").map(Number);
  const [ey, em, ed] = values.rangeEnd.split("-").map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return null;

  const cursor = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  let count = 0;
  while (cursor <= end) {
    const weekday = cursor.getDay();
    for (const slot of values.slots) {
      if (slot.weekdays.includes(weekday)) count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function WeekdayPicker({
  value,
  onChange,
  invalid,
}: {
  value: number[];
  onChange: (next: number[]) => void;
  invalid?: boolean;
}) {
  return (
    <div
      className="flex flex-wrap gap-1"
      role="group"
      aria-invalid={invalid || undefined}
    >
      {WEEKDAYS.map((day) => {
        const selected = value.includes(day.value);
        return (
          <Button
            key={day.value}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            aria-pressed={selected}
            aria-label={day.label}
            onClick={() => {
              onChange(
                selected
                  ? value.filter((d) => d !== day.value)
                  : [...value, day.value].sort((a, b) => a - b),
              );
            }}
          >
            {day.label}
          </Button>
        );
      })}
    </div>
  );
}

function TimeField({
  id,
  label,
  value,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type="time"
          step={60}
          value={value}
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.value.slice(0, 5))}
          className="[&::-webkit-calendar-picker-indicator]:hidden"
        />
        <InputGroupAddon align="inline-end">
          <Clock2Icon className="text-muted-foreground" />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

export function RecurringScheduleForm({
  teamId,
  defaultLocation = "",
}: {
  teamId: string;
  defaultLocation?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecurringScheduleValues>({
    resolver: zodResolver(recurringScheduleSchema),
    defaultValues: {
      title: "Practice",
      location: defaultLocation,
      notes: "",
      eventType: "practice",
      rangeStart: "",
      rangeEnd: "",
      slots: [
        { weekdays: [1, 3, 5], startTime: "05:00", endTime: "06:30" },
        { weekdays: [2, 4], startTime: "15:45", endTime: "18:00" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "slots",
  });

  const watched = watch();
  const previewCount = useMemo(
    () => countExpandedOccurrences(watched),
    [watched],
  );

  function onSubmit(values: RecurringScheduleValues) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        const result = await createRecurringCalendarEventsAction(teamId, {
          title: values.title,
          location: values.location || undefined,
          description: values.notes || undefined,
          eventType: values.eventType,
          rangeStart: values.rangeStart,
          rangeEnd: values.rangeEnd,
          slots: values.slots,
        });
        setSuccess(`Created ${result.count} events.`);
        reset({
          ...values,
          // Keep the schedule pattern; clear only the success-adjacent noise.
        });
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create schedule",
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add practice schedule</CardTitle>
        <CardDescription>
          Create repeating practices for selected weekdays between two dates.
          Each day becomes its own calendar event.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="sm:grid sm:grid-cols-2 lg:grid-cols-4">
            <Field data-invalid={!!errors.title} className="lg:col-span-2">
              <FieldLabel htmlFor="schedule-title">Title</FieldLabel>
              <Input
                id="schedule-title"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
              <FieldError errors={[errors.title]} />
            </Field>
            <Field data-invalid={!!errors.eventType}>
              <FieldLabel htmlFor="schedule-type">Type</FieldLabel>
              <Controller
                name="eventType"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    items={eventTypes}
                    value={field.value}
                    onValueChange={(value) => {
                      if (value != null) field.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id="schedule-type"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.eventType]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="schedule-location">Location</FieldLabel>
              <Input
                id="schedule-location"
                placeholder="Pool"
                maxLength={200}
                {...register("location")}
              />
            </Field>
            <Field data-invalid={!!errors.notes} className="lg:col-span-2">
              <FieldLabel htmlFor="schedule-notes">Notes</FieldLabel>
              <Textarea
                id="schedule-notes"
                rows={2}
                maxLength={2000}
                placeholder="Optional — applied to each occurrence"
                aria-invalid={!!errors.notes}
                {...register("notes")}
              />
              <FieldError errors={[errors.notes]} />
            </Field>
            <Field data-invalid={!!errors.rangeStart}>
              <FieldLabel htmlFor="schedule-start">Starts on</FieldLabel>
              <Controller
                name="rangeStart"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePickerField
                    id="schedule-start"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                )}
              />
              <FieldError errors={[errors.rangeStart]} />
            </Field>
            <Field data-invalid={!!errors.rangeEnd}>
              <FieldLabel htmlFor="schedule-end">Ends on</FieldLabel>
              <Controller
                name="rangeEnd"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePickerField
                    id="schedule-end"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                )}
              />
              <FieldError errors={[errors.rangeEnd]} />
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Weekly time slots</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    weekdays: [1, 3, 5],
                    startTime: "05:00",
                    endTime: "06:30",
                  })
                }
              >
                <PlusIcon data-icon="inline-start" />
                Add slot
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-3",
                  "sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-end",
                )}
              >
                <Field data-invalid={!!errors.slots?.[index]?.weekdays}>
                  <FieldLabel>Days</FieldLabel>
                  <Controller
                    name={`slots.${index}.weekdays`}
                    control={control}
                    render={({ field: weekdayField, fieldState }) => (
                      <WeekdayPicker
                        value={weekdayField.value}
                        onChange={weekdayField.onChange}
                        invalid={fieldState.invalid}
                      />
                    )}
                  />
                  <FieldError errors={[errors.slots?.[index]?.weekdays]} />
                </Field>
                <Controller
                  name={`slots.${index}.startTime`}
                  control={control}
                  render={({ field: timeField, fieldState }) => (
                    <TimeField
                      id={`slot-${index}-start`}
                      label="Starts"
                      value={timeField.value}
                      onChange={timeField.onChange}
                      invalid={fieldState.invalid}
                    />
                  )}
                />
                <Controller
                  name={`slots.${index}.endTime`}
                  control={control}
                  render={({ field: timeField, fieldState }) => (
                    <TimeField
                      id={`slot-${index}-end`}
                      label="Ends"
                      value={timeField.value}
                      onChange={timeField.onChange}
                      invalid={fieldState.invalid}
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="justify-self-end"
                  disabled={fields.length <= 1}
                  aria-label={`Remove slot ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            <FieldError errors={[errors.slots]} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Creating…"
                : previewCount != null
                  ? `Create ${previewCount} events`
                  : "Create schedule"}
            </Button>
            {previewCount != null ? (
              <FieldDescription>
                {previewCount} practice
                {previewCount === 1 ? "" : "s"} will be added to the team
                calendar.
              </FieldDescription>
            ) : null}
            {success ? (
              <p className="text-sm text-green-700 dark:text-green-400">
                {success}
              </p>
            ) : null}
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
