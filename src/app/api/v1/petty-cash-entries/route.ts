import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  return NextResponse.json({ data: db.pettyCashEntries.findAll() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.pettyCashEntries.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const updated = db.pettyCashEntries.update(id, data);
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
