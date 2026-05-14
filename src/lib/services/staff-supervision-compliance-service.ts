// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF SUPERVISION COMPLIANCE SERVICE
// Monitors staff supervision frequency, quality, action
// completion, and professional development tracking.
// CHR 2015 Reg 33 (employment — supervision and appraisal),
// Reg 32 (fitness of workers — ongoing competence).
//
// Covers: supervision type, frequency compliance, quality rating,
// action completion, and professional development.
//
// SCCIF: Leadership — "Staff receive regular and effective supervision."
// "Supervision drives practice improvement."
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

export type SupervisionType =
  | "formal_one_to_one"
  | "group_supervision"
  | "ad_hoc"
  | "reflective_practice"
  | "clinical_supervision"
  | "management_supervision"
  | "peer_supervision"
  | "external_supervision"
  | "probationary_review"
  | "other";

export type FrequencyCompliance =
  | "on_schedule"
  | "slightly_overdue"
  | "significantly_overdue"
  | "missed"
  | "ahead_of_schedule";

export type QualityRating =
  | "excellent"
  | "good"
  | "satisfactory"
  | "poor"
  | "not_assessed";

export type ActionCompletion =
  | "all_complete"
  | "mostly_complete"
  | "partially_complete"
  | "not_started"
  | "not_applicable";

export interface StaffSupervisionComplianceRecord {
  id: string;
  home_id: string;
  supervision_type: SupervisionType;
  frequency_compliance: FrequencyCompliance;
  quality_rating: QualityRating;
  action_completion: ActionCompletion;
  supervision_date: string;
  staff_name: string;
  supervisor_name: string;
  agenda_prepared: boolean;
  safeguarding_discussed: boolean;
  wellbeing_discussed: boolean;
  training_needs_reviewed: boolean;
  actions_agreed: boolean;
  previous_actions_reviewed: boolean;
  professional_development_planned: boolean;
  concerns_raised: boolean;
  confidentiality_maintained: boolean;
  notes_shared: boolean;
  manager_oversight: boolean;
  recorded_promptly: boolean;
  supervision_duration_minutes: number;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SUPERVISION_TYPES: { type: SupervisionType; label: string }[] = [
  { type: "formal_one_to_one", label: "Formal 1-to-1" },
  { type: "group_supervision", label: "Group Supervision" },
  { type: "ad_hoc", label: "Ad Hoc" },
  { type: "reflective_practice", label: "Reflective Practice" },
  { type: "clinical_supervision", label: "Clinical Supervision" },
  { type: "management_supervision", label: "Management Supervision" },
  { type: "peer_supervision", label: "Peer Supervision" },
  { type: "external_supervision", label: "External Supervision" },
  { type: "probationary_review", label: "Probationary Review" },
  { type: "other", label: "Other" },
];

export const FREQUENCY_COMPLIANCES: { compliance: FrequencyCompliance; label: string }[] = [
  { compliance: "on_schedule", label: "On Schedule" },
  { compliance: "slightly_overdue", label: "Slightly Overdue" },
  { compliance: "significantly_overdue", label: "Significantly Overdue" },
  { compliance: "missed", label: "Missed" },
  { compliance: "ahead_of_schedule", label: "Ahead of Schedule" },
];

export const QUALITY_RATINGS: { rating: QualityRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "satisfactory", label: "Satisfactory" },
  { rating: "poor", label: "Poor" },
  { rating: "not_assessed", label: "Not Assessed" },
];

