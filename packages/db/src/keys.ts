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
    },
    runtimeEnv: {
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    },
  });

export function getDatabaseUrl(): string {
  const url = keys().DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL. Set it with `neon env pull` or the Vercel Neon integration.",
    );
  }
  return url;
}

export function getMigrationDatabaseUrl(): string {
  const env = keys();
  const url = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL_UNPOOLED or DATABASE_URL. Run `neon env pull`.",
    );
  }
  return url;
}
