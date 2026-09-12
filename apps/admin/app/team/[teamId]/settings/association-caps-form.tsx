"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTeamAssociationCapsAction } from "./actions";

export function AssociationCapsForm({
  teamId,
  maxScoringEntriesPerIndividualEvent,
  maxRelayTeamsPerEvent,
}: {
  teamId: string;
  maxScoringEntriesPerIndividualEvent: number | null;
  maxRelayTeamsPerEvent: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [individual, setIndividual] = useState(
    maxScoringEntriesPerIndividualEvent != null
      ? String(maxScoringEntriesPerIndividualEvent)
      : "",
  );
  const [relays, setRelays] = useState(
    maxRelayTeamsPerEvent != null ? String(maxRelayTeamsPerEvent) : "",
  );

  function save() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await updateTeamAssociationCapsAction(teamId, {
        maxScoringEntriesPerIndividualEvent: individual,
        maxRelayTeamsPerEvent: relays,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Association caps saved");
      router.refresh();
    });
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="assoc-scoring">
            Scoring swimmers per individual event
          </FieldLabel>
          <Input
            id="assoc-scoring"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Unlimited"
            value={individual}
            onChange={(e) => setIndividual(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="assoc-relays">Teams per relay event</FieldLabel>
          <Input
            id="assoc-relays"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Unlimited"
            value={relays}
            onChange={(e) => setRelays(e.target.value)}
          />
        </Field>
      </FieldGroup>
      <FieldDescription>
        High-school association limit for scoring (non-exhibition) names from
        this school. Leave blank for unlimited. Exhibition entries are not
        counted. You can override these on a meet.
      </FieldDescription>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save caps"}
        </Button>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-muted-foreground text-sm">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
