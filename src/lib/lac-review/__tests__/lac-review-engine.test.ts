// ══════════════════════════════════════════════════════════════════════════════
// Cara — LAC Review Intelligence Engine — Tests
//
// Demo children:
//   Alex    — good review engagement, one late review, some overdue recs
//   Jordan  — excellent attendance and timeliness, all recs completed
//   Morgan  — refused participation in one review, no mid-point checks
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateReviewTimeliness,
  evaluateChildParticipation,
  evaluateRecommendationTracking,
  evaluateIROEffectiveness,
  buildChildReviewProfiles,
  generateLACReviewIntelligence,
  getReviewTypeLabel,
  getParticipationMethodLabel,
  getRecommendationPriorityLabel,
  getRecommendationStatusLabel,
} from "../lac-review-engine";
import type {
  LACReview,
  ReviewRecommendation,
  IROActivity,
} from "../lac-review-engine";

// ── Test Constants ──────────────────────────────────────────────────────────

const HOME_ID = "home-oak";
const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REFERENCE_DATE = "2025-06-15";
const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];

// ── Demo Data ───────────────────────────────────────────────────────────────

const demoReviews: LACReview[] = [
  // Alex — initial (on time), subsequent (late by 5 days)
  {
    id: "rev-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
    reviewType: "initial", dueDate: "2025-01-25", actualDate: "2025-01-24",
    wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
    participationMethod: "attended_in_person", childViewsCaptured: true,
    childViewsSummary: "Alex shared his views openly",
    parentInvited: true, parentAttended: false, carerAttended: true,
    socialWorkerAttended: true, otherProfessionals: ["CAMHS"],
    outcome: "care_plan_endorsed", carePlanUpdated: true,
    minutesDistributedWithin5Days: true, nextReviewDate: "2025-04-24",
  },
  {
    id: "rev-a2", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
    reviewType: "second", dueDate: "2025-04-24", actualDate: "2025-04-29",
    wasTimely: false, iroName: "Jane Cooper", iroIndependent: true,
    participationMethod: "written_views", childViewsCaptured: true,
    childViewsSummary: "Alex submitted views via letter",
    parentInvited: true, parentAttended: true, carerAttended: true,
    socialWorkerAttended: true, otherProfessionals: ["Virtual School Head"],
    outcome: "care_plan_amended", carePlanUpdated: true,
    minutesDistributedWithin5Days: false, nextReviewDate: "2025-10-29",
  },

  // Jordan — two reviews both on time, excellent participation
  {
    id: "rev-j1", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
    reviewType: "subsequent", dueDate: "2025-02-15", actualDate: "2025-02-14",
    wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
    participationMethod: "attended_in_person", childViewsCaptured: true,
    childViewsSummary: "Jordan spoke confidently about his goals",
    parentInvited: true, parentAttended: true, carerAttended: true,
    socialWorkerAttended: true, otherProfessionals: ["School"],
    outcome: "care_plan_endorsed", carePlanUpdated: true,
    minutesDistributedWithin5Days: true, nextReviewDate: "2025-08-14",
  },
  {
    id: "rev-j2", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
    reviewType: "emergency", dueDate: "2025-05-01", actualDate: "2025-05-01",
    wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
    participationMethod: "attended_virtually", childViewsCaptured: true,
    childViewsSummary: "Jordan joined by video and shared concerns",
    parentInvited: false, parentAttended: false, carerAttended: true,
    socialWorkerAttended: true, otherProfessionals: [],
    outcome: "additional_assessment_required", carePlanUpdated: true,
    minutesDistributedWithin5Days: true, nextReviewDate: "2025-08-14",
  },

  // Morgan — one review, refused to participate, IRO not independent
  {
    id: "rev-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
    reviewType: "subsequent", dueDate: "2025-03-10", actualDate: "2025-03-10",
    wasTimely: true, iroName: "David Hughes", iroIndependent: false,
    participationMethod: "refused_to_participate", childViewsCaptured: false,
    parentInvited: true, parentAttended: false, carerAttended: true,
    socialWorkerAttended: false, otherProfessionals: [],
    outcome: "care_plan_endorsed", carePlanUpdated: false,
    minutesDistributedWithin5Days: true, nextReviewDate: "2025-09-10",
  },
  // Morgan — second review, advocate attended
  {
    id: "rev-m2", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
    reviewType: "subsequent", dueDate: "2025-06-10", actualDate: "2025-06-10",
    wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
    participationMethod: "advocate_attended", childViewsCaptured: true,
    childViewsSummary: "Advocate presented Morgan's written views",
    parentInvited: true, parentAttended: false, carerAttended: true,
    socialWorkerAttended: true, otherProfessionals: ["CAMHS"],
    outcome: "care_plan_amended", carePlanUpdated: true,
    minutesDistributedWithin5Days: true, nextReviewDate: "2025-12-10",
  },
];

