import { describe, it, expect } from "vitest";
import {
  generateHygienePersonalCareIntelligence,
  evaluateQuality,
  evaluateCompliance,
  evaluatePolicy,
  evaluateStaffReadiness,
  buildChildProfiles,
  pct,
  getRating,
  getHygieneAreaLabel,
  getCompetencyLevelLabel,
  getRatingLabel,
} from "../hygiene-personal-care-engine";
import type {
  HygieneSession,
  HygienePolicy,
  StaffHygieneTraining,
} from "../hygiene-personal-care-engine";

// ── Test Helpers ─────────────────────────────────────────────────────────

function mkSession(overrides: Partial<HygieneSession> = {}): HygieneSession {
  return {
    id: "hs-1",
    childId: "child-1",
    childName: "Alex",
    sessionDate: "2026-04-15",
    hygieneArea: "oral_care",
    competencyLevel: "independent",
    childParticipated: true,
    dignityMaintained: true,
    progressNoted: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
    ...overrides,
  };
}

function mkPolicy(overrides: Partial<HygienePolicy> = {}): HygienePolicy {
  return {
    id: "hp-1",
    personalCareStrategy: true,
    dignityAndPrivacyProtocol: true,
    ageAppropriateGuidance: true,
    infectionControlProcedure: true,
    culturalSensitivityPolicy: true,
    staffTrainingRequirement: true,
    regularReview: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffHygieneTraining> = {}): StaffHygieneTraining {
  return {
    id: "sht-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    personalCareSkills: true,
    dignityAndPrivacy: true,
    infectionControl: true,
    ageAppropriateSupport: true,
    culturalAwareness: true,
    safeguardingInPersonalCare: true,
    ...overrides,
  };
}

// ── pct ──────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 for 0/0", () => {
    expect(pct(0, 0)).toBe(0);
  });
  it("calculates correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });
  it("rounds", () => {
    expect(pct(1, 3)).toBe(33);
  });
  it("returns 100 for equal values", () => {
    expect(pct(5, 5)).toBe(100);
  });
  it("returns 0 for 0 numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ── getRating ────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for 80+", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for <40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label Functions ──────────────────────────────────────────────────────

describe("getHygieneAreaLabel", () => {
  it("returns correct labels for all areas", () => {
    expect(getHygieneAreaLabel("oral_care")).toBe("Oral Care");
    expect(getHygieneAreaLabel("bathing_showering")).toBe("Bathing / Showering");
    expect(getHygieneAreaLabel("hand_washing")).toBe("Hand Washing");
    expect(getHygieneAreaLabel("hair_care")).toBe("Hair Care");
    expect(getHygieneAreaLabel("skincare")).toBe("Skincare");
    expect(getHygieneAreaLabel("nail_care")).toBe("Nail Care");
    expect(getHygieneAreaLabel("clothing_laundry")).toBe("Clothing & Laundry");
    expect(getHygieneAreaLabel("menstrual_hygiene")).toBe("Menstrual Hygiene");
  });
});

describe("getCompetencyLevelLabel", () => {
  it("returns correct labels for all levels", () => {
    expect(getCompetencyLevelLabel("independent")).toBe("Independent");
    expect(getCompetencyLevelLabel("mostly_independent")).toBe("Mostly Independent");
    expect(getCompetencyLevelLabel("developing")).toBe("Developing");
    expect(getCompetencyLevelLabel("requires_support")).toBe("Requires Support");
    expect(getCompetencyLevelLabel("not_started")).toBe("Not Started");
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels for all ratings", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateQuality ─────────────────────────────────────────────────────

describe("evaluateQuality", () => {
  it("returns zeros for empty sessions", () => {
    const r = evaluateQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalSessions).toBe(0);
    expect(r.competencyRate).toBe(0);
    expect(r.participationRate).toBe(0);
    expect(r.dignityRate).toBe(0);
    expect(r.progressRate).toBe(0);
  });

  it("scores 25 for perfect sessions", () => {
    const sessions = [mkSession(), mkSession({ id: "hs-2" })];
    const r = evaluateQuality(sessions);
    expect(r.overallScore).toBe(25);
    expect(r.totalSessions).toBe(2);
    expect(r.competencyRate).toBe(100);
    expect(r.participationRate).toBe(100);
    expect(r.dignityRate).toBe(100);
    expect(r.progressRate).toBe(100);
  });

  it("counts independent and mostly_independent as competent", () => {
    const sessions = [
      mkSession({ competencyLevel: "independent" }),
      mkSession({ id: "hs-2", competencyLevel: "mostly_independent" }),
      mkSession({ id: "hs-3", competencyLevel: "developing" }),
      mkSession({ id: "hs-4", competencyLevel: "requires_support" }),
    ];
    const r = evaluateQuality(sessions);
    expect(r.competencyRate).toBe(50);
  });

  it("scores lower when participation is mixed", () => {
    const sessions = [
      mkSession({ childParticipated: true }),
      mkSession({ id: "hs-2", childParticipated: false }),
    ];
    const r = evaluateQuality(sessions);
    expect(r.participationRate).toBe(50);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("scores lower when dignity is not always maintained", () => {
    const sessions = [
      mkSession({ dignityMaintained: true }),
      mkSession({ id: "hs-2", dignityMaintained: false }),
    ];
    const r = evaluateQuality(sessions);
    expect(r.dignityRate).toBe(50);
  });

  it("handles all false booleans", () => {
    const sessions = [mkSession({
      competencyLevel: "not_started",
      childParticipated: false,
      dignityMaintained: false,
      progressNoted: false,
    })];
    const r = evaluateQuality(sessions);
    expect(r.overallScore).toBe(0);
    expect(r.competencyRate).toBe(0);
    expect(r.participationRate).toBe(0);
    expect(r.dignityRate).toBe(0);
    expect(r.progressRate).toBe(0);
  });

  it("caps score at 25", () => {
    const sessions = Array.from({ length: 20 }, (_, i) => mkSession({ id: `hs-${i}` }));
    const r = evaluateQuality(sessions);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateCompliance ──────────────────────────────────────────────────

describe("evaluateCompliance", () => {
  it("returns zeros for empty sessions", () => {
    const r = evaluateCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.documentedRate).toBe(0);
    expect(r.staffSupportedRate).toBe(0);
    expect(r.feedbackRate).toBe(0);
    expect(r.hygieneAreaDiversityRatio).toBe(0);
  });

  it("scores 25 for perfect compliance with full diversity", () => {
    const areas: Array<HygieneSession["hygieneArea"]> = [
      "oral_care", "bathing_showering", "hand_washing", "hair_care",
      "skincare", "nail_care", "clothing_laundry", "menstrual_hygiene",
    ];
    const sessions = areas.map((area, i) => mkSession({ id: `hs-${i}`, hygieneArea: area }));
    const r = evaluateCompliance(sessions);
    expect(r.overallScore).toBe(25);
    expect(r.documentedRate).toBe(100);
    expect(r.staffSupportedRate).toBe(100);
    expect(r.feedbackRate).toBe(100);
    expect(r.hygieneAreaDiversityRatio).toBe(100);
  });

  it("calculates diversity ratio correctly for partial coverage", () => {
    const sessions = [
      mkSession({ hygieneArea: "oral_care" }),
      mkSession({ id: "hs-2", hygieneArea: "bathing_showering" }),
      mkSession({ id: "hs-3", hygieneArea: "hand_washing" }),
      mkSession({ id: "hs-4", hygieneArea: "hair_care" }),
    ];
    const r = evaluateCompliance(sessions);
    expect(r.hygieneAreaDiversityRatio).toBe(50);
  });

  it("scores lower when documentation is partial", () => {
    const sessions = [
      mkSession({ documentedInPlan: true }),
      mkSession({ id: "hs-2", documentedInPlan: false }),
    ];
    const r = evaluateCompliance(sessions);
    expect(r.documentedRate).toBe(50);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("handles single area with all false flags", () => {
    const sessions = [mkSession({
      documentedInPlan: false,
      staffSupported: false,
      feedbackGiven: false,
    })];
    const r = evaluateCompliance(sessions);
    expect(r.documentedRate).toBe(0);
    expect(r.staffSupportedRate).toBe(0);
    expect(r.feedbackRate).toBe(0);
    // 1 out of 8 areas = 13%
    expect(r.hygieneAreaDiversityRatio).toBe(13);
  });

  it("caps score at 25", () => {
    const areas: Array<HygieneSession["hygieneArea"]> = [
      "oral_care", "bathing_showering", "hand_washing", "hair_care",
      "skincare", "nail_care", "clothing_laundry", "menstrual_hygiene",
    ];
    const sessions = areas.map((area, i) => mkSession({ id: `hs-${i}`, hygieneArea: area }));
    const r = evaluateCompliance(sessions);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluatePolicy ──────────────────────────────────────────────────────

describe("evaluatePolicy", () => {
  it("returns zeros for null policy", () => {
    const r = evaluatePolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.personalCareStrategy).toBe(false);
    expect(r.dignityAndPrivacyProtocol).toBe(false);
    expect(r.ageAppropriateGuidance).toBe(false);
    expect(r.infectionControlProcedure).toBe(false);
    expect(r.culturalSensitivityPolicy).toBe(false);
    expect(r.staffTrainingRequirement).toBe(false);
    expect(r.regularReview).toBe(false);
  });

  it("scores 25 for full policy", () => {
    const r = evaluatePolicy(mkPolicy());
    expect(r.overallScore).toBe(25);
    expect(r.personalCareStrategy).toBe(true);
    expect(r.dignityAndPrivacyProtocol).toBe(true);
    expect(r.ageAppropriateGuidance).toBe(true);
    expect(r.infectionControlProcedure).toBe(true);
    expect(r.culturalSensitivityPolicy).toBe(true);
    expect(r.staffTrainingRequirement).toBe(true);
    expect(r.regularReview).toBe(true);
  });

  it("scores correctly for partial policy (top 4 only)", () => {
    const r = evaluatePolicy(mkPolicy({
      culturalSensitivityPolicy: false,
      staffTrainingRequirement: false,
      regularReview: false,
    }));
    expect(r.overallScore).toBe(16); // 4+4+4+4
  });

  it("scores correctly for bottom 3 only", () => {
    const r = evaluatePolicy(mkPolicy({
      personalCareStrategy: false,
      dignityAndPrivacyProtocol: false,
      ageAppropriateGuidance: false,
      infectionControlProcedure: false,
    }));
    expect(r.overallScore).toBe(9); // 3+3+3
  });

  it("mirrors all boolean fields", () => {
    const p = mkPolicy({ personalCareStrategy: false, regularReview: false });
    const r = evaluatePolicy(p);
    expect(r.personalCareStrategy).toBe(false);
    expect(r.regularReview).toBe(false);
    expect(r.dignityAndPrivacyProtocol).toBe(true);
  });

  it("caps score at 25", () => {
    const r = evaluatePolicy(mkPolicy());
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffReadiness ──────────────────────────────────────────────

describe("evaluateStaffReadiness", () => {
  it("returns zeros for empty training", () => {
    const r = evaluateStaffReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.personalCareSkillsRate).toBe(0);
    expect(r.dignityAndPrivacyRate).toBe(0);
    expect(r.infectionControlRate).toBe(0);
    expect(r.ageAppropriateSupportRate).toBe(0);
    expect(r.culturalAwarenessRate).toBe(0);
    expect(r.safeguardingInPersonalCareRate).toBe(0);
  });

  it("scores 25 for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "sht-2", staffId: "staff-2", staffName: "Tom" })];
    const r = evaluateStaffReadiness(training);
    expect(r.overallScore).toBe(25);
    expect(r.totalStaff).toBe(2);
    expect(r.personalCareSkillsRate).toBe(100);
    expect(r.dignityAndPrivacyRate).toBe(100);
    expect(r.infectionControlRate).toBe(100);
    expect(r.ageAppropriateSupportRate).toBe(100);
    expect(r.culturalAwarenessRate).toBe(100);
    expect(r.safeguardingInPersonalCareRate).toBe(100);
  });

  it("scores correctly when only top 2 skills are trained", () => {
    const training = [mkTraining({
      infectionControl: false,
      ageAppropriateSupport: false,
      culturalAwareness: false,
      safeguardingInPersonalCare: false,
    })];
    const r = evaluateStaffReadiness(training);
    expect(r.overallScore).toBe(11); // 6+5
    expect(r.personalCareSkillsRate).toBe(100);
    expect(r.dignityAndPrivacyRate).toBe(100);
    expect(r.infectionControlRate).toBe(0);
  });

  it("scores correctly for mixed training levels", () => {
    const training = [
      mkTraining(),
      mkTraining({
        id: "sht-2",
        staffId: "staff-2",
        staffName: "Tom",
        personalCareSkills: false,
        dignityAndPrivacy: false,
        infectionControl: false,
        ageAppropriateSupport: false,
        culturalAwareness: false,
        safeguardingInPersonalCare: false,
      }),
    ];
    const r = evaluateStaffReadiness(training);
    expect(r.personalCareSkillsRate).toBe(50);
    expect(r.dignityAndPrivacyRate).toBe(50);
    expect(r.totalStaff).toBe(2);
  });

  it("handles all untrained staff", () => {
    const training = [mkTraining({
      personalCareSkills: false,
      dignityAndPrivacy: false,
      infectionControl: false,
      ageAppropriateSupport: false,
      culturalAwareness: false,
      safeguardingInPersonalCare: false,
    })];
    const r = evaluateStaffReadiness(training);
    expect(r.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const training = [mkTraining()];
    const r = evaluateStaffReadiness(training);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── buildChildProfiles ──────────────────────────────────────────────────

describe("buildChildProfiles", () => {
  it("returns empty for no sessions", () => {
    expect(buildChildProfiles([])).toEqual([]);
  });

  it("builds profile for single child", () => {
    const sessions = [mkSession()];
    const profiles = buildChildProfiles(sessions);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-1");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalSessions).toBe(1);
  });

  it("builds profiles for multiple children", () => {
    const sessions = [
      mkSession({ childId: "child-1", childName: "Alex" }),
      mkSession({ id: "hs-2", childId: "child-2", childName: "Jordan" }),
    ];
    const profiles = buildChildProfiles(sessions);
    expect(profiles).toHaveLength(2);
  });

  it("scores 10 for a child with high frequency, competency, participation, and diversity", () => {
    const areas: Array<HygieneSession["hygieneArea"]> = [
      "oral_care", "bathing_showering", "hand_washing", "hair_care",
      "skincare", "nail_care", "clothing_laundry", "menstrual_hygiene",
      "oral_care", "bathing_showering",
    ];
    const sessions = areas.map((area, i) => mkSession({
      id: `hs-${i}`,
      hygieneArea: area,
      competencyLevel: "independent",
      childParticipated: true,
    }));
    const profiles = buildChildProfiles(sessions);
    expect(profiles[0].overallScore).toBe(10);
    // freq=10 -> 2, comp=100 -> 3, part=100 -> 3, diversity=8 -> 2 = 10
  });

  it("scores frequency correctly: <5 = 0, >=5 = 1, >=10 = 2", () => {
    // 4 sessions = 0 frequency points
    const sessions4 = Array.from({ length: 4 }, (_, i) => mkSession({
      id: `hs-${i}`,
      competencyLevel: "not_started",
      childParticipated: false,
    }));
    const profiles4 = buildChildProfiles(sessions4);
    expect(profiles4[0].overallScore).toBe(0);

    // 5 sessions = 1 frequency point
    const sessions5 = Array.from({ length: 5 }, (_, i) => mkSession({
      id: `hs-${i}`,
      competencyLevel: "not_started",
      childParticipated: false,
    }));
    const profiles5 = buildChildProfiles(sessions5);
    expect(profiles5[0].overallScore).toBe(1); // only freq

    // 10 sessions = 2 frequency points
    const sessions10 = Array.from({ length: 10 }, (_, i) => mkSession({
      id: `hs-${i}`,
      competencyLevel: "not_started",
      childParticipated: false,
    }));
    const profiles10 = buildChildProfiles(sessions10);
    expect(profiles10[0].overallScore).toBe(2); // only freq
  });

  it("scores competency tiers: <40=0, >=40=1, >=60=2, >=80=3", () => {
    // 1 of 4 competent = 25% -> 0
    const sessions25 = [
      mkSession({ id: "hs-0", competencyLevel: "independent", childParticipated: false }),
      mkSession({ id: "hs-1", competencyLevel: "not_started", childParticipated: false }),
      mkSession({ id: "hs-2", competencyLevel: "not_started", childParticipated: false }),
      mkSession({ id: "hs-3", competencyLevel: "not_started", childParticipated: false }),
    ];
    expect(buildChildProfiles(sessions25)[0].competencyRate).toBe(25);

    // 2 of 5 = 40% -> 1
    const sessions40 = [
      mkSession({ id: "hs-0", competencyLevel: "independent", childParticipated: false }),
      mkSession({ id: "hs-1", competencyLevel: "independent", childParticipated: false }),
      mkSession({ id: "hs-2", competencyLevel: "not_started", childParticipated: false }),
      mkSession({ id: "hs-3", competencyLevel: "not_started", childParticipated: false }),
      mkSession({ id: "hs-4", competencyLevel: "not_started", childParticipated: false }),
    ];
    const p40 = buildChildProfiles(sessions40)[0];
    expect(p40.competencyRate).toBe(40);
  });

  it("scores participation tiers correctly", () => {
    // 100% participation
    const sessions = [mkSession({ childParticipated: true, competencyLevel: "not_started" })];
    const profile = buildChildProfiles(sessions)[0];
    expect(profile.participationRate).toBe(100);
    // comp=0, part=100 -> 3, freq=0, div=0 = 3
    expect(profile.overallScore).toBe(3);
  });

  it("scores diversity correctly: <2=0, >=2=1, >=4=2", () => {
    // 1 area -> 0
    const sessions1 = [mkSession({ competencyLevel: "not_started", childParticipated: false })];
    expect(buildChildProfiles(sessions1)[0].overallScore).toBe(0);

    // 2 areas -> 1
    const sessions2 = [
      mkSession({ id: "hs-0", hygieneArea: "oral_care", competencyLevel: "not_started", childParticipated: false }),
      mkSession({ id: "hs-1", hygieneArea: "bathing_showering", competencyLevel: "not_started", childParticipated: false }),
    ];
    expect(buildChildProfiles(sessions2)[0].overallScore).toBe(1);

    // 4 areas -> 2
    const sessions4 = [
      mkSession({ id: "hs-0", hygieneArea: "oral_care", competencyLevel: "not_started", childParticipated: false }),
      mkSession({ id: "hs-1", hygieneArea: "bathing_showering", competencyLevel: "not_started", childParticipated: false }),
      mkSession({ id: "hs-2", hygieneArea: "hand_washing", competencyLevel: "not_started", childParticipated: false }),
      mkSession({ id: "hs-3", hygieneArea: "hair_care", competencyLevel: "not_started", childParticipated: false }),
    ];
    expect(buildChildProfiles(sessions4)[0].overallScore).toBe(2);
  });

  it("caps child score at 10", () => {
    const areas: Array<HygieneSession["hygieneArea"]> = [
      "oral_care", "bathing_showering", "hand_washing", "hair_care",
      "skincare", "nail_care", "clothing_laundry", "menstrual_hygiene",
      "oral_care", "bathing_showering",
    ];
    const sessions = areas.map((area, i) => mkSession({ id: `hs-${i}`, hygieneArea: area }));
    const profiles = buildChildProfiles(sessions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });
});

// ── generateHygienePersonalCareIntelligence ─────────────────────────────

describe("generateHygienePersonalCareIntelligence", () => {
  const fullPolicy = mkPolicy();
  const fullTraining = [
    mkTraining(),
    mkTraining({ id: "sht-2", staffId: "staff-2", staffName: "Tom Richards" }),
  ];

  it("returns a valid result with all empty inputs", () => {
    const r = generateHygienePersonalCareIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-20");
    expect(r.childProfiles).toEqual([]);
    expect(r.quality.overallScore).toBe(0);
    expect(r.compliance.overallScore).toBe(0);
    expect(r.policy.overallScore).toBe(0);
    expect(r.staffReadiness.overallScore).toBe(0);
  });

  it("scores 100 for perfect inputs", () => {
    const areas: Array<HygieneSession["hygieneArea"]> = [
      "oral_care", "bathing_showering", "hand_washing", "hair_care",
      "skincare", "nail_care", "clothing_laundry", "menstrual_hygiene",
    ];
    const sessions = areas.map((area, i) => mkSession({ id: `hs-${i}`, hygieneArea: area }));
    const r = generateHygienePersonalCareIntelligence(sessions, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20");
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });

  it("sums four evaluator scores correctly", () => {
    const sessions = [mkSession()];
    const r = generateHygienePersonalCareIntelligence(sessions, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20");
    const expected = r.quality.overallScore + r.compliance.overallScore + r.policy.overallScore + r.staffReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(100, expected));
  });

  it("generates correct rating based on score", () => {
    // With just full policy (25) and full training (25) = 50 + some sessions
    const sessions = [mkSession({ competencyLevel: "not_started", childParticipated: false, dignityMaintained: false, progressNoted: false, documentedInPlan: false, staffSupported: false, feedbackGiven: false })];
    const r = generateHygienePersonalCareIntelligence(sessions, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20");
    // quality ~0, compliance ~1 (1/8 diversity), policy 25, staff 25 = ~51
    expect(r.rating).toBe("requires_improvement");
  });

  it("includes regulatory links", () => {
    const r = generateHygienePersonalCareIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.regulatoryLinks).toHaveLength(7);
    expect(r.regulatoryLinks[0]).toContain("CHR 2015 Regulation 6");
    expect(r.regulatoryLinks[1]).toContain("CHR 2015 Regulation 10");
    expect(r.regulatoryLinks[6]).toContain("NICE");
  });

  it("generates strengths for perfect data", () => {
    const areas: Array<HygieneSession["hygieneArea"]> = [
      "oral_care", "bathing_showering", "hand_washing", "hair_care",
      "skincare", "nail_care", "clothing_laundry", "menstrual_hygiene",
    ];
    const sessions = areas.map((area, i) => mkSession({ id: `hs-${i}`, hygieneArea: area }));
    const r = generateHygienePersonalCareIntelligence(sessions, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20");
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.strengths.some((s) => s.includes("participation"))).toBe(true);
    expect(r.strengths.some((s) => s.includes("Dignity"))).toBe(true);
  });

  it("generates areas for improvement when empty data", () => {
    const r = generateHygienePersonalCareIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
    expect(r.areasForImprovement.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates actions when empty data", () => {
    const r = generateHygienePersonalCareIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.actions.length).toBeGreaterThan(0);
    expect(r.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates dignity action when dignity rate is below 100%", () => {
    const sessions = [
      mkSession({ dignityMaintained: true }),
      mkSession({ id: "hs-2", dignityMaintained: false }),
    ];
    const r = generateHygienePersonalCareIntelligence(sessions, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20");
    expect(r.actions.some((a) => a.includes("dignity") || a.includes("Regulation 10"))).toBe(true);
  });

  it("clamps overall score between 0 and 100", () => {
    const r = generateHygienePersonalCareIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("builds child profiles in the orchestrator", () => {
    const sessions = [
      mkSession({ childId: "child-1", childName: "Alex" }),
      mkSession({ id: "hs-2", childId: "child-2", childName: "Jordan" }),
    ];
    const r = generateHygienePersonalCareIntelligence(sessions, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20");
    expect(r.childProfiles).toHaveLength(2);
  });

  it("handles sessions-only (no policy, no training)", () => {
    const sessions = [mkSession()];
    const r = generateHygienePersonalCareIntelligence(sessions, null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.quality.overallScore).toBeGreaterThan(0);
    expect(r.policy.overallScore).toBe(0);
    expect(r.staffReadiness.overallScore).toBe(0);
  });

  it("handles policy-only (no sessions, no training)", () => {
    const r = generateHygienePersonalCareIntelligence([], fullPolicy, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.quality.overallScore).toBe(0);
    expect(r.policy.overallScore).toBe(25);
    expect(r.staffReadiness.overallScore).toBe(0);
  });

  it("generates improvement area for missing dignity protocol in policy", () => {
    const partialPolicy = mkPolicy({ dignityAndPrivacyProtocol: false });
    const r = generateHygienePersonalCareIntelligence([], partialPolicy, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.areasForImprovement.some((a) => a.includes("dignity and privacy protocol"))).toBe(true);
  });

  it("generates action for missing cultural sensitivity policy", () => {
    const partialPolicy = mkPolicy({ culturalSensitivityPolicy: false });
    const sessions = [mkSession()];
    const r = generateHygienePersonalCareIntelligence(sessions, partialPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20");
    expect(r.actions.some((a) => a.includes("cultural sensitivity"))).toBe(true);
  });
});
