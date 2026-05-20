// ══════════════════════════════════════════════════════════════════════════════
// Management Oversight Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getOversightCategoryLabel,
  getOversightOutcomeLabel,
  getRatingLabel,
  evaluateOversightQuality,
  evaluateOversightCompliance,
  evaluateOversightPolicy,
  evaluateStaffReadiness,
  buildChildOversightProfiles,
  generateManagementOversightIntelligence,
} from "../management-oversight-engine";
import type {
  OversightRecord,
  OversightPolicy,
  StaffOversightTraining,
  OversightCategory,
} from "../management-oversight-engine";

// ── Factory Functions ──────────────────────────────────────────────────────

function makeRecord(overrides: Partial<OversightRecord> = {}): OversightRecord {
  return {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-01",
    category: "case_file_audit",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: true,
    childImpactAssessed: true,
    staffFeedbackGiven: true,
    documentedProperly: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<OversightPolicy> = {}): OversightPolicy {
  return {
    id: "policy-001",
    oversightFramework: true,
    auditSchedule: true,
    qualityAssurancePlan: true,
    incidentReviewProtocol: true,
    performanceMonitoring: true,
    regulatoryCompliancePlan: true,
    continuousImprovementPolicy: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffOversightTraining> = {}): StaffOversightTraining {
  return {
    id: "train-001",
    staffId: "staff-sarah",
    staffName: "Sarah",
    auditSkills: true,
    qualityAssuranceKnowledge: true,
    regulatoryAwareness: true,
    leadershipCapability: true,
    dataAnalysis: true,
    reflectivePractice: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label functions", () => {
  it("getOversightCategoryLabel returns correct labels", () => {
    expect(getOversightCategoryLabel("case_file_audit")).toBe("Case File Audit");
    expect(getOversightCategoryLabel("reg44_monitoring")).toBe("Reg 44 Monitoring");
    expect(getOversightCategoryLabel("reg45_monitoring")).toBe("Reg 45 Monitoring");
  });

  it("getOversightOutcomeLabel returns correct labels", () => {
    expect(getOversightOutcomeLabel("compliant")).toBe("Compliant");
    expect(getOversightOutcomeLabel("non_compliant")).toBe("Non-Compliant");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Oversight Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateOversightQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateOversightQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.thoroughRate).toBe(0);
  });

  it("returns max score (25) for perfect records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateOversightQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.thoroughRate).toBe(100);
    expect(result.actionPlanRate).toBe(100);
    expect(result.followUpRate).toBe(100);
    expect(result.documentationRate).toBe(100);
  });

  it("calculates partial quality correctly", () => {
    const records = [
      makeRecord({ id: "r1", completedThoroughly: true, actionPlanCreated: true, followUpCompleted: false, documentedProperly: false }),
      makeRecord({ id: "r2", completedThoroughly: false, actionPlanCreated: false, followUpCompleted: true, documentedProperly: true }),
    ];
    const result = evaluateOversightQuality(records);
    expect(result.thoroughRate).toBe(50);
    expect(result.actionPlanRate).toBe(50);
    expect(result.followUpRate).toBe(50);
    expect(result.documentationRate).toBe(50);
    // Score: round(50/100*7)=4 + round(50/100*6)=3 + round(50/100*6)=3 + round(50/100*6)=3 = 13
    expect(result.overallScore).toBe(13);
  });

  it("scores 0 when all flags are false", () => {
    const records = [
      makeRecord({
        id: "r1",
        completedThoroughly: false,
        actionPlanCreated: false,
        followUpCompleted: false,
        childImpactAssessed: false,
        staffFeedbackGiven: false,
        documentedProperly: false,
      }),
    ];
    const result = evaluateOversightQuality(records);
    expect(result.overallScore).toBe(0);
    expect(result.thoroughRate).toBe(0);
  });

  it("includes child impact and staff feedback rates", () => {
    const records = [
      makeRecord({ id: "r1", childImpactAssessed: true, staffFeedbackGiven: false }),
      makeRecord({ id: "r2", childImpactAssessed: false, staffFeedbackGiven: true }),
    ];
    const result = evaluateOversightQuality(records);
    expect(result.childImpactRate).toBe(50);
    expect(result.staffFeedbackRate).toBe(50);
  });

  it("does not exceed 25 even with rounding up", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `r-${i}` }));
    const result = evaluateOversightQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts total records correctly", () => {
    const records = [makeRecord({ id: "r1" }), makeRecord({ id: "r2" }), makeRecord({ id: "r3" })];
    const result = evaluateOversightQuality(records);
    expect(result.totalRecords).toBe(3);
  });

  it("handles single record correctly", () => {
    const result = evaluateOversightQuality([makeRecord()]);
    expect(result.totalRecords).toBe(1);
    expect(result.thoroughRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateOversightCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateOversightCompliance([], 3);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("scores frequency at 100 for 10+ records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateOversightCompliance(records, 1);
    expect(result.frequencyRate).toBe(100);
  });

  it("scores frequency proportionally for < 5 records", () => {
    const records = [makeRecord({ id: "r1" }), makeRecord({ id: "r2" })];
    const result = evaluateOversightCompliance(records, 1);
    // 2/5 * 50 = 20
    expect(result.frequencyRate).toBe(20);
  });

  it("scores frequency between 50-100 for 5-9 records", () => {
    const records = Array.from({ length: 7 }, (_, i) => makeRecord({ id: `r-${i}` }));
    const result = evaluateOversightCompliance(records, 1);
    // 50 + ((7-5)/5)*50 = 50 + 20 = 70
    expect(result.frequencyRate).toBe(70);
  });

  it("calculates coverage rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1" }),
      makeRecord({ id: "r2", childId: "c2" }),
      makeRecord({ id: "r3", childId: "c1" }),
    ];
    const result = evaluateOversightCompliance(records, 4);
    // 2 unique children / 4 total = 50%
    expect(result.coverageRate).toBe(50);
  });

  it("handles 0 totalChildren gracefully", () => {
    const records = [makeRecord({ id: "r1" })];
    const result = evaluateOversightCompliance(records, 0);
    // unique children > 0, totalChildren = 0, so coverage defaults to 100
    expect(result.coverageRate).toBe(100);
  });

  it("calculates timeliness from followUpCompleted", () => {
    const records = [
      makeRecord({ id: "r1", followUpCompleted: true }),
      makeRecord({ id: "r2", followUpCompleted: false }),
      makeRecord({ id: "r3", followUpCompleted: true }),
    ];
    const result = evaluateOversightCompliance(records, 1);
    expect(result.timelinessRate).toBe(67);
  });

  it("calculates category diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "case_file_audit" }),
      makeRecord({ id: "r2", category: "practice_observation" }),
      makeRecord({ id: "r3", category: "reg44_monitoring" }),
      makeRecord({ id: "r4", category: "reg45_monitoring" }),
    ];
    const result = evaluateOversightCompliance(records, 1);
    // 4 unique / 8 total categories = 50%
    expect(result.categoryDiversityRate).toBe(50);
  });

  it("returns max diversity for all 8 categories", () => {
    const categories: OversightCategory[] = [
      "case_file_audit",
      "practice_observation",
      "reg44_monitoring",
      "reg45_monitoring",
      "incident_review",
      "staff_supervision_audit",
      "quality_assurance_check",
      "outcomes_tracking",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat }),
    );
    const result = evaluateOversightCompliance(records, 1);
    expect(result.categoryDiversityRate).toBe(100);
  });

  it("does not exceed 25", () => {
    const categories: OversightCategory[] = [
      "case_file_audit", "practice_observation", "reg44_monitoring", "reg45_monitoring",
      "incident_review", "staff_supervision_audit", "quality_assurance_check", "outcomes_tracking",
    ];
    const records = Array.from({ length: 20 }, (_, i) =>
      makeRecord({ id: `r-${i}`, category: categories[i % 8] }),
    );
    const result = evaluateOversightCompliance(records, 1);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Policy Framework
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateOversightPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateOversightPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.oversightFramework).toBe(false);
    expect(result.auditSchedule).toBe(false);
    expect(result.qualityAssurancePlan).toBe(false);
    expect(result.incidentReviewProtocol).toBe(false);
    expect(result.performanceMonitoring).toBe(false);
    expect(result.regulatoryCompliancePlan).toBe(false);
    expect(result.continuousImprovementPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateOversightPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateOversightPolicy(
      makePolicy({
        oversightFramework: false,
        auditSchedule: false,
        qualityAssurancePlan: false,
        incidentReviewProtocol: false,
        performanceMonitoring: false,
        regulatoryCompliancePlan: false,
        continuousImprovementPolicy: false,
      }),
    );
    expect(result.overallScore).toBe(0);
  });

  it("scores oversightFramework as 4 points", () => {
    const result = evaluateOversightPolicy(
      makePolicy({
        oversightFramework: true,
        auditSchedule: false,
        qualityAssurancePlan: false,
        incidentReviewProtocol: false,
        performanceMonitoring: false,
        regulatoryCompliancePlan: false,
        continuousImprovementPolicy: false,
      }),
    );
    expect(result.overallScore).toBe(4);
  });

  it("scores tier-1 booleans (4 pts each) and tier-2 (3 pts each)", () => {
    // Only tier-1 fields = 4*4 = 16
    const result = evaluateOversightPolicy(
      makePolicy({
        performanceMonitoring: false,
        regulatoryCompliancePlan: false,
        continuousImprovementPolicy: false,
      }),
    );
    expect(result.overallScore).toBe(16);
  });

  it("scores tier-2 booleans correctly at 3 pts each", () => {
    // Only tier-2 fields = 3*3 = 9
    const result = evaluateOversightPolicy(
      makePolicy({
        oversightFramework: false,
        auditSchedule: false,
        qualityAssurancePlan: false,
        incidentReviewProtocol: false,
      }),
    );
    expect(result.overallScore).toBe(9);
  });

  it("reflects individual booleans in result", () => {
    const result = evaluateOversightPolicy(
      makePolicy({
        oversightFramework: true,
        auditSchedule: false,
        qualityAssurancePlan: true,
        incidentReviewProtocol: false,
        performanceMonitoring: true,
        regulatoryCompliancePlan: false,
        continuousImprovementPolicy: true,
      }),
    );
    expect(result.oversightFramework).toBe(true);
    expect(result.auditSchedule).toBe(false);
    expect(result.qualityAssurancePlan).toBe(true);
    expect(result.incidentReviewProtocol).toBe(false);
    expect(result.performanceMonitoring).toBe(true);
    expect(result.regulatoryCompliancePlan).toBe(false);
    expect(result.continuousImprovementPolicy).toBe(true);
    // 4+4+3+3 = 14
    expect(result.overallScore).toBe(14);
  });

  it("does not exceed 25", () => {
    const result = evaluateOversightPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffReadiness", () => {
  it("returns 0 for empty staff array", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns 25 for fully skilled staff", () => {
    const staff = [makeTraining({ id: "t1" }), makeTraining({ id: "t2", staffId: "staff-tom" })];
    const result = evaluateStaffReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.auditSkillsRate).toBe(100);
    expect(result.qualityAssuranceRate).toBe(100);
  });

  it("returns 0 for staff with no skills", () => {
    const staff = [
      makeTraining({
        id: "t1",
        auditSkills: false,
        qualityAssuranceKnowledge: false,
        regulatoryAwareness: false,
        leadershipCapability: false,
        dataAnalysis: false,
        reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("calculates individual skill rates", () => {
    const staff = [
      makeTraining({ id: "t1", auditSkills: true, qualityAssuranceKnowledge: false }),
      makeTraining({ id: "t2", staffId: "staff-tom", auditSkills: false, qualityAssuranceKnowledge: true }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.auditSkillsRate).toBe(50);
    expect(result.qualityAssuranceRate).toBe(50);
  });

  it("weights audit skills highest (6 pts)", () => {
    const staff = [
      makeTraining({
        id: "t1",
        auditSkills: true,
        qualityAssuranceKnowledge: false,
        regulatoryAwareness: false,
        leadershipCapability: false,
        dataAnalysis: false,
        reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffReadiness(staff);
    // round(100/100*6) = 6
    expect(result.overallScore).toBe(6);
  });

  it("weights reflective practice lowest (2 pts)", () => {
    const staff = [
      makeTraining({
        id: "t1",
        auditSkills: false,
        qualityAssuranceKnowledge: false,
        regulatoryAwareness: false,
        leadershipCapability: false,
        dataAnalysis: false,
        reflectivePractice: true,
      }),
    ];
    const result = evaluateStaffReadiness(staff);
    // round(100/100*2) = 2
    expect(result.overallScore).toBe(2);
  });

  it("calculates partial skills across multiple staff", () => {
    const staff = [
      makeTraining({ id: "t1", auditSkills: true, regulatoryAwareness: true, dataAnalysis: false, reflectivePractice: false }),
      makeTraining({ id: "t2", staffId: "staff-tom", auditSkills: false, regulatoryAwareness: false, dataAnalysis: true, reflectivePractice: true }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.auditSkillsRate).toBe(50);
    expect(result.regulatoryAwarenessRate).toBe(50);
    expect(result.dataAnalysisRate).toBe(50);
    expect(result.reflectivePracticeRate).toBe(50);
  });

  it("does not exceed 25", () => {
    const staff = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffReadiness(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts total staff", () => {
    const staff = [
      makeTraining({ id: "t1" }),
      makeTraining({ id: "t2", staffId: "staff-tom" }),
      makeTraining({ id: "t3", staffId: "staff-lisa" }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.totalStaff).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildOversightProfiles", () => {
  it("returns empty array for no records", () => {
    const result = buildChildOversightProfiles([]);
    expect(result).toEqual([]);
  });

  it("builds profile for single child", () => {
    const records = [makeRecord({ id: "r1" })];
    const profiles = buildChildOversightProfiles(records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalRecords).toBe(1);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r3", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildOversightProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("scores frequency 2 for >= 10 records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childName: "Alex" }),
    );
    const profiles = buildChildOversightProfiles(records);
    expect(profiles[0].frequencyScore).toBe(2);
  });

  it("scores frequency 1 for >= 5 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childName: "Alex" }),
    );
    const profiles = buildChildOversightProfiles(records);
    expect(profiles[0].frequencyScore).toBe(1);
  });

  it("scores frequency 0 for < 5 records", () => {
    const records = [makeRecord({ id: "r1" })];
    const profiles = buildChildOversightProfiles(records);
    expect(profiles[0].frequencyScore).toBe(0);
  });

  it("scores thoroughness 3 for >= 80% thorough", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", completedThoroughly: i < 4 }),
    );
    const profiles = buildChildOversightProfiles(records);
    // 4/5 = 80%
    expect(profiles[0].thoroughnessScore).toBe(3);
  });

  it("scores thoroughness 2 for >= 60% thorough", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", completedThoroughly: i < 3 }),
    );
    const profiles = buildChildOversightProfiles(records);
    // 3/5 = 60%
    expect(profiles[0].thoroughnessScore).toBe(2);
  });

  it("scores thoroughness 1 for >= 40% thorough", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", completedThoroughly: i < 2 }),
    );
    const profiles = buildChildOversightProfiles(records);
    // 2/5 = 40%
    expect(profiles[0].thoroughnessScore).toBe(1);
  });

  it("scores thoroughness 0 for < 40% thorough", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", completedThoroughly: false }),
    );
    const profiles = buildChildOversightProfiles(records);
    expect(profiles[0].thoroughnessScore).toBe(0);
  });

  it("scores diversity 2 for >= 4 categories", () => {
    const categories: OversightCategory[] = [
      "case_file_audit", "practice_observation", "reg44_monitoring", "reg45_monitoring",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: cat }),
    );
    const profiles = buildChildOversightProfiles(records);
    expect(profiles[0].diversityScore).toBe(2);
  });

  it("scores diversity 1 for >= 2 categories", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", category: "case_file_audit" }),
      makeRecord({ id: "r2", childId: "c1", category: "reg44_monitoring" }),
    ];
    const profiles = buildChildOversightProfiles(records);
    expect(profiles[0].diversityScore).toBe(1);
  });

  it("scores diversity 0 for 1 category", () => {
    const records = [makeRecord({ id: "r1", childId: "c1" })];
    const profiles = buildChildOversightProfiles(records);
    expect(profiles[0].diversityScore).toBe(0);
  });

  it("caps overall score at 10", () => {
    const categories: OversightCategory[] = [
      "case_file_audit", "practice_observation", "reg44_monitoring", "reg45_monitoring",
      "incident_review", "staff_supervision_audit", "quality_assurance_check", "outcomes_tracking",
    ];
    const records = Array.from({ length: 16 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: categories[i % 8] }),
    );
    const profiles = buildChildOversightProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("sorts profiles by totalRecords descending", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "r4", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildOversightProfiles(records);
    expect(profiles[0].childId).toBe("c2");
    expect(profiles[1].childId).toBe("c1");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Master Generator
// ══════════════════════════════════════════════════════════════════════════════

describe("generateManagementOversightIntelligence", () => {
  it("returns perfect score for ideal inputs", () => {
    const categories: OversightCategory[] = [
      "case_file_audit", "practice_observation", "reg44_monitoring", "reg45_monitoring",
      "incident_review", "staff_supervision_audit", "quality_assurance_check", "outcomes_tracking",
    ];
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({ id: `r-${i}`, category: categories[i % 8] }),
    );
    const policy = makePolicy();
    const staff = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = generateManagementOversightIntelligence(records, policy, staff, 1);
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 score for empty inputs", () => {
    const result = generateManagementOversightIntelligence([], null, [], 0);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    const categories: OversightCategory[] = [
      "case_file_audit", "practice_observation", "reg44_monitoring", "reg45_monitoring",
      "incident_review", "staff_supervision_audit", "quality_assurance_check", "outcomes_tracking",
    ];
    const records = Array.from({ length: 20 }, (_, i) =>
      makeRecord({ id: `r-${i}`, category: categories[i % 8] }),
    );
    const result = generateManagementOversightIntelligence(records, makePolicy(), [makeTraining()], 1);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes all 4 evaluator results", () => {
    const records = [makeRecord()];
    const result = generateManagementOversightIntelligence(records, makePolicy(), [makeTraining()], 1);
    expect(result.oversightQuality).toBeDefined();
    expect(result.compliance).toBeDefined();
    expect(result.policyFramework).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
  });

  it("includes child profiles", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
    ];
    const result = generateManagementOversightIntelligence(records, makePolicy(), [makeTraining()], 2);
    expect(result.childProfiles).toHaveLength(2);
  });

  it("generates strengths for high-quality oversight", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `r-${i}` }));
    const result = generateManagementOversightIntelligence(records, makePolicy(), [makeTraining()], 1);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("thorough"))).toBe(true);
  });

  it("generates areas for improvement for low quality", () => {
    const records = [
      makeRecord({
        id: "r1",
        completedThoroughly: false,
        actionPlanCreated: false,
        followUpCompleted: false,
        documentedProperly: false,
      }),
    ];
    const result = generateManagementOversightIntelligence(records, makePolicy(), [makeTraining()], 5);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT action when policy is null", () => {
    const result = generateManagementOversightIntelligence([makeRecord()], null, [makeTraining()], 1);
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action when staff is empty", () => {
    const result = generateManagementOversightIntelligence([makeRecord()], makePolicy(), [], 1);
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("includes exactly 7 regulatory links", () => {
    const result = generateManagementOversightIntelligence([makeRecord()], makePolicy(), [makeTraining()], 1);
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes Reg 13, Reg 44, and Reg 45 in regulatory links", () => {
    const result = generateManagementOversightIntelligence([], null, [], 0);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 13"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 44"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 45"))).toBe(true);
  });

  it("returns rating outstanding for score >= 80", () => {
    const categories: OversightCategory[] = [
      "case_file_audit", "practice_observation", "reg44_monitoring", "reg45_monitoring",
      "incident_review", "staff_supervision_audit", "quality_assurance_check", "outcomes_tracking",
    ];
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, category: categories[i % 8] }),
    );
    const result = generateManagementOversightIntelligence(records, makePolicy(), [makeTraining()], 1);
    expect(result.rating).toBe("outstanding");
  });

  it("returns rating inadequate for score < 40", () => {
    const result = generateManagementOversightIntelligence([], null, [], 0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates default strength when no strengths found", () => {
    const records = [
      makeRecord({
        id: "r1",
        completedThoroughly: false,
        actionPlanCreated: false,
        followUpCompleted: false,
        documentedProperly: false,
      }),
    ];
    const result = generateManagementOversightIntelligence(records, null, [], 5);
    expect(result.strengths.some((s) => s.includes("requires development"))).toBe(true);
  });

  it("generates default area for improvement when none needed", () => {
    const categories: OversightCategory[] = [
      "case_file_audit", "practice_observation", "reg44_monitoring", "reg45_monitoring",
      "incident_review", "staff_supervision_audit", "quality_assurance_check", "outcomes_tracking",
    ];
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({ id: `r-${i}`, category: categories[i % 8] }),
    );
    const result = generateManagementOversightIntelligence(records, makePolicy(), [makeTraining()], 1);
    expect(result.areasForImprovement.some((a) => a.includes("No significant"))).toBe(true);
  });

  it("generates action for no records", () => {
    const result = generateManagementOversightIntelligence([], makePolicy(), [makeTraining()], 3);
    expect(result.actions.some((a) => a.includes("No oversight records"))).toBe(true);
  });

  it("generates default action when no issues found", () => {
    const categories: OversightCategory[] = [
      "case_file_audit", "practice_observation", "reg44_monitoring", "reg45_monitoring",
      "incident_review", "staff_supervision_audit", "quality_assurance_check", "outcomes_tracking",
    ];
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({ id: `r-${i}`, category: categories[i % 8] }),
    );
    const result = generateManagementOversightIntelligence(records, makePolicy(), [makeTraining()], 1);
    expect(result.actions.some((a) => a.includes("Continue"))).toBe(true);
  });

  it("sums evaluator scores correctly", () => {
    const records = [
      makeRecord({
        id: "r1",
        completedThoroughly: false,
        actionPlanCreated: false,
        followUpCompleted: false,
        documentedProperly: false,
      }),
    ];
    const result = generateManagementOversightIntelligence(records, null, [], 1);
    // Quality: 0, Compliance: some small score, Policy: 0, Staff: 0
    const expectedTotal =
      result.oversightQuality.overallScore +
      result.compliance.overallScore +
      result.policyFramework.overallScore +
      result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(expectedTotal);
  });
});
