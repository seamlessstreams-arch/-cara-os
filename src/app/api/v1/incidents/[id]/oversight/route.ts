import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { oversight_note, oversight_by } = body;

  if (!oversight_note || !oversight_by) {
    return NextResponse.json({ error: "oversight_note and oversight_by are required" }, { status: 400 });
  }

  const updated = db.incidents.addOversight(id, oversight_note, oversight_by);
  if (!updated) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  // Track time saved (Aria draft used)
  if (body.aria_assisted) {
    // Log Aria-assisted time saving
  }

  return NextResponse.json({ data: updated, message: "Oversight recorded" });
}
