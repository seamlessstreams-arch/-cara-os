import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getComplaintCategoryLabel,
  getComplaintOutcomeLabel,
  getRatingLabel,
  evaluateComplaintQuality,
  evaluateComplaintCompliance,
  evaluateComplaintPolicy,
  evaluateStaffComplaintReadiness,
  buildChildComplaintProfiles,
  generateComplaintsIntelligence,
} from "../complaints-engine";
import type {
  ComplaintRecord,
  ComplaintPolicy,
  StaffComplaintTraining,
} from "../complaints-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ComplaintRecord> = {}): ComplaintRecord {
  return {
    id: "rec-1",
    homeId: "home-oak",
    date: "2026-03-15",
    childId: "child-1",
    childName: "Test Child",
    category: "care_quality",
    outcome: "resolved_upheld",
    acknowledgedWithinTarget: true,
    investigationThorough: true,
    childViewCaptured: true,
    outcomeExplainedToChild: true,
    documentationComplete: true,
    timelyResolution: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ComplaintPolicy> = {}): ComplaintPolicy {
  return {
    complaintsPolicy: true,
    investigationProcedure: true,
    childComplaintsGuide: true,
    independentAdvocacyAccess: true,
    escalationFramework: true,
    lessonLearnedProcess: true,
    ofstedNotificationProtocol: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffComplaintTraining> = {}): StaffComplaintTraining {
  return {
    staffId: "staff-1",
    complaintHandling: true,
    childAdvocacy: true,
    investigationSkills: true,
    recordKeeping: true,
    conflictResolution: true,
    regulatoryKnowledge: true,
    ...overrides,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => { expect(pct(5, 0)).toBe(0); });
  it("returns 100 for equal num and den", () => { expect(pct(10, 10)).toBe(100); });
  it("returns 50 for half", () => { expect(pct(5, 10)).toBe(50); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
  it("returns 0 for 0 numerator", () => { expect(pct(0, 10)).toBe(0); });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ── Label Helpers ──────────────────────────────────────────────────────────

describe("getComplaintCategoryLabel", () => {
  it("returns human-readable labels", () => {
    expect(getComplaintCategoryLabel("care_quality")).toBe("Care Quality");
    expect(getComplaintCategoryLabel("staff_conduct")).toBe("Staff Conduct");
    expect(getComplaintCategoryLabel("food_nutrition")).toBe("Food & Nutrition");
    expect(getComplaintCategoryLabel("environmental")).toBe("Environmental");
    expect(getComplaintCategoryLabel("privacy_dignity")).toBe("Privacy & Dignity");
    expect(getComplaintCategoryLabel("family_contact")).toBe("Family Contact");
    expect(getComplaintCategoryLabel("health_medication")).toBe("Health & Medication");
    expect(getComplaintCategoryLabel("safeguarding_concern")).toBe("Safeguarding Concern");
  });
});

describe("getComplaintOutcomeLabel", () => {
  it("returns human-readable labels", () => {
    expect(getComplaintOutcomeLabel("resolved_upheld")).toBe("Resolved (Upheld)");
    expect(getComplaintOutcomeLabel("resolved_not_upheld")).toBe("Resolved (Not Upheld)");
    expect(getComplaintOutcomeLabel("resolved_partially")).toBe("Resolved (Partially)");
    expect(getComplaintOutcomeLabel("withdrawn")).toBe("Withdrawn");
    expect(getComplaintOutcomeLabel("ongoing")).toBe("Ongoing");
  });
});

describe("getRatingLabel", () => {
  it("formats rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── Evaluator 1: Complaint Quality ────────────────────────────────────────

describe("evaluateComplaintQuality", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateComplaintQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalComplaints).toBe(0);
    expect(result.acknowledgedWithinTargetRate).toBe(0);
  });

  it("returns max score for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const result = evaluateComplaintQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalComplaints).toBe(2);
    expect(result.acknowledgedWithinTargetRate).toBe(100);
    expect(result.investigationThoroughRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ acknowledgedWithinTarget: false, investigationThorough: false, childViewCaptured: false, outcomeExplainedToChild: false })];
    const result = evaluateComplaintQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates mixed rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", acknowledgedWithinTarget: true, investigationThorough: false, childViewCaptured: true, outcomeExplainedToChild: false }),
      makeRecord({ id: "r2", acknowledgedWithinTarget: true, investigationThorough: true, childViewCaptured: false, outcomeExplainedToChild: false }),
    ];
    const result = evaluateComplaintQuality(records);
    expect(result.acknowledgedWithinTargetRate).toBe(100);
    expect(result.investigationThoroughRate).toBe(50);
    expect(result.childViewCapturedRate).toBe(50);
    expect(result.outcomeExplainedRate).toBe(0);
  });

  it("applies correct weights (7+6+6+6=25)", () => {
    const records = [makeRecord({ investigationThorough: false, childViewCaptured: false, outcomeExplainedToChild: false })];
    const result = evaluateComplaintQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("caps score at 25", () => {
    const result = evaluateComplaintQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 1: Additional Quality Edge Cases ───────────────────────────

describe("evaluateComplaintQuality — additional", () => {
  it("single record with only acknowledgedWithinTarget true gives weight-7 score", () => {
    const records = [makeRecord({ investigationThorough: false, childViewCaptured: false, outcomeExplainedToChild: false })];
    const result = evaluateComplaintQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("handles large record sets", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `r-${i}`, acknowledgedWithinTarget: i % 2 === 0 }),
    );
    const result = evaluateComplaintQuality(records);
    expect(result.acknowledgedWithinTargetRate).toBe(50);
    expect(result.totalComplaints).toBe(100);
  });

  it("rating maps correctly for low score", () => {
    const records = [makeRecord({ acknowledgedWithinTarget: false, investigationThorough: false, childViewCaptured: false, outcomeExplainedToChild: false })];
    const result = evaluateComplaintQuality(records);
    expect(result.rating).toBe("inadequate");
  });

  it("only investigationThorough true gives weight-6 score", () => {
    const records = [makeRecord({ acknowledgedWithinTarget: false, childViewCaptured: false, outcomeExplainedToChild: false })];
    const result = evaluateComplaintQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("only childViewCaptured true gives weight-6 score", () => {
    const records = [makeRecord({ acknowledgedWithinTarget: false, investigationThorough: false, outcomeExplainedToChild: false })];
    const result = evaluateComplaintQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("only outcomeExplainedToChild true gives weight-6 score", () => {
    const records = [makeRecord({ acknowledgedWithinTarget: false, investigationThorough: false, childViewCaptured: false })];
    const result = evaluateComplaintQuality(records);
    expect(result.overallScore).toBe(6);
  });
});

// ── Evaluator 2: Complaint Compliance ─────────────────────────────────────

describe("evaluateComplaintCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateComplaintCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.documentationRate).toBe(0);
  });

  it("calculates documentation and timely rates", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyResolution: true }),
      makeRecord({ id: "r2", documentationComplete: true, timelyResolution: false }),
      makeRecord({ id: "r3", documentationComplete: false, timelyResolution: false }),
    ];
    const result = evaluateComplaintCompliance(records);
    expect(result.documentationRate).toBe(67);
    expect(result.timelyResolutionRate).toBe(33);
  });

  it("calculates category diversity correctly", () => {
    const records = [makeRecord({ category: "care_quality" })];
    const result = evaluateComplaintCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13);
  });

  it("returns high diversity for many categories", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
      "privacy_dignity", "family_contact", "health_medication", "safeguarding_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateComplaintCompliance(records);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("applies correct weights (8+7+5+5=25)", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
      "privacy_dignity", "family_contact", "health_medication", "safeguarding_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateComplaintCompliance(records);
    expect(result.overallScore).toBe(25);
  });
});

