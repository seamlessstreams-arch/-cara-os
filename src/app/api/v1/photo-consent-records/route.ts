import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id") ?? undefined;
  return NextResponse.json({ data: db.photoConsentRecords.getAll(childId) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.photoConsentRecords.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body;
  const record = db.photoConsentRecords.update(id, rest);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}
