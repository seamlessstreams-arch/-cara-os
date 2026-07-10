import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/permissions";
import { requireSensitiveAccess } from "@/lib/permissions/sensitive-access";
import {
  listStaffExitInterviews,
  createStaffExitInterview,
} from "@/lib/services/staff-exit-interview-management-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";

  const guard = await requireSensitiveAccess(request, PERMISSIONS.VIEW_STAFF_HR_CONFIDENTIAL, { entityType: "staff_exit_interview", homeId });
  if (guard instanceof NextResponse) return guard;

  const result = await listStaffExitInterviews(homeId);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireSensitiveAccess(request, PERMISSIONS.MANAGE_STAFF_HR_CONFIDENTIAL, { entityType: "staff_exit_interview", action: "update" });
  if (guard instanceof NextResponse) return guard;

  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const result = await createStaffExitInterview(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
