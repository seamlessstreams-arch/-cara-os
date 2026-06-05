import { NextRequest, NextResponse } from "next/server";
import { resolveSignInStaff } from "@/lib/attendance/sign-in-service";
import { acknowledgeEmergency, resolveEmergency } from "@/lib/staffing/emergency-service";

export const dynamic = "force-dynamic";

// PATCH /api/v1/emergency/[id] → acknowledge (I'm responding) or resolve an alert.
//   body: { action: "acknowledge" | "resolve" }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = resolveSignInStaff(req.headers);
  const now = new Date().toISOString();

  let body: { action?: "acknowledge" | "resolve" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action === "acknowledge") {
    const updated = acknowledgeEmergency(id, staff.id, staff.name, now);
    if (!updated) return NextResponse.json({ error: "Emergency not found or already resolved" }, { status: 404 });
    return NextResponse.json({ data: updated });
  }
  if (body.action === "resolve") {
    const updated = resolveEmergency(id, staff.id, now);
    if (!updated) return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  }
  return NextResponse.json({ error: "action must be 'acknowledge' or 'resolve'" }, { status: 400 });
}
