"use client";

import { useState, useEffect } from "react";
import type { ClothingAppearanceProvisionIntelligence } from "@/lib/clothing-appearance-provision";

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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.clothingProvision.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Provisions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.clothingProvision.fullyMetRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Fully Met</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.clothingProvision.childChoiceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Child Choice</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.budgetManagement.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Budget Periods</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffClothingReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.clothingProvision.overallScore} label="Clothing Provision" maxScore={25} />
        <ScoreBar score={data.budgetManagement.overallScore} label="Budget Management" maxScore={25} />
        <ScoreBar score={data.clothingPolicy.overallScore} label="Clothing Policy" maxScore={25} />
        <ScoreBar score={data.staffClothingReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Clothing Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Records: <span className="font-medium">{child.totalRecords}</span></div>
                    <div>Fully Met: <span className="font-medium">{child.fullyMetRate}%</span></div>
                    <div>Child Choice: <span className="font-medium">{child.childChoiceRate}%</span></div>
                    <div>Fit Correct: <span className="font-medium">{child.fitCorrectRate}%</span></div>
                    <div>Budget: <span className={`font-medium ${child.budgetAdequacy ? "text-green-600" : "text-amber-600"}`}>{child.budgetAdequacy ? "Within Budget" : "Over Budget"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Clothing Provision">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Records:</span> <span className="font-medium">{data.clothingProvision.totalRecords}</span></div>
            <div><span className="text-gray-500">Fully Met:</span> <span className="font-medium">{data.clothingProvision.fullyMetRate}%</span></div>
            <div><span className="text-gray-500">Child Choice:</span> <span className="font-medium">{data.clothingProvision.childChoiceRate}%</span></div>
            <div><span className="text-gray-500">Age Appropriate:</span> <span className="font-medium">{data.clothingProvision.ageAppropriateRate}%</span></div>
            <div><span className="text-gray-500">Fit Correct:</span> <span className="font-medium">{data.clothingProvision.fitCorrectRate}%</span></div>
            <div><span className="text-gray-500">Culturally Appropriate:</span> <span className="font-medium">{data.clothingProvision.culturallyAppropriateRate}%</span></div>
          </div>
        </Section>

        <Section title="Budget Management">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Records:</span> <span className="font-medium">{data.budgetManagement.totalRecords}</span></div>
            <div><span className="text-gray-500">Within Budget:</span> <span className="font-medium">{data.budgetManagement.budgetAdequacyRate}%</span></div>
            <div><span className="text-gray-500">Child Involved:</span> <span className="font-medium">{data.budgetManagement.childInvolvedRate}%</span></div>
            <div><span className="text-gray-500">Receipts:</span> <span className="font-medium">{data.budgetManagement.receiptsRecordedRate}%</span></div>
            <div><span className="text-gray-500">Spend Ratio:</span> <span className="font-medium">{data.budgetManagement.averageSpendRatio}%</span></div>
          </div>
        </Section>

        <Section title="Clothing Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Policies:</span> <span className="font-medium">{data.clothingPolicy.totalPolicies}</span></div>
            <div><span className="text-gray-500">Individual Lists:</span> <span className="font-medium">{data.clothingPolicy.individualClothingListRate}%</span></div>
            <div><span className="text-gray-500">Seasonal Review:</span> <span className="font-medium">{data.clothingPolicy.seasonalReviewRate}%</span></div>
            <div><span className="text-gray-500">Child Choice:</span> <span className="font-medium">{data.clothingPolicy.childChoiceRate}%</span></div>
            <div><span className="text-gray-500">Cultural Needs:</span> <span className="font-medium">{data.clothingPolicy.culturalNeedsRate}%</span></div>
            <div><span className="text-gray-500">Labelling:</span> <span className="font-medium">{data.clothingPolicy.labellingProtocolRate}%</span></div>
            <div><span className="text-gray-500">Laundry:</span> <span className="font-medium">{data.clothingPolicy.laundryArrangementsRate}%</span></div>
            <div><span className="text-gray-500">Budget Transparency:</span> <span className="font-medium">{data.clothingPolicy.budgetTransparencyRate}%</span></div>
          </div>
        </Section>

        <Section title="Staff Clothing Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffClothingReadiness.totalStaff}</span></div>
            <div><span className="text-gray-500">Standards:</span> <span className="font-medium">{data.staffClothingReadiness.clothingStandardsRate}%</span></div>
            <div><span className="text-gray-500">Child Choice:</span> <span className="font-medium">{data.staffClothingReadiness.childChoiceRate}%</span></div>
            <div><span className="text-gray-500">Cultural Awareness:</span> <span className="font-medium">{data.staffClothingReadiness.culturalAwarenessRate}%</span></div>
            <div><span className="text-gray-500">Budget Mgmt:</span> <span className="font-medium">{data.staffClothingReadiness.budgetManagementRate}%</span></div>
            <div><span className="text-gray-500">Age Appropriate:</span> <span className="font-medium">{data.staffClothingReadiness.ageAppropriatenessRate}%</span></div>
            <div><span className="text-gray-500">Dignity/Privacy:</span> <span className="font-medium">{data.staffClothingReadiness.dignityAndPrivacyRate}%</span></div>
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
