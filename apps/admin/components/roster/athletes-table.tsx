// app/team/[teamId]/roster/athletes/_components/athletes-table.tsx
"use client";

import { Button } from "@project-aqua/design-system/components/ui/button";
import { Input } from "@project-aqua/design-system/components/ui/input";
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
} from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Athlete } from "@/types/roster";
import { getAthleteColumns } from "./athlete-columns";

interface AthletesTableProps {
  athletes: Athlete[];
  groups: string[];
  teamId: string;
}

const ALL_GROUPS = "all";
const ALL_GENDERS = "all";
const PAGE_SIZE = 10;

export function AthletesTable({
  athletes,
  teamId,
  groups,
}: AthletesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "displayName", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const columns = useMemo(() => getAthleteColumns(teamId), [teamId]);

  const filteredData = useMemo(
    () => (showInactive ? athletes : athletes.filter((a) => a.active)),
    [athletes, showInactive]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const selectedGroup =
    (columnFilters.find((f) => f.id === "group")?.value as string) ??
    ALL_GROUPS;
  const selectedGender =
    (columnFilters.find((f) => f.id === "gender")?.value as string) ??
    ALL_GENDERS;

  const hasActiveFilters =
    globalFilter ||
    selectedGroup !== ALL_GROUPS ||
    selectedGender !== ALL_GENDERS;

  const clearFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
  };

  const setGroupFilter = (value: string) => {
    setColumnFilters((prev) => {
      const without = prev.filter((f) => f.id !== "group");
      return value === ALL_GROUPS
        ? without
        : [...without, { id: "group", value }];
    });
  };

  const setGenderFilter = (value: string) => {
    setColumnFilters((prev) => {
      const without = prev.filter((f) => f.id !== "gender");
      return value === ALL_GENDERS
        ? without
        : [...without, { id: "gender", value }];
    });
  };

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalFiltered);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Input
            className="max-w-sm"
            onChange={(event) =>
              table.getColumn("displayName")?.setFilterValue(event.target.value)
            }
            placeholder="Filter names..."
            value={(table.getColumn("displayName")?.getFilterValue() as string) ?? ""}
          />
        </div>

        <Select onValueChange={setGroupFilter} value={selectedGroup}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_GROUPS}>All groups</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setGenderFilter} value={selectedGender}>
          <SelectTrigger className="h-9 w-28">
            <SelectValue placeholder="All genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_GENDERS}>All</SelectItem>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
          </SelectContent>
        </Select>

        <Button
          className="h-9 text-xs"
          onClick={() => setShowInactive((v) => !v)}
          size="sm"
          variant={showInactive ? "secondary" : "outline"}
        >
          <SlidersHorizontalIcon className="mr-1.5 h-3.5 w-3.5" />
          {showInactive ? "Hiding inactive" : "Show inactive"}
        </Button>

        {hasActiveFilters && (
          <Button
            className="h-9 text-xs"
            onClick={clearFilters}
            size="sm"
            variant="ghost"
          >
            <XIcon className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow className="bg-muted/30 hover:bg-muted/30" key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-10 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  {hasActiveFilters
                    ? "No athletes match your filters."
                    : "No athletes on the roster yet."}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className={row.original.active ? undefined : "opacity-50"}
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
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          {totalFiltered === 0
            ? "No results"
            : `${from}–${to} of ${totalFiltered} athletes`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            className="h-8 w-8"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="icon"
            variant="outline"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs tabular-nums">
            {pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button
            className="h-8 w-8"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="icon"
            variant="outline"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
