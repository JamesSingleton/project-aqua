"use client";

import { Button } from "@project-aqua/ui/components/button";
import { Download } from "lucide-react";
import { useState } from "react";

export function DownloadEntriesPdfButton({
  teamId,
  meetId,
  meetName,
}: {
  teamId: string;
  meetId: string;
  meetName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onDownload() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teams/${teamId}/meets/${meetId}/reports/entries`,
      );
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to download PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meetName.replace(/[^\w.-]+/g, "_")}_entries.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        disabled={loading}
        onClick={() => void onDownload()}
      >
        <Download data-icon="inline-start" />
        {loading ? "Generating…" : "Download PDF"}
      </Button>
      {error ? (
        <p className="text-destructive max-w-xs text-right text-xs">{error}</p>
      ) : null}
    </div>
  );
}
