// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DEVICE SCREEN TIME MONITORING SERVICE
// Tracks device usage, screen time limits, digital boundaries,
// age-appropriate content, and technology wellbeing.
// CHR 2015 Reg 12(2)(b) (online safety — managing device access),
// Reg 11(2)(a) (positive relationships — healthy technology use).
//
// Covers: device type, usage category, compliance level,
// wellbeing impact, and boundary management.
//
// SCCIF: Experiences — "Screen time is managed appropriately."
// "Children have healthy relationships with technology."
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

export type DeviceType =
  | "smartphone"
  | "tablet"
  | "laptop"
  | "desktop"
  | "games_console"
  | "smart_tv"
  | "smart_speaker"
  | "wearable"
  | "shared_device"
  | "other";

export type UsageCategory =
  | "educational"
  | "social_media"
  | "gaming"
  | "streaming"
  | "communication"
  | "creative"
  | "browsing"
  | "mixed"
  | "inappropriate"
  | "other";

export type ComplianceLevel =
  | "fully_compliant"
  | "mostly_compliant"
  | "partially_compliant"
  | "non_compliant"
  | "refused_limits";

export type WellbeingImpact =
  | "positive"
  | "neutral"
  | "mild_concern"
  | "moderate_concern"
  | "significant_concern";

export interface DeviceScreenTimeMonitoringRecord {
  id: string;
  home_id: string;
  device_type: DeviceType;
  usage_category: UsageCategory;
  compliance_level: ComplianceLevel;
  wellbeing_impact: WellbeingImpact;
  monitoring_date: string;
  child_name: string;
  child_id: string | null;
  monitored_by: string;
  limits_agreed: boolean;
  age_appropriate_content: boolean;
  parental_controls_active: boolean;
  night_time_limits: boolean;
  social_media_supervised: boolean;
  privacy_settings_checked: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  online_safety_discussed: boolean;
  healthy_alternatives_offered: boolean;
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
  { type: "games_console", label: "Games Console" },
  { type: "smart_tv", label: "Smart TV" },
  { type: "smart_speaker", label: "Smart Speaker" },
  { type: "wearable", label: "Wearable" },
  { type: "shared_device", label: "Shared Device" },
  { type: "other", label: "Other" },
];

export const USAGE_CATEGORIES: { category: UsageCategory; label: string }[] = [
  { category: "educational", label: "Educational" },
  { category: "social_media", label: "Social Media" },
  { category: "gaming", label: "Gaming" },
  { category: "streaming", label: "Streaming" },
  { category: "communication", label: "Communication" },
  { category: "creative", label: "Creative" },
  { category: "browsing", label: "Browsing" },
  { category: "mixed", label: "Mixed" },
  { category: "inappropriate", label: "Inappropriate" },
  { category: "other", label: "Other" },
];

export const COMPLIANCE_LEVELS: { level: ComplianceLevel; label: string }[] = [
  { level: "fully_compliant", label: "Fully Compliant" },
  { level: "mostly_compliant", label: "Mostly Compliant" },
  { level: "partially_compliant", label: "Partially Compliant" },
  { level: "non_compliant", label: "Non-Compliant" },
  { level: "refused_limits", label: "Refused Limits" },
];

