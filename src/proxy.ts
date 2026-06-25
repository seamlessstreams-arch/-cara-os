// ══════════════════════════════════════════════════════════════════════════════
// CARA — ROOT PROXY (auth session handling)   [Next 16 "proxy" convention]
//
// Demo mode (Supabase NOT configured — the current in-memory deployment):
//   • No-op. Every request passes through unchanged. The app runs on the
//     X-User-Id / X-User-Role header convention, so the demo is unaffected.
//
// Activated mode (Supabase configured):
//   • Refreshes the Supabase auth session (cookie rotation via updateSession)
//     and redirects unauthenticated PAGE requests to /auth/login.
//   • API routes are intentionally excluded from the matcher: they enforce their
//     own per-route guards (requirePermissionAsync) and must return 401/403, not
//     a redirect.
//
// The Supabase check is inlined (not imported from lib/supabase/server) so the
// Edge bundle doesn't pull in the supabase-js service client.
// ══════════════════════════════════════════════════════════════════════════════

import { type NextRequest, NextResponse } from "next/server";

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && !url.includes("placeholder") && !key.includes("placeholder"));
}

export async function proxy(request: NextRequest) {
  // Demo mode: no auth gate. Behaviour identical to before this proxy existed.
  if (!supabaseConfigured()) return NextResponse.next();

  // Activated mode: refresh session + redirect unauthenticated page requests.
  const { updateSession } = await import("@/lib/supabase/middleware");
  return updateSession(request);
}

export const config = {
  // Page routes only. Exclude API (per-route guards handle auth there), Next
  // internals, and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
