// ══════════════════════════════════════════════════════════════════════════════
// CARA — CROSS-HOME INTELLIGENCE SERVICE
//
// Aggregates intelligence across all homes in an organisation for
// Responsible Individuals, Operations Directors, and Regional Managers.
// Provides snapshots, trends, comparisons, and Cara-powered alerts.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { isLiveTenant } from "@/lib/db/live-mode";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface CrossHomeSnapshot {
  id: string;
  organisation_id: string;
  snapshot_date: string;
  home_id: string;
  home_name: string;
  total_children: number;
  total_incidents_7d: number;
  total_incidents_30d: number;
  safeguarding_concerns_open: number;
  risk_level_overall: string;
  recording_compliance_pct: number;
  avg_daily_log_quality: number;
  key_work_sessions_due: number;
  key_work_sessions_overdue: number;
  staff_supervision_compliance_pct: number;
  management_oversight_current: boolean;
  ofsted_readiness_score: number;
  reg45_due_date: string | null;
  reg44_due_date: string | null;
  cara_alerts: CaraAlert[];
  cara_risk_factors: CaraRiskFactor[];
  cara_recommendations: CaraRecommendation[];
  created_at: string;
}

export interface CaraAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  home_id: string;
  home_name: string;
  category: string;
  created_at: string;
}

export interface CaraRiskFactor {
  factor: string;
  severity: "critical" | "high" | "medium" | "low";
  trend: "improving" | "worsening" | "stable";
}

export interface CaraRecommendation {
  recommendation: string;
  priority: "immediate" | "this_week" | "this_month";
  home_id: string;
  home_name: string;
}

export interface OrganisationOverview {
  total_homes: number;
  total_children: number;
  total_incidents_7d: number;
  total_incidents_30d: number;
  safeguarding_concerns_open: number;
  overall_compliance_pct: number;
  homes_at_risk: number;
  homes_compliant: number;
  avg_ofsted_readiness: number;
  key_work_overdue_total: number;
}

export interface HomeTrendPoint {
  period_start: string;
  period_end: string;
  metric_value: number;
}

export interface ComparisonRow {
  metric: string;
  values: { home_id: string; home_name: string; value: number; status: "green" | "amber" | "red" }[];
}

export interface CrossHomeAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  home_id: string;
  home_name: string;
  category: string;
  action_required: string;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

function statusFromPct(pct: number): "green" | "amber" | "red" {
  if (pct >= 80) return "green";
  if (pct >= 60) return "amber";
  return "red";
}

// ── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_SNAPSHOTS: CrossHomeSnapshot[] = [
  {
    id: "snap-oak-1",
    organisation_id: "org-demo-1",
    snapshot_date: "2026-05-16",
    home_id: "home-oak",
    home_name: "Chamberlain House",
    total_children: 3,
    total_incidents_7d: 1,
    total_incidents_30d: 4,
    safeguarding_concerns_open: 0,
    risk_level_overall: "low",
    recording_compliance_pct: 92,
    avg_daily_log_quality: 8.2,
    key_work_sessions_due: 2,
    key_work_sessions_overdue: 0,
    staff_supervision_compliance_pct: 95,
    management_oversight_current: true,
    ofsted_readiness_score: 88,
    reg45_due_date: "2026-06-01",
    reg44_due_date: "2026-05-28",
    cara_alerts: [],
    cara_risk_factors: [
      { factor: "Night staff supervision gap", severity: "low", trend: "improving" },
    ],
    cara_recommendations: [
      { recommendation: "Complete night worker supervision by end of week", priority: "this_week", home_id: "home-oak", home_name: "Chamberlain House" },
    ],
    created_at: "2026-05-16T08:00:00Z",
  },
  {
    id: "snap-willow-1",
    organisation_id: "org-demo-1",
    snapshot_date: "2026-05-16",
    home_id: "home-willow",
    home_name: "Willow Lodge",
    total_children: 4,
    total_incidents_7d: 5,
    total_incidents_30d: 14,
    safeguarding_concerns_open: 2,
    risk_level_overall: "high",
    recording_compliance_pct: 61,
    avg_daily_log_quality: 5.8,
    key_work_sessions_due: 4,
    key_work_sessions_overdue: 3,
    staff_supervision_compliance_pct: 58,
    management_oversight_current: false,
    ofsted_readiness_score: 52,
    reg45_due_date: "2026-05-20",
    reg44_due_date: "2026-05-10",
    cara_alerts: [
      { id: "alert-1", severity: "critical", message: "Reg 44 visit overdue by 6 days", home_id: "home-willow", home_name: "Willow Lodge", category: "compliance", created_at: "2026-05-16T08:00:00Z" },
      { id: "alert-2", severity: "high", message: "2 open safeguarding concerns require RI oversight", home_id: "home-willow", home_name: "Willow Lodge", category: "safeguarding", created_at: "2026-05-16T08:00:00Z" },
      { id: "alert-3", severity: "high", message: "Recording compliance below 65% threshold", home_id: "home-willow", home_name: "Willow Lodge", category: "recording", created_at: "2026-05-16T08:00:00Z" },
    ],
    cara_risk_factors: [
      { factor: "Pattern of escalating incidents", severity: "high", trend: "worsening" },
      { factor: "Staff supervision below minimum", severity: "high", trend: "worsening" },
      { factor: "Management oversight lapsed", severity: "critical", trend: "worsening" },
    ],
    cara_recommendations: [
      { recommendation: "Urgent: Schedule RI visit to Willow Lodge within 48 hours", priority: "immediate", home_id: "home-willow", home_name: "Willow Lodge" },
      { recommendation: "Review safeguarding concerns with designated officer", priority: "immediate", home_id: "home-willow", home_name: "Willow Lodge" },
      { recommendation: "Implement supervision recovery plan for all staff", priority: "this_week", home_id: "home-willow", home_name: "Willow Lodge" },
    ],
    created_at: "2026-05-16T08:00:00Z",
  },
  {
    id: "snap-birch-1",
    organisation_id: "org-demo-1",
    snapshot_date: "2026-05-16",
    home_id: "home-birch",
    home_name: "Birch Cottage",
    total_children: 2,
    total_incidents_7d: 0,
    total_incidents_30d: 2,
    safeguarding_concerns_open: 0,
    risk_level_overall: "low",
    recording_compliance_pct: 97,
    avg_daily_log_quality: 9.1,
    key_work_sessions_due: 2,
    key_work_sessions_overdue: 0,
    staff_supervision_compliance_pct: 100,
    management_oversight_current: true,
    ofsted_readiness_score: 94,
    reg45_due_date: "2026-06-15",
    reg44_due_date: "2026-06-02",
    cara_alerts: [],
    cara_risk_factors: [],
    cara_recommendations: [
      { recommendation: "Continue current practices - exemplary performance", priority: "this_month", home_id: "home-birch", home_name: "Birch Cottage" },
    ],
    created_at: "2026-05-16T08:00:00Z",
  },
];

