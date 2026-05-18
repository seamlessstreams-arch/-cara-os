"use client";

// ══════════════════════════════════════════════════════════════════════════════
// NUTRITION & DIETARY COMPLIANCE DASHBOARD WIDGET
//
// Displays nutrition intelligence:
// - Overall nutrition rating
// - Dietary accommodation rates
// - Meal quality & variety
// - Child involvement (cooking, menu planning)
// - Food safety compliance
// - Per-child nutrition profiles
// - Cooking skills progress & independence
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ChildNutritionProfileData {
  childId: string;
  childName: string;
  dietaryRequirements: string[];
  allergies: string[];
  requirementsMet: boolean;
  mealsAttended: number;
  cookingSessions: number;
  cookingSkillLevel: number;
  cookingSkillProgress: boolean;
  menuContributions: number;
  primaryConcern?: string;
}

interface NutritionData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  dietaryAccommodation: {
    totalChildren: number;
    childrenWithRequirements: number;
    requirementsMet: number;
    requirementsNotMet: number;
    metRate: number;
    allergyManagementRate: number;
    requirementBreakdown: { type: string; typeLabel?: string; count: number }[];
  };
  mealQuality: {
    totalMeals: number;
    mealsPerDay: number;
    freshFruitVegRate: number;
    averageFoodGroupsCovered: number;
    varietyScore: number;
    culturalMealRate: number;
    freshCookingRate: number;
    qualityFactorFrequency: { factor: string; factorLabel?: string; count: number; rate: number }[];
  };
  childInvolvement: {
    menuContributionRate: number;
    cookingSessionsTotal: number;
    cookingSessionsPerChild: number;
    childInitiatedRate: number;
    engagementRate: number;
    staffAteWithChildrenRate: number;
    childrenHelpedCookRate: number;
    childrenChoseMenuRate: number;
  };
  foodSafety: {
    totalChecks: number;
    compliantChecks: number;
    complianceRate: number;
    correctionsNeeded: number;
    correctionsMade: number;
    correctionRate: number;
    checkTypeBreakdown: { checkType: string; total: number; compliant: number }[];
  };
  childProfiles: ChildNutritionProfileData[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Rating Badge ───────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding" ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good" ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement" ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";
  const label =
    rating === "outstanding" ? "Outstanding"
      : rating === "good" ? "Good"
        : rating === "requires_improvement" ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Skill Level Bar ────────────────────────────────────────────────────────

function SkillLevelBar({ level }: { level: number }) {
  const labels = ["", "Beginner", "Basic", "Competent", "Independent", "Confident"];
  const widths = [0, 20, 40, 60, 80, 100];
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[level]} rounded-full`} style={{ width: `${widths[level]}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 w-16 text-right">{labels[level]}</span>
    </div>
  );
}

// ── Child Nutrition Card ──────────────────────────────────────────────────

function ChildNutritionCard({ child }: { child: ChildNutritionProfileData }) {
  return (
    <div className={`rounded-lg border p-3 ${child.primaryConcern ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{child.childName}</span>
        <div className="flex gap-1">
          {!child.requirementsMet && (
            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">DIET ALERT</span>
          )}
          {child.cookingSkillProgress && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">PROGRESSING</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center mb-2">
        <div>
          <div className="text-xs text-gray-500">Meals</div>
          <div className="text-sm font-bold text-gray-800">{child.mealsAttended}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Cooking</div>
          <div className="text-sm font-bold text-purple-700">{child.cookingSessions}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Menu Input</div>
          <div className="text-sm font-bold text-blue-700">{child.menuContributions}</div>
        </div>
      </div>
      <SkillLevelBar level={child.cookingSkillLevel} />
      {(child.dietaryRequirements.length > 0 || child.allergies.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {child.dietaryRequirements.map((r) => (
            <span key={r} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
              {r.replace(/_/g, " ")}
            </span>
          ))}
          {child.allergies.map((a) => (
            <span key={a} className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
              {a.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
      {child.primaryConcern && (
        <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">{child.primaryConcern}</div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function NutritionDashboardWidget() {
  const [data, setData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/nutrition");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Nutrition Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Nutrition & Dietary Compliance</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            CHR 2015 Reg 9 | {data.mealQuality.totalMeals} meals recorded | {data.childInvolvement.cookingSessionsTotal} cooking sessions
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.dietaryAccommodation.metRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Diet Met</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.mealQuality.freshFruitVegRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Fresh Fruit/Veg</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.childInvolvement.menuContributionRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Menu Input</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.foodSafety.complianceRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Food Safety</div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs px-2 py-1 rounded ${data.dietaryAccommodation.allergyManagementRate === 100 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          Allergens: {data.dietaryAccommodation.allergyManagementRate === 100 ? "Safe" : "ALERT"}
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {data.mealQuality.freshCookingRate}% fresh cooked
        </span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
          {data.childInvolvement.staffAteWithChildrenRate}% staff ate with children
        </span>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
          {data.childInvolvement.engagementRate}% cooking engagement
        </span>
        {data.mealQuality.culturalMealRate > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
            {data.mealQuality.culturalMealRate}% cultural meals
          </span>
        )}
      </div>

      {/* Child Nutrition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childProfiles.map((child) => (
          <ChildNutritionCard key={child.childId} child={child} />
        ))}
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.map((action, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "\u{1F534}" : action.startsWith("HIGH") ? "\u{1F7E0}" : "\u{1F7E1}"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show quality factors, food safety & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Quality Factors */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Mealtime Quality Factors</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.mealQuality.qualityFactorFrequency.map((f) => (
                <span key={f.factor} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                  {f.factorLabel ?? f.factor.replace(/_/g, " ")}: {f.rate}%
                </span>
              ))}
            </div>
          </div>

          {/* Food Safety Breakdown */}
          {data.foodSafety.totalChecks > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Food Safety Checks ({data.foodSafety.compliantChecks}/{data.foodSafety.totalChecks} compliant)
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {data.foodSafety.checkTypeBreakdown.map((c) => (
                  <span
                    key={c.checkType}
                    className={`text-[10px] px-2 py-0.5 rounded ${c.compliant === c.total ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}
                  >
                    {c.checkType.replace(/_/g, " ")}: {c.compliant}/{c.total}
                  </span>
                ))}
              </div>
              {data.foodSafety.correctionsNeeded > 0 && (
                <p className="text-xs text-gray-500">
                  Corrections: {data.foodSafety.correctionsMade}/{data.foodSafety.correctionsNeeded} resolved ({data.foodSafety.correctionRate}%)
                </p>
              )}
            </div>
          )}

          {/* Dietary Requirement Breakdown */}
          {data.dietaryAccommodation.requirementBreakdown.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Dietary Requirements</h4>
              <div className="flex flex-wrap gap-1.5">
                {data.dietaryAccommodation.requirementBreakdown.map((r) => (
                  <span key={r.type} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {r.typeLabel ?? r.type.replace(/_/g, " ")}: {r.count} child{r.count !== 1 ? "ren" : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">+ {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Development */}
          {data.areasForDevelopment.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Development</h4>
              <ul className="space-y-1">
                {data.areasForDevelopment.map((area, i) => (
                  <li key={i} className="text-xs text-orange-700">- {area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory References</h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
