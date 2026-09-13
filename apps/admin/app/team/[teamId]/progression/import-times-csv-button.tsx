"use client";

import { Button } from "@project-aqua/ui/components/button";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { importBestTimesCsvAction } from "./best-times-actions";

export function ImportTimesCsvButton({
  teamId,
  canEdit,
}: {
  teamId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!canEdit) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          startTransition(async () => {
            try {
              const content = await file.text();
              const result = await importBestTimesCsvAction(teamId, content);
              setMessage(
                `Imported ${result.imported}. ${result.unmatched} unmatched, ${result.invalid} skipped.`,
              );
              router.refresh();
            } catch (err) {
              setMessage(
                err instanceof Error ? err.message : "Couldn't import CSV.",
              );
            }
          });
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Importing…" : "Import times CSV"}
      </Button>
      {message ? (
        <p className="text-muted-foreground max-w-xs text-right text-xs">
          {message}
        </p>
      ) : null}
    </div>
  );
}
