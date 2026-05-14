// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING PERSON RISK ASSESSMENT SERVICE
// Tracks pre-assessed risk profiles for children who may go missing,
// return home interviews, and trigger plans.
// CHR 2015 Reg 12 (protection — missing children protocols),
// Reg 34 (statutory guidance on children who go missing),
// Reg 13 (safeguarding — arrangements to safeguard children).
//
// Covers: risk profile assessments, trigger plans, return interviews,
// protective factors, push/pull factors, and escalation protocols.
//
// SCCIF: Safety — "The home responds effectively to missing episodes."
// "Risk assessments inform prevention strategies."
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

export type RiskLevel =
  | "very_high"
  | "high"
  | "medium"
  | "low"
  | "minimal";

export type AssessmentType =
  | "initial_assessment"
  | "periodic_review"
  | "post_incident_review"
  | "trigger_plan_update"
  | "return_interview"
  | "multi_agency_review"
  | "risk_escalation"
  | "risk_reduction"
  | "care_plan_review"
  | "other";

export type TriggerPlanStatus =
  | "active"
  | "under_review"
  | "updated"
  | "not_required"
  | "expired";

export type ProtectiveFactor =
  | "positive_relationships"
  | "school_engagement"
  | "therapeutic_support"
  | "family_contact"
  | "structured_routine"
  | "hobbies_interests"
  | "peer_support"
  | "professional_network"
  | "safe_space_identified"
  | "other";

export interface MissingPersonRiskRecord {
  id: string;
  home_id: string;
  risk_level: RiskLevel;
  assessment_type: AssessmentType;
  trigger_plan_status: TriggerPlanStatus;
  protective_factor: ProtectiveFactor;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  previous_missing_episodes: number;
  trigger_plan_in_place: boolean;
  return_interview_completed: boolean;
  police_informed: boolean;
  social_worker_informed: boolean;
  parents_informed: boolean;
  push_factors_identified: boolean;
  pull_factors_identified: boolean;
  peer_mapping_completed: boolean;
  safe_places_identified: boolean;
  escalation_protocol_followed: boolean;
  multi_agency_involved: boolean;
  exploitation_risk_identified: boolean;
  issues_found: string[];
  actions_taken: string[];
  assessed_by: string;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RISK_LEVELS: { level: RiskLevel; label: string }[] = [
  { level: "very_high", label: "Very High" },
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
  { level: "minimal", label: "Minimal" },
];

export const ASSESSMENT_TYPES: { type: AssessmentType; label: string }[] = [
  { type: "initial_assessment", label: "Initial Assessment" },
  { type: "periodic_review", label: "Periodic Review" },
  { type: "post_incident_review", label: "Post-Incident Review" },
  { type: "trigger_plan_update", label: "Trigger Plan Update" },
  { type: "return_interview", label: "Return Interview" },
  { type: "multi_agency_review", label: "Multi-Agency Review" },
  { type: "risk_escalation", label: "Risk Escalation" },
  { type: "risk_reduction", label: "Risk Reduction" },
  { type: "care_plan_review", label: "Care Plan Review" },
  { type: "other", label: "Other" },
];

export const TRIGGER_PLAN_STATUSES: { status: TriggerPlanStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "under_review", label: "Under Review" },
  { status: "updated", label: "Updated" },
  { status: "not_required", label: "Not Required" },
  { status: "expired", label: "Expired" },
];

