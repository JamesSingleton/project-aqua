"use client";

import type { SplitCaptureInterval } from "@project-aqua/swim-core/split-capture";
import { Button } from "@project-aqua/ui/components/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { confirmMeetEntriesViewOnExport } from "../../meet-entries-view";

export function DownloadEntriesPdfButton({
  teamId,
  meetId,
  meetName,
  includeRelayAlternates = false,
  groupBy = "event",
  documentKind = "entries",
  splitInterval,
  blankRelayLines = false,
}: {
  teamId: string;
  meetId: string;
  meetName: string;
  includeRelayAlternates?: boolean;
  groupBy?: "event" | "swimmer";
  documentKind?: "entries" | "splits";
  splitInterval?: SplitCaptureInterval;
  blankRelayLines?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onDownload() {
    setLoading(true);
    setError("");
    try {
      await confirmMeetEntriesViewOnExport(teamId);
      const params = new URLSearchParams();
      if (includeRelayAlternates) params.set("alts", "1");
      if (groupBy === "swimmer") params.set("group", "swimmer");
      if (documentKind === "splits" && splitInterval) {
        params.set("split", String(splitInterval));
      }
      if (documentKind === "splits" && blankRelayLines) {
        params.set("blankRelays", "1");
      }
      const query = params.toString();
      const slug = documentKind === "splits" ? "split-sheet" : "entries";
      const res = await fetch(
        `/api/teams/${teamId}/meets/${meetId}/reports/${slug}${query ? `?${query}` : ""}`,
      );
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to download PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meetName.replace(/[^\w.-]+/g, "_")}_${slug}.pdf`;
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
