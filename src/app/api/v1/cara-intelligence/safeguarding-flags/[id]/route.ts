import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const flag = intelligenceDb.caraSafeguardingFlags.findById(id);
  if (!flag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  return NextResponse.json({ data: flag });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const existing = intelligenceDb.caraSafeguardingFlags.findById(id);
  if (!existing) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

  const allowed = ["status","reviewed_by","reviewed_at","review_outcome"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const updated = intelligenceDb.caraSafeguardingFlags.patch(id, patch);
  if (!updated) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

  if (body.status === "reviewed" || body.status === "escalated" || body.status === "closed") {
    intelligenceDb.caraAuditTrail.create({
      home_id: updated.home_id,
      user_id: (body.reviewed_by as string) ?? "staff_darren",
      child_id: updated.child_id,
      action_type: "safeguarding_flag_reviewed",
      source_table: "aria_safeguarding_flags",
      source_id: id,
    });
  }

  return NextResponse.json({ data: updated });
}
