"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateOnly } from "@project-aqua/swim-core/calendar-date";
import { Badge } from "@project-aqua/ui/components/badge";
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
  FieldLegend,
  FieldSet,
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { DatePickerField } from "@/components/date-picker-field";
import { updateMeetAction } from "../actions";

const optionalLimitSchema = z.string().refine(
  (value) => {
    if (value === "") return true;
    const number = Number(value);
    return Number.isInteger(number) && number >= 0;
  },
  { message: "Enter a nonnegative whole number" },
);

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === (month ?? 1) - 1 &&
    date.getUTCDate() === day
  );
}

const meetInfoSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    startDate: z
      .string()
      .min(1, "Start date is required")
      .refine(isValidDateInput, {
        message: "Enter a valid start date",
      }),
    endDate: z
      .string()
      .refine((value) => value === "" || isValidDateInput(value), {
        message: "Enter a valid end date",
      }),
    entryDeadline: z
      .string()
      .refine((value) => value === "" || isValidDateInput(value), {
        message: "Enter a valid entry deadline",
      }),
    course: z.enum(["SCY", "SCM", "LCM"]),
    location: z.string(),
    address: z.string(),
    maxIndividualEntries: optionalLimitSchema,
    maxRelayEntries: optionalLimitSchema,
    maxCombinedEntries: optionalLimitSchema,
    maxScoringEntriesPerIndividualEvent: optionalLimitSchema,
    maxRelayTeamsPerEvent: optionalLimitSchema,
    opponents: z.string().max(500),
  })
  .refine(({ startDate, endDate }) => endDate === "" || endDate >= startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

type MeetInfoValues = z.infer<typeof meetInfoSchema>;

const COURSE_ITEMS = [
  { value: "SCY", label: "SCY" },
  { value: "SCM", label: "SCM" },
  { value: "LCM", label: "LCM" },
] as const;

function optionalNumberDefault(value: number | null | undefined) {
  return value != null ? String(value) : "";
}

export function MeetInfoForm({
  teamId,
  meetId,
  meet,
  teamCaps,
}: {
  teamId: string;
  meetId: string;
  meet: {
    name: string;
    startDate: Date;
    endDate: Date | null;
    entryDeadline: Date | null;
    course: string;
    location: string | null;
    address: string | null;
    importSource: string | null;
    maxIndividualEntries: number | null;
    maxRelayEntries: number | null;
    maxCombinedEntries: number | null;
    entryLimitPackages: Array<{ individual: number; relay: number }> | null;
    entryLimitsSource: string | null;
    maxScoringEntriesPerIndividualEvent: number | null;
    maxRelayTeamsPerEvent: number | null;
    opponents: string | null;
  };
  teamCaps?: {
    maxScoringEntriesPerIndividualEvent: number | null;
    maxRelayTeamsPerEvent: number | null;
  };
}) {
  const fileBacked = Boolean(meet.importSource?.trim());
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MeetInfoValues>({
    resolver: zodResolver(meetInfoSchema),
    defaultValues: {
      name: meet.name,
      startDate: formatDateOnly(meet.startDate),
      endDate: meet.endDate ? formatDateOnly(meet.endDate) : "",
      entryDeadline: meet.entryDeadline
        ? formatDateOnly(meet.entryDeadline)
        : "",
      course: meet.course as MeetInfoValues["course"],
      location: meet.location ?? "",
      address: meet.address ?? "",
      maxIndividualEntries: optionalNumberDefault(meet.maxIndividualEntries),
      maxRelayEntries: optionalNumberDefault(meet.maxRelayEntries),
      maxCombinedEntries: optionalNumberDefault(meet.maxCombinedEntries),
      maxScoringEntriesPerIndividualEvent: optionalNumberDefault(
        meet.maxScoringEntriesPerIndividualEvent,
      ),
      maxRelayTeamsPerEvent: optionalNumberDefault(meet.maxRelayTeamsPerEvent),
      opponents: meet.opponents ?? "",
    },
  });

  async function onSubmit(values: MeetInfoValues) {
    setError("");
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.set(key, value);
    }
    try {
      await updateMeetAction(teamId, meetId, formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meet");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meet details</CardTitle>
        <CardDescription>
          Name, dates, and venue
          {meet.importSource ? (
            <>
              . Course and per-athlete entry limits come from{" "}
              <span className="font-medium">{meet.importSource}</span>.
            </>
          ) : (
            <>
              . Event lists can be built by hand or imported from a meet file.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.name} className="sm:col-span-2">
              <FieldLabel htmlFor="meet-name">Name</FieldLabel>
              <Input
                id="meet-name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Controller
              name="startDate"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="meet-start">Start date</FieldLabel>
                  <DatePickerField
                    id="meet-start"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="meet-end">End date</FieldLabel>
                  <DatePickerField
                    id="meet-end"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Same as start (optional)"
                    allowClear
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Leave blank for a single-day meet.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="entryDeadline"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="meet-entry-deadline">
                    Entry deadline
                  </FieldLabel>
                  <DatePickerField
                    id="meet-entry-deadline"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Optional"
                    allowClear
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    When entries are due to the meet host.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="course"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="meet-course">Course</FieldLabel>
                  <Select
                    items={[...COURSE_ITEMS]}
                    value={field.value}
                    disabled={fileBacked}
                    onValueChange={(value) => {
                      if (value != null) field.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id="meet-course"
                      className="w-full"
                      disabled={fileBacked}
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {COURSE_ITEMS.map((course) => (
                          <SelectItem key={course.value} value={course.value}>
                            {course.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fileBacked ? (
                    <FieldDescription>
                      Course comes from the meet file.
                    </FieldDescription>
                  ) : null}
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Field data-invalid={!!errors.location}>
              <FieldLabel htmlFor="meet-location">Venue</FieldLabel>
              <Input
                id="meet-location"
                placeholder="Aquatic center"
                aria-invalid={!!errors.location}
                {...register("location")}
              />
              <FieldError errors={[errors.location]} />
            </Field>
            <Field data-invalid={!!errors.address} className="sm:col-span-2">
              <FieldLabel htmlFor="meet-address">Address</FieldLabel>
              <Input
                id="meet-address"
                placeholder="Street, city, state, postal code"
                aria-invalid={!!errors.address}
                {...register("address")}
              />
              <FieldError errors={[errors.address]} />
            </Field>
            <Field data-invalid={!!errors.opponents} className="sm:col-span-2">
              <FieldLabel htmlFor="meet-opponents">Opponents</FieldLabel>
              <Input
                id="meet-opponents"
                placeholder="Optional — other teams at this meet"
                maxLength={500}
                aria-invalid={!!errors.opponents}
                {...register("opponents")}
              />
              <FieldDescription>
                Coach-owned. Does not go in the host entry file.
              </FieldDescription>
              <FieldError errors={[errors.opponents]} />
            </Field>

            <FieldSet className="sm:col-span-2">
              <FieldLegend
                variant="label"
                className="flex flex-wrap items-center gap-2"
              >
                Entry limits
                {meet.entryLimitsSource === "import" ? (
                  <Badge variant="secondary">From import</Badge>
                ) : null}
              </FieldLegend>
              <FieldDescription>
                {fileBacked
                  ? "Max individual, relay, and combined limits come from the meet file."
                  : "Leave blank for no limit. Overrides apply when packages are not set from the meet file."}
              </FieldDescription>
              {meet.entryLimitPackages && meet.entryLimitPackages.length > 0 ? (
                <p className="text-sm">
                  Allowed packages:{" "}
                  {meet.entryLimitPackages
                    .map((p) => `${p.individual}I + ${p.relay}R`)
                    .join(" or ")}
                </p>
              ) : null}
              <FieldGroup className="grid gap-4 sm:grid-cols-3">
                <Field data-invalid={!!errors.maxIndividualEntries}>
                  <FieldLabel htmlFor="max-individual">
                    Max individual
                  </FieldLabel>
                  <Input
                    id="max-individual"
                    type="number"
                    min={0}
                    placeholder="None"
                    aria-invalid={!!errors.maxIndividualEntries}
                    disabled={fileBacked}
                    {...register("maxIndividualEntries")}
                  />
                  <FieldError errors={[errors.maxIndividualEntries]} />
                </Field>
                <Field data-invalid={!!errors.maxRelayEntries}>
                  <FieldLabel htmlFor="max-relay">Max relay</FieldLabel>
                  <Input
                    id="max-relay"
                    type="number"
                    min={0}
                    placeholder="None"
                    aria-invalid={!!errors.maxRelayEntries}
                    disabled={fileBacked}
                    {...register("maxRelayEntries")}
                  />
                  <FieldError errors={[errors.maxRelayEntries]} />
                </Field>
                <Field data-invalid={!!errors.maxCombinedEntries}>
                  <FieldLabel htmlFor="max-combined">Max combined</FieldLabel>
                  <Input
                    id="max-combined"
                    type="number"
                    min={0}
                    placeholder="None"
                    aria-invalid={!!errors.maxCombinedEntries}
                    disabled={fileBacked}
                    {...register("maxCombinedEntries")}
                  />
                  <FieldError errors={[errors.maxCombinedEntries]} />
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSet className="sm:col-span-2">
              <FieldLegend variant="label">Association caps</FieldLegend>
              <FieldDescription>
                Optional override for this meet. Leave blank to inherit the team
                default
                {teamCaps
                  ? ` (${teamCaps.maxScoringEntriesPerIndividualEvent ?? "unlimited"} scoring / ${teamCaps.maxRelayTeamsPerEvent ?? "unlimited"} relay teams)`
                  : ""}
                . Counts scoring names only; exhibition can still be added.
              </FieldDescription>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field
                  data-invalid={!!errors.maxScoringEntriesPerIndividualEvent}
                >
                  <FieldLabel htmlFor="max-scoring-event">
                    Scoring names per individual event
                  </FieldLabel>
                  <Input
                    id="max-scoring-event"
                    type="number"
                    min={1}
                    placeholder="Inherit team"
                    aria-invalid={!!errors.maxScoringEntriesPerIndividualEvent}
                    {...register("maxScoringEntriesPerIndividualEvent")}
                  />
                  <FieldError
                    errors={[errors.maxScoringEntriesPerIndividualEvent]}
                  />
                </Field>
                <Field data-invalid={!!errors.maxRelayTeamsPerEvent}>
                  <FieldLabel htmlFor="max-relay-teams">
                    Relay teams per event
                  </FieldLabel>
                  <Input
                    id="max-relay-teams"
                    type="number"
                    min={1}
                    placeholder="Inherit team"
                    aria-invalid={!!errors.maxRelayTeamsPerEvent}
                    {...register("maxRelayTeamsPerEvent")}
                  />
                  <FieldError errors={[errors.maxRelayTeamsPerEvent]} />
                </Field>
              </FieldGroup>
            </FieldSet>

            <Field orientation="horizontal" className="flex-wrap sm:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
