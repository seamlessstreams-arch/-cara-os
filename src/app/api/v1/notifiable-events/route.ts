import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  let list = db.notifiableEvents.findAll();
  if (childId) list = list.filter((r) => r.child_id === childId);
  return NextResponse.json({ data: list, meta: { total: list.length } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.notifiableEvents.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
