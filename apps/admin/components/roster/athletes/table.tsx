"use client";

import type { TeamAthleteRow } from "@project-aqua/database/queries/athlete";
import type { Team } from "@project-aqua/database/schema";
import { Button } from "@project-aqua/design-system/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/design-system/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/design-system/components/ui/table";
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { buildAthleteColumns } from "./columns";
import { AthletesToolbar } from "./toolbar";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AthletesTableProps {
  data: TeamAthleteRow[];
  team: Team;
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function AthletesTable({ data, team }: AthletesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    // Default to showing only active athletes
    [{ id: "status", value: ["active"] }]
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Hide USA-S ID by default — available via column toggle
    usasId: false,
  });
  const [rowSelection, setRowSelection] = useState({});

  // Build columns dynamically based on team type
  const columns = useMemo(
    () => buildAthleteColumns(team.teamType),
    [team.teamType]
  );

  // Derive available training groups from data for the filter dropdown
  const trainingGroups = useMemo(() => {
    const groups = new Set(
      data
        .map((r) => r.membership.trainingGroup)
        .filter((g): g is string => !!g)
    );
    return [...groups].sort();
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <AthletesToolbar
        table={table}
        teamType={team.teamType}
        trainingGroups={trainingGroups}
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead colSpan={header.colSpan} key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="cursor-pointer hover:bg-muted/50"
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-48 text-center"
                  colSpan={columns.length}
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8 opacity-40" />
                    <p className="font-medium text-sm">No athletes found</p>
                    <p className="text-xs">
                      Try adjusting your filters or import a roster
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer — pagination + counts */}
      <div className="flex items-center justify-between">
        {/* Selection + total count */}
        <p className="text-muted-foreground text-sm">
          {selectedCount > 0 ? (
            <>
              {selectedCount} of {filteredCount} row
              {filteredCount !== 1 && "s"} selected
            </>
          ) : (
            <>
              {filteredCount} athlete{filteredCount !== 1 && "s"}
              {table.getState().columnFilters.length > 0 &&
                ` (filtered from ${data.length} total)`}
            </>
          )}
        </p>

        {/* Pagination controls */}
        <div className="flex items-center gap-6">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-sm">Rows per page</p>
            <Select
              onValueChange={(value) => table.setPageSize(Number(value))}
              value={`${table.getState().pagination.pageSize}`}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page indicator */}
          <p className="text-muted-foreground text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </p>

          {/* Prev / next */}
          <div className="flex items-center gap-1">
            <Button
              className="h-8 w-8"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              size="icon"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              className="h-8 w-8"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              size="icon"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
