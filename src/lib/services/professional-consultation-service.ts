// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROFESSIONAL CONSULTATION SERVICE
// Tracks consultations with external professionals including therapists,
// psychologists, social workers, IROs, LADOs, health visitors, and
// other specialists involved in children's care.
// CHR 2015 Reg 14 (care planning — multi-agency working),
// Reg 34 (staff support — access to professional consultation),
// Reg 5 (engaging with others — external professionals).
//
// Covers: CAMHS referrals, therapeutic consultations, IRO contact,
// LADO consultations, educational psychology, speech therapy,
// occupational therapy, and specialist assessments.
//
// SCCIF: Overall Experiences — "Effective multi-agency working."
// "Children benefit from specialist input."
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

export type ProfessionalType =
  | "camhs_therapist"
  | "clinical_psychologist"
  | "social_worker"
  | "iro"
  | "lado"
  | "educational_psychologist"
  | "speech_therapist"
  | "occupational_therapist"
  | "psychiatrist"
  | "other";

export type ConsultationType =
  | "assessment"
  | "review"
  | "advice_and_guidance"
  | "crisis_intervention"
  | "planned_session"
  | "telephone_consultation"
  | "multi_agency_meeting"
  | "case_conference"
  | "training_support"
  | "other";

export type ConsultationOutcome =
  | "recommendations_made"
  | "further_referral"
  | "no_further_action"
  | "ongoing_support"
  | "escalated";

export type ConsultationUrgency =
  | "emergency"
  | "urgent"
  | "routine"
  | "planned"
  | "follow_up";

