// ══════════════════════════════════════════════════════════════════════════════
// CARA — SIGN OUT  (POST /auth/signout)
//
// Ends the Supabase session (cookie-clearing SSR client) and returns to the
// login door. POST-only: sign-out is a state change and must never happen from
// a prefetched link. Demo mode: nothing to end — just redirect.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (isSupabaseEnabled()) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      },
    );
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/auth/login", req.url), { status: 303 });
}
