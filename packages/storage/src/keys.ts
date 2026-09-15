import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    skipValidation:
      process.env.SKIP_ENV_VALIDATION === "true" ||
      process.env.VITEST === "true",
    emptyStringAsUndefined: true,
    server: {
      AWS_ACCESS_KEY_ID: z.string().min(1),
      AWS_SECRET_ACCESS_KEY: z.string().min(1),
      AWS_ENDPOINT_URL_S3: z.url(),
      AWS_REGION: z.string().min(1),
    },
    runtimeEnv: {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3,
      AWS_REGION: process.env.AWS_REGION,
    },
  });
