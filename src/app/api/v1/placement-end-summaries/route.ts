import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  return NextResponse.json({ data: db.placementEndSummaries.getAll() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.placementEndSummaries.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const record = db.placementEndSummaries.update(body.id, body);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}
