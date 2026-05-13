// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ENVIRONMENTAL SAFETY SERVICE
// Manages fire safety, legionella checks, electrical safety, gas safety,
// PAT testing, COSHH, environmental risk assessments, and premises compliance.
// CHR 2015 Reg 25 (premises safety and suitability),
// Reg 44 (fire safety), Regulatory Reform (Fire Safety) Order 2005,
// Health and Safety at Work Act 1974.
//
// Tracks all mandatory compliance checks, certificates, inspections,
// remedial actions, and ensures the environment is safe and suitable
// for children in residential care.
//
// SCCIF: Well-Led — "The premises are safe, well maintained, and suitable
// for their stated purpose." "Health and safety requirements are met."
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

export type CheckCategory =
  | "fire_safety"
  | "legionella"
  | "electrical"
  | "gas_safety"
  | "pat_testing"
  | "coshh"
  | "asbestos"
  | "water_hygiene"
  | "radon"
  | "pest_control"
  | "playground_equipment"
  | "general_maintenance"
  | "environmental_risk"
  | "other";

export type CheckFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "six_monthly"
  | "annual"
  | "biennial"
  | "five_yearly"
  | "ad_hoc";

export type ComplianceStatus =
  | "compliant"
  | "partially_compliant"
  | "non_compliant"
  | "overdue"
  | "not_applicable";

export type CertificateStatus =
  | "valid"
  | "expiring_soon"
  | "expired"
  | "pending_renewal";

