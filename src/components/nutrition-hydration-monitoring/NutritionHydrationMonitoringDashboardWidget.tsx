"use client";

// ══════════════════════════════════════════════════════════════════════════════
// NUTRITION & HYDRATION MONITORING DASHBOARD WIDGET
//
// Displays the 4-layer nutrition and hydration monitoring intelligence:
// - Overall score with rating
// - Layer scores: meal quality, hydration, policy, staff readiness
// - Child nutrition profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface MealQuality {
  totalMeals: number;
  nutritionQualityGoodPlusRate: number;
  portionConsumedFullMostRate: number;
  dietaryRequirementsMetRate: number;
  childSatisfiedRate: number;
  qualityBreakdown: Record<string, number>;
  portionBreakdown: Record<string, number>;
  mealTypeBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface HydrationStandards {
  totalRecords: number;
  hydrationGoodPlusRate: number;
  targetMetRate: number;
  encouragementGivenRate: number;
  averageCupsConsumed: number;
  averageTargetCups: number;
  averageCupsVsTargetRate: number;
  hydrationBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface NutritionPolicyData {
  hasPolicy: boolean;
  menuRotationWeeks: number;
  menuRotationAdequate: boolean;
  dietaryNeedsDocumented: boolean;
  allergyProtocolInPlace: boolean;
  mealTimeSupervised: boolean;
  nutritionTrainingProvided: boolean;
  culturalDietaryAccommodation: boolean;
  snackAvailability: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffReadiness {
  totalStaff: number;
  foodHygieneRate: number;
  dietaryRequirementsRate: number;
  allergyAwarenessRate: number;
  mealPreparationRate: number;
  nutritionGuidanceRate: number;
  hydrationMonitoringRate: number;
  overallTrainedRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildProfile {
  childId: string;
  childName: string;
  totalMeals: number;
  averageNutritionScore: number;
  portionFullMostRate: number;
  satisfactionRate: number;
  dietaryRequirementsMetRate: number;
  hydrationRecords: number;
  averageHydrationCups: number;
  hydrationTargetMetRate: number;
  overallScore: number;
}

interface NutritionHydrationData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  mealQuality: MealQuality;
  hydrationStandards: HydrationStandards;
  nutritionPolicy: NutritionPolicyData;
  staffNutritionReadiness: StaffReadiness;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    mealSummary: { id: string; date: string; child: string; type: string; quality: string; portion: string }[];
    ratingLabel: string;
  };
}

// ── ScoreBar ──────────────────────────────────────────────────────────────

function ScoreBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColor =
    pctVal >= 80
      ? "bg-green-500"
      : pctVal >= 60
        ? "bg-blue-500"
        : pctVal >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium text-gray-700">
            {value}/{max}
          </span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

// ── Section (collapsible) ─────────────────────────────────────────────────

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="text-xs text-gray-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

// ── Stat ──────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  suffix = "",
  color = "text-gray-700",
  bg = "bg-gray-50",
}: {
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <div className={`rounded-lg p-2.5 text-center ${bg}`}>
      <div className={`text-xl font-bold ${color}`}>
        {value}
        {suffix}
      </div>
      <div className="text-[10px] font-medium text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ── Rating Badge ──────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const label =
    rating === "outstanding"
      ? "Outstanding"
      : rating === "good"
        ? "Good"
        : rating === "requires_improvement"
          ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Layer Score Card ──────────────────────────────────────────────────────

function LayerScoreCard({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const pctVal = Math.round((score / max) * 100);
  const color =
    pctVal >= 80
      ? "text-green-700 bg-green-50 border-green-200"
      : pctVal >= 60
        ? "text-blue-700 bg-blue-50 border-blue-200"
        : pctVal >= 40
          ? "text-orange-700 bg-orange-50 border-orange-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">
        {score}
        <span className="text-sm font-normal">/{max}</span>
      </div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Compliance Gauge ──────────────────────────────────────────────────────

function ComplianceGauge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90
      ? "text-green-700 bg-green-100"
      : value >= 70
        ? "text-yellow-700 bg-yellow-100"
        : "text-red-700 bg-red-100";

  return (
    <div className={`rounded-lg p-2.5 text-center ${color}`}>
      <div className="text-xl font-bold">{value}%</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Boolean Indicator ─────────────────────────────────────────────────────

function BoolIndicator({ label, value }: { label: string; value: boolean }) {
  return (
    <div
      className={`rounded-lg p-2 text-center ${
        value ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      <div className="text-lg font-bold">{value ? "Yes" : "No"}</div>
      <div className="text-[10px] font-medium text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ── Child Profile Row ─────────────────────────────────────────────────────

function ChildProfileRow({ profile }: { profile: ChildProfile }) {
  const scoreColor =
    profile.overallScore >= 8
      ? "bg-green-100 text-green-700"
      : profile.overallScore >= 5
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{profile.childName}</span>
          {profile.hydrationTargetMetRate < 50 && profile.hydrationRecords > 0 && (
            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
              Low hydration
            </span>
          )}
          {profile.satisfactionRate < 50 && profile.totalMeals > 0 && (
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
              Low satisfaction
            </span>
          )}
        </div>
        <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
          <span>{profile.totalMeals} meals</span>
          <span>{profile.hydrationRecords} hydration records</span>
          {profile.averageHydrationCups > 0 && (
            <span>{profile.averageHydrationCups} avg cups</span>
          )}
        </div>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}
      >
        {profile.overallScore}/10
      </span>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────

export function NutritionHydrationMonitoringDashboardWidget() {
  const [data, setData] = useState<NutritionHydrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "meals" | "hydration" | "policy" | "staff" | "children"
  >("meals");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/nutrition-hydration-monitoring");
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
        <div className="h-20 bg-gray-100 rounded mb-3" />
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
        <div className="h-10 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">
          Nutrition & Hydration Monitoring
        </h3>
        <p className="text-sm text-red-600 mt-1">
          {error ?? "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Nutrition & Hydration Monitoring
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} |{" "}
            {data.mealQuality.totalMeals} meals |{" "}
            {data.hydrationStandards.totalRecords} hydration records |{" "}
            {data.staffNutritionReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Layer Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <LayerScoreCard
          label="Meal Quality"
          score={data.mealQuality.score}
          max={25}
        />
        <LayerScoreCard
          label="Hydration"
          score={data.hydrationStandards.score}
          max={25}
        />
        <LayerScoreCard
          label="Policy"
          score={data.nutritionPolicy.score}
          max={25}
        />
        <LayerScoreCard
          label="Staff Readiness"
          score={data.staffNutritionReadiness.score}
          max={25}
        />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <ComplianceGauge
          label="Nutrition Quality"
          value={data.mealQuality.nutritionQualityGoodPlusRate}
        />
        <ComplianceGauge
          label="Portions Eaten"
          value={data.mealQuality.portionConsumedFullMostRate}
        />
        <ComplianceGauge
          label="Dietary Met"
          value={data.mealQuality.dietaryRequirementsMetRate}
        />
        <ComplianceGauge
          label="Hydration Target"
          value={data.hydrationStandards.targetMetRate}
        />
        <ComplianceGauge
          label="Food Hygiene"
          value={data.staffNutritionReadiness.foodHygieneRate}
        />
        <ComplianceGauge
          label="Staff Trained"
          value={data.staffNutritionReadiness.overallTrainedRate}
        />
      </div>

      {/* Urgent Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">
              Urgent Actions
            </h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 4).map((action, i) => (
                <li
                  key={i}
                  className="text-xs text-red-700 flex items-start gap-1.5"
                >
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT")
                      ? "●"
                      : action.startsWith("HIGH")
                        ? "○"
                        : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable Detail Tabs */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed breakdown"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-gray-200">
            {(
              [
                ["meals", "Meals"],
                ["hydration", "Hydration"],
                ["policy", "Policy"],
                ["staff", "Staff"],
                ["children", "Children"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === key
                    ? "bg-white border border-b-white border-gray-200 text-gray-900 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Meals Tab */}
          {activeTab === "meals" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge
                  label="Quality Good+"
                  value={data.mealQuality.nutritionQualityGoodPlusRate}
                />
                <ComplianceGauge
                  label="Portions Full/Most"
                  value={data.mealQuality.portionConsumedFullMostRate}
                />
                <ComplianceGauge
                  label="Dietary Met"
                  value={data.mealQuality.dietaryRequirementsMetRate}
                />
                <ComplianceGauge
                  label="Satisfied"
                  value={data.mealQuality.childSatisfiedRate}
                />
              </div>
              <ScoreBar
                value={data.mealQuality.score}
                max={25}
                label="Meal Quality Score"
              />
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat
                  label="Total Meals"
                  value={data.mealQuality.totalMeals}
                />
                <Stat
                  label="Breakfast"
                  value={data.mealQuality.mealTypeBreakdown?.breakfast ?? 0}
                  bg="bg-blue-50"
                  color="text-blue-700"
                />
                <Stat
                  label="Dinner"
                  value={data.mealQuality.mealTypeBreakdown?.dinner ?? 0}
                  bg="bg-blue-50"
                  color="text-blue-700"
                />
              </div>
              {data.mealQuality.qualityBreakdown?.concern > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <span className="text-xs text-red-700 font-medium">
                    {data.mealQuality.qualityBreakdown.concern} meal(s) flagged
                    as concern
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Hydration Tab */}
          {activeTab === "hydration" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge
                  label="Good+ Level"
                  value={data.hydrationStandards.hydrationGoodPlusRate}
                />
                <ComplianceGauge
                  label="Target Met"
                  value={data.hydrationStandards.targetMetRate}
                />
                <ComplianceGauge
                  label="Encouragement"
                  value={data.hydrationStandards.encouragementGivenRate}
                />
                <ComplianceGauge
                  label="Cups vs Target"
                  value={data.hydrationStandards.averageCupsVsTargetRate}
                />
              </div>
              <ScoreBar
                value={data.hydrationStandards.score}
                max={25}
                label="Hydration Score"
              />
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat
                  label="Total Records"
                  value={data.hydrationStandards.totalRecords}
                />
                <Stat
                  label="Avg Cups"
                  value={data.hydrationStandards.averageCupsConsumed}
                  bg="bg-blue-50"
                  color="text-blue-700"
                />
                <Stat
                  label="Avg Target"
                  value={data.hydrationStandards.averageTargetCups}
                  bg="bg-blue-50"
                  color="text-blue-700"
                />
              </div>
              {data.hydrationStandards.hydrationBreakdown?.poor > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <span className="text-xs text-red-700 font-medium">
                    {data.hydrationStandards.hydrationBreakdown.poor} record(s)
                    with poor hydration
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Policy Tab */}
          {activeTab === "policy" && (
            <div className="space-y-3">
              <ScoreBar
                value={data.nutritionPolicy.score}
                max={25}
                label="Policy Score"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <BoolIndicator
                  label="Dietary Documented"
                  value={data.nutritionPolicy.dietaryNeedsDocumented}
                />
                <BoolIndicator
                  label="Allergy Protocol"
                  value={data.nutritionPolicy.allergyProtocolInPlace}
                />
                <BoolIndicator
                  label="Meals Supervised"
                  value={data.nutritionPolicy.mealTimeSupervised}
                />
                <BoolIndicator
                  label="Cultural Dietary"
                  value={data.nutritionPolicy.culturalDietaryAccommodation}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <BoolIndicator
                  label="Nutrition Training"
                  value={data.nutritionPolicy.nutritionTrainingProvided}
                />
                <BoolIndicator
                  label="Snacks Available"
                  value={data.nutritionPolicy.snackAvailability}
                />
                <div
                  className={`rounded-lg p-2 text-center ${
                    data.nutritionPolicy.menuRotationAdequate
                      ? "bg-green-50 text-green-700"
                      : "bg-orange-50 text-orange-700"
                  }`}
                >
                  <div className="text-lg font-bold">
                    {data.nutritionPolicy.menuRotationWeeks}w
                  </div>
                  <div className="text-[10px] font-medium text-gray-500 mt-0.5">
                    Menu Rotation
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === "staff" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <ComplianceGauge
                  label="Food Hygiene"
                  value={data.staffNutritionReadiness.foodHygieneRate}
                />
                <ComplianceGauge
                  label="Dietary Req"
                  value={data.staffNutritionReadiness.dietaryRequirementsRate}
                />
                <ComplianceGauge
                  label="Allergy Aware"
                  value={data.staffNutritionReadiness.allergyAwarenessRate}
                />
                <ComplianceGauge
                  label="Meal Prep"
                  value={data.staffNutritionReadiness.mealPreparationRate}
                />
                <ComplianceGauge
                  label="Nutrition Guide"
                  value={data.staffNutritionReadiness.nutritionGuidanceRate}
                />
                <ComplianceGauge
                  label="Hydration Mon"
                  value={data.staffNutritionReadiness.hydrationMonitoringRate}
                />
              </div>
              <ScoreBar
                value={data.staffNutritionReadiness.score}
                max={25}
                label="Staff Readiness Score"
              />
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat
                  label="Total Staff"
                  value={data.staffNutritionReadiness.totalStaff}
                />
                <Stat
                  label="Fully Trained"
                  value={data.staffNutritionReadiness.overallTrainedRate + "%"}
                  bg={
                    data.staffNutritionReadiness.overallTrainedRate >= 80
                      ? "bg-green-50"
                      : "bg-orange-50"
                  }
                  color={
                    data.staffNutritionReadiness.overallTrainedRate >= 80
                      ? "text-green-700"
                      : "text-orange-700"
                  }
                />
              </div>
            </div>
          )}

          {/* Children Tab */}
          {activeTab === "children" && (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.childProfiles.length > 0 ? (
                data.childProfiles.map((profile) => (
                  <ChildProfileRow key={profile.childId} profile={profile} />
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">
                  No child profiles available
                </p>
              )}
            </div>
          )}

          {/* Strengths */}
          <Section title="Strengths" defaultOpen={false}>
            {data.strengths.length > 0 ? (
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">
                    + {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No strengths identified</p>
            )}
          </Section>

          {/* Areas for Improvement */}
          <Section title="Areas for Improvement" defaultOpen={false}>
            {data.areasForImprovement.length > 0 ? (
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="text-xs text-orange-700">
                    - {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No areas for improvement</p>
            )}
          </Section>

          {/* Regulatory Links */}
          <Section title="Regulatory References" defaultOpen={false}>
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">
                  {link}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}
