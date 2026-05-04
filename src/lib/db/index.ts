/**
 * Unified data layer entry point
 *
 * Exports `db` — the same interface whether Supabase is enabled or not.
 *
 * When NEXT_PUBLIC_SUPABASE_ENABLED=true and real credentials are set,
 * all reads/writes go to Supabase.
 *
 * Otherwise, the in-memory store is used (development / demo mode).
 *
 * API routes should:
 *   import { db } from "@/lib/db"
 *   (not @/lib/db/store directly)
 */

export { db } from "./store";

/**
 * Returns the home_id to use for all operations.
 *
 * In production this will be resolved from the authenticated session.
 * During in-memory mode, returns the seed home_id.
 *
 * TODO: Replace with auth session lookup once Supabase Auth is wired.
 */
export function getHomeId(): string {
  return process.env.SEED_HOME_ID ?? "home_oak";
}

/**
 * Returns the home UUID for Supabase queries.
 * This is the fixed UUID used in migration 004.
 */
export function getSupabaseHomeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}
