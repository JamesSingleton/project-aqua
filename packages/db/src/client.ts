import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/postgres-js";
import postgresClient from "postgres";
import * as schema from "./schema/index";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgresClient> | undefined;
};

const client =
  globalForDb.client ??
  postgresClient(connectionString, {
    prepare: false,
    max: 10,
  });

globalForDb.client = client;

/** Bypass RLS — Better Auth adapter, migrations helpers, system jobs. */
export const dbAdmin = drizzle(client, { schema });

type ReservedSql = Awaited<ReturnType<typeof client.reserve>>;

type RlsStore = {
  userId: string;
  db: typeof dbAdmin;
  reserved: ReservedSql;
};

const rlsStorage = new AsyncLocalStorage<RlsStore>();

function escapeLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * postgres.js `reserve()` returns a scoped tagged-template client without
 * `options`; Drizzle's postgres-js driver requires `options.parsers`.
 */
function drizzleFromReserved(reserved: ReservedSql): typeof dbAdmin {
  const scoped = reserved as ReservedSql & {
    options?: (typeof client)["options"];
  };
  scoped.options = client.options;
  return drizzle(scoped as unknown as typeof client, { schema });
}

/**
 * Bind the current async context to aqua_app + app.user_id for org RLS.
 * Pair with {@link unbindRequestUser} (e.g. Next.js `after()`).
 */
export async function bindRequestUser(userId: string): Promise<void> {
  const existing = rlsStorage.getStore();
  if (existing?.userId === userId) return;
  if (existing) {
    await unbindRequestUser();
  }

  const reserved = await client.reserve();
  try {
    await reserved.unsafe(
      `select set_config('app.user_id', '${escapeLiteral(userId)}', false)`,
    );
    await reserved.unsafe("set role aqua_app");
  } catch (error) {
    reserved.release();
    throw error;
  }

  rlsStorage.enterWith({
    userId,
    db: drizzleFromReserved(reserved),
    reserved,
  });
}

/** Release the reserved RLS connection (call from request `after()`). */
export async function unbindRequestUser(): Promise<void> {
  const store = rlsStorage.getStore();
  if (!store) return;

  try {
    await store.reserved.unsafe("reset role");
    await store.reserved.unsafe("select set_config('app.user_id', '', false)");
  } catch {
    // Connection may already be closed at request end.
  } finally {
    store.reserved.release();
  }
}

export function getRequestUserId(): string | undefined {
  return rlsStorage.getStore()?.userId;
}

/**
 * Run `fn` with org RLS enforced for `userId` (reserved connection).
 * Prefer {@link bindRequestUser} for full Next.js requests.
 */
export async function runAsUser<T>(
  userId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const reserved = await client.reserve();
  try {
    await reserved.unsafe(
      `select set_config('app.user_id', '${escapeLiteral(userId)}', false)`,
    );
    await reserved.unsafe("set role aqua_app");
    const requestDb = drizzleFromReserved(reserved);
    return await rlsStorage.run({ userId, db: requestDb, reserved }, fn);
  } finally {
    try {
      await reserved.unsafe("reset role");
      await reserved.unsafe("select set_config('app.user_id', '', false)");
    } finally {
      reserved.release();
    }
  }
}

function activeDb(): typeof dbAdmin {
  return rlsStorage.getStore()?.db ?? dbAdmin;
}

/**
 * Default DB handle: RLS-bound connection when {@link bindRequestUser} /
 * {@link runAsUser} is active; otherwise bypass (`dbAdmin`).
 */
export const db = new Proxy(dbAdmin, {
  get(_target, prop, receiver) {
    const ctx = activeDb();
    const value = Reflect.get(ctx, prop, receiver);
    return typeof value === "function" ? value.bind(ctx) : value;
  },
}) as typeof dbAdmin;

export type Database = typeof dbAdmin;
