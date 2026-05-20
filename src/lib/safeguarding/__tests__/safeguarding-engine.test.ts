import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getSafeguardingCategoryLabel,
  getSafeguardingOutcomeLabel,
  getRatingLabel,
  evaluateSafeguardingQuality,
  evaluateSafeguardingCompliance,
  evaluateSafeguardingPolicy,
  evaluateStaffSafeguardingReadiness,
  buildChildSafeguardingProfiles,
  generateSafeguardingIntelligence,
} from "../safeguarding-engine";
import type {
  SafeguardingRecord,
  SafeguardingPolicy,
  StaffSafeguardingTraining,
} from "../safeguarding-engine";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<SafeguardingRecord> = {}): SafeguardingRecord {
  return {
    id: "sg-001",
    homeId: "home-oak",
    date: "2026-05-01",
    childId: "child-alex",
    childName: "Alex",
    category: "concern_raised",
    outcome: "action_taken",
    timelyResponse: true,
    childViewCaptured: true,
    multiAgencyEngaged: true,
    riskAssessmentUpdated: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makeFullPolicy(): SafeguardingPolicy {
  return {
    safeguardingPolicy: true,
    whistleblowingPolicy: true,
    childProtectionProcedure: true,
    escortionPolicy: true,
    onlineSafetyPolicy: true,
    allegationsAgainstStaffPolicy: true,
    preventDutyPolicy: true,
  };
}

function makeFullStaff(): StaffSafeguardingTraining {
  return {
    staffId: "staff-sarah",
    safeguardingLevel3: true,
    childProtectionAwareness: true,
    preventDutyTraining: true,
    onlineSafetyTraining: true,
    concernRecordingSkills: true,
    multiAgencyWorkingKnowledge: true,
  };
}

// ── pct ───────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });
  it("returns 100 for perfect ratio", () => {
    expect(pct(10, 10)).toBe(100);
  });
  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });
  it("rounds correctly", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
  it("returns 0 for 0 numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ── getRating ─────────────────────────────────────────────────────────────

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

// ── Label helpers ─────────────────────────────────────────────────────────

describe("getSafeguardingCategoryLabel", () => {
  it("maps concern_raised", () => {
    expect(getSafeguardingCategoryLabel("concern_raised")).toBe("Concern Raised");
  });
  it("maps referral_made", () => {
    expect(getSafeguardingCategoryLabel("referral_made")).toBe("Referral Made");
  });
  it("maps strategy_meeting", () => {
    expect(getSafeguardingCategoryLabel("strategy_meeting")).toBe("Strategy Meeting");
  });
  it("maps all 8 categories", () => {
    const cats = ["concern_raised", "referral_made", "strategy_meeting", "risk_assessment", "chronology_update", "multi_agency_contact", "child_protection_review", "preventive_action"] as const;
    for (const c of cats) {
      expect(getSafeguardingCategoryLabel(c)).toBeTruthy();
    }
  });
});

describe("getSafeguardingOutcomeLabel", () => {
  it("maps action_taken", () => {
    expect(getSafeguardingOutcomeLabel("action_taken")).toBe("Action Taken");
  });
  it("maps all 5 outcomes", () => {
    const outcomes = ["action_taken", "referral_accepted", "no_further_action", "ongoing_monitoring", "not_applicable"] as const;
    for (const o of outcomes) {
      expect(getSafeguardingOutcomeLabel(o)).toBeTruthy();
    }
  });
});

describe("getRatingLabel", () => {
  it("maps outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("maps requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
});

// ── Evaluator 1: Quality ─────────────────────────────────────────────────

describe("evaluateSafeguardingQuality", () => {
  it("scores 25 for perfect records", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `sg-${i}` }));
    const result = evaluateSafeguardingQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.timelyResponseRate).toBe(100);
    expect(result.childViewCapturedRate).toBe(100);
    expect(result.multiAgencyEngagedRate).toBe(100);
    expect(result.riskAssessmentUpdatedRate).toBe(100);
  });

  it("scores 0 for empty records", () => {
    const result = evaluateSafeguardingQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("scores 0 for all-false quality flags", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `sg-${i}`, timelyResponse: false, childViewCaptured: false, multiAgencyEngaged: false, riskAssessmentUpdated: false })
    );
    const result = evaluateSafeguardingQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("weights timelyResponse highest (7)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `sg-${i}`, timelyResponse: true, childViewCaptured: false, multiAgencyEngaged: false, riskAssessmentUpdated: false })
    );
    const result = evaluateSafeguardingQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("handles mixed data", () => {
    const records = [
      makeRecord({ id: "sg-1" }),
      makeRecord({ id: "sg-2", childViewCaptured: false, riskAssessmentUpdated: false }),
    ];
    const result = evaluateSafeguardingQuality(records);
    expect(result.timelyResponseRate).toBe(100);
    expect(result.childViewCapturedRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("returns correct totalRecords", () => {
    const records = Array.from({ length: 7 }, (_, i) => makeRecord({ id: `sg-${i}` }));
    expect(evaluateSafeguardingQuality(records).totalRecords).toBe(7);
  });
});

// ── Evaluator 2: Compliance ──────────────────────────────────────────────

describe("evaluateSafeguardingCompliance", () => {
  it("scores 25 for perfect records with all categories", () => {
    const cats = ["concern_raised", "referral_made", "strategy_meeting", "risk_assessment", "chronology_update", "multi_agency_contact", "child_protection_review", "preventive_action"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `sg-${i}`, category: cat }));
    const result = evaluateSafeguardingCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("scores 0 for empty records", () => {
    const result = evaluateSafeguardingCompliance([]);
    expect(result.overallScore).toBe(0);
  });

  it("scores 0 for all-false compliance flags", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `sg-${i}`, documentationComplete: false, timelyRecording: false, childViewCaptured: false })
    );
    const result = evaluateSafeguardingCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
  });

  it("weights documentation highest (8)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `sg-${i}`, documentationComplete: true, timelyRecording: false, childViewCaptured: false })
    );
    const result = evaluateSafeguardingCompliance(records);
    expect(result.documentationRate).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(8);
  });

  it("calculates category diversity correctly", () => {
    const records = [
      makeRecord({ id: "sg-1", category: "concern_raised" }),
      makeRecord({ id: "sg-2", category: "referral_made" }),
      makeRecord({ id: "sg-3", category: "strategy_meeting" }),
      makeRecord({ id: "sg-4", category: "risk_assessment" }),
    ];
    const result = evaluateSafeguardingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(50);
  });
});

