// ══════════════════════════════════════════════════════════════════════════════
// OutcomesMeasurementDashboardWidget — Outcomes progress & measurement overview
//
// "Is the home making a measurable positive difference for children?"
// SCCIF overall effectiveness, CHR 2015 Reg 6 / Reg 9.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

// ── Types (mirrored from engine for widget isolation) ───────────────────────

interface DomainProgress {
  domain: string;
  domainLabel: string;
  childCount: number;
  averageBaselineScore: number;
  averageCurrentScore: number;
  averageChange: number;
  progressStatus: string;
  childrenProgressing: number;
  childrenRegressing: number;
  childrenNoChange: number;
}

interface RegressionAlert {
  childId: string;
  childName: string;
  domain: string;
  domainLabel: string;
  baselineScore: number;
  currentScore: number;
  change: number;
}

interface AtRiskTarget {
  childId: string;
  childName: string;
  domain: string;
  domainLabel: string;
  targetDescription: string;
  targetScore: number;
  currentScore: number;
  targetDate: string;
  daysRemaining: number;
}

interface ChildProfile {
  childId: string;
  childName: string;
  domainsImproving: number;
  domainsRegressing: number;
  domainsStable: number;
  overallProgressSummary: string;
  targetsAchieved: number;
  targetsAtRisk: number;
  hasPlan: boolean;
  planCurrent: boolean;
}

interface OutcomesData {
  homeId: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  progressFromBaseline: {
    totalChildren: number;
    domainsAssessed: number;
    domainProgress: DomainProgress[];
    overallImprovementRate: number;
    regressionAlerts: RegressionAlert[];
  };
  targetAchievement: {
    totalTargets: number;
    achievedCount: number;
    onTrackCount: number;
    atRiskCount: number;
    achievedRate: number;
    onTrackRate: number;
    atRiskDetails: AtRiskTarget[];
  };
  outcomePlanning: {
    childrenWithPlans: number;
    planCoverageRate: number;
    planCurrencyRate: number;
    childInvolvementRate: number;
    overduePlans: number;
  };
  measurementQuality: {
    baselineCoverageRate: number;
    methodDiversityScore: number;
    childVoiceInclusion: number;
  };
  childProfiles: ChildProfile[];
  strengths: string[];
  immediateActions: string[];
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  homeId?: string;
}

// ── Rating helpers ─────────────────────────────────────────────────────────

