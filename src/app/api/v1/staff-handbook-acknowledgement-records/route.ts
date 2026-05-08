import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const records = db.staffHandbookAcknowledgementRecords.getAll();
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.staffHandbookAcknowledgementRecords.create(body);
  return NextResponse.json(record, { status: 201 });
}
