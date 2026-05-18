"use client";

import { useState, useEffect } from "react";
import type { MenuPlanningNutritionIntelligence } from "@/lib/menu-planning-nutrition";

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

export function MenuPlanningNutritionDashboardWidget() {
  const [data, setData] = useState<MenuPlanningNutritionIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/menu-planning-nutrition")
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
        <h3 className="text-lg font-semibold text-red-800">Menu Planning & Nutrition</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Menu Planning & Nutrition</h3>
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
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.menuQuality.totalMenus}</div>
          <div className="text-xs text-gray-500 mt-1">Weekly Menus</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.childSatisfaction.averageEnjoyment}/5</div>
          <div className="text-xs text-gray-500 mt-1">Avg Enjoyment</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.childSatisfaction.totalFeedback}</div>
          <div className="text-xs text-gray-500 mt-1">Feedback Records</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.nutritionCompliance.overallCompliantRate >= 100 ? "text-green-600" : "text-amber-600"}`}>
            {data.nutritionCompliance.overallCompliantRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Audit Compliance</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.menuQuality.overallScore} label="Menu Quality" maxScore={25} />
        <ScoreBar score={data.childSatisfaction.overallScore} label="Child Satisfaction" maxScore={25} />
        <ScoreBar score={data.childInvolvement.overallScore} label="Child Involvement" maxScore={25} />
        <ScoreBar score={data.nutritionCompliance.overallScore} label="Nutrition Compliance" maxScore={25} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Nutrition Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Avg Enjoyment: <span className="font-medium">{child.averageEnjoyment}/5</span></div>
                    <div>Feedback Given: <span className="font-medium">{child.feedbackCount}</span></div>
                    <div>Portions OK: <span className="font-medium">{child.portionSatisfactoryRate}%</span></div>
                    <div>Participation: <span className="font-medium">{child.participationCount} activities</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Menu Quality">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Menus:</span> <span className="font-medium">{data.menuQuality.totalMenus}</span></div>
            <div><span className="text-gray-500">Nutritional Balance:</span> <span className="font-medium">{data.menuQuality.nutritionalBalanceRate}%</span></div>
            <div><span className="text-gray-500">Variety:</span> <span className="font-medium">{data.menuQuality.varietyRate}%</span></div>
            <div><span className="text-gray-500">Cultural Needs:</span> <span className="font-medium">{data.menuQuality.culturalAccommodationRate}%</span></div>
            <div><span className="text-gray-500">Children Consulted:</span> <span className="font-medium">{data.menuQuality.childrenConsultedRate}%</span></div>
            <div><span className="text-gray-500">Special Dietary Met:</span> <span className="font-medium">{data.menuQuality.specialDietaryMetRate}%</span></div>
          </div>
        </Section>

        <Section title="Child Satisfaction">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Feedback:</span> <span className="font-medium">{data.childSatisfaction.totalFeedback}</span></div>
            <div><span className="text-gray-500">Avg Enjoyment:</span> <span className="font-medium">{data.childSatisfaction.averageEnjoyment}/5</span></div>
            <div><span className="text-gray-500">Portion OK:</span> <span className="font-medium">{data.childSatisfaction.portionSatisfactoryRate}%</span></div>
            <div><span className="text-gray-500">Positive Feedback:</span> <span className="font-medium">{data.childSatisfaction.positiveFeedbackRate}%</span></div>
            <div><span className="text-gray-500">Response Rate:</span> <span className="font-medium">{data.childSatisfaction.responseRate}%</span></div>
          </div>
        </Section>

        <Section title="Child Involvement">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Records:</span> <span className="font-medium">{data.childInvolvement.totalRecords}</span></div>
            <div><span className="text-gray-500">Participation:</span> <span className="font-medium">{data.childInvolvement.participationRate}%</span></div>
            <div><span className="text-gray-500">Activity Types:</span> <span className="font-medium">{data.childInvolvement.activityVariety}</span></div>
            <div><span className="text-gray-500">Child Enjoyed:</span> <span className="font-medium">{data.childInvolvement.childEnjoyedRate}%</span></div>
            <div><span className="text-gray-500">Cooking Activities:</span> <span className="font-medium">{data.childInvolvement.cookingActivityRate}%</span></div>
            <div><span className="text-gray-500">Staff Support:</span> <span className="font-medium">{data.childInvolvement.staffSupportRate}%</span></div>
          </div>
        </Section>

        <Section title="Nutrition Compliance">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Audits:</span> <span className="font-medium">{data.nutritionCompliance.totalAudits}</span></div>
            <div><span className="text-gray-500">Five-a-Day:</span> <span className="font-medium">{data.nutritionCompliance.fiveADayRate}%</span></div>
            <div><span className="text-gray-500">Fresh Food:</span> <span className="font-medium">{data.nutritionCompliance.freshFoodRate}%</span></div>
            <div><span className="text-gray-500">Sugar Limits:</span> <span className="font-medium">{data.nutritionCompliance.sugarLimitsRate}%</span></div>
            <div><span className="text-gray-500">Portion Guidance:</span> <span className="font-medium">{data.nutritionCompliance.portionGuidanceRate}%</span></div>
            <div><span className="text-gray-500">Overall Compliant:</span> <span className={`font-medium ${data.nutritionCompliance.overallCompliantRate >= 100 ? "text-green-600" : "text-amber-600"}`}>{data.nutritionCompliance.overallCompliantRate}%</span></div>
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
