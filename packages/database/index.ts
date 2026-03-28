import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { keys } from "./keys";

const client = postgres(keys().DATABASE_URL);
export const database = drizzle({ client, casing: "snake_case" });
