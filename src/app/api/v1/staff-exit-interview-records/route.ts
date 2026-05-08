import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const records = db.staffExitInterviewRecords.getAll();
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.staffExitInterviewRecords.create(body);
  return NextResponse.json(record, { status: 201 });
}
