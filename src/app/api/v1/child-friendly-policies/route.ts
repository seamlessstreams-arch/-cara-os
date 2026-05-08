import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const data = db.childFriendlyPolicies.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.id) {
    const updated = db.childFriendlyPolicies.update(body.id, body);
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const created = db.childFriendlyPolicies.create(body);
  return NextResponse.json(created, { status: 201 });
}
