"use client";

import { TEAM_TYPES, type TeamType } from "@project-aqua/swim-core/team-types";
import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
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
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTeamTypeAction } from "./actions";

export function TeamTypeForm({
  teamId,
  teamType,
}: {
  teamId: string;
  teamType: TeamType;
}) {
  const router = useRouter();
  const [value, setValue] = useState<string>(teamType);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const selected = TEAM_TYPES.find((t) => t.value === value);

  function save() {
    setMessage("");
    startTransition(async () => {
      try {
        await updateTeamTypeAction(teamId, value);
        setMessage("Team type updated");
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Field className="max-w-sm">
        <FieldLabel htmlFor="teamType">Team Type</FieldLabel>
        <Select
          items={TEAM_TYPES}
          value={value}
          onValueChange={(v) => {
            if (v != null) setValue(v);
          }}
        >
          <SelectTrigger id="teamType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TEAM_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {selected ? (
          <FieldDescription className="text-pretty">
            {selected.description}
          </FieldDescription>
        ) : null}
      </Field>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={pending || value === teamType}
          onClick={save}
        >
          {pending ? "Saving..." : "Save type"}
        </Button>
        {message ? (
          <p className="text-muted-foreground text-xs">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
