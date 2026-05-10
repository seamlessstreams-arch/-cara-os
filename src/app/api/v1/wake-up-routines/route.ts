import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  const homeId = req.nextUrl.searchParams.get("home_id");
  const data = childId
    ? db.wakeUpRoutines.findByChild(childId)
    : homeId
    ? db.wakeUpRoutines.findByHome(homeId)
    : db.wakeUpRoutines.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.wakeUpRoutines.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
