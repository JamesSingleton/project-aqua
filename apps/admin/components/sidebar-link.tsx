"use client";

import Link from "next/link";

/**
 * Persistent sidebar chrome has many in-viewport links. Skip prefetching every
 * team route on load; full-prefetch the destination on hover or focus.
 */
export function SidebarLink({
  onFocus,
  onMouseEnter,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      prefetch={false}
      onFocus={(event) => {
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
      }}
    />
  );
}
