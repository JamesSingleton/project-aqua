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
import { addResultAction } from "../actions";

type EventOption = { id: string; label: string };
type SwimmerOption = { swimmerId: string; name: string };

const addResultSchema = z.object({
  swimmerId: z.string().min(1, "Select a swimmer"),
  meetEventId: z.string().min(1, "Select an event"),
  time: z.string().trim().min(1, "Time is required"),
});

type AddResultValues = z.infer<typeof addResultSchema>;

export function AddResultForm({
  teamId,
  meetId,
  events,
  swimmers,
}: {
  teamId: string;
  meetId: string;
  events: EventOption[];
  swimmers: SwimmerOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<AddResultValues>({
    resolver: zodResolver(addResultSchema),
    defaultValues: {
      meetEventId: events[0]?.id ?? "",
      swimmerId: swimmers[0]?.swimmerId ?? "",
      time: "",
    },
  });

  if (events.length === 0 || swimmers.length === 0) {
    return null;
  }

  async function onSubmit(values: AddResultValues) {
    setError(null);
    try {
      await addResultAction(
        teamId,
        meetId,
        values.meetEventId,
        values.swimmerId,
        values.time,
      );
      resetField("time");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add time</CardTitle>
        <CardDescription>
          Manual result when you do not have a meet file. Updates best times.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="sm:flex-row sm:flex-wrap sm:items-end">
            <Controller
              name="swimmerId"
              control={control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="min-w-40 flex-1"
                >
                  <FieldLabel htmlFor="result-swimmer">Swimmer</FieldLabel>
                  <Select
                    items={swimmers.map((swimmer) => ({
                      value: swimmer.swimmerId,
                      label: swimmer.name,
                    }))}
                    value={field.value}
                    onValueChange={(value) => {
                      if (value != null) field.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id="result-swimmer"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select swimmer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {swimmers.map((swimmer) => (
                          <SelectItem
                            key={swimmer.swimmerId}
                            value={swimmer.swimmerId}
                          >
                            {swimmer.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="meetEventId"
              control={control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="min-w-40 flex-1"
                >
                  <FieldLabel htmlFor="result-event">Event</FieldLabel>
                  <Select
                    items={events.map((event) => ({
                      value: event.id,
                      label: event.label,
                    }))}
                    value={field.value}
                    onValueChange={(value) => {
                      if (value != null) field.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id="result-event"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Field data-invalid={!!errors.time} className="w-32">
              <FieldLabel htmlFor="result-time">Time</FieldLabel>
              <Input
                id="result-time"
                className="font-timing"
                placeholder="1:02.45"
                aria-invalid={!!errors.time}
                {...register("time")}
              />
              <FieldError errors={[errors.time]} />
            </Field>
            <Field className="w-auto">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save time"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
        {error ? (
          <p className="text-destructive mt-2 text-sm">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
