import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const data = db.externalVisitors.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.id) {
    const updated = db.externalVisitors.update(body.id, body);
    return NextResponse.json({ data: updated });
  }
  const created = db.externalVisitors.create(body);
  return NextResponse.json({ data: created }, { status: 201 });
}
