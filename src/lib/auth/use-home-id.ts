"use client";

import { useAuthContext } from "@/contexts/auth-context";

/**
 * The signed-in user's home, for scoping client reads.
 *
 * Empty string when the session has no home yet — empty means no-home, so a
 * read never falls back to another home's data (and never to the "home_oak"
 * seed, which is nobody on live). The server still assigns the real tenant
 * home (tenantHomeId()) when a request omits home_id, so an empty value here
 * simply defers to the server rather than naming a home the caller isn't in.
 */
export function useHomeId(): string {
  return useAuthContext().currentUser?.home_id ?? "";
}
