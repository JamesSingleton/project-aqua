import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./src/keys";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
