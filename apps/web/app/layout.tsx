import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

import { ThemeProvider } from "@/components/providers";
import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { CTA } from "@/components/cta";

export const metadata: Metadata = {
  title: {
    template: "%s | Project Aqua",
    default: "Project Aqua",
  },
  description:
    "Project Aqua is the all-in-one solution for managing swim teams, tracking stats, registering for events, and setting up meets.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable}`,
          "bg-background overflow-x-hidden",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="container mx-auto px-4 overflow-hidden md:overflow-visible">
            {children}
            <CTA />
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
