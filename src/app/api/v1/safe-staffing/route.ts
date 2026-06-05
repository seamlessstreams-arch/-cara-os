import { NextRequest, NextResponse } from "next/server";
import { resolveSignInStaff } from "@/lib/attendance/sign-in-service";
import { buildSafeStaffingStatus } from "@/lib/staffing/safe-staffing-service";

export const dynamic = "force-dynamic";

// GET /api/v1/safe-staffing → real-time safe-staffing status for the acting user's
// home, computed from who is actually clocked in right now.
export async function GET(req: NextRequest) {
  const staff = resolveSignInStaff(req.headers);
  const now = new Date().toISOString();
  return NextResponse.json({ data: buildSafeStaffingStatus(staff.home_id, now) });
}
