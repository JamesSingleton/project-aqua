"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { Separator } from "@project-aqua/ui/components/separator";
import type { Table } from "@tanstack/react-table";
import { DownloadIcon, Trash2Icon, UsersIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  exportRosterCsvAction,
  removeSwimmersAction,
} from "@/app/team/[teamId]/roster/actions";
import { assignGroupsBulkAction } from "@/app/team/[teamId]/roster/groups-actions";
import type { Athlete } from "@/types";

type GroupOption = { id: string; name: string };

const UNASSIGNED = "__unassigned__";

export function RosterActionBar({
  table,
  teamId,
  groups,
}: {
  table: Table<Athlete>;
  teamId: string;
  groups: GroupOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [targetGroupId, setTargetGroupId] = useState(
    groups[0]?.id ?? UNASSIGNED,
  );
  const rows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = rows.length;

  if (selectedCount === 0) return null;

  const swimmerIds = rows.map((row) => row.original.id);
  const membershipIds = rows.map((row) => row.original.membershipId);

  function clearSelection() {
    table.toggleAllRowsSelected(false);
  }

  function handleRemove() {
    const confirmed = window.confirm(
      `Remove ${selectedCount} swimmer${selectedCount === 1 ? "" : "s"} from this team's roster?`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      await removeSwimmersAction(teamId, swimmerIds);
      clearSelection();
      router.refresh();
    });
  }

  function handleExport() {
    startTransition(async () => {
      const csv = await exportRosterCsvAction(teamId, { swimmerIds });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "roster-selection.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleAssign() {
    startTransition(async () => {
      await assignGroupsBulkAction(
        teamId,
        membershipIds,
        targetGroupId === UNASSIGNED ? null : targetGroupId,
      );
      clearSelection();
      router.refresh();
    });
  }

  const groupItems = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...groups.map((group) => ({ value: group.id, label: group.name })),
  ];

  return (
    <div
      role="toolbar"
      aria-label="Bulk swimmer actions"
      className="bg-card fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center gap-2 rounded-lg border px-2 py-1.5 shadow-lg"
    >
      <div className="flex items-center gap-1 rounded-sm border px-2 py-1 text-sm font-medium tabular-nums">
        {selectedCount} selected
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear selection"
          onClick={clearSelection}
        >
          <XIcon />
        </Button>
      </div>
      <Separator orientation="vertical" className="hidden h-6 sm:block" />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={handleExport}
      >
        <DownloadIcon data-icon="inline-start" />
        Export
      </Button>
      <div className="flex items-center gap-1.5">
        <Select
          items={groupItems}
          value={targetGroupId}
          onValueChange={(value) => {
            if (value != null) setTargetGroupId(value);
          }}
        >
          <SelectTrigger className="h-8 w-40" size="sm">
            <SelectValue placeholder="Assign group" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {groupItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={
            pending || (groups.length === 0 && targetGroupId !== UNASSIGNED)
          }
          onClick={handleAssign}
        >
          <UsersIcon data-icon="inline-start" />
          Assign
        </Button>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={handleRemove}
      >
        <Trash2Icon data-icon="inline-start" />
        Remove
      </Button>
    </div>
  );
}
