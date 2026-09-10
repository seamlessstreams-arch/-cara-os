// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMUNAL AREA AUDIT SERVICE
// Tracks living spaces, kitchens, dining areas, gardens, and shared spaces
// for cleanliness, safety, homeliness, and regulatory compliance.
// CHR 2015 Reg 36 (fitness of premises — communal areas),
// Reg 6 (quality of care — living environment),
// Reg 25 (health and safety — shared spaces).
//
// Covers: lounge inspections, kitchen hygiene, dining area checks,
// garden safety, bathroom audits, and homeliness assessments.
//
// SCCIF: Overall Experiences — "The home is welcoming and homely."
// "Communal areas are clean, safe, and well-maintained."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AreaType =
  | "lounge"
  | "kitchen"
  | "dining_room"
  | "garden"
  | "hallway"
  | "bathroom"
  | "utility_room"
  | "office"
  | "sensory_room"
  | "other";

export type CleanlinessRating =
  | "spotless"
  | "clean"
  | "acceptable"
  | "needs_attention"
  | "unacceptable";

export type HomelinessRating =
  | "very_homely"
  | "homely"
  | "adequate"
  | "institutional"
  | "not_assessed";

export type SafetyCheck =
  | "all_clear"
  | "minor_hazard"
  | "significant_hazard"
  | "immediate_risk"
  | "not_checked";

