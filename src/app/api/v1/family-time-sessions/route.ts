import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  const data = childId ? db.familyTimeSessions.findByChild(childId) : db.familyTimeSessions.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.id) {
    const updated = db.familyTimeSessions.update(body.id, body);
    return NextResponse.json({ data: updated });
  }
  const created = db.familyTimeSessions.create(body);
  return NextResponse.json({ data: created }, { status: 201 });
}
