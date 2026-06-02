"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RISK INTELLIGENCE DASHBOARD CARD
// Home-level cross-cutting risk landscape. Aggregates risk assessments,
// exploitation screenings, missing episodes, incidents, and restraints.
// CHR 2015 Reg 12, 13, 34, 35, 40. SCCIF: How well children are helped
// and protected.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, ChevronRight, Loader2, Shield,
  ShieldAlert, Users, AlertCircle, Sparkles, MapPin,
  Siren, Eye, UserX, Activity, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRiskIntelligenceDashboard } from "@/hooks/use-risk-intelligence-dashboard";
import type {
  HomeRiskLevel,
  ChildRiskProfile,
} from "@/lib/engines/risk-intelligence-dashboard-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RISK_LEVEL_STYLES: Record<HomeRiskLevel, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "CRITICAL" },
  elevated: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "ELEVATED" },
  moderate: { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "MODERATE" },
  managed:  { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "MANAGED" },
  low:      { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "LOW" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  urgent: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

const CHILD_RISK_STYLES: Record<HomeRiskLevel, string> = {
  critical: "border-red-300 bg-red-50",
  elevated: "border-orange-300 bg-orange-50",
  moderate: "border-amber-300 bg-amber-50",
  managed: "border-blue-200 bg-blue-50/50",
  low: "border-green-200 bg-green-50/50",
};

const CHILD_RISK_BADGE: Record<HomeRiskLevel, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100",    text: "text-red-700" },
  elevated: { bg: "bg-orange-100", text: "text-orange-700" },
  moderate: { bg: "bg-amber-100",  text: "text-amber-700" },
  managed:  { bg: "bg-blue-100",   text: "text-blue-700" },
  low:      { bg: "bg-green-100",  text: "text-green-700" },
};

// ── Component ───────────────────────────────────────────────────────────────

