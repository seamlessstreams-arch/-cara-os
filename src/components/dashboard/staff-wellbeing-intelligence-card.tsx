"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WELLBEING INTELLIGENCE CARD
// Real-time workforce wellbeing, burnout risk, and home resilience dashboard.
// CHR 2015 Reg 33 (employment of staff), Reg 34 (leadership qualities).
// SCCIF: Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, ChevronRight, Heart, Loader2,
  Shield, TrendingDown, TrendingUp, Users, Minus,
  AlertCircle, CheckCircle2, Activity, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { BurnoutRisk, ResilienceLevel, StaffWellbeingResult } from "@/lib/engines/staff-wellbeing-intelligence-engine";

import { api } from "@/hooks/use-api";
// ── data hook (inlined from use-staff-wellbeing-intelligence) ─────────────

function useStaffWellbeingIntelligence() {
  return useQuery<{ data: StaffWellbeingResult }>({
    queryKey: ["staff-wellbeing-intelligence"],
    queryFn: () => api.get<{ data: StaffWellbeingResult }>("/api/v1/staff-wellbeing-intelligence"),
    refetchInterval: 60_000,
  });
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const RESILIENCE_STYLES: Record<ResilienceLevel, { bg: string; text: string; border: string; label: string }> = {
  strong:   { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "STRONG" },
  adequate: { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "ADEQUATE" },
  fragile:  { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "FRAGILE" },
  at_risk:  { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",     label: "AT RISK" },
};

const BURNOUT_STYLES: Record<BurnoutRisk, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-50",   text: "text-red-700",   dot: "bg-red-500" },
  high:     { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  moderate: { bg: "bg-blue-50",  text: "text-blue-700",  dot: "bg-blue-500" },
  low:      { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  no_data: Activity,
};

const TREND_COLOR = {
  improving: "text-[--cs-success]",
  stable: "text-slate-500",
  declining: "text-[--cs-risk]",
  no_data: "text-slate-400",
};

const WARNING_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  medium: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const ACTION_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  medium: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function StaffWellbeingIntelligenceCard() {
  const { data, isLoading } = useStaffWellbeingIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200 col-span-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const res = d.home_resilience;
  const resStyle = RESILIENCE_STYLES[res.level] ?? RESILIENCE_STYLES.adequate;
  const pulse = d.workforce_pulse;
  const sick = d.sickness_analysis;

  return (
    <Card className="overflow-hidden border-slate-200 col-span-full">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            <span className="text-slate-900">Staff Wellbeing</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", resStyle.bg, resStyle.text, resStyle.border)}>
              {resStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{res.score}%</span>
          </CardTitle>
          <Link href="/staff" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            Staff Hub <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{res.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Workforce Pulse KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{pulse.total_active_staff}</p>
            <p className="text-[10px] text-muted-foreground">Active Staff</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", res.staff_at_risk_count > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", res.staff_at_risk_count > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{res.staff_at_risk_count}</p>
            <p className="text-[10px] text-muted-foreground">At Risk</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", pulse.staff_with_no_supervision_60d > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", pulse.staff_with_no_supervision_60d > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{pulse.staff_with_no_supervision_60d}</p>
            <p className="text-[10px] text-muted-foreground">No Supervision 60d</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{sick.total_days_lost_90d}</p>
            <p className="text-[10px] text-muted-foreground">Sick Days (90d)</p>
          </div>
        </div>

        {/* Staff Burnout Risk Profiles — top 5 */}
        {d.staff_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              Burnout Risk ({d.staff_profiles.length} staff)
            </p>
            <div className="space-y-1">
              {d.staff_profiles.slice(0, 5).map((sp) => {
                const bs = BURNOUT_STYLES[sp.burnout_risk];
                const TrendIcon = TREND_ICON[sp.wellbeing_trend];
                return (
                  <div key={sp.staff_id} className={cn("rounded border p-2 flex items-center gap-2 text-xs", bs.bg)}>
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", bs.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-medium truncate", bs.text)}>{sp.staff_name}</span>
                        <span className="text-[10px] text-muted-foreground">{sp.role.split(" ").slice(0, 2).join(" ")}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>{sp.overtime_hours_30d}h OT</span>
                        <span>{sp.shifts_worked_30d} shifts</span>
                        {sp.sickness_days_90d > 0 && <span>{sp.sickness_days_90d}d sick</span>}
                        {sp.supervision_overdue && <span className="text-amber-600 font-medium">Sup overdue</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <TrendIcon className={cn("h-3 w-3", TREND_COLOR[sp.wellbeing_trend])} />
                      {sp.latest_wellbeing_score !== null && (
                        <span className={cn("text-[10px] font-bold tabular-nums", bs.text)}>{sp.latest_wellbeing_score}/10</span>
                      )}
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0", bs.bg, bs.text)}>
                      {sp.burnout_risk}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sickness Analysis */}
        {sick.total_days_lost_90d > 0 && (
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className="text-lg font-bold tabular-nums text-slate-600">{sick.average_per_staff_90d}</p>
              <p className="text-[10px] text-muted-foreground">Avg Days/Staff</p>
            </div>
            <div className={cn("text-center rounded-lg p-2", (sick.stress_related_pct ?? 0) > 30 ? "bg-red-50" : "bg-slate-50")}>
              <p className={cn("text-lg font-bold tabular-nums", (sick.stress_related_pct ?? 0) > 30 ? "text-[--cs-risk]" : "text-slate-600")}>{sick.stress_related_pct}%</p>
              <p className="text-[10px] text-muted-foreground">Stress-Related</p>
            </div>
            <div className={cn("text-center rounded-lg p-2", sick.staff_with_patterns > 0 ? "bg-amber-50" : "bg-slate-50")}>
              <p className={cn("text-lg font-bold tabular-nums", sick.staff_with_patterns > 0 ? "text-[--cs-warning]" : "text-slate-600")}>{sick.staff_with_patterns}</p>
              <p className="text-[10px] text-muted-foreground">With Patterns</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className="text-lg font-bold tabular-nums text-slate-600">{sick.occupational_health_referrals}</p>
              <p className="text-[10px] text-muted-foreground">OH Referrals</p>
            </div>
          </div>
        )}

        {/* Early Warnings */}
        {d.early_warnings.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Early Warnings ({d.early_warnings.length})
            </p>
            {d.early_warnings.slice(0, 3).map((ew, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", WARNING_STYLES[ew.severity] ?? WARNING_STYLES.medium)}>
                <div className="flex items-start justify-between gap-2">
                  <span><strong>{ew.staff_name}</strong> — {ew.warning}</span>
                  <span className="text-[10px] font-mono shrink-0 opacity-60">{ew.domain}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Priority Actions */}
        {d.priority_actions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Priority Actions ({d.priority_actions.length})
            </p>
            {d.priority_actions.slice(0, 3).map((action) => (
              <div key={action.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", ACTION_STYLES[action.severity] ?? ACTION_STYLES.medium)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{action.action}</span>
                  {action.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{action.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Workforce Pulse Detail */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Avg Tenure</p>
              <p className="text-[10px] text-muted-foreground">{pulse.average_tenure_months} months</p>
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">First Year Staff</p>
              <p className="text-[10px] text-muted-foreground">{pulse.staff_in_first_year} of {pulse.total_active_staff}</p>
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Activity className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Avg Overtime (30d)</p>
              <p className="text-[10px] text-muted-foreground">{pulse.average_overtime_30d}h / person</p>
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Shield className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Wellbeing Coverage</p>
              <p className="text-[10px] text-muted-foreground">{pulse.wellbeing_check_coverage}%</p>
            </div>
          </div>
        </div>

        {/* Cara Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Wellbeing Intelligence
            </p>
            {d.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
