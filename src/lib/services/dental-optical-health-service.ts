// ══════════════════════════════════════════════════════════════════════════════
// CARA — DENTAL OPTICAL HEALTH SERVICE
// Tracks dental check-ups, optical examinations, treatment compliance,
// appointment attendance, and health outcomes.
// CHR 2015 Reg 33(4)(a) (access to dental and optical services),
// Reg 7(2)(a) (health promotion and preventive care).
//
// Covers: appointment type, compliance level, treatment outcome,
// urgency assessment, and follow-up quality.
//
// SCCIF: Health — "Children access timely dental and optical care."
// "Health needs including dental and vision are properly met."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AppointmentType =
  | "dental_checkup"
  | "dental_treatment"
  | "dental_emergency"
  | "orthodontic"
  | "optical_exam"
  | "optical_prescription"
  | "optical_emergency"
  | "routine_screening"
  | "specialist_referral"
  | "other";

export type ComplianceLevel =
  | "fully_compliant"
  | "mostly_compliant"
  | "partially_compliant"
  | "non_compliant"
  | "refused";

export type TreatmentOutcome =
  | "completed_successfully"
  | "ongoing_treatment"
  | "requires_follow_up"
  | "treatment_refused"
  | "no_treatment_needed";

export type UrgencyAssessment =
  | "routine"
  | "soon"
  | "urgent"
  | "emergency"
  | "preventive";

