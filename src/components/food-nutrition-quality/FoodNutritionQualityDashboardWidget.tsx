"use client";

import { useState, useEffect } from "react";
import type { FoodNutritionQualityIntelligence } from "@/lib/food-nutrition-quality";

const ratingColour: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const ratingLabel: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

function boolBadge(val: boolean): string {
  return val ? "text-green-700" : "text-red-600";
}

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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span> <span className="font-medium">{value}</span>
    </div>
  );
}

export default function FoodNutritionQualityDashboardWidget() {
  const [data, setData] = useState<FoodNutritionQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/food-nutrition-quality")
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
        <h3 className="text-lg font-semibold text-red-800">Food Nutrition Quality</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Food Nutrition Quality</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColour[data.rating] || ""}`}>
            {ratingLabel[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.mealQuality.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Meal Records</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.mealQuality.nutritionRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Nutrition Quality</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.mealQuality.dietaryNeedsMetRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Dietary Needs Met</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffNutritionReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.mealQuality.overallScore} label="Meal Quality" maxScore={25} />
        <ScoreBar score={data.nutritionCompliance.overallScore} label="Nutrition Compliance" maxScore={25} />
        <ScoreBar score={data.nutritionPolicy.overallScore} label="Nutrition Policy" maxScore={25} />
        <ScoreBar score={data.staffNutritionReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Nutrition Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Meals: <span className="font-medium">{child.totalMeals}</span></div>
                    <div>Nutrition: <span className="font-medium">{child.nutritionRate}%</span></div>
                    <div>Dietary Met: <span className="font-medium">{child.dietaryNeedsMetRate}%</span></div>
                    <div>Meal Types: <span className="font-medium">{child.uniqueMealTypes}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Meal Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Records" value={data.mealQuality.totalRecords} />
            <Stat label="Nutrition Rate" value={`${data.mealQuality.nutritionRate}%`} />
            <Stat label="Dietary Needs Met" value={`${data.mealQuality.dietaryNeedsMetRate}%`} />
            <Stat label="Child Choice" value={`${data.mealQuality.childChoiceRate}%`} />
            <Stat label="Fresh Ingredients" value={`${data.mealQuality.freshIngredientsRate}%`} />
          </div>
        </Section>

        <Section title="Nutrition Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Records" value={data.nutritionCompliance.totalRecords} />
            <Stat label="Portions Appropriate" value={`${data.nutritionCompliance.portionAppropriateRate}%`} />
            <Stat label="Documented" value={`${data.nutritionCompliance.documentedRate}%`} />
            <Stat label="Child Satisfied" value={`${data.nutritionCompliance.childSatisfiedRate}%`} />
            <Stat label="Meal Diversity" value={`${data.nutritionCompliance.mealTypeDiversity}%`} />
          </div>
        </Section>

        <Section title="Nutrition Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Meal Planning:</span> <span className={`font-medium ${boolBadge(data.nutritionPolicy.mealPlanningFrameworkMet)}`}>{data.nutritionPolicy.mealPlanningFrameworkMet ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Dietary Assessment:</span> <span className={`font-medium ${boolBadge(data.nutritionPolicy.dietaryAssessmentProcessMet)}`}>{data.nutritionPolicy.dietaryAssessmentProcessMet ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Allergy Management:</span> <span className={`font-medium ${boolBadge(data.nutritionPolicy.allergyManagementMet)}`}>{data.nutritionPolicy.allergyManagementMet ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Cultural Dietary:</span> <span className={`font-medium ${boolBadge(data.nutritionPolicy.culturalDietaryRespectMet)}`}>{data.nutritionPolicy.culturalDietaryRespectMet ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Food Hygiene:</span> <span className={`font-medium ${boolBadge(data.nutritionPolicy.foodHygieneStandardsMet)}`}>{data.nutritionPolicy.foodHygieneStandardsMet ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Child Participation:</span> <span className={`font-medium ${boolBadge(data.nutritionPolicy.childParticipationMet)}`}>{data.nutritionPolicy.childParticipationMet ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Regular Review:</span> <span className={`font-medium ${boolBadge(data.nutritionPolicy.regularReviewMet)}`}>{data.nutritionPolicy.regularReviewMet ? "Yes" : "No"}</span></div>
          </div>
        </Section>

        <Section title="Staff Nutrition Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Staff" value={data.staffNutritionReadiness.totalStaff} />
            <Stat label="Food Hygiene" value={`${data.staffNutritionReadiness.foodHygieneRate}%`} />
            <Stat label="Nutritional Planning" value={`${data.staffNutritionReadiness.nutritionalPlanningRate}%`} />
            <Stat label="Allergy Awareness" value={`${data.staffNutritionReadiness.allergyAwarenessRate}%`} />
            <Stat label="Cultural Dietary" value={`${data.staffNutritionReadiness.culturalDietaryNeedsRate}%`} />
            <Stat label="Portion Control" value={`${data.staffNutritionReadiness.portionControlRate}%`} />
            <Stat label="Meal Preparation" value={`${data.staffNutritionReadiness.mealPreparationRate}%`} />
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
