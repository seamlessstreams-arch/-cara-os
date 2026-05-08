import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  const list = childId ? db.medicationAuditRecords.findByChild(childId) : db.medicationAuditRecords.findAll();
  return NextResponse.json({ data: list, meta: { total: list.length } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.medicationAuditRecords.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body;
  const updated = db.medicationAuditRecords.update(id, rest);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
