import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id");
  const data = homeId
    ? db.homeEmergencyContacts.findByHome(homeId)
    : db.homeEmergencyContacts.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.homeEmergencyContacts.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
