"use client";

import { useEffect, useState } from "react";

// ── Local Interfaces (mirror engine types for client) ──────────────────────

interface StaffResilienceProfile {
  staffId: string;
  staffName: string;
  absenceDays: number;
  supportAccesses: number;
  supervisionCount: number;
  supervisionOverdue: boolean;
  hasTraumaIndicators: boolean;
  indicatorCount: number;
  riskFlags: string[];
}

interface RegulatoryLink {
  regulation: string;
  requirement: string;
  status: "met" | "partially_met" | "not_met";
  evidence: string;
}

interface StaffAbsencePattern {
  staffId: string;
  staffName: string;
  totalDays: number;
  stressDays: number;
  absenceCount: number;
  returnToWorkRate: number;
  hasAdjustments: boolean;
}

interface StaffSupervisionDetail {
  staffId: string;
  staffName: string;
  supervisionCount: number;
  lastSupervisionDate: string | null;
  isOverdue: boolean;
  wellbeingDiscussedRate: number;
  actionCompletionRate: number;
}

interface ResilienceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  overallScore: number;
  overallRating: string;
  componentScores: {
    absenceManagement: number;
    supportAccess: number;
    supervisionQuality: number;
    teamHealth: number;
    secondaryTrauma: number;
  };
  absencePatterns: {
    overallAbsenceRate: number;
    stressRelatedAbsenceRate: number;
    returnToWorkCompletionRate: number;
    adjustmentRate: number;
    staffPatterns: StaffAbsencePattern[];
    totalAbsenceDays: number;
    totalStressAbsenceDays: number;
  };
  supportAccess: {
    accessRatePerStaff: number;
    supportTypeVariety: number;
    voluntaryAccessRate: number;
    satisfactionRate: number;
    followUpRate: number;
    totalAccesses: number;
    typeBreakdown: Record<string, number>;
  };
  supervisionQuality: {
    frequencyRate: number;
    wellbeingDiscussedRate: number;
    workloadDiscussedRate: number;
    actionCompletionRate: number;
    averageActionPoints: number;
    overdueCount: number;
    staffSupervisionDetails: StaffSupervisionDetail[];
  };
  teamHealth: {
    latestMorale: string;
    moraleTrend: string;
    workloadManageableRate: number;
    supportAdequacyRate: number;
    communicationEffectiveRate: number;
    actionCompletionRate: number;
    totalIssuesRaised: number;
    totalActionsAgreed: number;
  };
  secondaryTrauma: {
    screeningCoverage: number;
    indicatorPrevalence: number;
    supportOfferedRate: number;
    supportAcceptedRate: number;
    actionPlanRate: number;
    mostCommonIndicators: { indicator: string; count: number }[];
    staffWithIndicators: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  recommendedActions: string[];
  regulatoryLinks: RegulatoryLink[];
  staffProfiles: StaffResilienceProfile[];
}

// ── Styles ─────────────────────────────────────────────────────────────────

const RATING_STYLES: Record<string, string> = {
  outstanding: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  requires_improvement: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  inadequate: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_STYLES: Record<string, string> = {
  met: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  partially_met: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  not_met: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  met: "Met",
  partially_met: "Partial",
  not_met: "Not Met",
};

const MORALE_STYLES: Record<string, string> = {
  high: "text-emerald-600 dark:text-emerald-400",
  good: "text-blue-600 dark:text-blue-400",
  mixed: "text-amber-600 dark:text-amber-400",
  low: "text-red-600 dark:text-red-400",
  no_data: "text-muted-foreground",
};

const TREND_ICONS: Record<string, string> = {
  improving: "^",
  stable: "-",
  declining: "v",
  insufficient_data: "?",
};

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  homeId?: string;
}

