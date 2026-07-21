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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { DatePickerField } from "@/components/date-picker-field";
import { createMeetAction } from "../actions";

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

const createMeetFormSchema = z
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
  })
  .refine(({ startDate, endDate }) => endDate === "" || endDate >= startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

type CreateMeetFormValues = z.infer<typeof createMeetFormSchema>;

export function CreateMeetForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMeetFormValues>({
    resolver: zodResolver(createMeetFormSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      entryDeadline: "",
      course: "SCY",
      location: "",
      address: "",
    },
  });

  async function onSubmit(values: CreateMeetFormValues) {
    setError("");
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.set(key, value);
    }
    try {
      const meetId = await createMeetAction(teamId, formData);
      router.push(`/team/${teamId}/meets/${meetId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meet");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meet details</CardTitle>
        <CardDescription>
          Create a meet shell for entries and RSVPs. Import an event file later
          to load the event list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.name} className="sm:col-span-2">
              <FieldLabel htmlFor="meet-name">Name</FieldLabel>
              <Input
                id="meet-name"
                placeholder="Winter Invitational"
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

            <Field orientation="horizontal" className="flex-wrap sm:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create meet"}
              </Button>
              <Button
                type="button"
                variant="outline"
                nativeButton={false}
                render={<Link href={`/team/${teamId}/meets`} />}
              >
                Cancel
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
