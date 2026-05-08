import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  const data = childId ? db.onlineSafetyAgreements.findByChild(childId) : db.onlineSafetyAgreements.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.onlineSafetyAgreements.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const updated = db.onlineSafetyAgreements.update(id, data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
