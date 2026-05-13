"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALITY ASSURANCE INTELLIGENCE CARD
// Dashboard card for internal audits, improvement plans, recommendation
// tracking, and ARIA quality intelligence.
// CHR 2015 Reg 45 (review of quality of care), SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, ChevronRight, AlertTriangle, Brain,
  Star, Target, TrendingUp, FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_QA_METRICS = {
  total_audits: 18,
  completed: 14,
  overdue: 2,
  avg_rating: 2.86,
  total_recommendations: 32,
  recommendations_completed: 22,
  recommendations_overdue: 4,
  recommendation_completion_rate: 69,
  improvement_plans_active: 3,
  improvement_plans_completed: 5,
  avg_plan_progress: 58,
};

const DEMO_AUDIT_TYPES = [
  { type: "Reg 45 Quality of Care", count: 2, rating: "Good" },
  { type: "Medication", count: 4, rating: "Good" },
  { type: "Safeguarding", count: 3, rating: "Good" },
  { type: "Daily Recording", count: 3, rating: "Req. Improvement" },
  { type: "H&S", count: 4, rating: "Outstanding" },
  { type: "Care Planning", count: 2, rating: "Good" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "overdue_audit", severity: "high", message: "2 quality audits overdue — Reg 45 requires systematic review of the quality of care." },
  { type: "overdue_recommendations", severity: "medium", message: "4 audit recommendations overdue — review and update action plans." },
  { type: "stalled_plan", severity: "medium", message: "1 active improvement plan below 25% progress — may need additional resources." },
];

const ARIA_INSIGHTS = [
  "Daily recording quality audit rated 'Requires Improvement' — this is the weakest area. Cross-reference with recording quality card data. Common issues: missing reflective analysis, timestamps, and child voice. Schedule targeted training.",
  "4 overdue audit recommendations. 2 relate to safeguarding (DBS renewal tracking, risk assessment templates) and 2 to medication (double-check protocols, stock reconciliation). Prioritise safeguarding items as these directly affect Ofsted judgment.",
  "Overall audit profile: 2.86/4 (broadly 'Good'). 69% recommendation completion rate. H&S audits consistently outstanding. 3 active improvement plans averaging 58% progress. Reg 45 report due next month — compile audit findings for Responsible Individual.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function QualityAssuranceCard() {
  const q = DEMO_QA_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Quality Assurance
          </CardTitle>
          <Link href="/quality-assurance" className="text-xs text-brand hover:underline flex items-center gap-1">
            QA <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {q.completed}/{q.total_audits}
            </p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", q.overdue === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", q.overdue === 0 ? "text-green-600" : "text-red-600")}>
              {q.overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", q.avg_rating >= 3 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", q.avg_rating >= 3 ? "text-green-600" : "text-amber-600")}>
              {q.avg_rating}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Rating</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", q.recommendation_completion_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", q.recommendation_completion_rate >= 80 ? "text-green-600" : "text-amber-600")}>
              {q.recommendation_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Recs Done</p>
          </div>
        </div>

        {/* ── Audit type ratings ──────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <FileSearch className="h-3 w-3" />
            Audit Areas
          </p>
          {DEMO_AUDIT_TYPES.map((t) => (
            <div key={t.type} className="flex items-center justify-between rounded border p-2 text-xs">
              <span className="truncate flex-1">{t.type}</span>
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="text-[10px] tabular-nums">{t.count}</Badge>
                <Badge className={cn(
                  "text-[10px]",
                  t.rating === "Outstanding" ? "bg-green-100 text-green-700"
                    : t.rating === "Good" ? "bg-blue-100 text-blue-700"
                    : t.rating.startsWith("Req") ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700",
                )}>
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  {t.rating}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* ── Improvement plans ───────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            Improvement Plans
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{q.improvement_plans_active}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-green-600">{q.improvement_plans_completed}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className={cn("text-sm font-bold tabular-nums", q.avg_plan_progress >= 50 ? "text-blue-600" : "text-amber-600")}>
                {q.avg_plan_progress}%
              </p>
              <p className="text-[10px] text-muted-foreground">Avg Progress</p>
            </div>
          </div>
        </div>

        {/* ── Recommendations tracker ─────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Recommendations
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total recommendations</span>
            <span className="font-bold">{q.total_recommendations}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-bold text-green-600">{q.recommendations_completed}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overdue</span>
            <span className={cn("font-bold", q.recommendations_overdue > 0 ? "text-red-600" : "text-green-600")}>
              {q.recommendations_overdue}
            </span>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              QA Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Quality Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-red-200 bg-red-50 text-red-800"
                  : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-green-200 bg-green-50 text-green-800",
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
