"use client";

import { Badge } from "@project-aqua/ui/components/badge";
import { Button } from "@project-aqua/ui/components/button";
import { Checkbox } from "@project-aqua/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@project-aqua/ui/components/dialog";
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
import { ClassYearDisplay } from "./class-year-display";
import { SwimmerQuickView } from "./swimmer-quick-view";

function statusVariant(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "default" as const;
  if (normalized === "inactive") return "outline" as const;
  return "secondary" as const;
}

function RowActions({
  teamId,
  athlete,
  showUsaSwimmingId,
}: {
  teamId: string;
  athlete: Athlete;
  showUsaSwimmingId: boolean;
}) {
  const router = useRouter();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const profileHref = `/team/${teamId}/swimmers/${athlete.id}`;
  const editHref = `${profileHref}/edit`;

  function confirmRemove() {
    setError("");
    startTransition(async () => {
      try {
        await removeSwimmerAction(teamId, athlete.id);
        setRemoveOpen(false);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to remove swimmer",
        );
      }
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
                onClick={() => setRemoveOpen(true)}
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
                onClick={() => setRemoveOpen(true)}
                disabled={pending}
              >
                <Trash2Icon />
                Remove from roster
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from roster?</DialogTitle>
            <DialogDescription>
              Remove <strong>{athlete.name}</strong> from this team&apos;s
              roster? Their profile and times stay in the system; they just
              won&apos;t appear on this season&apos;s roster.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={confirmRemove}
            >
              {pending ? "Removing…" : "Remove from roster"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SwimmerQuickView
        teamId={teamId}
        athlete={athlete}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        showUsaSwimmingId={showUsaSwimmingId}
      />
    </>
  );
}

export type RosterColumnOptions = {
  showClassYear?: boolean;
  showUsaSwimmingId?: boolean;
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
    showUsaSwimmingId = true,
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
              return <ClassYearDisplay value={year} />;
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
    ...(showUsaSwimmingId
      ? [
          {
            id: "usaId",
            accessorKey: "usaId",
            meta: { label: "USA ID" },
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="USA ID" />
            ),
            cell: ({ row }) => (
              <span className="font-mono text-xs">
                {row.original.usaId || "—"}
              </span>
            ),
          } satisfies ColumnDef<Athlete>,
        ]
      : []),
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
      cell: ({ row }) => (
        <RowActions
          teamId={teamId}
          athlete={row.original}
          showUsaSwimmingId={showUsaSwimmingId}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 120,
    },
  ];
}
