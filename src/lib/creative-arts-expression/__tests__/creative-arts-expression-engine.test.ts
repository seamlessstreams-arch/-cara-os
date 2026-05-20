import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getArtFormLabel,
  getExpressionLevelLabel,
  getRatingLabel,
  evaluateArtsQuality,
  evaluateArtsCompliance,
  evaluateArtsPolicy,
  evaluateStaffCreativeArtsReadiness,
  buildChildCreativeArtsProfiles,
  generateCreativeArtsExpressionIntelligence,
} from "../creative-arts-expression-engine";
import type {
  ArtsSession,
  CreativeArtsPolicy,
  StaffCreativeArtsTraining,
  ArtForm,
} from "../creative-arts-expression-engine";

// ── Factories ────────────────────────────────────────────────────────────────

let _sid = 0;
function makeSession(overrides: Partial<ArtsSession> = {}): ArtsSession {
  _sid++;
  return {
    id: `s-${_sid}`,
    childId: "child-1",
    childName: "Alex",
    sessionDate: "2026-03-01",
    artForm: "visual_art",
    expressionLevel: "highly_expressive",
    creativityDemonstrated: true,
    confidenceGrown: true,
    therapeuticBenefit: true,
    documentedInPlan: true,
    staffFacilitated: true,
    feedbackGiven: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<CreativeArtsPolicy> = {}): CreativeArtsPolicy {
  return {
    id: "p-1",
    artsEducationStrategy: true,
    therapeuticArtsFramework: true,
    resourceProvisionPlan: true,
    externalPartnerships: true,
    exhibitionAndShowcasePolicy: true,
    inclusiveAccessGuidance: true,
    regularReview: true,
    ...overrides,
  };
}

let _tid = 0;
function makeTraining(overrides: Partial<StaffCreativeArtsTraining> = {}): StaffCreativeArtsTraining {
  _tid++;
  return {
    id: `t-${_tid}`,
    staffId: `staff-${_tid}`,
    staffName: `Staff ${_tid}`,
    artsFacilitation: true,
    therapeuticArtsAwareness: true,
    creativeConfidenceBuilding: true,
    inclusivePractice: true,
    culturalArtsForms: true,
    safeguardingInArts: true,
    ...overrides,
  };
}

// ── pct ──────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });
  it("returns correct percentage", () => {
    expect(pct(3, 4)).toBe(75);
  });
  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });
  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });
  it("returns 0 for 0 numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ── getRating ────────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ── Label functions ──────────────────────────────────────────────────────────

describe("label functions", () => {
  it("getArtFormLabel returns all 8 labels", () => {
    expect(getArtFormLabel("visual_art")).toBe("Visual Art");
    expect(getArtFormLabel("music")).toBe("Music");
    expect(getArtFormLabel("drama")).toBe("Drama");
    expect(getArtFormLabel("dance")).toBe("Dance");
    expect(getArtFormLabel("creative_writing")).toBe("Creative Writing");
    expect(getArtFormLabel("photography")).toBe("Photography");
    expect(getArtFormLabel("craft_design")).toBe("Craft & Design");
    expect(getArtFormLabel("digital_media")).toBe("Digital Media");
  });

  it("getExpressionLevelLabel returns all 5 labels", () => {
    expect(getExpressionLevelLabel("highly_expressive")).toBe("Highly Expressive");
    expect(getExpressionLevelLabel("expressive")).toBe("Expressive");
    expect(getExpressionLevelLabel("moderate")).toBe("Moderate");
    expect(getExpressionLevelLabel("limited")).toBe("Limited");
    expect(getExpressionLevelLabel("disengaged")).toBe("Disengaged");
  });

  it("getRatingLabel returns all 4 labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateArtsQuality ──────────────────────────────────────────────────────

describe("evaluateArtsQuality", () => {
  it("returns all zeros for empty array", () => {
    const r = evaluateArtsQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalSessions).toBe(0);
    expect(r.expressionRate).toBe(0);
    expect(r.creativityRate).toBe(0);
    expect(r.confidenceRate).toBe(0);
    expect(r.therapeuticRate).toBe(0);
  });

  it("scores max 25 with all perfect data", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession());
    const r = evaluateArtsQuality(sessions);
    expect(r.overallScore).toBe(25);
    expect(r.expressionRate).toBe(100);
    expect(r.creativityRate).toBe(100);
    expect(r.confidenceRate).toBe(100);
    expect(r.therapeuticRate).toBe(100);
  });

  it("counts highly_expressive and expressive as positive expression", () => {
    const sessions = [
      makeSession({ expressionLevel: "highly_expressive" }),
      makeSession({ expressionLevel: "expressive" }),
      makeSession({ expressionLevel: "moderate" }),
      makeSession({ expressionLevel: "limited" }),
    ];
    const r = evaluateArtsQuality(sessions);
    expect(r.expressionRate).toBe(50);
  });

  it("calculates individual rates correctly", () => {
    const sessions = [
      makeSession({ creativityDemonstrated: true, confidenceGrown: false, therapeuticBenefit: false }),
      makeSession({ creativityDemonstrated: false, confidenceGrown: true, therapeuticBenefit: false }),
      makeSession({ creativityDemonstrated: false, confidenceGrown: false, therapeuticBenefit: true }),
      makeSession({ creativityDemonstrated: false, confidenceGrown: false, therapeuticBenefit: false }),
    ];
    const r = evaluateArtsQuality(sessions);
    expect(r.creativityRate).toBe(25);
    expect(r.confidenceRate).toBe(25);
    expect(r.therapeuticRate).toBe(25);
  });

  it("caps at 25", () => {
    const sessions = Array.from({ length: 20 }, () => makeSession());
    const r = evaluateArtsQuality(sessions);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateArtsCompliance ───────────────────────────────────────────────────

describe("evaluateArtsCompliance", () => {
  it("returns all zeros for empty array", () => {
    const r = evaluateArtsCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.documentedRate).toBe(0);
    expect(r.staffFacilitatedRate).toBe(0);
    expect(r.feedbackRate).toBe(0);
    expect(r.artFormDiversityRatio).toBe(0);
  });

  it("scores max 25 with all perfect data and diverse forms", () => {
    const forms: ArtForm[] = ["visual_art", "music", "drama", "dance", "creative_writing", "photography", "craft_design", "digital_media"];
    const sessions = forms.map((f) => makeSession({ artForm: f }));
    const r = evaluateArtsCompliance(sessions);
    expect(r.overallScore).toBe(25);
    expect(r.artFormDiversityRatio).toBe(100);
  });

  it("calculates documentation rate", () => {
    const sessions = [
      makeSession({ documentedInPlan: true }),
      makeSession({ documentedInPlan: true }),
      makeSession({ documentedInPlan: false }),
      makeSession({ documentedInPlan: false }),
    ];
    const r = evaluateArtsCompliance(sessions);
    expect(r.documentedRate).toBe(50);
  });

  it("calculates diversity ratio from unique art forms", () => {
    const sessions = [
      makeSession({ artForm: "visual_art" }),
      makeSession({ artForm: "music" }),
      makeSession({ artForm: "visual_art" }),
    ];
    const r = evaluateArtsCompliance(sessions);
    expect(r.artFormDiversityRatio).toBe(25); // 2/8 = 25%
  });

  it("caps at 25", () => {
    const forms: ArtForm[] = ["visual_art", "music", "drama", "dance", "creative_writing", "photography", "craft_design", "digital_media"];
    const sessions = forms.map((f) => makeSession({ artForm: f }));
    const r = evaluateArtsCompliance(sessions);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateArtsPolicy ───────────────────────────────────────────────────────

describe("evaluateArtsPolicy", () => {
  it("returns all zeros/false for null", () => {
    const r = evaluateArtsPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.artsEducationStrategy).toBe(false);
    expect(r.therapeuticArtsFramework).toBe(false);
    expect(r.resourceProvisionPlan).toBe(false);
    expect(r.externalPartnerships).toBe(false);
    expect(r.exhibitionAndShowcasePolicy).toBe(false);
    expect(r.inclusiveAccessGuidance).toBe(false);
    expect(r.regularReview).toBe(false);
  });

  it("scores 25 with all true", () => {
    const r = evaluateArtsPolicy(makePolicy());
    expect(r.overallScore).toBe(25);
  });

  it("weights first 4 at 4 points each", () => {
    const r1 = evaluateArtsPolicy(makePolicy({ therapeuticArtsFramework: false, resourceProvisionPlan: false, externalPartnerships: false, exhibitionAndShowcasePolicy: false, inclusiveAccessGuidance: false, regularReview: false }));
    expect(r1.overallScore).toBe(4);

    const r2 = evaluateArtsPolicy(makePolicy({ artsEducationStrategy: false, resourceProvisionPlan: false, externalPartnerships: false, exhibitionAndShowcasePolicy: false, inclusiveAccessGuidance: false, regularReview: false }));
    expect(r2.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    const r = evaluateArtsPolicy(makePolicy({ artsEducationStrategy: false, therapeuticArtsFramework: false, resourceProvisionPlan: false, externalPartnerships: false }));
    expect(r.overallScore).toBe(9); // 3+3+3
  });

  it("mirrors boolean values", () => {
    const r = evaluateArtsPolicy(makePolicy({ artsEducationStrategy: false, regularReview: false }));
    expect(r.artsEducationStrategy).toBe(false);
    expect(r.regularReview).toBe(false);
    expect(r.therapeuticArtsFramework).toBe(true);
  });

  it("all false yields 0", () => {
    const r = evaluateArtsPolicy(makePolicy({
      artsEducationStrategy: false, therapeuticArtsFramework: false, resourceProvisionPlan: false,
      externalPartnerships: false, exhibitionAndShowcasePolicy: false, inclusiveAccessGuidance: false, regularReview: false,
    }));
    expect(r.overallScore).toBe(0);
  });
});

// ── evaluateStaffCreativeArtsReadiness ───────────────────────────────────────

describe("evaluateStaffCreativeArtsReadiness", () => {
  it("returns all zeros for empty array", () => {
    const r = evaluateStaffCreativeArtsReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.artsFacilitationRate).toBe(0);
  });

  it("scores 25 with all staff fully trained", () => {
    const training = [makeTraining(), makeTraining(), makeTraining()];
    const r = evaluateStaffCreativeArtsReadiness(training);
    expect(r.overallScore).toBe(25);
    expect(r.totalStaff).toBe(3);
  });

  it("weights skills correctly 6+5+5+4+3+2=25", () => {
    const t = makeTraining();
    const r = evaluateStaffCreativeArtsReadiness([t]);
    expect(r.overallScore).toBe(25);
  });

  it("handles partial training", () => {
    const t = makeTraining({ artsFacilitation: true, therapeuticArtsAwareness: false, creativeConfidenceBuilding: false, inclusivePractice: false, culturalArtsForms: false, safeguardingInArts: false });
    const r = evaluateStaffCreativeArtsReadiness([t]);
    expect(r.artsFacilitationRate).toBe(100);
    expect(r.therapeuticArtsAwarenessRate).toBe(0);
    expect(r.overallScore).toBe(6); // only first skill weight
  });

  it("calculates mixed rates across multiple staff", () => {
    const t1 = makeTraining({ artsFacilitation: true, therapeuticArtsAwareness: true, creativeConfidenceBuilding: false, inclusivePractice: false, culturalArtsForms: false, safeguardingInArts: false });
    const t2 = makeTraining({ artsFacilitation: false, therapeuticArtsAwareness: false, creativeConfidenceBuilding: true, inclusivePractice: true, culturalArtsForms: false, safeguardingInArts: false });
    const r = evaluateStaffCreativeArtsReadiness([t1, t2]);
    expect(r.artsFacilitationRate).toBe(50);
    expect(r.therapeuticArtsAwarenessRate).toBe(50);
    expect(r.creativeConfidenceBuildingRate).toBe(50);
    expect(r.inclusivePracticeRate).toBe(50);
    expect(r.totalStaff).toBe(2);
  });
});

// ── buildChildCreativeArtsProfiles ───────────────────────────────────────────

describe("buildChildCreativeArtsProfiles", () => {
  it("returns empty array for empty sessions", () => {
    expect(buildChildCreativeArtsProfiles([])).toEqual([]);
  });

  it("groups sessions by childId", () => {
    const sessions = [
      makeSession({ childId: "c1", childName: "Alex" }),
      makeSession({ childId: "c1", childName: "Alex" }),
      makeSession({ childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildCreativeArtsProfiles(sessions);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].totalSessions).toBe(2);
    expect(profiles[1].totalSessions).toBe(1);
  });

  it("scores max 10 with many diverse high-quality sessions", () => {
    const forms: ArtForm[] = ["visual_art", "music", "drama", "dance", "creative_writing"];
    const sessions = Array.from({ length: 12 }, (_, i) =>
      makeSession({ childId: "c1", childName: "Alex", artForm: forms[i % forms.length] }),
    );
    const profiles = buildChildCreativeArtsProfiles(sessions);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("caps profile score at 10", () => {
    const forms: ArtForm[] = ["visual_art", "music", "drama", "dance", "creative_writing", "photography"];
    const sessions = Array.from({ length: 15 }, (_, i) =>
      makeSession({ childId: "c1", childName: "Alex", artForm: forms[i % forms.length] }),
    );
    const profiles = buildChildCreativeArtsProfiles(sessions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("frequency scoring: <5=0, 5-9=1, 10+=2", () => {
    const make = (n: number) => Array.from({ length: n }, () => makeSession({ childId: "cx", childName: "X", expressionLevel: "disengaged", creativityDemonstrated: false, artForm: "visual_art" }));
    const p1 = buildChildCreativeArtsProfiles(make(3));
    const p2 = buildChildCreativeArtsProfiles(make(5));
    const p3 = buildChildCreativeArtsProfiles(make(10));
    // freq=0 + expression=0 + creativity=0 + div=0 = 0
    expect(p1[0].overallScore).toBe(0);
    // freq=1 + ...
    expect(p2[0].overallScore).toBe(1);
    // freq=2 + ...
    expect(p3[0].overallScore).toBe(2);
  });
});

// ── generateCreativeArtsExpressionIntelligence ───────────────────────────────

describe("generateCreativeArtsExpressionIntelligence", () => {
  it("produces complete result with all data", () => {
    const forms: ArtForm[] = ["visual_art", "music", "drama", "dance", "creative_writing", "photography", "craft_design", "digital_media"];
    const sessions = forms.map((f, i) =>
      makeSession({ childId: i < 4 ? "c1" : "c2", childName: i < 4 ? "Alex" : "Jordan", artForm: f }),
    );
    const r = generateCreativeArtsExpressionIntelligence(sessions, makePolicy(), [makeTraining(), makeTraining()], "oak-house", "2026-01-01", "2026-05-20");

    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-20");
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(r.rating);
    expect(r.childProfiles.length).toBeGreaterThan(0);
    expect(r.regulatoryLinks.length).toBe(7);
  });

  it("returns max score 100 with perfect data", () => {
    const forms: ArtForm[] = ["visual_art", "music", "drama", "dance", "creative_writing", "photography", "craft_design", "digital_media"];
    const sessions = forms.map((f) => makeSession({ artForm: f }));
    const r = generateCreativeArtsExpressionIntelligence(sessions, makePolicy(), [makeTraining(), makeTraining()], "h1", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });

  it("returns 0 with no data", () => {
    const r = generateCreativeArtsExpressionIntelligence([], null, [], "h1", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
    expect(r.childProfiles).toEqual([]);
  });

  it("generates strengths when rates >= 80", () => {
    const forms: ArtForm[] = ["visual_art", "music", "drama", "dance", "creative_writing", "photography", "craft_design", "digital_media"];
    const sessions = forms.map((f) => makeSession({ artForm: f }));
    const r = generateCreativeArtsExpressionIntelligence(sessions, makePolicy(), [makeTraining()], "h1", "2026-01-01", "2026-06-01");
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions for missing policy and training", () => {
    const r = generateCreativeArtsExpressionIntelligence([], null, [], "h1", "2026-01-01", "2026-06-01");
    const urgent = r.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBe(2);
  });

  it("generates areas for improvement when rates < 60", () => {
    const sessions = [
      makeSession({ expressionLevel: "disengaged", creativityDemonstrated: false, confidenceGrown: false, therapeuticBenefit: false, staffFacilitated: false }),
      makeSession({ expressionLevel: "limited", creativityDemonstrated: false, confidenceGrown: false, therapeuticBenefit: false, staffFacilitated: false }),
    ];
    const r = generateCreativeArtsExpressionIntelligence(sessions, makePolicy(), [makeTraining()], "h1", "2026-01-01", "2026-06-01");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("caps overall score at 100", () => {
    const forms: ArtForm[] = ["visual_art", "music", "drama", "dance", "creative_writing", "photography", "craft_design", "digital_media"];
    const sessions = forms.map((f) => makeSession({ artForm: f }));
    const r = generateCreativeArtsExpressionIntelligence(sessions, makePolicy(), [makeTraining()], "h1", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
});
