import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
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

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const child = store.youngPeople.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";

  // ── Medications ───────────────────────────────────────────────────────
  const medications: MedicationInput[] = (store.medications ?? [])
    .filter((m: any) => m.young_person_id === childId || m.child_id === childId)
    .map((m: any) => ({
      id: m.id,
      name: m.name ?? m.medication_name ?? "Unknown",
      type: m.type ?? m.medication_type ?? "regular",
      dosage: m.dosage ?? "",
      frequency: m.frequency ?? "daily",
      is_active: m.is_active ?? m.status === "active" ?? true,
      start_date: (m.start_date ?? m.date ?? "").slice(0, 10),
      end_date: m.end_date ? m.end_date.slice(0, 10) : null,
    }));

  // ── Medication Administrations ────────────────────────────────────────
  const medication_administrations: MedicationAdminInput[] = (store.medicationAdministrations ?? [])
    .filter((a: any) => a.child_id === childId || medications.some((m) => m.id === a.medication_id))
    .map((a: any) => ({
      id: a.id,
      medication_id: a.medication_id ?? "",
      date: (a.date ?? a.scheduled_time ?? a.actual_time ?? "").slice(0, 10),
      status: a.status ?? "given",
      witnessed: a.witnessed ?? a.witness_id != null ?? false,
    }));

  // ── Health Assessments ────────────────────────────────────────────────
  const health_assessments: HealthAssessmentInput[] = (store.healthAssessments ?? [])
    .filter((ha: any) => ha.child_id === childId)
    .map((ha: any) => ({
      id: ha.id,
      type: ha.type ?? ha.assessment_type ?? "annual",
      date: (ha.date ?? ha.assessment_date ?? "").slice(0, 10),
      status: ha.status ?? "completed",
      outcome: ha.outcome ?? ha.summary ?? "",
    }));

  // ── Dental Records ────────────────────────────────────────────────────
  const dental_records: DentalRecordInput[] = (store.dentalRecords ?? [])
    .filter((d: any) => d.child_id === childId)
    .map((d: any) => ({
      id: d.id,
      date: (d.date ?? d.appointment_date ?? "").slice(0, 10),
      type: d.type ?? d.visit_type ?? "check_up",
      outcome: d.outcome ?? d.notes ?? "",
      next_due: d.next_due ? d.next_due.slice(0, 10) : d.next_appointment ? d.next_appointment.slice(0, 10) : null,
    }));

  // ── Opticians Records ─────────────────────────────────────────────────
  const opticians_records: OpticiansRecordInput[] = (store.opticiansRecords ?? [])
    .filter((o: any) => o.child_id === childId)
    .map((o: any) => ({
      id: o.id,
      date: (o.date ?? o.appointment_date ?? "").slice(0, 10),
      outcome: o.outcome ?? o.notes ?? "",
      next_due: o.next_due ? o.next_due.slice(0, 10) : o.next_appointment ? o.next_appointment.slice(0, 10) : null,
    }));

  // ── Immunisations ─────────────────────────────────────────────────────
  const immunisations: ImmunisationInput[] = (store.immunisationRecords ?? [])
    .filter((i: any) => i.child_id === childId)
    .map((i: any) => ({
      id: i.id,
      vaccine: i.vaccine ?? i.vaccine_name ?? i.name ?? "Unknown",
      date: (i.date ?? i.administered_date ?? "").slice(0, 10),
      status: i.status ?? "completed",
    }));

  // ── CAMHS ─────────────────────────────────────────────────────────────
  const camhsRecords = (store.camhsReferrals ?? []).filter((c: any) => c.child_id === childId);
  let camhs: CamhsInput | null = null;
  if (camhsRecords.length > 0) {
    // Use the most recent / active referral
    const sorted = [...camhsRecords].sort(
      (a: any, b: any) => new Date(b.referral_date ?? b.date ?? "").getTime() - new Date(a.referral_date ?? a.date ?? "").getTime(),
    );
    const c = sorted[0] as any;
    camhs = {
      id: c.id,
      referral_date: (c.referral_date ?? c.date ?? "").slice(0, 10),
      status: c.status ?? "active",
      sessions_attended: c.sessions_attended ?? 0,
      sessions_offered: c.sessions_offered ?? c.sessions_total ?? 0,
      engagement_level: c.engagement_level ?? c.engagement ?? "moderate",
      next_appointment: c.next_appointment ? c.next_appointment.slice(0, 10) : null,
    };
  }

  // ── Mental Health Check-Ins ───────────────────────────────────────────
  const mental_health_check_ins: MentalHealthCheckInInput[] = (store.mentalHealthCheckIns ?? [])
    .filter((mh: any) => mh.child_id === childId)
    .map((mh: any) => ({
      id: mh.id,
      date: (mh.date ?? mh.check_in_date ?? "").slice(0, 10),
      overall_mood: mh.overall_mood ?? mh.mood ?? 3,
      anxiety_level: mh.anxiety_level ?? mh.anxiety ?? 3,
      sleep_quality: mh.sleep_quality ?? mh.sleep ?? 3,
      concerns: mh.concerns ?? [],
    }));

  // ── Appointments ──────────────────────────────────────────────────────
  const appointments: AppointmentInput[] = (store.appointments ?? [])
    .filter((a: any) => a.child_id === childId)
    .map((a: any) => ({
      id: a.id,
      date: (a.date ?? a.appointment_date ?? "").slice(0, 10),
      type: a.type ?? a.appointment_type ?? "gp",
      attended: a.attended ?? a.status === "attended" ?? true,
      rescheduled: a.rescheduled ?? a.status === "rescheduled" ?? false,
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
