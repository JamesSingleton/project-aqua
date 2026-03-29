"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/design-system/components/ui/table";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useState } from "react";

export interface RecentDrop {
  athleteName: string;
  date: string;
  dropSeconds: number;
  event: string;
  id: string;
  newTime: string;
  previousTime: string;
}

const columns: ColumnDef<RecentDrop>[] = [
  {
    accessorKey: "athleteName",
    header: "Athlete",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("athleteName")}</span>
    ),
  },
  {
    accessorKey: "event",
    header: "Event",
  },
  {
    accessorKey: "previousTime",
    header: "Previous",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.getValue("previousTime")}
      </span>
    ),
  },
  {
    accessorKey: "newTime",
    header: "New PB",
    cell: ({ row }) => (
      <span className="font-medium text-green-600 tabular-nums dark:text-green-400">
        {row.getValue("newTime")}
      </span>
    ),
  },
  {
    accessorKey: "dropSeconds",
    header: "Drop",
    cell: ({ row }) => {
      const drop = row.getValue("dropSeconds") as number;
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <ArrowDownIcon className="h-3 w-3" />
          <span className="font-medium tabular-nums">{drop.toFixed(2)}s</span>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.getValue("date")}
      </span>
    ),
  },
];

interface RecentDropsTableProps {
  data: RecentDrop[];
}

export function RecentDropsTable({ data }: RecentDropsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                className="cursor-pointer select-none"
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
              >
                <div className="flex items-center gap-1">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted() === "asc" && (
                    <ArrowUpIcon className="h-3 w-3" />
                  )}
                  {header.column.getIsSorted() === "desc" && (
                    <ArrowDownIcon className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
