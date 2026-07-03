"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE DASHBOARD
//
// The main entry point for Cara. Displays key metrics, recent reports, and
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
import type { DashboardSummary, ChildReport } from "@/types/cara-reports";
import {
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
} from "@/types/cara-reports";
import { CaraActivityCard } from "@/components/cara/cara-activity-card";
import { CaraPendingBanner } from "@/components/cara/cara-pending-banner";
import { CaraHistoryTimeline } from "@/components/cara/cara-history-timeline";
import { CaraConfidenceBreakdown } from "@/components/cara/cara-confidence-breakdown";
import { CaraModuleCoverage } from "@/components/cara/cara-module-coverage";
import { CaraProviderStatus } from "@/components/cara/cara-provider-status";
import { CaraOnboardingCard } from "@/components/cara/cara-onboarding-card";
import { CaraInsightCard } from "@/components/cara/cara-insight-card";
import { CaraReg45Evidence } from "@/components/cara/cara-reg45-evidence";
import { CaraRiskMatrix } from "@/components/cara/cara-risk-matrix";
import { CaraComplianceCalendar } from "@/components/cara/cara-compliance-calendar";
import { CaraRegulationChecker } from "@/components/cara/cara-regulation-checker";
import { CaraPatternAlert } from "@/components/cara/cara-pattern-alert";
import { CaraDocumentIntelligence } from "@/components/cara/cara-document-intelligence";
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

export default function CaraDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [reports, setReports] = useState<ChildReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(
          `/api/cara/dashboard?homeId=${DEFAULT_HOME_ID}`,
        );
        const json = await res.json();
        if (json.ok) setDashboard(json.data);
      } catch (err) {
        console.error("[cara/dashboard] Failed to fetch dashboard:", err);
      }
    }
    fetchDashboard();
  }, []);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(
          `/api/cara/reports/list?homeId=${DEFAULT_HOME_ID}&limit=5`,
        );
        const json = await res.json();
        if (json.ok) setReports(json.data);
      } catch (err) {
        console.error("[cara/dashboard] Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <PageShell
      title="Cara Intelligence"
      subtitle="Reports, oversight & evidence intelligence"
    >
      {/* ── Gold intro banner ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-5 mb-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[var(--cs-cara-gold)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
                Cara Intelligence
              </h2>
              <CaraProviderStatus />
            </div>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              Cara generates evidence-based reports, identifies oversight gaps,
              surfaces risk patterns, and builds Regulation 45 evidence
              automatically. Every output requires human review before it
              reaches any record.
            </p>
          </div>
        </div>
      </div>

      {/* ── Onboarding (first-time users) ─────────────────────────────── */}
      <CaraOnboardingCard className="mb-6" />

      {/* ── Pending outputs banner ─────────────────────────────────────── */}
      <CaraPendingBanner
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

      {/* ── Cara Command Activity ─────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[var(--cs-navy)] mb-4">
          Command Activity
        </h2>
        <CaraActivityCard homeId={DEFAULT_HOME_ID} days={30} />
      </div>

      {/* ── Cara Proactive Insights ──────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[var(--cs-navy)] mb-4">
          Proactive Insights
        </h2>
        <CaraInsightCard homeId={DEFAULT_HOME_ID} limit={5} />
      </div>

      {/* ── Confidence & Module Coverage ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <CaraConfidenceBreakdown homeId={DEFAULT_HOME_ID} days={30} />
        <CaraModuleCoverage homeId={DEFAULT_HOME_ID} days={30} />
      </div>

      {/* ── My Cara History ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[var(--cs-navy)] mb-4">
          My Recent History
        </h2>
        <CaraHistoryTimeline userId="staff_darren" days={30} limit={8} />
      </div>

      {/* ── Recent Reports ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--cs-navy)]">
            Recent Reports
          </h2>
          <Link href="/cara/reports">
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
                href={`/cara/reports/${report.id}`}
                className="block rounded-xl border border-[var(--cs-border)] bg-white hover:bg-[var(--cs-surface)] transition-all group"
              >
                <div className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="cara" className="text-[10px]">
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
        <CaraReg45Evidence homeId={DEFAULT_HOME_ID} />
      </div>

      {/* ── Pattern Intelligence ─────────────────────────────────────────── */}
      <div className="mb-8">
        <CaraPatternAlert homeId="home_oak" />
      </div>

      {/* ── Risk Matrix ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <CaraRiskMatrix />
      </div>

      {/* ── Compliance Calendar ────────────────────────────────────────────── */}
      <div className="mb-8">
        <CaraComplianceCalendar />
      </div>

      {/* ── Regulation Compliance Checker ─────────────────────────────────── */}
      <div className="mb-8">
        <CaraRegulationChecker />
      </div>

      {/* ── Document Intelligence ──────────────────────────────────────────── */}
      <div className="mb-8">
        <CaraDocumentIntelligence />
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[var(--cs-navy)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/cara/reports/new">
            <Card className="hover:bg-[var(--cs-surface)] transition-all cursor-pointer group h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                <div className="rounded-xl bg-[var(--cs-cara-gold-bg)] p-3">
                  <Plus className="h-5 w-5 text-[var(--cs-cara-gold)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--cs-navy)] group-hover:text-blue-700 transition-colors">
                    Generate New Report
                  </p>
                  <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                    Create a new Cara-generated report
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cara/reports">
            <Card className="hover:bg-[var(--cs-surface)] transition-all cursor-pointer group h-full">
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

          <Link href="/cara/reg45">
            <Card className="hover:bg-[var(--cs-surface)] transition-all cursor-pointer group h-full">
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
