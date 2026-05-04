import { NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET() {
  const records = intelligenceDb.contactPersons.findAll();
  return NextResponse.json({ data: records });
}

export async function POST(req: Request) {
  const body = await req.json();
  const record = intelligenceDb.contactPersons.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