const demoRecommendations: ReviewRecommendation[] = [
  // Alex's recs — 1 completed, 1 overdue, 1 in progress
  {
    id: "rec-a1", homeId: HOME_ID, reviewId: "rev-a1", childId: "child-alex", childName: "Alex",
    recommendation: "Arrange dental appointment", responsiblePerson: "Sarah Johnson",
    priority: "high", dueDate: "2025-02-28", status: "completed",
    completedDate: "2025-02-20", evidenceOfCompletion: "Dental visit confirmed",
  },
  {
    id: "rec-a2", homeId: HOME_ID, reviewId: "rev-a1", childId: "child-alex", childName: "Alex",
    recommendation: "Update education PEP with new targets", responsiblePerson: "Tom Richards",
    priority: "medium", dueDate: "2025-03-31", status: "overdue",
  },
  {
    id: "rec-a3", homeId: HOME_ID, reviewId: "rev-a2", childId: "child-alex", childName: "Alex",
    recommendation: "Refer to CAMHS for anxiety reassessment", responsiblePerson: "Sarah Johnson",
    priority: "urgent", dueDate: "2025-05-06", status: "in_progress",
  },

  // Jordan's recs — all completed
  {
    id: "rec-j1", homeId: HOME_ID, reviewId: "rev-j1", childId: "child-jordan", childName: "Jordan",
    recommendation: "Increase contact with maternal grandmother", responsiblePerson: "Lisa Williams",
    priority: "medium", dueDate: "2025-04-15", status: "completed",
    completedDate: "2025-03-28", evidenceOfCompletion: "Contact plan updated and implemented",
  },
  {
    id: "rec-j2", homeId: HOME_ID, reviewId: "rev-j1", childId: "child-jordan", childName: "Jordan",
    recommendation: "Enrol in swimming lessons", responsiblePerson: "Tom Richards",
    priority: "low", dueDate: "2025-05-15", status: "completed",
    completedDate: "2025-04-10", evidenceOfCompletion: "Enrolled at local leisure centre",
  },
  {
    id: "rec-j3", homeId: HOME_ID, reviewId: "rev-j2", childId: "child-jordan", childName: "Jordan",
    recommendation: "Complete risk assessment following incident", responsiblePerson: "Sarah Johnson",
    priority: "urgent", dueDate: "2025-05-08", status: "completed",
    completedDate: "2025-05-05", evidenceOfCompletion: "Risk assessment updated",
  },

  // Morgan's recs — 1 completed, 1 not started
  {
    id: "rec-m1", homeId: HOME_ID, reviewId: "rev-m1", childId: "child-morgan", childName: "Morgan",
    recommendation: "Re-engage Morgan with dental services", responsiblePerson: "Lisa Williams",
    priority: "high", dueDate: "2025-04-30", status: "completed",
    completedDate: "2025-04-25", evidenceOfCompletion: "Appointment arranged with gentle approach",
  },
  {
    id: "rec-m2", homeId: HOME_ID, reviewId: "rev-m2", childId: "child-morgan", childName: "Morgan",
    recommendation: "Develop independence skills plan", responsiblePerson: "Tom Richards",
    priority: "medium", dueDate: "2025-06-30", status: "not_started",
  },
  // One "no longer applicable" rec
  {
    id: "rec-m3", homeId: HOME_ID, reviewId: "rev-m1", childId: "child-morgan", childName: "Morgan",
    recommendation: "Arrange school transfer meeting", responsiblePerson: "Tom Richards",
    priority: "low", dueDate: "2025-05-30", status: "no_longer_applicable",
  },
];

