import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** Legacy Stripe helpers — Polar SaaS checkout is validated in `@project-aqua/auth/keys`. */
export const keys = () =>
  createEnv({
    skipValidation:
      process.env.SKIP_ENV_VALIDATION === "true" ||
      process.env.VITEST === "true",
    emptyStringAsUndefined: true,
    server: {
      STRIPE_SECRET_KEY: z.string().optional(),
      STRIPE_WEBHOOK_SECRET: z.string().optional(),
      STRIPE_PRICE_PRO: z.string().optional(),
      STRIPE_PRICE_ENTERPRISE: z.string().optional(),
    },
    client: {
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    },
    runtimeEnv: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
      STRIPE_PRICE_ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  });
