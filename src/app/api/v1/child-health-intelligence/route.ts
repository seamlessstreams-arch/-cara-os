import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";
import {
  computeChildHealthIntelligence,
  type ChildHealthIntelligenceInput,
  type MedicationInput,
  type MedicationAdminInput,
  type HealthAssessmentInput,
  type DentalRecordInput,
  type OpticiansRecordInput,
  type ImmunisationInput,
  type CamhsInput,
  type MentalHealthCheckInInput,
  type AppointmentInput,
} from "@/lib/engines/child-health-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const [appointmentsList, camhsReferralsList, dentalRecordsList, healthAssessmentsList, immunisationRecordsList, medicationAdministrationsList, medicationsList, mentalHealthCheckInsList, opticiansRecordsList, youngPeopleList] = await Promise.all([dal.appointments.findAll(), dal.camhsReferrals.findAll(), dal.dentalRecords.findAll(), dal.healthAssessments.findAll(), dal.immunisationRecords.findAll(), dal.medicationAdministrations.findAll(), dal.medications.findAll(), dal.mentalHealthCheckIns.findAll(), dal.opticiansRecords.findAll(), dal.youngPeople.findAll()]);
  const today = todayStr();

  const child = youngPeopleList.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";

  // ── Medications ───────────────────────────────────────────────────────
  const medications: MedicationInput[] = (medicationsList ?? [])
    .filter((m) => m.young_person_id === childId || m.child_id === childId)
    .map((m) => ({
      id: m.id,
      name: m.name ?? m.medication_name ?? "Unknown",
      type: m.type ?? m.medication_type ?? "regular",
      dosage: m.dosage ?? "",
      frequency: m.frequency ?? "daily",
      // `?? true` after a boolean comparison is unreachable — the intended
      // default only applies when neither field is recorded.
      is_active: m.is_active ?? (m.status ? m.status === "active" : true),
      start_date: (m.start_date ?? m.date ?? "").slice(0, 10),
      end_date: m.end_date ? m.end_date.slice(0, 10) : null,
    }));

  // ── Medication Administrations ────────────────────────────────────────
  const medication_administrations: MedicationAdminInput[] = (medicationAdministrationsList ?? [])
    .filter((a) => a.child_id === childId || medications.some((m) => m.id === a.medication_id))
    .map((a) => ({
      id: a.id,
      medication_id: a.medication_id ?? "",
      date: (a.date ?? a.scheduled_time ?? a.actual_time ?? "").slice(0, 10),
      status: a.status ?? "given",
      witnessed: a.witnessed ?? a.witness_id != null,
    }));

  // ── Health Assessments ────────────────────────────────────────────────
  const health_assessments: HealthAssessmentInput[] = (healthAssessmentsList ?? [])
    .filter((ha) => ha.child_id === childId)
    .map((ha) => ({
      id: ha.id,
      type: ha.type,
      date: (ha.date ?? "").slice(0, 10),
      status: ha.status,
      // HealthAssessment has no single outcome field — its findings and notes are the outcome
      outcome: (ha.key_findings ?? []).join("; ") || ha.notes || "",
    }));

  // ── Dental Records ────────────────────────────────────────────────────
  const dental_records: DentalRecordInput[] = (dentalRecordsList ?? [])
    .filter((d) => d.child_id === childId)
    .flatMap((d) => {
      const entries = [...(d.check_ups_history ?? [])].sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length === 0 && d.last_check_up_date) {
        entries.push({ date: d.last_check_up_date, dentist: d.dentist_name, findings: d.current_treatment_notes ?? "", treatment_recommended: "", treatment_received: "" });
      }
      return entries.map((e, idx) => ({
        id: `${d.id}-${idx}`,
        date: (e.date ?? "").slice(0, 10),
        type: e.treatment_received ? "treatment" : "check_up",
        outcome: [e.findings, e.treatment_received].filter(Boolean).join("; "),
        // the summary record's next-due applies to the most recent visit
        next_due: idx === entries.length - 1 && d.next_check_up_due ? d.next_check_up_due.slice(0, 10) : null,
      }));
    });

  // ── Opticians Records ─────────────────────────────────────────────────
  const opticians_records: OpticiansRecordInput[] = (opticiansRecordsList ?? [])
    .filter((o) => o.child_id === childId)
    .flatMap((o) => {
      const exams = [...(o.exam_history ?? [])].sort((a, b) => a.date.localeCompare(b.date));
      if (exams.length === 0 && o.last_exam_date) {
        exams.push({ date: o.last_exam_date, outcome: o.notes ?? "", prescription: "", recommendations: "" });
      }
      return exams.map((e, idx) => ({
        id: `${o.id}-${idx}`,
        date: (e.date ?? "").slice(0, 10),
        outcome: e.outcome ?? "",
        next_due: idx === exams.length - 1 && o.next_exam_due ? o.next_exam_due.slice(0, 10) : null,
      }));
    });

  // ── Immunisations ─────────────────────────────────────────────────────
  const VACCINE_STATUS_TO_ENGINE: Record<string, string | null> = {
    up_to_date: "completed", caught_up_after_gap: "completed",
    due_now: "due", overdue: "overdue", refused: "declined",
    medically_exempt: null,
  };
  const immunisations: ImmunisationInput[] = (immunisationRecordsList ?? [])
    .filter((i) => i.child_id === childId)
    .flatMap((i) =>
      (i.records ?? []).flatMap((v, idx) => {
        const status = VACCINE_STATUS_TO_ENGINE[v.status] ?? null;
        if (status === null) return [];
        return [{
          id: `${i.id}-${idx}`,
          vaccine: v.vaccine,
          date: (v.date_given ?? "").slice(0, 10),
          status,
        }];
      }),
    );

  // ── CAMHS ─────────────────────────────────────────────────────────────
  const CAMHS_STATUS_TO_ENGINE: Record<string, string> = {
    submitted: "waiting", triaged: "waiting", on_waiting_list: "waiting",
    re_referred: "waiting", active_engagement: "active", discharged: "discharged",
  };
  const camhsRecords = (camhsReferralsList ?? []).filter((c) => c.child_id === childId);
  let camhs: CamhsInput | null = null;
  if (camhsRecords.length > 0) {
    // Use the most recent referral
    const sorted = [...camhsRecords].sort(
      (a, b) => new Date(b.referral_date ?? "").getTime() - new Date(a.referral_date ?? "").getTime(),
    );
    const c = sorted[0];
    camhs = {
      id: c.id,
      referral_date: (c.referral_date ?? "").slice(0, 10),
      status: CAMHS_STATUS_TO_ENGINE[c.referral_status] ?? "waiting",
      sessions_attended: c.sessions_held ?? 0,
      sessions_offered: c.sessions_scheduled ?? 0,
      engagement_level: c.current_engagement_level,
      // the referral only records the FIRST appointment; it is the next one
      // only while it is still ahead of us
      next_appointment:
        c.first_appointment_date && c.first_appointment_date.slice(0, 10) >= today
          ? c.first_appointment_date.slice(0, 10)
          : null,
    };
  }

  // ── Mental Health Check-Ins ───────────────────────────────────────────
  const SLEEP_QUALITY_TO_SCORE: Record<string, number> = {
    poor: 1, disrupted: 2, ok: 3, good: 4, great: 5,
  };
  const mental_health_check_ins: MentalHealthCheckInInput[] = (mentalHealthCheckInsList ?? [])
    .filter((mh) => mh.child_id === childId)
    .map((mh) => ({
      id: mh.id,
      date: (mh.date ?? "").slice(0, 10),
      overall_mood: mh.mood_rating,
      // the check-in form does not capture anxiety — unmeasured, not neutral
      anxiety_level: null,
      sleep_quality: SLEEP_QUALITY_TO_SCORE[mh.sleep_quality] ?? 3,
      concerns: mh.whats_heavy?.trim() ? [mh.whats_heavy.trim()] : [],
    }));

  // ── Appointments ──────────────────────────────────────────────────────
  const appointments: AppointmentInput[] = (appointmentsList ?? [])
    .filter((a) => a.child_id === childId)
    .map((a) => ({
      id: a.id,
      date: (a.date ?? "").slice(0, 10),
      type: a.type,
      attended: a.status === "attended",
      rescheduled: a.status === "rescheduled",
    }));

  const engineInput: ChildHealthIntelligenceInput = {
    today,
    child_id: childId,
    child_name: childName,
    medications,
    medication_administrations,
    health_assessments,
    dental_records,
    opticians_records,
    immunisations,
    camhs,
    mental_health_check_ins,
    appointments,
  };

  const result = computeChildHealthIntelligence(engineInput);
  return NextResponse.json({ data: result });
}
