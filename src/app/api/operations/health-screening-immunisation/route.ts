import { readJsonBody } from "@/lib/http/read-json";
import { NextResponse } from "next/server";
import { listRecords, createRecord } from "@/lib/services/health-screening-immunisation-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  if (!homeId) return NextResponse.json({ ok: false, error: "homeId required" }, { status: 400 });
  const result = await listRecords(homeId, {
    screeningType: (searchParams.get("screeningType") as never) ?? undefined,
    screeningOutcome: (searchParams.get("screeningOutcome") as never) ?? undefined,
    immunisationStatus: (searchParams.get("immunisationStatus") as never) ?? undefined,
    healthRisk: (searchParams.get("healthRisk") as never) ?? undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const result = await createRecord(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
