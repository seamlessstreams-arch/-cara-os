import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  return NextResponse.json({ data: db.contactDirectoryEntries.findAll() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = body.id
    ? db.contactDirectoryEntries.update(body.id, body)
    : db.contactDirectoryEntries.create(body);
  return NextResponse.json({ data: record });
}
