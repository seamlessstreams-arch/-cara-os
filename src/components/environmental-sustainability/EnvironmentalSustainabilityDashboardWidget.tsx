"use client";

import { useState, useEffect } from "react";
import type { EnvironmentalSustainabilityIntelligence } from "@/lib/environmental-sustainability";

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

export default function EnvironmentalSustainabilityDashboardWidget() {
  const [data, setData] = useState<EnvironmentalSustainabilityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/environmental-sustainability")
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
        <h3 className="text-lg font-semibold text-red-800">Environmental Sustainability</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Environmental Sustainability</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.activityEngagement.totalActivities}</div>
          <div className="text-xs text-gray-500 mt-1">Total Activities</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.activityEngagement.engagementRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Engagement Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.sustainabilityPolicy.policiesInPlace}/7</div>
          <div className="text-xs text-gray-500 mt-1">Policies in Place</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.environmentalPractice.activityTypeDiversity}</div>
          <div className="text-xs text-gray-500 mt-1">Activity Types</div>
        </div>
      </div>

      {/* Score Bars */}
      <div className="space-y-2">
        <ScoreBar score={data.activityEngagement.overallScore} label="Activity Engagement" maxScore={25} />
        <ScoreBar score={data.environmentalPractice.overallScore} label="Environmental Practice" maxScore={25} />
        <ScoreBar score={data.sustainabilityPolicy.overallScore} label="Sustainability Policy" maxScore={25} />
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
                    <div>Engagement: <span className={`font-medium ${child.engagementScore >= 7 ? "text-green-600" : child.engagementScore >= 4 ? "text-amber-600" : "text-red-600"}`}>{child.engagementScore}/10</span></div>
                    <div>Child Initiated: <span className="font-medium">{child.childInitiatedRate}%</span></div>
                    <div>Learning Recorded: <span className="font-medium">{child.learningRecordedRate}%</span></div>
                    <div>Activity Types: <span className="font-medium">{child.activityTypeDiversity}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Activity Engagement">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.activityEngagement.totalActivities}</span></div>
            <div><span className="text-gray-500">Engaged:</span> <span className="font-medium">{data.activityEngagement.engagementRate}%</span></div>
            <div><span className="text-gray-500">Child Initiated:</span> <span className="font-medium">{data.activityEngagement.childInitiatedRate}%</span></div>
            <div><span className="text-gray-500">Learning Recorded:</span> <span className="font-medium">{data.activityEngagement.learningRecordedRate}%</span></div>
            <div><span className="text-gray-500">Staff Supported:</span> <span className="font-medium">{data.activityEngagement.staffSupportedRate}%</span></div>
          </div>
          {data.activityEngagement.totalActivities > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Engagement Distribution</h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(data.activityEngagement.engagementDistribution).map(([key, count]) => (
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

        <Section title="Environmental Practice">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Activities:</span> <span className="font-medium">{data.environmentalPractice.totalActivities}</span></div>
            <div><span className="text-gray-500">Type Diversity:</span> <span className="font-medium">{data.environmentalPractice.activityTypeDiversity}/8</span></div>
            <div><span className="text-gray-500">Per Child:</span> <span className="font-medium">{data.environmentalPractice.frequencyScore}</span></div>
            <div><span className="text-gray-500">Sustained:</span> <span className="font-medium">{data.environmentalPractice.sustainedEngagementRate}%</span></div>
          </div>
          {data.environmentalPractice.totalActivities > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Activity Type Breakdown</h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(data.environmentalPractice.activityTypeDistribution).map(([key, count]) => (
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

        <Section title="Sustainability Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Recycling:</span> <span className={`font-medium ${data.sustainabilityPolicy.recyclingScheme ? "text-green-600" : "text-red-600"}`}>{data.sustainabilityPolicy.recyclingScheme ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Energy Plan:</span> <span className={`font-medium ${data.sustainabilityPolicy.energyReductionPlan ? "text-green-600" : "text-red-600"}`}>{data.sustainabilityPolicy.energyReductionPlan ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Procurement:</span> <span className={`font-medium ${data.sustainabilityPolicy.sustainableProcurement ? "text-green-600" : "text-red-600"}`}>{data.sustainabilityPolicy.sustainableProcurement ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Education:</span> <span className={`font-medium ${data.sustainabilityPolicy.environmentalEducation ? "text-green-600" : "text-red-600"}`}>{data.sustainabilityPolicy.environmentalEducation ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Garden Access:</span> <span className={`font-medium ${data.sustainabilityPolicy.gardenAccess ? "text-green-600" : "text-red-600"}`}>{data.sustainabilityPolicy.gardenAccess ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Water:</span> <span className={`font-medium ${data.sustainabilityPolicy.waterConservation ? "text-green-600" : "text-red-600"}`}>{data.sustainabilityPolicy.waterConservation ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Regular Audit:</span> <span className={`font-medium ${data.sustainabilityPolicy.regularAudit ? "text-green-600" : "text-red-600"}`}>{data.sustainabilityPolicy.regularAudit ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.sustainabilityPolicy.policiesInPlace}/7</span></div>
          </div>
        </Section>

        <Section title="Staff Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffReadiness.totalStaff}</span></div>
            <div><span className="text-gray-500">Env. Awareness:</span> <span className="font-medium">{data.staffReadiness.environmentalAwarenessRate}%</span></div>
            <div><span className="text-gray-500">Recycling:</span> <span className="font-medium">{data.staffReadiness.recyclingProceduresRate}%</span></div>
            <div><span className="text-gray-500">Energy:</span> <span className="font-medium">{data.staffReadiness.energyConservationRate}%</span></div>
            <div><span className="text-gray-500">Sustainable Living:</span> <span className="font-medium">{data.staffReadiness.sustainableLivingRate}%</span></div>
            <div><span className="text-gray-500">Child Engagement:</span> <span className="font-medium">{data.staffReadiness.childEngagementRate}%</span></div>
            <div><span className="text-gray-500">Outdoor Learning:</span> <span className="font-medium">{data.staffReadiness.outdoorLearningRate}%</span></div>
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
