"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DEVELOPMENT INTELLIGENCE CARD
// Dashboard card powered by the Staff Development Intelligence Engine — live data.
// Reg 32 (fitness of workers), Reg 33 (employment of staff), Reg 29
// (registered person qualifications), SCCIF workforce development.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target, ChevronRight, AlertTriangle, Brain, Loader2,
  GraduationCap, UserCheck, TrendingUp, BookOpen, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffDevelopmentIntelligence } from "@/hooks/use-staff-development-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const RATING_BADGE: Record<string, string> = {
  outstanding: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  requires_improvement: "bg-amber-100 text-amber-700",
  inadequate: "bg-red-100 text-red-700",
};

function formatRating(rating: string | undefined): string {
  if (!rating) return "—";
  return rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ────────────────────────────────────────────────────────────────

export function StaffDevelopmentPlanCard() {
  const { data, isLoading } = useStaffDevelopmentIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card className="overflow-hidden border-purple-200">
        <CardHeader className="pb-3 bg-purple-50/50">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <span className="text-purple-900">Staff Development</span>
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
    <Card className="overflow-hidden border-purple-200">
      <CardHeader className="pb-3 bg-purple-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <span className="text-purple-900">Staff Development</span>
          </CardTitle>
          <Link
            href="/staff-development-plan"
            className="text-xs text-purple-600 hover:underline flex items-center gap-1"
          >
            Full View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.appraisal_completion_rate >= 80 ? "bg-green-50" : o.appraisal_completion_rate >= 50 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.appraisal_completion_rate >= 80 ? "text-green-600" : o.appraisal_completion_rate >= 50 ? "text-amber-600" : "text-red-600",
            )}>
              {o.appraisal_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Appraised</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.mandatory_qual_compliance_rate >= 80 ? "bg-green-50" : o.mandatory_qual_compliance_rate >= 50 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.mandatory_qual_compliance_rate >= 80 ? "text-green-600" : o.mandatory_qual_compliance_rate >= 50 ? "text-amber-600" : "text-red-600",
            )}>
              {o.mandatory_qual_compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Qual Compliant</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.appraisals_overdue === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.appraisals_overdue === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.appraisals_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-purple-600">{o.development_plans_active}</p>
            <p className="text-[10px] text-muted-foreground">Dev Plans</p>
          </div>
        </div>

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.avg_competency_readiness}%</p>
            <p className="text-[10px] text-muted-foreground">Avg Readiness</p>
          </div>
          <div>
            <p className={cn("font-bold tabular-nums", o.qualifications_expiring_soon > 0 ? "text-amber-600" : "text-green-600")}>
              {o.qualifications_expiring_soon}
            </p>
            <p className="text-[10px] text-muted-foreground">Quals Expiring</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.development_plan_progress_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Plan Progress</p>
          </div>
        </div>

        {/* ── Competency domain analysis ──────────────────────────────── */}

        {intel.competency_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Competency Domains</p>
            {intel.competency_analysis.slice(0, 6).map((ca) => (
              <div key={ca.domain} className="flex items-center gap-2 text-xs">
                <span className="w-28 text-right text-muted-foreground capitalize truncate">
                  {ca.domain.replace(/_/g, " ")}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      ca.avg_score >= 4 ? "bg-green-400" : ca.avg_score >= 3 ? "bg-blue-400" : ca.avg_score >= 2 ? "bg-amber-400" : "bg-red-400",
                    )}
                    style={{ width: `${Math.max(4, (ca.avg_score / 5) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium tabular-nums">{ca.avg_score}/5</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Staff profiles ─────────────────────────────────────────── */}

        {intel.staff_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Staff ({intel.staff_profiles.length})
            </p>
            {intel.staff_profiles.slice(0, 6).map((profile) => (
              <div key={profile.staff_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{profile.staff_name}</span>
                  <div className="flex items-center gap-1.5">
                    {profile.latest_appraisal_rating && (
                      <Badge className={cn("text-[9px]", RATING_BADGE[profile.latest_appraisal_rating] ?? "bg-gray-100 text-gray-600")}>
                        {formatRating(profile.latest_appraisal_rating)}
                      </Badge>
                    )}
                    {profile.has_active_development_plan && (
                      <Badge className="text-[9px] bg-purple-100 text-purple-700">
                        <TrendingUp className="h-2.5 w-2.5 mr-0.5" />Dev Plan
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px]">{profile.current_stage}</span>
                  {profile.target_stage && (
                    <span className="text-[10px]">→ {profile.target_stage}</span>
                  )}
                  <span className="text-[10px]">{profile.tenure_days}d tenure</span>
                </div>
                {/* Readiness + qual progress bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground w-14">Readiness</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        profile.readiness_score >= 70 ? "bg-green-500" : profile.readiness_score >= 50 ? "bg-amber-500" : "bg-red-500",
                      )}
                      style={{ width: `${profile.readiness_score}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium tabular-nums w-8 text-right">{profile.readiness_score}%</span>
                </div>
                {/* Qual compliance indicator */}
                <div className="flex items-center gap-1.5 mt-1">
                  {profile.mandatory_qual_compliant ? (
                    <Badge className="text-[9px] bg-green-100 text-green-700">
                      <GraduationCap className="h-2.5 w-2.5 mr-0.5" />Quals Complete
                    </Badge>
                  ) : (
                    <Badge className="text-[9px] bg-amber-100 text-amber-700">
                      <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
                      {profile.mandatory_quals_completed}/{profile.mandatory_quals_total} Quals
                    </Badge>
                  )}
                  {profile.induction_status === "in_progress" && (
                    <Badge className="text-[9px] bg-blue-100 text-blue-700">
                      <BookOpen className="h-2.5 w-2.5 mr-0.5" />Induction
                    </Badge>
                  )}
                  {profile.induction_status === "completed" && (
                    <Badge className="text-[9px] bg-green-100 text-green-700">
                      <UserCheck className="h-2.5 w-2.5 mr-0.5" />Inducted
                    </Badge>
                  )}
                </div>
                {/* Risk flags */}
                {(profile.risk_flags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(profile.risk_flags ?? []).map((flag, i) => (
                      <Badge key={i} className="text-[9px] bg-red-100 text-red-700">
                        <FileWarning className="h-2.5 w-2.5 mr-0.5" />{flag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Development Alerts
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

        {/* ── ARIA Development Intelligence ───────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Development Intelligence
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
