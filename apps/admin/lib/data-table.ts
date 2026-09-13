import type { Column, RowData } from "@tanstack/react-table";
import type * as React from "react";
import type { DataTableFeatures } from "@/lib/data-table-features";

export function getColumnPinningStyle<TData extends RowData>({
  column,
  withBorder = false,
}: {
  column: Column<DataTableFeatures, TData>;
  withBorder?: boolean;
}): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const pinnedColumnIds = withBorder
    ? isPinned === "start"
      ? column.table.store.state.columnPinning.start
      : isPinned === "end"
        ? column.table.store.state.columnPinning.end
        : []
    : [];
  const isLastLeftPinnedColumn =
    isPinned === "start" && pinnedColumnIds.at(-1) === column.id;
  const isFirstRightPinnedColumn =
    isPinned === "end" && pinnedColumnIds[0] === column.id;

  return {
    boxShadow: withBorder
      ? isLastLeftPinnedColumn
        ? "-4px 0 4px -4px var(--border) inset"
        : isFirstRightPinnedColumn
          ? "4px 0 4px -4px var(--border) inset"
          : undefined
      : undefined,
    insetInlineStart:
      isPinned === "start" ? `${column.getStart("start")}px` : undefined,
    insetInlineEnd:
      isPinned === "end" ? `${column.getAfter("end")}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? "sticky" : "relative",
    background: isPinned ? "var(--background)" : undefined,
    width: column.getSize(),
    zIndex: isPinned ? 1 : undefined,
  };
}
