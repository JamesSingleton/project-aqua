"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateDefaultPracticeLocationAction } from "./actions";

export function PracticeDefaultsForm({
  teamId,
  defaultLocation,
}: {
  teamId: string;
  defaultLocation: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [location, setLocation] = useState(defaultLocation);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const dirty = location.trim() !== defaultLocation.trim();

  function save() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await updateDefaultPracticeLocationAction(teamId, {
        location,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Practice defaults updated");
      router.refresh();
    });
  }

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor="default-practice-location">
          Default practice location
        </FieldLabel>
        <Input
          id="default-practice-location"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setMessage("");
            setError("");
          }}
          disabled={pending}
          maxLength={200}
          placeholder="Main pool"
        />
        <FieldDescription>
          Prefills location when creating practice sessions and calendar events.
          You can still change it per event.
        </FieldDescription>
      </Field>
      {error ? <FieldError>{error}</FieldError> : null}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={pending || !dirty}
          onClick={save}
        >
          {pending ? "Saving…" : "Save defaults"}
        </Button>
        {message ? (
          <p className="text-muted-foreground text-xs">{message}</p>
        ) : null}
      </div>
    </FieldGroup>
  );
}
