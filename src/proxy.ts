// ══════════════════════════════════════════════════════════════════════════════
// CARA — ROOT PROXY (auth session handling)   [Next 16 "proxy" convention]
//
// Demo mode (Supabase NOT configured — the current in-memory deployment):
//   • No-op. Every request passes through unchanged. The app runs on the
//     X-User-Id / X-User-Role header convention, so the demo is unaffected.
//
// Activated mode (Supabase configured):
//   • Refreshes the Supabase auth session (cookie rotation via updateSession),
//     redirects unauthenticated PAGE requests to /auth/login, and answers
//     unauthenticated API requests with 401 JSON.
//
// API routes USED to be excluded here, on the stated assumption that "they
// enforce their own per-route guards (requirePermissionAsync)". That assumption
// was false: 376 of 513 /api/v1 route files call no guard at all, so on the
// first live tenant `GET /api/v1/staff` returned 200 with real staff records to
// an unauthenticated caller. Delegating a security invariant to 513 files means
// relying on every one of them — and on every future one — to remember it.
// The matcher now covers /api/* so the gate holds by construction; routes that
// do guard themselves are unaffected (their check simply runs second and
// agrees). The only exceptions are the tiny exact-match list in
// PUBLIC_API_EXACT (health-check, cron), each justified there.
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
  // Pages AND API. Only Next internals and static assets are excluded — those
  // carry no records and must stay fast. `api` is deliberately NOT in this
  // exclusion list any more (see the note above).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
