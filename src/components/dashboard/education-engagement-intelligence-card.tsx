"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD WIDGET — Education Engagement Intelligence
//
// Shows at a glance:
//   - Overall score + rating
//   - Attendance %, category, and trend
//   - Exclusion risk indicator
//   - Sub-scores (attendance, engagement, stability, compliance)
//   - Top concerns
//   - Regulatory status badges
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  GraduationCap, AlertTriangle, CheckCircle2, TrendingDown,
  TrendingUp, Minus, XCircle, Clock, BookOpen,
} from "lucide-react";

interface EducationData {
  childName: string;
  overallScore: number;
  overallRating: string;
  attendanceScore: number;
  engagementScore: number;
  stabilityScore: number;
  complianceScore: number;
  currentAttendance: number;
  attendanceCategory: string;
  attendanceTrend: "improving" | "stable" | "declining";
  exclusionRisk: "low" | "moderate" | "high" | "critical";
  concerns: Array<{ severity: string; category: string; description: string }>;
  strengths: Array<{ category: string; description: string }>;
  regulatoryFlags: Array<{ regulation: string; area: string; status: string; detail: string }>;
  summary: string;
}

interface EducationEngagementIntelligenceCardProps {
  childId: string;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  adequate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  requires_improvement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  inadequate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const EXCLUSION_RISK_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-emerald-100", text: "text-emerald-700" },
  moderate: { bg: "bg-amber-100", text: "text-amber-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  critical: { bg: "bg-red-100", text: "text-red-700" },
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

export function EducationEngagementIntelligenceCard({ childId }: EducationEngagementIntelligenceCardProps) {
  const [data, setData] = useState<EducationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/aria/education-engagement?childId=${childId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch education intelligence:", err);
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
        <p className="text-sm text-[var(--cs-text-muted)]">Unable to load education intelligence.</p>
      </div>
    );
  }

  const ratingStyle = RATING_STYLES[data.overallRating] ?? RATING_STYLES.adequate;
  const exclusionStyle = EXCLUSION_RISK_STYLES[data.exclusionRisk] ?? EXCLUSION_RISK_STYLES.low;
  const TrendIcon = TREND_ICONS[data.attendanceTrend];

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Education</h3>
        </div>
        <Badge className={cn("text-[10px]", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
          {data.overallRating.replace(/_/g, " ")} ({data.overallScore}%)
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Attendance headline */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--cs-navy)]">{data.currentAttendance}%</span>
              <TrendIcon className={cn("h-4 w-4", TREND_COLORS[data.attendanceTrend])} />
            </div>
            <span className="text-[10px] text-[var(--cs-text-muted)]">
              Attendance ({data.attendanceCategory.replace(/_/g, " ")})
            </span>
          </div>
          <div className="text-right">
            <Badge className={cn("text-[10px]", exclusionStyle.bg, exclusionStyle.text)}>
              {data.exclusionRisk === "low" ? (
                <><CheckCircle2 className="h-3 w-3 mr-0.5" />No exclusion risk</>
              ) : (
                <><XCircle className="h-3 w-3 mr-0.5" />Exclusion: {data.exclusionRisk}</>
              )}
            </Badge>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-4 gap-2">
          <MiniScore label="Attendance" score={data.attendanceScore} />
          <MiniScore label="Engage" score={data.engagementScore} />
          <MiniScore label="Stability" score={data.stabilityScore} />
          <MiniScore label="Compliance" score={data.complianceScore} />
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
            <span className="text-xs text-emerald-700">Education engagement on track. All requirements met.</span>
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