const RATING_CONFIG = {
  outstanding: { label: "Outstanding", bg: "bg-emerald-100 text-emerald-800", color: "text-emerald-600" },
  good: { label: "Good", bg: "bg-blue-100 text-blue-800", color: "text-blue-600" },
  requires_improvement: { label: "Requires Improvement", bg: "bg-amber-100 text-amber-800", color: "text-amber-600" },
  inadequate: { label: "Inadequate", bg: "bg-red-100 text-red-800", color: "text-red-600" },
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function progressIcon(status: string): string {
  switch (status) {
    case "significant_progress":
    case "good_progress":
      return "↑"; // up arrow
    case "some_progress":
      return "↗"; // up-right arrow
    case "no_change":
      return "→"; // right arrow
    case "regression":
      return "↓"; // down arrow
    default:
      return "•"; // bullet
  }
}

function progressColor(status: string): string {
  switch (status) {
    case "significant_progress":
    case "good_progress":
      return "text-emerald-600";
    case "some_progress":
      return "text-blue-600";
    case "no_change":
      return "text-amber-600";
    case "regression":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function OutcomesMeasurementDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<OutcomesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/outcomes-measurement?homeId=${homeId}`);
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
        <div className="h-4 w-40 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const ratingCfg = RATING_CONFIG[data.rating];

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Outcomes Measurement</h3>
              <p className="text-xs text-muted-foreground">
                {data.progressFromBaseline.totalChildren} children tracked
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ratingCfg.bg}`}>
            {ratingCfg.label}
          </span>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-px bg-border">
        <Stat label="Overall" value={`${data.overallScore}%`} color={scoreColor(data.overallScore)} />
        <Stat
          label="Improving"
          value={`${data.progressFromBaseline.overallImprovementRate}%`}
          color={data.progressFromBaseline.overallImprovementRate >= 75 ? "text-emerald-600" : "text-amber-600"}
        />
        <Stat
          label="Achieved"
          value={`${data.targetAchievement.achievedRate}%`}
          color={data.targetAchievement.achievedRate >= 50 ? "text-emerald-600" : "text-amber-600"}
        />
        <Stat
          label="At Risk"
          value={`${data.targetAchievement.atRiskCount}`}
          alert={data.targetAchievement.atRiskCount > 0}
        />
      </div>

      {/* Domain Progress */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Domain Progress
          </p>
        </div>
        <div className="divide-y divide-border">
          {data.progressFromBaseline.domainProgress.slice(0, 6).map((dp) => (
            <div key={dp.domain} className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${progressColor(dp.progressStatus)}`}>
                  {progressIcon(dp.progressStatus)}
                </span>
                <div>
                  <p className="text-xs font-medium">{dp.domainLabel}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {dp.averageBaselineScore} &rarr; {dp.averageCurrentScore}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      dp.averageChange >= 2
                        ? "bg-emerald-500"
                        : dp.averageChange >= 1
                          ? "bg-blue-500"
                          : dp.averageChange >= 0
                            ? "bg-amber-500"
                            : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (dp.averageCurrentScore / 10) * 100))}%` }}
                  />
                </div>
                <span className={`text-xs font-medium w-10 text-right ${
                  dp.averageChange > 0
                    ? "text-emerald-600"
                    : dp.averageChange < 0
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}>
                  {dp.averageChange > 0 ? "+" : ""}{dp.averageChange}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Child Profiles */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Children
          </p>
        </div>
        <div className="divide-y divide-border">
          {data.childProfiles.slice(0, 4).map((child) => (
            <div key={child.childId} className="px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">{child.childName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {child.domainsImproving > 0 && `${child.domainsImproving} improving`}
                  {child.domainsImproving > 0 && child.domainsRegressing > 0 && ", "}
                  {child.domainsRegressing > 0 && (
                    <span className="text-red-600">{child.domainsRegressing} regressing</span>
                  )}
                  {child.domainsImproving === 0 && child.domainsRegressing === 0 && "Stable"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {child.targetsAchieved > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {child.targetsAchieved} achieved
                  </span>
                )}
                {child.targetsAtRisk > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    {child.targetsAtRisk} at risk
                  </span>
                )}
                {!child.planCurrent && child.hasPlan && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    plan overdue
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regression alerts */}
      {data.progressFromBaseline.regressionAlerts.length > 0 && (
        <div className="border-t border-border bg-red-50/50 dark:bg-red-900/10 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 mb-1">
            Regression Alerts
          </p>
          <div className="flex flex-wrap gap-2">
            {data.progressFromBaseline.regressionAlerts.map((r) => (
              <span
                key={`${r.childId}-${r.domain}`}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              >
                {r.childName}: {r.domainLabel} ({r.change})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quality indicators */}
      <div className="border-t border-border p-3">
        <div className="grid grid-cols-3 gap-2">
          <QualityBadge
            label="Baselines"
            value={data.measurementQuality.baselineCoverageRate}
          />
          <QualityBadge
            label="Method Diversity"
            value={data.measurementQuality.methodDiversityScore}
          />
          <QualityBadge
            label="Child Voice"
            value={data.measurementQuality.childVoiceInclusion}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border text-center">
        <a href="/outcomes" className="text-xs text-primary font-medium hover:underline">
          View outcomes measurement details &rarr;
        </a>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  alert,
  color,
}: {
  label: string;
  value: string;
  alert?: boolean;
  color?: string;
}) {
  return (
    <div className="bg-card p-3 text-center">
      <p className={`text-lg font-bold ${alert ? "text-red-600 dark:text-red-400" : color ?? ""}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function QualityBadge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80
      ? "text-emerald-600"
      : value >= 60
        ? "text-blue-600"
        : value >= 40
          ? "text-amber-600"
          : "text-red-600";

  return (
    <div className="text-center">
      <p className={`text-sm font-bold ${color}`}>{value}%</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