export const PROTECTIVE_FACTORS: { factor: ProtectiveFactor; label: string }[] = [
  { factor: "positive_relationships", label: "Positive Relationships" },
  { factor: "school_engagement", label: "School Engagement" },
  { factor: "therapeutic_support", label: "Therapeutic Support" },
  { factor: "family_contact", label: "Family Contact" },
  { factor: "structured_routine", label: "Structured Routine" },
  { factor: "hobbies_interests", label: "Hobbies & Interests" },
  { factor: "peer_support", label: "Peer Support" },
  { factor: "professional_network", label: "Professional Network" },
  { factor: "safe_space_identified", label: "Safe Space Identified" },
  { factor: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMissingPersonRiskMetrics(
  records: MissingPersonRiskRecord[],
): {
  total_assessments: number;
  very_high_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  minimal_risk_count: number;
  trigger_plan_rate: number;
  return_interview_rate: number;
  police_informed_rate: number;
  social_worker_informed_rate: number;
  push_factors_rate: number;
  pull_factors_rate: number;
  peer_mapping_rate: number;
  safe_places_rate: number;
  escalation_followed_rate: number;
  exploitation_risk_count: number;
  total_previous_episodes: number;
  average_previous_episodes: number;
  unique_children: number;
  by_risk_level: Record<string, number>;
  by_assessment_type: Record<string, number>;
  by_trigger_plan_status: Record<string, number>;
  by_protective_factor: Record<string, number>;
} {
  const veryHigh = records.filter((r) => r.risk_level === "very_high").length;
  const high = records.filter((r) => r.risk_level === "high").length;
  const medium = records.filter((r) => r.risk_level === "medium").length;
  const low = records.filter((r) => r.risk_level === "low").length;
  const minimal = records.filter((r) => r.risk_level === "minimal").length;

  const boolRate = (field: keyof MissingPersonRiskRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const exploitationRisk = records.filter((r) => r.exploitation_risk_identified).length;
  const totalEpisodes = records.reduce((a, r) => a + r.previous_missing_episodes, 0);
  const avgEpisodes =
    records.length > 0
      ? Math.round((totalEpisodes / records.length) * 10) / 10
      : 0;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byRisk: Record<string, number> = {};
  for (const r of records) byRisk[r.risk_level] = (byRisk[r.risk_level] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.assessment_type] = (byType[r.assessment_type] ?? 0) + 1;

  const byPlan: Record<string, number> = {};
  for (const r of records) byPlan[r.trigger_plan_status] = (byPlan[r.trigger_plan_status] ?? 0) + 1;

  const byFactor: Record<string, number> = {};
  for (const r of records) byFactor[r.protective_factor] = (byFactor[r.protective_factor] ?? 0) + 1;

  return {
    total_assessments: records.length,
    very_high_risk_count: veryHigh,
    high_risk_count: high,
    medium_risk_count: medium,
    low_risk_count: low,
    minimal_risk_count: minimal,
    trigger_plan_rate: boolRate("trigger_plan_in_place"),
    return_interview_rate: boolRate("return_interview_completed"),
    police_informed_rate: boolRate("police_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    push_factors_rate: boolRate("push_factors_identified"),
    pull_factors_rate: boolRate("pull_factors_identified"),
    peer_mapping_rate: boolRate("peer_mapping_completed"),
    safe_places_rate: boolRate("safe_places_identified"),
    escalation_followed_rate: boolRate("escalation_protocol_followed"),
    exploitation_risk_count: exploitationRisk,
    total_previous_episodes: totalEpisodes,
    average_previous_episodes: avgEpisodes,
    unique_children: uniqueChildren,
    by_risk_level: byRisk,
    by_assessment_type: byType,
    by_trigger_plan_status: byPlan,
    by_protective_factor: byFactor,
  };
}

export function identifyMissingPersonRiskAlerts(
  records: MissingPersonRiskRecord[],
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

  // Exploitation risk identified
  for (const r of records) {
    if (r.exploitation_risk_identified) {
      alerts.push({
        type: "exploitation_risk",
        severity: "critical",
        message: `Exploitation risk identified for ${r.child_name} on ${r.assessment_date} — escalate to safeguarding lead immediately`,
        id: r.id,
      });
    }
  }

  // Very high risk without trigger plan
  const vhNoTrigger = records.filter(
    (r) => r.risk_level === "very_high" && !r.trigger_plan_in_place,
  ).length;
  if (vhNoTrigger >= 1) {
    alerts.push({
      type: "very_high_no_trigger_plan",
      severity: "critical",
      message: `${vhNoTrigger} very high risk ${vhNoTrigger === 1 ? "child has" : "children have"} no trigger plan — create immediately`,
      id: "very_high_no_trigger_plan",
    });
  }

  // Return interview not completed
  const noReturn = records.filter(
    (r) => r.assessment_type === "post_incident_review" && !r.return_interview_completed,
  ).length;
  if (noReturn >= 1) {
    alerts.push({
      type: "return_interview_missing",
      severity: "high",
      message: `${noReturn} post-incident ${noReturn === 1 ? "review has" : "reviews have"} no return interview completed — arrange within 72 hours`,
      id: "return_interview_missing",
    });
  }

  // Police not informed for high/very high risk
  const policeNotInformed = records.filter(
    (r) =>
      (r.risk_level === "very_high" || r.risk_level === "high") &&
      !r.police_informed,
  ).length;
  if (policeNotInformed >= 1) {
    alerts.push({
      type: "police_not_informed",
      severity: "high",
      message: `${policeNotInformed} high-risk ${policeNotInformed === 1 ? "assessment has" : "assessments have"} police not informed — review protocol`,
      id: "police_not_informed",
    });
  }

  // Peer mapping not completed
  const noPeerMap = records.filter((r) => !r.peer_mapping_completed).length;
  if (noPeerMap >= 3) {
    alerts.push({
      type: "peer_mapping_incomplete",
      severity: "medium",
      message: `${noPeerMap} assessments without peer mapping completed — review contextual safeguarding`,
      id: "peer_mapping_incomplete",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    riskLevel?: RiskLevel;
    assessmentType?: AssessmentType;
    triggerPlanStatus?: TriggerPlanStatus;
    limit?: number;
  },
): Promise<ServiceResult<MissingPersonRiskRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_missing_person_risk") as SB).select("*").eq("home_id", homeId);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.assessmentType) q = q.eq("assessment_type", filters.assessmentType);
  if (filters?.triggerPlanStatus) q = q.eq("trigger_plan_status", filters.triggerPlanStatus);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    riskLevel: RiskLevel;
    assessmentType: AssessmentType;
    triggerPlanStatus: TriggerPlanStatus;
    protectiveFactor: ProtectiveFactor;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    previousMissingEpisodes?: number;
    triggerPlanInPlace?: boolean;
    returnInterviewCompleted?: boolean;
    policeInformed?: boolean;
    socialWorkerInformed?: boolean;
    parentsInformed?: boolean;
    pushFactorsIdentified?: boolean;
    pullFactorsIdentified?: boolean;
    peerMappingCompleted?: boolean;
    safePlacesIdentified?: boolean;
    escalationProtocolFollowed?: boolean;
    multiAgencyInvolved?: boolean;
    exploitationRiskIdentified?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    assessedBy: string;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<MissingPersonRiskRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_missing_person_risk") as SB)
    .insert({
      home_id: payload.homeId,
      risk_level: payload.riskLevel,
      assessment_type: payload.assessmentType,
      trigger_plan_status: payload.triggerPlanStatus,
      protective_factor: payload.protectiveFactor,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      previous_missing_episodes: payload.previousMissingEpisodes ?? 0,
      trigger_plan_in_place: payload.triggerPlanInPlace ?? false,
      return_interview_completed: payload.returnInterviewCompleted ?? false,
      police_informed: payload.policeInformed ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      parents_informed: payload.parentsInformed ?? false,
      push_factors_identified: payload.pushFactorsIdentified ?? false,
      pull_factors_identified: payload.pullFactorsIdentified ?? false,
      peer_mapping_completed: payload.peerMappingCompleted ?? false,
      safe_places_identified: payload.safePlacesIdentified ?? false,
      escalation_protocol_followed: payload.escalationProtocolFollowed ?? false,
      multi_agency_involved: payload.multiAgencyInvolved ?? false,
      exploitation_risk_identified: payload.exploitationRiskIdentified ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      assessed_by: payload.assessedBy,
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
    riskLevel: RiskLevel;
    assessmentType: AssessmentType;
    triggerPlanStatus: TriggerPlanStatus;
    protectiveFactor: ProtectiveFactor;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    previousMissingEpisodes: number;
    triggerPlanInPlace: boolean;
    returnInterviewCompleted: boolean;
    policeInformed: boolean;
    socialWorkerInformed: boolean;
    parentsInformed: boolean;
    pushFactorsIdentified: boolean;
    pullFactorsIdentified: boolean;
    peerMappingCompleted: boolean;
    safePlacesIdentified: boolean;
    escalationProtocolFollowed: boolean;
    multiAgencyInvolved: boolean;
    exploitationRiskIdentified: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    assessedBy: string;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<MissingPersonRiskRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.assessmentType !== undefined) mapped.assessment_type = updates.assessmentType;
  if (updates.triggerPlanStatus !== undefined) mapped.trigger_plan_status = updates.triggerPlanStatus;
  if (updates.protectiveFactor !== undefined) mapped.protective_factor = updates.protectiveFactor;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.previousMissingEpisodes !== undefined) mapped.previous_missing_episodes = updates.previousMissingEpisodes;
  if (updates.triggerPlanInPlace !== undefined) mapped.trigger_plan_in_place = updates.triggerPlanInPlace;
  if (updates.returnInterviewCompleted !== undefined) mapped.return_interview_completed = updates.returnInterviewCompleted;
  if (updates.policeInformed !== undefined) mapped.police_informed = updates.policeInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentsInformed !== undefined) mapped.parents_informed = updates.parentsInformed;
  if (updates.pushFactorsIdentified !== undefined) mapped.push_factors_identified = updates.pushFactorsIdentified;
  if (updates.pullFactorsIdentified !== undefined) mapped.pull_factors_identified = updates.pullFactorsIdentified;
  if (updates.peerMappingCompleted !== undefined) mapped.peer_mapping_completed = updates.peerMappingCompleted;
  if (updates.safePlacesIdentified !== undefined) mapped.safe_places_identified = updates.safePlacesIdentified;
  if (updates.escalationProtocolFollowed !== undefined) mapped.escalation_protocol_followed = updates.escalationProtocolFollowed;
  if (updates.multiAgencyInvolved !== undefined) mapped.multi_agency_involved = updates.multiAgencyInvolved;
  if (updates.exploitationRiskIdentified !== undefined) mapped.exploitation_risk_identified = updates.exploitationRiskIdentified;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_missing_person_risk") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMissingPersonRiskMetrics,
  identifyMissingPersonRiskAlerts,
};
