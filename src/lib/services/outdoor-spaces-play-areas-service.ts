// ══════════════════════════════════════════════════════════════════════════════
// CARA — OUTDOOR SPACES PLAY AREAS SERVICE
// Tracks garden maintenance, play area safety, outdoor equipment,
// accessibility, and environmental quality of outdoor spaces.
// CHR 2015 Reg 27(4)(b) (outdoor spaces maintained),
// Reg 9(2)(a) (enjoyment — outdoor play and activities).
//
// Covers: space type, condition rating, safety assessment,
// accessibility level, and usage frequency.
//
// SCCIF: Leadership — "Outdoor spaces are safe and well-maintained."
// "Children have access to quality outdoor environments."
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

export type SpaceType =
  | "garden"
  | "play_area"
  | "sports_court"
  | "sensory_garden"
  | "allotment"
  | "bike_storage"
  | "seating_area"
  | "bbq_area"
  | "nature_area"
  | "other";

export type ConditionRating =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "unsafe";

export type SafetyAssessment =
  | "fully_safe"
  | "minor_issues"
  | "moderate_issues"
  | "significant_hazards"
  | "closed";

export type AccessibilityLevel =
  | "fully_accessible"
  | "mostly_accessible"
  | "partially_accessible"
  | "limited_access"
  | "not_accessible";

export interface OutdoorSpacesPlayAreasRecord {
  id: string;
  home_id: string;
  space_type: SpaceType;
  condition_rating: ConditionRating;
  safety_assessment: SafetyAssessment;
  accessibility_level: AccessibilityLevel;
  inspection_date: string;
  child_name: string;
  child_id: string | null;
  inspected_by: string;
  equipment_checked: boolean;
  surface_safe: boolean;
  fencing_secure: boolean;
  lighting_adequate: boolean;
  clean_tidy: boolean;
  age_appropriate: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  maintenance_requested: boolean;
  risk_assessed: boolean;
  children_consulted: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SPACE_TYPES: { type: SpaceType; label: string }[] = [
  { type: "garden", label: "Garden" },
  { type: "play_area", label: "Play Area" },
  { type: "sports_court", label: "Sports Court" },
  { type: "sensory_garden", label: "Sensory Garden" },
  { type: "allotment", label: "Allotment" },
  { type: "bike_storage", label: "Bike Storage" },
  { type: "seating_area", label: "Seating Area" },
  { type: "bbq_area", label: "BBQ Area" },
  { type: "nature_area", label: "Nature Area" },
  { type: "other", label: "Other" },
];

export const CONDITION_RATINGS: { rating: ConditionRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "fair", label: "Fair" },
  { rating: "poor", label: "Poor" },
  { rating: "unsafe", label: "Unsafe" },
];

export const SAFETY_ASSESSMENTS: { assessment: SafetyAssessment; label: string }[] = [
  { assessment: "fully_safe", label: "Fully Safe" },
  { assessment: "minor_issues", label: "Minor Issues" },
  { assessment: "moderate_issues", label: "Moderate Issues" },
  { assessment: "significant_hazards", label: "Significant Hazards" },
  { assessment: "closed", label: "Closed" },
];

