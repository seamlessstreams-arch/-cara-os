"use client";

import { useState, useEffect } from "react";
import type { TransitionReadinessIntelligence } from "@/lib/transition-readiness";

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

const readinessColors: Record<string, string> = {
  fully_ready: "text-green-600",
  mostly_ready: "text-blue-600",
  partially_ready: "text-amber-600",
  not_ready: "text-red-600",
  not_assessed: "text-gray-400",
};

const handoverColors: Record<string, string> = {
  comprehensive: "text-green-600",
  adequate: "text-blue-600",
  basic: "text-amber-600",
  incomplete: "text-red-600",
  not_completed: "text-gray-400",
};

const feelingColors: Record<string, string> = {
  positive: "text-green-600",
  mixed: "text-amber-600",
  anxious: "text-orange-600",
  resistant: "text-red-600",
  not_recorded: "text-gray-400",
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

export function TransitionReadinessDashboardWidget() {
  const [data, setData] = useState<TransitionReadinessIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/transition-readiness")
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
        <h3 className="text-lg font-semibold text-red-800">Transition Readiness</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Transition Readiness</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.transitionPlanning.totalTransitions}</div>
          <div className="text-xs text-gray-500 mt-1">Total Transitions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.transitionPlanning.childInvolvementRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Child Involvement</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.handover.comprehensiveRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Handover Quality</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.readiness.fullyReadyRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Children Ready</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.postTransition.followUpCompletedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Follow-Up Done</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.transitionPlanning.overallScore} label="Transition Planning" maxScore={30} />
        <ScoreBar score={data.handover.overallScore} label="Handover Quality" maxScore={25} />
        <ScoreBar score={data.readiness.overallScore} label="Readiness Assessment" maxScore={25} />
        <ScoreBar score={data.postTransition.overallScore} label="Post-Transition Support" maxScore={20} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Transition Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Type: <span className="font-medium">{child.transitionType.replace(/_/g, " ")}</span></div>
                    <div>Status: <span className="font-medium">{child.status.replace(/_/g, " ")}</span></div>
                    <div>Readiness: <span className={`font-medium ${readinessColors[child.readinessLevel] || ""}`}>{child.readinessLevel.replace(/_/g, " ")}</span></div>
                    <div>Handover: <span className={`font-medium ${handoverColors[child.handoverQuality] || ""}`}>{child.handoverQuality.replace(/_/g, " ")}</span></div>
                    <div>Feeling: <span className={`font-medium ${feelingColors[child.childFeeling] || ""}`}>{child.childFeeling.replace(/_/g, " ")}</span></div>
                    <div>Follow-Up: <span className={`font-medium ${child.followUpCompleted ? "text-green-600" : "text-red-600"}`}>{child.followUpCompleted ? "Completed" : "Pending"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Transition Planning">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.transitionPlanning.totalTransitions}</span></div>
            <div><span className="text-gray-500">Planned Rate:</span> <span className="font-medium">{data.transitionPlanning.plannedTransitionRate}%</span></div>
            <div><span className="text-gray-500">Child Involved:</span> <span className="font-medium">{data.transitionPlanning.childInvolvementRate}%</span></div>
            <div><span className="text-gray-500">Views Recorded:</span> <span className="font-medium">{data.transitionPlanning.childViewsRate}%</span></div>
            <div><span className="text-gray-500">Parent Involved:</span> <span className="font-medium">{data.transitionPlanning.parentInvolvementRate}%</span></div>
            <div><span className="text-gray-500">Visit Completed:</span> <span className="font-medium">{data.transitionPlanning.visitCompletedRate}%</span></div>
            <div><span className="text-gray-500">Risk Updated:</span> <span className="font-medium">{data.transitionPlanning.riskAssessmentRate}%</span></div>
            <div><span className="text-gray-500">Info Transfer:</span> <span className="font-medium">{data.transitionPlanning.infoTransferRate}%</span></div>
            <div><span className="text-gray-500">Goodbyes:</span> <span className="font-medium">{data.transitionPlanning.goodbyesCelebratedRate}%</span></div>
          </div>
        </Section>

        <Section title="Handover Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.handover.totalHandovers}</span></div>
            <div><span className="text-gray-500">Comprehensive:</span> <span className="font-medium">{data.handover.comprehensiveRate}%</span></div>
            <div><span className="text-gray-500">Documents:</span> <span className="font-medium">{data.handover.documentTransferRate}%</span></div>
            <div><span className="text-gray-500">Care Plan:</span> <span className="font-medium">{data.handover.carePlanSharedRate}%</span></div>
            <div><span className="text-gray-500">Health Info:</span> <span className="font-medium">{data.handover.healthInfoRate}%</span></div>
            <div><span className="text-gray-500">Triggers:</span> <span className="font-medium">{data.handover.triggersSharedRate}%</span></div>
            <div><span className="text-gray-500">Preferences:</span> <span className="font-medium">{data.handover.childPreferencesRate}%</span></div>
          </div>
        </Section>

        <Section title="Readiness Assessment">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.readiness.totalAssessments}</span></div>
            <div><span className="text-gray-500">Fully Ready:</span> <span className="font-medium">{data.readiness.fullyReadyRate}%</span></div>
            <div><span className="text-gray-500">Support Plan:</span> <span className="font-medium">{data.readiness.supportPlanRate}%</span></div>
            <div><span className="text-gray-500">Contingency:</span> <span className="font-medium">{data.readiness.contingencyRate}%</span></div>
            <div><span className="text-gray-500">Pros Briefed:</span> <span className="font-medium">{data.readiness.professionalBriefedRate}%</span></div>
            <div><span className="text-gray-500">Emotional Ready:</span> <span className="font-medium">{data.readiness.emotionalReadinessGoodRate}%</span></div>
          </div>
        </Section>

        <Section title="Post-Transition Support">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.postTransition.totalFollowUps}</span></div>
            <div><span className="text-gray-500">Follow-Up Done:</span> <span className="font-medium">{data.postTransition.followUpCompletedRate}%</span></div>
            <div><span className="text-gray-500">Within 7 Days:</span> <span className="font-medium">{data.postTransition.within7DaysRate}%</span></div>
            <div><span className="text-gray-500">Settling In:</span> <span className="font-medium">{data.postTransition.settlingInReviewRate}%</span></div>
            <div><span className="text-gray-500">KW Contact:</span> <span className="font-medium">{data.postTransition.previousKeyWorkerContactRate}%</span></div>
            <div><span className="text-gray-500">Child Feedback:</span> <span className="font-medium">{data.postTransition.childFeedbackRate}%</span></div>
            <div><span className="text-gray-500">Issues Resolved:</span> <span className="font-medium">{data.postTransition.issueResolutionRate}%</span></div>
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
