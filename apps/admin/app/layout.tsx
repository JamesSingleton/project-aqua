import { Geist } from "next/font/google";

import "@project-aqua/design-system/styles/globals.css";
import { DesignSystemProvider } from "@project-aqua/design-system";
import { fonts } from "@project-aqua/design-system/lib/fonts";
import { cn } from "@project-aqua/design-system/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={cn(fonts, "font-sans", geist.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <DesignSystemProvider>
          {children}
        </DesignSystemProvider>
      </body>
    </html>
  );
}
