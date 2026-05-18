"use client";

import { useState, useEffect } from "react";
import type { CriticalIncidentReviewIntelligence } from "@/lib/critical-incident-review";

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

const trendIcons: Record<string, string> = {
  increasing: "↑",
  stable: "→",
  decreasing: "↓",
};

const trendColors: Record<string, string> = {
  increasing: "text-red-600",
  stable: "text-gray-600",
  decreasing: "text-green-600",
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

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[severity] || "bg-gray-100 text-gray-700"}`}>
      {severity}
    </span>
  );
}

export function CriticalIncidentReviewDashboardWidget() {
  const [data, setData] = useState<CriticalIncidentReviewIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/critical-incident-review")
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
        <h3 className="text-lg font-semibold text-red-800">Critical Incident Review</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Critical Incident Review</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.debriefQuality.totalIncidents}</div>
          <div className="text-xs text-gray-500 mt-1">Total Incidents</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.debriefQuality.debriefCompletionRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Debrief Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.learningIdentification.totalLearnings}</div>
          <div className="text-xs text-gray-500 mt-1">Learnings</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.practiceChange.totalChanges}</div>
          <div className="text-xs text-gray-500 mt-1">Practice Changes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${trendColors[data.trendAnalysis.overallTrend]}`}>
            {trendIcons[data.trendAnalysis.overallTrend]} {data.trendAnalysis.overallTrend}
          </div>
          <div className="text-xs text-gray-500 mt-1">Overall Trend</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.debriefQuality.overallScore} label="Debrief Quality" maxScore={30} />
        <ScoreBar score={data.learningIdentification.overallScore} label="Learning Identification" maxScore={25} />
        <ScoreBar score={data.practiceChange.overallScore} label="Practice Changes" maxScore={25} />
        <ScoreBar score={data.trendAnalysis.overallScore} label="Trend Analysis" maxScore={20} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Debrief Quality" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Incidents:</span> <span className="font-medium">{data.debriefQuality.totalIncidents}</span></div>
            <div><span className="text-gray-500">Debrief Required:</span> <span className="font-medium">{data.debriefQuality.debriefRequired}</span></div>
            <div><span className="text-gray-500">On Time:</span> <span className="font-medium text-green-600">{data.debriefQuality.debriefedOnTime}</span></div>
            <div><span className="text-gray-500">Late:</span> <span className={`font-medium ${data.debriefQuality.debriefedLate > 0 ? "text-amber-600" : "text-gray-900"}`}>{data.debriefQuality.debriefedLate}</span></div>
            <div><span className="text-gray-500">Not Debriefed:</span> <span className={`font-medium ${data.debriefQuality.notDebriefed > 0 ? "text-red-600" : "text-gray-900"}`}>{data.debriefQuality.notDebriefed}</span></div>
            <div><span className="text-gray-500">Completion:</span> <span className="font-medium">{data.debriefQuality.debriefCompletionRate}%</span></div>
            <div><span className="text-gray-500">Child Included:</span> <span className="font-medium">{data.debriefQuality.childIncludedRate}%</span></div>
            <div><span className="text-gray-500">Root Cause:</span> <span className="font-medium">{data.debriefQuality.rootCauseIdentifiedRate}%</span></div>
          </div>
        </Section>

        <Section title="Learning Identification">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Learnings:</span> <span className="font-medium">{data.learningIdentification.totalLearnings}</span></div>
            <div><span className="text-gray-500">Embedded:</span> <span className="font-medium text-green-600">{data.learningIdentification.embedded}</span></div>
            <div><span className="text-gray-500">Implemented:</span> <span className="font-medium text-blue-600">{data.learningIdentification.implemented}</span></div>
            <div><span className="text-gray-500">Action Planned:</span> <span className="font-medium text-amber-600">{data.learningIdentification.actionPlanned}</span></div>
            <div><span className="text-gray-500">Implementation:</span> <span className="font-medium">{data.learningIdentification.implementationRate}%</span></div>
            <div><span className="text-gray-500">Shared (Team):</span> <span className="font-medium">{data.learningIdentification.sharedWithTeamRate}%</span></div>
            <div><span className="text-gray-500">Shared (Supervision):</span> <span className="font-medium">{data.learningIdentification.sharedInSupervisionRate}%</span></div>
            <div><span className="text-gray-500">Not Identified:</span> <span className={`font-medium ${data.learningIdentification.notIdentified > 0 ? "text-red-600" : "text-gray-900"}`}>{data.learningIdentification.notIdentified}</span></div>
          </div>
        </Section>

        <Section title="Practice Changes">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Changes:</span> <span className="font-medium">{data.practiceChange.totalChanges}</span></div>
            <div><span className="text-gray-500">Impact Assessed:</span> <span className="font-medium">{data.practiceChange.impactAssessedRate}%</span></div>
            <div><span className="text-gray-500">Positive Impact:</span> <span className="font-medium">{data.practiceChange.positiveImpactRate}%</span></div>
            <div><span className="text-gray-500">Sustainability Review:</span> <span className="font-medium">{data.practiceChange.sustainabilityReviewedRate}%</span></div>
          </div>
          {Object.keys(data.practiceChange.changesByType).length > 0 && (
            <div className="mt-2">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Changes by Type</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.practiceChange.changesByType).map(([type, count]) => (
                  <span key={type} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                    {type.replace(/_/g, " ")}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Trend Analysis">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
            <div><span className="text-gray-500">Current Period:</span> <span className="font-medium">{data.trendAnalysis.totalIncidents}</span></div>
            <div><span className="text-gray-500">Previous Period:</span> <span className="font-medium">{data.trendAnalysis.previousPeriodTotal}</span></div>
            <div><span className="text-gray-500">High Severity:</span> <span className={`font-medium ${data.trendAnalysis.highSeverityCount > 0 ? "text-orange-600" : "text-gray-900"}`}>{data.trendAnalysis.highSeverityCount}</span></div>
            <div><span className="text-gray-500">Critical:</span> <span className={`font-medium ${data.trendAnalysis.criticalSeverityCount > 0 ? "text-red-600" : "text-gray-900"}`}>{data.trendAnalysis.criticalSeverityCount}</span></div>
          </div>
          {data.trendAnalysis.trends.length > 0 && (
            <div className="space-y-1.5">
              {data.trendAnalysis.trends.map((t) => (
                <div key={t.incidentType} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 capitalize">{t.incidentType.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs">{t.previousPeriodCount} → {t.count}</span>
                    <span className={`font-medium ${trendColors[t.trend]}`}>
                      {trendIcons[t.trend]} {t.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
