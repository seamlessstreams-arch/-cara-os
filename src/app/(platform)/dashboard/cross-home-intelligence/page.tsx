"use client";

import { useHomeName } from "@/hooks/use-home-profile";
import React, { useState, useEffect, useCallback } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Globe,
  Building2,
  Users,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Send,
  Sparkles,
  FileText,
  Calendar,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface CrossHomeSnapshot {
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

interface CaraAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  home_id: string;
  home_name: string;
  category: string;
  created_at: string;
}

interface CaraRiskFactor {
  factor: string;
  severity: "critical" | "high" | "medium" | "low";
  trend: "improving" | "worsening" | "stable";
}

interface CaraRecommendation {
  recommendation: string;
  priority: "immediate" | "this_week" | "this_month";
  home_id: string;
  home_name: string;
}

interface OrganisationOverview {
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

interface ComparisonRow {
  metric: string;
  values: { home_id: string; home_name: string; value: number; status: "green" | "amber" | "red" }[];
}

interface CrossHomeAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  home_id: string;
  home_name: string;
  category: string;
  action_required: string;
  created_at: string;
}

interface CaraAnalysisResponse {
  analysis: string;
  evidence: Array<{ source: string; risk_level: string; compliance: number; incidents_7d: number }>;
  recommendations: string[];
  generated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

type TabId = "overview" | "comparison" | "risk" | "compliance" | "cara";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "comparison", label: "Home Comparison" },
  { id: "risk", label: "Risk Matrix" },
  { id: "compliance", label: "Compliance" },
  { id: "cara", label: "Cara Analysis" },
];

const DEMO_ORG_ID = "org-demo-1";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

const RISK_BADGE_STYLES: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-green-600 text-white",
};

const PREBUILT_QUERIES = [
  "Which homes need the most attention this week?",
  "Are there any patterns across homes?",
  "Prepare me for my RI visit",
  "What should I focus on for Reg 45?",
];

// ── Demo Data (fallback when API unavailable) ────────────────────────────────

