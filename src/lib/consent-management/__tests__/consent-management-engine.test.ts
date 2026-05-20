import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getConsentCategoryLabel,
  getConsentStatusLabel,
  getRatingLabel,
  evaluateConsentQuality,
  evaluateConsentCompliance,
  evaluateConsentPolicy,
  evaluateStaffConsentReadiness,
  buildChildConsentProfiles,
  generateConsentManagementIntelligence,
} from "../consent-management-engine";
import type {
  ConsentRecord,
  ConsentPolicy,
  StaffConsentTraining,
} from "../consent-management-engine";

// ── Factory functions ───────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: "rec-1",
    childId: "child-1",
    childName: "Test Child",
    recordDate: "2026-03-01",
    category: "medical_treatment",
    status: "obtained",
    childViewsSought: true,
    consentDocumented: true,
    expiryTracked: true,
    parentCarerConsulted: true,
    staffRecorded: true,
    reviewScheduled: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ConsentPolicy> = {}): ConsentPolicy {
  return {
    id: "pol-1",
    consentFramework: true,
    informedConsentGuidance: true,
    capacityAssessmentProtocol: true,
    gillikCompetenceProcess: true,
    consentRefusalProcess: true,
    dataConsentProtocol: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffConsentTraining> = {}): StaffConsentTraining {
  return {
    id: "train-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    consentLawUnderstanding: true,
    capacityAssessment: true,
    gillikCompetence: true,
    documentationSkills: true,
    childParticipation: true,
    escalationProcess: true,
    ...overrides,
  };
}

// ── pct ─────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 5)).toBe(0);
  });
});

// ── getRating ───────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
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
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ── Label functions ─────────────────────────────────────────────────────────

describe("getConsentCategoryLabel", () => {
  it("returns Medical Treatment for medical_treatment", () => {
    expect(getConsentCategoryLabel("medical_treatment")).toBe("Medical Treatment");
  });

  it("returns Dental Treatment for dental_treatment", () => {
    expect(getConsentCategoryLabel("dental_treatment")).toBe("Dental Treatment");
  });

  it("returns Photography for photography", () => {
    expect(getConsentCategoryLabel("photography")).toBe("Photography");
  });

  it("returns Social Media for social_media", () => {
    expect(getConsentCategoryLabel("social_media")).toBe("Social Media");
  });

  it("returns Educational Trips for educational_trips", () => {
    expect(getConsentCategoryLabel("educational_trips")).toBe("Educational Trips");
  });

  it("returns Overnight Stays for overnight_stays", () => {
    expect(getConsentCategoryLabel("overnight_stays")).toBe("Overnight Stays");
  });

  it("returns Data Sharing for data_sharing", () => {
    expect(getConsentCategoryLabel("data_sharing")).toBe("Data Sharing");
  });

  it("returns Therapeutic Intervention for therapeutic_intervention", () => {
    expect(getConsentCategoryLabel("therapeutic_intervention")).toBe("Therapeutic Intervention");
  });
});