const DEMO_TRENDS: HomeTrendPoint[] = [
  { period_start: "2026-04-16", period_end: "2026-04-22", metric_value: 85 },
  { period_start: "2026-04-23", period_end: "2026-04-29", metric_value: 82 },
  { period_start: "2026-04-30", period_end: "2026-05-06", metric_value: 78 },
  { period_start: "2026-05-07", period_end: "2026-05-13", metric_value: 74 },
  { period_start: "2026-05-14", period_end: "2026-05-16", metric_value: 71 },
];

// ── Service Functions ────────────────────────────────────────────────────────

/**
 * Get the latest snapshot for each home in an organisation.
 */
export async function getLatestSnapshots(
  organisationId: string,
): Promise<ServiceResult<CrossHomeSnapshot[]>> {
  const s = sb();
  // No Supabase source (demo, or a MISCONFIGURED live tenant). A live tenant
  // must never be shown fictional peer homes — it degrades to empty, and the
  // page's own empty state renders. Overview/comparison/alerts all derive from
  // this, so gating here cascades to every cross-home view.
  if (!s) return { ok: true, data: isLiveTenant() ? [] : DEMO_SNAPSHOTS };

  const { data, error } = await (s.from("cs_cross_home_snapshots") as SB)
    .select("*")
    .eq("organisation_id", organisationId)
    .order("snapshot_date", { ascending: false })
    .limit(50);

  if (error) return { ok: false, error: error.message };

  // Deduplicate: keep only the latest per home
  const latestByHome = new Map<string, CrossHomeSnapshot>();
  for (const row of (data ?? []) as CrossHomeSnapshot[]) {
    if (!latestByHome.has(row.home_id)) {
      latestByHome.set(row.home_id, row);
    }
  }

  return { ok: true, data: Array.from(latestByHome.values()) };
}

/**
 * Get aggregated organisation-level overview stats.
 */
