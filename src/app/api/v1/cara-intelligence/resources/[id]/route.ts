import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const resource = intelligenceDb.childResources.findById(id);
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  return NextResponse.json({ data: resource });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const existing = intelligenceDb.childResources.findById(id);
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const allowed = ["content","printable_html","pdf_url","status","approved_by","approved_at","title","theme","age_range","reading_level","tone"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const updated = intelligenceDb.childResources.patch(id, patch);
  if (!updated) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  if (body.status === "approved") {
    intelligenceDb.caraAuditTrail.create({
      home_id: updated.home_id,
      user_id: (body.approved_by as string) ?? "staff_darren",
      child_id: updated.child_id,
      action_type: "child_resource_approved",
      source_table: "child_resources",
      source_id: id,
    });
  }

  return NextResponse.json({ data: updated });
}
