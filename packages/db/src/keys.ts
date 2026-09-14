import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Production: Vercel ↔ Supabase supplies the pooled `POSTGRES_URL`.
 * Local/manual development retains `DATABASE_URL` as a compatibility alias.
 */
export const keys = () =>
  createEnv({
    skipValidation:
      process.env.SKIP_ENV_VALIDATION === "true" ||
      process.env.VITEST === "true",
    emptyStringAsUndefined: true,
    server: {
      POSTGRES_URL: z.url().optional(),
      DATABASE_URL: z.url().optional(),
    },
    runtimeEnv: {
      POSTGRES_URL: process.env.POSTGRES_URL,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });

/** Pooled app/migration connection string. */
export function getDatabaseUrl(): string {
  const env = keys();
  const url = env.POSTGRES_URL ?? env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL or POSTGRES_URL. Set one in the environment.",
    );
  }
  return url;
}
