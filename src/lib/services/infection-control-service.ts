// ══════════════════════════════════════════════════════════════════════════════
// CARA — INFECTION CONTROL SERVICE
// Tracks infection prevention, hand hygiene audits, cleaning schedules,
// PPE compliance, outbreak management, and immunisation records.
// CHR 2015 Reg 25 (health and safety — infection prevention),
// Reg 12 (protection — preventing harm from infection),
// Reg 36 (premises — cleanliness).
//
// Covers: hand hygiene audits, cleaning schedules, PPE checks,
// outbreak management, deep cleans, and immunisation compliance.
//
// SCCIF: Helped & Protected — "Infection control measures protect children."
// "The home is clean and hygienic."
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

export type InfectionEventType =
  | "hand_hygiene_audit"
  | "cleaning_schedule_check"
  | "ppe_compliance_check"
  | "outbreak_management"
  | "deep_clean"
  | "immunisation_check"
  | "illness_report"
  | "infection_incident"
  | "laundry_hygiene"
  | "other";

export type HygieneStandard =
  | "excellent"
  | "good"
  | "acceptable"
  | "poor"
  | "not_assessed";

export type OutbreakStatus =
  | "no_outbreak"
  | "suspected"
  | "confirmed"
  | "contained"
  | "resolved";

export type PpeCompliance =
  | "fully_compliant"
  | "partially_compliant"
  | "non_compliant"
  | "not_applicable"
  | "not_checked";

