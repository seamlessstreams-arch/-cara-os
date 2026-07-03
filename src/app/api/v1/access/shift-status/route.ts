import { NextRequest, NextResponse } from "next/server";
import { buildShiftAccessOverview } from "@/lib/permissions/shift-enforcement";
import { getRequestIdentity } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

// GET /api/v1/access/shift-status[?preview=1]
//
// Runs the REAL permission engine for the acting user against the shift-sensitive
// operational capabilities, and reports what they can/can't do right now. Reflects
// whether shift-based enforcement is live (the SHIFT_BASED_ACCESS_ENFORCED flag).
//
// ?preview=1 computes the result as if enforcement were ON (display-only) so a
// manager can see exactly what general staff would lose off shift BEFORE enabling
// the flag. Preview never changes real access.
export async function GET(req: NextRequest) {
  // Report the ACTING user's own shift-access — identity from the session in
  // activated mode (401 if none), header in demo. No cross-user enumeration.
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const preview = req.nextUrl.searchParams.get("preview") === "1";
  const overview = buildShiftAccessOverview(identity.userId, { preview });
  return NextResponse.json({ data: overview });
}
