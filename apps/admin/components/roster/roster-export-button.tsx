"use client";

import { Button } from "@project-aqua/ui/components/button";
import { Download } from "lucide-react";

export function RosterExportButton({
  onExport,
  loading,
}: {
  onExport: () => void;
  loading?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={onExport}
      aria-label={loading ? "Exporting roster" : "Export roster"}
    >
      <Download data-icon="inline-start" />
      {loading ? (
        "Exporting…"
      ) : (
        <>
          <span className="sm:hidden">Export</span>
          <span className="hidden sm:inline">Export roster</span>
        </>
      )}
    </Button>
  );
}
