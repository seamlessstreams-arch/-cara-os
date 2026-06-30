import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { listRecords, createRecord, updateRecord } from "@/lib/services/advocacy-representation-service";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("homeId");
  if (!homeId) return NextResponse.json({ ok: false, error: "homeId required" }, { status: 400 });
  const result = await listRecords(homeId, {
    advocacyType: req.nextUrl.searchParams.get("advocacyType") as never,
    representationQuality: req.nextUrl.searchParams.get("representationQuality") as never,
    childSatisfaction: req.nextUrl.searchParams.get("childSatisfaction") as never,
    outcomeEffectiveness: req.nextUrl.searchParams.get("outcomeEffectiveness") as never,
    limit: req.nextUrl.searchParams.get("limit") ? Number(req.nextUrl.searchParams.get("limit")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const result = await createRecord(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}

export async function PATCH(req: NextRequest) {
  const __parsed2 = await readJsonBody(req);
  if (!__parsed2.ok) return __parsed2.response;
  const body = __parsed2.data;
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  const result = await updateRecord(id, updates);
  return NextResponse.json(result);
}
