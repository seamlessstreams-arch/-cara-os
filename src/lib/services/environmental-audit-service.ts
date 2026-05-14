// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ENVIRONMENTAL AUDIT SERVICE
// Tracks structured environmental audits of the home covering
// physical environment, homeliness, safety, and child-friendliness.
// CHR 2015 Reg 25 (premises — appropriate standard),
// Reg 36 (fitness of premises — child-friendly environment),
// Reg 6 (quality of care — homely environment).
//
// Covers: homeliness assessments, safety audits, decoration standards,
// accessibility checks, outdoor space evaluations, sensory environment
// assessments, and personalisation of spaces.
//
// SCCIF: Overall Experiences — "The home is warm and welcoming."
// "Children live in a home that feels like their own."
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

export type AuditArea =
  | "communal_living"
  | "bedrooms"
  | "bathrooms"
  | "kitchen_dining"
  | "outdoor_spaces"
  | "entrance_hallway"
  | "office_staff_areas"
  | "storage_areas"
  | "sensory_spaces"
  | "other";

export type AuditRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate"
  | "not_assessed";

export type AuditType =
  | "scheduled_audit"
  | "spot_check"
  | "annual_review"
  | "post_incident"
  | "pre_admission"
  | "ofsted_preparation"
  | "children_led"
  | "staff_led"
  | "manager_walkthrough"
  | "other";

export type PriorityLevel =
  | "immediate"
  | "high"
  | "medium"
  | "low"
  | "cosmetic";

