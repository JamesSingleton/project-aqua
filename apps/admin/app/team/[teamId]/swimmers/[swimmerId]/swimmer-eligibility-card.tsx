"use client";

import {
  ELIGIBILITY_STATUS_LABELS,
  ELIGIBILITY_STATUSES,
  type EligibilityStatus,
} from "@project-aqua/swim-core/team-types";
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
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { Textarea } from "@project-aqua/ui/components/textarea";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSwimmerEligibilityAction } from "./actions";

const STATUS_ITEMS = [
  { value: "competing", label: "Competing (eligible)" },
  ...ELIGIBILITY_STATUSES.filter((s) => s !== "competing").map((status) => ({
    value: status,
    label: ELIGIBILITY_STATUS_LABELS[status],
  })),
] as const;

export function SwimmerEligibilityCard({
  teamId,
  swimmerId,
  eligibilityStatus,
  eligibilityNotes,
}: {
  teamId: string;
  swimmerId: string;
  eligibilityStatus: EligibilityStatus | null;
  eligibilityNotes: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<EligibilityStatus | "competing">(
    eligibilityStatus ?? "competing",
  );
  const [notes, setNotes] = useState(eligibilityNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  const dirty =
    status !== (eligibilityStatus ?? "competing") ||
    notes.trim() !== (eligibilityNotes ?? "").trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competition eligibility</CardTitle>
        <CardDescription>
          Season-level status for academics, transfers, medical sit-outs, and
          similar. Ineligible swimmers cannot be entered in meets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              try {
                await updateSwimmerEligibilityAction(teamId, swimmerId, {
                  eligibilityStatus: status === "competing" ? null : status,
                  eligibilityNotes: notes,
                });
                router.refresh();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Couldn't save eligibility.",
                );
              }
            });
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="eligibility-status">Status</FieldLabel>
              <Select
                items={STATUS_ITEMS}
                value={status}
                onValueChange={(value) => {
                  if (value != null) {
                    setStatus(value as EligibilityStatus | "competing");
                  }
                }}
              >
                <SelectTrigger id="eligibility-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Use Ineligible for academic or transfer sit-outs. Meet entries
                are blocked until you change this.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="eligibility-notes">Notes</FieldLabel>
              <Textarea
                id="eligibility-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Transfer sit-out until Jan 15; grade check pending"
                rows={3}
              />
            </Field>
          </FieldGroup>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save eligibility"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
