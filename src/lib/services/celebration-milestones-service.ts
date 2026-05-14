// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CELEBRATION MILESTONES SERVICE
// Tracks birthdays, achievements, festivals, cultural celebrations,
// personal milestones, and positive recognition events.
// CHR 2015 Reg 6(2)(b) (quality of care — celebrating achievements),
// Reg 9(2)(a) (enjoyment and achievement recognition).
//
// Covers: celebration type, recognition quality, child response,
// participation breadth, and cultural sensitivity.
//
// SCCIF: Experiences — "Achievements are celebrated."
// "Children feel valued and their milestones are recognised."
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

export type CelebrationType =
  | "birthday"
  | "academic_achievement"
  | "behavioural_milestone"
  | "cultural_festival"
  | "religious_celebration"
  | "sporting_achievement"
  | "personal_milestone"
  | "transition_event"
  | "community_recognition"
  | "other";

export type RecognitionQuality =
  | "exceptional"
  | "good"
  | "adequate"
  | "poor"
  | "missed";

export type ChildResponse =
  | "delighted"
  | "happy"
  | "neutral"
  | "uncomfortable"
  | "upset";

export type ParticipationBreadth =
  | "whole_home"
  | "peer_group"
  | "staff_and_child"
  | "individual"
  | "none";

export interface CelebrationMilestonesRecord {
  id: string;
  home_id: string;
  celebration_type: CelebrationType;
  recognition_quality: RecognitionQuality;
  child_response: ChildResponse;
  participation_breadth: ParticipationBreadth;
  event_date: string;
  child_name: string;
  child_id: string | null;
  organised_by: string;
  child_chose_celebration: boolean;
  culturally_sensitive: boolean;
  age_appropriate: boolean;
  photos_consent_obtained: boolean;
  family_included: boolean;
  peers_involved: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  budget_approved: boolean;
  memories_preserved: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CELEBRATION_TYPES: { type: CelebrationType; label: string }[] = [
  { type: "birthday", label: "Birthday" },
  { type: "academic_achievement", label: "Academic Achievement" },
  { type: "behavioural_milestone", label: "Behavioural Milestone" },
  { type: "cultural_festival", label: "Cultural Festival" },
  { type: "religious_celebration", label: "Religious Celebration" },
  { type: "sporting_achievement", label: "Sporting Achievement" },
  { type: "personal_milestone", label: "Personal Milestone" },
  { type: "transition_event", label: "Transition Event" },
  { type: "community_recognition", label: "Community Recognition" },
  { type: "other", label: "Other" },
];

export const RECOGNITION_QUALITIES: { quality: RecognitionQuality; label: string }[] = [
  { quality: "exceptional", label: "Exceptional" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "missed", label: "Missed" },
];

export const CHILD_RESPONSES: { response: ChildResponse; label: string }[] = [
  { response: "delighted", label: "Delighted" },
  { response: "happy", label: "Happy" },
  { response: "neutral", label: "Neutral" },
  { response: "uncomfortable", label: "Uncomfortable" },
  { response: "upset", label: "Upset" },
];

export const PARTICIPATION_BREADTHS: { breadth: ParticipationBreadth; label: string }[] = [
  { breadth: "whole_home", label: "Whole Home" },
  { breadth: "peer_group", label: "Peer Group" },
  { breadth: "staff_and_child", label: "Staff & Child" },
  { breadth: "individual", label: "Individual" },
  { breadth: "none", label: "None" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeCelebrationMilestonesMetrics(
  records: CelebrationMilestonesRecord[],
): {
  total_events: number;
  missed_count: number;
  poor_quality_count: number;
  uncomfortable_count: number;
  no_family_count: number;
  child_chose_rate: number;
  culturally_sensitive_rate: number;
  age_appropriate_rate: number;
  photos_consent_rate: number;
  family_included_rate: number;
  peers_involved_rate: number;
  care_plan_rate: number;
  social_worker_rate: number;
  parent_informed_rate: number;
  budget_approved_rate: number;
  memories_preserved_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_celebration_type: Record<string, number>;
  by_recognition_quality: Record<string, number>;
  by_child_response: Record<string, number>;
  by_participation_breadth: Record<string, number>;
} {
  const missed = records.filter((r) => r.recognition_quality === "missed").length;
  const poorQuality = records.filter((r) => r.recognition_quality === "poor" || r.recognition_quality === "missed").length;
  const uncomfortable = records.filter((r) => r.child_response === "uncomfortable" || r.child_response === "upset").length;
  const noFamily = records.filter((r) => !r.family_included).length;

  const boolRate = (field: keyof CelebrationMilestonesRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.celebration_type] = (byType[r.celebration_type] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.recognition_quality] = (byQuality[r.recognition_quality] ?? 0) + 1;

  const byResponse: Record<string, number> = {};
  for (const r of records) byResponse[r.child_response] = (byResponse[r.child_response] ?? 0) + 1;

  const byBreadth: Record<string, number> = {};
  for (const r of records) byBreadth[r.participation_breadth] = (byBreadth[r.participation_breadth] ?? 0) + 1;

  return {
    total_events: records.length,
    missed_count: missed,
    poor_quality_count: poorQuality,
    uncomfortable_count: uncomfortable,
    no_family_count: noFamily,
    child_chose_rate: boolRate("child_chose_celebration"),
    culturally_sensitive_rate: boolRate("culturally_sensitive"),
    age_appropriate_rate: boolRate("age_appropriate"),
    photos_consent_rate: boolRate("photos_consent_obtained"),
    family_included_rate: boolRate("family_included"),
    peers_involved_rate: boolRate("peers_involved"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    budget_approved_rate: boolRate("budget_approved"),
    memories_preserved_rate: boolRate("memories_preserved"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_celebration_type: byType,
    by_recognition_quality: byQuality,
    by_child_response: byResponse,
    by_participation_breadth: byBreadth,
  };
}

export function identifyCelebrationMilestonesAlerts(
  records: CelebrationMilestonesRecord[],
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

  // Missed and child upset — per-record critical
  for (const r of records) {
    if (r.recognition_quality === "missed" && (r.child_response === "uncomfortable" || r.child_response === "upset")) {
      alerts.push({
        type: "missed_upset",
        severity: "critical",
        message: `${r.child_name} milestone missed (${r.celebration_type.replace(/_/g, " ")}) and child upset — ensure all milestones are recognised`,
        id: r.id,
      });
    }
  }

  // No child choice
  const noChoice = records.filter((r) => !r.child_chose_celebration).length;
  if (noChoice >= 1) {
    alerts.push({
      type: "no_child_choice",
      severity: "high",
      message: `${noChoice} ${noChoice === 1 ? "celebration has" : "celebrations have"} child not choosing — ensure child-led celebrations`,
      id: "no_child_choice",
    });
  }

  // Not culturally sensitive
  const notCultural = records.filter((r) => !r.culturally_sensitive).length;
  if (notCultural >= 1) {
    alerts.push({
      type: "not_culturally_sensitive",
      severity: "high",
      message: `${notCultural} ${notCultural === 1 ? "event is" : "events are"} not culturally sensitive — review cultural awareness`,
      id: "not_culturally_sensitive",
    });
  }

  // No memories preserved
  const noMemories = records.filter((r) => !r.memories_preserved).length;
  if (noMemories >= 2) {
    alerts.push({
      type: "no_memories_preserved",
      severity: "medium",
      message: `${noMemories} events without memories preserved — life story work requires celebration records`,
      id: "no_memories_preserved",
    });
  }

  // No family included
  const noFamily = records.filter((r) => !r.family_included).length;
  if (noFamily >= 2) {
    alerts.push({
      type: "no_family_included",
      severity: "medium",
      message: `${noFamily} celebrations without family involvement — consider family inclusion where appropriate`,
      id: "no_family_included",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    celebrationType?: CelebrationType;
    recognitionQuality?: RecognitionQuality;
    childResponse?: ChildResponse;
    participationBreadth?: ParticipationBreadth;
    limit?: number;
  },
): Promise<ServiceResult<CelebrationMilestonesRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_celebration_milestones") as SB).select("*").eq("home_id", homeId);
  if (filters?.celebrationType) q = q.eq("celebration_type", filters.celebrationType);
  if (filters?.recognitionQuality) q = q.eq("recognition_quality", filters.recognitionQuality);
  if (filters?.childResponse) q = q.eq("child_response", filters.childResponse);
  if (filters?.participationBreadth) q = q.eq("participation_breadth", filters.participationBreadth);
  q = q.order("event_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as CelebrationMilestonesRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  celebrationType: CelebrationType;
  recognitionQuality: RecognitionQuality;
  childResponse: ChildResponse;
  participationBreadth: ParticipationBreadth;
  eventDate: string;
  childName: string;
  childId?: string | null;
  organisedBy: string;
  childChoseCelebration?: boolean;
  culturallySensitive?: boolean;
  ageAppropriate?: boolean;
  photosConsentObtained?: boolean;
  familyIncluded?: boolean;
  peersInvolved?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  budgetApproved?: boolean;
  memoriesPreserved?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<CelebrationMilestonesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_celebration_milestones") as SB)
    .insert({
      home_id: payload.homeId,
      celebration_type: payload.celebrationType,
      recognition_quality: payload.recognitionQuality,
      child_response: payload.childResponse,
      participation_breadth: payload.participationBreadth,
      event_date: payload.eventDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      organised_by: payload.organisedBy,
      child_chose_celebration: payload.childChoseCelebration ?? true,
      culturally_sensitive: payload.culturallySensitive ?? true,
      age_appropriate: payload.ageAppropriate ?? true,
      photos_consent_obtained: payload.photosConsentObtained ?? true,
      family_included: payload.familyIncluded ?? true,
      peers_involved: payload.peersInvolved ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
      budget_approved: payload.budgetApproved ?? true,
      memories_preserved: payload.memoriesPreserved ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as CelebrationMilestonesRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    celebrationType: CelebrationType;
    recognitionQuality: RecognitionQuality;
    childResponse: ChildResponse;
    participationBreadth: ParticipationBreadth;
    eventDate: string;
    childName: string;
    childId: string | null;
    organisedBy: string;
    childChoseCelebration: boolean;
    culturallySensitive: boolean;
    ageAppropriate: boolean;
    photosConsentObtained: boolean;
    familyIncluded: boolean;
    peersInvolved: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    budgetApproved: boolean;
    memoriesPreserved: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<CelebrationMilestonesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.celebrationType !== undefined) mapped.celebration_type = updates.celebrationType;
  if (updates.recognitionQuality !== undefined) mapped.recognition_quality = updates.recognitionQuality;
  if (updates.childResponse !== undefined) mapped.child_response = updates.childResponse;
  if (updates.participationBreadth !== undefined) mapped.participation_breadth = updates.participationBreadth;
  if (updates.eventDate !== undefined) mapped.event_date = updates.eventDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.organisedBy !== undefined) mapped.organised_by = updates.organisedBy;
  if (updates.childChoseCelebration !== undefined) mapped.child_chose_celebration = updates.childChoseCelebration;
  if (updates.culturallySensitive !== undefined) mapped.culturally_sensitive = updates.culturallySensitive;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.photosConsentObtained !== undefined) mapped.photos_consent_obtained = updates.photosConsentObtained;
  if (updates.familyIncluded !== undefined) mapped.family_included = updates.familyIncluded;
  if (updates.peersInvolved !== undefined) mapped.peers_involved = updates.peersInvolved;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.budgetApproved !== undefined) mapped.budget_approved = updates.budgetApproved;
  if (updates.memoriesPreserved !== undefined) mapped.memories_preserved = updates.memoriesPreserved;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_celebration_milestones") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as CelebrationMilestonesRecord };
}

export const _testing = { computeCelebrationMilestonesMetrics, identifyCelebrationMilestonesAlerts };
