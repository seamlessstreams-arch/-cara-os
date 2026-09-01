// ══════════════════════════════════════════════════════════════════════════════
// CARA — ARRIVAL SETTLING EXPERIENCE SERVICE
// Tracks new arrival experiences, settling-in quality, welcome processes,
// first impressions, and transition support from arrival.
// CHR 2015 Reg 14(1)(a) (admission and assessment procedures),
// Reg 10(2)(a) (warm relationships from first contact).
//
// Covers: arrival stage, settling quality, welcome assessment,
// comfort level, and relationship building.
//
// SCCIF: Experiences — "Children are welcomed warmly."
// "Arrival experience is positive and child-centred."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ArrivalStage =
  | "pre_arrival_planning"
  | "first_day_welcome"
  | "first_week_review"
  | "two_week_check"
  | "one_month_review"
  | "three_month_review"
  | "ongoing_monitoring"
  | "peer_introduction"
  | "family_visit_arranged"
  | "other";

export type SettlingQuality =
  | "settled_well"
  | "mostly_settled"
  | "adjusting"
  | "unsettled"
  | "very_distressed";

export type WelcomeAssessment =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "not_provided";

export type ComfortLevel =
  | "very_comfortable"
  | "comfortable"
  | "neutral"
  | "uncomfortable"
  | "very_uncomfortable";

