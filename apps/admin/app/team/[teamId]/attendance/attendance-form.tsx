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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSessionAction } from "./actions";

const attendanceFormSchema = z.object({
  date: z.string().min(1, "Date and time are required"),
  location: z.string(),
  notes: z.string(),
});

type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

export function AttendanceForm({
  teamId,
  rosterCount,
}: {
  teamId: string;
  rosterCount: number;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      date: "",
      location: "",
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
        <CardTitle>New practice session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="sm:flex-row sm:items-start">
            <Field data-invalid={!!errors.date}>
              <FieldLabel htmlFor="date">Date & time</FieldLabel>
              <Input
                id="date"
                type="datetime-local"
                aria-invalid={!!errors.date}
                {...register("date")}
              />
              <FieldError errors={[errors.date]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                placeholder="Pool name"
                {...register("location")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Input id="notes" placeholder="Optional" {...register("notes")} />
            </Field>
          </FieldGroup>
          <Button
            type="submit"
            className="w-fit"
            disabled={isSubmitting || rosterCount === 0}
          >
            {isSubmitting ? "Creating..." : "Create session"}
          </Button>
        </form>
        {rosterCount === 0 && (
          <p className="text-muted-foreground mt-2 text-sm">
            Add swimmers to your roster before creating sessions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
