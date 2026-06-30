import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  COMPETENCY_TYPES, ASSESSMENT_OUTCOMES, MEDICATION_CATEGORIES, TRAINING_PROVIDERS,
} from "@/lib/services/staff-medication-competency-service";
import type { CompetencyType, AssessmentOutcome, MedicationCategory, TrainingProvider } from "@/lib/services/staff-medication-competency-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "competency_types") return NextResponse.json({ ok: true, data: COMPETENCY_TYPES });
  if (type === "assessment_outcomes") return NextResponse.json({ ok: true, data: ASSESSMENT_OUTCOMES });
  if (type === "medication_categories") return NextResponse.json({ ok: true, data: MEDICATION_CATEGORIES });
  if (type === "training_providers") return NextResponse.json({ ok: true, data: TRAINING_PROVIDERS });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    competencyType: (searchParams.get("competencyType") ?? undefined) as CompetencyType | undefined,
    assessmentOutcome: (searchParams.get("assessmentOutcome") ?? undefined) as AssessmentOutcome | undefined,
    medicationCategory: (searchParams.get("medicationCategory") ?? undefined) as MedicationCategory | undefined,
    trainingProvider: (searchParams.get("trainingProvider") ?? undefined) as TrainingProvider | undefined,
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
