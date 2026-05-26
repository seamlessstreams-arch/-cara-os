"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SAFEGUARDING INTELLIGENCE CARD
// Home-level: contextual safeguarding risks, exploitation screening coverage,
// online safety incidents, multi-agency engagement, and risk management.
// CHR 2015 Reg 12, 13, 34. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, ShieldAlert,
  Eye, Globe, Users, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeSafeguardingIntelligence } from "@/hooks/use-home-safeguarding-intelligence";
import type { SafeguardingRating } from "@/lib/engines/home-safeguarding-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<SafeguardingRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
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

// ── Component ───────────────────────────────────────────────────────────────

export function HomeSafeguardingIntelligenceCard() {
  const { data, isLoading } = useHomeSafeguardingIntelligence();

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

  const ratingStyle = RATING_STYLES[d.safeguarding_rating] ?? RATING_STYLES.insufficient_data;
  const hasHighRisks = d.contextual_risk_profile.high_very_high_count > 0;
  const hasUnresolved = d.online_safety_profile.unresolved_high_critical > 0;
  const hasOverdue = d.contextual_risk_profile.overdue_reviews > 0;
  const isAlert = hasHighRisks || hasUnresolved || d.safeguarding_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-orange-500")} />
            <span className="text-slate-900">Safeguarding</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.safeguarding_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.safeguarding_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.safeguarding_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Screening Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.exploitation_profile.screening_coverage >= 80 ? "text-green-600" :
                  d.exploitation_profile.screening_coverage >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.exploitation_profile.screening_coverage}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Screened</p>
            </div>

            {/* Multi-Agency Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.contextual_risk_profile.multi_agency_rate >= 80 ? "text-green-600" :
                  d.contextual_risk_profile.multi_agency_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.contextual_risk_profile.multi_agency_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Multi-Agency</p>
            </div>

            {/* Safety Plan Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.exploitation_profile.high_risk_count === 0 ? "text-green-600" :
                  d.exploitation_profile.safety_plan_rate === 100 ? "text-green-600" :
                  d.exploitation_profile.safety_plan_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.exploitation_profile.high_risk_count === 0 ? "N/A" : `${d.exploitation_profile.safety_plan_rate}%`}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Safety Plans</p>
            </div>

            {/* Online Resolved */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.online_safety_profile.unresolved_high_critical === 0 ? "text-green-600" : "text-red-600"
                )}>
                  {d.online_safety_profile.unresolved_high_critical}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Unresolved</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.safeguarding_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Contextual Risks</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total: <span className="font-medium text-slate-600">{d.contextual_risk_profile.total_risks}</span></p>
                <p>Active: <span className="font-medium text-slate-600">{d.contextual_risk_profile.active_count}</span></p>
                {d.contextual_risk_profile.high_very_high_count > 0 && (
                  <p>High/Very high: <span className="font-medium text-red-600">{d.contextual_risk_profile.high_very_high_count}</span></p>
                )}
                {hasOverdue && (
                  <p>Overdue reviews: <span className="font-medium text-red-600">{d.contextual_risk_profile.overdue_reviews}</span></p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Exploitation</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Screened: <span className={cn("font-medium", d.exploitation_profile.screening_coverage >= 80 ? "text-green-600" : "text-amber-600")}>{d.exploitation_profile.children_screened.length}/{d.exploitation_profile.children_screened.length + d.exploitation_profile.children_not_screened.length}</span></p>
                <p>High risk: <span className={cn("font-medium", d.exploitation_profile.high_risk_count === 0 ? "text-green-600" : "text-red-600")}>{d.exploitation_profile.high_risk_count}</span></p>
                {d.exploitation_profile.children_not_screened.length > 0 && (
                  <p>Unscreened: <span className="font-medium text-amber-600">{d.exploitation_profile.children_not_screened.length}</span></p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Online Safety Summary (only if incidents exist) */}
        {d.safeguarding_rating !== "insufficient_data" && d.online_safety_profile.total_incidents_90d > 0 && (
          <div className="rounded border p-2 text-xs">
            <p className="font-medium text-slate-700 mb-1">Online Safety (90d)</p>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
              <p>Incidents: <span className="font-medium text-slate-600">{d.online_safety_profile.total_incidents_90d}</span></p>
              <p>Discussion: <span className={cn("font-medium", d.online_safety_profile.child_discussion_rate >= 80 ? "text-green-600" : "text-amber-600")}>{d.online_safety_profile.child_discussion_rate}%</span></p>
              <p>Follow-up: <span className={cn("font-medium", d.online_safety_profile.follow_up_rate >= 80 ? "text-green-600" : "text-amber-600")}>{d.online_safety_profile.follow_up_rate}%</span></p>
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

        {/* ARIA Safeguarding Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Safeguarding Intelligence
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
