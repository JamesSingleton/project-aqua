"use client";

import {
  CLASS_YEAR_LABELS,
  type ClassYear,
} from "@project-aqua/swim-core/team-types";
import { Badge } from "@project-aqua/ui/components/badge";
import { Button } from "@project-aqua/ui/components/button";
import { Checkbox } from "@project-aqua/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@project-aqua/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@project-aqua/ui/components/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CopyIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeSwimmerAction } from "@/app/team/[teamId]/roster/actions";
import type { Athlete } from "@/types";
import { DataTableColumnHeader } from "../data-table-column-header";
import { SwimmerQuickView } from "./swimmer-quick-view";

function statusVariant(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "default" as const;
  if (normalized === "inactive") return "outline" as const;
  return "secondary" as const;
}

function RowActions({ teamId, athlete }: { teamId: string; athlete: Athlete }) {
  const router = useRouter();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const profileHref = `/team/${teamId}/swimmers/${athlete.id}`;
  const editHref = `${profileHref}/edit`;

  function handleRemove() {
    const confirmed = window.confirm(
      `Remove ${athlete.name} from this team's roster?`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      await removeSwimmerAction(teamId, athlete.id);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove from roster"
                disabled={pending}
                onClick={handleRemove}
              />
            }
          >
            <Trash2Icon />
          </TooltipTrigger>
          <TooltipContent>Remove from roster</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quick view"
                onClick={() => setQuickViewOpen(true)}
              />
            }
          >
            <EyeIcon />
          </TooltipTrigger>
          <TooltipContent>Quick view</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="More actions"
                disabled={pending}
              />
            }
          >
            <EllipsisVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem
                nativeButton={false}
                render={<Link href={editHref} />}
              >
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                nativeButton={false}
                render={<Link href={profileHref} />}
              >
                <UserRoundIcon />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickViewOpen(true)}>
                <EyeIcon />
                Quick view
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(athlete.id)}
              >
                <CopyIcon />
                Copy swimmer ID
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleRemove}
                disabled={pending}
              >
                <Trash2Icon />
                Remove from roster
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SwimmerQuickView
        teamId={teamId}
        athlete={athlete}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </>
  );
}

function nameSearchFilter(
  row: { original: Athlete },
  _columnId: string,
  value: unknown,
) {
  const q = String(value).toLowerCase().trim();
  if (!q) return true;
  const haystack = [
    row.original.firstName,
    row.original.lastName,
    row.original.preferredName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function columns(
  teamId: string,
  options: { showClassYear?: boolean } = {},
): ColumnDef<Athlete>[] {
  const { showClassYear = false } = options;

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="First Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.preferredName || row.original.firstName}
        </span>
      ),
      filterFn: nameSearchFilter,
      enableHiding: false,
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.lastName}</span>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "gender",
      meta: { label: "Gender" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Gender" />
      ),
      cell: ({ row }) => (
        <span title={row.original.gender}>
          {row.original.gender === "Male" ? "M" : "F"}
        </span>
      ),
    },
    {
      accessorKey: "dateOfBirth",
      meta: { label: "Birthday" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Birthday" />
      ),
      cell: ({ row }) =>
        row.original.dateOfBirth
          ? new Date(row.original.dateOfBirth).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—",
    },
    {
      accessorKey: "age",
      meta: { label: "Age" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Age" />
      ),
    },
    ...(showClassYear
      ? [
          {
            accessorKey: "classYear",
            meta: { label: "Class" },
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Class" />
            ),
            cell: ({ row }) => {
              const year = row.original.classYear;
              if (!year) return "—";
              const label = CLASS_YEAR_LABELS[year as ClassYear];
              return label ? `${year} · ${label}` : year;
            },
          } satisfies ColumnDef<Athlete>,
        ]
      : []),
    {
      accessorKey: "trainingGroup",
      meta: { label: "Training Group" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Training Group" />
      ),
      cell: ({ row }) => row.original.trainingGroup || "—",
    },
    {
      accessorKey: "usaId",
      meta: { label: "USA ID" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="USA ID" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.usaId || "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge
          variant={statusVariant(row.original.status)}
          className="capitalize"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <RowActions teamId={teamId} athlete={row.original} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
