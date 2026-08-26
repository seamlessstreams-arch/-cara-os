"use client";

import { useState, useEffect } from "react";
import type { OutdoorActivityEnrichmentIntelligence } from "@/lib/outdoor-activity-enrichment";
import { formatRate } from "@/lib/metrics/rate";

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

export function OutdoorActivityEnrichmentDashboardWidget() {
  const [data, setData] = useState<OutdoorActivityEnrichmentIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/outdoor-activity-enrichment")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((json) => setData(json.data))
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
        <h3 className="text-lg font-semibold text-red-800">Outdoor Activity & Enrichment</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Outdoor Activity & Enrichment</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.activityParticipation.totalActivities}</div>
          <div className="text-xs text-gray-500 mt-1">Total Activities</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.activityParticipation.outdoorRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Outdoor Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.activityParticipation.childChoiceRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Child Choice</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.activityParticipation.communityRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Community Based</div>
        </div>
      </div>

      {/* Score Bars */}
      <div className="space-y-2">
        <ScoreBar score={data.activityParticipation.overallScore} label="Activity Participation" maxScore={25} />
        <ScoreBar score={data.enrichmentQuality.overallScore} label="Enrichment Quality" maxScore={25} />
        <ScoreBar score={data.riskManagement.overallScore} label="Risk Management" maxScore={25} />
        <ScoreBar score={data.staffReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Activities: <span className="font-medium">{child.totalActivities}</span></div>
                    <div>Outdoor: <span className="font-medium">{child.outdoorRate}%</span></div>
                    <div>Choice: <span className="font-medium">{child.choiceRate}%</span></div>
                    <div>Engagement: <span className={`font-medium ${child.engagementScore >= 7 ? "text-green-600" : child.engagementScore >= 4 ? "text-amber-600" : "text-red-600"}`}>{child.engagementScore}/10</span></div>
                    <div>Plan Completion: <span className="font-medium">{child.planCompletionRate}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Activity Participation">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.activityParticipation.totalActivities}</span></div>
            <div><span className="text-gray-500">Outdoor:</span> <span className="font-medium">{formatRate(data.activityParticipation.outdoorRate)}</span></div>
            <div><span className="text-gray-500">Community:</span> <span className="font-medium">{formatRate(data.activityParticipation.communityRate)}</span></div>
            <div><span className="text-gray-500">Child Choice:</span> <span className="font-medium">{formatRate(data.activityParticipation.childChoiceRate)}</span></div>
            <div><span className="text-gray-500">New Experiences:</span> <span className="font-medium">{formatRate(data.activityParticipation.newExperienceRate)}</span></div>
            <div><span className="text-gray-500">Avg Duration:</span> <span className="font-medium">{data.activityParticipation.averageDuration} min</span></div>
          </div>
          {data.activityParticipation.totalActivities > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Engagement Distribution</h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(data.activityParticipation.engagementDistribution).map(([key, count]) => (
                  count > 0 && (
                    <span key={key} className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                      {key.replace(/_/g, " ")}: {count}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Enrichment Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Plans:</span> <span className="font-medium">{data.enrichmentQuality.totalPlans}</span></div>
            <div><span className="text-gray-500">Current:</span> <span className="font-medium">{formatRate(data.enrichmentQuality.currentPlanRate)}</span></div>
            <div><span className="text-gray-500">Completion:</span> <span className="font-medium">{formatRate(data.enrichmentQuality.completionRate)}</span></div>
            <div><span className="text-gray-500">Child Input:</span> <span className="font-medium">{formatRate(data.enrichmentQuality.childContributionRate)}</span></div>
            <div><span className="text-gray-500">Diverse Range:</span> <span className="font-medium">{formatRate(data.enrichmentQuality.diverseRangeRate)}</span></div>
            <div><span className="text-gray-500">Barriers Addressed:</span> <span className="font-medium">{formatRate(data.enrichmentQuality.barriersAddressedRate)}</span></div>
            <div><span className="text-gray-500">Avg Planned:</span> <span className="font-medium">{data.enrichmentQuality.averageActivitiesPlanned}</span></div>
          </div>
        </Section>

        <Section title="Risk Management">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Assessments:</span> <span className="font-medium">{data.riskManagement.totalAssessments}</span></div>
            <div><span className="text-gray-500">Coverage:</span> <span className="font-medium">{formatRate(data.riskManagement.assessmentRate)}</span></div>
            <div><span className="text-gray-500">Good/Excellent:</span> <span className="font-medium">{formatRate(data.riskManagement.goodOrExcellentRate)}</span></div>
            <div><span className="text-gray-500">Child Views:</span> <span className="font-medium">{formatRate(data.riskManagement.childViewRate)}</span></div>
            <div><span className="text-gray-500">Dynamic:</span> <span className="font-medium">{formatRate(data.riskManagement.dynamicAssessmentRate)}</span></div>
            <div><span className="text-gray-500">Benefits Stated:</span> <span className="font-medium">{formatRate(data.riskManagement.benefitsArticulatedRate)}</span></div>
            <div><span className="text-gray-500">Avg Hazards:</span> <span className="font-medium">{data.riskManagement.averageHazards}</span></div>
          </div>
        </Section>

        <Section title="Staff Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffReadiness.totalStaff}</span></div>
            <div><span className="text-gray-500">First Aid:</span> <span className="font-medium">{formatRate(data.staffReadiness.firstAidRate)}</span></div>
            <div><span className="text-gray-500">Activity Leader:</span> <span className="font-medium">{formatRate(data.staffReadiness.activityLeaderRate)}</span></div>
            <div><span className="text-gray-500">Risk Trained:</span> <span className="font-medium">{formatRate(data.staffReadiness.riskAssessmentTrainedRate)}</span></div>
            <div><span className="text-gray-500">Safeguarding:</span> <span className="font-medium">{formatRate(data.staffReadiness.safeguardingRate)}</span></div>
            <div><span className="text-gray-500">Avg Qualifications:</span> <span className="font-medium">{data.staffReadiness.averageQualifications}</span></div>
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
                <span className="text-blue-400 mt-0.5">&sect;</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
