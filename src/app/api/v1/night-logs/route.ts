import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const list = db.nightLogs.findAll();
  return NextResponse.json({ data: list, meta: { total: list.length } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.nightLogs.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
