import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const record = intelligenceDb.caraOversight.findById(id);
  if (!record) return NextResponse.json({ error: "Oversight not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const existing = intelligenceDb.caraOversight.findById(id);
  if (!existing) return NextResponse.json({ error: "Oversight not found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  const allowed = ["edited_version","final_version","approval_status","manager_id","quality_rating","approved_at","oversight_style"];
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const updated = intelligenceDb.caraOversight.patch(id, patch);
  if (!updated) return NextResponse.json({ error: "Oversight not found" }, { status: 404 });

  if (body.approval_status === "approved") {
    intelligenceDb.caraAuditTrail.create({
      home_id: updated.home_id,
      user_id: (body.manager_id as string) ?? "staff_darren",
      child_id: updated.child_id,
      action_type: "aria_oversight_approved",
      source_table: "aria_oversight",
      source_id: id,
    });
  }

  return NextResponse.json({ data: updated });
}
