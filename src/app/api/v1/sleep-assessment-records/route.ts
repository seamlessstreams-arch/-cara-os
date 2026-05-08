import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  const data = childId
    ? db.sleepAssessmentRecords.getByChild(childId)
    : db.sleepAssessmentRecords.getAll();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.sleepAssessmentRecords.create(body);
  return NextResponse.json(record, { status: 201 });
}
