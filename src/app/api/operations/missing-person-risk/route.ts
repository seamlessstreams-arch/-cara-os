import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  RISK_LEVELS,
  ASSESSMENT_TYPES,
  TRIGGER_PLAN_STATUSES,
  PROTECTIVE_FACTORS,
} from "@/lib/services/missing-person-risk-service";
import type {
  RiskLevel,
  AssessmentType,
  TriggerPlanStatus,
} from "@/lib/services/missing-person-risk-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "risk_levels") return NextResponse.json({ ok: true, data: RISK_LEVELS });
  if (type === "assessment_types") return NextResponse.json({ ok: true, data: ASSESSMENT_TYPES });
  if (type === "trigger_plan_statuses") return NextResponse.json({ ok: true, data: TRIGGER_PLAN_STATUSES });
  if (type === "protective_factors") return NextResponse.json({ ok: true, data: PROTECTIVE_FACTORS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    riskLevel: (searchParams.get("riskLevel") ?? undefined) as RiskLevel | undefined,
    assessmentType: (searchParams.get("assessmentType") ?? undefined) as AssessmentType | undefined,
    triggerPlanStatus: (searchParams.get("triggerPlanStatus") ?? undefined) as TriggerPlanStatus | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_record") {
    const result = await createRecord(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_record") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateRecord(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
