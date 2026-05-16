"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD WIDGET — Missing Episodes Intelligence
//
// Shows at a glance:
//   - Total episodes + last 30 days
//   - Risk level badge
//   - Trend indicator
//   - RHI compliance rates
//   - Sub-scores (frequency, response, risk, compliance)
//   - Top concerns + patterns
//   - Regulatory status badges
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MapPin, AlertTriangle, CheckCircle2, TrendingDown,
  TrendingUp, Minus, Shield, Clock, XCircle,
} from "lucide-react";

interface MissingData {
  childName: string;
  overallScore: number;
  overallRating: string;
  frequencyScore: number;
  responseScore: number;
  riskScore: number;
  complianceScore: number;
  totalEpisodes: number;
  missingEpisodes: number;
  absentEpisodes: number;
  averageDurationMinutes: number;
  longestEpisodeMinutes: number;
  episodesLast30Days: number;
  episodesLast90Days: number;
  trend: "improving" | "stable" | "escalating";
  riskLevel: "low" | "medium" | "high" | "very_high";
  patterns: Array<{ type: string; description: string; significance: string }>;
  concerns: Array<{ severity: string; category: string; description: string }>;
  regulatoryFlags: Array<{ regulation: string; area: string; status: string; detail: string }>;
  rhi: { totalEligible: number; offered: number; completed: number; offerRate: number; completionRate: number };
  summary: string;
}

interface MissingEpisodesIntelligenceCardProps {
  childId: string;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  adequate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  requires_improvement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  inadequate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const RISK_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-emerald-100", text: "text-emerald-700" },
  medium: { bg: "bg-amber-100", text: "text-amber-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  very_high: { bg: "bg-red-100", text: "text-red-700" },
};

const TREND_ICONS = {
  improving: TrendingDown, // fewer episodes = down arrow = good
  stable: Minus,
  escalating: TrendingUp, // more episodes = up arrow = bad
};

const TREND_COLORS = {
  improving: "text-emerald-500",
  stable: "text-gray-400",
  escalating: "text-red-500",
};

export function MissingEpisodesIntelligenceCard({ childId }: MissingEpisodesIntelligenceCardProps) {
  const [data, setData] = useState<MissingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/aria/missing-episodes?childId=${childId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch missing episodes intelligence:", err);
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
        <p className="text-sm text-[var(--cs-text-muted)]">Unable to load missing episodes intelligence.</p>
      </div>
    );
  }

  const ratingStyle = RATING_STYLES[data.overallRating] ?? RATING_STYLES.adequate;
  const riskStyle = RISK_STYLES[data.riskLevel] ?? RISK_STYLES.low;
  const TrendIcon = TREND_ICONS[data.trend];

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Missing Episodes</h3>
        </div>
        <Badge className={cn("text-[10px]", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
          {data.overallRating.replace(/_/g, " ")} ({data.overallScore}%)
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Headline stats */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--cs-navy)]">{data.totalEpisodes}</span>
              <TrendIcon className={cn("h-4 w-4", TREND_COLORS[data.trend])} />
            </div>
            <span className="text-[10px] text-[var(--cs-text-muted)]">
              total ({data.episodesLast30Days} in last 30d)
            </span>
          </div>
          <div className="text-right space-y-1">
            <Badge className={cn("text-[10px]", riskStyle.bg, riskStyle.text)}>
              {data.riskLevel === "low" ? (
                <><Shield className="h-3 w-3 mr-0.5" />Low risk</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-0.5" />Risk: {data.riskLevel.replace("_", " ")}</>
              )}
            </Badge>
          </div>
        </div>

        {/* RHI compliance */}
        {data.rhi.totalEligible > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[var(--cs-text-muted)]">RHI:</span>
            <span className={cn(
              "font-medium",
              data.rhi.completionRate >= 0.8 ? "text-emerald-600" : data.rhi.completionRate >= 0.5 ? "text-amber-600" : "text-red-600",
            )}>
              {Math.round(data.rhi.completionRate * 100)}% completed
            </span>
            <span className="text-[var(--cs-text-muted)]">({data.rhi.completed}/{data.rhi.totalEligible})</span>
          </div>
        )}

        {/* Sub-scores */}
        <div className="grid grid-cols-4 gap-2">
          <MiniScore label="Frequency" score={data.frequencyScore} />
          <MiniScore label="Response" score={data.responseScore} />
          <MiniScore label="Risk" score={data.riskScore} />
          <MiniScore label="Comply" score={data.complianceScore} />
        </div>

        {/* Patterns */}
        {data.patterns.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.patterns.slice(0, 3).map((p, i) => (
              <Badge
                key={i}
                className={cn(
                  "text-[9px]",
                  p.significance === "high" ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-amber-100 text-amber-700 border-amber-200",
                )}
                title={p.description}
              >
                {p.type.replace(/_/g, " ")}
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
        {data.totalEpisodes === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">No missing or absent episodes. Child safely in placement.</span>
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
