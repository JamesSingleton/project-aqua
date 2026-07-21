import { getSession } from "@project-aqua/auth/session";
import { getUserPreferences } from "@project-aqua/db/queries/preferences";
import type { ThemePreference } from "@project-aqua/db/schema";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";

import "@project-aqua/ui/globals.css";
import { cn } from "@project-aqua/ui/lib/utils";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Project Aqua",
    default: "Project Aqua",
  },
  description:
    "Project Aqua is the all-in-one solution for managing swim teams, tracking stats, registering for events, and setting up meets.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  let defaultTheme: ThemePreference = "dark";
  let serverTheme: ThemePreference | null = null;

  if (session?.user?.id) {
    const prefs = await getUserPreferences(session.user.id);
    defaultTheme = prefs.theme;
    serverTheme = prefs.theme;
  }

  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        GeistSans.variable,
        GeistMono.variable,
        GeistPixelSquare.variable,
      )}
      suppressHydrationWarning
    >
      <body className="overscroll-none bg-background font-sans">
        <Providers defaultTheme={defaultTheme} serverTheme={serverTheme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
