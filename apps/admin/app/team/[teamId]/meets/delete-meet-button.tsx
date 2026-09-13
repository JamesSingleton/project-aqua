"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@project-aqua/ui/components/dialog";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMeetAction } from "./actions";

export function DeleteMeetButton({
  teamId,
  meetId,
  meetName,
  variant = "outline",
  size = "default",
}: {
  teamId: string;
  meetId: string;
  meetName: string;
  variant?: "outline" | "destructive" | "ghost";
  size?: "default" | "sm" | "icon";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onDelete() {
    setError("");
    startTransition(async () => {
      try {
        await deleteMeetAction(teamId, meetId);
        setOpen(false);
        router.push(`/team/${teamId}/meets`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete meet");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size={size}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete meet?</DialogTitle>
          <DialogDescription>
            This permanently deletes <strong>{meetName}</strong> and all of its
            events, entries, commitments, relay assignments, and results. Best
            times that came from this meet keep their times but lose the meet
            link. This cannot be undone.
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
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={onDelete}
          >
            {pending ? "Deleting…" : "Delete meet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
