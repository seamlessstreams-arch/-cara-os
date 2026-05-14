// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONSENT & CAPACITY MONITORING SERVICE
// Tracks consent processes, capacity assessments, informed
// decision-making, and Gillick competence evaluations.
// CHR 2015 Reg 14 (care planning — child participation),
// Reg 7 (children's wishes — meaningful consent).
//
// Covers: consent area, capacity level, decision type,
// competence assessment, and advocacy support.
//
// SCCIF: Experiences — "Children's consent is meaningfully sought."
// "Capacity is assessed proportionately and supportively."
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

export type ConsentArea =
  | "medical_treatment"
  | "dental_treatment"
  | "mental_health"
  | "education_decisions"
  | "contact_arrangements"
  | "data_sharing"
  | "photography"
  | "activities_trips"
  | "research_participation"
  | "other";

export type CapacityLevel =
  | "full_capacity"
  | "partial_capacity"
  | "fluctuating"
  | "lacks_capacity"
  | "not_assessed";

export type DecisionType =
  | "consent_given"
  | "consent_refused"
  | "consent_withdrawn"
  | "best_interest_decision"
  | "deferred";

export type CompetenceAssessment =
  | "gillick_competent"
  | "approaching_competence"
  | "not_yet_competent"
  | "age_appropriate"
  | "not_assessed";

