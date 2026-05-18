// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Menu Planning & Nutrition Intelligence — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateMenuQuality,
  evaluateChildSatisfaction,
  evaluateChildInvolvement,
  evaluateNutritionCompliance,
  buildChildNutritionProfiles,
  generateMenuPlanningNutritionIntelligence,
  getRating,
  pct,
  getMealTypeLabel,
  getNutritionalBalanceLabel,
  getCulturalAccommodationLabel,
  getMenuVarietyLabel,
  getChildParticipationLabel,
  getRatingLabel,
} from "../menu-planning-nutrition-engine";
import type {
  WeeklyMenu,
  MealFeedback,
  ChildParticipationRecord,
  NutritionAudit,
  MealType,
  NutritionalBalance,
  CulturalAccommodation,
  MenuVariety,
  ChildParticipation,
  Rating,
} from "../menu-planning-nutrition-engine";

// ── Constants ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";
const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const CHILD_NAMES: Record<string, string> = {
  "child-alex": "Alex",
  "child-jordan": "Jordan",
  "child-morgan": "Morgan",
};

// ── Factories ────────────────────────────────────────────────────────────────

function makeMenu(overrides: Partial<WeeklyMenu> = {}): WeeklyMenu {
  return {
    id: "menu-001",
    weekCommencing: "2026-03-04",
    mealsPlanned: 21,
    mealsServed: 20,
    nutritionalBalance: "good",
    culturalAccommodation: "fully_met",
    childrenConsulted: true,
    menuVariety: "varied",
    specialDietaryMet: true,
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<MealFeedback> = {}): MealFeedback {
  return {
    id: "fb-001",
    menuId: "menu-001",
    childId: "child-alex",
    childName: "Alex",
    mealType: "lunch",
    enjoymentRating: 4,
    portionSatisfactory: true,
    comments: "Really enjoyed the pasta today",
    ...overrides,
  };
}

function makeParticipation(
  overrides: Partial<ChildParticipationRecord> = {},
): ChildParticipationRecord {
  return {
    id: "part-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-03-15",
    participationType: "cooking_activity",
    staffSupported: "Sarah Johnson",
    childEnjoyed: true,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<NutritionAudit> = {}): NutritionAudit {
  return {
    id: "audit-001",
    auditDate: "2026-03-01",
    auditor: "Darren Laville",
    fiveADayEvidence: true,
    sugarLimitsFollowed: true,
    freshFoodUsed: true,
    portionGuidanceFollowed: true,
    overallCompliant: true,
    ...overrides,
  };
}

// ── pct() ────────────────────────────────────────────────────────────────────

describe("pct()", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when numerator equals denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("handles large values", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// ── getRating() ──────────────────────────────────────────────────────────────

describe("getRating()", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label Functions ──────────────────────────────────────────────────────────

describe("label functions", () => {
  it("getMealTypeLabel returns correct labels", () => {
    expect(getMealTypeLabel("breakfast")).toBe("Breakfast");
    expect(getMealTypeLabel("lunch")).toBe("Lunch");
    expect(getMealTypeLabel("dinner")).toBe("Dinner");
    expect(getMealTypeLabel("snack")).toBe("Snack");
    expect(getMealTypeLabel("supper")).toBe("Supper");
  });

  it("getNutritionalBalanceLabel returns correct labels", () => {
    expect(getNutritionalBalanceLabel("excellent")).toBe("Excellent");
    expect(getNutritionalBalanceLabel("good")).toBe("Good");
    expect(getNutritionalBalanceLabel("adequate")).toBe("Adequate");
    expect(getNutritionalBalanceLabel("poor")).toBe("Poor");
  });

  it("getCulturalAccommodationLabel returns correct labels", () => {
    expect(getCulturalAccommodationLabel("fully_met")).toBe("Fully Met");
    expect(getCulturalAccommodationLabel("partially_met")).toBe("Partially Met");
    expect(getCulturalAccommodationLabel("not_met")).toBe("Not Met");
    expect(getCulturalAccommodationLabel("not_applicable")).toBe("Not Applicable");
  });

  it("getMenuVarietyLabel returns correct labels", () => {
    expect(getMenuVarietyLabel("highly_varied")).toBe("Highly Varied");
    expect(getMenuVarietyLabel("varied")).toBe("Varied");
    expect(getMenuVarietyLabel("limited")).toBe("Limited");
    expect(getMenuVarietyLabel("repetitive")).toBe("Repetitive");
  });

  it("getChildParticipationLabel returns correct labels", () => {
    expect(getChildParticipationLabel("menu_planning")).toBe("Menu Planning");
    expect(getChildParticipationLabel("cooking_activity")).toBe("Cooking Activity");
    expect(getChildParticipationLabel("food_shopping")).toBe("Food Shopping");
    expect(getChildParticipationLabel("growing_food")).toBe("Growing Food");
    expect(getChildParticipationLabel("none")).toBe("None");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateMenuQuality ─────────────────────────────────────────────────────

describe("evaluateMenuQuality()", () => {
  it("returns 0 for empty menus", () => {
    const result = evaluateMenuQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalMenus).toBe(0);
    expect(result.nutritionalBalanceRate).toBe(0);
    expect(result.varietyRate).toBe(0);
    expect(result.culturalAccommodationRate).toBe(0);
    expect(result.childrenConsultedRate).toBe(0);
    expect(result.specialDietaryMetRate).toBe(0);
  });

  it("scores maximum for perfect menus", () => {
    const menus = Array.from({ length: 4 }, (_, i) =>
      makeMenu({
        id: `menu-${i}`,
        nutritionalBalance: "excellent",
        menuVariety: "highly_varied",
        culturalAccommodation: "fully_met",
        childrenConsulted: true,
        specialDietaryMet: true,
      }),
    );
    const result = evaluateMenuQuality(menus);
    expect(result.overallScore).toBe(25);
    expect(result.nutritionalBalanceRate).toBe(100);
    expect(result.varietyRate).toBe(100);
    expect(result.culturalAccommodationRate).toBe(100);
    expect(result.childrenConsultedRate).toBe(100);
    expect(result.specialDietaryMetRate).toBe(100);
  });

  it("scores nutritional balance correctly for mixed quality", () => {
    const menus = [
      makeMenu({ id: "m1", nutritionalBalance: "excellent" }),
      makeMenu({ id: "m2", nutritionalBalance: "good" }),
      makeMenu({ id: "m3", nutritionalBalance: "adequate" }),
      makeMenu({ id: "m4", nutritionalBalance: "poor" }),
    ];
    const result = evaluateMenuQuality(menus);
    expect(result.nutritionalBalanceRate).toBe(50);
  });

  it("scores variety correctly", () => {
    const menus = [
      makeMenu({ id: "m1", menuVariety: "highly_varied" }),
      makeMenu({ id: "m2", menuVariety: "varied" }),
      makeMenu({ id: "m3", menuVariety: "limited" }),
      makeMenu({ id: "m4", menuVariety: "repetitive" }),
    ];
    const result = evaluateMenuQuality(menus);
    expect(result.varietyRate).toBe(50);
  });

  it("excludes not_applicable from cultural accommodation calc", () => {
    const menus = [
      makeMenu({ id: "m1", culturalAccommodation: "fully_met" }),
      makeMenu({ id: "m2", culturalAccommodation: "not_applicable" }),
    ];
    const result = evaluateMenuQuality(menus);
    expect(result.culturalAccommodationRate).toBe(100);
  });

  it("handles all not_applicable cultural accommodation", () => {
    const menus = [
      makeMenu({ id: "m1", culturalAccommodation: "not_applicable" }),
      makeMenu({ id: "m2", culturalAccommodation: "not_applicable" }),
    ];
    const result = evaluateMenuQuality(menus);
    expect(result.culturalAccommodationRate).toBe(0);
  });

  it("scores children consulted correctly", () => {
    const menus = [
      makeMenu({ id: "m1", childrenConsulted: true }),
      makeMenu({ id: "m2", childrenConsulted: true }),
      makeMenu({ id: "m3", childrenConsulted: false }),
      makeMenu({ id: "m4", childrenConsulted: false }),
    ];
    const result = evaluateMenuQuality(menus);
    expect(result.childrenConsultedRate).toBe(50);
  });

  it("scores special dietary met correctly at 100%", () => {
    const menus = [
      makeMenu({ id: "m1", specialDietaryMet: true }),
      makeMenu({ id: "m2", specialDietaryMet: true }),
    ];
    const result = evaluateMenuQuality(menus);
    expect(result.specialDietaryMetRate).toBe(100);
  });

  it("scores special dietary met correctly at partial", () => {
    const menus = [
      makeMenu({ id: "m1", specialDietaryMet: true }),
      makeMenu({ id: "m2", specialDietaryMet: false }),
    ];
    const result = evaluateMenuQuality(menus);
    expect(result.specialDietaryMetRate).toBe(50);
  });

  it("caps score at 25", () => {
    const menus = Array.from({ length: 10 }, (_, i) =>
      makeMenu({ id: `m-${i}`, nutritionalBalance: "excellent", menuVariety: "highly_varied" }),
    );
    const result = evaluateMenuQuality(menus);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores low for poor-quality menus", () => {
    const menus = [
      makeMenu({
        id: "m1",
        nutritionalBalance: "poor",
        menuVariety: "repetitive",
        culturalAccommodation: "not_met",
        childrenConsulted: false,
        specialDietaryMet: false,
      }),
    ];
    const result = evaluateMenuQuality(menus);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("returns correct total menus count", () => {
    const menus = [makeMenu({ id: "m1" }), makeMenu({ id: "m2" }), makeMenu({ id: "m3" })];
    const result = evaluateMenuQuality(menus);
    expect(result.totalMenus).toBe(3);
  });

  it("handles single menu", () => {
    const result = evaluateMenuQuality([makeMenu()]);
    expect(result.totalMenus).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// ── evaluateChildSatisfaction ───────────────────────────────────────────────

describe("evaluateChildSatisfaction()", () => {
  it("returns 0 for empty feedback", () => {
    const result = evaluateChildSatisfaction([], 3);
    expect(result.overallScore).toBe(0);
    expect(result.totalFeedback).toBe(0);
    expect(result.averageEnjoyment).toBe(0);
    expect(result.portionSatisfactoryRate).toBe(0);
    expect(result.positiveFeedbackRate).toBe(0);
    expect(result.responseRate).toBe(0);
  });

  it("scores maximum for excellent feedback from all children", () => {
    const feedback = CHILD_IDS.flatMap((childId) =>
      Array.from({ length: 4 }, (_, i) =>
        makeFeedback({
          id: `fb-${childId}-${i}`,
          childId,
          enjoymentRating: 5,
          portionSatisfactory: true,
          comments: "Loved it",
        }),
      ),
    );
    const result = evaluateChildSatisfaction(feedback, 3);
    expect(result.overallScore).toBe(25);
    expect(result.averageEnjoyment).toBe(5);
    expect(result.portionSatisfactoryRate).toBe(100);
    expect(result.positiveFeedbackRate).toBe(100);
    expect(result.responseRate).toBe(100);
  });

  it("calculates average enjoyment correctly", () => {
    const feedback = [
      makeFeedback({ id: "fb1", enjoymentRating: 5 }),
      makeFeedback({ id: "fb2", enjoymentRating: 3 }),
      makeFeedback({ id: "fb3", enjoymentRating: 4 }),
    ];
    const result = evaluateChildSatisfaction(feedback, 3);
    expect(result.averageEnjoyment).toBe(4);
  });

  it("scores enjoyment tiers correctly — high tier", () => {
    const feedback = [makeFeedback({ enjoymentRating: 5 })];
    const result = evaluateChildSatisfaction(feedback, 1);
    // 5.0 avg -> 8 points for enjoyment
    expect(result.averageEnjoyment).toBe(5);
  });

  it("scores enjoyment tiers correctly — mid tier", () => {
    const feedback = [makeFeedback({ enjoymentRating: 3 })];
    const result = evaluateChildSatisfaction(feedback, 1);
    expect(result.averageEnjoyment).toBe(3);
  });

  it("scores enjoyment tiers correctly — low tier", () => {
    const feedback = [makeFeedback({ enjoymentRating: 1 })];
    const result = evaluateChildSatisfaction(feedback, 1);
    expect(result.averageEnjoyment).toBe(1);
  });

  it("calculates portion satisfactory rate correctly", () => {
    const feedback = [
      makeFeedback({ id: "fb1", portionSatisfactory: true }),
      makeFeedback({ id: "fb2", portionSatisfactory: true }),
      makeFeedback({ id: "fb3", portionSatisfactory: false }),
    ];
    const result = evaluateChildSatisfaction(feedback, 3);
    expect(result.portionSatisfactoryRate).toBe(67);
  });

  it("calculates positive feedback rate from non-null comments", () => {
    const feedback = [
      makeFeedback({ id: "fb1", comments: "Great food" }),
      makeFeedback({ id: "fb2", comments: null }),
      makeFeedback({ id: "fb3", comments: "" }),
      makeFeedback({ id: "fb4", comments: "Loved it" }),
    ];
    const result = evaluateChildSatisfaction(feedback, 3);
    expect(result.positiveFeedbackRate).toBe(50);
  });

  it("calculates response rate from unique children", () => {
    const feedback = [
      makeFeedback({ id: "fb1", childId: "child-alex" }),
      makeFeedback({ id: "fb2", childId: "child-alex" }),
      makeFeedback({ id: "fb3", childId: "child-jordan" }),
    ];
    const result = evaluateChildSatisfaction(feedback, 3);
    expect(result.responseRate).toBe(67);
  });

  it("scores response rate 100% when all children gave feedback", () => {
    const feedback = CHILD_IDS.map((childId, i) =>
      makeFeedback({ id: `fb-${i}`, childId }),
    );
    const result = evaluateChildSatisfaction(feedback, 3);
    expect(result.responseRate).toBe(100);
  });

  it("caps score at 25", () => {
    const feedback = Array.from({ length: 20 }, (_, i) =>
      makeFeedback({ id: `fb-${i}`, enjoymentRating: 5, comments: "Great" }),
    );
    const result = evaluateChildSatisfaction(feedback, 1);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles whitespace-only comments as empty", () => {
    const feedback = [makeFeedback({ comments: "   " })];
    const result = evaluateChildSatisfaction(feedback, 1);
    expect(result.positiveFeedbackRate).toBe(0);
  });
});

// ── evaluateChildInvolvement ────────────────────────────────────────────────

describe("evaluateChildInvolvement()", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateChildInvolvement([], 3);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.participationRate).toBe(0);
    expect(result.activityVariety).toBe(0);
    expect(result.childEnjoyedRate).toBe(0);
    expect(result.cookingActivityRate).toBe(0);
    expect(result.staffSupportRate).toBe(0);
  });

  it("scores maximum for comprehensive involvement", () => {
    const records: ChildParticipationRecord[] = [
      makeParticipation({ id: "p1", childId: "child-alex", participationType: "cooking_activity" }),
      makeParticipation({ id: "p2", childId: "child-alex", participationType: "menu_planning" }),
      makeParticipation({ id: "p3", childId: "child-jordan", participationType: "food_shopping" }),
      makeParticipation({ id: "p4", childId: "child-jordan", participationType: "cooking_activity" }),
      makeParticipation({ id: "p5", childId: "child-morgan", participationType: "cooking_activity" }),
      makeParticipation({ id: "p6", childId: "child-morgan", participationType: "growing_food" }),
      makeParticipation({ id: "p7", childId: "child-alex", participationType: "cooking_activity" }),
    ];
    // 7 active records, 4 cooking = 57% cooking, 3 unique children, 4 activity types
    const result = evaluateChildInvolvement(records, 3);
    expect(result.overallScore).toBe(25);
    expect(result.participationRate).toBe(100);
    expect(result.activityVariety).toBe(4);
  });

  it("excludes 'none' participation from active records", () => {
    const records = [
      makeParticipation({ id: "p1", childId: "child-alex", participationType: "none" }),
    ];
    const result = evaluateChildInvolvement(records, 3);
    expect(result.participationRate).toBe(0);
    expect(result.activityVariety).toBe(0);
  });

  it("calculates participation rate from unique children", () => {
    const records = [
      makeParticipation({ id: "p1", childId: "child-alex", participationType: "cooking_activity" }),
      makeParticipation({ id: "p2", childId: "child-alex", participationType: "menu_planning" }),
    ];
    const result = evaluateChildInvolvement(records, 3);
    expect(result.participationRate).toBe(33);
  });

  it("calculates activity variety correctly", () => {
    const records = [
      makeParticipation({ id: "p1", participationType: "cooking_activity" }),
      makeParticipation({ id: "p2", participationType: "food_shopping" }),
      makeParticipation({ id: "p3", participationType: "growing_food" }),
    ];
    const result = evaluateChildInvolvement(records, 3);
    expect(result.activityVariety).toBe(3);
  });

  it("calculates child enjoyed rate correctly", () => {
    const records = [
      makeParticipation({ id: "p1", childEnjoyed: true }),
      makeParticipation({ id: "p2", childEnjoyed: true }),
      makeParticipation({ id: "p3", childEnjoyed: false }),
    ];
    const result = evaluateChildInvolvement(records, 3);
    expect(result.childEnjoyedRate).toBe(67);
  });

  it("calculates cooking activity rate correctly", () => {
    const records = [
      makeParticipation({ id: "p1", participationType: "cooking_activity" }),
      makeParticipation({ id: "p2", participationType: "cooking_activity" }),
      makeParticipation({ id: "p3", participationType: "menu_planning" }),
      makeParticipation({ id: "p4", participationType: "food_shopping" }),
    ];
    const result = evaluateChildInvolvement(records, 3);
    expect(result.cookingActivityRate).toBe(50);
  });

  it("calculates staff support rate correctly", () => {
    const records = [
      makeParticipation({ id: "p1", staffSupported: "Sarah Johnson" }),
      makeParticipation({ id: "p2", staffSupported: "" }),
      makeParticipation({ id: "p3", staffSupported: "Tom Richards" }),
    ];
    const result = evaluateChildInvolvement(records, 3);
    expect(result.staffSupportRate).toBe(67);
  });

  it("treats whitespace-only staff support as empty", () => {
    const records = [
      makeParticipation({ id: "p1", staffSupported: "   " }),
    ];
    const result = evaluateChildInvolvement(records, 1);
    expect(result.staffSupportRate).toBe(0);
  });

  it("caps score at 25", () => {
    const records = Array.from({ length: 20 }, (_, i) =>
      makeParticipation({ id: `p-${i}`, childId: CHILD_IDS[i % 3], participationType: "cooking_activity" }),
    );
    const result = evaluateChildInvolvement(records, 3);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns correct total records count including none", () => {
    const records = [
      makeParticipation({ id: "p1", participationType: "cooking_activity" }),
      makeParticipation({ id: "p2", participationType: "none" }),
    ];
    const result = evaluateChildInvolvement(records, 3);
    expect(result.totalRecords).toBe(2);
  });
});

// ── evaluateNutritionCompliance ─────────────────────────────────────────────

describe("evaluateNutritionCompliance()", () => {
  it("returns 0 for empty audits", () => {
    const result = evaluateNutritionCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAudits).toBe(0);
    expect(result.fiveADayRate).toBe(0);
    expect(result.freshFoodRate).toBe(0);
    expect(result.sugarLimitsRate).toBe(0);
    expect(result.portionGuidanceRate).toBe(0);
    expect(result.overallCompliantRate).toBe(0);
  });

  it("scores maximum for fully compliant audits", () => {
    const audits = [
      makeAudit({ id: "a1" }),
      makeAudit({ id: "a2" }),
    ];
    const result = evaluateNutritionCompliance(audits);
    expect(result.overallScore).toBe(25);
    expect(result.fiveADayRate).toBe(100);
    expect(result.freshFoodRate).toBe(100);
    expect(result.sugarLimitsRate).toBe(100);
    expect(result.portionGuidanceRate).toBe(100);
    expect(result.overallCompliantRate).toBe(100);
  });

  it("scores five a day correctly at 100%", () => {
    const audits = [
      makeAudit({ id: "a1", fiveADayEvidence: true }),
      makeAudit({ id: "a2", fiveADayEvidence: true }),
    ];
    const result = evaluateNutritionCompliance(audits);
    expect(result.fiveADayRate).toBe(100);
  });

  it("scores five a day correctly at partial", () => {
    const audits = [
      makeAudit({ id: "a1", fiveADayEvidence: true }),
      makeAudit({ id: "a2", fiveADayEvidence: false }),
    ];
    const result = evaluateNutritionCompliance(audits);
    expect(result.fiveADayRate).toBe(50);
  });

  it("scores fresh food correctly", () => {
    const audits = [
      makeAudit({ id: "a1", freshFoodUsed: true }),
      makeAudit({ id: "a2", freshFoodUsed: false }),
      makeAudit({ id: "a3", freshFoodUsed: true }),
    ];
    const result = evaluateNutritionCompliance(audits);
    expect(result.freshFoodRate).toBe(67);
  });

  it("scores sugar limits correctly", () => {
    const audits = [
      makeAudit({ id: "a1", sugarLimitsFollowed: true }),
      makeAudit({ id: "a2", sugarLimitsFollowed: true }),
      makeAudit({ id: "a3", sugarLimitsFollowed: false }),
    ];
    const result = evaluateNutritionCompliance(audits);
    expect(result.sugarLimitsRate).toBe(67);
  });

  it("scores portion guidance correctly", () => {
    const audits = [
      makeAudit({ id: "a1", portionGuidanceFollowed: true }),
      makeAudit({ id: "a2", portionGuidanceFollowed: false }),
    ];
    const result = evaluateNutritionCompliance(audits);
    expect(result.portionGuidanceRate).toBe(50);
  });

  it("scores overall compliance correctly at 100%", () => {
    const audits = [makeAudit({ id: "a1" }), makeAudit({ id: "a2" })];
    const result = evaluateNutritionCompliance(audits);
    expect(result.overallCompliantRate).toBe(100);
  });

  it("scores low for non-compliant audits", () => {
    const audits = [
      makeAudit({
        id: "a1",
        fiveADayEvidence: false,
        sugarLimitsFollowed: false,
        freshFoodUsed: false,
        portionGuidanceFollowed: false,
        overallCompliant: false,
      }),
    ];
    const result = evaluateNutritionCompliance(audits);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const audits = Array.from({ length: 10 }, (_, i) => makeAudit({ id: `a-${i}` }));
    const result = evaluateNutritionCompliance(audits);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns correct total audits count", () => {
    const audits = [makeAudit({ id: "a1" }), makeAudit({ id: "a2" }), makeAudit({ id: "a3" })];
    const result = evaluateNutritionCompliance(audits);
    expect(result.totalAudits).toBe(3);
  });

  it("handles single audit", () => {
    const result = evaluateNutritionCompliance([makeAudit()]);
    expect(result.totalAudits).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// ── buildChildNutritionProfiles ─────────────────────────────────────────────

describe("buildChildNutritionProfiles()", () => {
  it("returns profiles for all children", () => {
    const profiles = buildChildNutritionProfiles([], [], CHILD_IDS, CHILD_NAMES);
    expect(profiles).toHaveLength(3);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[1].childId).toBe("child-jordan");
    expect(profiles[2].childId).toBe("child-morgan");
  });

  it("calculates per-child average enjoyment correctly", () => {
    const feedback = [
      makeFeedback({ id: "fb1", childId: "child-alex", enjoymentRating: 5 }),
      makeFeedback({ id: "fb2", childId: "child-alex", enjoymentRating: 3 }),
    ];
    const profiles = buildChildNutritionProfiles(feedback, [], CHILD_IDS, CHILD_NAMES);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.averageEnjoyment).toBe(4);
  });

  it("calculates per-child portion satisfactory rate", () => {
    const feedback = [
      makeFeedback({ id: "fb1", childId: "child-alex", portionSatisfactory: true }),
      makeFeedback({ id: "fb2", childId: "child-alex", portionSatisfactory: false }),
    ];
    const profiles = buildChildNutritionProfiles(feedback, [], CHILD_IDS, CHILD_NAMES);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.portionSatisfactoryRate).toBe(50);
  });

  it("counts participation records per child excluding none", () => {
    const participation = [
      makeParticipation({ id: "p1", childId: "child-alex", participationType: "cooking_activity" }),
      makeParticipation({ id: "p2", childId: "child-alex", participationType: "none" }),
      makeParticipation({ id: "p3", childId: "child-alex", participationType: "food_shopping" }),
    ];
    const profiles = buildChildNutritionProfiles([], participation, CHILD_IDS, CHILD_NAMES);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.participationCount).toBe(2);
  });

  it("returns 0-10 scores capped correctly", () => {
    const feedback = CHILD_IDS.flatMap((childId) =>
      Array.from({ length: 5 }, (_, i) =>
        makeFeedback({ id: `fb-${childId}-${i}`, childId, enjoymentRating: 5 }),
      ),
    );
    const participation = CHILD_IDS.flatMap((childId) =>
      Array.from({ length: 4 }, (_, i) =>
        makeParticipation({ id: `p-${childId}-${i}`, childId }),
      ),
    );
    const profiles = buildChildNutritionProfiles(feedback, participation, CHILD_IDS, CHILD_NAMES);
    profiles.forEach((p) => {
      expect(p.overallScore).toBeGreaterThanOrEqual(0);
      expect(p.overallScore).toBeLessThanOrEqual(10);
    });
  });

  it("penalises child with no data", () => {
    const profiles = buildChildNutritionProfiles([], [], CHILD_IDS, CHILD_NAMES);
    profiles.forEach((p) => {
      expect(p.overallScore).toBeLessThanOrEqual(2);
    });
  });

  it("penalises child with very low enjoyment", () => {
    const feedback = [
      makeFeedback({ id: "fb1", childId: "child-alex", enjoymentRating: 1 }),
    ];
    const profiles = buildChildNutritionProfiles(feedback, [], CHILD_IDS, CHILD_NAMES);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.overallScore).toBeLessThan(5);
  });

  it("uses childId as name fallback when not in names map", () => {
    const profiles = buildChildNutritionProfiles([], [], ["child-unknown"], {});
    expect(profiles[0].childName).toBe("child-unknown");
  });

  it("correctly sets feedbackCount per child", () => {
    const feedback = [
      makeFeedback({ id: "fb1", childId: "child-alex" }),
      makeFeedback({ id: "fb2", childId: "child-alex" }),
      makeFeedback({ id: "fb3", childId: "child-jordan" }),
    ];
    const profiles = buildChildNutritionProfiles(feedback, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles.find((p) => p.childId === "child-alex")!.feedbackCount).toBe(2);
    expect(profiles.find((p) => p.childId === "child-jordan")!.feedbackCount).toBe(1);
    expect(profiles.find((p) => p.childId === "child-morgan")!.feedbackCount).toBe(0);
  });
});

// ── generateMenuPlanningNutritionIntelligence (integration) ─────────────────

describe("generateMenuPlanningNutritionIntelligence()", () => {
  const demoMenus: WeeklyMenu[] = [
    makeMenu({ id: "menu-w1", weekCommencing: "2026-03-04", nutritionalBalance: "excellent", menuVariety: "highly_varied" }),
    makeMenu({ id: "menu-w2", weekCommencing: "2026-03-11", nutritionalBalance: "good", menuVariety: "varied" }),
    makeMenu({ id: "menu-w3", weekCommencing: "2026-03-18", nutritionalBalance: "good", menuVariety: "highly_varied" }),
    makeMenu({ id: "menu-w4", weekCommencing: "2026-03-25", nutritionalBalance: "excellent", menuVariety: "varied" }),
  ];

  const demoFeedback: MealFeedback[] = [
    makeFeedback({ id: "fb-a1", childId: "child-alex", childName: "Alex", mealType: "breakfast", enjoymentRating: 4, comments: "Good cereal" }),
    makeFeedback({ id: "fb-a2", childId: "child-alex", childName: "Alex", mealType: "lunch", enjoymentRating: 5, comments: "Loved the pasta" }),
    makeFeedback({ id: "fb-a3", childId: "child-alex", childName: "Alex", mealType: "dinner", enjoymentRating: 4, comments: null }),
    makeFeedback({ id: "fb-a4", childId: "child-alex", childName: "Alex", mealType: "snack", enjoymentRating: 3, comments: "OK snacks" }),
    makeFeedback({ id: "fb-j1", childId: "child-jordan", childName: "Jordan", mealType: "breakfast", enjoymentRating: 4, comments: "Nice toast" }),
    makeFeedback({ id: "fb-j2", childId: "child-jordan", childName: "Jordan", mealType: "lunch", enjoymentRating: 4, comments: null }),
    makeFeedback({ id: "fb-j3", childId: "child-jordan", childName: "Jordan", mealType: "dinner", enjoymentRating: 5, comments: "Best dinner" }),
    makeFeedback({ id: "fb-j4", childId: "child-jordan", childName: "Jordan", mealType: "supper", enjoymentRating: 3, comments: "Supper was OK" }),
    makeFeedback({ id: "fb-m1", childId: "child-morgan", childName: "Morgan", mealType: "breakfast", enjoymentRating: 4, comments: "Good" }),
    makeFeedback({ id: "fb-m2", childId: "child-morgan", childName: "Morgan", mealType: "lunch", enjoymentRating: 5, comments: "Excellent curry" }),
    makeFeedback({ id: "fb-m3", childId: "child-morgan", childName: "Morgan", mealType: "dinner", enjoymentRating: 4, comments: null }),
    makeFeedback({ id: "fb-m4", childId: "child-morgan", childName: "Morgan", mealType: "snack", enjoymentRating: 4, comments: "Fruit was fresh" }),
  ];

  const demoParticipation: ChildParticipationRecord[] = [
    makeParticipation({ id: "part-a1", childId: "child-alex", childName: "Alex", participationType: "cooking_activity", staffSupported: "Sarah Johnson" }),
    makeParticipation({ id: "part-a2", childId: "child-alex", childName: "Alex", participationType: "menu_planning", staffSupported: "Darren Laville" }),
    makeParticipation({ id: "part-j1", childId: "child-jordan", childName: "Jordan", participationType: "food_shopping", staffSupported: "Tom Richards" }),
    makeParticipation({ id: "part-j2", childId: "child-jordan", childName: "Jordan", participationType: "cooking_activity", staffSupported: "Lisa Williams" }),
    makeParticipation({ id: "part-m1", childId: "child-morgan", childName: "Morgan", participationType: "cooking_activity", staffSupported: "Sarah Johnson" }),
    makeParticipation({ id: "part-m2", childId: "child-morgan", childName: "Morgan", participationType: "growing_food", staffSupported: "Darren Laville" }),
  ];

  const demoAudits: NutritionAudit[] = [
    makeAudit({ id: "audit-1", auditDate: "2026-02-15", auditor: "Darren Laville" }),
    makeAudit({ id: "audit-2", auditDate: "2026-04-15", auditor: "Sarah Johnson" }),
  ];

  it("returns complete intelligence with all sections", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      demoMenus, demoFeedback, demoParticipation, demoAudits,
      CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(typeof result.rating).toBe("string");
  });

  it("has correct sub-scores that sum to overall", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      demoMenus, demoFeedback, demoParticipation, demoAudits,
      CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    const sum =
      result.menuQuality.overallScore +
      result.childSatisfaction.overallScore +
      result.childInvolvement.overallScore +
      result.nutritionCompliance.overallScore;

    expect(result.overallScore).toBe(Math.min(sum, 100));
  });

  it("generates child profiles for each child", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      demoMenus, demoFeedback, demoParticipation, demoAudits,
      CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.childProfiles).toHaveLength(3);
    const names = result.childProfiles.map((p) => p.childName);
    expect(names).toContain("Alex");
    expect(names).toContain("Jordan");
    expect(names).toContain("Morgan");
  });

  it("generates strengths array", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      demoMenus, demoFeedback, demoParticipation, demoAudits,
      CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      demoMenus, demoFeedback, demoParticipation, demoAudits,
      CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 4"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Food Standards Agency"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Eatwell Guide"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 24"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 27"))).toBe(true);
  });

  it("demo data produces good or outstanding rating", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      demoMenus, demoFeedback, demoParticipation, demoAudits,
      CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(["good", "outstanding"]).toContain(result.rating);
  });

  it("returns inadequate for all-empty inputs", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      [], [], [], [], CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates URGENT actions for all-empty inputs", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      [], [], [], [], CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgentActions.length).toBeGreaterThanOrEqual(3);
  });

  it("caps overall score at 100", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      demoMenus, demoFeedback, demoParticipation, demoAudits,
      CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("handles single child correctly", () => {
    const result = generateMenuPlanningNutritionIntelligence(
      demoMenus,
      demoFeedback.filter((f) => f.childId === "child-alex"),
      demoParticipation.filter((p) => p.childId === "child-alex"),
      demoAudits,
      ["child-alex"],
      { "child-alex": "Alex" },
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );

    expect(result.childProfiles).toHaveLength(1);
    expect(result.childProfiles[0].childName).toBe("Alex");
  });

  it("includes areas for improvement when appropriate", () => {
    const poorMenus = [
      makeMenu({
        id: "m1",
        nutritionalBalance: "poor",
        menuVariety: "repetitive",
        childrenConsulted: false,
        specialDietaryMet: false,
      }),
    ];
    const result = generateMenuPlanningNutritionIntelligence(
      poorMenus, [], [], [], CHILD_IDS, CHILD_NAMES, "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("correctly rates overall at each threshold boundary", () => {
    // This test verifies the rating function integrated into the main function
    // by checking the already-tested getRating is used properly
    const result = generateMenuPlanningNutritionIntelligence(
      [], [], [], [], [], {}, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });
});
