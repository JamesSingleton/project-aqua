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
    >
      <Download data-icon="inline-start" />
      {loading ? "Exporting…" : "Export roster"}
    </Button>
  );
}
