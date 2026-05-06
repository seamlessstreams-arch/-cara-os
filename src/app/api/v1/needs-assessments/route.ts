import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  const list = childId ? db.needsAssessments.findByChild(childId) : db.needsAssessments.findAll();
  return NextResponse.json({ data: list, meta: { total: list.length } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.needsAssessments.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
