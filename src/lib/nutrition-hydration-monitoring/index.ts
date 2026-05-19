// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Nutrition & Hydration Monitoring Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateMealQuality,
  evaluateHydrationStandards,
  evaluateNutritionPolicy,
  evaluateStaffNutritionReadiness,
  buildChildNutritionProfiles,
  generateNutritionHydrationMonitoringIntelligence,
  getMealTypeLabel,
  getDietaryRequirementLabel,
  getHydrationLevelLabel,
  getNutritionQualityLabel,
  getPortionConsumedLabel,
  getRatingLabel,
  getRating,
  pct,
} from "./nutrition-hydration-monitoring-engine";

export type {
  MealType,
  DietaryRequirement,
  HydrationLevel,
  NutritionQuality,
  PortionConsumed,
  Rating,
  MealRecord,
  HydrationRecord,
  NutritionPolicy,
  StaffNutritionTraining,
  MealQualityResult,
  HydrationStandardsResult,
  NutritionPolicyResult,
  StaffNutritionReadinessResult,
  ChildNutritionProfile,
  NutritionHydrationMonitoringIntelligence,
} from "./nutrition-hydration-monitoring-engine";
