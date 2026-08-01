// ══════════════════════════════════════════════════════════════════════════════
// CARA — BOUNDARY MANAGEMENT SERVICE
// Tracks how boundaries are maintained with children including
// appropriate limits, boundary-testing responses, consistency,
// and therapeutic boundary work.
// CHR 2015 Reg 12 (health and wellbeing — safe boundaries),
// Reg 7 (individual child — routines and expectations),
// Reg 11 (positive behaviour support — consistent boundaries).
//
// Covers: boundary type, child response, staff approach, consistency,
// therapeutic input, escalation, and de-escalation outcomes.
//
// SCCIF: Experiences — "Boundaries are appropriate and consistent."
// "Staff manage boundary-testing sensitively."
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

export type BoundaryType =
  | "bedtime_routine"
  | "screen_time"
  | "house_rules"
  | "personal_space"
  | "language_behaviour"
  | "visitors_contact"
  | "money_spending"
  | "community_access"
  | "self_care"
  | "other";

export type ChildResponse =
  | "accepted"
  | "negotiated"
  | "tested"
  | "refused"
  | "escalated";

export type StaffApproach =
  | "calm_explanation"
  | "positive_reinforcement"
  | "natural_consequence"
  | "distraction_redirect"
  | "therapeutic_conversation"
  | "gave_space"
  | "de_escalation"
  | "restorative_approach"
  | "sought_support"
  | "other";

export type ConsistencyRating =
  | "fully_consistent"
  | "mostly_consistent"
  | "inconsistent"
  | "contradictory"
  | "not_assessed";