export interface DentalOpticalHealthRecord {
  id: string;
  home_id: string;
  appointment_type: AppointmentType;
  compliance_level: ComplianceLevel;
  treatment_outcome: TreatmentOutcome;
  urgency_assessment: UrgencyAssessment;
  appointment_date: string;
  child_name: string;
  child_id: string | null;
  accompanied_by: string;
  appointment_attended: boolean;
  consent_obtained: boolean;
  child_prepared: boolean;
  anxiety_managed: boolean;
  treatment_explained: boolean;
  follow_up_booked: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  prescription_collected: boolean;
  pain_managed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const APPOINTMENT_TYPES: { type: AppointmentType; label: string }[] = [
  { type: "dental_checkup", label: "Dental Check-up" },
  { type: "dental_treatment", label: "Dental Treatment" },
  { type: "dental_emergency", label: "Dental Emergency" },
  { type: "orthodontic", label: "Orthodontic" },
  { type: "optical_exam", label: "Optical Exam" },
  { type: "optical_prescription", label: "Optical Prescription" },
  { type: "optical_emergency", label: "Optical Emergency" },
  { type: "routine_screening", label: "Routine Screening" },
  { type: "specialist_referral", label: "Specialist Referral" },
  { type: "other", label: "Other" },
];

export const COMPLIANCE_LEVELS: { level: ComplianceLevel; label: string }[] = [
  { level: "fully_compliant", label: "Fully Compliant" },
  { level: "mostly_compliant", label: "Mostly Compliant" },
  { level: "partially_compliant", label: "Partially Compliant" },
  { level: "non_compliant", label: "Non-Compliant" },
  { level: "refused", label: "Refused" },
];

export const TREATMENT_OUTCOMES: { outcome: TreatmentOutcome; label: string }[] = [
  { outcome: "completed_successfully", label: "Completed Successfully" },
  { outcome: "ongoing_treatment", label: "Ongoing Treatment" },
  { outcome: "requires_follow_up", label: "Requires Follow-up" },
  { outcome: "treatment_refused", label: "Treatment Refused" },
  { outcome: "no_treatment_needed", label: "No Treatment Needed" },
];

export const URGENCY_ASSESSMENTS: { assessment: UrgencyAssessment; label: string }[] = [
  { assessment: "routine", label: "Routine" },
  { assessment: "soon", label: "Soon" },
  { assessment: "urgent", label: "Urgent" },
  { assessment: "emergency", label: "Emergency" },
  { assessment: "preventive", label: "Preventive" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computeDentalOpticalMetrics(records: DentalOpticalHealthRecord[]): {
  total_appointments: number;
  non_compliant_count: number;
  refused_count: number;
  treatment_refused_count: number;
  emergency_count: number;
  appointment_attended_rate: number | null;
  consent_rate: number | null;
  child_prepared_rate: number | null;
  anxiety_managed_rate: number | null;
  treatment_explained_rate: number | null;
  follow_up_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  prescription_rate: number | null;
  pain_managed_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_appointment_type: Record<string, number>;
  by_compliance_level: Record<string, number>;
  by_treatment_outcome: Record<string, number>;
  by_urgency_assessment: Record<string, number>;
} {
  const nonCompliant = records.filter((r) => r.compliance_level === "non_compliant").length;
  const refused = records.filter((r) => r.compliance_level === "refused").length;
  const treatmentRefused = records.filter((r) => r.treatment_outcome === "treatment_refused").length;
  const emergency = records.filter((r) => r.urgency_assessment === "emergency" || r.urgency_assessment === "urgent").length;

  const boolRate = (field: keyof DentalOpticalHealthRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.appointment_type] = (byType[r.appointment_type] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_level] = (byCompliance[r.compliance_level] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.treatment_outcome] = (byOutcome[r.treatment_outcome] ?? 0) + 1;

  const byUrgency: Record<string, number> = {};
  for (const r of records) byUrgency[r.urgency_assessment] = (byUrgency[r.urgency_assessment] ?? 0) + 1;

  return {
    total_appointments: records.length,
    non_compliant_count: nonCompliant,
    refused_count: refused,
    treatment_refused_count: treatmentRefused,
    emergency_count: emergency,
    appointment_attended_rate: boolRate("appointment_attended"),
    consent_rate: boolRate("consent_obtained"),
    child_prepared_rate: boolRate("child_prepared"),
    anxiety_managed_rate: boolRate("anxiety_managed"),
    treatment_explained_rate: boolRate("treatment_explained"),
    follow_up_rate: boolRate("follow_up_booked"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    prescription_rate: boolRate("prescription_collected"),
    pain_managed_rate: boolRate("pain_managed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_appointment_type: byType,
    by_compliance_level: byCompliance,
    by_treatment_outcome: byOutcome,
    by_urgency_assessment: byUrgency,
  };
}

export function identifyDentalOpticalAlerts(
  records: DentalOpticalHealthRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Refused treatment in emergency — per-record critical
  for (const r of records) {
    if (r.treatment_outcome === "treatment_refused" && (r.urgency_assessment === "emergency" || r.urgency_assessment === "urgent")) {
      alerts.push({
        type: "refused_urgent",
        severity: "critical",
        message: `${r.child_name} refused ${r.urgency_assessment} ${r.appointment_type.replace(/_/g, " ")} treatment — escalate immediately`,
        id: r.id,
      });
    }
  }

  // Not attended
  const notAttended = records.filter((r) => !r.appointment_attended).length;
  if (notAttended >= 1) {
    alerts.push({
      type: "not_attended",
      severity: "high",
      message: `${notAttended} ${notAttended === 1 ? "appointment has" : "appointments have"} not been attended — dental/optical care is statutory`,
      id: "not_attended",
    });
  }

  // No consent obtained
  const noConsent = records.filter((r) => !r.consent_obtained).length;
  if (noConsent >= 1) {
    alerts.push({
      type: "no_consent",
      severity: "high",
      message: `${noConsent} ${noConsent === 1 ? "appointment has" : "appointments have"} no consent obtained — consent required for all treatment`,
      id: "no_consent",
    });
  }

  // No follow-up booked
  const noFollowUp = records.filter((r) => !r.follow_up_booked).length;
  if (noFollowUp >= 2) {
    alerts.push({
      type: "no_follow_up",
      severity: "medium",
      message: `${noFollowUp} appointments without follow-up booked — continuity of care essential`,
      id: "no_follow_up",
    });
  }

  // Anxiety not managed
  const noAnxiety = records.filter((r) => !r.anxiety_managed).length;
  if (noAnxiety >= 2) {
    alerts.push({
      type: "anxiety_not_managed",
      severity: "medium",
      message: `${noAnxiety} appointments where anxiety not managed — children need emotional support`,
      id: "anxiety_not_managed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    appointmentType?: AppointmentType; complianceLevel?: ComplianceLevel;
    treatmentOutcome?: TreatmentOutcome; urgencyAssessment?: UrgencyAssessment; limit?: number;
  },
): Promise<ServiceResult<DentalOpticalHealthRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let q = (client.from("cs_dental_optical_health") as SB).select("*").eq("home_id", homeId);
  if (filters?.appointmentType) q = q.eq("appointment_type", filters.appointmentType);
  if (filters?.complianceLevel) q = q.eq("compliance_level", filters.complianceLevel);
  if (filters?.treatmentOutcome) q = q.eq("treatment_outcome", filters.treatmentOutcome);
  if (filters?.urgencyAssessment) q = q.eq("urgency_assessment", filters.urgencyAssessment);
  q = q.order("appointment_date", { ascending: false }).limit(filters?.limit ?? 200);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as DentalOpticalHealthRecord[] };
}

export async function createRecord(payload: {
  homeId: string; appointmentType: AppointmentType; complianceLevel: ComplianceLevel;
  treatmentOutcome: TreatmentOutcome; urgencyAssessment: UrgencyAssessment;
  appointmentDate: string; childName: string; childId: string | null;
  accompaniedBy: string; appointmentAttended: boolean; consentObtained: boolean;
  childPrepared: boolean; anxietyManaged: boolean; treatmentExplained: boolean;
  followUpBooked: boolean; carePlanReflects: boolean; socialWorkerInformed: boolean;
  parentInformed: boolean; prescriptionCollected: boolean; painManaged: boolean;
  recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
  nextReviewDate: string | null; notes: string | null;
}): Promise<ServiceResult<DentalOpticalHealthRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_dental_optical_health") as SB).insert({
    home_id: payload.homeId, appointment_type: payload.appointmentType,
    compliance_level: payload.complianceLevel, treatment_outcome: payload.treatmentOutcome,
    urgency_assessment: payload.urgencyAssessment, appointment_date: payload.appointmentDate,
    child_name: payload.childName, child_id: payload.childId, accompanied_by: payload.accompaniedBy,
    appointment_attended: payload.appointmentAttended, consent_obtained: payload.consentObtained,
    child_prepared: payload.childPrepared, anxiety_managed: payload.anxietyManaged,
    treatment_explained: payload.treatmentExplained, follow_up_booked: payload.followUpBooked,
    care_plan_reflects: payload.carePlanReflects, social_worker_informed: payload.socialWorkerInformed,
    parent_informed: payload.parentInformed, prescription_collected: payload.prescriptionCollected,
    pain_managed: payload.painManaged, recorded_promptly: payload.recordedPromptly,
    issues_found: payload.issuesFound, actions_taken: payload.actionsTaken,
    next_review_date: payload.nextReviewDate, notes: payload.notes,
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as DentalOpticalHealthRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    appointmentType: AppointmentType; complianceLevel: ComplianceLevel;
    treatmentOutcome: TreatmentOutcome; urgencyAssessment: UrgencyAssessment;
    appointmentDate: string; childName: string; childId: string | null;
    accompaniedBy: string; appointmentAttended: boolean; consentObtained: boolean;
    childPrepared: boolean; anxietyManaged: boolean; treatmentExplained: boolean;
    followUpBooked: boolean; carePlanReflects: boolean; socialWorkerInformed: boolean;
    parentInformed: boolean; prescriptionCollected: boolean; painManaged: boolean;
    recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
    nextReviewDate: string | null; notes: string | null;
  }>,
): Promise<ServiceResult<DentalOpticalHealthRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.appointmentType !== undefined) mapped.appointment_type = updates.appointmentType;
  if (updates.complianceLevel !== undefined) mapped.compliance_level = updates.complianceLevel;
  if (updates.treatmentOutcome !== undefined) mapped.treatment_outcome = updates.treatmentOutcome;
  if (updates.urgencyAssessment !== undefined) mapped.urgency_assessment = updates.urgencyAssessment;
  if (updates.appointmentDate !== undefined) mapped.appointment_date = updates.appointmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.accompaniedBy !== undefined) mapped.accompanied_by = updates.accompaniedBy;
  if (updates.appointmentAttended !== undefined) mapped.appointment_attended = updates.appointmentAttended;
  if (updates.consentObtained !== undefined) mapped.consent_obtained = updates.consentObtained;
  if (updates.childPrepared !== undefined) mapped.child_prepared = updates.childPrepared;
  if (updates.anxietyManaged !== undefined) mapped.anxiety_managed = updates.anxietyManaged;
  if (updates.treatmentExplained !== undefined) mapped.treatment_explained = updates.treatmentExplained;
  if (updates.followUpBooked !== undefined) mapped.follow_up_booked = updates.followUpBooked;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.prescriptionCollected !== undefined) mapped.prescription_collected = updates.prescriptionCollected;
  if (updates.painManaged !== undefined) mapped.pain_managed = updates.painManaged;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  const { data, error } = await (client.from("cs_dental_optical_health") as SB)
    .update(mapped).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as DentalOpticalHealthRecord };
}

export const _testing = { computeDentalOpticalMetrics, identifyDentalOpticalAlerts };
