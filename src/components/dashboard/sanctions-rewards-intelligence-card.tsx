"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD WIDGET — Sanctions & Rewards Intelligence
//
// Shows at a glance:
//   - Reward-to-sanction ratio
//   - Overall score + rating
//   - Sub-scores (positivity, proportionality, effectiveness, compliance)
//   - Prohibited sanctions alert
//   - Trend indicator
//   - Staff consistency
//   - Concerns + regulatory flags
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Scale, AlertTriangle, CheckCircle2, TrendingDown,
  TrendingUp, Minus, Star, XCircle, Award,
} from "lucide-react";

interface SRData {
  childName: string;
  overallScore: number;
  overallRating: string;
  positivityScore: number;
  proportionalityScore: number;
  effectivenessScore: number;
  complianceScore: number;
  totalSanctions: number;
  totalRewards: number;
  rewardToSanctionRatio: number;
  sanctionsLast30Days: number;
  rewardsLast30Days: number;
  trend: "improving" | "stable" | "worsening";
  prohibitedSanctions: number;
  staffConsistency: { totalStaff: number; sanctionVariation: string; rewardVariation: string };
  concerns: Array<{ severity: string; category: string; description: string }>;
  regulatoryFlags: Array<{ regulation: string; area: string; status: string; detail: string }>;
  summary: string;
}

interface SanctionsRewardsIntelligenceCardProps {
  childId: string;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  adequate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  requires_improvement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  inadequate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const TREND_ICONS = {
  improving: TrendingUp,
  stable: Minus,
  worsening: TrendingDown,
};

const TREND_COLORS = {
  improving: "text-emerald-500",
  stable: "text-gray-400",
  worsening: "text-red-500",
};

export function SanctionsRewardsIntelligenceCard({ childId }: SanctionsRewardsIntelligenceCardProps) {
  const [data, setData] = useState<SRData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/aria/sanctions-rewards?childId=${childId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch sanctions/rewards intelligence:", err);
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
        <p className="text-sm text-[var(--cs-text-muted)]">Unable to load sanctions & rewards intelligence.</p>
      </div>
    );
  }

  const ratingStyle = RATING_STYLES[data.overallRating] ?? RATING_STYLES.adequate;
  const TrendIcon = TREND_ICONS[data.trend];
  const ratioColor = data.rewardToSanctionRatio >= 4 ? "text-emerald-600" :
    data.rewardToSanctionRatio >= 2 ? "text-amber-600" : "text-red-600";

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Behaviour Management</h3>
        </div>
        <Badge className={cn("text-[10px]", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
          {data.overallRating.replace(/_/g, " ")} ({data.overallScore}%)
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Prohibited sanctions alert */}
        {data.prohibitedSanctions > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">
              {data.prohibitedSanctions} prohibited sanction(s) — immediate action required
            </span>
          </div>
        )}

        {/* Ratio headline */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-bold", ratioColor)}>{data.rewardToSanctionRatio}:1</span>
              <TrendIcon className={cn("h-4 w-4", TREND_COLORS[data.trend])} />
            </div>
            <span className="text-[10px] text-[var(--cs-text-muted)]">
              reward-to-sanction ratio (target: 4:1)
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3 text-emerald-500" />
                <span className="text-[var(--cs-navy)] font-medium">{data.rewardsLast30Days}</span>
              </span>
              <span className="flex items-center gap-1">
                <Scale className="h-3 w-3 text-amber-500" />
                <span className="text-[var(--cs-navy)] font-medium">{data.sanctionsLast30Days}</span>
              </span>
            </div>
            <span className="text-[9px] text-[var(--cs-text-muted)]">last 30 days</span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-4 gap-2">
          <MiniScore label="Positive" score={data.positivityScore} />
          <MiniScore label="Proport." score={data.proportionalityScore} />
          <MiniScore label="Effect." score={data.effectivenessScore} />
          <MiniScore label="Comply" score={data.complianceScore} />
        </div>

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

        {/* Regulatory flags */}
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
        {data.concerns.length === 0 && data.prohibitedSanctions === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">Behaviour management positive and proportionate. Regulatory requirements met.</span>
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
