// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD DIGITAL WELLBEING SERVICE
// Monitors children's digital usage, online safety, screen time,
// and digital literacy to safeguard and promote welfare.
// CHR 2015 Reg 12 (health and wellbeing — holistic needs),
// Reg 11 (duty to secure welfare — online safety).
//
// Covers: device type, online safety rating, screen time compliance,
// digital literacy level, and cyberbullying screening.
//
// SCCIF: Experiences — "Children are safeguarded online."
// "Digital activity is monitored proportionately."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type DeviceType =
  | "smartphone"
  | "tablet"
  | "laptop"
  | "desktop"
  | "gaming_console"
  | "smart_tv"
  | "smart_speaker"
  | "wearable"
  | "shared_device"
  | "other";

export type OnlineSafetyRating =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "unsafe";

export type ScreenTimeCompliance =
  | "within_guidelines"
  | "slightly_over"
  | "significantly_over"
  | "excessive"
  | "not_monitored";

export type DigitalLiteracyLevel =
  | "advanced"
  | "competent"
  | "developing"
  | "basic"
  | "not_assessed";

export interface ChildDigitalWellbeingRecord {
  id: string;
  home_id: string;
  device_type: DeviceType;
  online_safety_rating: OnlineSafetyRating;
  screen_time_compliance: ScreenTimeCompliance;
  digital_literacy_level: DigitalLiteracyLevel;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  assessed_by: string;
  parental_controls_active: boolean;
  age_appropriate_content: boolean;
  online_safety_educated: boolean;
  cyberbullying_screened: boolean;
  social_media_monitored: boolean;
  gaming_monitored: boolean;
  privacy_settings_reviewed: boolean;
  digital_agreement_signed: boolean;
  care_plan_reflects: boolean;
  screen_time_discussed: boolean;
  sleep_impact_assessed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DEVICE_TYPES: { type: DeviceType; label: string }[] = [
  { type: "smartphone", label: "Smartphone" },
  { type: "tablet", label: "Tablet" },
  { type: "laptop", label: "Laptop" },
  { type: "desktop", label: "Desktop" },
  { type: "gaming_console", label: "Gaming Console" },
  { type: "smart_tv", label: "Smart TV" },
  { type: "smart_speaker", label: "Smart Speaker" },
  { type: "wearable", label: "Wearable" },
  { type: "shared_device", label: "Shared Device" },
  { type: "other", label: "Other" },
];

export const ONLINE_SAFETY_RATINGS: { rating: OnlineSafetyRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "adequate", label: "Adequate" },
  { rating: "poor", label: "Poor" },
  { rating: "unsafe", label: "Unsafe" },
];

export const SCREEN_TIME_COMPLIANCES: { compliance: ScreenTimeCompliance; label: string }[] = [
  { compliance: "within_guidelines", label: "Within Guidelines" },
  { compliance: "slightly_over", label: "Slightly Over" },
  { compliance: "significantly_over", label: "Significantly Over" },
  { compliance: "excessive", label: "Excessive" },
  { compliance: "not_monitored", label: "Not Monitored" },
];

