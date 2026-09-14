import { keys as auth } from "@project-aqua/auth/keys";
import { keys as billing } from "@project-aqua/billing/keys";
import { keys as database } from "@project-aqua/db/keys";
import { keys as email } from "@project-aqua/emails/keys";
import { keys as storage } from "@project-aqua/storage/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Composed env for the admin app. Import from `next.config` so missing
 * required vars fail the Vercel build instead of soft-defaulting at runtime.
 */
export const env = createEnv({
  skipValidation:
    process.env.SKIP_ENV_VALIDATION === "true" || process.env.VITEST === "true",
  emptyStringAsUndefined: true,
  extends: [auth(), billing(), database(), email(), storage()],
  server: {
    OPENAI_API_KEY: z.string().optional(),
    USA_SWIMMING_VENDOR_THUMBPRINT: z.string().optional(),
    USA_SWIMMING_API_URL: z.url().optional(),
  },
  client: {
    NEXT_PUBLIC_MARKETING_URL: z.url().optional(),
  },
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    USA_SWIMMING_VENDOR_THUMBPRINT: process.env.USA_SWIMMING_VENDOR_THUMBPRINT,
    USA_SWIMMING_API_URL: process.env.USA_SWIMMING_API_URL,
    NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL,
  },
});
