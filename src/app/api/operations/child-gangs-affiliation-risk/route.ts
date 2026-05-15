import { NextResponse } from "next/server";
import {
  listChildGangsAffiliationRisks,
  createChildGangsAffiliationRisk,
} from "@/lib/services/child-gangs-affiliation-risk-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listChildGangsAffiliationRisks(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createChildGangsAffiliationRisk(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
