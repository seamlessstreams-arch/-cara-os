import { readJsonBody } from "@/lib/http/read-json";
import { NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET() {
  const records = intelligenceDb.contactPersons.findAll();
  return NextResponse.json({ data: records });
}

export async function POST(req: Request) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const record = intelligenceDb.contactPersons.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
