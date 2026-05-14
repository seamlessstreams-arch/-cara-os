// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FAMILY ENGAGEMENT TRACKING SERVICE
// Tracks family involvement, participation in reviews,
// relationship quality, and engagement barriers.
// CHR 2015 Reg 7 (children's wishes about contact),
// Reg 4 (welfare of children — family relationships).
//
// Covers: engagement type, family response, participation level,
// relationship quality, and contact frequency.
//
// SCCIF: Experiences — "Family relationships are promoted and supported."
// "Children maintain meaningful contact where appropriate."
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

export type EngagementType =
  | "review_attendance"
  | "phone_contact"
  | "visit_participation"
  | "event_attendance"
  | "care_plan_input"
  | "email_correspondence"
  | "family_meeting"
  | "therapeutic_session"
  | "informal_contact"
  | "other";

export type FamilyResponse =
  | "very_engaged"
  | "engaged"
  | "variable"
  | "disengaged"
  | "hostile";

export type ParticipationLevel =
  | "full_participation"
  | "partial_participation"
  | "minimal_participation"
  | "no_participation"
  | "not_applicable";

export type RelationshipQuality =
  | "excellent"
  | "good"
  | "developing"
  | "strained"
  | "broken_down";

export interface FamilyEngagementTrackingRecord {
  id: string;
  home_id: string;
  engagement_type: EngagementType;
  family_response: FamilyResponse;
  participation_level: ParticipationLevel;
  relationship_quality: RelationshipQuality;
  engagement_date: string;
  child_name: string;
  child_id: string | null;
  family_member_name: string;
  facilitated_by: string;
  child_views_sought: boolean;
  child_prepared: boolean;
  family_supported: boolean;
  barriers_identified: boolean;
  social_worker_informed: boolean;
  care_plan_updated: boolean;
  risk_assessment_current: boolean;
  outcome_recorded: boolean;
  follow_up_planned: boolean;
  safeguarding_considered: boolean;
  court_order_complied: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ENGAGEMENT_TYPES: { type: EngagementType; label: string }[] = [
  { type: "review_attendance", label: "Review Attendance" },
  { type: "phone_contact", label: "Phone Contact" },
  { type: "visit_participation", label: "Visit Participation" },
  { type: "event_attendance", label: "Event Attendance" },
  { type: "care_plan_input", label: "Care Plan Input" },
  { type: "email_correspondence", label: "Email Correspondence" },
  { type: "family_meeting", label: "Family Meeting" },
  { type: "therapeutic_session", label: "Therapeutic Session" },
  { type: "informal_contact", label: "Informal Contact" },
  { type: "other", label: "Other" },
];

export const FAMILY_RESPONSES: { response: FamilyResponse; label: string }[] = [
  { response: "very_engaged", label: "Very Engaged" },
  { response: "engaged", label: "Engaged" },
  { response: "variable", label: "Variable" },
  { response: "disengaged", label: "Disengaged" },
  { response: "hostile", label: "Hostile" },
];

export const PARTICIPATION_LEVELS: { level: ParticipationLevel; label: string }[] = [
  { level: "full_participation", label: "Full Participation" },
  { level: "partial_participation", label: "Partial Participation" },
  { level: "minimal_participation", label: "Minimal Participation" },
  { level: "no_participation", label: "No Participation" },
  { level: "not_applicable", label: "Not Applicable" },
];

export const RELATIONSHIP_QUALITIES: { quality: RelationshipQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "developing", label: "Developing" },
  { quality: "strained", label: "Strained" },
  { quality: "broken_down", label: "Broken Down" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeFamilyEngagementMetrics(
  records: FamilyEngagementTrackingRecord[],
): {
  total_engagements: number;
  disengaged_count: number;
  hostile_count: number;
  no_participation_count: number;
  broken_down_count: number;
  child_views_rate: number;
  child_prepared_rate: number;
  family_supported_rate: number;
  barriers_identified_rate: number;
  social_worker_rate: number;
  care_plan_rate: number;
  risk_assessment_rate: number;
  outcome_recorded_rate: number;
  follow_up_rate: number;
  safeguarding_rate: number;
  court_order_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_engagement_type: Record<string, number>;
  by_family_response: Record<string, number>;
  by_participation_level: Record<string, number>;
  by_relationship_quality: Record<string, number>;
} {
  const disengaged = records.filter((r) => r.family_response === "disengaged").length;
  const hostile = records.filter((r) => r.family_response === "hostile").length;
  const noParticipation = records.filter((r) => r.participation_level === "no_participation").length;
  const brokenDown = records.filter((r) => r.relationship_quality === "broken_down").length;

  const boolRate = (field: keyof FamilyEngagementTrackingRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.engagement_type] = (byType[r.engagement_type] ?? 0) + 1;

  const byResponse: Record<string, number> = {};
  for (const r of records) byResponse[r.family_response] = (byResponse[r.family_response] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.participation_level] = (byLevel[r.participation_level] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.relationship_quality] = (byQuality[r.relationship_quality] ?? 0) + 1;

  return {
    total_engagements: records.length,
    disengaged_count: disengaged,
    hostile_count: hostile,
    no_participation_count: noParticipation,
    broken_down_count: brokenDown,
    child_views_rate: boolRate("child_views_sought"),
    child_prepared_rate: boolRate("child_prepared"),
    family_supported_rate: boolRate("family_supported"),
    barriers_identified_rate: boolRate("barriers_identified"),
    social_worker_rate: boolRate("social_worker_informed"),
    care_plan_rate: boolRate("care_plan_updated"),
    risk_assessment_rate: boolRate("risk_assessment_current"),
    outcome_recorded_rate: boolRate("outcome_recorded"),
    follow_up_rate: boolRate("follow_up_planned"),
    safeguarding_rate: boolRate("safeguarding_considered"),
    court_order_rate: boolRate("court_order_complied"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_engagement_type: byType,
    by_family_response: byResponse,
    by_participation_level: byLevel,
    by_relationship_quality: byQuality,
  };
}

export function identifyFamilyEngagementAlerts(
  records: FamilyEngagementTrackingRecord[],
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

  // Hostile family with no safeguarding consideration — per-record
  for (const r of records) {
    if (r.family_response === "hostile" && !r.safeguarding_considered) {
      alerts.push({
        type: "hostile_no_safeguarding",
        severity: "critical",
        message: `${r.child_name}'s family member ${r.family_member_name} hostile without safeguarding consideration — review risk immediately`,
        id: r.id,
      });
    }
  }

  // No participation
  const noPart = records.filter((r) => r.participation_level === "no_participation").length;
  if (noPart >= 1) {
    alerts.push({
      type: "no_participation",
      severity: "high",
      message: `${noPart} ${noPart === 1 ? "engagement has" : "engagements have"} no family participation — assess barriers and support needs`,
      id: "no_participation",
    });
  }

  // Child not prepared
  const notPrepared = records.filter((r) => !r.child_prepared).length;
  if (notPrepared >= 1) {
    alerts.push({
      type: "child_not_prepared",
      severity: "high",
      message: `${notPrepared} ${notPrepared === 1 ? "engagement has" : "engagements have"} child not prepared — ensure emotional readiness`,
      id: "child_not_prepared",
    });
  }

  // Follow-up not planned
  const noFollowUp = records.filter((r) => !r.follow_up_planned).length;
  if (noFollowUp >= 2) {
    alerts.push({
      type: "follow_up_not_planned",
      severity: "medium",
      message: `${noFollowUp} engagements without follow-up planned — strengthen continuity`,
      id: "follow_up_not_planned",
    });
  }

  // Outcome not recorded
  const noOutcome = records.filter((r) => !r.outcome_recorded).length;
  if (noOutcome >= 2) {
    alerts.push({
      type: "outcome_not_recorded",
      severity: "medium",
      message: `${noOutcome} engagements without outcome recorded — ensure documentation`,
      id: "outcome_not_recorded",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    engagementType?: EngagementType;
    familyResponse?: FamilyResponse;
    participationLevel?: ParticipationLevel;
    relationshipQuality?: RelationshipQuality;
    limit?: number;
  },
): Promise<ServiceResult<FamilyEngagementTrackingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_family_engagement_tracking") as SB).select("*").eq("home_id", homeId);
  if (filters?.engagementType) q = q.eq("engagement_type", filters.engagementType);
  if (filters?.familyResponse) q = q.eq("family_response", filters.familyResponse);
  if (filters?.participationLevel) q = q.eq("participation_level", filters.participationLevel);
  if (filters?.relationshipQuality) q = q.eq("relationship_quality", filters.relationshipQuality);
  q = q.order("engagement_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    engagementType: EngagementType;
    familyResponse: FamilyResponse;
    participationLevel: ParticipationLevel;
    relationshipQuality: RelationshipQuality;
    engagementDate: string;
    childName: string;
    childId?: string | null;
    familyMemberName: string;
    facilitatedBy: string;
    childViewsSought?: boolean;
    childPrepared?: boolean;
    familySupported?: boolean;
    barriersIdentified?: boolean;
    socialWorkerInformed?: boolean;
    carePlanUpdated?: boolean;
    riskAssessmentCurrent?: boolean;
    outcomeRecorded?: boolean;
    followUpPlanned?: boolean;
    safeguardingConsidered?: boolean;
    courtOrderComplied?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<FamilyEngagementTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_family_engagement_tracking") as SB)
    .insert({
      home_id: payload.homeId,
      engagement_type: payload.engagementType,
      family_response: payload.familyResponse,
      participation_level: payload.participationLevel,
      relationship_quality: payload.relationshipQuality,
      engagement_date: payload.engagementDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      family_member_name: payload.familyMemberName,
      facilitated_by: payload.facilitatedBy,
      child_views_sought: payload.childViewsSought ?? true,
      child_prepared: payload.childPrepared ?? true,
      family_supported: payload.familySupported ?? true,
      barriers_identified: payload.barriersIdentified ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      care_plan_updated: payload.carePlanUpdated ?? true,
      risk_assessment_current: payload.riskAssessmentCurrent ?? true,
      outcome_recorded: payload.outcomeRecorded ?? true,
      follow_up_planned: payload.followUpPlanned ?? true,
      safeguarding_considered: payload.safeguardingConsidered ?? true,
      court_order_complied: payload.courtOrderComplied ?? true,
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
    engagementType: EngagementType;
    familyResponse: FamilyResponse;
    participationLevel: ParticipationLevel;
    relationshipQuality: RelationshipQuality;
    engagementDate: string;
    childName: string;
    childId: string | null;
    familyMemberName: string;
    facilitatedBy: string;
    childViewsSought: boolean;
    childPrepared: boolean;
    familySupported: boolean;
    barriersIdentified: boolean;
    socialWorkerInformed: boolean;
    carePlanUpdated: boolean;
    riskAssessmentCurrent: boolean;
    outcomeRecorded: boolean;
    followUpPlanned: boolean;
    safeguardingConsidered: boolean;
    courtOrderComplied: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<FamilyEngagementTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.engagementType !== undefined) mapped.engagement_type = updates.engagementType;
  if (updates.familyResponse !== undefined) mapped.family_response = updates.familyResponse;
  if (updates.participationLevel !== undefined) mapped.participation_level = updates.participationLevel;
  if (updates.relationshipQuality !== undefined) mapped.relationship_quality = updates.relationshipQuality;
  if (updates.engagementDate !== undefined) mapped.engagement_date = updates.engagementDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.familyMemberName !== undefined) mapped.family_member_name = updates.familyMemberName;
  if (updates.facilitatedBy !== undefined) mapped.facilitated_by = updates.facilitatedBy;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.childPrepared !== undefined) mapped.child_prepared = updates.childPrepared;
  if (updates.familySupported !== undefined) mapped.family_supported = updates.familySupported;
  if (updates.barriersIdentified !== undefined) mapped.barriers_identified = updates.barriersIdentified;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.carePlanUpdated !== undefined) mapped.care_plan_updated = updates.carePlanUpdated;
  if (updates.riskAssessmentCurrent !== undefined) mapped.risk_assessment_current = updates.riskAssessmentCurrent;
  if (updates.outcomeRecorded !== undefined) mapped.outcome_recorded = updates.outcomeRecorded;
  if (updates.followUpPlanned !== undefined) mapped.follow_up_planned = updates.followUpPlanned;
  if (updates.safeguardingConsidered !== undefined) mapped.safeguarding_considered = updates.safeguardingConsidered;
  if (updates.courtOrderComplied !== undefined) mapped.court_order_complied = updates.courtOrderComplied;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_family_engagement_tracking") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeFamilyEngagementMetrics,
  identifyFamilyEngagementAlerts,
};
