"use client";

import { Button } from "@project-aqua/ui/components/button";
import { Calendar } from "@project-aqua/ui/components/calendar";
import { Input } from "@project-aqua/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@project-aqua/ui/components/popover";
import { cn } from "@project-aqua/ui/lib/utils";
import type { Column, Table } from "@tanstack/react-table";
import { CalendarIcon, XIcon } from "lucide-react";
import * as React from "react";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

export type DateRangeFilterValue = {
  from?: string;
  to?: string;
};

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  /** When false, hides the Columns visibility menu. Defaults to true. */
  showViewOptions?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  showViewOptions = true,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-1",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {isFiltered ? (
          <Button
            type="button"
            aria-label="Reset filters"
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={onReset}
          >
            <XIcon data-icon="inline-start" />
            Reset
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {showViewOptions ? <DataTableViewOptions table={table} /> : null}
      </div>
    </div>
  );
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatRangeLabel(value: DateRangeFilterValue | undefined) {
  if (!value?.from && !value?.to) return null;
  const from = value.from
    ? parseIsoDate(value.from)?.toLocaleDateString()
    : "…";
  const to = value.to ? parseIsoDate(value.to)?.toLocaleDateString() : "…";
  return `${from} – ${to}`;
}

function DataTableDateRangeFilter<TData>({
  column,
}: {
  column: Column<TData, unknown>;
}) {
  const columnMeta = column.columnDef.meta;
  const raw = column.getFilterValue() as DateRangeFilterValue | undefined;
  const selected =
    raw?.from || raw?.to
      ? {
          from: parseIsoDate(raw.from),
          to: parseIsoDate(raw.to),
        }
      : undefined;
  const label = formatRangeLabel(raw);
  const title = columnMeta?.label ?? column.id;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-8 border-dashed", label && "border-solid")}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {label ? (
          <span className="tabular-nums">{label}</span>
        ) : (
          <span>{title}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          onSelect={(range) => {
            if (!range?.from && !range?.to) {
              column.setFilterValue(undefined);
              return;
            }
            column.setFilterValue({
              from: range.from ? formatIsoDate(range.from) : undefined,
              to: range.to ? formatIsoDate(range.to) : undefined,
            } satisfies DateRangeFilterValue);
          }}
        />
        {label ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => column.setFilterValue(undefined)}
            >
              Clear dates
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function DataTableToolbarFilter<TData>({
  column,
}: {
  column: Column<TData, unknown>;
}) {
  const columnMeta = column.columnDef.meta;

  if (!columnMeta?.variant) return null;

  if (columnMeta.variant === "text") {
    return (
      <Input
        placeholder={columnMeta.placeholder ?? columnMeta.label}
        value={(column.getFilterValue() as string) ?? ""}
        onChange={(event) => column.setFilterValue(event.target.value)}
        className="h-8 w-40 lg:w-56"
      />
    );
  }

  if (columnMeta.variant === "select" || columnMeta.variant === "multiSelect") {
    return (
      <DataTableFacetedFilter
        column={column}
        title={columnMeta.label ?? column.id}
        options={columnMeta.options ?? []}
        multiple={columnMeta.variant === "multiSelect"}
      />
    );
  }

  if (columnMeta.variant === "dateRange") {
    return <DataTableDateRangeFilter column={column} />;
  }

  return null;
}
