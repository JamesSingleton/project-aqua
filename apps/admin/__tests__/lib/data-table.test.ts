import type { Column } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { getColumnPinningStyle } from "../../lib/data-table";

function mockColumn(partial: {
  pinned?: false | "left" | "right";
  lastLeft?: boolean;
  firstRight?: boolean;
  start?: number;
  after?: number;
  size?: number;
}): Column<unknown> {
  return {
    getIsPinned: () => partial.pinned ?? false,
    getIsLastColumn: (side: string) =>
      side === "left" ? Boolean(partial.lastLeft) : false,
    getIsFirstColumn: (side: string) =>
      side === "right" ? Boolean(partial.firstRight) : false,
    getStart: () => partial.start ?? 0,
    getAfter: () => partial.after ?? 0,
    getSize: () => partial.size ?? 120,
  } as unknown as Column<unknown>;
}

describe("getColumnPinningStyle", () => {
  it("styles unpinned columns", () => {
    expect(getColumnPinningStyle({ column: mockColumn({}) })).toMatchObject({
      opacity: 1,
      position: "relative",
      width: 120,
    });
  });

  it("styles left-pinned columns with optional border", () => {
    const style = getColumnPinningStyle({
      column: mockColumn({ pinned: "left", lastLeft: true, start: 40 }),
      withBorder: true,
    });
    expect(style.left).toBe("40px");
    expect(style.position).toBe("sticky");
    expect(style.boxShadow).toContain("inset");
  });

  it("styles right-pinned columns with optional border", () => {
    const style = getColumnPinningStyle({
      column: mockColumn({ pinned: "right", firstRight: true, after: 16 }),
      withBorder: true,
    });
    expect(style.right).toBe("16px");
    expect(style.boxShadow).toContain("inset");
  });

  it("omits border shadow when withBorder is false", () => {
    const style = getColumnPinningStyle({
      column: mockColumn({ pinned: "left", lastLeft: true }),
    });
    expect(style.boxShadow).toBeUndefined();
  });

  it("omits border shadow for pinned columns that are not edge-pinned", () => {
    const style = getColumnPinningStyle({
      column: mockColumn({ pinned: "left", lastLeft: false }),
      withBorder: true,
    });
    expect(style.boxShadow).toBeUndefined();
    expect(style.left).toBe("0px");
  });
});

// silence unused if tree-shaken
void vi;
