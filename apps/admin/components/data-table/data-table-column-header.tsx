"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@project-aqua/ui/components/dropdown-menu";
import { cn } from "@project-aqua/ui/lib/utils";
import type { Column, RowData } from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  EyeOffIcon,
  XIcon,
} from "lucide-react";
import type { DataTableFeatures } from "@/lib/data-table-features";

interface DataTableColumnHeaderProps<TData extends RowData, TValue>
  extends React.ComponentProps<"div"> {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 data-open:bg-accent"
            />
          }
        >
          <span>{title}</span>
          {column.getCanSort() ? (
            column.getIsSorted() === "desc" ? (
              <ChevronDownIcon data-icon="inline-end" />
            ) : column.getIsSorted() === "asc" ? (
              <ChevronUpIcon data-icon="inline-end" />
            ) : (
              <ChevronsUpDownIcon data-icon="inline-end" />
            )
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-28">
          {column.getCanSort() ? (
            <>
              <DropdownMenuCheckboxItem
                className="relative pr-8 pl-2 [&_svg]:text-muted-foreground"
                checked={column.getIsSorted() === "asc"}
                onClick={() => column.toggleSorting(false)}
              >
                <ChevronUpIcon />
                Asc
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="relative pr-8 pl-2 [&_svg]:text-muted-foreground"
                checked={column.getIsSorted() === "desc"}
                onClick={() => column.toggleSorting(true)}
              >
                <ChevronDownIcon />
                Desc
              </DropdownMenuCheckboxItem>
              {column.getIsSorted() ? (
                <DropdownMenuItem
                  className="pl-2 [&_svg]:text-muted-foreground"
                  onClick={() => column.clearSorting()}
                >
                  <XIcon />
                  Reset
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
          {column.getCanHide() ? (
            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&_svg]:text-muted-foreground"
              checked={!column.getIsVisible()}
              onClick={() => column.toggleVisibility(false)}
            >
              <EyeOffIcon />
              Hide
            </DropdownMenuCheckboxItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
