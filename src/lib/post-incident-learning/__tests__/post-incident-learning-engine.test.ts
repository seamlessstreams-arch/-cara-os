// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Post-Incident Learning Intelligence Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateDebriefQuality,
  evaluateLearningEffectiveness,
  evaluatePatternRecognition,
  evaluateTeamLearning,
  generatePostIncidentLearningIntelligence,
  pct,
  getRating,
  getIncidentTypeLabel,
  getDebriefStatusLabel,
  getLearningOutcomeLabel,
  getReviewQualityLabel,
  getRecurrencePatternLabel,
  getRatingLabel,
} from "../post-incident-learning-engine";
import type {
  PostIncidentReview,
  LearningAction,
  PatternAnalysis,
  TeamLearningSession,
  IncidentType,
  DebriefStatus,
  LearningOutcome,
  ReviewQuality,
  RecurrencePattern,
  Rating,
} from "../post-incident-learning-engine";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeReview(overrides: Partial<PostIncidentReview> = {}): PostIncidentReview {
  return {
    id: "rev-1",
    incidentId: "inc-1",
    incidentType: "physical_intervention",
    incidentDate: "2025-03-10",
    reviewDate: "2025-03-11",
    reviewedBy: "Darren Laville",
    debriefStatus: "completed_within_24h",
    childInvolved: true,
    childDebrief: true,
    staffDebrief: true,
    rootCauseIdentified: true,
    lessonsDocumented: true,
    reviewQuality: "thorough",
    ...overrides,
  };
}

function makeAction(overrides: Partial<LearningAction> = {}): LearningAction {
  return {
    id: "act-1",
    reviewId: "rev-1",
    learningOutcome: "practice_change",
    description: "Update de-escalation plan",
    assignedTo: "Sarah Johnson",
    dueDate: "2025-04-01",
    completedDate: "2025-03-28",
    evidenceRecorded: true,
    ...overrides,
  };
}

function makePattern(overrides: Partial<PatternAnalysis> = {}): PatternAnalysis {
  return {
    id: "pat-1",
    childId: "child-alex",
    childName: "Alex",
    incidentType: "physical_intervention",
    recurrencePattern: "recurring",
    frequency: 3,
    triggerIdentified: true,
    strategiesUpdated: true,
    multiAgencyInvolved: false,
    ...overrides,
  };
}

function makeSession(overrides: Partial<TeamLearningSession> = {}): TeamLearningSession {
  return {
    id: "sess-1",
    sessionDate: "2025-03-15",
    facilitator: "Darren Laville",
    topic: "De-escalation after physical interventions",
    incidentRelated: true,
    attendeeCount: 8,
    totalStaff: 10,
    actionPointsGenerated: 4,
    actionPointsCompleted: 3,
    ...overrides,
  };
}

// ── pct helper ────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns correct percentage", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ── getRating ─────────────────────────────────────────────────────────────

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
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ── Label Functions ─────────────────────────────────────────────────────────

describe("getIncidentTypeLabel", () => {
  it("returns correct labels for all incident types", () => {
    const types: IncidentType[] = [
      "physical_intervention", "self_harm", "missing_from_care",
      "property_damage", "verbal_aggression", "substance_misuse",
      "exploitation_concern", "safeguarding_concern", "medication_error",
      "near_miss",
    ];
    const expected = [
      "Physical Intervention", "Self-Harm", "Missing from Care",
      "Property Damage", "Verbal Aggression", "Substance Misuse",
      "Exploitation Concern", "Safeguarding Concern", "Medication Error",
      "Near Miss",
    ];
    types.forEach((t, i) => {
      expect(getIncidentTypeLabel(t)).toBe(expected[i]);
    });
  });
});

describe("getDebriefStatusLabel", () => {
  it("returns correct labels for all debrief statuses", () => {
    const statuses: DebriefStatus[] = [
      "completed_within_24h", "completed_late", "not_completed", "not_required",
    ];
    const expected = [
      "Completed Within 24h", "Completed Late", "Not Completed", "Not Required",
    ];
    statuses.forEach((s, i) => {
      expect(getDebriefStatusLabel(s)).toBe(expected[i]);
    });
  });
});

describe("getLearningOutcomeLabel", () => {
  it("returns correct labels for all learning outcomes", () => {
    const outcomes: LearningOutcome[] = [
      "practice_change", "policy_update", "training_delivered",
      "environment_change", "staffing_change", "no_change_needed",
      "pending_review",
    ];
    const expected = [
      "Practice Change", "Policy Update", "Training Delivered",
      "Environment Change", "Staffing Change", "No Change Needed",
      "Pending Review",
    ];
    outcomes.forEach((o, i) => {
      expect(getLearningOutcomeLabel(o)).toBe(expected[i]);
    });
  });
});

describe("getReviewQualityLabel", () => {
  it("returns correct labels for all review qualities", () => {
    const qualities: ReviewQuality[] = ["thorough", "adequate", "superficial", "not_completed"];
    const expected = ["Thorough", "Adequate", "Superficial", "Not Completed"];
    qualities.forEach((q, i) => {
      expect(getReviewQualityLabel(q)).toBe(expected[i]);
    });
  });
});

