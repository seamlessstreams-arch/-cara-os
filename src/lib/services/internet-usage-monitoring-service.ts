// ══════════════════════════════════════════════════════════════════════════════
// CARA — INTERNET USAGE MONITORING SERVICE
// Tracks children's internet and device usage including screen time,
// content access, social media monitoring, and online safety concerns.
// CHR 2015 Reg 12 (health and wellbeing — online safety),
// Reg 7 (individual child — age-appropriate access),
// Reg 13 (leadership and management — safeguarding oversight).
//
// Covers: device type, usage purpose, content category, monitoring
// level, screen time, parental controls, and safety concerns.
//
// SCCIF: Safety — "Online safety is actively managed."
// "Children are supported to use the internet safely."
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
  | "personal_phone"
  | "provided_phone"
  | "tablet"
  | "laptop"
  | "desktop"
  | "gaming_console"
  | "smart_tv"
  | "shared_device"
  | "smart_watch"
  | "other";

export type UsagePurpose =
  | "education"
  | "social_media"
  | "gaming"
  | "streaming"
  | "communication"
  | "creative"
  | "research"
  | "shopping"
  | "news"
  | "other";

export type ConcernLevel =
  | "no_concerns"
  | "low"
  | "medium"
  | "high"
  | "safeguarding_referral";

export type MonitoringLevel =
  | "full_monitoring"
  | "periodic_checks"
  | "self_reported"
  | "minimal"
  | "none";

