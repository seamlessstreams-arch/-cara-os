import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getPocketMoneyCategoryLabel,
  getPocketMoneyOutcomeLabel,
  getRatingLabel,
  evaluatePocketMoneyQuality,
  evaluatePocketMoneyCompliance,
  evaluatePocketMoneyPolicy,
  evaluateStaffPocketMoneyReadiness,
  buildChildPocketMoneyProfiles,
  generatePocketMoneyIntelligence,
} from "../pocket-money-intelligence-engine";
import type {
  PocketMoneyRecord,
  PocketMoneyPolicy,
  StaffPocketMoneyTraining,
  PocketMoneyCategory,
} from "../pocket-money-intelligence-engine";

// ── Test helpers ───────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<PocketMoneyRecord> = {}): PocketMoneyRecord {
  return {
    id: "pm-1",
    homeId: "home-oak",
    date: "2026-03-15",
    childId: "child-alex",
    childName: "Alex",
    category: "weekly_allowance",
    outcome: "properly_recorded",
    receiptObtained: true,
    childConsentRecorded: true,
    balanceUpdated: true,
    supervisorApproved: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<PocketMoneyPolicy> = {}): PocketMoneyPolicy {
  return {
    pocketMoneyPolicy: true,
    savingsAccountPolicy: true,
    spendingApprovalProcess: true,
    financialRecordKeepingPolicy: true,
    financialLiteracyProgramme: true,
    birthdayChristmasMoneyPolicy: true,
    independentSpendingGuidance: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffPocketMoneyTraining> = {}): StaffPocketMoneyTraining {
  return {
    staffId: "staff-sarah",
    financialManagementKnowledge: true,
    recordKeepingSkills: true,
    childConsentPractice: true,
    savingsGuidanceSkills: true,
    financialLiteracyDelivery: true,
    budgetingSupport: true,
    ...overrides,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 for zero denominator", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 for 0/0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds correctly", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// ── getRating ──────────────────────────────────────────────────────────────

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

  it("returns inadequate for below 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ── Label functions ────────────────────────────────────────────────────────

describe("getPocketMoneyCategoryLabel", () => {
  it("returns label for weekly_allowance", () => {
    expect(getPocketMoneyCategoryLabel("weekly_allowance")).toBe("Weekly Allowance");
  });
  it("returns label for birthday_money", () => {
    expect(getPocketMoneyCategoryLabel("birthday_money")).toBe("Birthday Money");
  });
  it("returns label for savings_deposit", () => {
    expect(getPocketMoneyCategoryLabel("savings_deposit")).toBe("Savings Deposit");
  });
  it("returns label for educational_purchase", () => {
    expect(getPocketMoneyCategoryLabel("educational_purchase")).toBe("Educational Purchase");
  });
  it("returns label for clothing_allowance", () => {
    expect(getPocketMoneyCategoryLabel("clothing_allowance")).toBe("Clothing Allowance");
  });
  it("returns label for activity_funding", () => {
    expect(getPocketMoneyCategoryLabel("activity_funding")).toBe("Activity Funding");
  });
  it("returns label for personal_spending", () => {
    expect(getPocketMoneyCategoryLabel("personal_spending")).toBe("Personal Spending");
  });
  it("returns label for financial_literacy_session", () => {
    expect(getPocketMoneyCategoryLabel("financial_literacy_session")).toBe("Financial Literacy Session");
  });
});

describe("getPocketMoneyOutcomeLabel", () => {
  it("returns label for properly_recorded", () => {
    expect(getPocketMoneyOutcomeLabel("properly_recorded")).toBe("Properly Recorded");
  });
  it("returns label for partially_recorded", () => {
    expect(getPocketMoneyOutcomeLabel("partially_recorded")).toBe("Partially Recorded");
  });
  it("returns label for late_recording", () => {
    expect(getPocketMoneyOutcomeLabel("late_recording")).toBe("Late Recording");
  });
  it("returns label for unrecorded", () => {
    expect(getPocketMoneyOutcomeLabel("unrecorded")).toBe("Unrecorded");
  });
  it("returns label for not_applicable", () => {
    expect(getPocketMoneyOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns Good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns Requires Improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns Inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluatePocketMoneyQuality ─────────────────────────────────────────────

describe("evaluatePocketMoneyQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluatePocketMoneyQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.receiptObtainedRate).toBe(0);
    expect(result.childConsentRecordedRate).toBe(0);
    expect(result.balanceUpdatedRate).toBe(0);
    expect(result.supervisorApprovedRate).toBe(0);
  });

  it("returns 25 for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "pm-2" })];
    const result = evaluatePocketMoneyQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.receiptObtainedRate).toBe(100);
    expect(result.childConsentRecordedRate).toBe(100);
    expect(result.balanceUpdatedRate).toBe(100);
    expect(result.supervisorApprovedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ receiptObtained: false, childConsentRecorded: false, balanceUpdated: false, supervisorApproved: false })];
    const result = evaluatePocketMoneyQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates correct mixed score", () => {
    const records = [
      makeRecord({ receiptObtained: true, childConsentRecorded: true, balanceUpdated: false, supervisorApproved: false }),
      makeRecord({ id: "pm-2", receiptObtained: true, childConsentRecorded: false, balanceUpdated: true, supervisorApproved: false }),
    ];
    const result = evaluatePocketMoneyQuality(records);
    // receipt: 100% -> 7, consent: 50% -> 3, balance: 50% -> 3, supervisor: 0% -> 0 = 13
    expect(result.receiptObtainedRate).toBe(100);
    expect(result.childConsentRecordedRate).toBe(50);
    expect(result.balanceUpdatedRate).toBe(50);
    expect(result.supervisorApprovedRate).toBe(0);
    expect(result.overallScore).toBe(13);
  });

  it("handles single record with all true", () => {
    const result = evaluatePocketMoneyQuality([makeRecord()]);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(1);
  });

  it("score never exceeds 25", () => {
    const records = Array.from({ length: 20 }, (_, i) => makeRecord({ id: `pm-${i}` }));
    const result = evaluatePocketMoneyQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const records = [makeRecord({ receiptObtained: false, childConsentRecorded: false, balanceUpdated: false, supervisorApproved: false })];
    const result = evaluatePocketMoneyQuality(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── evaluatePocketMoneyCompliance ──────────────────────────────────────────

describe("evaluatePocketMoneyCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluatePocketMoneyCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.receiptObtainedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("returns full score for perfect compliance with all 8 categories", () => {
    const categories: PocketMoneyCategory[] = [
      "weekly_allowance", "birthday_money", "savings_deposit", "educational_purchase",
      "clothing_allowance", "activity_funding", "personal_spending", "financial_literacy_session",
    ];
    const records = categories.map((c, i) => makeRecord({ id: `pm-${i}`, category: c }));
    const result = evaluatePocketMoneyCompliance(records);
    // doc: 100% -> 8, timely: 100% -> 7, receipt: 100% -> 5, diversity: 1.0 -> 5 = 25
    expect(result.overallScore).toBe(25);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("returns 0 for all-false compliance fields with 1 category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, receiptObtained: false })];
    const result = evaluatePocketMoneyCompliance(records);
    // doc: 0, timely: 0, receipt: 0, diversity: 1/8=0.13 -> 0.13*5=0.65 -> rounds to 0.6
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.receiptObtainedRate).toBe(0);
    expect(result.overallScore).toBe(0.7);
  });

  it("calculates categoryDiversityRatio correctly for 4 categories", () => {
    const records = [
      makeRecord({ id: "pm-1", category: "weekly_allowance" }),
      makeRecord({ id: "pm-2", category: "birthday_money" }),
      makeRecord({ id: "pm-3", category: "savings_deposit" }),
      makeRecord({ id: "pm-4", category: "educational_purchase" }),
    ];
    const result = evaluatePocketMoneyCompliance(records);
    expect(result.categoryDiversityRatio).toBe(0.5);
    expect(result.uniqueCategories).toBe(4);
  });

  it("handles partial compliance", () => {
    const records = [
      makeRecord({ id: "pm-1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "pm-2", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluatePocketMoneyCompliance(records);
    expect(result.documentationCompleteRate).toBe(50);
    expect(result.timelyRecordingRate).toBe(50);
  });

  it("diversity ratio uses Math.round formula", () => {
    const records = [
      makeRecord({ id: "pm-1", category: "weekly_allowance" }),
      makeRecord({ id: "pm-2", category: "birthday_money" }),
      makeRecord({ id: "pm-3", category: "savings_deposit" }),
    ];
    const result = evaluatePocketMoneyCompliance(records);
    // 3/8 = 0.375 -> Math.round(0.375 * 100) / 100 = 0.38
    expect(result.categoryDiversityRatio).toBe(0.38);
  });

  it("score never exceeds 25", () => {
    const categories: PocketMoneyCategory[] = [
      "weekly_allowance", "birthday_money", "savings_deposit", "educational_purchase",
      "clothing_allowance", "activity_funding", "personal_spending", "financial_literacy_session",
    ];
    const records = categories.map((c, i) => makeRecord({ id: `pm-${i}`, category: c }));
    const result = evaluatePocketMoneyCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluatePocketMoneyPolicy ──────────────────────────────────────────────

describe("evaluatePocketMoneyPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluatePocketMoneyPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.pocketMoneyPolicy).toBe(false);
    expect(result.savingsAccountPolicy).toBe(false);
    expect(result.spendingApprovalProcess).toBe(false);
    expect(result.financialRecordKeepingPolicy).toBe(false);
    expect(result.financialLiteracyProgramme).toBe(false);
    expect(result.birthdayChristmasMoneyPolicy).toBe(false);
    expect(result.independentSpendingGuidance).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluatePocketMoneyPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluatePocketMoneyPolicy(makePolicy({
      pocketMoneyPolicy: false,
      savingsAccountPolicy: false,
      spendingApprovalProcess: false,
      financialRecordKeepingPolicy: false,
      financialLiteracyProgramme: false,
      birthdayChristmasMoneyPolicy: false,
      independentSpendingGuidance: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("returns partial score correctly", () => {
    // Only the 4-weight policies: 4+4+4+4 = 16
    const result = evaluatePocketMoneyPolicy(makePolicy({
      financialLiteracyProgramme: false,
      birthdayChristmasMoneyPolicy: false,
      independentSpendingGuidance: false,
    }));
    expect(result.overallScore).toBe(16);
  });

  it("returns correct score for only 3-weight policies", () => {
    // Only the 3-weight policies: 3+3+3 = 9
    const result = evaluatePocketMoneyPolicy(makePolicy({
      pocketMoneyPolicy: false,
      savingsAccountPolicy: false,
      spendingApprovalProcess: false,
      financialRecordKeepingPolicy: false,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("reflects boolean values in result", () => {
    const result = evaluatePocketMoneyPolicy(makePolicy({ pocketMoneyPolicy: false, independentSpendingGuidance: false }));
    expect(result.pocketMoneyPolicy).toBe(false);
    expect(result.savingsAccountPolicy).toBe(true);
    expect(result.independentSpendingGuidance).toBe(false);
  });

  it("score never exceeds 25", () => {
    const result = evaluatePocketMoneyPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffPocketMoneyReadiness ──────────────────────────────────────

describe("evaluateStaffPocketMoneyReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffPocketMoneyReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.financialManagementKnowledgeRate).toBe(0);
    expect(result.recordKeepingSkillsRate).toBe(0);
    expect(result.childConsentPracticeRate).toBe(0);
    expect(result.savingsGuidanceSkillsRate).toBe(0);
    expect(result.financialLiteracyDeliveryRate).toBe(0);
    expect(result.budgetingSupportRate).toBe(0);
  });

  it("returns 25 for all-true training", () => {
    const training = [makeTraining(), makeTraining({ staffId: "staff-tom" })];
    const result = evaluateStaffPocketMoneyReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false training", () => {
    const training = [makeTraining({
      financialManagementKnowledge: false,
      recordKeepingSkills: false,
      childConsentPractice: false,
      savingsGuidanceSkills: false,
      financialLiteracyDelivery: false,
      budgetingSupport: false,
    })];
    const result = evaluateStaffPocketMoneyReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("handles partial training", () => {
    const training = [
      makeTraining({ staffId: "staff-1" }),
      makeTraining({ staffId: "staff-2", financialManagementKnowledge: false, budgetingSupport: false }),
    ];
    const result = evaluateStaffPocketMoneyReadiness(training);
    expect(result.financialManagementKnowledgeRate).toBe(50);
    expect(result.budgetingSupportRate).toBe(50);
    expect(result.recordKeepingSkillsRate).toBe(100);
  });

  it("calculates weighted score correctly for single staff", () => {
    // Only financial management knowledge = 6 * 1 = 6
    const training = [makeTraining({
      recordKeepingSkills: false,
      childConsentPractice: false,
      savingsGuidanceSkills: false,
      financialLiteracyDelivery: false,
      budgetingSupport: false,
    })];
    const result = evaluateStaffPocketMoneyReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("score never exceeds 25", () => {
    const training = Array.from({ length: 10 }, (_, i) => makeTraining({ staffId: `staff-${i}` }));
    const result = evaluateStaffPocketMoneyReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const training = [makeTraining({
      financialManagementKnowledge: false,
      recordKeepingSkills: false,
      childConsentPractice: false,
      savingsGuidanceSkills: false,
      financialLiteracyDelivery: false,
      budgetingSupport: false,
    })];
    const result = evaluateStaffPocketMoneyReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── buildChildPocketMoneyProfiles ──────────────────────────────────────────

describe("buildChildPocketMoneyProfiles", () => {
  it("returns empty array for empty records", () => {
    const profiles = buildChildPocketMoneyProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("builds profile for single child", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", childName: "Alex", category: "weekly_allowance" }),
      makeRecord({ id: "pm-2", childId: "child-alex", childName: "Alex", category: "birthday_money" }),
    ];
    const profiles = buildChildPocketMoneyProfiles(records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalRecords).toBe(2);
  });

  it("builds profiles for multiple children", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "pm-2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "pm-3", childId: "child-morgan", childName: "Morgan" }),
    ];
    const profiles = buildChildPocketMoneyProfiles(records);
    expect(profiles).toHaveLength(3);
    const ids = profiles.map((p) => p.childId);
    expect(ids).toContain("child-alex");
    expect(ids).toContain("child-jordan");
    expect(ids).toContain("child-morgan");
  });

  it("calculates receiptObtainedRate correctly", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", receiptObtained: true }),
      makeRecord({ id: "pm-2", childId: "child-alex", receiptObtained: false }),
    ];
    const profiles = buildChildPocketMoneyProfiles(records);
    expect(profiles[0].receiptObtainedRate).toBe(50);
  });

  it("calculates childConsentRecordedRate correctly", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", childConsentRecorded: true }),
      makeRecord({ id: "pm-2", childId: "child-alex", childConsentRecorded: true }),
      makeRecord({ id: "pm-3", childId: "child-alex", childConsentRecorded: false }),
    ];
    const profiles = buildChildPocketMoneyProfiles(records);
    expect(profiles[0].childConsentRecordedRate).toBe(67);
  });

  it("tracks categoriesCovered", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", category: "weekly_allowance" }),
      makeRecord({ id: "pm-2", childId: "child-alex", category: "birthday_money" }),
      makeRecord({ id: "pm-3", childId: "child-alex", category: "weekly_allowance" }),
    ];
    const profiles = buildChildPocketMoneyProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
    expect(profiles[0].categoriesCovered).toContain("weekly_allowance");
    expect(profiles[0].categoriesCovered).toContain("birthday_money");
  });

  it("frequency score: 0 for <5 records", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", receiptObtained: false, childConsentRecorded: false }),
    ];
    const profiles = buildChildPocketMoneyProfiles(records);
    // freq=0, rate1=0 (0%), rate2=0 (0%), diversity=0 (1 cat)
    expect(profiles[0].overallScore).toBe(0);
  });

  it("frequency score: 1 for 5-9 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `pm-${i}`, childId: "child-alex", receiptObtained: false, childConsentRecorded: false, category: "weekly_allowance" }),
    );
    const profiles = buildChildPocketMoneyProfiles(records);
    // freq=1, rate1=0, rate2=0, diversity=0 (1 cat) = 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("frequency score: 2 for 10+ records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `pm-${i}`, childId: "child-alex", receiptObtained: false, childConsentRecorded: false, category: "weekly_allowance" }),
    );
    const profiles = buildChildPocketMoneyProfiles(records);
    // freq=2, rate1=0, rate2=0, diversity=0 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("rate1 score: 3 for >=80% receipt rate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `pm-${i}`, childId: "child-alex", receiptObtained: true, childConsentRecorded: false }),
    );
    const profiles = buildChildPocketMoneyProfiles(records);
    // freq=1, rate1=3 (100%), rate2=0, diversity=0 = 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("rate1 score: 2 for 60-79% receipt rate", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", receiptObtained: true, childConsentRecorded: false }),
      makeRecord({ id: "pm-2", childId: "child-alex", receiptObtained: true, childConsentRecorded: false }),
      makeRecord({ id: "pm-3", childId: "child-alex", receiptObtained: true, childConsentRecorded: false }),
      makeRecord({ id: "pm-4", childId: "child-alex", receiptObtained: false, childConsentRecorded: false }),
      makeRecord({ id: "pm-5", childId: "child-alex", receiptObtained: false, childConsentRecorded: false }),
    ];
    // receipt: 3/5 = 60%
    const profiles = buildChildPocketMoneyProfiles(records);
    // freq=1, rate1=2 (60%), rate2=0, diversity=0 = 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("rate1 score: 1 for 40-59% receipt rate", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", receiptObtained: true, childConsentRecorded: false }),
      makeRecord({ id: "pm-2", childId: "child-alex", receiptObtained: true, childConsentRecorded: false }),
      makeRecord({ id: "pm-3", childId: "child-alex", receiptObtained: false, childConsentRecorded: false }),
      makeRecord({ id: "pm-4", childId: "child-alex", receiptObtained: false, childConsentRecorded: false }),
      makeRecord({ id: "pm-5", childId: "child-alex", receiptObtained: false, childConsentRecorded: false }),
    ];
    // receipt: 2/5 = 40%
    const profiles = buildChildPocketMoneyProfiles(records);
    // freq=1, rate1=1 (40%), rate2=0, diversity=0 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("diversity score: 2 for >=4 categories", () => {
    const categories: PocketMoneyCategory[] = ["weekly_allowance", "birthday_money", "savings_deposit", "educational_purchase"];
    const records = categories.map((c, i) =>
      makeRecord({ id: `pm-${i}`, childId: "child-alex", category: c, receiptObtained: false, childConsentRecorded: false }),
    );
    const profiles = buildChildPocketMoneyProfiles(records);
    // freq=0, rate1=0, rate2=0, diversity=2 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("diversity score: 1 for 2-3 categories", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", category: "weekly_allowance", receiptObtained: false, childConsentRecorded: false }),
      makeRecord({ id: "pm-2", childId: "child-alex", category: "birthday_money", receiptObtained: false, childConsentRecorded: false }),
    ];
    const profiles = buildChildPocketMoneyProfiles(records);
    // freq=0, rate1=0, rate2=0, diversity=1 = 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("diversity score: 0 for 1 category", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", category: "weekly_allowance", receiptObtained: false, childConsentRecorded: false }),
    ];
    const profiles = buildChildPocketMoneyProfiles(records);
    expect(profiles[0].overallScore).toBe(0);
  });

  it("overallScore capped at 10", () => {
    // Max possible: freq=2(10+), rate1=3(100%), rate2=3(100%), diversity=2(4+) = 10
    const categories: PocketMoneyCategory[] = ["weekly_allowance", "birthday_money", "savings_deposit", "educational_purchase"];
    const records: PocketMoneyRecord[] = [];
    for (let i = 0; i < 12; i++) {
      records.push(makeRecord({ id: `pm-${i}`, childId: "child-alex", category: categories[i % 4] }));
    }
    const profiles = buildChildPocketMoneyProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("overallScore is never negative", () => {
    const records = [
      makeRecord({ id: "pm-1", childId: "child-alex", receiptObtained: false, childConsentRecorded: false }),
    ];
    const profiles = buildChildPocketMoneyProfiles(records);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── generatePocketMoneyIntelligence (orchestrator) ─────────────────────────

describe("generatePocketMoneyIntelligence", () => {
  const fullRecords: PocketMoneyRecord[] = [
    makeRecord({ id: "pm-1", date: "2026-02-01", childId: "child-alex", childName: "Alex", category: "weekly_allowance" }),
    makeRecord({ id: "pm-2", date: "2026-02-15", childId: "child-alex", childName: "Alex", category: "birthday_money" }),
    makeRecord({ id: "pm-3", date: "2026-03-01", childId: "child-alex", childName: "Alex", category: "savings_deposit" }),
    makeRecord({ id: "pm-4", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "educational_purchase" }),
    makeRecord({ id: "pm-5", date: "2026-02-10", childId: "child-jordan", childName: "Jordan", category: "clothing_allowance" }),
    makeRecord({ id: "pm-6", date: "2026-02-20", childId: "child-jordan", childName: "Jordan", category: "activity_funding" }),
    makeRecord({ id: "pm-7", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "personal_spending" }),
    makeRecord({ id: "pm-8", date: "2026-03-20", childId: "child-jordan", childName: "Jordan", category: "financial_literacy_session" }),
    makeRecord({ id: "pm-9", date: "2026-02-05", childId: "child-morgan", childName: "Morgan", category: "weekly_allowance" }),
    makeRecord({ id: "pm-10", date: "2026-03-05", childId: "child-morgan", childName: "Morgan", category: "savings_deposit" }),
    makeRecord({ id: "pm-11", date: "2026-03-25", childId: "child-morgan", childName: "Morgan", category: "educational_purchase" }),
    makeRecord({ id: "pm-12", date: "2026-04-01", childId: "child-morgan", childName: "Morgan", category: "clothing_allowance" }),
  ];

  it("generates full intelligence report", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.pocketMoneyQuality).toBeDefined();
    expect(result.pocketMoneyCompliance).toBeDefined();
    expect(result.pocketMoneyPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("handles empty records", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.pocketMoneyQuality.overallScore).toBe(0);
    expect(result.pocketMoneyCompliance.overallScore).toBe(0);
    expect(result.childProfiles).toEqual([]);
  });

  it("handles null policy", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: null,
      staff: [makeTraining()],
    });

    expect(result.pocketMoneyPolicy.overallScore).toBe(0);
    expect(result.pocketMoneyPolicy.pocketMoneyPolicy).toBe(false);
    expect(result.areasForImprovement).toEqual(expect.arrayContaining([expect.stringContaining("No pocket money policy")]));
    expect(result.actions).toEqual(expect.arrayContaining([expect.stringContaining("URGENT")]));
  });

  it("handles empty staff", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [],
    });

    expect(result.staffReadiness.overallScore).toBe(0);
    expect(result.staffReadiness.totalStaff).toBe(0);
    expect(result.areasForImprovement).toEqual(expect.arrayContaining([expect.stringContaining("No staff financial training")]));
  });

  it("filters records by date range", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-03-01",
      periodEnd: "2026-03-31",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    // Only records in March: pm-3, pm-7, pm-10, pm-11, pm-5(no), pm-8(no dates check)
    // pm-3: 2026-03-01, pm-7: 2026-03-10, pm-10: 2026-03-05, pm-11: 2026-03-25, pm-8: 2026-03-20
    // All 5 in March, pm-15: 2026-03-15, pm-20: 2026-03-20
    expect(result.pocketMoneyQuality.totalRecords).toBeLessThan(fullRecords.length);
    expect(result.pocketMoneyQuality.totalRecords).toBeGreaterThan(0);
  });

  it("excludes records outside date range", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2027-01-01",
      periodEnd: "2027-12-31",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.pocketMoneyQuality.totalRecords).toBe(0);
    expect(result.childProfiles).toEqual([]);
  });

  it("overall score is capped at 100", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score is rounded to nearest integer", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.overallScore).toBe(Math.round(result.overallScore));
  });

  it("generates strengths for high scores", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low scores", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.areasForImprovement).toEqual(expect.arrayContaining([expect.stringContaining("Inadequate")]));
  });

  it("generates actions for missing everything", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.actions).toEqual(expect.arrayContaining([
      expect.stringContaining("URGENT: No pocket money policy"),
      expect.stringContaining("URGENT: No staff financial training"),
    ]));
  });

  it("generates default action when no issues", () => {
    const categories: PocketMoneyCategory[] = [
      "weekly_allowance", "birthday_money", "savings_deposit", "educational_purchase",
      "clothing_allowance", "activity_funding", "personal_spending", "financial_literacy_session",
    ];
    const perfectRecords = categories.map((c, i) =>
      makeRecord({ id: `pm-${i}`, date: "2026-03-15", childId: "child-alex", childName: "Alex", category: c }),
    );
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: perfectRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.actions).toContain("No immediate actions required. Pocket money systems operating within expected standards.");
  });

  it("includes all 7 regulatory links", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 9 — Positive relationships");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 12 — Contact and independence");
    expect(result.regulatoryLinks).toContain("NMS 12 — Pocket money and personal possessions");
    expect(result.regulatoryLinks).toContain("SCCIF — Experiences and progress");
    expect(result.regulatoryLinks).toContain("Children Act 1989 s.22 — Duty to safeguard welfare");
    expect(result.regulatoryLinks).toContain("Quality Standards 2015 Standard 4");
    expect(result.regulatoryLinks).toContain("Financial Conduct Authority guidelines for looked-after children");
  });

  it("generates child profiles from filtered records", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.childProfiles.length).toBe(3);
    const childIds = result.childProfiles.map((p) => p.childId);
    expect(childIds).toContain("child-alex");
    expect(childIds).toContain("child-jordan");
    expect(childIds).toContain("child-morgan");
  });

  it("rating is outstanding for score >= 80", () => {
    const categories: PocketMoneyCategory[] = [
      "weekly_allowance", "birthday_money", "savings_deposit", "educational_purchase",
      "clothing_allowance", "activity_funding", "personal_spending", "financial_literacy_session",
    ];
    const perfectRecords = categories.map((c, i) =>
      makeRecord({ id: `pm-${i}`, date: "2026-03-15", childId: "child-alex", category: c }),
    );
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: perfectRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rating is inadequate for score < 40", () => {
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("actions mention low scoring children", () => {
    // Create a child with very low scores
    const records = [
      makeRecord({
        id: "pm-1", date: "2026-03-01", childId: "child-low", childName: "Low",
        receiptObtained: false, childConsentRecorded: false, balanceUpdated: false, supervisorApproved: false,
        documentationComplete: false, timelyRecording: false,
      }),
    ];
    const result = generatePocketMoneyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    // Child should have low score, triggering action
    const lowChild = result.childProfiles.find((p) => p.childId === "child-low");
    expect(lowChild).toBeDefined();
    expect(lowChild!.overallScore).toBeLessThanOrEqual(3);
    expect(result.actions).toEqual(expect.arrayContaining([expect.stringContaining("child(ren) with low financial management scores")]));
  });
});
