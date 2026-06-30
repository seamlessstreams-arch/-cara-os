import { readJsonBody } from "@/lib/http/read-json";
import { NextResponse } from "next/server";
import { listRecords, createRecord } from "@/lib/services/restorative-justice-practice-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  if (!homeId) return NextResponse.json({ ok: false, error: "homeId required" }, { status: 400 });
  const result = await listRecords(homeId, {
    practiceType: (searchParams.get("practiceType") as never) ?? undefined,
    outcomeLevel: (searchParams.get("outcomeLevel") as never) ?? undefined,
    participationWillingness: (searchParams.get("participationWillingness") as never) ?? undefined,
    relationshipImpact: (searchParams.get("relationshipImpact") as never) ?? undefined,
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