export interface BoundaryManagementRecord {
  id: string;
  home_id: string;
  boundary_type: BoundaryType;
  child_response: ChildResponse;
  staff_approach: StaffApproach;
  consistency_rating: ConsistencyRating;
  incident_date: string;
  child_name: string;
  child_id: string | null;
  staff_name: string;
  boundary_explained: boolean;
  age_appropriate: boolean;
  child_voice_heard: boolean;
  trauma_informed: boolean;
  care_plan_consistent: boolean;
  relationship_maintained: boolean;
  de_escalation_used: boolean;
  restorative_offered: boolean;
  learning_identified: boolean;
  parent_informed: boolean;
  social_worker_informed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  recorded_by: string;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const BOUNDARY_TYPES: { type: BoundaryType; label: string }[] = [
  { type: "bedtime_routine", label: "Bedtime Routine" },
  { type: "screen_time", label: "Screen Time" },
  { type: "house_rules", label: "House Rules" },
  { type: "personal_space", label: "Personal Space" },
  { type: "language_behaviour", label: "Language/Behaviour" },
  { type: "visitors_contact", label: "Visitors/Contact" },
  { type: "money_spending", label: "Money/Spending" },
  { type: "community_access", label: "Community Access" },
  { type: "self_care", label: "Self-Care" },
  { type: "other", label: "Other" },
];

export const CHILD_RESPONSES: { response: ChildResponse; label: string }[] = [
  { response: "accepted", label: "Accepted" },
  { response: "negotiated", label: "Negotiated" },
  { response: "tested", label: "Tested" },
  { response: "refused", label: "Refused" },
  { response: "escalated", label: "Escalated" },
];

export const STAFF_APPROACHES: { approach: StaffApproach; label: string }[] = [
  { approach: "calm_explanation", label: "Calm Explanation" },
  { approach: "positive_reinforcement", label: "Positive Reinforcement" },
  { approach: "natural_consequence", label: "Natural Consequence" },
  { approach: "distraction_redirect", label: "Distraction/Redirect" },
  { approach: "therapeutic_conversation", label: "Therapeutic Conversation" },
  { approach: "gave_space", label: "Gave Space" },
  { approach: "de_escalation", label: "De-Escalation" },
  { approach: "restorative_approach", label: "Restorative Approach" },
  { approach: "sought_support", label: "Sought Support" },
  { approach: "other", label: "Other" },
];

export const CONSISTENCY_RATINGS: { rating: ConsistencyRating; label: string }[] = [
  { rating: "fully_consistent", label: "Fully Consistent" },
  { rating: "mostly_consistent", label: "Mostly Consistent" },
  { rating: "inconsistent", label: "Inconsistent" },
  { rating: "contradictory", label: "Contradictory" },
  { rating: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeBoundaryManagementMetrics(
  records: BoundaryManagementRecord[],
): {
  total_incidents: number;
  accepted_count: number;
  escalated_count: number;
  refused_count: number;
  inconsistent_count: number;
  boundary_explained_rate: number | null;
  age_appropriate_rate: number | null;
  child_voice_rate: number | null;
  trauma_informed_rate: number | null;
  care_plan_consistent_rate: number | null;
  relationship_maintained_rate: number | null;
  de_escalation_rate: number | null;
  restorative_rate: number | null;
  learning_identified_rate: number | null;
  parent_informed_rate: number | null;
  social_worker_informed_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_boundary_type: Record<string, number>;
  by_child_response: Record<string, number>;
  by_staff_approach: Record<string, number>;
  by_consistency_rating: Record<string, number>;
} {
  const accepted = records.filter((r) => r.child_response === "accepted").length;
  const escalated = records.filter((r) => r.child_response === "escalated").length;
  const refused = records.filter((r) => r.child_response === "refused").length;
  const inconsistent = records.filter((r) => r.consistency_rating === "inconsistent" || r.consistency_rating === "contradictory").length;

  const boolRate = (field: keyof BoundaryManagementRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.boundary_type] = (byType[r.boundary_type] ?? 0) + 1;

  const byResponse: Record<string, number> = {};
  for (const r of records) byResponse[r.child_response] = (byResponse[r.child_response] ?? 0) + 1;

  const byApproach: Record<string, number> = {};
  for (const r of records) byApproach[r.staff_approach] = (byApproach[r.staff_approach] ?? 0) + 1;

  const byConsistency: Record<string, number> = {};
  for (const r of records) byConsistency[r.consistency_rating] = (byConsistency[r.consistency_rating] ?? 0) + 1;

  return {
    total_incidents: records.length,
    accepted_count: accepted,
    escalated_count: escalated,
    refused_count: refused,
    inconsistent_count: inconsistent,
    boundary_explained_rate: boolRate("boundary_explained"),
    age_appropriate_rate: boolRate("age_appropriate"),
    child_voice_rate: boolRate("child_voice_heard"),
    trauma_informed_rate: boolRate("trauma_informed"),
    care_plan_consistent_rate: boolRate("care_plan_consistent"),
    relationship_maintained_rate: boolRate("relationship_maintained"),
    de_escalation_rate: boolRate("de_escalation_used"),
    restorative_rate: boolRate("restorative_offered"),
    learning_identified_rate: boolRate("learning_identified"),
    parent_informed_rate: boolRate("parent_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_boundary_type: byType,
    by_child_response: byResponse,
    by_staff_approach: byApproach,
    by_consistency_rating: byConsistency,
  };
}

export function identifyBoundaryManagementAlerts(
  records: BoundaryManagementRecord[],
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

  // Escalated without de-escalation
  for (const r of records) {
    if (r.child_response === "escalated" && !r.de_escalation_used) {
      alerts.push({
        type: "escalated_no_deescalation",
        severity: "critical",
        message: `${r.child_name} escalated during ${r.boundary_type.replace(/_/g, " ")} boundary without de-escalation — review practice`,
        id: r.id,
      });
    }
  }

  // Not trauma informed
  const noTrauma = records.filter((r) => !r.trauma_informed).length;
  if (noTrauma >= 1) {
    alerts.push({
      type: "not_trauma_informed",
      severity: "high",
      message: `${noTrauma} boundary ${noTrauma === 1 ? "interaction was" : "interactions were"} not trauma-informed — ensure therapeutic approach`,
      id: "not_trauma_informed",
    });
  }

  // Child voice not heard
  const noVoice = records.filter((r) => !r.child_voice_heard).length;
  if (noVoice >= 1) {
    alerts.push({
      type: "child_voice_not_heard",
      severity: "high",
      message: `${noVoice} boundary ${noVoice === 1 ? "interaction has" : "interactions have"} child voice not heard — ensure participation`,
      id: "child_voice_not_heard",
    });
  }

  // Inconsistent boundaries
  const inconsistentCount = records.filter((r) => r.consistency_rating === "inconsistent" || r.consistency_rating === "contradictory").length;
  if (inconsistentCount >= 2) {
    alerts.push({
      type: "inconsistent_boundaries",
      severity: "medium",
      message: `${inconsistentCount} boundary interactions rated inconsistent or contradictory — address in team meeting`,
      id: "inconsistent_boundaries",
    });
  }

  // No restorative offered
  const noRestorative = records.filter((r) => !r.restorative_offered).length;
  if (noRestorative >= 3) {
    alerts.push({
      type: "no_restorative",
      severity: "medium",
      message: `${noRestorative} interactions without restorative approach — strengthen restorative practice`,
      id: "no_restorative",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    boundaryType?: BoundaryType;
    childResponse?: ChildResponse;
    staffApproach?: StaffApproach;
    consistencyRating?: ConsistencyRating;
    limit?: number;
  },
): Promise<ServiceResult<BoundaryManagementRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_boundary_management") as SB).select("*").eq("home_id", homeId);
  if (filters?.boundaryType) q = q.eq("boundary_type", filters.boundaryType);
  if (filters?.childResponse) q = q.eq("child_response", filters.childResponse);
  if (filters?.staffApproach) q = q.eq("staff_approach", filters.staffApproach);
  if (filters?.consistencyRating) q = q.eq("consistency_rating", filters.consistencyRating);
  q = q.order("incident_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    boundaryType: BoundaryType;
    childResponse: ChildResponse;
    staffApproach: StaffApproach;
    consistencyRating: ConsistencyRating;
    incidentDate: string;
    childName: string;
    childId?: string | null;
    staffName: string;
    boundaryExplained?: boolean;
    ageAppropriate?: boolean;
    childVoiceHeard?: boolean;
    traumaInformed?: boolean;
    carePlanConsistent?: boolean;
    relationshipMaintained?: boolean;
    deEscalationUsed?: boolean;
    restorativeOffered?: boolean;
    learningIdentified?: boolean;
    parentInformed?: boolean;
    socialWorkerInformed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    recordedBy: string;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<BoundaryManagementRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_boundary_management") as SB)
    .insert({
      home_id: payload.homeId,
      boundary_type: payload.boundaryType,
      child_response: payload.childResponse,
      staff_approach: payload.staffApproach,
      consistency_rating: payload.consistencyRating,
      incident_date: payload.incidentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      staff_name: payload.staffName,
      boundary_explained: payload.boundaryExplained ?? true,
      age_appropriate: payload.ageAppropriate ?? true,
      child_voice_heard: payload.childVoiceHeard ?? true,
      trauma_informed: payload.traumaInformed ?? true,
      care_plan_consistent: payload.carePlanConsistent ?? true,
      relationship_maintained: payload.relationshipMaintained ?? true,
      de_escalation_used: payload.deEscalationUsed ?? false,
      restorative_offered: payload.restorativeOffered ?? true,
      learning_identified: payload.learningIdentified ?? true,
      parent_informed: payload.parentInformed ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      recorded_by: payload.recordedBy,
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
    boundaryType: BoundaryType;
    childResponse: ChildResponse;
    staffApproach: StaffApproach;
    consistencyRating: ConsistencyRating;
    incidentDate: string;
    childName: string;
    childId: string | null;
    staffName: string;
    boundaryExplained: boolean;
    ageAppropriate: boolean;
    childVoiceHeard: boolean;
    traumaInformed: boolean;
    carePlanConsistent: boolean;
    relationshipMaintained: boolean;
    deEscalationUsed: boolean;
    restorativeOffered: boolean;
    learningIdentified: boolean;
    parentInformed: boolean;
    socialWorkerInformed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    recordedBy: string;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<BoundaryManagementRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.boundaryType !== undefined) mapped.boundary_type = updates.boundaryType;
  if (updates.childResponse !== undefined) mapped.child_response = updates.childResponse;
  if (updates.staffApproach !== undefined) mapped.staff_approach = updates.staffApproach;
  if (updates.consistencyRating !== undefined) mapped.consistency_rating = updates.consistencyRating;
  if (updates.incidentDate !== undefined) mapped.incident_date = updates.incidentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.boundaryExplained !== undefined) mapped.boundary_explained = updates.boundaryExplained;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.childVoiceHeard !== undefined) mapped.child_voice_heard = updates.childVoiceHeard;
  if (updates.traumaInformed !== undefined) mapped.trauma_informed = updates.traumaInformed;
  if (updates.carePlanConsistent !== undefined) mapped.care_plan_consistent = updates.carePlanConsistent;
  if (updates.relationshipMaintained !== undefined) mapped.relationship_maintained = updates.relationshipMaintained;
  if (updates.deEscalationUsed !== undefined) mapped.de_escalation_used = updates.deEscalationUsed;
  if (updates.restorativeOffered !== undefined) mapped.restorative_offered = updates.restorativeOffered;
  if (updates.learningIdentified !== undefined) mapped.learning_identified = updates.learningIdentified;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_boundary_management") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeBoundaryManagementMetrics,
  identifyBoundaryManagementAlerts,
};
