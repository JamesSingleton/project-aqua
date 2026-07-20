"use client";

import { Button } from "@project-aqua/ui/components/button";
import { useState } from "react";
import { exportMeetAction } from "../actions";

export function MeetExportButtons({
  teamId,
  meetId,
  meetName,
}: {
  teamId: string;
  meetId: string;
  meetName: string;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"sdif" | "hy3" | null>(null);

  async function handleExport(format: "sdif" | "hy3") {
    setLoading(format);
    setError("");
    try {
      const content = await exportMeetAction(teamId, meetId, format);
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meetName.replace(/[^\w.-]+/g, "_")}.${format === "sdif" ? "sd3" : "hy3"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleExport("sdif")}
      >
        {loading === "sdif" ? "Exporting…" : "Export SD3"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleExport("hy3")}
      >
        {loading === "hy3" ? "Exporting…" : "Export HY3"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
