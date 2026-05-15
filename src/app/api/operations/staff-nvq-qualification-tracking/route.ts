import { NextResponse } from "next/server";
import {
  listStaffNvqQualificationTracking,
  createStaffNvqQualificationTracking,
} from "@/lib/services/staff-nvq-qualification-tracking-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listStaffNvqQualificationTracking(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createStaffNvqQualificationTracking(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
