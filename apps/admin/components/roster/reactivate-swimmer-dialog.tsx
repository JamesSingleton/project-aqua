"use client";

import { Button } from "@lane4hq/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@lane4hq/ui/components/dialog";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reactivateSwimmerAction } from "@/app/team/[teamId]/roster/actions";
import type { Athlete } from "@/types";

export function isArchived(athlete: Pick<Athlete, "status">) {
  return athlete.status.toLowerCase() === "inactive";
}

export function ReactivateSwimmerDialog({
  teamId,
  athlete,
  open,
  onOpenChange,
}: {
  teamId: string;
  athlete: Pick<Athlete, "id" | "name" | "seasonId">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function confirm() {
    setError("");
    startTransition(async () => {
      try {
        await reactivateSwimmerAction(teamId, athlete.id, {
          seasonId: athlete.seasonId,
        });
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not reactivate swimmer",
        );
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate {athlete.name}?</DialogTitle>
          <DialogDescription>
            They&apos;ll be back on this season&apos;s roster with their
            profile, contacts, meet history, and times intact.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="button" disabled={pending} onClick={confirm}>
            {pending ? "Reactivating…" : "Reactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
