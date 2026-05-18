"use client";

import { useState, useEffect } from "react";
import type { PostIncidentLearningIntelligence } from "@/lib/post-incident-learning";

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

const recurrenceColors: Record<string, string> = {
  first_occurrence: "text-gray-600",
  recurring: "text-amber-600",
  escalating: "text-red-600",
  de_escalating: "text-green-600",
  chronic: "text-red-700",
};

const recurrenceLabels: Record<string, string> = {
  first_occurrence: "First Occurrence",
  recurring: "Recurring",
  escalating: "Escalating",
  de_escalating: "De-escalating",
  chronic: "Chronic",
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

function MetricCard({ value, label, highlight }: { value: string | number; label: string; highlight?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className={`text-2xl font-bold ${highlight || "text-gray-900"}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export function PostIncidentLearningDashboardWidget() {
  const [data, setData] = useState<PostIncidentLearningIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/post-incident-learning")
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
        <h3 className="text-lg font-semibold text-red-800">Post-Incident Learning</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Post-Incident Learning</h3>
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
        <MetricCard value={data.debriefQuality.totalReviews} label="Incidents Reviewed" />
        <MetricCard value={`${data.debriefQuality.within24hRate}%`} label="Reviewed Within 24h" />
        <MetricCard value={data.learningEffectiveness.totalActions} label="Learning Actions" />
        <MetricCard value={`${data.learningEffectiveness.completedRate}%`} label="Actions Completed" />
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.debriefQuality.overallScore} label="Debrief Quality" maxScore={25} />
        <ScoreBar score={data.learningEffectiveness.overallScore} label="Learning Effectiveness" maxScore={25} />
        <ScoreBar score={data.patternRecognition.overallScore} label="Pattern Recognition" maxScore={25} />
        <ScoreBar score={data.teamLearning.overallScore} label="Team Learning" maxScore={25} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Debrief Quality" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Reviews:</span> <span className="font-medium">{data.debriefQuality.totalReviews}</span></div>
            <div><span className="text-gray-500">Within 24h:</span> <span className="font-medium text-green-600">{data.debriefQuality.within24hRate}%</span></div>
            <div><span className="text-gray-500">Completed:</span> <span className="font-medium">{data.debriefQuality.completedRate}%</span></div>
            <div><span className="text-gray-500">Child Debrief:</span> <span className="font-medium">{data.debriefQuality.childDebriefRate}%</span></div>
            <div><span className="text-gray-500">Staff Debrief:</span> <span className="font-medium">{data.debriefQuality.staffDebriefRate}%</span></div>
            <div><span className="text-gray-500">Root Cause:</span> <span className="font-medium">{data.debriefQuality.rootCauseRate}%</span></div>
            <div><span className="text-gray-500">Lessons Documented:</span> <span className="font-medium">{data.debriefQuality.lessonsDocumentedRate}%</span></div>
          </div>
          {data.debriefQuality.qualityDistribution && (
            <div className="mt-2">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Review Quality Distribution</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.debriefQuality.qualityDistribution)
                  .filter(([, count]) => count > 0)
                  .map(([quality, count]) => (
                    <span key={quality} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {quality.replace(/_/g, " ")}: {count}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Learning Effectiveness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Actions:</span> <span className="font-medium">{data.learningEffectiveness.totalActions}</span></div>
            <div><span className="text-gray-500">Completed:</span> <span className="font-medium text-green-600">{data.learningEffectiveness.completedRate}%</span></div>
            <div><span className="text-gray-500">Evidence Recorded:</span> <span className="font-medium">{data.learningEffectiveness.evidenceRate}%</span></div>
            <div><span className="text-gray-500">Practice Changes:</span> <span className="font-medium text-blue-600">{data.learningEffectiveness.practiceChangeCount}</span></div>
            <div><span className="text-gray-500">Policy Updates:</span> <span className="font-medium text-purple-600">{data.learningEffectiveness.policyUpdateCount}</span></div>
            <div><span className="text-gray-500">Training Delivered:</span> <span className="font-medium text-indigo-600">{data.learningEffectiveness.trainingDeliveredCount}</span></div>
          </div>
          {data.learningEffectiveness.outcomeDistribution && (
            <div className="mt-2">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Outcome Distribution</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.learningEffectiveness.outcomeDistribution)
                  .filter(([, count]) => count > 0)
                  .map(([outcome, count]) => (
                    <span key={outcome} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {outcome.replace(/_/g, " ")}: {count}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Pattern Recognition">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Patterns:</span> <span className="font-medium">{data.patternRecognition.totalPatterns}</span></div>
            <div><span className="text-gray-500">Triggers Identified:</span> <span className="font-medium">{data.patternRecognition.triggerIdentifiedRate}%</span></div>
            <div><span className="text-gray-500">Strategies Updated:</span> <span className="font-medium">{data.patternRecognition.strategiesUpdatedRate}%</span></div>
            <div><span className="text-gray-500">Multi-Agency:</span> <span className="font-medium">{data.patternRecognition.multiAgencyRate}%</span></div>
            <div><span className="text-gray-500">Escalating:</span> <span className={`font-medium ${data.patternRecognition.escalatingCount > 0 ? "text-red-600" : "text-gray-900"}`}>{data.patternRecognition.escalatingCount}</span></div>
            <div><span className="text-gray-500">Chronic:</span> <span className={`font-medium ${data.patternRecognition.chronicCount > 0 ? "text-red-600" : "text-gray-900"}`}>{data.patternRecognition.chronicCount}</span></div>
            <div><span className="text-gray-500">Recurring Rate:</span> <span className="font-medium">{data.patternRecognition.recurringRate}%</span></div>
          </div>
        </Section>

        <Section title="Team Learning">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Sessions:</span> <span className="font-medium">{data.teamLearning.totalSessions}</span></div>
            <div><span className="text-gray-500">Incident Related:</span> <span className="font-medium">{data.teamLearning.incidentRelatedRate}%</span></div>
            <div><span className="text-gray-500">Avg Attendance:</span> <span className="font-medium">{data.teamLearning.averageAttendance}%</span></div>
            <div><span className="text-gray-500">Action Completion:</span> <span className="font-medium text-green-600">{data.teamLearning.actionCompletionRate}%</span></div>
            <div><span className="text-gray-500">Avg Action Points:</span> <span className="font-medium">{data.teamLearning.averageActionPoints}</span></div>
          </div>
        </Section>

        {data.incidentProfiles.length > 0 && (
          <Section title="Incident Learning Profiles">
            <div className="space-y-2">
              {data.incidentProfiles.map((profile) => (
                <div key={profile.incidentType} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                  <div>
                    <span className="text-gray-700 font-medium capitalize">{profile.incidentType.replace(/_/g, " ")}</span>
                    <span className="text-gray-400 ml-2">({profile.reviewCount} review{profile.reviewCount !== 1 ? "s" : ""})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {profile.recurrencePattern && (
                      <span className={`text-xs font-medium ${recurrenceColors[profile.recurrencePattern] || "text-gray-600"}`}>
                        {recurrenceLabels[profile.recurrencePattern] || profile.recurrencePattern}
                      </span>
                    )}
                    <span className="text-sm font-bold text-gray-700 w-10 text-right">{profile.overallScore}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

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
