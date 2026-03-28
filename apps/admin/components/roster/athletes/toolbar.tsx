"use client";

import type { TeamAthleteRow } from "@project-aqua/database/queries/athlete";
import { Badge } from "@project-aqua/design-system/components/ui/badge";
import { Button } from "@project-aqua/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@project-aqua/design-system/components/ui/dropdown-menu";
import { Input } from "@project-aqua/design-system/components/ui/input";
import type { Table } from "@tanstack/react-table";
import { SlidersHorizontal, X } from "lucide-react";

// ─── Filter option types ──────────────────────────────────────────────────────

interface FilterOption {
  label: string;
  value: string;
}

const STATUS_OPTIONS: FilterOption[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Archived", value: "archived" },
];

const GENDER_OPTIONS: FilterOption[] = [
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
];

const GRADE_OPTIONS: FilterOption[] = [
  { label: "Freshman", value: "FR" },
  { label: "Sophomore", value: "SO" },
  { label: "Junior", value: "JR" },
  { label: "Senior", value: "SR" },
];

// ─── FacetedFilter ────────────────────────────────────────────────────────────
// A dropdown that toggles values in a column's array filter.

function FacetedFilter({
  table,
  columnId,
  title,
  options,
}: {
  table: Table<TeamAthleteRow>;
  columnId: string;
  title: string;
  options: FilterOption[];
}) {
  const column = table.getColumn(columnId);
  if (!column) {
    return null;
  }

  const selected = new Set(
    (column.getFilterValue() as string[] | undefined) ?? []
  );

  function toggle(value: string) {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    column?.setFilterValue(next.size ? [...next] : undefined);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 border-dashed" size="sm" variant="outline">
          {title}
          {selected.size > 0 && (
            <>
              <span className="mx-1 text-muted-foreground">|</span>
              {selected.size <= 2 ? (
                [...selected].map((v) => (
                  <Badge
                    className="ml-1 rounded-sm px-1 font-normal"
                    key={v}
                    variant="secondary"
                  >
                    {options.find((o) => o.value === v)?.label ?? v}
                  </Badge>
                ))
              ) : (
                <Badge
                  className="ml-1 rounded-sm px-1 font-normal"
                  variant="secondary"
                >
                  {selected.size} selected
                </Badge>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
          {title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            checked={selected.has(option.value)}
            key={option.value}
            onCheckedChange={() => toggle(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Column visibility toggle ─────────────────────────────────────────────────

function ColumnToggle({ table }: { table: Table<TeamAthleteRow> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="ml-auto h-8" size="sm" variant="outline">
          <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
          Toggle columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((col) => col.getCanHide())
          .map((col) => (
            <DropdownMenuCheckboxItem
              checked={col.getIsVisible()}
              className="capitalize"
              key={col.id}
              onCheckedChange={(value) => col.toggleVisibility(!!value)}
            >
              {/* Convert camelCase id to readable label */}
              {col.id.replace(/([A-Z])/g, " $1").trim()}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

interface AthletesToolbarProps {
  table: Table<TeamAthleteRow>;
  teamType: "club" | "high_school" | "college" | "masters";
  /** Available training groups for club teams — derived from data */
  trainingGroups?: string[];
}

export function AthletesToolbar({
  table,
  teamType,
  trainingGroups = [],
}: AthletesToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const isHs = teamType === "high_school" || teamType === "college";

  return (
    <div className="flex items-center gap-2">
      {/* Global name search */}
      <Input
        className="h-8 w-56"
        onChange={(e) =>
          table.getColumn("name")?.setFilterValue(e.target.value)
        }
        placeholder="Search athletes..."
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
      />

      {/* Status filter — always shown */}
      <FacetedFilter
        columnId="status"
        options={STATUS_OPTIONS}
        table={table}
        title="Status"
      />

      {/* Gender filter — always shown */}
      <FacetedFilter
        columnId="gender"
        options={GENDER_OPTIONS}
        table={table}
        title="Gender"
      />

      {/* Grade year filter — HS/college teams only */}
      {isHs && (
        <FacetedFilter
          columnId="gradeYear"
          options={GRADE_OPTIONS}
          table={table}
          title="Grade"
        />
      )}

      {/* Training group filter — club teams only, built from actual data */}
      {!isHs && trainingGroups.length > 0 && (
        <FacetedFilter
          columnId="trainingGroup"
          options={trainingGroups.map((g) => ({ label: g, value: g }))}
          table={table}
          title="Group"
        />
      )}

      {/* Clear all filters */}
      {isFiltered && (
        <Button
          className="h-8 px-2"
          onClick={() => table.resetColumnFilters()}
          size="sm"
          variant="ghost"
        >
          Reset
          <X className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      )}

      {/* Column visibility — pushed to the right */}
      <div className="ml-auto">
        <ColumnToggle table={table} />
      </div>
    </div>
  );
}