// ── Evaluator 3: Policy ──────────────────────────────────────────────────

describe("evaluateSafeguardingPolicy", () => {
  it("scores 25 for all true", () => {
    const result = evaluateSafeguardingPolicy(makeFullPolicy());
    expect(result.overallScore).toBe(25);
  });

  it("scores 0 for null", () => {
    const result = evaluateSafeguardingPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.safeguardingPolicy).toBe(false);
    expect(result.whistleblowingPolicy).toBe(false);
  });

  it("scores 0 for all false", () => {
    const result = evaluateSafeguardingPolicy({
      safeguardingPolicy: false,
      whistleblowingPolicy: false,
      childProtectionProcedure: false,
      escortionPolicy: false,
      onlineSafetyPolicy: false,
      allegationsAgainstStaffPolicy: false,
      preventDutyPolicy: false,
    });
    expect(result.overallScore).toBe(0);
  });

  it("first 4 booleans weighted at 4 each", () => {
    const result = evaluateSafeguardingPolicy({
      safeguardingPolicy: true,
      whistleblowingPolicy: true,
      childProtectionProcedure: true,
      escortionPolicy: true,
      onlineSafetyPolicy: false,
      allegationsAgainstStaffPolicy: false,
      preventDutyPolicy: false,
    });
    expect(result.overallScore).toBe(16);
  });

  it("last 3 booleans weighted at 3 each", () => {
    const result = evaluateSafeguardingPolicy({
      safeguardingPolicy: false,
      whistleblowingPolicy: false,
      childProtectionProcedure: false,
      escortionPolicy: false,
      onlineSafetyPolicy: true,
      allegationsAgainstStaffPolicy: true,
      preventDutyPolicy: true,
    });
    expect(result.overallScore).toBe(9);
  });

  it("preserves boolean values in result", () => {
    const policy = { ...makeFullPolicy(), preventDutyPolicy: false };
    const result = evaluateSafeguardingPolicy(policy);
    expect(result.preventDutyPolicy).toBe(false);
    expect(result.safeguardingPolicy).toBe(true);
  });
});

// ── Evaluator 4: Staff Readiness ─────────────────────────────────────────

