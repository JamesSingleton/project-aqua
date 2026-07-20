"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTeamProfileAction } from "./actions";

export function TeamProfileForm({
  teamId,
  name,
}: {
  teamId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [teamName, setTeamName] = useState(name);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const dirty = teamName.trim() !== name;

  function save() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await updateTeamProfileAction(teamId, {
        name: teamName,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Team profile updated");
      router.refresh();
    });
  }

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor="team-name">Team name</FieldLabel>
        <Input
          id="team-name"
          value={teamName}
          onChange={(e) => {
            setTeamName(e.target.value);
            setMessage("");
            setError("");
          }}
          disabled={pending}
          required
        />
      </Field>
      {error ? <FieldError>{error}</FieldError> : null}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={pending || !dirty}
          onClick={save}
        >
          {pending ? "Saving…" : "Save profile"}
        </Button>
        {message ? (
          <p className="text-muted-foreground text-xs">{message}</p>
        ) : null}
      </div>
    </FieldGroup>
  );
}
