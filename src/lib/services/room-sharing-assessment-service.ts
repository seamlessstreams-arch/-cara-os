// ══════════════════════════════════════════════════════════════════════════════
// CARA — ROOM SHARING ASSESSMENT SERVICE
// Tracks room sharing risk assessments, compatibility checks,
// and ongoing monitoring of shared room arrangements.
// CHR 2015 Reg 10 (accommodation — safe and suitable),
// Reg 12 (health and wellbeing — safe sleeping arrangements).
//
// Covers: sharing arrangement, compatibility assessment, risk level,
// consent, safeguarding checks, and review frequency.
//
// SCCIF: Experiences — "Room sharing is risk-assessed and monitored."
// "Children's preferences about room sharing are respected."
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

export type SharingArrangement =
  | "single_room"
  | "shared_by_choice"
  | "shared_by_necessity"
  | "temporary_sharing"
  | "emergency_sharing";

export type CompatibilityRating =
  | "highly_compatible"
  | "compatible"
  | "manageable"
  | "incompatible"
  | "not_assessed";

export type RoomRiskLevel =
  | "no_risk"
  | "low"
  | "medium"
  | "high"
  | "unacceptable";

export type ReviewFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "as_needed";

export interface RoomSharingAssessmentRecord {
  id: string;
  home_id: string;
  sharing_arrangement: SharingArrangement;
  compatibility_rating: CompatibilityRating;
  room_risk_level: RoomRiskLevel;
  review_frequency: ReviewFrequency;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  assessed_by: string;
  child_consent_obtained: boolean;
  child_views_sought: boolean;
  safeguarding_check_done: boolean;
  risk_assessment_current: boolean;
  age_appropriate: boolean;
  gender_appropriate: boolean;
  behaviour_history_considered: boolean;
  social_worker_consulted: boolean;
  parent_informed: boolean;
  care_plan_reflects: boolean;
  privacy_maintained: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SHARING_ARRANGEMENTS: { arrangement: SharingArrangement; label: string }[] = [
  { arrangement: "single_room", label: "Single Room" },
  { arrangement: "shared_by_choice", label: "Shared by Choice" },
  { arrangement: "shared_by_necessity", label: "Shared by Necessity" },
  { arrangement: "temporary_sharing", label: "Temporary Sharing" },
  { arrangement: "emergency_sharing", label: "Emergency Sharing" },
];

export const COMPATIBILITY_RATINGS: { rating: CompatibilityRating; label: string }[] = [
  { rating: "highly_compatible", label: "Highly Compatible" },
  { rating: "compatible", label: "Compatible" },
  { rating: "manageable", label: "Manageable" },
  { rating: "incompatible", label: "Incompatible" },
  { rating: "not_assessed", label: "Not Assessed" },
];

export const ROOM_RISK_LEVELS: { level: RoomRiskLevel; label: string }[] = [
  { level: "no_risk", label: "No Risk" },
  { level: "low", label: "Low" },
  { level: "medium", label: "Medium" },
  { level: "high", label: "High" },
  { level: "unacceptable", label: "Unacceptable" },
];

export const REVIEW_FREQUENCIES: { frequency: ReviewFrequency; label: string }[] = [
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "as_needed", label: "As Needed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeRoomSharingMetrics(
  records: RoomSharingAssessmentRecord[],
): {
  total_assessments: number;
  incompatible_count: number;
  high_risk_count: number;
  unacceptable_risk_count: number;
  emergency_sharing_count: number;
  child_consent_rate: number | null;
  child_views_rate: number | null;
  safeguarding_check_rate: number | null;
  risk_assessment_rate: number | null;
  age_appropriate_rate: number | null;
  gender_appropriate_rate: number | null;
  behaviour_history_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  care_plan_reflects_rate: number | null;
  privacy_maintained_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_sharing_arrangement: Record<string, number>;
  by_compatibility_rating: Record<string, number>;
  by_room_risk_level: Record<string, number>;
  by_review_frequency: Record<string, number>;
} {
  const incompatible = records.filter((r) => r.compatibility_rating === "incompatible").length;
  const highRisk = records.filter((r) => r.room_risk_level === "high").length;
  const unacceptableRisk = records.filter((r) => r.room_risk_level === "unacceptable").length;
  const emergencySharing = records.filter((r) => r.sharing_arrangement === "emergency_sharing").length;

  const boolRate = (field: keyof RoomSharingAssessmentRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byArrangement: Record<string, number> = {};
  for (const r of records) byArrangement[r.sharing_arrangement] = (byArrangement[r.sharing_arrangement] ?? 0) + 1;

  const byCompatibility: Record<string, number> = {};
  for (const r of records) byCompatibility[r.compatibility_rating] = (byCompatibility[r.compatibility_rating] ?? 0) + 1;

  const byRisk: Record<string, number> = {};
  for (const r of records) byRisk[r.room_risk_level] = (byRisk[r.room_risk_level] ?? 0) + 1;

  const byFrequency: Record<string, number> = {};
  for (const r of records) byFrequency[r.review_frequency] = (byFrequency[r.review_frequency] ?? 0) + 1;

  return {
    total_assessments: records.length,
    incompatible_count: incompatible,
    high_risk_count: highRisk,
    unacceptable_risk_count: unacceptableRisk,
    emergency_sharing_count: emergencySharing,
    child_consent_rate: boolRate("child_consent_obtained"),
    child_views_rate: boolRate("child_views_sought"),
    safeguarding_check_rate: boolRate("safeguarding_check_done"),
    risk_assessment_rate: boolRate("risk_assessment_current"),
    age_appropriate_rate: boolRate("age_appropriate"),
    gender_appropriate_rate: boolRate("gender_appropriate"),
    behaviour_history_rate: boolRate("behaviour_history_considered"),
    social_worker_rate: boolRate("social_worker_consulted"),
    parent_informed_rate: boolRate("parent_informed"),
    care_plan_reflects_rate: boolRate("care_plan_reflects"),
    privacy_maintained_rate: boolRate("privacy_maintained"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_sharing_arrangement: byArrangement,
    by_compatibility_rating: byCompatibility,
    by_room_risk_level: byRisk,
    by_review_frequency: byFrequency,
  };
}

export function identifyRoomSharingAlerts(
  records: RoomSharingAssessmentRecord[],
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

  // Unacceptable risk or incompatible without safeguarding check
  for (const r of records) {
    if (r.room_risk_level === "unacceptable" && !r.safeguarding_check_done) {
      alerts.push({
        type: "unacceptable_no_safeguarding",
        severity: "critical",
        message: `${r.child_name} has unacceptable room sharing risk without safeguarding check — immediate review required`,
        id: r.id,
      });
    }
  }

  // No child consent
  const noConsent = records.filter((r) => !r.child_consent_obtained && r.sharing_arrangement !== "single_room").length;
  if (noConsent >= 1) {
    alerts.push({
      type: "no_child_consent",
      severity: "high",
      message: `${noConsent} room sharing ${noConsent === 1 ? "arrangement has" : "arrangements have"} no child consent obtained — ensure participation`,
      id: "no_child_consent",
    });
  }

  // Risk assessment not current
  const noRiskAssessment = records.filter((r) => !r.risk_assessment_current).length;
  if (noRiskAssessment >= 1) {
    alerts.push({
      type: "risk_assessment_outdated",
      severity: "high",
      message: `${noRiskAssessment} ${noRiskAssessment === 1 ? "assessment has" : "assessments have"} risk assessment not current — update assessments`,
      id: "risk_assessment_outdated",
    });
  }

  // Privacy not maintained
  const noPrivacy = records.filter((r) => !r.privacy_maintained).length;
  if (noPrivacy >= 2) {
    alerts.push({
      type: "privacy_not_maintained",
      severity: "medium",
      message: `${noPrivacy} assessments show privacy not maintained — review room arrangements`,
      id: "privacy_not_maintained",
    });
  }

  // Behaviour history not considered
  const noBehaviour = records.filter((r) => !r.behaviour_history_considered).length;
  if (noBehaviour >= 2) {
    alerts.push({
      type: "behaviour_not_considered",
      severity: "medium",
      message: `${noBehaviour} assessments without behaviour history considered — strengthen risk assessment`,
      id: "behaviour_not_considered",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    sharingArrangement?: SharingArrangement;
    compatibilityRating?: CompatibilityRating;
    roomRiskLevel?: RoomRiskLevel;
    reviewFrequency?: ReviewFrequency;
    limit?: number;
  },
): Promise<ServiceResult<RoomSharingAssessmentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_room_sharing_assessment") as SB).select("*").eq("home_id", homeId);
  if (filters?.sharingArrangement) q = q.eq("sharing_arrangement", filters.sharingArrangement);
  if (filters?.compatibilityRating) q = q.eq("compatibility_rating", filters.compatibilityRating);
  if (filters?.roomRiskLevel) q = q.eq("room_risk_level", filters.roomRiskLevel);
  if (filters?.reviewFrequency) q = q.eq("review_frequency", filters.reviewFrequency);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    sharingArrangement: SharingArrangement;
    compatibilityRating: CompatibilityRating;
    roomRiskLevel: RoomRiskLevel;
    reviewFrequency: ReviewFrequency;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    assessedBy: string;
    childConsentObtained?: boolean;
    childViewsSought?: boolean;
    safeguardingCheckDone?: boolean;
    riskAssessmentCurrent?: boolean;
    ageAppropriate?: boolean;
    genderAppropriate?: boolean;
    behaviourHistoryConsidered?: boolean;
    socialWorkerConsulted?: boolean;
    parentInformed?: boolean;
    carePlanReflects?: boolean;
    privacyMaintained?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<RoomSharingAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_room_sharing_assessment") as SB)
    .insert({
      home_id: payload.homeId,
      sharing_arrangement: payload.sharingArrangement,
      compatibility_rating: payload.compatibilityRating,
      room_risk_level: payload.roomRiskLevel,
      review_frequency: payload.reviewFrequency,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessed_by: payload.assessedBy,
      child_consent_obtained: payload.childConsentObtained ?? true,
      child_views_sought: payload.childViewsSought ?? true,
      safeguarding_check_done: payload.safeguardingCheckDone ?? true,
      risk_assessment_current: payload.riskAssessmentCurrent ?? true,
      age_appropriate: payload.ageAppropriate ?? true,
      gender_appropriate: payload.genderAppropriate ?? true,
      behaviour_history_considered: payload.behaviourHistoryConsidered ?? true,
      social_worker_consulted: payload.socialWorkerConsulted ?? true,
      parent_informed: payload.parentInformed ?? false,
      care_plan_reflects: payload.carePlanReflects ?? true,
      privacy_maintained: payload.privacyMaintained ?? true,
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
    sharingArrangement: SharingArrangement;
    compatibilityRating: CompatibilityRating;
    roomRiskLevel: RoomRiskLevel;
    reviewFrequency: ReviewFrequency;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    assessedBy: string;
    childConsentObtained: boolean;
    childViewsSought: boolean;
    safeguardingCheckDone: boolean;
    riskAssessmentCurrent: boolean;
    ageAppropriate: boolean;
    genderAppropriate: boolean;
    behaviourHistoryConsidered: boolean;
    socialWorkerConsulted: boolean;
    parentInformed: boolean;
    carePlanReflects: boolean;
    privacyMaintained: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<RoomSharingAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.sharingArrangement !== undefined) mapped.sharing_arrangement = updates.sharingArrangement;
  if (updates.compatibilityRating !== undefined) mapped.compatibility_rating = updates.compatibilityRating;
  if (updates.roomRiskLevel !== undefined) mapped.room_risk_level = updates.roomRiskLevel;
  if (updates.reviewFrequency !== undefined) mapped.review_frequency = updates.reviewFrequency;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.childConsentObtained !== undefined) mapped.child_consent_obtained = updates.childConsentObtained;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.safeguardingCheckDone !== undefined) mapped.safeguarding_check_done = updates.safeguardingCheckDone;
  if (updates.riskAssessmentCurrent !== undefined) mapped.risk_assessment_current = updates.riskAssessmentCurrent;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.genderAppropriate !== undefined) mapped.gender_appropriate = updates.genderAppropriate;
  if (updates.behaviourHistoryConsidered !== undefined) mapped.behaviour_history_considered = updates.behaviourHistoryConsidered;
  if (updates.socialWorkerConsulted !== undefined) mapped.social_worker_consulted = updates.socialWorkerConsulted;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.privacyMaintained !== undefined) mapped.privacy_maintained = updates.privacyMaintained;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_room_sharing_assessment") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeRoomSharingMetrics,
  identifyRoomSharingAlerts,
};
