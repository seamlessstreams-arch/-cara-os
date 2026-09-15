// ══════════════════════════════════════════════════════════════════════════════
// CARA — BEDROOM AUDIT SERVICE
// Tracks bedroom standards, personalisation, safety checks,
// furniture condition, and children's living space quality.
// CHR 2015 Reg 36 (fitness of premises — bedroom standards),
// Reg 6 (quality of care — living environment),
// Reg 10 (children's views — room personalisation).
//
// Covers: bedroom inspections, furniture condition, personalisation,
// safety hazards, privacy checks, and comfort assessments.
//
// SCCIF: Overall Experiences — "Children have personalised bedrooms."
// "Bedrooms are safe, comfortable, and well-maintained."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AuditType =
  | "routine_inspection"
  | "move_in_check"
  | "move_out_check"
  | "safety_check"
  | "personalisation_review"
  | "furniture_check"
  | "deep_clean_check"
  | "complaint_follow_up"
  | "other";

export type RoomCondition =
  | "excellent"
  | "good"
  | "satisfactory"
  | "poor"
  | "unacceptable";

export type PersonalisationLevel =
  | "highly_personalised"
  | "some_personalisation"
  | "minimal_personalisation"
  | "not_personalised"
  | "not_assessed";

export type SafetyRating =
  | "safe"
  | "minor_concern"
  | "significant_concern"
  | "unsafe"
  | "not_assessed";

