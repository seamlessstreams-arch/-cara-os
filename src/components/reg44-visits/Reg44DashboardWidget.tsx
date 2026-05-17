// ══════════════════════════════════════════════════════════════════════════════
// Reg44DashboardWidget — Independent Visits dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface RecentVisit {
  id: string;
  date: string;
  overallRating: string;
  isCompliant: boolean;
  childEngagement: number;
  actionsRaised: number;
  duration: number;
}

interface Metrics {
  totalVisitsLast12Months: number;
  frequencyCompliant: boolean;
  lastVisitDate: string;
  daysUntilNextDue: number;
  averageChildEngagement: number;
  reportCompletionRate: number;
  ofstedSubmissionRate: number;
  actionCompletionRate: number;
  actionsOverdue: number;
  averageVisitDuration: number;
}

interface DashboardData {
  metrics: Metrics;
  recentVisits: RecentVisit[];
  overallRatingTrend: string[];
  recurringIssueAreas: string[];
  areasNeverAssessed: string[];
  complianceIssues: string[];
  visitorName: string;
}

interface Props {
  homeId?: string;
}

const RATING_COLORS: Record<string, string> = {
  good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  adequate: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  requires_improvement: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  inadequate: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const RATING_LABELS: Record<string, string> = {
  good: "Good",
  adequate: "Adequate",
  requires_improvement: "RI",
  inadequate: "Inadequate",
};

export function Reg44DashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/reg44-visits?homeId=${homeId}&mode=dashboard`);
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

  const { metrics, recentVisits, overallRatingTrend, complianceIssues, visitorName } = data;

  const dueSoon = metrics.daysUntilNextDue <= 7;
  const overdue = metrics.daysUntilNextDue < 0;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Reg 44 Visits</h3>
              <p className="text-xs text-muted-foreground">Independent monitoring</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${metrics.frequencyCompliant ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {metrics.totalVisitsLast12Months}
            </p>
            <p className="text-[10px] text-muted-foreground">visits/year</p>
          </div>
        </div>
      </div>

      {/* Next visit due */}
      <div className={`px-4 py-2.5 border-b border-border ${overdue ? "bg-red-50 dark:bg-red-950/20" : dueSoon ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/20"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Next Visit Due</p>
            <p className={`text-xs font-medium ${overdue ? "text-red-600" : dueSoon ? "text-amber-600" : ""}`}>
              {overdue ? `${Math.abs(metrics.daysUntilNextDue)} days overdue` : `${metrics.daysUntilNextDue} days`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Visitor</p>
            <p className="text-[11px] font-medium">{visitorName}</p>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.reportCompletionRate === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.reportCompletionRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Reports</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold">{metrics.averageChildEngagement}%</p>
          <p className="text-[10px] text-muted-foreground">Child voice</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.actionCompletionRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.actionCompletionRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Actions done</p>
        </div>
      </div>

      {/* Rating trend */}
      {overallRatingTrend.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Rating Trend</p>
          </div>
          <div className="px-4 py-2">
            <div className="flex gap-1">
              {overallRatingTrend.map((rating, i) => (
                <div key={i} className={`flex-1 text-center py-1 rounded-sm text-[9px] font-medium ${RATING_COLORS[rating] || ""}`}>
                  {RATING_LABELS[rating] || rating}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent visits */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Recent Visits</p>
        </div>
        <div className="px-4 py-2 space-y-1.5">
          {recentVisits.map(visit => (
            <div key={visit.id} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">
                  {new Date(visit.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${RATING_COLORS[visit.overallRating] || ""}`}>
                  {RATING_LABELS[visit.overallRating] || visit.overallRating}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{visit.childEngagement}% voice</span>
                {visit.actionsRaised > 0 && (
                  <span className="text-muted-foreground">{visit.actionsRaised} actions</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Ofsted submissions</span>
          <span className={`font-medium ${metrics.ofstedSubmissionRate === 100 ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.ofstedSubmissionRate}%
          </span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Avg visit duration</span>
          <span className="font-medium">{metrics.averageVisitDuration} mins</span>
        </div>
        {metrics.actionsOverdue > 0 && (
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Actions overdue</span>
            <span className="font-medium text-red-600">{metrics.actionsOverdue}</span>
          </div>
        )}
      </div>

      {/* Compliance issues */}
      {complianceIssues.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50 dark:bg-red-950/20">
          <p className="text-[10px] font-medium text-red-700 dark:text-red-400 mb-1">Compliance Issues</p>
          {complianceIssues.map((issue, i) => (
            <p key={i} className="text-[10px] text-red-600 dark:text-red-400">
              {issue}
            </p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/reg44-visits" className="text-xs text-primary font-medium hover:underline">
          View visit reports →
        </a>
      </div>
    </div>
  );
}