export async function getOrganisationOverview(
  organisationId: string,
): Promise<ServiceResult<OrganisationOverview>> {
  const snapshots = await getLatestSnapshots(organisationId);
  if (!snapshots.ok || !snapshots.data) {
    return { ok: false, error: snapshots.error ?? "Failed to load snapshots" };
  }

  const homes = snapshots.data;
  const overview: OrganisationOverview = {
    total_homes: homes.length,
    total_children: homes.reduce((sum, h) => sum + h.total_children, 0),
    total_incidents_7d: homes.reduce((sum, h) => sum + h.total_incidents_7d, 0),
    total_incidents_30d: homes.reduce((sum, h) => sum + h.total_incidents_30d, 0),
    safeguarding_concerns_open: homes.reduce((sum, h) => sum + h.safeguarding_concerns_open, 0),
    overall_compliance_pct: homes.length > 0
      ? Math.round(homes.reduce((sum, h) => sum + h.recording_compliance_pct, 0) / homes.length)
      : 0,
    homes_at_risk: homes.filter((h) => h.risk_level_overall === "high" || h.risk_level_overall === "critical").length,
    homes_compliant: homes.filter((h) => h.recording_compliance_pct >= 80).length,
    avg_ofsted_readiness: homes.length > 0
      ? Math.round(homes.reduce((sum, h) => sum + h.ofsted_readiness_score, 0) / homes.length)
      : 0,
    key_work_overdue_total: homes.reduce((sum, h) => sum + h.key_work_sessions_overdue, 0),
  };

  return { ok: true, data: overview };
}

/**
 * Get trend data for a specific home and metric.
 */
