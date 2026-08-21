// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION MANAGEMENT SERVICE
// Manages prescriptions, MAR sheets, controlled drug audits, medication error
// reporting, and compliance analytics. CHR 2015 Reg 23 (health) and Reg 12.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { londonDayDiff } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface MedicationPrescription {
  id: string;
  home_id: string;
  child_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: string;
  medication_type: string;
  prescriber: string;
  pharmacy: string;
  start_date: string;
  end_date?: string | null;
  special_instructions?: string | null;
  is_active: boolean;
  requires_witness: boolean;
  stock_count?: number | null;
  last_stock_check?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MAREntry {
  id: string;
  prescription_id: string;
  child_id: string;
  home_id: string;
  scheduled_time: string;
  administered_at?: string | null;
  administered_by: string;
  witnessed_by?: string | null;
  outcome: string;
  dosage_given: string;
  stock_before?: number | null;
  stock_after?: number | null;
  prn_rationale?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface MedicationError {
  id: string;
  home_id: string;
  child_id: string;
  prescription_id?: string | null;
  error_category: string;
  severity: string;
  description: string;
  action_taken: string;
  reported_by: string;
  reported_to_manager: boolean;
  ofsted_notified: boolean;
  parent_notified: boolean;
  prescriber_notified: boolean;
  outcome: string;
  date_occurred: string;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const MEDICATION_TYPES: {
  type: string;
  label: string;
  requires_mar: boolean;
  requires_rationale?: boolean;
  requires_witness?: boolean;
  requires_stock_count?: boolean;
}[] = [
  { type: "regular", label: "Regular Prescription", requires_mar: true },
  { type: "prn", label: "PRN (As Needed)", requires_mar: true, requires_rationale: true },
  { type: "controlled", label: "Controlled Drug", requires_mar: true, requires_witness: true, requires_stock_count: true },
  { type: "otc", label: "Over the Counter", requires_mar: true },
  { type: "topical", label: "Topical/External", requires_mar: true },
  { type: "homely_remedy", label: "Homely Remedy", requires_mar: false },
];

export const ADMINISTRATION_OUTCOMES = [
  "given",
  "refused",
  "withheld",
  "not_available",
  "self_administered",
  "absent",
] as const;

export const MEDICATION_ROUTES = [
  "oral",
  "topical",
  "inhaled",
  "injection",
  "sublingual",
  "rectal",
  "nasal",
  "eye_drops",
  "ear_drops",
  "patch",
] as const;

export const ERROR_CATEGORIES: {
  category: string;
  severity: string;
  notification_required: boolean;
}[] = [
  { category: "wrong_dose", severity: "high", notification_required: true },
  { category: "wrong_time", severity: "medium", notification_required: false },
  { category: "wrong_medication", severity: "critical", notification_required: true },
  { category: "wrong_child", severity: "critical", notification_required: true },
  { category: "omission", severity: "medium", notification_required: false },
  { category: "double_dose", severity: "high", notification_required: true },
  { category: "expired_medication", severity: "medium", notification_required: false },
  { category: "documentation_error", severity: "low", notification_required: false },
  { category: "storage_error", severity: "low", notification_required: false },
  { category: "disposal_error", severity: "medium", notification_required: false },
];

// ── Pure functions (no DB) ─────────────────────────────────────────────────

/**
 * Compute medication compliance metrics from MAR entries.
 */
export function computeMedicationCompliance(entries: MAREntry[]): {
  total_scheduled: number;
  total_given: number;
  total_refused: number;
  total_withheld: number;
  total_missed: number;
  compliance_rate: number | null;
  by_outcome: Record<string, number>;
  refusal_rate: number | null;
} {
  const total = entries.length;

  const byOutcome: Record<string, number> = {};
  for (const e of entries) {
    byOutcome[e.outcome] = (byOutcome[e.outcome] ?? 0) + 1;
  }

  const given = byOutcome["given"] ?? 0;
  const selfAdmin = byOutcome["self_administered"] ?? 0;
  const refused = byOutcome["refused"] ?? 0;
  const withheld = byOutcome["withheld"] ?? 0;
  const notAvailable = byOutcome["not_available"] ?? 0;
  const absent = byOutcome["absent"] ?? 0;

  const complianceRate = total > 0
    ? Math.round(((given + selfAdmin) / total) * 1000) / 10
    : null;

  const refusalRate = total > 0
    ? Math.round((refused / total) * 1000) / 10
    : null;

  return {
    total_scheduled: total,
    total_given: given,
    total_refused: refused,
    total_withheld: withheld,
    total_missed: notAvailable + absent,
    compliance_rate: complianceRate,
    by_outcome: byOutcome,
    refusal_rate: refusalRate,
  };
}

/**
 * Audit controlled drug prescriptions against MAR entries.
 * Checks stock discrepancies, witness compliance, and overdue stock checks.
 */
export function computeControlledDrugAudit(
  prescriptions: MedicationPrescription[],
  entries: MAREntry[],
): {
  total_controlled: number;
  stock_discrepancies: {
    prescription_id: string;
    medication_name: string;
    expected: number;
    actual: number;
    difference: number;
  }[];
  witness_compliance_rate: number | null;
  last_stock_check: string | null;
  overdue_stock_checks: {
    prescription_id: string;
    medication_name: string;
    last_checked: string | null;
    days_overdue: number;
  }[];
} {
  const controlled = prescriptions.filter(
    (p) => p.medication_type === "controlled",
  );

  // Build map of entries per prescription
  const entriesByPrescription = new Map<string, MAREntry[]>();
  for (const e of entries) {
    const list = entriesByPrescription.get(e.prescription_id) ?? [];
    list.push(e);
    entriesByPrescription.set(e.prescription_id, list);
  }

  // Filter to only entries for controlled drug prescriptions
  const controlledIds = new Set(controlled.map((p) => p.id));
  const controlledEntries = entries.filter((e) => controlledIds.has(e.prescription_id));

  // Witness compliance: entries that have witnessed_by
  const witnessedCount = controlledEntries.filter((e) => e.witnessed_by).length;
  const witnessComplianceRate = controlledEntries.length > 0
    ? Math.round((witnessedCount / controlledEntries.length) * 1000) / 10
    : null;

  // Stock discrepancies: compare expected vs actual for each controlled prescription
  const stockDiscrepancies: {
    prescription_id: string;
    medication_name: string;
    expected: number;
    actual: number;
    difference: number;
  }[] = [];

  for (const p of controlled) {
    const pEntries = entriesByPrescription.get(p.id) ?? [];
    if (pEntries.length === 0 || p.stock_count == null) continue;

    // Find entries with stock tracking (given outcomes that changed stock)
    const givenEntries = pEntries.filter(
      (e) => e.outcome === "given" && e.stock_before != null && e.stock_after != null,
    );

    if (givenEntries.length === 0) continue;

    // Sort by scheduled_time to find the most recent
    const sorted = [...givenEntries].sort(
      (a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime(),
    );

    const lastEntry = sorted[0];
    const expected = lastEntry.stock_after!;
    const actual = p.stock_count;

    if (expected !== actual) {
      stockDiscrepancies.push({
        prescription_id: p.id,
        medication_name: p.medication_name,
        expected,
        actual,
        difference: actual - expected,
      });
    }
  }

  // Last stock check across all controlled prescriptions
  let lastStockCheck: string | null = null;
  for (const p of controlled) {
    if (p.last_stock_check) {
      if (!lastStockCheck || p.last_stock_check > lastStockCheck) {
        lastStockCheck = p.last_stock_check;
      }
    }
  }

  const overdueStockChecks: {
    prescription_id: string;
    medication_name: string;
    last_checked: string | null;
    days_overdue: number;
  }[] = [];

  for (const p of controlled) {
    if (!p.last_stock_check) {
      // Never checked — calculate days since prescription start
      const startDate = new Date(p.start_date);
      const daysSinceStart = Math.floor(
        -londonDayDiff(startDate),
      );
      if (daysSinceStart > 7) {
        overdueStockChecks.push({
          prescription_id: p.id,
          medication_name: p.medication_name,
          last_checked: null,
          days_overdue: daysSinceStart - 7,
        });
      }
    } else {
      const lastCheck = new Date(p.last_stock_check);
      const daysSinceCheck = Math.floor(
        -londonDayDiff(lastCheck),
      );
      if (daysSinceCheck > 7) {
        overdueStockChecks.push({
          prescription_id: p.id,
          medication_name: p.medication_name,
          last_checked: p.last_stock_check,
          days_overdue: daysSinceCheck - 7,
        });
      }
    }
  }

  return {
    total_controlled: controlled.length,
    stock_discrepancies: stockDiscrepancies,
    witness_compliance_rate: witnessComplianceRate,
    last_stock_check: lastStockCheck,
    overdue_stock_checks: overdueStockChecks,
  };
}

/**
 * Compute medication error rate and breakdown by category/severity.
 */
export function computeMedicationErrorRate(
  errors: MedicationError[],
  totalEntries: number,
): {
  total_errors: number;
  error_rate: number | null;
  by_category: Record<string, number>;
  by_severity: { critical: number; high: number; medium: number; low: number };
  notifications_required: number;
  notifications_sent: number;
} {
  const byCategory: Record<string, number> = {};
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const err of errors) {
    byCategory[err.error_category] = (byCategory[err.error_category] ?? 0) + 1;

    if (err.severity in bySeverity) {
      bySeverity[err.severity as keyof typeof bySeverity] += 1;
    }
  }

  // Notification analysis based on ERROR_CATEGORIES constant
  const notificationCategories = new Set(
    ERROR_CATEGORIES.filter((c) => c.notification_required).map((c) => c.category),
  );

  const notificationsRequired = errors.filter(
    (e) => notificationCategories.has(e.error_category),
  ).length;

  const notificationsSent = errors.filter((e) => e.ofsted_notified).length;

  const errorRate = totalEntries > 0
    ? Math.round((errors.length / totalEntries) * 1000) / 10
    : null;

  return {
    total_errors: errors.length,
    error_rate: errorRate,
    by_category: byCategory,
    by_severity: bySeverity,
    notifications_required: notificationsRequired,
    notifications_sent: notificationsSent,
  };
}

/**
 * Identify medication alerts from prescriptions, MAR entries, and errors.
 */
export function identifyMedicationAlerts(
  prescriptions: MedicationPrescription[],
  entries: MAREntry[],
  errors: MedicationError[],
): {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  child_id: string;
  prescription_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    message: string;
    child_id: string;
    prescription_id?: string;
  }[] = [];

  // stock_low: controlled drug stock_count <= 3
  for (const p of prescriptions) {
    if (
      p.medication_type === "controlled" &&
      p.stock_count != null &&
      p.stock_count <= 3
    ) {
      alerts.push({
        type: "stock_low",
        severity: "medium",
        message: `Low stock for ${p.medication_name}: ${p.stock_count} remaining`,
        child_id: p.child_id,
        prescription_id: p.id,
      });
    }
  }

  // stock_discrepancy: from controlled drug audit
  const audit = computeControlledDrugAudit(prescriptions, entries);
  for (const disc of audit.stock_discrepancies) {
    const p = prescriptions.find((pr) => pr.id === disc.prescription_id);
    alerts.push({
      type: "stock_discrepancy",
      severity: "high",
      message: `Stock discrepancy for ${disc.medication_name}: expected ${disc.expected}, actual ${disc.actual} (difference: ${disc.difference})`,
      child_id: p?.child_id ?? "",
      prescription_id: disc.prescription_id,
    });
  }

  // frequent_refusal: child refused >= 3 times in entries
  const refusalsByChild: Record<string, number> = {};
  for (const e of entries) {
    if (e.outcome === "refused") {
      refusalsByChild[e.child_id] = (refusalsByChild[e.child_id] ?? 0) + 1;
    }
  }
  for (const childId of Object.keys(refusalsByChild)) {
    const count = refusalsByChild[childId];
    if (count >= 3) {
      alerts.push({
        type: "frequent_refusal",
        severity: "high",
        message: `Child has refused medication ${count} times — review required`,
        child_id: childId,
      });
    }
  }

  // witness_missing: controlled drug entry without witnessed_by
  const controlledIds = new Set(
    prescriptions.filter((p) => p.medication_type === "controlled").map((p) => p.id),
  );
  for (const e of entries) {
    if (controlledIds.has(e.prescription_id) && !e.witnessed_by) {
      alerts.push({
        type: "witness_missing",
        severity: "critical",
        message: `Controlled drug administered without witness at ${e.scheduled_time}`,
        child_id: e.child_id,
        prescription_id: e.prescription_id,
      });
    }
  }

  // recent_error: any error in last 7 days with severity critical/high
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  for (const err of errors) {
    const errorDate = new Date(err.date_occurred);
    if (
      errorDate >= sevenDaysAgo &&
      (err.severity === "critical" || err.severity === "high")
    ) {
      alerts.push({
        type: "recent_error",
        severity: "high",
        message: `Recent ${err.severity} medication error: ${err.error_category}`,
        child_id: err.child_id,
        prescription_id: err.prescription_id ?? undefined,
      });
    }
  }

  for (const p of prescriptions) {
    if (p.is_active && !p.end_date) {
      const startDate = new Date(p.start_date);
      const daysSinceStart = Math.floor(
        -londonDayDiff(startDate),
      );
      if (daysSinceStart > 84) {
        alerts.push({
          type: "review_due",
          severity: "medium",
          message: `${p.medication_name} has been active for ${daysSinceStart} days without review — prescriber review due`,
          child_id: p.child_id,
          prescription_id: p.id,
        });
      }
    }
  }

  return alerts;
}

// ── CRUD — Prescriptions ───────────────────────────────────────────────────

export async function listPrescriptions(
  homeId: string,
  filters?: {
    childId?: string;
    medicationType?: string;
    activeOnly?: boolean;
  },
): Promise<ServiceResult<MedicationPrescription[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_medication_prescriptions") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.medicationType) q = q.eq("medication_type", filters.medicationType);

  const activeOnly = filters?.activeOnly ?? true;
  if (activeOnly) q = q.eq("is_active", true);

  q = q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getPrescription(
  id: string,
): Promise<ServiceResult<MedicationPrescription>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_prescriptions") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createPrescription(
  input: Omit<MedicationPrescription, "id" | "is_active" | "created_at" | "updated_at">,
): Promise<ServiceResult<MedicationPrescription>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // Derive requires_witness from MEDICATION_TYPES lookup
  const medType = MEDICATION_TYPES.find((t) => t.type === input.medication_type);
  const requiresWitness = medType?.requires_witness ?? false;

  const { data, error } = await (s.from("cs_medication_prescriptions") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      medication_name: input.medication_name,
      dosage: input.dosage,
      frequency: input.frequency,
      route: input.route,
      medication_type: input.medication_type,
      prescriber: input.prescriber,
      pharmacy: input.pharmacy,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      special_instructions: input.special_instructions ?? null,
      is_active: true,
      requires_witness: requiresWitness,
      stock_count: input.stock_count ?? null,
      last_stock_check: input.last_stock_check ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePrescription(
  id: string,
  updates: Partial<MedicationPrescription>,
): Promise<ServiceResult<MedicationPrescription>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const patch: Record<string, unknown> = {};

  if (updates.medication_name !== undefined) patch.medication_name = updates.medication_name;
  if (updates.dosage !== undefined) patch.dosage = updates.dosage;
  if (updates.frequency !== undefined) patch.frequency = updates.frequency;
  if (updates.route !== undefined) patch.route = updates.route;
  if (updates.medication_type !== undefined) patch.medication_type = updates.medication_type;
  if (updates.prescriber !== undefined) patch.prescriber = updates.prescriber;
  if (updates.pharmacy !== undefined) patch.pharmacy = updates.pharmacy;
  if (updates.start_date !== undefined) patch.start_date = updates.start_date;
  if (updates.end_date !== undefined) patch.end_date = updates.end_date;
  if (updates.special_instructions !== undefined) patch.special_instructions = updates.special_instructions;
  if (updates.is_active !== undefined) patch.is_active = updates.is_active;
  if (updates.requires_witness !== undefined) patch.requires_witness = updates.requires_witness;
  if (updates.stock_count !== undefined) patch.stock_count = updates.stock_count;
  if (updates.last_stock_check !== undefined) patch.last_stock_check = updates.last_stock_check;

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No fields to update" };
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await (s.from("cs_medication_prescriptions") as SB)
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — MAR Entries ─────────────────────────────────────────────────────

export async function recordAdministration(
  input: Omit<MAREntry, "id" | "created_at">,
): Promise<ServiceResult<MAREntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_mar_entries") as SB)
    .insert({
      prescription_id: input.prescription_id,
      child_id: input.child_id,
      home_id: input.home_id,
      scheduled_time: input.scheduled_time,
      administered_at: input.administered_at ?? null,
      administered_by: input.administered_by,
      witnessed_by: input.witnessed_by ?? null,
      outcome: input.outcome,
      dosage_given: input.dosage_given,
      stock_before: input.stock_before ?? null,
      stock_after: input.stock_after ?? null,
      prn_rationale: input.prn_rationale ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  // If outcome is "given" and this is a controlled drug, auto-decrement stock
  if (input.outcome === "given") {
    const { data: prescription } = await (s.from("cs_medication_prescriptions") as SB)
      .select("medication_type, stock_count")
      .eq("id", input.prescription_id)
      .single();

    if (
      prescription?.medication_type === "controlled" &&
      prescription.stock_count != null &&
      prescription.stock_count > 0
    ) {
      await (s.from("cs_medication_prescriptions") as SB)
        .update({
          stock_count: prescription.stock_count - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.prescription_id);
    }
  }

  return { ok: true, data };
}

export async function listMAREntries(
  homeId: string,
  filters?: {
    childId?: string;
    prescriptionId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<MAREntry[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_mar_entries") as SB).select("*").eq("home_id", homeId);

  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.prescriptionId) q = q.eq("prescription_id", filters.prescriptionId);
  if (filters?.dateFrom) q = q.gte("scheduled_time", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("scheduled_time", filters.dateTo);

  q = q.order("scheduled_time", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── CRUD — Medication Errors ───────────────────────────────────────────────

export async function recordMedicationError(
  input: Omit<MedicationError, "id" | "created_at">,
): Promise<ServiceResult<MedicationError>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_errors") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      prescription_id: input.prescription_id ?? null,
      error_category: input.error_category,
      severity: input.severity,
      description: input.description,
      action_taken: input.action_taken,
      reported_by: input.reported_by,
      reported_to_manager: input.reported_to_manager,
      ofsted_notified: input.ofsted_notified,
      parent_notified: input.parent_notified,
      prescriber_notified: input.prescriber_notified,
      outcome: input.outcome,
      date_occurred: input.date_occurred,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listMedicationErrors(
  homeId: string,
  filters?: {
    childId?: string;
    severity?: string;
    limit?: number;
  },
): Promise<ServiceResult<MedicationError[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_medication_errors") as SB).select("*").eq("home_id", homeId);

  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.severity) q = q.eq("severity", filters.severity);

  q = q.order("date_occurred", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeMedicationCompliance,
  computeControlledDrugAudit,
  computeMedicationErrorRate,
  identifyMedicationAlerts,
};
