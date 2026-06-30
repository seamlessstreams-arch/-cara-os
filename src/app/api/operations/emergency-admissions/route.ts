import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAdmissions,
  createAdmission,
  updateAdmission,
  ADMISSION_TYPES,
  REFERRAL_SOURCES,
  MATCHING_OUTCOMES,
  IMPACT_ASSESSMENTS,
} from "@/lib/services/emergency-admissions-service";
import type {
  AdmissionType,
  ReferralSource,
  MatchingOutcome,
} from "@/lib/services/emergency-admissions-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "admission_types") return NextResponse.json({ ok: true, data: ADMISSION_TYPES });
  if (type === "referral_sources") return NextResponse.json({ ok: true, data: REFERRAL_SOURCES });
  if (type === "matching_outcomes") return NextResponse.json({ ok: true, data: MATCHING_OUTCOMES });
  if (type === "impact_assessments") return NextResponse.json({ ok: true, data: IMPACT_ASSESSMENTS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listAdmissions(homeId, {
    admissionType: (searchParams.get("admissionType") ?? undefined) as AdmissionType | undefined,
    referralSource: (searchParams.get("referralSource") ?? undefined) as ReferralSource | undefined,
    matchingOutcome: (searchParams.get("matchingOutcome") ?? undefined) as MatchingOutcome | undefined,
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

  if (action === "create_admission") {
    const result = await createAdmission(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_admission") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateAdmission(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
