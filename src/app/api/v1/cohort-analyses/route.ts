import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  return NextResponse.json({ data: db.cohortAnalyses.getAll() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.cohortAnalyses.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body;
  const record = db.cohortAnalyses.update(id, rest);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}
