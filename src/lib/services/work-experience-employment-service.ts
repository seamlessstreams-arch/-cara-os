// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORK EXPERIENCE EMPLOYMENT SERVICE
// Tracks work experience placements, employment skills development,
// career guidance, CV building, and workplace readiness.
// CHR 2015 Reg 8(2)(a)(vi) (preparation for independence),
// Reg 5(c) (promoting independence through employment).
//
// Covers: placement type, readiness level, employer feedback,
// skill acquisition, and safeguarding in workplace.
//
// SCCIF: Experiences — "Children are prepared for employment."
// "Work experience supports transition to independence."
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

export type PlacementType =
  | "work_experience"
  | "volunteer_placement"
  | "apprenticeship"
  | "part_time_employment"
  | "career_taster"
  | "cv_workshop"
  | "interview_practice"
  | "job_search_support"
  | "enterprise_activity"
  | "other";

export type ReadinessLevel =
  | "work_ready"
  | "nearly_ready"
  | "developing"
  | "early_stage"
  | "not_ready";

export type EmployerFeedback =
  | "excellent"
  | "good"
  | "satisfactory"
  | "needs_improvement"
  | "not_suitable";

export type SkillAcquisition =
  | "significant_gain"
  | "good_gain"
  | "some_gain"
  | "no_gain"
  | "decline";