export function StaffResilienceDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<ResilienceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff-resilience`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-600 dark:text-red-400 font-medium text-sm">Failed to load resilience data</span>
        </div>
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        <button onClick={fetchData} className="mt-3 text-xs text-primary font-medium hover:underline">
          Retry
        </button>
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Staff Resilience</h3>
              <p className="text-xs text-muted-foreground">Burnout, trauma awareness & support</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${RATING_STYLES[data.overallRating] ?? ""}`}>
              {data.overallRating.replace("_", " ")}
            </span>
            <span className="text-lg font-bold">{data.overallScore}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.absencePatterns.overallAbsenceRate > 10 ? "text-red-600 dark:text-red-400" : data.absencePatterns.overallAbsenceRate > 5 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
            {data.absencePatterns.overallAbsenceRate}d
          </p>
          <p className="text-[10px] text-muted-foreground">Absence Rate</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.supportAccess.accessRatePerStaff >= 2 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
            {data.supportAccess.accessRatePerStaff}
          </p>
          <p className="text-[10px] text-muted-foreground">Support Access</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.supervisionQuality.frequencyRate >= 90 ? "text-emerald-600 dark:text-emerald-400" : data.supervisionQuality.frequencyRate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
            {data.supervisionQuality.frequencyRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Supervision Currency</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold capitalize ${MORALE_STYLES[data.teamHealth.latestMorale] ?? ""}`}>
            {data.teamHealth.latestMorale === "no_data" ? "N/A" : data.teamHealth.latestMorale}
          </p>
          <p className="text-[10px] text-muted-foreground">Team Morale</p>
        </div>
      </div>

      {/* Component Scores */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Component Scores</p>
        <div className="space-y-1.5">
          {[
            { label: "Absence Management", score: data.componentScores.absenceManagement, max: 20 },
            { label: "Support Access", score: data.componentScores.supportAccess, max: 20 },
            { label: "Supervision Quality", score: data.componentScores.supervisionQuality, max: 25 },
            { label: "Team Health", score: data.componentScores.teamHealth, max: 15 },
            { label: "Secondary Trauma", score: data.componentScores.secondaryTrauma, max: 20 },
          ].map(({ label, score, max }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-28 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${score / max >= 0.75 ? "bg-emerald-500" : score / max >= 0.5 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${(score / max) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-medium w-8 text-right">{score}/{max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable: Staff Profiles */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("profiles")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Staff Profiles</span>
          <span className="text-[10px] text-muted-foreground">{expanded.profiles ? "v" : ">"}</span>
        </button>
        {expanded.profiles && (
          <div className="divide-y divide-border">
            {data.staffProfiles.map(p => (
              <div key={p.staffId} className="px-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{p.staffName}</span>
                  <div className="flex items-center gap-1.5">
                    {p.supervisionOverdue && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">sup overdue</span>
                    )}
                    {p.hasTraumaIndicators && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">{p.indicatorCount} indicators</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span>{p.absenceDays}d absent</span>
                  <span>{p.supportAccesses} supports</span>
                  <span>{p.supervisionCount} supervisions</span>
                </div>
                {p.riskFlags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.riskFlags.map((flag, i) => (
                      <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">{flag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expandable: Absence Patterns */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("absence")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Absence Patterns</span>
          <span className="text-[10px] text-muted-foreground">{expanded.absence ? "v" : ">"}</span>
        </button>
        {expanded.absence && (
          <div className="px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Total absence days</span><span className="font-medium">{data.absencePatterns.totalAbsenceDays}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Stress absence days</span><span className="font-medium">{data.absencePatterns.totalStressAbsenceDays}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Stress absence rate</span><span className="font-medium">{data.absencePatterns.stressRelatedAbsenceRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">RTW completion</span><span className="font-medium">{data.absencePatterns.returnToWorkCompletionRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Adjustment rate</span><span className="font-medium">{data.absencePatterns.adjustmentRate}%</span></div>
            </div>
            <div className="mt-2 divide-y divide-border">
              {data.absencePatterns.staffPatterns.map(sp => (
                <div key={sp.staffId} className="py-1.5 flex justify-between text-[10px]">
                  <span>{sp.staffName}</span>
                  <span className="text-muted-foreground">{sp.totalDays}d ({sp.absenceCount} absences{sp.stressDays > 0 ? `, ${sp.stressDays}d stress` : ""})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expandable: Support Access */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("support")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Support Access</span>
          <span className="text-[10px] text-muted-foreground">{expanded.support ? "v" : ">"}</span>
        </button>
        {expanded.support && (
          <div className="px-4 py-3 space-y-2 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Total accesses</span><span className="font-medium">{data.supportAccess.totalAccesses}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Per staff</span><span className="font-medium">{data.supportAccess.accessRatePerStaff}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type variety</span><span className="font-medium">{data.supportAccess.supportTypeVariety} types</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Voluntary rate</span><span className="font-medium">{data.supportAccess.voluntaryAccessRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Satisfaction</span><span className="font-medium">{data.supportAccess.satisfactionRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Follow-up rate</span><span className="font-medium">{data.supportAccess.followUpRate}%</span></div>
            </div>
            <div className="mt-2">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Type breakdown</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.supportAccess.typeBreakdown).map(([type, count]) => (
                  <span key={type} className="px-1.5 py-0.5 rounded bg-muted text-[9px]">
                    {type.replace(/_/g, " ")} ({count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable: Supervision Quality */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("supervision")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Supervision Quality</span>
          <span className="text-[10px] text-muted-foreground">{expanded.supervision ? "v" : ">"}</span>
        </button>
        {expanded.supervision && (
          <div className="px-4 py-3 space-y-2 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Frequency rate</span><span className="font-medium">{data.supervisionQuality.frequencyRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Wellbeing discussed</span><span className="font-medium">{data.supervisionQuality.wellbeingDiscussedRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Workload discussed</span><span className="font-medium">{data.supervisionQuality.workloadDiscussedRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Action completion</span><span className="font-medium">{data.supervisionQuality.actionCompletionRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg action points</span><span className="font-medium">{data.supervisionQuality.averageActionPoints}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Overdue</span><span className={`font-medium ${data.supervisionQuality.overdueCount > 0 ? "text-red-600 dark:text-red-400" : ""}`}>{data.supervisionQuality.overdueCount}</span></div>
            </div>
            <div className="mt-2 divide-y divide-border">
              {data.supervisionQuality.staffSupervisionDetails.map(sd => (
                <div key={sd.staffId} className="py-1.5">
                  <div className="flex justify-between">
                    <span className="font-medium">{sd.staffName}</span>
                    <span className="text-muted-foreground">{sd.supervisionCount} sessions</span>
                  </div>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>Wellbeing: {sd.wellbeingDiscussedRate}%</span>
                    <span>Actions: {sd.actionCompletionRate}%</span>
                    {sd.isOverdue && <span className="text-red-600 dark:text-red-400">OVERDUE</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expandable: Team Health */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("teamHealth")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Team Health</span>
          <span className="text-[10px] text-muted-foreground">{expanded.teamHealth ? "v" : ">"}</span>
        </button>
        {expanded.teamHealth && (
          <div className="px-4 py-3 space-y-2 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Latest morale</span><span className={`font-medium capitalize ${MORALE_STYLES[data.teamHealth.latestMorale] ?? ""}`}>{data.teamHealth.latestMorale}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Morale trend</span><span className="font-medium">{TREND_ICONS[data.teamHealth.moraleTrend] ?? ""} {data.teamHealth.moraleTrend}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Workload manageable</span><span className="font-medium">{data.teamHealth.workloadManageableRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Support adequate</span><span className="font-medium">{data.teamHealth.supportAdequacyRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Communication</span><span className="font-medium">{data.teamHealth.communicationEffectiveRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Actions completed</span><span className="font-medium">{data.teamHealth.actionCompletionRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Issues raised</span><span className="font-medium">{data.teamHealth.totalIssuesRaised}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Actions agreed</span><span className="font-medium">{data.teamHealth.totalActionsAgreed}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable: Secondary Trauma Awareness */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("trauma")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Secondary Trauma Awareness</span>
          <span className="text-[10px] text-muted-foreground">{expanded.trauma ? "v" : ">"}</span>
        </button>
        {expanded.trauma && (
          <div className="px-4 py-3 space-y-2 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Screening coverage</span><span className="font-medium">{data.secondaryTrauma.screeningCoverage}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg indicators/staff</span><span className="font-medium">{data.secondaryTrauma.indicatorPrevalence}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Staff with indicators</span><span className="font-medium">{data.secondaryTrauma.staffWithIndicators}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Support offered</span><span className="font-medium">{data.secondaryTrauma.supportOfferedRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Support accepted</span><span className="font-medium">{data.secondaryTrauma.supportAcceptedRate}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Action plan rate</span><span className="font-medium">{data.secondaryTrauma.actionPlanRate}%</span></div>
            </div>
            {data.secondaryTrauma.mostCommonIndicators.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Common indicators</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.secondaryTrauma.mostCommonIndicators.map(({ indicator, count }) => (
                    <span key={indicator} className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-[9px]">
                      {indicator.replace(/_/g, " ")} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable: Strengths / Areas / Actions */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("insights")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Strengths / Areas / Actions</span>
          <span className="text-[10px] text-muted-foreground">{expanded.insights ? "v" : ">"}</span>
        </button>
        {expanded.insights && (
          <div className="px-4 py-3 space-y-3">
            {data.strengths.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">Strengths</p>
                <ul className="space-y-0.5">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex gap-1"><span className="text-emerald-500">+</span> {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.areasForImprovement.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mb-1">Areas for Improvement</p>
                <ul className="space-y-0.5">
                  {data.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex gap-1"><span className="text-amber-500">!</span> {a}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.recommendedActions.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mb-1">Recommended Actions</p>
                <ul className="space-y-0.5">
                  {data.recommendedActions.map((a, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex gap-1"><span className="text-blue-500">&gt;</span> {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable: Regulatory Framework */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("regulatory")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Regulatory Framework</span>
          <span className="text-[10px] text-muted-foreground">{expanded.regulatory ? "v" : ">"}</span>
        </button>
        {expanded.regulatory && (
          <div className="divide-y divide-border">
            {data.regulatoryLinks.map((reg, i) => (
              <div key={i} className="px-4 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium">{reg.regulation}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${STATUS_STYLES[reg.status] ?? ""}`}>
                    {STATUS_LABELS[reg.status] ?? reg.status}
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground">{reg.requirement}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{reg.evidence}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <span className="text-[10px] text-muted-foreground">
          Generated {new Date(data.generatedAt).toLocaleDateString("en-GB")}
        </span>
      </div>
    </div>
  );
}