// ── Evaluator 2: Additional Compliance Edge Cases ─────────────────────────

describe("evaluateComplaintCompliance — additional", () => {
  it("two categories gives 25% diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "care_quality" }),
      makeRecord({ id: "r2", category: "staff_conduct" }),
    ];
    const result = evaluateComplaintCompliance(records);
    expect(result.categoryDiversityRatio).toBe(25);
  });

  it("all compliance false with single category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyResolution: false, childViewCaptured: false })];
    const result = evaluateComplaintCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyResolutionRate).toBe(0);
    expect(result.overallScore).toBe(1); // only diversity 13% * 5 = 0.65 -> 1
  });

  it("four categories gives 50% diversity", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateComplaintCompliance(records);
    expect(result.categoryDiversityRatio).toBe(50);
  });

  it("childViewCapturedRate computed from records in compliance", () => {
    const records = [
      makeRecord({ id: "r1", childViewCaptured: true }),
      makeRecord({ id: "r2", childViewCaptured: false }),
    ];
    const result = evaluateComplaintCompliance(records);
    expect(result.childViewCapturedRate).toBe(50);
  });
});

// ── Evaluator 3: Complaint Policy ─────────────────────────────────────────

describe("evaluateComplaintPolicy", () => {
  it("returns zeros for null policy", () => {
    const result = evaluateComplaintPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.complaintsPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateComplaintPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateComplaintPolicy(makePolicy({
      complaintsPolicy: false, investigationProcedure: false, childComplaintsGuide: false,
      independentAdvocacyAccess: false, escalationFramework: false, lessonLearnedProcess: false, ofstedNotificationProtocol: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("weights first 4 at 4 points each", () => {
    const result = evaluateComplaintPolicy(makePolicy({
      complaintsPolicy: true, investigationProcedure: false, childComplaintsGuide: false,
      independentAdvocacyAccess: false, escalationFramework: false, lessonLearnedProcess: false, ofstedNotificationProtocol: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    const result = evaluateComplaintPolicy(makePolicy({
      complaintsPolicy: false, investigationProcedure: false, childComplaintsGuide: false,
      independentAdvocacyAccess: false, escalationFramework: true, lessonLearnedProcess: true, ofstedNotificationProtocol: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("handles partial policy (first 4 only = 16)", () => {
    const result = evaluateComplaintPolicy(makePolicy({
      escalationFramework: false, lessonLearnedProcess: false, ofstedNotificationProtocol: false,
    }));
    expect(result.overallScore).toBe(16);
    expect(result.rating).toBe("good");
  });

  it("preserves boolean values in result", () => {
    const result = evaluateComplaintPolicy(makePolicy({ complaintsPolicy: true, investigationProcedure: false }));
    expect(result.complaintsPolicy).toBe(true);
    expect(result.investigationProcedure).toBe(false);
  });
});

// ── Evaluator 3: Additional Policy Edge Cases ─────────────────────────────

describe("evaluateComplaintPolicy — additional", () => {
  it("single middle policy gives 4 points", () => {
    const result = evaluateComplaintPolicy(makePolicy({
      complaintsPolicy: false, investigationProcedure: false, childComplaintsGuide: true,
      independentAdvocacyAccess: false, escalationFramework: false, lessonLearnedProcess: false, ofstedNotificationProtocol: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("rating for score 9 -> 36 -> inadequate", () => {
    const result = evaluateComplaintPolicy(makePolicy({
      complaintsPolicy: false, investigationProcedure: false, childComplaintsGuide: false,
      independentAdvocacyAccess: false, escalationFramework: true, lessonLearnedProcess: true, ofstedNotificationProtocol: true,
    }));
    expect(result.overallScore).toBe(9);
    expect(result.rating).toBe("inadequate");
  });

  it("two 4-point policies give 8 points", () => {
    const result = evaluateComplaintPolicy(makePolicy({
      complaintsPolicy: true, investigationProcedure: true, childComplaintsGuide: false,
      independentAdvocacyAccess: false, escalationFramework: false, lessonLearnedProcess: false, ofstedNotificationProtocol: false,
    }));
    expect(result.overallScore).toBe(8);
  });
});

// ── Evaluator 4: Staff Readiness ──────────────────────────────────────────

describe("evaluateStaffComplaintReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffComplaintReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for all-true staff", () => {
    const staff = [makeTraining(), makeTraining({ staffId: "staff-2" })];
    const result = evaluateStaffComplaintReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeTraining({
      complaintHandling: false, childAdvocacy: false, investigationSkills: false,
      recordKeeping: false, conflictResolution: false, regulatoryKnowledge: false,
    })];
    const result = evaluateStaffComplaintReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2=25)", () => {
    const staff = [makeTraining({
      childAdvocacy: false, investigationSkills: false, recordKeeping: false,
      conflictResolution: false, regulatoryKnowledge: false,
    })];
    const result = evaluateStaffComplaintReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("only regulatoryKnowledge true gives weight-2 score", () => {
    const staff = [makeTraining({
      complaintHandling: false, childAdvocacy: false, investigationSkills: false,
      recordKeeping: false, conflictResolution: false, regulatoryKnowledge: true,
    })];
    const result = evaluateStaffComplaintReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      makeTraining({ staffId: "s1", complaintHandling: true, childAdvocacy: true, investigationSkills: false, recordKeeping: false, conflictResolution: false, regulatoryKnowledge: false }),
      makeTraining({ staffId: "s2", complaintHandling: true, childAdvocacy: false, investigationSkills: true, recordKeeping: false, conflictResolution: false, regulatoryKnowledge: false }),
    ];
    const result = evaluateStaffComplaintReadiness(staff);
    expect(result.complaintHandlingRate).toBe(100);
    expect(result.childAdvocacyRate).toBe(50);
    expect(result.investigationSkillsRate).toBe(50);
  });
});

// ── Evaluator 4: Additional Staff Edge Cases ──────────────────────────────

describe("evaluateStaffComplaintReadiness — additional", () => {
  it("3 staff with mixed skills", () => {
    const staff = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", complaintHandling: false, childAdvocacy: false }),
      makeTraining({ staffId: "s3", investigationSkills: false, recordKeeping: false, conflictResolution: false, regulatoryKnowledge: false }),
    ];
    const result = evaluateStaffComplaintReadiness(staff);
    expect(result.totalStaff).toBe(3);
    expect(result.complaintHandlingRate).toBe(67);
  });

  it("only conflictResolution true gives weight-3 score", () => {
    const staff = [makeTraining({
      complaintHandling: false, childAdvocacy: false, investigationSkills: false,
      recordKeeping: false, conflictResolution: true, regulatoryKnowledge: false,
    })];
    const result = evaluateStaffComplaintReadiness(staff);
    expect(result.overallScore).toBe(3);
  });

  it("only recordKeeping true gives weight-4 score", () => {
    const staff = [makeTraining({
      complaintHandling: false, childAdvocacy: false, investigationSkills: false,
      recordKeeping: true, conflictResolution: false, regulatoryKnowledge: false,
    })];
    const result = evaluateStaffComplaintReadiness(staff);
    expect(result.overallScore).toBe(4);
  });
});

// ── Child Profiles ────────────────────────────────────────────────────────

describe("buildChildComplaintProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildComplaintProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildComplaintProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "c1")?.totalRecords).toBe(2);
  });

  it("scores frequency: >=10 -> 2, >=5 -> 1, <5 -> 0", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", acknowledgedWithinTarget: false, childViewCaptured: false }),
    );
    const profiles = buildChildComplaintProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores rate1 (acknowledgedWithinTargetRate): >=80 -> 3", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", acknowledgedWithinTarget: i < 4, childViewCaptured: false }),
    );
    const profiles = buildChildComplaintProfiles(recs);
    // freq=1, rate1(80%)=3, rate2(0%)=0, diversity(1)=0 -> 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("scores diversity: >=4 -> 2, >=2 -> 1", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
    ];
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: cat, acknowledgedWithinTarget: false, childViewCaptured: false }),
    );
    const profiles = buildChildComplaintProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps at 10", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
    ];
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: categories[i % 4] }),
    );
    const profiles = buildChildComplaintProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("2 categories gives diversity 1", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", category: "care_quality", acknowledgedWithinTarget: false, childViewCaptured: false }),
      makeRecord({ id: "r2", childId: "c1", category: "staff_conduct", acknowledgedWithinTarget: false, childViewCaptured: false }),
    ];
    const profiles = buildChildComplaintProfiles(recs);
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });
});

