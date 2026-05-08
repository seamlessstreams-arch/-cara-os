import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const records = db.staffGrievanceRecords.getAll();
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.staffGrievanceRecords.create(body);
  return NextResponse.json(record, { status: 201 });
}