const demoIROActivities: IROActivity[] = [
  // Alex — 1 mid-point check (child spoken to), 1 consultation
  {
    id: "iro-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
    iroName: "Jane Cooper", activityDate: "2025-03-10",
    activityType: "mid_point_check", notes: "Spoke with Alex, happy in placement",
    childSpokenTo: true, issuesIdentified: [], actionsRequired: [],
  },
  {
    id: "iro-a2", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
    iroName: "Jane Cooper", activityDate: "2025-05-20",
    activityType: "consultation", notes: "Discussed CAMHS referral progress",
    childSpokenTo: false, issuesIdentified: ["CAMHS waiting time"], actionsRequired: ["Chase referral"],
  },

  // Jordan — 1 mid-point check, 1 escalation (both child spoken to)
  {
    id: "iro-j1", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
    iroName: "Jane Cooper", activityDate: "2025-04-01",
    activityType: "mid_point_check", notes: "Positive check-in with Jordan",
    childSpokenTo: true, issuesIdentified: [], actionsRequired: [],
  },
  {
    id: "iro-j2", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
    iroName: "Jane Cooper", activityDate: "2025-05-15",
    activityType: "escalation", notes: "Escalated delay in risk assessment completion",
    childSpokenTo: true, issuesIdentified: ["Delayed risk assessment"], actionsRequired: ["Complete within 48 hours"],
  },

  // Morgan — 1 monitoring visit (child spoken to)
  {
    id: "iro-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
    iroName: "Jane Cooper", activityDate: "2025-04-20",
    activityType: "monitoring_visit", notes: "Visited home to check on Morgan's engagement",
    childSpokenTo: true, issuesIdentified: ["Low participation in activities"], actionsRequired: ["Explore reasons for disengagement"],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReviewTimeliness", () => {
  it("counts total reviews in period", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    expect(r.totalReviews).toBe(6);
  });

  it("counts on-time reviews", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    expect(r.reviewsOnTime).toBe(5);
  });

  it("counts late reviews", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    expect(r.reviewsLate).toBe(1);
  });

  it("calculates timeliness rate", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    expect(r.timelinessRate).toBeCloseTo(83.3, 0);
  });

  it("calculates average delay for late reviews", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    // rev-a2 is 5 days late
    expect(r.averageDelayDays).toBe(5);
  });

  it("calculates initial review timeliness", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    // 1 initial, 1 on time = 100%
    expect(r.initialReviewTimeliness).toBe(100);
  });

  it("calculates subsequent review timeliness", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    // second + subsequent reviews: rev-a2 (late), rev-j1 (on time), rev-m1 (on time), rev-m2 (on time) = 3/4 = 75%
    expect(r.subsequentReviewTimeliness).toBe(75);
  });

  it("counts emergency reviews", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    expect(r.emergencyReviewsHeld).toBe(1);
  });

  it("calculates minutes distribution rate", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    // 5 out of 6 distributed on time
    expect(r.minutesDistributedOnTimeRate).toBeCloseTo(83.3, 0);
  });

  it("produces score between 0 and 30", () => {
    const r = evaluateReviewTimeliness(demoReviews, PERIOD_START, PERIOD_END);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(30);
  });

  it("returns zeros for empty reviews", () => {
    const r = evaluateReviewTimeliness([], PERIOD_START, PERIOD_END);
    expect(r.totalReviews).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("filters reviews by period", () => {
    const r = evaluateReviewTimeliness(demoReviews, "2025-05-01", "2025-06-30");
    // Only rev-j2 (May 1), rev-m2 (Jun 10) fall in this range
    expect(r.totalReviews).toBe(2);
  });

  it("gives perfect score when all reviews are on time with minutes distributed", () => {
    const perfectReviews: LACReview[] = Array.from({ length: 4 }, (_, i) => ({
      id: `p-${i}`, homeId: HOME_ID, childId: "child-alex", childName: "Alex",
      reviewType: "subsequent" as const, dueDate: `2025-0${i + 1}-15`,
      actualDate: `2025-0${i + 1}-14`, wasTimely: true,
      iroName: "Jane Cooper", iroIndependent: true,
      participationMethod: "attended_in_person" as const, childViewsCaptured: true,
      parentInvited: true, parentAttended: true, carerAttended: true,
      socialWorkerAttended: true, otherProfessionals: [],
      outcome: "care_plan_endorsed" as const, carePlanUpdated: true,
      minutesDistributedWithin5Days: true,
    }));
    const r = evaluateReviewTimeliness(perfectReviews, PERIOD_START, PERIOD_END);
    expect(r.overallScore).toBe(30);
  });
});

