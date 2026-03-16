import "@project-aqua/design-system/globals.css";
import { cn } from "@project-aqua/design-system/lib/utils";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/providers";

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
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable}`,
          "overflow-x-hidden bg-background"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <Header />
          <main className="container mx-auto overflow-hidden px-4 md:overflow-visible">
            {children}
            <CTA />
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
