import { defineConfig } from "drizzle-kit";
import { getMigrationDatabaseUrl } from "./src/keys";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getMigrationDatabaseUrl(),
  },
});
