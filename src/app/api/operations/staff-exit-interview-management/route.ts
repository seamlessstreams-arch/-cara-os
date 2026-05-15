import { NextResponse } from "next/server";
import {
  listStaffExitInterviews,
  createStaffExitInterview,
} from "@/lib/services/staff-exit-interview-management-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listStaffExitInterviews(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createStaffExitInterview(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
