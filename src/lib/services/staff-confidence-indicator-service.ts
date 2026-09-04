// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF CONFIDENCE INDICATOR SERVICE
// Tracks staff confidence across key practice areas — identifying where staff
// feel strong and where they need support. Confidence affects practice quality
// and child outcomes. Part of the Cara Staff Development, Support and Risk
// Intelligence layer.
// CHR 2015 Reg 33 (monitoring the home), Reg 34 (employment of staff),
// Reg 13 (leadership and management), Reg 35 (behaviour management).
//
// Strengths-based, fair, contextual, evidence-led.
//
// SCCIF: Well-Led — "Staff are confident in their roles and supported
// to develop."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type PracticeArea =
  | "de_escalation"
  | "safeguarding"
  | "medication"
  | "recording"
  | "care_planning"
  | "communication"
  | "child_engagement"
  | "team_working"
  | "lone_working"
  | "professional_boundaries";

export type ConfidenceLevel =
  | "very_confident"
  | "confident"
  | "developing"
  | "low_confidence"
  | "no_confidence";

export type TrendDirection =
  | "improving"
  | "stable"
  | "declining"
  | "fluctuating"
  | "new_assessment";

export type AssessmentSource =
  | "self_assessment"
  | "supervision_observation"
  | "peer_feedback"
  | "manager_assessment"
  | "training_evaluation"
  | "incident_review"
  | "child_feedback"
  | "multi_source"
  | "annual_review"
  | "other";

export interface StaffConfidenceIndicatorRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  practice_area: PracticeArea;
  confidence_level: ConfidenceLevel;
  trend_direction: TrendDirection;
  assessment_source: AssessmentSource;
  session_date: string;
  assessed_by: string;
  confidence_description: string;
  evidence_basis: string;
  strengths_observed: string | null;
  development_needs: string | null;
  support_provided: string | null;
  training_linked: string | null;
  staff_self_reflection: string | null;
  manager_observation: string | null;
  previous_confidence_level: string | null;
  barriers_to_confidence: string | null;
  approved_by: string | null;
  approved_at: string | null;
  next_review_date: string | null;
  notes: string | null;
  evidence_based: boolean;
  staff_self_assessed: boolean;
  manager_validated: boolean;
  strengths_discussed: boolean;
  development_plan_linked: boolean;
  training_identified: boolean;
  mentoring_offered: boolean;
  supervision_discussed: boolean;
  wellbeing_considered: boolean;
  progress_tracked: boolean;
  staff_agreed: boolean;
  recorded_promptly: boolean | null; // null = not recorded; judgements are tri-state — credit needs === true, breach needs === false
  issues_found: string[];
  actions_taken: string[];
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PRACTICE_AREAS: { area: PracticeArea; label: string }[] = [
  { area: "de_escalation", label: "De-escalation" },
  { area: "safeguarding", label: "Safeguarding" },
  { area: "medication", label: "Medication" },
  { area: "recording", label: "Recording" },
  { area: "care_planning", label: "Care Planning" },
  { area: "communication", label: "Communication" },
  { area: "child_engagement", label: "Child Engagement" },
  { area: "team_working", label: "Team Working" },
  { area: "lone_working", label: "Lone Working" },
  { area: "professional_boundaries", label: "Professional Boundaries" },
];

export const CONFIDENCE_LEVELS: { level: ConfidenceLevel; label: string }[] = [
  { level: "very_confident", label: "Very Confident" },
  { level: "confident", label: "Confident" },
  { level: "developing", label: "Developing" },
  { level: "low_confidence", label: "Low Confidence" },
  { level: "no_confidence", label: "No Confidence" },
];

export const TREND_DIRECTIONS: { direction: TrendDirection; label: string }[] = [
  { direction: "improving", label: "Improving" },
  { direction: "stable", label: "Stable" },
  { direction: "declining", label: "Declining" },
  { direction: "fluctuating", label: "Fluctuating" },
  { direction: "new_assessment", label: "New Assessment" },
];