describe("evaluateStaffSafeguardingReadiness", () => {
  it("scores 25 for all-skilled staff", () => {
    const staff = [makeFullStaff(), { ...makeFullStaff(), staffId: "staff-tom" }];
    const result = evaluateStaffSafeguardingReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(2);
  });

  it("scores 0 for empty staff", () => {
    const result = evaluateStaffSafeguardingReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("scores 0 for all-false skills", () => {
    const staff: StaffSafeguardingTraining[] = [{
      staffId: "staff-sarah",
      safeguardingLevel3: false,
      childProtectionAwareness: false,
      preventDutyTraining: false,
      onlineSafetyTraining: false,
      concernRecordingSkills: false,
      multiAgencyWorkingKnowledge: false,
    }];
    const result = evaluateStaffSafeguardingReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("weights safeguardingLevel3 highest (6)", () => {
    const staff: StaffSafeguardingTraining[] = [{
      staffId: "staff-sarah",
      safeguardingLevel3: true,
      childProtectionAwareness: false,
      preventDutyTraining: false,
      onlineSafetyTraining: false,
      concernRecordingSkills: false,
      multiAgencyWorkingKnowledge: false,
    }];
    const result = evaluateStaffSafeguardingReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("weights multiAgencyWorkingKnowledge lowest (2)", () => {
    const staff: StaffSafeguardingTraining[] = [{
      staffId: "staff-sarah",
      safeguardingLevel3: false,
      childProtectionAwareness: false,
      preventDutyTraining: false,
      onlineSafetyTraining: false,
      concernRecordingSkills: false,
      multiAgencyWorkingKnowledge: true,
    }];
    const result = evaluateStaffSafeguardingReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("handles mixed skills across staff", () => {
    const staff: StaffSafeguardingTraining[] = [
      makeFullStaff(),
      { ...makeFullStaff(), staffId: "staff-tom", safeguardingLevel3: false, preventDutyTraining: false },
    ];
    const result = evaluateStaffSafeguardingReadiness(staff);
    expect(result.safeguardingLevel3Rate).toBe(50);
    expect(result.preventDutyTrainingRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });
});

// ── Child Profiles ───────────────────────────────────────────────────────

describe("buildChildSafeguardingProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildSafeguardingProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      makeRecord({ id: "sg-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "sg-2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "sg-3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildSafeguardingProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("scores 10 for perfect child (many records, high rates, diverse)", () => {
    const cats = ["concern_raised", "referral_made", "strategy_meeting", "risk_assessment", "chronology_update"] as const;
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `sg-${i}`, childId: "child-alex", childName: "Alex", category: cats[i % cats.length] })
    );
    const profiles = buildChildSafeguardingProfiles(records);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("scores frequency: >=10 records -> 2, >=5 -> 1, <5 -> 0", () => {
    const records = Array.from({ length: 3 }, (_, i) => makeRecord({ id: `sg-${i}` }));
    const profiles = buildChildSafeguardingProfiles(records);
    // 3 records → freq:0 + rate1:3 + rate2:3 + diversity:0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("sorts by overallScore descending", () => {
    const records = [
      makeRecord({ id: "sg-1", childId: "child-alex", childName: "Alex" }),
      ...Array.from({ length: 10 }, (_, i) =>
        makeRecord({ id: `sg-j${i}`, childId: "child-jordan", childName: "Jordan", category: (["concern_raised", "referral_made", "strategy_meeting", "risk_assessment"] as const)[i % 4] })
      ),
    ];
    const profiles = buildChildSafeguardingProfiles(records);
    expect(profiles[0].childId).toBe("child-jordan");
  });

  it("caps at 10", () => {
    const cats = ["concern_raised", "referral_made", "strategy_meeting", "risk_assessment", "chronology_update", "multi_agency_contact"] as const;
    const records = Array.from({ length: 15 }, (_, i) =>
      makeRecord({ id: `sg-${i}`, childId: "child-alex", childName: "Alex", category: cats[i % cats.length] })
    );
    const profiles = buildChildSafeguardingProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("includes categoriesCovered list", () => {
    const records = [
      makeRecord({ id: "sg-1", category: "concern_raised" }),
      makeRecord({ id: "sg-2", category: "referral_made" }),
      makeRecord({ id: "sg-3", category: "concern_raised" }),
    ];
    const profiles = buildChildSafeguardingProfiles(records);
    expect(profiles[0].categoriesCovered).toEqual(expect.arrayContaining(["concern_raised", "referral_made"]));
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });
});

// ── Orchestrator ──────────────────────────────────────────────────────────

describe("generateSafeguardingIntelligence", () => {
  it("returns outstanding for perfect data", () => {
    const cats = ["concern_raised", "referral_made", "strategy_meeting", "risk_assessment", "chronology_update", "multi_agency_contact", "child_protection_review", "preventive_action"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `sg-${i}`, category: cat }));
    const staff = [makeFullStaff(), { ...makeFullStaff(), staffId: "staff-tom" }];

    const result = generateSafeguardingIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makeFullPolicy(),
      staff,
    });

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("returns inadequate for empty data", () => {
    const result = generateSafeguardingIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("returns good for decent but not perfect data", () => {
    const records = [
      makeRecord({ id: "sg-1", category: "concern_raised" }),
      makeRecord({ id: "sg-2", category: "referral_made", childViewCaptured: false }),
      makeRecord({ id: "sg-3", category: "strategy_meeting", multiAgencyEngaged: false }),
      makeRecord({ id: "sg-4", category: "risk_assessment", riskAssessmentUpdated: false, timelyRecording: false }),
      makeRecord({ id: "sg-5", category: "chronology_update", timelyResponse: false, documentationComplete: false }),
      makeRecord({ id: "sg-6", category: "concern_raised", childViewCaptured: false, multiAgencyEngaged: false }),
    ];
    const policy: SafeguardingPolicy = {
      safeguardingPolicy: true,
      whistleblowingPolicy: true,
      childProtectionProcedure: true,
      escortionPolicy: false,
      onlineSafetyPolicy: true,
      allegationsAgainstStaffPolicy: false,
      preventDutyPolicy: false,
    };
    const staff: StaffSafeguardingTraining[] = [
      makeFullStaff(),
      { ...makeFullStaff(), staffId: "staff-tom", safeguardingLevel3: false, preventDutyTraining: false, multiAgencyWorkingKnowledge: false },
    ];

    const result = generateSafeguardingIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy,
      staff,
    });

    expect(result.rating).toBe("good");
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
  });

  it("returns requires_improvement for weak data", () => {
    const records = [
      makeRecord({ id: "sg-1", category: "concern_raised", timelyResponse: false, multiAgencyEngaged: false, riskAssessmentUpdated: false, documentationComplete: false }),
      makeRecord({ id: "sg-2", category: "referral_made", childViewCaptured: false, multiAgencyEngaged: false, timelyRecording: false }),
      makeRecord({ id: "sg-3", category: "strategy_meeting", timelyResponse: false, childViewCaptured: false, riskAssessmentUpdated: false, documentationComplete: false, timelyRecording: false }),
      makeRecord({ id: "sg-4", category: "risk_assessment", timelyResponse: false, multiAgencyEngaged: false, riskAssessmentUpdated: false }),
      makeRecord({ id: "sg-5", category: "chronology_update" }),
    ];
    const policy: SafeguardingPolicy = {
      safeguardingPolicy: true,
      whistleblowingPolicy: true,
      childProtectionProcedure: true,
      escortionPolicy: false,
      onlineSafetyPolicy: false,
      allegationsAgainstStaffPolicy: false,
      preventDutyPolicy: false,
    };
    const staff: StaffSafeguardingTraining[] = [
      { staffId: "staff-sarah", safeguardingLevel3: true, childProtectionAwareness: true, preventDutyTraining: false, onlineSafetyTraining: false, concernRecordingSkills: true, multiAgencyWorkingKnowledge: false },
    ];

    const result = generateSafeguardingIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy,
      staff,
    });

    expect(result.rating).toBe("requires_improvement");
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThan(60);
  });

  it("caps overallScore at 100", () => {
    const cats = ["concern_raised", "referral_made", "strategy_meeting", "risk_assessment", "chronology_update", "multi_agency_contact", "child_protection_review", "preventive_action"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `sg-${i}`, category: cat }));
    const staff = [makeFullStaff()];

    const result = generateSafeguardingIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makeFullPolicy(),
      staff,
    });

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates strengths for excellent data", () => {
    const cats = ["concern_raised", "referral_made", "strategy_meeting", "risk_assessment", "chronology_update", "multi_agency_contact", "child_protection_review", "preventive_action"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `sg-${i}`, category: cat }));
    const staff = [makeFullStaff()];

    const result = generateSafeguardingIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makeFullPolicy(),
      staff,
    });

    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("populates actions for empty records", () => {
    const result = generateSafeguardingIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.actions.some(a => a.includes("URGENT"))).toBe(true);
  });

  it("includes correct metadata fields", () => {
    const result = generateSafeguardingIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes child profiles in result", () => {
    const records = [
      makeRecord({ id: "sg-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "sg-2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateSafeguardingIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });

    expect(result.childProfiles).toHaveLength(2);
  });
});
