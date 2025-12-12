"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { UpdateAthleteSheet } from "./update-athlete-sheet";
import { DeleteAthletesDialog } from "./delete-athletes-dialog";

import type { DataTableRowAction } from "@/types/data-table";
import { getAthletesTableColumns } from "./athletes-table-column";
import { AthletesTableActionBar } from "./athletes-table-action-bar";
import { DataTableAdvancedToolbar } from "../data-table/data-table-advanced-toolbar";
import { DataTableSortList } from "../data-table/data-table-sort-list";
import { DataTableFilterList } from "../data-table/data-table-filter-list";

type Athlete = {
  id: string;
  name: string;
  email: string;
  status: string;
  priority: string;
  estimatedHours: number;
};

const getAthletes = async () => {
  const response = await fetch("/api/athletes");
  const data = await response.json();
  return data;
};

const getAthleteStatusCounts = async () => {
  const response = await fetch("/api/athlete-status-counts");
  const data = await response.json();
  return data;
};

const getAthletePriorityCounts = async () => {
  const response = await fetch("/api/athlete-priority-counts");
  const data = await response.json();
  return data;
};

const getEstimatedHoursRange = async () => {
  const response = await fetch("/api/estimated-hours-range");
  const data = await response.json();
  return data;
};

interface AthletesTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getAthletes>>,
      Awaited<ReturnType<typeof getAthleteStatusCounts>>,
      Awaited<ReturnType<typeof getAthletePriorityCounts>>,
      Awaited<ReturnType<typeof getEstimatedHoursRange>>,
    ]
  >;
}

export function AthleteTable({ promises }: AthletesTableProps) {
  const [
    { data, pageCount },
    statusCounts,
    priorityCounts,
    estimatedHoursRange,
  ] = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Athlete> | null>(null);

  const columns = React.useMemo(
    () =>
      getAthletesTableColumns({
        statusCounts,
        priorityCounts,
        estimatedHoursRange,
        setRowAction,
      }),
    [statusCounts, priorityCounts, estimatedHoursRange],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable
        table={table}
        actionBar={<AthletesTableActionBar table={table} />}
      >
        <DataTableAdvancedToolbar table={table}>
          <DataTableSortList table={table} align="start" />
          <DataTableFilterList
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
        </DataTableAdvancedToolbar>
      </DataTable>
      <UpdateAthleteSheet
        open={rowAction?.variant === "update"}
        onOpenChange={() => setRowAction(null)}
        athlete={rowAction?.row.original ?? null}
      />
      <DeleteAthletesDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        athletes={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </>
  );
}
