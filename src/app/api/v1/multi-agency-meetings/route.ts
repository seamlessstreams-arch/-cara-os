import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  const data = childId ? db.multiAgencyMeetings.findByChild(childId) : db.multiAgencyMeetings.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.multiAgencyMeetings.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body;
  const record = db.multiAgencyMeetings.update(id, rest);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}
