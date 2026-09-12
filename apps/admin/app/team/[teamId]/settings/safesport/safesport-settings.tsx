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
import {
  submitSafesportReportAction,
  updateStaffCredentialAction,
} from "./actions";

const reportCategories = [
  { label: "MAAPP violation", value: "maapp_violation" },
  { label: "Emotional misconduct", value: "emotional_misconduct" },
  { label: "Physical misconduct", value: "physical_misconduct" },
  { label: "Sexual misconduct", value: "sexual_misconduct" },
  { label: "Other", value: "other" },
] as const;

const safesportReportFormSchema = z.object({
  category: z.enum([
    "emotional_misconduct",
    "physical_misconduct",
    "sexual_misconduct",
    "maapp_violation",
    "other",
  ]),
  description: z.string().trim().min(1, "Description is required"),
});

type SafesportReportFormValues = z.infer<typeof safesportReportFormSchema>;

type CredentialRow = {
  id: string;
  memberId: string;
  userId: string;
  role: string;
  credentialType: string;
  status: string;
  completedAt: Date | null;
  expiresAt: Date | null;
};

export function SafeSportSettingsClient({
  teamId,
  summary,
  credentials,
}: {
  teamId: string;
  summary: {
    seasonYear: string;
    coachesNeedingTraining: number;
    minorAckTotal: number;
    minorAckCompleted: number;
    openReports: number;
  };
  credentials: CredentialRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    control,
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<SafesportReportFormValues>({
    resolver: zodResolver(safesportReportFormSchema),
    defaultValues: {
      category: "maapp_violation",
      description: "",
    },
  });

  async function markCredentialCurrent(memberId: string) {
    setError("");
    try {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      await updateStaffCredentialAction(teamId, {
        memberId,
        credentialType: "safesport_core",
        status: "current",
        completedAt: new Date().toISOString(),
        expiresAt: expires.toISOString(),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function submitReport(values: SafesportReportFormValues) {
    setError("");
    try {
      await submitSafesportReportAction(teamId, {
        subjectDescription: values.description,
        category: values.category,
      });
      resetField("description");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report failed");
    }
  }

  const ackPct =
    summary.minorAckTotal > 0
      ? Math.round((summary.minorAckCompleted / summary.minorAckTotal) * 100)
      : 100;

  const coachRows = [
    ...new Map(credentials.map((c) => [c.memberId, c])).values(),
  ];

  return (
    <div className="space-y-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Coach training</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {summary.coachesNeedingTraining}
            </p>
            <p className="text-muted-foreground text-sm">
              need current SafeSport
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>MAAPP acks ({summary.seasonYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ackPct}%</p>
            <p className="text-muted-foreground text-sm">
              {summary.minorAckCompleted} of {summary.minorAckTotal} minors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.openReports}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MAAPP policy</CardTitle>
          <CardDescription>
            2025 Minor Athlete Abuse Prevention Policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <a
              href="https://maapp.uscenterforsafesport.org/"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              View MAAPP manual
            </a>
          </p>
          <p>
            Helpline:{" "}
            <a href="tel:8662000796" className="text-primary underline">
              866-200-0796
            </a>{" "}
            ·{" "}
            <a
              href="https://safesporthelpline.org"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              safesporthelpline.org
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coach credentials</CardTitle>
          <CardDescription>
            Mark SafeSport training current after completion at{" "}
            <a
              href="https://safesporttrained.org"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              safesporttrained.org
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {coachRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No staff on file.</p>
          ) : (
            coachRows.map((c) => (
              <div
                key={c.memberId}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium capitalize">
                    {c.role.replace("_", " ")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {c.status === "current" && c.expiresAt
                      ? `Expires ${new Date(c.expiresAt).toLocaleDateString()}`
                      : "Not current"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markCredentialCurrent(c.memberId)}
                >
                  Mark current
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report a concern</CardTitle>
          <CardDescription>
            Internal team record. Also report to the{" "}
            <a
              href="https://uscenterforsafesport.org/report-a-concern"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              U.S. Center for SafeSport
            </a>{" "}
            when appropriate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(submitReport)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Field data-invalid={!!errors.category}>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      items={reportCategories}
                      value={field.value}
                      onValueChange={(value) => {
                        if (value != null) field.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id="category"
                        className="w-full"
                        aria-invalid={!!errors.category}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {reportCategories.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.category]} />
              </Field>
              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Input
                  id="description"
                  aria-invalid={!!errors.description}
                  {...register("description")}
                />
                <FieldError errors={[errors.description]} />
              </Field>
            </FieldGroup>
            <Button type="submit" className="w-fit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit report"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
