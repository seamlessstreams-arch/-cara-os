// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Cultural Identity Support Intelligence — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateIdentityRecognition,
  evaluateCulturalProvision,
  evaluateDietaryRespect,
  evaluateStaffCompetence,
  buildChildCulturalProfiles,
  generateCulturalIdentitySupportIntelligence,
  getRating,
  getIdentityDimensionLabel,
  getSupportLevelLabel,
  getDietaryProvisionLabel,
  getCulturalActivityTypeLabel,
  getStaffCompetenceLevelLabel,
  getRatingLabel,
} from "../cultural-identity-support-engine";
import type {
  IdentityAssessment,
  CulturalActivity,
  DietaryNeedRecord,
  StaffCulturalCompetence,
  IdentityDimension,
  SupportLevel,
  DietaryProvision,
  CulturalActivityType,
  StaffCompetenceLevel,
  Rating,
} from "../cultural-identity-support-engine";

// ── Constants ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

// ── Factories ────────────────────────────────────────────────────────────────

function makeAssessment(overrides: Partial<IdentityAssessment> = {}): IdentityAssessment {
  return {
    id: "ia-001",
    childId: "child-alex",
    childName: "Alex",
    dimension: "ethnicity",
    supportLevel: "fully_supported",
    assessedDate: "2026-02-01",
    assessedBy: "Sarah Thompson",
    childViewsSought: true,
    needsIdentified: null,
    planInPlace: false,
    ...overrides,
  };
}

function makeActivity(overrides: Partial<CulturalActivity> = {}): CulturalActivity {
  return {
    id: "ca-001",
    childId: "child-alex",
    childName: "Alex",
    activityType: "religious_observance",
    date: "2026-02-10",
    description: "Sunday church service",
    childChose: true,
    childEnjoyedIt: true,
    staffFacilitated: true,
    communityLink: true,
    ...overrides,
  };
}

function makeDietary(overrides: Partial<DietaryNeedRecord> = {}): DietaryNeedRecord {
  return {
    id: "dr-001",
    childId: "child-jordan",
    childName: "Jordan",
    dietaryRequirement: "Ital food",
    provision: "fully_met",
    reviewDate: "2026-03-01",
    childSatisfied: true,
    ...overrides,
  };
}

function makeStaff(overrides: Partial<StaffCulturalCompetence> = {}): StaffCulturalCompetence {
  return {
    id: "sc-001",
    staffId: "staff-sarah",
    staffName: "Sarah Thompson",
    competenceLevel: "competent",
    trainingCompleted: ["Cultural Awareness", "Equality & Diversity"],
    lastTrainingDate: "2026-01-15",
    canSupportLanguage: false,
    understandsFaithNeeds: true,
    antiRacistPractice: true,
    ...overrides,
  };
}

// ── Oak House Demo Data ──────────────────────────────────────────────────────
// Alex: White British, Church of England, no dietary needs, heritage activities
// Jordan: Black Caribbean, Rastafarian, dietary needs for ital food (mostly met), language support
// Morgan: Mixed heritage White/Asian, Buddhist, vegetarian (fully met), cultural celebrations
// Staff: Sarah (competent, anti-racist), Tom (developing, needs faith training), Lisa (advanced, language support)

const DEMO_ASSESSMENTS: IdentityAssessment[] = [
  // Alex
  makeAssessment({ id: "ia-alex-01", childId: "child-alex", childName: "Alex", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: null, planInPlace: false }),
  makeAssessment({ id: "ia-alex-02", childId: "child-alex", childName: "Alex", dimension: "religion", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "Wishes to attend church on Sundays", planInPlace: true }),
  makeAssessment({ id: "ia-alex-03", childId: "child-alex", childName: "Alex", dimension: "heritage", supportLevel: "mostly_supported", childViewsSought: true, needsIdentified: "Wants to learn about family history", planInPlace: true }),
  makeAssessment({ id: "ia-alex-04", childId: "child-alex", childName: "Alex", dimension: "family_traditions", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: null, planInPlace: false }),

  // Jordan
  makeAssessment({ id: "ia-jordan-01", childId: "child-jordan", childName: "Jordan", dimension: "ethnicity", supportLevel: "mostly_supported", childViewsSought: true, needsIdentified: "Needs access to Black Caribbean community", planInPlace: true }),
  makeAssessment({ id: "ia-jordan-02", childId: "child-jordan", childName: "Jordan", dimension: "religion", supportLevel: "partially_supported", childViewsSought: true, needsIdentified: "Rastafarian faith needs", planInPlace: true }),
  makeAssessment({ id: "ia-jordan-03", childId: "child-jordan", childName: "Jordan", dimension: "language", supportLevel: "mostly_supported", childViewsSought: true, needsIdentified: "Jamaican Patois maintenance", planInPlace: true }),
  makeAssessment({ id: "ia-jordan-04", childId: "child-jordan", childName: "Jordan", dimension: "heritage", supportLevel: "mostly_supported", childViewsSought: true, needsIdentified: "Caribbean heritage exploration", planInPlace: true }),
  makeAssessment({ id: "ia-jordan-05", childId: "child-jordan", childName: "Jordan", dimension: "nationality", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: null, planInPlace: false }),

  // Morgan
  makeAssessment({ id: "ia-morgan-01", childId: "child-morgan", childName: "Morgan", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "Dual heritage support", planInPlace: true }),
  makeAssessment({ id: "ia-morgan-02", childId: "child-morgan", childName: "Morgan", dimension: "religion", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "Buddhist practice", planInPlace: true }),
  makeAssessment({ id: "ia-morgan-03", childId: "child-morgan", childName: "Morgan", dimension: "heritage", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "Asian heritage exploration", planInPlace: true }),
  makeAssessment({ id: "ia-morgan-04", childId: "child-morgan", childName: "Morgan", dimension: "family_traditions", supportLevel: "mostly_supported", childViewsSought: true, needsIdentified: "Maintain family food traditions", planInPlace: true }),
];

