"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FIRE SAFETY INTELLIGENCE CARD
// Fire drills, evacuations, equipment checks, response times, participation.
// CHR 2015 Reg 25: "The premises standard — fire safety."
// SCCIF: "The home is safe. Fire precautions are adequate."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRate } from "@/lib/metrics/rate";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Flame,
  Timer, ShieldCheck, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { FireSafetyRating, HomeFireSafetyResult } from "@/lib/engines/home-fire-safety-intelligence-engine";

interface HomeFireSafetyResponse {
  data: HomeFireSafetyResult;
}

function useHomeFireSafetyIntelligence() {
  return useQuery<HomeFireSafetyResponse>({
    queryKey: ["home-fire-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-fire-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home fire safety intelligence");
      return res.json() as Promise<{ data: HomeFireSafetyResult }>;
    },
    refetchInterval: 60_000,
  });
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<FireSafetyRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeFireSafetyIntelligenceCard() {
  const { data, isLoading } = useHomeFireSafetyIntelligence();

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
  const __emptyState = d.fire_safety_rating === "inadequate" && (d.fire_safety_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      fire_safety_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.fire_safety_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.fire_safety_rating === "inadequate" || d.results.failed > 0;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-orange-500")} />
            <span className="text-slate-900">Fire Safety</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.fire_safety_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.fire_safety_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.fire_safety_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.fire_safety_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Drills (30d) */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.frequency.drills_last_30_days >= 2 ? "text-[--cs-success]" :
                  d.frequency.drills_last_30_days >= 1 ? "text-blue-600" : "text-[--cs-risk]"
                )}>
                  {d.frequency.drills_last_30_days}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Drills (30d)</p>
            </div>

            {/* Avg Evac Time */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Timer className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  (d.evacuation.avg_evacuation_time ?? 0) > 0 && (d.evacuation.avg_evacuation_time ?? 0) <= 120 ? "text-[--cs-success]" :
                  (d.evacuation.avg_evacuation_time ?? 0) > 120 ? "text-[--cs-risk]" : "text-slate-400"
                )}>
                  {(d.evacuation.avg_evacuation_time ?? 0) > 0 ? `${d.evacuation.avg_evacuation_time}s` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Evac</p>
            </div>

            {/* Satisfactory Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  (d.results.satisfactory_rate ?? 0) >= 80 ? "text-[--cs-success]" :
                  (d.results.satisfactory_rate ?? 0) >= 60 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {formatRate(d.results.satisfactory_rate)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Satisfactory</p>
            </div>

            {/* Night Drills */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Moon className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.participation.night_drills >= 1 ? "text-blue-600" : "text-slate-400"
                )}>
                  {d.participation.night_drills}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Night Drills</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.fire_safety_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Drills</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Fire drills: <span className="font-medium text-slate-600">{d.frequency.fire_drills}</span></p>
                <p>Evacuations: <span className="font-medium text-slate-600">{d.frequency.evacuations}</span></p>
                <p>Equipment: <span className="font-medium text-slate-600">{d.frequency.equipment_checks}</span></p>
                <p>Failed: <span className={cn("font-medium",
                  d.results.failed === 0 ? "text-[--cs-success]" : "text-[--cs-risk]"
                )}>{d.results.failed}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Evacuation</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Fastest: <span className="font-medium text-slate-600">{(d.evacuation.fastest_evacuation ?? 0) > 0 ? `${d.evacuation.fastest_evacuation}s` : "—"}</span></p>
                <p>Slowest: <span className={cn("font-medium",
                  (d.evacuation.slowest_evacuation ?? 0) > 120 ? "text-[--cs-risk]" : "text-slate-600"
                )}>{(d.evacuation.slowest_evacuation ?? 0) > 0 ? `${d.evacuation.slowest_evacuation}s` : "—"}</span></p>
                <p>Within target: <span className={cn("font-medium",
                  (d.evacuation.target_compliance_rate ?? 0) >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]"
                )}>{formatRate(d.evacuation.target_compliance_rate)}</span></p>
                <p>All present: <span className="font-medium text-slate-600">{formatRate(d.participation.all_present_rate)}</span></p>
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

        {/* Cara Fire Safety Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Fire Safety Intelligence
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