export interface EnvironmentalAuditRecord {
  id: string;
  home_id: string;
  audit_area: AuditArea;
  audit_rating: AuditRating;
  audit_type: AuditType;
  priority_level: PriorityLevel;
  audit_date: string;
  area_name: string;
  homely_feel: boolean;
  child_friendly: boolean;
  personalised: boolean;
  clean_and_tidy: boolean;
  well_maintained: boolean;
  safe_environment: boolean;
  accessible: boolean;
  adequate_lighting: boolean;
  temperature_comfortable: boolean;
  noise_appropriate: boolean;
  privacy_maintained: boolean;
  children_consulted: boolean;
  issues_found: string[];
  actions_taken: string[];
  audited_by: string;
  next_audit_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const AUDIT_AREAS: { area: AuditArea; label: string }[] = [
  { area: "communal_living", label: "Communal Living" },
  { area: "bedrooms", label: "Bedrooms" },
  { area: "bathrooms", label: "Bathrooms" },
  { area: "kitchen_dining", label: "Kitchen & Dining" },
  { area: "outdoor_spaces", label: "Outdoor Spaces" },
  { area: "entrance_hallway", label: "Entrance & Hallway" },
  { area: "office_staff_areas", label: "Office & Staff Areas" },
  { area: "storage_areas", label: "Storage Areas" },
  { area: "sensory_spaces", label: "Sensory Spaces" },
  { area: "other", label: "Other" },
];

export const AUDIT_RATINGS: { rating: AuditRating; label: string }[] = [
  { rating: "outstanding", label: "Outstanding" },
  { rating: "good", label: "Good" },
  { rating: "requires_improvement", label: "Requires Improvement" },
  { rating: "inadequate", label: "Inadequate" },
  { rating: "not_assessed", label: "Not Assessed" },
];

export const AUDIT_TYPES: { type: AuditType; label: string }[] = [
  { type: "scheduled_audit", label: "Scheduled Audit" },
  { type: "spot_check", label: "Spot Check" },
  { type: "annual_review", label: "Annual Review" },
  { type: "post_incident", label: "Post-Incident" },
  { type: "pre_admission", label: "Pre-Admission" },
  { type: "ofsted_preparation", label: "Ofsted Preparation" },
  { type: "children_led", label: "Children-Led" },
  { type: "staff_led", label: "Staff-Led" },
  { type: "manager_walkthrough", label: "Manager Walkthrough" },
  { type: "other", label: "Other" },
];

export const PRIORITY_LEVELS: { level: PriorityLevel; label: string }[] = [
  { level: "immediate", label: "Immediate" },
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
  { level: "cosmetic", label: "Cosmetic" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeEnvironmentalAuditMetrics(
  records: EnvironmentalAuditRecord[],
): {
  total_audits: number;
  outstanding_count: number;
  good_count: number;
  requires_improvement_count: number;
  inadequate_count: number;
  homely_feel_rate: number;
  child_friendly_rate: number;
  personalised_rate: number;
  clean_and_tidy_rate: number;
  well_maintained_rate: number;
  safe_environment_rate: number;
  accessible_rate: number;
  adequate_lighting_rate: number;
  temperature_comfortable_rate: number;
  privacy_maintained_rate: number;
  children_consulted_rate: number;
  immediate_priority_count: number;
  by_audit_area: Record<string, number>;
  by_audit_rating: Record<string, number>;
  by_audit_type: Record<string, number>;
  by_priority_level: Record<string, number>;
} {
  const outstanding = records.filter((r) => r.audit_rating === "outstanding").length;
  const good = records.filter((r) => r.audit_rating === "good").length;
  const ri = records.filter((r) => r.audit_rating === "requires_improvement").length;
  const inadequate = records.filter((r) => r.audit_rating === "inadequate").length;

  const boolRate = (field: keyof EnvironmentalAuditRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const immediatePriority = records.filter((r) => r.priority_level === "immediate").length;

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.audit_area] = (byArea[r.audit_area] ?? 0) + 1;

  const byRating: Record<string, number> = {};
  for (const r of records) byRating[r.audit_rating] = (byRating[r.audit_rating] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.audit_type] = (byType[r.audit_type] ?? 0) + 1;

  const byPriority: Record<string, number> = {};
  for (const r of records) byPriority[r.priority_level] = (byPriority[r.priority_level] ?? 0) + 1;

  return {
    total_audits: records.length,
    outstanding_count: outstanding,
    good_count: good,
    requires_improvement_count: ri,
    inadequate_count: inadequate,
    homely_feel_rate: boolRate("homely_feel"),
    child_friendly_rate: boolRate("child_friendly"),
    personalised_rate: boolRate("personalised"),
    clean_and_tidy_rate: boolRate("clean_and_tidy"),
    well_maintained_rate: boolRate("well_maintained"),
    safe_environment_rate: boolRate("safe_environment"),
    accessible_rate: boolRate("accessible"),
    adequate_lighting_rate: boolRate("adequate_lighting"),
    temperature_comfortable_rate: boolRate("temperature_comfortable"),
    privacy_maintained_rate: boolRate("privacy_maintained"),
    children_consulted_rate: boolRate("children_consulted"),
    immediate_priority_count: immediatePriority,
    by_audit_area: byArea,
    by_audit_rating: byRating,
    by_audit_type: byType,
    by_priority_level: byPriority,
  };
}

export function identifyEnvironmentalAuditAlerts(
  records: EnvironmentalAuditRecord[],
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

  // Inadequate rating with safety issue
  for (const r of records) {
    if (r.audit_rating === "inadequate" && !r.safe_environment) {
      alerts.push({
        type: "inadequate_unsafe",
        severity: "critical",
        message: `${r.area_name} rated inadequate and unsafe on ${r.audit_date} — address immediately`,
        id: r.id,
      });
    }
  }

  // Immediate priority items
  const immCount = records.filter((r) => r.priority_level === "immediate").length;
  if (immCount >= 1) {
    alerts.push({
      type: "immediate_priority",
      severity: "high",
      message: `${immCount} ${immCount === 1 ? "area has" : "areas have"} immediate priority — action required today`,
      id: "immediate_priority",
    });
  }

  // Not child friendly
  const notChildFriendly = records.filter((r) => !r.child_friendly).length;
  if (notChildFriendly >= 2) {
    alerts.push({
      type: "not_child_friendly",
      severity: "high",
      message: `${notChildFriendly} areas not child-friendly — review environment and make improvements`,
      id: "not_child_friendly",
    });
  }

  // Not personalised
  const notPersonalised = records.filter((r) => !r.personalised).length;
  if (notPersonalised >= 3) {
    alerts.push({
      type: "not_personalised",
      severity: "medium",
      message: `${notPersonalised} areas not personalised — involve children in decorating and personalising`,
      id: "not_personalised",
    });
  }

  // Children not consulted
  const notConsulted = records.filter((r) => !r.children_consulted).length;
  if (notConsulted >= 3) {
    alerts.push({
      type: "children_not_consulted",
      severity: "medium",
      message: `${notConsulted} audits without children consulted — ensure participation in environmental decisions`,
      id: "children_not_consulted",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    auditArea?: AuditArea;
    auditRating?: AuditRating;
    auditType?: AuditType;
    priorityLevel?: PriorityLevel;
    limit?: number;
  },
): Promise<ServiceResult<EnvironmentalAuditRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_environmental_audits") as SB).select("*").eq("home_id", homeId);
  if (filters?.auditArea) q = q.eq("audit_area", filters.auditArea);
  if (filters?.auditRating) q = q.eq("audit_rating", filters.auditRating);
  if (filters?.auditType) q = q.eq("audit_type", filters.auditType);
  if (filters?.priorityLevel) q = q.eq("priority_level", filters.priorityLevel);
  q = q.order("audit_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    auditArea: AuditArea;
    auditRating: AuditRating;
    auditType: AuditType;
    priorityLevel: PriorityLevel;
    auditDate: string;
    areaName: string;
    homelyFeel?: boolean;
    childFriendly?: boolean;
    personalised?: boolean;
    cleanAndTidy?: boolean;
    wellMaintained?: boolean;
    safeEnvironment?: boolean;
    accessible?: boolean;
    adequateLighting?: boolean;
    temperatureComfortable?: boolean;
    noiseAppropriate?: boolean;
    privacyMaintained?: boolean;
    childrenConsulted?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    auditedBy: string;
    nextAuditDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<EnvironmentalAuditRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_environmental_audits") as SB)
    .insert({
      home_id: payload.homeId,
      audit_area: payload.auditArea,
      audit_rating: payload.auditRating,
      audit_type: payload.auditType,
      priority_level: payload.priorityLevel,
      audit_date: payload.auditDate,
      area_name: payload.areaName,
      homely_feel: payload.homelyFeel ?? true,
      child_friendly: payload.childFriendly ?? true,
      personalised: payload.personalised ?? true,
      clean_and_tidy: payload.cleanAndTidy ?? true,
      well_maintained: payload.wellMaintained ?? true,
      safe_environment: payload.safeEnvironment ?? true,
      accessible: payload.accessible ?? true,
      adequate_lighting: payload.adequateLighting ?? true,
      temperature_comfortable: payload.temperatureComfortable ?? true,
      noise_appropriate: payload.noiseAppropriate ?? true,
      privacy_maintained: payload.privacyMaintained ?? true,
      children_consulted: payload.childrenConsulted ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      audited_by: payload.auditedBy,
      next_audit_date: payload.nextAuditDate ?? null,
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
    auditArea: AuditArea;
    auditRating: AuditRating;
    auditType: AuditType;
    priorityLevel: PriorityLevel;
    auditDate: string;
    areaName: string;
    homelyFeel: boolean;
    childFriendly: boolean;
    personalised: boolean;
    cleanAndTidy: boolean;
    wellMaintained: boolean;
    safeEnvironment: boolean;
    accessible: boolean;
    adequateLighting: boolean;
    temperatureComfortable: boolean;
    noiseAppropriate: boolean;
    privacyMaintained: boolean;
    childrenConsulted: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    auditedBy: string;
    nextAuditDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<EnvironmentalAuditRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.auditArea !== undefined) mapped.audit_area = updates.auditArea;
  if (updates.auditRating !== undefined) mapped.audit_rating = updates.auditRating;
  if (updates.auditType !== undefined) mapped.audit_type = updates.auditType;
  if (updates.priorityLevel !== undefined) mapped.priority_level = updates.priorityLevel;
  if (updates.auditDate !== undefined) mapped.audit_date = updates.auditDate;
  if (updates.areaName !== undefined) mapped.area_name = updates.areaName;
  if (updates.homelyFeel !== undefined) mapped.homely_feel = updates.homelyFeel;
  if (updates.childFriendly !== undefined) mapped.child_friendly = updates.childFriendly;
  if (updates.personalised !== undefined) mapped.personalised = updates.personalised;
  if (updates.cleanAndTidy !== undefined) mapped.clean_and_tidy = updates.cleanAndTidy;
  if (updates.wellMaintained !== undefined) mapped.well_maintained = updates.wellMaintained;
  if (updates.safeEnvironment !== undefined) mapped.safe_environment = updates.safeEnvironment;
  if (updates.accessible !== undefined) mapped.accessible = updates.accessible;
  if (updates.adequateLighting !== undefined) mapped.adequate_lighting = updates.adequateLighting;
  if (updates.temperatureComfortable !== undefined) mapped.temperature_comfortable = updates.temperatureComfortable;
  if (updates.noiseAppropriate !== undefined) mapped.noise_appropriate = updates.noiseAppropriate;
  if (updates.privacyMaintained !== undefined) mapped.privacy_maintained = updates.privacyMaintained;
  if (updates.childrenConsulted !== undefined) mapped.children_consulted = updates.childrenConsulted;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.auditedBy !== undefined) mapped.audited_by = updates.auditedBy;
  if (updates.nextAuditDate !== undefined) mapped.next_audit_date = updates.nextAuditDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_environmental_audits") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEnvironmentalAuditMetrics,
  identifyEnvironmentalAuditAlerts,
};