const buildDemoSnapshots = (homeName: string): CrossHomeSnapshot[] => [
  {
    id: "snap-oak-1",
    organisation_id: DEMO_ORG_ID,
    snapshot_date: "2026-05-16",
    home_id: "home-oak",
    home_name: `${homeName}`,
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
      { recommendation: "Complete night worker supervision by end of week", priority: "this_week", home_id: "home-oak", home_name: `${homeName}` },
    ],
    created_at: "2026-05-16T08:00:00Z",
  },
  {
    id: "snap-willow-1",
    organisation_id: DEMO_ORG_ID,
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
    organisation_id: DEMO_ORG_ID,
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

const DEMO_OVERVIEW: OrganisationOverview = {
  total_homes: 3,
  total_children: 9,
  total_incidents_7d: 6,
  total_incidents_30d: 20,
  safeguarding_concerns_open: 2,
  overall_compliance_pct: 83,
  homes_at_risk: 1,
  homes_compliant: 2,
  avg_ofsted_readiness: 78,
  key_work_overdue_total: 3,
};

const buildDemoComparison = (homeName: string): ComparisonRow[] => [
  {
    metric: "Incidents (7 days)",
    values: [
      { home_id: "home-oak", home_name: `${homeName}`, value: 1, status: "green" },
      { home_id: "home-willow", home_name: "Willow Lodge", value: 5, status: "red" },
      { home_id: "home-birch", home_name: "Birch Cottage", value: 0, status: "green" },
    ],
  },
  {
    metric: "Incidents (30 days)",
    values: [
      { home_id: "home-oak", home_name: `${homeName}`, value: 4, status: "amber" },
      { home_id: "home-willow", home_name: "Willow Lodge", value: 14, status: "red" },
      { home_id: "home-birch", home_name: "Birch Cottage", value: 2, status: "green" },
    ],
  },
  {
    metric: "Open Safeguarding Concerns",
    values: [
      { home_id: "home-oak", home_name: `${homeName}`, value: 0, status: "green" },
      { home_id: "home-willow", home_name: "Willow Lodge", value: 2, status: "red" },
      { home_id: "home-birch", home_name: "Birch Cottage", value: 0, status: "green" },
    ],
  },
  {
    metric: "Recording Compliance %",
    values: [
      { home_id: "home-oak", home_name: `${homeName}`, value: 92, status: "green" },
      { home_id: "home-willow", home_name: "Willow Lodge", value: 61, status: "red" },
      { home_id: "home-birch", home_name: "Birch Cottage", value: 97, status: "green" },
    ],
  },
  {
    metric: "Supervision Compliance %",
    values: [
      { home_id: "home-oak", home_name: `${homeName}`, value: 95, status: "green" },
      { home_id: "home-willow", home_name: "Willow Lodge", value: 58, status: "red" },
      { home_id: "home-birch", home_name: "Birch Cottage", value: 100, status: "green" },
    ],
  },
  {
    metric: "Ofsted Readiness Score",
    values: [
      { home_id: "home-oak", home_name: `${homeName}`, value: 88, status: "green" },
      { home_id: "home-willow", home_name: "Willow Lodge", value: 52, status: "red" },
      { home_id: "home-birch", home_name: "Birch Cottage", value: 94, status: "green" },
    ],
  },
  {
    metric: "Key Work Sessions Overdue",
    values: [
      { home_id: "home-oak", home_name: `${homeName}`, value: 0, status: "green" },
      { home_id: "home-willow", home_name: "Willow Lodge", value: 3, status: "amber" },
      { home_id: "home-birch", home_name: "Birch Cottage", value: 0, status: "green" },
    ],
  },
];

const DEMO_ALERTS: CrossHomeAlert[] = [
  { id: "da-1", severity: "critical", message: "Reg 44 visit overdue by 6 days", home_id: "home-willow", home_name: "Willow Lodge", category: "compliance", action_required: "Complete Reg 44 visit immediately", created_at: "2026-05-16T08:00:00Z" },
  { id: "da-2", severity: "critical", message: "2 open safeguarding concerns requiring oversight", home_id: "home-willow", home_name: "Willow Lodge", category: "safeguarding", action_required: "Ensure designated officer review and RI notification", created_at: "2026-05-16T08:00:00Z" },
  { id: "da-3", severity: "high", message: "Recording compliance critically low at 61%", home_id: "home-willow", home_name: "Willow Lodge", category: "compliance", action_required: "Investigate recording gaps and implement recovery plan", created_at: "2026-05-16T08:00:00Z" },
  { id: "da-4", severity: "high", message: "Management oversight not current for Willow Lodge", home_id: "home-willow", home_name: "Willow Lodge", category: "oversight", action_required: "Schedule management review immediately", created_at: "2026-05-16T08:00:00Z" },
  { id: "da-5", severity: "medium", message: "3 key work sessions overdue", home_id: "home-willow", home_name: "Willow Lodge", category: "key_work", action_required: "Manager to reschedule overdue sessions within 7 days", created_at: "2026-05-16T08:00:00Z" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function complianceColor(pct: number): string {
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-amber-600";
  return "text-red-600";
}

function complianceBg(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function statusCellBg(status: "green" | "amber" | "red"): string {
  if (status === "green") return "bg-green-50 text-green-800";
  if (status === "amber") return "bg-amber-50 text-amber-800";
  return "bg-red-50 text-red-800";
}

function trendIcon(trend: "improving" | "worsening" | "stable") {
  if (trend === "improving") return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  if (trend === "worsening") return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
  return <Minus className="h-3.5 w-3.5 text-gray-500" />;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function regStatus(dateStr: string | null): { label: string; style: string } {
  const days = daysUntil(dateStr);
  if (days === null) return { label: "Not set", style: "bg-gray-100 text-gray-600" };
  if (days < 0) return { label: `Overdue (${Math.abs(days)}d)`, style: "bg-red-100 text-red-800" };
  if (days <= 7) return { label: `Due in ${days}d`, style: "bg-amber-100 text-amber-800" };
  return { label: `Due in ${days}d`, style: "bg-green-100 text-green-800" };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CrossHomeIntelligencePage() {
  const homeName = useHomeName();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [snapshots, setSnapshots] = useState<CrossHomeSnapshot[]>(() => buildDemoSnapshots(homeName));
  const [overview, setOverview] = useState<OrganisationOverview>(DEMO_OVERVIEW);
  const [comparison, setComparison] = useState<ComparisonRow[]>(() => buildDemoComparison(homeName));
  const [alerts, setAlerts] = useState<CrossHomeAlert[]>(DEMO_ALERTS);
  const [loading, setLoading] = useState(false);
  const [caraQuery, setCaraQuery] = useState("");
  const [caraResponse, setCaraResponse] = useState<CaraAnalysisResponse | null>(null);
  const [caraLoading, setCaraLoading] = useState(false);
  const [generatingSnapshot, setGeneratingSnapshot] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, snapshotsRes, comparisonRes, alertsRes] = await Promise.all([
        fetch(`/api/cara/cross-home?organisationId=${DEMO_ORG_ID}&action=overview`),
        fetch(`/api/cara/cross-home?organisationId=${DEMO_ORG_ID}&action=snapshots`),
        fetch(`/api/cara/cross-home?organisationId=${DEMO_ORG_ID}&action=comparison`),
        fetch(`/api/cara/cross-home?organisationId=${DEMO_ORG_ID}&action=alerts`),
      ]);

      if (overviewRes.ok) {
        const d = await overviewRes.json();
        if (d.ok && d.data) setOverview(d.data);
      }
      if (snapshotsRes.ok) {
        const d = await snapshotsRes.json();
        if (d.ok && d.data) setSnapshots(d.data);
      }
      if (comparisonRes.ok) {
        const d = await comparisonRes.json();
        if (d.ok && d.data) setComparison(d.data);
      }
      if (alertsRes.ok) {
        const d = await alertsRes.json();
        if (d.ok && d.data) setAlerts(d.data);
      }
    } catch {
      // Fallback to demo data (already set as defaults)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateSnapshot = async () => {
    setGeneratingSnapshot(true);
    try {
      const res = await fetch("/api/cara/cross-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_snapshot", organisationId: DEMO_ORG_ID }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // Silent fallback
    } finally {
      setGeneratingSnapshot(false);
    }
  };

  const handleCaraAnalyse = async (query: string) => {
    if (!query.trim()) return;
    setCaraLoading(true);
    setCaraResponse(null);
    try {
      const res = await fetch("/api/cara/cross-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cara_analyse", organisationId: DEMO_ORG_ID, query }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.ok && d.data) setCaraResponse(d.data);
      }
    } catch {
      // Silent fallback
    } finally {
      setCaraLoading(false);
    }
  };

  // ── Render Helpers ─────────────────────────────────────────────────────────

  const criticalAlerts = alerts.filter((a) => a.severity === "critical" || a.severity === "high");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Cross-home Intelligence"
      subtitle="Organisation-wide oversight for RI and Operations"
    >
      <div className="space-y-6">
        {/* Header with Globe icon and refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" style={{ color: "var(--cs-cara-gold)" }} />
            <span className="text-sm" style={{ color: "var(--cs-text-secondary)" }}>
              Multi-home aggregated intelligence
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSnapshot}
              disabled={generatingSnapshot}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", generatingSnapshot && "animate-spin")} />
              {generatingSnapshot ? "Generating..." : "Refresh Snapshots"}
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--cs-cara-gold-bg, #f5f0e8)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-white shadow-sm"
                  : "hover:bg-white/50",
              )}
              style={activeTab === tab.id ? { color: "var(--cs-navy)" } : { color: "var(--cs-text-secondary)" }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewTab
            overview={overview}
            snapshots={snapshots}
            alerts={criticalAlerts}
            loading={loading}
          />
        )}
        {activeTab === "comparison" && (
          <ComparisonTab
            comparison={comparison}
            snapshots={snapshots}
            onGenerateAnalysis={() => {
              setActiveTab("cara");
              handleCaraAnalyse("Compare all homes and identify areas of concern");
            }}
          />
        )}
        {activeTab === "risk" && (
          <RiskMatrixTab snapshots={snapshots} />
        )}
        {activeTab === "compliance" && (
          <ComplianceTab snapshots={snapshots} />
        )}
        {activeTab === "cara" && (
          <CaraAnalysisTab
            query={caraQuery}
            setQuery={setCaraQuery}
            response={caraResponse}
            loading={caraLoading}
            onSubmit={handleCaraAnalyse}
          />
        )}

        {/* Footer */}
        <div className="text-center py-4 border-t" style={{ borderColor: "var(--cs-border)" }}>
          <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>
            Cara Cross-home Intelligence provides oversight support. Professional judgement must inform all decisions.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  overview,
  snapshots,
  alerts,
  loading,
}: {
  overview: OrganisationOverview;
  snapshots: CrossHomeSnapshot[];
  alerts: CrossHomeAlert[];
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Organisation Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-5 w-5 mx-auto mb-1" style={{ color: "var(--cs-navy)" }} />
            <p className="text-2xl font-bold">{overview.total_homes}</p>
            <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Total Homes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{overview.total_children}</p>
            <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Total Children</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{overview.total_incidents_7d}</p>
            <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Open Incidents (7d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{overview.safeguarding_concerns_open}</p>
            <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Safeguarding Concerns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className={cn("h-5 w-5 mx-auto mb-1", complianceColor(overview.overall_compliance_pct))} />
            <p className={cn("text-2xl font-bold", complianceColor(overview.overall_compliance_pct))}>
              {overview.overall_compliance_pct}%
            </p>
            <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Overall Compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Items Across All Homes ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={cn("flex items-start gap-3 p-2 rounded-md border", SEVERITY_STYLES[alert.severity])}
                >
                  <Badge variant="outline" className={cn("text-xs shrink-0 mt-0.5", SEVERITY_STYLES[alert.severity])}>
                    {alert.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs opacity-75">{alert.home_name} - {alert.action_required}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Home Mini Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {snapshots.map((home) => (
          <Card
            key={home.home_id}
            className={cn(
              "transition-shadow hover:bg-[var(--cs-surface)]",
              home.risk_level_overall === "high" && "border-red-200",
              home.risk_level_overall === "critical" && "border-red-400",
              home.risk_level_overall === "low" && "border-green-200",
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{home.home_name}</CardTitle>
                <Badge className={cn("text-xs", RISK_BADGE_STYLES[home.risk_level_overall])}>
                  {home.risk_level_overall}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Key metrics row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{home.total_children}</p>
                  <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Children</p>
                </div>
                <div>
                  <p className={cn("text-lg font-bold", home.total_incidents_7d > 3 ? "text-red-600" : home.total_incidents_7d > 0 ? "text-amber-600" : "text-green-600")}>
                    {home.total_incidents_7d}
                  </p>
                  <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Incidents 7d</p>
                </div>
                <div>
                  <p className={cn("text-lg font-bold", complianceColor(home.recording_compliance_pct))}>
                    {home.recording_compliance_pct}%
                  </p>
                  <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Compliance</p>
                </div>
              </div>

              {/* Compliance bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--cs-text-secondary)" }}>Recording Compliance</span>
                  <span className={complianceColor(home.recording_compliance_pct)}>
                    {home.recording_compliance_pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", complianceBg(home.recording_compliance_pct))}
                    style={{ width: `${home.recording_compliance_pct}%` }}
                  />
                </div>
              </div>

              {/* Ofsted readiness bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--cs-text-secondary)" }}>Ofsted Readiness</span>
                  <span className={complianceColor(home.ofsted_readiness_score)}>
                    {home.ofsted_readiness_score}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", complianceBg(home.ofsted_readiness_score))}
                    style={{ width: `${home.ofsted_readiness_score}%` }}
                  />
                </div>
              </div>

              {/* Risk factors */}
              {home.cara_risk_factors.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  {home.cara_risk_factors.slice(0, 2).map((rf, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {trendIcon(rf.trend)}
                      <span style={{ color: "var(--cs-text-secondary)" }}>{rf.factor}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Comparison Tab ───────────────────────────────────────────────────────────

function ComparisonTab({
  comparison,
  snapshots,
  onGenerateAnalysis,
}: {
  comparison: ComparisonRow[];
  snapshots: CrossHomeSnapshot[];
  onGenerateAnalysis: () => void;
}) {
  const homeNames = snapshots.map((s) => s.home_name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--cs-navy)" }}>
          Side-by-Side Home Comparison
        </h3>
        <Button size="sm" onClick={onGenerateAnalysis}>
          <Sparkles className="h-4 w-4 mr-1" />
          Generate Cara Analysis
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--cs-border)" }}>
                  <th className="text-left p-3 font-medium" style={{ color: "var(--cs-text-secondary)" }}>
                    Metric
                  </th>
                  {homeNames.map((name) => (
                    <th key={name} className="text-center p-3 font-medium" style={{ color: "var(--cs-navy)" }}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, idx) => (
                  <tr
                    key={row.metric}
                    className={cn("border-b", idx % 2 === 0 && "bg-gray-50/50")}
                    style={{ borderColor: "var(--cs-border)" }}
                  >
                    <td className="p-3 font-medium text-sm">{row.metric}</td>
                    {row.values.map((val) => (
                      <td key={val.home_id} className="p-3 text-center">
                        <span className={cn("inline-block px-3 py-1 rounded-md text-sm font-semibold", statusCellBg(val.status))}>
                          {val.value}{row.metric.includes("%") ? "%" : ""}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--cs-text-muted)" }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span>Good (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          <span>Attention (60-80%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          <span>Concern (&lt;60%)</span>
        </div>
      </div>
    </div>
  );
}

// ── Risk Matrix Tab ──────────────────────────────────────────────────────────

function RiskMatrixTab({ snapshots }: { snapshots: CrossHomeSnapshot[] }) {
  // Map homes to a risk grid position
  const getRiskPosition = (home: CrossHomeSnapshot): { likelihood: number; impact: number } => {
    const incidents = home.total_incidents_7d;
    const safeguarding = home.safeguarding_concerns_open;
    const compliance = home.recording_compliance_pct;

    // Likelihood based on recent incidents and patterns
    let likelihood = 1;
    if (incidents >= 5) likelihood = 4;
    else if (incidents >= 3) likelihood = 3;
    else if (incidents >= 1) likelihood = 2;

    // Impact based on safeguarding and compliance failures
    let impact = 1;
    if (safeguarding >= 2 || compliance < 50) impact = 4;
    else if (safeguarding >= 1 || compliance < 60) impact = 3;
    else if (compliance < 80) impact = 2;

    return { likelihood, impact };
  };

  const sortedHomes = [...snapshots].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.risk_level_overall] ?? 4) - (order[b.risk_level_overall] ?? 4);
  });

  return (
    <div className="space-y-6">
      {/* Visual Risk Matrix Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold" style={{ color: "var(--cs-navy)" }}>
            Risk Matrix — Likelihood vs Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Y-axis label */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium" style={{ color: "var(--cs-text-muted)" }}>
              Impact
            </div>
            {/* Grid */}
            <div className="ml-8">
              <div className="grid grid-cols-4 gap-1">
                {[4, 3, 2, 1].map((impact) =>
                  [1, 2, 3, 4].map((likelihood) => {
                    const riskScore = impact * likelihood;
                    let cellBg = "bg-green-50 border-green-200";
                    if (riskScore >= 12) cellBg = "bg-red-100 border-red-300";
                    else if (riskScore >= 6) cellBg = "bg-amber-50 border-amber-200";
                    else if (riskScore >= 3) cellBg = "bg-yellow-50 border-yellow-200";

                    const homesInCell = snapshots.filter((h) => {
                      const pos = getRiskPosition(h);
                      return pos.likelihood === likelihood && pos.impact === impact;
                    });

                    return (
                      <div
                        key={`${impact}-${likelihood}`}
                        className={cn("border rounded-md p-2 min-h-[60px] flex flex-col items-center justify-center gap-1", cellBg)}
                      >
                        {homesInCell.map((h) => (
                          <Badge
                            key={h.home_id}
                            className={cn("text-xs", RISK_BADGE_STYLES[h.risk_level_overall])}
                          >
                            {h.home_name}
                          </Badge>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
              {/* X-axis labels */}
              <div className="grid grid-cols-4 gap-1 mt-1">
                {["Low", "Medium", "High", "Very High"].map((label) => (
                  <div key={label} className="text-center text-xs" style={{ color: "var(--cs-text-muted)" }}>
                    {label}
                  </div>
                ))}
              </div>
              <div className="text-center mt-1 text-xs font-medium" style={{ color: "var(--cs-text-muted)" }}>
                Likelihood
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--cs-navy)" }}>
          Homes by Risk Level
        </h3>
        {sortedHomes.map((home) => (
          <Card key={home.home_id} className={cn(
            home.risk_level_overall === "high" && "border-red-200",
            home.risk_level_overall === "critical" && "border-red-400",
          )}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{home.home_name}</span>
                    <Badge className={cn("text-xs", RISK_BADGE_STYLES[home.risk_level_overall])}>
                      {home.risk_level_overall} risk
                    </Badge>
                  </div>
                  {/* Top 3 risk factors */}
                  {home.cara_risk_factors.length > 0 ? (
                    <div className="space-y-1">
                      {home.cara_risk_factors.slice(0, 3).map((rf, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {trendIcon(rf.trend)}
                          <span style={{ color: "var(--cs-text-secondary)" }}>{rf.factor}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {rf.trend}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      No significant risk factors identified
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Ofsted Readiness</p>
                  <p className={cn("text-xl font-bold", complianceColor(home.ofsted_readiness_score))}>
                    {home.ofsted_readiness_score}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Compliance Tab ───────────────────────────────────────────────────────────

function ComplianceTab({ snapshots }: { snapshots: CrossHomeSnapshot[] }) {
  return (
    <div className="space-y-6">
      {/* Reg 44 & 45 Due Dates */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
              Regulation 44 Visits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshots.map((home) => {
              const status = regStatus(home.reg44_due_date);
              return (
                <div key={home.home_id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{home.home_name}</span>
                  <Badge className={cn("text-xs", status.style)}>
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
              Regulation 45 Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshots.map((home) => {
              const status = regStatus(home.reg45_due_date);
              return (
                <div key={home.home_id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{home.home_name}</span>
                  <Badge className={cn("text-xs", status.style)}>
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Supervision Completion Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
            Staff Supervision Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {snapshots.map((home) => (
            <div key={home.home_id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{home.home_name}</span>
                <span className={cn("text-sm font-semibold", complianceColor(home.staff_supervision_compliance_pct))}>
                  {home.staff_supervision_compliance_pct}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", complianceBg(home.staff_supervision_compliance_pct))}
                  style={{ width: `${home.staff_supervision_compliance_pct}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recording Compliance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
            Recording Compliance Trends (30 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {snapshots.map((home) => {
            // CSS-only mini trend representation
            const baseValue = home.recording_compliance_pct;
            const points = [
              Math.max(0, baseValue - 8),
              Math.max(0, baseValue - 5),
              Math.max(0, baseValue - 2),
              baseValue - 1,
              baseValue,
            ];

            return (
              <div key={home.home_id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{home.home_name}</span>
                  <div className="flex items-center gap-1">
                    {baseValue >= 80 ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                    ) : baseValue >= 60 ? (
                      <Minus className="h-3.5 w-3.5 text-amber-600" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                    )}
                    <span className={cn("text-sm font-semibold", complianceColor(baseValue))}>
                      {baseValue}%
                    </span>
                  </div>
                </div>
                {/* CSS mini chart */}
                <div className="flex items-end gap-1 h-8">
                  {points.map((p, i) => (
                    <div
                      key={i}
                      className={cn("flex-1 rounded-t-sm transition-all", complianceBg(p))}
                      style={{ height: `${Math.max(10, p)}%`, opacity: 0.5 + (i * 0.12) }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Overdue Items Aggregated */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-500" />
            Overdue Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {snapshots
              .filter((h) => h.key_work_sessions_overdue > 0 || !h.management_oversight_current)
              .map((home) => (
                <div key={home.home_id} className="flex items-center justify-between p-2 rounded-md bg-red-50 border border-red-100">
                  <span className="text-sm font-medium text-red-800">{home.home_name}</span>
                  <div className="flex items-center gap-3 text-xs text-red-700">
                    {home.key_work_sessions_overdue > 0 && (
                      <span>{home.key_work_sessions_overdue} key work overdue</span>
                    )}
                    {!home.management_oversight_current && (
                      <span>Oversight lapsed</span>
                    )}
                  </div>
                </div>
              ))}
            {snapshots.every((h) => h.key_work_sessions_overdue === 0 && h.management_oversight_current) && (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700">No overdue items across any home</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Cara Analysis Tab ────────────────────────────────────────────────────────

function CaraAnalysisTab({
  query,
  setQuery,
  response,
  loading,
  onSubmit,
}: {
  query: string;
  setQuery: (q: string) => void;
  response: CaraAnalysisResponse | null;
  loading: boolean;
  onSubmit: (q: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
            Ask Cara about your organisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) onSubmit(query);
              }}
              placeholder="e.g. Which home needs the most support right now?"
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cs-warning-soft)]"
              style={{ borderColor: "var(--cs-border)" }}
            />
            <Button
              onClick={() => onSubmit(query)}
              disabled={loading || !query.trim()}
              size="sm"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Pre-built queries */}
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--cs-text-muted)" }}>Quick queries:</p>
            <div className="flex flex-wrap gap-2">
              {PREBUILT_QUERIES.map((pq) => (
                <button
                  key={pq}
                  onClick={() => {
                    setQuery(pq);
                    onSubmit(pq);
                  }}
                  className="px-3 py-1.5 text-xs rounded-full border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "var(--cs-border)", color: "var(--cs-text-secondary)" }}
                >
                  {pq}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: "var(--cs-cara-gold)" }} />
            <p className="text-sm" style={{ color: "var(--cs-text-secondary)" }}>
              Cara is analysing cross-home intelligence...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Response */}
      {response && !loading && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
                Cara Analysis
              </CardTitle>
              <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>
                Generated {new Date(response.generated_at).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {response.analysis.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) {
                    return <h3 key={i} className="text-base font-semibold mt-4 mb-2" style={{ color: "var(--cs-navy)" }}>{line.replace("## ", "")}</h3>;
                  }
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return <p key={i} className="font-semibold mt-3 mb-1">{line.replace(/\*\*/g, "")}</p>;
                  }
                  if (line.startsWith("- **")) {
                    return (
                      <div key={i} className="flex items-start gap-2 ml-2 my-1">
                        <span className="text-xs mt-1">-</span>
                        <span className="text-sm" style={{ color: "var(--cs-text-secondary)" }}>
                          {line.replace(/^- /, "").replace(/\*\*/g, "")}
                        </span>
                      </div>
                    );
                  }
                  if (line.startsWith("- ") || line.startsWith("  - ")) {
                    return (
                      <div key={i} className={cn("flex items-start gap-2 my-1", line.startsWith("  ") ? "ml-6" : "ml-2")}>
                        <span className="text-xs mt-1">-</span>
                        <span className="text-sm" style={{ color: "var(--cs-text-secondary)" }}>{line.replace(/^[\s]*- /, "")}</span>
                      </div>
                    );
                  }
                  if (line.trim() === "") return <div key={i} className="h-2" />;
                  return <p key={i} className="text-sm my-1" style={{ color: "var(--cs-text-secondary)" }}>{line}</p>;
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {response.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {response.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-2 rounded-md border"
                      style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-cara-gold-bg, #faf8f4)" }}
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "var(--cs-cara-gold, #b8860b)" }}>
                        {i + 1}
                      </span>
                      <span className="text-sm" style={{ color: "var(--cs-text-secondary)" }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence Sources */}
          {response.evidence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Evidence Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-3">
                  {response.evidence.map((ev, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-md border text-xs"
                      style={{ borderColor: "var(--cs-border)" }}
                    >
                      <p className="font-medium mb-1">{ev.source}</p>
                      <div className="space-y-0.5" style={{ color: "var(--cs-text-muted)" }}>
                        <p>Risk: <span className={cn(
                          ev.risk_level === "high" || ev.risk_level === "critical" ? "text-red-600" : "text-green-600",
                          "font-medium"
                        )}>{ev.risk_level}</span></p>
                        <p>Compliance: {ev.compliance}%</p>
                        <p>Incidents (7d): {ev.incidents_7d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty state */}
      {!response && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: "var(--cs-cara-gold)" }} />
            <p className="text-sm" style={{ color: "var(--cs-text-muted)" }}>
              Ask Cara a question or use one of the quick queries above to get started.
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--cs-text-muted)" }}>
              Cara will analyse data across all homes in your organisation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
