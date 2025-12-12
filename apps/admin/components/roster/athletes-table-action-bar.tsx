"use client";

import { SelectTrigger } from "@radix-ui/react-select";
import type { Table } from "@tanstack/react-table";
import { ArrowUp, CheckCircle2, Download, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@project-aqua/ui/components/select";
import { Separator } from "@project-aqua/ui/components/separator";

import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/data-table/data-table-action-bar";
import { exportTableToCSV } from "@/lib/export";

import { type Athlete, athletes } from "@/db/schema";
import { deleteAthletes, updateAthletes } from "../_lib/actions";

const actions = [
  "update-status",
  "update-priority",
  "export",
  "delete",
] as const;

type Action = (typeof actions)[number];

interface AthletesTableActionBarProps {
  table: Table<Athlete>;
}

export function AthletesTableActionBar({ table }: AthletesTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onAthleteUpdate = React.useCallback(
    ({
      field,
      value,
    }: {
      field: "status" | "priority";
      value: Athlete["status"] | Athlete["priority"];
    }) => {
      setCurrentAction(
        field === "status" ? "update-status" : "update-priority",
      );
      startTransition(async () => {
        const { error } = await updateAthletes({
          ids: rows.map((row) => row.original.id),
          [field]: value,
        });

        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Athletes updated");
      });
    },
    [rows],
  );

  const onAthleteExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
      });
    });
  }, [table]);

  const onAthleteDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      const { error } = await deleteAthletes({
        ids: rows.map((row) => row.original.id),
      });

      if (error) {
        toast.error(error);
        return;
      }
      table.toggleAllRowsSelected(false);
    });
  }, [rows, table]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        <Select
          onValueChange={(value: Athlete["status"]) =>
            onAthleteUpdate({ field: "status", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Update status"
              isPending={getIsActionPending("update-status")}
            >
              <CheckCircle2 />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {athletes.status.enumValues.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value: Athlete["priority"]) =>
            onAthleteUpdate({ field: "priority", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Update priority"
              isPending={getIsActionPending("update-priority")}
            >
              <ArrowUp />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {athletes.priority.enumValues.map((priority) => (
                <SelectItem
                  key={priority}
                  value={priority}
                  className="capitalize"
                >
                  {priority}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <DataTableActionBarAction
          size="icon"
          tooltip="Export athletes"
          isPending={getIsActionPending("export")}
          onClick={onAthleteExport}
        >
          <Download />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="icon"
          tooltip="Delete athletes"
          isPending={getIsActionPending("delete")}
          onClick={onAthleteDelete}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