export interface WorkExperienceEmploymentRecord {
  id: string;
  home_id: string;
  placement_type: PlacementType;
  readiness_level: ReadinessLevel;
  employer_feedback: EmployerFeedback;
  skill_acquisition: SkillAcquisition;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  child_consented: boolean;
  age_appropriate: boolean;
  risk_assessed: boolean;
  safeguarding_checked: boolean;
  dbs_verified: boolean;
  insurance_confirmed: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  pathway_plan_updated: boolean;
  transport_arranged: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PLACEMENT_TYPES: { type: PlacementType; label: string }[] = [
  { type: "work_experience", label: "Work Experience" },
  { type: "volunteer_placement", label: "Volunteer Placement" },
  { type: "apprenticeship", label: "Apprenticeship" },
  { type: "part_time_employment", label: "Part-Time Employment" },
  { type: "career_taster", label: "Career Taster" },
  { type: "cv_workshop", label: "CV Workshop" },
  { type: "interview_practice", label: "Interview Practice" },
  { type: "job_search_support", label: "Job Search Support" },
  { type: "enterprise_activity", label: "Enterprise Activity" },
  { type: "other", label: "Other" },
];

export const READINESS_LEVELS: { level: ReadinessLevel; label: string }[] = [
  { level: "work_ready", label: "Work Ready" },
  { level: "nearly_ready", label: "Nearly Ready" },
  { level: "developing", label: "Developing" },
  { level: "early_stage", label: "Early Stage" },
  { level: "not_ready", label: "Not Ready" },
];

export const EMPLOYER_FEEDBACKS: { feedback: EmployerFeedback; label: string }[] = [
  { feedback: "excellent", label: "Excellent" },
  { feedback: "good", label: "Good" },
  { feedback: "satisfactory", label: "Satisfactory" },
  { feedback: "needs_improvement", label: "Needs Improvement" },
  { feedback: "not_suitable", label: "Not Suitable" },
];

export const SKILL_ACQUISITIONS: { acquisition: SkillAcquisition; label: string }[] = [
  { acquisition: "significant_gain", label: "Significant Gain" },
  { acquisition: "good_gain", label: "Good Gain" },
  { acquisition: "some_gain", label: "Some Gain" },
  { acquisition: "no_gain", label: "No Gain" },
  { acquisition: "decline", label: "Decline" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeWorkExperienceMetrics(
  records: WorkExperienceEmploymentRecord[],
): {
  total_placements: number;
  not_ready_count: number;
  not_suitable_count: number;
  no_gain_count: number;
  decline_count: number;
  child_consented_rate: number;
  age_appropriate_rate: number;
  risk_assessed_rate: number;
  safeguarding_rate: number;
  dbs_verified_rate: number;
  insurance_rate: number;
  care_plan_rate: number;
  social_worker_rate: number;
  parent_informed_rate: number;
  pathway_plan_rate: number;
  transport_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_placement_type: Record<string, number>;
  by_readiness_level: Record<string, number>;
  by_employer_feedback: Record<string, number>;
  by_skill_acquisition: Record<string, number>;
} {
  const notReady = records.filter((r) => r.readiness_level === "not_ready").length;
  const notSuitable = records.filter((r) => r.employer_feedback === "not_suitable").length;
  const noGain = records.filter((r) => r.skill_acquisition === "no_gain").length;
  const decline = records.filter((r) => r.skill_acquisition === "decline").length;

  const boolRate = (field: keyof WorkExperienceEmploymentRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.placement_type] = (byType[r.placement_type] ?? 0) + 1;

  const byReadiness: Record<string, number> = {};
  for (const r of records) byReadiness[r.readiness_level] = (byReadiness[r.readiness_level] ?? 0) + 1;

  const byFeedback: Record<string, number> = {};
  for (const r of records) byFeedback[r.employer_feedback] = (byFeedback[r.employer_feedback] ?? 0) + 1;

  const bySkill: Record<string, number> = {};
  for (const r of records) bySkill[r.skill_acquisition] = (bySkill[r.skill_acquisition] ?? 0) + 1;

  return {
    total_placements: records.length,
    not_ready_count: notReady,
    not_suitable_count: notSuitable,
    no_gain_count: noGain,
    decline_count: decline,
    child_consented_rate: boolRate("child_consented"),
    age_appropriate_rate: boolRate("age_appropriate"),
    risk_assessed_rate: boolRate("risk_assessed"),
    safeguarding_rate: boolRate("safeguarding_checked"),
    dbs_verified_rate: boolRate("dbs_verified"),
    insurance_rate: boolRate("insurance_confirmed"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    pathway_plan_rate: boolRate("pathway_plan_updated"),
    transport_rate: boolRate("transport_arranged"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_placement_type: byType,
    by_readiness_level: byReadiness,
    by_employer_feedback: byFeedback,
    by_skill_acquisition: bySkill,
  };
}

export function identifyWorkExperienceAlerts(
  records: WorkExperienceEmploymentRecord[],
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

  // Not suitable and declining — per-record critical
  for (const r of records) {
    if (r.employer_feedback === "not_suitable" && r.skill_acquisition === "decline") {
      alerts.push({
        type: "not_suitable_declining",
        severity: "critical",
        message: `${r.child_name} rated not suitable for ${r.placement_type.replace(/_/g, " ")} and skills declining — review placement approach`,
        id: r.id,
      });
    }
  }

  // No safeguarding check
  const noSafeguarding = records.filter((r) => !r.safeguarding_checked).length;
  if (noSafeguarding >= 1) {
    alerts.push({
      type: "no_safeguarding_check",
      severity: "high",
      message: `${noSafeguarding} ${noSafeguarding === 1 ? "placement has" : "placements have"} no safeguarding check — all placements must be safeguarded`,
      id: "no_safeguarding_check",
    });
  }

  // No DBS verification
  const noDbs = records.filter((r) => !r.dbs_verified).length;
  if (noDbs >= 1) {
    alerts.push({
      type: "no_dbs_verified",
      severity: "high",
      message: `${noDbs} ${noDbs === 1 ? "placement has" : "placements have"} DBS not verified — employer checks essential`,
      id: "no_dbs_verified",
    });
  }

  // No risk assessment
  const noRisk = records.filter((r) => !r.risk_assessed).length;
  if (noRisk >= 2) {
    alerts.push({
      type: "no_risk_assessment",
      severity: "medium",
      message: `${noRisk} placements without risk assessment — workplace safety must be evaluated`,
      id: "no_risk_assessment",
    });
  }

  // Pathway plan not updated
  const noPathway = records.filter((r) => !r.pathway_plan_updated).length;
  if (noPathway >= 2) {
    alerts.push({
      type: "no_pathway_plan",
      severity: "medium",
      message: `${noPathway} placements without pathway plan updated — ensure transition planning reflects work experience`,
      id: "no_pathway_plan",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    placementType?: PlacementType;
    readinessLevel?: ReadinessLevel;
    employerFeedback?: EmployerFeedback;
    skillAcquisition?: SkillAcquisition;
    limit?: number;
  },
): Promise<ServiceResult<WorkExperienceEmploymentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_work_experience_employment") as SB).select("*").eq("home_id", homeId);
  if (filters?.placementType) q = q.eq("placement_type", filters.placementType);
  if (filters?.readinessLevel) q = q.eq("readiness_level", filters.readinessLevel);
  if (filters?.employerFeedback) q = q.eq("employer_feedback", filters.employerFeedback);
  if (filters?.skillAcquisition) q = q.eq("skill_acquisition", filters.skillAcquisition);
  q = q.order("session_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as WorkExperienceEmploymentRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  placementType: PlacementType;
  readinessLevel: ReadinessLevel;
  employerFeedback: EmployerFeedback;
  skillAcquisition: SkillAcquisition;
  sessionDate: string;
  childName: string;
  childId?: string | null;
  supportedBy: string;
  childConsented?: boolean;
  ageAppropriate?: boolean;
  riskAssessed?: boolean;
  safeguardingChecked?: boolean;
  dbsVerified?: boolean;
  insuranceConfirmed?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  pathwayPlanUpdated?: boolean;
  transportArranged?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<WorkExperienceEmploymentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_work_experience_employment") as SB)
    .insert({
      home_id: payload.homeId,
      placement_type: payload.placementType,
      readiness_level: payload.readinessLevel,
      employer_feedback: payload.employerFeedback,
      skill_acquisition: payload.skillAcquisition,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      supported_by: payload.supportedBy,
      child_consented: payload.childConsented ?? true,
      age_appropriate: payload.ageAppropriate ?? true,
      risk_assessed: payload.riskAssessed ?? true,
      safeguarding_checked: payload.safeguardingChecked ?? true,
      dbs_verified: payload.dbsVerified ?? true,
      insurance_confirmed: payload.insuranceConfirmed ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
      pathway_plan_updated: payload.pathwayPlanUpdated ?? true,
      transport_arranged: payload.transportArranged ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as WorkExperienceEmploymentRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    placementType: PlacementType;
    readinessLevel: ReadinessLevel;
    employerFeedback: EmployerFeedback;
    skillAcquisition: SkillAcquisition;
    sessionDate: string;
    childName: string;
    childId: string | null;
    supportedBy: string;
    childConsented: boolean;
    ageAppropriate: boolean;
    riskAssessed: boolean;
    safeguardingChecked: boolean;
    dbsVerified: boolean;
    insuranceConfirmed: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    pathwayPlanUpdated: boolean;
    transportArranged: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<WorkExperienceEmploymentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.placementType !== undefined) mapped.placement_type = updates.placementType;
  if (updates.readinessLevel !== undefined) mapped.readiness_level = updates.readinessLevel;
  if (updates.employerFeedback !== undefined) mapped.employer_feedback = updates.employerFeedback;
  if (updates.skillAcquisition !== undefined) mapped.skill_acquisition = updates.skillAcquisition;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.childConsented !== undefined) mapped.child_consented = updates.childConsented;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.riskAssessed !== undefined) mapped.risk_assessed = updates.riskAssessed;
  if (updates.safeguardingChecked !== undefined) mapped.safeguarding_checked = updates.safeguardingChecked;
  if (updates.dbsVerified !== undefined) mapped.dbs_verified = updates.dbsVerified;
  if (updates.insuranceConfirmed !== undefined) mapped.insurance_confirmed = updates.insuranceConfirmed;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.pathwayPlanUpdated !== undefined) mapped.pathway_plan_updated = updates.pathwayPlanUpdated;
  if (updates.transportArranged !== undefined) mapped.transport_arranged = updates.transportArranged;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_work_experience_employment") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as WorkExperienceEmploymentRecord };
}

export const _testing = { computeWorkExperienceMetrics, identifyWorkExperienceAlerts };
