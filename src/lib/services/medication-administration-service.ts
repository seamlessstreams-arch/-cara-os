// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION ADMINISTRATION SERVICE
// Tracks medication rounds, MAR charts, PRN administrations,
// controlled drugs, and administration compliance.
// CHR 2015 Reg 23 (health — medication management),
// Reg 6 (quality and purpose of care — health needs).
//
// Covers: scheduled rounds, PRN, controlled drugs, refusals,
// stock checks, and administration error prevention.
//
// SCCIF: Helped & Protected — "Children's medication is managed
// safely and effectively." "Staff are trained in medication
// administration."
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

export type MedicationType =
  | "prescribed_regular"
  | "prescribed_prn"
  | "controlled_drug"
  | "over_the_counter"
  | "homely_remedy"
  | "topical"
  | "inhaler"
  | "epipen"
  | "other";

export type AdministrationRoute =
  | "oral"
  | "topical"
  | "inhaled"
  | "injection"
  | "sublingual"
  | "rectal"
  | "eye_drops"
  | "ear_drops"
  | "nasal"
  | "other";

export type AdministrationOutcome =
  | "administered"
  | "refused"
  | "not_available"
  | "withheld"
  | "self_administered"
  | "not_required"
  | "delayed"
  | "other";

export type WitnessRequired =
  | "yes_witnessed"
  | "yes_not_witnessed"
  | "not_required";

