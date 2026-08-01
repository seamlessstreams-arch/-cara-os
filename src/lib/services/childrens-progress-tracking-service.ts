// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S PROGRESS TRACKING SERVICE
// Tracks individual children's progress across all outcome domains
// including education, health, emotional wellbeing, relationships,
// independence, and participation. Maps to Every Child Matters outcomes.
// CHR 2015 Reg 6 (quality of care — positive outcomes),
// Reg 7 (individual child — holistic development),
// Reg 14 (care planning — progress reviews).
//
// Covers: educational attainment, emotional resilience, physical health,
// social skills, independence milestones, participation levels,
// cultural identity, and placement stability progress.
//
// SCCIF: Overall Experiences — "Children make measurable progress."
// "Outcomes are tracked and improved for each child."
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

export type OutcomeDomain =
  | "education_learning"
  | "health_physical"
  | "emotional_wellbeing"
  | "social_relationships"
  | "independence_skills"
  | "participation_voice"
  | "cultural_identity"
  | "placement_stability"
  | "family_contact"
  | "other";

export type ProgressRating =
  | "significant_progress"
  | "good_progress"
  | "some_progress"
  | "no_change"
  | "regression";

export type AssessmentTool =
  | "sdq"
  | "star_chart"
  | "observation"
  | "self_assessment"
  | "professional_assessment"
  | "standardised_test"
  | "care_plan_review"
  | "key_worker_report"
  | "multi_agency_assessment"
  | "other";

export type ReviewPeriod =
  | "weekly"
  | "monthly"
  | "termly"
  | "six_monthly"
  | "annual";

