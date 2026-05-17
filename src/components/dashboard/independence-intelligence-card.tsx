"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD WIDGET — Independence & Pathway Planning Intelligence
//
// Shows at a glance:
//   - Overall score + rating
//   - Life skills average level + at-target count
//   - EET status
//   - Pathway plan status
//   - Sub-scores (skills, EET, planning, practical readiness)
//   - Category skill levels
//   - Concerns + regulatory status
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Compass, AlertTriangle, CheckCircle2, GraduationCap,
  Briefcase, Home, CreditCard,
} from "lucide-react";

interface IndependenceData {
  childName: string;
  overallScore: number;
  overallRating: string;
  skillsScore: number;
  eetScore: number;
  planningScore: number;
  practicalReadinessScore: number;
  totalSkills: number;
  skillsByCategory: Array<{ category: string; avgLevel: number; skillCount: number; atTarget: number }>;
  averageSkillLevel: number;
  skillsAtTarget: number;
  skillsBelowTarget: number;
  eetStatus: string;
  pathwayPlanStatus: string;
  accommodationStatus: string;
  concerns: Array<{ severity: string; category: string; description: string }>;
  strengths: Array<{ category: string; description: string }>;
  regulatoryFlags: Array<{ regulation: string; area: string; status: string; detail: string }>;
  recommendations: string[];
  summary: string;
}

interface IndependenceIntelligenceCardProps {
  childId: string;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  adequate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  requires_improvement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  inadequate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const EET_LABELS: Record<string, { label: string; color: string }> = {
  in_education: { label: "In Education", color: "text-emerald-600" },
  in_employment: { label: "In Employment", color: "text-emerald-600" },
  in_training: { label: "In Training", color: "text-blue-600" },
  neet_with_plan: { label: "NEET (Plan)", color: "text-amber-600" },
  neet: { label: "NEET", color: "text-red-600" },
  not_applicable: { label: "N/A", color: "text-gray-500" },
};

const LEVEL_LABELS = ["Not Started", "Emerging", "Developing", "Competent", "Independent"];

export function IndependenceIntelligenceCard({ childId }: IndependenceIntelligenceCardProps) {
  const [data, setData] = useState<IndependenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/aria/independence?childId=${childId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch independence intelligence:", err);
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
        <p className="text-sm text-[var(--cs-text-muted)]">Unable to load independence intelligence.</p>
      </div>
    );
  }

  const ratingStyle = RATING_STYLES[data.overallRating] ?? RATING_STYLES.adequate;
  const eetInfo = EET_LABELS[data.eetStatus] ?? { label: data.eetStatus, color: "text-gray-600" };

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Independence</h3>
        </div>
        <Badge className={cn("text-[10px]", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
          {data.overallRating.replace(/_/g, " ")} ({data.overallScore}%)
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Key stats row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-gray-50 p-2">
            <span className="text-xs font-bold text-[var(--cs-navy)]">
              {LEVEL_LABELS[Math.round(data.averageSkillLevel)] ?? "—"}
            </span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Avg Level</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className={cn("text-xs font-bold", eetInfo.color)}>{eetInfo.label}</span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">EET</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className={cn("text-xs font-bold", data.skillsAtTarget === data.totalSkills && data.totalSkills > 0 ? "text-emerald-600" : "text-[var(--cs-navy)]")}>
              {data.skillsAtTarget}/{data.totalSkills}
            </span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">At Target</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className="text-xs font-bold text-[var(--cs-navy)]">{data.overallScore}%</span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Ready</p>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-4 gap-2">
          <MiniScore label="Skills" score={data.skillsScore} />
          <MiniScore label="EET" score={data.eetScore} />
          <MiniScore label="Planning" score={data.planningScore} />
          <MiniScore label="Practical" score={data.practicalReadinessScore} />
        </div>

        {/* Category skill levels */}
        {data.skillsByCategory.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.skillsByCategory.slice(0, 5).map((cat, i) => {
              const levelColor = cat.avgLevel >= 3 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                cat.avgLevel >= 2 ? "bg-blue-100 text-blue-700 border-blue-200" :
                "bg-amber-100 text-amber-700 border-amber-200";
              return (
                <Badge key={i} className={cn("text-[9px]", levelColor)}>
                  {cat.category.replace(/_/g, " ")} ({LEVEL_LABELS[Math.round(cat.avgLevel)]?.slice(0, 4) ?? "—"})
                </Badge>
              );
            })}
          </div>
        )}

        {/* Pathway & Accommodation status */}
        <div className="space-y-1 text-xs text-[var(--cs-text-muted)]">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3 w-3" />
            <span>{data.pathwayPlanStatus}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Home className="h-3 w-3" />
            <span>{data.accommodationStatus}</span>
          </div>
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
        {data.concerns.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">
              Independence preparation on track. Skills developing well.
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
