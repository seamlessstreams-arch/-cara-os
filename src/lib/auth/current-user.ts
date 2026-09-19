// ══════════════════════════════════════════════════════════════════════════════
// CARA — CLIENT-SIDE CURRENT USER
//
// Two tenancies, two answers, one helper.
//
// DEMO: there is no login. AuthProvider starts on `staff_darren` and only
// writes `cs_user_id` to localStorage when someone switches user via the role
// switcher, so on a FRESH session the sidebar shows a user while localStorage
// is still empty. Callers that read localStorage directly and then omit
// `x-user-id` when it's missing silently lose their identity on exactly that
// first visit, and the routes that require the header answer 400/403 — broken
// for a first-time visitor, fine for anyone who has ever switched user.
//
// LIVE: the demo id names nobody. It matched no row in a real home's
// staff_members, and AuthProvider used to fall through to allStaff[0] — the
// first staff member by surname — so every signed-in user was presented as
// that person, with that person's ROLE driving the UI's permission gates, and
// every `x-user-id` header carried the demo id into the audit trail. The
// session is the only trustworthy answer, and only the server can read it.
//
// So: AuthProvider resolves /api/v1/me once and calls setSessionUserId() with
// what comes back. Until it does, this returns the demo default — which is
// correct in demo and merely unresolved-yet in live, where the routes that
// matter read the session themselves and ignore the header entirely.
//
// Kept SYNCHRONOUS deliberately: ~30 call sites spread across pages, hooks and
// event handlers, most of them building a fetch header. Making it async would
// turn a one-line fix into a refactor of all of them.
// ══════════════════════════════════════════════════════════════════════════════

/** The demo's default actor — must match AuthProvider's initial user. */
export const DEMO_DEFAULT_USER_ID = "staff_darren";

/** Resolved from /api/v1/me by AuthProvider. Null until that lands. */
let sessionUserId: string | null = null;

/** Set by AuthProvider once the session identity is known. Pass null to clear
 *  (sign-out, or a failed resolve) so nothing keeps acting as the last user. */
export function setSessionUserId(id: string | null): void {
  sessionUserId = id && id.trim() ? id : null;
}

/** True once a session-backed identity is in hand. */
export function hasSessionUserId(): boolean {
  return sessionUserId !== null;
}

/** The current user id: the session's on a live tenant once resolved, the demo
 *  switcher's otherwise. Never empty. */
export function currentUserId(): string {
  if (sessionUserId) return sessionUserId;
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
