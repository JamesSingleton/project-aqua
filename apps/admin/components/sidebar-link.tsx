"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Persistent sidebar chrome has many in-viewport links. Skip prefetching every
 * team route on load; full-prefetch the destination on hover or focus.
 */
export function SidebarLink({
  onFocus,
  onMouseEnter,
  ...props
}: React.ComponentProps<typeof Link>) {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      prefetch={active}
      onFocus={(event) => {
        setActive(true);
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        setActive(true);
        onMouseEnter?.(event);
      }}
    />
  );
}
