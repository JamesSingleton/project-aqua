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
  })
  .refine(({ startDate, endDate }) => endDate === "" || endDate >= startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

type MeetInfoValues = z.infer<typeof meetInfoSchema>;

function optionalNumberDefault(value: number | null | undefined) {
  return value != null ? String(value) : "";
}

export function MeetInfoForm({
  teamId,
  meetId,
  meet,
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
  };
}) {
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
          Name, dates, and venue. Event lists still come from imported meet
          files.
          {meet.importSource ? (
            <>
              {" "}
              Imported from{" "}
              <span className="font-medium">{meet.importSource}</span>.
            </>
          ) : null}
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
                    value={field.value}
                    onValueChange={(value) => {
                      if (value != null) field.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id="meet-course"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
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
                Leave blank for no limit. Overrides apply when packages are not
                set from the meet file.
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
                    {...register("maxCombinedEntries")}
                  />
                  <FieldError errors={[errors.maxCombinedEntries]} />
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
