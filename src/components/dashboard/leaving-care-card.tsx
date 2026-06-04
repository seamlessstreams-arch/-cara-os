"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEAVING CARE INTELLIGENCE CARD
// Dashboard card powered by the Leaving Care Intelligence Engine.
// Reg 12 (preparing to leave care), Reg 14 (needs assessment),
// Children (Leaving Care) Act 2000, SCCIF Experiences & Progress.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, ChevronRight, AlertTriangle, Brain,
  Home, Target, BookOpen, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeavingCareIntelligence } from "@/hooks/use-leaving-care-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const READINESS_STYLES: Record<string, string> = {
  on_track: "bg-green-100 text-green-700",
  needs_attention: "bg-amber-100 text-amber-700",
  at_risk: "bg-red-100 text-red-700",
};

const READINESS_LABELS: Record<string, string> = {
  on_track: "On Track",
  needs_attention: "Needs Attention",
  at_risk: "At Risk",
};

// ── Component ───────────────────────────────────────────────────────────────

export function LeavingCareCard() {
  const { data, isLoading } = useLeavingCareIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Leaving Care
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const o = intel.overview;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Leaving Care
          </CardTitle>
          <Link href="/pathway-plan-16plus" className="text-xs text-brand hover:underline flex items-center gap-1">
            Plans <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.children_with_pathway_plan}/{o.total_eligible_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Plans</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.avg_independence_score >= 60 ? "bg-green-50" : o.avg_independence_score >= 40 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.avg_independence_score >= 60 ? "text-green-600" : o.avg_independence_score >= 40 ? "text-amber-600" : "text-red-600",
            )}>
              {o.avg_independence_score}%
            </p>
            <p className="text-[10px] text-muted-foreground">Readiness</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.plans_overdue_review === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.plans_overdue_review === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.plans_overdue_review}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.accommodation_secured_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Accom</p>
          </div>
        </div>

        {/* ── Child readiness profiles ────────────────────────────────── */}

        {intel.child_readiness.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Transition Readiness
            </p>
            {intel.child_readiness.map((cr) => (
              <div key={cr.child_id} className="rounded border p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cr.child_name} ({cr.age})</span>
                  <Badge className={cn("text-[10px]", READINESS_STYLES[cr.readiness_rating] ?? "bg-gray-100 text-gray-600")}>
                    {READINESS_LABELS[cr.readiness_rating] ?? cr.readiness_rating}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {cr.accommodation_status === "not_started" ? "Not started" : cr.accommodation_status}
                  </span>
                  <span>{cr.skills_competent_count}/{cr.skills_total} skills</span>
                  <span className="font-medium tabular-nums">{cr.independence_score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Skills summary ─────────────────────────────────────────── */}

        {intel.skills_summary.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Independence Skills
            </p>
            <div className="grid grid-cols-2 gap-1">
              {intel.skills_summary.map((s) => (
                <div key={s.skill_area} className="flex items-center justify-between rounded border p-1.5 text-xs">
                  <span className="truncate flex-1 text-[11px]">{s.skill_label}</span>
                  <Badge className={cn(
                    "text-[9px] px-1",
                    s.not_started_count > 0 ? "bg-red-100 text-red-700"
                      : s.developing_count > s.competent_count + s.independent_count ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700",
                  )}>
                    {s.independent_count + s.competent_count}/{s.independent_count + s.competent_count + s.developing_count + s.not_started_count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-blue-600 tabular-nums">{o.eet_confirmed_count}</p>
            <p className="text-[10px] text-muted-foreground">EET Confirmed</p>
          </div>
          <div>
            <p className="font-bold text-blue-600 tabular-nums">{o.support_network_complete}</p>
            <p className="text-[10px] text-muted-foreground">Support Net</p>
          </div>
          <div>
            <p className={cn("font-bold tabular-nums", o.avg_skills_competency_rate >= 50 ? "text-green-600" : "text-amber-600")}>
              {o.avg_skills_competency_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Skills Rate</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Leaving Care Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Leaving Care Intelligence ──────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Leaving Care Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