export interface CommunalAreaRecord {
  id: string;
  home_id: string;
  area_type: AreaType;
  audit_date: string;
  cleanliness_rating: CleanlinessRating;
  homeliness_rating: HomelinessRating;
  safety_check: SafetyCheck;
  furniture_good_condition: boolean;
  decoration_fresh: boolean;
  temperature_comfortable: boolean;
  lighting_adequate: boolean;
  ventilation_adequate: boolean;
  accessible: boolean;
  child_artwork_displayed: boolean;
  age_appropriate_resources: boolean;
  hazards_removed: boolean;
  fire_exits_clear: boolean;
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

export const AREA_TYPES: { type: AreaType; label: string }[] = [
  { type: "lounge", label: "Lounge" },
  { type: "kitchen", label: "Kitchen" },
  { type: "dining_room", label: "Dining Room" },
  { type: "garden", label: "Garden" },
  { type: "hallway", label: "Hallway" },
  { type: "bathroom", label: "Bathroom" },
  { type: "utility_room", label: "Utility Room" },
  { type: "office", label: "Office" },
  { type: "sensory_room", label: "Sensory Room" },
  { type: "other", label: "Other" },
];

export const CLEANLINESS_RATINGS: { rating: CleanlinessRating; label: string }[] = [
  { rating: "spotless", label: "Spotless" },
  { rating: "clean", label: "Clean" },
  { rating: "acceptable", label: "Acceptable" },
  { rating: "needs_attention", label: "Needs Attention" },
  { rating: "unacceptable", label: "Unacceptable" },
];

export const HOMELINESS_RATINGS: { rating: HomelinessRating; label: string }[] = [
  { rating: "very_homely", label: "Very Homely" },
  { rating: "homely", label: "Homely" },
  { rating: "adequate", label: "Adequate" },
  { rating: "institutional", label: "Institutional" },
  { rating: "not_assessed", label: "Not Assessed" },
];

export const SAFETY_CHECKS: { check: SafetyCheck; label: string }[] = [
  { check: "all_clear", label: "All Clear" },
  { check: "minor_hazard", label: "Minor Hazard" },
  { check: "significant_hazard", label: "Significant Hazard" },
  { check: "immediate_risk", label: "Immediate Risk" },
  { check: "not_checked", label: "Not Checked" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeCommunalAreaMetrics(
  records: CommunalAreaRecord[],
): {
  total_audits: number;
  spotless_rate: number | null;
  clean_rate: number | null;
  unacceptable_count: number;
  very_homely_rate: number | null;
  institutional_count: number;
  all_clear_rate: number | null;
  immediate_risk_count: number;
  significant_hazard_count: number;
  furniture_good_rate: number | null;
  decoration_fresh_rate: number | null;
  temperature_comfortable_rate: number | null;
  lighting_adequate_rate: number | null;
  accessible_rate: number | null;
  child_artwork_rate: number | null;
  age_appropriate_rate: number | null;
  hazards_removed_rate: number | null;
  fire_exits_clear_rate: number | null;
  children_consulted_rate: number | null;
  audit_overdue_count: number;
  by_area_type: Record<string, number>;
  by_cleanliness_rating: Record<string, number>;
  by_homeliness_rating: Record<string, number>;
  by_safety_check: Record<string, number>;
} {
  const spotless = records.filter((r) => r.cleanliness_rating === "spotless").length;
  const spotlessRate =
    records.length > 0
      ? Math.round((spotless / records.length) * 1000) / 10
      : null;

  const clean = records.filter((r) => r.cleanliness_rating === "clean").length;
  const cleanRate =
    records.length > 0
      ? Math.round((clean / records.length) * 1000) / 10
      : null;

  const unacceptable = records.filter((r) => r.cleanliness_rating === "unacceptable").length;

  const veryHomely = records.filter((r) => r.homeliness_rating === "very_homely").length;
  const homelyRate =
    records.length > 0
      ? Math.round((veryHomely / records.length) * 1000) / 10
      : null;

  const institutional = records.filter((r) => r.homeliness_rating === "institutional").length;

  const allClear = records.filter((r) => r.safety_check === "all_clear").length;
  const allClearRate =
    records.length > 0
      ? Math.round((allClear / records.length) * 1000) / 10
      : null;

  const immediateRisk = records.filter((r) => r.safety_check === "immediate_risk").length;
  const sigHazard = records.filter((r) => r.safety_check === "significant_hazard").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof CommunalAreaRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const now = new Date();
  const auditOverdue = records.filter((r) => {
    if (!r.next_audit_date) return false;
    return new Date(r.next_audit_date) < now;
  }).length;

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.area_type] = (byArea[r.area_type] ?? 0) + 1;

  const byCleanliness: Record<string, number> = {};
  for (const r of records) byCleanliness[r.cleanliness_rating] = (byCleanliness[r.cleanliness_rating] ?? 0) + 1;

  const byHomeliness: Record<string, number> = {};
  for (const r of records) byHomeliness[r.homeliness_rating] = (byHomeliness[r.homeliness_rating] ?? 0) + 1;

  const bySafety: Record<string, number> = {};
  for (const r of records) bySafety[r.safety_check] = (bySafety[r.safety_check] ?? 0) + 1;

  return {
    total_audits: records.length,
    spotless_rate: spotlessRate,
    clean_rate: cleanRate,
    unacceptable_count: unacceptable,
    very_homely_rate: homelyRate,
    institutional_count: institutional,
    all_clear_rate: allClearRate,
    immediate_risk_count: immediateRisk,
    significant_hazard_count: sigHazard,
    furniture_good_rate: boolRate("furniture_good_condition"),
    decoration_fresh_rate: boolRate("decoration_fresh"),
    temperature_comfortable_rate: boolRate("temperature_comfortable"),
    lighting_adequate_rate: boolRate("lighting_adequate"),
    accessible_rate: boolRate("accessible"),
    child_artwork_rate: boolRate("child_artwork_displayed"),
    age_appropriate_rate: boolRate("age_appropriate_resources"),
    hazards_removed_rate: boolRate("hazards_removed"),
    fire_exits_clear_rate: boolRate("fire_exits_clear"),
    children_consulted_rate: boolRate("children_consulted"),
    audit_overdue_count: auditOverdue,
    by_area_type: byArea,
    by_cleanliness_rating: byCleanliness,
    by_homeliness_rating: byHomeliness,
    by_safety_check: bySafety,
  };
}

export function identifyCommunalAreaAlerts(
  records: CommunalAreaRecord[],
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

  // Immediate safety risk
  for (const r of records) {
    if (r.safety_check === "immediate_risk") {
      alerts.push({
        type: "immediate_risk",
        severity: "critical",
        message: `Immediate safety risk in ${r.area_type.replace(/_/g, " ")} on ${r.audit_date} — restrict access until resolved`,
        id: r.id,
      });
    }
  }

  // Institutional feel
  for (const r of records) {
    if (r.homeliness_rating === "institutional") {
      alerts.push({
        type: "institutional",
        severity: "high",
        message: `${r.area_type.replace(/_/g, " ")} rated as institutional on ${r.audit_date} — make more homely`,
        id: r.id,
      });
    }
  }

  // Unacceptable cleanliness
  const unacceptable = records.filter((r) => r.cleanliness_rating === "unacceptable").length;
  if (unacceptable >= 1) {
    alerts.push({
      type: "unacceptable_cleanliness",
      severity: "high",
      message: `${unacceptable} ${unacceptable === 1 ? "area has" : "areas have"} unacceptable cleanliness — deep clean required`,
      id: "unacceptable_cleanliness",
    });
  }

  // Fire exits not clear
  const exitBlocked = records.filter((r) => !r.fire_exits_clear).length;
  if (exitBlocked >= 1) {
    alerts.push({
      type: "fire_exits_blocked",
      severity: "high",
      message: `${exitBlocked} ${exitBlocked === 1 ? "area has" : "areas have"} blocked fire exits — clear immediately`,
      id: "fire_exits_blocked",
    });
  }

  // Audit overdue
  const now = new Date();
  const auditOverdue = records.filter((r) => {
    if (!r.next_audit_date) return false;
    return new Date(r.next_audit_date) < now;
  }).length;
  if (auditOverdue >= 1) {
    alerts.push({
      type: "audit_overdue",
      severity: "medium",
      message: `${auditOverdue} communal area ${auditOverdue === 1 ? "audit is" : "audits are"} overdue — schedule promptly`,
      id: "audit_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    areaType?: AreaType;
    cleanlinessRating?: CleanlinessRating;
    safetyCheck?: SafetyCheck;
    limit?: number;
  },
): Promise<ServiceResult<CommunalAreaRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_communal_area_audits") as SB).select("*").eq("home_id", homeId);
  if (filters?.areaType) q = q.eq("area_type", filters.areaType);
  if (filters?.cleanlinessRating) q = q.eq("cleanliness_rating", filters.cleanlinessRating);
  if (filters?.safetyCheck) q = q.eq("safety_check", filters.safetyCheck);
  q = q.order("audit_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    areaType: AreaType;
    auditDate: string;
    cleanlinessRating: CleanlinessRating;
    homelinessRating: HomelinessRating;
    safetyCheck: SafetyCheck;
    furnitureGoodCondition: boolean;
    decorationFresh: boolean;
    temperatureComfortable: boolean;
    lightingAdequate: boolean;
    ventilationAdequate: boolean;
    accessible: boolean;
    childArtworkDisplayed: boolean;
    ageAppropriateResources: boolean;
    hazardsRemoved: boolean;
    fireExitsClear: boolean;
    childrenConsulted: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    auditedBy: string;
    nextAuditDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<CommunalAreaRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_communal_area_audits") as SB)
    .insert({
      home_id: input.homeId,
      area_type: input.areaType,
      audit_date: input.auditDate,
      cleanliness_rating: input.cleanlinessRating,
      homeliness_rating: input.homelinessRating,
      safety_check: input.safetyCheck,
      furniture_good_condition: input.furnitureGoodCondition,
      decoration_fresh: input.decorationFresh,
      temperature_comfortable: input.temperatureComfortable,
      lighting_adequate: input.lightingAdequate,
      ventilation_adequate: input.ventilationAdequate,
      accessible: input.accessible,
      child_artwork_displayed: input.childArtworkDisplayed,
      age_appropriate_resources: input.ageAppropriateResources,
      hazards_removed: input.hazardsRemoved,
      fire_exits_clear: input.fireExitsClear,
      children_consulted: input.childrenConsulted,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      audited_by: input.auditedBy,
      next_audit_date: input.nextAuditDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<CommunalAreaRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_communal_area_audits") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeCommunalAreaMetrics,
  identifyCommunalAreaAlerts,
};
