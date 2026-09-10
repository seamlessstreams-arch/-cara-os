"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";
import type { NutritionHealthyLivingIntelligence } from "@/lib/nutrition-healthy-living";

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

export function NutritionHealthyLivingDashboardWidget() {
  const [data, setData] = useState<NutritionHealthyLivingIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/nutrition-healthy-living")
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
        <h3 className="text-lg font-semibold text-red-800">Nutrition & Healthy Living</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Nutrition & Healthy Living</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.mealQuality.totalMeals}</div>
          <div className="text-xs text-gray-500 mt-1">Meals Recorded</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.mealQuality.excellentGoodRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Meal Quality</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.physicalActivity.averageMinutesPerChildPerWeek}</div>
          <div className="text-xs text-gray-500 mt-1">Min/Child/Week</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.physicalActivity.meetsNHSGuidelines ? "text-green-600" : "text-amber-600"}`}>
            {data.physicalActivity.meetsNHSGuidelines ? "Yes" : "No"}
          </div>
          <div className="text-xs text-gray-500 mt-1">NHS Guidelines</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.healthPromotion.annualHealthAssessmentRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Health Assessments</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.mealQuality.overallScore} label="Meal Quality" maxScore={25} />
        <ScoreBar score={data.physicalActivity.overallScore} label="Physical Activity" maxScore={25} />
        <ScoreBar score={data.healthPromotion.overallScore} label="Health Promotion" maxScore={25} />
        <ScoreBar score={data.menuPlanning.overallScore} label="Menu Planning" maxScore={25} />
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
                    <div>Dietary Compliance: <span className="font-medium">{formatRate(child.dietaryComplianceRate)}</span></div>
                    <div>Weekly Activity: <span className="font-medium">{child.weeklyActivityMinutes}min</span></div>
                    <div>Health Checks: <span className={`font-medium ${child.healthChecksUpToDate ? "text-green-600" : "text-red-600"}`}>{child.healthChecksUpToDate ? "Up to date" : "Overdue"}</span></div>
                    <div>Diet: <span className="font-medium">{child.dietaryRequirements.join(", ")}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Meal Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Meals:</span> <span className="font-medium">{data.mealQuality.totalMeals}</span></div>
            <div><span className="text-gray-500">Quality Rate:</span> <span className="font-medium">{formatRate(data.mealQuality.excellentGoodRate)}</span></div>
            <div><span className="text-gray-500">Dietary Compliance:</span> <span className="font-medium">{formatRate(data.mealQuality.dietaryComplianceRate)}</span></div>
            <div><span className="text-gray-500">Fruit & Veg:</span> <span className="font-medium">{formatRate(data.mealQuality.freshFruitVegRate)}</span></div>
            <div><span className="text-gray-500">Child Involved:</span> <span className="font-medium">{formatRate(data.mealQuality.childInvolvementRate)}</span></div>
            <div><span className="text-gray-500">Child Enjoyed:</span> <span className="font-medium">{formatRate(data.mealQuality.childEnjoymentRate)}</span></div>
            <div><span className="text-gray-500">Portions OK:</span> <span className="font-medium">{formatRate(data.mealQuality.portionAppropriateRate)}</span></div>
          </div>
        </Section>

        <Section title="Physical Activity">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Activities:</span> <span className="font-medium">{data.physicalActivity.totalActivities}</span></div>
            <div><span className="text-gray-500">Avg Min/Week:</span> <span className="font-medium">{data.physicalActivity.averageMinutesPerChildPerWeek}</span></div>
            <div><span className="text-gray-500">Active Children:</span> <span className="font-medium">{formatRate(data.physicalActivity.activeChildrenRate)}</span></div>
            <div><span className="text-gray-500">Vigorous/Moderate:</span> <span className="font-medium">{formatRate(data.physicalActivity.vigorousModerateRate)}</span></div>
            <div><span className="text-gray-500">Enjoyment:</span> <span className="font-medium">{formatRate(data.physicalActivity.childEnjoymentRate)}</span></div>
            <div><span className="text-gray-500">Variety:</span> <span className="font-medium">{data.physicalActivity.activityVariety} types</span></div>
            <div><span className="text-gray-500">NHS Guidelines:</span> <span className={`font-medium ${data.physicalActivity.meetsNHSGuidelines ? "text-green-600" : "text-amber-600"}`}>{data.physicalActivity.meetsNHSGuidelines ? "Met" : "Below"}</span></div>
          </div>
        </Section>

        <Section title="Health Promotion">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Hydration:</span> <span className="font-medium">{formatRate(data.healthPromotion.hydrationGoodRate)}</span></div>
            <div><span className="text-gray-500">Sleep Quality:</span> <span className="font-medium">{formatRate(data.healthPromotion.sleepQualityRate)}</span></div>
            <div><span className="text-gray-500">Dental:</span> <span className="font-medium">{formatRate(data.healthPromotion.dentalUpToDateRate)}</span></div>
            <div><span className="text-gray-500">Optical:</span> <span className="font-medium">{formatRate(data.healthPromotion.opticalUpToDateRate)}</span></div>
            <div><span className="text-gray-500">Health Assessment:</span> <span className="font-medium">{formatRate(data.healthPromotion.annualHealthAssessmentRate)}</span></div>
            <div><span className="text-gray-500">Cooking Skills:</span> <span className="font-medium">{formatRate(data.healthPromotion.cookingSkillsRate)}</span></div>
            <div><span className="text-gray-500">Nutrition Ed:</span> <span className="font-medium">{formatRate(data.healthPromotion.nutritionEducationRate)}</span></div>
            <div><span className="text-gray-500">Mental Wellbeing:</span> <span className="font-medium">{formatRate(data.healthPromotion.mentalWellbeingRate)}</span></div>
          </div>
        </Section>

        <Section title="Menu Planning">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Menu Plans:</span> <span className="font-medium">{data.menuPlanning.totalMenuPlans}</span></div>
            <div><span className="text-gray-500">Balanced:</span> <span className="font-medium">{formatRate(data.menuPlanning.balancedMealRate)}</span></div>
            <div><span className="text-gray-500">Children Consulted:</span> <span className="font-medium">{formatRate(data.menuPlanning.childConsultationRate)}</span></div>
            <div><span className="text-gray-500">Cultural Diversity:</span> <span className="font-medium">{formatRate(data.menuPlanning.culturalDiversityRate)}</span></div>
            <div><span className="text-gray-500">Special Diets:</span> <span className="font-medium">{formatRate(data.menuPlanning.specialDietsCateredRate)}</span></div>
            <div><span className="text-gray-500">Seasonal:</span> <span className="font-medium">{formatRate(data.menuPlanning.seasonalIngredientRate)}</span></div>
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
