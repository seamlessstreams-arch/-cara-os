"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SUPERVISION INTELLIGENCE CARD
// Manager dashboard card showing supervision compliance, quality scores,
// overdue staff alerts, and ARIA-generated improvement recommendations.
// Connects the supervision-service pure functions to live operational view.
// ══════════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, AlertTriangle, CheckCircle2, Clock, Brain,
  ChevronRight, TrendingUp, TrendingDown, Shield, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface SupervisionSummary {
  totalStaff: number;
  supervisedInPeriod: number;
  overdue: number;
  neverSupervised: number;
  compliancePercentage: number;
  avgWellbeing: number;
  avgPractice: number;
  safeguardingCoverage: number;
  qualityRating: "excellent" | "good" | "requires_improvement" | "inadequate";
  overdueStaff: { name: string; role: string; daysOverdue: number }[];
}

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_SUMMARY: SupervisionSummary = {
  totalStaff: 12,
  supervisedInPeriod: 9,
  overdue: 2,
  neverSupervised: 1,
  compliancePercentage: 75,
  avgWellbeing: 7.2,
  avgPractice: 6.8,
  safeguardingCoverage: 85,
  qualityRating: "good",
  overdueStaff: [
    { name: "Edward Barnes", role: "Night RSW", daysOverdue: 12 },
    { name: "Lackson Moyo", role: "RSW", daysOverdue: 5 },
    { name: "New Starter (Agency)", role: "Agency", daysOverdue: 42 },
  ],
};

const ARIA_INSIGHTS = [
  {
    id: "si_1",
    severity: "high" as const,
    message: "Edward Barnes has not had formal supervision for 40 days — 12 days beyond the 4-week threshold. He was involved in 2 physical interventions last month. Recommend priority supervision with safeguarding focus.",
  },
  {
    id: "si_2",
    severity: "medium" as const,
    message: "Agency staff member has never received supervision at this home. Reg 33 requires all staff to receive regular supervision regardless of employment status.",
  },
  {
    id: "si_3",
    severity: "info" as const,
    message: "Practice quality scores have improved by 0.4 points over the last quarter. 3 staff members moved from 'developing' to 'competent' following targeted supervision focus on recording standards.",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const QUALITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  excellent: { bg: "bg-green-100", text: "text-green-700", label: "Excellent" },
  good: { bg: "bg-blue-100", text: "text-blue-700", label: "Good" },
  requires_improvement: { bg: "bg-amber-100", text: "text-amber-700", label: "Requires Improvement" },
  inadequate: { bg: "bg-red-100", text: "text-red-700", label: "Inadequate" },
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  info: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function SupervisionIntelligenceCard() {
  const summary = DEMO_SUMMARY;
  const insights = ARIA_INSIGHTS;

  const complianceColour = useMemo(() => {
    if (summary.compliancePercentage >= 90) return "text-green-600";
    if (summary.compliancePercentage >= 75) return "text-amber-600";
    return "text-red-600";
  }, [summary.compliancePercentage]);

  const complianceBarColour = useMemo(() => {
    if (summary.compliancePercentage >= 90) return "bg-green-500";
    if (summary.compliancePercentage >= 75) return "bg-amber-500";
    return "bg-red-500";
  }, [summary.compliancePercentage]);

  const qStyle = QUALITY_STYLES[summary.qualityRating] ?? QUALITY_STYLES.good;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Supervision Intelligence
          </CardTitle>
          <Link href="/supervision" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Compliance strip ─────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">{summary.totalStaff}</p>
            <p className="text-[10px] text-muted-foreground">Total Staff</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{summary.supervisedInPeriod}</p>
            <p className="text-[10px] text-muted-foreground">On Track</p>
          </div>
          <div className="text-center rounded-lg bg-red-50 p-2">
            <p className="text-lg font-bold tabular-nums text-red-600">{summary.overdue}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums text-gray-500">{summary.neverSupervised}</p>
            <p className="text-[10px] text-muted-foreground">Never</p>
          </div>
        </div>

        {/* ── Compliance bar ───────────────────────────────────────────── */}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Reg 33 Compliance</span>
            <span className={cn("font-bold tabular-nums", complianceColour)}>
              {summary.compliancePercentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", complianceBarColour)}
              style={{ width: `${summary.compliancePercentage}%` }}
            />
          </div>
        </div>

        {/* ── Quality scores ───────────────────────────────────────────── */}

        <div className="flex items-center gap-3 rounded-lg border p-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-3 w-3" /> Wellbeing
              </span>
              <span className="font-bold tabular-nums">{summary.avgWellbeing}/10</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" /> Practice
              </span>
              <span className="font-bold tabular-nums">{summary.avgPractice}/10</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-3 w-3" /> Safeguarding
              </span>
              <span className="font-bold tabular-nums">{summary.safeguardingCoverage}%</span>
            </div>
          </div>
          <div className="text-center border-l pl-3">
            <Badge className={cn("text-[10px]", qStyle.bg, qStyle.text)}>
              {qStyle.label}
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">Quality Rating</p>
          </div>
        </div>

        {/* ── Overdue staff ─────────────────────────────────────────────── */}

        {summary.overdueStaff.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Overdue Supervisions
            </p>
            {summary.overdueStaff.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-red-100 bg-red-50 px-3 py-1.5 text-xs">
                <div>
                  <span className="font-medium text-red-800">{s.name}</span>
                  <span className="text-red-600 ml-1.5">({s.role})</span>
                </div>
                <Badge variant="destructive" className="text-[10px] h-5">
                  {s.daysOverdue}d overdue
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Intelligence
          </p>
          {insights.map((insight) => {
            const sStyle = SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.info;
            return (
              <div
                key={insight.id}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  sStyle.bg,
                  sStyle.border,
                  sStyle.text,
                )}
              >
                {insight.message}
              </div>
            );
          })}
        </div>

        {/* ── Regulatory note ──────────────────────────────────────────── */}

        <div className="rounded border-l-3 border-blue-400 bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
          <strong>Reg 33</strong> — The registered person must ensure all employees receive
          appropriate supervision to enable them to fulfil their roles effectively.
          Ofsted expects formal supervision at least monthly for care staff.
        </div>
      </CardContent>
    </Card>
  );
}
