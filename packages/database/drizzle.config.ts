import { defineConfig } from "drizzle-kit";

import { keys } from "./keys";

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: keys().DATABASE_URL,
  },
});
