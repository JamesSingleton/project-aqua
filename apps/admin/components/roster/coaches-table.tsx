// app/team/[teamId]/roster/coaches/_components/coaches-table.tsx
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
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { Coach } from "@/types/roster";
import { COACH_ROLE_LABEL } from "@/types/roster";
import { getCoachColumns } from "./coach-columns";

interface CoachesTableProps {
  coaches: Coach[];
  teamId: string;
}

const ALL = "all";

export function CoachesTable({ coaches, teamId }: CoachesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "role", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(() => getCoachColumns(teamId), [teamId]);

  const table = useReactTable({
    data: coaches,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
  });

  const selectedRole =
    (columnFilters.find((f) => f.id === "role")?.value as string) ?? ALL;
  const selectedCert =
    (columnFilters.find((f) => f.id === "certStatus")?.value as string) ?? ALL;

  const hasActiveFilters =
    globalFilter || selectedRole !== ALL || selectedCert !== ALL;

  const clearFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
  };

  const setFilter = (id: string, value: string) => {
    setColumnFilters((prev) => {
      const without = prev.filter((f) => f.id !== id);
      return value === ALL ? without : [...without, { id, value }];
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Input
            className="max-w-sm"
            onChange={(event) =>
              table.getColumn("displayName")?.setFilterValue(event.target.value)
            }
            placeholder="Filter names..."
            value={
              (table.getColumn("displayName")?.getFilterValue() as string) ?? ""
            }
          />
        </div>

        <Select
          onValueChange={(v) => setFilter("role", v)}
          value={selectedRole}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            {(
              Object.entries(COACH_ROLE_LABEL) as [Coach["role"], string][]
            ).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) => setFilter("certStatus", v)}
          value={selectedCert}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Cert status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="current">Current</SelectItem>
            <SelectItem value="expiring_soon">Expiring soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>

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
                    ? "No coaches match your filters."
                    : "No coaches added yet."}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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

      <p className="text-muted-foreground text-xs">
        {table.getFilteredRowModel().rows.length} of {coaches.length} coaches
      </p>
    </div>
  );
}
