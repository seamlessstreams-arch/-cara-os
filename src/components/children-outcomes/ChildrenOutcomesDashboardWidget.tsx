// ══════════════════════════════════════════════════════════════════════════════
// ChildrenOutcomesDashboardWidget — Progress & outcomes dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface DomainScore {
  domain: string;
  averageRating: number;
  trend: string;
}

interface CohortData {
  homeId: string;
  childCount: number;
  averageOverallRating: number;
  byDomain: DomainScore[];
  childrenImproving: number;
  childrenStable: number;
  childrenDeclining: number;
  strengthDomains: string[];
  concernDomains: string[];
  goalAchievementRate: number;
  reviewComplianceRate: number;
  ofstedRating: string;
}

interface Props {
  homeId?: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  safety: "Safety",
  health: "Health",
  education: "Education",
  positive_contribution: "Contribution",
  economic_wellbeing: "Independence",
  identity: "Identity",
  emotional_wellbeing: "Emotional",
};

const RATING_COLORS: Record<string, string> = {
  outstanding: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  inadequate: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const RATING_LABELS: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "RI",
  inadequate: "Inadequate",
};

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  improving: { icon: "↑", color: "text-emerald-600 dark:text-emerald-400" },
  stable: { icon: "→", color: "text-muted-foreground" },
  declining: { icon: "↓", color: "text-red-600 dark:text-red-400" },
};

export function ChildrenOutcomesDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/children-outcomes?homeId=${homeId}&view=overview`);
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
        <div className="h-4 w-36 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Children's Outcomes</h3>
              <p className="text-xs text-muted-foreground">{data.childCount} children — SCCIF aligned</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RATING_COLORS[data.ofstedRating] ?? ""}`}>
            {RATING_LABELS[data.ofstedRating] ?? data.ofstedRating}
          </span>
        </div>
      </div>

      {/* Concern areas alert */}
      {data.concernDomains.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Areas needing focus
            </span>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            {data.concernDomains.map(d => DOMAIN_LABELS[d] ?? d).join(", ")}
          </p>
        </div>
      )}

      {/* Progress distribution */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Progress Trends</p>
          <p className="text-xs font-semibold">{data.averageOverallRating.toFixed(1)}/5</p>
        </div>
        <div className="flex gap-2">
          <ProgressChip label="Improving" count={data.childrenImproving} color="emerald" />
          <ProgressChip label="Stable" count={data.childrenStable} color="blue" />
          <ProgressChip label="Declining" count={data.childrenDeclining} color="red" />
        </div>
      </div>

      {/* Domain scores */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Domain Ratings</p>
        </div>
        <div className="divide-y divide-border">
          {data.byDomain.map(d => {
            const trendInfo = TREND_ICONS[d.trend] ?? TREND_ICONS.stable;
            const barWidth = Math.round((d.averageRating / 5) * 100);
            const barColor = d.averageRating >= 4 ? "bg-emerald-500" : d.averageRating >= 3 ? "bg-blue-500" : d.averageRating >= 2 ? "bg-amber-500" : "bg-red-500";

            return (
              <div key={d.domain} className="px-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{DOMAIN_LABELS[d.domain] ?? d.domain}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] ${trendInfo.color}`}>{trendInfo.icon}</span>
                    <span className="text-xs font-semibold">{d.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.goalAchievementRate >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {data.goalAchievementRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Goals achieved</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.reviewComplianceRate >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {data.reviewComplianceRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Reviews on time</p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/outcomes" className="text-xs text-primary font-medium hover:underline">
          View progress dashboard →
        </a>
      </div>
    </div>
  );
}

function ProgressChip({ label, count, color }: { label: string; count: number; color: string }) {
  const styles: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <div className={`flex-1 rounded px-2 py-1.5 text-center ${styles[color] ?? ""}`}>
      <p className="text-sm font-bold">{count}</p>
      <p className="text-[9px]">{label}</p>
    </div>
  );
}
