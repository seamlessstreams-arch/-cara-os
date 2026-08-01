// ══════════════════════════════════════════════════════════════════════════════
// CARA — SIBLING CONTACT QUALITY SERVICE
// Monitors quality and frequency of sibling contact, relationship
// maintenance, and barriers to sibling connections.
// CHR 2015 Reg 22 (contact with family — sibling relationships),
// Reg 7 (children's wishes — sibling bonds).
//
// Covers: contact type, contact quality, sibling relationship,
// barrier type, and support provided.
//
// SCCIF: Experiences — "Sibling relationships are actively maintained."
// "Contact arrangements prioritise children's emotional needs."
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

export type SiblingContactType =
  | "face_to_face"
  | "video_call"
  | "phone_call"
  | "letter_card"
  | "shared_activity"
  | "overnight_stay"
  | "holiday_together"
  | "school_event"
  | "supervised_contact"
  | "other";

export type ContactQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "harmful";

export type SiblingRelationship =
  | "very_close"
  | "close"
  | "developing"
  | "distant"
  | "estranged";

export type BarrierType =
  | "none"
  | "geographical_distance"
  | "safeguarding_concern"
  | "court_restriction"
  | "placement_instability"
  | "sibling_refusal"
  | "child_refusal"
  | "resource_limitation"
  | "scheduling_conflict"
  | "other";

export interface SiblingContactQualityRecord {
  id: string;
  home_id: string;
  contact_type: SiblingContactType;
  contact_quality: ContactQuality;
  sibling_relationship: SiblingRelationship;
  barrier_type: BarrierType;
  contact_date: string;
  child_name: string;
  child_id: string | null;
  sibling_name: string;
  facilitated_by: string;
  child_views_sought: boolean;
  sibling_views_sought: boolean;
  preparation_completed: boolean;
  debrief_completed: boolean;
  emotional_support_given: boolean;
  social_worker_informed: boolean;
  care_plan_reflects: boolean;
  frequency_appropriate: boolean;
  venue_suitable: boolean;
  safeguarding_considered: boolean;
  life_story_linked: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SIBLING_CONTACT_TYPES: { type: SiblingContactType; label: string }[] = [
  { type: "face_to_face", label: "Face to Face" },
  { type: "video_call", label: "Video Call" },
  { type: "phone_call", label: "Phone Call" },
  { type: "letter_card", label: "Letter/Card" },
  { type: "shared_activity", label: "Shared Activity" },
  { type: "overnight_stay", label: "Overnight Stay" },
  { type: "holiday_together", label: "Holiday Together" },
  { type: "school_event", label: "School Event" },
  { type: "supervised_contact", label: "Supervised Contact" },
  { type: "other", label: "Other" },
];

export const CONTACT_QUALITIES: { quality: ContactQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "harmful", label: "Harmful" },
];

export const SIBLING_RELATIONSHIPS: { relationship: SiblingRelationship; label: string }[] = [
  { relationship: "very_close", label: "Very Close" },
  { relationship: "close", label: "Close" },
  { relationship: "developing", label: "Developing" },
  { relationship: "distant", label: "Distant" },
  { relationship: "estranged", label: "Estranged" },
];

