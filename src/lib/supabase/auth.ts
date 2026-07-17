/**
 * Server-side Supabase session resolver for API routes.
 *
 * Extracts the authenticated user from the request's cookie-based session
 * (set by the middleware), then resolves their staff_members record using the
 * service-role client (bypasses RLS for the lookup).
 *
 * SECURITY NOTES:
 *   • getClaims() validates the JWT signature — we never trust client claims.
 *   • We look up auth_user_id in staff_members to get the canonical staff ID;
 *     we never trust user-supplied staff IDs for authorization decisions.
 *   • app_metadata / raw_user_meta_data are NOT used — authorization is based
 *     solely on the staff_members row resolved from auth.uid().
 *   • The SUPABASE_SERVICE_ROLE_KEY is never sent to the browser.
 *
 * ONLY import this file in:
 *   - app/api/** route handlers
 *   - Server Components / Server Actions
 */

import { createServerClient as createSSRClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { isSupabaseEnabled, createServerClient } from "./server";

export interface SupabaseStaffSession {
  /** staff_members.id — use as actor_staff_id in audit logs */
  userId: string;
  /** Staff role from staff_members.role */
  role: string;
  /** home_id UUID from staff_members.home_id */
  homeId: string;
}

/**
 * Resolve the authenticated staff member from a NextRequest.
 *
 * Returns null when:
 *   - Supabase is not configured (demo / local mode)
 *   - The request carries no valid session cookie
 *   - The auth user has no matching staff_members row
 */
export async function resolveStaffSession(
  req: NextRequest
): Promise<SupabaseStaffSession | null> {
  if (!isSupabaseEnabled()) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Support both the new "publishable key" and legacy "anon key" naming — the
  // SAME fallback client.ts uses. Without it, a deployment configured with only
  // the anon key signs in fine in the browser and then fails session resolution
  // on every API call: a 401 loop that looks like broken auth.
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) return null;

  // Create an SSR client that reads cookies from the incoming request.
  // We don't need to write cookies here (read-only session validation).
  const ssrClient = createSSRClient(url, publishableKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll() {
        // No-op: cookie mutations are handled by middleware, not API routes.
      },
    },
  });

  // getClaims() verifies the JWT and returns decoded claims without a network
  // round-trip (the JWT is validated locally using the project's JWT secret).
  const { data } = await ssrClient.auth.getClaims();
  const authUserId = data?.claims?.sub;
  if (!authUserId) return null;

  // Use the service-role client to look up the staff record.
  // This bypasses RLS for the staff lookup itself.
  const serviceClient = createServerClient();
  if (!serviceClient) return null;

  const { data: staff, error } = await (serviceClient as any)
    .from("staff_members")
    .select("id, role, home_id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !staff) return null;

  return {
    userId: staff.id,
    role: staff.role,
    homeId: staff.home_id,
  };
}
