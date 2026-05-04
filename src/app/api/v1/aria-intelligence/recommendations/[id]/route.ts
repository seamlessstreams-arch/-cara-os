import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const rec = intelligenceDb.ariaRecommendations.findById(id);
  if (!rec) return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
  return NextResponse.json({ data: rec });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const existing = intelligenceDb.ariaRecommendations.findById(id);
  if (!existing) return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });

  const allowed = ["status","task_created","task_id","deadline","assigned_role","priority"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const updated = intelligenceDb.ariaRecommendations.patch(id, patch);
  if (!updated) return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });

  if (body.status === "actioned" || body.status === "task_created") {
    intelligenceDb.ariaAuditTrail.create({
      home_id: updated.home_id,
      user_id: "staff_darren",
      child_id: updated.child_id,
      action_type: "recommendation_actioned",
      source_table: "aria_recommendations",
      source_id: id,
    });
  }

  return NextResponse.json({ data: updated });
}
