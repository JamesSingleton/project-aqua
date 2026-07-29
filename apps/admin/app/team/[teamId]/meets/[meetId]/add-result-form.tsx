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
import { Checkbox } from "@project-aqua/ui/components/checkbox";
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

const ROUND_OPTIONS = [
  { value: "", label: "—" },
  { value: "prelim", label: "Prelim" },
  { value: "swimoff", label: "Swim-off" },
  { value: "finals", label: "Finals" },
] as const;

const addResultSchema = z.object({
  swimmerId: z.string().min(1, "Select a swimmer"),
  meetEventId: z.string().min(1, "Select an event"),
  time: z.string().trim().min(1, "Time is required"),
  round: z.enum(["", "prelim", "swimoff", "finals"]),
  heat: z.string(),
  lane: z.string(),
  exhibition: z.boolean(),
  dqCode: z.string(),
});

type AddResultValues = z.infer<typeof addResultSchema>;

function optionalInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

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
      round: "",
      heat: "",
      lane: "",
      exhibition: false,
      dqCode: "",
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
        {
          round:
            values.round === ""
              ? null
              : (values.round as "prelim" | "swimoff" | "finals"),
          heat: optionalInt(values.heat),
          lane: optionalInt(values.lane),
          exhibition: values.exhibition,
          dqCode: values.dqCode.trim() || null,
        },
      );
      resetField("time");
      resetField("heat");
      resetField("lane");
      resetField("dqCode");
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
            <Controller
              name="round"
              control={control}
              render={({ field }) => (
                <Field className="w-28">
                  <FieldLabel htmlFor="result-round">Round</FieldLabel>
                  <Select
                    items={[...ROUND_OPTIONS]}
                    value={field.value}
                    onValueChange={(value) => {
                      if (value != null) field.onChange(value);
                    }}
                  >
                    <SelectTrigger id="result-round" className="w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ROUND_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value || "none"}
                            value={opt.value}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Field className="w-20">
              <FieldLabel htmlFor="result-heat">Heat</FieldLabel>
              <Input
                id="result-heat"
                inputMode="numeric"
                placeholder="—"
                {...register("heat")}
              />
            </Field>
            <Field className="w-20">
              <FieldLabel htmlFor="result-lane">Lane</FieldLabel>
              <Input
                id="result-lane"
                inputMode="numeric"
                placeholder="—"
                {...register("lane")}
              />
            </Field>
            <Controller
              name="exhibition"
              control={control}
              render={({ field }) => (
                <Field orientation="horizontal" className="w-auto pb-1">
                  <Checkbox
                    id="result-exhibition"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  <FieldLabel
                    htmlFor="result-exhibition"
                    className="font-normal"
                  >
                    Exhibition
                  </FieldLabel>
                </Field>
              )}
            />
            <Field className="w-24">
              <FieldLabel htmlFor="result-dq">DQ code</FieldLabel>
              <Input id="result-dq" placeholder="—" {...register("dqCode")} />
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
