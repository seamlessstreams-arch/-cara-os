// ══════════════════════════════════════════════════════════════════════════════
// CARA — CLIENT-SIDE CURRENT USER (demo identity)
//
// The demo has no login: AuthProvider holds `staff_darren` in React state and
// only writes `cs_user_id` to localStorage when someone switches user via the
// role switcher. So on a FRESH session the sidebar shows a user while
// localStorage is still empty.
//
// Callers that read localStorage directly and then omit `x-user-id` when it's
// missing silently lose their identity on exactly that first visit, and the
// routes that require the header answer 400/403 — the feature looks broken to
// a first-time visitor and works for everyone who has ever switched user.
//
// One helper, one default, shared by every caller. Never returns empty.
// ══════════════════════════════════════════════════════════════════════════════

/** The demo's default actor — must match AuthProvider's initial user. */
export const DEMO_DEFAULT_USER_ID = "staff_darren";

/** The current demo user id. Falls back to the default; never empty. */
export function currentUserId(): string {
  if (typeof window === "undefined") return DEMO_DEFAULT_USER_ID;
  try {
    return localStorage.getItem("cs_user_id") || DEMO_DEFAULT_USER_ID;
  } catch {
    // Storage can throw (private mode / blocked cookies) — still identify.
    return DEMO_DEFAULT_USER_ID;
  }
}

/** `x-user-id` header, always populated. Spread into fetch headers. */
export function userIdHeaders(): Record<string, string> {
  return { "x-user-id": currentUserId() };
}
