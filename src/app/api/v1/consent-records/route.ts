import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  const data = childId
    ? db.consentRecords.findByChild(childId)
    : db.consentRecords.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = body.id
    ? db.consentRecords.update(body.id, body)
    : db.consentRecords.create(body);
  return NextResponse.json({ data: record });
}
