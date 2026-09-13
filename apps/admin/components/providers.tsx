"use client";
import type { ThemePreference } from "@project-aqua/db/schema";
import { TooltipProvider } from "@project-aqua/ui/components/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";
import { ThemeSync } from "./theme-sync";

export default function Providers({
  children,
  defaultTheme = "dark",
  serverTheme = null,
}: {
  children: ReactNode;
  defaultTheme?: ThemePreference;
  serverTheme?: ThemePreference | null;
}) {
  return (
    <NuqsAdapter>
      <AuthProvider>
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme={defaultTheme}
            enableSystem
            disableTransitionOnChange
          >
            <ThemeSync serverTheme={serverTheme} />
            {children}
          </ThemeProvider>
        </TooltipProvider>
      </AuthProvider>
    </NuqsAdapter>
  );
}
