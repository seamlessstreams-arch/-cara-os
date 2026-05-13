"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SCCIF SELF-EVALUATION INTELLIGENCE CARD
// Dashboard card for Ofsted inspection readiness, SCCIF judgment areas,
// evidence coverage, and ARIA inspection intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Target, Star, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_EVALUATION = {
  status: "draft" as "draft" | "in_review" | "final",
  periodFrom: "2026-01-01",
  periodTo: "2026-06-30",
  totalEvidence: 45,
  coverage: 85,
  strengthPercentage: 68.9,
};

const JUDGMENT_SUMMARIES = [
  {
    key: "overall_experiences",
    label: "Experiences & Progress",
    suggested: "Good",
    strengths: 12,
    developments: 4,
    total: 16,
    ratio: 75,
  },
  {
    key: "helped_and_protected",
    label: "Helped & Protected",
    suggested: "Good",
    strengths: 10,
    developments: 5,
    total: 15,
    ratio: 66.7,
  },
  {
    key: "leadership_and_management",
    label: "Leadership & Management",
    suggested: "Good",
    strengths: 9,
    developments: 5,
    total: 14,
    ratio: 64.3,
  },
];

const UNCOVERED_AREAS = [
  "Child voice",
  "Missing & exploitation",
  "Independent visits",
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "uncovered_area", severity: "medium", message: "3 evidence areas have no entries: child voice, missing & exploitation, independent visits. Add evidence before finalising." },
  { type: "draft_status", severity: "medium", message: "Self-evaluation is still in draft. Review and finalise with responsible individual before next Reg 44 visit." },
];

const ARIA_INSIGHTS = [
  "Current self-evaluation suggests 'Good' across all 3 judgments. Strength ratio ranges from 64-75%. To reach 'Outstanding', increase evidence of impact — show how practice changes improved outcomes for specific children.",
  "3 evidence areas remain uncovered (child voice, missing/exploitation, independent visits). These are critical for the 'Helped & Protected' judgment. Gather evidence from key work sessions, missing episodes, and Reg 44 reports.",
  "Positive: 85% evidence coverage across SCCIF areas. 45 evidence entries recorded. Care planning, education progress, and safeguarding have the strongest evidence base. The self-evaluation demonstrates awareness of strengths and areas for development.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function SCCIFEvaluationCard() {
  const e = DEMO_EVALUATION;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand" />
            SCCIF Self-Evaluation
          </CardTitle>
          <Link href="/sccif" className="text-xs text-brand hover:underline flex items-center gap-1">
            SCCIF <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", e.status === "final" ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-sm font-bold capitalize", e.status === "final" ? "text-green-600" : "text-amber-600")}>
              {e.status}
            </p>
            <p className="text-[10px] text-muted-foreground">Status</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {e.totalEvidence}
            </p>
            <p className="text-[10px] text-muted-foreground">Evidence</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: e.coverage >= 90 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", e.coverage >= 90 ? "text-green-600" : "text-amber-600")}>
              {e.coverage}%
            </p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: e.strengthPercentage >= 60 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", e.strengthPercentage >= 60 ? "text-green-600" : "text-amber-600")}>
              {e.strengthPercentage}%
            </p>
            <p className="text-[10px] text-muted-foreground">Strengths</p>
          </div>
        </div>

        {/* ── Judgment summaries ──────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            SCCIF Judgments
          </p>
          {JUDGMENT_SUMMARIES.map((j) => (
            <div key={j.key} className="rounded-lg border p-3 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-medium">{j.label}</span>
                <Badge className={cn(
                  "text-[10px]",
                  j.suggested === "Outstanding" ? "bg-green-100 text-green-700"
                    : j.suggested === "Good" ? "bg-blue-100 text-blue-700"
                    : j.suggested === "Requires Improvement" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700",
                )}>
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  {j.suggested}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-400" style={{ width: `${(j.strengths / j.total) * 100}%` }} />
                  <div className="h-full bg-red-300" style={{ width: `${(j.developments / j.total) * 100}%` }} />
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {j.strengths}
                  <TrendingUp className="h-2.5 w-2.5 inline mx-0.5 text-green-500" />
                  {j.developments}
                  <AlertTriangle className="h-2.5 w-2.5 inline mx-0.5 text-amber-500" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Uncovered areas ──────────────────────────────────────────── */}

        {UNCOVERED_AREAS.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-800 mb-1">Evidence Gaps</p>
            <div className="flex flex-wrap gap-1">
              {UNCOVERED_AREAS.map((area) => (
                <Badge key={area} variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Evaluation Alerts
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
            ARIA Inspection Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
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