export const WELLBEING_IMPACTS: { impact: WellbeingImpact; label: string }[] = [
  { impact: "positive", label: "Positive" },
  { impact: "neutral", label: "Neutral" },
  { impact: "mild_concern", label: "Mild Concern" },
  { impact: "moderate_concern", label: "Moderate Concern" },
  { impact: "significant_concern", label: "Significant Concern" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeDeviceScreenTimeMetrics(
  records: DeviceScreenTimeMonitoringRecord[],
): {
  total_checks: number;
  non_compliant_count: number;
  refused_count: number;
  inappropriate_count: number;
  significant_concern_count: number;
  limits_agreed_rate: number;
  age_appropriate_rate: number;
  parental_controls_rate: number;
  night_time_limits_rate: number;
  social_media_supervised_rate: number;
  privacy_settings_rate: number;
  care_plan_rate: number;
  social_worker_rate: number;
  parent_informed_rate: number;
  online_safety_rate: number;
  healthy_alternatives_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_device_type: Record<string, number>;
  by_usage_category: Record<string, number>;
  by_compliance_level: Record<string, number>;
  by_wellbeing_impact: Record<string, number>;
} {
  const nonCompliant = records.filter((r) => r.compliance_level === "non_compliant").length;
  const refused = records.filter((r) => r.compliance_level === "refused_limits").length;
  const inappropriate = records.filter((r) => r.usage_category === "inappropriate").length;
  const significantConcern = records.filter((r) => r.wellbeing_impact === "significant_concern").length;

  const boolRate = (field: keyof DeviceScreenTimeMonitoringRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const byDevice: Record<string, number> = {};
  for (const r of records) byDevice[r.device_type] = (byDevice[r.device_type] ?? 0) + 1;

  const byUsage: Record<string, number> = {};
  for (const r of records) byUsage[r.usage_category] = (byUsage[r.usage_category] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_level] = (byCompliance[r.compliance_level] ?? 0) + 1;

  const byWellbeing: Record<string, number> = {};
  for (const r of records) byWellbeing[r.wellbeing_impact] = (byWellbeing[r.wellbeing_impact] ?? 0) + 1;

  return {
    total_checks: records.length,
    non_compliant_count: nonCompliant,
    refused_count: refused,
    inappropriate_count: inappropriate,
    significant_concern_count: significantConcern,
    limits_agreed_rate: boolRate("limits_agreed"),
    age_appropriate_rate: boolRate("age_appropriate_content"),
    parental_controls_rate: boolRate("parental_controls_active"),
    night_time_limits_rate: boolRate("night_time_limits"),
    social_media_supervised_rate: boolRate("social_media_supervised"),
    privacy_settings_rate: boolRate("privacy_settings_checked"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    online_safety_rate: boolRate("online_safety_discussed"),
    healthy_alternatives_rate: boolRate("healthy_alternatives_offered"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_device_type: byDevice,
    by_usage_category: byUsage,
    by_compliance_level: byCompliance,
    by_wellbeing_impact: byWellbeing,
  };
}

export function identifyDeviceScreenTimeAlerts(
  records: DeviceScreenTimeMonitoringRecord[],
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

  // Inappropriate content with significant concern — per-record critical
  for (const r of records) {
    if (r.usage_category === "inappropriate" && r.wellbeing_impact === "significant_concern") {
      alerts.push({
        type: "inappropriate_significant_concern",
        severity: "critical",
        message: `${r.child_name} accessing inappropriate content on ${r.device_type.replace(/_/g, " ")} with significant wellbeing concern — immediate safeguarding review`,
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
      message: `${noControls} ${noControls === 1 ? "device has" : "devices have"} no parental controls active — essential for child safety`,
      id: "no_parental_controls",
    });
  }

  // No night time limits
  const noNight = records.filter((r) => !r.night_time_limits).length;
  if (noNight >= 1) {
    alerts.push({
      type: "no_night_limits",
      severity: "high",
      message: `${noNight} ${noNight === 1 ? "check has" : "checks have"} no night-time limits — protect sleep and wellbeing`,
      id: "no_night_limits",
    });
  }

  // No online safety discussion
  const noSafety = records.filter((r) => !r.online_safety_discussed).length;
  if (noSafety >= 2) {
    alerts.push({
      type: "no_online_safety_discussion",
      severity: "medium",
      message: `${noSafety} checks without online safety discussion — ensure regular digital literacy conversations`,
      id: "no_online_safety_discussion",
    });
  }

  // Privacy settings not checked
  const noPrivacy = records.filter((r) => !r.privacy_settings_checked).length;
  if (noPrivacy >= 2) {
    alerts.push({
      type: "no_privacy_settings",
      severity: "medium",
      message: `${noPrivacy} checks without privacy settings reviewed — protect children from data exposure`,
      id: "no_privacy_settings",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    deviceType?: DeviceType;
    usageCategory?: UsageCategory;
    complianceLevel?: ComplianceLevel;
    wellbeingImpact?: WellbeingImpact;
    limit?: number;
  },
): Promise<ServiceResult<DeviceScreenTimeMonitoringRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_device_screen_time_monitoring") as SB).select("*").eq("home_id", homeId);
  if (filters?.deviceType) q = q.eq("device_type", filters.deviceType);
  if (filters?.usageCategory) q = q.eq("usage_category", filters.usageCategory);
  if (filters?.complianceLevel) q = q.eq("compliance_level", filters.complianceLevel);
  if (filters?.wellbeingImpact) q = q.eq("wellbeing_impact", filters.wellbeingImpact);
  q = q.order("monitoring_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as DeviceScreenTimeMonitoringRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  deviceType: DeviceType;
  usageCategory: UsageCategory;
  complianceLevel: ComplianceLevel;
  wellbeingImpact: WellbeingImpact;
  monitoringDate: string;
  childName: string;
  childId?: string | null;
  monitoredBy: string;
  limitsAgreed?: boolean;
  ageAppropriateContent?: boolean;
  parentalControlsActive?: boolean;
  nightTimeLimits?: boolean;
  socialMediaSupervised?: boolean;
  privacySettingsChecked?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  onlineSafetyDiscussed?: boolean;
  healthyAlternativesOffered?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<DeviceScreenTimeMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_device_screen_time_monitoring") as SB)
    .insert({
      home_id: payload.homeId,
      device_type: payload.deviceType,
      usage_category: payload.usageCategory,
      compliance_level: payload.complianceLevel,
      wellbeing_impact: payload.wellbeingImpact,
      monitoring_date: payload.monitoringDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      monitored_by: payload.monitoredBy,
      limits_agreed: payload.limitsAgreed ?? true,
      age_appropriate_content: payload.ageAppropriateContent ?? true,
      parental_controls_active: payload.parentalControlsActive ?? true,
      night_time_limits: payload.nightTimeLimits ?? true,
      social_media_supervised: payload.socialMediaSupervised ?? true,
      privacy_settings_checked: payload.privacySettingsChecked ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
      online_safety_discussed: payload.onlineSafetyDiscussed ?? true,
      healthy_alternatives_offered: payload.healthyAlternativesOffered ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as DeviceScreenTimeMonitoringRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    deviceType: DeviceType;
    usageCategory: UsageCategory;
    complianceLevel: ComplianceLevel;
    wellbeingImpact: WellbeingImpact;
    monitoringDate: string;
    childName: string;
    childId: string | null;
    monitoredBy: string;
    limitsAgreed: boolean;
    ageAppropriateContent: boolean;
    parentalControlsActive: boolean;
    nightTimeLimits: boolean;
    socialMediaSupervised: boolean;
    privacySettingsChecked: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    onlineSafetyDiscussed: boolean;
    healthyAlternativesOffered: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<DeviceScreenTimeMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.deviceType !== undefined) mapped.device_type = updates.deviceType;
  if (updates.usageCategory !== undefined) mapped.usage_category = updates.usageCategory;
  if (updates.complianceLevel !== undefined) mapped.compliance_level = updates.complianceLevel;
  if (updates.wellbeingImpact !== undefined) mapped.wellbeing_impact = updates.wellbeingImpact;
  if (updates.monitoringDate !== undefined) mapped.monitoring_date = updates.monitoringDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.monitoredBy !== undefined) mapped.monitored_by = updates.monitoredBy;
  if (updates.limitsAgreed !== undefined) mapped.limits_agreed = updates.limitsAgreed;
  if (updates.ageAppropriateContent !== undefined) mapped.age_appropriate_content = updates.ageAppropriateContent;
  if (updates.parentalControlsActive !== undefined) mapped.parental_controls_active = updates.parentalControlsActive;
  if (updates.nightTimeLimits !== undefined) mapped.night_time_limits = updates.nightTimeLimits;
  if (updates.socialMediaSupervised !== undefined) mapped.social_media_supervised = updates.socialMediaSupervised;
  if (updates.privacySettingsChecked !== undefined) mapped.privacy_settings_checked = updates.privacySettingsChecked;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.onlineSafetyDiscussed !== undefined) mapped.online_safety_discussed = updates.onlineSafetyDiscussed;
  if (updates.healthyAlternativesOffered !== undefined) mapped.healthy_alternatives_offered = updates.healthyAlternativesOffered;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_device_screen_time_monitoring") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as DeviceScreenTimeMonitoringRecord };
}

export const _testing = { computeDeviceScreenTimeMetrics, identifyDeviceScreenTimeAlerts };
