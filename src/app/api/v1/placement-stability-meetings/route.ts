import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id") ?? undefined;
  return NextResponse.json({ data: db.placementStabilityMeetings.getAll(childId) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.placementStabilityMeetings.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const record = db.placementStabilityMeetings.update(body.id, body);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}
