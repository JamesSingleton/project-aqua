"use client";

import { Button } from "@project-aqua/ui/components/button";

export function PrintReportButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
    >
      Print
    </Button>
  );
}
