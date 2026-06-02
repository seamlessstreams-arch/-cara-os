"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF APPRAISAL INTELLIGENCE CARD
// Dashboard card powered by the Appraisal Intelligence Engine — live data.
// CHR 2015 Reg 32 (fitness of workers), Reg 33 (employment of staff).
// SCCIF: "Are staff competent, confident, and suitably trained?"
// Quality Standards: workforce development and fitness tracking.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award, ChevronRight, AlertTriangle, Brain,
  Star, Loader2, UserCheck, Clock, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppraisalIntelligence } from "@/hooks/use-appraisal-intelligence";

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

const RATING_COLORS: Record<string, string> = {
  outstanding:          "bg-green-400",
  good:                 "bg-blue-400",
  requires_improvement: "bg-amber-400",
  inadequate:           "bg-red-400",
};

const RATING_LABELS: Record<string, string> = {
  outstanding:          "Outstanding",
  good:                 "Good",
  requires_improvement: "Requires Improvement",
  inadequate:           "Inadequate",
};

const STATUS_BADGE: Record<string, string> = {
  completed:   "bg-green-100 text-green-700",
  overdue:     "bg-red-100 text-red-700",
  scheduled:   "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
};

// ── Component ───────────────────────────────────────────────────────────────

export function AppraisalsCard() {
  const { data, isLoading } = useAppraisalIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-brand" />
            Staff Appraisals
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
  const ratedTotal = intel.rating_breakdown.reduce((s, r) => s + r.count, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-brand" />
            Staff Appraisals
          </CardTitle>
          <Link href="/appraisals" className="text-xs text-brand hover:underline flex items-center gap-1">
            Appraisals <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.compliance_rate >= 90 ? "bg-green-50" : o.compliance_rate >= 50 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.compliance_rate >= 90 ? "text-green-600" : o.compliance_rate >= 50 ? "text-amber-600" : "text-red-600",
            )}>
              {o.compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.completed}/{o.total_appraisals}
            </p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.overdue === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.overdue === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.fitness_confirmed_rate === 100 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.fitness_confirmed_rate === 100 ? "text-green-600" : "text-amber-600",
            )}>
              {o.fitness_confirmed_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Fitness</p>
          </div>
        </div>

        {/* ── Rating breakdown ────────────────────────────────────────── */}

        {ratedTotal > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3" />
              Performance Ratings
            </p>
            <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden">
              {intel.rating_breakdown.filter((r) => r.count > 0).map((r) => (
                <div
                  key={r.rating}
                  className={cn("h-full", RATING_COLORS[r.rating] ?? "bg-gray-300")}
                  style={{ width: `${(r.count / ratedTotal) * 100}%` }}
                  title={`${RATING_LABELS[r.rating] ?? r.rating}: ${r.count}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              {intel.rating_breakdown.map((r) => (
                <div key={r.rating} className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", RATING_COLORS[r.rating] ?? "bg-gray-300")} />
                  <span>{RATING_LABELS[r.rating] ?? r.rating}: {r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Competency heatmap (top 5 lowest) ──────────────────────── */}

        {intel.competency_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Competency Scores (lowest first)
            </p>
            {intel.competency_analysis.slice(0, 5).map((c) => (
              <div key={c.domain} className="flex items-center gap-2 text-xs">
                <span className="w-36 truncate text-muted-foreground" title={c.domain_label}>
                  {c.domain_label}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      c.avg_score >= 4 ? "bg-green-400" : c.avg_score >= 3 ? "bg-blue-400" : "bg-amber-400",
                    )}
                    style={{ width: `${(c.avg_score / 5) * 100}%` }}
                  />
                </div>
                <span className={cn(
                  "font-bold tabular-nums w-8 text-right",
                  c.avg_score >= 4 ? "text-green-600" : c.avg_score >= 3 ? "text-blue-600" : "text-amber-600",
                )}>
                  {c.avg_score}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Key indicators ──────────────────────────────────────────── */}

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded border p-2.5 text-xs">
            <UserCheck className={cn("h-4 w-4 shrink-0", o.staff_without_appraisal > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="font-medium">{o.staff_without_appraisal} staff</p>
              <p className="text-[10px] text-muted-foreground">no appraisal on record</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded border p-2.5 text-xs">
            <Clock className="h-4 w-4 text-blue-500 shrink-0" />
            <div>
              <p className="font-medium">{o.scheduled} scheduled</p>
              <p className="text-[10px] text-muted-foreground">upcoming appraisals</p>
            </div>
          </div>
        </div>

        {/* ── Staff profiles (at-risk first) ──────────────────────────── */}

        {intel.staff_profiles.some((p) => (p.risk_flags?.length ?? 0) > 0) && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              Staff Status
            </p>
            {intel.staff_profiles.filter((p) => (p.risk_flags?.length ?? 0) > 0).slice(0, 4).map((sp) => (
              <div key={sp.staff_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{sp.staff_name}</span>
                  <div className="flex items-center gap-1.5">
                    {sp.latest_status && (
                      <Badge className={cn("text-[9px]", STATUS_BADGE[sp.latest_status] ?? "bg-gray-100 text-gray-700")}>
                        {sp.latest_status.replace(/_/g, " ")}
                      </Badge>
                    )}
                    {sp.latest_rating && (
                      <Badge className={cn(
                        "text-[9px]",
                        sp.latest_rating === "outstanding" ? "bg-green-100 text-green-700"
                          : sp.latest_rating === "good" ? "bg-blue-100 text-blue-700"
                          : sp.latest_rating === "requires_improvement" ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700",
                      )}>
                        {RATING_LABELS[sp.latest_rating] ?? sp.latest_rating}
                      </Badge>
                    )}
                  </div>
                </div>
                {(sp.risk_flags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(sp.risk_flags ?? []).slice(0, 3).map((flag, i) => (
                      <Badge key={i} className="text-[9px] bg-red-100 text-red-700">
                        <FileWarning className="h-2.5 w-2.5 mr-0.5" />
                        {flag.replace(/_/g, " ")}
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
              Appraisal Alerts
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

        {/* ── ARIA Appraisal Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Workforce Intelligence
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