export interface ChildrensProgressTrackingRecord {
  id: string;
  home_id: string;
  outcome_domain: OutcomeDomain;
  progress_rating: ProgressRating;
  assessment_tool: AssessmentTool;
  review_period: ReviewPeriod;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  baseline_established: boolean;
  targets_set: boolean;
  targets_smart: boolean;
  child_involved: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  evidence_documented: boolean;
  care_plan_updated: boolean;
  celebration_planned: boolean;
  barriers_identified: boolean;
  support_in_place: boolean;
  multi_agency_input: boolean;
  issues_found: string[];
  actions_taken: string[];
  assessed_by: string;
  current_score: number | null;
  previous_score: number | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const OUTCOME_DOMAINS: { domain: OutcomeDomain; label: string }[] = [
  { domain: "education_learning", label: "Education & Learning" },
  { domain: "health_physical", label: "Health & Physical" },
  { domain: "emotional_wellbeing", label: "Emotional Wellbeing" },
  { domain: "social_relationships", label: "Social Relationships" },
  { domain: "independence_skills", label: "Independence Skills" },
  { domain: "participation_voice", label: "Participation & Voice" },
  { domain: "cultural_identity", label: "Cultural Identity" },
  { domain: "placement_stability", label: "Placement Stability" },
  { domain: "family_contact", label: "Family Contact" },
  { domain: "other", label: "Other" },
];

export const PROGRESS_RATINGS: { rating: ProgressRating; label: string }[] = [
  { rating: "significant_progress", label: "Significant Progress" },
  { rating: "good_progress", label: "Good Progress" },
  { rating: "some_progress", label: "Some Progress" },
  { rating: "no_change", label: "No Change" },
  { rating: "regression", label: "Regression" },
];

export const ASSESSMENT_TOOLS: { tool: AssessmentTool; label: string }[] = [
  { tool: "sdq", label: "SDQ" },
  { tool: "star_chart", label: "Star Chart" },
  { tool: "observation", label: "Observation" },
  { tool: "self_assessment", label: "Self-Assessment" },
  { tool: "professional_assessment", label: "Professional Assessment" },
  { tool: "standardised_test", label: "Standardised Test" },
  { tool: "care_plan_review", label: "Care Plan Review" },
  { tool: "key_worker_report", label: "Key Worker Report" },
  { tool: "multi_agency_assessment", label: "Multi-Agency Assessment" },
  { tool: "other", label: "Other" },
];

export const REVIEW_PERIODS: { period: ReviewPeriod; label: string }[] = [
  { period: "weekly", label: "Weekly" },
  { period: "monthly", label: "Monthly" },
  { period: "termly", label: "Termly" },
  { period: "six_monthly", label: "Six Monthly" },
  { period: "annual", label: "Annual" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeChildrensProgressMetrics(
  records: ChildrensProgressTrackingRecord[],
): {
  total_assessments: number;
  significant_progress_count: number;
  good_progress_count: number;
  some_progress_count: number;
  no_change_count: number;
  regression_count: number;
  positive_progress_rate: number | null;
  baseline_established_rate: number | null;
  targets_set_rate: number | null;
  targets_smart_rate: number | null;
  child_involved_rate: number | null;
  social_worker_informed_rate: number | null;
  parent_informed_rate: number | null;
  evidence_documented_rate: number | null;
  care_plan_updated_rate: number | null;
  celebration_planned_rate: number | null;
  barriers_identified_rate: number | null;
  support_in_place_rate: number | null;
  multi_agency_rate: number | null;
  unique_children: number;
  by_outcome_domain: Record<string, number>;
  by_progress_rating: Record<string, number>;
  by_assessment_tool: Record<string, number>;
  by_review_period: Record<string, number>;
} {
  const significant = records.filter((r) => r.progress_rating === "significant_progress").length;
  const goodProg = records.filter((r) => r.progress_rating === "good_progress").length;
  const some = records.filter((r) => r.progress_rating === "some_progress").length;
  const noChange = records.filter((r) => r.progress_rating === "no_change").length;
  const regression = records.filter((r) => r.progress_rating === "regression").length;

  const positiveCount = significant + goodProg + some;
  const positiveRate = records.length > 0
    ? Math.round((positiveCount / records.length) * 1000) / 10
    : null;

  const boolRate = (field: keyof ChildrensProgressTrackingRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byDomain: Record<string, number> = {};
  for (const r of records) byDomain[r.outcome_domain] = (byDomain[r.outcome_domain] ?? 0) + 1;

  const byRating: Record<string, number> = {};
  for (const r of records) byRating[r.progress_rating] = (byRating[r.progress_rating] ?? 0) + 1;

  const byTool: Record<string, number> = {};
  for (const r of records) byTool[r.assessment_tool] = (byTool[r.assessment_tool] ?? 0) + 1;

  const byPeriod: Record<string, number> = {};
  for (const r of records) byPeriod[r.review_period] = (byPeriod[r.review_period] ?? 0) + 1;

  return {
    total_assessments: records.length,
    significant_progress_count: significant,
    good_progress_count: goodProg,
    some_progress_count: some,
    no_change_count: noChange,
    regression_count: regression,
    positive_progress_rate: positiveRate,
    baseline_established_rate: boolRate("baseline_established"),
    targets_set_rate: boolRate("targets_set"),
    targets_smart_rate: boolRate("targets_smart"),
    child_involved_rate: boolRate("child_involved"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    evidence_documented_rate: boolRate("evidence_documented"),
    care_plan_updated_rate: boolRate("care_plan_updated"),
    celebration_planned_rate: boolRate("celebration_planned"),
    barriers_identified_rate: boolRate("barriers_identified"),
    support_in_place_rate: boolRate("support_in_place"),
    multi_agency_rate: boolRate("multi_agency_input"),
    unique_children: uniqueChildren,
    by_outcome_domain: byDomain,
    by_progress_rating: byRating,
    by_assessment_tool: byTool,
    by_review_period: byPeriod,
  };
}

export function identifyChildrensProgressAlerts(
  records: ChildrensProgressTrackingRecord[],
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

  // Regression detected
  for (const r of records) {
    if (r.progress_rating === "regression") {
      alerts.push({
        type: "regression_detected",
        severity: "critical",
        message: `${r.child_name} showing regression in ${r.outcome_domain.replace(/_/g, " ")} on ${r.assessment_date} — urgent review needed`,
        id: r.id,
      });
    }
  }

  // No baseline established
  const noBaseline = records.filter((r) => !r.baseline_established).length;
  if (noBaseline >= 1) {
    alerts.push({
      type: "no_baseline",
      severity: "high",
      message: `${noBaseline} ${noBaseline === 1 ? "assessment has" : "assessments have"} no baseline established — cannot measure progress`,
      id: "no_baseline",
    });
  }

  // Child not involved
  const notInvolved = records.filter((r) => !r.child_involved).length;
  if (notInvolved >= 2) {
    alerts.push({
      type: "child_not_involved",
      severity: "high",
      message: `${notInvolved} assessments without child involvement — ensure participation`,
      id: "child_not_involved",
    });
  }

  // Evidence not documented
  const noEvidence = records.filter((r) => !r.evidence_documented).length;
  if (noEvidence >= 2) {
    alerts.push({
      type: "evidence_not_documented",
      severity: "medium",
      message: `${noEvidence} assessments without evidence documented — strengthen records`,
      id: "evidence_not_documented",
    });
  }

  // Targets not SMART
  const notSmart = records.filter((r) => r.targets_set && !r.targets_smart).length;
  if (notSmart >= 3) {
    alerts.push({
      type: "targets_not_smart",
      severity: "medium",
      message: `${notSmart} assessments with non-SMART targets — review target quality`,
      id: "targets_not_smart",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    outcomeDomain?: OutcomeDomain;
    progressRating?: ProgressRating;
    assessmentTool?: AssessmentTool;
    reviewPeriod?: ReviewPeriod;
    limit?: number;
  },
): Promise<ServiceResult<ChildrensProgressTrackingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_childrens_progress_tracking") as SB).select("*").eq("home_id", homeId);
  if (filters?.outcomeDomain) q = q.eq("outcome_domain", filters.outcomeDomain);
  if (filters?.progressRating) q = q.eq("progress_rating", filters.progressRating);
  if (filters?.assessmentTool) q = q.eq("assessment_tool", filters.assessmentTool);
  if (filters?.reviewPeriod) q = q.eq("review_period", filters.reviewPeriod);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    outcomeDomain: OutcomeDomain;
    progressRating: ProgressRating;
    assessmentTool: AssessmentTool;
    reviewPeriod: ReviewPeriod;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    baselineEstablished?: boolean;
    targetsSet?: boolean;
    targetsSmart?: boolean;
    childInvolved?: boolean;
    socialWorkerInformed?: boolean;
    parentInformed?: boolean;
    evidenceDocumented?: boolean;
    carePlanUpdated?: boolean;
    celebrationPlanned?: boolean;
    barriersIdentified?: boolean;
    supportInPlace?: boolean;
    multiAgencyInput?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    assessedBy: string;
    currentScore?: number | null;
    previousScore?: number | null;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ChildrensProgressTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_progress_tracking") as SB)
    .insert({
      home_id: payload.homeId,
      outcome_domain: payload.outcomeDomain,
      progress_rating: payload.progressRating,
      assessment_tool: payload.assessmentTool,
      review_period: payload.reviewPeriod,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      baseline_established: payload.baselineEstablished ?? true,
      targets_set: payload.targetsSet ?? true,
      targets_smart: payload.targetsSmart ?? true,
      child_involved: payload.childInvolved ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
      evidence_documented: payload.evidenceDocumented ?? true,
      care_plan_updated: payload.carePlanUpdated ?? true,
      celebration_planned: payload.celebrationPlanned ?? false,
      barriers_identified: payload.barriersIdentified ?? false,
      support_in_place: payload.supportInPlace ?? true,
      multi_agency_input: payload.multiAgencyInput ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      assessed_by: payload.assessedBy,
      current_score: payload.currentScore ?? null,
      previous_score: payload.previousScore ?? null,
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
    outcomeDomain: OutcomeDomain;
    progressRating: ProgressRating;
    assessmentTool: AssessmentTool;
    reviewPeriod: ReviewPeriod;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    baselineEstablished: boolean;
    targetsSet: boolean;
    targetsSmart: boolean;
    childInvolved: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    evidenceDocumented: boolean;
    carePlanUpdated: boolean;
    celebrationPlanned: boolean;
    barriersIdentified: boolean;
    supportInPlace: boolean;
    multiAgencyInput: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    assessedBy: string;
    currentScore: number | null;
    previousScore: number | null;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildrensProgressTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.outcomeDomain !== undefined) mapped.outcome_domain = updates.outcomeDomain;
  if (updates.progressRating !== undefined) mapped.progress_rating = updates.progressRating;
  if (updates.assessmentTool !== undefined) mapped.assessment_tool = updates.assessmentTool;
  if (updates.reviewPeriod !== undefined) mapped.review_period = updates.reviewPeriod;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.baselineEstablished !== undefined) mapped.baseline_established = updates.baselineEstablished;
  if (updates.targetsSet !== undefined) mapped.targets_set = updates.targetsSet;
  if (updates.targetsSmart !== undefined) mapped.targets_smart = updates.targetsSmart;
  if (updates.childInvolved !== undefined) mapped.child_involved = updates.childInvolved;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.evidenceDocumented !== undefined) mapped.evidence_documented = updates.evidenceDocumented;
  if (updates.carePlanUpdated !== undefined) mapped.care_plan_updated = updates.carePlanUpdated;
  if (updates.celebrationPlanned !== undefined) mapped.celebration_planned = updates.celebrationPlanned;
  if (updates.barriersIdentified !== undefined) mapped.barriers_identified = updates.barriersIdentified;
  if (updates.supportInPlace !== undefined) mapped.support_in_place = updates.supportInPlace;
  if (updates.multiAgencyInput !== undefined) mapped.multi_agency_input = updates.multiAgencyInput;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.currentScore !== undefined) mapped.current_score = updates.currentScore;
  if (updates.previousScore !== undefined) mapped.previous_score = updates.previousScore;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_childrens_progress_tracking") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeChildrensProgressMetrics,
  identifyChildrensProgressAlerts,
};
