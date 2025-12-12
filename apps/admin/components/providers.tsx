"use client";
import { type ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@project-aqua/ui/components/tooltip";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={120}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </TooltipProvider>
    </ThemeProvider>
  );
}
