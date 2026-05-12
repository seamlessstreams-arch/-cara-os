"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA INTELLIGENCE DASHBOARD
//
// The main entry point for ARIA. Displays key metrics, recent reports, and
// quick-action links for report generation, the reports list, and Reg 45
// evidence. Fetches live data from the dashboard and reports list APIs.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardSummary, ChildReport } from "@/types/aria-reports";
import {
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
} from "@/types/aria-reports";
import { AriaActivityCard } from "@/components/aria/aria-activity-card";
import { AriaPendingBanner } from "@/components/aria/aria-pending-banner";
import { AriaHistoryTimeline } from "@/components/aria/aria-history-timeline";
import { AriaConfidenceBreakdown } from "@/components/aria/aria-confidence-breakdown";
import { AriaModuleCoverage } from "@/components/aria/aria-module-coverage";
import { AriaProviderStatus } from "@/components/aria/aria-provider-status";
import { AriaOnboardingCard } from "@/components/aria/aria-onboarding-card";
import { AriaInsightCard } from "@/components/aria/aria-insight-card";
import { AriaReg45Evidence } from "@/components/aria/aria-reg45-evidence";
import { AriaRiskMatrix } from "@/components/aria/aria-risk-matrix";
import { AriaComplianceCalendar } from "@/components/aria/aria-compliance-calendar";
import {
  Sparkles,
  FileText,
  AlertTriangle,
  Users,
  ClipboardCheck,
  Clock,
  ShieldAlert,
  BarChart3,
  FileWarning,
  Plus,
  List,
  Scale,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_HOME_ID = "demo-home";

// ── Child name lookup (demo) ────────────────────────────────────────────────

const CHILD_NAMES: Record<string, string> = {
  "demo-child-1": "Jayden Mitchell",
  "demo-child-2": "Amara Osei",
  "demo-child-3": "Reuben Walsh",
  "demo-child": "Jayden Mitchell",
};

// ── Status badge variant mapping ────────────────────────────────────────────

function statusBadgeVariant(status: string) {
  switch (status) {
    case "draft":
      return "warning" as const;
    case "pending_review":
      return "info" as const;
    case "approved":
      return "success" as const;
    case "rejected":
      return "destructive" as const;
    case "locked":
      return "purple" as const;
    case "archived":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function AriaDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [reports, setReports] = useState<ChildReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(
          `/api/aria/dashboard?homeId=${DEFAULT_HOME_ID}`,
        );
        const json = await res.json();
        if (json.ok) setDashboard(json.data);
      } catch (err) {
        console.error("[aria/dashboard] Failed to fetch dashboard:", err);
      }
    }
    fetchDashboard();
  }, []);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(
          `/api/aria/reports/list?homeId=${DEFAULT_HOME_ID}&limit=5`,
        );
        const json = await res.json();
        if (json.ok) setReports(json.data);
      } catch (err) {
        console.error("[aria/dashboard] Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <PageShell
      title="ARIA Intelligence"
      subtitle="Reports, oversight & evidence intelligence"
    >
      {/* ── Gold intro banner ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-5 mb-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[var(--cs-aria-gold)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
                ARIA Intelligence
              </h2>
              <AriaProviderStatus />
            </div>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              ARIA generates evidence-based reports, identifies oversight gaps,
              surfaces risk patterns, and builds Regulation 45 evidence
              automatically. Every output requires human review before it
              reaches any record.
            </p>
          </div>
        </div>
      </div>

      {/* ── Onboarding (first-time users) ─────────────────────────────── */}
      <AriaOnboardingCard className="mb-6" />

      {/* ── Pending outputs banner ─────────────────────────────────────── */}
      <AriaPendingBanner
        actorUserId="staff_darren"
        actorRole="registered_manager"
        homeId={DEFAULT_HOME_ID}
        className="mb-6"
      />

      {/* ── Stats grid ───────────────────────────────────────────────────── */}
      {dashboard ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Reports This Week"
            value={dashboard.reportsThisWeek}
            icon={FileText}
            colour="text-[var(--cs-text-secondary)]"
            bg="bg-slate-50"
          />
          <StatCard
            label="Pending Review"
            value={dashboard.reportsPendingReview}
            icon={Clock}
            colour={
              dashboard.reportsPendingReview > 0
                ? "text-amber-700"
                : "text-[var(--cs-text-secondary)]"
            }
            bg={
              dashboard.reportsPendingReview > 0
                ? "bg-amber-50"
                : "bg-slate-50"
            }
            pulse={dashboard.reportsPendingReview > 0}
          />
          <StatCard
            label="High-Risk Flags"
            value={dashboard.highRiskFlags}
            icon={ShieldAlert}
            colour={
              dashboard.highRiskFlags > 0
                ? "text-red-700"
                : "text-[var(--cs-text-secondary)]"
            }
            bg={
              dashboard.highRiskFlags > 0 ? "bg-red-50" : "bg-slate-50"
            }
            pulse={dashboard.highRiskFlags > 0}
          />
          <StatCard
            label="Children Needing Oversight"
            value={dashboard.childrenNeedingOversight}
            icon={Users}
            colour="text-[var(--cs-text-secondary)]"
            bg="bg-slate-50"
          />
          <StatCard
            label="Reg 45 Evidence Items"
            value={dashboard.reg45ItemsThisMonth}
            icon={Scale}
            colour="text-[var(--cs-text-secondary)]"
            bg="bg-slate-50"
          />
          <StatCard
            label="Outstanding Actions"
            value={dashboard.outstandingActions}
            icon={ClipboardCheck}
            colour={
              dashboard.outstandingActions > 0
                ? "text-amber-700"
                : "text-[var(--cs-text-secondary)]"
            }
            bg={
              dashboard.outstandingActions > 0
                ? "bg-amber-50"
                : "bg-slate-50"
            }
          />
          <StatCard
            label="Evidence Gaps"
            value={dashboard.evidenceGaps}
            icon={AlertTriangle}
            colour="text-[var(--cs-text-secondary)]"
            bg="bg-slate-50"
          />
          <StatCard
            label="Weak Records"
            value={dashboard.weakRecords}
            icon={FileWarning}
            colour="text-[var(--cs-text-secondary)]"
            bg="bg-slate-50"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-50 px-4 py-3 animate-pulse h-[88px]"
            />
          ))}
        </div>
      )}

      {/* ── ARIA Command Activity ─────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[var(--cs-navy)] mb-4">
          Command Activity
        </h2>
        <AriaActivityCard homeId={DEFAULT_HOME_ID} days={30} />
      </div>

      {/* ── ARIA Proactive Insights ──────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[var(--cs-navy)] mb-4">
          Proactive Insights
        </h2>
        <AriaInsightCard homeId={DEFAULT_HOME_ID} limit={5} />
      </div>

      {/* ── Confidence & Module Coverage ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <AriaConfidenceBreakdown homeId={DEFAULT_HOME_ID} days={30} />
        <AriaModuleCoverage homeId={DEFAULT_HOME_ID} days={30} />
      </div>

      {/* ── My ARIA History ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[var(--cs-navy)] mb-4">
          My Recent History
        </h2>
        <AriaHistoryTimeline userId="staff_darren" days={30} limit={8} />
      </div>

      {/* ── Recent Reports ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--cs-navy)]">
            Recent Reports
          </h2>
          <Link href="/aria/reports">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-6 w-6 text-[var(--cs-text-gentle)] mx-auto mb-3 animate-spin" />
              <p className="text-sm text-[var(--cs-text-muted)]">
                Loading reports...
              </p>
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-3" />
              <p className="text-sm text-[var(--cs-text-muted)] font-medium">
                No reports have been generated yet.
              </p>
              <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                Generate your first report to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/aria/reports/${report.id}`}
                className="block rounded-xl border border-[var(--cs-border)] bg-white hover:shadow-md transition-all group"
              >
                <div className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="aria" className="text-[10px]">
                          {REPORT_TYPE_LABELS[report.report_type]}
                        </Badge>
                        <Badge
                          variant={statusBadgeVariant(report.status)}
                          className="text-[10px]"
                        >
                          {REPORT_STATUS_LABELS[report.status]}
                        </Badge>
                        {report.child_id && (
                          <span className="text-xs text-[var(--cs-text-muted)]">
                            {CHILD_NAMES[report.child_id] ?? report.child_id}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--cs-navy)] group-hover:text-blue-700 transition-colors line-clamp-1">
                        {report.title}
                      </h3>
                      <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                        {report.date_range_start} — {report.date_range_end}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] shrink-0 mt-1 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Reg 45 Evidence ────────────────────────────────────────────── */}
      <div className="mb-8">
        <AriaReg45Evidence homeId={DEFAULT_HOME_ID} />
      </div>

      {/* ── Risk Matrix ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <AriaRiskMatrix />
      </div>

      {/* ── Compliance Calendar ────────────────────────────────────────────── */}
      <div className="mb-8">
        <AriaComplianceCalendar />
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[var(--cs-navy)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/aria/reports/new">
            <Card className="hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] p-3">
                  <Plus className="h-5 w-5 text-[var(--cs-aria-gold)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--cs-navy)] group-hover:text-blue-700 transition-colors">
                    Generate New Report
                  </p>
                  <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                    Create a new ARIA-generated report
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/aria/reports">
            <Card className="hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3">
                  <List className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--cs-navy)] group-hover:text-blue-700 transition-colors">
                    View All Reports
                  </p>
                  <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                    Browse and filter generated reports
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/aria/reg45">
            <Card className="hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                <div className="rounded-xl bg-violet-50 p-3">
                  <Scale className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--cs-navy)] group-hover:text-blue-700 transition-colors">
                    Reg 45 Evidence
                  </p>
                  <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                    Monthly evidence collection
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  colour,
  bg,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colour: string;
  bg: string;
  pulse?: boolean;
}) {
  return (
    <div className={cn("rounded-xl px-4 py-3 relative", bg)}>
      <div className="flex items-center justify-between">
        <Icon className={cn("h-4 w-4", colour)} />
        {pulse && (
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>
      <div className={cn("text-2xl font-bold mt-1 tabular-nums", colour)}>
        {value}
      </div>
      <div className="text-[10px] text-[var(--cs-text-muted)] font-medium">
        {label}
      </div>
    </div>
  );
}
