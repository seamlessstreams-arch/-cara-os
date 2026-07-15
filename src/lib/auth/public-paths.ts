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

/** True when the path belongs to the public marketing site or the auth flow. */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
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
