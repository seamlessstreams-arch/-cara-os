// ══════════════════════════════════════════════════════════════════════════════
// CARA — KPI TRACKING SERVICE
// Manages key performance indicators, targets, trends, and benchmarking
// for children's home operational excellence.
// CHR 2015 Reg 45 (quality of care review — monitoring standards),
// Reg 35 (leadership and management — performance monitoring).
//
// Tracks KPIs across all operational domains, sets targets, monitors
// trends, identifies areas of excellence and improvement, and provides
// data for Reg 45 independent reports and Ofsted inspections.
//
// SCCIF: Well-Led — "Leaders and managers monitor the quality of care
// effectively." "There is a culture of continuous improvement."
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

export type KpiDomain =
  | "safeguarding"
  | "health"
  | "education"
  | "behaviour"
  | "placement_stability"
  | "staffing"
  | "compliance"
  | "participation"
  | "outcomes"
  | "finance"
  | "environment"
  | "records"
  | "other";

export type KpiStatus =
  | "on_target"
  | "above_target"
  | "below_target"
  | "at_risk"
  | "not_measured";

export type KpiFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual";

export type TrendDirection =
  | "improving"
  | "stable"
  | "declining"
  | "new";

export interface KpiDefinition {
  id: string;
  home_id: string;
  name: string;
  description: string;
  domain: KpiDomain;
  unit: string;
  target_value: number;
  threshold_amber: number;
  threshold_red: number;
  higher_is_better: boolean;
  frequency: KpiFrequency;
  data_source: string;
  responsible_person: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KpiMeasurement {
  id: string;
  home_id: string;
  kpi_id: string;
  kpi_name: string;
  measurement_date: string;
  period: string;
  value: number;
  target: number;
  status: KpiStatus;
  trend: TrendDirection;
  commentary: string | null;
  actions_if_below: string | null;
  measured_by: string;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const KPI_DOMAINS: { domain: KpiDomain; label: string }[] = [
  { domain: "safeguarding", label: "Safeguarding" },
  { domain: "health", label: "Health" },
  { domain: "education", label: "Education" },
  { domain: "behaviour", label: "Behaviour" },
  { domain: "placement_stability", label: "Placement Stability" },
  { domain: "staffing", label: "Staffing" },
  { domain: "compliance", label: "Compliance" },
  { domain: "participation", label: "Participation" },
  { domain: "outcomes", label: "Outcomes" },
  { domain: "finance", label: "Finance" },
  { domain: "environment", label: "Environment" },
  { domain: "records", label: "Records" },
  { domain: "other", label: "Other" },
];

export const KPI_STATUSES: { status: KpiStatus; label: string }[] = [
  { status: "on_target", label: "On Target" },
  { status: "above_target", label: "Above Target" },
  { status: "below_target", label: "Below Target" },
  { status: "at_risk", label: "At Risk" },
  { status: "not_measured", label: "Not Measured" },
];

export const KPI_FREQUENCIES: { frequency: KpiFrequency; label: string }[] = [
  { frequency: "daily", label: "Daily" },
  { frequency: "weekly", label: "Weekly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "annual", label: "Annual" },
];

export const TREND_DIRECTIONS: { direction: TrendDirection; label: string }[] = [
  { direction: "improving", label: "Improving" },
  { direction: "stable", label: "Stable" },
  { direction: "declining", label: "Declining" },
  { direction: "new", label: "New" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute KPI tracking metrics.
 */
export function computeKpiMetrics(
  definitions: KpiDefinition[],
  measurements: KpiMeasurement[],
): {
  total_kpis: number;
  active_kpis: number;
  on_target: number;
  above_target: number;
  below_target: number;
  at_risk: number;
  not_measured: number;
  on_target_rate: number | null;
  improving_count: number;
  declining_count: number;
  by_domain: Record<string, { total: number; on_target: number }>;
  by_status: Record<string, number>;
  by_trend: Record<string, number>;
} {
  const activeKpis = definitions.filter((d) => d.active).length;

  // Get latest measurement per KPI
  const latestByKpi = new Map<string, KpiMeasurement>();
  for (const m of measurements) {
    const existing = latestByKpi.get(m.kpi_id);
    if (!existing || new Date(m.measurement_date) > new Date(existing.measurement_date)) {
      latestByKpi.set(m.kpi_id, m);
    }
  }

  let onTarget = 0;
  let aboveTarget = 0;
  let belowTarget = 0;
  let atRisk = 0;
  let notMeasured = 0;
  let improving = 0;
  let declining = 0;
  const byStatus: Record<string, number> = {};
  const byTrend: Record<string, number> = {};
  const byDomain: Record<string, { total: number; on_target: number }> = {};

  for (const m of latestByKpi.values()) {
    byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
    byTrend[m.trend] = (byTrend[m.trend] ?? 0) + 1;

    if (m.status === "on_target") onTarget++;
    else if (m.status === "above_target") aboveTarget++;
    else if (m.status === "below_target") belowTarget++;
    else if (m.status === "at_risk") atRisk++;
    else if (m.status === "not_measured") notMeasured++;

    if (m.trend === "improving") improving++;
    if (m.trend === "declining") declining++;
  }

  // By domain
  for (const d of definitions) {
    if (!byDomain[d.domain]) {
      byDomain[d.domain] = { total: 0, on_target: 0 };
    }
    byDomain[d.domain].total++;
    const latest = latestByKpi.get(d.id);
    if (latest && (latest.status === "on_target" || latest.status === "above_target")) {
      byDomain[d.domain].on_target++;
    }
  }

  const measuredCount = latestByKpi.size - notMeasured;
  const onTargetRate =
    measuredCount > 0
      ? Math.round(((onTarget + aboveTarget) / measuredCount) * 1000) / 10
      : null;

  return {
    total_kpis: definitions.length,
    active_kpis: activeKpis,
    on_target: onTarget,
    above_target: aboveTarget,
    below_target: belowTarget,
    at_risk: atRisk,
    not_measured: notMeasured,
    on_target_rate: onTargetRate,
    improving_count: improving,
    declining_count: declining,
    by_domain: byDomain,
    by_status: byStatus,
    by_trend: byTrend,
  };
}

/**
 * Identify KPI tracking alerts.
 */
export function identifyKpiAlerts(
  definitions: KpiDefinition[],
  measurements: KpiMeasurement[],
  _now: Date = new Date(),
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

  // Get latest measurement per KPI
  const latestByKpi = new Map<string, KpiMeasurement>();
  for (const m of measurements) {
    const existing = latestByKpi.get(m.kpi_id);
    if (!existing || new Date(m.measurement_date) > new Date(existing.measurement_date)) {
      latestByKpi.set(m.kpi_id, m);
    }
  }

  for (const m of latestByKpi.values()) {
    // At risk
    if (m.status === "at_risk") {
      alerts.push({
        type: "kpi_at_risk",
        severity: "critical",
        message: `KPI "${m.kpi_name}" is at risk — current value: ${m.value}, target: ${m.target}`,
        id: m.id,
      });
    }

    // Below target
    if (m.status === "below_target") {
      alerts.push({
        type: "kpi_below_target",
        severity: "high",
        message: `KPI "${m.kpi_name}" is below target — current value: ${m.value}, target: ${m.target}`,
        id: m.id,
      });
    }

    // Declining trend
    if (m.trend === "declining") {
      alerts.push({
        type: "kpi_declining",
        severity: "medium",
        message: `KPI "${m.kpi_name}" is showing a declining trend — monitor and take action if needed`,
        id: m.id,
      });
    }
  }

  // KPIs without measurements
  const measuredKpis = new Set(measurements.map((m) => m.kpi_id));
  for (const d of definitions) {
    if (d.active && !measuredKpis.has(d.id)) {
      alerts.push({
        type: "kpi_not_measured",
        severity: "medium",
        message: `KPI "${d.name}" has no measurements recorded — ensure data collection is in place`,
        id: d.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — KPI Definitions ──────────────────────────────────────────────

export async function listDefinitions(
  homeId: string,
  filters?: {
    domain?: KpiDomain;
    active?: boolean;
    limit?: number;
  },
): Promise<ServiceResult<KpiDefinition[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_kpi_definitions") as SB).select("*").eq("home_id", homeId);
  if (filters?.domain) q = q.eq("domain", filters.domain);
  if (filters?.active !== undefined) q = q.eq("active", filters.active);
  q = q.order("domain", { ascending: true }).order("name", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDefinition(
  input: {
    homeId: string;
    name: string;
    description: string;
    domain: KpiDomain;
    unit: string;
    targetValue: number;
    thresholdAmber: number;
    thresholdRed: number;
    higherIsBetter?: boolean;
    frequency: KpiFrequency;
    dataSource: string;
    responsiblePerson: string;
  },
): Promise<ServiceResult<KpiDefinition>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_kpi_definitions") as SB)
    .insert({
      home_id: input.homeId,
      name: input.name,
      description: input.description,
      domain: input.domain,
      unit: input.unit,
      target_value: input.targetValue,
      threshold_amber: input.thresholdAmber,
      threshold_red: input.thresholdRed,
      higher_is_better: input.higherIsBetter ?? true,
      frequency: input.frequency,
      data_source: input.dataSource,
      responsible_person: input.responsiblePerson,
      active: true,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDefinition(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<KpiDefinition>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_kpi_definitions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — KPI Measurements ────────────────────────────────────────────

export async function listMeasurements(
  homeId: string,
  filters?: {
    kpiId?: string;
    status?: KpiStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<KpiMeasurement[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_kpi_measurements") as SB).select("*").eq("home_id", homeId);
  if (filters?.kpiId) q = q.eq("kpi_id", filters.kpiId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("measurement_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("measurement_date", filters.dateTo);
  q = q.order("measurement_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMeasurement(
  input: {
    homeId: string;
    kpiId: string;
    kpiName: string;
    measurementDate: string;
    period: string;
    value: number;
    target: number;
    status: KpiStatus;
    trend: TrendDirection;
    commentary?: string;
    actionsIfBelow?: string;
    measuredBy: string;
  },
): Promise<ServiceResult<KpiMeasurement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_kpi_measurements") as SB)
    .insert({
      home_id: input.homeId,
      kpi_id: input.kpiId,
      kpi_name: input.kpiName,
      measurement_date: input.measurementDate,
      period: input.period,
      value: input.value,
      target: input.target,
      status: input.status,
      trend: input.trend,
      commentary: input.commentary ?? null,
      actions_if_below: input.actionsIfBelow ?? null,
      measured_by: input.measuredBy,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeKpiMetrics,
  identifyKpiAlerts,
};
