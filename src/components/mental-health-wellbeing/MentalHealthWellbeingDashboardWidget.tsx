"use client";

import { useEffect, useState } from "react";

// ── Local interfaces (mirror engine output shape) ─────────────────────────

interface DomainRisk {
  domain: string;
  score: number;
  riskLevel: string;
  trend: string;
}

interface ActiveIntervention {
  type: string;
  provider: string;
  engagement: number;
}

interface ChildProfile {
  childId: string;
  childName: string;
  latestOverallScore: number;
  latestOverallRisk: string;
  domainRisks: DomainRisk[];
  activeInterventions: ActiveIntervention[];
  waitingListInterventions: { type: string; waitingTimeDays: number }[];
  incidentCount: number;
  hasSafetyPlan: boolean;
  safetyPlanStatus?: string;
  overallTrend: string;
  concerns: string[];
  recommendations: string[];
}

interface Scoring {
  assessmentScore: number;
  interventionScore: number;
  incidentResponseScore: number;
  safetyPlanScore: number;
}

interface IntelligenceData {
  homeId: string;
  overallScore: number;
  rating: string;
  childProfiles: ChildProfile[];
  scoring: Scoring;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  assessmentResult: {
    coverageRate: number;
    currencyRate: number;
    multiVoiceRate: number;
    averageOverallScore: number;
    riskDistribution: Record<string, number>;
  };
  interventionResult: {
    accessRate: number;
    attendanceRate: number;
    averageEngagement: number;
    waitingListCount: number;
    averageWaitingTimeDays: number;
  };
  incidentResult: {
    totalIncidents: number;
    responseWithin15MinRate: number;
    followUp24hRate: number;
    camhsNotificationRate: number;
  };
  safetyPlanResult: {
    coverageRate: number;
    currentPlanRate: number;
    childInvolvementRate: number;
  };
}

interface Props {
  homeId?: string;
}

const RATING_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  outstanding: { label: "Outstanding", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  good: { label: "Good", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  requires_improvement: { label: "Requires Improvement", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  inadequate: { label: "Inadequate", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

const RISK_COLORS: Record<string, string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  moderate: "text-amber-600 dark:text-amber-400",
  high: "text-orange-600 dark:text-orange-400",
  critical: "text-red-600 dark:text-red-400",
};

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  improving: { icon: "^", color: "text-emerald-600 dark:text-emerald-400" },
  stable: { icon: "-", color: "text-muted-foreground" },
  declining: { icon: "v", color: "text-red-600 dark:text-red-400" },
};

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function MentalHealthWellbeingDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/mental-health-wellbeing?homeId=${homeId}`);
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
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const ratingStyle = RATING_STYLES[data.rating] ?? RATING_STYLES.good;
  const highRiskChildren = data.childProfiles.filter(
    c => c.latestOverallRisk === "high" || c.latestOverallRisk === "critical"
  );

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Mental Health & Wellbeing</h3>
              <p className="text-xs text-muted-foreground">Reg 10 / NICE CG26/28</p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ratingStyle.bg} ${ratingStyle.text}`}>
            {ratingStyle.label}
          </div>
        </div>
      </div>

      {/* Overall score */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Overall Score</span>
          <span className="text-sm font-bold">{data.overallScore}/100</span>
        </div>
        <ScoreBar score={data.overallScore} />
      </div>

      {/* High-risk alert */}
      {highRiskChildren.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              {highRiskChildren.length} child{highRiskChildren.length > 1 ? "ren" : ""} at high/critical risk
            </span>
          </div>
          {highRiskChildren.slice(0, 2).map(c => (
            <p key={c.childId} className="text-[10px] text-red-600 dark:text-red-400 line-clamp-1">
              {c.childName}: {c.concerns[0] ?? "Elevated risk"}
            </p>
          ))}
        </div>
      )}

      {/* Scoring breakdown */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Assessments</span>
          <span className="font-medium">{data.scoring.assessmentScore}%</span>
        </div>
        <ScoreBar score={data.scoring.assessmentScore} />
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Interventions</span>
          <span className="font-medium">{data.scoring.interventionScore}%</span>
        </div>
        <ScoreBar score={data.scoring.interventionScore} />
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Incident Response</span>
          <span className="font-medium">{data.scoring.incidentResponseScore}%</span>
        </div>
        <ScoreBar score={data.scoring.incidentResponseScore} />
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Safety Planning</span>
          <span className="font-medium">{data.scoring.safetyPlanScore}%</span>
        </div>
        <ScoreBar score={data.scoring.safetyPlanScore} />
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.assessmentResult.coverageRate >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {data.assessmentResult.coverageRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Assessment coverage</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.interventionResult.attendanceRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {data.interventionResult.attendanceRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Therapy attendance</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.safetyPlanResult.childInvolvementRate >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {data.safetyPlanResult.childInvolvementRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Child voice in plans</p>
        </div>
      </div>

      {/* Child profiles summary */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Child Wellbeing
        </p>
        <div className="space-y-2">
          {data.childProfiles.map(child => {
            const riskColor = RISK_COLORS[child.latestOverallRisk] ?? "text-muted-foreground";
            const trendStyle = TREND_ICONS[child.overallTrend] ?? TREND_ICONS.stable;
            return (
              <div key={child.childId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{child.childName}</span>
                  <span className={`text-[10px] ${trendStyle.color}`}>{trendStyle.icon}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{child.latestOverallScore}/10</span>
                  <span className={`text-[10px] font-medium ${riskColor}`}>
                    {child.latestOverallRisk}
                  </span>
                  {child.activeInterventions.length > 0 && (
                    <span className="inline-flex px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-[9px] text-purple-700 dark:text-purple-400">
                      {child.activeInterventions.length} therapy
                    </span>
                  )}
                  {child.hasSafetyPlan && (
                    <span className={`inline-flex px-1 py-0.5 rounded text-[9px] ${
                      child.safetyPlanStatus === "current"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                    }`}>
                      SP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident summary */}
      {data.incidentResult.totalIncidents > 0 && (
        <div className="px-4 py-2.5 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {data.incidentResult.totalIncidents} incident{data.incidentResult.totalIncidents > 1 ? "s" : ""} in period
            </span>
            <div className="flex gap-3">
              <span className={`text-[10px] font-medium ${data.incidentResult.responseWithin15MinRate >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
                {data.incidentResult.responseWithin15MinRate}% fast response
              </span>
              <span className={`text-[10px] font-medium ${data.incidentResult.camhsNotificationRate >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
                {data.incidentResult.camhsNotificationRate}% CAMHS notified
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions needed */}
      {data.actions.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">Actions needed:</p>
          <ul className="space-y-0.5">
            {data.actions.slice(0, 3).map((action, i) => (
              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                <span className="text-amber-500 mt-0.5">*</span>
                <span className="line-clamp-1">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/child-mental-health-daily-check" className="text-xs text-primary font-medium hover:underline">
          View mental health dashboard &rarr;
        </a>
      </div>
    </div>
  );
}