export interface InternetUsageMonitoringRecord {
  id: string;
  home_id: string;
  device_type: DeviceType;
  usage_purpose: UsagePurpose;
  concern_level: ConcernLevel;
  monitoring_level: MonitoringLevel;
  monitoring_date: string;
  child_name: string;
  child_id: string | null;
  monitored_by: string;
  parental_controls_active: boolean;
  age_appropriate_content: boolean;
  screen_time_within_limits: boolean;
  privacy_settings_checked: boolean;
  social_media_reviewed: boolean;
  contact_list_checked: boolean;
  online_safety_discussed: boolean;
  digital_literacy_supported: boolean;
  consent_current: boolean;
  care_plan_linked: boolean;
  social_worker_informed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  screen_time_minutes: number;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DEVICE_TYPES: { type: DeviceType; label: string }[] = [
  { type: "personal_phone", label: "Personal Phone" },
  { type: "provided_phone", label: "Provided Phone" },
  { type: "tablet", label: "Tablet" },
  { type: "laptop", label: "Laptop" },
  { type: "desktop", label: "Desktop" },
  { type: "gaming_console", label: "Gaming Console" },
  { type: "smart_tv", label: "Smart TV" },
  { type: "shared_device", label: "Shared Device" },
  { type: "smart_watch", label: "Smart Watch" },
  { type: "other", label: "Other" },
];

export const USAGE_PURPOSES: { purpose: UsagePurpose; label: string }[] = [
  { purpose: "education", label: "Education" },
  { purpose: "social_media", label: "Social Media" },
  { purpose: "gaming", label: "Gaming" },
  { purpose: "streaming", label: "Streaming" },
  { purpose: "communication", label: "Communication" },
  { purpose: "creative", label: "Creative" },
  { purpose: "research", label: "Research" },
  { purpose: "shopping", label: "Shopping" },
  { purpose: "news", label: "News" },
  { purpose: "other", label: "Other" },
];

export const CONCERN_LEVELS: { level: ConcernLevel; label: string }[] = [
  { level: "no_concerns", label: "No Concerns" },
  { level: "low", label: "Low" },
  { level: "medium", label: "Medium" },
  { level: "high", label: "High" },
  { level: "safeguarding_referral", label: "Safeguarding Referral" },
];

export const MONITORING_LEVELS: { level: MonitoringLevel; label: string }[] = [
  { level: "full_monitoring", label: "Full Monitoring" },
  { level: "periodic_checks", label: "Periodic Checks" },
  { level: "self_reported", label: "Self-Reported" },
  { level: "minimal", label: "Minimal" },
  { level: "none", label: "None" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeInternetUsageMetrics(
  records: InternetUsageMonitoringRecord[],
): {
  total_records: number;
  high_concern_count: number;
  safeguarding_referral_count: number;
  no_monitoring_count: number;
  social_media_count: number;
  parental_controls_rate: number | null;
  age_appropriate_rate: number | null;
  screen_time_within_limits_rate: number | null;
  privacy_settings_rate: number | null;
  social_media_reviewed_rate: number | null;
  contact_list_rate: number | null;
  online_safety_discussed_rate: number | null;
  digital_literacy_rate: number | null;
  consent_current_rate: number | null;
  care_plan_linked_rate: number | null;
  social_worker_informed_rate: number | null;
  recorded_promptly_rate: number | null;
  average_screen_time: number | null;
  unique_children: number;
  by_device_type: Record<string, number>;
  by_usage_purpose: Record<string, number>;
  by_concern_level: Record<string, number>;
  by_monitoring_level: Record<string, number>;
} {
  const highConcern = records.filter((r) => r.concern_level === "high").length;
  const safeguardingReferral = records.filter((r) => r.concern_level === "safeguarding_referral").length;
  const noMonitoring = records.filter((r) => r.monitoring_level === "none").length;
  const socialMedia = records.filter((r) => r.usage_purpose === "social_media").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof InternetUsageMonitoringRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const avgScreenTime = records.length > 0
    ? Math.round((records.reduce((sum, r) => sum + r.screen_time_minutes, 0) / records.length) * 10) / 10
    : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byDevice: Record<string, number> = {};
  for (const r of records) byDevice[r.device_type] = (byDevice[r.device_type] ?? 0) + 1;

  const byPurpose: Record<string, number> = {};
  for (const r of records) byPurpose[r.usage_purpose] = (byPurpose[r.usage_purpose] ?? 0) + 1;

  const byConcern: Record<string, number> = {};
  for (const r of records) byConcern[r.concern_level] = (byConcern[r.concern_level] ?? 0) + 1;

  const byMonitoring: Record<string, number> = {};
  for (const r of records) byMonitoring[r.monitoring_level] = (byMonitoring[r.monitoring_level] ?? 0) + 1;

  return {
    total_records: records.length,
    high_concern_count: highConcern,
    safeguarding_referral_count: safeguardingReferral,
    no_monitoring_count: noMonitoring,
    social_media_count: socialMedia,
    parental_controls_rate: boolRate("parental_controls_active"),
    age_appropriate_rate: boolRate("age_appropriate_content"),
    screen_time_within_limits_rate: boolRate("screen_time_within_limits"),
    privacy_settings_rate: boolRate("privacy_settings_checked"),
    social_media_reviewed_rate: boolRate("social_media_reviewed"),
    contact_list_rate: boolRate("contact_list_checked"),
    online_safety_discussed_rate: boolRate("online_safety_discussed"),
    digital_literacy_rate: boolRate("digital_literacy_supported"),
    consent_current_rate: boolRate("consent_current"),
    care_plan_linked_rate: boolRate("care_plan_linked"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    average_screen_time: avgScreenTime,
    unique_children: uniqueChildren,
    by_device_type: byDevice,
    by_usage_purpose: byPurpose,
    by_concern_level: byConcern,
    by_monitoring_level: byMonitoring,
  };
}

export function identifyInternetUsageAlerts(
  records: InternetUsageMonitoringRecord[],
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

  // Safeguarding referral
  for (const r of records) {
    if (r.concern_level === "safeguarding_referral") {
      alerts.push({
        type: "safeguarding_referral",
        severity: "critical",
        message: `${r.child_name} has safeguarding referral from internet monitoring on ${r.monitoring_date} — follow safeguarding procedures`,
        id: r.id,
      });
    }
  }

  // No parental controls
  const noControls = records.filter((r) => !r.parental_controls_active).length;
  if (noControls >= 1) {
    alerts.push({
      type: "no_parental_controls",
      severity: "high",
      message: `${noControls} ${noControls === 1 ? "device has" : "devices have"} no parental controls active — activate immediately`,
      id: "no_parental_controls",
    });
  }

  // Online safety not discussed
  const noSafety = records.filter((r) => !r.online_safety_discussed).length;
  if (noSafety >= 1) {
    alerts.push({
      type: "safety_not_discussed",
      severity: "high",
      message: `${noSafety} ${noSafety === 1 ? "monitoring check has" : "monitoring checks have"} online safety not discussed — ensure digital safety education`,
      id: "safety_not_discussed",
    });
  }

  // Privacy settings not checked
  const noPrivacy = records.filter((r) => !r.privacy_settings_checked).length;
  if (noPrivacy >= 2) {
    alerts.push({
      type: "privacy_not_checked",
      severity: "medium",
      message: `${noPrivacy} checks without privacy settings reviewed — verify account security`,
      id: "privacy_not_checked",
    });
  }

  // Screen time not within limits
  const noLimits = records.filter((r) => !r.screen_time_within_limits).length;
  if (noLimits >= 2) {
    alerts.push({
      type: "screen_time_exceeded",
      severity: "medium",
      message: `${noLimits} records with screen time exceeding limits — review screen time agreements`,
      id: "screen_time_exceeded",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    deviceType?: DeviceType;
    usagePurpose?: UsagePurpose;
    concernLevel?: ConcernLevel;
    monitoringLevel?: MonitoringLevel;
    limit?: number;
  },
): Promise<ServiceResult<InternetUsageMonitoringRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_internet_usage_monitoring") as SB).select("*").eq("home_id", homeId);
  if (filters?.deviceType) q = q.eq("device_type", filters.deviceType);
  if (filters?.usagePurpose) q = q.eq("usage_purpose", filters.usagePurpose);
  if (filters?.concernLevel) q = q.eq("concern_level", filters.concernLevel);
  if (filters?.monitoringLevel) q = q.eq("monitoring_level", filters.monitoringLevel);
  q = q.order("monitoring_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    deviceType: DeviceType;
    usagePurpose: UsagePurpose;
    concernLevel: ConcernLevel;
    monitoringLevel: MonitoringLevel;
    monitoringDate: string;
    childName: string;
    childId?: string | null;
    monitoredBy: string;
    parentalControlsActive?: boolean;
    ageAppropriateContent?: boolean;
    screenTimeWithinLimits?: boolean;
    privacySettingsChecked?: boolean;
    socialMediaReviewed?: boolean;
    contactListChecked?: boolean;
    onlineSafetyDiscussed?: boolean;
    digitalLiteracySupported?: boolean;
    consentCurrent?: boolean;
    carePlanLinked?: boolean;
    socialWorkerInformed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    screenTimeMinutes: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<InternetUsageMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_internet_usage_monitoring") as SB)
    .insert({
      home_id: payload.homeId,
      device_type: payload.deviceType,
      usage_purpose: payload.usagePurpose,
      concern_level: payload.concernLevel,
      monitoring_level: payload.monitoringLevel,
      monitoring_date: payload.monitoringDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      monitored_by: payload.monitoredBy,
      parental_controls_active: payload.parentalControlsActive ?? true,
      age_appropriate_content: payload.ageAppropriateContent ?? true,
      screen_time_within_limits: payload.screenTimeWithinLimits ?? true,
      privacy_settings_checked: payload.privacySettingsChecked ?? true,
      social_media_reviewed: payload.socialMediaReviewed ?? true,
      contact_list_checked: payload.contactListChecked ?? true,
      online_safety_discussed: payload.onlineSafetyDiscussed ?? true,
      digital_literacy_supported: payload.digitalLiteracySupported ?? true,
      consent_current: payload.consentCurrent ?? true,
      care_plan_linked: payload.carePlanLinked ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      screen_time_minutes: payload.screenTimeMinutes,
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
    usagePurpose: UsagePurpose;
    concernLevel: ConcernLevel;
    monitoringLevel: MonitoringLevel;
    monitoringDate: string;
    childName: string;
    childId: string | null;
    monitoredBy: string;
    parentalControlsActive: boolean;
    ageAppropriateContent: boolean;
    screenTimeWithinLimits: boolean;
    privacySettingsChecked: boolean;
    socialMediaReviewed: boolean;
    contactListChecked: boolean;
    onlineSafetyDiscussed: boolean;
    digitalLiteracySupported: boolean;
    consentCurrent: boolean;
    carePlanLinked: boolean;
    socialWorkerInformed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    screenTimeMinutes: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<InternetUsageMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.deviceType !== undefined) mapped.device_type = updates.deviceType;
  if (updates.usagePurpose !== undefined) mapped.usage_purpose = updates.usagePurpose;
  if (updates.concernLevel !== undefined) mapped.concern_level = updates.concernLevel;
  if (updates.monitoringLevel !== undefined) mapped.monitoring_level = updates.monitoringLevel;
  if (updates.monitoringDate !== undefined) mapped.monitoring_date = updates.monitoringDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.monitoredBy !== undefined) mapped.monitored_by = updates.monitoredBy;
  if (updates.parentalControlsActive !== undefined) mapped.parental_controls_active = updates.parentalControlsActive;
  if (updates.ageAppropriateContent !== undefined) mapped.age_appropriate_content = updates.ageAppropriateContent;
  if (updates.screenTimeWithinLimits !== undefined) mapped.screen_time_within_limits = updates.screenTimeWithinLimits;
  if (updates.privacySettingsChecked !== undefined) mapped.privacy_settings_checked = updates.privacySettingsChecked;
  if (updates.socialMediaReviewed !== undefined) mapped.social_media_reviewed = updates.socialMediaReviewed;
  if (updates.contactListChecked !== undefined) mapped.contact_list_checked = updates.contactListChecked;
  if (updates.onlineSafetyDiscussed !== undefined) mapped.online_safety_discussed = updates.onlineSafetyDiscussed;
  if (updates.digitalLiteracySupported !== undefined) mapped.digital_literacy_supported = updates.digitalLiteracySupported;
  if (updates.consentCurrent !== undefined) mapped.consent_current = updates.consentCurrent;
  if (updates.carePlanLinked !== undefined) mapped.care_plan_linked = updates.carePlanLinked;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.screenTimeMinutes !== undefined) mapped.screen_time_minutes = updates.screenTimeMinutes;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_internet_usage_monitoring") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeInternetUsageMetrics,
  identifyInternetUsageAlerts,
};
