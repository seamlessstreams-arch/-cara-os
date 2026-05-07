import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  return NextResponse.json({ data: db.bcpScenarios.findAll() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.bcpScenarios.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
