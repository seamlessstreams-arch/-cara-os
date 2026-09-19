// ══════════════════════════════════════════════════════════════════════════════
// CARA — /api/v1/me : who is the caller?
//
// The client had no way to answer this. AuthProvider read a localStorage id
// that only ever holds a DEMO staff id, and when it matched nothing in the live
// staff list it fell through to allStaff[0] — the first row by surname. On a
// real home that silently presents every signed-in user as whoever sorts first,
// and derives their ROLE from that same record.
//
// This is the one endpoint that answers it honestly: the signed-in staff member
// on a live tenant (via the Supabase session → staff_members.auth_user_id), the
// x-user-id header in demo, where there is no login and the role switcher is
// the point. 401 on a live tenant with no valid session — being unable to say
// who you are must fail, not guess.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { isLiveTenant } from "@/lib/db/live-mode";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;

  return NextResponse.json({
    data: {
      userId: identity.userId,
      role: identity.role,
      homeId: identity.homeId,
      // Tells the client whether this identity is session-backed (trustworthy,
      // and not switchable) or the demo's header identity (switchable).
      source: isLiveTenant() ? "session" : "demo",
    },
  });
}