export const ACCESSIBILITY_LEVELS: { level: AccessibilityLevel; label: string }[] = [
  { level: "fully_accessible", label: "Fully Accessible" },
  { level: "mostly_accessible", label: "Mostly Accessible" },
  { level: "partially_accessible", label: "Partially Accessible" },
  { level: "limited_access", label: "Limited Access" },
  { level: "not_accessible", label: "Not Accessible" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeOutdoorSpacesMetrics(
  records: OutdoorSpacesPlayAreasRecord[],
): {
  total_inspections: number;
  unsafe_count: number;
  hazard_count: number;
  poor_condition_count: number;
  not_accessible_count: number;
  equipment_checked_rate: number | null;
  surface_safe_rate: number | null;
  fencing_secure_rate: number | null;
  lighting_rate: number | null;
  clean_tidy_rate: number | null;
  age_appropriate_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  maintenance_rate: number | null;
  risk_assessed_rate: number | null;
  children_consulted_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_space_type: Record<string, number>;
  by_condition_rating: Record<string, number>;
  by_safety_assessment: Record<string, number>;
  by_accessibility_level: Record<string, number>;
} {
  const unsafe = records.filter((r) => r.condition_rating === "unsafe").length;
  const hazard = records.filter((r) => r.safety_assessment === "significant_hazards" || r.safety_assessment === "closed").length;
  const poorCondition = records.filter((r) => r.condition_rating === "poor" || r.condition_rating === "unsafe").length;
  const notAccessible = records.filter((r) => r.accessibility_level === "not_accessible").length;

  const boolRate = (field: keyof OutdoorSpacesPlayAreasRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.space_type] = (byType[r.space_type] ?? 0) + 1;

  const byCondition: Record<string, number> = {};
  for (const r of records) byCondition[r.condition_rating] = (byCondition[r.condition_rating] ?? 0) + 1;

  const bySafety: Record<string, number> = {};
  for (const r of records) bySafety[r.safety_assessment] = (bySafety[r.safety_assessment] ?? 0) + 1;

  const byAccess: Record<string, number> = {};
  for (const r of records) byAccess[r.accessibility_level] = (byAccess[r.accessibility_level] ?? 0) + 1;

  return {
    total_inspections: records.length,
    unsafe_count: unsafe,
    hazard_count: hazard,
    poor_condition_count: poorCondition,
    not_accessible_count: notAccessible,
    equipment_checked_rate: boolRate("equipment_checked"),
    surface_safe_rate: boolRate("surface_safe"),
    fencing_secure_rate: boolRate("fencing_secure"),
    lighting_rate: boolRate("lighting_adequate"),
    clean_tidy_rate: boolRate("clean_tidy"),
    age_appropriate_rate: boolRate("age_appropriate"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    maintenance_rate: boolRate("maintenance_requested"),
    risk_assessed_rate: boolRate("risk_assessed"),
    children_consulted_rate: boolRate("children_consulted"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_space_type: byType,
    by_condition_rating: byCondition,
    by_safety_assessment: bySafety,
    by_accessibility_level: byAccess,
  };
}

export function identifyOutdoorSpacesAlerts(
  records: OutdoorSpacesPlayAreasRecord[],
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

  // Unsafe with significant hazards — per-record critical
  for (const r of records) {
    if (r.condition_rating === "unsafe" && (r.safety_assessment === "significant_hazards" || r.safety_assessment === "closed")) {
      alerts.push({
        type: "unsafe_hazard",
        severity: "critical",
        message: `${r.space_type.replace(/_/g, " ")} is unsafe with ${r.safety_assessment.replace(/_/g, " ")} — close area and arrange immediate repair`,
        id: r.id,
      });
    }
  }

  // Fencing not secure
  const noFencing = records.filter((r) => !r.fencing_secure).length;
  if (noFencing >= 1) {
    alerts.push({
      type: "fencing_not_secure",
      severity: "high",
      message: `${noFencing} ${noFencing === 1 ? "inspection has" : "inspections have"} fencing not secure — child safety boundary compromised`,
      id: "fencing_not_secure",
    });
  }

  // No risk assessment
  const noRisk = records.filter((r) => !r.risk_assessed).length;
  if (noRisk >= 1) {
    alerts.push({
      type: "no_risk_assessment",
      severity: "high",
      message: `${noRisk} ${noRisk === 1 ? "space has" : "spaces have"} no risk assessment — all outdoor areas must be assessed`,
      id: "no_risk_assessment",
    });
  }

  // Equipment not checked
  const noEquipment = records.filter((r) => !r.equipment_checked).length;
  if (noEquipment >= 2) {
    alerts.push({
      type: "equipment_not_checked",
      severity: "medium",
      message: `${noEquipment} inspections without equipment checked — regular checks essential`,
      id: "equipment_not_checked",
    });
  }

  // Children not consulted
  const noConsulted = records.filter((r) => !r.children_consulted).length;
  if (noConsulted >= 2) {
    alerts.push({
      type: "children_not_consulted",
      severity: "medium",
      message: `${noConsulted} inspections without children consulted — seek children's views on outdoor spaces`,
      id: "children_not_consulted",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    spaceType?: SpaceType; conditionRating?: ConditionRating;
    safetyAssessment?: SafetyAssessment; accessibilityLevel?: AccessibilityLevel; limit?: number;
  },
): Promise<ServiceResult<OutdoorSpacesPlayAreasRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_outdoor_spaces_play_areas") as SB).select("*").eq("home_id", homeId);
  if (filters?.spaceType) q = q.eq("space_type", filters.spaceType);
  if (filters?.conditionRating) q = q.eq("condition_rating", filters.conditionRating);
  if (filters?.safetyAssessment) q = q.eq("safety_assessment", filters.safetyAssessment);
  if (filters?.accessibilityLevel) q = q.eq("accessibility_level", filters.accessibilityLevel);
  q = q.order("inspection_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as OutdoorSpacesPlayAreasRecord[] };
}

export async function createRecord(payload: {
  homeId: string; spaceType: SpaceType; conditionRating: ConditionRating;
  safetyAssessment: SafetyAssessment; accessibilityLevel: AccessibilityLevel;
  inspectionDate: string; childName: string; childId?: string | null; inspectedBy: string;
  equipmentChecked?: boolean; surfaceSafe?: boolean; fencingSecure?: boolean; lightingAdequate?: boolean;
  cleanTidy?: boolean; ageAppropriate?: boolean; carePlanReflects?: boolean; socialWorkerInformed?: boolean;
  maintenanceRequested?: boolean; riskAssessed?: boolean; childrenConsulted?: boolean; recordedPromptly?: boolean;
  issuesFound?: string[]; actionsTaken?: string[]; nextReviewDate?: string | null; notes?: string | null;
}): Promise<ServiceResult<OutdoorSpacesPlayAreasRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_outdoor_spaces_play_areas") as SB)
    .insert({
      home_id: payload.homeId, space_type: payload.spaceType, condition_rating: payload.conditionRating,
      safety_assessment: payload.safetyAssessment, accessibility_level: payload.accessibilityLevel,
      inspection_date: payload.inspectionDate, child_name: payload.childName, child_id: payload.childId ?? null,
      inspected_by: payload.inspectedBy, equipment_checked: payload.equipmentChecked ?? true,
      surface_safe: payload.surfaceSafe ?? true, fencing_secure: payload.fencingSecure ?? true,
      lighting_adequate: payload.lightingAdequate ?? true, clean_tidy: payload.cleanTidy ?? true,
      age_appropriate: payload.ageAppropriate ?? true, care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true, maintenance_requested: payload.maintenanceRequested ?? true,
      risk_assessed: payload.riskAssessed ?? true, children_consulted: payload.childrenConsulted ?? true,
      recorded_promptly: payload.recordedPromptly ?? true, issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [], next_review_date: payload.nextReviewDate ?? null, notes: payload.notes ?? null,
    }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as OutdoorSpacesPlayAreasRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    spaceType: SpaceType; conditionRating: ConditionRating; safetyAssessment: SafetyAssessment;
    accessibilityLevel: AccessibilityLevel; inspectionDate: string; childName: string; childId: string | null;
    inspectedBy: string; equipmentChecked: boolean; surfaceSafe: boolean; fencingSecure: boolean;
    lightingAdequate: boolean; cleanTidy: boolean; ageAppropriate: boolean; carePlanReflects: boolean;
    socialWorkerInformed: boolean; maintenanceRequested: boolean; riskAssessed: boolean;
    childrenConsulted: boolean; recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
    nextReviewDate: string | null; notes: string | null;
  }>,
): Promise<ServiceResult<OutdoorSpacesPlayAreasRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.spaceType !== undefined) mapped.space_type = updates.spaceType;
  if (updates.conditionRating !== undefined) mapped.condition_rating = updates.conditionRating;
  if (updates.safetyAssessment !== undefined) mapped.safety_assessment = updates.safetyAssessment;
  if (updates.accessibilityLevel !== undefined) mapped.accessibility_level = updates.accessibilityLevel;
  if (updates.inspectionDate !== undefined) mapped.inspection_date = updates.inspectionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.inspectedBy !== undefined) mapped.inspected_by = updates.inspectedBy;
  if (updates.equipmentChecked !== undefined) mapped.equipment_checked = updates.equipmentChecked;
  if (updates.surfaceSafe !== undefined) mapped.surface_safe = updates.surfaceSafe;
  if (updates.fencingSecure !== undefined) mapped.fencing_secure = updates.fencingSecure;
  if (updates.lightingAdequate !== undefined) mapped.lighting_adequate = updates.lightingAdequate;
  if (updates.cleanTidy !== undefined) mapped.clean_tidy = updates.cleanTidy;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.maintenanceRequested !== undefined) mapped.maintenance_requested = updates.maintenanceRequested;
  if (updates.riskAssessed !== undefined) mapped.risk_assessed = updates.riskAssessed;
  if (updates.childrenConsulted !== undefined) mapped.children_consulted = updates.childrenConsulted;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_outdoor_spaces_play_areas") as SB)
    .update(mapped).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as OutdoorSpacesPlayAreasRecord };
}

export const _testing = { computeOutdoorSpacesMetrics, identifyOutdoorSpacesAlerts };
