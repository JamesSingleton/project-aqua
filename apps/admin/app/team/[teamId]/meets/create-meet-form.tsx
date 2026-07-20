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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { createMeetAction } from "./actions";

const courseSchema = z.enum(["SCY", "SCM", "LCM"]);

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

const createMeetSchema = z
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
    course: courseSchema,
    location: z.string(),
    address: z.string(),
  })
  .refine(({ startDate, endDate }) => endDate === "" || endDate >= startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

type CreateMeetValues = z.infer<typeof createMeetSchema>;

export function CreateMeetForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMeetValues>({
    resolver: zodResolver(createMeetSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      course: "SCY",
      location: "",
      address: "",
    },
  });

  async function onSubmit(values: CreateMeetValues) {
    setError("");
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        formData.set(key, value);
      }
      const id = await createMeetAction(teamId, formData);
      router.push(`/team/${teamId}/meets/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meet");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create meet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="flex-row flex-wrap items-end gap-4">
            <Field data-invalid={!!errors.name} className="min-w-48 flex-1">
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                placeholder="Invite meet"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.startDate} className="w-auto">
              <FieldLabel htmlFor="startDate">Start date</FieldLabel>
              <Input
                id="startDate"
                type="date"
                aria-invalid={!!errors.startDate}
                {...register("startDate")}
              />
              <FieldError errors={[errors.startDate]} />
            </Field>
            <Field data-invalid={!!errors.endDate} className="w-auto">
              <FieldLabel htmlFor="endDate">End date</FieldLabel>
              <Input
                id="endDate"
                type="date"
                aria-invalid={!!errors.endDate}
                {...register("endDate")}
              />
              <FieldError errors={[errors.endDate]} />
            </Field>
            <Controller
              name="course"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="w-28">
                  <FieldLabel htmlFor="course">Course</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value != null) field.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id="course"
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
            <Field data-invalid={!!errors.location} className="min-w-40 flex-1">
              <FieldLabel htmlFor="location">Venue</FieldLabel>
              <Input
                id="location"
                placeholder="Aquatic center"
                aria-invalid={!!errors.location}
                {...register("location")}
              />
              <FieldError errors={[errors.location]} />
            </Field>
            <Field data-invalid={!!errors.address} className="min-w-64 flex-1">
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                id="address"
                placeholder="Street, city, state, postal code"
                aria-invalid={!!errors.address}
                {...register("address")}
              />
              <FieldError errors={[errors.address]} />
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create"}
            </Button>
          </FieldGroup>
        </form>
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
