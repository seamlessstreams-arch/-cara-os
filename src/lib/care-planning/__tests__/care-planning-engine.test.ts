// ══════════════════════════════════════════════════════════════════════════════
// CARE PLANNING COMPLIANCE INTELLIGENCE — TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateCarePlanningIntelligence,
  evaluateReviewCompliance,
  buildReviewTypeBreakdown,
  evaluateActionCompliance,
  buildChildPlanningProfiles,
  getReviewTypeLabel,
  getReviewStatusLabel,
  getActionStatusLabel,
} from "../care-planning-engine";
import type {
  CareChild,
  PlannedReview,
  ReviewAction,
  CarePlanDocument,
} from "../care-planning-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

function makeChildren(): CareChild[] {
  return [
    { id: "child-alex", name: "Alex", dateOfBirth: "2012-03-15", placementStartDate: "2025-10-01", isEligibleChild: false, currentPlacement: true },
    { id: "child-jordan", name: "Jordan", dateOfBirth: "2013-07-22", placementStartDate: "2025-11-01", isEligibleChild: false, currentPlacement: true },
    { id: "child-morgan", name: "Morgan", dateOfBirth: "2010-12-01", placementStartDate: "2026-01-10", isEligibleChild: true, currentPlacement: true },
  ];
}

function makeGoodReviews(): PlannedReview[] {
  return [
    // Alex — all on time
    { id: "rev-001", childId: "child-alex", reviewType: "lac_review", dueDate: "2026-02-15", actualDate: "2026-02-14", status: "completed_on_time", chairedBy: "IRO Smith", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: true, socialWorkerAttended: true, iroConducted: true, actionsAgreed: 4 },
    { id: "rev-002", childId: "child-alex", reviewType: "pep_review", dueDate: "2026-03-01", actualDate: "2026-02-28", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 3 },
    { id: "rev-003", childId: "child-alex", reviewType: "health_review", dueDate: "2026-04-01", actualDate: "2026-04-01", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: false, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 2 },
    // Jordan — all on time
    { id: "rev-004", childId: "child-jordan", reviewType: "lac_review", dueDate: "2026-01-20", actualDate: "2026-01-20", status: "completed_on_time", chairedBy: "IRO Jones", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: true, socialWorkerAttended: true, iroConducted: true, actionsAgreed: 5 },
    { id: "rev-005", childId: "child-jordan", reviewType: "care_plan_review", dueDate: "2026-03-15", actualDate: "2026-03-14", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: true, socialWorkerAttended: true, actionsAgreed: 3 },
    // Morgan — on time
    { id: "rev-006", childId: "child-morgan", reviewType: "lac_review", dueDate: "2026-02-01", actualDate: "2026-02-01", status: "completed_on_time", chairedBy: "IRO Smith", childParticipated: true, childViewsRecorded: true, parentInvited: false, parentAttended: false, socialWorkerAttended: true, iroConducted: true, actionsAgreed: 4 },
    { id: "rev-007", childId: "child-morgan", reviewType: "pathway_plan_review", dueDate: "2026-04-15", actualDate: "2026-04-14", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: false, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 6 },
  ];
}

function makeProblemReviews(): PlannedReview[] {
  return [
    // Alex — LAC overdue
    { id: "rev-p01", childId: "child-alex", reviewType: "lac_review", dueDate: "2026-04-15", status: "overdue", childParticipated: false, childViewsRecorded: false, parentInvited: true, parentAttended: false, socialWorkerAttended: false, actionsAgreed: 0 },
    // Alex — PEP completed late
    { id: "rev-p02", childId: "child-alex", reviewType: "pep_review", dueDate: "2026-03-01", actualDate: "2026-03-20", status: "completed_late", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 3 },
    // Jordan — LAC on time
    { id: "rev-p03", childId: "child-jordan", reviewType: "lac_review", dueDate: "2026-03-01", actualDate: "2026-03-01", status: "completed_on_time", chairedBy: "IRO Jones", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: true, socialWorkerAttended: true, iroConducted: true, actionsAgreed: 4 },
    // Jordan — Health review overdue
    { id: "rev-p04", childId: "child-jordan", reviewType: "health_review", dueDate: "2026-04-01", status: "overdue", childParticipated: false, childViewsRecorded: false, parentInvited: false, parentAttended: false, socialWorkerAttended: false, actionsAgreed: 0 },
    // Morgan — cancelled
    { id: "rev-p05", childId: "child-morgan", reviewType: "pathway_plan_review", dueDate: "2026-04-15", status: "cancelled", childParticipated: false, childViewsRecorded: false, parentInvited: false, parentAttended: false, socialWorkerAttended: false, actionsAgreed: 0 },
  ];
}

