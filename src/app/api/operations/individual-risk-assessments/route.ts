import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAssessments,
  createAssessment,
  updateAssessment,
  RISK_DOMAINS,
  RISK_RATINGS,
  ASSESSMENT_STATUSES,
  REVIEW_TRIGGERS,
} from "@/lib/services/individual-risk-assessment-service";
import type {
  RiskDomain,
  RiskRating,
  AssessmentStatus,
} from "@/lib/services/individual-risk-assessment-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "risk_domains") return NextResponse.json({ ok: true, data: RISK_DOMAINS });
  if (type === "risk_ratings") return NextResponse.json({ ok: true, data: RISK_RATINGS });
  if (type === "assessment_statuses") return NextResponse.json({ ok: true, data: ASSESSMENT_STATUSES });
  if (type === "review_triggers") return NextResponse.json({ ok: true, data: REVIEW_TRIGGERS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listAssessments(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    riskDomain: (searchParams.get("riskDomain") ?? undefined) as RiskDomain | undefined,
    riskRating: (searchParams.get("riskRating") ?? undefined) as RiskRating | undefined,
    assessmentStatus: (searchParams.get("assessmentStatus") ?? undefined) as AssessmentStatus | undefined,
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
