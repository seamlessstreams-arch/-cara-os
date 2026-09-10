"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";
import type { WhistleblowingIntelligenceResult } from "@/lib/whistleblowing";

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
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
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

export function WhistleblowingDashboardWidget() {
  const [data, setData] = useState<WhistleblowingIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/whistleblowing")
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
        <h3 className="text-lg font-semibold text-red-800">Whistleblowing &amp; Professional Courage</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Whistleblowing &amp; Professional Courage</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.concernHandling.totalConcerns}</div>
          <div className="text-xs text-gray-500 mt-1">Concerns Raised</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.policyCompliance.staffAwarenessRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Awareness</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.professionalCourage.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Courage Records</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.culture.averageOpenness.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Openness Score</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.culture.averageFearOfReprisal <= 3 ? "text-green-600" : "text-red-600"}`}>
            {data.culture.averageFearOfReprisal.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Fear of Reprisal</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.concernHandling.overallScore} label="Concern Handling" />
        <ScoreBar score={data.policyCompliance.overallScore} label="Policy Compliance" />
        <ScoreBar score={data.professionalCourage.overallScore} label="Professional Courage" />
        <ScoreBar score={data.staffAwareness.overallScore} label="Staff Awareness" />
        <ScoreBar score={data.culture.overallScore} label="Culture" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Concern Handling" defaultOpen>
          {data.concernHandling.totalConcerns > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.concernHandling.totalConcerns}</span></div>
                <div><span className="text-gray-500">Avg Acknowledgement:</span> <span className="font-medium">{data.concernHandling.averageAcknowledgementDays} days</span></div>
                <div><span className="text-gray-500">Avg Resolution:</span> <span className="font-medium">{data.concernHandling.averageResolutionDays} days</span></div>
                <div><span className="text-gray-500">Feedback Rate:</span> <span className="font-medium">{formatRate(data.concernHandling.feedbackRate)}</span></div>
                <div><span className="text-gray-500">Escalation Rate:</span> <span className={`font-medium ${data.concernHandling.escalationRate > 50 ? "text-amber-600" : "text-gray-900"}`}>{formatRate(data.concernHandling.escalationRate)}</span></div>
                <div><span className="text-gray-500">Protection:</span> <span className="font-medium text-green-600">{data.concernHandling.protectionRate}%</span></div>
              </div>
              {Object.keys(data.concernHandling.categoryBreakdown).length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.concernHandling.categoryBreakdown).map(([cat, count]) => (
                      <span key={cat} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                        {cat.replace(/_/g, " ")}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No concerns raised in this period — scoring weighted towards proactive measures.</p>
          )}
        </Section>

        <Section title="Policy Compliance">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Policy Status:</span>{" "}
              <span className={`font-medium ${data.policyCompliance.policyCurrent ? "text-green-600" : "text-red-600"}`}>
                {data.policyCompliance.policyCurrent ? "Current" : "Needs Review"}
              </span>
            </div>
            <div><span className="text-gray-500">Coverage Score:</span> <span className="font-medium">{data.policyCompliance.coverageScore}%</span></div>
            <div><span className="text-gray-500">Staff Signed:</span> <span className="font-medium">{formatRate(data.policyCompliance.staffAwarenessRate)}</span></div>
          </div>
        </Section>

        <Section title="Professional Courage">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Records:</span> <span className="font-medium">{data.professionalCourage.totalRecords}</span></div>
            <div><span className="text-gray-500">Staff Engaged:</span> <span className="font-medium">{data.professionalCourage.staffEngaged}</span></div>
            <div><span className="text-gray-500">Positive Outcomes:</span> <span className="font-medium">{formatRate(data.professionalCourage.positiveOutcomeRate)}</span></div>
            <div><span className="text-gray-500">Management Support:</span> <span className="font-medium">{data.professionalCourage.managementSupportRate}%</span></div>
            <div><span className="text-gray-500">Documented:</span> <span className="font-medium">{data.professionalCourage.documentedInSupervisionRate}%</span></div>
          </div>
          {Object.keys(data.professionalCourage.challengeTypeBreakdown).length > 0 && (
            <div className="mt-2">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Challenge Types</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.professionalCourage.challengeTypeBreakdown).map(([type, count]) => (
                  <span key={type} className="px-2 py-1 bg-purple-50 rounded text-xs text-purple-700">
                    {type.replace(/_/g, " ")}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Staff Awareness & Training">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Assessed:</span> <span className="font-medium">{data.staffAwareness.staffAssessed}</span></div>
            <div><span className="text-gray-500">Knows How to Report:</span> <span className="font-medium">{data.staffAwareness.knowsHowToReportRate}%</span></div>
            <div><span className="text-gray-500">Knows External Routes:</span> <span className="font-medium">{data.staffAwareness.knowsExternalRoutesRate}%</span></div>
            <div><span className="text-gray-500">Feels Confident:</span> <span className="font-medium">{data.staffAwareness.feelsConfidentRate}%</span></div>
            <div><span className="text-gray-500">Understands Protection:</span> <span className="font-medium">{data.staffAwareness.understandsProtectionRate}%</span></div>
          </div>
        </Section>

        <Section title="Culture & Openness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Openness:</span> <span className="font-medium">{data.culture.averageOpenness.toFixed(1)}/10</span></div>
            <div><span className="text-gray-500">Trust:</span> <span className="font-medium">{data.culture.averageTrust.toFixed(1)}/10</span></div>
            <div><span className="text-gray-500">Confidence:</span> <span className="font-medium">{data.culture.averageConfidence.toFixed(1)}/10</span></div>
            <div>
              <span className="text-gray-500">Fear of Reprisal:</span>{" "}
              <span className={`font-medium ${data.culture.averageFearOfReprisal <= 3 ? "text-green-600" : "text-red-600"}`}>
                {data.culture.averageFearOfReprisal.toFixed(1)}/10
              </span>
            </div>
            <div>
              <span className="text-gray-500">Trend:</span>{" "}
              <span className={`font-medium ${data.culture.improvingTrend ? "text-green-600" : "text-amber-600"}`}>
                {data.culture.improvingTrend ? "Improving" : "Stable/Declining"}
              </span>
            </div>
          </div>
          {data.culture.themes.length > 0 && (
            <div className="mt-2">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Key Themes</h4>
              <div className="flex flex-wrap gap-2">
                {data.culture.themes.map((theme, i) => (
                  <span key={i} className="px-2 py-1 bg-teal-50 rounded text-xs text-teal-700">{theme}</span>
                ))}
              </div>
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
