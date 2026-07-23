"use client";

import { useState, useEffect } from "react";
import type { StaffPerformanceIntelligence } from "@/lib/staff-performance";

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

const performanceRatingLabels: Record<string, string> = {
  exceptional: "Exceptional",
  effective: "Effective",
  developing: "Developing",
  underperforming: "Underperforming",
  capability_concern: "Capability Concern",
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

export function StaffPerformanceDashboardWidget() {
  const [data, setData] = useState<StaffPerformanceIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/staff-performance")
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
        <h3 className="text-lg font-semibold text-red-800">Staff Performance</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Staff Performance</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.qualificationCompliance.achievedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Qualification Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.reviewQuality.completionRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Review Completion</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.pdpProgress.achievementRate}%</div>
          <div className="text-xs text-gray-500 mt-1">PDP Achievement</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.competencyDevelopment.highCompetencyRate}%</div>
          <div className="text-xs text-gray-500 mt-1">High Competency</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.qualificationCompliance.overallScore} label="Qualifications" maxScore={25} />
        <ScoreBar score={data.reviewQuality.overallScore} label="Review Quality" maxScore={25} />
        <ScoreBar score={data.pdpProgress.overallScore} label="PDP Progress" maxScore={25} />
        <ScoreBar score={data.competencyDevelopment.overallScore} label="Competency" maxScore={25} />
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
                    <StatusBadge ok={profile.qualificationComplianceRate >= 90} label={`Quals ${profile.qualificationComplianceRate}%`} />
                    <StatusBadge ok={profile.pdpGoalAchievementRate >= 60} label={`PDP ${profile.pdpGoalAchievementRate}%`} />
                    <StatusBadge ok={profile.averageCompetencyLevel >= 2.5} label={`Comp ${profile.averageCompetencyLevel}`} />
                    {profile.currentPerformanceRating && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {performanceRatingLabels[profile.currentPerformanceRating] || profile.currentPerformanceRating}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Qualification Compliance">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Required:</span> <span className="font-medium">{data.qualificationCompliance.totalRequired}</span></div>
            <div><span className="text-gray-500">Achieved:</span> <span className="font-medium">{data.qualificationCompliance.totalAchieved}</span></div>
            <div><span className="text-gray-500">Achieved Rate:</span> <span className="font-medium">{data.qualificationCompliance.achievedRate}%</span></div>
            <div><span className="text-gray-500">Expired:</span> <span className={`font-medium ${data.qualificationCompliance.expiredCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.qualificationCompliance.expiredCount}</span></div>
            <div><span className="text-gray-500">Renewal Rate:</span> <span className="font-medium">{typeof data.qualificationCompliance.renewalRate === "number" ? `${data.qualificationCompliance.renewalRate}%` : "—"}</span></div>
            <div><span className="text-gray-500">Mandatory:</span> <span className="font-medium">{data.qualificationCompliance.mandatoryComplianceRate}%</span></div>
          </div>
        </Section>

        <Section title="Performance Reviews">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Reviews:</span> <span className="font-medium">{data.reviewQuality.totalReviews}</span></div>
            <div><span className="text-gray-500">Completion:</span> <span className="font-medium">{data.reviewQuality.completionRate}%</span></div>
            <div><span className="text-gray-500">Objectives Met:</span> <span className="font-medium">{data.reviewQuality.objectivesMetRate}%</span></div>
            <div><span className="text-gray-500">Staff Views:</span> <span className="font-medium">{data.reviewQuality.staffViewsRate}%</span></div>
            <div><span className="text-gray-500">Action Plans:</span> <span className="font-medium">{data.reviewQuality.actionPlanRate}%</span></div>
            <div><span className="text-gray-500">Positive Ratings:</span> <span className="font-medium">{data.reviewQuality.positiveRatingRate}%</span></div>
          </div>
        </Section>

        <Section title="Professional Development">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Goals:</span> <span className="font-medium">{data.pdpProgress.totalGoals}</span></div>
            <div><span className="text-gray-500">Achievement:</span> <span className="font-medium">{data.pdpProgress.achievementRate}%</span></div>
            <div><span className="text-gray-500">Linked to Training:</span> <span className="font-medium">{data.pdpProgress.linkedToTrainingRate}%</span></div>
            <div><span className="text-gray-500">Missed Goals:</span> <span className={`font-medium ${data.pdpProgress.missedGoalRate > 10 ? "text-amber-600" : "text-green-600"}`}>{data.pdpProgress.missedGoalRate}%</span></div>
            <div><span className="text-gray-500">Min 2 Goals Each:</span> <span className="font-medium">{data.pdpProgress.staffWithMinGoals ? "Yes" : "No"}</span></div>
          </div>
        </Section>

        <Section title="Competency Development">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Assessments:</span> <span className="font-medium">{data.competencyDevelopment.totalAssessments}</span></div>
            <div><span className="text-gray-500">5+ Areas Coverage:</span> <span className="font-medium">{data.competencyDevelopment.staffCoverageRate}%</span></div>
            <div><span className="text-gray-500">Avg Competency:</span> <span className="font-medium">{data.competencyDevelopment.averageCompetencyScore}</span></div>
            <div><span className="text-gray-500">Improvement Rate:</span> <span className="font-medium">{data.competencyDevelopment.improvementRate}%</span></div>
            <div><span className="text-gray-500">Critical Areas:</span> <span className={`font-medium ${data.competencyDevelopment.criticalAreasCovered ? "text-green-600" : "text-red-600"}`}>{data.competencyDevelopment.criticalAreasCovered ? "Covered" : "Gaps"}</span></div>
            <div><span className="text-gray-500">High Competency:</span> <span className="font-medium">{data.competencyDevelopment.highCompetencyRate}%</span></div>
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