export interface InfectionControlRecord {
  id: string;
  home_id: string;
  event_type: InfectionEventType;
  event_date: string;
  hygiene_standard: HygieneStandard;
  outbreak_status: OutbreakStatus;
  ppe_compliance: PpeCompliance;
  hand_washing_observed: boolean;
  sanitiser_available: boolean;
  cleaning_schedule_followed: boolean;
  laundry_procedures_followed: boolean;
  food_hygiene_maintained: boolean;
  children_symptomatic: number;
  staff_symptomatic: number;
  gp_contacted: boolean;
  public_health_notified: boolean;
  isolation_measures_in_place: boolean;
  issues_found: string[];
  actions_taken: string[];
  assessed_by: string;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const INFECTION_EVENT_TYPES: { type: InfectionEventType; label: string }[] = [
  { type: "hand_hygiene_audit", label: "Hand Hygiene Audit" },
  { type: "cleaning_schedule_check", label: "Cleaning Schedule Check" },
  { type: "ppe_compliance_check", label: "PPE Compliance Check" },
  { type: "outbreak_management", label: "Outbreak Management" },
  { type: "deep_clean", label: "Deep Clean" },
  { type: "immunisation_check", label: "Immunisation Check" },
  { type: "illness_report", label: "Illness Report" },
  { type: "infection_incident", label: "Infection Incident" },
  { type: "laundry_hygiene", label: "Laundry Hygiene" },
  { type: "other", label: "Other" },
];

export const HYGIENE_STANDARDS: { standard: HygieneStandard; label: string }[] = [
  { standard: "excellent", label: "Excellent" },
  { standard: "good", label: "Good" },
  { standard: "acceptable", label: "Acceptable" },
  { standard: "poor", label: "Poor" },
  { standard: "not_assessed", label: "Not Assessed" },
];

export const OUTBREAK_STATUSES: { status: OutbreakStatus; label: string }[] = [
  { status: "no_outbreak", label: "No Outbreak" },
  { status: "suspected", label: "Suspected" },
  { status: "confirmed", label: "Confirmed" },
  { status: "contained", label: "Contained" },
  { status: "resolved", label: "Resolved" },
];

export const PPE_COMPLIANCES: { compliance: PpeCompliance; label: string }[] = [
  { compliance: "fully_compliant", label: "Fully Compliant" },
  { compliance: "partially_compliant", label: "Partially Compliant" },
  { compliance: "non_compliant", label: "Non-Compliant" },
  { compliance: "not_applicable", label: "Not Applicable" },
  { compliance: "not_checked", label: "Not Checked" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeInfectionControlMetrics(
  records: InfectionControlRecord[],
): {
  total_records: number;
  hand_hygiene_audit_count: number;
  cleaning_check_count: number;
  outbreak_count: number;
  infection_incident_count: number;
  excellent_hygiene_rate: number | null;
  poor_hygiene_count: number;
  hand_washing_observed_rate: number | null;
  sanitiser_available_rate: number | null;
  cleaning_schedule_followed_rate: number | null;
  laundry_procedures_rate: number | null;
  food_hygiene_rate: number | null;
  ppe_fully_compliant_rate: number | null;
  ppe_non_compliant_count: number;
  total_children_symptomatic: number;
  total_staff_symptomatic: number;
  active_outbreak_count: number;
  review_overdue_count: number;
  by_event_type: Record<string, number>;
  by_hygiene_standard: Record<string, number>;
  by_outbreak_status: Record<string, number>;
  by_ppe_compliance: Record<string, number>;
} {
  const handAudit = records.filter((r) => r.event_type === "hand_hygiene_audit").length;
  const cleanCheck = records.filter((r) => r.event_type === "cleaning_schedule_check").length;
  const outbreak = records.filter((r) => r.event_type === "outbreak_management").length;
  const infectionIncident = records.filter((r) => r.event_type === "infection_incident").length;

  const excellent = records.filter((r) => r.hygiene_standard === "excellent").length;
  const excellentRate =
    records.length > 0
      ? Math.round((excellent / records.length) * 1000) / 10
      : null;

  const poorHygiene = records.filter((r) => r.hygiene_standard === "poor").length;

  const handWash = records.filter((r) => r.hand_washing_observed).length;
  const handWashRate =
    records.length > 0
      ? Math.round((handWash / records.length) * 1000) / 10
      : null;

  const sanitiser = records.filter((r) => r.sanitiser_available).length;
  const sanitiserRate =
    records.length > 0
      ? Math.round((sanitiser / records.length) * 1000) / 10
      : null;

  const cleanFollowed = records.filter((r) => r.cleaning_schedule_followed).length;
  const cleanRate =
    records.length > 0
      ? Math.round((cleanFollowed / records.length) * 1000) / 10
      : null;

  const laundry = records.filter((r) => r.laundry_procedures_followed).length;
  const laundryRate =
    records.length > 0
      ? Math.round((laundry / records.length) * 1000) / 10
      : null;

  const foodHygiene = records.filter((r) => r.food_hygiene_maintained).length;
  const foodRate =
    records.length > 0
      ? Math.round((foodHygiene / records.length) * 1000) / 10
      : null;

  const ppeCompliant = records.filter((r) => r.ppe_compliance === "fully_compliant").length;
  const ppeRate =
    records.length > 0
      ? Math.round((ppeCompliant / records.length) * 1000) / 10
      : null;

  const ppeNonCompliant = records.filter((r) => r.ppe_compliance === "non_compliant").length;

  const totalChildrenSymp = records.reduce((sum, r) => sum + r.children_symptomatic, 0);
  const totalStaffSymp = records.reduce((sum, r) => sum + r.staff_symptomatic, 0);

  const activeOutbreak = records.filter(
    (r) => r.outbreak_status === "suspected" || r.outbreak_status === "confirmed",
  ).length;

  const now = new Date();
  const reviewOverdue = records.filter((r) => {
    if (!r.next_review_date) return false;
    return new Date(r.next_review_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;

  const byHygiene: Record<string, number> = {};
  for (const r of records) byHygiene[r.hygiene_standard] = (byHygiene[r.hygiene_standard] ?? 0) + 1;

  const byOutbreak: Record<string, number> = {};
  for (const r of records) byOutbreak[r.outbreak_status] = (byOutbreak[r.outbreak_status] ?? 0) + 1;

  const byPpe: Record<string, number> = {};
  for (const r of records) byPpe[r.ppe_compliance] = (byPpe[r.ppe_compliance] ?? 0) + 1;

  return {
    total_records: records.length,
    hand_hygiene_audit_count: handAudit,
    cleaning_check_count: cleanCheck,
    outbreak_count: outbreak,
    infection_incident_count: infectionIncident,
    excellent_hygiene_rate: excellentRate,
    poor_hygiene_count: poorHygiene,
    hand_washing_observed_rate: handWashRate,
    sanitiser_available_rate: sanitiserRate,
    cleaning_schedule_followed_rate: cleanRate,
    laundry_procedures_rate: laundryRate,
    food_hygiene_rate: foodRate,
    ppe_fully_compliant_rate: ppeRate,
    ppe_non_compliant_count: ppeNonCompliant,
    total_children_symptomatic: totalChildrenSymp,
    total_staff_symptomatic: totalStaffSymp,
    active_outbreak_count: activeOutbreak,
    review_overdue_count: reviewOverdue,
    by_event_type: byType,
    by_hygiene_standard: byHygiene,
    by_outbreak_status: byOutbreak,
    by_ppe_compliance: byPpe,
  };
}

export function identifyInfectionControlAlerts(
  records: InfectionControlRecord[],
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

  // Active outbreak
  for (const r of records) {
    if (r.outbreak_status === "confirmed") {
      alerts.push({
        type: "confirmed_outbreak",
        severity: "critical",
        message: `Confirmed outbreak on ${r.event_date} — ${r.children_symptomatic} children and ${r.staff_symptomatic} staff symptomatic`,
        id: r.id,
      });
    }
  }

  // Poor hygiene
  for (const r of records) {
    if (r.hygiene_standard === "poor") {
      alerts.push({
        type: "poor_hygiene",
        severity: "high",
        message: `Poor hygiene standard found on ${r.event_date} — immediate deep clean and review required`,
        id: r.id,
      });
    }
  }

  // PPE non-compliant
  const ppeNonCompliant = records.filter((r) => r.ppe_compliance === "non_compliant").length;
  if (ppeNonCompliant >= 1) {
    alerts.push({
      type: "ppe_non_compliant",
      severity: "high",
      message: `${ppeNonCompliant} PPE non-compliance ${ppeNonCompliant === 1 ? "finding" : "findings"} — retrain staff and provide equipment`,
      id: "ppe_non_compliant",
    });
  }

  // Cleaning schedule not followed
  const cleanNotFollowed = records.filter((r) => !r.cleaning_schedule_followed).length;
  if (cleanNotFollowed >= 3) {
    alerts.push({
      type: "cleaning_not_followed",
      severity: "medium",
      message: `${cleanNotFollowed} records where cleaning schedule not followed — review compliance`,
      id: "cleaning_not_followed",
    });
  }

  // Review overdue
  const now = new Date();
  const reviewOverdue = records.filter((r) => {
    if (!r.next_review_date) return false;
    return new Date(r.next_review_date) < now;
  }).length;
  if (reviewOverdue >= 1) {
    alerts.push({
      type: "review_overdue",
      severity: "medium",
      message: `${reviewOverdue} infection control ${reviewOverdue === 1 ? "review is" : "reviews are"} overdue — schedule promptly`,
      id: "review_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    eventType?: InfectionEventType;
    hygieneStandard?: HygieneStandard;
    outbreakStatus?: OutbreakStatus;
    limit?: number;
  },
): Promise<ServiceResult<InfectionControlRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_infection_control") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.hygieneStandard) q = q.eq("hygiene_standard", filters.hygieneStandard);
  if (filters?.outbreakStatus) q = q.eq("outbreak_status", filters.outbreakStatus);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    eventType: InfectionEventType;
    eventDate: string;
    hygieneStandard: HygieneStandard;
    outbreakStatus: OutbreakStatus;
    ppeCompliance: PpeCompliance;
    handWashingObserved: boolean;
    sanitiserAvailable: boolean;
    cleaningScheduleFollowed: boolean;
    laundryProceduresFollowed: boolean;
    foodHygieneMaintained: boolean;
    childrenSymptomatic: number;
    staffSymptomatic: number;
    gpContacted: boolean;
    publicHealthNotified: boolean;
    isolationMeasuresInPlace: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    assessedBy: string;
    nextReviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<InfectionControlRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_infection_control") as SB)
    .insert({
      home_id: input.homeId,
      event_type: input.eventType,
      event_date: input.eventDate,
      hygiene_standard: input.hygieneStandard,
      outbreak_status: input.outbreakStatus,
      ppe_compliance: input.ppeCompliance,
      hand_washing_observed: input.handWashingObserved,
      sanitiser_available: input.sanitiserAvailable,
      cleaning_schedule_followed: input.cleaningScheduleFollowed,
      laundry_procedures_followed: input.laundryProceduresFollowed,
      food_hygiene_maintained: input.foodHygieneMaintained,
      children_symptomatic: input.childrenSymptomatic,
      staff_symptomatic: input.staffSymptomatic,
      gp_contacted: input.gpContacted,
      public_health_notified: input.publicHealthNotified,
      isolation_measures_in_place: input.isolationMeasuresInPlace,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      assessed_by: input.assessedBy,
      next_review_date: input.nextReviewDate ?? null,
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
): Promise<ServiceResult<InfectionControlRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_infection_control") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeInfectionControlMetrics,
  identifyInfectionControlAlerts,
};
