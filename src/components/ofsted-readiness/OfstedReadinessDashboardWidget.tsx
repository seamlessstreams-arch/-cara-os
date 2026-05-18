// ══════════════════════════════════════════════════════════════════════════════
// OfstedReadinessDashboardWidget — Inspection readiness overview card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

// ── Local Interfaces ────────────────────────────────────────────────────────

interface JudgmentAreaSummary {
  area: string;
  label: string;
  averageScore: number;
  areaCount: number;
  evidenceCount: number;
  absentEvidenceCount: number;
  weakEvidenceCount: number;
  strongEvidenceCount: number;
  readinessContribution: number;
}

interface GapAnalysisItem {
  requirement: string;
  label: string;
  judgmentArea: string;
  currentStrength: string;
  recommendation: string;
  priority: string;
}

interface RegulatoryLink {
  reference: string;
  title: string;
  relevance: string;
}

interface ReadinessData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  readiness: string;
  judgmentAreaReadinessScore: number;
  evidencePortfolioScore: number;
  actionPlanProgressScore: number;
  inspectionPreparednessScore: number;
  judgmentAreaSummaries: JudgmentAreaSummary[];
  gapAnalysis: GapAnalysisItem[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: RegulatoryLink[];
}

interface Props {
  homeId?: string;
}

// ── Labels ──────────────────────────────────────────────────────────────────

const READINESS_STYLES: Record<string, string> = {
  ready: "text-emerald-600 dark:text-emerald-400",
  mostly_ready: "text-blue-600 dark:text-blue-400",
  partially_ready: "text-amber-600 dark:text-amber-400",
  not_ready: "text-red-600 dark:text-red-400",
};

const READINESS_LABELS: Record<string, string> = {
  ready: "Ready",
  mostly_ready: "Mostly Ready",
  partially_ready: "Partially Ready",
  not_ready: "Not Ready",
};

const RATING_STYLES: Record<string, string> = {
  outstanding: "text-emerald-600 dark:text-emerald-400",
  good: "text-blue-600 dark:text-blue-400",
  requires_improvement: "text-amber-600 dark:text-amber-400",
  inadequate: "text-red-600 dark:text-red-400",
};

const RATING_LABELS: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

const JUDGMENT_SHORT: Record<string, string> = {
  overall_experiences: "Experiences & Progress",
  help_and_protection: "Help & Protection",
  leadership_and_management: "Leaders & Managers",
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const STRENGTH_STYLES: Record<string, string> = {
  strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  adequate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  weak: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  missing: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

// ── Component ───────────────────────────────────────────────────────────────

export function OfstedReadinessDashboardWidget({
  homeId = "oak-house",
}: Props) {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/ofsted-readiness?homeId=${homeId}`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const criticalGaps = data.gapAnalysis.filter(
    (g) => g.priority === "critical",
  );
  const highGaps = data.gapAnalysis.filter((g) => g.priority === "high");

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Ofsted Readiness</h3>
              <p className="text-xs text-muted-foreground">
                SCCIF Inspection Preparedness
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{Math.round(data.overallScore)}</p>
            <p className="text-[10px] text-muted-foreground">/ 100</p>
          </div>
        </div>
      </div>

      {/* Readiness Status */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Inspection Readiness
          </span>
          <span
            className={`text-sm font-bold ${READINESS_STYLES[data.readiness] ?? ""}`}
          >
            {READINESS_LABELS[data.readiness] ?? data.readiness}
          </span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              data.overallScore >= 80
                ? "bg-emerald-500"
                : data.overallScore >= 60
                  ? "bg-blue-500"
                  : data.overallScore >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${Math.min(data.overallScore, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            Rating
          </span>
          <span
            className={`text-[10px] font-medium ${RATING_STYLES[data.rating] ?? ""}`}
          >
            {RATING_LABELS[data.rating] ?? data.rating}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {(criticalGaps.length > 0 || highGaps.length > 0) && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/10">
          {criticalGaps.length > 0 && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400">
                {criticalGaps.length} critical evidence gap
                {criticalGaps.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {highGaps.length > 0 && (
            <p className="text-[10px] text-red-600 dark:text-red-400">
              {highGaps.length} high-priority gap
              {highGaps.length > 1 ? "s" : ""} to address
            </p>
          )}
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold">
            {Math.round(data.judgmentAreaReadinessScore)}
          </p>
          <p className="text-[9px] text-muted-foreground">Judgment</p>
          <p className="text-[8px] text-muted-foreground">/30</p>
        </div>
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold">
            {Math.round(data.evidencePortfolioScore)}
          </p>
          <p className="text-[9px] text-muted-foreground">Evidence</p>
          <p className="text-[8px] text-muted-foreground">/25</p>
        </div>
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold">
            {Math.round(data.actionPlanProgressScore)}
          </p>
          <p className="text-[9px] text-muted-foreground">Actions</p>
          <p className="text-[8px] text-muted-foreground">/25</p>
        </div>
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold">
            {Math.round(data.inspectionPreparednessScore)}
          </p>
          <p className="text-[9px] text-muted-foreground">Prepared</p>
          <p className="text-[8px] text-muted-foreground">/20</p>
        </div>
      </div>

      {/* Judgment Area Summaries */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            SCCIF Judgment Areas
          </p>
        </div>
        <div className="divide-y divide-border">
          {data.judgmentAreaSummaries.map((summary) => (
            <div
              key={summary.area}
              className="px-4 py-2 flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">
                  {JUDGMENT_SHORT[summary.area] ?? summary.area}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {summary.areaCount} area{summary.areaCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {summary.evidenceCount} evidence
                  </span>
                  {summary.weakEvidenceCount > 0 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                      {summary.weakEvidenceCount} weak
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">
                  {summary.averageScore > 0
                    ? Math.round(summary.averageScore)
                    : "—"}
                </p>
                <p className="text-[9px] text-muted-foreground">avg</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gap Analysis (top items) */}
      {data.gapAnalysis.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Evidence Gaps
              </p>
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                {data.gapAnalysis.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {data.gapAnalysis.slice(0, 4).map((gap) => (
              <div key={gap.requirement} className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{gap.label}</p>
                  <span
                    className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_STYLES[gap.priority] ?? ""}`}
                  >
                    {gap.priority}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  <span
                    className={`inline-flex px-1 py-0.5 rounded text-[9px] font-medium mr-1 ${STRENGTH_STYLES[gap.currentStrength] ?? ""}`}
                  >
                    {gap.currentStrength}
                  </span>
                  {gap.recommendation}
                </p>
              </div>
            ))}
          </div>
          {data.gapAnalysis.length > 4 && (
            <div className="px-4 py-1.5 bg-muted/20">
              <p className="text-[10px] text-muted-foreground text-center">
                +{data.gapAnalysis.length - 4} more gap
                {data.gapAnalysis.length - 4 > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Strengths
            </p>
          </div>
          <div className="px-4 py-2 space-y-1">
            {data.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <p className="text-[10px] text-foreground">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas for Improvement */}
      {data.areasForImprovement.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Areas for Improvement
            </p>
          </div>
          <div className="px-4 py-2 space-y-1">
            {data.areasForImprovement.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-foreground">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Period</span>
          <span className="font-medium">
            {data.periodStart} to {data.periodEnd}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <a
          href="/ofsted-readiness"
          className="text-xs text-primary font-medium hover:underline"
        >
          View full readiness report →
        </a>
      </div>
    </div>
  );
}
