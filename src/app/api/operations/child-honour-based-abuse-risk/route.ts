import { NextResponse } from "next/server";
import {
  listChildHonourBasedAbuseRisks,
  createChildHonourBasedAbuseRisk,
} from "@/lib/services/child-honour-based-abuse-risk-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listChildHonourBasedAbuseRisks(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createChildHonourBasedAbuseRisk(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
