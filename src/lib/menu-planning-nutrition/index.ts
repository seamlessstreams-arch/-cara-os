// ══════════════════════════════════════════════════════════════════════════════
// Cara Menu Planning & Nutrition Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateMenuQuality,
  evaluateChildSatisfaction,
  evaluateChildInvolvement,
  evaluateNutritionCompliance,
  buildChildNutritionProfiles,
  generateMenuPlanningNutritionIntelligence,
  getRating,
  getMealTypeLabel,
  getNutritionalBalanceLabel,
  getCulturalAccommodationLabel,
  getMenuVarietyLabel,
  getChildParticipationLabel,
  getRatingLabel,
} from "./menu-planning-nutrition-engine";

export type {
  MealType,
  NutritionalBalance,
  CulturalAccommodation,
  MenuVariety,
  ChildParticipation,
  Rating,
  WeeklyMenu,
  MealFeedback,
  ChildParticipationRecord,
  NutritionAudit,
  MenuQualityResult,
  ChildSatisfactionResult,
  ChildInvolvementResult,
  NutritionComplianceResult,
  ChildNutritionProfile,
  MenuPlanningNutritionIntelligence,
} from "./menu-planning-nutrition-engine";
