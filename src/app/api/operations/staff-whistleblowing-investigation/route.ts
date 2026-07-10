import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/permissions";
import { requireSensitiveAccess } from "@/lib/permissions/sensitive-access";
import {
  listStaffWhistleblowingInvestigations,
  createStaffWhistleblowingInvestigation,
} from "@/lib/services/staff-whistleblowing-investigation-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";

  const guard = await requireSensitiveAccess(request, PERMISSIONS.VIEW_WHISTLEBLOWING, { entityType: "whistleblowing_investigation", homeId });
  if (guard instanceof NextResponse) return guard;

  const result = await listStaffWhistleblowingInvestigations(homeId);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireSensitiveAccess(request, PERMISSIONS.MANAGE_WHISTLEBLOWING, { entityType: "whistleblowing_investigation", action: "update" });
  if (guard instanceof NextResponse) return guard;

  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const result = await createStaffWhistleblowingInvestigation(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
