import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAssessments,
  createAssessment,
  updateAssessment,
  ASSESSMENT_STATUSES,
  RISK_LEVELS,
  COMPATIBILITY_FACTORS,
  IMPACT_AREAS,
  MITIGATION_STATUSES,
} from "@/lib/services/impact-risk-assessment-service";
import type {
  AssessmentStatus,
  RiskLevel,
} from "@/lib/services/impact-risk-assessment-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "assessment_statuses") {
    return NextResponse.json({ ok: true, data: ASSESSMENT_STATUSES });
  }
  if (type === "risk_levels") {
    return NextResponse.json({ ok: true, data: RISK_LEVELS });
  }
  if (type === "compatibility_factors") {
    return NextResponse.json({ ok: true, data: COMPATIBILITY_FACTORS });
  }
  if (type === "impact_areas") {
    return NextResponse.json({ ok: true, data: IMPACT_AREAS });
  }
  if (type === "mitigation_statuses") {
    return NextResponse.json({ ok: true, data: MITIGATION_STATUSES });
  }

  // Assessments (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listAssessments(homeId, {
    status: (searchParams.get("status") ?? undefined) as AssessmentStatus | undefined,
    riskLevel: (searchParams.get("riskLevel") ?? undefined) as RiskLevel | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { action, ...payload } = body;

  if (action === "create_assessment") {
    const result = await createAssessment(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_assessment") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateAssessment(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
