import { describe, it, expect } from "vitest";
import {
  generateAllergenDietaryManagementIntelligence,
  evaluateAllergenDocumentation,
  evaluateMealSafety,
  evaluateIncidentResponse,
  evaluateStaffCompetence,
  buildChildAllergenSummaries,
  getRating,
  getAllergenTypeLabel,
  getDietaryRequirementLabel,
  getSeverityLevelLabel,
  getEmergencyPlanStatusLabel,
  getMealComplianceStatusLabel,
  getTrainingCompetenceLabel,
  getRatingLabel,
} from "../allergen-dietary-management-engine";
import type {
  ChildAllergenProfile,
  AllergenIncident,
  MealPlanRecord,
  StaffAllergenTraining,
} from "../allergen-dietary-management-engine";

// ── Helpers ───────────────────────────────────────────────────────────────

function mkProfile(overrides: Partial<ChildAllergenProfile> = {}): ChildAllergenProfile {
  return {
    id: "ap-1",
    childId: "child-1",
    childName: "Alex",
    allergens: ["nuts", "dairy"],
    severities: { nuts: "severe", dairy: "moderate" },
    dietaryRequirements: ["dairy_free"],
    emergencyPlanStatus: "current",
    epiPenAvailable: true,
    epiPenExpiryDate: "2027-01-01",
    gpNotified: true,
    socialWorkerNotified: true,
    lastReviewDate: "2026-03-01",
    reviewDue: "2026-09-01",
    ...overrides,
  };
}

function mkIncident(overrides: Partial<AllergenIncident> = {}): AllergenIncident {
  return {
    id: "ai-1",
    childId: "child-1",
    childName: "Alex",
    date: "2026-03-15",
    allergenInvolved: "nuts",
    severity: "moderate",
    crossContamination: false,
    staffResponseTimely: true,
    emergencyPlanFollowed: true,
    medicalAttentionRequired: false,
    hospitalVisit: false,
    rootCauseIdentified: true,
    preventiveMeasuresImplemented: true,
    ...overrides,
  };
}

