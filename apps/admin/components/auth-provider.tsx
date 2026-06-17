"use client";

import { authClient } from "@project-aqua/auth/client";
import type { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export { authClient };
