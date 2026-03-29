"use client";

import { Button } from "@project-aqua/design-system/components/ui/button";
import { fonts } from "@project-aqua/design-system/lib/fonts";
import type NextError from "next/error";

interface GlobalErrorProperties {
  readonly error: NextError & { digest?: string };
  readonly reset: () => void;
}

const GlobalError = ({ error, reset }: GlobalErrorProperties) => {
  return (
    <html className={fonts} lang="en">
      <body>
        <h1>Oops, something went wrong</h1>
        <Button onClick={() => reset()}>Try again</Button>
      </body>
    </html>
  );
};

export default GlobalError;
