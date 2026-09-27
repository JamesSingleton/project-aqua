"use client";

import { authClient } from "@lane4hq/auth/client";
import type { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export { authClient };
