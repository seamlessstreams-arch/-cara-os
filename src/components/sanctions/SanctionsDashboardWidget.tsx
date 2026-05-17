// ══════════════════════════════════════════════════════════════════════════════
// SanctionsDashboardWidget — Sanctions & Rewards dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ChildSummary {
  childId: string;
  childName: string;
  totalSanctions30Days: number;
  totalRewards30Days: number;
  rewardToSanctionRatio: number;
  isCompliant: boolean;
  escalatingPattern: boolean;
  behaviourPlanInPlace: boolean;
  issues: number;
  warnings: number;
}

interface RecentSanction {
  id: string;
  childName: string;
  date: string;
  type: string;
  behaviour: string;
  proportionality: string;
  deEscalationAttempted: boolean;
  reviewedByManager: boolean;
}

interface BehaviourCount {
  behaviour: string;
  count: number;
}

interface Metrics {
  totalSanctions30Days: number;
  totalRewards30Days: number;
  rewardToSanctionRatio: number;
  overallComplianceRate: number;
  prohibitedPunishmentCount: number;
  childViewRecordedRate: number;
  deEscalationAttemptRate: number;
  proportionalityRate: number;
  managerReviewRate: number;
  trendDirection: string;
  averageSanctionsPerMonth: number;
}

interface DashboardData {
  metrics: Metrics;
  children: ChildSummary[];
  recentSanctions: RecentSanction[];
  topBehaviours: BehaviourCount[];
  complianceIssues: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getSanctionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    loss_of_privilege: "Loss of Privilege",
    early_bedtime: "Early Bedtime",
    reparation: "Reparation",
    additional_chore: "Additional Chore",
    reduced_screen_time: "Reduced Screen Time",
    grounding: "Grounding",
    restorative_conversation: "Restorative Conversation",
    written_apology: "Written Apology",
    time_out: "Time Out",
    other: "Other",
  };
  return labels[type] ?? type;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function getTrendIcon(trend: string): string {
  if (trend === "decreasing") return "↓";
  if (trend === "increasing") return "↑";
  return "→";
}

function getTrendColour(trend: string): string {
  if (trend === "decreasing") return "text-green-600";
  if (trend === "increasing") return "text-red-600";
  return "text-slate-500";
}

// ── Component ────────────────────────────────────────────────────────────────

export function SanctionsDashboardWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sanctions?homeId=home-oak&mode=dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sanctions data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
          <div className="h-4 w-1/2 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm">Error loading sanctions data: {error}</p>
      </div>
    );
  }

  const { metrics, children, recentSanctions, topBehaviours, complianceIssues } = data;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Sanctions & Rewards
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Behaviour management, proportionality, positive reinforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getTrendColour(metrics.trendDirection)}`}>
            {getTrendIcon(metrics.trendDirection)}
          </span>
          <span className="text-xs text-slate-400">
            {metrics.averageSanctionsPerMonth}/month avg
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Rewards : Sanctions"
          value={`${metrics.rewardToSanctionRatio}:1`}
          sub={`${metrics.totalRewards30Days} rewards, ${metrics.totalSanctions30Days} sanctions`}
          alert={metrics.rewardToSanctionRatio < 2}
          positive={metrics.rewardToSanctionRatio >= 3}
        />
        <MetricCard
          label="De-escalation"
          value={`${metrics.deEscalationAttemptRate}%`}
          sub="attempted before sanction"
          alert={metrics.deEscalationAttemptRate < 100}
        />
        <MetricCard
          label="Proportionality"
          value={`${metrics.proportionalityRate}%`}
          sub="assessed as proportionate"
          alert={metrics.proportionalityRate < 100}
        />
        <MetricCard
          label="Child's Voice"
          value={`${metrics.childViewRecordedRate}%`}
          sub="view recorded"
          alert={metrics.childViewRecordedRate < 100}
        />
      </div>

      {/* Prohibited Alert */}
      {metrics.prohibitedPunishmentCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-800">
            ⚠ {metrics.prohibitedPunishmentCount} Prohibited Punishment(s) Recorded
          </p>
          <p className="text-xs text-red-600 mt-1">
            Immediate investigation and action required under Reg 19
          </p>
        </div>
      )}

      {/* Per-Child Summary */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Children</h4>
        <div className="space-y-2">
          {children.map((child) => (
            <div
              key={child.childId}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    child.escalatingPattern
                      ? "bg-red-500"
                      : child.isCompliant
                      ? "bg-green-500"
                      : "bg-amber-500"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">{child.childName}</p>
                  <p className="text-xs text-slate-500">
                    {child.totalRewards30Days} rewards, {child.totalSanctions30Days} sanctions
                    {child.behaviourPlanInPlace && " · Plan in place"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    child.rewardToSanctionRatio >= 3
                      ? "bg-green-50 text-green-700"
                      : child.rewardToSanctionRatio >= 2
                      ? "bg-blue-50 text-blue-700"
                      : child.totalSanctions30Days === 0
                      ? "bg-slate-50 text-slate-600"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {child.totalSanctions30Days > 0
                    ? `${child.rewardToSanctionRatio}:1`
                    : "No sanctions"}
                </span>
                {child.escalatingPattern && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                    Escalating
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sanctions */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Recent Sanctions</h4>
        <div className="space-y-1.5">
          {recentSanctions.map((sanction) => (
            <div
              key={sanction.id}
              className="flex items-center justify-between py-2 px-3 rounded border border-slate-50 bg-slate-50/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-12">{formatDate(sanction.date)}</span>
                <span className="text-xs font-medium text-slate-700">{sanction.childName}</span>
                <span className="text-xs text-slate-500">
                  {getSanctionTypeLabel(sanction.type)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {sanction.deEscalationAttempted && (
                  <span className="text-xs text-green-600" title="De-escalation attempted">✓</span>
                )}
                {sanction.reviewedByManager && (
                  <span className="text-xs text-blue-600" title="Manager reviewed">✓</span>
                )}
                {sanction.proportionality === "disproportionate" && (
                  <span className="text-xs text-red-600" title="Disproportionate">⚠</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Behaviours */}
      {topBehaviours.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Top Behaviours Triggering Sanctions</h4>
          <div className="flex flex-wrap gap-2">
            {topBehaviours.map((b) => (
              <span
                key={b.behaviour}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
              >
                {b.behaviour} ({b.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Issues */}
      {complianceIssues.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Compliance Issues ({complianceIssues.length})
          </h4>
          <ul className="space-y-1">
            {complianceIssues.map((issue, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <MiniStat
            label="Manager Reviews"
            value={`${metrics.managerReviewRate}%`}
            alert={metrics.managerReviewRate < 100}
          />
          <MiniStat
            label="Compliance"
            value={`${metrics.overallComplianceRate}%`}
            alert={metrics.overallComplianceRate < 100}
          />
        </div>
        <span className="text-xs text-slate-400">
          Reg 19 &middot; Positive Behaviour Support
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  alert,
  positive,
}: {
  label: string;
  value: string | number;
  sub: string;
  alert?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p
        className={`text-lg font-semibold ${
          alert ? "text-red-600" : positive ? "text-green-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <span
        className={`text-xs font-semibold ${
          alert ? "text-amber-600" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