describe("evaluateChildParticipation", () => {
  it("counts total reviews", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    expect(r.totalReviews).toBe(6);
  });

  it("counts children who attended (in person or virtual)", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    // rev-a1 in person, rev-j1 in person, rev-j2 virtually = 3
    expect(r.childAttended).toBe(3);
  });

  it("counts written views", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    // rev-a2
    expect(r.writtenViews).toBe(1);
  });

  it("counts advocate attended", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    // rev-m2
    expect(r.advocateAttended).toBe(1);
  });

  it("counts refusals", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    // rev-m1
    expect(r.refused).toBe(1);
  });

  it("counts not invited", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    expect(r.notInvited).toBe(0);
  });

  it("calculates meaningful participation rate", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    // 3 attended + 1 written + 1 advocate = 5 out of 6 = 83.3%
    expect(r.meaningfulParticipationRate).toBeCloseTo(83.3, 0);
  });

  it("calculates child views captured rate", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    // 5 out of 6 (rev-m1 is false)
    expect(r.childViewsCapturedRate).toBeCloseTo(83.3, 0);
  });

  it("calculates parent invited rate", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    // 5 out of 6 (rev-j2 not invited)
    expect(r.parentInvitedRate).toBeCloseTo(83.3, 0);
  });

  it("calculates carer attended rate", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    // All 6 carers attended
    expect(r.carerAttendedRate).toBe(100);
  });

  it("calculates social worker attended rate", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    // 5 out of 6 (rev-m1 SW didn't attend)
    expect(r.socialWorkerAttendedRate).toBeCloseTo(83.3, 0);
  });

  it("produces score between 0 and 25", () => {
    const r = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns zeros for empty reviews", () => {
    const r = evaluateChildParticipation([], PERIOD_START, PERIOD_END);
    expect(r.totalReviews).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("penalises not-invited children", () => {
    const badReview: LACReview = {
      ...demoReviews[0], id: "bad-1",
      participationMethod: "not_invited", childViewsCaptured: false,
    };
    const good = evaluateChildParticipation([demoReviews[0]], PERIOD_START, PERIOD_END);
    const bad = evaluateChildParticipation([badReview], PERIOD_START, PERIOD_END);
    expect(bad.overallScore).toBeLessThan(good.overallScore);
  });

  it("gives advocacy bonus when advocate present", () => {
    // Morgan's second review has advocate
    const withAdvocate = evaluateChildParticipation(demoReviews, PERIOD_START, PERIOD_END);
    const noAdvocate = evaluateChildParticipation(
      demoReviews.filter((r) => r.id !== "rev-m2"),
      PERIOD_START,
      PERIOD_END,
    );
    // The block is named for the bonus but only ever asserted the count, so
    // the bonus itself — the thing under test — was never checked.
    expect(withAdvocate.advocateAttended).toBe(1);
    expect(noAdvocate.advocateAttended).toBe(0);
    expect(withAdvocate.overallScore).toBeGreaterThan(noAdvocate.overallScore);
  });
});

