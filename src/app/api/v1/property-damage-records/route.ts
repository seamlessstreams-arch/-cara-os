import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  return NextResponse.json(db.propertyDamageRecords.getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.propertyDamageRecords.create(body);
  return NextResponse.json(record, { status: 201 });
}
