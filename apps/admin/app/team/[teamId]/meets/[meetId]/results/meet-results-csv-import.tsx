"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@project-aqua/ui/components/dialog";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { importMeetResultsCsvAction } from "../../meet-events-actions";

export function MeetResultsCsvImport({
  teamId,
  meetId,
}: {
  teamId: string;
  meetId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function onFile(file: File | null) {
    if (!file) return;
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const content = await file.text();
        const result = await importMeetResultsCsvAction(
          teamId,
          meetId,
          content,
        );
        const skipped =
          result.skipped.length > 0
            ? ` ${result.skipped.length} row(s) skipped.`
            : "";
        setMessage(`Imported ${result.imported} result(s).${skipped}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Upload data-icon="inline-start" />
            Import results CSV
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import results from CSV</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet with columns: Event #, Swimmer, Time, and
            optional Place. Swimmer names must match your roster.
          </DialogDescription>
        </DialogHeader>
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={pending}
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
        {pending ? (
          <p className="text-muted-foreground text-sm">Importing…</p>
        ) : null}
        {message ? <p className="text-sm">{message}</p> : null}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
