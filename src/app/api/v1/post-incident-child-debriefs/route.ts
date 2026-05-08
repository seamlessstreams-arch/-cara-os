import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  let records = db.postIncidentChildDebriefs.getAll();
  if (childId) records = records.filter((r) => r.child_id === childId);
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.postIncidentChildDebriefs.create(body);
  return NextResponse.json(record, { status: 201 });
}
