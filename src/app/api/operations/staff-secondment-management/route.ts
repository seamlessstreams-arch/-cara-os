import { NextResponse } from "next/server";
import {
  listStaffSecondmentManagement,
  createStaffSecondmentManagement,
} from "@/lib/services/staff-secondment-management-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listStaffSecondmentManagement(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createStaffSecondmentManagement(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
