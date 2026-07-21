// ══════════════════════════════════════════════════════════════════════════════
// CARA — PUBLIC PATH REGISTRY
// The marketing site stays public even when Supabase auth is activated: the
// proxy gate consults this before redirecting to /auth/login. Pure and
// unit-tested — a wrong entry here either locks visitors out of the brochure
// or opens a platform page, so the list is explicit (no clever patterns).
// ══════════════════════════════════════════════════════════════════════════════

const PUBLIC_EXACT = new Set([
  "/",
  "/about",
  "/contact",
  "/pricing",
  "/privacy",
  "/security",
  "/terms",
]);

const PUBLIC_PREFIXES = ["/product/", "/auth/", "/login"];

/**
 * API endpoints that stay reachable without a session, each for a stated
 * reason. Deliberately a tiny exact-match list, never a prefix: a prefix here
 * would silently open every future route beneath it.
 *
 *  · health-check — how deployments are verified and how uptime monitoring
 *    polls; it reports build/status only, never records.
 *  · cron        — invoked by Vercel's scheduler, which cannot carry a user
 *    session; it authenticates itself with CARA_CRON_ENABLED + its own secret.
 */
const PUBLIC_API_EXACT = new Set([
  "/api/v1/health-check",
  "/api/cron",
]);

/** True for any API path (used to answer 401 rather than redirect). */
export function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

/** True when the path belongs to the public marketing site or the auth flow. */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_API_EXACT.has(pathname)) return true;
  // API paths are otherwise ALWAYS gated. This must be checked before the
  // prefix list below, or a future prefix could accidentally cover /api/*.
  if (isApiPath(pathname)) return false;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Validate a post-login redirect target. Only same-origin relative paths are
 * allowed — anything absolute, protocol-relative or outside the app falls
 * back to the dashboard. Prevents open redirects via ?next=.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/dashboard";
  if (next.startsWith("/auth")) return "/dashboard";
  return next;
}
