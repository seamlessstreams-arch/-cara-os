// ══════════════════════════════════════════════════════════════════════════════
// MultiAgencyDashboardWidget — Professional Network & Coordination card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ChildResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  totalProfessionals: number;
  agencyTypesEngaged: number;
  unresponsiveContacts: number;
  escalationsNeeded: number;
  communicationScore: number;
  averageResponseDays: number;
  swContactCurrent: boolean;
  daysSinceLastSWVisit: number;
  meetingsAttendedRate: number;
  childViewsSubmittedRate: number;
  actionsCompletionRate: number;
  meetingsLast6Months: number;
  activeReferrals: number;
  waitingReferrals: number;
  escalatedReferrals: number;
  averageWaitDays: number;
  childHasAdvocate: boolean;
}

interface HomeMetrics {
  homeId: string;
  totalChildren: number;
  totalProfessionals: number;
  averageAgencyTypes: number;
  totalUnresponsive: number;
  totalEscalations: number;
  averageCommunicationScore: number;
  swContactCurrentRate: number;
  averageMeetingAttendance: number;
  averageChildViewsRate: number;
  averageActionsCompletion: number;
  totalMeetingsLast6Months: number;
  totalActiveReferrals: number;
  totalWaiting: number;
  totalEscalated: number;
  longestWaitDays: number;
  complianceIssues: string[];
  overallScore: number;
}

interface DashboardData {
  metrics: HomeMetrics;
  childResults: ChildResult[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColour(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-50";
  if (score >= 50) return "bg-amber-50";
  return "bg-red-50";
}

// ── Component ────────────────────────────────────────────────────────────────

export function MultiAgencyDashboardWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/multi-agency?homeId=home-oak&mode=dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch multi-agency data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-52 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm">Error loading multi-agency data: {error}</p>
      </div>
    );
  }

  const { metrics, childResults } = data;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Multi-Agency Working
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Professional network, coordination, referrals
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getScoreColour(metrics.overallScore)}`}>
            {metrics.overallScore}%
          </p>
          <p className="text-xs text-slate-400">coordination score</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Communication"
          value={`${metrics.averageCommunicationScore}%`}
          sub={`${metrics.totalProfessionals} contacts`}
          score={metrics.averageCommunicationScore}
        />
        <MetricCard
          label="SW Contact"
          value={`${metrics.swContactCurrentRate}%`}
          sub="visits current"
          score={metrics.swContactCurrentRate}
        />
        <MetricCard
          label="Meeting Attendance"
          value={`${metrics.averageMeetingAttendance}%`}
          sub={`${metrics.totalMeetingsLast6Months} meetings (6mo)`}
          score={metrics.averageMeetingAttendance}
        />
        <MetricCard
          label="Actions Done"
          value={`${metrics.averageActionsCompletion}%`}
          sub="from meetings"
          score={metrics.averageActionsCompletion}
        />
      </div>

      {/* Referrals Status */}
      <div className={`flex items-center justify-between p-3 rounded-lg ${metrics.totalWaiting === 0 ? "bg-green-50" : metrics.longestWaitDays > 56 ? "bg-red-50" : "bg-amber-50"}`}>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500">Active Referrals</p>
            <p className="text-sm font-semibold text-slate-800">{metrics.totalActiveReferrals}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Waiting</p>
            <p className={`text-sm font-semibold ${metrics.totalWaiting > 0 ? "text-amber-700" : "text-green-700"}`}>
              {metrics.totalWaiting}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Escalated</p>
            <p className={`text-sm font-semibold ${metrics.totalEscalated > 0 ? "text-red-700" : "text-green-700"}`}>
              {metrics.totalEscalated}
            </p>
          </div>
        </div>
        {metrics.longestWaitDays > 0 && (
          <span className="text-xs text-slate-600">
            Longest wait: {metrics.longestWaitDays} days
          </span>
        )}
      </div>

      {/* Per-Child Summary */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Per-Child Coordination</h4>
        <div className="space-y-2">
          {childResults.map((child) => (
            <div
              key={child.childId}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getScoreBg(child.communicationScore)} ${getScoreColour(child.communicationScore)}`}>
                  {child.communicationScore}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{child.childName}</p>
                  <p className="text-xs text-slate-500">
                    {child.totalProfessionals} professionals &middot; {child.agencyTypesEngaged} agencies &middot; {child.meetingsLast6Months} meetings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {child.escalationsNeeded > 0 && (
                  <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                    {child.escalationsNeeded} escalation
                  </span>
                )}
                {child.waitingReferrals > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                    {child.waitingReferrals} waiting
                  </span>
                )}
                {!child.swContactCurrent && (
                  <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                    SW overdue
                  </span>
                )}
                {child.isCompliant && child.escalationsNeeded === 0 && (
                  <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                    On track
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {(metrics.totalUnresponsive > 0 || metrics.totalEscalations > 0) && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-1">Communication Alerts</h4>
          <p className="text-xs text-amber-700">
            {metrics.totalUnresponsive > 0 && `${metrics.totalUnresponsive} unresponsive contact(s). `}
            {metrics.totalEscalations > 0 && `${metrics.totalEscalations} requiring escalation.`}
          </p>
        </div>
      )}

      {/* Compliance Issues */}
      {metrics.complianceIssues.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Issues ({metrics.complianceIssues.length})
          </h4>
          <ul className="space-y-1">
            {metrics.complianceIssues.map((issue, i) => (
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
          <MiniStat label="Child views" value={`${metrics.averageChildViewsRate}%`} />
          <MiniStat label="Avg agencies" value={String(metrics.averageAgencyTypes)} />
        </div>
        <span className="text-xs text-slate-400">
          Reg 5/14 &middot; Working Together 2023
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
  score,
}: {
  label: string;
  value: string;
  sub: string;
  score: number;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${getScoreColour(score)}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