export interface ArrivalSettlingExperienceRecord {
  id: string;
  home_id: string;
  arrival_stage: ArrivalStage;
  settling_quality: SettlingQuality;
  welcome_assessment: WelcomeAssessment;
  comfort_level: ComfortLevel;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  room_prepared: boolean;
  personal_items_respected: boolean;
  child_preferences_asked: boolean;
  tour_provided: boolean;
  peer_introductions_made: boolean;
  key_worker_assigned: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  emergency_contacts_confirmed: boolean;
  dietary_needs_checked: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ARRIVAL_STAGES: { stage: ArrivalStage; label: string }[] = [
  { stage: "pre_arrival_planning", label: "Pre-Arrival Planning" },
  { stage: "first_day_welcome", label: "First Day Welcome" },
  { stage: "first_week_review", label: "First Week Review" },
  { stage: "two_week_check", label: "Two Week Check" },
  { stage: "one_month_review", label: "One Month Review" },
  { stage: "three_month_review", label: "Three Month Review" },
  { stage: "ongoing_monitoring", label: "Ongoing Monitoring" },
  { stage: "peer_introduction", label: "Peer Introduction" },
  { stage: "family_visit_arranged", label: "Family Visit Arranged" },
  { stage: "other", label: "Other" },
];

export const SETTLING_QUALITIES: { quality: SettlingQuality; label: string }[] = [
  { quality: "settled_well", label: "Settled Well" },
  { quality: "mostly_settled", label: "Mostly Settled" },
  { quality: "adjusting", label: "Adjusting" },
  { quality: "unsettled", label: "Unsettled" },
  { quality: "very_distressed", label: "Very Distressed" },
];

export const WELCOME_ASSESSMENTS: { assessment: WelcomeAssessment; label: string }[] = [
  { assessment: "excellent", label: "Excellent" },
  { assessment: "good", label: "Good" },
  { assessment: "adequate", label: "Adequate" },
  { assessment: "poor", label: "Poor" },
  { assessment: "not_provided", label: "Not Provided" },
];

export const COMFORT_LEVELS: { level: ComfortLevel; label: string }[] = [
  { level: "very_comfortable", label: "Very Comfortable" },
  { level: "comfortable", label: "Comfortable" },
  { level: "neutral", label: "Neutral" },
  { level: "uncomfortable", label: "Uncomfortable" },
  { level: "very_uncomfortable", label: "Very Uncomfortable" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computeArrivalSettlingMetrics(records: ArrivalSettlingExperienceRecord[]): {
  total_reviews: number;
  distressed_count: number;
  poor_welcome_count: number;
  uncomfortable_count: number;
  unsettled_count: number;
  room_prepared_rate: number | null;
  personal_items_rate: number | null;
  preferences_asked_rate: number | null;
  tour_rate: number | null;
  peer_introductions_rate: number | null;
  key_worker_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  emergency_contacts_rate: number | null;
  dietary_needs_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_arrival_stage: Record<string, number>;
  by_settling_quality: Record<string, number>;
  by_welcome_assessment: Record<string, number>;
  by_comfort_level: Record<string, number>;
} {
  const distressed = records.filter((r) => r.settling_quality === "very_distressed").length;
  const poorWelcome = records.filter((r) => r.welcome_assessment === "poor" || r.welcome_assessment === "not_provided").length;
  const uncomfortable = records.filter((r) => r.comfort_level === "uncomfortable" || r.comfort_level === "very_uncomfortable").length;
  const unsettled = records.filter((r) => r.settling_quality === "unsettled" || r.settling_quality === "very_distressed").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof ArrivalSettlingExperienceRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byStage: Record<string, number> = {};
  for (const r of records) byStage[r.arrival_stage] = (byStage[r.arrival_stage] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.settling_quality] = (byQuality[r.settling_quality] ?? 0) + 1;

  const byWelcome: Record<string, number> = {};
  for (const r of records) byWelcome[r.welcome_assessment] = (byWelcome[r.welcome_assessment] ?? 0) + 1;

  const byComfort: Record<string, number> = {};
  for (const r of records) byComfort[r.comfort_level] = (byComfort[r.comfort_level] ?? 0) + 1;

  return {
    total_reviews: records.length,
    distressed_count: distressed,
    poor_welcome_count: poorWelcome,
    uncomfortable_count: uncomfortable,
    unsettled_count: unsettled,
    room_prepared_rate: boolRate("room_prepared"),
    personal_items_rate: boolRate("personal_items_respected"),
    preferences_asked_rate: boolRate("child_preferences_asked"),
    tour_rate: boolRate("tour_provided"),
    peer_introductions_rate: boolRate("peer_introductions_made"),
    key_worker_rate: boolRate("key_worker_assigned"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    emergency_contacts_rate: boolRate("emergency_contacts_confirmed"),
    dietary_needs_rate: boolRate("dietary_needs_checked"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_arrival_stage: byStage,
    by_settling_quality: byQuality,
    by_welcome_assessment: byWelcome,
    by_comfort_level: byComfort,
  };
}

export function identifyArrivalSettlingAlerts(
  records: ArrivalSettlingExperienceRecord[],
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

  // Very distressed with poor welcome — per-record critical
  for (const r of records) {
    if (r.settling_quality === "very_distressed" && (r.welcome_assessment === "poor" || r.welcome_assessment === "not_provided")) {
      alerts.push({
        type: "distressed_poor_welcome",
        severity: "critical",
        message: `${r.child_name} very distressed with ${r.welcome_assessment.replace(/_/g, " ")} welcome — immediate support needed`,
        id: r.id,
      });
    }
  }

  // No room prepared
  const noRoom = records.filter((r) => !r.room_prepared).length;
  if (noRoom >= 1) {
    alerts.push({
      type: "no_room_prepared",
      severity: "high",
      message: `${noRoom} ${noRoom === 1 ? "review has" : "reviews have"} room not prepared — every child deserves a welcoming space`,
      id: "no_room_prepared",
    });
  }

  // No key worker assigned
  const noKeyWorker = records.filter((r) => !r.key_worker_assigned).length;
  if (noKeyWorker >= 1) {
    alerts.push({
      type: "no_key_worker",
      severity: "high",
      message: `${noKeyWorker} ${noKeyWorker === 1 ? "review has" : "reviews have"} no key worker assigned — essential for settling support`,
      id: "no_key_worker",
    });
  }

  // No preferences asked
  const noPreferences = records.filter((r) => !r.child_preferences_asked).length;
  if (noPreferences >= 2) {
    alerts.push({
      type: "no_preferences_asked",
      severity: "medium",
      message: `${noPreferences} reviews without child preferences asked — child voice must be heard from day one`,
      id: "no_preferences_asked",
    });
  }

  // No peer introductions
  const noPeer = records.filter((r) => !r.peer_introductions_made).length;
  if (noPeer >= 2) {
    alerts.push({
      type: "no_peer_introductions",
      severity: "medium",
      message: `${noPeer} reviews without peer introductions — social connections aid settling`,
      id: "no_peer_introductions",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    arrivalStage?: ArrivalStage; settlingQuality?: SettlingQuality;
    welcomeAssessment?: WelcomeAssessment; comfortLevel?: ComfortLevel; limit?: number;
  },
): Promise<ServiceResult<ArrivalSettlingExperienceRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let q = (client.from("cs_arrival_settling_experience") as SB).select("*").eq("home_id", homeId);
  if (filters?.arrivalStage) q = q.eq("arrival_stage", filters.arrivalStage);
  if (filters?.settlingQuality) q = q.eq("settling_quality", filters.settlingQuality);
  if (filters?.welcomeAssessment) q = q.eq("welcome_assessment", filters.welcomeAssessment);
  if (filters?.comfortLevel) q = q.eq("comfort_level", filters.comfortLevel);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ArrivalSettlingExperienceRecord[] };
}

export async function createRecord(payload: {
  homeId: string; arrivalStage: ArrivalStage; settlingQuality: SettlingQuality;
  welcomeAssessment: WelcomeAssessment; comfortLevel: ComfortLevel;
  sessionDate: string; childName: string; childId: string | null;
  supportedBy: string; roomPrepared: boolean; personalItemsRespected: boolean;
  childPreferencesAsked: boolean; tourProvided: boolean; peerIntroductionsMade: boolean;
  keyWorkerAssigned: boolean; carePlanReflects: boolean; socialWorkerInformed: boolean;
  parentInformed: boolean; emergencyContactsConfirmed: boolean; dietaryNeedsChecked: boolean;
  recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
  nextReviewDate: string | null; notes: string | null;
}): Promise<ServiceResult<ArrivalSettlingExperienceRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_arrival_settling_experience") as SB).insert({
    home_id: payload.homeId, arrival_stage: payload.arrivalStage,
    settling_quality: payload.settlingQuality, welcome_assessment: payload.welcomeAssessment,
    comfort_level: payload.comfortLevel, session_date: payload.sessionDate,
    child_name: payload.childName, child_id: payload.childId, supported_by: payload.supportedBy,
    room_prepared: payload.roomPrepared, personal_items_respected: payload.personalItemsRespected,
    child_preferences_asked: payload.childPreferencesAsked, tour_provided: payload.tourProvided,
    peer_introductions_made: payload.peerIntroductionsMade, key_worker_assigned: payload.keyWorkerAssigned,
    care_plan_reflects: payload.carePlanReflects, social_worker_informed: payload.socialWorkerInformed,
    parent_informed: payload.parentInformed, emergency_contacts_confirmed: payload.emergencyContactsConfirmed,
    dietary_needs_checked: payload.dietaryNeedsChecked, recorded_promptly: payload.recordedPromptly,
    issues_found: payload.issuesFound, actions_taken: payload.actionsTaken,
    next_review_date: payload.nextReviewDate, notes: payload.notes,
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ArrivalSettlingExperienceRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    arrivalStage: ArrivalStage; settlingQuality: SettlingQuality;
    welcomeAssessment: WelcomeAssessment; comfortLevel: ComfortLevel;
    sessionDate: string; childName: string; childId: string | null;
    supportedBy: string; roomPrepared: boolean; personalItemsRespected: boolean;
    childPreferencesAsked: boolean; tourProvided: boolean; peerIntroductionsMade: boolean;
    keyWorkerAssigned: boolean; carePlanReflects: boolean; socialWorkerInformed: boolean;
    parentInformed: boolean; emergencyContactsConfirmed: boolean; dietaryNeedsChecked: boolean;
    recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
    nextReviewDate: string | null; notes: string | null;
  }>,
): Promise<ServiceResult<ArrivalSettlingExperienceRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.arrivalStage !== undefined) mapped.arrival_stage = updates.arrivalStage;
  if (updates.settlingQuality !== undefined) mapped.settling_quality = updates.settlingQuality;
  if (updates.welcomeAssessment !== undefined) mapped.welcome_assessment = updates.welcomeAssessment;
  if (updates.comfortLevel !== undefined) mapped.comfort_level = updates.comfortLevel;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.roomPrepared !== undefined) mapped.room_prepared = updates.roomPrepared;
  if (updates.personalItemsRespected !== undefined) mapped.personal_items_respected = updates.personalItemsRespected;
  if (updates.childPreferencesAsked !== undefined) mapped.child_preferences_asked = updates.childPreferencesAsked;
  if (updates.tourProvided !== undefined) mapped.tour_provided = updates.tourProvided;
  if (updates.peerIntroductionsMade !== undefined) mapped.peer_introductions_made = updates.peerIntroductionsMade;
  if (updates.keyWorkerAssigned !== undefined) mapped.key_worker_assigned = updates.keyWorkerAssigned;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.emergencyContactsConfirmed !== undefined) mapped.emergency_contacts_confirmed = updates.emergencyContactsConfirmed;
  if (updates.dietaryNeedsChecked !== undefined) mapped.dietary_needs_checked = updates.dietaryNeedsChecked;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  const { data, error } = await (client.from("cs_arrival_settling_experience") as SB)
    .update(mapped).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ArrivalSettlingExperienceRecord };
}

export const _testing = { computeArrivalSettlingMetrics, identifyArrivalSettlingAlerts };
