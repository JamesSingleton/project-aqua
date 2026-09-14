import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { keys } from "./keys";

let client: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key.
 * Never import this module into client components.
 */
export function getStorageClient(): SupabaseClient {
  if (client) return client;

  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } =
    keys();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for storage uploads",
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}
