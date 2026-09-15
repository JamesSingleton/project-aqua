import { drizzle } from "drizzle-orm/postgres-js";
import postgresClient from "postgres";
import { getDatabaseUrl } from "./keys";
import * as schema from "./schema/index";

const connectionString = getDatabaseUrl();

const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgresClient> | undefined;
};

const client =
  globalForDb.client ??
  postgresClient(connectionString, {
    prepare: false,
    max: 25,
    idle_timeout: 20,
    connect_timeout: 10,
  });

globalForDb.client = client;

export const db = drizzle(client, { schema });

export type Database = typeof db;
