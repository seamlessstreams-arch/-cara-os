"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD WIDGET — Activities & Enrichment Intelligence
//
// Shows at a glance:
//   - Overall score + rating
//   - Activities per week + categories covered
//   - Community + peer rates
//   - Sub-scores (participation, variety, engagement, integration)
//   - Category breakdown badges
//   - Achievements
//   - Concerns + regulatory status
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Palette, AlertTriangle, CheckCircle2, Trophy,
  Users, MapPin,
} from "lucide-react";

interface ActivitiesData {
  childName: string;
  overallScore: number;
  overallRating: string;
  participationScore: number;
  varietyScore: number;
  engagementScore: number;
  integrationScore: number;
  totalActivities: number;
  activitiesPerWeek: number;
  categoriesCovered: number;
  communityRate: number;
  peerRate: number;
  childChoiceRate: number;
  achievements: string[];
  categoryBreakdown: Array<{ category: string; count: number; percentage: number }>;
  concerns: Array<{ severity: string; category: string; description: string }>;
  strengths: Array<{ category: string; description: string }>;
  regulatoryFlags: Array<{ regulation: string; area: string; status: string; detail: string }>;
  recommendations: string[];
  summary: string;
}

interface ActivitiesIntelligenceCardProps {
  childId: string;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  adequate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  requires_improvement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  inadequate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export function ActivitiesIntelligenceCard({ childId }: ActivitiesIntelligenceCardProps) {
  const [data, setData] = useState<ActivitiesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cara/activities?childId=${childId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch activities intelligence:", err);
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
        <p className="text-sm text-[var(--cs-text-muted)]">Unable to load activities intelligence.</p>
      </div>
    );
  }

  const ratingStyle = RATING_STYLES[data.overallRating] ?? RATING_STYLES.adequate;

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Activities</h3>
        </div>
        <Badge className={cn("text-[10px]", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
          {data.overallRating.replace(/_/g, " ")} ({data.overallScore}%)
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-gray-50 p-2">
            <span className="text-xs font-bold text-[var(--cs-navy)]">{data.activitiesPerWeek}/wk</span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Frequency</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className="text-xs font-bold text-[var(--cs-navy)]">{data.categoriesCovered}</span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Categories</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className={cn("text-xs font-bold", data.communityRate >= 0.5 ? "text-emerald-600" : data.communityRate >= 0.3 ? "text-amber-600" : "text-red-600")}>
              {Math.round(data.communityRate * 100)}%
            </span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Community</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className={cn("text-xs font-bold", data.childChoiceRate >= 0.7 ? "text-emerald-600" : data.childChoiceRate >= 0.4 ? "text-amber-600" : "text-red-600")}>
              {Math.round(data.childChoiceRate * 100)}%
            </span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Child Choice</p>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-4 gap-2">
          <MiniScore label="Particip." score={data.participationScore} />
          <MiniScore label="Variety" score={data.varietyScore} />
          <MiniScore label="Engage" score={data.engagementScore} />
          <MiniScore label="Integrat." score={data.integrationScore} />
        </div>

        {/* Category breakdown */}
        {data.categoryBreakdown.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.categoryBreakdown.slice(0, 5).map((cat, i) => (
              <Badge key={i} className="text-[9px] bg-gray-100 text-gray-700 border-gray-200">
                {cat.category.replace(/_/g, " ")} ({cat.count})
              </Badge>
            ))}
          </div>
        )}

        {/* Achievements */}
        {data.achievements.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs">
            <Trophy className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
            <div className="text-amber-700">
              {data.achievements.slice(0, 2).map((a, i) => (
                <span key={i}>{i > 0 ? " • " : ""}{a}</span>
              ))}
            </div>
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
        {data.concerns.length === 0 && data.totalActivities > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">
              Active, engaged, and well-enriched with broad experiences.
            </span>
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
