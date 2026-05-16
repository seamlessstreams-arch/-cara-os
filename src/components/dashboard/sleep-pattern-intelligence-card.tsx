"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD WIDGET — Sleep Pattern Intelligence
//
// Shows at a glance:
//   - Overall score + rating
//   - Average duration vs recommended (with adequacy)
//   - Quality, consistency, impact sub-scores
//   - Disruption patterns
//   - Top concerns
//   - Trend indicator
//   - Regulatory status badges
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Moon, AlertTriangle, CheckCircle2, TrendingDown,
  TrendingUp, Minus, Clock, Zap,
} from "lucide-react";

interface SleepData {
  childName: string;
  overallScore: number;
  overallRating: string;
  durationScore: number;
  qualityScore: number;
  consistencyScore: number;
  impactScore: number;
  averageDurationHours: number;
  recommendedDurationHours: { min: number; max: number };
  durationAdequacy: "sufficient" | "borderline" | "insufficient";
  averageSettlingMinutes: number;
  averageWakings: number;
  nightmareFrequency: number;
  trend: "improving" | "stable" | "declining";
  disruptionPatterns: Array<{ type: string; frequency: string; description: string; significance: string }>;
  concerns: Array<{ severity: string; category: string; description: string }>;
  strengths: Array<{ category: string; description: string }>;
  regulatoryFlags: Array<{ regulation: string; area: string; status: string; detail: string }>;
  recommendations: string[];
  summary: string;
}

interface SleepPatternIntelligenceCardProps {
  childId: string;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  adequate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  requires_improvement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  inadequate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const ADEQUACY_STYLES: Record<string, { bg: string; text: string }> = {
  sufficient: { bg: "bg-emerald-100", text: "text-emerald-700" },
  borderline: { bg: "bg-amber-100", text: "text-amber-700" },
  insufficient: { bg: "bg-red-100", text: "text-red-700" },
};

const TREND_ICONS = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const TREND_COLORS = {
  improving: "text-emerald-500",
  stable: "text-gray-400",
  declining: "text-red-500",
};

export function SleepPatternIntelligenceCard({ childId }: SleepPatternIntelligenceCardProps) {
  const [data, setData] = useState<SleepData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/aria/sleep-patterns?childId=${childId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch sleep pattern intelligence:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [childId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--cs-border)] bg-white p-5 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-[var(--cs-border)] bg-white p-5">
        <p className="text-sm text-[var(--cs-text-muted)]">Unable to load sleep pattern intelligence.</p>
      </div>
    );
  }

  const ratingStyle = RATING_STYLES[data.overallRating] ?? RATING_STYLES.adequate;
  const adequacyStyle = ADEQUACY_STYLES[data.durationAdequacy] ?? ADEQUACY_STYLES.sufficient;
  const TrendIcon = TREND_ICONS[data.trend];

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Sleep Patterns</h3>
        </div>
        <Badge className={cn("text-[10px]", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
          {data.overallRating.replace(/_/g, " ")} ({data.overallScore}%)
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Duration headline */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--cs-navy)]">{data.averageDurationHours}h</span>
              <TrendIcon className={cn("h-4 w-4", TREND_COLORS[data.trend])} />
            </div>
            <span className="text-[10px] text-[var(--cs-text-muted)]">
              avg/night (rec: {data.recommendedDurationHours.min}–{data.recommendedDurationHours.max}h)
            </span>
          </div>
          <div className="text-right space-y-1">
            <Badge className={cn("text-[10px]", adequacyStyle.bg, adequacyStyle.text)}>
              {data.durationAdequacy === "sufficient" ? (
                <><CheckCircle2 className="h-3 w-3 mr-0.5" />Sufficient</>
              ) : data.durationAdequacy === "borderline" ? (
                <><Clock className="h-3 w-3 mr-0.5" />Borderline</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-0.5" />Insufficient</>
              )}
            </Badge>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-gray-50 p-2">
            <span className="text-xs font-bold text-[var(--cs-navy)]">{data.averageSettlingMinutes}m</span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Settling</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className="text-xs font-bold text-[var(--cs-navy)]">{data.averageWakings}</span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Avg Wakings</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className={cn("text-xs font-bold", data.nightmareFrequency >= 2 ? "text-red-600" : "text-[var(--cs-navy)]")}>
              {data.nightmareFrequency}/wk
            </span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Nightmares</p>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-4 gap-2">
          <MiniScore label="Duration" score={data.durationScore} />
          <MiniScore label="Quality" score={data.qualityScore} />
          <MiniScore label="Consist." score={data.consistencyScore} />
          <MiniScore label="Impact" score={data.impactScore} />
        </div>

        {/* Disruption patterns */}
        {data.disruptionPatterns.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.disruptionPatterns.slice(0, 3).map((p, i) => (
              <Badge
                key={i}
                className={cn(
                  "text-[9px]",
                  p.significance === "high" ? "bg-red-100 text-red-700 border-red-200" :
                  p.significance === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-gray-100 text-gray-700 border-gray-200",
                )}
              >
                <Zap className="h-2.5 w-2.5 mr-0.5" />
                {p.type.replace(/_/g, " ")} ({p.frequency.replace(/_/g, " ")})
              </Badge>
            ))}
          </div>
        )}

        {/* Top concerns */}
        {data.concerns.length > 0 && (
          <div className="space-y-1.5">
            {data.concerns.slice(0, 2).map((concern, i) => {
              const isHigh = concern.severity === "critical" || concern.severity === "significant";
              return (
                <div key={i} className={cn(
                  "flex items-start gap-2 rounded-lg p-2 text-xs",
                  isHigh ? "bg-red-50" : "bg-amber-50",
                )}>
                  <AlertTriangle className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-0.5",
                    isHigh ? "text-red-600" : "text-amber-600",
                  )} />
                  <span className={isHigh ? "text-red-700" : "text-amber-700"}>
                    {concern.description}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Regulatory status */}
        {data.regulatoryFlags.some(f => f.status !== "met") && (
          <div className="flex flex-wrap gap-1.5">
            {data.regulatoryFlags.filter(f => f.status !== "met").slice(0, 3).map((flag, i) => (
              <Badge
                key={i}
                className={cn(
                  "text-[9px]",
                  flag.status === "not_met" ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-amber-100 text-amber-700 border-amber-200",
                )}
                title={flag.detail}
              >
                {flag.area}
              </Badge>
            ))}
          </div>
        )}

        {/* All clear */}
        {data.concerns.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">Sleep patterns healthy. Duration and quality within expected range.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component ───────────────────────────────────────────────────────────

function MiniScore({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="text-center">
      <span className={cn("text-sm font-bold", color)}>{score}</span>
      <p className="text-[9px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
