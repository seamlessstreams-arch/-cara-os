// ══════════════════════════════════════════════════════════════════════════════
// CARA — LIFE STORY WORK SERVICE
// Tracks life story work sessions with children to help them understand
// their history, identity, and journey through care. Essential for
// emotional wellbeing, identity formation, and sense of belonging.
// CHR 2015 Reg 7 (individual child — identity and self-esteem),
// Reg 6 (quality of care — emotional wellbeing),
// Reg 14 (care planning — life story work in placement plans).
//
// Covers: life story books, memory boxes, timeline work, family tree
// work, identity exploration, cultural heritage, photograph collation,
// digital stories, and therapeutic narrative work.
//
// SCCIF: Overall Experiences — "Children understand their history."
// "Life story work is sensitively delivered."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SessionType =
  | "life_story_book"
  | "memory_box"
  | "timeline_work"
  | "family_tree"
  | "identity_exploration"
  | "cultural_heritage"
  | "photograph_collation"
  | "digital_story"
  | "therapeutic_narrative"
  | "other";

export type ChildEngagement =
  | "fully_engaged"
  | "mostly_engaged"
  | "partially_engaged"
  | "reluctant"
  | "declined";

export type EmotionalResponse =
  | "positive"
  | "neutral"
  | "mixed"
  | "distressed"
  | "not_recorded";

export type SessionFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "as_needed"
  | "one_off";

