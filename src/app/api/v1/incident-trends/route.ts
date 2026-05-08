import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const data = db.incidentTrends.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.incidentTrends.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
