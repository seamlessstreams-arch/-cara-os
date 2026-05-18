"use client";

import { useState, useEffect } from "react";
import type { SupervisionQualityIntelligence } from "@/lib/supervision-quality";

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

const qualityLabels: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  adequate: "Adequate",
  inadequate: "Inadequate",
  none: "No Sessions",
};

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const pctVal = (score / maxScore) * 100;
  const color = pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-blue-500" : pctVal >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
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

export function SupervisionQualityDashboardWidget() {
  const [data, setData] = useState<SupervisionQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/supervision-quality")
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
        <h3 className="text-lg font-semibold text-red-800">Supervision Quality</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Supervision Quality</h3>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.sessionQuality.outstandingGoodRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Session Quality</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.scheduleCompliance.onScheduleRate}%</div>
          <div className="text-xs text-gray-500 mt-1">On Schedule</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.actionTracking.completedOnTimeRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Actions On Time</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffDevelopment.improvementRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Staff Improvement</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.sessionQuality.overallScore} label="Session Quality" maxScore={25} />
        <ScoreBar score={data.scheduleCompliance.overallScore} label="Schedule Compliance" maxScore={25} />
        <ScoreBar score={data.actionTracking.overallScore} label="Action Tracking" maxScore={25} />
        <ScoreBar score={data.staffDevelopment.overallScore} label="Staff Development" maxScore={25} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {data.staffProfiles.length > 0 && (
          <Section title="Staff Profiles" defaultOpen>
            <div className="space-y-3">
              {data.staffProfiles.map((profile) => (
                <div key={profile.staffId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{profile.staffName}</span>
                    <span className="text-sm text-gray-500">{profile.overallScore}/10</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <StatusBadge ok={profile.sessionCount >= 3} label={`${profile.sessionCount} sessions`} />
                    <StatusBadge ok={!profile.overdue} label={profile.overdue ? "Overdue" : "On Schedule"} />
                    <StatusBadge ok={profile.actionsOutstanding === 0} label={`${profile.actionsCompleted} done / ${profile.actionsOutstanding} outstanding`} />
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {qualityLabels[profile.qualityAverage] || profile.qualityAverage}
                    </span>
                  </div>
                  {profile.lastSessionDate && (
                    <div className="text-xs text-gray-400">Last session: {profile.lastSessionDate}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Session Quality">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Sessions:</span> <span className="font-medium">{data.sessionQuality.totalSessions}</span></div>
            <div><span className="text-gray-500">Outstanding/Good:</span> <span className="font-medium">{data.sessionQuality.outstandingGoodRate}%</span></div>
            <div><span className="text-gray-500">Reflective Rate:</span> <span className="font-medium">{data.sessionQuality.reflectiveRate}%</span></div>
            <div><span className="text-gray-500">Safeguarding Discussed:</span> <span className="font-medium">{data.sessionQuality.safeguardingDiscussionRate}%</span></div>
            <div><span className="text-gray-500">Avg Duration:</span> <span className="font-medium">{data.sessionQuality.averageDurationMinutes} mins</span></div>
            <div><span className="text-gray-500">Recording Compliance:</span> <span className="font-medium">{data.sessionQuality.recordingComplianceRate}%</span></div>
            <div><span className="text-gray-500">Sign-Off Rate:</span> <span className="font-medium">{data.sessionQuality.signOffRate}%</span></div>
          </div>
        </Section>

        <Section title="Schedule Compliance">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Staff:</span> <span className="font-medium">{data.scheduleCompliance.totalStaff}</span></div>
            <div><span className="text-gray-500">On Schedule:</span> <span className="font-medium">{data.scheduleCompliance.onScheduleRate}%</span></div>
            <div><span className="text-gray-500">Overdue:</span> <span className={`font-medium ${data.scheduleCompliance.overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.scheduleCompliance.overdueCount}</span></div>
            <div><span className="text-gray-500">Max Consecutive Missed:</span> <span className={`font-medium ${data.scheduleCompliance.consecutiveMissedMax > 1 ? "text-amber-600" : "text-green-600"}`}>{data.scheduleCompliance.consecutiveMissedMax}</span></div>
            <div><span className="text-gray-500">Avg Days Between:</span> <span className="font-medium">{data.scheduleCompliance.averageDaysBetweenSessions}</span></div>
          </div>
        </Section>

        <Section title="Action Tracking">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Actions:</span> <span className="font-medium">{data.actionTracking.totalActions}</span></div>
            <div><span className="text-gray-500">On Time:</span> <span className="font-medium">{data.actionTracking.completedOnTimeRate}%</span></div>
            <div><span className="text-gray-500">Overdue:</span> <span className={`font-medium ${data.actionTracking.overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.actionTracking.overdueCount}</span></div>
            <div><span className="text-gray-500">Safeguarding Completion:</span> <span className="font-medium">{data.actionTracking.safeguardingActionCompletionRate}%</span></div>
          </div>
          {Object.keys(data.actionTracking.byCategory).length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">By Category:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(data.actionTracking.byCategory).map(([cat, count]) => (
                  <span key={cat} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {cat}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Staff Development">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Outcomes:</span> <span className="font-medium">{data.staffDevelopment.totalOutcomes}</span></div>
            <div><span className="text-gray-500">Improvement Rate:</span> <span className="font-medium">{data.staffDevelopment.improvementRate}%</span></div>
            <div><span className="text-gray-500">With Plan:</span> <span className="font-medium">{data.staffDevelopment.withPlanRate}%</span></div>
            <div><span className="text-gray-500">Avg Skill Improvement:</span> <span className="font-medium">{data.staffDevelopment.averageSkillImprovement}</span></div>
            <div><span className="text-gray-500">Wellbeing Concern Rate:</span> <span className={`font-medium ${data.staffDevelopment.wellbeingConcernRate > 10 ? "text-amber-600" : "text-green-600"}`}>{data.staffDevelopment.wellbeingConcernRate}%</span></div>
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
                {data.actions.map((a, i) => (
                  <li key={i} className={a.startsWith("URGENT") ? "text-red-700 font-medium" : ""}>
                    {a}
                  </li>
                ))}
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
