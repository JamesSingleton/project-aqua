"use client";

import type { ThemePreference } from "@project-aqua/db/schema";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

/**
 * Applies the server-persisted theme once on mount so a stale localStorage
 * value from another device/session does not win over the database.
 */
export function ThemeSync({
  serverTheme,
}: {
  serverTheme: ThemePreference | null;
}) {
  const { setTheme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    if (!serverTheme || applied.current) return;
    applied.current = true;
    setTheme(serverTheme);
  }, [serverTheme, setTheme]);

  return null;
}
