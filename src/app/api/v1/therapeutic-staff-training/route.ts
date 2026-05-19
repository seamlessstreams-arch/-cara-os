import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id");
  const data = homeId
    ? db.therapeuticStaffTraining.findByHome(homeId)
    : db.therapeuticStaffTraining.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.therapeuticStaffTraining.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
