"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { applySuggestedLineupAction } from "../actions";

export function LineupSuggestPanel({
  teamId,
  meetId,
  available,
}: {
  teamId: string;
  meetId: string;
  available: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!available) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Individual entries</CardTitle>
        <CardDescription>
          Optional: fill leftover individual spots from eligible swimmers' best
          times. Relays are unchanged.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {message ? (
          <p className="text-muted-foreground text-sm">{message}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              try {
                const result = await applySuggestedLineupAction(teamId, meetId);
                setMessage(
                  result.added === 0
                    ? "No new individual entries to add."
                    : `Added ${result.added} individual ${result.added === 1 ? "entry" : "entries"}.`,
                );
                router.refresh();
              } catch (err) {
                setMessage(
                  err instanceof Error
                    ? err.message
                    : "Couldn't apply suggestions.",
                );
              }
            });
          }}
        >
          {pending ? "Applying…" : "Fill remaining events"}
        </Button>
      </CardContent>
    </Card>
  );
}
