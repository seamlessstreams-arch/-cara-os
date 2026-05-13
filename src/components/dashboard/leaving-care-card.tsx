"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEAVING CARE INTELLIGENCE CARD
// Dashboard card for pathway plans, independence assessments, entitlements,
// transition readiness, and ARIA leaving care intelligence.
// CHR 2015 Reg 14 (duty of care leaving), Children (Leaving Care) Act 2000,
// SCCIF Experiences & Progress.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, ChevronRight, AlertTriangle, Brain,
  Home, Heart, BookOpen, PoundSterling, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_LEAVING_CARE_METRICS = {
  eligible_yp: 2,
  with_pathway_plan: 2,
  plans_current: 1,
  plans_overdue_review: 1,
  avg_readiness_score: 62,
  total_entitlements: 8,
  entitlements_claimed: 5,
  entitlements_pending: 2,
  entitlements_expired: 1,
  total_entitlement_value: 4850,
  claimed_value: 3200,
};

const DEMO_YP_PROGRESS = [
  {
    name: "Young Person A",
    age: 17,
    readiness: 72,
    planStatus: "active",
    accommodation: "Semi-independent",
    education: "Apprenticeship",
    advisor: "Jane Smith",
    reviewDue: "2026-06-15",
  },
  {
    name: "Young Person B",
    age: 16,
    readiness: 52,
    planStatus: "under_review",
    accommodation: "Not yet confirmed",
    education: "Full-time education",
    advisor: "Mark Jones",
    reviewDue: "2026-05-01",
  },
];

const DEMO_SKILL_AREAS = [
  { skill: "Budgeting", avgScore: 3.5, maxScore: 5 },
  { skill: "Cooking", avgScore: 3.0, maxScore: 5 },
  { skill: "Cleaning", avgScore: 4.0, maxScore: 5 },
  { skill: "Travel", avgScore: 4.5, maxScore: 5 },
  { skill: "Health Mgmt", avgScore: 2.5, maxScore: 5 },
  { skill: "Digital Skills", avgScore: 4.0, maxScore: 5 },
  { skill: "Tenancy Mgmt", avgScore: 2.0, maxScore: 5 },
  { skill: "Job Searching", avgScore: 2.5, maxScore: 5 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "overdue_review", severity: "high", message: "1 pathway plan overdue for review. Reviews must be at least 6-monthly (Children (Leaving Care) Act 2000)." },
  { type: "low_readiness", severity: "medium", message: "Young Person B has readiness score of 52% — intensify independence skills programme in tenancy management and health." },
  { type: "unclaimed_entitlements", severity: "medium", message: "1 expired entitlement unclaimed. Review with young person and personal advisor." },
];

const ARIA_INSIGHTS = [
  "Young Person B's pathway plan review is overdue by 12 days. Readiness score 52% — weakest areas are tenancy management (2/5) and health management (2.5/5). Schedule an urgent review meeting with their personal advisor and consider increasing key work sessions to focus on these areas.",
  "Entitlement take-up: 63% claimed (5 of 8). 1 expired clothing allowance unclaimed for Young Person B — investigate whether they were aware of their entitlement. Leaving care legislation requires the local authority to inform young people of all available support.",
  "Overall: 2 eligible YP, both have pathway plans. Average readiness 62%. Young Person A progressing well (72%) with apprenticeship secured and semi-independent placement identified. Strongest skills across both YP: travel (4.5/5) and cleaning (4/5). Weakest: tenancy management (2/5) and job searching (2.5/5) — prioritise these in the next independence assessment cycle.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function LeavingCareCard() {
  const l = DEMO_LEAVING_CARE_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Leaving Care
          </CardTitle>
          <Link href="/leaving-care-financial-package" className="text-xs text-brand hover:underline flex items-center gap-1">
            Pathways <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", l.with_pathway_plan === l.eligible_yp ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", l.with_pathway_plan === l.eligible_yp ? "text-green-600" : "text-red-600")}>
              {l.with_pathway_plan}/{l.eligible_yp}
            </p>
            <p className="text-[10px] text-muted-foreground">Plans</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", l.avg_readiness_score >= 70 ? "bg-green-50" : l.avg_readiness_score >= 50 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", l.avg_readiness_score >= 70 ? "text-green-600" : l.avg_readiness_score >= 50 ? "text-amber-600" : "text-red-600")}>
              {l.avg_readiness_score}%
            </p>
            <p className="text-[10px] text-muted-foreground">Readiness</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", l.plans_overdue_review === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", l.plans_overdue_review === 0 ? "text-green-600" : "text-red-600")}>
              {l.plans_overdue_review}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {l.entitlements_claimed}/{l.total_entitlements}
            </p>
            <p className="text-[10px] text-muted-foreground">Claimed</p>
          </div>
        </div>

        {/* ── Young person progress ───────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            Young People Progress
          </p>
          {DEMO_YP_PROGRESS.map((yp) => (
            <div key={yp.name} className="rounded border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{yp.name}</span>
                  <Badge variant="outline" className="text-[10px]">Age {yp.age}</Badge>
                </div>
                <Badge className={cn(
                  "text-[10px]",
                  yp.planStatus === "active" ? "bg-green-100 text-green-700"
                    : yp.planStatus === "under_review" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700",
                )}>
                  {yp.planStatus === "active" ? "Active" : yp.planStatus === "under_review" ? "Review Due" : yp.planStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      yp.readiness >= 70 ? "bg-green-500" : yp.readiness >= 50 ? "bg-amber-500" : "bg-red-500",
                    )}
                    style={{ width: `${yp.readiness}%` }}
                  />
                </div>
                <span className={cn(
                  "text-xs font-bold tabular-nums",
                  yp.readiness >= 70 ? "text-green-600" : yp.readiness >= 50 ? "text-amber-600" : "text-red-600",
                )}>
                  {yp.readiness}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Home className="h-3 w-3" />
                  <span className="truncate">{yp.accommodation}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  <span className="truncate">{yp.education}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  <span className="truncate">{yp.advisor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Independence skills radar ───────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Independence Skills (Average)
          </p>
          {DEMO_SKILL_AREAS.map((s) => (
            <div key={s.skill} className="flex items-center gap-2 text-xs">
              <span className="w-24 truncate">{s.skill}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    s.avgScore >= 4 ? "bg-green-500" : s.avgScore >= 3 ? "bg-blue-500" : s.avgScore >= 2 ? "bg-amber-500" : "bg-red-500",
                  )}
                  style={{ width: `${(s.avgScore / s.maxScore) * 100}%` }}
                />
              </div>
              <span className={cn(
                "tabular-nums font-medium w-8 text-right",
                s.avgScore >= 4 ? "text-green-600" : s.avgScore >= 3 ? "text-blue-600" : "text-amber-600",
              )}>
                {s.avgScore}
              </span>
            </div>
          ))}
        </div>

        {/* ── Entitlements ────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <PoundSterling className="h-3 w-3 text-green-600" />
            Entitlements
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-green-600">
                £{l.claimed_value.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">Claimed</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className={cn("text-sm font-bold tabular-nums", l.entitlements_pending > 0 ? "text-amber-600" : "text-green-600")}>
                {l.entitlements_pending}
              </p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">
                £{l.total_entitlement_value.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">Total Value</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Leaving Care Alerts
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
            ARIA Leaving Care Intelligence
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
