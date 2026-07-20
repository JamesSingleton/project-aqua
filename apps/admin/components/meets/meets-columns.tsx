"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import Link from "next/link";
import { DeleteMeetButton } from "@/app/team/[teamId]/meets/delete-meet-button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { DateRangeFilterValue } from "@/components/data-table/data-table-toolbar";
import type { Option } from "@/types/data-table";

export type MeetTableRow = {
  id: string;
  name: string;
  /** ISO date YYYY-MM-DD */
  startDate: string;
  course: "SCY" | "SCM" | "LCM";
  location: string | null;
};

const dateRangeFilterFn: FilterFn<MeetTableRow> = (
  row,
  columnId,
  filterValue: DateRangeFilterValue | undefined,
) => {
  if (!filterValue?.from && !filterValue?.to) return true;
  const value = row.getValue<string>(columnId);
  if (!value) return false;
  if (filterValue.from && value < filterValue.from) return false;
  if (filterValue.to && value > filterValue.to) return false;
  return true;
};

export function createMeetsColumns(
  teamId: string,
  courseOptions: Option[],
): ColumnDef<MeetTableRow>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/team/${teamId}/meets/${row.original.id}`}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {row.original.name}
        </Link>
      ),
      enableColumnFilter: true,
      meta: {
        label: "Name",
        placeholder: "Search meets…",
        variant: "text",
      },
    },
    {
      id: "startDate",
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const [year, month, day] = row.original.startDate
          .split("-")
          .map(Number);
        if (!year || !month || !day) return row.original.startDate;
        return new Date(year, month - 1, day).toLocaleDateString();
      },
      enableColumnFilter: true,
      filterFn: dateRangeFilterFn,
      meta: {
        label: "Date",
        variant: "dateRange",
      },
    },
    {
      id: "course",
      accessorKey: "course",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Course" />
      ),
      cell: ({ row }) => row.original.course,
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue: string[] | undefined) => {
        if (!filterValue?.length) return true;
        return filterValue.includes(row.getValue<string>(columnId));
      },
      meta: {
        label: "Course",
        variant: "multiSelect",
        options: courseOptions,
      },
    },
    {
      id: "location",
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => row.original.location ?? "—",
      enableSorting: true,
      enableColumnFilter: false,
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DeleteMeetButton
          teamId={teamId}
          meetId={row.original.id}
          meetName={row.original.name}
          variant="ghost"
          size="sm"
        />
      ),
    },
  ];
}