export interface MedicationAdministration {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  medication_name: string;
  medication_type: MedicationType;
  dosage: string;
  administration_route: AdministrationRoute;
  administration_outcome: AdministrationOutcome;
  scheduled_time: string;
  actual_time: string | null;
  administered_by: string;
  witness_status: WitnessRequired;
  witness_name: string | null;
  reason_for_prn: string | null;
  reason_for_refusal: string | null;
  stock_balance: number | null;
  controlled_drug: boolean;
  mar_chart_updated: boolean;
  side_effects_observed: boolean;
  side_effects_details: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MEDICATION_TYPES: { type: MedicationType; label: string }[] = [
  { type: "prescribed_regular", label: "Prescribed Regular" },
  { type: "prescribed_prn", label: "Prescribed PRN" },
  { type: "controlled_drug", label: "Controlled Drug" },
  { type: "over_the_counter", label: "Over the Counter" },
  { type: "homely_remedy", label: "Homely Remedy" },
  { type: "topical", label: "Topical" },
  { type: "inhaler", label: "Inhaler" },
  { type: "epipen", label: "EpiPen" },
  { type: "other", label: "Other" },
];

export const ADMINISTRATION_ROUTES: { route: AdministrationRoute; label: string }[] = [
  { route: "oral", label: "Oral" },
  { route: "topical", label: "Topical" },
  { route: "inhaled", label: "Inhaled" },
  { route: "injection", label: "Injection" },
  { route: "sublingual", label: "Sublingual" },
  { route: "rectal", label: "Rectal" },
  { route: "eye_drops", label: "Eye Drops" },
  { route: "ear_drops", label: "Ear Drops" },
  { route: "nasal", label: "Nasal" },
  { route: "other", label: "Other" },
];

export const ADMINISTRATION_OUTCOMES: { outcome: AdministrationOutcome; label: string }[] = [
  { outcome: "administered", label: "Administered" },
  { outcome: "refused", label: "Refused" },
  { outcome: "not_available", label: "Not Available" },
  { outcome: "withheld", label: "Withheld" },
  { outcome: "self_administered", label: "Self Administered" },
  { outcome: "not_required", label: "Not Required" },
  { outcome: "delayed", label: "Delayed" },
  { outcome: "other", label: "Other" },
];

export const WITNESS_STATUSES: { status: WitnessRequired; label: string }[] = [
  { status: "yes_witnessed", label: "Yes — Witnessed" },
  { status: "yes_not_witnessed", label: "Yes — Not Witnessed" },
  { status: "not_required", label: "Not Required" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeAdministrationMetrics(
  records: MedicationAdministration[],
  totalChildren: number,
): {
  total_administrations: number;
  children_with_medication: number;
  medication_coverage: number;
  administered_count: number;
  refused_count: number;
  withheld_count: number;
  delayed_count: number;
  self_administered_count: number;
  administration_rate: number;
  refusal_rate: number;
  controlled_drug_count: number;
  controlled_drug_witnessed_rate: number;
  mar_chart_updated_rate: number;
  side_effects_count: number;
  side_effects_rate: number;
  prn_count: number;
  by_medication_type: Record<string, number>;
  by_administration_route: Record<string, number>;
  by_administration_outcome: Record<string, number>;
  by_child: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  const administered = records.filter((r) => r.administration_outcome === "administered").length;
  const refused = records.filter((r) => r.administration_outcome === "refused").length;
  const withheld = records.filter((r) => r.administration_outcome === "withheld").length;
  const delayed = records.filter((r) => r.administration_outcome === "delayed").length;
  const selfAdmin = records.filter((r) => r.administration_outcome === "self_administered").length;

  const adminRate =
    records.length > 0
      ? Math.round((administered / records.length) * 1000) / 10
      : 0;

  const refusalRate =
    records.length > 0
      ? Math.round((refused / records.length) * 1000) / 10
      : 0;

  const controlledDrugs = records.filter((r) => r.controlled_drug);
  const controlledWitnessed = controlledDrugs.filter((r) => r.witness_status === "yes_witnessed").length;
  const cdWitnessedRate =
    controlledDrugs.length > 0
      ? Math.round((controlledWitnessed / controlledDrugs.length) * 1000) / 10
      : 0;

  const marUpdated = records.filter((r) => r.mar_chart_updated).length;
  const marRate =
    records.length > 0
      ? Math.round((marUpdated / records.length) * 1000) / 10
      : 0;

  const sideEffects = records.filter((r) => r.side_effects_observed).length;
  const seRate =
    records.length > 0
      ? Math.round((sideEffects / records.length) * 1000) / 10
      : 0;

  const prn = records.filter((r) => r.medication_type === "prescribed_prn").length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.medication_type] = (byType[r.medication_type] ?? 0) + 1;

  const byRoute: Record<string, number> = {};
  for (const r of records) byRoute[r.administration_route] = (byRoute[r.administration_route] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.administration_outcome] = (byOutcome[r.administration_outcome] ?? 0) + 1;

  const byChild: Record<string, number> = {};
  for (const r of records) byChild[r.child_name] = (byChild[r.child_name] ?? 0) + 1;

  return {
    total_administrations: records.length,
    children_with_medication: uniqueChildren,
    medication_coverage: coverage,
    administered_count: administered,
    refused_count: refused,
    withheld_count: withheld,
    delayed_count: delayed,
    self_administered_count: selfAdmin,
    administration_rate: adminRate,
    refusal_rate: refusalRate,
    controlled_drug_count: controlledDrugs.length,
    controlled_drug_witnessed_rate: cdWitnessedRate,
    mar_chart_updated_rate: marRate,
    side_effects_count: sideEffects,
    side_effects_rate: seRate,
    prn_count: prn,
    by_medication_type: byType,
    by_administration_route: byRoute,
    by_administration_outcome: byOutcome,
    by_child: byChild,
  };
}

export function identifyAdministrationAlerts(
  records: MedicationAdministration[],
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

  // Controlled drug not witnessed — fires whenever the CD was actually TAKEN
  // (staff-administered OR self-administered) without the required witness.
  // Outcomes where the drug was NOT given (refused / not_available / withheld /
  // not_required) correctly do not fire.
  for (const r of records) {
    if (
      r.controlled_drug &&
      r.witness_status === "yes_not_witnessed" &&
      (r.administration_outcome === "administered" || r.administration_outcome === "self_administered")
    ) {
      alerts.push({
        type: "cd_not_witnessed",
        severity: "critical",
        message: `Controlled drug ${r.medication_name} administered to ${r.child_name} without required witness — immediate investigation needed`,
        id: r.id,
      });
    }
  }

  // Side effects observed
  for (const r of records) {
    if (r.side_effects_observed) {
      alerts.push({
        type: "side_effects",
        severity: "high",
        message: `Side effects observed for ${r.child_name} after ${r.medication_name} — ${r.side_effects_details ?? "details not recorded"}`,
        id: r.id,
      });
    }
  }

  // High refusal rate per child
  const childRecords: Record<string, MedicationAdministration[]> = {};
  for (const r of records) {
    if (!childRecords[r.child_id]) childRecords[r.child_id] = [];
    childRecords[r.child_id].push(r);
  }
  for (const [childId, recs] of Object.entries(childRecords)) {
    const refusals = recs.filter((r) => r.administration_outcome === "refused").length;
    if (recs.length >= 3 && refusals / recs.length > 0.5) {
      alerts.push({
        type: "high_refusal",
        severity: "high",
        message: `${recs[0].child_name} refusing medication frequently (${refusals}/${recs.length}) — review with prescriber and explore reasons`,
        id: `refusal_${childId}`,
      });
    }
  }

  // MAR chart not updated
  const marNotUpdated = records.filter(
    (r) => !r.mar_chart_updated && r.administration_outcome !== "not_required",
  ).length;
  if (marNotUpdated >= 2) {
    alerts.push({
      type: "mar_not_updated",
      severity: "medium",
      message: `${marNotUpdated} administrations without MAR chart update — ensure all medication records are contemporaneous`,
      id: "mar_not_updated",
    });
  }

  // Medication not available
  const notAvailable = records.filter((r) => r.administration_outcome === "not_available").length;
  if (notAvailable >= 1) {
    alerts.push({
      type: "not_available",
      severity: "medium",
      message: `${notAvailable} ${notAvailable === 1 ? "medication was" : "medications were"} not available when needed — review stock management`,
      id: "not_available",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    medicationType?: MedicationType;
    administrationOutcome?: AdministrationOutcome;
    limit?: number;
  },
): Promise<ServiceResult<MedicationAdministration[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_medication_administrations") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.medicationType) q = q.eq("medication_type", filters.medicationType);
  if (filters?.administrationOutcome) q = q.eq("administration_outcome", filters.administrationOutcome);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    medicationName: string;
    medicationType: MedicationType;
    dosage: string;
    administrationRoute: AdministrationRoute;
    administrationOutcome: AdministrationOutcome;
    scheduledTime: string;
    actualTime?: string;
    administeredBy: string;
    witnessStatus: WitnessRequired;
    witnessName?: string;
    reasonForPrn?: string;
    reasonForRefusal?: string;
    stockBalance?: number;
    controlledDrug: boolean;
    marChartUpdated: boolean;
    sideEffectsObserved: boolean;
    sideEffectsDetails?: string;
    notes?: string;
  },
): Promise<ServiceResult<MedicationAdministration>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_administrations") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      medication_name: input.medicationName,
      medication_type: input.medicationType,
      dosage: input.dosage,
      administration_route: input.administrationRoute,
      administration_outcome: input.administrationOutcome,
      scheduled_time: input.scheduledTime,
      actual_time: input.actualTime ?? null,
      administered_by: input.administeredBy,
      witness_status: input.witnessStatus,
      witness_name: input.witnessName ?? null,
      reason_for_prn: input.reasonForPrn ?? null,
      reason_for_refusal: input.reasonForRefusal ?? null,
      stock_balance: input.stockBalance ?? null,
      controlled_drug: input.controlledDrug,
      mar_chart_updated: input.marChartUpdated,
      side_effects_observed: input.sideEffectsObserved,
      side_effects_details: input.sideEffectsDetails ?? null,
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
): Promise<ServiceResult<MedicationAdministration>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_administrations") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAdministrationMetrics,
  identifyAdministrationAlerts,
};
