import { NextRequest, NextResponse } from "next/server";
import { resolveSignInStaff } from "@/lib/attendance/sign-in-service";
import { buildWorkforceOversightStatus } from "@/lib/oversight/workforce-oversight-service";

export const dynamic = "force-dynamic";

// GET /api/v1/workforce-oversight[?period=7]
// Read-only management-oversight summary of the workforce engine for the acting
// user's home (attendance/presence, message governance, emergencies, safe staffing).
export async function GET(req: NextRequest) {
  const staff = resolveSignInStaff(req.headers);
  const now = new Date().toISOString();
  const period = Number(req.nextUrl.searchParams.get("period"));
  const periodDays = Number.isFinite(period) && period > 0 ? period : undefined;
  return NextResponse.json({ data: buildWorkforceOversightStatus(staff.home_id, now, periodDays) });
}