describe("evaluateRecommendationTracking", () => {
  it("counts total recommendations", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalRecommendations).toBe(9);
  });

  it("counts completed recommendations", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // rec-a1, rec-j1, rec-j2, rec-j3, rec-m1 = 5
    expect(r.completed).toBe(5);
  });

  it("counts overdue recommendations", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // rec-a2 is overdue
    expect(r.overdue).toBe(1);
  });

  it("counts in-progress recommendations", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // rec-a3
    expect(r.inProgress).toBe(1);
  });

  it("counts not-started recommendations", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // rec-m2
    expect(r.notStarted).toBe(1);
  });

  it("counts no-longer-applicable", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // rec-m3
    expect(r.noLongerApplicable).toBe(1);
  });

  it("calculates completion rate excluding N/A", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // 5 completed out of 8 actionable = 62.5%
    expect(r.completionRate).toBe(62.5);
  });

  it("calculates overdue rate", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // 1 overdue out of 8 actionable = 12.5%
    expect(r.overdueRate).toBe(12.5);
  });

  it("calculates urgent completion rate", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // 1 urgent completed (rec-j3), 1 urgent in-progress (rec-a3) = 1/2 = 50%
    expect(r.urgentCompletionRate).toBe(50);
  });

  it("produces score between 0 and 25", () => {
    const r = evaluateRecommendationTracking(demoRecommendations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns zeros for empty recommendations", () => {
    const r = evaluateRecommendationTracking([], PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalRecommendations).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("gives high score when all are completed", () => {
    const allCompleted = demoRecommendations.map((rec) => ({
      ...rec,
      status: "completed" as const,
      completedDate: "2025-03-01",
    }));
    const r = evaluateRecommendationTracking(allCompleted, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.completionRate).toBe(100);
    expect(r.overallScore).toBeGreaterThan(20);
  });
});

describe("evaluateIROEffectiveness", () => {
  it("counts total IRO activities", () => {
    const r = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    expect(r.totalIROActivities).toBe(5);
  });

  it("counts mid-point checks", () => {
    const r = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    expect(r.midPointChecks).toBe(2);
  });

  it("counts monitoring visits", () => {
    const r = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    expect(r.monitoringVisits).toBe(1);
  });

  it("counts consultations", () => {
    const r = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    expect(r.consultations).toBe(1);
  });

  it("counts escalations", () => {
    const r = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    expect(r.escalations).toBe(1);
  });

  it("calculates child spoken to rate", () => {
    const r = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    // 4 out of 5 activities had child spoken to
    expect(r.childSpokenToRate).toBe(80);
  });

  it("counts issues identified", () => {
    const r = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    // iro-a2: 1, iro-j2: 1, iro-m1: 1 = 3
    expect(r.issuesIdentifiedCount).toBe(3);
  });

  it("calculates IRO independence rate", () => {
    const r = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    // 5 out of 6 reviews had independent IRO
    expect(r.iroIndependenceRate).toBeCloseTo(83.3, 0);
  });

  it("produces score between 0 and 20", () => {
    const r = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(20);
  });

  it("returns zeros for empty data", () => {
    const r = evaluateIROEffectiveness([], [], PERIOD_START, PERIOD_END);
    expect(r.totalIROActivities).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("gives higher score with full independence", () => {
    const independentReviews = demoReviews.map((rev) => ({ ...rev, iroIndependent: true }));
    const mixed = evaluateIROEffectiveness(demoReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    const full = evaluateIROEffectiveness(independentReviews, demoIROActivities, PERIOD_START, PERIOD_END);
    expect(full.overallScore).toBeGreaterThanOrEqual(mixed.overallScore);
  });
});

describe("buildChildReviewProfiles", () => {
  const profiles = buildChildReviewProfiles(
    demoReviews, demoRecommendations, demoIROActivities, CHILD_IDS, PERIOD_START, PERIOD_END,
  );

  it("builds a profile for each child", () => {
    expect(profiles).toHaveLength(3);
  });

  it("identifies Alex's profile correctly", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.childName).toBe("Alex");
    expect(alex.totalReviews).toBe(2);
    expect(alex.reviewsOnTime).toBe(1);
  });

  it("calculates Alex's timeliness rate", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.timelinessRate).toBe(50);
  });

  it("calculates Alex's participation rate", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    // Both reviews had meaningful participation (in person + written views)
    expect(alex.participationRate).toBe(100);
  });

  it("tracks Alex's recommendations", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.totalRecommendations).toBe(3);
    expect(alex.completedRecommendations).toBe(1);
    expect(alex.overdueRecommendations).toBe(1);
  });

  it("identifies Jordan's excellent profile", () => {
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.totalReviews).toBe(2);
    expect(jordan.reviewsOnTime).toBe(2);
    expect(jordan.timelinessRate).toBe(100);
    expect(jordan.participationRate).toBe(100);
    expect(jordan.completedRecommendations).toBe(3);
    expect(jordan.overdueRecommendations).toBe(0);
  });

  it("identifies Morgan's mixed profile", () => {
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.totalReviews).toBe(2);
    expect(morgan.reviewsOnTime).toBe(2);
    // 1 refused, 1 advocate = 50% meaningful participation
    expect(morgan.participationRate).toBe(50);
  });

  it("tracks IRO mid-point checks per child", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.iroMidPointChecks).toBe(1);
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.iroMidPointChecks).toBe(1);
  });

  it("provides last review date", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.lastReviewDate).toBe("2025-04-29");
  });

  it("provides next review due date", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.nextReviewDue).toBe("2025-10-29");
  });

  it("produces score between 0 and 10 per child", () => {
    for (const p of profiles) {
      expect(p.overallScore).toBeGreaterThanOrEqual(0);
      expect(p.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("gives Jordan highest score", () => {
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    const others = profiles.filter((p) => p.childId !== "child-jordan");
    for (const p of others) {
      expect(jordan.overallScore).toBeGreaterThanOrEqual(p.overallScore);
    }
  });
});

describe("generateLACReviewIntelligence", () => {
  const result = generateLACReviewIntelligence(
    demoReviews, demoRecommendations, demoIROActivities,
    CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns homeId", () => {
    expect(result.homeId).toBe(HOME_ID);
  });

  it("returns period dates", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns referenceDate", () => {
    expect(result.referenceDate).toBe(REFERENCE_DATE);
  });

  it("calculates overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes timeliness results", () => {
    expect(result.timeliness.totalReviews).toBe(6);
  });

  it("includes participation results", () => {
    expect(result.participation.totalReviews).toBe(6);
  });

  it("includes recommendation results", () => {
    expect(result.recommendations.totalRecommendations).toBe(9);
  });

  it("includes IRO effectiveness results", () => {
    expect(result.iroEffectiveness.totalIROActivities).toBe(5);
  });

  it("includes child profiles", () => {
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement", () => {
    // With one late review and IRO not always independent, there should be areas
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions", () => {
    // Overdue recommendations should trigger actions
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Care Planning"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("IRO Handbook"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
  });

  it("flags overdue recommendations in actions", () => {
    expect(result.actions.some((a) => a.includes("overdue"))).toBe(true);
  });

  it("flags IRO independence concern", () => {
    expect(result.areasForImprovement.some((a) => a.includes("independence"))).toBe(true);
  });
});

