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
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { Athlete } from "@/types";
import type { Option } from "@/types/data-table";
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

export type RosterColumnOptions = {
  showClassYear?: boolean;
  statusOptions?: Option[];
  genderOptions?: Option[];
  groupOptions?: Option[];
  classYearOptions?: Option[];
};

export function columns(
  teamId: string,
  options: RosterColumnOptions = {},
): ColumnDef<Athlete>[] {
  const {
    showClassYear = false,
    statusOptions = [],
    genderOptions = [],
    groupOptions = [],
    classYearOptions = [],
  } = options;

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
      size: 40,
    },
    {
      id: "firstName",
      accessorKey: "firstName",
      meta: {
        label: "Name",
        placeholder: "Filter names…",
        variant: "text",
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="First Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.preferredName || row.original.firstName}
        </span>
      ),
      enableColumnFilter: true,
      enableHiding: false,
    },
    {
      id: "lastName",
      accessorKey: "lastName",
      meta: { label: "Last Name" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.lastName}</span>
      ),
      enableHiding: false,
    },
    {
      id: "gender",
      accessorKey: "gender",
      meta: {
        label: "Gender",
        variant: "multiSelect",
        options: genderOptions,
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Gender" />
      ),
      cell: ({ row }) => (
        <span title={row.original.gender}>
          {row.original.gender === "Male" ? "M" : "F"}
        </span>
      ),
      enableColumnFilter: true,
    },
    {
      id: "dateOfBirth",
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
      id: "age",
      accessorKey: "age",
      meta: { label: "Age" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Age" />
      ),
      enableSorting: false,
    },
    ...(showClassYear
      ? [
          {
            id: "classYear",
            accessorKey: "classYear",
            meta: {
              label: "Class",
              variant: "multiSelect",
              options: classYearOptions,
            },
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Class" />
            ),
            cell: ({ row }) => {
              const year = row.original.classYear;
              if (!year) return "—";
              const label = CLASS_YEAR_LABELS[year as ClassYear];
              return label ? `${year} · ${label}` : year;
            },
            enableColumnFilter: true,
          } satisfies ColumnDef<Athlete>,
        ]
      : []),
    {
      id: "groupId",
      accessorKey: "trainingGroup",
      meta: {
        label: "Group",
        variant: "multiSelect",
        options: groupOptions,
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Training Group" />
      ),
      cell: ({ row }) => row.original.trainingGroup || "—",
      enableColumnFilter: true,
      enableSorting: true,
    },
    {
      id: "usaId",
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
      id: "status",
      accessorKey: "status",
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: statusOptions,
      },
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
      enableColumnFilter: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <RowActions teamId={teamId} athlete={row.original} />,
      enableSorting: false,
      enableHiding: false,
      size: 120,
    },
  ];
}
