// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RADON TESTING SERVICE
// Tracks radon gas testing, levels, and mitigation measures for the
// residential home. UK PHE/UKHSA radon action level compliance.
//
// Covers: radon testing, radon level recording, action level breaches,
// target level breaches, mitigation measures, post-mitigation retesting,
// compliance status tracking, and UKHSA guidance adherence.
//
// UKHSA (formerly PHE) radon action level: 200 Bq/m³,
// UKHSA radon target level: 100 Bq/m³,
// CHR 2015 Reg 25 (health and safety — environmental hazards),
// CHR 2015 Reg 36 (fitness of premises — building safety).
//
// SCCIF: Helped & Protected — "The home is safe and well maintained."
// "Children are protected from radon gas risks under UKHSA guidance."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const MITIGATION_TYPES = [
  "Sump System",
  "Positive Ventilation",
  "Sealing",
  "Sub-Floor Ventilation",
  "None Required",
] as const;
export type MitigationType = (typeof MITIGATION_TYPES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Action Required",
  "Monitoring",
  "Non-Compliant",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeRadonTestingRow {
  id: string;
  home_id: string;
  test_date: string;
  tester_name: string;
  test_location: string;
  test_duration_days: number;
  radon_level_bq_m3: number;
  above_action_level: boolean;
  above_target_level: boolean;
  mitigation_required: boolean;
  mitigation_type: MitigationType | null;
  mitigation_installed: boolean;
  post_mitigation_level: number | null;
  retest_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Supabase helpers ─────────────────────────────────────────────────────

function isSupabaseEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listHomeRadonTesting(
  homeId: string,
): Promise<ServiceResult<HomeRadonTestingRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = sb();
  if (!client) return { ok: true, data: [] };

  const { data, error } = await (client.from("cs_home_radon_testing") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("test_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeRadonTesting(input: {
  homeId: string;
  testDate: string;
  testerName: string;
  testLocation: string;
  testDurationDays: number;
  radonLevelBqM3: number;
  aboveActionLevel: boolean;
  aboveTargetLevel: boolean;
  mitigationRequired: boolean;
  mitigationType?: MitigationType | null;
  mitigationInstalled: boolean;
  postMitigationLevel?: number | null;
  retestDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeRadonTestingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_home_radon_testing") as any)
    .insert({
      home_id: input.homeId,
      test_date: input.testDate,
      tester_name: input.testerName,
      test_location: input.testLocation,
      test_duration_days: input.testDurationDays,
      radon_level_bq_m3: input.radonLevelBqM3,
      above_action_level: input.aboveActionLevel,
      above_target_level: input.aboveTargetLevel,
      mitigation_required: input.mitigationRequired,
      mitigation_type: input.mitigationType ?? null,
      mitigation_installed: input.mitigationInstalled,
      post_mitigation_level: input.postMitigationLevel ?? null,
      retest_date: input.retestDate ?? null,
      compliance_status: input.complianceStatus,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHomeRadonTesting(
  id: string,
  homeId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HomeRadonTestingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_home_radon_testing") as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("home_id", homeId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: HomeRadonTestingRow[],
): {
  total_tests: number;
  above_action_count: number;
  above_target_count: number;
  mitigation_required_count: number;
  mitigation_installed_rate: number;
  avg_radon_level: number;
  max_radon_level: number;
  retest_scheduled_rate: number;
  compliant_count: number;
  non_compliant_count: number;
  unique_testers: number;
} {
  const total = rows.length;

  const aboveActionCount = rows.filter((r) => r.above_action_level === true).length;
  const aboveTargetCount = rows.filter((r) => r.above_target_level === true).length;

  const mitigationRequiredCount = rows.filter((r) => r.mitigation_required === true).length;

  // mitigation_installed_rate: % of those requiring mitigation that have it installed
  const mitigationRequiredRows = rows.filter((r) => r.mitigation_required === true);
  const mitigationInstalledCount = mitigationRequiredRows.filter((r) => r.mitigation_installed === true).length;
  const mitigationInstalledRate =
    mitigationRequiredRows.length > 0
      ? Math.round((mitigationInstalledCount / mitigationRequiredRows.length) * 1000) / 10
      : 0;

  const avgRadonLevel =
    total > 0
      ? Math.round((rows.reduce((sum, r) => sum + r.radon_level_bq_m3, 0) / total) * 10) / 10
      : 0;

  const maxRadonLevel =
    total > 0
      ? Math.round(Math.max(...rows.map((r) => r.radon_level_bq_m3)) * 10) / 10
      : 0;

  const retestScheduled = rows.filter((r) => r.retest_date !== null).length;
  const retestScheduledRate =
    total > 0 ? Math.round((retestScheduled / total) * 1000) / 10 : 0;

  const compliantCount = rows.filter((r) => r.compliance_status === "Compliant").length;
  const nonCompliantCount = rows.filter((r) => r.compliance_status === "Non-Compliant").length;

  const uniqueTesters = new Set(rows.map((r) => r.tester_name)).size;

  return {
    total_tests: total,
    above_action_count: aboveActionCount,
    above_target_count: aboveTargetCount,
    mitigation_required_count: mitigationRequiredCount,
    mitigation_installed_rate: mitigationInstalledRate,
    avg_radon_level: avgRadonLevel,
    max_radon_level: maxRadonLevel,
    retest_scheduled_rate: retestScheduledRate,
    compliant_count: compliantCount,
    non_compliant_count: nonCompliantCount,
    unique_testers: uniqueTesters,
  };
}

export function computeAlerts(
  rows: HomeRadonTestingRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: above action level without mitigation installed
  for (const r of rows) {
    if (r.above_action_level && !r.mitigation_installed) {
      alerts.push({
        type: "above_action_no_mitigation",
        severity: "critical",
        message: `Radon level ${r.radon_level_bq_m3} Bq/m³ above UKHSA action level (200 Bq/m³) at ${r.test_location} tested on ${r.test_date} — mitigation not yet installed, immediate action required`,
        record_id: r.id,
      });
    }
  }

  // High: Non-Compliant compliance status
  for (const r of rows) {
    if (r.compliance_status === "Non-Compliant") {
      alerts.push({
        type: "non_compliant_status",
        severity: "high",
        message: `Radon test at ${r.test_location} on ${r.test_date} has non-compliant status — review required to ensure UKHSA guidance is being followed`,
        record_id: r.id,
      });
    }
  }

  // Medium: above target level without retest date
  for (const r of rows) {
    if (r.above_target_level && !r.retest_date) {
      alerts.push({
        type: "above_target_no_retest",
        severity: "medium",
        message: `Radon level ${r.radon_level_bq_m3} Bq/m³ above UKHSA target level (100 Bq/m³) at ${r.test_location} tested on ${r.test_date} — no retest date scheduled`,
        record_id: r.id,
      });
    }
  }

  // Medium: mitigation required without mitigation type
  for (const r of rows) {
    if (r.mitigation_required && !r.mitigation_type) {
      alerts.push({
        type: "mitigation_required_no_type",
        severity: "medium",
        message: `Mitigation required for radon test at ${r.test_location} on ${r.test_date} but no mitigation type has been specified — a mitigation approach should be selected`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function computeCaraInsights(
  metrics: ReturnType<typeof computeMetrics>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `${metrics.total_tests} radon ${metrics.total_tests === 1 ? "test" : "tests"} recorded across ${metrics.unique_testers} ${metrics.unique_testers === 1 ? "tester" : "testers"}. ` +
      `Average radon level ${metrics.avg_radon_level} Bq/m³, maximum ${metrics.max_radon_level} Bq/m³. ` +
      `${metrics.above_action_count} ${metrics.above_action_count === 1 ? "test" : "tests"} above the UKHSA action level and ${metrics.above_target_count} above the target level.`,
  );

  // Insight 2: Priorities
  if (metrics.above_action_count > 0 || metrics.non_compliant_count > 0) {
    insights.push(
      `${metrics.above_action_count} ${metrics.above_action_count === 1 ? "test" : "tests"} above the action level and ${metrics.non_compliant_count} non-compliant. ` +
        `${metrics.mitigation_required_count} ${metrics.mitigation_required_count === 1 ? "test" : "tests"} requiring mitigation with an installation rate of ${metrics.mitigation_installed_rate}%. ` +
        `Retest scheduling rate is ${metrics.retest_scheduled_rate}%.`,
    );
  } else {
    insights.push(
      `No tests above the UKHSA action level and no non-compliant results currently recorded. ` +
        `${metrics.compliant_count} ${metrics.compliant_count === 1 ? "test" : "tests"} compliant. ` +
        `Continue regular monitoring to maintain UKHSA radon guidance compliance.`,
    );
  }

  // Insight 3: Reflective question about radon risk and UKHSA guidance
  if (metrics.above_action_count > 0) {
    insights.push(
      `${metrics.above_action_count} ${metrics.above_action_count === 1 ? "test has" : "tests have"} radon levels above the UKHSA action level of 200 Bq/m³. ` +
        `What steps are being taken to reduce radon exposure for children and staff, ` +
        `and is the home's radon mitigation plan aligned with current UKHSA guidance?`,
    );
  } else if (metrics.above_target_count > 0) {
    insights.push(
      `${metrics.above_target_count} ${metrics.above_target_count === 1 ? "test" : "tests"} above the UKHSA target level of 100 Bq/m³ but below the action level. ` +
        `How can the home reduce radon levels further to meet the target level, ` +
        `and are retests scheduled in line with UKHSA guidance?`,
    );
  } else {
    insights.push(
      `All tests show radon levels below the UKHSA target level with no action level breaches. ` +
        `How can the home maintain this low radon risk and ensure ongoing monitoring aligns with UKHSA guidance, ` +
        `particularly if building modifications or seasonal changes could affect radon ingress?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
};