export interface ProfessionalConsultationRecord {
  id: string;
  home_id: string;
  professional_type: ProfessionalType;
  consultation_type: ConsultationType;
  consultation_outcome: ConsultationOutcome;
  consultation_urgency: ConsultationUrgency;
  consultation_date: string;
  professional_name: string;
  professional_organisation: string;
  child_name: string;
  child_id: string | null;
  recommendations_documented: boolean;
  actions_agreed: boolean;
  actions_completed: boolean;
  staff_informed: boolean;
  care_plan_updated: boolean;
  parent_carer_informed: boolean;
  social_worker_informed: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  child_participated: boolean;
  child_views_recorded: boolean;
  consent_obtained: boolean;
  issues_found: string[];
  actions_taken: string[];
  consulted_by: string;
  next_consultation_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PROFESSIONAL_TYPES: { type: ProfessionalType; label: string }[] = [
  { type: "camhs_therapist", label: "CAMHS Therapist" },
  { type: "clinical_psychologist", label: "Clinical Psychologist" },
  { type: "social_worker", label: "Social Worker" },
  { type: "iro", label: "IRO" },
  { type: "lado", label: "LADO" },
  { type: "educational_psychologist", label: "Educational Psychologist" },
  { type: "speech_therapist", label: "Speech Therapist" },
  { type: "occupational_therapist", label: "Occupational Therapist" },
  { type: "psychiatrist", label: "Psychiatrist" },
  { type: "other", label: "Other" },
];

export const CONSULTATION_TYPES: { type: ConsultationType; label: string }[] = [
  { type: "assessment", label: "Assessment" },
  { type: "review", label: "Review" },
  { type: "advice_and_guidance", label: "Advice & Guidance" },
  { type: "crisis_intervention", label: "Crisis Intervention" },
  { type: "planned_session", label: "Planned Session" },
  { type: "telephone_consultation", label: "Telephone Consultation" },
  { type: "multi_agency_meeting", label: "Multi-Agency Meeting" },
  { type: "case_conference", label: "Case Conference" },
  { type: "training_support", label: "Training Support" },
  { type: "other", label: "Other" },
];

export const CONSULTATION_OUTCOMES: { outcome: ConsultationOutcome; label: string }[] = [
  { outcome: "recommendations_made", label: "Recommendations Made" },
  { outcome: "further_referral", label: "Further Referral" },
  { outcome: "no_further_action", label: "No Further Action" },
  { outcome: "ongoing_support", label: "Ongoing Support" },
  { outcome: "escalated", label: "Escalated" },
];

export const CONSULTATION_URGENCIES: { urgency: ConsultationUrgency; label: string }[] = [
  { urgency: "emergency", label: "Emergency" },
  { urgency: "urgent", label: "Urgent" },
  { urgency: "routine", label: "Routine" },
  { urgency: "planned", label: "Planned" },
  { urgency: "follow_up", label: "Follow Up" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeProfessionalConsultationMetrics(
  records: ProfessionalConsultationRecord[],
): {
  total_consultations: number;
  recommendations_made_count: number;
  further_referral_count: number;
  escalated_count: number;
  emergency_count: number;
  recommendations_documented_rate: number | null;
  actions_agreed_rate: number | null;
  actions_completed_rate: number | null;
  staff_informed_rate: number | null;
  care_plan_updated_rate: number | null;
  parent_carer_informed_rate: number | null;
  social_worker_informed_rate: number | null;
  follow_up_required_count: number;
  follow_up_completed_rate: number | null;
  child_participated_rate: number | null;
  child_views_recorded_rate: number | null;
  consent_obtained_rate: number | null;
  unique_children: number;
  by_professional_type: Record<string, number>;
  by_consultation_type: Record<string, number>;
  by_consultation_outcome: Record<string, number>;
  by_consultation_urgency: Record<string, number>;
} {
  const recsMade = records.filter((r) => r.consultation_outcome === "recommendations_made").length;
  const furtherRef = records.filter((r) => r.consultation_outcome === "further_referral").length;
  const escalated = records.filter((r) => r.consultation_outcome === "escalated").length;
  const emergency = records.filter((r) => r.consultation_urgency === "emergency").length;

  const boolRate = (field: keyof ProfessionalConsultationRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const followUpRequired = records.filter((r) => r.follow_up_required).length;

  // follow_up_completed_rate: out of those requiring follow-up
  const followUpDenom = records.filter((r) => r.follow_up_required).length;
  const followUpDone = records.filter((r) => r.follow_up_required && r.follow_up_completed).length;
  const followUpCompletedRate = followUpDenom > 0
    ? Math.round((followUpDone / followUpDenom) * 1000) / 10
    : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byProfType: Record<string, number> = {};
  for (const r of records) byProfType[r.professional_type] = (byProfType[r.professional_type] ?? 0) + 1;

  const byConsType: Record<string, number> = {};
  for (const r of records) byConsType[r.consultation_type] = (byConsType[r.consultation_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.consultation_outcome] = (byOutcome[r.consultation_outcome] ?? 0) + 1;

  const byUrgency: Record<string, number> = {};
  for (const r of records) byUrgency[r.consultation_urgency] = (byUrgency[r.consultation_urgency] ?? 0) + 1;

  return {
    total_consultations: records.length,
    recommendations_made_count: recsMade,
    further_referral_count: furtherRef,
    escalated_count: escalated,
    emergency_count: emergency,
    recommendations_documented_rate: boolRate("recommendations_documented"),
    actions_agreed_rate: boolRate("actions_agreed"),
    actions_completed_rate: boolRate("actions_completed"),
    staff_informed_rate: boolRate("staff_informed"),
    care_plan_updated_rate: boolRate("care_plan_updated"),
    parent_carer_informed_rate: boolRate("parent_carer_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    follow_up_required_count: followUpRequired,
    follow_up_completed_rate: followUpCompletedRate,
    child_participated_rate: boolRate("child_participated"),
    child_views_recorded_rate: boolRate("child_views_recorded"),
    consent_obtained_rate: boolRate("consent_obtained"),
    unique_children: uniqueChildren,
    by_professional_type: byProfType,
    by_consultation_type: byConsType,
    by_consultation_outcome: byOutcome,
    by_consultation_urgency: byUrgency,
  };
}

export function identifyProfessionalConsultationAlerts(
  records: ProfessionalConsultationRecord[],
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

  // Emergency without actions completed
  for (const r of records) {
    if (r.consultation_urgency === "emergency" && !r.actions_completed) {
      alerts.push({
        type: "emergency_actions_incomplete",
        severity: "critical",
        message: `Emergency consultation for ${r.child_name} on ${r.consultation_date} — actions not yet completed`,
        id: r.id,
      });
    }
  }

  // Recommendations not documented
  const noRecs = records.filter((r) => !r.recommendations_documented).length;
  if (noRecs >= 1) {
    alerts.push({
      type: "recommendations_not_documented",
      severity: "high",
      message: `${noRecs} ${noRecs === 1 ? "consultation has" : "consultations have"} recommendations not documented — maintain records`,
      id: "recommendations_not_documented",
    });
  }

  // Follow-up overdue
  const followUpOverdue = records.filter((r) => r.follow_up_required && !r.follow_up_completed).length;
  if (followUpOverdue >= 1) {
    alerts.push({
      type: "follow_up_overdue",
      severity: "high",
      message: `${followUpOverdue} ${followUpOverdue === 1 ? "consultation has" : "consultations have"} outstanding follow-up — complete required actions`,
      id: "follow_up_overdue",
    });
  }

  // Care plan not updated
  const noPlanUpdate = records.filter((r) => !r.care_plan_updated).length;
  if (noPlanUpdate >= 2) {
    alerts.push({
      type: "care_plan_not_updated",
      severity: "medium",
      message: `${noPlanUpdate} consultations without care plan updated — review and update plans`,
      id: "care_plan_not_updated",
    });
  }

  // Consent not obtained
  const noConsent = records.filter((r) => !r.consent_obtained).length;
  if (noConsent >= 2) {
    alerts.push({
      type: "consent_not_obtained",
      severity: "medium",
      message: `${noConsent} consultations without consent obtained — ensure proper authorisation`,
      id: "consent_not_obtained",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    professionalType?: ProfessionalType;
    consultationType?: ConsultationType;
    consultationOutcome?: ConsultationOutcome;
    consultationUrgency?: ConsultationUrgency;
    limit?: number;
  },
): Promise<ServiceResult<ProfessionalConsultationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_professional_consultations") as SB).select("*").eq("home_id", homeId);
  if (filters?.professionalType) q = q.eq("professional_type", filters.professionalType);
  if (filters?.consultationType) q = q.eq("consultation_type", filters.consultationType);
  if (filters?.consultationOutcome) q = q.eq("consultation_outcome", filters.consultationOutcome);
  if (filters?.consultationUrgency) q = q.eq("consultation_urgency", filters.consultationUrgency);
  q = q.order("consultation_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    professionalType: ProfessionalType;
    consultationType: ConsultationType;
    consultationOutcome: ConsultationOutcome;
    consultationUrgency: ConsultationUrgency;
    consultationDate: string;
    professionalName: string;
    professionalOrganisation: string;
    childName: string;
    childId?: string | null;
    recommendationsDocumented?: boolean;
    actionsAgreed?: boolean;
    actionsCompleted?: boolean;
    staffInformed?: boolean;
    carePlanUpdated?: boolean;
    parentCarerInformed?: boolean;
    socialWorkerInformed?: boolean;
    followUpRequired?: boolean;
    followUpCompleted?: boolean;
    childParticipated?: boolean;
    childViewsRecorded?: boolean;
    consentObtained?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    consultedBy: string;
    nextConsultationDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ProfessionalConsultationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_professional_consultations") as SB)
    .insert({
      home_id: payload.homeId,
      professional_type: payload.professionalType,
      consultation_type: payload.consultationType,
      consultation_outcome: payload.consultationOutcome,
      consultation_urgency: payload.consultationUrgency,
      consultation_date: payload.consultationDate,
      professional_name: payload.professionalName,
      professional_organisation: payload.professionalOrganisation,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      recommendations_documented: payload.recommendationsDocumented ?? false,
      actions_agreed: payload.actionsAgreed ?? false,
      actions_completed: payload.actionsCompleted ?? false,
      staff_informed: payload.staffInformed ?? false,
      care_plan_updated: payload.carePlanUpdated ?? false,
      parent_carer_informed: payload.parentCarerInformed ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      follow_up_required: payload.followUpRequired ?? false,
      follow_up_completed: payload.followUpCompleted ?? false,
      child_participated: payload.childParticipated ?? false,
      child_views_recorded: payload.childViewsRecorded ?? false,
      consent_obtained: payload.consentObtained ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      consulted_by: payload.consultedBy,
      next_consultation_date: payload.nextConsultationDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    professionalType: ProfessionalType;
    consultationType: ConsultationType;
    consultationOutcome: ConsultationOutcome;
    consultationUrgency: ConsultationUrgency;
    consultationDate: string;
    professionalName: string;
    professionalOrganisation: string;
    childName: string;
    childId: string | null;
    recommendationsDocumented: boolean;
    actionsAgreed: boolean;
    actionsCompleted: boolean;
    staffInformed: boolean;
    carePlanUpdated: boolean;
    parentCarerInformed: boolean;
    socialWorkerInformed: boolean;
    followUpRequired: boolean;
    followUpCompleted: boolean;
    childParticipated: boolean;
    childViewsRecorded: boolean;
    consentObtained: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    consultedBy: string;
    nextConsultationDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ProfessionalConsultationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.professionalType !== undefined) mapped.professional_type = updates.professionalType;
  if (updates.consultationType !== undefined) mapped.consultation_type = updates.consultationType;
  if (updates.consultationOutcome !== undefined) mapped.consultation_outcome = updates.consultationOutcome;
  if (updates.consultationUrgency !== undefined) mapped.consultation_urgency = updates.consultationUrgency;
  if (updates.consultationDate !== undefined) mapped.consultation_date = updates.consultationDate;
  if (updates.professionalName !== undefined) mapped.professional_name = updates.professionalName;
  if (updates.professionalOrganisation !== undefined) mapped.professional_organisation = updates.professionalOrganisation;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.recommendationsDocumented !== undefined) mapped.recommendations_documented = updates.recommendationsDocumented;
  if (updates.actionsAgreed !== undefined) mapped.actions_agreed = updates.actionsAgreed;
  if (updates.actionsCompleted !== undefined) mapped.actions_completed = updates.actionsCompleted;
  if (updates.staffInformed !== undefined) mapped.staff_informed = updates.staffInformed;
  if (updates.carePlanUpdated !== undefined) mapped.care_plan_updated = updates.carePlanUpdated;
  if (updates.parentCarerInformed !== undefined) mapped.parent_carer_informed = updates.parentCarerInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.followUpRequired !== undefined) mapped.follow_up_required = updates.followUpRequired;
  if (updates.followUpCompleted !== undefined) mapped.follow_up_completed = updates.followUpCompleted;
  if (updates.childParticipated !== undefined) mapped.child_participated = updates.childParticipated;
  if (updates.childViewsRecorded !== undefined) mapped.child_views_recorded = updates.childViewsRecorded;
  if (updates.consentObtained !== undefined) mapped.consent_obtained = updates.consentObtained;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.consultedBy !== undefined) mapped.consulted_by = updates.consultedBy;
  if (updates.nextConsultationDate !== undefined) mapped.next_consultation_date = updates.nextConsultationDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_professional_consultations") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeProfessionalConsultationMetrics,
  identifyProfessionalConsultationAlerts,
};
