"use client";

import { useState, useEffect } from "react";
import { formatRate, meets } from "@/lib/metrics/rate";
import type { LACReviewIntelligence } from "@/lib/lac-review";

const ratingColors: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const ratingLabels: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}</span>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export function LACReviewDashboardWidget() {
  const [data, setData] = useState<LACReviewIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lac-review")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">LAC Review Intelligence</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">LAC Review Intelligence</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.timeliness.totalReviews}</div>
          <div className="text-xs text-gray-500 mt-1">Reviews Held</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.timeliness.timelinessRate)}</div>
          <div className="text-xs text-gray-500 mt-1">On Time</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.participation.meaningfulParticipationRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Child Participation</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.recommendations.completionRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Recs Completed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.recommendations.overdue > 0 ? "text-red-600" : "text-green-600"}`}>
            {data.recommendations.overdue}
          </div>
          <div className="text-xs text-gray-500 mt-1">Overdue Recs</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.timeliness.overallScore} label="Review Timeliness" maxScore={30} />
        <ScoreBar score={data.participation.overallScore} label="Child Participation" maxScore={25} />
        <ScoreBar score={data.recommendations.overallScore} label="Recommendation Tracking" maxScore={25} />
        <ScoreBar score={data.iroEffectiveness.overallScore} label="IRO Effectiveness" maxScore={20} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Child Review Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childProfiles.map((child) => (
              <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{child.childName}</span>
                  <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <StatusBadge ok={meets(child.timelinessRate, 80)} label={`Timely ${formatRate(child.timelinessRate)}`} />
                  <StatusBadge ok={meets(child.participationRate, 75)} label={`Participation ${formatRate(child.participationRate)}`} />
                  <StatusBadge ok={child.overdueRecommendations === 0} label={`${child.overdueRecommendations} Overdue`} />
                  <StatusBadge ok={child.iroMidPointChecks > 0} label={`${child.iroMidPointChecks} Mid-point Checks`} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Reviews: <span className="font-medium">{child.reviewsOnTime}/{child.totalReviews} on time</span></div>
                  <div>Views Captured: <span className="font-medium">{formatRate(child.childViewsCapturedRate)}</span></div>
                  <div>Recs: <span className="font-medium">{child.completedRecommendations}/{child.totalRecommendations} done</span></div>
                  <div>Next Due: <span className="font-medium">{child.nextReviewDue || "—"}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Review Timeliness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.timeliness.totalReviews}</span></div>
            <div><span className="text-gray-500">On Time:</span> <span className="font-medium text-green-600">{data.timeliness.reviewsOnTime}</span></div>
            <div><span className="text-gray-500">Late:</span> <span className={`font-medium ${data.timeliness.reviewsLate > 0 ? "text-red-600" : "text-gray-900"}`}>{data.timeliness.reviewsLate}</span></div>
            <div><span className="text-gray-500">Avg Delay:</span> <span className="font-medium">{data.timeliness.averageDelayDays} days</span></div>
            <div><span className="text-gray-500">Initial On Time:</span> <span className="font-medium">{data.timeliness.initialReviewTimeliness}%</span></div>
            <div><span className="text-gray-500">Subsequent On Time:</span> <span className="font-medium">{data.timeliness.subsequentReviewTimeliness}%</span></div>
            <div><span className="text-gray-500">Emergency Reviews:</span> <span className="font-medium">{data.timeliness.emergencyReviewsHeld}</span></div>
            <div><span className="text-gray-500">Minutes On Time:</span> <span className="font-medium">{formatRate(data.timeliness.minutesDistributedOnTimeRate)}</span></div>
          </div>
        </Section>

        <Section title="Child Participation">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Attended:</span> <span className="font-medium text-green-600">{data.participation.childAttended}</span></div>
            <div><span className="text-gray-500">Written Views:</span> <span className="font-medium">{data.participation.writtenViews}</span></div>
            <div><span className="text-gray-500">Advocate:</span> <span className="font-medium text-purple-600">{data.participation.advocateAttended}</span></div>
            <div><span className="text-gray-500">Via Worker:</span> <span className="font-medium">{data.participation.viewsConveyedByWorker}</span></div>
            <div><span className="text-gray-500">Refused:</span> <span className={`font-medium ${data.participation.refused > 0 ? "text-amber-600" : "text-gray-900"}`}>{data.participation.refused}</span></div>
            <div><span className="text-gray-500">Not Invited:</span> <span className={`font-medium ${data.participation.notInvited > 0 ? "text-red-600" : "text-gray-900"}`}>{data.participation.notInvited}</span></div>
            <div><span className="text-gray-500">Views Captured:</span> <span className="font-medium">{formatRate(data.participation.childViewsCapturedRate)}</span></div>
            <div><span className="text-gray-500">Carer Attended:</span> <span className="font-medium">{formatRate(data.participation.carerAttendedRate)}</span></div>
          </div>
        </Section>

        <Section title="Recommendation Tracking">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.recommendations.totalRecommendations}</span></div>
            <div><span className="text-gray-500">Completed:</span> <span className="font-medium text-green-600">{data.recommendations.completed}</span></div>
            <div><span className="text-gray-500">In Progress:</span> <span className="font-medium text-blue-600">{data.recommendations.inProgress}</span></div>
            <div><span className="text-gray-500">Overdue:</span> <span className={`font-medium ${data.recommendations.overdue > 0 ? "text-red-600" : "text-gray-900"}`}>{data.recommendations.overdue}</span></div>
            <div><span className="text-gray-500">Not Started:</span> <span className="font-medium">{data.recommendations.notStarted}</span></div>
            <div><span className="text-gray-500">Completion Rate:</span> <span className="font-medium">{formatRate(data.recommendations.completionRate)}</span></div>
            <div><span className="text-gray-500">Urgent Done:</span> <span className="font-medium">{formatRate(data.recommendations.urgentCompletionRate)}</span></div>
            <div><span className="text-gray-500">Avg Completion:</span> <span className="font-medium">{data.recommendations.averageCompletionDays} days</span></div>
          </div>
        </Section>

        <Section title="IRO Effectiveness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Activities:</span> <span className="font-medium">{data.iroEffectiveness.totalIROActivities}</span></div>
            <div><span className="text-gray-500">Mid-point Checks:</span> <span className="font-medium">{data.iroEffectiveness.midPointChecks}</span></div>
            <div><span className="text-gray-500">Monitoring:</span> <span className="font-medium">{data.iroEffectiveness.monitoringVisits}</span></div>
            <div><span className="text-gray-500">Consultations:</span> <span className="font-medium">{data.iroEffectiveness.consultations}</span></div>
            <div><span className="text-gray-500">Escalations:</span> <span className="font-medium">{data.iroEffectiveness.escalations}</span></div>
            <div><span className="text-gray-500">Child Spoken To:</span> <span className="font-medium">{formatRate(data.iroEffectiveness.childSpokenToRate)}</span></div>
            <div><span className="text-gray-500">Issues Found:</span> <span className="font-medium">{data.iroEffectiveness.issuesIdentifiedCount}</span></div>
            <div><span className="text-gray-500">Independence:</span> <span className="font-medium">{formatRate(data.iroEffectiveness.iroIndependenceRate)}</span></div>
          </div>
        </Section>

        <Section title="Strengths, Areas & Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Actions</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.actions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">§</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
