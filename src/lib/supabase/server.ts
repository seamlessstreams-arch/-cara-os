/**
 * Server-side Supabase client
 *
 * Uses the SERVICE ROLE KEY — bypasses RLS, full access.
 * ONLY import this file in:
 *   - app/api/** route handlers
 *   - Server Components
 *   - Server Actions
 *
 * NEVER import in client components or expose to the browser.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _client: SupabaseClient<Database> | null = null;

export function createServerClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Return null if env vars are missing or still set to placeholders
  if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) {
    return null;
  }

  // Singleton — reuse across requests in the same process
  if (!_client) {
    _client = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _client;
}

/** Returns true when a real Supabase connection is configured */
export function isSupabaseEnabled(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && !url.includes("placeholder") && !key.includes("placeholder"));
}