export async function getHomeTrends(
  homeId: string,
  metric: string,
  days: number = 30,
): Promise<ServiceResult<HomeTrendPoint[]>> {
  const s = sb();
  if (!s) return { ok: true, data: isLiveTenant() ? [] : DEMO_TRENDS };

  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  const { data, error } = await (s.from("cs_cross_home_trends") as SB)
    .select("period_start, period_end, metric_value")
    .eq("home_id", homeId)
    .eq("metric_name", metric)
    .gte("period_end", startDate)
    .order("period_end", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

/**
 * Get side-by-side comparison matrix of all homes.
 */
export async function getComparisonMatrix(
  organisationId: string,
): Promise<ServiceResult<ComparisonRow[]>> {
  const snapshots = await getLatestSnapshots(organisationId);
  if (!snapshots.ok || !snapshots.data) {
    return { ok: false, error: snapshots.error ?? "Failed to load snapshots" };
  }

  const homes = snapshots.data;

  const metrics: { key: keyof CrossHomeSnapshot; label: string; threshold?: [number, number] }[] = [
    { key: "total_incidents_7d", label: "Incidents (7 days)" },
    { key: "total_incidents_30d", label: "Incidents (30 days)" },
    { key: "safeguarding_concerns_open", label: "Open Safeguarding Concerns" },
    { key: "recording_compliance_pct", label: "Recording Compliance %" },
    { key: "staff_supervision_compliance_pct", label: "Supervision Compliance %" },
    { key: "ofsted_readiness_score", label: "Ofsted Readiness Score" },
    { key: "key_work_sessions_overdue", label: "Key Work Sessions Overdue" },
  ];

  const rows: ComparisonRow[] = metrics.map((m) => ({
    metric: m.label,
    values: homes.map((h) => {
      const raw = h[m.key] as number;
      // For incidents/overdue: lower is better (invert threshold logic)
      const isInverted = m.key.includes("incident") || m.key.includes("overdue") || m.key.includes("safeguarding");
      let status: "green" | "amber" | "red";
      if (isInverted) {
        status = raw === 0 ? "green" : raw <= 3 ? "amber" : "red";
      } else {
        status = statusFromPct(raw);
      }
      return { home_id: h.home_id, home_name: h.home_name, value: raw, status };
    }),
  }));

  return { ok: true, data: rows };
}

/**
 * Generate a fresh snapshot for a specific home (or all homes).
 */
export async function generateSnapshot(
  organisationId: string,
  homeId?: string,
): Promise<ServiceResult<{ generated: number }>> {
  const s = sb();
  if (!s) {
    // Demo mode: pretend we generated
    return { ok: true, data: { generated: homeId ? 1 : 3 } };
  }

  // Get homes for this org
  let homeQuery = (s.from("cs_homes") as SB)
    .select("id, name")
    .eq("org_id", organisationId);
  if (homeId) homeQuery = homeQuery.eq("id", homeId);

  const { data: homes, error: homesError } = await homeQuery;
  if (homesError) return { ok: false, error: homesError.message };
  if (!homes || homes.length === 0) return { ok: true, data: { generated: 0 } };

  let generated = 0;
  const today = new Date().toISOString().split("T")[0];

  for (const home of homes as { id: string; name: string }[]) {
    // Count children
    const { count: childrenCount } = await (s.from("cs_children_homes") as SB)
      .select("*", { count: "exact", head: true })
      .eq("home_id", home.id)
      .eq("status", "active");

    // Count incidents (7d)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count: incidents7d } = await (s.from("cs_incidents") as SB)
      .select("*", { count: "exact", head: true })
      .eq("home_id", home.id)
      .gte("created_at", sevenDaysAgo);

    // Count incidents (30d)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count: incidents30d } = await (s.from("cs_incidents") as SB)
      .select("*", { count: "exact", head: true })
      .eq("home_id", home.id)
      .gte("created_at", thirtyDaysAgo);

    // Count open safeguarding concerns
    const { count: safeguardingOpen } = await (s.from("cs_safeguarding_concerns") as SB)
      .select("*", { count: "exact", head: true })
      .eq("home_id", home.id)
      .eq("status", "open");

    // Count daily logs (30d) for compliance
    const { count: logsCount } = await (s.from("cs_daily_logs") as SB)
      .select("*", { count: "exact", head: true })
      .eq("home_id", home.id)
      .gte("created_at", thirtyDaysAgo);

    const expectedLogs = (childrenCount ?? 0) * 30;
    const recordingCompliance = expectedLogs > 0
      ? Math.min(100, Math.round(((logsCount ?? 0) / expectedLogs) * 100))
      : 0;

    // Key work sessions
    const { count: kwDue } = await (s.from("cs_key_work_sessions") as SB)
      .select("*", { count: "exact", head: true })
      .eq("home_id", home.id)
      .eq("status", "scheduled");

    const { count: kwOverdue } = await (s.from("cs_key_work_sessions") as SB)
      .select("*", { count: "exact", head: true })
      .eq("home_id", home.id)
      .eq("status", "overdue");

    // Determine risk level
    let riskLevel = "low";
    if ((safeguardingOpen ?? 0) > 0 || (incidents7d ?? 0) >= 5) riskLevel = "high";
    else if ((incidents7d ?? 0) >= 3 || recordingCompliance < 60) riskLevel = "medium";

    // Upsert snapshot
    const { error: upsertError } = await (s.from("cs_cross_home_snapshots") as SB)
      .upsert({
        organisation_id: organisationId,
        snapshot_date: today,
        home_id: home.id,
        home_name: home.name,
        total_children: childrenCount ?? 0,
        total_incidents_7d: incidents7d ?? 0,
        total_incidents_30d: incidents30d ?? 0,
        safeguarding_concerns_open: safeguardingOpen ?? 0,
        risk_level_overall: riskLevel,
        recording_compliance_pct: recordingCompliance,
        key_work_sessions_due: kwDue ?? 0,
        key_work_sessions_overdue: kwOverdue ?? 0,
        created_at: new Date().toISOString(),
      }, { onConflict: "organisation_id,snapshot_date,home_id" });

    if (!upsertError) generated++;
  }

  return { ok: true, data: { generated } };
}

/**
 * Get cross-home alerts (critical/high items across all homes).
 */
export async function getAlerts(
  organisationId: string,
): Promise<ServiceResult<CrossHomeAlert[]>> {
  const snapshots = await getLatestSnapshots(organisationId);
  if (!snapshots.ok || !snapshots.data) {
    return { ok: false, error: snapshots.error ?? "Failed to load snapshots" };
  }

  const alerts: CrossHomeAlert[] = [];

  for (const home of snapshots.data) {
    // Add Cara alerts from snapshot
    for (const alert of home.cara_alerts) {
      alerts.push({
        ...alert,
        action_required: "Review and address",
      });
    }

    // Generate alerts from metrics
    if (home.recording_compliance_pct < 60) {
      alerts.push({
        id: `gen-rec-${home.home_id}`,
        severity: "high",
        message: `Recording compliance critically low at ${home.recording_compliance_pct}%`,
        home_id: home.home_id,
        home_name: home.home_name,
        category: "compliance",
        action_required: "Investigate recording gaps and implement recovery plan",
        created_at: home.created_at,
      });
    }

    if (home.safeguarding_concerns_open > 0) {
      alerts.push({
        id: `gen-sg-${home.home_id}`,
        severity: "critical",
        message: `${home.safeguarding_concerns_open} open safeguarding concern(s) requiring oversight`,
        home_id: home.home_id,
        home_name: home.home_name,
        category: "safeguarding",
        action_required: "Ensure designated officer review and RI notification",
        created_at: home.created_at,
      });
    }

    if (home.key_work_sessions_overdue > 2) {
      alerts.push({
        id: `gen-kw-${home.home_id}`,
        severity: "medium",
        message: `${home.key_work_sessions_overdue} key work sessions overdue`,
        home_id: home.home_id,
        home_name: home.home_name,
        category: "key_work",
        action_required: "Manager to reschedule overdue sessions within 7 days",
        created_at: home.created_at,
      });
    }

    if (!home.management_oversight_current) {
      alerts.push({
        id: `gen-mo-${home.home_id}`,
        severity: "high",
        message: `Management oversight not current for ${home.home_name}`,
        home_id: home.home_id,
        home_name: home.home_name,
        category: "oversight",
        action_required: "Schedule management review immediately",
        created_at: home.created_at,
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return { ok: true, data: alerts };
}
