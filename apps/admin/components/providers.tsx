"use client";
import { type ReactNode } from "react";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { ThemeProvider } from "./theme-provider";
import { SearchProvider } from "@/contexts/search-context";

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
