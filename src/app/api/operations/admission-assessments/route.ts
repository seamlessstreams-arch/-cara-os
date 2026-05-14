import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  ASSESSMENT_STAGES, SUITABILITY_DECISIONS, MATCHING_OUTCOMES, REFERRAL_SOURCES,
} from "@/lib/services/admission-assessment-service";
import type { AssessmentStage, SuitabilityDecision, MatchingOutcome, ReferralSource } from "@/lib/services/admission-assessment-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "assessment_stages") return NextResponse.json({ ok: true, data: ASSESSMENT_STAGES });
  if (type === "suitability_decisions") return NextResponse.json({ ok: true, data: SUITABILITY_DECISIONS });
  if (type === "matching_outcomes") return NextResponse.json({ ok: true, data: MATCHING_OUTCOMES });
  if (type === "referral_sources") return NextResponse.json({ ok: true, data: REFERRAL_SOURCES });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    assessmentStage: (searchParams.get("assessmentStage") ?? undefined) as AssessmentStage | undefined,
    suitabilityDecision: (searchParams.get("suitabilityDecision") ?? undefined) as SuitabilityDecision | undefined,
    matchingOutcome: (searchParams.get("matchingOutcome") ?? undefined) as MatchingOutcome | undefined,
    referralSource: (searchParams.get("referralSource") ?? undefined) as ReferralSource | undefined,
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
