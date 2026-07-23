"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — EDUCATION & ACTIVITIES INTELLIGENCE CARD
// Dashboard widget for education status, attendance, enrichment activities,
// PEP compliance, and Cara education intelligence.
// Powered by the Education Intelligence Engine — live data (Reg 8/10).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, BookOpen, Trophy, Calendar, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useEducationIntelligence } from "@/hooks/use-education-intelligence";

// ── Styling maps ────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function EducationIntelligenceCard() {
  const { data, isLoading } = useEducationIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Education & Activities
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
            Education & Activities
          </CardTitle>
          <Link href="/education" className="text-xs text-brand hover:underline flex items-center gap-1">
            Education <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", o.avg_attendance_pct === null ? "bg-muted" : meets(o.avg_attendance_pct, 90) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.avg_attendance_pct === null ? "text-muted-foreground" : meets(o.avg_attendance_pct, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(o.avg_attendance_pct)}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Attendance</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", o.neet_count > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.neet_count > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>
              {o.neet_count}
            </p>
            <p className="text-[10px] text-muted-foreground">NEET</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", o.exclusion_events_90d > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.exclusion_events_90d > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>
              {o.exclusion_events_90d}
            </p>
            <p className="text-[10px] text-muted-foreground">Exclusions</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2">
            <p className="text-lg font-bold tabular-nums text-purple-600">{intel.activities.total_activities_30d}</p>
            <p className="text-[10px] text-muted-foreground">Activities (30d)</p>
          </div>
        </div>

        {/* ── Children's education profiles ────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Education Placements
            </p>
            {intel.child_profiles.slice(0, 4).map((child) => (
              <div key={child.child_id} className="rounded-lg border p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.child_name}</span>
                    {child.has_sen && (
                      <Badge className="text-[10px] bg-[--cs-info-bg] text-[--cs-info]">SEN</Badge>
                    )}
                    {child.exclusion_count_90d > 0 && (
                      <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
                        {child.exclusion_count_90d} excl.
                      </Badge>
                    )}
                  </div>
                  <span className={cn(
                    "font-medium tabular-nums",
                    child.attendance_pct === null ? "text-muted-foreground"
                      : meets(child.attendance_pct, 90) ? "text-[--cs-success]"
                      : meets(child.attendance_pct, 85) ? "text-[--cs-warning]" : "text-[--cs-risk]",
                  )}>
                    {formatRate(child.attendance_pct)}
                  </span>
                </div>
                {child.school && (
                  <p className="text-muted-foreground">{child.school}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Activity breakdown ──────────────────────────────────────── */}

        {intel.activities.categories.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Enrichment Activities (30 days)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {intel.activities.categories.slice(0, 6).map((cat) => (
                <Badge key={cat.category} variant="outline" className="text-[10px] gap-1">
                  {cat.label} <span className="font-bold">{cat.count}</span>
                </Badge>
              ))}
            </div>
            {intel.activities.new_experiences_30d > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                ✨ {intel.activities.new_experiences_30d} new experience{intel.activities.new_experiences_30d !== 1 ? "s" : ""} this month
              </p>
            )}
          </div>
        )}

        {/* ── PEP status bar ──────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Calendar className={cn("h-4 w-4", o.pep_overdue_count > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">PEP Reviews</p>
              <p className="text-[10px] text-muted-foreground">
                {o.pep_current_count}/{o.total_children} current
              </p>
            </div>
          </div>
          {o.pep_overdue_count > 0 ? (
            <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              {o.pep_overdue_count} overdue
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All current
            </Badge>
          )}
        </div>

        {/* ── Education Alerts ──────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Education Alerts
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

        {/* ── Cara Education Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Education Intelligence
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