describe("generateLACReviewIntelligence — edge cases", () => {
  it("handles empty data gracefully", () => {
    const r = generateLACReviewIntelligence([], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
    expect(r.childProfiles).toHaveLength(0);
  });

  it("handles single child with perfect data", () => {
    const perfectReview: LACReview = {
      id: "perf-1", homeId: HOME_ID, childId: "child-only", childName: "Perfect Child",
      reviewType: "subsequent", dueDate: "2025-03-15", actualDate: "2025-03-14",
      wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
      participationMethod: "attended_in_person", childViewsCaptured: true,
      childViewsSummary: "Great views shared",
      parentInvited: true, parentAttended: true, carerAttended: true,
      socialWorkerAttended: true, otherProfessionals: ["CAMHS"],
      outcome: "care_plan_endorsed", carePlanUpdated: true,
      minutesDistributedWithin5Days: true, nextReviewDate: "2025-09-14",
    };
    const perfectRec: ReviewRecommendation = {
      id: "perf-rec-1", homeId: HOME_ID, reviewId: "perf-1",
      childId: "child-only", childName: "Perfect Child",
      recommendation: "Continue current plan", responsiblePerson: "Staff",
      priority: "low", dueDate: "2025-06-15", status: "completed",
      completedDate: "2025-04-15",
    };
    const perfectIRO: IROActivity = {
      id: "perf-iro-1", homeId: HOME_ID, childId: "child-only",
      childName: "Perfect Child", iroName: "Jane Cooper",
      activityDate: "2025-04-15", activityType: "mid_point_check",
      notes: "All good", childSpokenTo: true, issuesIdentified: [], actionsRequired: [],
    };

    const r = generateLACReviewIntelligence(
      [perfectReview], [perfectRec], [perfectIRO],
      ["child-only"], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(r.overallScore).toBeGreaterThan(60);
    expect(["outstanding", "good"]).toContain(r.rating);
  });

  it("gives low score when all reviews are late with no participation", () => {
    const badReviews: LACReview[] = Array.from({ length: 3 }, (_, i) => ({
      id: `bad-${i}`, homeId: HOME_ID, childId: "child-bad", childName: "Bad",
      reviewType: "subsequent" as const, dueDate: `2025-0${i + 1}-15`,
      actualDate: `2025-0${i + 1}-25`, wasTimely: false,
      iroName: "David Hughes", iroIndependent: false,
      participationMethod: "not_invited" as const, childViewsCaptured: false,
      parentInvited: false, parentAttended: false, carerAttended: false,
      socialWorkerAttended: false, otherProfessionals: [],
      outcome: "no_change" as const, carePlanUpdated: false,
      minutesDistributedWithin5Days: false,
    }));
    const r = generateLACReviewIntelligence(
      badReviews, [], [], ["child-bad"], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(r.overallScore).toBeLessThan(20);
    expect(r.rating).toBe("inadequate");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("handles reviews outside the period", () => {
    const outOfPeriod: LACReview = {
      ...demoReviews[0], id: "oop-1", actualDate: "2024-06-15", dueDate: "2024-06-15",
    };
    const r = generateLACReviewIntelligence(
      [outOfPeriod], [], [], ["child-alex"], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(r.timeliness.totalReviews).toBe(0);
    expect(r.overallScore).toBe(0);
  });
});

describe("Label functions", () => {
  it("returns correct review type labels", () => {
    expect(getReviewTypeLabel("initial")).toBe("Initial Review");
    expect(getReviewTypeLabel("second")).toBe("Second Review");
    expect(getReviewTypeLabel("subsequent")).toBe("Subsequent Review");
    expect(getReviewTypeLabel("emergency")).toBe("Emergency Review");
    expect(getReviewTypeLabel("disruption")).toBe("Disruption Review");
  });

  it("returns correct participation method labels", () => {
    expect(getParticipationMethodLabel("attended_in_person")).toBe("Attended in Person");
    expect(getParticipationMethodLabel("attended_virtually")).toBe("Attended Virtually");
    expect(getParticipationMethodLabel("written_views")).toBe("Written Views");
    expect(getParticipationMethodLabel("advocate_attended")).toBe("Advocate Attended");
    expect(getParticipationMethodLabel("refused_to_participate")).toBe("Refused to Participate");
    expect(getParticipationMethodLabel("not_invited")).toBe("Not Invited");
    expect(getParticipationMethodLabel("views_conveyed_by_worker")).toBe("Views Conveyed by Worker");
  });

  it("returns correct priority labels", () => {
    expect(getRecommendationPriorityLabel("urgent")).toBe("Urgent");
    expect(getRecommendationPriorityLabel("high")).toBe("High");
    expect(getRecommendationPriorityLabel("medium")).toBe("Medium");
    expect(getRecommendationPriorityLabel("low")).toBe("Low");
  });

  it("returns correct status labels", () => {
    expect(getRecommendationStatusLabel("completed")).toBe("Completed");
    expect(getRecommendationStatusLabel("in_progress")).toBe("In Progress");
    expect(getRecommendationStatusLabel("overdue")).toBe("Overdue");
    expect(getRecommendationStatusLabel("not_started")).toBe("Not Started");
    expect(getRecommendationStatusLabel("no_longer_applicable")).toBe("No Longer Applicable");
  });
});

describe("Scoring bands", () => {
  it("produces outstanding rating for excellent data", () => {
    const reviews: LACReview[] = CHILD_IDS.flatMap((childId) =>
      Array.from({ length: 2 }, (_, i) => ({
        id: `ex-${childId}-${i}`, homeId: HOME_ID, childId, childName: childId,
        reviewType: "subsequent" as const,
        dueDate: `2025-0${i * 3 + 1}-15`, actualDate: `2025-0${i * 3 + 1}-14`,
        wasTimely: true, iroName: "Jane Cooper", iroIndependent: true,
        participationMethod: "attended_in_person" as const, childViewsCaptured: true,
        childViewsSummary: "Views shared", parentInvited: true, parentAttended: true,
        carerAttended: true, socialWorkerAttended: true, otherProfessionals: ["School"],
        outcome: "care_plan_endorsed" as const, carePlanUpdated: true,
        minutesDistributedWithin5Days: true, nextReviewDate: "2025-09-15",
      })),
    );
    const recs: ReviewRecommendation[] = CHILD_IDS.map((childId) => ({
      id: `ex-rec-${childId}`, homeId: HOME_ID, reviewId: `ex-${childId}-0`,
      childId, childName: childId,
      recommendation: "Continue current approach", responsiblePerson: "Staff",
      priority: "medium" as const, dueDate: "2025-04-15", status: "completed" as const,
      completedDate: "2025-03-15",
    }));
    const iro: IROActivity[] = CHILD_IDS.map((childId) => ({
      id: `ex-iro-${childId}`, homeId: HOME_ID, childId, childName: childId,
      iroName: "Jane Cooper", activityDate: "2025-03-15",
      activityType: "mid_point_check" as const,
      notes: "Good check", childSpokenTo: true, issuesIdentified: [], actionsRequired: [],
    }));

    const r = generateLACReviewIntelligence(reviews, recs, iro, CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
    expect(r.rating).toBe("outstanding");
  });

  it("produces inadequate rating for poor data", () => {
    const badReviews: LACReview[] = [
      {
        id: "bad-1", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
        reviewType: "subsequent", dueDate: "2025-01-15", actualDate: "2025-02-15",
        wasTimely: false, iroName: "Unknown", iroIndependent: false,
        participationMethod: "not_invited", childViewsCaptured: false,
        parentInvited: false, parentAttended: false, carerAttended: false,
        socialWorkerAttended: false, otherProfessionals: [],
        outcome: "no_change", carePlanUpdated: false,
        minutesDistributedWithin5Days: false,
      },
    ];
    const badRecs: ReviewRecommendation[] = [
      {
        id: "bad-rec-1", homeId: HOME_ID, reviewId: "bad-1",
        childId: "child-alex", childName: "Alex",
        recommendation: "Critical action needed", responsiblePerson: "Unknown",
        priority: "urgent", dueDate: "2025-02-01", status: "overdue",
      },
    ];

    const r = generateLACReviewIntelligence(
      badReviews, badRecs, [], CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(r.overallScore).toBeLessThan(40);
    expect(r.rating).toBe("inadequate");
  });
});