export const ACTION_COMPLETIONS: { completion: ActionCompletion; label: string }[] = [
  { completion: "all_complete", label: "All Complete" },
  { completion: "mostly_complete", label: "Mostly Complete" },
  { completion: "partially_complete", label: "Partially Complete" },
  { completion: "not_started", label: "Not Started" },
  { completion: "not_applicable", label: "Not Applicable" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffSupervisionComplianceMetrics(
  records: StaffSupervisionComplianceRecord[],
): {
  total_supervisions: number;
  overdue_count: number;
  missed_count: number;
  poor_quality_count: number;
  not_started_count: number;
  agenda_prepared_rate: number;
  safeguarding_discussed_rate: number;
  wellbeing_discussed_rate: number;
  training_needs_rate: number;
  actions_agreed_rate: number;
  previous_actions_rate: number;
  professional_development_rate: number;
  confidentiality_rate: number;
  notes_shared_rate: number;
  manager_oversight_rate: number;
  recorded_promptly_rate: number;
  average_duration: number;
  unique_staff: number;
  by_supervision_type: Record<string, number>;
  by_frequency_compliance: Record<string, number>;
  by_quality_rating: Record<string, number>;
  by_action_completion: Record<string, number>;
} {
  const overdue = records.filter((r) => r.frequency_compliance === "significantly_overdue").length;
  const missed = records.filter((r) => r.frequency_compliance === "missed").length;
  const poorQuality = records.filter((r) => r.quality_rating === "poor").length;
  const notStarted = records.filter((r) => r.action_completion === "not_started").length;

  const boolRate = (field: keyof StaffSupervisionComplianceRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const avgDuration =
    records.length > 0
      ? Math.round(
          (records.reduce((sum, r) => sum + r.supervision_duration_minutes, 0) / records.length) * 10,
        ) / 10
      : 0;

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.supervision_type] = (byType[r.supervision_type] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.frequency_compliance] = (byCompliance[r.frequency_compliance] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.quality_rating] = (byQuality[r.quality_rating] ?? 0) + 1;

  const byAction: Record<string, number> = {};
  for (const r of records) byAction[r.action_completion] = (byAction[r.action_completion] ?? 0) + 1;

  return {
    total_supervisions: records.length,
    overdue_count: overdue,
    missed_count: missed,
    poor_quality_count: poorQuality,
    not_started_count: notStarted,
    agenda_prepared_rate: boolRate("agenda_prepared"),
    safeguarding_discussed_rate: boolRate("safeguarding_discussed"),
    wellbeing_discussed_rate: boolRate("wellbeing_discussed"),
    training_needs_rate: boolRate("training_needs_reviewed"),
    actions_agreed_rate: boolRate("actions_agreed"),
    previous_actions_rate: boolRate("previous_actions_reviewed"),
    professional_development_rate: boolRate("professional_development_planned"),
    confidentiality_rate: boolRate("confidentiality_maintained"),
    notes_shared_rate: boolRate("notes_shared"),
    manager_oversight_rate: boolRate("manager_oversight"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    average_duration: avgDuration,
    unique_staff: uniqueStaff,
    by_supervision_type: byType,
    by_frequency_compliance: byCompliance,
    by_quality_rating: byQuality,
    by_action_completion: byAction,
  };
}

export function identifyStaffSupervisionComplianceAlerts(
  records: StaffSupervisionComplianceRecord[],
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

  // Missed supervision with concerns raised
  for (const r of records) {
    if (r.frequency_compliance === "missed" && r.concerns_raised) {
      alerts.push({
        type: "missed_with_concerns",
        severity: "critical",
        message: `${r.staff_name} missed supervision with concerns raised — arrange urgent supervision`,
        id: r.id,
      });
    }
  }

  // Significantly overdue
  const overdueCount = records.filter((r) => r.frequency_compliance === "significantly_overdue" || r.frequency_compliance === "missed").length;
  if (overdueCount >= 1) {
    alerts.push({
      type: "supervision_overdue",
      severity: "high",
      message: `${overdueCount} ${overdueCount === 1 ? "supervision is" : "supervisions are"} significantly overdue or missed — ensure compliance`,
      id: "supervision_overdue",
    });
  }

  // Safeguarding not discussed
  const noSafeguarding = records.filter((r) => !r.safeguarding_discussed).length;
  if (noSafeguarding >= 1) {
    alerts.push({
      type: "safeguarding_not_discussed",
      severity: "high",
      message: `${noSafeguarding} ${noSafeguarding === 1 ? "supervision has" : "supervisions have"} safeguarding not discussed — ensure standing agenda item`,
      id: "safeguarding_not_discussed",
    });
  }

  // Previous actions not reviewed
  const noReview = records.filter((r) => !r.previous_actions_reviewed).length;
  if (noReview >= 2) {
    alerts.push({
      type: "actions_not_reviewed",
      severity: "medium",
      message: `${noReview} supervisions without previous actions reviewed — strengthen follow-through`,
      id: "actions_not_reviewed",
    });
  }

  // Training needs not reviewed
  const noTraining = records.filter((r) => !r.training_needs_reviewed).length;
  if (noTraining >= 2) {
    alerts.push({
      type: "training_not_reviewed",
      severity: "medium",
      message: `${noTraining} supervisions without training needs reviewed — review development plans`,
      id: "training_not_reviewed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    supervisionType?: SupervisionType;
    frequencyCompliance?: FrequencyCompliance;
    qualityRating?: QualityRating;
    actionCompletion?: ActionCompletion;
    limit?: number;
  },
): Promise<ServiceResult<StaffSupervisionComplianceRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_supervision_compliance") as SB).select("*").eq("home_id", homeId);
  if (filters?.supervisionType) q = q.eq("supervision_type", filters.supervisionType);
  if (filters?.frequencyCompliance) q = q.eq("frequency_compliance", filters.frequencyCompliance);
  if (filters?.qualityRating) q = q.eq("quality_rating", filters.qualityRating);
  if (filters?.actionCompletion) q = q.eq("action_completion", filters.actionCompletion);
  q = q.order("supervision_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    supervisionType: SupervisionType;
    frequencyCompliance: FrequencyCompliance;
    qualityRating: QualityRating;
    actionCompletion: ActionCompletion;
    supervisionDate: string;
    staffName: string;
    supervisorName: string;
    agendaPrepared?: boolean;
    safeguardingDiscussed?: boolean;
    wellbeingDiscussed?: boolean;
    trainingNeedsReviewed?: boolean;
    actionsAgreed?: boolean;
    previousActionsReviewed?: boolean;
    professionalDevelopmentPlanned?: boolean;
    concernsRaised?: boolean;
    confidentialityMaintained?: boolean;
    notesShared?: boolean;
    managerOversight?: boolean;
    recordedPromptly?: boolean;
    supervisionDurationMinutes: number;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffSupervisionComplianceRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_supervision_compliance") as SB)
    .insert({
      home_id: payload.homeId,
      supervision_type: payload.supervisionType,
      frequency_compliance: payload.frequencyCompliance,
      quality_rating: payload.qualityRating,
      action_completion: payload.actionCompletion,
      supervision_date: payload.supervisionDate,
      staff_name: payload.staffName,
      supervisor_name: payload.supervisorName,
      agenda_prepared: payload.agendaPrepared ?? true,
      safeguarding_discussed: payload.safeguardingDiscussed ?? true,
      wellbeing_discussed: payload.wellbeingDiscussed ?? true,
      training_needs_reviewed: payload.trainingNeedsReviewed ?? true,
      actions_agreed: payload.actionsAgreed ?? true,
      previous_actions_reviewed: payload.previousActionsReviewed ?? true,
      professional_development_planned: payload.professionalDevelopmentPlanned ?? true,
      concerns_raised: payload.concernsRaised ?? false,
      confidentiality_maintained: payload.confidentialityMaintained ?? true,
      notes_shared: payload.notesShared ?? true,
      manager_oversight: payload.managerOversight ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      supervision_duration_minutes: payload.supervisionDurationMinutes,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
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
    supervisionType: SupervisionType;
    frequencyCompliance: FrequencyCompliance;
    qualityRating: QualityRating;
    actionCompletion: ActionCompletion;
    supervisionDate: string;
    staffName: string;
    supervisorName: string;
    agendaPrepared: boolean;
    safeguardingDiscussed: boolean;
    wellbeingDiscussed: boolean;
    trainingNeedsReviewed: boolean;
    actionsAgreed: boolean;
    previousActionsReviewed: boolean;
    professionalDevelopmentPlanned: boolean;
    concernsRaised: boolean;
    confidentialityMaintained: boolean;
    notesShared: boolean;
    managerOversight: boolean;
    recordedPromptly: boolean;
    supervisionDurationMinutes: number;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffSupervisionComplianceRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.supervisionType !== undefined) mapped.supervision_type = updates.supervisionType;
  if (updates.frequencyCompliance !== undefined) mapped.frequency_compliance = updates.frequencyCompliance;
  if (updates.qualityRating !== undefined) mapped.quality_rating = updates.qualityRating;
  if (updates.actionCompletion !== undefined) mapped.action_completion = updates.actionCompletion;
  if (updates.supervisionDate !== undefined) mapped.supervision_date = updates.supervisionDate;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.supervisorName !== undefined) mapped.supervisor_name = updates.supervisorName;
  if (updates.agendaPrepared !== undefined) mapped.agenda_prepared = updates.agendaPrepared;
  if (updates.safeguardingDiscussed !== undefined) mapped.safeguarding_discussed = updates.safeguardingDiscussed;
  if (updates.wellbeingDiscussed !== undefined) mapped.wellbeing_discussed = updates.wellbeingDiscussed;
  if (updates.trainingNeedsReviewed !== undefined) mapped.training_needs_reviewed = updates.trainingNeedsReviewed;
  if (updates.actionsAgreed !== undefined) mapped.actions_agreed = updates.actionsAgreed;
  if (updates.previousActionsReviewed !== undefined) mapped.previous_actions_reviewed = updates.previousActionsReviewed;
  if (updates.professionalDevelopmentPlanned !== undefined) mapped.professional_development_planned = updates.professionalDevelopmentPlanned;
  if (updates.concernsRaised !== undefined) mapped.concerns_raised = updates.concernsRaised;
  if (updates.confidentialityMaintained !== undefined) mapped.confidentiality_maintained = updates.confidentialityMaintained;
  if (updates.notesShared !== undefined) mapped.notes_shared = updates.notesShared;
  if (updates.managerOversight !== undefined) mapped.manager_oversight = updates.managerOversight;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.supervisionDurationMinutes !== undefined) mapped.supervision_duration_minutes = updates.supervisionDurationMinutes;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_supervision_compliance") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffSupervisionComplianceMetrics,
  identifyStaffSupervisionComplianceAlerts,
};
