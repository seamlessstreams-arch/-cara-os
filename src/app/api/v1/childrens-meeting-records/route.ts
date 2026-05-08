import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const data = db.childrensMeetingRecords.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.id) {
    const updated = db.childrensMeetingRecords.update(body.id, body);
    return updated ? NextResponse.json({ data: updated }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const created = db.childrensMeetingRecords.create(body);
  return NextResponse.json({ data: created }, { status: 201 });
}
