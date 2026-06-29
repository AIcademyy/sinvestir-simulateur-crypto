import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Lazily creates a Supabase server client from env vars. Returns null when
 * unconfigured so the app keeps working (no persistence, no crash) on a
 * fresh deploy that hasn't set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY yet.
 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  client = url && key ? createClient(url, key) : null;
  return client;
}