export const DIGITAL_LITERACY_LEVELS: { level: DigitalLiteracyLevel; label: string }[] = [
  { level: "advanced", label: "Advanced" },
  { level: "competent", label: "Competent" },
  { level: "developing", label: "Developing" },
  { level: "basic", label: "Basic" },
  { level: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeChildDigitalWellbeingMetrics(
  records: ChildDigitalWellbeingRecord[],
): {
  total_assessments: number;
  poor_safety_count: number;
  unsafe_safety_count: number;
  excessive_screen_count: number;
  not_monitored_count: number;
  parental_controls_rate: number | null;
  age_appropriate_rate: number | null;
  online_safety_educated_rate: number | null;
  cyberbullying_screened_rate: number | null;
  social_media_rate: number | null;
  gaming_monitored_rate: number | null;
  privacy_settings_rate: number | null;
  digital_agreement_rate: number | null;
  care_plan_rate: number | null;
  screen_time_discussed_rate: number | null;
  sleep_impact_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_device_type: Record<string, number>;
  by_online_safety_rating: Record<string, number>;
  by_screen_time_compliance: Record<string, number>;
  by_digital_literacy_level: Record<string, number>;
} {
  const poorSafety = records.filter((r) => r.online_safety_rating === "poor").length;
  const unsafeSafety = records.filter((r) => r.online_safety_rating === "unsafe").length;
  const excessiveScreen = records.filter((r) => r.screen_time_compliance === "excessive").length;
  const notMonitored = records.filter((r) => r.screen_time_compliance === "not_monitored").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof ChildDigitalWellbeingRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byDevice: Record<string, number> = {};
  for (const r of records) byDevice[r.device_type] = (byDevice[r.device_type] ?? 0) + 1;

  const bySafety: Record<string, number> = {};
  for (const r of records) bySafety[r.online_safety_rating] = (bySafety[r.online_safety_rating] ?? 0) + 1;

  const byScreen: Record<string, number> = {};
  for (const r of records) byScreen[r.screen_time_compliance] = (byScreen[r.screen_time_compliance] ?? 0) + 1;

  const byLiteracy: Record<string, number> = {};
  for (const r of records) byLiteracy[r.digital_literacy_level] = (byLiteracy[r.digital_literacy_level] ?? 0) + 1;

  return {
    total_assessments: records.length,
    poor_safety_count: poorSafety,
    unsafe_safety_count: unsafeSafety,
    excessive_screen_count: excessiveScreen,
    not_monitored_count: notMonitored,
    parental_controls_rate: boolRate("parental_controls_active"),
    age_appropriate_rate: boolRate("age_appropriate_content"),
    online_safety_educated_rate: boolRate("online_safety_educated"),
    cyberbullying_screened_rate: boolRate("cyberbullying_screened"),
    social_media_rate: boolRate("social_media_monitored"),
    gaming_monitored_rate: boolRate("gaming_monitored"),
    privacy_settings_rate: boolRate("privacy_settings_reviewed"),
    digital_agreement_rate: boolRate("digital_agreement_signed"),
    care_plan_rate: boolRate("care_plan_reflects"),
    screen_time_discussed_rate: boolRate("screen_time_discussed"),
    sleep_impact_rate: boolRate("sleep_impact_assessed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_device_type: byDevice,
    by_online_safety_rating: bySafety,
    by_screen_time_compliance: byScreen,
    by_digital_literacy_level: byLiteracy,
  };
}

export function identifyChildDigitalWellbeingAlerts(
  records: ChildDigitalWellbeingRecord[],
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

  // Unsafe with no parental controls — per-record
  for (const r of records) {
    if (r.online_safety_rating === "unsafe" && !r.parental_controls_active) {
      alerts.push({
        type: "unsafe_no_controls",
        severity: "critical",
        message: `${r.child_name} has unsafe online safety rating without parental controls on ${r.device_type.replace(/_/g, " ")} — immediate safeguarding action required`,
        id: r.id,
      });
    }
  }

  // Cyberbullying not screened
  const notScreened = records.filter((r) => !r.cyberbullying_screened).length;
  if (notScreened >= 1) {
    alerts.push({
      type: "cyberbullying_not_screened",
      severity: "high",
      message: `${notScreened} ${notScreened === 1 ? "assessment has" : "assessments have"} not screened for cyberbullying — ensure online safeguarding`,
      id: "cyberbullying_not_screened",
    });
  }

  // Online safety not educated
  const notEducated = records.filter((r) => !r.online_safety_educated).length;
  if (notEducated >= 1) {
    alerts.push({
      type: "online_safety_not_educated",
      severity: "high",
      message: `${notEducated} ${notEducated === 1 ? "assessment shows" : "assessments show"} no online safety education — strengthen digital literacy`,
      id: "online_safety_not_educated",
    });
  }

  // Social media not monitored
  const smNotMonitored = records.filter((r) => !r.social_media_monitored).length;
  if (smNotMonitored >= 2) {
    alerts.push({
      type: "social_media_not_monitored",
      severity: "medium",
      message: `${smNotMonitored} assessments without social media monitoring — review safeguarding measures`,
      id: "social_media_not_monitored",
    });
  }

  // Sleep impact not assessed
  const sleepNotAssessed = records.filter((r) => !r.sleep_impact_assessed).length;
  if (sleepNotAssessed >= 2) {
    alerts.push({
      type: "sleep_impact_not_assessed",
      severity: "medium",
      message: `${sleepNotAssessed} assessments without sleep impact assessment — consider wellbeing effects`,
      id: "sleep_impact_not_assessed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    deviceType?: DeviceType;
    onlineSafetyRating?: OnlineSafetyRating;
    screenTimeCompliance?: ScreenTimeCompliance;
    digitalLiteracyLevel?: DigitalLiteracyLevel;
    limit?: number;
  },
): Promise<ServiceResult<ChildDigitalWellbeingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_digital_wellbeing") as SB).select("*").eq("home_id", homeId);
  if (filters?.deviceType) q = q.eq("device_type", filters.deviceType);
  if (filters?.onlineSafetyRating) q = q.eq("online_safety_rating", filters.onlineSafetyRating);
  if (filters?.screenTimeCompliance) q = q.eq("screen_time_compliance", filters.screenTimeCompliance);
  if (filters?.digitalLiteracyLevel) q = q.eq("digital_literacy_level", filters.digitalLiteracyLevel);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    deviceType: DeviceType;
    onlineSafetyRating: OnlineSafetyRating;
    screenTimeCompliance: ScreenTimeCompliance;
    digitalLiteracyLevel: DigitalLiteracyLevel;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    assessedBy: string;
    parentalControlsActive?: boolean;
    ageAppropriateContent?: boolean;
    onlineSafetyEducated?: boolean;
    cyberbullyingScreened?: boolean;
    socialMediaMonitored?: boolean;
    gamingMonitored?: boolean;
    privacySettingsReviewed?: boolean;
    digitalAgreementSigned?: boolean;
    carePlanReflects?: boolean;
    screenTimeDiscussed?: boolean;
    sleepImpactAssessed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ChildDigitalWellbeingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_digital_wellbeing") as SB)
    .insert({
      home_id: payload.homeId,
      device_type: payload.deviceType,
      online_safety_rating: payload.onlineSafetyRating,
      screen_time_compliance: payload.screenTimeCompliance,
      digital_literacy_level: payload.digitalLiteracyLevel,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessed_by: payload.assessedBy,
      parental_controls_active: payload.parentalControlsActive ?? true,
      age_appropriate_content: payload.ageAppropriateContent ?? true,
      online_safety_educated: payload.onlineSafetyEducated ?? true,
      cyberbullying_screened: payload.cyberbullyingScreened ?? true,
      social_media_monitored: payload.socialMediaMonitored ?? true,
      gaming_monitored: payload.gamingMonitored ?? true,
      privacy_settings_reviewed: payload.privacySettingsReviewed ?? true,
      digital_agreement_signed: payload.digitalAgreementSigned ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      screen_time_discussed: payload.screenTimeDiscussed ?? true,
      sleep_impact_assessed: payload.sleepImpactAssessed ?? true,
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
    deviceType: DeviceType;
    onlineSafetyRating: OnlineSafetyRating;
    screenTimeCompliance: ScreenTimeCompliance;
    digitalLiteracyLevel: DigitalLiteracyLevel;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    assessedBy: string;
    parentalControlsActive: boolean;
    ageAppropriateContent: boolean;
    onlineSafetyEducated: boolean;
    cyberbullyingScreened: boolean;
    socialMediaMonitored: boolean;
    gamingMonitored: boolean;
    privacySettingsReviewed: boolean;
    digitalAgreementSigned: boolean;
    carePlanReflects: boolean;
    screenTimeDiscussed: boolean;
    sleepImpactAssessed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildDigitalWellbeingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.deviceType !== undefined) mapped.device_type = updates.deviceType;
  if (updates.onlineSafetyRating !== undefined) mapped.online_safety_rating = updates.onlineSafetyRating;
  if (updates.screenTimeCompliance !== undefined) mapped.screen_time_compliance = updates.screenTimeCompliance;
  if (updates.digitalLiteracyLevel !== undefined) mapped.digital_literacy_level = updates.digitalLiteracyLevel;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.parentalControlsActive !== undefined) mapped.parental_controls_active = updates.parentalControlsActive;
  if (updates.ageAppropriateContent !== undefined) mapped.age_appropriate_content = updates.ageAppropriateContent;
  if (updates.onlineSafetyEducated !== undefined) mapped.online_safety_educated = updates.onlineSafetyEducated;
  if (updates.cyberbullyingScreened !== undefined) mapped.cyberbullying_screened = updates.cyberbullyingScreened;
  if (updates.socialMediaMonitored !== undefined) mapped.social_media_monitored = updates.socialMediaMonitored;
  if (updates.gamingMonitored !== undefined) mapped.gaming_monitored = updates.gamingMonitored;
  if (updates.privacySettingsReviewed !== undefined) mapped.privacy_settings_reviewed = updates.privacySettingsReviewed;
  if (updates.digitalAgreementSigned !== undefined) mapped.digital_agreement_signed = updates.digitalAgreementSigned;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.screenTimeDiscussed !== undefined) mapped.screen_time_discussed = updates.screenTimeDiscussed;
  if (updates.sleepImpactAssessed !== undefined) mapped.sleep_impact_assessed = updates.sleepImpactAssessed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_child_digital_wellbeing") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeChildDigitalWellbeingMetrics,
  identifyChildDigitalWellbeingAlerts,
};
