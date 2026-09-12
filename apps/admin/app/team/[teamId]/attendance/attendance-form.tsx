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
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  DateTimePickerField,
  toDateTimeLocalValue,
} from "@/components/date-time-picker-field";
import { createSessionAction } from "./actions";

const attendanceFormSchema = z.object({
  date: z.string().min(1, "Date and time are required"),
  location: z.string().max(200),
  notes: z.string().max(2000),
});

type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

export function AttendanceForm({
  teamId,
  defaultLocation = "",
}: {
  teamId: string;
  defaultLocation?: string;
}) {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      date: toDateTimeLocalValue(),
      location: defaultLocation,
      notes: "",
    },
  });

  async function onSubmit(values: AttendanceFormValues) {
    const id = await createSessionAction(teamId, {
      date: values.date,
      location: values.location || undefined,
      notes: values.notes || undefined,
    });
    router.push(`/team/${teamId}/attendance/${id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Take roll for a practice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="sm:flex-row sm:items-start">
            <Field data-invalid={!!errors.date}>
              <FieldLabel htmlFor="date">Date & time</FieldLabel>
              <Controller
                name="date"
                control={control}
                render={({ field, fieldState }) => (
                  <DateTimePickerField
                    id="date"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                )}
              />
              <FieldError errors={[errors.date]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                placeholder="Pool name"
                maxLength={200}
                {...register("location")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Input
                id="notes"
                placeholder="Optional…"
                maxLength={2000}
                {...register("notes")}
              />
            </Field>
          </FieldGroup>
          <Button type="submit" className="w-fit" disabled={isSubmitting}>
            {isSubmitting ? "Opening…" : "Open roll"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
