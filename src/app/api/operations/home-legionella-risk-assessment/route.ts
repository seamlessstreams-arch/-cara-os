import { NextResponse } from "next/server";
import {
  listHomeLegionellaRiskAssessments,
  createHomeLegionellaRiskAssessment,
} from "@/lib/services/home-legionella-risk-assessment-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listHomeLegionellaRiskAssessments(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createHomeLegionellaRiskAssessment(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
