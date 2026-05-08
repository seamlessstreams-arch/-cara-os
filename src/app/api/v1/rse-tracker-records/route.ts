import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  const data = childId
    ? db.rseTrackerRecords.getByChild(childId)
    : db.rseTrackerRecords.getAll();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.rseTrackerRecords.create(body);
  return NextResponse.json(record, { status: 201 });
}
