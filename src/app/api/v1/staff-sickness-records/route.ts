import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  return NextResponse.json(db.staffSicknessRecords.getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.staffSicknessRecords.create(body);
  return NextResponse.json(record, { status: 201 });
}
