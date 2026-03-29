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
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import type { Coach } from "@/types/roster";
import { COACH_ROLE_LABEL } from "@/types/roster";
import { getSortIcon } from "./athlete-columns";

const CERT_CONFIG = {
  current: {
    label: "Current",
    icon: CheckCircle2Icon,
    className: "text-green-600 dark:text-green-400",
    badgeVariant: "outline" as const,
  },
  expiring_soon: {
    label: "Expiring soon",
    icon: ClockIcon,
    className: "text-yellow-600 dark:text-yellow-400",
    badgeVariant: "secondary" as const,
  },
  expired: {
    label: "Expired",
    icon: AlertCircleIcon,
    className: "text-destructive",
    badgeVariant: "destructive" as const,
  },
  unknown: {
    label: "Unknown",
    icon: AlertCircleIcon,
    className: "text-muted-foreground",
    badgeVariant: "outline" as const,
  },
};

const ROLE_BADGE_VARIANT: Record<
  Coach["role"],
  "default" | "secondary" | "outline"
> = {
  head_coach: "default",
  assistant_coach: "secondary",
  volunteer: "outline",
  admin: "outline",
};

export function getCoachColumns(teamId: string): ColumnDef<Coach>[] {
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
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("displayName")}</span>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Role
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as Coach["role"];
        return (
          <Badge
            className="font-normal text-xs"
            variant={ROLE_BADGE_VARIANT[role]}
          >
            {COACH_ROLE_LABEL[role]}
          </Badge>
        );
      },
      filterFn: "equals",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <a
          className="text-muted-foreground text-sm transition-colors hover:text-foreground hover:underline"
          href={`mailto:${row.getValue("email")}`}
        >
          {row.getValue("email")}
        </a>
      ),
    },
    {
      accessorKey: "groups",
      header: "Groups",
      cell: ({ row }) => {
        const groups = row.getValue("groups") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <Badge className="font-normal text-xs" key={g} variant="outline">
                {g}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "certStatus",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          USA-S cert
          {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("certStatus") as Coach["certStatus"];
        const coach = row.original;
        const config = CERT_CONFIG[status];
        const Icon = config.icon;
        return (
          <div>
            <div
              className={`flex items-center gap-1.5 text-sm ${config.className}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{config.label}</span>
            </div>
            {coach.usaSwimmingCertExpiry && (
              <p className="mt-0.5 text-muted-foreground text-xs">
                Expires {coach.usaSwimmingCertExpiry}
              </p>
            )}
          </div>
        );
      },
      filterFn: "equals",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const coach = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8" size="icon" variant="ghost">
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Change role</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                {coach.active ? "Deactivate" : "Reactivate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
