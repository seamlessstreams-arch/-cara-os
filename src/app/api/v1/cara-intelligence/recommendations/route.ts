import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { CaraRecommendation, CaraRecommendationType, CaraRecommendationStatus } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const homeId  = searchParams.get("home_id") ?? "home_oak";
  const status  = searchParams.get("status");

  let results = childId
    ? intelligenceDb.caraRecommendations.findByChild(childId)
    : intelligenceDb.caraRecommendations.findAll(homeId);

  if (status) results = results.filter((r) => r.status === status);

  const pending = results.filter((r) => r.status === "pending").length;
  const urgent  = results.filter((r) => r.priority === "urgent" && r.status === "pending").length;

  return NextResponse.json({ data: results, meta: { total: results.length, pending, urgent } });
}

export async function POST(req: NextRequest) {
  let body: Partial<CaraRecommendation>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const required = ["recommendation_type","title","reason"] as const;
  for (const field of required) {
    if (!body[field]) return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
  }

  const rec = intelligenceDb.caraRecommendations.create({
    home_id:             body.home_id ?? "home_oak",
    child_id:            body.child_id,
    source_type:         body.source_type,
    source_id:           body.source_id,
    recommendation_type: body.recommendation_type as CaraRecommendationType,
    title:               body.title!,
    reason:              body.reason!,
    priority:            body.priority ?? "medium",
    deadline:            body.deadline,
    assigned_role:       body.assigned_role,
    task_created:        body.task_created ?? false,
    task_id:             body.task_id,
    status:              (body.status as CaraRecommendationStatus) ?? "pending",
  });

  intelligenceDb.caraAuditTrail.create({
    home_id:      rec.home_id,
    user_id:      "staff_darren",
    child_id:     rec.child_id,
    action_type:  "recommendation_created",
    source_table: "aria_recommendations",
    source_id:    rec.id,
  });

  return NextResponse.json({ data: rec }, { status: 201 });
}
