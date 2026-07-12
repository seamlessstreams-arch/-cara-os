import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { resolveSignInStaff } from "@/lib/attendance/sign-in-service";
import { triggerEmergency } from "@/lib/staffing/emergency-service";
import { EMERGENCY_TYPE_LABEL, type EmergencyType } from "@/lib/staffing/emergency-types";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// GET /api/v1/emergency → active emergency alerts for the acting user's home.
export async function GET(req: NextRequest) {
  const staff = resolveSignInStaff(req.headers);
  return NextResponse.json({ data: db.emergencyAlerts.findActive(staff.home_id) });
}

// POST /api/v1/emergency → raise an emergency (alert + privacy-safe broadcast).
//   body: { type, location?, note? }
export async function POST(req: NextRequest) {
  const staff = resolveSignInStaff(req.headers);
  const now = new Date().toISOString();

  let body: { type?: EmergencyType; location?: string; note?: string };
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.type || !(body.type in EMERGENCY_TYPE_LABEL)) {
    return NextResponse.json({ error: "A valid emergency type is required" }, { status: 400 });
  }

  const result = triggerEmergency(
    {
      homeId: staff.home_id,
      raisedBy: staff.id,
      raisedByName: staff.name,
      type: body.type,
      location: body.location?.trim() || null,
      note: body.note?.trim() || null,
    },
    now,
  );
  return NextResponse.json({ data: result }, { status: 201 });
}
