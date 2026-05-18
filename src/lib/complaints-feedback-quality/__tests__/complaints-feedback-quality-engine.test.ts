// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Complaints & Feedback Quality Intelligence Engine Tests
// 100+ tests covering all functions, scoring, labels, edge cases
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateComplaintHandling,
  evaluateFeedbackCulture,
  evaluateLearningOutcomes,
  evaluatePolicyCompliance,
  buildChildComplaintProfiles,
  generateComplaintsFeedbackQualityIntelligence,
  pct,
  getRating,
  getComplaintCategoryLabel,
  getComplaintStatusLabel,
  getComplaintStageLabel,
  getResolutionOutcomeLabel,
  getComplainantTypeLabel,
  getFeedbackTypeLabel,
  getFeedbackSourceLabel,
  getRatingLabel,
} from "../complaints-feedback-quality-engine";
import type {
  ComplaintRecord,
  FeedbackRecord,
  ComplaintsPolicy,
  LessonLearned,
} from "../complaints-feedback-quality-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const CHILD_IDS = ["alex", "jordan", "morgan"];
const CHILD_NAMES: Record<string, string> = {
  alex: "Alex",
  jordan: "Jordan",
  morgan: "Morgan",
};

function makeComplaint(overrides: Partial<ComplaintRecord> = {}): ComplaintRecord {
  return {
    id: "c-01",
    childId: "alex",
    childName: "Alex",
    complainantType: "child",
    feedbackType: "formal_complaint",
    category: "care_quality",
    stage: "stage_1",
    status: "resolved",
    outcome: "upheld",
    dateReceived: "2025-01-01",
    dateResolved: "2025-01-10",
    targetResolutionDays: 20,
    actualResolutionDays: 10,
    childInformedOfOutcome: true,
    childSupportedToComplain: true,
    lessonsLearned: true,
    actionsTaken: ["Reviewed care plan"],
    escalatedExternally: false,
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<FeedbackRecord> = {}): FeedbackRecord {
  return {
    id: "f-01",
    source: "child",
    feedbackType: "compliment",
    date: "2025-03-01",
    category: null,
    acknowledged: true,
    actedUpon: true,
    responseWithinTimescale: true,
    childId: "alex",
    childName: "Alex",
    ...overrides,
  };
}

function makeLesson(overrides: Partial<LessonLearned> = {}): LessonLearned {
  return {
    id: "l-01",
    complaintId: "c-01",
    description: "Improved care plan review frequency",
    implementedDate: "2025-02-01",
    impactAssessed: true,
    sharedWithTeam: true,
    policyChanged: false,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ComplaintsPolicy> = {}): ComplaintsPolicy {
  return {
    id: "p-01",
    homeId: "oak-house",
    policyReviewedDate: "2025-01-01",
    childFriendlyVersionAvailable: true,
    displayedProminently: true,
    childrenAwareOfProcess: true,
    advocacyAccessible: true,
    independentPersonAvailable: true,
    regularAuditCompleted: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
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

  it("returns 100 for equal numerator/denominator", () => {
    expect(pct(5, 5)).toBe(100);
  });

  it("returns 0 for zero numerator", () => {
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

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getComplaintCategoryLabel", () => {
  it("returns correct label for care_quality", () => {
    expect(getComplaintCategoryLabel("care_quality")).toBe("Care Quality");
  });
  it("returns correct label for staff_conduct", () => {
    expect(getComplaintCategoryLabel("staff_conduct")).toBe("Staff Conduct");
  });
  it("returns correct label for safeguarding", () => {
    expect(getComplaintCategoryLabel("safeguarding")).toBe("Safeguarding");
  });
  it("returns correct label for food_nutrition", () => {
    expect(getComplaintCategoryLabel("food_nutrition")).toBe("Food & Nutrition");
  });
  it("returns correct label for environment", () => {
    expect(getComplaintCategoryLabel("environment")).toBe("Environment");
  });
  it("returns correct label for education", () => {
    expect(getComplaintCategoryLabel("education")).toBe("Education");
  });
  it("returns correct label for contact_family", () => {
    expect(getComplaintCategoryLabel("contact_family")).toBe("Contact & Family");
  });
  it("returns correct label for bullying", () => {
    expect(getComplaintCategoryLabel("bullying")).toBe("Bullying");
  });
  it("returns correct label for medication", () => {
    expect(getComplaintCategoryLabel("medication")).toBe("Medication");
  });
  it("returns correct label for privacy", () => {
    expect(getComplaintCategoryLabel("privacy")).toBe("Privacy");
  });
  it("returns correct label for discrimination", () => {
    expect(getComplaintCategoryLabel("discrimination")).toBe("Discrimination");
  });
  it("returns correct label for other", () => {
    expect(getComplaintCategoryLabel("other")).toBe("Other");
  });
});

describe("getComplaintStatusLabel", () => {
  it("returns correct label for open", () => {
    expect(getComplaintStatusLabel("open")).toBe("Open");
  });
  it("returns correct label for investigating", () => {
    expect(getComplaintStatusLabel("investigating")).toBe("Investigating");
  });
  it("returns correct label for resolved", () => {
    expect(getComplaintStatusLabel("resolved")).toBe("Resolved");
  });
  it("returns correct label for escalated", () => {
    expect(getComplaintStatusLabel("escalated")).toBe("Escalated");
  });
  it("returns correct label for withdrawn", () => {
    expect(getComplaintStatusLabel("withdrawn")).toBe("Withdrawn");
  });
});

describe("getComplaintStageLabel", () => {
  it("returns correct label for informal", () => {
    expect(getComplaintStageLabel("informal")).toBe("Informal");
  });
  it("returns correct label for stage_1", () => {
    expect(getComplaintStageLabel("stage_1")).toBe("Stage 1");
  });
  it("returns correct label for stage_2", () => {
    expect(getComplaintStageLabel("stage_2")).toBe("Stage 2");
  });
  it("returns correct label for stage_3_panel", () => {
    expect(getComplaintStageLabel("stage_3_panel")).toBe("Stage 3 Panel");
  });
  it("returns correct label for ombudsman", () => {
    expect(getComplaintStageLabel("ombudsman")).toBe("Ombudsman");
  });
});

describe("getResolutionOutcomeLabel", () => {
  it("returns correct label for upheld", () => {
    expect(getResolutionOutcomeLabel("upheld")).toBe("Upheld");
  });
  it("returns correct label for partially_upheld", () => {
    expect(getResolutionOutcomeLabel("partially_upheld")).toBe("Partially Upheld");
  });
  it("returns correct label for not_upheld", () => {
    expect(getResolutionOutcomeLabel("not_upheld")).toBe("Not Upheld");
  });
  it("returns correct label for withdrawn", () => {
    expect(getResolutionOutcomeLabel("withdrawn")).toBe("Withdrawn");
  });
  it("returns correct label for ongoing", () => {
    expect(getResolutionOutcomeLabel("ongoing")).toBe("Ongoing");
  });
});

describe("getComplainantTypeLabel", () => {
  it("returns correct label for child", () => {
    expect(getComplainantTypeLabel("child")).toBe("Child");
  });
  it("returns correct label for parent_carer", () => {
    expect(getComplainantTypeLabel("parent_carer")).toBe("Parent/Carer");
  });
  it("returns correct label for social_worker", () => {
    expect(getComplainantTypeLabel("social_worker")).toBe("Social Worker");
  });
  it("returns correct label for advocate", () => {
    expect(getComplainantTypeLabel("advocate")).toBe("Advocate");
  });
  it("returns correct label for staff", () => {
    expect(getComplainantTypeLabel("staff")).toBe("Staff");
  });
  it("returns correct label for external", () => {
    expect(getComplainantTypeLabel("external")).toBe("External");
  });
});

describe("getFeedbackTypeLabel", () => {
  it("returns correct label for compliment", () => {
    expect(getFeedbackTypeLabel("compliment")).toBe("Compliment");
  });
  it("returns correct label for suggestion", () => {
    expect(getFeedbackTypeLabel("suggestion")).toBe("Suggestion");
  });
  it("returns correct label for concern", () => {
    expect(getFeedbackTypeLabel("concern")).toBe("Concern");
  });
  it("returns correct label for formal_complaint", () => {
    expect(getFeedbackTypeLabel("formal_complaint")).toBe("Formal Complaint");
  });
});

describe("getFeedbackSourceLabel", () => {
  it("returns correct label for child", () => {
    expect(getFeedbackSourceLabel("child")).toBe("Child");
  });
  it("returns correct label for family", () => {
    expect(getFeedbackSourceLabel("family")).toBe("Family");
  });
  it("returns correct label for social_worker", () => {
    expect(getFeedbackSourceLabel("social_worker")).toBe("Social Worker");
  });
  it("returns correct label for visiting_professional", () => {
    expect(getFeedbackSourceLabel("visiting_professional")).toBe("Visiting Professional");
  });
  it("returns correct label for staff", () => {
    expect(getFeedbackSourceLabel("staff")).toBe("Staff");
  });
  it("returns correct label for reg44_visitor", () => {
    expect(getFeedbackSourceLabel("reg44_visitor")).toBe("Reg 44 Visitor");
  });
  it("returns correct label for anonymous", () => {
    expect(getFeedbackSourceLabel("anonymous")).toBe("Anonymous");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns correct label for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns correct label for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateComplaintHandling
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateComplaintHandling", () => {
  it("returns score 25 for empty complaints", () => {
    const result = evaluateComplaintHandling([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalComplaints).toBe(0);
    expect(result.resolvedWithinTimescaleRate).toBe(0);
    expect(result.escalationCount).toBe(0);
  });

  it("scores a single perfectly handled complaint highly", () => {
    const result = evaluateComplaintHandling([makeComplaint()]);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.totalComplaints).toBe(1);
    expect(result.resolvedWithinTimescaleRate).toBe(100);
    expect(result.childInformedRate).toBe(100);
    expect(result.childSupportedRate).toBe(100);
  });

  it("calculates resolution timeliness correctly", () => {
    const complaints = [
      makeComplaint({ id: "c-01", actualResolutionDays: 5, targetResolutionDays: 10 }),
      makeComplaint({ id: "c-02", actualResolutionDays: 15, targetResolutionDays: 10 }),
    ];
    const result = evaluateComplaintHandling(complaints);
    expect(result.resolvedWithinTimescaleRate).toBe(50);
  });

  it("calculates child informed rate correctly", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childInformedOfOutcome: true }),
      makeComplaint({ id: "c-02", childInformedOfOutcome: false }),
    ];
    const result = evaluateComplaintHandling(complaints);
    expect(result.childInformedRate).toBe(50);
  });

  it("calculates child supported rate correctly", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childSupportedToComplain: true }),
      makeComplaint({ id: "c-02", childSupportedToComplain: false }),
      makeComplaint({ id: "c-03", childSupportedToComplain: false }),
    ];
    const result = evaluateComplaintHandling(complaints);
    expect(result.childSupportedRate).toBe(33);
  });

  it("penalises unresolved safeguarding complaints (-5 each)", () => {
    const complaints = [
      makeComplaint({ id: "c-01", category: "safeguarding", status: "open" }),
      makeComplaint({ id: "c-02", category: "safeguarding", status: "investigating" }),
    ];
    const result = evaluateComplaintHandling(complaints);
    // Two unresolved safeguarding = -10 penalty
    expect(result.overallScore).toBeLessThanOrEqual(15);
  });

  it("does not penalise resolved safeguarding complaints", () => {
    const complaints = [
      makeComplaint({ id: "c-01", category: "safeguarding", status: "resolved" }),
    ];
    const result = evaluateComplaintHandling(complaints);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
  });

  it("counts escalations correctly", () => {
    const complaints = [
      makeComplaint({ id: "c-01", escalatedExternally: true }),
      makeComplaint({ id: "c-02", escalatedExternally: false }),
      makeComplaint({ id: "c-03", escalatedExternally: true }),
    ];
    const result = evaluateComplaintHandling(complaints);
    expect(result.escalationCount).toBe(2);
  });

  it("calculates average resolution days correctly", () => {
    const complaints = [
      makeComplaint({ id: "c-01", actualResolutionDays: 5 }),
      makeComplaint({ id: "c-02", actualResolutionDays: 15 }),
    ];
    const result = evaluateComplaintHandling(complaints);
    expect(result.averageResolutionDays).toBe(10);
  });

  it("handles complaints with null actualResolutionDays", () => {
    const complaints = [
      makeComplaint({ id: "c-01", actualResolutionDays: null, status: "open" }),
    ];
    const result = evaluateComplaintHandling(complaints);
    expect(result.averageResolutionDays).toBe(0);
  });

  it("computes upheld/partially rate from outcomes", () => {
    const complaints = [
      makeComplaint({ id: "c-01", outcome: "upheld" }),
      makeComplaint({ id: "c-02", outcome: "partially_upheld" }),
      makeComplaint({ id: "c-03", outcome: "not_upheld" }),
      makeComplaint({ id: "c-04", outcome: null }),
    ];
    const result = evaluateComplaintHandling(complaints);
    // 2 out of 3 with outcome
    expect(result.upheldPartiallyRate).toBe(67);
  });

  it("score never goes below 0", () => {
    const complaints = [
      makeComplaint({ id: "c-01", category: "safeguarding", status: "open", childInformedOfOutcome: false, childSupportedToComplain: false, escalatedExternally: true, actualResolutionDays: null }),
      makeComplaint({ id: "c-02", category: "safeguarding", status: "investigating", childInformedOfOutcome: false, childSupportedToComplain: false, escalatedExternally: true, actualResolutionDays: null }),
      makeComplaint({ id: "c-03", category: "safeguarding", status: "escalated", childInformedOfOutcome: false, childSupportedToComplain: false, escalatedExternally: true, actualResolutionDays: null }),
    ];
    const result = evaluateComplaintHandling(complaints);
    expect(result.overallScore).toBe(0);
  });

  it("handles complaints with no child link (null childId)", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childId: null, childName: null }),
    ];
    const result = evaluateComplaintHandling(complaints);
    // No child-linked complaints means 100% informed/supported by default
    expect(result.totalComplaints).toBe(1);
  });

  it("score capped at 25", () => {
    const result = evaluateComplaintHandling([]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts withdrawn as resolved for timeliness", () => {
    const complaints = [
      makeComplaint({ id: "c-01", status: "withdrawn", actualResolutionDays: 5, targetResolutionDays: 10 }),
    ];
    const result = evaluateComplaintHandling(complaints);
    expect(result.resolvedWithinTimescaleRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateFeedbackCulture
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateFeedbackCulture", () => {
  it("returns score 0 for empty feedback", () => {
    const result = evaluateFeedbackCulture([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalFeedback).toBe(0);
    expect(result.acknowledgedRate).toBe(0);
    expect(result.childFeedbackCount).toBe(0);
    expect(result.complimentCount).toBe(0);
    expect(result.suggestionCount).toBe(0);
  });

  it("scores perfect feedback highly", () => {
    const feedback = [
      makeFeedback({ id: "f-01", source: "child" }),
      makeFeedback({ id: "f-02", source: "child" }),
      makeFeedback({ id: "f-03", source: "family" }),
    ];
    const result = evaluateFeedbackCulture(feedback);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.acknowledgedRate).toBe(100);
    expect(result.actedUponRate).toBe(100);
    expect(result.responseTimelyRate).toBe(100);
  });

  it("calculates acknowledged rate correctly", () => {
    const feedback = [
      makeFeedback({ id: "f-01", acknowledged: true }),
      makeFeedback({ id: "f-02", acknowledged: false }),
    ];
    const result = evaluateFeedbackCulture(feedback);
    expect(result.acknowledgedRate).toBe(50);
  });

  it("calculates acted upon rate correctly", () => {
    const feedback = [
      makeFeedback({ id: "f-01", actedUpon: true }),
      makeFeedback({ id: "f-02", actedUpon: false }),
      makeFeedback({ id: "f-03", actedUpon: false }),
    ];
    const result = evaluateFeedbackCulture(feedback);
    expect(result.actedUponRate).toBe(33);
  });

  it("calculates response timeliness correctly", () => {
    const feedback = [
      makeFeedback({ id: "f-01", responseWithinTimescale: true }),
      makeFeedback({ id: "f-02", responseWithinTimescale: false }),
    ];
    const result = evaluateFeedbackCulture(feedback);
    expect(result.responseTimelyRate).toBe(50);
  });

  it("counts child feedback correctly", () => {
    const feedback = [
      makeFeedback({ id: "f-01", source: "child" }),
      makeFeedback({ id: "f-02", source: "family" }),
      makeFeedback({ id: "f-03", source: "child" }),
    ];
    const result = evaluateFeedbackCulture(feedback);
    expect(result.childFeedbackCount).toBe(2);
  });

  it("counts compliments correctly", () => {
    const feedback = [
      makeFeedback({ id: "f-01", feedbackType: "compliment" }),
      makeFeedback({ id: "f-02", feedbackType: "suggestion" }),
      makeFeedback({ id: "f-03", feedbackType: "compliment" }),
    ];
    const result = evaluateFeedbackCulture(feedback);
    expect(result.complimentCount).toBe(2);
  });

  it("counts suggestions correctly", () => {
    const feedback = [
      makeFeedback({ id: "f-01", feedbackType: "suggestion" }),
      makeFeedback({ id: "f-02", feedbackType: "compliment" }),
    ];
    const result = evaluateFeedbackCulture(feedback);
    expect(result.suggestionCount).toBe(1);
  });

  it("gives lower score when no child feedback present", () => {
    const feedback = [
      makeFeedback({ id: "f-01", source: "family" }),
      makeFeedback({ id: "f-02", source: "staff" }),
    ];
    const result = evaluateFeedbackCulture(feedback);
    // 0% child feedback proportion should lose 20% weighting
    expect(result.childFeedbackCount).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("score stays between 0 and 25", () => {
    const feedback = [
      makeFeedback({ id: "f-01", acknowledged: false, actedUpon: false, responseWithinTimescale: false, source: "staff" }),
    ];
    const result = evaluateFeedbackCulture(feedback);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateLearningOutcomes
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateLearningOutcomes", () => {
  it("returns 0 when no lessons and complaints exist", () => {
    const result = evaluateLearningOutcomes([], true);
    expect(result.overallScore).toBe(0);
    expect(result.totalLessons).toBe(0);
  });

  it("returns 25 when no lessons and no complaints", () => {
    const result = evaluateLearningOutcomes([], false);
    expect(result.overallScore).toBe(25);
  });

  it("scores perfect lessons highly", () => {
    const lessons = [
      makeLesson({ id: "l-01" }),
      makeLesson({ id: "l-02" }),
    ];
    const result = evaluateLearningOutcomes(lessons, true);
    expect(result.overallScore).toBe(25);
    expect(result.implementedRate).toBe(100);
    expect(result.impactAssessedRate).toBe(100);
    expect(result.sharedWithTeamRate).toBe(100);
  });

  it("calculates implemented rate correctly", () => {
    const lessons = [
      makeLesson({ id: "l-01", implementedDate: "2025-02-01" }),
      makeLesson({ id: "l-02", implementedDate: null }),
    ];
    const result = evaluateLearningOutcomes(lessons, true);
    expect(result.implementedRate).toBe(50);
  });

  it("calculates impact assessed rate correctly", () => {
    const lessons = [
      makeLesson({ id: "l-01", impactAssessed: true }),
      makeLesson({ id: "l-02", impactAssessed: false }),
      makeLesson({ id: "l-03", impactAssessed: false }),
    ];
    const result = evaluateLearningOutcomes(lessons, true);
    expect(result.impactAssessedRate).toBe(33);
  });

  it("calculates shared with team rate correctly", () => {
    const lessons = [
      makeLesson({ id: "l-01", sharedWithTeam: true }),
      makeLesson({ id: "l-02", sharedWithTeam: false }),
    ];
    const result = evaluateLearningOutcomes(lessons, true);
    expect(result.sharedWithTeamRate).toBe(50);
  });

  it("counts policy changes correctly", () => {
    const lessons = [
      makeLesson({ id: "l-01", policyChanged: true }),
      makeLesson({ id: "l-02", policyChanged: false }),
      makeLesson({ id: "l-03", policyChanged: true }),
    ];
    const result = evaluateLearningOutcomes(lessons, true);
    expect(result.policyChangedCount).toBe(2);
  });

  it("gives low score when nothing is implemented", () => {
    const lessons = [
      makeLesson({ id: "l-01", implementedDate: null, impactAssessed: false, sharedWithTeam: false }),
    ];
    const result = evaluateLearningOutcomes(lessons, true);
    expect(result.overallScore).toBe(0);
  });

  it("score stays between 0 and 25", () => {
    const lessons = [makeLesson()];
    const result = evaluateLearningOutcomes(lessons, true);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePolicyCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePolicyCompliance", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluatePolicyCompliance(null);
    expect(result.overallScore).toBe(0);
    expect(result.childFriendlyVersion).toBe(false);
    expect(result.displayedProminently).toBe(false);
    expect(result.childrenAware).toBe(false);
    expect(result.advocacyAccessible).toBe(false);
    expect(result.independentPerson).toBe(false);
    expect(result.auditCompleted).toBe(false);
    expect(result.complianceRate).toBe(0);
  });

  it("returns score 25 for fully compliant policy", () => {
    const result = evaluatePolicyCompliance(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.complianceRate).toBe(100);
    expect(result.childFriendlyVersion).toBe(true);
    expect(result.displayedProminently).toBe(true);
    expect(result.childrenAware).toBe(true);
    expect(result.advocacyAccessible).toBe(true);
    expect(result.independentPerson).toBe(true);
    expect(result.auditCompleted).toBe(true);
  });

  it("scores partially compliant policy proportionally", () => {
    const policy = makePolicy({
      childFriendlyVersionAvailable: true,
      displayedProminently: true,
      childrenAwareOfProcess: true,
      advocacyAccessible: false,
      independentPersonAvailable: false,
      regularAuditCompleted: false,
    });
    const result = evaluatePolicyCompliance(policy);
    // 3/6 = 50% compliance
    expect(result.complianceRate).toBe(50);
    expect(result.overallScore).toBe(13); // round(3/6 * 25) = 13
  });

  it("returns correct booleans for each field", () => {
    const policy = makePolicy({
      childFriendlyVersionAvailable: false,
      displayedProminently: true,
      childrenAwareOfProcess: false,
      advocacyAccessible: true,
      independentPersonAvailable: false,
      regularAuditCompleted: true,
    });
    const result = evaluatePolicyCompliance(policy);
    expect(result.childFriendlyVersion).toBe(false);
    expect(result.displayedProminently).toBe(true);
    expect(result.childrenAware).toBe(false);
    expect(result.advocacyAccessible).toBe(true);
    expect(result.independentPerson).toBe(false);
    expect(result.auditCompleted).toBe(true);
  });

  it("returns score 0 for all-false policy", () => {
    const policy = makePolicy({
      childFriendlyVersionAvailable: false,
      displayedProminently: false,
      childrenAwareOfProcess: false,
      advocacyAccessible: false,
      independentPersonAvailable: false,
      regularAuditCompleted: false,
    });
    const result = evaluatePolicyCompliance(policy);
    expect(result.overallScore).toBe(0);
    expect(result.complianceRate).toBe(0);
  });

  it("single true field gives proportional score", () => {
    const policy = makePolicy({
      childFriendlyVersionAvailable: true,
      displayedProminently: false,
      childrenAwareOfProcess: false,
      advocacyAccessible: false,
      independentPersonAvailable: false,
      regularAuditCompleted: false,
    });
    const result = evaluatePolicyCompliance(policy);
    expect(result.complianceRate).toBe(17); // round(1/6 * 100)
    expect(result.overallScore).toBe(4); // round(1/6 * 25)
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildComplaintProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildComplaintProfiles", () => {
  it("builds profiles for all children", () => {
    const profiles = buildChildComplaintProfiles([], [], CHILD_IDS, CHILD_NAMES);
    expect(profiles).toHaveLength(3);
    expect(profiles[0].childId).toBe("alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[1].childId).toBe("jordan");
    expect(profiles[2].childId).toBe("morgan");
  });

  it("counts complaints per child correctly", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childId: "alex" }),
      makeComplaint({ id: "c-02", childId: "alex" }),
      makeComplaint({ id: "c-03", childId: "jordan" }),
    ];
    const profiles = buildChildComplaintProfiles(complaints, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].complaintCount).toBe(2);
    expect(profiles[1].complaintCount).toBe(1);
    expect(profiles[2].complaintCount).toBe(0);
  });

  it("counts feedback per child correctly", () => {
    const feedback = [
      makeFeedback({ id: "f-01", childId: "morgan" }),
      makeFeedback({ id: "f-02", childId: "morgan" }),
    ];
    const profiles = buildChildComplaintProfiles([], feedback, CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].feedbackCount).toBe(0); // alex
    expect(profiles[2].feedbackCount).toBe(2); // morgan
  });

  it("marks supportedToComplain correctly", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childId: "alex", childSupportedToComplain: true }),
      makeComplaint({ id: "c-02", childId: "jordan", childSupportedToComplain: false }),
    ];
    const profiles = buildChildComplaintProfiles(complaints, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].supportedToComplain).toBe(true); // alex supported
    expect(profiles[1].supportedToComplain).toBe(false); // jordan not
    expect(profiles[2].supportedToComplain).toBe(true); // morgan: no complaints = true by default
  });

  it("marks informedOfOutcomes correctly when all informed", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childId: "alex", childInformedOfOutcome: true, status: "resolved" }),
    ];
    const profiles = buildChildComplaintProfiles(complaints, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].informedOfOutcomes).toBe(true);
  });

  it("marks informedOfOutcomes true when complaint is open/investigating", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childId: "alex", childInformedOfOutcome: false, status: "open" }),
    ];
    const profiles = buildChildComplaintProfiles(complaints, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].informedOfOutcomes).toBe(true);
  });

  it("child with no complaints has default score of 5", () => {
    const profiles = buildChildComplaintProfiles([], [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].overallScore).toBe(5);
  });

  it("child with complaints and perfect handling scores high", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childId: "alex", childInformedOfOutcome: true, childSupportedToComplain: true }),
    ];
    const profiles = buildChildComplaintProfiles(complaints, [], CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("child with feedback gets bonus score", () => {
    const feedback = [
      makeFeedback({ id: "f-01", childId: "alex" }),
    ];
    const profiles = buildChildComplaintProfiles([], feedback, CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].overallScore).toBe(6); // 5 baseline + 1 bonus
  });

  it("score capped at 10", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childId: "alex", childInformedOfOutcome: true, childSupportedToComplain: true }),
    ];
    const feedback = [
      makeFeedback({ id: "f-01", childId: "alex" }),
    ];
    const profiles = buildChildComplaintProfiles(complaints, feedback, CHILD_IDS, CHILD_NAMES);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("uses childId as name when not in childNames", () => {
    const profiles = buildChildComplaintProfiles([], [], ["unknown-child"], {});
    expect(profiles[0].childName).toBe("unknown-child");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateComplaintsFeedbackQualityIntelligence — main function
// ══════════════════════════════════════════════════════════════════════════════

describe("generateComplaintsFeedbackQualityIntelligence", () => {
  it("returns a complete result with all required fields", () => {
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], makePolicy(), CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.complaintHandling).toBeDefined();
    expect(result.feedbackCulture).toBeDefined();
    expect(result.learningOutcomes).toBeDefined();
    expect(result.policyCompliance).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("overall score is sum of 4 evaluator scores", () => {
    const complaints = [makeComplaint()];
    const feedback = [makeFeedback(), makeFeedback({ id: "f-02", source: "family" })];
    const lessons = [makeLesson()];
    const policy = makePolicy();
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, feedback, lessons, policy, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    const expectedSum =
      result.complaintHandling.overallScore +
      result.feedbackCulture.overallScore +
      result.learningOutcomes.overallScore +
      result.policyCompliance.overallScore;
    expect(result.overallScore).toBe(expectedSum);
  });

  it("rating maps correctly from overall score", () => {
    // Perfect scenario = high score
    const complaints: ComplaintRecord[] = [];
    const feedback = [
      makeFeedback({ id: "f-01", source: "child" }),
      makeFeedback({ id: "f-02", source: "child" }),
      makeFeedback({ id: "f-03", source: "family" }),
    ];
    const lessons: LessonLearned[] = [];
    const policy = makePolicy();
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, feedback, lessons, policy, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    // No complaints = 25, good feedback ~25, no complaints+no lessons = 25, full policy = 25
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("clamped between 0 and 100", () => {
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], null, [], {},
      "test", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("builds child profiles for all provided childIds", () => {
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], null, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.childProfiles).toHaveLength(3);
  });

  it("includes regulatory links", () => {
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], null, [], {},
      "test", "2025-01-01", "2025-06-30",
    );
    expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(8);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 39"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989 s26"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 15"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Ofsted"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("PIDA 1998"))).toBe(true);
  });

  // ── Strengths ──

  it("generates strengths for high complaint handling score", () => {
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [makeFeedback()], [], makePolicy(), CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    // No complaints + feedback present = strength
    expect(result.strengths.some((s) => s.includes("No formal complaints"))).toBe(true);
  });

  it("generates strength for compliments received", () => {
    const feedback = [makeFeedback({ feedbackType: "compliment" })];
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], feedback, [], makePolicy(), CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("compliment"))).toBe(true);
  });

  it("generates strength when all children supported to complain", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childSupportedToComplain: true }),
    ];
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, [makeFeedback()], [makeLesson()], makePolicy(), CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("supported to make complaints"))).toBe(true);
  });

  it("generates strength when all resolved in timescale", () => {
    const complaints = [
      makeComplaint({ id: "c-01", actualResolutionDays: 5, targetResolutionDays: 10 }),
    ];
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, [makeFeedback()], [makeLesson()], makePolicy(), CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("resolved within target"))).toBe(true);
  });

  it("generates strength when children actively give feedback", () => {
    const feedback = [makeFeedback({ source: "child" })];
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], feedback, [], makePolicy(), CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("Children actively contribute"))).toBe(true);
  });

  // ── Areas for Improvement ──

  it("flags low resolution timeliness", () => {
    const complaints = [
      makeComplaint({ id: "c-01", actualResolutionDays: 30, targetResolutionDays: 10 }),
    ];
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, [], [], null, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("resolved within target timescales"))).toBe(true);
  });

  it("flags low child informed rate", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childInformedOfOutcome: false }),
    ];
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, [], [], null, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("informed of complaint outcomes"))).toBe(true);
  });

  it("flags no feedback recorded", () => {
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], makePolicy(), CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No feedback recorded"))).toBe(true);
  });

  it("flags no lessons learned when complaints exist", () => {
    const complaints = [makeComplaint()];
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, [], [], null, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No lessons learned"))).toBe(true);
  });

  it("flags escalated complaints", () => {
    const complaints = [
      makeComplaint({ id: "c-01", escalatedExternally: true }),
    ];
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, [], [], null, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("escalated externally"))).toBe(true);
  });

  it("flags low policy compliance", () => {
    const policy = makePolicy({
      childFriendlyVersionAvailable: false,
      displayedProminently: false,
      childrenAwareOfProcess: false,
      advocacyAccessible: false,
      independentPersonAvailable: false,
      regularAuditCompleted: true,
    });
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], policy, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Policy compliance"))).toBe(true);
  });

  // ── Actions ──

  it("generates action for low resolution timeliness", () => {
    const complaints = [
      makeComplaint({ id: "c-01", actualResolutionDays: 30, targetResolutionDays: 10 }),
    ];
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, [], [], null, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("timescales"))).toBe(true);
  });

  it("generates action for no feedback", () => {
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], makePolicy(), CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("feedback mechanisms"))).toBe(true);
  });

  it("generates action for missing child-friendly version", () => {
    const policy = makePolicy({ childFriendlyVersionAvailable: false });
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], policy, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("child-friendly version"))).toBe(true);
  });

  it("generates action for not displayed prominently", () => {
    const policy = makePolicy({ displayedProminently: false });
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], policy, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("prominently"))).toBe(true);
  });

  it("generates action for no advocacy accessible", () => {
    const policy = makePolicy({ advocacyAccessible: false });
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], policy, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("advocacy"))).toBe(true);
  });

  it("generates action for missing audit", () => {
    const policy = makePolicy({ regularAuditCompleted: false });
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], policy, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("audit"))).toBe(true);
  });

  it("generates action for no lessons when complaints exist", () => {
    const complaints = [makeComplaint()];
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, [], [], null, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("lessons learned"))).toBe(true);
  });

  it("generates action for children not informed", () => {
    const complaints = [
      makeComplaint({ id: "c-01", childInformedOfOutcome: false }),
    ];
    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, [], [], null, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("informed of complaint outcomes"))).toBe(true);
  });

  // ── Edge cases ──

  it("handles empty inputs gracefully", () => {
    const result = generateComplaintsFeedbackQualityIntelligence(
      [], [], [], null, [], {},
      "empty-home", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.childProfiles).toHaveLength(0);
    expect(result.rating).toBeDefined();
  });

  it("handles mixed scenario realistically", () => {
    const complaints = [
      makeComplaint({
        id: "c-01", childId: "alex", category: "food_nutrition",
        status: "resolved", actualResolutionDays: 5, targetResolutionDays: 10,
        childInformedOfOutcome: true, childSupportedToComplain: true,
      }),
      makeComplaint({
        id: "c-02", childId: "jordan", category: "bullying",
        status: "investigating", outcome: null, actualResolutionDays: null,
        childInformedOfOutcome: false, childSupportedToComplain: true,
      }),
    ];
    const feedback = [
      makeFeedback({ id: "f-01", source: "child", childId: "morgan", feedbackType: "compliment" }),
      makeFeedback({ id: "f-02", source: "child", childId: "morgan", feedbackType: "compliment" }),
      makeFeedback({ id: "f-03", source: "child", childId: "morgan", feedbackType: "suggestion" }),
    ];
    const lessons = [
      makeLesson({ id: "l-01", implementedDate: "2025-02-01", impactAssessed: true, sharedWithTeam: true }),
      makeLesson({ id: "l-02", implementedDate: null, impactAssessed: false, sharedWithTeam: true }),
    ];
    const policy = makePolicy({
      childFriendlyVersionAvailable: true,
      displayedProminently: true,
      childrenAwareOfProcess: true,
      advocacyAccessible: true,
      independentPersonAvailable: false,
      regularAuditCompleted: true,
    });

    const result = generateComplaintsFeedbackQualityIntelligence(
      complaints, feedback, lessons, policy, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks.length).toBe(8);
  });
});
