import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  PROFESSIONAL_TYPES, CONSULTATION_TYPES, CONSULTATION_OUTCOMES, CONSULTATION_URGENCIES,
} from "@/lib/services/professional-consultation-service";
import type { ProfessionalType, ConsultationType, ConsultationOutcome, ConsultationUrgency } from "@/lib/services/professional-consultation-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "professional_types") return NextResponse.json({ ok: true, data: PROFESSIONAL_TYPES });
  if (type === "consultation_types") return NextResponse.json({ ok: true, data: CONSULTATION_TYPES });
  if (type === "consultation_outcomes") return NextResponse.json({ ok: true, data: CONSULTATION_OUTCOMES });
  if (type === "consultation_urgencies") return NextResponse.json({ ok: true, data: CONSULTATION_URGENCIES });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    professionalType: (searchParams.get("professionalType") ?? undefined) as ProfessionalType | undefined,
    consultationType: (searchParams.get("consultationType") ?? undefined) as ConsultationType | undefined,
    consultationOutcome: (searchParams.get("consultationOutcome") ?? undefined) as ConsultationOutcome | undefined,
    consultationUrgency: (searchParams.get("consultationUrgency") ?? undefined) as ConsultationUrgency | undefined,
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
