"use client";

import { useState, useEffect } from "react";
import type { SiblingContactQualityIntelligence } from "@/lib/sibling-contact-quality";

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

export function SiblingContactQualityDashboardWidget() {
  const [data, setData] = useState<SiblingContactQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sibling-contact-quality")
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
        <h3 className="text-lg font-semibold text-red-800">Sibling Contact Quality</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sibling Contact Quality</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.contactFrequency.totalRelationships}</div>
          <div className="text-xs text-gray-500 mt-1">Sibling Links</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.contactFrequency.separatedSiblings}</div>
          <div className="text-xs text-gray-500 mt-1">Separated</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.contactQuality.totalSessions}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.contactQuality.positiveOutcomeRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Positive</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.contactFrequency.meetsOrExceedsPlanRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Meets Plan</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.contactFrequency.overallScore} label="Contact Frequency" maxScore={25} />
        <ScoreBar score={data.contactQuality.overallScore} label="Contact Quality" maxScore={25} />
        <ScoreBar score={data.reviewCompliance.overallScore} label="Review Compliance" maxScore={25} />
        <ScoreBar score={data.staffReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Sibling Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Siblings: <span className="font-medium">{child.siblingCount}</span></div>
                    <div>Separated: <span className="font-medium">{child.separatedCount}</span></div>
                    <div>Sessions: <span className="font-medium">{child.sessionsInPeriod}</span></div>
                    <div>Positive: <span className="font-medium">{child.positiveOutcomeRate}%</span></div>
                    <div>Meets Plan: <span className={`font-medium ${child.meetsContactPlan ? "text-green-600" : "text-amber-600"}`}>{child.meetsContactPlan ? "Yes" : "No"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Contact Frequency">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Relationships:</span> <span className="font-medium">{data.contactFrequency.totalRelationships}</span></div>
            <div><span className="text-gray-500">Plan Rate:</span> <span className="font-medium">{data.contactFrequency.contactPlanRate}%</span></div>
            <div><span className="text-gray-500">Meets Plan:</span> <span className="font-medium">{data.contactFrequency.meetsOrExceedsPlanRate}%</span></div>
            <div><span className="text-gray-500">Below Plan:</span> <span className={`font-medium ${data.contactFrequency.significantlyBelowRate > 0 ? "text-red-600" : "text-green-600"}`}>{data.contactFrequency.significantlyBelowRate}%</span></div>
            <div><span className="text-gray-500">Same Home:</span> <span className="font-medium">{data.contactFrequency.sameHomeSiblings}</span></div>
            <div><span className="text-gray-500">Separated:</span> <span className="font-medium">{data.contactFrequency.separatedSiblings}</span></div>
          </div>
        </Section>

        <Section title="Contact Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Sessions:</span> <span className="font-medium">{data.contactQuality.totalSessions}</span></div>
            <div><span className="text-gray-500">Good+:</span> <span className="font-medium">{data.contactQuality.excellentGoodRate}%</span></div>
            <div><span className="text-gray-500">Positive:</span> <span className="font-medium">{data.contactQuality.positiveOutcomeRate}%</span></div>
            <div><span className="text-gray-500">Child View:</span> <span className="font-medium">{data.contactQuality.childViewSoughtRate}%</span></div>
            <div><span className="text-gray-500">Enjoyed:</span> <span className="font-medium">{data.contactQuality.childEnjoyedRate}%</span></div>
            <div><span className="text-gray-500">Cancelled:</span> <span className={`font-medium ${data.contactQuality.cancellationRate > 0 ? "text-amber-600" : "text-green-600"}`}>{data.contactQuality.cancellationRate}%</span></div>
            <div><span className="text-gray-500">Avg Duration:</span> <span className="font-medium">{data.contactQuality.averageDuration} min</span></div>
          </div>
        </Section>

        <Section title="Review Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Reviews:</span> <span className="font-medium">{data.reviewCompliance.totalReviews}</span></div>
            <div><span className="text-gray-500">All Siblings:</span> <span className="font-medium">{data.reviewCompliance.allSiblingsConsideredRate}%</span></div>
            <div><span className="text-gray-500">Plan Updated:</span> <span className="font-medium">{data.reviewCompliance.contactPlanUpdatedRate}%</span></div>
            <div><span className="text-gray-500">Child Views:</span> <span className="font-medium">{data.reviewCompliance.childViewsIncludedRate}%</span></div>
            <div><span className="text-gray-500">Barriers:</span> <span className="font-medium">{data.reviewCompliance.barriersAddressedRate}%</span></div>
            <div><span className="text-gray-500">Satisfactory:</span> <span className="font-medium">{data.reviewCompliance.outcomeSatisfactoryRate}%</span></div>
          </div>
        </Section>

        <Section title="Staff Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffReadiness.totalStaff}</span></div>
            <div><span className="text-gray-500">Awareness:</span> <span className="font-medium">{data.staffReadiness.siblingAwarenessRate}%</span></div>
            <div><span className="text-gray-500">Facilitating:</span> <span className="font-medium">{data.staffReadiness.facilitatingSkillsRate}%</span></div>
            <div><span className="text-gray-500">Difficult Contact:</span> <span className="font-medium">{data.staffReadiness.difficultContactRate}%</span></div>
            <div><span className="text-gray-500">Child Views:</span> <span className="font-medium">{data.staffReadiness.childViewsRate}%</span></div>
            <div><span className="text-gray-500">Legal:</span> <span className="font-medium">{data.staffReadiness.legalKnowledgeRate}%</span></div>
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
