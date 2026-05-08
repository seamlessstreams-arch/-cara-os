import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  if (childId) return NextResponse.json(db.sensoryProfileRecords.getByChild(childId));
  return NextResponse.json(db.sensoryProfileRecords.getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.sensoryProfileRecords.create(body);
  return NextResponse.json(record, { status: 201 });
}
