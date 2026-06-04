import { NextRequest, NextResponse } from "next/server";
import {
  resolveSignInStaff, buildSignInStatus, clockIn, clockOut,
} from "@/lib/attendance/sign-in-service";

export const dynamic = "force-dynamic";

// GET /api/v1/sign-in → the acting staff member's clock-in status + smart briefing
// (their shift, lateness, who else is on shift, staffing level).
export async function GET(req: NextRequest) {
  const staff = resolveSignInStaff(req.headers);
  const now = new Date().toISOString();
  const status = buildSignInStatus(staff.id, now);
  return NextResponse.json({ data: status });
}

// POST /api/v1/sign-in → clock the acting staff member in or out.
//   body: { action: "clock_in" | "clock_out", note?: string }
// Server-side: the subject is always the resolved user — you can only sign yourself
// in/out. No biometrics, no location capture.
export async function POST(req: NextRequest) {
  const staff = resolveSignInStaff(req.headers);
  const now = new Date().toISOString();

  let body: { action?: "clock_in" | "clock_out"; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action === "clock_in") {
    const result = clockIn(staff.id, now, { note: body.note });
    return NextResponse.json({ data: { ...result, status: buildSignInStatus(staff.id, now) } }, { status: 201 });
  }
  if (body.action === "clock_out") {
    const result = clockOut(staff.id, now, { note: body.note });
    if (!result.was_on_shift) {
      return NextResponse.json({ error: "You are not currently clocked in." }, { status: 409 });
    }
    return NextResponse.json({ data: { ...result, status: buildSignInStatus(staff.id, now) } });
  }
  return NextResponse.json({ error: "action must be 'clock_in' or 'clock_out'" }, { status: 400 });
}