function makeGoodActions(): ReviewAction[] {
  return [
    { id: "act-001", reviewId: "rev-001", childId: "child-alex", description: "Arrange boxing trial", assignedTo: "Sarah Johnson", dueDate: "2026-03-01", completedDate: "2026-02-25", status: "completed", category: "activity" },
    { id: "act-002", reviewId: "rev-001", childId: "child-alex", description: "Update risk assessment", assignedTo: "Darren Laville", dueDate: "2026-03-15", completedDate: "2026-03-10", status: "completed", category: "assessment" },
    { id: "act-003", reviewId: "rev-004", childId: "child-jordan", description: "Request art therapy referral", assignedTo: "Lisa Williams", dueDate: "2026-02-15", completedDate: "2026-02-10", status: "completed", category: "therapy" },
    { id: "act-004", reviewId: "rev-006", childId: "child-morgan", description: "Complete independence skills assessment", assignedTo: "Lisa Williams", dueDate: "2026-03-01", completedDate: "2026-02-28", status: "completed", category: "assessment" },
  ];
}

function makeProblemActions(): ReviewAction[] {
  return [
    { id: "act-p01", reviewId: "rev-p03", childId: "child-jordan", description: "Refer to CAMHS", assignedTo: "Tom Richards", dueDate: "2026-03-15", status: "overdue", category: "therapy" },
    { id: "act-p02", reviewId: "rev-p03", childId: "child-jordan", description: "Update behaviour support plan", assignedTo: "Tom Richards", dueDate: "2026-03-20", status: "overdue", category: "planning" },
    { id: "act-p03", reviewId: "rev-p02", childId: "child-alex", description: "Arrange school meeting", assignedTo: "Sarah Johnson", dueDate: "2026-04-01", status: "in_progress", category: "education" },
    { id: "act-p04", reviewId: "rev-p03", childId: "child-jordan", description: "Schedule dental appointment", assignedTo: "Lisa Williams", dueDate: "2026-04-01", status: "overdue", category: "health" },
  ];
}

function makeGoodDocuments(): CarePlanDocument[] {
  return [
    { id: "doc-001", childId: "child-alex", documentType: "care_plan", lastUpdated: "2026-04-15", nextReviewDue: "2026-10-15", isUpToDate: true },
    { id: "doc-002", childId: "child-alex", documentType: "placement_plan", lastUpdated: "2026-03-01", nextReviewDue: "2026-09-01", isUpToDate: true },
    { id: "doc-003", childId: "child-alex", documentType: "pep", lastUpdated: "2026-03-01", nextReviewDue: "2026-06-01", isUpToDate: true },
    { id: "doc-004", childId: "child-jordan", documentType: "care_plan", lastUpdated: "2026-03-15", nextReviewDue: "2026-09-15", isUpToDate: true },
    { id: "doc-005", childId: "child-jordan", documentType: "behaviour_support_plan", lastUpdated: "2026-04-01", nextReviewDue: "2026-07-01", isUpToDate: true },
    { id: "doc-006", childId: "child-morgan", documentType: "care_plan", lastUpdated: "2026-04-15", nextReviewDue: "2026-10-15", isUpToDate: true },
    { id: "doc-007", childId: "child-morgan", documentType: "pathway_plan", lastUpdated: "2026-04-15", nextReviewDue: "2026-07-15", isUpToDate: true },
  ];
}

