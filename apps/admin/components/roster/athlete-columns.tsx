"use client";

import { Badge } from "@project-aqua/design-system/components/ui/badge";
import { Button } from "@project-aqua/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@project-aqua/design-system/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import Link from "next/link";
import type { Athlete } from "@/types/roster";
import { GENDER_LABEL } from "@/types/roster";

export function getSortIcon(sorted: false | "asc" | "desc") {
  if (sorted === "asc") {
    return <ArrowUpIcon className="h-3 w-3" />;
  }
  if (sorted === "desc") {
    return <ArrowDownIcon className="h-3 w-3" />;
  }
  return <ArrowUpDownIcon className="h-3 w-3 text-muted-foreground/50" />;
}

export function getAthleteColumns(teamId: string): ColumnDef<Athlete>[] {
  return [
    {
      accessorKey: "displayName",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Name
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const athlete = row.original;
        return (
          <div>
            <Link
              className="font-medium hover:underline"
              href={`/team/${teamId}/roster/athletes/${athlete.id}`}
            >
              {athlete.displayName}
            </Link>
            {!athlete.active && (
              <Badge className="ml-2 text-xs" variant="secondary">
                Inactive
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "gender",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Gender
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {GENDER_LABEL[row.getValue("gender") as keyof typeof GENDER_LABEL]}
        </span>
      ),
      filterFn: "equals",
    },
    {
      accessorKey: "age",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Age
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.getValue("age")}</span>
      ),
    },
    {
      accessorKey: "group",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Group
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <Badge className="font-normal text-xs" variant="outline">
          {row.getValue("group")}
        </Badge>
      ),
      filterFn: "equals",
    },
    {
      accessorKey: "preferredStroke",
      header: "Stroke",
      cell: ({ row }) => {
        const stroke = row.getValue("preferredStroke") as string | undefined;
        return stroke ? (
          <span className="text-muted-foreground text-sm">{stroke}</span>
        ) : (
          <span className="text-muted-foreground/40 text-sm">—</span>
        );
      },
    },
    {
      accessorKey: "birthDate",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Date of birth
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const dob = row.getValue("birthDate") as string;
        if (!dob) {
          return <span className="text-muted-foreground">—</span>;
        }
        const [y, m, d] = dob.split("-");
        return (
          <span className="text-muted-foreground text-sm tabular-nums">
            {m}/{d}/{y}
          </span>
        );
      },
    },
    {
      accessorKey: "usaSwimmingId",
      header: "USA Swimming ID",
      cell: ({ row }) => {
        const id = row.getValue("usaSwimmingId") as string | undefined;
        return id ? (
          <span className="font-mono text-muted-foreground text-xs">{id}</span>
        ) : (
          <span className="text-muted-foreground/40 text-sm">—</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const athlete = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8" size="icon" variant="ghost">
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={`/team/${teamId}/roster/athletes/${athlete.id}`}>
                  View profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/team/${teamId}/roster/athletes/${athlete.id}/edit`}
                >
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                {athlete.active ? "Deactivate" : "Reactivate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
