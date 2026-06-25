import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { CaraSafeguardingFlag, SafeguardingFlagType, SafeguardingFlagSeverity, SafeguardingFlagStatus } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  const homeId  = searchParams.get("home_id") ?? "home_oak";
  const status  = searchParams.get("status");

  let results = childId
    ? intelligenceDb.caraSafeguardingFlags.findByChild(childId)
    : intelligenceDb.caraSafeguardingFlags.findAll(homeId);

  if (status) results = results.filter((f) => f.status === status);

  const open     = results.filter((f) => f.status === "open").length;
  const critical = results.filter((f) => f.severity === "critical").length;

  return NextResponse.json({ data: results, meta: { total: results.length, open, critical } });
}

export async function POST(req: NextRequest) {

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  let body: Partial<CaraSafeguardingFlag>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const required = ["child_id","flag_type","severity","description","recommended_action"] as const;
  for (const field of required) {
    if (!body[field]) return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
  }

  const flag = intelligenceDb.caraSafeguardingFlags.create({
    home_id:            body.home_id ?? "home_oak",
    child_id:           body.child_id!,
    source_type:        body.source_type,
    source_id:          body.source_id,
    flag_type:          body.flag_type as SafeguardingFlagType,
    severity:           body.severity as SafeguardingFlagSeverity,
    description:        body.description!,
    recommended_action: body.recommended_action!,
    reviewed_by:        body.reviewed_by,
    review_outcome:     body.review_outcome,
    status:             (body.status as SafeguardingFlagStatus) ?? "open",
    reviewed_at:        body.reviewed_at,
  });

  // Audit trail
  intelligenceDb.caraAuditTrail.create({
    home_id:      flag.home_id,
    user_id:      "staff_darren",
    child_id:     flag.child_id,
    action_type:  "safeguarding_flag_raised",
    source_table: "cara_safeguarding_flags",
    source_id:    flag.id,
  });

  // Auto-generate management oversight recommendation
  intelligenceDb.caraRecommendations.create({
    home_id:             flag.home_id,
    child_id:            flag.child_id,
    source_type:         "cara_safeguarding_flag",
    source_id:           flag.id,
    recommendation_type: "management_oversight",
    title:               `Manager review required: ${flag.flag_type.replace(/_/g, " ")}`,
    reason:              `A ${flag.severity} severity safeguarding flag has been raised. Manager oversight is required.`,
    priority:            flag.severity === "critical" ? "urgent" : flag.severity === "high" ? "high" : "medium",
    assigned_role:       "registered_manager",
    task_created:        false,
    status:              "pending",
  });

  return NextResponse.json({ data: flag }, { status: 201 });
}
