// ══════════════════════════════════════════════════════════════════════════════
// BehaviourDashboardWidget — Behaviour & Positive Relationships card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ChildAnalysis {
  childId: string;
  childName: string;
  totalIncidents: number;
  incidentsLast30Days: number;
  incidentTrend: string;
  deEscalationRate: number;
  restraintCountLast30Days: number;
  positiveToNegativeRatio: number;
  hasSupportPlan: boolean;
  supportPlanCurrent: boolean;
  issues: string[];
}

interface Metrics {
  childCount: number;
  totalIncidents: number;
  incidentsLast30Days: number;
  incidentTrend: string;
  deEscalationSuccessRate: number;
  restraintCount: number;
  restraintCountLast30Days: number;
  restraintReductionTrend: boolean;
  totalPositiveEvents: number;
  positiveEventsLast30Days: number;
  overallPositiveRatio: number;
  supportPlanComplianceRate: number;
  childVoiceInPlans: number;
  debriefComplianceRate: number;
  childrenOfConcern: { childName: string; reason: string }[];
  commonTriggers: string[];
}

interface DashboardData {
  metrics: Metrics;
  children: ChildAnalysis[];
}

interface Props {
  homeId?: string;
}

const TREND_STYLES: Record<string, { icon: string; color: string }> = {
  increasing: { icon: "↑", color: "text-red-600 dark:text-red-400" },
  stable: { icon: "→", color: "text-muted-foreground" },
  decreasing: { icon: "↓", color: "text-emerald-600 dark:text-emerald-400" },
};

export function BehaviourDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/behaviour?homeId=${homeId}&mode=dashboard`);
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

  const { metrics } = data;
  const trendInfo = TREND_STYLES[metrics.incidentTrend] ?? TREND_STYLES.stable;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Behaviour & Relationships</h3>
              <p className="text-xs text-muted-foreground">Reg 19/20 — Positive strategies</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-sm ${trendInfo.color}`}>{trendInfo.icon}</span>
            <span className="text-xs text-muted-foreground">{metrics.incidentsLast30Days} / 30d</span>
          </div>
        </div>
      </div>

      {/* Children of concern alert */}
      {metrics.childrenOfConcern.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              {metrics.childrenOfConcern.length} child{metrics.childrenOfConcern.length > 1 ? "ren" : ""} of concern
            </span>
          </div>
          <p className="text-[10px] text-red-600 dark:text-red-400 line-clamp-1">
            {metrics.childrenOfConcern[0].childName}: {metrics.childrenOfConcern[0].reason}
          </p>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.deEscalationSuccessRate >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.deEscalationSuccessRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">De-escalation</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.restraintReductionTrend ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {metrics.restraintCountLast30Days}
          </p>
          <p className="text-[10px] text-muted-foreground">Restraints 30d</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.overallPositiveRatio >= 5 ? "text-emerald-600 dark:text-emerald-400" : metrics.overallPositiveRatio >= 3 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
            {metrics.overallPositiveRatio}:1
          </p>
          <p className="text-[10px] text-muted-foreground">Positive ratio</p>
        </div>
      </div>

      {/* Positive events highlight */}
      <div className="px-4 py-3 border-b border-border bg-emerald-50/30 dark:bg-emerald-900/5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
            Positive Events (30d)
          </span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.positiveEventsLast30Days}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${Math.min(100, (metrics.positiveEventsLast30Days / Math.max(1, metrics.incidentsLast30Days * 5)) * 100)}%` }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5">Target: 5x incidents ({metrics.incidentsLast30Days * 5} events)</p>
      </div>

      {/* Compliance */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">BSP compliance</span>
          <span className={`font-medium ${metrics.supportPlanComplianceRate >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.supportPlanComplianceRate}%
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Child voice in plans</span>
          <span className={`font-medium ${metrics.childVoiceInPlans >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.childVoiceInPlans}%
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Restraint debriefs</span>
          <span className={`font-medium ${metrics.debriefComplianceRate >= 95 ? "text-emerald-600" : "text-red-600"}`}>
            {metrics.debriefComplianceRate}%
          </span>
        </div>
      </div>

      {/* Common triggers */}
      {metrics.commonTriggers.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">Common triggers:</p>
          <div className="flex flex-wrap gap-1">
            {metrics.commonTriggers.slice(0, 4).map(t => (
              <span key={t} className="inline-flex px-1.5 py-0.5 rounded bg-muted text-[9px] font-medium">
                {t.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/behaviour" className="text-xs text-primary font-medium hover:underline">
          View behaviour dashboard →
        </a>
      </div>
    </div>
  );
}