describe("getRecurrencePatternLabel", () => {
  it("returns correct labels for all recurrence patterns", () => {
    const patterns: RecurrencePattern[] = [
      "first_occurrence", "recurring", "escalating", "de_escalating", "chronic",
    ];
    const expected = [
      "First Occurrence", "Recurring", "Escalating", "De-escalating", "Chronic",
    ];
    patterns.forEach((p, i) => {
      expect(getRecurrencePatternLabel(p)).toBe(expected[i]);
    });
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels for all ratings", () => {
    const ratings: Rating[] = ["outstanding", "good", "requires_improvement", "inadequate"];
    const expected = ["Outstanding", "Good", "Requires Improvement", "Inadequate"];
    ratings.forEach((r, i) => {
      expect(getRatingLabel(r)).toBe(expected[i]);
    });
  });
});

// ── evaluateDebriefQuality ──────────────────────────────────────────────────

describe("evaluateDebriefQuality", () => {
  it("returns perfect score of 25 for empty reviews (no incidents = positive)", () => {
    const result = evaluateDebriefQuality([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalReviews).toBe(0);
    expect(result.within24hRate).toBe(0);
    expect(result.completedRate).toBe(0);
  });

  it("scores maximum for all-perfect reviews", () => {
    const reviews = [
      makeReview({ id: "r1", debriefStatus: "completed_within_24h", childInvolved: true, childDebrief: true, staffDebrief: true, rootCauseIdentified: true, lessonsDocumented: true }),
      makeReview({ id: "r2", incidentId: "inc-2", debriefStatus: "completed_within_24h", childInvolved: true, childDebrief: true, staffDebrief: true, rootCauseIdentified: true, lessonsDocumented: true }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.overallScore).toBe(25);
    expect(result.within24hRate).toBe(100);
    expect(result.completedRate).toBe(100);
    expect(result.childDebriefRate).toBe(100);
    expect(result.staffDebriefRate).toBe(100);
    expect(result.rootCauseRate).toBe(100);
    expect(result.lessonsDocumentedRate).toBe(100);
  });

  it("scores zero when all reviews are not completed", () => {
    const reviews = [
      makeReview({ debriefStatus: "not_completed", childInvolved: true, childDebrief: false, staffDebrief: false, rootCauseIdentified: false, lessonsDocumented: false, reviewQuality: "not_completed" }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.overallScore).toBe(0);
    expect(result.within24hRate).toBe(0);
    expect(result.completedRate).toBe(0);
  });

  it("calculates within24hRate correctly", () => {
    const reviews = [
      makeReview({ id: "r1", debriefStatus: "completed_within_24h" }),
      makeReview({ id: "r2", incidentId: "inc-2", debriefStatus: "completed_late" }),
      makeReview({ id: "r3", incidentId: "inc-3", debriefStatus: "completed_within_24h" }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.within24hRate).toBe(67);
    expect(result.completedRate).toBe(100);
    expect(result.totalReviews).toBe(3);
  });

  it("calculates childDebriefRate only for applicable reviews", () => {
    const reviews = [
      makeReview({ id: "r1", childInvolved: true, childDebrief: true }),
      makeReview({ id: "r2", incidentId: "inc-2", childInvolved: true, childDebrief: false }),
      makeReview({ id: "r3", incidentId: "inc-3", childInvolved: false, childDebrief: null }),
    ];
    const result = evaluateDebriefQuality(reviews);
    // 1 out of 2 applicable = 50%
    expect(result.childDebriefRate).toBe(50);
  });

  it("returns 0 childDebriefRate when no children involved", () => {
    const reviews = [
      makeReview({ childInvolved: false, childDebrief: null }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.childDebriefRate).toBe(0);
  });

  it("populates quality distribution correctly", () => {
    const reviews = [
      makeReview({ id: "r1", reviewQuality: "thorough" }),
      makeReview({ id: "r2", incidentId: "inc-2", reviewQuality: "thorough" }),
      makeReview({ id: "r3", incidentId: "inc-3", reviewQuality: "adequate" }),
      makeReview({ id: "r4", incidentId: "inc-4", reviewQuality: "superficial" }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.qualityDistribution.thorough).toBe(2);
    expect(result.qualityDistribution.adequate).toBe(1);
    expect(result.qualityDistribution.superficial).toBe(1);
    expect(result.qualityDistribution.not_completed).toBe(0);
  });

  it("calculates staffDebriefRate correctly", () => {
    const reviews = [
      makeReview({ id: "r1", staffDebrief: true }),
      makeReview({ id: "r2", incidentId: "inc-2", staffDebrief: false }),
      makeReview({ id: "r3", incidentId: "inc-3", staffDebrief: true }),
      makeReview({ id: "r4", incidentId: "inc-4", staffDebrief: false }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.staffDebriefRate).toBe(50);
  });

  it("calculates rootCauseRate correctly", () => {
    const reviews = [
      makeReview({ id: "r1", rootCauseIdentified: true }),
      makeReview({ id: "r2", incidentId: "inc-2", rootCauseIdentified: false }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.rootCauseRate).toBe(50);
  });

  it("calculates lessonsDocumentedRate correctly", () => {
    const reviews = [
      makeReview({ id: "r1", lessonsDocumented: true }),
      makeReview({ id: "r2", incidentId: "inc-2", lessonsDocumented: false }),
      makeReview({ id: "r3", incidentId: "inc-3", lessonsDocumented: true }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.lessonsDocumentedRate).toBe(67);
  });

  it("handles not_required debrief status", () => {
    const reviews = [
      makeReview({ debriefStatus: "not_required", childInvolved: false, childDebrief: null, staffDebrief: false, rootCauseIdentified: false, lessonsDocumented: false }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.completedRate).toBe(0);
    expect(result.within24hRate).toBe(0);
    expect(result.totalReviews).toBe(1);
  });

  it("score does not exceed 25", () => {
    const reviews = Array.from({ length: 20 }, (_, i) =>
      makeReview({ id: `r-${i}`, incidentId: `inc-${i}` }),
    );
    const result = evaluateDebriefQuality(reviews);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("partial scores sum correctly for mixed quality reviews", () => {
    const reviews = [
      makeReview({ id: "r1", debriefStatus: "completed_within_24h", childInvolved: true, childDebrief: true, staffDebrief: true, rootCauseIdentified: true, lessonsDocumented: true }),
      makeReview({ id: "r2", incidentId: "inc-2", debriefStatus: "not_completed", childInvolved: true, childDebrief: false, staffDebrief: false, rootCauseIdentified: false, lessonsDocumented: false, reviewQuality: "not_completed" }),
    ];
    const result = evaluateDebriefQuality(reviews);
    expect(result.within24hRate).toBe(50);
    expect(result.completedRate).toBe(50);
    expect(result.childDebriefRate).toBe(50);
    expect(result.staffDebriefRate).toBe(50);
    expect(result.rootCauseRate).toBe(50);
    expect(result.lessonsDocumentedRate).toBe(50);
    // Score: 50% of (7+5+5+4+4) = 50% of 25 = 12.5
    expect(result.overallScore).toBe(12.5);
  });
});

// ── evaluateLearningEffectiveness ───────────────────────────────────────────

describe("evaluateLearningEffectiveness", () => {
  it("returns 25 when no actions and no reviews", () => {
    const result = evaluateLearningEffectiveness([], false);
    expect(result.overallScore).toBe(25);
    expect(result.totalActions).toBe(0);
  });

  it("returns 0 when no actions but reviews exist", () => {
    const result = evaluateLearningEffectiveness([], true);
    expect(result.overallScore).toBe(0);
    expect(result.totalActions).toBe(0);
  });

  it("scores maximum for perfect actions", () => {
    const actions = [
      makeAction({ id: "a1", learningOutcome: "practice_change", completedDate: "2025-04-01", evidenceRecorded: true }),
      makeAction({ id: "a2", reviewId: "rev-2", learningOutcome: "practice_change", completedDate: "2025-04-02", evidenceRecorded: true }),
      makeAction({ id: "a3", reviewId: "rev-3", learningOutcome: "practice_change", completedDate: "2025-04-03", evidenceRecorded: true }),
      makeAction({ id: "a4", reviewId: "rev-4", learningOutcome: "practice_change", completedDate: "2025-04-04", evidenceRecorded: true }),
      makeAction({ id: "a5", reviewId: "rev-5", learningOutcome: "practice_change", completedDate: "2025-04-05", evidenceRecorded: true }),
      makeAction({ id: "a6", reviewId: "rev-6", learningOutcome: "policy_update", completedDate: "2025-04-06", evidenceRecorded: true }),
      makeAction({ id: "a7", reviewId: "rev-7", learningOutcome: "policy_update", completedDate: "2025-04-07", evidenceRecorded: true }),
      makeAction({ id: "a8", reviewId: "rev-8", learningOutcome: "policy_update", completedDate: "2025-04-08", evidenceRecorded: true }),
      makeAction({ id: "a9", reviewId: "rev-9", learningOutcome: "training_delivered", completedDate: "2025-04-09", evidenceRecorded: true }),
      makeAction({ id: "a10", reviewId: "rev-10", learningOutcome: "training_delivered", completedDate: "2025-04-10", evidenceRecorded: true }),
      makeAction({ id: "a11", reviewId: "rev-11", learningOutcome: "training_delivered", completedDate: "2025-04-11", evidenceRecorded: true }),
    ];
    const result = evaluateLearningEffectiveness(actions, true);
    expect(result.overallScore).toBe(25);
  });

  it("calculates completedRate correctly", () => {
    const actions = [
      makeAction({ id: "a1", completedDate: "2025-04-01" }),
      makeAction({ id: "a2", reviewId: "rev-2", completedDate: null }),
      makeAction({ id: "a3", reviewId: "rev-3", completedDate: "2025-04-03" }),
    ];
    const result = evaluateLearningEffectiveness(actions, true);
    expect(result.completedRate).toBe(67);
    expect(result.totalActions).toBe(3);
  });

  it("calculates evidenceRate correctly", () => {
    const actions = [
      makeAction({ id: "a1", evidenceRecorded: true }),
      makeAction({ id: "a2", reviewId: "rev-2", evidenceRecorded: false }),
    ];
    const result = evaluateLearningEffectiveness(actions, true);
    expect(result.evidenceRate).toBe(50);
  });

  it("counts practice changes correctly", () => {
    const actions = [
      makeAction({ id: "a1", learningOutcome: "practice_change" }),
      makeAction({ id: "a2", reviewId: "rev-2", learningOutcome: "practice_change" }),
      makeAction({ id: "a3", reviewId: "rev-3", learningOutcome: "policy_update" }),
    ];
    const result = evaluateLearningEffectiveness(actions, true);
    expect(result.practiceChangeCount).toBe(2);
    expect(result.policyUpdateCount).toBe(1);
    expect(result.trainingDeliveredCount).toBe(0);
  });

  it("caps practice change score at 5", () => {
    const actions = Array.from({ length: 10 }, (_, i) =>
      makeAction({ id: `a-${i}`, reviewId: `rev-${i}`, learningOutcome: "practice_change", completedDate: null, evidenceRecorded: false }),
    );
    const result = evaluateLearningEffectiveness(actions, true);
    // completedRate=0, evidenceRate=0, practiceChangeCount=10 but capped at 5
    expect(result.practiceChangeCount).toBe(10);
    expect(result.overallScore).toBe(5); // only practice_change points (capped at 5)
  });

  it("caps policy update score at 3", () => {
    const actions = Array.from({ length: 5 }, (_, i) =>
      makeAction({ id: `a-${i}`, reviewId: `rev-${i}`, learningOutcome: "policy_update", completedDate: null, evidenceRecorded: false }),
    );
    const result = evaluateLearningEffectiveness(actions, true);
    expect(result.policyUpdateCount).toBe(5);
    expect(result.overallScore).toBe(3); // capped at 3
  });

  it("caps training delivered score at 3", () => {
    const actions = Array.from({ length: 5 }, (_, i) =>
      makeAction({ id: `a-${i}`, reviewId: `rev-${i}`, learningOutcome: "training_delivered", completedDate: null, evidenceRecorded: false }),
    );
    const result = evaluateLearningEffectiveness(actions, true);
    expect(result.trainingDeliveredCount).toBe(5);
    expect(result.overallScore).toBe(3); // capped at 3
  });

  it("populates outcome distribution correctly", () => {
    const actions = [
      makeAction({ id: "a1", learningOutcome: "practice_change" }),
      makeAction({ id: "a2", reviewId: "rev-2", learningOutcome: "practice_change" }),
      makeAction({ id: "a3", reviewId: "rev-3", learningOutcome: "environment_change" }),
      makeAction({ id: "a4", reviewId: "rev-4", learningOutcome: "no_change_needed" }),
    ];
    const result = evaluateLearningEffectiveness(actions, true);
    expect(result.outcomeDistribution.practice_change).toBe(2);
    expect(result.outcomeDistribution.environment_change).toBe(1);
    expect(result.outcomeDistribution.no_change_needed).toBe(1);
    expect(result.outcomeDistribution.policy_update).toBe(0);
    expect(result.outcomeDistribution.training_delivered).toBe(0);
    expect(result.outcomeDistribution.staffing_change).toBe(0);
    expect(result.outcomeDistribution.pending_review).toBe(0);
  });

  it("score does not exceed 25", () => {
    const actions = Array.from({ length: 20 }, (_, i) =>
      makeAction({ id: `a-${i}`, reviewId: `rev-${i}`, completedDate: "2025-04-01", evidenceRecorded: true }),
    );
    const result = evaluateLearningEffectiveness(actions, true);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles pending_review outcome", () => {
    const actions = [
      makeAction({ learningOutcome: "pending_review", completedDate: null, evidenceRecorded: false }),
    ];
    const result = evaluateLearningEffectiveness(actions, true);
    expect(result.outcomeDistribution.pending_review).toBe(1);
    expect(result.completedRate).toBe(0);
  });
});

// ── evaluatePatternRecognition ──────────────────────────────────────────────

describe("evaluatePatternRecognition", () => {
  it("returns 25 for empty patterns (no patterns = good)", () => {
    const result = evaluatePatternRecognition([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalPatterns).toBe(0);
  });

  it("scores well for all-good patterns", () => {
    const patterns = [
      makePattern({ triggerIdentified: true, strategiesUpdated: true, multiAgencyInvolved: true, recurrencePattern: "first_occurrence" }),
    ];
    const result = evaluatePatternRecognition(patterns);
    expect(result.overallScore).toBe(18);
    expect(result.triggerIdentifiedRate).toBe(100);
    expect(result.strategiesUpdatedRate).toBe(100);
    expect(result.multiAgencyRate).toBe(100);
  });

  it("applies escalating penalty", () => {
    const patterns = [
      makePattern({ id: "p1", recurrencePattern: "escalating", triggerIdentified: true, strategiesUpdated: true, multiAgencyInvolved: true }),
    ];
    const result = evaluatePatternRecognition(patterns);
    // 7 + 6 + 5 - 4 = 14
    expect(result.overallScore).toBe(14);
    expect(result.escalatingCount).toBe(1);
  });

  it("applies chronic penalty", () => {
    const patterns = [
      makePattern({ id: "p1", recurrencePattern: "chronic", triggerIdentified: true, strategiesUpdated: true, multiAgencyInvolved: true }),
    ];
    const result = evaluatePatternRecognition(patterns);
    // 7 + 6 + 5 - 2 = 16
    expect(result.overallScore).toBe(16);
    expect(result.chronicCount).toBe(1);
  });

  it("applies multiple escalating penalties", () => {
    const patterns = [
      makePattern({ id: "p1", recurrencePattern: "escalating", triggerIdentified: true, strategiesUpdated: true, multiAgencyInvolved: true }),
      makePattern({ id: "p2", childId: "child-2", recurrencePattern: "escalating", triggerIdentified: true, strategiesUpdated: true, multiAgencyInvolved: true }),
    ];
    const result = evaluatePatternRecognition(patterns);
    // 7 + 6 + 5 - 4*2 = 10
    expect(result.overallScore).toBe(10);
    expect(result.escalatingCount).toBe(2);
  });

  it("clamps score to 0 when penalties are severe", () => {
    const patterns = Array.from({ length: 5 }, (_, i) =>
      makePattern({ id: `p-${i}`, childId: `child-${i}`, recurrencePattern: "escalating", triggerIdentified: false, strategiesUpdated: false, multiAgencyInvolved: false }),
    );
    const result = evaluatePatternRecognition(patterns);
    // 0 + 0 + 0 - 4*5 = -20, clamped to 0
    expect(result.overallScore).toBe(0);
  });

  it("calculates triggerIdentifiedRate correctly", () => {
    const patterns = [
      makePattern({ id: "p1", triggerIdentified: true }),
      makePattern({ id: "p2", childId: "child-2", triggerIdentified: false }),
      makePattern({ id: "p3", childId: "child-3", triggerIdentified: true }),
    ];
    const result = evaluatePatternRecognition(patterns);
    expect(result.triggerIdentifiedRate).toBe(67);
  });

  it("calculates strategiesUpdatedRate correctly", () => {
    const patterns = [
      makePattern({ id: "p1", strategiesUpdated: true }),
      makePattern({ id: "p2", childId: "child-2", strategiesUpdated: false }),
    ];
    const result = evaluatePatternRecognition(patterns);
    expect(result.strategiesUpdatedRate).toBe(50);
  });

  it("calculates multiAgencyRate correctly", () => {
    const patterns = [
      makePattern({ id: "p1", multiAgencyInvolved: true }),
      makePattern({ id: "p2", childId: "child-2", multiAgencyInvolved: true }),
      makePattern({ id: "p3", childId: "child-3", multiAgencyInvolved: false }),
    ];
    const result = evaluatePatternRecognition(patterns);
    expect(result.multiAgencyRate).toBe(67);
  });

  it("calculates recurringRate correctly (recurring + escalating + chronic)", () => {
    const patterns = [
      makePattern({ id: "p1", recurrencePattern: "first_occurrence" }),
      makePattern({ id: "p2", childId: "child-2", recurrencePattern: "recurring" }),
      makePattern({ id: "p3", childId: "child-3", recurrencePattern: "escalating" }),
      makePattern({ id: "p4", childId: "child-4", recurrencePattern: "de_escalating" }),
      makePattern({ id: "p5", childId: "child-5", recurrencePattern: "chronic" }),
    ];
    const result = evaluatePatternRecognition(patterns);
    // recurring + escalating + chronic = 3 out of 5 = 60%
    expect(result.recurringRate).toBe(60);
  });

  it("score does not exceed 25", () => {
    const patterns = [
      makePattern({ triggerIdentified: true, strategiesUpdated: true, multiAgencyInvolved: true, recurrencePattern: "de_escalating" }),
    ];
    const result = evaluatePatternRecognition(patterns);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles de_escalating pattern without penalty", () => {
    const patterns = [
      makePattern({ recurrencePattern: "de_escalating", triggerIdentified: true, strategiesUpdated: true, multiAgencyInvolved: true }),
    ];
    const result = evaluatePatternRecognition(patterns);
    expect(result.escalatingCount).toBe(0);
    expect(result.chronicCount).toBe(0);
    // 7 + 6 + 5 = 18
    expect(result.overallScore).toBe(18);
  });

  it("counts escalating and chronic separately", () => {
    const patterns = [
      makePattern({ id: "p1", recurrencePattern: "escalating" }),
      makePattern({ id: "p2", childId: "child-2", recurrencePattern: "chronic" }),
    ];
    const result = evaluatePatternRecognition(patterns);
    expect(result.escalatingCount).toBe(1);
    expect(result.chronicCount).toBe(1);
  });
});

// ── evaluateTeamLearning ────────────────────────────────────────────────────

describe("evaluateTeamLearning", () => {
  it("returns 0 for empty sessions", () => {
    const result = evaluateTeamLearning([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.incidentRelatedRate).toBe(0);
    expect(result.averageAttendance).toBe(0);
    expect(result.actionCompletionRate).toBe(0);
    expect(result.averageActionPoints).toBe(0);
  });

  it("scores well for high-quality sessions", () => {
    const sessions = [
      makeSession({ attendeeCount: 10, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 5, actionPointsCompleted: 5 }),
      makeSession({ id: "s2", sessionDate: "2025-04-15", attendeeCount: 10, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 5, actionPointsCompleted: 5 }),
      makeSession({ id: "s3", sessionDate: "2025-05-15", attendeeCount: 10, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 5, actionPointsCompleted: 5 }),
      makeSession({ id: "s4", sessionDate: "2025-06-15", attendeeCount: 10, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 5, actionPointsCompleted: 5 }),
    ];
    const result = evaluateTeamLearning(sessions);
    // attendance 100% -> 7, action 100% -> 6, incident 100% -> 5, frequency 4 -> 4, avg 5 -> 3 = 25
    expect(result.overallScore).toBe(25);
  });

  it("calculates averageAttendance correctly", () => {
    const sessions = [
      makeSession({ id: "s1", attendeeCount: 8, totalStaff: 10 }),
      makeSession({ id: "s2", sessionDate: "2025-04-15", attendeeCount: 6, totalStaff: 10 }),
    ];
    const result = evaluateTeamLearning(sessions);
    // (80 + 60) / 2 = 70
    expect(result.averageAttendance).toBe(70);
  });

  it("calculates actionCompletionRate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", actionPointsGenerated: 4, actionPointsCompleted: 3 }),
      makeSession({ id: "s2", sessionDate: "2025-04-15", actionPointsGenerated: 6, actionPointsCompleted: 4 }),
    ];
    const result = evaluateTeamLearning(sessions);
    // 7 completed out of 10 generated = 70%
    expect(result.actionCompletionRate).toBe(70);
  });

  it("calculates incidentRelatedRate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", incidentRelated: true }),
      makeSession({ id: "s2", sessionDate: "2025-04-15", incidentRelated: false }),
      makeSession({ id: "s3", sessionDate: "2025-05-15", incidentRelated: true }),
    ];
    const result = evaluateTeamLearning(sessions);
    expect(result.incidentRelatedRate).toBe(67);
  });

  it("calculates averageActionPoints correctly", () => {
    const sessions = [
      makeSession({ id: "s1", actionPointsGenerated: 4 }),
      makeSession({ id: "s2", sessionDate: "2025-04-15", actionPointsGenerated: 6 }),
    ];
    const result = evaluateTeamLearning(sessions);
    expect(result.averageActionPoints).toBe(5);
  });

  it("handles zero totalStaff gracefully", () => {
    const sessions = [
      makeSession({ attendeeCount: 5, totalStaff: 0 }),
    ];
    const result = evaluateTeamLearning(sessions);
    expect(result.averageAttendance).toBe(0);
  });

  it("handles zero actionPointsGenerated gracefully", () => {
    const sessions = [
      makeSession({ actionPointsGenerated: 0, actionPointsCompleted: 0 }),
    ];
    const result = evaluateTeamLearning(sessions);
    expect(result.actionCompletionRate).toBe(0);
    expect(result.averageActionPoints).toBe(0);
  });

  it("frequency bonus caps at 4", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `s-${i}`, sessionDate: `2025-0${Math.min(i + 1, 6)}-15`, attendeeCount: 0, totalStaff: 10, incidentRelated: false, actionPointsGenerated: 0, actionPointsCompleted: 0 }),
    );
    const result = evaluateTeamLearning(sessions);
    // attendance 0 -> 0, action 0 -> 0, incident 0 -> 0, frequency 10 capped at 4, avg 0 -> 0 = 4
    expect(result.overallScore).toBe(4);
  });

  it("average action points bonus caps at 3", () => {
    const sessions = [
      makeSession({ attendeeCount: 0, totalStaff: 10, incidentRelated: false, actionPointsGenerated: 20, actionPointsCompleted: 0 }),
    ];
    const result = evaluateTeamLearning(sessions);
    // avg action points = 20, floor(20) capped at 3
    // frequency 1 session = 1
    // total = 0 + 0 + 0 + 1 + 3 = 4
    expect(result.overallScore).toBe(4);
  });

  it("score does not exceed 25", () => {
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({ id: `s-${i}`, sessionDate: `2025-03-${String(i + 1).padStart(2, "0")}`, attendeeCount: 10, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 10, actionPointsCompleted: 10 }),
    );
    const result = evaluateTeamLearning(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("single session with mixed metrics", () => {
    const sessions = [
      makeSession({ attendeeCount: 5, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 3, actionPointsCompleted: 1 }),
    ];
    const result = evaluateTeamLearning(sessions);
    expect(result.totalSessions).toBe(1);
    expect(result.averageAttendance).toBe(50);
    expect(result.incidentRelatedRate).toBe(100);
    expect(result.actionCompletionRate).toBe(33);
    expect(result.averageActionPoints).toBe(3);
    // 50%*7=3.5, 33%*6=1.98, 100%*5=5, freq 1=1, avg 3=3 = 14.48 -> 14.5
    expect(result.overallScore).toBe(14.5);
  });
});

// ── generatePostIncidentLearningIntelligence ────────────────────────────────

describe("generatePostIncidentLearningIntelligence", () => {
  it("generates complete intelligence with all data", () => {
    const reviews = [makeReview()];
    const actions = [makeAction()];
    const patterns = [makePattern()];
    const sessions = [makeSession()];

    const result = generatePostIncidentLearningIntelligence(
      reviews, actions, patterns, sessions,
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.debriefQuality).toBeDefined();
    expect(result.learningEffectiveness).toBeDefined();
    expect(result.patternRecognition).toBeDefined();
    expect(result.teamLearning).toBeDefined();
    expect(result.incidentProfiles).toBeDefined();
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.areasForImprovement).toBeInstanceOf(Array);
    expect(result.actions).toBeInstanceOf(Array);
    expect(result.regulatoryLinks).toBeInstanceOf(Array);
  });

  it("returns outstanding rating for perfect data", () => {
    const reviews = [
      makeReview({ id: "r1" }),
      makeReview({ id: "r2", incidentId: "inc-2" }),
    ];
    const actions = [
      makeAction({ id: "a1", learningOutcome: "practice_change" }),
      makeAction({ id: "a2", reviewId: "rev-2", learningOutcome: "practice_change" }),
      makeAction({ id: "a3", reviewId: "rev-3", learningOutcome: "practice_change" }),
      makeAction({ id: "a4", reviewId: "rev-4", learningOutcome: "practice_change" }),
      makeAction({ id: "a5", reviewId: "rev-5", learningOutcome: "practice_change" }),
      makeAction({ id: "a6", reviewId: "rev-6", learningOutcome: "policy_update" }),
      makeAction({ id: "a7", reviewId: "rev-7", learningOutcome: "policy_update" }),
      makeAction({ id: "a8", reviewId: "rev-8", learningOutcome: "policy_update" }),
      makeAction({ id: "a9", reviewId: "rev-9", learningOutcome: "training_delivered" }),
      makeAction({ id: "a10", reviewId: "rev-10", learningOutcome: "training_delivered" }),
      makeAction({ id: "a11", reviewId: "rev-11", learningOutcome: "training_delivered" }),
    ];
    const patterns: PatternAnalysis[] = [];
    const sessions = [
      makeSession({ id: "s1", attendeeCount: 10, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 5, actionPointsCompleted: 5 }),
      makeSession({ id: "s2", sessionDate: "2025-04-15", attendeeCount: 10, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 5, actionPointsCompleted: 5 }),
      makeSession({ id: "s3", sessionDate: "2025-05-15", attendeeCount: 10, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 5, actionPointsCompleted: 5 }),
      makeSession({ id: "s4", sessionDate: "2025-06-15", attendeeCount: 10, totalStaff: 10, incidentRelated: true, actionPointsGenerated: 5, actionPointsCompleted: 5 }),
    ];

    const result = generatePostIncidentLearningIntelligence(
      reviews, actions, patterns, sessions,
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate rating for poor data", () => {
    const reviews = [
      makeReview({
        debriefStatus: "not_completed", childInvolved: true, childDebrief: false,
        staffDebrief: false, rootCauseIdentified: false, lessonsDocumented: false,
        reviewQuality: "not_completed",
      }),
    ];
    const actions: LearningAction[] = [];
    const patterns = [
      makePattern({ recurrencePattern: "escalating", triggerIdentified: false, strategiesUpdated: false, multiAgencyInvolved: false }),
    ];
    const sessions: TeamLearningSession[] = [];

    const result = generatePostIncidentLearningIntelligence(
      reviews, actions, patterns, sessions,
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("generates strengths for high debrief rates", () => {
    const reviews = [
      makeReview({ id: "r1" }),
      makeReview({ id: "r2", incidentId: "inc-2" }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.strengths.some((s) => s.includes("within 24 hours"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Children are meaningfully included"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Root cause analysis"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Lessons are well-documented"))).toBe(true);
  });

  it("generates areas for improvement for low rates", () => {
    const reviews = [
      makeReview({
        debriefStatus: "not_completed", childInvolved: true, childDebrief: false,
        staffDebrief: false, rootCauseIdentified: false, lessonsDocumented: false,
        reviewQuality: "not_completed",
      }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.areasForImprovement.some((a) => a.includes("promptly"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("Children should"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("Root cause analysis"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("Lessons from incidents"))).toBe(true);
  });

  it("generates urgent actions for not_completed reviews", () => {
    const reviews = [
      makeReview({ id: "r1", debriefStatus: "not_completed", reviewQuality: "not_completed", childInvolved: false, childDebrief: null, staffDebrief: false, rootCauseIdentified: false, lessonsDocumented: false }),
      makeReview({ id: "r2", incidentId: "inc-2", debriefStatus: "not_completed", reviewQuality: "not_completed", childInvolved: false, childDebrief: null, staffDebrief: false, rootCauseIdentified: false, lessonsDocumented: false }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("2"))).toBe(true);
  });

  it("generates urgent action for escalating patterns", () => {
    const patterns = [
      makePattern({ recurrencePattern: "escalating" }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      [], [], patterns, [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("multi-agency"))).toBe(true);
  });

  it("generates high action for no team learning sessions", () => {
    const reviews = [makeReview()];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("team learning sessions"))).toBe(true);
  });

  it("includes all regulatory links", () => {
    const result = generatePostIncidentLearningIntelligence(
      [], [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 40"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 19"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989 s47"))).toBe(true);
  });

  it("generates incident profiles for each type", () => {
    const reviews = [
      makeReview({ id: "r1", incidentType: "physical_intervention" }),
      makeReview({ id: "r2", incidentId: "inc-2", incidentType: "self_harm" }),
    ];
    const patterns = [
      makePattern({ incidentType: "physical_intervention" }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], patterns, [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.incidentProfiles.length).toBe(2);
    const piProfile = result.incidentProfiles.find((p) => p.incidentType === "physical_intervention");
    const shProfile = result.incidentProfiles.find((p) => p.incidentType === "self_harm");
    expect(piProfile).toBeDefined();
    expect(shProfile).toBeDefined();
    expect(piProfile!.reviewCount).toBe(1);
    expect(shProfile!.reviewCount).toBe(1);
  });

  it("incident profiles include pattern-only types", () => {
    const patterns = [
      makePattern({ incidentType: "missing_from_care" }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      [], [], patterns, [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.incidentProfiles.length).toBe(1);
    expect(result.incidentProfiles[0].incidentType).toBe("missing_from_care");
    expect(result.incidentProfiles[0].reviewCount).toBe(0);
  });

  it("empty data produces no-incidents strength", () => {
    const result = generatePostIncidentLearningIntelligence(
      [], [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.strengths.some((s) => s.includes("No incidents requiring review"))).toBe(true);
  });

  it("overall score sums all four component scores", () => {
    const reviews = [makeReview()];
    const actions = [makeAction()];
    const patterns: PatternAnalysis[] = [];
    const sessions = [makeSession()];

    const result = generatePostIncidentLearningIntelligence(
      reviews, actions, patterns, sessions,
      "oak-house", "2025-01-01", "2025-06-30",
    );

    const expectedTotal =
      result.debriefQuality.overallScore +
      result.learningEffectiveness.overallScore +
      result.patternRecognition.overallScore +
      result.teamLearning.overallScore;
    expect(result.overallScore).toBe(Math.round(expectedTotal * 10) / 10);
  });

  it("areas for improvement includes staff debrief note when low", () => {
    const reviews = [
      makeReview({ staffDebrief: false }),
      makeReview({ id: "r2", incidentId: "inc-2", staffDebrief: false }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.areasForImprovement.some((a) => a.includes("Staff debriefs"))).toBe(true);
  });

  it("areas for improvement includes escalating patterns note", () => {
    const patterns = [
      makePattern({ recurrencePattern: "escalating" }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      [], [], patterns, [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.areasForImprovement.some((a) => a.includes("escalating"))).toBe(true);
  });

  it("areas for improvement includes chronic patterns note", () => {
    const patterns = [
      makePattern({ id: "p1", recurrencePattern: "chronic" }),
      makePattern({ id: "p2", childId: "child-2", recurrencePattern: "chronic" }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      [], [], patterns, [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.areasForImprovement.some((a) => a.includes("2 chronic"))).toBe(true);
  });

  it("actions include learning actions review when completion rate is low", () => {
    const reviews = [makeReview()];
    const actions = [
      makeAction({ id: "a1", completedDate: null }),
      makeAction({ id: "a2", reviewId: "rev-2", completedDate: null }),
      makeAction({ id: "a3", reviewId: "rev-3", completedDate: null }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, actions, [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("learning actions"))).toBe(true);
  });

  it("actions include child debrief process review when rate is low", () => {
    const reviews = [
      makeReview({ id: "r1", childInvolved: true, childDebrief: false }),
      makeReview({ id: "r2", incidentId: "inc-2", childInvolved: true, childDebrief: false }),
      makeReview({ id: "r3", incidentId: "inc-3", childInvolved: true, childDebrief: false }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("children are supported"))).toBe(true);
  });

  it("actions include root cause training when rate is low", () => {
    const reviews = [
      makeReview({ id: "r1", rootCauseIdentified: false }),
      makeReview({ id: "r2", incidentId: "inc-2", rootCauseIdentified: false }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("root cause analysis"))).toBe(true);
  });

  it("strength for no escalating or chronic patterns", () => {
    const patterns = [
      makePattern({ recurrencePattern: "first_occurrence" }),
      makePattern({ id: "p2", childId: "child-2", recurrencePattern: "de_escalating" }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      [], [], patterns, [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.strengths.some((s) => s.includes("No escalating or chronic patterns"))).toBe(true);
  });

  it("strength for strong action completion rate", () => {
    const sessions = [
      makeSession({ actionPointsGenerated: 10, actionPointsCompleted: 9 }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      [], [], [], sessions,
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.strengths.some((s) => s.includes("action points are consistently completed"))).toBe(true);
  });

  it("area for improvement when no team learning sessions", () => {
    const reviews = [makeReview()];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.areasForImprovement.some((a) => a.includes("No team learning sessions"))).toBe(true);
  });

  it("area for improvement when evidence rate is low", () => {
    const reviews = [makeReview()];
    const actions = [
      makeAction({ id: "a1", evidenceRecorded: false }),
      makeAction({ id: "a2", reviewId: "rev-2", evidenceRecorded: false }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, actions, [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.areasForImprovement.some((a) => a.includes("Evidence of learning"))).toBe(true);
  });

  it("incident profile scores are between 0 and 10", () => {
    const reviews = [
      makeReview({ id: "r1", incidentType: "physical_intervention" }),
      makeReview({ id: "r2", incidentId: "inc-2", incidentType: "self_harm" }),
      makeReview({ id: "r3", incidentId: "inc-3", incidentType: "missing_from_care" }),
    ];
    const patterns = [
      makePattern({ incidentType: "physical_intervention", recurrencePattern: "escalating" }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], patterns, [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    for (const profile of result.incidentProfiles) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("medium action for trigger analysis when rate is low", () => {
    const patterns = [
      makePattern({ id: "p1", triggerIdentified: false }),
      makePattern({ id: "p2", childId: "child-2", triggerIdentified: false }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      [], [], patterns, [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("trigger analysis"))).toBe(true);
  });

  it("medium action for attendance when rate is low", () => {
    const sessions = [
      makeSession({ attendeeCount: 3, totalStaff: 10 }),
      makeSession({ id: "s2", sessionDate: "2025-04-15", attendeeCount: 4, totalStaff: 10 }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      [], [], [], sessions,
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("attendance"))).toBe(true);
  });

  it("medium action for lessons template when documentation rate is low", () => {
    const reviews = [
      makeReview({ id: "r1", lessonsDocumented: false }),
      makeReview({ id: "r2", incidentId: "inc-2", lessonsDocumented: false }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, [], [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("lessons-learned template"))).toBe(true);
  });

  it("low action for evidence framework when evidence rate is low", () => {
    const reviews = [makeReview()];
    const actions = [
      makeAction({ id: "a1", evidenceRecorded: false }),
      makeAction({ id: "a2", reviewId: "rev-2", evidenceRecorded: false }),
      makeAction({ id: "a3", reviewId: "rev-3", evidenceRecorded: false }),
    ];
    const result = generatePostIncidentLearningIntelligence(
      reviews, actions, [], [],
      "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.actions.some((a) => a.includes("LOW") && a.includes("evidence recording framework"))).toBe(true);
  });
});