// ── Additional Child Profile Edge Cases ──────────────────────────────────

describe("buildChildComplaintProfiles — additional", () => {
  it("rate2 childViewCapturedRate 60% -> 2 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", acknowledgedWithinTarget: false, childViewCaptured: i < 3 }),
    );
    const profiles = buildChildComplaintProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(60%)=2, diversity(1)=0 -> 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("preserves child name from first record", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex Updated" }),
    ];
    const profiles = buildChildComplaintProfiles(recs);
    expect(profiles[0].childName).toBe("Alex");
  });

  it("rate1 40% -> 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", acknowledgedWithinTarget: i < 2, childViewCaptured: false }),
    );
    const profiles = buildChildComplaintProfiles(recs);
    // freq=1, rate1(40%)=1, rate2(0%)=0, diversity(1)=0 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("rate1 60% -> 2 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", acknowledgedWithinTarget: i < 3, childViewCaptured: false }),
    );
    const profiles = buildChildComplaintProfiles(recs);
    // freq=1, rate1(60%)=2, rate2(0%)=0, diversity(1)=0 -> 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("rate2 80% -> 3 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", acknowledgedWithinTarget: false, childViewCaptured: i < 4 }),
    );
    const profiles = buildChildComplaintProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(80%)=3, diversity(1)=0 -> 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("rate2 40% -> 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", acknowledgedWithinTarget: false, childViewCaptured: i < 2 }),
    );
    const profiles = buildChildComplaintProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(40%)=1, diversity(1)=0 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("single record single category gives 0 diversity and 0 freq", () => {
    const recs = [makeRecord({ id: "r1", childId: "c1", acknowledgedWithinTarget: false, childViewCaptured: false })];
    const profiles = buildChildComplaintProfiles(recs);
    expect(profiles[0].overallScore).toBe(0);
    expect(profiles[0].categoriesCovered).toHaveLength(1);
  });
});