export const BARRIER_TYPES: { barrier: BarrierType; label: string }[] = [
  { barrier: "none", label: "None" },
  { barrier: "geographical_distance", label: "Geographical Distance" },
  { barrier: "safeguarding_concern", label: "Safeguarding Concern" },
  { barrier: "court_restriction", label: "Court Restriction" },
  { barrier: "placement_instability", label: "Placement Instability" },
  { barrier: "sibling_refusal", label: "Sibling Refusal" },
  { barrier: "child_refusal", label: "Child Refusal" },
  { barrier: "resource_limitation", label: "Resource Limitation" },
  { barrier: "scheduling_conflict", label: "Scheduling Conflict" },
  { barrier: "other", label: "Other" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeSiblingContactMetrics(
  records: SiblingContactQualityRecord[],
): {
  total_contacts: number;
  poor_quality_count: number;
  harmful_count: number;
  estranged_count: number;
  barrier_count: number;
  child_views_rate: number | null;
  sibling_views_rate: number | null;
  preparation_rate: number | null;
  debrief_rate: number | null;
  emotional_support_rate: number | null;
  social_worker_rate: number | null;
  care_plan_rate: number | null;
  frequency_rate: number | null;
  venue_rate: number | null;
  safeguarding_rate: number | null;
  life_story_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_contact_type: Record<string, number>;
  by_contact_quality: Record<string, number>;
  by_sibling_relationship: Record<string, number>;
  by_barrier_type: Record<string, number>;
} {
  const poorQuality = records.filter((r) => r.contact_quality === "poor").length;
  const harmful = records.filter((r) => r.contact_quality === "harmful").length;
  const estranged = records.filter((r) => r.sibling_relationship === "estranged").length;
  const barriers = records.filter((r) => r.barrier_type !== "none").length;

  const boolRate = (field: keyof SiblingContactQualityRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.contact_type] = (byType[r.contact_type] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.contact_quality] = (byQuality[r.contact_quality] ?? 0) + 1;

  const byRelationship: Record<string, number> = {};
  for (const r of records) byRelationship[r.sibling_relationship] = (byRelationship[r.sibling_relationship] ?? 0) + 1;

  const byBarrier: Record<string, number> = {};
  for (const r of records) byBarrier[r.barrier_type] = (byBarrier[r.barrier_type] ?? 0) + 1;

  return {
    total_contacts: records.length,
    poor_quality_count: poorQuality,
    harmful_count: harmful,
    estranged_count: estranged,
    barrier_count: barriers,
    child_views_rate: boolRate("child_views_sought"),
    sibling_views_rate: boolRate("sibling_views_sought"),
    preparation_rate: boolRate("preparation_completed"),
    debrief_rate: boolRate("debrief_completed"),
    emotional_support_rate: boolRate("emotional_support_given"),
    social_worker_rate: boolRate("social_worker_informed"),
    care_plan_rate: boolRate("care_plan_reflects"),
    frequency_rate: boolRate("frequency_appropriate"),
    venue_rate: boolRate("venue_suitable"),
    safeguarding_rate: boolRate("safeguarding_considered"),
    life_story_rate: boolRate("life_story_linked"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_contact_type: byType,
    by_contact_quality: byQuality,
    by_sibling_relationship: byRelationship,
    by_barrier_type: byBarrier,
  };
}

export function identifySiblingContactAlerts(
  records: SiblingContactQualityRecord[],
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

  // Harmful contact with estranged sibling — per-record
  for (const r of records) {
    if (r.contact_quality === "harmful" && r.sibling_relationship === "estranged") {
      alerts.push({
        type: "harmful_estranged",
        severity: "critical",
        message: `${r.child_name}'s contact with ${r.sibling_name} assessed as harmful with estranged relationship — urgent safeguarding review`,
        id: r.id,
      });
    }
  }

  // Debrief not completed
  const noDebrief = records.filter((r) => !r.debrief_completed).length;
  if (noDebrief >= 1) {
    alerts.push({
      type: "debrief_not_completed",
      severity: "high",
      message: `${noDebrief} ${noDebrief === 1 ? "contact has" : "contacts have"} no debrief completed — ensure emotional processing`,
      id: "debrief_not_completed",
    });
  }

  // Preparation not completed
  const noPrep = records.filter((r) => !r.preparation_completed).length;
  if (noPrep >= 1) {
    alerts.push({
      type: "preparation_not_completed",
      severity: "high",
      message: `${noPrep} ${noPrep === 1 ? "contact has" : "contacts have"} no preparation — children must be prepared for sibling contact`,
      id: "preparation_not_completed",
    });
  }

  // Emotional support not given
  const noSupport = records.filter((r) => !r.emotional_support_given).length;
  if (noSupport >= 2) {
    alerts.push({
      type: "no_emotional_support",
      severity: "medium",
      message: `${noSupport} contacts without emotional support — strengthen post-contact care`,
      id: "no_emotional_support",
    });
  }

  // Life story not linked
  const noLifeStory = records.filter((r) => !r.life_story_linked).length;
  if (noLifeStory >= 2) {
    alerts.push({
      type: "life_story_not_linked",
      severity: "medium",
      message: `${noLifeStory} contacts not linked to life story work — integrate sibling narrative`,
      id: "life_story_not_linked",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    contactType?: SiblingContactType;
    contactQuality?: ContactQuality;
    siblingRelationship?: SiblingRelationship;
    barrierType?: BarrierType;
    limit?: number;
  },
): Promise<ServiceResult<SiblingContactQualityRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_sibling_contact_quality") as SB).select("*").eq("home_id", homeId);
  if (filters?.contactType) q = q.eq("contact_type", filters.contactType);
  if (filters?.contactQuality) q = q.eq("contact_quality", filters.contactQuality);
  if (filters?.siblingRelationship) q = q.eq("sibling_relationship", filters.siblingRelationship);
  if (filters?.barrierType) q = q.eq("barrier_type", filters.barrierType);
  q = q.order("contact_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SiblingContactQualityRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  contactType: SiblingContactType;
  contactQuality: ContactQuality;
  siblingRelationship: SiblingRelationship;
  barrierType: BarrierType;
  contactDate: string;
  childName: string;
  childId?: string | null;
  siblingName: string;
  facilitatedBy: string;
  childViewsSought?: boolean;
  siblingViewsSought?: boolean;
  preparationCompleted?: boolean;
  debriefCompleted?: boolean;
  emotionalSupportGiven?: boolean;
  socialWorkerInformed?: boolean;
  carePlanReflects?: boolean;
  frequencyAppropriate?: boolean;
  venueSuitable?: boolean;
  safeguardingConsidered?: boolean;
  lifeStoryLinked?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<SiblingContactQualityRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_sibling_contact_quality") as SB)
    .insert({
      home_id: payload.homeId,
      contact_type: payload.contactType,
      contact_quality: payload.contactQuality,
      sibling_relationship: payload.siblingRelationship,
      barrier_type: payload.barrierType,
      contact_date: payload.contactDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      sibling_name: payload.siblingName,
      facilitated_by: payload.facilitatedBy,
      child_views_sought: payload.childViewsSought ?? true,
      sibling_views_sought: payload.siblingViewsSought ?? true,
      preparation_completed: payload.preparationCompleted ?? true,
      debrief_completed: payload.debriefCompleted ?? true,
      emotional_support_given: payload.emotionalSupportGiven ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      frequency_appropriate: payload.frequencyAppropriate ?? true,
      venue_suitable: payload.venueSuitable ?? true,
      safeguarding_considered: payload.safeguardingConsidered ?? true,
      life_story_linked: payload.lifeStoryLinked ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SiblingContactQualityRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    contactType: SiblingContactType;
    contactQuality: ContactQuality;
    siblingRelationship: SiblingRelationship;
    barrierType: BarrierType;
    contactDate: string;
    childName: string;
    childId: string | null;
    siblingName: string;
    facilitatedBy: string;
    childViewsSought: boolean;
    siblingViewsSought: boolean;
    preparationCompleted: boolean;
    debriefCompleted: boolean;
    emotionalSupportGiven: boolean;
    socialWorkerInformed: boolean;
    carePlanReflects: boolean;
    frequencyAppropriate: boolean;
    venueSuitable: boolean;
    safeguardingConsidered: boolean;
    lifeStoryLinked: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<SiblingContactQualityRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.contactType !== undefined) mapped.contact_type = updates.contactType;
  if (updates.contactQuality !== undefined) mapped.contact_quality = updates.contactQuality;
  if (updates.siblingRelationship !== undefined) mapped.sibling_relationship = updates.siblingRelationship;
  if (updates.barrierType !== undefined) mapped.barrier_type = updates.barrierType;
  if (updates.contactDate !== undefined) mapped.contact_date = updates.contactDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.siblingName !== undefined) mapped.sibling_name = updates.siblingName;
  if (updates.facilitatedBy !== undefined) mapped.facilitated_by = updates.facilitatedBy;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.siblingViewsSought !== undefined) mapped.sibling_views_sought = updates.siblingViewsSought;
  if (updates.preparationCompleted !== undefined) mapped.preparation_completed = updates.preparationCompleted;
  if (updates.debriefCompleted !== undefined) mapped.debrief_completed = updates.debriefCompleted;
  if (updates.emotionalSupportGiven !== undefined) mapped.emotional_support_given = updates.emotionalSupportGiven;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.frequencyAppropriate !== undefined) mapped.frequency_appropriate = updates.frequencyAppropriate;
  if (updates.venueSuitable !== undefined) mapped.venue_suitable = updates.venueSuitable;
  if (updates.safeguardingConsidered !== undefined) mapped.safeguarding_considered = updates.safeguardingConsidered;
  if (updates.lifeStoryLinked !== undefined) mapped.life_story_linked = updates.lifeStoryLinked;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_sibling_contact_quality") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SiblingContactQualityRecord };
}

export const _testing = { computeSiblingContactMetrics, identifySiblingContactAlerts };