export type ActionPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export interface SafetyCheck {
  id: string;
  home_id: string;
  category: CheckCategory;
  check_name: string;
  check_date: string;
  checked_by: string;
  frequency: CheckFrequency;
  next_due_date: string;
  compliance_status: ComplianceStatus;
  findings: string | null;
  remedial_actions: {
    action: string;
    priority: ActionPriority;
    assigned_to: string;
    due_date: string;
    completed: boolean;
    completion_date: string | null;
  }[];
  certificate_reference: string | null;
  certificate_expiry: string | null;
  certificate_status: CertificateStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FireDrill {
  id: string;
  home_id: string;
  drill_date: string;
  drill_time: string;
  drill_type: "planned" | "unannounced";
  evacuation_time_seconds: number;
  all_evacuated: boolean;
  children_present: number;
  staff_present: number;
  visitors_present: number;
  assembly_point_used: string;
  issues_identified: string | null;
  actions_required: string | null;
  conducted_by: string;
  notes: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CHECK_CATEGORIES: { category: CheckCategory; label: string }[] = [
  { category: "fire_safety", label: "Fire Safety" },
  { category: "legionella", label: "Legionella" },
  { category: "electrical", label: "Electrical Safety" },
  { category: "gas_safety", label: "Gas Safety" },
  { category: "pat_testing", label: "PAT Testing" },
  { category: "coshh", label: "COSHH" },
  { category: "asbestos", label: "Asbestos" },
  { category: "water_hygiene", label: "Water Hygiene" },
  { category: "radon", label: "Radon" },
  { category: "pest_control", label: "Pest Control" },
  { category: "playground_equipment", label: "Playground Equipment" },
  { category: "general_maintenance", label: "General Maintenance" },
  { category: "environmental_risk", label: "Environmental Risk" },
  { category: "other", label: "Other" },
];

export const CHECK_FREQUENCIES: { frequency: CheckFrequency; label: string }[] = [
  { frequency: "daily", label: "Daily" },
  { frequency: "weekly", label: "Weekly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "six_monthly", label: "Six Monthly" },
  { frequency: "annual", label: "Annual" },
  { frequency: "biennial", label: "Biennial" },
  { frequency: "five_yearly", label: "Five Yearly" },
  { frequency: "ad_hoc", label: "Ad Hoc" },
];

export const COMPLIANCE_STATUSES: { status: ComplianceStatus; label: string }[] = [
  { status: "compliant", label: "Compliant" },
  { status: "partially_compliant", label: "Partially Compliant" },
  { status: "non_compliant", label: "Non-Compliant" },
  { status: "overdue", label: "Overdue" },
  { status: "not_applicable", label: "Not Applicable" },
];

export const CERTIFICATE_STATUSES: { status: CertificateStatus; label: string }[] = [
  { status: "valid", label: "Valid" },
  { status: "expiring_soon", label: "Expiring Soon" },
  { status: "expired", label: "Expired" },
  { status: "pending_renewal", label: "Pending Renewal" },
];

export const ACTION_PRIORITIES: { priority: ActionPriority; label: string }[] = [
  { priority: "critical", label: "Critical" },
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute environmental safety metrics.
 */
export function computeSafetyMetrics(
  checks: SafetyCheck[],
  drills: FireDrill[],
): {
  total_checks: number;
  compliant_count: number;
  compliance_rate: number;
  overdue_checks: number;
  non_compliant_checks: number;
  certificates_expiring_soon: number;
  certificates_expired: number;
  open_remedial_actions: number;
  critical_actions: number;
  drills_this_year: number;
  avg_evacuation_time: number;
  by_category: Record<string, { total: number; compliant: number }>;
} {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  let compliantCount = 0;
  let overdueChecks = 0;
  let nonCompliantChecks = 0;
  let expiringCerts = 0;
  let expiredCerts = 0;
  let openActions = 0;
  let criticalActions = 0;
  const byCategory: Record<string, { total: number; compliant: number }> = {};

  for (const c of checks) {
    // By category
    if (!byCategory[c.category]) {
      byCategory[c.category] = { total: 0, compliant: 0 };
    }
    byCategory[c.category].total++;

    if (c.compliance_status === "compliant") {
      compliantCount++;
      byCategory[c.category].compliant++;
    } else if (c.compliance_status === "overdue") {
      overdueChecks++;
    } else if (c.compliance_status === "non_compliant") {
      nonCompliantChecks++;
    }

    // Certificate status
    if (c.certificate_status === "expiring_soon") expiringCerts++;
    if (c.certificate_status === "expired") expiredCerts++;

    // Remedial actions
    for (const a of c.remedial_actions) {
      if (!a.completed) {
        openActions++;
        if (a.priority === "critical") criticalActions++;
      }
    }
  }

  const complianceRate =
    checks.length > 0
      ? Math.round((compliantCount / checks.length) * 1000) / 10
      : 0;

  // Fire drills this year
  const drillsThisYear = drills.filter(
    (d) => new Date(d.drill_date) >= yearStart,
  ).length;

  // Average evacuation time
  let totalEvacTime = 0;
  for (const d of drills) {
    totalEvacTime += d.evacuation_time_seconds;
  }
  const avgEvacuationTime =
    drills.length > 0 ? Math.round(totalEvacTime / drills.length) : 0;

  return {
    total_checks: checks.length,
    compliant_count: compliantCount,
    compliance_rate: complianceRate,
    overdue_checks: overdueChecks,
    non_compliant_checks: nonCompliantChecks,
    certificates_expiring_soon: expiringCerts,
    certificates_expired: expiredCerts,
    open_remedial_actions: openActions,
    critical_actions: criticalActions,
    drills_this_year: drillsThisYear,
    avg_evacuation_time: avgEvacuationTime,
    by_category: byCategory,
  };
}

/**
 * Identify environmental safety alerts.
 */
export function identifySafetyAlerts(
  checks: SafetyCheck[],
  drills: FireDrill[],
  now: Date = new Date(),
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

  // ── Check alerts ────────────────────────────────────────────────────

  for (const c of checks) {
    // Non-compliant
    if (c.compliance_status === "non_compliant") {
      alerts.push({
        type: "non_compliant",
        severity: "critical",
        message: `${c.check_name} is non-compliant — immediate action required (Reg 25)`,
        id: c.id,
      });
    }

    // Overdue check
    if (c.next_due_date && new Date(c.next_due_date) < now && c.compliance_status !== "not_applicable") {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(c.next_due_date).getTime()) / 86400000,
      );
      alerts.push({
        type: "check_overdue",
        severity: "high",
        message: `${c.check_name} check is ${daysOverdue} days overdue — next due ${c.next_due_date}`,
        id: c.id,
      });
    }

    // Expired certificate
    if (c.certificate_status === "expired") {
      alerts.push({
        type: "certificate_expired",
        severity: "critical",
        message: `Certificate for ${c.check_name} has expired — renewal required immediately`,
        id: c.id,
      });
    }

    // Expiring certificate
    if (c.certificate_status === "expiring_soon") {
      alerts.push({
        type: "certificate_expiring",
        severity: "medium",
        message: `Certificate for ${c.check_name} is expiring soon — plan renewal`,
        id: c.id,
      });
    }

    // Critical remedial actions outstanding
    for (const a of c.remedial_actions) {
      if (!a.completed && a.priority === "critical") {
        alerts.push({
          type: "critical_action_outstanding",
          severity: "critical",
          message: `Critical remedial action for ${c.check_name}: "${a.action}" — assigned to ${a.assigned_to}`,
          id: c.id,
        });
      }
    }
  }

  // ── Fire drill alerts ──────────────────────────────────────────────

  // No fire drill in last 90 days
  const recentDrills = drills.filter(
    (d) => new Date(d.drill_date) >= new Date(now.getTime() - 90 * 86400000),
  );
  if (drills.length > 0 && recentDrills.length === 0) {
    alerts.push({
      type: "no_recent_drill",
      severity: "high",
      message: "No fire drill conducted in the last 90 days — Reg 44 requires regular fire drills",
      id: drills[0].id,
    });
  }

  // Failed evacuation
  for (const d of drills) {
    if (!d.all_evacuated) {
      alerts.push({
        type: "failed_evacuation",
        severity: "critical",
        message: `Fire drill on ${d.drill_date} — not all persons evacuated. Review fire safety plan immediately`,
        id: d.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Safety Checks ────────────────────────────────────────────────

export async function listChecks(
  homeId: string,
  filters?: {
    category?: CheckCategory;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<SafetyCheck[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_safety_checks") as SB).select("*").eq("home_id", homeId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  q = q.order("next_due_date", { ascending: true }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createCheck(
  input: {
    homeId: string;
    category: CheckCategory;
    checkName: string;
    checkDate: string;
    checkedBy: string;
    frequency: CheckFrequency;
    nextDueDate: string;
    complianceStatus?: ComplianceStatus;
    findings?: string;
    remedialActions?: SafetyCheck["remedial_actions"];
    certificateReference?: string;
    certificateExpiry?: string;
    certificateStatus?: CertificateStatus;
    notes?: string;
  },
): Promise<ServiceResult<SafetyCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_safety_checks") as SB)
    .insert({
      home_id: input.homeId,
      category: input.category,
      check_name: input.checkName,
      check_date: input.checkDate,
      checked_by: input.checkedBy,
      frequency: input.frequency,
      next_due_date: input.nextDueDate,
      compliance_status: input.complianceStatus ?? "compliant",
      findings: input.findings ?? null,
      remedial_actions: input.remedialActions ?? [],
      certificate_reference: input.certificateReference ?? null,
      certificate_expiry: input.certificateExpiry ?? null,
      certificate_status: input.certificateStatus ?? "valid",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateCheck(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<SafetyCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_safety_checks") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Fire Drills ──────────────────────────────────────────────────

export async function listDrills(
  homeId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<FireDrill[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_fire_drills") as SB).select("*").eq("home_id", homeId);
  if (filters?.dateFrom) q = q.gte("drill_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("drill_date", filters.dateTo);
  q = q.order("drill_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDrill(
  input: {
    homeId: string;
    drillDate: string;
    drillTime: string;
    drillType: "planned" | "unannounced";
    evacuationTimeSeconds: number;
    allEvacuated: boolean;
    childrenPresent: number;
    staffPresent: number;
    visitorsPresent?: number;
    assemblyPointUsed: string;
    issuesIdentified?: string;
    actionsRequired?: string;
    conductedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<FireDrill>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_fire_drills") as SB)
    .insert({
      home_id: input.homeId,
      drill_date: input.drillDate,
      drill_time: input.drillTime,
      drill_type: input.drillType,
      evacuation_time_seconds: input.evacuationTimeSeconds,
      all_evacuated: input.allEvacuated,
      children_present: input.childrenPresent,
      staff_present: input.staffPresent,
      visitors_present: input.visitorsPresent ?? 0,
      assembly_point_used: input.assemblyPointUsed,
      issues_identified: input.issuesIdentified ?? null,
      actions_required: input.actionsRequired ?? null,
      conducted_by: input.conductedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSafetyMetrics,
  identifySafetyAlerts,
};
