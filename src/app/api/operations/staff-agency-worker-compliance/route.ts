import { NextResponse } from "next/server";
import {
  listStaffAgencyWorkerCompliance,
  createStaffAgencyWorkerCompliance,
} from "@/lib/services/staff-agency-worker-compliance-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listStaffAgencyWorkerCompliance(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createStaffAgencyWorkerCompliance(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
