import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { staffPassportRecords, staffPassportToFlatRecord } from "@/lib/intelligence/fallback-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const staffId = searchParams.get("staffId");

  if (!isSupabaseEnabled()) {
    let rows = [...staffPassportRecords];
    if (staffId) rows = rows.filter((r) => r.id === staffId);
    // `records` = flat shape for dashboard/compliance metrics; `richRecords` =
    // nested passport shape for the Staff Passport page. Both derived from the
    // same seed so they never disagree.
    return NextResponse.json({
      ok: true,
      records: rows.map(staffPassportToFlatRecord),
      richRecords: rows,
      persisted: true,
    });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("staff_competence_records").select("*").order("updated_at", { ascending: false });

  if (homeId) query = query.eq("home_id", homeId);
  if (staffId) query = query.eq("staff_id", staffId);

  const { data, error } = await query.limit(100);
  if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }

  return NextResponse.json({ ok: true, records: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { staffId, homeId, actorUserId, actorRole, ...fields } = body;

    if (!staffId || !homeId) {
      return NextResponse.json({ error: "staffId and homeId are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      const idx = staffPassportRecords.findIndex((r) => r.id === staffId);
      if (idx >= 0) {
        staffPassportRecords[idx] = { ...staffPassportRecords[idx], ...fields };
      }
      return NextResponse.json({ ok: true, record: staffPassportRecords[idx] ?? null, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("staff_competence_records").upsert({
      staff_id: staffId,
      home_id: homeId,
      safer_recruitment_complete: fields.saferRecruitmentComplete ?? false,
      dbs_status: fields.dbsStatus ?? "not_started",
      dbs_date: fields.dbsDate ?? null,
      dbs_update_service: fields.dbsUpdateService ?? false,
      references_received: fields.referencesReceived ?? false,
      reference_count: fields.referenceCount ?? 0,
      right_to_work: fields.rightToWork ?? false,
      induction_complete: fields.inductionComplete ?? false,
      induction_date: fields.inductionDate ?? null,
      probation_status: fields.probationStatus ?? "not_started",
      probation_end_date: fields.probationEndDate ?? null,
      level3_status: fields.level3Status ?? "not_started",
      mandatory_training_complete: fields.mandatoryTrainingComplete ?? false,
      safeguarding_training_date: fields.safeguardingTrainingDate ?? null,
      medication_competency: fields.medicationCompetency ?? false,
      medication_competency_date: fields.medicationCompetencyDate ?? null,
      physical_intervention_trained: fields.physicalInterventionTrained ?? false,
      physical_intervention_date: fields.physicalInterventionDate ?? null,
      last_supervision_date: fields.lastSupervisionDate ?? null,
      supervision_frequency_weeks: fields.supervisionFrequencyWeeks ?? 4,
      last_appraisal_date: fields.lastAppraisalDate ?? null,
      can_lead_shift: fields.canLeadShift ?? false,
      can_administer_medication: fields.canAdministerMedication ?? false,
      can_lone_work: fields.canLoneWork ?? false,
      can_supervise_others: fields.canSuperviseOthers ?? false,
      restrictions: fields.restrictions ?? [],
      compliments: fields.compliments ?? [],
      performance_concerns: fields.performanceConcerns ?? [],
      role_competencies: fields.roleCompetencies ?? {},
      created_by: actorUserId ?? null,
    }, { onConflict: "staff_id,home_id" }).select().single();

    if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }

    await writeIntelligenceAudit({
      homeId,
      entityType: "staff_competence_record",
      entityId: data?.id,
      action: "record_created",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ ok: true, record: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/competence] POST error:", err);
    return NextResponse.json({ error: "Failed to create competence record" }, { status: 500 });
  }
}
