import { NextResponse } from "next/server";
import { listRecords, createRecord, updateRecord } from "@/lib/services/child-development-milestone-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("homeId");
  if (!homeId) return NextResponse.json({ ok: false, error: "homeId required" }, { status: 400 });
  const result = await listRecords(homeId, {
    developmentalDomain: (searchParams.get("developmentalDomain") as never) ?? undefined,
    achievementStatus: (searchParams.get("achievementStatus") as never) ?? undefined,
    supportLevel: (searchParams.get("supportLevel") as never) ?? undefined,
    progressRating: (searchParams.get("progressRating") as never) ?? undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await createRecord(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  const result = await updateRecord(id, updates);
  return NextResponse.json(result);
}
