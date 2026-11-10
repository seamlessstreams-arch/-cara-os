// ─────────────────────────────────────────────────────────────────────────────
// Who and where an /api/intelligence request acts for.
//
// The intelligence routes used to take the home and the acting staff member
// from the request: `?homeId=` on reads, `homeId` / `actorUserId` /
// `actorRole` in the body on writes. The pages send the demo home's slug,
// "oak-house". On the live tenant every one of these tables keys `home_id`
// as a uuid, so Postgres rejected the slug (22P02) and the route answered
// "… could not be loaded: the storage request failed." Reads with the slug
// failed, every write failed (no Linked Record had ever saved on live), and
// the intelligence audit entries written alongside them failed too.
//
// Trusting the request for identity is also wrong in itself: the audit trail
// would record whatever actor and role the browser claimed.
//
// So, the rule the Regulation 44 routes already follow, in one place:
//   • Live (Supabase enabled): the home and the actor come from the signed-in
//     session. Anything the request says about either is ignored.
//   • Demo (in-memory fallback store): the query/body convention is kept
//     exactly as it was, so nothing changes there.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { isSupabaseEnabled } from "@/lib/supabase/server";

export interface IntelligenceScope {
  /** Live: the session's home (uuid). Demo: the home the request named, or null. */
  homeId: string | null;
  /** Live: the session's user. Demo: the actor the request named, or null. */
  actorUserId: string | null;
  /** Live: the session's role. Demo: the role the request named, or null. */
  actorRole: string | null;
  live: boolean;
}

/** What the request itself claims — honoured in demo mode only. */
export interface RequestedScope {
  homeId?: unknown;
  actorUserId?: unknown;
  actorRole?: unknown;
}

const named = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v : null;

/**
 * Resolve the scope for one request. Returns a NextResponse to send back as-is
 * when the session cannot act: 401 without a session, 403 when the signed-in
 * staff record has no home assigned.
 */
export async function intelligenceScope(
  request: NextRequest,
  requested?: RequestedScope | null,
): Promise<IntelligenceScope | NextResponse> {
  if (isSupabaseEnabled()) {
    const identity = await getRequestIdentity(request);
    if (identity instanceof NextResponse) return identity;
    if (!identity.homeId) {
      return NextResponse.json(
        { error: "Your staff record has no home assigned." },
        { status: 403 },
      );
    }
    return {
      homeId: identity.homeId,
      actorUserId: named(identity.userId),
      actorRole: named(identity.role),
      live: true,
    };
  }

  return {
    homeId: named(requested?.homeId),
    actorUserId: named(requested?.actorUserId),
    actorRole: named(requested?.actorRole),
    live: false,
  };
}
