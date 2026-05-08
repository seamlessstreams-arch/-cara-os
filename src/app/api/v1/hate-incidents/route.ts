import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  return NextResponse.json({ data: db.hateIncidents.findAll() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.id) {
    const updated = db.hateIncidents.update(body.id, body);
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(db.hateIncidents.create(body), { status: 201 });
}
