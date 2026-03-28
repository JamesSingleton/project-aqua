"use client";

import type { TeamAthleteRow } from "@project-aqua/database/queries/athlete";
import { Badge } from "@project-aqua/design-system/components/ui/badge";
import { Button } from "@project-aqua/design-system/components/ui/button";
import { Checkbox } from "@project-aqua/design-system/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@project-aqua/design-system/components/ui/dropdown-menu";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";

function SortableHeader({
  column,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: Column<TeamAthleteRow, any>;
  label: string;
}) {
  return (
    <Button
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      variant="ghost"
    >
      {label}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground/70" />
    </Button>
  );
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  inactive: "secondary",
  archived: "outline",
};

const gradeOrder: Record<string, number> = {
  FR: 1,
  SO: 2,
  JR: 3,
  SR: 4,
};

// ─── Column definitions ───────────────────────────────────────────────────────
// Split into base columns + team-type-specific columns so the parent page
// can compose them based on whether the team is a club or HS/college team.

// Columns always shown regardless of team type
export const baseAthleteColumns: ColumnDef<TeamAthleteRow>[] = [
  // Row selection
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Name
  {
    id: "name",
    accessorFn: (row) => `${row.athlete.lastName}, ${row.athlete.firstName}`,
    header: ({ column }) => <SortableHeader column={column} label="Name" />,
    cell: ({ row }) => {
      const { firstName, lastName, preferredName } = row.original.athlete;
      const displayFirst = preferredName ?? firstName;
      return (
        <div>
          <span className="font-medium">
            {lastName}, {displayFirst}
          </span>
          {preferredName && preferredName !== firstName && (
            <span className="ml-1.5 text-muted-foreground text-xs">
              ({firstName})
            </span>
          )}
        </div>
      );
    },
    filterFn: "includesString",
  },

  // Gender
  {
    id: "gender",
    accessorFn: (row) => row.athlete.gender ?? "",
    header: "Gender",
    cell: ({ row }) => {
      const g = row.original.athlete.gender;
      if (!g) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span className="font-medium">{g === "M" ? "Male" : "Female"}</span>
      );
    },
    filterFn: (row, _id, filterValue: string[]) => {
      if (!filterValue.length) {
        return true;
      }
      return filterValue.includes(row.original.athlete.gender ?? "");
    },
  },

  // Age / DOB
  {
    id: "age",
    accessorFn: (row) => {
      const dob = row.athlete.dateOfBirth;
      if (!dob) {
        return -1;
      }
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    },
    header: ({ column }) => <SortableHeader column={column} label="Age" />,
    cell: ({ row }) => {
      const dob = row.original.athlete.dateOfBirth;
      if (!dob) {
        return <span className="text-muted-foreground">—</span>;
      }
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return (
        <div className="tabular-nums">
          <span className="font-medium">{age}</span>
          {/*<span className="ml-1.5 text-muted-foreground text-xs">
            {birth.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>*/}
        </div>
      );
    },
  },

  // Status
  {
    id: "status",
    accessorFn: (row) => row.membership.status,
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.membership.status;
      return (
        <Badge variant={statusVariant[status] ?? "outline"}>{status}</Badge>
      );
    },
    filterFn: (row, _id, filterValue: string[]) => {
      if (!filterValue.length) {
        return true;
      }
      return filterValue.includes(row.original.membership.status);
    },
  },

  // USA-S ID
  {
    id: "usasId",
    accessorFn: (row) => row.athlete.usasId ?? "",
    header: "USA-S ID",
    cell: ({ row }) => {
      const id = row.original.athlete.usasId;
      if (!id) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span className="font-mono text-muted-foreground text-xs">{id}</span>
      );
    },
  },

  // Joined
  {
    id: "joinedAt",
    accessorFn: (row) => row.membership.joinedAt ?? "",
    header: ({ column }) => <SortableHeader column={column} label="Joined" />,
    cell: ({ row }) => {
      const date = row.original.membership.joinedAt;
      if (!date) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span className="text-sm tabular-nums">
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </span>
      );
    },
  },

  // Actions
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const { id } = row.original.athlete;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(id)}>
              Copy athlete ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`athletes/${id}`}>View profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`athletes/${id}/edit`}>Edit</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Columns for club / USS teams
export const clubAthleteColumns: ColumnDef<TeamAthleteRow>[] = [
  {
    id: "trainingGroup",
    accessorFn: (row) => row.membership.trainingGroup ?? "",
    header: ({ column }) => <SortableHeader column={column} label="Group" />,
    cell: ({ row }) => {
      const group = row.original.membership.trainingGroup;
      if (!group) {
        return <span className="text-muted-foreground">—</span>;
      }
      return <Badge variant="secondary">{group}</Badge>;
    },
    filterFn: (row, _id, filterValue: string[]) => {
      if (!filterValue.length) {
        return true;
      }
      return filterValue.includes(row.original.membership.trainingGroup ?? "");
    },
  },
  {
    id: "competitiveCategory",
    accessorFn: (row) => row.membership.competitiveCategory ?? "",
    header: "Category",
    cell: ({ row }) => {
      const cat = row.original.membership.competitiveCategory;
      if (!cat) {
        return <span className="text-muted-foreground">—</span>;
      }
      return <span className="text-sm">{cat}</span>;
    },
  },
];

// Columns for HS / college teams
export const hsAthleteColumns: ColumnDef<TeamAthleteRow>[] = [
  {
    id: "gradeYear",
    accessorFn: (row) => gradeOrder[row.membership.gradeYear ?? ""] ?? 99,
    header: ({ column }) => <SortableHeader column={column} label="Grade" />,
    cell: ({ row }) => {
      const grade = row.original.membership.gradeYear;
      if (!grade) {
        return <span className="text-muted-foreground">—</span>;
      }
      return <Badge variant="secondary">{grade}</Badge>;
    },
    filterFn: (row, _id, filterValue: string[]) => {
      if (!filterValue.length) {
        return true;
      }
      return filterValue.includes(row.original.membership.gradeYear ?? "");
    },
    sortingFn: "basic",
  },
  {
    id: "graduationYear",
    accessorFn: (row) => row.membership.graduationYear ?? 0,
    header: ({ column }) => (
      <SortableHeader column={column} label="Grad Year" />
    ),
    cell: ({ row }) => {
      const year = row.original.membership.graduationYear;
      if (!year) {
        return <span className="text-muted-foreground">—</span>;
      }
      return <span className="text-sm tabular-nums">{year}</span>;
    },
  },
];

// ─── Column builder ───────────────────────────────────────────────────────────

/**
 * Build the full column list for a team based on its type.
 * Inserts the team-specific columns between name and status.
 */
export function buildAthleteColumns(
  teamType: "club" | "high_school" | "college" | "masters"
): ColumnDef<TeamAthleteRow>[] {
  const isHs = teamType === "high_school" || teamType === "college";
  const teamCols = isHs ? hsAthleteColumns : clubAthleteColumns;

  // Insert team-specific columns after gender, before age
  const [select, name, gender, ...rest] = baseAthleteColumns;
  return [select!, name!, gender!, ...teamCols, ...rest];
}