describe("getConsentStatusLabel", () => {
  it("returns Obtained for obtained", () => {
    expect(getConsentStatusLabel("obtained")).toBe("Obtained");
  });

  it("returns Pending for pending", () => {
    expect(getConsentStatusLabel("pending")).toBe("Pending");
  });

  it("returns Refused for refused", () => {
    expect(getConsentStatusLabel("refused")).toBe("Refused");
  });

  it("returns Expired for expired", () => {
    expect(getConsentStatusLabel("expired")).toBe("Expired");
  });

  it("returns Not Required for not_required", () => {
    expect(getConsentStatusLabel("not_required")).toBe("Not Required");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns Good for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns Inadequate for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateConsentQuality ──────────────────────────────────────────────────

describe("evaluateConsentQuality", () => {
  it("returns all zeros for empty records", () => {
    const r = evaluateConsentQuality([]);
    expect(r.obtainedRate).toBe(0);
    expect(r.childViewsRate).toBe(0);
    expect(r.documentedRate).toBe(0);
    expect(r.expiryTrackedRate).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("returns perfect scores for fully obtained, documented records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const r = evaluateConsentQuality(records);
    expect(r.obtainedRate).toBe(100);
    expect(r.childViewsRate).toBe(100);
    expect(r.documentedRate).toBe(100);
    expect(r.expiryTrackedRate).toBe(100);
    expect(r.overallScore).toBe(25);
  });

  it("calculates partial scores when some records are incomplete", () => {
    const records = [
      makeRecord(),
      makeRecord({ id: "rec-2", status: "pending", childViewsSought: false, consentDocumented: false, expiryTracked: false }),
    ];
    const r = evaluateConsentQuality(records);
    expect(r.obtainedRate).toBe(50);
    expect(r.childViewsRate).toBe(50);
    expect(r.documentedRate).toBe(50);
    expect(r.expiryTrackedRate).toBe(50);
    expect(r.overallScore).toBe(12.5);
  });

  it("caps score at 25", () => {
    const records = Array.from({ length: 20 }, (_, i) => makeRecord({ id: `rec-${i}` }));
    const r = evaluateConsentQuality(records);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts only obtained status for obtainedRate", () => {
    const records = [
      makeRecord({ status: "refused" }),
      makeRecord({ id: "rec-2", status: "expired" }),
      makeRecord({ id: "rec-3", status: "obtained" }),
    ];
    const r = evaluateConsentQuality(records);
    expect(r.obtainedRate).toBe(33);
  });
});

// ── evaluateConsentCompliance ───────────────────────────────────────────────

describe("evaluateConsentCompliance", () => {
  it("returns all zeros for empty records", () => {
    const r = evaluateConsentCompliance([]);
    expect(r.parentConsultedRate).toBe(0);
    expect(r.staffRecordedRate).toBe(0);
    expect(r.reviewScheduledRate).toBe(0);
    expect(r.categoryDiversityRatio).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("returns perfect scores for fully compliant records across all categories", () => {
    const categories = [
      "medical_treatment", "dental_treatment", "photography", "social_media",
      "educational_trips", "overnight_stays", "data_sharing", "therapeutic_intervention",
    ] as const;
    const records = categories.map((cat, i) => makeRecord({ id: `rec-${i}`, category: cat }));
    const r = evaluateConsentCompliance(records);
    expect(r.parentConsultedRate).toBe(100);
    expect(r.staffRecordedRate).toBe(100);
    expect(r.reviewScheduledRate).toBe(100);
    expect(r.categoryDiversityRatio).toBe(1);
    expect(r.overallScore).toBe(25);
  });

  it("calculates diversity ratio correctly for partial categories", () => {
    const records = [
      makeRecord({ category: "medical_treatment" }),
      makeRecord({ id: "rec-2", category: "dental_treatment" }),
      makeRecord({ id: "rec-3", category: "photography" }),
      makeRecord({ id: "rec-4", category: "social_media" }),
    ];
    const r = evaluateConsentCompliance(records);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });

  it("caps score at 25", () => {
    const categories = [
      "medical_treatment", "dental_treatment", "photography", "social_media",
      "educational_trips", "overnight_stays", "data_sharing", "therapeutic_intervention",
    ] as const;
    const records = categories.map((cat, i) => makeRecord({ id: `rec-${i}`, category: cat }));
    const r = evaluateConsentCompliance(records);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("reflects low compliance when booleans are false", () => {
    const records = [
      makeRecord({ parentCarerConsulted: false, staffRecorded: false, reviewScheduled: false }),
    ];
    const r = evaluateConsentCompliance(records);
    expect(r.parentConsultedRate).toBe(0);
    expect(r.staffRecordedRate).toBe(0);
    expect(r.reviewScheduledRate).toBe(0);
  });
});

// ── evaluateConsentPolicy ───────────────────────────────────────────────────

describe("evaluateConsentPolicy", () => {
  it("returns 0 and all false for null policy", () => {
    const r = evaluateConsentPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.consentFramework).toBe(false);
    expect(r.informedConsentGuidance).toBe(false);
    expect(r.capacityAssessmentProtocol).toBe(false);
    expect(r.gillikCompetenceProcess).toBe(false);
    expect(r.consentRefusalProcess).toBe(false);
    expect(r.dataConsentProtocol).toBe(false);
    expect(r.regularReview).toBe(false);
  });

  it("returns 25 for a fully compliant policy", () => {
    const r = evaluateConsentPolicy(makePolicy());
    expect(r.overallScore).toBe(25);
  });

  it("weights consentFramework at 4 points", () => {
    const allFalse = makePolicy({
      consentFramework: false, informedConsentGuidance: false,
      capacityAssessmentProtocol: false, gillikCompetenceProcess: false,
      consentRefusalProcess: false, dataConsentProtocol: false, regularReview: false,
    });
    const withFramework = makePolicy({
      consentFramework: true, informedConsentGuidance: false,
      capacityAssessmentProtocol: false, gillikCompetenceProcess: false,
      consentRefusalProcess: false, dataConsentProtocol: false, regularReview: false,
    });
    expect(evaluateConsentPolicy(withFramework).overallScore - evaluateConsentPolicy(allFalse).overallScore).toBe(4);
  });

  it("weights regularReview at 3 points", () => {
    const without = makePolicy({ regularReview: false });
    const diff = evaluateConsentPolicy(makePolicy()).overallScore - evaluateConsentPolicy(without).overallScore;
    expect(diff).toBe(3);
  });

  it("sums all 7 boolean weights to 25", () => {
    const full = evaluateConsentPolicy(makePolicy());
    expect(full.overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3);
  });

  it("returns partial score for partial policy", () => {
    const partial = makePolicy({
      consentFramework: true, informedConsentGuidance: true,
      capacityAssessmentProtocol: false, gillikCompetenceProcess: false,
      consentRefusalProcess: false, dataConsentProtocol: false, regularReview: false,
    });
    const r = evaluateConsentPolicy(partial);
    expect(r.overallScore).toBe(8);
  });
});

// ── evaluateStaffConsentReadiness ───────────────────────────────────────────

describe("evaluateStaffConsentReadiness", () => {
  it("returns all zeros for empty training array", () => {
    const r = evaluateStaffConsentReadiness([]);
    expect(r.consentLawRate).toBe(0);
    expect(r.capacityAssessmentRate).toBe(0);
    expect(r.gillikCompetenceRate).toBe(0);
    expect(r.documentationSkillsRate).toBe(0);
    expect(r.childParticipationRate).toBe(0);
    expect(r.escalationProcessRate).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("returns perfect scores for fully trained staff", () => {
    const training = [makeTraining(), makeTraining({ id: "train-2", staffId: "staff-2", staffName: "Staff Two" })];
    const r = evaluateStaffConsentReadiness(training);
    expect(r.consentLawRate).toBe(100);
    expect(r.overallScore).toBe(25);
  });

  it("calculates partial rates correctly", () => {
    const training = [
      makeTraining(),
      makeTraining({
        id: "train-2", staffId: "staff-2", staffName: "Staff Two",
        consentLawUnderstanding: false, capacityAssessment: false,
        gillikCompetence: false, documentationSkills: false,
        childParticipation: false, escalationProcess: false,
      }),
    ];
    const r = evaluateStaffConsentReadiness(training);
    expect(r.consentLawRate).toBe(50);
    expect(r.capacityAssessmentRate).toBe(50);
    expect(r.overallScore).toBe(12.5);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `train-${i}`, staffId: `staff-${i}`, staffName: `Staff ${i}` }),
    );
    const r = evaluateStaffConsentReadiness(training);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("weights consentLawUnderstanding at 6 points", () => {
    const noLaw = makeTraining({
      consentLawUnderstanding: false, capacityAssessment: false,
      gillikCompetence: false, documentationSkills: false,
      childParticipation: false, escalationProcess: false,
    });
    const withLaw = makeTraining({
      consentLawUnderstanding: true, capacityAssessment: false,
      gillikCompetence: false, documentationSkills: false,
      childParticipation: false, escalationProcess: false,
    });
    const diff = evaluateStaffConsentReadiness([withLaw]).overallScore - evaluateStaffConsentReadiness([noLaw]).overallScore;
    expect(diff).toBe(6);
  });
});

// ── buildChildConsentProfiles ───────────────────────────────────────────────

describe("buildChildConsentProfiles", () => {
  it("returns empty array for empty records", () => {
    expect(buildChildConsentProfiles([])).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Child One" }),
      makeRecord({ id: "rec-2", childId: "c2", childName: "Child Two" }),
      makeRecord({ id: "rec-3", childId: "c1", childName: "Child One" }),
    ];
    const profiles = buildChildConsentProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "c1")!.totalRecords).toBe(2);
    expect(profiles.find((p) => p.childId === "c2")!.totalRecords).toBe(1);
  });

  it("gives freq score 2 for >= 10 records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "c1", childName: "Child One", category: "medical_treatment" }),
    );
    const profiles = buildChildConsentProfiles(records);
    // freq=2, obtainedRate=100 -> 3, childViewsRate=100 -> 3, diversity=1 category -> 0 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("gives freq score 1 for >= 5 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "c1", childName: "Child One", category: "medical_treatment" }),
    );
    const profiles = buildChildConsentProfiles(records);
    // freq=1, obtainedRate=100 -> 3, childViewsRate=100 -> 3, diversity=1 -> 0 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("gives freq score 0 for < 5 records", () => {
    const records = [makeRecord({ childId: "c1", childName: "Child One" })];
    const profiles = buildChildConsentProfiles(records);
    // freq=0, obtainedRate=100 -> 3, childViewsRate=100 -> 3, diversity=1 -> 0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("caps child score at 10", () => {
    const categories = [
      "medical_treatment", "dental_treatment", "photography", "social_media",
      "educational_trips", "overnight_stays", "data_sharing", "therapeutic_intervention",
    ] as const;
    // 10+ records, all obtained, all child views, 8 categories = 2+3+3+2 = 10
    const records = [
      ...categories.map((cat, i) => makeRecord({ id: `rec-${i}`, childId: "c1", childName: "Child One", category: cat })),
      makeRecord({ id: "rec-extra-1", childId: "c1", childName: "Child One", category: "medical_treatment" }),
      makeRecord({ id: "rec-extra-2", childId: "c1", childName: "Child One", category: "dental_treatment" }),
    ];
    const profiles = buildChildConsentProfiles(records);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("gives diversity score 2 for >= 4 unique categories", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "C1", category: "medical_treatment" }),
      makeRecord({ id: "r2", childId: "c1", childName: "C1", category: "dental_treatment" }),
      makeRecord({ id: "r3", childId: "c1", childName: "C1", category: "photography" }),
      makeRecord({ id: "r4", childId: "c1", childName: "C1", category: "social_media" }),
    ];
    const profiles = buildChildConsentProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(4);
    // freq=0, obtained=100->3, childViews=100->3, diversity=4->2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("gives diversity score 1 for >= 2 unique categories", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "C1", category: "medical_treatment" }),
      makeRecord({ id: "r2", childId: "c1", childName: "C1", category: "dental_treatment" }),
    ];
    const profiles = buildChildConsentProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(2);
    // freq=0, obtained=100->3, childViews=100->3, diversity=2->1 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("gives diversity score 0 for 1 unique category", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "C1", category: "medical_treatment" }),
    ];
    const profiles = buildChildConsentProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(1);
  });

  it("calculates obtainedRate per child correctly", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "C1", status: "obtained" }),
      makeRecord({ id: "r2", childId: "c1", childName: "C1", status: "pending" }),
      makeRecord({ id: "r3", childId: "c1", childName: "C1", status: "refused" }),
    ];
    const profiles = buildChildConsentProfiles(records);
    expect(profiles[0].obtainedRate).toBe(33);
  });

  it("calculates childViewsRate per child correctly", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "C1", childViewsSought: true }),
      makeRecord({ id: "r2", childId: "c1", childName: "C1", childViewsSought: false }),
    ];
    const profiles = buildChildConsentProfiles(records);
    expect(profiles[0].childViewsRate).toBe(50);
  });
});