export interface BedroomAuditRecord {
  id: string;
  home_id: string;
  audit_type: AuditType;
  audit_date: string;
  room_name: string;
  child_name: string | null;
  room_condition: RoomCondition;
  personalisation_level: PersonalisationLevel;
  safety_rating: SafetyRating;
  furniture_adequate: boolean;
  furniture_good_condition: boolean;
  bedding_clean: boolean;
  window_restrictors_fitted: boolean;
  lock_working: boolean;
  lighting_adequate: boolean;
  heating_adequate: boolean;
  ventilation_adequate: boolean;
  decoration_acceptable: boolean;
  child_consulted: boolean;
  privacy_respected: boolean;
  issues_found: string[];
  actions_taken: string[];
  audited_by: string;
  next_audit_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const AUDIT_TYPES: { type: AuditType; label: string }[] = [
  { type: "routine_inspection", label: "Routine Inspection" },
  { type: "move_in_check", label: "Move-In Check" },
  { type: "move_out_check", label: "Move-Out Check" },
  { type: "safety_check", label: "Safety Check" },
  { type: "personalisation_review", label: "Personalisation Review" },
  { type: "furniture_check", label: "Furniture Check" },
  { type: "deep_clean_check", label: "Deep Clean Check" },
  { type: "complaint_follow_up", label: "Complaint Follow-Up" },
  { type: "other", label: "Other" },
];

export const ROOM_CONDITIONS: { condition: RoomCondition; label: string }[] = [
  { condition: "excellent", label: "Excellent" },
  { condition: "good", label: "Good" },
  { condition: "satisfactory", label: "Satisfactory" },
  { condition: "poor", label: "Poor" },
  { condition: "unacceptable", label: "Unacceptable" },
];

export const PERSONALISATION_LEVELS: { level: PersonalisationLevel; label: string }[] = [
  { level: "highly_personalised", label: "Highly Personalised" },
  { level: "some_personalisation", label: "Some Personalisation" },
  { level: "minimal_personalisation", label: "Minimal Personalisation" },
  { level: "not_personalised", label: "Not Personalised" },
  { level: "not_assessed", label: "Not Assessed" },
];

export const SAFETY_RATINGS: { rating: SafetyRating; label: string }[] = [
  { rating: "safe", label: "Safe" },
  { rating: "minor_concern", label: "Minor Concern" },
  { rating: "significant_concern", label: "Significant Concern" },
  { rating: "unsafe", label: "Unsafe" },
  { rating: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeBedroomAuditMetrics(
  records: BedroomAuditRecord[],
): {
  total_audits: number;
  routine_inspection_count: number;
  safety_check_count: number;
  excellent_condition_rate: number | null;
  poor_condition_count: number;
  unacceptable_condition_count: number;
  highly_personalised_rate: number | null;
  not_personalised_count: number;
  safe_rating_rate: number | null;
  unsafe_count: number;
  significant_concern_count: number;
  furniture_adequate_rate: number | null;
  furniture_good_condition_rate: number | null;
  bedding_clean_rate: number | null;
  window_restrictors_rate: number | null;
  lock_working_rate: number | null;
  lighting_adequate_rate: number | null;
  heating_adequate_rate: number | null;
  ventilation_adequate_rate: number | null;
  decoration_acceptable_rate: number | null;
  child_consulted_rate: number | null;
  privacy_respected_rate: number | null;
  audit_overdue_count: number;
  by_audit_type: Record<string, number>;
  by_room_condition: Record<string, number>;
  by_personalisation_level: Record<string, number>;
  by_safety_rating: Record<string, number>;
} {
  const routine = records.filter((r) => r.audit_type === "routine_inspection").length;
  const safety = records.filter((r) => r.audit_type === "safety_check").length;

  const excellent = records.filter((r) => r.room_condition === "excellent").length;
  const excellentRate =
    records.length > 0
      ? Math.round((excellent / records.length) * 1000) / 10
      : null;

  const poor = records.filter((r) => r.room_condition === "poor").length;
  const unacceptable = records.filter((r) => r.room_condition === "unacceptable").length;

  const highlyPers = records.filter((r) => r.personalisation_level === "highly_personalised").length;
  const highlyPersRate =
    records.length > 0
      ? Math.round((highlyPers / records.length) * 1000) / 10
      : null;

  const notPers = records.filter((r) => r.personalisation_level === "not_personalised").length;

  const safeRating = records.filter((r) => r.safety_rating === "safe").length;
  const safeRate =
    records.length > 0
      ? Math.round((safeRating / records.length) * 1000) / 10
      : null;

  const unsafe = records.filter((r) => r.safety_rating === "unsafe").length;
  const sigConcern = records.filter((r) => r.safety_rating === "significant_concern").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof BedroomAuditRecord) => {
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

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.audit_type] = (byType[r.audit_type] ?? 0) + 1;

  const byCondition: Record<string, number> = {};
  for (const r of records) byCondition[r.room_condition] = (byCondition[r.room_condition] ?? 0) + 1;

  const byPers: Record<string, number> = {};
  for (const r of records) byPers[r.personalisation_level] = (byPers[r.personalisation_level] ?? 0) + 1;

  const bySafety: Record<string, number> = {};
  for (const r of records) bySafety[r.safety_rating] = (bySafety[r.safety_rating] ?? 0) + 1;

  return {
    total_audits: records.length,
    routine_inspection_count: routine,
    safety_check_count: safety,
    excellent_condition_rate: excellentRate,
    poor_condition_count: poor,
    unacceptable_condition_count: unacceptable,
    highly_personalised_rate: highlyPersRate,
    not_personalised_count: notPers,
    safe_rating_rate: safeRate,
    unsafe_count: unsafe,
    significant_concern_count: sigConcern,
    furniture_adequate_rate: boolRate("furniture_adequate"),
    furniture_good_condition_rate: boolRate("furniture_good_condition"),
    bedding_clean_rate: boolRate("bedding_clean"),
    window_restrictors_rate: boolRate("window_restrictors_fitted"),
    lock_working_rate: boolRate("lock_working"),
    lighting_adequate_rate: boolRate("lighting_adequate"),
    heating_adequate_rate: boolRate("heating_adequate"),
    ventilation_adequate_rate: boolRate("ventilation_adequate"),
    decoration_acceptable_rate: boolRate("decoration_acceptable"),
    child_consulted_rate: boolRate("child_consulted"),
    privacy_respected_rate: boolRate("privacy_respected"),
    audit_overdue_count: auditOverdue,
    by_audit_type: byType,
    by_room_condition: byCondition,
    by_personalisation_level: byPers,
    by_safety_rating: bySafety,
  };
}

export function identifyBedroomAuditAlerts(
  records: BedroomAuditRecord[],
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

  // Unsafe bedroom
  for (const r of records) {
    if (r.safety_rating === "unsafe") {
      alerts.push({
        type: "unsafe_bedroom",
        severity: "critical",
        message: `Unsafe bedroom: ${r.room_name} on ${r.audit_date} — do not use until hazards resolved`,
        id: r.id,
      });
    }
  }

  // Unacceptable condition
  for (const r of records) {
    if (r.room_condition === "unacceptable") {
      alerts.push({
        type: "unacceptable_condition",
        severity: "high",
        message: `Unacceptable condition in ${r.room_name} on ${r.audit_date} — immediate remediation needed`,
        id: r.id,
      });
    }
  }

  // Not personalised
  const notPers = records.filter((r) => r.personalisation_level === "not_personalised").length;
  if (notPers >= 1) {
    alerts.push({
      type: "not_personalised",
      severity: "high",
      message: `${notPers} ${notPers === 1 ? "bedroom is" : "bedrooms are"} not personalised — children must feel at home`,
      id: "not_personalised",
    });
  }

  // Child not consulted
  const notConsulted = records.filter((r) => !r.child_consulted && r.child_name !== null).length;
  if (notConsulted >= 2) {
    alerts.push({
      type: "child_not_consulted",
      severity: "medium",
      message: `${notConsulted} audits without child consultation — ensure children's views are captured`,
      id: "child_not_consulted",
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
      message: `${auditOverdue} bedroom ${auditOverdue === 1 ? "audit is" : "audits are"} overdue — schedule promptly`,
      id: "audit_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    auditType?: AuditType;
    roomCondition?: RoomCondition;
    safetyRating?: SafetyRating;
    limit?: number;
  },
): Promise<ServiceResult<BedroomAuditRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_bedroom_audits") as SB).select("*").eq("home_id", homeId);
  if (filters?.auditType) q = q.eq("audit_type", filters.auditType);
  if (filters?.roomCondition) q = q.eq("room_condition", filters.roomCondition);
  if (filters?.safetyRating) q = q.eq("safety_rating", filters.safetyRating);
  q = q.order("audit_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    auditType: AuditType;
    auditDate: string;
    roomName: string;
    childName?: string;
    roomCondition: RoomCondition;
    personalisationLevel: PersonalisationLevel;
    safetyRating: SafetyRating;
    furnitureAdequate: boolean;
    furnitureGoodCondition: boolean;
    beddingClean: boolean;
    windowRestrictorsFitted: boolean;
    lockWorking: boolean;
    lightingAdequate: boolean;
    heatingAdequate: boolean;
    ventilationAdequate: boolean;
    decorationAcceptable: boolean;
    childConsulted: boolean;
    privacyRespected: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    auditedBy: string;
    nextAuditDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<BedroomAuditRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_bedroom_audits") as SB)
    .insert({
      home_id: input.homeId,
      audit_type: input.auditType,
      audit_date: input.auditDate,
      room_name: input.roomName,
      child_name: input.childName ?? null,
      room_condition: input.roomCondition,
      personalisation_level: input.personalisationLevel,
      safety_rating: input.safetyRating,
      furniture_adequate: input.furnitureAdequate,
      furniture_good_condition: input.furnitureGoodCondition,
      bedding_clean: input.beddingClean,
      window_restrictors_fitted: input.windowRestrictorsFitted,
      lock_working: input.lockWorking,
      lighting_adequate: input.lightingAdequate,
      heating_adequate: input.heatingAdequate,
      ventilation_adequate: input.ventilationAdequate,
      decoration_acceptable: input.decorationAcceptable,
      child_consulted: input.childConsulted,
      privacy_respected: input.privacyRespected,
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
): Promise<ServiceResult<BedroomAuditRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_bedroom_audits") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeBedroomAuditMetrics,
  identifyBedroomAuditAlerts,
};