function makeProblemDocuments(): CarePlanDocument[] {
  return [
    { id: "doc-p01", childId: "child-alex", documentType: "care_plan", lastUpdated: "2025-09-01", nextReviewDue: "2026-03-01", isUpToDate: false },
    { id: "doc-p02", childId: "child-alex", documentType: "risk_assessment", lastUpdated: "2025-10-01", nextReviewDue: "2026-04-01", isUpToDate: false },
    { id: "doc-p03", childId: "child-jordan", documentType: "care_plan", lastUpdated: "2026-03-15", nextReviewDue: "2026-09-15", isUpToDate: true },
    { id: "doc-p04", childId: "child-morgan", documentType: "pathway_plan", lastUpdated: "2025-08-01", nextReviewDue: "2026-02-01", isUpToDate: false },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// evaluateReviewCompliance
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateReviewCompliance", () => {
  it("calculates full compliance for on-time reviews", () => {
    const result = evaluateReviewCompliance(makeGoodReviews(), PERIOD_START, PERIOD_END);
    expect(result.onTimeRate).toBe(100);
    expect(result.completionRate).toBe(100);
    expect(result.overdue).toBe(0);
  });

  it("detects overdue and late reviews", () => {
    const result = evaluateReviewCompliance(makeProblemReviews(), PERIOD_START, PERIOD_END);
    expect(result.overdue).toBe(2);
    expect(result.completedLate).toBe(1);
    expect(result.onTimeRate).toBe(20); // 1 on time out of 5
  });

  it("tracks cancelled reviews", () => {
    const result = evaluateReviewCompliance(makeProblemReviews(), PERIOD_START, PERIOD_END);
    expect(result.cancelled).toBe(1);
  });

  it("handles empty review list", () => {
    const result = evaluateReviewCompliance([], PERIOD_START, PERIOD_END);
    expect(result.totalReviewsDue).toBe(0);
    expect(result.onTimeRate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// buildReviewTypeBreakdown
// ═══════════════════════════════════════════════════════════════════════════

describe("buildReviewTypeBreakdown", () => {
  it("groups reviews by type", () => {
    const result = buildReviewTypeBreakdown(makeGoodReviews(), PERIOD_START, PERIOD_END);
    const lacReviews = result.find((r) => r.reviewType === "lac_review");
    expect(lacReviews).toBeDefined();
    expect(lacReviews!.total).toBe(3);
    expect(lacReviews!.onTimeRate).toBe(100);
  });

  it("identifies worst-performing review types", () => {
    const result = buildReviewTypeBreakdown(makeProblemReviews(), PERIOD_START, PERIOD_END);
    // Sorted by onTimeRate ascending — worst first
    expect(result[0].onTimeRate).toBeLessThanOrEqual(result[result.length - 1].onTimeRate);
  });

  it("handles mixed performance across types", () => {
    const result = buildReviewTypeBreakdown(makeProblemReviews(), PERIOD_START, PERIOD_END);
    const healthReview = result.find((r) => r.reviewType === "health_review");
    expect(healthReview).toBeDefined();
    expect(healthReview!.overdue).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// evaluateActionCompliance
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateActionCompliance", () => {
  it("reports full completion for good actions", () => {
    const result = evaluateActionCompliance(makeGoodActions(), PERIOD_START, PERIOD_END);
    expect(result.completionRate).toBe(100);
    expect(result.overdueRate).toBe(0);
  });

  it("detects overdue actions", () => {
    const result = evaluateActionCompliance(makeProblemActions(), PERIOD_START, PERIOD_END);
    expect(result.overdue).toBe(3);
    expect(result.overdueRate).toBe(75);
  });

  it("handles empty action list", () => {
    const result = evaluateActionCompliance([], PERIOD_START, PERIOD_END);
    expect(result.totalActions).toBe(0);
    expect(result.completionRate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// buildChildPlanningProfiles
// ═══════════════════════════════════════════════════════════════════════════

describe("buildChildPlanningProfiles", () => {
  it("builds profiles for all active children", () => {
    const profiles = buildChildPlanningProfiles(
      makeChildren(), makeGoodReviews(), makeGoodActions(), makeGoodDocuments(),
      PERIOD_START, PERIOD_END,
    );
    expect(profiles).toHaveLength(3);
  });

  it("calculates child participation rate", () => {
    const profiles = buildChildPlanningProfiles(
      makeChildren(), makeGoodReviews(), makeGoodActions(), makeGoodDocuments(),
      PERIOD_START, PERIOD_END,
    );
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.childParticipationRate).toBe(100);
  });

  it("identifies children with primary concerns", () => {
    const profiles = buildChildPlanningProfiles(
      makeChildren(), makeProblemReviews(), makeProblemActions(), makeProblemDocuments(),
      PERIOD_START, PERIOD_END,
    );
    // Alex: 1 overdue review + 2 outdated documents
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.primaryConcern).toBeDefined();
    expect(alex.documentsOutdated).toBe(2);
  });

  it("tracks action overdue count per child", () => {
    const profiles = buildChildPlanningProfiles(
      makeChildren(), makeProblemReviews(), makeProblemActions(), makeProblemDocuments(),
      PERIOD_START, PERIOD_END,
    );
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.actionsOverdue).toBe(3);
  });

  it("excludes children not in current placement", () => {
    const children = [
      ...makeChildren(),
      { id: "child-left", name: "Sam", dateOfBirth: "2010-01-01", placementStartDate: "2024-01-01", isEligibleChild: false, currentPlacement: false },
    ];
    const profiles = buildChildPlanningProfiles(
      children, makeGoodReviews(), makeGoodActions(), makeGoodDocuments(),
      PERIOD_START, PERIOD_END,
    );
    expect(profiles.find((p) => p.childId === "child-left")).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// generateCarePlanningIntelligence (integration)
// ═══════════════════════════════════════════════════════════════════════════

describe("generateCarePlanningIntelligence", () => {
  it("produces complete result", () => {
    const result = generateCarePlanningIntelligence(
      makeChildren(), makeGoodReviews(), makeGoodActions(), makeGoodDocuments(),
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(typeof result.overallScore).toBe("number");
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("scores high for compliant planning", () => {
    const result = generateCarePlanningIntelligence(
      makeChildren(), makeGoodReviews(), makeGoodActions(), makeGoodDocuments(),
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.documentCurrencyRate).toBe(100);
  });

  it("scores lower for poor compliance", () => {
    const result = generateCarePlanningIntelligence(
      makeChildren(), makeProblemReviews(), makeProblemActions(), makeProblemDocuments(),
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThan(60);
  });

  it("generates strengths for good planning", () => {
    const result = generateCarePlanningIntelligence(
      makeChildren(), makeGoodReviews(), makeGoodActions(), makeGoodDocuments(),
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates development areas for poor compliance", () => {
    const result = generateCarePlanningIntelligence(
      makeChildren(), makeProblemReviews(), makeProblemActions(), makeProblemDocuments(),
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
  });

  it("generates urgent actions for overdue reviews", () => {
    const result = generateCarePlanningIntelligence(
      makeChildren(), makeProblemReviews(), makeProblemActions(), makeProblemDocuments(),
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("returns no-action message for clean compliance", () => {
    const result = generateCarePlanningIntelligence(
      makeChildren(), makeGoodReviews(), makeGoodActions(), makeGoodDocuments(),
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("includes pathway planning regulatory link for eligible children", () => {
    const result = generateCarePlanningIntelligence(
      makeChildren(), makeGoodReviews(), makeGoodActions(), makeGoodDocuments(),
      "oak-house", PERIOD_START, PERIOD_END,
    );
    // Morgan is eligible (16+)
    expect(result.regulatoryLinks.some((l) => l.includes("Pathway planning"))).toBe(true);
  });

  it("tracks participation rates", () => {
    const result = generateCarePlanningIntelligence(
      makeChildren(), makeGoodReviews(), makeGoodActions(), makeGoodDocuments(),
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.childParticipationRate).toBe(100);
    // 3 of 7 parents attended
    expect(result.parentParticipationRate).toBe(43);
    expect(result.socialWorkerAttendanceRate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Label Utilities
// ═══════════════════════════════════════════════════════════════════════════

describe("label utilities", () => {
  it("getReviewTypeLabel returns correct labels", () => {
    expect(getReviewTypeLabel("lac_review")).toBe("LAC Review");
    expect(getReviewTypeLabel("pep_review")).toBe("PEP Review");
    expect(getReviewTypeLabel("pathway_plan_review")).toBe("Pathway Plan Review");
  });

  it("getReviewStatusLabel returns correct labels", () => {
    expect(getReviewStatusLabel("completed_on_time")).toBe("Completed On Time");
    expect(getReviewStatusLabel("overdue")).toBe("Overdue");
  });

  it("getActionStatusLabel returns correct labels", () => {
    expect(getActionStatusLabel("completed")).toBe("Completed");
    expect(getActionStatusLabel("overdue")).toBe("Overdue");
  });
});
