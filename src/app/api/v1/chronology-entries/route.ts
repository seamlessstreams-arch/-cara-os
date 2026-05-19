import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const data = childId
    ? db.chronology.findByChild(childId)
    : db.chronology.findAll();

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = db.chronology.create(body);
  return NextResponse.json({ data: entry }, { status: 201 });
}
