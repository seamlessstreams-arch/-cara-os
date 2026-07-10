import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/permissions";
import { requireSensitiveAccess } from "@/lib/permissions/sensitive-access";
import {
  listStaffPayrollCompliance,
  createStaffPayrollCompliance,
} from "@/lib/services/staff-payroll-compliance-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";

  const guard = await requireSensitiveAccess(request, PERMISSIONS.MANAGE_FINANCE, { entityType: "staff_payroll", homeId });
  if (guard instanceof NextResponse) return guard;

  const result = await listStaffPayrollCompliance(homeId);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireSensitiveAccess(request, PERMISSIONS.MANAGE_FINANCE, { entityType: "staff_payroll", action: "update" });
  if (guard instanceof NextResponse) return guard;

  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const result = await createStaffPayrollCompliance(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
