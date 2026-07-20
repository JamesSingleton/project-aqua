"use client";

import type { SortingState, VisibilityState } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  exportRosterCsvAction,
  saveRosterViewPreferencesAction,
} from "@/app/team/[teamId]/roster/actions";
import { RosterImportButton } from "@/app/team/[teamId]/roster/roster-import-export";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { Athlete } from "@/types";
import type { Option } from "@/types/data-table";
import { columns } from "./columns";
import { RosterActionBar } from "./roster-action-bar";
import { RosterExportButton } from "./roster-export-button";

export type RosterFacetOptions = {
  status: Option[];
  gender: Option[];
  groupId: Option[];
  classYear: Option[];
};

export function RosterTable({
  teamId,
  data,
  pageCount,
  groups = [],
  facetOptions,
  showClassYear = false,
  initialColumnVisibility = {},
  initialSorting = [{ id: "lastName", desc: false }],
}: {
  teamId: string;
  data: Athlete[];
  pageCount: number;
  groups?: { id: string; name: string }[];
  facetOptions: RosterFacetOptions;
  showClassYear?: boolean;
  initialColumnVisibility?: VisibilityState;
  initialSorting?: SortingState;
}) {
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [, startTransition] = useTransition();
  const skipPersist = useRef(true);

  const tableColumns = useMemo(
    () =>
      columns(teamId, {
        showClassYear,
        statusOptions: facetOptions.status,
        genderOptions: facetOptions.gender,
        groupOptions: facetOptions.groupId,
        classYearOptions: facetOptions.classYear,
      }),
    [teamId, showClassYear, facetOptions],
  );

  const { table } = useDataTable({
    data,
    columns: tableColumns,
    pageCount,
    initialState: {
      sorting: initialSorting,
      columnVisibility: initialColumnVisibility,
      columnPinning: { right: ["actions"] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
    shallow: false,
    clearOnDefault: true,
  });

  const columnVisibility = table.getState().columnVisibility;
  const sorting = table.getState().sorting;

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(() => {
        void saveRosterViewPreferencesAction(teamId, {
          columnVisibility,
          sorting,
        });
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [columnVisibility, sorting, teamId]);

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

  return (
    <div className="flex flex-col gap-2">
      <DataTable
        table={table}
        actionBar={
          <RosterActionBar table={table} teamId={teamId} groups={groups} />
        }
      >
        <DataTableToolbar table={table}>
          <RosterImportButton teamId={teamId} />
          <RosterExportButton onExport={handleExport} loading={exporting} />
        </DataTableToolbar>
      </DataTable>
      {exportMessage ? (
        <p className="text-muted-foreground text-sm">{exportMessage}</p>
      ) : null}
    </div>
  );
}
