// ══════════════════════════════════════════════════════════════════════════════
// CARA — FAITH & SPIRITUAL OBSERVANCE SERVICE
// Tracks faith and spiritual observance support for children in
// residential care homes, ensuring religious identity is respected
// and spiritual needs are actively facilitated.
// CHR 2015 Reg 11 (religious observance),
// Reg 16 (statement of purpose).
//
// Covers: observance type, support level, child engagement,
// cultural sensitivity, dietary provision, and worship attendance.
//
// SCCIF: Experiences — "Children's faith and spiritual needs are respected."
// "Staff facilitate religious observance and spiritual expression."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ObservanceType =
  | "place_of_worship"
  | "prayer_meditation"
  | "festival_celebration"
  | "dietary_observance"
  | "religious_education"
  | "spiritual_counselling"
  | "faith_community_link"
  | "sacred_text_study"
  | "ritual_ceremony"
  | "other";

export type SupportLevel =
  | "fully_supported"
  | "well_supported"
  | "partially_supported"
  | "poorly_supported"
  | "not_supported";

export type ChildEngagement =
  | "highly_engaged"
  | "engaged"
  | "partially_engaged"
  | "disengaged"
  | "refused";

export type CulturalSensitivity =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "insensitive";

export interface FaithSpiritualObservanceRecord {
  id: string;
  home_id: string;
  observance_type: ObservanceType;
  support_level: SupportLevel;
  child_engagement: ChildEngagement;
  cultural_sensitivity: CulturalSensitivity;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  child_wishes_respected: boolean;
  dietary_needs_met: boolean;
  attendance_facilitated: boolean;
  resources_provided: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  cultural_awareness_shown: boolean;
  privacy_respected: boolean;
  peer_understanding_promoted: boolean;
  festivals_acknowledged: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const OBSERVANCE_TYPES: { type: ObservanceType; label: string }[] = [
  { type: "place_of_worship", label: "Place of Worship" },
  { type: "prayer_meditation", label: "Prayer/Meditation" },
  { type: "festival_celebration", label: "Festival Celebration" },
  { type: "dietary_observance", label: "Dietary Observance" },
  { type: "religious_education", label: "Religious Education" },
  { type: "spiritual_counselling", label: "Spiritual Counselling" },
  { type: "faith_community_link", label: "Faith Community Link" },
  { type: "sacred_text_study", label: "Sacred Text Study" },
  { type: "ritual_ceremony", label: "Ritual/Ceremony" },
  { type: "other", label: "Other" },
];

export const SUPPORT_LEVELS: { level: SupportLevel; label: string }[] = [
  { level: "fully_supported", label: "Fully Supported" },
  { level: "well_supported", label: "Well Supported" },
  { level: "partially_supported", label: "Partially Supported" },
  { level: "poorly_supported", label: "Poorly Supported" },
  { level: "not_supported", label: "Not Supported" },
];

export const CHILD_ENGAGEMENTS: { quality: ChildEngagement; label: string }[] = [
  { quality: "highly_engaged", label: "Highly Engaged" },
  { quality: "engaged", label: "Engaged" },
  { quality: "partially_engaged", label: "Partially Engaged" },
  { quality: "disengaged", label: "Disengaged" },
  { quality: "refused", label: "Refused" },
];

export const CULTURAL_SENSITIVITIES: { assessment: CulturalSensitivity; label: string }[] = [
  { assessment: "excellent", label: "Excellent" },
  { assessment: "good", label: "Good" },
  { assessment: "adequate", label: "Adequate" },
  { assessment: "poor", label: "Poor" },
  { assessment: "insensitive", label: "Insensitive" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeFaithSpiritualMetrics(
  records: FaithSpiritualObservanceRecord[],
): {
  total_sessions: number;
  not_supported_count: number;
  disengaged_count: number;
  poor_sensitivity_count: number;
  insensitive_count: number;
  child_wishes_rate: number | null;
  dietary_needs_rate: number | null;
  attendance_rate: number | null;
  resources_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  cultural_awareness_rate: number | null;
  privacy_rate: number | null;
  peer_understanding_rate: number | null;
  festivals_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_observance_type: Record<string, number>;
  by_support_level: Record<string, number>;
  by_child_engagement: Record<string, number>;
  by_cultural_sensitivity: Record<string, number>;
} {
  const notSupported = records.filter((r) => r.support_level === "not_supported").length;
  const disengaged = records.filter((r) => r.child_engagement === "disengaged" || r.child_engagement === "refused").length;
  const poorSensitivity = records.filter((r) => r.cultural_sensitivity === "poor" || r.cultural_sensitivity === "insensitive").length;
  const insensitive = records.filter((r) => r.cultural_sensitivity === "insensitive").length;

  const boolRate = (field: keyof FaithSpiritualObservanceRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.observance_type] = (byType[r.observance_type] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.support_level] = (byLevel[r.support_level] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.child_engagement] = (byEngagement[r.child_engagement] ?? 0) + 1;

  const bySensitivity: Record<string, number> = {};
  for (const r of records) bySensitivity[r.cultural_sensitivity] = (bySensitivity[r.cultural_sensitivity] ?? 0) + 1;

  return {
    total_sessions: records.length,
    not_supported_count: notSupported,
    disengaged_count: disengaged,
    poor_sensitivity_count: poorSensitivity,
    insensitive_count: insensitive,
    child_wishes_rate: boolRate("child_wishes_respected"),
    dietary_needs_rate: boolRate("dietary_needs_met"),
    attendance_rate: boolRate("attendance_facilitated"),
    resources_rate: boolRate("resources_provided"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    cultural_awareness_rate: boolRate("cultural_awareness_shown"),
    privacy_rate: boolRate("privacy_respected"),
    peer_understanding_rate: boolRate("peer_understanding_promoted"),
    festivals_rate: boolRate("festivals_acknowledged"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_observance_type: byType,
    by_support_level: byLevel,
    by_child_engagement: byEngagement,
    by_cultural_sensitivity: bySensitivity,
  };
}

export function identifyFaithSpiritualAlerts(
  records: FaithSpiritualObservanceRecord[],
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

  // Insensitive and not supported — per-record
  for (const r of records) {
    if (r.cultural_sensitivity === "insensitive" && r.support_level === "not_supported") {
      alerts.push({
        type: "insensitive_not_supported",
        severity: "critical",
        message: `${r.child_name} experienced insensitive and unsupported faith observance — safeguarding review`,
        id: r.id,
      });
    }
  }

  // Child wishes not respected
  const noWishes = records.filter((r) => !r.child_wishes_respected).length;
  if (noWishes >= 1) {
    alerts.push({
      type: "wishes_not_respected",
      severity: "high",
      message: `${noWishes} ${noWishes === 1 ? "session has" : "sessions have"} child wishes not respected`,
      id: "wishes_not_respected",
    });
  }

  // Attendance not facilitated
  const noAttendance = records.filter((r) => !r.attendance_facilitated).length;
  if (noAttendance >= 1) {
    alerts.push({
      type: "attendance_not_facilitated",
      severity: "high",
      message: `${noAttendance} ${noAttendance === 1 ? "session has" : "sessions have"} worship attendance not facilitated`,
      id: "attendance_not_facilitated",
    });
  }

  // No cultural awareness shown
  const noAwareness = records.filter((r) => !r.cultural_awareness_shown).length;
  if (noAwareness >= 2) {
    alerts.push({
      type: "no_cultural_awareness",
      severity: "medium",
      message: `${noAwareness} sessions have no cultural awareness shown`,
      id: "no_cultural_awareness",
    });
  }

  // Festivals not acknowledged
  const noFestivals = records.filter((r) => !r.festivals_acknowledged).length;
  if (noFestivals >= 2) {
    alerts.push({
      type: "festivals_not_acknowledged",
      severity: "medium",
      message: `${noFestivals} sessions have festivals not acknowledged`,
      id: "festivals_not_acknowledged",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listFaithSpiritualObservances(
  homeId: string,
  filters?: {
    observanceType?: ObservanceType;
    supportLevel?: SupportLevel;
    childEngagement?: ChildEngagement;
    culturalSensitivity?: CulturalSensitivity;
    limit?: number;
  },
): Promise<ServiceResult<FaithSpiritualObservanceRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_faith_spiritual_observance") as SB).select("*").eq("home_id", homeId);
  if (filters?.observanceType) q = q.eq("observance_type", filters.observanceType);
  if (filters?.supportLevel) q = q.eq("support_level", filters.supportLevel);
  if (filters?.childEngagement) q = q.eq("child_engagement", filters.childEngagement);
  if (filters?.culturalSensitivity) q = q.eq("cultural_sensitivity", filters.culturalSensitivity);
  q = q.order("session_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as FaithSpiritualObservanceRecord[] };
}

export async function createFaithSpiritualObservance(payload: {
  homeId: string;
  observanceType: ObservanceType;
  supportLevel: SupportLevel;
  childEngagement: ChildEngagement;
  culturalSensitivity: CulturalSensitivity;
  sessionDate: string;
  childName: string;
  childId?: string | null;
  supportedBy: string;
  childWishesRespected?: boolean;
  dietaryNeedsMet?: boolean;
  attendanceFacilitated?: boolean;
  resourcesProvided?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  culturalAwarenessShown?: boolean;
  privacyRespected?: boolean;
  peerUnderstandingPromoted?: boolean;
  festivalsAcknowledged?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<FaithSpiritualObservanceRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_faith_spiritual_observance") as SB)
    .insert({
      home_id: payload.homeId,
      observance_type: payload.observanceType,
      support_level: payload.supportLevel,
      child_engagement: payload.childEngagement,
      cultural_sensitivity: payload.culturalSensitivity,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      supported_by: payload.supportedBy,
      child_wishes_respected: payload.childWishesRespected ?? true,
      dietary_needs_met: payload.dietaryNeedsMet ?? true,
      attendance_facilitated: payload.attendanceFacilitated ?? true,
      resources_provided: payload.resourcesProvided ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      parent_informed: payload.parentInformed ?? false,
      cultural_awareness_shown: payload.culturalAwarenessShown ?? true,
      privacy_respected: payload.privacyRespected ?? true,
      peer_understanding_promoted: payload.peerUnderstandingPromoted ?? true,
      festivals_acknowledged: payload.festivalsAcknowledged ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as FaithSpiritualObservanceRecord };
}

export async function updateFaithSpiritualObservance(
  id: string,
  updates: Partial<{
    observanceType: ObservanceType;
    supportLevel: SupportLevel;
    childEngagement: ChildEngagement;
    culturalSensitivity: CulturalSensitivity;
    sessionDate: string;
    childName: string;
    childId: string | null;
    supportedBy: string;
    childWishesRespected: boolean;
    dietaryNeedsMet: boolean;
    attendanceFacilitated: boolean;
    resourcesProvided: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    culturalAwarenessShown: boolean;
    privacyRespected: boolean;
    peerUnderstandingPromoted: boolean;
    festivalsAcknowledged: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<FaithSpiritualObservanceRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.observanceType !== undefined) mapped.observance_type = updates.observanceType;
  if (updates.supportLevel !== undefined) mapped.support_level = updates.supportLevel;
  if (updates.childEngagement !== undefined) mapped.child_engagement = updates.childEngagement;
  if (updates.culturalSensitivity !== undefined) mapped.cultural_sensitivity = updates.culturalSensitivity;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.childWishesRespected !== undefined) mapped.child_wishes_respected = updates.childWishesRespected;
  if (updates.dietaryNeedsMet !== undefined) mapped.dietary_needs_met = updates.dietaryNeedsMet;
  if (updates.attendanceFacilitated !== undefined) mapped.attendance_facilitated = updates.attendanceFacilitated;
  if (updates.resourcesProvided !== undefined) mapped.resources_provided = updates.resourcesProvided;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.culturalAwarenessShown !== undefined) mapped.cultural_awareness_shown = updates.culturalAwarenessShown;
  if (updates.privacyRespected !== undefined) mapped.privacy_respected = updates.privacyRespected;
  if (updates.peerUnderstandingPromoted !== undefined) mapped.peer_understanding_promoted = updates.peerUnderstandingPromoted;
  if (updates.festivalsAcknowledged !== undefined) mapped.festivals_acknowledged = updates.festivalsAcknowledged;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_faith_spiritual_observance") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as FaithSpiritualObservanceRecord };
}

export const _testing = { computeFaithSpiritualMetrics, identifyFaithSpiritualAlerts };