const DEMO_ACTIVITIES: CulturalActivity[] = [
  // Alex
  makeActivity({ id: "ca-alex-01", childId: "child-alex", childName: "Alex", activityType: "religious_observance", description: "Sunday church service", childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true }),
  makeActivity({ id: "ca-alex-02", childId: "child-alex", childName: "Alex", activityType: "heritage_exploration", description: "Local history museum visit", childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true }),
  makeActivity({ id: "ca-alex-03", childId: "child-alex", childName: "Alex", activityType: "life_story", description: "Life story session exploring heritage", childChose: false, childEnjoyedIt: true, staffFacilitated: true, communityLink: false }),

  // Jordan
  makeActivity({ id: "ca-jordan-01", childId: "child-jordan", childName: "Jordan", activityType: "cultural_celebration", description: "Caribbean carnival event", childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true }),
  makeActivity({ id: "ca-jordan-02", childId: "child-jordan", childName: "Jordan", activityType: "community_connection", description: "Black Caribbean community centre visit", childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true }),
  makeActivity({ id: "ca-jordan-03", childId: "child-jordan", childName: "Jordan", activityType: "food_preparation", description: "Cooking ital food with community volunteer", childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true }),
  makeActivity({ id: "ca-jordan-04", childId: "child-jordan", childName: "Jordan", activityType: "language_maintenance", description: "Patois language session", childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true }),

  // Morgan
  makeActivity({ id: "ca-morgan-01", childId: "child-morgan", childName: "Morgan", activityType: "religious_observance", description: "Buddhist temple meditation", childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true }),
  makeActivity({ id: "ca-morgan-02", childId: "child-morgan", childName: "Morgan", activityType: "cultural_celebration", description: "Lunar New Year celebration", childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true }),
  makeActivity({ id: "ca-morgan-03", childId: "child-morgan", childName: "Morgan", activityType: "heritage_exploration", description: "Asian cultural exhibition", childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true }),
  makeActivity({ id: "ca-morgan-04", childId: "child-morgan", childName: "Morgan", activityType: "identity_work", description: "Dual heritage identity work", childChose: false, childEnjoyedIt: true, staffFacilitated: true, communityLink: false }),
];

const DEMO_DIETARY: DietaryNeedRecord[] = [
  makeDietary({ id: "dr-alex-01", childId: "child-alex", childName: "Alex", dietaryRequirement: "No specific cultural dietary needs", provision: "not_applicable", reviewDate: "2026-02-01", childSatisfied: true }),
  makeDietary({ id: "dr-jordan-01", childId: "child-jordan", childName: "Jordan", dietaryRequirement: "Ital food", provision: "mostly_met", reviewDate: "2026-03-01", childSatisfied: true }),
  makeDietary({ id: "dr-morgan-01", childId: "child-morgan", childName: "Morgan", dietaryRequirement: "Vegetarian — Buddhist", provision: "fully_met", reviewDate: "2026-03-01", childSatisfied: true }),
];

