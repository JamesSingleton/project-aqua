"use client";
import { type ReactNode } from "react";
import { TooltipProvider } from "@repo/ui/tooltip";
import { ThemeProvider } from "./theme-provider";
import { SearchProvider } from "@/lib/search-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SearchProvider>{children}</SearchProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
}
