import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { storageFailure } from "@/lib/http/storage-error";
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
  if (error) return storageFailure("Staff competence records", error);

  return NextResponse.json({ ok: true, records: data ?? [], persisted: true });
}

/**
 * camelCase field → column, for the fields a caller may set.
 *
 * This map exists to make the upsert PARTIAL. It used to list every column
 * with a `?? false` / `?? "not_started"` / `?? []` default, which meant a
 * caller sending one field wrote ALL of them: the page's "Approve Competency"
 * button sends only `mandatoryTrainingComplete`, and that upsert reset the
 * same staff member's DBS status to "not_started", right-to-work and
 * references to false, and cleared restrictions, compliments and performance
 * concerns to empty arrays — silently, while reporting success.
 *
 * A default is only safe on INSERT. On the conflict path it is a deletion
 * wearing the shape of an update, which is the fabricate-on-empty rule applied
 * to a write: absent must mean "not supplied", never "supplied as nothing".
 */
const COMPETENCE_COLUMNS: Record<string, string> = {
  saferRecruitmentComplete: "safer_recruitment_complete",
  dbsStatus: "dbs_status",
  dbsDate: "dbs_date",
  dbsUpdateService: "dbs_update_service",
  referencesReceived: "references_received",
  referenceCount: "reference_count",
  rightToWork: "right_to_work",
  inductionComplete: "induction_complete",
  inductionDate: "induction_date",
  probationStatus: "probation_status",
  probationEndDate: "probation_end_date",
  level3Status: "level3_status",
  mandatoryTrainingComplete: "mandatory_training_complete",
  safeguardingTrainingDate: "safeguarding_training_date",
  medicationCompetency: "medication_competency",
  medicationCompetencyDate: "medication_competency_date",
  physicalInterventionTrained: "physical_intervention_trained",
  physicalInterventionDate: "physical_intervention_date",
  lastSupervisionDate: "last_supervision_date",
  supervisionFrequencyWeeks: "supervision_frequency_weeks",
  lastAppraisalDate: "last_appraisal_date",
  canLeadShift: "can_lead_shift",
  canAdministerMedication: "can_administer_medication",
  canLoneWork: "can_lone_work",
  canSuperviseOthers: "can_supervise_others",
  restrictions: "restrictions",
  compliments: "compliments",
  performanceConcerns: "performance_concerns",
  roleCompetencies: "role_competencies",
};

/** Only the columns the caller actually supplied. Exported for the tests that
 *  hold the "one field in, one field written" line. */
export function competenceColumns(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(COMPETENCE_COLUMNS)) {
    if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== undefined) {
      out[column] = fields[key];
    }
  }
  return out;
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
      ...competenceColumns(fields),
      created_by: actorUserId ?? null,
    }, { onConflict: "staff_id,home_id" }).select().single();

    if (error) return storageFailure("Staff competence records", error);

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