function mkMeal(overrides: Partial<MealPlanRecord> = {}): MealPlanRecord {
  return {
    id: "mp-1",
    date: "2026-03-15",
    mealType: "lunch",
    allergenLabelled: true,
    dietaryRequirementsMet: true,
    crossContaminationPrevented: true,
    childConsulted: true,
    complianceStatus: "fully_compliant",
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffAllergenTraining> = {}): StaffAllergenTraining {
  return {
    id: "sat-1",
    staffId: "staff-1",
    staffName: "Staff A",
    allergenAwareness: true,
    epiPenTrained: true,
    epiPenExpiryDate: "2027-01-01",
    foodHygieneCertified: true,
    crossContaminationTrained: true,
    anaphylaxisTrained: true,
    competenceLevel: "fully_competent",
    ...overrides,
  };
}

// ── pct ───────────────────────────────────────────────────────────────────


// ── getRating ─────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("outstanding >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("good >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("requires_improvement >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("inadequate < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label functions ───────────────────────────────────────────────────────

describe("label functions", () => {
  it("allergen type labels", () => {
    expect(getAllergenTypeLabel("nuts")).toBe("Tree Nuts");
    expect(getAllergenTypeLabel("peanuts")).toBe("Peanuts");
    expect(getAllergenTypeLabel("sesame")).toBe("Sesame");
  });
  it("dietary requirement labels", () => {
    expect(getDietaryRequirementLabel("halal")).toBe("Halal");
    expect(getDietaryRequirementLabel("vegan")).toBe("Vegan");
    expect(getDietaryRequirementLabel("medical_diet")).toBe("Medical Diet");
  });
  it("severity labels", () => {
    expect(getSeverityLevelLabel("mild")).toBe("Mild");
    expect(getSeverityLevelLabel("life_threatening")).toBe("Life Threatening");
  });
  it("emergency plan status labels", () => {
    expect(getEmergencyPlanStatusLabel("current")).toBe("Current");
    expect(getEmergencyPlanStatusLabel("not_in_place")).toBe("Not In Place");
  });
  it("meal compliance labels", () => {
    expect(getMealComplianceStatusLabel("fully_compliant")).toBe("Fully Compliant");
    expect(getMealComplianceStatusLabel("non_compliant")).toBe("Non-Compliant");
  });
  it("training competence labels", () => {
    expect(getTrainingCompetenceLabel("fully_competent")).toBe("Fully Competent");
    expect(getTrainingCompetenceLabel("not_trained")).toBe("Not Trained");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateAllergenDocumentation ─────────────────────────────────────────

describe("evaluateAllergenDocumentation", () => {
  it("returns 0 for empty profiles", () => {
    const result = evaluateAllergenDocumentation([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalChildren).toBe(0);
  });

  it("scores high for fully documented profiles", () => {
    const profiles = [mkProfile(), mkProfile({ id: "ap-2", childId: "child-2", childName: "Jordan" })];
    const result = evaluateAllergenDocumentation(profiles);
    expect(result.overallScore).toBeGreaterThanOrEqual(18);
    expect(result.emergencyPlanCurrentRate).toBe(100);
    expect(result.gpNotifiedRate).toBe(100);
  });

  it("scores low for poorly documented profiles", () => {
    const profiles = [
      mkProfile({
        emergencyPlanStatus: "not_in_place",
        epiPenAvailable: false,
        gpNotified: false,
        socialWorkerNotified: false,
        lastReviewDate: "2025-01-01",
        reviewDue: "2025-06-01",
      }),
    ];
    const result = evaluateAllergenDocumentation(profiles);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("counts children with allergens", () => {
    const profiles = [
      mkProfile({ id: "ap-1", childId: "child-1", allergens: ["nuts"] }),
      mkProfile({ id: "ap-2", childId: "child-2", childName: "Jordan", allergens: [] }),
    ];
    const result = evaluateAllergenDocumentation(profiles);
    expect(result.childrenWithAllergens).toBe(1);
    expect(result.totalChildren).toBe(2);
  });

  it("counts life-threatening allergens", () => {
    const profiles = [
      mkProfile({ id: "ap-1", severities: { nuts: "life_threatening" } }),
      mkProfile({ id: "ap-2", childId: "child-2", childName: "Jordan", severities: { dairy: "moderate" } }),
    ];
    const result = evaluateAllergenDocumentation(profiles);
    expect(result.lifeThreatening).toBe(1);
  });

  it("tracks epiPen availability for severe/life-threatening only", () => {
    const profiles = [
      mkProfile({ id: "ap-1", severities: { nuts: "mild" }, epiPenAvailable: false }),
    ];
    const result = evaluateAllergenDocumentation(profiles);
    // Mild doesn't need EpiPen, so rate shouldn't penalise
    expect(result.epiPenAvailableRate).toBeNull(); // 0/0 = 0
  });

  it("handles profile with no allergens", () => {
    const profiles = [
      mkProfile({ allergens: [], severities: {} }),
    ];
    const result = evaluateAllergenDocumentation(profiles);
    expect(result.childrenWithAllergens).toBe(0);
  });

  it("score capped at 25", () => {
    const result = evaluateAllergenDocumentation([mkProfile()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateMealSafety ────────────────────────────────────────────────────

describe("evaluateMealSafety", () => {
  it("returns 0 for empty meals", () => {
    const result = evaluateMealSafety([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalMeals).toBe(0);
  });

  it("scores high for fully compliant meals", () => {
    const meals = [mkMeal(), mkMeal({ id: "mp-2" }), mkMeal({ id: "mp-3" })];
    const result = evaluateMealSafety(meals);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.allergenLabelledRate).toBe(100);
    expect(result.dietaryMetRate).toBe(100);
    expect(result.fullyCompliantRate).toBe(100);
  });

  it("scores low for non-compliant meals", () => {
    const meals = [
      mkMeal({
        allergenLabelled: false,
        dietaryRequirementsMet: false,
        crossContaminationPrevented: false,
        childConsulted: false,
        complianceStatus: "non_compliant",
      }),
    ];
    const result = evaluateMealSafety(meals);
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial compliance rates", () => {
    const meals = [
      mkMeal({ id: "mp-1", allergenLabelled: true }),
      mkMeal({ id: "mp-2", allergenLabelled: false }),
    ];
    const result = evaluateMealSafety(meals);
    expect(result.allergenLabelledRate).toBe(50);
  });

  it("tracks child consultation rate", () => {
    const meals = [
      mkMeal({ id: "mp-1", childConsulted: true }),
      mkMeal({ id: "mp-2", childConsulted: true }),
      mkMeal({ id: "mp-3", childConsulted: false }),
    ];
    const result = evaluateMealSafety(meals);
    expect(result.childConsultedRate).toBe(67);
  });

  it("score capped at 25", () => {
    const result = evaluateMealSafety([mkMeal()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateIncidentResponse ──────────────────────────────────────────────

describe("evaluateIncidentResponse", () => {
  it("returns 25 for empty incidents (no reactions = excellent)", () => {
    const result = evaluateIncidentResponse([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalIncidents).toBe(0);
  });

  it("scores high for well-managed incidents", () => {
    const incidents = [mkIncident()];
    const result = evaluateIncidentResponse(incidents);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.timelyResponseRate).toBe(100);
    expect(result.emergencyPlanFollowedRate).toBe(100);
  });

  it("scores low for poorly managed incidents", () => {
    const incidents = [
      mkIncident({
        staffResponseTimely: false,
        emergencyPlanFollowed: false,
        rootCauseIdentified: false,
        preventiveMeasuresImplemented: false,
      }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.overallScore).toBe(0);
  });

  it("counts hospital visits", () => {
    const incidents = [
      mkIncident({ id: "ai-1", hospitalVisit: true }),
      mkIncident({ id: "ai-2", hospitalVisit: false }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.hospitalVisitCount).toBe(1);
  });

  it("handles mixed incident quality", () => {
    const incidents = [
      mkIncident({ id: "ai-1" }),
      mkIncident({ id: "ai-2", staffResponseTimely: false, rootCauseIdentified: false }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.timelyResponseRate).toBe(50);
    expect(result.rootCauseIdentifiedRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("score capped at 25", () => {
    const result = evaluateIncidentResponse([mkIncident()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffCompetence ───────────────────────────────────────────────

describe("evaluateStaffCompetence", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffCompetence([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "sat-2", staffId: "staff-2", staffName: "Staff B" })];
    const result = evaluateStaffCompetence(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.allergenAwarenessRate).toBe(100);
    expect(result.epiPenTrainedRate).toBe(100);
    expect(result.fullyCompetentRate).toBe(100);
  });

  it("scores low for untrained staff", () => {
    const training = [
      mkTraining({
        allergenAwareness: false,
        epiPenTrained: false,
        foodHygieneCertified: false,
        crossContaminationTrained: false,
        anaphylaxisTrained: false,
        competenceLevel: "not_trained",
      }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial training rates", () => {
    const training = [
      mkTraining({ id: "sat-1", staffId: "s1" }),
      mkTraining({ id: "sat-2", staffId: "s2", allergenAwareness: false, epiPenTrained: false }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.allergenAwarenessRate).toBe(50);
    expect(result.epiPenTrainedRate).toBe(50);
  });

  it("tracks anaphylaxis training", () => {
    const training = [
      mkTraining({ id: "sat-1", staffId: "s1", anaphylaxisTrained: true }),
      mkTraining({ id: "sat-2", staffId: "s2", anaphylaxisTrained: false }),
      mkTraining({ id: "sat-3", staffId: "s3", anaphylaxisTrained: false }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.anaphylaxisTrainedRate).toBe(33);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffCompetence([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── buildChildAllergenSummaries ───────────────────────────────────────────

describe("buildChildAllergenSummaries", () => {
  it("returns empty for no profiles", () => {
    expect(buildChildAllergenSummaries([], [])).toEqual([]);
  });

  it("excludes children without allergens", () => {
    const profiles = [
      mkProfile({ id: "ap-1", childId: "child-1", allergens: ["nuts"] }),
      mkProfile({ id: "ap-2", childId: "child-2", childName: "Jordan", allergens: [] }),
    ];
    const summaries = buildChildAllergenSummaries(profiles, []);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].childId).toBe("child-1");
  });

  it("counts allergens per child", () => {
    const profiles = [mkProfile({ allergens: ["nuts", "dairy", "eggs"] })];
    const summaries = buildChildAllergenSummaries(profiles, []);
    expect(summaries[0].allergenCount).toBe(3);
  });

  it("detects life-threatening", () => {
    const profiles = [mkProfile({ severities: { nuts: "life_threatening" } })];
    const summaries = buildChildAllergenSummaries(profiles, []);
    expect(summaries[0].hasLifeThreatening).toBe(true);
  });

  it("counts incidents per child", () => {
    const profiles = [mkProfile()];
    const incidents = [
      mkIncident({ id: "ai-1", childId: "child-1" }),
      mkIncident({ id: "ai-2", childId: "child-1" }),
    ];
    const summaries = buildChildAllergenSummaries(profiles, incidents);
    expect(summaries[0].incidentCount).toBe(2);
  });

  it("gives higher score for well-managed child", () => {
    const good = [mkProfile({ emergencyPlanStatus: "current", gpNotified: true, socialWorkerNotified: true, epiPenAvailable: true })];
    const bad = [mkProfile({ id: "ap-2", childId: "child-2", childName: "Jordan", emergencyPlanStatus: "not_in_place", gpNotified: false, socialWorkerNotified: false, epiPenAvailable: false })];
    const goodSummary = buildChildAllergenSummaries(good, []);
    const badSummary = buildChildAllergenSummaries(bad, []);
    expect(goodSummary[0].overallScore).toBeGreaterThan(badSummary[0].overallScore);
  });

  it("score capped at 10", () => {
    const profiles = [mkProfile()];
    const summaries = buildChildAllergenSummaries(profiles, []);
    expect(summaries[0].overallScore).toBeLessThanOrEqual(10);
  });
});

// ── generateAllergenDietaryManagementIntelligence ─────────────────────────

describe("generateAllergenDietaryManagementIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateAllergenDietaryManagementIntelligence(
      [mkProfile()], [mkMeal()], [], [mkTraining()],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(
      result.allergenDocumentation.overallScore +
      result.mealSafety.overallScore +
      result.incidentResponse.overallScore +
      result.staffCompetence.overallScore,
    );
  });

  it("returns inadequate with no data", () => {
    const result = generateAllergenDietaryManagementIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    // doc=0, meal=0, incident=25 (no incidents), staff=0 = 25
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const profiles = [mkProfile(), mkProfile({ id: "ap-2", childId: "child-2", childName: "Jordan" })];
    const meals = Array.from({ length: 10 }, (_, i) => mkMeal({ id: `mp-${i}` }));
    const training = [mkTraining(), mkTraining({ id: "sat-2", staffId: "s2", staffName: "Staff B" })];
    const result = generateAllergenDietaryManagementIntelligence(
      profiles, meals, [], training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generateAllergenDietaryManagementIntelligence(
      [mkProfile()], [mkMeal()], [], [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateAllergenDietaryManagementIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  it("builds child summaries", () => {
    const profiles = [
      mkProfile({ id: "ap-1", childId: "child-1" }),
      mkProfile({ id: "ap-2", childId: "child-2", childName: "Jordan", allergens: ["dairy"] }),
    ];
    const result = generateAllergenDietaryManagementIntelligence(
      profiles, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childSummaries).toHaveLength(2);
  });

  // ── Strengths ──

  it("adds strength for current emergency plans", () => {
    const profiles = [mkProfile({ emergencyPlanStatus: "current" })];
    const result = generateAllergenDietaryManagementIntelligence(
      profiles, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("emergency plans"))).toBe(true);
  });

  it("adds strength for no incidents", () => {
    const profiles = [mkProfile()];
    const result = generateAllergenDietaryManagementIntelligence(
      profiles, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("No allergen incidents"))).toBe(true);
  });

  it("adds strength for 100% allergen labelling", () => {
    const meals = [mkMeal(), mkMeal({ id: "mp-2" })];
    const result = generateAllergenDietaryManagementIntelligence(
      [], meals, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("allergen labelling"))).toBe(true);
  });

  it("adds strength for all staff trained", () => {
    const training = [mkTraining()];
    const result = generateAllergenDietaryManagementIntelligence(
      [], [], [], training, "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("allergen awareness training"))).toBe(true);
  });

  // ── Areas for improvement ──

  it("adds area for no profiles", () => {
    const result = generateAllergenDietaryManagementIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No allergen profiles"))).toBe(true);
  });

  it("adds area for low labelling", () => {
    const meals = [mkMeal({ allergenLabelled: false }), mkMeal({ id: "mp-2", allergenLabelled: true })];
    const result = generateAllergenDietaryManagementIntelligence(
      [], meals, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Allergen labelling compliance"))).toBe(true);
  });

  it("adds area for no training", () => {
    const result = generateAllergenDietaryManagementIntelligence(
      [mkProfile()], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No staff allergen training"))).toBe(true);
  });

  // ── Actions ──

  it("adds URGENT for life-threatening without emergency plan", () => {
    const profiles = [
      mkProfile({ severities: { nuts: "life_threatening" }, emergencyPlanStatus: "not_in_place" }),
    ];
    const result = generateAllergenDietaryManagementIntelligence(
      profiles, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("life-threatening"))).toBe(true);
  });

  it("adds URGENT for life-threatening without EpiPen", () => {
    const profiles = [
      mkProfile({ severities: { nuts: "life_threatening" }, epiPenAvailable: false }),
    ];
    const result = generateAllergenDietaryManagementIntelligence(
      profiles, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("EpiPen"))).toBe(true);
  });

  it("adds URGENT for low anaphylaxis training", () => {
    const training = [
      mkTraining({ id: "sat-1", staffId: "s1", anaphylaxisTrained: false }),
      mkTraining({ id: "sat-2", staffId: "s2", anaphylaxisTrained: false }),
      mkTraining({ id: "sat-3", staffId: "s3", anaphylaxisTrained: false }),
      mkTraining({ id: "sat-4", staffId: "s4", anaphylaxisTrained: true }),
    ];
    const result = generateAllergenDietaryManagementIntelligence(
      [], [], [], training, "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("anaphylaxis"))).toBe(true);
  });

  it("adds action to create profiles when none exist", () => {
    const result = generateAllergenDietaryManagementIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("Create allergen profiles"))).toBe(true);
  });

  // ── Regulatory links ──

  it("includes all regulatory links", () => {
    const result = generateAllergenDietaryManagementIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Food Safety Act 1990"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Natasha's Law"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 24"))).toBe(true);
  });

  // ── Integration ──

  it("handles realistic mixed scenario", () => {
    const profiles = [
      mkProfile({ id: "ap-1", childId: "child-alex", childName: "Alex", allergens: ["nuts"], severities: { nuts: "severe" } }),
      mkProfile({ id: "ap-2", childId: "child-jordan", childName: "Jordan", allergens: ["dairy", "eggs"], severities: { dairy: "moderate", eggs: "mild" }, epiPenAvailable: null }),
      mkProfile({ id: "ap-3", childId: "child-morgan", childName: "Morgan", allergens: [], severities: {} }),
    ];
    const meals = Array.from({ length: 15 }, (_, i) => mkMeal({ id: `mp-${i}` }));
    const incidents: AllergenIncident[] = [];
    const training = [
      mkTraining({ id: "sat-1", staffId: "s1", staffName: "Sarah Johnson" }),
      mkTraining({ id: "sat-2", staffId: "s2", staffName: "Tom Richards" }),
      mkTraining({ id: "sat-3", staffId: "s3", staffName: "Lisa Williams" }),
      mkTraining({ id: "sat-4", staffId: "s4", staffName: "Darren Laville" }),
    ];
    const result = generateAllergenDietaryManagementIntelligence(
      profiles, meals, incidents, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childSummaries).toHaveLength(2); // Morgan excluded (no allergens)
    expect(result.regulatoryLinks).toHaveLength(7);
  });
});
