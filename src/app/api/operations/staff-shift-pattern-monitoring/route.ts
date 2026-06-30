import { readJsonBody } from "@/lib/http/read-json";
import { NextResponse } from "next/server";
import { listRecords, createRecord, updateRecord } from "@/lib/services/staff-shift-pattern-monitoring-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("homeId");
  if (!homeId) return NextResponse.json({ ok: false, error: "homeId required" }, { status: 400 });
  const result = await listRecords(homeId, {
    shiftType: (searchParams.get("shiftType") as never) ?? undefined,
    fatigueRisk: (searchParams.get("fatigueRisk") as never) ?? undefined,
    staffingLevel: (searchParams.get("staffingLevel") as never) ?? undefined,
    shiftCompliance: (searchParams.get("shiftCompliance") as never) ?? undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const result = await createRecord(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}

export async function PATCH(req: Request) {
  const __parsed2 = await readJsonBody(req);
  if (!__parsed2.ok) return __parsed2.response;
  const body = __parsed2.data;
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  const result = await updateRecord(id, updates);
  return NextResponse.json(result);
}