export const ASSESSMENT_SOURCES: { source: AssessmentSource; label: string }[] = [
  { source: "self_assessment", label: "Self Assessment" },
  { source: "supervision_observation", label: "Supervision Observation" },
  { source: "peer_feedback", label: "Peer Feedback" },
  { source: "manager_assessment", label: "Manager Assessment" },
  { source: "training_evaluation", label: "Training Evaluation" },
  { source: "incident_review", label: "Incident Review" },
  { source: "child_feedback", label: "Child Feedback" },
  { source: "multi_source", label: "Multi Source" },
  { source: "annual_review", label: "Annual Review" },
  { source: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeConfidenceIndicatorMetrics(
  records: StaffConfidenceIndicatorRecord[],
): {
  total_indicators: number;
  low_confidence_count: number;
  declining_count: number;
  no_confidence_count: number;
  improving_count: number;
  evidence_based_rate: number | null;
  self_assessed_rate: number | null;
  manager_validated_rate: number | null;
  strengths_discussed_rate: number | null;
  development_plan_rate: number | null;
  training_identified_rate: number | null;
  mentoring_offered_rate: number | null;
  supervision_discussed_rate: number | null;
  wellbeing_considered_rate: number | null;
  progress_tracked_rate: number | null;
  staff_agreed_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_practice_area: Record<string, number>;
  by_confidence_level: Record<string, number>;
  by_trend_direction: Record<string, number>;
  by_assessment_source: Record<string, number>;
} {
  const lowConfidenceCount = records.filter(
    (r) => r.confidence_level === "low_confidence" || r.confidence_level === "no_confidence",
  ).length;
  const decliningCount = records.filter((r) => r.trend_direction === "declining").length;
  const noConfidenceCount = records.filter((r) => r.confidence_level === "no_confidence").length;
  const improvingCount = records.filter((r) => r.trend_direction === "improving").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof StaffConfidenceIndicatorRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byPracticeArea: Record<string, number> = {};
  for (const r of records) byPracticeArea[r.practice_area] = (byPracticeArea[r.practice_area] ?? 0) + 1;

  const byConfidenceLevel: Record<string, number> = {};
  for (const r of records) byConfidenceLevel[r.confidence_level] = (byConfidenceLevel[r.confidence_level] ?? 0) + 1;

  const byTrendDirection: Record<string, number> = {};
  for (const r of records) byTrendDirection[r.trend_direction] = (byTrendDirection[r.trend_direction] ?? 0) + 1;

  const byAssessmentSource: Record<string, number> = {};
  for (const r of records) byAssessmentSource[r.assessment_source] = (byAssessmentSource[r.assessment_source] ?? 0) + 1;

  return {
    total_indicators: records.length,
    low_confidence_count: lowConfidenceCount,
    declining_count: decliningCount,
    no_confidence_count: noConfidenceCount,
    improving_count: improvingCount,
    evidence_based_rate: boolRate("evidence_based"),
    self_assessed_rate: boolRate("staff_self_assessed"),
    manager_validated_rate: boolRate("manager_validated"),
    strengths_discussed_rate: boolRate("strengths_discussed"),
    development_plan_rate: boolRate("development_plan_linked"),
    training_identified_rate: boolRate("training_identified"),
    mentoring_offered_rate: boolRate("mentoring_offered"),
    supervision_discussed_rate: boolRate("supervision_discussed"),
    wellbeing_considered_rate: boolRate("wellbeing_considered"),
    progress_tracked_rate: boolRate("progress_tracked"),
    staff_agreed_rate: boolRate("staff_agreed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: uniqueStaff,
    by_practice_area: byPracticeArea,
    by_confidence_level: byConfidenceLevel,
    by_trend_direction: byTrendDirection,
    by_assessment_source: byAssessmentSource,
  };
}

export function identifyConfidenceIndicatorAlerts(
  records: StaffConfidenceIndicatorRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical per-record: no confidence AND declining
  for (const r of records) {
    if (r.confidence_level === "no_confidence" && r.trend_direction === "declining") {
      alerts.push({
        type: "no_confidence_declining",
        severity: "critical",
        message: `${r.staff_name} has no confidence and declining trend in ${r.practice_area.replace(/_/g, " ")} — immediate support needed.`,
        record_id: r.id,
      });
    }
  }

  // High: low confidence without development plan
  const lowNoSupport = records.filter(
    (r) =>
      (r.confidence_level === "low_confidence" || r.confidence_level === "no_confidence") &&
      r.development_plan_linked === false,
  ).length;
  if (lowNoSupport >= 1) {
    alerts.push({
      type: "low_confidence_no_support",
      severity: "high",
      message: `${lowNoSupport} indicator${lowNoSupport === 1 ? " has" : "s have"} low or no confidence without a linked development plan.`,
    });
  }

  // High: strengths not discussed
  const noStrengths = records.filter((r) => r.strengths_discussed === false).length;
  if (noStrengths >= 1) {
    alerts.push({
      type: "no_strengths_discussed",
      severity: "high",
      message: `${noStrengths} indicator${noStrengths === 1 ? " has" : "s have"} strengths not discussed with staff.`,
    });
  }

  // Medium: no mentoring offered (threshold >= 2)
  const noMentoring = records.filter((r) => r.mentoring_offered === false).length;
  if (noMentoring >= 2) {
    alerts.push({
      type: "no_mentoring_offered",
      severity: "medium",
      message: `${noMentoring} indicators have no mentoring offered.`,
    });
  }

  // Medium: no wellbeing considered (threshold >= 2)
  const noWellbeing = records.filter((r) => r.wellbeing_considered === false).length;
  if (noWellbeing >= 2) {
    alerts.push({
      type: "no_wellbeing_considered",
      severity: "medium",
      message: `${noWellbeing} indicators have wellbeing not considered.`,
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listConfidenceIndicators(
  homeId: string,
  filters?: {
    practiceArea?: PracticeArea;
    confidenceLevel?: ConfidenceLevel;
    trendDirection?: TrendDirection;
    assessmentSource?: AssessmentSource;
    limit?: number;
  },
): Promise<ServiceResult<StaffConfidenceIndicatorRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_confidence_indicators") as SB).select("*").eq("home_id", homeId);
  if (filters?.practiceArea) q = q.eq("practice_area", filters.practiceArea);
  if (filters?.confidenceLevel) q = q.eq("confidence_level", filters.confidenceLevel);
  if (filters?.trendDirection) q = q.eq("trend_direction", filters.trendDirection);
  if (filters?.assessmentSource) q = q.eq("assessment_source", filters.assessmentSource);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createConfidenceIndicator(
  payload: {
    homeId: string;
    staffName: string;
    staffId?: string | null;
    practiceArea: PracticeArea;
    confidenceLevel: ConfidenceLevel;
    trendDirection: TrendDirection;
    assessmentSource: AssessmentSource;
    sessionDate: string;
    assessedBy: string;
    confidenceDescription: string;
    evidenceBasis: string;
    strengthsObserved?: string | null;
    developmentNeeds?: string | null;
    supportProvided?: string | null;
    trainingLinked?: string | null;
    staffSelfReflection?: string | null;
    managerObservation?: string | null;
    previousConfidenceLevel?: string | null;
    barriersToConfidence?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    nextReviewDate?: string | null;
    notes?: string | null;
    evidenceBased?: boolean;
    staffSelfAssessed?: boolean;
    managerValidated?: boolean;
    strengthsDiscussed?: boolean;
    developmentPlanLinked?: boolean;
    trainingIdentified?: boolean;
    mentoringOffered?: boolean;
    supervisionDiscussed?: boolean;
    wellbeingConsidered?: boolean;
    progressTracked?: boolean;
    staffAgreed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
  },
): Promise<ServiceResult<StaffConfidenceIndicatorRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_confidence_indicators") as SB)
    .insert({
      home_id: payload.homeId,
      staff_name: payload.staffName,
      staff_id: payload.staffId ?? null,
      practice_area: payload.practiceArea,
      confidence_level: payload.confidenceLevel,
      trend_direction: payload.trendDirection,
      assessment_source: payload.assessmentSource,
      session_date: payload.sessionDate,
      assessed_by: payload.assessedBy,
      confidence_description: payload.confidenceDescription,
      evidence_basis: payload.evidenceBasis,
      strengths_observed: payload.strengthsObserved ?? null,
      development_needs: payload.developmentNeeds ?? null,
      support_provided: payload.supportProvided ?? null,
      training_linked: payload.trainingLinked ?? null,
      staff_self_reflection: payload.staffSelfReflection ?? null,
      manager_observation: payload.managerObservation ?? null,
      previous_confidence_level: payload.previousConfidenceLevel ?? null,
      barriers_to_confidence: payload.barriersToConfidence ?? null,
      approved_by: payload.approvedBy ?? null,
      approved_at: payload.approvedAt ?? null,
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
      evidence_based: payload.evidenceBased ?? false,
      staff_self_assessed: payload.staffSelfAssessed ?? false,
      manager_validated: payload.managerValidated ?? false,
      strengths_discussed: payload.strengthsDiscussed ?? false,
      development_plan_linked: payload.developmentPlanLinked ?? false,
      training_identified: payload.trainingIdentified ?? false,
      mentoring_offered: payload.mentoringOffered ?? false,
      supervision_discussed: payload.supervisionDiscussed ?? false,
      wellbeing_considered: payload.wellbeingConsidered ?? false,
      progress_tracked: payload.progressTracked ?? false,
      staff_agreed: payload.staffAgreed ?? false,
      recorded_promptly: payload.recordedPromptly ?? null,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateConfidenceIndicator(
  id: string,
  updates: Partial<{
    staffName: string;
    staffId: string | null;
    practiceArea: PracticeArea;
    confidenceLevel: ConfidenceLevel;
    trendDirection: TrendDirection;
    assessmentSource: AssessmentSource;
    sessionDate: string;
    assessedBy: string;
    confidenceDescription: string;
    evidenceBasis: string;
    strengthsObserved: string | null;
    developmentNeeds: string | null;
    supportProvided: string | null;
    trainingLinked: string | null;
    staffSelfReflection: string | null;
    managerObservation: string | null;
    previousConfidenceLevel: string | null;
    barriersToConfidence: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    nextReviewDate: string | null;
    notes: string | null;
    evidenceBased: boolean;
    staffSelfAssessed: boolean;
    managerValidated: boolean;
    strengthsDiscussed: boolean;
    developmentPlanLinked: boolean;
    trainingIdentified: boolean;
    mentoringOffered: boolean;
    supervisionDiscussed: boolean;
    wellbeingConsidered: boolean;
    progressTracked: boolean;
    staffAgreed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
  }>,
): Promise<ServiceResult<StaffConfidenceIndicatorRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.staffId !== undefined) mapped.staff_id = updates.staffId;
  if (updates.practiceArea !== undefined) mapped.practice_area = updates.practiceArea;
  if (updates.confidenceLevel !== undefined) mapped.confidence_level = updates.confidenceLevel;
  if (updates.trendDirection !== undefined) mapped.trend_direction = updates.trendDirection;
  if (updates.assessmentSource !== undefined) mapped.assessment_source = updates.assessmentSource;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.confidenceDescription !== undefined) mapped.confidence_description = updates.confidenceDescription;
  if (updates.evidenceBasis !== undefined) mapped.evidence_basis = updates.evidenceBasis;
  if (updates.strengthsObserved !== undefined) mapped.strengths_observed = updates.strengthsObserved;
  if (updates.developmentNeeds !== undefined) mapped.development_needs = updates.developmentNeeds;
  if (updates.supportProvided !== undefined) mapped.support_provided = updates.supportProvided;
  if (updates.trainingLinked !== undefined) mapped.training_linked = updates.trainingLinked;
  if (updates.staffSelfReflection !== undefined) mapped.staff_self_reflection = updates.staffSelfReflection;
  if (updates.managerObservation !== undefined) mapped.manager_observation = updates.managerObservation;
  if (updates.previousConfidenceLevel !== undefined) mapped.previous_confidence_level = updates.previousConfidenceLevel;
  if (updates.barriersToConfidence !== undefined) mapped.barriers_to_confidence = updates.barriersToConfidence;
  if (updates.approvedBy !== undefined) mapped.approved_by = updates.approvedBy;
  if (updates.approvedAt !== undefined) mapped.approved_at = updates.approvedAt;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  if (updates.evidenceBased !== undefined) mapped.evidence_based = updates.evidenceBased;
  if (updates.staffSelfAssessed !== undefined) mapped.staff_self_assessed = updates.staffSelfAssessed;
  if (updates.managerValidated !== undefined) mapped.manager_validated = updates.managerValidated;
  if (updates.strengthsDiscussed !== undefined) mapped.strengths_discussed = updates.strengthsDiscussed;
  if (updates.developmentPlanLinked !== undefined) mapped.development_plan_linked = updates.developmentPlanLinked;
  if (updates.trainingIdentified !== undefined) mapped.training_identified = updates.trainingIdentified;
  if (updates.mentoringOffered !== undefined) mapped.mentoring_offered = updates.mentoringOffered;
  if (updates.supervisionDiscussed !== undefined) mapped.supervision_discussed = updates.supervisionDiscussed;
  if (updates.wellbeingConsidered !== undefined) mapped.wellbeing_considered = updates.wellbeingConsidered;
  if (updates.progressTracked !== undefined) mapped.progress_tracked = updates.progressTracked;
  if (updates.staffAgreed !== undefined) mapped.staff_agreed = updates.staffAgreed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;

  const { data, error } = await (s.from("cs_staff_confidence_indicators") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeConfidenceIndicatorMetrics,
  identifyConfidenceIndicatorAlerts,
};
