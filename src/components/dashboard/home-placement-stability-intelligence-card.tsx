"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PLACEMENT STABILITY INTELLIGENCE CARD
// Home-level: placement tenure, incident patterns, missing episode trends,
// return interview compliance, and overall stability across children.
// CHR 2015 Reg 36, Reg 44. SCCIF: "Impact on children's lives" /
// "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Shield,
  Clock, Flame, MapPin, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomePlacementStabilityIntelligence } from "@/hooks/use-home-placement-stability-intelligence";
import type { PlacementStabilityRating } from "@/lib/engines/home-placement-stability-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<PlacementStabilityRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomePlacementStabilityIntelligenceCard() {
  const { data, isLoading } = useHomePlacementStabilityIntelligence();

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

  const ratingStyle = RATING_STYLES[d.stability_rating] ?? RATING_STYLES.insufficient_data;
  const hasHighIncidents = d.incident_profile.high_severity_count > 1;
  const hasManyMissing = d.missing_profile.total_episodes > 3;
  const isAlert = hasHighIncidents || hasManyMissing || d.stability_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-indigo-500")} />
            <span className="text-slate-900">Placement Stability</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.stability_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.stability_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.stability_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.stability_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Tenure */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.tenure_profile.avg_tenure_days >= 180 ? "text-green-600" :
                  d.tenure_profile.avg_tenure_days >= 90 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.tenure_profile.avg_tenure_days}d
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Tenure</p>
            </div>

            {/* Incidents */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.incident_profile.total_incidents === 0 ? "text-green-600" :
                  d.incident_profile.incident_rate <= 1.0 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.incident_profile.total_incidents}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Incidents</p>
            </div>

            {/* Missing */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.missing_profile.total_episodes === 0 ? "text-green-600" :
                  d.missing_profile.total_episodes <= 1 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.missing_profile.total_episodes}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Missing Ep.</p>
            </div>

            {/* Stability Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.stability_profile.stability_rate >= 80 ? "text-green-600" :
                  d.stability_profile.stability_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.stability_profile.stability_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Stability</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.stability_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Tenure</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Longest: <span className="font-medium text-slate-600">{d.tenure_profile.longest_tenure_days}d</span></p>
                <p>Shortest: <span className="font-medium text-slate-600">{d.tenure_profile.shortest_tenure_days}d</span></p>
                <p>Over 6mo: <span className="font-medium text-slate-600">{d.tenure_profile.children_over_6_months}</span></p>
                <p>Under 3mo: <span className={cn("font-medium",
                  d.tenure_profile.children_under_3_months > 0 ? "text-amber-600" : "text-green-600"
                )}>{d.tenure_profile.children_under_3_months}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Safety</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>High incidents: <span className={cn("font-medium",
                  d.incident_profile.high_severity_count > 0 ? "text-red-600" : "text-green-600"
                )}>{d.incident_profile.high_severity_count}</span></p>
                <p>High-risk missing: <span className={cn("font-medium",
                  d.missing_profile.high_risk_count > 0 ? "text-red-600" : "text-green-600"
                )}>{d.missing_profile.high_risk_count}</span></p>
                <p>Return interviews: <span className={cn("font-medium",
                  d.missing_profile.total_episodes === 0 ? "text-slate-600" :
                  d.missing_profile.return_interview_rate >= 90 ? "text-green-600" :
                  d.missing_profile.return_interview_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>{d.missing_profile.total_episodes === 0 ? "N/A" : `${d.missing_profile.return_interview_rate}%`}</span></p>
                <p>Avg risk flags: <span className={cn("font-medium",
                  d.stability_profile.avg_risk_flags <= 1 ? "text-green-600" : "text-amber-600"
                )}>{d.stability_profile.avg_risk_flags}</span></p>
              </div>
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

        {/* ARIA Placement Stability Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Stability Intelligence
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