// ── Master Generator ──────────────────────────────────────────────────────

describe("generateComplaintsIntelligence", () => {
  it("returns correct structure with all data", () => {
    const result = generateComplaintsIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [makeRecord()],
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.complaintQuality).toBeDefined();
    expect(result.complaintCompliance).toBeDefined();
    expect(result.complaintPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("sums 4 evaluator scores", () => {
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: makePolicy(), staff: [makeTraining()],
    });
    const expectedTotal = result.complaintQuality.overallScore + result.complaintCompliance.overallScore + result.complaintPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedTotal));
  });

  it("caps overall score at 100", () => {
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns inadequate for empty data", () => {
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [], policy: null, staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for metrics >= 80%", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
      "privacy_dignity", "family_contact", "health_medication", "safeguarding_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low metrics", () => {
    const records = [makeRecord({
      acknowledgedWithinTarget: false, investigationThorough: false, childViewCaptured: false,
      outcomeExplainedToChild: false, documentationComplete: false, timelyResolution: false,
    })];
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: null, staff: [makeTraining()],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when staff is empty", () => {
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: makePolicy(), staff: [],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
    ];
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.childProfiles).toHaveLength(2);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [], policy: null, staff: [],
    });
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 39");
  });

  it("no areas for improvement when all metrics high", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
      "privacy_dignity", "family_contact", "health_medication", "safeguarding_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty childProfiles when no records", () => {
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [], policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.childProfiles).toHaveLength(0);
  });

  it("returns outstanding for fully compliant data", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
      "privacy_dignity", "family_contact", "health_medication", "safeguarding_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBe(100);
  });

  it("generates actions for low metrics (<50%)", () => {
    const records = [makeRecord({
      acknowledgedWithinTarget: false, investigationThorough: false, childViewCaptured: false,
      documentationComplete: false, timelyResolution: false,
    })];
    const staff = [makeTraining({ investigationSkills: false })];
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff,
    });
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("no strengths when all metrics are low", () => {
    const records = [makeRecord({
      acknowledgedWithinTarget: false, investigationThorough: false, childViewCaptured: false,
      outcomeExplainedToChild: false, documentationComplete: false, timelyResolution: false,
    })];
    const staff = [makeTraining({
      complaintHandling: false, childAdvocacy: false, investigationSkills: false,
      recordKeeping: false, conflictResolution: false, regulatoryKnowledge: false,
    })];
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: null, staff,
    });
    expect(result.strengths).toHaveLength(0);
  });

  it("handles mixed children and categories in profiles", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex", category: "care_quality" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex", category: "staff_conduct" }),
      makeRecord({ id: "r3", childId: "c2", childName: "Jordan", category: "food_nutrition" }),
    ];
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.childProfiles).toHaveLength(2);
    const alex = result.childProfiles.find(p => p.childId === "c1");
    expect(alex?.categoriesCovered).toHaveLength(2);
  });

  it("returns good rating for good-level data", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
    ];
    const records = categories.map((cat, i) => makeRecord({
      id: `r-${i}`, category: cat,
      outcomeExplainedToChild: false,
      timelyResolution: i < 2,
    }));
    const policy = makePolicy({ escalationFramework: false, lessonLearnedProcess: false, ofstedNotificationProtocol: false });
    const staff = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", investigationSkills: false, recordKeeping: false, conflictResolution: false, regulatoryKnowledge: false }),
    ];
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy, staff,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
    expect(result.rating).toBe("good");
  });

  it("returns requires_improvement rating for mid-level data", () => {
    const categories: Array<ComplaintRecord["category"]> = [
      "care_quality", "staff_conduct", "food_nutrition", "environmental",
    ];
    const records = categories.map((cat, i) => makeRecord({
      id: `r-${i}`, category: cat,
      acknowledgedWithinTarget: i < 2,
      investigationThorough: i < 2,
      childViewCaptured: i < 2,
      outcomeExplainedToChild: false,
      documentationComplete: i < 2,
      timelyResolution: i < 2,
    }));
    const policy = makePolicy({
      complaintsPolicy: true, investigationProcedure: true, childComplaintsGuide: true,
      independentAdvocacyAccess: false, escalationFramework: false, lessonLearnedProcess: false, ofstedNotificationProtocol: false,
    });
    const staff = [
      makeTraining({ staffId: "s1", complaintHandling: true, childAdvocacy: true, investigationSkills: false, recordKeeping: false, conflictResolution: false, regulatoryKnowledge: false }),
    ];
    const result = generateComplaintsIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy, staff,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThan(60);
    expect(result.rating).toBe("requires_improvement");
  });
});
