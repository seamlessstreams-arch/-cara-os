import { readJsonBody } from "@/lib/http/read-json";
import { NextResponse } from "next/server";
import {
  listSubstanceMisuseMonitoring,
  createSubstanceMisuseMonitoring,
} from "@/lib/services/substance-misuse-monitoring-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listSubstanceMisuseMonitoring(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const result = await createSubstanceMisuseMonitoring(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
