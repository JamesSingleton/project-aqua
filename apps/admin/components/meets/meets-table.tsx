"use client";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import type { Option } from "@/types/data-table";
import { createMeetsColumns, type MeetTableRow } from "./meets-columns";

const COURSE_OPTIONS: Option[] = [
  { label: "SCY", value: "SCY" },
  { label: "SCM", value: "SCM" },
  { label: "LCM", value: "LCM" },
];

export function MeetsTable({
  teamId,
  meets,
}: {
  teamId: string;
  meets: MeetTableRow[];
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "startDate", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const seasonOptions = useMemo(() => {
    const labels = [
      ...new Set(
        meets
          .map((meet) => meet.seasonLabel)
          .filter((label): label is string => Boolean(label)),
      ),
    ].sort();
    return labels.map((label) => ({ label, value: label }));
  }, [meets]);

  const columns = useMemo(
    () => createMeetsColumns(teamId, COURSE_OPTIONS, seasonOptions),
    [teamId, seasonOptions],
  );

  const table = useReactTable({
    data: meets,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
      columnPinning: { right: ["actions"] },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    defaultColumn: {
      enableColumnFilter: false,
      enableHiding: false,
    },
  });

  if (meets.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No meets yet. Import a meet file to get started.
      </p>
    );
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} showViewOptions={false} />
    </DataTable>
  );
}
