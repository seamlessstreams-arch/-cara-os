// ==============================================================================
// CORNERSTONE — RELIGIOUS & SPIRITUAL NEEDS SERVICE
// Tracks religious, spiritual, and faith-based support provided to
// children in residential care, ensuring freedom of thought, conscience,
// and religion is actively promoted and protected.
// CHR 2015 Reg 10 (religious needs), Reg 12 (holistic well-being),
// Equality Act 2010 (religion or belief), NMS 3 (placement planning).
//
// Covers: faith background, support type, worship access, dietary
// observance, festival celebration, prayer space, faith leader contact.
//
// SCCIF: Experiences — "Children's religious and spiritual needs are
// understood and actively supported."
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// -- Types --------------------------------------------------------------------

export type FaithBackground =
  | "christian"
  | "muslim"
  | "hindu"
  | "sikh"
  | "jewish"
  | "buddhist"
  | "no_faith"
  | "spiritual_not_religious"
  | "other";

export type RSNSupportType =
  | "worship_access"
  | "dietary_observance"
  | "festival_celebration"
  | "prayer_space"
  | "faith_leader_contact"
  | "religious_education"
  | "faith_community"
  | "other";

export type Frequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "occasionally"
  | "not_provided";

export type SatisfactionLevel =
  | "very_satisfied"
  | "satisfied"
  | "neutral"
  | "dissatisfied"
  | "not_recorded";

