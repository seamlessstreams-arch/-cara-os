"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";
import type { AttachmentRelationshipsIntelligence } from "@/lib/attachment-relationships";

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return String(v);
}

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

const styleColors: Record<string, string> = {
  secure: "text-green-600",
  anxious_ambivalent: "text-amber-600",
  anxious_avoidant: "text-amber-600",
  disorganised: "text-red-600",
  not_assessed: "text-gray-400",
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

export function AttachmentRelationshipsDashboardWidget() {
  const [data, setData] = useState<AttachmentRelationshipsIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/attachment-relationships")
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
        <h3 className="text-lg font-semibold text-red-800">Attachment &amp; Relationships</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Attachment &amp; Relationships</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.attachmentAssessments.childrenAssessed}/{data.childProfiles.length}</div>
          <div className="text-xs text-gray-500 mt-1">Assessed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.relationshipQuality.averageTrustScore}/10</div>
          <div className="text-xs text-gray-500 mt-1">Avg Trust</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.interactionQuality.averageQuality}/10</div>
          <div className="text-xs text-gray-500 mt-1">Interaction Quality</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.stability.childFeelsSafeRate >= 100 ? "text-green-600" : "text-amber-600"}`}>
            {data.stability.childFeelsSafeRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Feel Safe</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.stability.averageBelonging}/10</div>
          <div className="text-xs text-gray-500 mt-1">Belonging</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.attachmentAssessments.overallScore} label="Assessments" />
        <ScoreBar score={data.relationshipQuality.overallScore} label="Relationships" />
        <ScoreBar score={data.interactionQuality.overallScore} label="Interactions" />
        <ScoreBar score={data.stability.overallScore} label="Stability" />
        <ScoreBar score={data.peerRelationships.overallScore} label="Peer Relationships" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Child Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childProfiles.map((child) => (
              <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{child.childName}</span>
                  <span className={`text-sm font-medium ${styleColors[child.attachmentStyle] || "text-gray-600"}`}>
                    {child.attachmentStyle.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>Trust: <span className="font-medium">{fmt(child.averageTrustScore)}/10</span></div>
                  <div>Key Worker: <span className="font-medium">{child.keyWorkerQuality}</span></div>
                  <div>Belonging: <span className="font-medium">{child.belongingScore}/10</span></div>
                  <div>Wellbeing: <span className="font-medium">{fmt(child.overallWellbeing)}/10</span></div>
                </div>
                {child.protectiveFactors.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {child.protectiveFactors.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs">{f}</span>
                    ))}
                  </div>
                )}
                {child.riskFactors.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {child.riskFactors.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Relationship Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.relationshipQuality.totalRelationships}</span></div>
            <div><span className="text-gray-500">Strong:</span> <span className="font-medium text-green-600">{data.relationshipQuality.strongRelationshipsRate}%</span></div>
            <div><span className="text-gray-500">Avg Trust:</span> <span className="font-medium">{data.relationshipQuality.averageTrustScore}/10</span></div>
            <div><span className="text-gray-500">Avg Consistency:</span> <span className="font-medium">{data.relationshipQuality.averageConsistencyScore}/10</span></div>
            <div><span className="text-gray-500">Key Worker Quality:</span> <span className="font-medium">{fmt(data.relationshipQuality.keyWorkerRelationshipQuality)}/10</span></div>
            <div><span className="text-gray-500">Child Rating:</span> <span className="font-medium">{fmt(data.relationshipQuality.averageChildRating)}/10</span></div>
          </div>
        </Section>

        <Section title="Interaction Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.interactionQuality.totalInteractions}</span></div>
            <div><span className="text-gray-500">Avg Quality:</span> <span className="font-medium">{data.interactionQuality.averageQuality}/10</span></div>
            <div><span className="text-gray-500">Child Initiated:</span> <span className="font-medium">{formatRate(data.interactionQuality.childInitiatedRate)}</span></div>
            <div><span className="text-gray-500">Per Child/Week:</span> <span className="font-medium">{fmt(data.interactionQuality.interactionsPerChildPerWeek)}</span></div>
            <div><span className="text-gray-500">Attachment Relevant:</span> <span className="font-medium">{data.interactionQuality.attachmentRelevantRate}%</span></div>
            <div><span className="text-gray-500">Regulation Support:</span> <span className="font-medium">{data.interactionQuality.regulationSupportRate}%</span></div>
          </div>
        </Section>

        <Section title="Stability & Belonging">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">KW Consistency:</span> <span className="font-medium">{data.stability.keyWorkerConsistencyRate}%</span></div>
            <div><span className="text-gray-500">Team Stability:</span> <span className="font-medium">{data.stability.staffTeamStabilityRate}%</span></div>
            <div><span className="text-gray-500">Routine:</span> <span className="font-medium">{data.stability.averageRoutineConsistency}/10</span></div>
            <div><span className="text-gray-500">Belonging:</span> <span className="font-medium">{data.stability.averageBelonging}/10</span></div>
            <div>
              <span className="text-gray-500">Feel Safe:</span>{" "}
              <span className={`font-medium ${data.stability.childFeelsSafeRate >= 100 ? "text-green-600" : "text-red-600"}`}>
                {data.stability.childFeelsSafeRate}%
              </span>
            </div>
            <div><span className="text-gray-500">Feel Valued:</span> <span className="font-medium">{data.stability.childFeelsValuedRate}%</span></div>
          </div>
        </Section>

        <Section title="Peer Relationships">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.peerRelationships.totalPeerRelationships}</span></div>
            <div><span className="text-gray-500">Avg Positive:</span> <span className="font-medium text-green-600">{data.peerRelationships.averagePositiveInteractions}</span></div>
            <div><span className="text-gray-500">Avg Negative:</span> <span className={`font-medium ${data.peerRelationships.averageNegativeInteractions > 5 ? "text-red-600" : "text-gray-900"}`}>{data.peerRelationships.averageNegativeInteractions}</span></div>
            <div><span className="text-gray-500">Conflict Resolution:</span> <span className="font-medium">{formatRate(data.peerRelationships.conflictResolutionRate)}</span></div>
            <div><span className="text-gray-500">Mediation Needed:</span> <span className="font-medium">{data.peerRelationships.mediationNeededRate}%</span></div>
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
