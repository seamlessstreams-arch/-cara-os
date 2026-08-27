"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FACILITIES COMPLIANCE INTELLIGENCE CARD
// Home-level: fire equipment checks, water hygiene, window restrictor
// compliance, and pest control management.
// CHR 2015 Reg 25. Fire Safety Order 2005. HSE L8.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { below, formatRate, meets } from "@/lib/metrics/rate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Building2,
  Flame, Droplets, SquareStack, Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FacilitiesRating, HomeFacilitiesComplianceResult } from "@/lib/engines/home-facilities-compliance-intelligence-engine";

interface HomeFacilitiesComplianceResponse {
  data: HomeFacilitiesComplianceResult;
}

function useHomeFacilitiesComplianceIntelligence() {
  return useQuery<HomeFacilitiesComplianceResponse>({
    queryKey: ["home-facilities-compliance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-facilities-compliance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home facilities compliance intelligence");
      return res.json() as Promise<{ data: HomeFacilitiesComplianceResult }>;
    },
    refetchInterval: 60_000,
  });
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<FacilitiesRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeFacilitiesComplianceIntelligenceCard() {
  const { data, isLoading } = useHomeFacilitiesComplianceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  let d = data?.data;
  if (!d) return null;
  // Calm reframe: an empty-with-children engine result (inadequate + score<=15) is
  // 'not yet recorded', not a failing home — render it as honest, neutral insufficient_data.
  const __emptyState = d.facilities_rating === "inadequate" && (d.facilities_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      facilities_rating: "insufficient_data",
      concerns: [],
      recommendations: [],
      insights: [],
      headline:
        String(d.headline || "")
          .split(/ despite | — | -- /)[0]
          .replace(/[\u2014,\-]\s*$/, "")
          .trim() + " — not yet recorded; capturing entries will enable this analysis.",
    };
  }

  const ratingStyle = RATING_STYLES[d.facilities_rating] ?? RATING_STYLES.insufficient_data;
  const hasFireIssues = d.fire.overdue_inspections > 0 || (d.fire.total_checks > 0 && below(d.fire.pass_rate, 70));
  const hasWaterIssues = d.water.overdue_checks > 0 || (d.water.total_checks > 0 && below(d.water.compliance_rate, 70));
  const isAlert = hasFireIssues || hasWaterIssues || d.facilities_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-[--cs-warning]")} />
            <span className="text-slate-900">Facilities Compliance</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.facilities_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.facilities_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.facilities_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.facilities_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Fire */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.fire.total_checks === 0 ? "text-slate-400" :
                  meets(d.fire.pass_rate, 90) ? "text-[--cs-success]" :
                  meets(d.fire.pass_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.fire.total_checks === 0 ? "--" : `${formatRate(d.fire.pass_rate)}`}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Fire Pass</p>
            </div>

            {/* Water */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Droplets className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.water.total_checks === 0 ? "text-slate-400" :
                  meets(d.water.compliance_rate, 90) ? "text-[--cs-success]" :
                  meets(d.water.compliance_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.water.total_checks === 0 ? "--" : `${formatRate(d.water.compliance_rate)}`}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Water OK</p>
            </div>

            {/* Windows */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <SquareStack className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.windows.above_ground_count === 0 ? "text-slate-400" :
                  meets(d.windows.restrictor_compliance_rate, 90) ? "text-[--cs-success]" :
                  meets(d.windows.restrictor_compliance_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.windows.above_ground_count === 0 ? "--" : `${formatRate(d.windows.restrictor_compliance_rate)}`}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Restrictors</p>
            </div>

            {/* Pest */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Bug className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.pest.total_records === 0 ? "text-slate-400" :
                  d.pest.flags_total === 0 ? "text-[--cs-success]" :
                  d.pest.flags_total <= 2 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.pest.total_records === 0 ? "--" : d.pest.flags_total}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">{d.pest.flags_total === 0 ? "No Flags" : "Flags"}</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.facilities_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Fire Equipment</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Checks: <span className="font-medium text-slate-600">{d.fire.total_checks}</span></p>
                <p>Pass rate: <span className={cn("font-medium",
                  meets(d.fire.pass_rate, 90) ? "text-[--cs-success]" :
                  meets(d.fire.pass_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>{formatRate(d.fire.pass_rate)}</span></p>
                {d.fire.overdue_inspections > 0 && (
                  <p>Overdue: <span className="font-medium text-red-600">{d.fire.overdue_inspections}</span></p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Water Hygiene</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Checks: <span className="font-medium text-slate-600">{d.water.total_checks}</span></p>
                <p>Compliance: <span className={cn("font-medium",
                  meets(d.water.compliance_rate, 90) ? "text-[--cs-success]" :
                  meets(d.water.compliance_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>{formatRate(d.water.compliance_rate)}</span></p>
                {d.water.overdue_checks > 0 && (
                  <p>Overdue: <span className="font-medium text-red-600">{d.water.overdue_checks}</span></p>
                )}
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
              <div key={i} className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-2.5 text-xs text-[--cs-success] leading-relaxed">
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
              <div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk] leading-relaxed">
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

        {/* Cara Facilities Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Facilities Intelligence
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