const DEMO_STAFF: StaffCulturalCompetence[] = [
  makeStaff({ id: "sc-sarah-01", staffId: "staff-sarah", staffName: "Sarah Thompson", competenceLevel: "competent", trainingCompleted: ["Cultural Awareness", "Equality & Diversity", "Anti-Racist Practice"], canSupportLanguage: false, understandsFaithNeeds: true, antiRacistPractice: true }),
  makeStaff({ id: "sc-tom-01", staffId: "staff-tom", staffName: "Tom Williams", competenceLevel: "developing", trainingCompleted: ["Equality & Diversity"], canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: true }),
  makeStaff({ id: "sc-lisa-01", staffId: "staff-lisa", staffName: "Lisa Chen", competenceLevel: "advanced", trainingCompleted: ["Cultural Awareness", "Equality & Diversity", "Anti-Racist Practice", "Faith Awareness", "Language Support"], canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true }),
];

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label functions", () => {
  describe("getIdentityDimensionLabel", () => {
    it("returns correct label for each dimension", () => {
      const expected: Record<IdentityDimension, string> = {
        ethnicity: "Ethnicity",
        religion: "Religion",
        language: "Language",
        heritage: "Heritage",
        disability: "Disability",
        gender_identity: "Gender Identity",
        sexual_orientation: "Sexual Orientation",
        nationality: "Nationality",
        family_traditions: "Family Traditions",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getIdentityDimensionLabel(key as IdentityDimension)).toBe(label);
      }
    });
  });

  describe("getSupportLevelLabel", () => {
    it("returns correct label for each level", () => {
      const expected: Record<SupportLevel, string> = {
        fully_supported: "Fully Supported",
        mostly_supported: "Mostly Supported",
        partially_supported: "Partially Supported",
        not_supported: "Not Supported",
        not_assessed: "Not Assessed",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getSupportLevelLabel(key as SupportLevel)).toBe(label);
      }
    });
  });

  describe("getDietaryProvisionLabel", () => {
    it("returns correct label for each provision", () => {
      const expected: Record<DietaryProvision, string> = {
        fully_met: "Fully Met",
        mostly_met: "Mostly Met",
        partially_met: "Partially Met",
        not_met: "Not Met",
        not_applicable: "Not Applicable",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getDietaryProvisionLabel(key as DietaryProvision)).toBe(label);
      }
    });
  });

  describe("getCulturalActivityTypeLabel", () => {
    it("returns correct label for each activity type", () => {
      const expected: Record<CulturalActivityType, string> = {
        religious_observance: "Religious Observance",
        cultural_celebration: "Cultural Celebration",
        language_maintenance: "Language Maintenance",
        food_preparation: "Food Preparation",
        community_connection: "Community Connection",
        heritage_exploration: "Heritage Exploration",
        identity_work: "Identity Work",
        life_story: "Life Story",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getCulturalActivityTypeLabel(key as CulturalActivityType)).toBe(label);
      }
    });
  });

  describe("getStaffCompetenceLevelLabel", () => {
    it("returns correct label for each competence level", () => {
      const expected: Record<StaffCompetenceLevel, string> = {
        advanced: "Advanced",
        competent: "Competent",
        developing: "Developing",
        needs_training: "Needs Training",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getStaffCompetenceLevelLabel(key as StaffCompetenceLevel)).toBe(label);
      }
    });
  });

  describe("getRatingLabel", () => {
    it("returns correct label for each rating", () => {
      const expected: Record<Rating, string> = {
        outstanding: "Outstanding",
        good: "Good",
        requires_improvement: "Requires Improvement",
        inadequate: "Inadequate",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getRatingLabel(key as Rating)).toBe(label);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateIdentityRecognition
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIdentityRecognition", () => {
  it("returns zero scores for empty assessments", () => {
    const result = evaluateIdentityRecognition([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.fullySupportedRate).toBe(0);
    expect(result.childViewsSoughtRate).toBe(0);
    expect(result.planInPlaceRate).toBe(0);
    expect(result.dimensionsCovered).toBe(0);
    expect(result.notAssessedCount).toBe(0);
  });

  it("scores high for all fully supported with views sought and plans in place", () => {
    const assessments = [
      makeAssessment({ id: "a1", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need 1", planInPlace: true }),
      makeAssessment({ id: "a2", dimension: "religion", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need 2", planInPlace: true }),
      makeAssessment({ id: "a3", dimension: "language", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need 3", planInPlace: true }),
      makeAssessment({ id: "a4", dimension: "heritage", supportLevel: "mostly_supported", childViewsSought: true, needsIdentified: "need 4", planInPlace: true }),
      makeAssessment({ id: "a5", dimension: "disability", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need 5", planInPlace: true }),
      makeAssessment({ id: "a6", dimension: "gender_identity", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need 6", planInPlace: true }),
      makeAssessment({ id: "a7", dimension: "nationality", supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need 7", planInPlace: true }),
    ];
    const result = evaluateIdentityRecognition(assessments);
    expect(result.overallScore).toBe(25);
    expect(result.fullySupportedRate).toBe(100);
    expect(result.childViewsSoughtRate).toBe(100);
    expect(result.planInPlaceRate).toBe(100);
    expect(result.dimensionsCovered).toBe(7);
  });

  it("calculates fully supported rate correctly (fully + mostly)", () => {
    const assessments = [
      makeAssessment({ id: "a1", supportLevel: "fully_supported" }),
      makeAssessment({ id: "a2", supportLevel: "mostly_supported" }),
      makeAssessment({ id: "a3", supportLevel: "partially_supported" }),
      makeAssessment({ id: "a4", supportLevel: "not_supported" }),
    ];
    const result = evaluateIdentityRecognition(assessments);
    expect(result.fullySupportedRate).toBe(50);
  });

  it("awards 7 points for supported rate >= 80%", () => {
    const assessments = [
      makeAssessment({ id: "a1", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a2", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a3", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a4", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a5", dimension: "ethnicity", supportLevel: "not_supported", childViewsSought: false, needsIdentified: null }),
    ];
    const result = evaluateIdentityRecognition(assessments);
    expect(result.fullySupportedRate).toBe(80);
    // 7 (support) + 0 (views) + 3 (no needs -> mid-range) + 1 (1 dimension) = 11
    expect(result.overallScore).toBe(11);
  });

  it("awards 5 points for supported rate >= 60% but < 80%", () => {
    const assessments = [
      makeAssessment({ id: "a1", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a2", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a3", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a4", dimension: "ethnicity", supportLevel: "not_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a5", dimension: "ethnicity", supportLevel: "not_supported", childViewsSought: false, needsIdentified: null }),
    ];
    const result = evaluateIdentityRecognition(assessments);
    expect(result.fullySupportedRate).toBe(60);
    // 5 (support) + 0 (views) + 3 (no needs) + 1 (1 dimension) = 9
    expect(result.overallScore).toBe(9);
  });

  it("awards 3 points for supported rate >= 40% but < 60%", () => {
    const assessments = [
      makeAssessment({ id: "a1", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a2", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a3", dimension: "ethnicity", supportLevel: "not_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a4", dimension: "ethnicity", supportLevel: "not_supported", childViewsSought: false, needsIdentified: null }),
      makeAssessment({ id: "a5", dimension: "ethnicity", supportLevel: "not_supported", childViewsSought: false, needsIdentified: null }),
    ];
    const result = evaluateIdentityRecognition(assessments);
    expect(result.fullySupportedRate).toBe(40);
    // 3 (support) + 0 (views) + 3 (no needs) + 1 (1 dimension) = 7
    expect(result.overallScore).toBe(7);
  });

  it("calculates child views sought rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", childViewsSought: true }),
      makeAssessment({ id: "a2", childViewsSought: true }),
      makeAssessment({ id: "a3", childViewsSought: false }),
    ];
    const result = evaluateIdentityRecognition(assessments);
    expect(result.childViewsSoughtRate).toBe(67);
  });

  it("calculates plan in place rate for assessments with needs", () => {
    const assessments = [
      makeAssessment({ id: "a1", needsIdentified: "need 1", planInPlace: true }),
      makeAssessment({ id: "a2", needsIdentified: "need 2", planInPlace: true }),
      makeAssessment({ id: "a3", needsIdentified: "need 3", planInPlace: false }),
      makeAssessment({ id: "a4", needsIdentified: null, planInPlace: false }),
    ];
    const result = evaluateIdentityRecognition(assessments);
    // 3 have needs, 2 have plans = 67%
    expect(result.planInPlaceRate).toBe(67);
  });

  it("counts dimensions covered correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", dimension: "ethnicity" }),
      makeAssessment({ id: "a2", dimension: "religion" }),
      makeAssessment({ id: "a3", dimension: "language" }),
      makeAssessment({ id: "a4", dimension: "ethnicity" }), // duplicate
    ];
    const result = evaluateIdentityRecognition(assessments);
    expect(result.dimensionsCovered).toBe(3);
  });

  it("awards 6 points for dimensions >= 7", () => {
    const dimensions: IdentityDimension[] = ["ethnicity", "religion", "language", "heritage", "disability", "gender_identity", "nationality"];
    const assessments = dimensions.map((dim, i) =>
      makeAssessment({ id: `a${i}`, dimension: dim, supportLevel: "not_supported", childViewsSought: false, needsIdentified: null }),
    );
    const result = evaluateIdentityRecognition(assessments);
    expect(result.dimensionsCovered).toBe(7);
  });

  it("awards 4 points for dimensions >= 5 but < 7", () => {
    const dimensions: IdentityDimension[] = ["ethnicity", "religion", "language", "heritage", "disability"];
    const assessments = dimensions.map((dim, i) =>
      makeAssessment({ id: `a${i}`, dimension: dim, supportLevel: "not_supported", childViewsSought: false, needsIdentified: null }),
    );
    const result = evaluateIdentityRecognition(assessments);
    expect(result.dimensionsCovered).toBe(5);
  });

  it("counts not assessed correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", supportLevel: "not_assessed" }),
      makeAssessment({ id: "a2", supportLevel: "fully_supported" }),
      makeAssessment({ id: "a3", supportLevel: "not_assessed" }),
    ];
    const result = evaluateIdentityRecognition(assessments);
    expect(result.notAssessedCount).toBe(2);
  });

  it("caps score at 25", () => {
    const dimensions: IdentityDimension[] = ["ethnicity", "religion", "language", "heritage", "disability", "gender_identity", "sexual_orientation", "nationality", "family_traditions"];
    const assessments = dimensions.map((dim, i) =>
      makeAssessment({ id: `a${i}`, dimension: dim, supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need", planInPlace: true }),
    );
    const result = evaluateIdentityRecognition(assessments);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single assessment correctly", () => {
    const result = evaluateIdentityRecognition([
      makeAssessment({ supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need", planInPlace: true }),
    ]);
    expect(result.totalAssessments).toBe(1);
    expect(result.fullySupportedRate).toBe(100);
  });

  it("scores demo data (Oak House) appropriately", () => {
    const result = evaluateIdentityRecognition(DEMO_ASSESSMENTS);
    expect(result.totalAssessments).toBe(13);
    // Most are fully or mostly supported
    expect(result.fullySupportedRate).toBeGreaterThan(70);
    // All have child views sought
    expect(result.childViewsSoughtRate).toBe(100);
    // Multiple dimensions covered
    expect(result.dimensionsCovered).toBeGreaterThan(4);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives mid-range plan score when no needs identified", () => {
    const assessments = [
      makeAssessment({ id: "a1", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: false, needsIdentified: null }),
    ];
    const result = evaluateIdentityRecognition(assessments);
    // Should get 3 for mid-range (no needs => neutral)
    // 7 (100% support) + 0 (0% views) + 3 (no needs) + 1 (1 dim) = 11
    expect(result.overallScore).toBe(11);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateCulturalProvision
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCulturalProvision", () => {
  it("returns zero scores for empty activities", () => {
    const result = evaluateCulturalProvision([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.childChoiceRate).toBe(0);
    expect(result.childEnjoymentRate).toBe(0);
    expect(result.communityLinkRate).toBe(0);
    expect(result.activityVariety).toBe(0);
    expect(result.staffFacilitatedRate).toBe(0);
  });

  it("scores high for all-positive, diverse, community-linked activities", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "religious_observance", childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
      makeActivity({ id: "a2", activityType: "cultural_celebration", childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
      makeActivity({ id: "a3", activityType: "language_maintenance", childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
      makeActivity({ id: "a4", activityType: "food_preparation", childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
      makeActivity({ id: "a5", activityType: "community_connection", childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
    ];
    const result = evaluateCulturalProvision(activities);
    expect(result.overallScore).toBe(25);
    expect(result.childChoiceRate).toBe(100);
    expect(result.childEnjoymentRate).toBe(100);
    expect(result.communityLinkRate).toBe(100);
    expect(result.activityVariety).toBe(5);
    expect(result.staffFacilitatedRate).toBe(100);
  });

  it("calculates child choice rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", childChose: true }),
      makeActivity({ id: "a2", childChose: true }),
      makeActivity({ id: "a3", childChose: false }),
    ];
    const result = evaluateCulturalProvision(activities);
    expect(result.childChoiceRate).toBe(67);
  });

  it("awards 6 points for child choice >= 80%", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "religious_observance", childChose: true, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
      makeActivity({ id: "a2", activityType: "religious_observance", childChose: true, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
      makeActivity({ id: "a3", activityType: "religious_observance", childChose: true, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
      makeActivity({ id: "a4", activityType: "religious_observance", childChose: true, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
      makeActivity({ id: "a5", activityType: "religious_observance", childChose: true, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
    ];
    const result = evaluateCulturalProvision(activities);
    expect(result.childChoiceRate).toBe(100);
    // 6 (choice) + 0 (enjoyment) + 0 (community) + 1 (1 type) + 0 (staff) = 7
    expect(result.overallScore).toBe(7);
  });

  it("awards 4 points for child choice >= 60% but < 80%", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "religious_observance", childChose: true, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
      makeActivity({ id: "a2", activityType: "religious_observance", childChose: true, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
      makeActivity({ id: "a3", activityType: "religious_observance", childChose: true, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
      makeActivity({ id: "a4", activityType: "religious_observance", childChose: false, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
      makeActivity({ id: "a5", activityType: "religious_observance", childChose: false, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
    ];
    const result = evaluateCulturalProvision(activities);
    expect(result.childChoiceRate).toBe(60);
    // 4 (choice) + 0 + 0 + 1 + 0 = 5
    expect(result.overallScore).toBe(5);
  });

  it("calculates child enjoyment rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", childEnjoyedIt: true }),
      makeActivity({ id: "a2", childEnjoyedIt: true }),
      makeActivity({ id: "a3", childEnjoyedIt: false }),
      makeActivity({ id: "a4", childEnjoyedIt: false }),
    ];
    const result = evaluateCulturalProvision(activities);
    expect(result.childEnjoymentRate).toBe(50);
  });

  it("calculates community link rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", communityLink: true }),
      makeActivity({ id: "a2", communityLink: true }),
      makeActivity({ id: "a3", communityLink: false }),
    ];
    const result = evaluateCulturalProvision(activities);
    expect(result.communityLinkRate).toBe(67);
  });

  it("counts activity variety correctly", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "religious_observance" }),
      makeActivity({ id: "a2", activityType: "cultural_celebration" }),
      makeActivity({ id: "a3", activityType: "religious_observance" }), // duplicate
      makeActivity({ id: "a4", activityType: "food_preparation" }),
    ];
    const result = evaluateCulturalProvision(activities);
    expect(result.activityVariety).toBe(3);
  });

  it("awards 4 points for variety >= 5", () => {
    const types: CulturalActivityType[] = ["religious_observance", "cultural_celebration", "language_maintenance", "food_preparation", "community_connection"];
    const activities = types.map((type, i) =>
      makeActivity({ id: `a${i}`, activityType: type, childChose: false, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
    );
    const result = evaluateCulturalProvision(activities);
    expect(result.activityVariety).toBe(5);
  });

  it("calculates staff facilitated rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", staffFacilitated: true }),
      makeActivity({ id: "a2", staffFacilitated: true }),
      makeActivity({ id: "a3", staffFacilitated: false }),
      makeActivity({ id: "a4", staffFacilitated: false }),
    ];
    const result = evaluateCulturalProvision(activities);
    expect(result.staffFacilitatedRate).toBe(50);
  });

  it("caps score at 25", () => {
    const types: CulturalActivityType[] = ["religious_observance", "cultural_celebration", "language_maintenance", "food_preparation", "community_connection", "heritage_exploration", "identity_work", "life_story"];
    const activities = types.map((type, i) =>
      makeActivity({ id: `a${i}`, activityType: type, childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
    );
    const result = evaluateCulturalProvision(activities);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single activity correctly", () => {
    const result = evaluateCulturalProvision([
      makeActivity({ childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
    ]);
    expect(result.totalActivities).toBe(1);
    expect(result.childChoiceRate).toBe(100);
  });

  it("scores demo data (Oak House) appropriately", () => {
    const result = evaluateCulturalProvision(DEMO_ACTIVITIES);
    expect(result.totalActivities).toBe(11);
    // Most activities are child-chosen
    expect(result.childChoiceRate).toBeGreaterThan(70);
    // All activities are enjoyed
    expect(result.childEnjoymentRate).toBe(100);
    // Most have community links
    expect(result.communityLinkRate).toBeGreaterThan(70);
    // Good variety of activity types
    expect(result.activityVariety).toBeGreaterThan(4);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateDietaryRespect
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDietaryRespect", () => {
  it("returns zero scores for empty records", () => {
    const result = evaluateDietaryRespect([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.fullyMetRate).toBe(0);
    expect(result.childSatisfiedRate).toBe(0);
    expect(result.reviewedRate).toBe(0);
  });

  it("returns 25 for all not_applicable records", () => {
    const records = [
      makeDietary({ id: "d1", provision: "not_applicable" }),
      makeDietary({ id: "d2", provision: "not_applicable" }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(2);
  });

  it("scores high for all fully met, satisfied, and reviewed", () => {
    const records = [
      makeDietary({ id: "d1", provision: "fully_met", childSatisfied: true, reviewDate: "2026-03-01" }),
      makeDietary({ id: "d2", provision: "fully_met", childSatisfied: true, reviewDate: "2026-03-01" }),
      makeDietary({ id: "d3", provision: "fully_met", childSatisfied: true, reviewDate: "2026-03-01" }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.overallScore).toBe(25);
    expect(result.fullyMetRate).toBe(100);
    expect(result.childSatisfiedRate).toBe(100);
    expect(result.reviewedRate).toBe(100);
  });

  it("calculates fully met rate correctly", () => {
    const records = [
      makeDietary({ id: "d1", provision: "fully_met" }),
      makeDietary({ id: "d2", provision: "mostly_met" }),
      makeDietary({ id: "d3", provision: "not_met" }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.fullyMetRate).toBe(33);
  });

  it("awards 10 points for fully met rate >= 90%", () => {
    const records = [
      makeDietary({ id: "d1", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d2", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d3", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d4", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d5", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d6", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d7", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d8", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d9", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d10", provision: "mostly_met", childSatisfied: false, reviewDate: null }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.fullyMetRate).toBe(90);
    // 10 (fully met) + 0 (satisfied) + 0 (reviewed) = 10
    expect(result.overallScore).toBe(10);
  });

  it("awards 7 points for fully met rate >= 70% but < 90%", () => {
    const records = [
      makeDietary({ id: "d1", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d2", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d3", provision: "fully_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d4", provision: "mostly_met", childSatisfied: false, reviewDate: null }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.fullyMetRate).toBe(75);
    // 7 (fully met) + 0 + 0 = 7
    expect(result.overallScore).toBe(7);
  });

  it("calculates child satisfied rate correctly", () => {
    const records = [
      makeDietary({ id: "d1", childSatisfied: true }),
      makeDietary({ id: "d2", childSatisfied: true }),
      makeDietary({ id: "d3", childSatisfied: false }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.childSatisfiedRate).toBe(67);
  });

  it("calculates reviewed rate correctly", () => {
    const records = [
      makeDietary({ id: "d1", reviewDate: "2026-03-01" }),
      makeDietary({ id: "d2", reviewDate: null }),
      makeDietary({ id: "d3", reviewDate: "2026-02-15" }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.reviewedRate).toBe(67);
  });

  it("scores zero for all not met, unsatisfied, unreviewed", () => {
    const records = [
      makeDietary({ id: "d1", provision: "not_met", childSatisfied: false, reviewDate: null }),
      makeDietary({ id: "d2", provision: "not_met", childSatisfied: false, reviewDate: null }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeDietary({ id: `d${i}`, provision: "fully_met", childSatisfied: true, reviewDate: "2026-03-01" }),
    );
    const result = evaluateDietaryRespect(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single record correctly", () => {
    const result = evaluateDietaryRespect([
      makeDietary({ provision: "fully_met", childSatisfied: true, reviewDate: "2026-03-01" }),
    ]);
    expect(result.totalRecords).toBe(1);
    expect(result.fullyMetRate).toBe(100);
  });

  it("filters out not_applicable for scoring calculations", () => {
    const records = [
      makeDietary({ id: "d1", provision: "not_applicable" }),
      makeDietary({ id: "d2", provision: "fully_met", childSatisfied: true, reviewDate: "2026-03-01" }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.totalRecords).toBe(2);
    // Only 1 applicable record, which is fully met
    expect(result.fullyMetRate).toBe(100);
  });

  it("scores demo data (Oak House) appropriately", () => {
    const result = evaluateDietaryRespect(DEMO_DIETARY);
    expect(result.totalRecords).toBe(3);
    // 1 not_applicable (Alex), 1 mostly_met (Jordan), 1 fully_met (Morgan)
    // Applicable: Jordan (mostly_met) + Morgan (fully_met) = 50% fully met
    expect(result.fullyMetRate).toBe(50);
    // Both applicable children are satisfied
    expect(result.childSatisfiedRate).toBe(100);
    // Both have review dates
    expect(result.reviewedRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffCompetence
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffCompetence", () => {
  it("returns zero scores for empty staff", () => {
    const result = evaluateStaffCompetence([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.competentAdvancedRate).toBe(0);
    expect(result.languageSupportRate).toBe(0);
    expect(result.faithNeedsRate).toBe(0);
    expect(result.antiRacistRate).toBe(0);
    expect(result.trainingCompletedRate).toBe(0);
  });

  it("scores high for all advanced, fully competent staff", () => {
    const staff = [
      makeStaff({ id: "s1", competenceLevel: "advanced", canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true, trainingCompleted: ["Training A"] }),
      makeStaff({ id: "s2", competenceLevel: "competent", canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true, trainingCompleted: ["Training B"] }),
      makeStaff({ id: "s3", competenceLevel: "advanced", canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true, trainingCompleted: ["Training C"] }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.overallScore).toBe(25);
    expect(result.competentAdvancedRate).toBe(100);
    expect(result.languageSupportRate).toBe(100);
    expect(result.faithNeedsRate).toBe(100);
    expect(result.antiRacistRate).toBe(100);
    expect(result.trainingCompletedRate).toBe(100);
  });

  it("calculates competent/advanced rate correctly", () => {
    const staff = [
      makeStaff({ id: "s1", competenceLevel: "advanced" }),
      makeStaff({ id: "s2", competenceLevel: "competent" }),
      makeStaff({ id: "s3", competenceLevel: "developing" }),
      makeStaff({ id: "s4", competenceLevel: "needs_training" }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.competentAdvancedRate).toBe(50);
  });

  it("awards 7 points for competent/advanced >= 80%", () => {
    const staff = [
      makeStaff({ id: "s1", competenceLevel: "advanced", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
      makeStaff({ id: "s2", competenceLevel: "competent", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
      makeStaff({ id: "s3", competenceLevel: "competent", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
      makeStaff({ id: "s4", competenceLevel: "competent", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
      makeStaff({ id: "s5", competenceLevel: "developing", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.competentAdvancedRate).toBe(80);
    // 7 (competence) + 0 + 0 + 0 + 0 = 7
    expect(result.overallScore).toBe(7);
  });

  it("awards 5 points for competent/advanced >= 60% but < 80%", () => {
    const staff = [
      makeStaff({ id: "s1", competenceLevel: "competent", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
      makeStaff({ id: "s2", competenceLevel: "competent", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
      makeStaff({ id: "s3", competenceLevel: "developing", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.competentAdvancedRate).toBe(67);
    // 5 (competence) + 0 + 0 + 0 + 0 = 5
    expect(result.overallScore).toBe(5);
  });

  it("calculates language support rate correctly", () => {
    const staff = [
      makeStaff({ id: "s1", canSupportLanguage: true }),
      makeStaff({ id: "s2", canSupportLanguage: false }),
      makeStaff({ id: "s3", canSupportLanguage: false }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.languageSupportRate).toBe(33);
  });

  it("calculates faith needs rate correctly", () => {
    const staff = [
      makeStaff({ id: "s1", understandsFaithNeeds: true }),
      makeStaff({ id: "s2", understandsFaithNeeds: true }),
      makeStaff({ id: "s3", understandsFaithNeeds: false }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.faithNeedsRate).toBe(67);
  });

  it("calculates anti-racist rate correctly", () => {
    const staff = [
      makeStaff({ id: "s1", antiRacistPractice: true }),
      makeStaff({ id: "s2", antiRacistPractice: true }),
      makeStaff({ id: "s3", antiRacistPractice: false }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.antiRacistRate).toBe(67);
  });

  it("calculates training completed rate correctly", () => {
    const staff = [
      makeStaff({ id: "s1", trainingCompleted: ["Training A"] }),
      makeStaff({ id: "s2", trainingCompleted: [] }),
      makeStaff({ id: "s3", trainingCompleted: ["Training B", "Training C"] }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.trainingCompletedRate).toBe(67);
  });

  it("scores zero for all needs_training, no skills", () => {
    const staff = [
      makeStaff({ id: "s1", competenceLevel: "needs_training", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
      makeStaff({ id: "s2", competenceLevel: "needs_training", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const staff = Array.from({ length: 10 }, (_, i) =>
      makeStaff({ id: `s${i}`, competenceLevel: "advanced", canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true, trainingCompleted: ["Training"] }),
    );
    const result = evaluateStaffCompetence(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single staff member correctly", () => {
    const result = evaluateStaffCompetence([
      makeStaff({ competenceLevel: "advanced", canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true, trainingCompleted: ["Training"] }),
    ]);
    expect(result.totalStaff).toBe(1);
    expect(result.competentAdvancedRate).toBe(100);
  });

  it("scores demo data (Oak House) appropriately", () => {
    const result = evaluateStaffCompetence(DEMO_STAFF);
    expect(result.totalStaff).toBe(3);
    // Sarah (competent) + Lisa (advanced) = 2/3 = 67%
    expect(result.competentAdvancedRate).toBe(67);
    // Only Lisa can support language = 1/3 = 33%
    expect(result.languageSupportRate).toBe(33);
    // Sarah + Lisa understand faith = 2/3 = 67%
    expect(result.faithNeedsRate).toBe(67);
    // All 3 have anti-racist practice
    expect(result.antiRacistRate).toBe(100);
    // All 3 have training completed
    expect(result.trainingCompletedRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildCulturalProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildCulturalProfiles", () => {
  it("returns empty array when no data", () => {
    const profiles = buildChildCulturalProfiles([], [], []);
    expect(profiles).toHaveLength(0);
  });

  it("builds profiles from assessments alone", () => {
    const assessments = [
      makeAssessment({ id: "a1", childId: "child-alex", childName: "Alex", dimension: "ethnicity", supportLevel: "fully_supported" }),
      makeAssessment({ id: "a2", childId: "child-alex", childName: "Alex", dimension: "religion", supportLevel: "fully_supported" }),
    ];
    const profiles = buildChildCulturalProfiles(assessments, [], []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].dimensionsAssessed).toBe(2);
    expect(profiles[0].fullySupportedDimensions).toBe(2);
    expect(profiles[0].activitiesCount).toBe(0);
  });

  it("builds profiles from activities alone", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildCulturalProfiles([], activities, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].activitiesCount).toBe(2);
    expect(profiles[0].dimensionsAssessed).toBe(0);
  });

  it("builds profiles from dietary records alone", () => {
    const dietary = [
      makeDietary({ id: "d1", childId: "child-jordan", childName: "Jordan", provision: "fully_met" }),
    ];
    const profiles = buildChildCulturalProfiles([], [], dietary);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].dietaryMetRate).toBe(100);
  });

  it("merges data from all sources for the same child", () => {
    const assessments = [makeAssessment({ childId: "child-alex", childName: "Alex", dimension: "ethnicity", supportLevel: "fully_supported" })];
    const activities = [makeActivity({ childId: "child-alex", childName: "Alex" })];
    const dietary = [makeDietary({ childId: "child-alex", childName: "Alex", provision: "fully_met" })];

    const profiles = buildChildCulturalProfiles(assessments, activities, dietary);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].dimensionsAssessed).toBe(1);
    expect(profiles[0].activitiesCount).toBe(1);
    expect(profiles[0].dietaryMetRate).toBe(100);
  });

  it("creates separate profiles for different children", () => {
    const assessments = [
      makeAssessment({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeAssessment({ id: "a2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildCulturalProfiles(assessments, [], []);
    expect(profiles).toHaveLength(2);
    const alexProfile = profiles.find((p) => p.childId === "child-alex");
    const jordanProfile = profiles.find((p) => p.childId === "child-jordan");
    expect(alexProfile).toBeDefined();
    expect(jordanProfile).toBeDefined();
  });

  it("calculates profile score correctly for well-supported child", () => {
    const assessments = [
      makeAssessment({ id: "a1", childId: "child-alex", childName: "Alex", dimension: "ethnicity", supportLevel: "fully_supported", childViewsSought: true }),
      makeAssessment({ id: "a2", childId: "child-alex", childName: "Alex", dimension: "religion", supportLevel: "fully_supported", childViewsSought: true }),
      makeAssessment({ id: "a3", childId: "child-alex", childName: "Alex", dimension: "heritage", supportLevel: "fully_supported", childViewsSought: true }),
      makeAssessment({ id: "a4", childId: "child-alex", childName: "Alex", dimension: "language", supportLevel: "fully_supported", childViewsSought: true }),
      makeAssessment({ id: "a5", childId: "child-alex", childName: "Alex", dimension: "family_traditions", supportLevel: "fully_supported", childViewsSought: true }),
    ];
    const activities = [
      makeActivity({ id: "act1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "act2", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "act3", childId: "child-alex", childName: "Alex" }),
    ];
    const dietary = [makeDietary({ childId: "child-alex", childName: "Alex", provision: "fully_met" })];

    const profiles = buildChildCulturalProfiles(assessments, activities, dietary);
    // 5 dims => 3 pts, 100% fully supported => 2 pts, 3 activities => 2 pts, fully met => 2 pts, 100% views => 1 pt = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("calculates profile score correctly for poorly supported child", () => {
    const assessments = [
      makeAssessment({ id: "a1", childId: "child-jordan", childName: "Jordan", dimension: "ethnicity", supportLevel: "not_supported", childViewsSought: false }),
    ];
    const profiles = buildChildCulturalProfiles(assessments, [], []);
    // 1 dim => 1 pt, 0% fully supported => 0 pts, 0 activities => 0 pts, no dietary => 1 pt, 0% views => 0 pt = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps profile score at 10", () => {
    const dimensions: IdentityDimension[] = ["ethnicity", "religion", "language", "heritage", "disability", "gender_identity", "nationality"];
    const assessments = dimensions.map((dim, i) =>
      makeAssessment({ id: `a${i}`, childId: "child-alex", childName: "Alex", dimension: dim, supportLevel: "fully_supported", childViewsSought: true }),
    );
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `act${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const dietary = [makeDietary({ childId: "child-alex", childName: "Alex", provision: "fully_met" })];

    const profiles = buildChildCulturalProfiles(assessments, activities, dietary);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("gives neutral dietary score for not_applicable records", () => {
    const dietary = [makeDietary({ childId: "child-alex", childName: "Alex", provision: "not_applicable" })];
    const profiles = buildChildCulturalProfiles([], [], dietary);
    // No applicable dietary => 1 point (neutral)
    expect(profiles[0].dietaryMetRate).toBe(0);
  });

  it("counts fully supported dimensions correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", childId: "child-alex", childName: "Alex", dimension: "ethnicity", supportLevel: "fully_supported" }),
      makeAssessment({ id: "a2", childId: "child-alex", childName: "Alex", dimension: "religion", supportLevel: "mostly_supported" }),
      makeAssessment({ id: "a3", childId: "child-alex", childName: "Alex", dimension: "heritage", supportLevel: "fully_supported" }),
    ];
    const profiles = buildChildCulturalProfiles(assessments, [], []);
    expect(profiles[0].fullySupportedDimensions).toBe(2);
  });

  it("scores demo data (Oak House) profiles correctly", () => {
    const profiles = buildChildCulturalProfiles(DEMO_ASSESSMENTS, DEMO_ACTIVITIES, DEMO_DIETARY);
    expect(profiles).toHaveLength(3);

    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.dimensionsAssessed).toBe(4);
    expect(alex!.fullySupportedDimensions).toBe(3); // ethnicity, religion, family_traditions
    expect(alex!.activitiesCount).toBe(3);
    expect(alex!.overallScore).toBeGreaterThanOrEqual(5);

    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan).toBeDefined();
    expect(jordan!.dimensionsAssessed).toBe(5);
    expect(jordan!.activitiesCount).toBe(4);
    expect(jordan!.overallScore).toBeGreaterThanOrEqual(4);

    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan).toBeDefined();
    expect(morgan!.dimensionsAssessed).toBe(4);
    expect(morgan!.fullySupportedDimensions).toBe(3); // ethnicity, religion, heritage
    expect(morgan!.activitiesCount).toBe(4);
    expect(morgan!.dietaryMetRate).toBe(100);
    expect(morgan!.overallScore).toBeGreaterThanOrEqual(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateCulturalIdentitySupportIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateCulturalIdentitySupportIntelligence", () => {
  it("returns complete intelligence for empty inputs", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    // Identity=0, Provision=0, Dietary=0, Staff=0
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.identityRecognition.overallScore).toBe(0);
    expect(result.culturalProvision.overallScore).toBe(0);
    expect(result.dietaryRespect.overallScore).toBe(0);
    expect(result.staffCompetence.overallScore).toBe(0);
    expect(result.childProfiles).toHaveLength(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("generates correct intelligence for Oak House demo data", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      DEMO_ASSESSMENTS, DEMO_ACTIVITIES, DEMO_DIETARY, DEMO_STAFF,
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);

    // Sub-scores
    expect(result.identityRecognition.overallScore).toBeGreaterThan(0);
    expect(result.identityRecognition.totalAssessments).toBe(13);
    expect(result.culturalProvision.overallScore).toBeGreaterThan(0);
    expect(result.culturalProvision.totalActivities).toBe(11);
    expect(result.dietaryRespect.totalRecords).toBe(3);
    expect(result.staffCompetence.totalStaff).toBe(3);

    // Child profiles
    expect(result.childProfiles).toHaveLength(3);

    // Strengths, areas, actions
    expect(result.strengths.length).toBeGreaterThanOrEqual(0);
    expect(result.areasForImprovement.length).toBeGreaterThanOrEqual(0);
    expect(result.actions.length).toBeGreaterThanOrEqual(0);
  });

  it("caps overall score at 100", () => {
    const dimensions: IdentityDimension[] = ["ethnicity", "religion", "language", "heritage", "disability", "gender_identity", "sexual_orientation", "nationality", "family_traditions"];
    const assessments = dimensions.map((dim, i) =>
      makeAssessment({ id: `a${i}`, dimension: dim, supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need", planInPlace: true }),
    );
    const types: CulturalActivityType[] = ["religious_observance", "cultural_celebration", "language_maintenance", "food_preparation", "community_connection", "heritage_exploration", "identity_work", "life_story"];
    const activities = types.map((type, i) =>
      makeActivity({ id: `act${i}`, activityType: type, childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
    );
    const dietary = [
      makeDietary({ id: "d1", provision: "fully_met", childSatisfied: true, reviewDate: "2026-03-01" }),
    ];
    const staff = Array.from({ length: 5 }, (_, i) =>
      makeStaff({ id: `s${i}`, competenceLevel: "advanced", canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true, trainingCompleted: ["Training"] }),
    );
    const result = generateCulturalIdentitySupportIntelligence(
      assessments, activities, dietary, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes regulatory links", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 6 — quality of care standard including cultural identity needs");
    expect(result.regulatoryLinks).toContain("Equality Act 2010 — protection from discrimination and promotion of equality");
    expect(result.regulatoryLinks).toContain("UNCRC Article 8 — right to preservation of identity");
    expect(result.regulatoryLinks).toContain("UNCRC Article 30 — right of minority children to enjoy their own culture, religion, and language");
    expect(result.regulatoryLinks).toContain("CA 1989 s22(5)(c) — due consideration to religious, racial, cultural, and linguistic needs");
  });

  it("includes SCCIF, NMS 7, and Working Together references", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const sccif = result.regulatoryLinks.find((r) => r.includes("SCCIF"));
    expect(sccif).toBeDefined();
    const nms7 = result.regulatoryLinks.find((r) => r.includes("NMS 7"));
    expect(nms7).toBeDefined();
    const wt = result.regulatoryLinks.find((r) => r.includes("Working Together"));
    expect(wt).toBeDefined();
  });

  it("generates strengths when performance is high", () => {
    const dimensions: IdentityDimension[] = ["ethnicity", "religion", "language", "heritage", "disability", "gender_identity", "nationality"];
    const assessments = dimensions.map((dim, i) =>
      makeAssessment({ id: `a${i}`, dimension: dim, supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need", planInPlace: true }),
    );
    const types: CulturalActivityType[] = ["religious_observance", "cultural_celebration", "language_maintenance", "food_preparation", "community_connection"];
    const activities = types.map((type, i) =>
      makeActivity({ id: `act${i}`, activityType: type, childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
    );
    const staff = [
      makeStaff({ id: "s1", competenceLevel: "advanced", canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true, trainingCompleted: ["Training"] }),
    ];
    const result = generateCulturalIdentitySupportIntelligence(
      assessments, activities, [], staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("identity support"))).toBe(true);
  });

  it("generates areas for improvement when data is missing", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates urgent actions when no assessments recorded", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
    expect(result.actions.some((a) => a.includes("cultural identity assessments"))).toBe(true);
  });

  it("generates urgent actions when no activities recorded", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [makeAssessment()], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("cultural activities programme"))).toBe(true);
  });

  it("generates urgent actions when no staff competence assessed", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [makeAssessment()], [makeActivity()], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("staff cultural competence"))).toBe(true);
  });

  it("sums all four sub-scores for overall score", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      DEMO_ASSESSMENTS, DEMO_ACTIVITIES, DEMO_DIETARY, DEMO_STAFF,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const expectedSum =
      result.identityRecognition.overallScore +
      result.culturalProvision.overallScore +
      result.dietaryRespect.overallScore +
      result.staffCompetence.overallScore;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("rating matches overall score", () => {
    // Outstanding
    const dimensions: IdentityDimension[] = ["ethnicity", "religion", "language", "heritage", "disability", "gender_identity", "nationality"];
    const assessments = dimensions.map((dim, i) =>
      makeAssessment({ id: `a${i}`, dimension: dim, supportLevel: "fully_supported", childViewsSought: true, needsIdentified: "need", planInPlace: true }),
    );
    const types: CulturalActivityType[] = ["religious_observance", "cultural_celebration", "language_maintenance", "food_preparation", "community_connection"];
    const activities = types.map((type, i) =>
      makeActivity({ id: `act${i}`, activityType: type, childChose: true, childEnjoyedIt: true, communityLink: true, staffFacilitated: true }),
    );
    const dietary = Array.from({ length: 3 }, (_, i) =>
      makeDietary({ id: `d${i}`, provision: "fully_met", childSatisfied: true, reviewDate: "2026-03-01" }),
    );
    const staff = Array.from({ length: 3 }, (_, i) =>
      makeStaff({ id: `s${i}`, competenceLevel: "advanced", canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true, trainingCompleted: ["Training"] }),
    );
    const highResult = generateCulturalIdentitySupportIntelligence(
      assessments, activities, dietary, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(highResult.rating).toBe("outstanding");
  });

  it("produces inadequate rating for very low scores", () => {
    const assessments = [
      makeAssessment({ supportLevel: "not_supported", childViewsSought: false, needsIdentified: "need", planInPlace: false }),
    ];
    const activities = [
      makeActivity({ childChose: false, childEnjoyedIt: false, communityLink: false, staffFacilitated: false }),
    ];
    const dietary = [
      makeDietary({ provision: "not_met", childSatisfied: false, reviewDate: null }),
    ];
    const staff = [
      makeStaff({ competenceLevel: "needs_training", canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: false, trainingCompleted: [] }),
    ];
    const result = generateCulturalIdentitySupportIntelligence(
      assessments, activities, dietary, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
  });

  it("handles assessments-only data correctly", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      DEMO_ASSESSMENTS, [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.identityRecognition.totalAssessments).toBe(13);
    expect(result.culturalProvision.totalActivities).toBe(0);
    expect(result.dietaryRespect.totalRecords).toBe(0);
    expect(result.staffCompetence.totalStaff).toBe(0);
  });

  it("handles activities-only data correctly", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], DEMO_ACTIVITIES, [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.identityRecognition.totalAssessments).toBe(0);
    expect(result.culturalProvision.totalActivities).toBe(11);
  });

  it("preserves homeId and period in result", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [],
      "maple-lodge", "2026-03-01", "2026-04-30",
    );
    expect(result.homeId).toBe("maple-lodge");
    expect(result.periodStart).toBe("2026-03-01");
    expect(result.periodEnd).toBe("2026-04-30");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge Cases and Boundary Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles many assessments for a single child", () => {
    const assessments = Array.from({ length: 50 }, (_, i) =>
      makeAssessment({ id: `a${i}`, supportLevel: i % 2 === 0 ? "fully_supported" : "not_supported" }),
    );
    const result = evaluateIdentityRecognition(assessments);
    expect(result.totalAssessments).toBe(50);
    expect(result.fullySupportedRate).toBe(50);
  });

  it("handles many activities", () => {
    const activities = Array.from({ length: 30 }, (_, i) =>
      makeActivity({ id: `a${i}`, childChose: i % 3 === 0 }),
    );
    const result = evaluateCulturalProvision(activities);
    expect(result.totalActivities).toBe(30);
  });

  it("handles many dietary records", () => {
    const records = Array.from({ length: 20 }, (_, i) =>
      makeDietary({ id: `d${i}`, provision: i % 2 === 0 ? "fully_met" : "mostly_met" }),
    );
    const result = evaluateDietaryRespect(records);
    expect(result.totalRecords).toBe(20);
  });

  it("handles many staff", () => {
    const staff = Array.from({ length: 15 }, (_, i) =>
      makeStaff({ id: `s${i}`, competenceLevel: i % 3 === 0 ? "advanced" : "developing" }),
    );
    const result = evaluateStaffCompetence(staff);
    expect(result.totalStaff).toBe(15);
  });

  it("handles all identity dimensions", () => {
    const dims: IdentityDimension[] = ["ethnicity", "religion", "language", "heritage", "disability", "gender_identity", "sexual_orientation", "nationality", "family_traditions"];
    const assessments = dims.map((dim, i) =>
      makeAssessment({ id: `a${i}`, dimension: dim }),
    );
    const result = evaluateIdentityRecognition(assessments);
    expect(result.dimensionsCovered).toBe(9);
  });

  it("handles all support levels", () => {
    const levels: SupportLevel[] = ["fully_supported", "mostly_supported", "partially_supported", "not_supported", "not_assessed"];
    const assessments = levels.map((level, i) =>
      makeAssessment({ id: `a${i}`, supportLevel: level }),
    );
    const result = evaluateIdentityRecognition(assessments);
    expect(result.totalAssessments).toBe(5);
    // fully + mostly = 2/5 = 40%
    expect(result.fullySupportedRate).toBe(40);
    expect(result.notAssessedCount).toBe(1);
  });

  it("handles all dietary provisions", () => {
    const provisions: DietaryProvision[] = ["fully_met", "mostly_met", "partially_met", "not_met", "not_applicable"];
    const records = provisions.map((prov, i) =>
      makeDietary({ id: `d${i}`, provision: prov }),
    );
    const result = evaluateDietaryRespect(records);
    expect(result.totalRecords).toBe(5);
    // 4 applicable, 1 fully met = 25%
    expect(result.fullyMetRate).toBe(25);
  });

  it("handles all activity types", () => {
    const types: CulturalActivityType[] = ["religious_observance", "cultural_celebration", "language_maintenance", "food_preparation", "community_connection", "heritage_exploration", "identity_work", "life_story"];
    const activities = types.map((type, i) =>
      makeActivity({ id: `a${i}`, activityType: type }),
    );
    const result = evaluateCulturalProvision(activities);
    expect(result.activityVariety).toBe(8);
  });

  it("handles all competence levels", () => {
    const levels: StaffCompetenceLevel[] = ["advanced", "competent", "developing", "needs_training"];
    const staff = levels.map((level, i) =>
      makeStaff({ id: `s${i}`, competenceLevel: level }),
    );
    const result = evaluateStaffCompetence(staff);
    expect(result.totalStaff).toBe(4);
    expect(result.competentAdvancedRate).toBe(50);
  });

  it("handles mixed not_applicable and real dietary records", () => {
    const records = [
      makeDietary({ id: "d1", provision: "not_applicable" }),
      makeDietary({ id: "d2", provision: "not_applicable" }),
      makeDietary({ id: "d3", provision: "fully_met", childSatisfied: true, reviewDate: "2026-03-01" }),
    ];
    const result = evaluateDietaryRespect(records);
    expect(result.totalRecords).toBe(3);
    // Only 1 applicable, which is fully met
    expect(result.fullyMetRate).toBe(100);
  });
});