export interface LifeStoryWorkRecord {
  id: string;
  home_id: string;
  session_type: SessionType;
  child_engagement: ChildEngagement;
  emotional_response: EmotionalResponse;
  session_frequency: SessionFrequency;
  session_date: string;
  child_name: string;
  child_id: string | null;
  facilitator_name: string;
  age_appropriate: boolean;
  trauma_informed: boolean;
  child_led: boolean;
  consent_obtained: boolean;
  social_worker_aware: boolean;
  therapist_consulted: boolean;
  materials_created: boolean;
  securely_stored: boolean;
  shared_with_child: boolean;
  parent_involvement: boolean;
  cultural_sensitivity: boolean;
  follow_up_planned: boolean;
  issues_found: string[];
  actions_taken: string[];
  session_duration_minutes: number;
  next_session_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SESSION_TYPES: { type: SessionType; label: string }[] = [
  { type: "life_story_book", label: "Life Story Book" },
  { type: "memory_box", label: "Memory Box" },
  { type: "timeline_work", label: "Timeline Work" },
  { type: "family_tree", label: "Family Tree" },
  { type: "identity_exploration", label: "Identity Exploration" },
  { type: "cultural_heritage", label: "Cultural Heritage" },
  { type: "photograph_collation", label: "Photograph Collation" },
  { type: "digital_story", label: "Digital Story" },
  { type: "therapeutic_narrative", label: "Therapeutic Narrative" },
  { type: "other", label: "Other" },
];

export const CHILD_ENGAGEMENTS: { engagement: ChildEngagement; label: string }[] = [
  { engagement: "fully_engaged", label: "Fully Engaged" },
  { engagement: "mostly_engaged", label: "Mostly Engaged" },
  { engagement: "partially_engaged", label: "Partially Engaged" },
  { engagement: "reluctant", label: "Reluctant" },
  { engagement: "declined", label: "Declined" },
];

export const EMOTIONAL_RESPONSES: { response: EmotionalResponse; label: string }[] = [
  { response: "positive", label: "Positive" },
  { response: "neutral", label: "Neutral" },
  { response: "mixed", label: "Mixed" },
  { response: "distressed", label: "Distressed" },
  { response: "not_recorded", label: "Not Recorded" },
];

export const SESSION_FREQUENCIES: { frequency: SessionFrequency; label: string }[] = [
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "as_needed", label: "As Needed" },
  { frequency: "one_off", label: "One-Off" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeLifeStoryWorkMetrics(
  records: LifeStoryWorkRecord[],
): {
  total_sessions: number;
  fully_engaged_count: number;
  declined_count: number;
  distressed_count: number;
  age_appropriate_rate: number | null;
  trauma_informed_rate: number | null;
  child_led_rate: number | null;
  consent_obtained_rate: number | null;
  social_worker_aware_rate: number | null;
  therapist_consulted_rate: number | null;
  materials_created_rate: number | null;
  securely_stored_rate: number | null;
  shared_with_child_rate: number | null;
  parent_involvement_rate: number | null;
  cultural_sensitivity_rate: number | null;
  follow_up_planned_rate: number | null;
  average_session_duration: number | null;
  unique_children: number;
  by_session_type: Record<string, number>;
  by_child_engagement: Record<string, number>;
  by_emotional_response: Record<string, number>;
  by_session_frequency: Record<string, number>;
} {
  const fullyEngaged = records.filter((r) => r.child_engagement === "fully_engaged").length;
  const declined = records.filter((r) => r.child_engagement === "declined").length;
  const distressed = records.filter((r) => r.emotional_response === "distressed").length;

  const boolRate = (field: keyof LifeStoryWorkRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgDuration = records.length > 0
    ? Math.round((records.reduce((sum, r) => sum + r.session_duration_minutes, 0) / records.length) * 10) / 10
    : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.session_type] = (byType[r.session_type] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.child_engagement] = (byEngagement[r.child_engagement] ?? 0) + 1;

  const byResponse: Record<string, number> = {};
  for (const r of records) byResponse[r.emotional_response] = (byResponse[r.emotional_response] ?? 0) + 1;

  const byFreq: Record<string, number> = {};
  for (const r of records) byFreq[r.session_frequency] = (byFreq[r.session_frequency] ?? 0) + 1;

  return {
    total_sessions: records.length,
    fully_engaged_count: fullyEngaged,
    declined_count: declined,
    distressed_count: distressed,
    age_appropriate_rate: boolRate("age_appropriate"),
    trauma_informed_rate: boolRate("trauma_informed"),
    child_led_rate: boolRate("child_led"),
    consent_obtained_rate: boolRate("consent_obtained"),
    social_worker_aware_rate: boolRate("social_worker_aware"),
    therapist_consulted_rate: boolRate("therapist_consulted"),
    materials_created_rate: boolRate("materials_created"),
    securely_stored_rate: boolRate("securely_stored"),
    shared_with_child_rate: boolRate("shared_with_child"),
    parent_involvement_rate: boolRate("parent_involvement"),
    cultural_sensitivity_rate: boolRate("cultural_sensitivity"),
    follow_up_planned_rate: boolRate("follow_up_planned"),
    average_session_duration: avgDuration,
    unique_children: uniqueChildren,
    by_session_type: byType,
    by_child_engagement: byEngagement,
    by_emotional_response: byResponse,
    by_session_frequency: byFreq,
  };
}

export function identifyLifeStoryWorkAlerts(
  records: LifeStoryWorkRecord[],
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

  // Child distressed without therapist
  for (const r of records) {
    if (r.emotional_response === "distressed" && !r.therapist_consulted) {
      alerts.push({
        type: "distressed_no_therapist",
        severity: "critical",
        message: `${r.child_name} was distressed during session on ${r.session_date} — therapist not consulted`,
        id: r.id,
      });
    }
  }

  // Not trauma informed
  const notTrauma = records.filter((r) => !r.trauma_informed).length;
  if (notTrauma >= 1) {
    alerts.push({
      type: "not_trauma_informed",
      severity: "high",
      message: `${notTrauma} ${notTrauma === 1 ? "session is" : "sessions are"} not trauma-informed — review approach`,
      id: "not_trauma_informed",
    });
  }

  // Materials not securely stored
  const notSecure = records.filter((r) => r.materials_created && !r.securely_stored).length;
  if (notSecure >= 1) {
    alerts.push({
      type: "materials_not_secure",
      severity: "high",
      message: `${notSecure} ${notSecure === 1 ? "session has" : "sessions have"} materials not securely stored — protect sensitive content`,
      id: "materials_not_secure",
    });
  }

  // Consent not obtained
  const noConsent = records.filter((r) => !r.consent_obtained).length;
  if (noConsent >= 2) {
    alerts.push({
      type: "consent_not_obtained",
      severity: "medium",
      message: `${noConsent} sessions without consent obtained — ensure proper authorisation`,
      id: "consent_not_obtained",
    });
  }

  // Not culturally sensitive
  const notCultural = records.filter((r) => !r.cultural_sensitivity).length;
  if (notCultural >= 3) {
    alerts.push({
      type: "not_culturally_sensitive",
      severity: "medium",
      message: `${notCultural} sessions without cultural sensitivity — review identity work approach`,
      id: "not_culturally_sensitive",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    sessionType?: SessionType;
    childEngagement?: ChildEngagement;
    emotionalResponse?: EmotionalResponse;
    sessionFrequency?: SessionFrequency;
    limit?: number;
  },
): Promise<ServiceResult<LifeStoryWorkRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_life_story_work") as SB).select("*").eq("home_id", homeId);
  if (filters?.sessionType) q = q.eq("session_type", filters.sessionType);
  if (filters?.childEngagement) q = q.eq("child_engagement", filters.childEngagement);
  if (filters?.emotionalResponse) q = q.eq("emotional_response", filters.emotionalResponse);
  if (filters?.sessionFrequency) q = q.eq("session_frequency", filters.sessionFrequency);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    sessionType: SessionType;
    childEngagement: ChildEngagement;
    emotionalResponse: EmotionalResponse;
    sessionFrequency: SessionFrequency;
    sessionDate: string;
    childName: string;
    childId?: string | null;
    facilitatorName: string;
    ageAppropriate?: boolean;
    traumaInformed?: boolean;
    childLed?: boolean;
    consentObtained?: boolean;
    socialWorkerAware?: boolean;
    therapistConsulted?: boolean;
    materialsCreated?: boolean;
    securelyStored?: boolean;
    sharedWithChild?: boolean;
    parentInvolvement?: boolean;
    culturalSensitivity?: boolean;
    followUpPlanned?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    sessionDurationMinutes: number;
    nextSessionDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<LifeStoryWorkRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_life_story_work") as SB)
    .insert({
      home_id: payload.homeId,
      session_type: payload.sessionType,
      child_engagement: payload.childEngagement,
      emotional_response: payload.emotionalResponse,
      session_frequency: payload.sessionFrequency,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      facilitator_name: payload.facilitatorName,
      age_appropriate: payload.ageAppropriate ?? true,
      trauma_informed: payload.traumaInformed ?? true,
      child_led: payload.childLed ?? true,
      consent_obtained: payload.consentObtained ?? true,
      social_worker_aware: payload.socialWorkerAware ?? true,
      therapist_consulted: payload.therapistConsulted ?? false,
      materials_created: payload.materialsCreated ?? false,
      securely_stored: payload.securelyStored ?? true,
      shared_with_child: payload.sharedWithChild ?? false,
      parent_involvement: payload.parentInvolvement ?? false,
      cultural_sensitivity: payload.culturalSensitivity ?? true,
      follow_up_planned: payload.followUpPlanned ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      session_duration_minutes: payload.sessionDurationMinutes,
      next_session_date: payload.nextSessionDate ?? null,
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
    sessionType: SessionType;
    childEngagement: ChildEngagement;
    emotionalResponse: EmotionalResponse;
    sessionFrequency: SessionFrequency;
    sessionDate: string;
    childName: string;
    childId: string | null;
    facilitatorName: string;
    ageAppropriate: boolean;
    traumaInformed: boolean;
    childLed: boolean;
    consentObtained: boolean;
    socialWorkerAware: boolean;
    therapistConsulted: boolean;
    materialsCreated: boolean;
    securelyStored: boolean;
    sharedWithChild: boolean;
    parentInvolvement: boolean;
    culturalSensitivity: boolean;
    followUpPlanned: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    sessionDurationMinutes: number;
    nextSessionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<LifeStoryWorkRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.sessionType !== undefined) mapped.session_type = updates.sessionType;
  if (updates.childEngagement !== undefined) mapped.child_engagement = updates.childEngagement;
  if (updates.emotionalResponse !== undefined) mapped.emotional_response = updates.emotionalResponse;
  if (updates.sessionFrequency !== undefined) mapped.session_frequency = updates.sessionFrequency;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.traumaInformed !== undefined) mapped.trauma_informed = updates.traumaInformed;
  if (updates.childLed !== undefined) mapped.child_led = updates.childLed;
  if (updates.consentObtained !== undefined) mapped.consent_obtained = updates.consentObtained;
  if (updates.socialWorkerAware !== undefined) mapped.social_worker_aware = updates.socialWorkerAware;
  if (updates.therapistConsulted !== undefined) mapped.therapist_consulted = updates.therapistConsulted;
  if (updates.materialsCreated !== undefined) mapped.materials_created = updates.materialsCreated;
  if (updates.securelyStored !== undefined) mapped.securely_stored = updates.securelyStored;
  if (updates.sharedWithChild !== undefined) mapped.shared_with_child = updates.sharedWithChild;
  if (updates.parentInvolvement !== undefined) mapped.parent_involvement = updates.parentInvolvement;
  if (updates.culturalSensitivity !== undefined) mapped.cultural_sensitivity = updates.culturalSensitivity;
  if (updates.followUpPlanned !== undefined) mapped.follow_up_planned = updates.followUpPlanned;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.sessionDurationMinutes !== undefined) mapped.session_duration_minutes = updates.sessionDurationMinutes;
  if (updates.nextSessionDate !== undefined) mapped.next_session_date = updates.nextSessionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_life_story_work") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeLifeStoryWorkMetrics,
  identifyLifeStoryWorkAlerts,
};
