"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INCIDENT SAFETY INTELLIGENCE CARD
// Home-level: incidents, restraints, notifiable events, handover continuity —
// holistic safety intelligence view for the home dashboard.
// CHR 2015 Reg 12, 13, 35, 40. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, Shield, HandMetal, ArrowRightLeft,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeIncidentSafetyIntelligence } from "@/hooks/use-home-incident-safety-intelligence";
import type { IncidentSafetyRating } from "@/lib/engines/home-incident-safety-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<IncidentSafetyRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:        { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:               { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:           { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:         { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data:  { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  worsening: TrendingDown,
  insufficient_data: Minus,
};

const TREND_COLOR: Record<string, string> = {
  improving: "text-green-600",
  stable: "text-slate-500",
  worsening: "text-red-600",
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeIncidentSafetyIntelligenceCard() {
  const { data, isLoading } = useHomeIncidentSafetyIntelligence();

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

  const ratingStyle = RATING_STYLES[d.incident_safety_rating] ?? RATING_STYLES.insufficient_data;
  const hasCritical = d.incidents.critical_count_30d > 0;
  const hasInjuries = d.restraints.injury_count > 0;
  const isAlert = hasCritical || hasInjuries || d.incident_safety_rating === "inadequate";

  const IncTrendIcon = TREND_ICON[d.incidents.trend];
  const RstTrendIcon = TREND_ICON[d.restraints.trend];

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-orange-500")} />
            <span className="text-slate-900">Incident Safety</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.incident_safety_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.incident_safety_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.incident_safety_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Incidents 30d */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.incidents.total_30d === 0 ? "text-green-600" : d.incidents.total_30d <= 2 ? "text-amber-600" : "text-red-600")}>
                  {d.incidents.total_30d}
                </p>
                {d.incidents.trend !== "insufficient_data" && (
                  <IncTrendIcon className={cn("h-3 w-3", TREND_COLOR[d.incidents.trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Incidents (30d)</p>
            </div>

            {/* Open Incidents */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.incidents.open_count === 0 ? "text-green-600" : d.incidents.open_count <= 2 ? "text-amber-600" : "text-red-600")}>
                {d.incidents.open_count}
              </p>
              <p className="text-[10px] text-muted-foreground">Open</p>
            </div>

            {/* Restraints 30d */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <HandMetal className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.restraints.total_30d === 0 ? "text-green-600" : d.restraints.total_30d <= 1 ? "text-amber-600" : "text-red-600")}>
                  {d.restraints.total_30d}
                </p>
                {d.restraints.trend !== "insufficient_data" && (
                  <RstTrendIcon className={cn("h-3 w-3", TREND_COLOR[d.restraints.trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Restraints (30d)</p>
            </div>

            {/* Handover Completion */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.handovers.completion_rate === 100 ? "text-green-600" : d.handovers.completion_rate >= 80 ? "text-amber-600" : "text-red-600")}>
                  {d.handovers.completion_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Handover</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.incident_safety_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Incident Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Incident Compliance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Body maps: <span className={cn("font-medium", d.incidents.body_map_compliance_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.incidents.body_map_compliance_rate}%</span></p>
                <p>Oversight: <span className={cn("font-medium", d.incidents.oversight_completion_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.incidents.oversight_completion_rate}%</span></p>
                <p>Lessons: <span className={cn("font-medium", d.incidents.lessons_learned_rate >= 80 ? "text-green-600" : "text-amber-600")}>{d.incidents.lessons_learned_rate}%</span></p>
                {d.incidents.critical_count_30d > 0 && (
                  <p className="text-red-600 font-medium">{d.incidents.critical_count_30d} critical (30d)</p>
                )}
              </div>
            </div>

            {/* Restraint Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Restraint Compliance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Child debrief: <span className={cn("font-medium", d.restraints.child_debrief_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.restraints.child_debrief_rate}%</span></p>
                <p>Staff debrief: <span className={cn("font-medium", d.restraints.staff_debrief_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.restraints.staff_debrief_rate}%</span></p>
                {d.restraints.avg_duration_minutes !== null && (
                  <p>Avg: <span className="font-medium text-slate-600">{d.restraints.avg_duration_minutes}min</span></p>
                )}
                {d.restraints.injury_count > 0 && (
                  <p className="text-red-600 font-medium">{d.restraints.injury_count} injuries (90d)</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Incident Types */}
        {d.incidents.by_type.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Incident Types (90d)</p>
            <div className="flex flex-wrap gap-1">
              {d.incidents.by_type.slice(0, 5).map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
                  {t.type.replace(/_/g, " ")} ({t.count})
                </span>
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
            {d.concerns.slice(0, 3).map((c, i) => (
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
            {d.recommendations.slice(0, 3).map((rec) => (
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

        {/* ARIA Safety Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Safety Intelligence
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
