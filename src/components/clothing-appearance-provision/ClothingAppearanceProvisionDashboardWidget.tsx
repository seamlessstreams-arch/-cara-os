"use client";

import { useState, useEffect } from "react";
import type { ClothingAppearanceProvisionIntelligence } from "@/lib/clothing-appearance-provision";
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

export function ClothingAppearanceProvisionDashboardWidget() {
  const [data, setData] = useState<ClothingAppearanceProvisionIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clothing-appearance-provision")
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
        <h3 className="text-lg font-semibold text-red-800">Clothing & Appearance Provision</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Clothing & Appearance Provision</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.quality.totalAssessments}</div>
          <div className="text-xs text-gray-500 mt-1">Assessments</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.quality.qualityRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Quality Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.quality.childChoiceRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Child Choice</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.childProfiles.length}</div>
          <div className="text-xs text-gray-500 mt-1">Children</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.quality.overallScore} label="Quality" maxScore={25} />
        <ScoreBar score={data.compliance.overallScore} label="Compliance" maxScore={25} />
        <ScoreBar score={data.policy.overallScore} label="Policy" maxScore={25} />
        <ScoreBar score={data.staffReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Assessments: <span className="font-medium">{child.totalAssessments}</span></div>
                    <div>Quality: <span className="font-medium">{formatRate(child.qualityRate)}</span></div>
                    <div>Child Choice: <span className="font-medium">{formatRate(child.childChoiceRate)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Assessments:</span> <span className="font-medium">{data.quality.totalAssessments}</span></div>
            <div><span className="text-gray-500">Quality Rate:</span> <span className="font-medium">{formatRate(data.quality.qualityRate)}</span></div>
            <div><span className="text-gray-500">Child Choice:</span> <span className="font-medium">{formatRate(data.quality.childChoiceRate)}</span></div>
            <div><span className="text-gray-500">Age Appropriate:</span> <span className="font-medium">{formatRate(data.quality.ageAppropriateRate)}</span></div>
            <div><span className="text-gray-500">Cultural:</span> <span className="font-medium">{formatRate(data.quality.culturalRate)}</span></div>
          </div>
        </Section>

        <Section title="Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Documented:</span> <span className="font-medium">{formatRate(data.compliance.documentedRate)}</span></div>
            <div><span className="text-gray-500">Staff Assessed:</span> <span className="font-medium">{formatRate(data.compliance.staffAssessedRate)}</span></div>
            <div><span className="text-gray-500">Feedback:</span> <span className="font-medium">{formatRate(data.compliance.feedbackRate)}</span></div>
            <div><span className="text-gray-500">Category Diversity:</span> <span className="font-medium">{formatRate(data.compliance.categoryDiversityRatio)}</span></div>
          </div>
        </Section>

        <Section title="Clothing Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Provision Strategy:</span> <span className="font-medium">{formatRate(data.policy.clothingProvisionStrategyRate)}</span></div>
            <div><span className="text-gray-500">Budget Framework:</span> <span className="font-medium">{formatRate(data.policy.clothingBudgetFrameworkRate)}</span></div>
            <div><span className="text-gray-500">Seasonal Review:</span> <span className="font-medium">{formatRate(data.policy.seasonalReviewProcedureRate)}</span></div>
            <div><span className="text-gray-500">Child Choice:</span> <span className="font-medium">{formatRate(data.policy.childChoiceGuidanceRate)}</span></div>
            <div><span className="text-gray-500">Cultural/Religious:</span> <span className="font-medium">{formatRate(data.policy.culturalAndReligiousAccommodationRate)}</span></div>
            <div><span className="text-gray-500">Laundry/Maintenance:</span> <span className="font-medium">{formatRate(data.policy.laundryAndMaintenancePlanRate)}</span></div>
            <div><span className="text-gray-500">Regular Review:</span> <span className="font-medium">{formatRate(data.policy.regularReviewRate)}</span></div>
          </div>
        </Section>

        <Section title="Staff Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Clothing Assessment:</span> <span className="font-medium">{formatRate(data.staffReadiness.clothingAssessmentRate)}</span></div>
            <div><span className="text-gray-500">Child Choice:</span> <span className="font-medium">{formatRate(data.staffReadiness.childChoiceFacilitationRate)}</span></div>
            <div><span className="text-gray-500">Budget Mgmt:</span> <span className="font-medium">{formatRate(data.staffReadiness.budgetManagementRate)}</span></div>
            <div><span className="text-gray-500">Cultural Awareness:</span> <span className="font-medium">{formatRate(data.staffReadiness.culturalAwarenessRate)}</span></div>
            <div><span className="text-gray-500">Age Appropriate:</span> <span className="font-medium">{formatRate(data.staffReadiness.ageAppropriateGuidanceRate)}</span></div>
            <div><span className="text-gray-500">Record Keeping:</span> <span className="font-medium">{formatRate(data.staffReadiness.recordKeepingRate)}</span></div>
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