export function RiskIntelligenceDashboardCard() {
  const { data, isLoading } = useRiskIntelligenceDashboard();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const ls = d.landscape;
  const riskStyle = RISK_LEVEL_STYLES[ls.home_risk_level] ?? RISK_LEVEL_STYLES.moderate;
  const ia = d.incident_analysis;
  const eo = d.exploitation_overview;
  const mo = d.missing_overview;
  const ro = d.restraint_overview;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span className="text-slate-900">Risk Intelligence Dashboard</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", riskStyle.bg, riskStyle.text, riskStyle.border)}>
              {riskStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{ls.home_risk_score}/100</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Cross-cutting risk landscape — {ls.total_active_risks} active assessment{ls.total_active_risks !== 1 ? "s" : ""}, {ls.children_at_risk} of {ls.total_children} children at high+ risk
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Risk Landscape KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", ls.very_high_risks > 0 ? "bg-red-50" : "bg-slate-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ls.very_high_risks > 0 ? "text-red-600" : "text-slate-600")}>{ls.very_high_risks}</p>
            <p className="text-[10px] text-muted-foreground">Very High</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", ls.high_risks > 0 ? "bg-orange-50" : "bg-slate-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ls.high_risks > 0 ? "text-orange-600" : "text-slate-600")}>{ls.high_risks}</p>
            <p className="text-[10px] text-muted-foreground">High</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", ls.escalating_risks > 0 ? "bg-amber-50" : "bg-slate-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ls.escalating_risks > 0 ? "text-amber-600" : "text-slate-600")}>{ls.escalating_risks}</p>
            <p className="text-[10px] text-muted-foreground">Escalating</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", ls.overdue_reviews > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ls.overdue_reviews > 0 ? "text-red-600" : "text-green-600")}>{ls.overdue_reviews}</p>
            <p className="text-[10px] text-muted-foreground">Overdue Reviews</p>
          </div>
        </div>

        {/* Incident & Exploitation Row */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Activity className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Incidents (30d)</p>
              <p className="text-[10px] text-muted-foreground">
                {ia.total_30d} total · {ia.critical_30d} critical · {ia.safeguarding_30d} safeguarding
              </p>
              <p className="text-[10px] text-muted-foreground">
                Trend: <span className={cn(
                  ia.trend === "increasing" ? "text-red-600 font-medium" :
                  ia.trend === "decreasing" ? "text-green-600" : "text-slate-500"
                )}>{ia.trend}</span>
                {ia.open_incidents > 0 && <span className="text-amber-600 ml-1">· {ia.open_incidents} open</span>}
              </p>
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Siren className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Exploitation</p>
              <p className="text-[10px] text-muted-foreground">
                {eo.active_screenings} active · {eo.high_risk_children} high risk child{eo.high_risk_children !== 1 ? "ren" : ""}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {eo.cse_count > 0 && <span>CSE:{eo.cse_count} </span>}
                {eo.cce_count > 0 && <span>CCE:{eo.cce_count} </span>}
                {eo.online_count > 0 && <span>Online:{eo.online_count} </span>}
                {eo.multi_agency_engaged && <span className="text-green-600">· Multi-agency</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Missing & Restraint Row */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <UserX className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Missing (90d)</p>
              <p className="text-[10px] text-muted-foreground">
                {mo.total_90d} episode{mo.total_90d !== 1 ? "s" : ""} · {mo.unique_children_30d} child{mo.unique_children_30d !== 1 ? "ren" : ""} (30d) · avg {mo.avg_duration_hours}h
              </p>
              <p className="text-[10px] text-muted-foreground">
                RI: <span className={cn(mo.return_interview_rate === 100 ? "text-green-600" : "text-amber-600")}>{mo.return_interview_rate}%</span>
                {mo.cs_risk_episodes > 0 && <span className="text-red-600 ml-1">· {mo.cs_risk_episodes} CS risk</span>}
                {mo.repeat_missing && <span className="text-amber-600 ml-1">· Repeat</span>}
              </p>
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Shield className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Restraints (90d)</p>
              <p className="text-[10px] text-muted-foreground">
                {ro.total_90d} episode{ro.total_90d !== 1 ? "s" : ""} · {ro.unique_children_90d} child{ro.unique_children_90d !== 1 ? "ren" : ""} · avg {ro.avg_duration_minutes}min
              </p>
              <p className="text-[10px] text-muted-foreground">
                Debrief: <span className={cn(ro.debrief_rate === 100 ? "text-green-600" : "text-amber-600")}>{ro.debrief_rate}%</span>
                {ro.injuries_count > 0 && <span className="text-red-600 ml-1">· {ro.injuries_count} injury</span>}
                {ro.unreviewed_count > 0 && <span className="text-amber-600 ml-1">· {ro.unreviewed_count} pending</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Child Risk Profiles */}
        {d.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Child Risk Profiles
            </p>
            {d.child_profiles.slice(0, 5).map((cp) => (
              <ChildRiskRow key={cp.child_id} profile={cp} />
            ))}
          </div>
        )}

        {/* Risk Domains */}
        {d.risk_domains.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Risk Domains
            </p>
            <div className="grid grid-cols-2 gap-1">
              {d.risk_domains.slice(0, 6).map((rd) => (
                <div key={rd.domain} className="rounded border border-slate-200 px-2 py-1.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-700 capitalize">{rd.domain.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">({rd.children_affected})</span>
                  </div>
                  <span className={cn("text-[10px] font-medium",
                    rd.trend_direction === "worsening" ? "text-red-600" :
                    rd.trend_direction === "improving" ? "text-green-600" : "text-slate-500"
                  )}>
                    {rd.trend_direction === "improving" ? "↓" : rd.trend_direction === "worsening" ? "↑" : "→"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            {d.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            {d.concerns.slice(0, 4).map((c, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Recommendations ({d.recommendations.length})
            </p>
            {d.recommendations.slice(0, 4).map((rec) => (
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  {rec.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ARIA Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Risk Intelligence
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

// ── Child Risk Row ──────────────────────────────────────────────────────────

function ChildRiskRow({ profile: cp }: { profile: ChildRiskProfile }) {
  const badge = CHILD_RISK_BADGE[cp.risk_level] ?? CHILD_RISK_BADGE.managed;
  const rowStyle = CHILD_RISK_STYLES[cp.risk_level] ?? CHILD_RISK_STYLES.managed;

  return (
    <div className={cn("rounded border p-2 text-xs", rowStyle)}>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-800">{cp.child_name}</span>
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", badge.bg, badge.text)}>
            {cp.risk_level.toUpperCase()}
          </span>
          <span className="text-[10px] tabular-nums text-slate-500">{cp.risk_score}/100</span>
        </div>
        <div className="flex items-center gap-1">
          {cp.flags.includes("very_high_risk") && <Flame className="h-3 w-3 text-red-500" />}
          {cp.flags.includes("exploitation_concern") && <Siren className="h-3 w-3 text-red-500" />}
          {cp.flags.includes("cs_risk") && <Eye className="h-3 w-3 text-purple-500" />}
          {cp.flags.includes("repeat_missing") && <UserX className="h-3 w-3 text-amber-500" />}
        </div>
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span>{cp.active_risk_assessments} assessment{cp.active_risk_assessments !== 1 ? "s" : ""}</span>
        {cp.highest_risk_domain !== "none" && (
          <span>Highest: <span className="capitalize">{cp.highest_risk_domain.replace(/_/g, " ")}</span> ({cp.highest_risk_level})</span>
        )}
        {cp.exploitation_risk && <span className="text-red-600">Exploitation: {cp.exploitation_risk}</span>}
        {cp.missing_episodes_90d > 0 && <span>{cp.missing_episodes_90d} missing</span>}
        {cp.restraints_90d > 0 && <span>{cp.restraints_90d} restraint{cp.restraints_90d !== 1 ? "s" : ""}</span>}
      </div>
      {(cp.escalating_domains?.length ?? 0) > 0 && (
        <p className="text-[10px] text-red-600 mt-0.5">
          Escalating: {(cp.escalating_domains ?? []).map((d) => d.replace(/_/g, " ")).join(", ")}
        </p>
      )}
    </div>
  );
}
