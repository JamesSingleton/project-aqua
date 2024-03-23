import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import clsx from "clsx";
import type { Metadata } from "next";

import { ThemeProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Project Aqua",
  description:
    "Project Aqua is the all-in-one solution for managing swim teams, tracking stats, registering for events, and setting up meets.",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={clsx(
          "min-h-screen font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {modal}
          <div id="modal-root" />
        </ThemeProvider>
      </body>
    </html>
  );
}
