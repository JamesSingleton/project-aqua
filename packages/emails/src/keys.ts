import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    skipValidation:
      process.env.SKIP_ENV_VALIDATION === "true" ||
      process.env.VITEST === "true",
    emptyStringAsUndefined: true,
    server: {
      RESEND_API_KEY: z.string().optional(),
      EMAIL_FROM: z.string().optional(),
    },
    runtimeEnv: {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
    },
  });