export interface ReligiousSpiritualNeedsRecord {
  id: string;
  home_id: string;
  faith_background: FaithBackground;
  support_type: RSNSupportType;
  frequency: Frequency;
  satisfaction_level: SatisfactionLevel;
  support_date: string;
  child_name: string;
  child_id: string | null;
  staff_name: string;
  facilitated: boolean;
  child_views_sought: boolean;
  parent_carer_consulted: boolean;
  culturally_appropriate: boolean;
  dietary_observance_met: boolean;
  worship_access_provided: boolean;
  prayer_space_available: boolean;
  festival_recognised: boolean;
  faith_leader_contacted: boolean;
  careplan_updated: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Constants ----------------------------------------------------------------

export const FAITH_BACKGROUNDS: { faith: FaithBackground; label: string }[] = [
  { faith: "christian", label: "Christian" },
  { faith: "muslim", label: "Muslim" },
  { faith: "hindu", label: "Hindu" },
  { faith: "sikh", label: "Sikh" },
  { faith: "jewish", label: "Jewish" },
  { faith: "buddhist", label: "Buddhist" },
  { faith: "no_faith", label: "No Faith" },
  { faith: "spiritual_not_religious", label: "Spiritual but Not Religious" },
  { faith: "other", label: "Other" },
];

export const RSN_SUPPORT_TYPES: { type: RSNSupportType; label: string }[] = [
  { type: "worship_access", label: "Worship Access" },
  { type: "dietary_observance", label: "Dietary Observance" },
  { type: "festival_celebration", label: "Festival Celebration" },
  { type: "prayer_space", label: "Prayer Space" },
  { type: "faith_leader_contact", label: "Faith Leader Contact" },
  { type: "religious_education", label: "Religious Education" },
  { type: "faith_community", label: "Faith Community" },
  { type: "other", label: "Other" },
];

export const FREQUENCIES: { freq: Frequency; label: string }[] = [
  { freq: "daily", label: "Daily" },
  { freq: "weekly", label: "Weekly" },
  { freq: "monthly", label: "Monthly" },
  { freq: "occasionally", label: "Occasionally" },
  { freq: "not_provided", label: "Not Provided" },
];

export const SATISFACTION_LEVELS: { level: SatisfactionLevel; label: string }[] = [
  { level: "very_satisfied", label: "Very Satisfied" },
  { level: "satisfied", label: "Satisfied" },
  { level: "neutral", label: "Neutral" },
  { level: "dissatisfied", label: "Dissatisfied" },
  { level: "not_recorded", label: "Not Recorded" },
];

// -- Pure functions (no DB) ---------------------------------------------------

export function computeReligiousSpiritualMetrics(
  records: ReligiousSpiritualNeedsRecord[],
): {
  total_supports: number;
  facilitated_count: number;
  not_facilitated_count: number;
  satisfied_count: number;
  dissatisfied_count: number;
  child_views_sought_rate: number;
  parent_carer_consulted_rate: number;
  culturally_appropriate_rate: number;
  dietary_observance_rate: number;
  worship_access_rate: number;
  prayer_space_rate: number;
  festival_recognised_rate: number;
  faith_leader_contacted_rate: number;
  careplan_updated_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_faith_background: Record<string, number>;
  by_support_type: Record<string, number>;
  by_frequency: Record<string, number>;
  by_satisfaction_level: Record<string, number>;
} {
  const facilitated = records.filter((r) => r.facilitated).length;
  const notFacilitated = records.filter((r) => !r.facilitated).length;
  const satisfied = records.filter(
    (r) => r.satisfaction_level === "very_satisfied" || r.satisfaction_level === "satisfied",
  ).length;
  const dissatisfied = records.filter((r) => r.satisfaction_level === "dissatisfied").length;

  const boolRate = (field: keyof ReligiousSpiritualNeedsRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byFaith: Record<string, number> = {};
  for (const r of records) byFaith[r.faith_background] = (byFaith[r.faith_background] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.support_type] = (byType[r.support_type] ?? 0) + 1;

  const byFreq: Record<string, number> = {};
  for (const r of records) byFreq[r.frequency] = (byFreq[r.frequency] ?? 0) + 1;

  const bySatisfaction: Record<string, number> = {};
  for (const r of records) bySatisfaction[r.satisfaction_level] = (bySatisfaction[r.satisfaction_level] ?? 0) + 1;

  return {
    total_supports: records.length,
    facilitated_count: facilitated,
    not_facilitated_count: notFacilitated,
    satisfied_count: satisfied,
    dissatisfied_count: dissatisfied,
    child_views_sought_rate: boolRate("child_views_sought"),
    parent_carer_consulted_rate: boolRate("parent_carer_consulted"),
    culturally_appropriate_rate: boolRate("culturally_appropriate"),
    dietary_observance_rate: boolRate("dietary_observance_met"),
    worship_access_rate: boolRate("worship_access_provided"),
    prayer_space_rate: boolRate("prayer_space_available"),
    festival_recognised_rate: boolRate("festival_recognised"),
    faith_leader_contacted_rate: boolRate("faith_leader_contacted"),
    careplan_updated_rate: boolRate("careplan_updated"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_faith_background: byFaith,
    by_support_type: byType,
    by_frequency: byFreq,
    by_satisfaction_level: bySatisfaction,
  };
}

export function identifyReligiousSpiritualAlerts(
  records: ReligiousSpiritualNeedsRecord[],
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

  // Dissatisfied and views not sought
  for (const r of records) {
    if (r.satisfaction_level === "dissatisfied" && !r.child_views_sought) {
      alerts.push({
        type: "dissatisfied_views_not_sought",
        severity: "critical",
        message: `${r.child_name} is dissatisfied with ${r.support_type.replace(/_/g, " ")} support and their views were not sought — UNCRC Article 14 requires respect for freedom of religion`,
        id: r.id,
      });
    }
  }

  // Not facilitated
  const notFacilitated = records.filter((r) => !r.facilitated).length;
  if (notFacilitated >= 1) {
    alerts.push({
      type: "not_facilitated",
      severity: "high",
      message: `${notFacilitated} religious support ${notFacilitated === 1 ? "session was" : "sessions were"} not facilitated — the home must actively enable children's religious practice`,
      id: "not_facilitated",
    });
  }

  // Careplan not updated
  const noCareplan = records.filter((r) => !r.careplan_updated).length;
  if (noCareplan >= 1) {
    alerts.push({
      type: "careplan_not_updated",
      severity: "high",
      message: `${noCareplan} ${noCareplan === 1 ? "record shows" : "records show"} care plan not updated for religious needs — NMS 3 requires placement plans to address religious observance`,
      id: "careplan_not_updated",
    });
  }

  // Not culturally appropriate
  const notAppropriate = records.filter((r) => !r.culturally_appropriate).length;
  if (notAppropriate >= 1) {
    alerts.push({
      type: "not_culturally_appropriate",
      severity: "high",
      message: `${notAppropriate} ${notAppropriate === 1 ? "support session was" : "support sessions were"} not culturally appropriate — review faith-sensitive practice`,
      id: "not_culturally_appropriate",
    });
  }

  // Dietary observance not met
  const noDiet = records.filter((r) => !r.dietary_observance_met).length;
  if (noDiet >= 2) {
    alerts.push({
      type: "dietary_not_met",
      severity: "medium",
      message: `${noDiet} sessions where dietary observance was not met — faith-based dietary needs are non-negotiable`,
      id: "dietary_not_met",
    });
  }

  // Parent not consulted
  const noParent = records.filter((r) => !r.parent_carer_consulted).length;
  if (noParent >= 2) {
    alerts.push({
      type: "parent_not_consulted",
      severity: "medium",
      message: `${noParent} religious support sessions without parent/carer consultation — families hold essential faith knowledge`,
      id: "parent_not_consulted",
    });
  }

  return alerts;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    faithBackground?: FaithBackground;
    supportType?: RSNSupportType;
    frequency?: Frequency;
    satisfactionLevel?: SatisfactionLevel;
    limit?: number;
  },
): Promise<ServiceResult<ReligiousSpiritualNeedsRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_religious_spiritual_needs") as SB).select("*").eq("home_id", homeId);
  if (filters?.faithBackground) q = q.eq("faith_background", filters.faithBackground);
  if (filters?.supportType) q = q.eq("support_type", filters.supportType);
  if (filters?.frequency) q = q.eq("frequency", filters.frequency);
  if (filters?.satisfactionLevel) q = q.eq("satisfaction_level", filters.satisfactionLevel);
  q = q.order("support_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    faithBackground: FaithBackground;
    supportType: RSNSupportType;
    frequency: Frequency;
    satisfactionLevel: SatisfactionLevel;
    supportDate: string;
    childName: string;
    childId?: string | null;
    staffName: string;
    facilitated?: boolean;
    childViewsSought?: boolean;
    parentCarerConsulted?: boolean;
    culturallyAppropriate?: boolean;
    dietaryObservanceMet?: boolean;
    worshipAccessProvided?: boolean;
    prayerSpaceAvailable?: boolean;
    festivalRecognised?: boolean;
    faithLeaderContacted?: boolean;
    careplanUpdated?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ReligiousSpiritualNeedsRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_religious_spiritual_needs") as SB)
    .insert({
      home_id: payload.homeId,
      faith_background: payload.faithBackground,
      support_type: payload.supportType,
      frequency: payload.frequency,
      satisfaction_level: payload.satisfactionLevel,
      support_date: payload.supportDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      staff_name: payload.staffName,
      facilitated: payload.facilitated ?? true,
      child_views_sought: payload.childViewsSought ?? true,
      parent_carer_consulted: payload.parentCarerConsulted ?? true,
      culturally_appropriate: payload.culturallyAppropriate ?? true,
      dietary_observance_met: payload.dietaryObservanceMet ?? true,
      worship_access_provided: payload.worshipAccessProvided ?? true,
      prayer_space_available: payload.prayerSpaceAvailable ?? true,
      festival_recognised: payload.festivalRecognised ?? true,
      faith_leader_contacted: payload.faithLeaderContacted ?? false,
      careplan_updated: payload.careplanUpdated ?? true,
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
    faithBackground: FaithBackground;
    supportType: RSNSupportType;
    frequency: Frequency;
    satisfactionLevel: SatisfactionLevel;
    supportDate: string;
    childName: string;
    childId: string | null;
    staffName: string;
    facilitated: boolean;
    childViewsSought: boolean;
    parentCarerConsulted: boolean;
    culturallyAppropriate: boolean;
    dietaryObservanceMet: boolean;
    worshipAccessProvided: boolean;
    prayerSpaceAvailable: boolean;
    festivalRecognised: boolean;
    faithLeaderContacted: boolean;
    careplanUpdated: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ReligiousSpiritualNeedsRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.faithBackground !== undefined) mapped.faith_background = updates.faithBackground;
  if (updates.supportType !== undefined) mapped.support_type = updates.supportType;
  if (updates.frequency !== undefined) mapped.frequency = updates.frequency;
  if (updates.satisfactionLevel !== undefined) mapped.satisfaction_level = updates.satisfactionLevel;
  if (updates.supportDate !== undefined) mapped.support_date = updates.supportDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.facilitated !== undefined) mapped.facilitated = updates.facilitated;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.parentCarerConsulted !== undefined) mapped.parent_carer_consulted = updates.parentCarerConsulted;
  if (updates.culturallyAppropriate !== undefined) mapped.culturally_appropriate = updates.culturallyAppropriate;
  if (updates.dietaryObservanceMet !== undefined) mapped.dietary_observance_met = updates.dietaryObservanceMet;
  if (updates.worshipAccessProvided !== undefined) mapped.worship_access_provided = updates.worshipAccessProvided;
  if (updates.prayerSpaceAvailable !== undefined) mapped.prayer_space_available = updates.prayerSpaceAvailable;
  if (updates.festivalRecognised !== undefined) mapped.festival_recognised = updates.festivalRecognised;
  if (updates.faithLeaderContacted !== undefined) mapped.faith_leader_contacted = updates.faithLeaderContacted;
  if (updates.careplanUpdated !== undefined) mapped.careplan_updated = updates.careplanUpdated;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_religious_spiritual_needs") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// -- Testing exports ----------------------------------------------------------

export const _testing = {
  computeReligiousSpiritualMetrics,
  identifyReligiousSpiritualAlerts,
};