// ── generateConsentManagementIntelligence ───────────────────────────────────

describe("generateConsentManagementIntelligence", () => {
  it("returns complete result with all sections", () => {
    const result = generateConsentManagementIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.consentQuality).toBeDefined();
    expect(result.consentCompliance).toBeDefined();
    expect(result.consentPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("produces overallScore of 100 for perfect inputs", () => {
    const categories = [
      "medical_treatment", "dental_treatment", "photography", "social_media",
      "educational_trips", "overnight_stays", "data_sharing", "therapeutic_intervention",
    ] as const;
    const records = categories.map((cat, i) => makeRecord({ id: `rec-${i}`, category: cat }));
    const result = generateConsentManagementIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("produces overallScore of 0 for empty inputs", () => {
    const result = generateConsentManagementIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overallScore at 100", () => {
    const categories = [
      "medical_treatment", "dental_treatment", "photography", "social_media",
      "educational_trips", "overnight_stays", "data_sharing", "therapeutic_intervention",
    ] as const;
    const records = categories.map((cat, i) => makeRecord({ id: `rec-${i}`, category: cat }));
    const result = generateConsentManagementIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes URGENT action when policy score is 0", () => {
    const result = generateConsentManagementIntelligence(
      [makeRecord()], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
    expect(result.actions.some((a) => a.includes("policy"))).toBe(true);
  });

  it("includes URGENT action when staff score is 0", () => {
    const result = generateConsentManagementIntelligence(
      [makeRecord()], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
    expect(result.actions.some((a) => a.includes("training"))).toBe(true);
  });

  it("lists strengths when evaluator score >= 20", () => {
    const categories = [
      "medical_treatment", "dental_treatment", "photography", "social_media",
      "educational_trips", "overnight_stays", "data_sharing", "therapeutic_intervention",
    ] as const;
    const records = categories.map((cat, i) => makeRecord({ id: `rec-${i}`, category: cat }));
    const result = generateConsentManagementIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("lists areas for improvement when evaluator score < 15", () => {
    const records = [
      makeRecord({ status: "pending", childViewsSought: false, consentDocumented: false, expiryTracked: false }),
    ];
    const result = generateConsentManagementIntelligence(
      records, null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateConsentManagementIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("regulatory links reference consent-related regulations", () => {
    const result = generateConsentManagementIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Gillick"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("GDPR") || l.includes("Data Protection"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Mental Capacity"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex" }),
      makeRecord({ id: "rec-2", childId: "c2", childName: "Jordan" }),
    ];
    const result = generateConsentManagementIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  it("generates conditional actions when obtainedRate < 50", () => {
    const records = [
      makeRecord({ status: "pending" }),
      makeRecord({ id: "rec-2", status: "refused" }),
      makeRecord({ id: "rec-3", status: "expired" }),
    ];
    const result = generateConsentManagementIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("obtained consents"))).toBe(true);
  });

  it("generates conditional actions when childViewsRate < 50", () => {
    const records = [
      makeRecord({ childViewsSought: false }),
      makeRecord({ id: "rec-2", childViewsSought: false }),
      makeRecord({ id: "rec-3", childViewsSought: false }),
    ];
    const result = generateConsentManagementIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("child participation"))).toBe(true);
  });

  it("assigns valid rating value", () => {
    const result = generateConsentManagementIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("no strengths when all evaluators score below 20", () => {
    const records = [
      makeRecord({
        status: "pending", childViewsSought: false, consentDocumented: false,
        expiryTracked: false, parentCarerConsulted: false, staffRecorded: false, reviewScheduled: false,
      }),
    ];
    const policy = makePolicy({
      consentFramework: true, informedConsentGuidance: false,
      capacityAssessmentProtocol: false, gillikCompetenceProcess: false,
      consentRefusalProcess: false, dataConsentProtocol: false, regularReview: false,
    });
    const training = [makeTraining({
      consentLawUnderstanding: false, capacityAssessment: false,
      gillikCompetence: false, documentationSkills: false,
      childParticipation: false, escalationProcess: false,
    })];
    const result = generateConsentManagementIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.strengths).toHaveLength(0);
  });
});
