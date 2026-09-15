import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    skipValidation:
      process.env.SKIP_ENV_VALIDATION === "true" ||
      process.env.VITEST === "true",
    emptyStringAsUndefined: true,
    server: {
      DATABASE_URL: z.url().optional(),
      DATABASE_URL_UNPOOLED: z.url().optional(),
      POSTGRES_URL: z.url().optional(),
    },
    runtimeEnv: {
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
      POSTGRES_URL: process.env.POSTGRES_URL,
    },
  });

export function getDatabaseUrl(): string {
  const env = keys();
  const url = env.DATABASE_URL ?? env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL or POSTGRES_URL. Set one in the environment.",
    );
  }
  return url;
}

export function getMigrationDatabaseUrl(): string {
  const env = keys();
  const url = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL ?? env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL_UNPOOLED, DATABASE_URL, or POSTGRES_URL. Run `neon env pull`.",
    );
  }
  return url;
}
