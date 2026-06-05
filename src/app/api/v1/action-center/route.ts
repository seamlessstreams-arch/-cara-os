import { NextRequest, NextResponse } from "next/server";
import { resolveSignInStaff } from "@/lib/attendance/sign-in-service";
import { buildActionCenterForStaff } from "@/lib/action-center/action-center-service";

export const dynamic = "force-dynamic";

// GET /api/v1/action-center → the acting user's live action items (emergencies,
// comms acknowledgements, safe-staffing criticals, approvals awaiting sign-off).
export async function GET(req: NextRequest) {
  const staff = resolveSignInStaff(req.headers);
  const now = new Date().toISOString();
  return NextResponse.json({ data: buildActionCenterForStaff(staff.id, staff.home_id, now) });
}
