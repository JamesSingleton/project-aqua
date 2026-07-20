"use client";

import type { SortingState, VisibilityState } from "@tanstack/react-table";
import { useState } from "react";
import {
  exportRosterCsvAction,
  saveRosterViewPreferencesAction,
} from "@/app/team/[teamId]/roster/actions";
import { RosterImportButton } from "@/app/team/[teamId]/roster/roster-import-export";
import type { Swimmer } from "@/types";
import { columns } from "./columns";
import {
  DataTable,
  RosterExportButton,
  type RosterViewState,
} from "./data-table";

export function RosterTable({
  teamId,
  data,
  showClassYear = false,
  initialColumnVisibility = {},
  initialSorting = [],
}: {
  teamId: string;
  data: Swimmer[];
  showClassYear?: boolean;
  initialColumnVisibility?: VisibilityState;
  initialSorting?: SortingState;
}) {
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  async function handleExport() {
    setExporting(true);
    setExportMessage("");
    try {
      const csv = await exportRosterCsvAction(teamId);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "roster-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      setExportMessage("Roster exported");
    } catch (err) {
      setExportMessage(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function handleViewChange(view: RosterViewState) {
    void saveRosterViewPreferencesAction(teamId, view);
  }

  return (
    <div className="flex flex-col gap-2">
      <DataTable
        columns={columns(teamId, { showClassYear })}
        data={data}
        initialColumnVisibility={initialColumnVisibility}
        initialSorting={initialSorting}
        onViewChange={handleViewChange}
        toolbarEnd={
          <>
            <RosterImportButton teamId={teamId} />
            <RosterExportButton onExport={handleExport} loading={exporting} />
          </>
        }
      />
      {exportMessage ? (
        <p className="text-muted-foreground text-sm">{exportMessage}</p>
      ) : null}
    </div>
  );
}