export interface ConsentCapacityMonitoringRecord {
  id: string;
  home_id: string;
  consent_area: ConsentArea;
  capacity_level: CapacityLevel;
  decision_type: DecisionType;
  competence_assessment: CompetenceAssessment;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  assessed_by: string;
  child_views_sought: boolean;
  information_provided: boolean;
  age_appropriate_explanation: boolean;
  advocacy_offered: boolean;
  parent_consulted: boolean;
  social_worker_informed: boolean;
  best_interest_documented: boolean;
  decision_respected: boolean;
  review_date_set: boolean;
  care_plan_updated: boolean;
  legal_framework_followed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CONSENT_AREAS: { area: ConsentArea; label: string }[] = [
  { area: "medical_treatment", label: "Medical Treatment" },
  { area: "dental_treatment", label: "Dental Treatment" },
  { area: "mental_health", label: "Mental Health" },
  { area: "education_decisions", label: "Education Decisions" },
  { area: "contact_arrangements", label: "Contact Arrangements" },
  { area: "data_sharing", label: "Data Sharing" },
  { area: "photography", label: "Photography" },
  { area: "activities_trips", label: "Activities/Trips" },
  { area: "research_participation", label: "Research Participation" },
  { area: "other", label: "Other" },
];

export const CAPACITY_LEVELS: { level: CapacityLevel; label: string }[] = [
  { level: "full_capacity", label: "Full Capacity" },
  { level: "partial_capacity", label: "Partial Capacity" },
  { level: "fluctuating", label: "Fluctuating" },
  { level: "lacks_capacity", label: "Lacks Capacity" },
  { level: "not_assessed", label: "Not Assessed" },
];

export const DECISION_TYPES: { type: DecisionType; label: string }[] = [
  { type: "consent_given", label: "Consent Given" },
  { type: "consent_refused", label: "Consent Refused" },
  { type: "consent_withdrawn", label: "Consent Withdrawn" },
  { type: "best_interest_decision", label: "Best Interest Decision" },
  { type: "deferred", label: "Deferred" },
];

export const COMPETENCE_ASSESSMENTS: { assessment: CompetenceAssessment; label: string }[] = [
  { assessment: "gillick_competent", label: "Gillick Competent" },
  { assessment: "approaching_competence", label: "Approaching Competence" },
  { assessment: "not_yet_competent", label: "Not Yet Competent" },
  { assessment: "age_appropriate", label: "Age Appropriate" },
  { assessment: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeConsentCapacityMetrics(
  records: ConsentCapacityMonitoringRecord[],
): {
  total_assessments: number;
  lacks_capacity_count: number;
  not_assessed_count: number;
  refused_count: number;
  best_interest_count: number;
  child_views_rate: number;
  information_provided_rate: number;
  age_appropriate_rate: number;
  advocacy_rate: number;
  parent_consulted_rate: number;
  social_worker_rate: number;
  best_interest_documented_rate: number;
  decision_respected_rate: number;
  review_date_rate: number;
  care_plan_rate: number;
  legal_framework_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_consent_area: Record<string, number>;
  by_capacity_level: Record<string, number>;
  by_decision_type: Record<string, number>;
  by_competence_assessment: Record<string, number>;
} {
  const lacksCapacity = records.filter((r) => r.capacity_level === "lacks_capacity").length;
  const notAssessed = records.filter((r) => r.capacity_level === "not_assessed").length;
  const refused = records.filter((r) => r.decision_type === "consent_refused").length;
  const bestInterest = records.filter((r) => r.decision_type === "best_interest_decision").length;

  const boolRate = (field: keyof ConsentCapacityMonitoringRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.consent_area] = (byArea[r.consent_area] ?? 0) + 1;

  const byCapacity: Record<string, number> = {};
  for (const r of records) byCapacity[r.capacity_level] = (byCapacity[r.capacity_level] ?? 0) + 1;

  const byDecision: Record<string, number> = {};
  for (const r of records) byDecision[r.decision_type] = (byDecision[r.decision_type] ?? 0) + 1;

  const byCompetence: Record<string, number> = {};
  for (const r of records) byCompetence[r.competence_assessment] = (byCompetence[r.competence_assessment] ?? 0) + 1;

  return {
    total_assessments: records.length,
    lacks_capacity_count: lacksCapacity,
    not_assessed_count: notAssessed,
    refused_count: refused,
    best_interest_count: bestInterest,
    child_views_rate: boolRate("child_views_sought"),
    information_provided_rate: boolRate("information_provided"),
    age_appropriate_rate: boolRate("age_appropriate_explanation"),
    advocacy_rate: boolRate("advocacy_offered"),
    parent_consulted_rate: boolRate("parent_consulted"),
    social_worker_rate: boolRate("social_worker_informed"),
    best_interest_documented_rate: boolRate("best_interest_documented"),
    decision_respected_rate: boolRate("decision_respected"),
    review_date_rate: boolRate("review_date_set"),
    care_plan_rate: boolRate("care_plan_updated"),
    legal_framework_rate: boolRate("legal_framework_followed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_consent_area: byArea,
    by_capacity_level: byCapacity,
    by_decision_type: byDecision,
    by_competence_assessment: byCompetence,
  };
}

export function identifyConsentCapacityAlerts(
  records: ConsentCapacityMonitoringRecord[],
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

  // Best interest decision without documentation — per-record
  for (const r of records) {
    if (r.decision_type === "best_interest_decision" && !r.best_interest_documented) {
      alerts.push({
        type: "best_interest_not_documented",
        severity: "critical",
        message: `${r.child_name}'s best interest decision for ${r.consent_area.replace(/_/g, " ")} not documented — ensure legal compliance`,
        id: r.id,
      });
    }
  }

  // Decision not respected
  const notRespected = records.filter((r) => !r.decision_respected).length;
  if (notRespected >= 1) {
    alerts.push({
      type: "decision_not_respected",
      severity: "high",
      message: `${notRespected} ${notRespected === 1 ? "assessment shows" : "assessments show"} decision not respected — review child's rights`,
      id: "decision_not_respected",
    });
  }

  // Advocacy not offered
  const noAdvocacy = records.filter((r) => !r.advocacy_offered).length;
  if (noAdvocacy >= 1) {
    alerts.push({
      type: "advocacy_not_offered",
      severity: "high",
      message: `${noAdvocacy} ${noAdvocacy === 1 ? "assessment has" : "assessments have"} no advocacy offered — ensure independent support`,
      id: "advocacy_not_offered",
    });
  }

  // Information not provided
  const noInfo = records.filter((r) => !r.information_provided).length;
  if (noInfo >= 2) {
    alerts.push({
      type: "information_not_provided",
      severity: "medium",
      message: `${noInfo} assessments without information provided — strengthen informed consent`,
      id: "information_not_provided",
    });
  }

  // Review date not set
  const noReview = records.filter((r) => !r.review_date_set).length;
  if (noReview >= 2) {
    alerts.push({
      type: "review_date_not_set",
      severity: "medium",
      message: `${noReview} assessments without review date — ensure ongoing monitoring`,
      id: "review_date_not_set",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    consentArea?: ConsentArea;
    capacityLevel?: CapacityLevel;
    decisionType?: DecisionType;
    competenceAssessment?: CompetenceAssessment;
    limit?: number;
  },
): Promise<ServiceResult<ConsentCapacityMonitoringRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_consent_capacity_monitoring") as SB).select("*").eq("home_id", homeId);
  if (filters?.consentArea) q = q.eq("consent_area", filters.consentArea);
  if (filters?.capacityLevel) q = q.eq("capacity_level", filters.capacityLevel);
  if (filters?.decisionType) q = q.eq("decision_type", filters.decisionType);
  if (filters?.competenceAssessment) q = q.eq("competence_assessment", filters.competenceAssessment);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    consentArea: ConsentArea;
    capacityLevel: CapacityLevel;
    decisionType: DecisionType;
    competenceAssessment: CompetenceAssessment;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    assessedBy: string;
    childViewsSought?: boolean;
    informationProvided?: boolean;
    ageAppropriateExplanation?: boolean;
    advocacyOffered?: boolean;
    parentConsulted?: boolean;
    socialWorkerInformed?: boolean;
    bestInterestDocumented?: boolean;
    decisionRespected?: boolean;
    reviewDateSet?: boolean;
    carePlanUpdated?: boolean;
    legalFrameworkFollowed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ConsentCapacityMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_consent_capacity_monitoring") as SB)
    .insert({
      home_id: payload.homeId,
      consent_area: payload.consentArea,
      capacity_level: payload.capacityLevel,
      decision_type: payload.decisionType,
      competence_assessment: payload.competenceAssessment,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessed_by: payload.assessedBy,
      child_views_sought: payload.childViewsSought ?? true,
      information_provided: payload.informationProvided ?? true,
      age_appropriate_explanation: payload.ageAppropriateExplanation ?? true,
      advocacy_offered: payload.advocacyOffered ?? true,
      parent_consulted: payload.parentConsulted ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      best_interest_documented: payload.bestInterestDocumented ?? true,
      decision_respected: payload.decisionRespected ?? true,
      review_date_set: payload.reviewDateSet ?? true,
      care_plan_updated: payload.carePlanUpdated ?? true,
      legal_framework_followed: payload.legalFrameworkFollowed ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
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
    consentArea: ConsentArea;
    capacityLevel: CapacityLevel;
    decisionType: DecisionType;
    competenceAssessment: CompetenceAssessment;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    assessedBy: string;
    childViewsSought: boolean;
    informationProvided: boolean;
    ageAppropriateExplanation: boolean;
    advocacyOffered: boolean;
    parentConsulted: boolean;
    socialWorkerInformed: boolean;
    bestInterestDocumented: boolean;
    decisionRespected: boolean;
    reviewDateSet: boolean;
    carePlanUpdated: boolean;
    legalFrameworkFollowed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ConsentCapacityMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.consentArea !== undefined) mapped.consent_area = updates.consentArea;
  if (updates.capacityLevel !== undefined) mapped.capacity_level = updates.capacityLevel;
  if (updates.decisionType !== undefined) mapped.decision_type = updates.decisionType;
  if (updates.competenceAssessment !== undefined) mapped.competence_assessment = updates.competenceAssessment;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.informationProvided !== undefined) mapped.information_provided = updates.informationProvided;
  if (updates.ageAppropriateExplanation !== undefined) mapped.age_appropriate_explanation = updates.ageAppropriateExplanation;
  if (updates.advocacyOffered !== undefined) mapped.advocacy_offered = updates.advocacyOffered;
  if (updates.parentConsulted !== undefined) mapped.parent_consulted = updates.parentConsulted;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.bestInterestDocumented !== undefined) mapped.best_interest_documented = updates.bestInterestDocumented;
  if (updates.decisionRespected !== undefined) mapped.decision_respected = updates.decisionRespected;
  if (updates.reviewDateSet !== undefined) mapped.review_date_set = updates.reviewDateSet;
  if (updates.carePlanUpdated !== undefined) mapped.care_plan_updated = updates.carePlanUpdated;
  if (updates.legalFrameworkFollowed !== undefined) mapped.legal_framework_followed = updates.legalFrameworkFollowed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_consent_capacity_monitoring") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeConsentCapacityMetrics,
  identifyConsentCapacityAlerts,
};
