import { NextRequest, NextResponse } from "next/server";
import { resolveSignInStaff } from "@/lib/attendance/sign-in-service";
import { buildWorkforceEvidencePackForHome } from "@/lib/oversight/workforce-oversight-service";

export const dynamic = "force-dynamic";

// GET /api/v1/workforce-oversight/evidence[?period=7]
// Audit-ready, inspector-facing evidence pack assembling what the workforce engine
// captured. Read-only.
export async function GET(req: NextRequest) {
  const staff = resolveSignInStaff(req.headers);
  const now = new Date().toISOString();
  const period = Number(req.nextUrl.searchParams.get("period"));
  const periodDays = Number.isFinite(period) && period > 0 ? period : undefined;
  return NextResponse.json({ data: buildWorkforceEvidencePackForHome(staff.home_id, now, periodDays) });
}
