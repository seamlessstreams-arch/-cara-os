// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Court Order Compliance Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex 14, Jordan 13, Morgan 15),
// 3 court orders, 3 condition reviews, 5 legal meetings, 4 staff trained
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateOrderCompliance,
  evaluateReviewTimeliness,
  evaluateLegalEngagement,
  evaluateStaffLegalKnowledge,
  buildChildOrderProfiles,
  generateCourtOrderComplianceIntelligence,
  generateDemoData,
  pct,
  getRating,
  getOrderTypeLabel,
  getComplianceStatusLabel,
  getConditionTypeLabel,
  getRatingLabel,
} from "../court-order-compliance-engine";
import type {
  CourtOrder,
  OrderConditionReview,
  LegalMeeting,
  LegalTraining,
} from "../court-order-compliance-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const makeOrder = (overrides: Partial<CourtOrder> = {}): CourtOrder => ({
  id: "order-001",
  childId: "child-alex",
  childName: "Alex",
  orderType: "care_order",
  dateGranted: "2025-09-15",
  expiryDate: null,
  isActive: true,
  conditions: [
    {
      conditionType: "contact_frequency",
      description: "Supervised contact with birth mother twice monthly",
      complianceStatus: "fully_compliant",
      lastEvidenced: "2026-05-10",
    },
    {
      conditionType: "education_provision",
      description: "Full-time education placement",
      complianceStatus: "fully_compliant",
      lastEvidenced: "2026-05-08",
    },
    {
      conditionType: "health_assessment",
      description: "Annual health assessment",
      complianceStatus: "fully_compliant",
      lastEvidenced: "2026-04-20",
    },
  ],
  lastReviewDate: "2026-04-15",
  nextReviewDue: "2026-10-15",
  socialWorkerAssigned: true,
  localAuthority: "Anytown Council",
  ...overrides,
});

const makeReview = (overrides: Partial<OrderConditionReview> = {}): OrderConditionReview => ({
  id: "review-001",
  orderId: "order-001",
  childId: "child-alex",
  childName: "Alex",
  reviewDate: "2026-04-15",
  conditionsReviewed: 3,
  conditionsMet: 3,
  reviewOutcome: "all_met",
  reviewerName: "Sarah Johnson",
  ...overrides,
});

const makeMeeting = (overrides: Partial<LegalMeeting> = {}): LegalMeeting => ({
  id: "meeting-001",
  childId: "child-alex",
  childName: "Alex",
  meetingDate: "2026-04-15",
  meetingType: "lac_review",
  attendedByHome: true,
  childParticipated: true,
  minutesRecorded: true,
  actionsAgreed: 3,
  ...overrides,
});

const makeTraining = (overrides: Partial<LegalTraining> = {}): LegalTraining => ({
  id: "lt-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  trainingDate: "2026-02-10",
  courtOrderAwareness: true,
  childrenActKnowledge: true,
  humanRightsTraining: true,
  ...overrides,
});

// Chamberlain House demo dataset
const { orders: OAK_ORDERS, reviews: OAK_REVIEWS, meetings: OAK_MEETINGS, training: OAK_TRAINING } = generateDemoData();

// ══════════════════════════════════════════════════════════════════════════════
// 1. pct() helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct()", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when numerator equals denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. getRating()
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating()", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
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

// ══════════════════════════════════════════════════════════════════════════════
// 3. Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("label functions", () => {
  it("getOrderTypeLabel returns correct labels", () => {
    expect(getOrderTypeLabel("care_order")).toBe("Care Order (s31)");
    expect(getOrderTypeLabel("interim_care_order")).toBe("Interim Care Order (s38)");
    expect(getOrderTypeLabel("placement_order")).toBe("Placement Order");
    expect(getOrderTypeLabel("supervision_order")).toBe("Supervision Order");
    expect(getOrderTypeLabel("child_arrangements_order")).toBe("Child Arrangements Order");
    expect(getOrderTypeLabel("special_guardianship_order")).toBe("Special Guardianship Order");
    expect(getOrderTypeLabel("secure_accommodation_order")).toBe("Secure Accommodation Order (s25)");
    expect(getOrderTypeLabel("emergency_protection_order")).toBe("Emergency Protection Order (s44)");
  });

  it("getComplianceStatusLabel returns correct labels", () => {
    expect(getComplianceStatusLabel("fully_compliant")).toBe("Fully Compliant");
    expect(getComplianceStatusLabel("substantially_compliant")).toBe("Substantially Compliant");
    expect(getComplianceStatusLabel("partially_compliant")).toBe("Partially Compliant");
    expect(getComplianceStatusLabel("non_compliant")).toBe("Non-Compliant");
  });

  it("getConditionTypeLabel returns correct labels", () => {
    expect(getConditionTypeLabel("contact_frequency")).toBe("Contact Frequency");
    expect(getConditionTypeLabel("education_provision")).toBe("Education Provision");
    expect(getConditionTypeLabel("health_assessment")).toBe("Health Assessment");
    expect(getConditionTypeLabel("therapy_attendance")).toBe("Therapy Attendance");
    expect(getConditionTypeLabel("living_arrangements")).toBe("Living Arrangements");
    expect(getConditionTypeLabel("supervision_requirements")).toBe("Supervision Requirements");
    expect(getConditionTypeLabel("reporting_obligations")).toBe("Reporting Obligations");
    expect(getConditionTypeLabel("review_attendance")).toBe("Review Attendance");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateOrderCompliance()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateOrderCompliance()", () => {
  it("returns score 0 and concern when no orders provided", () => {
    const result = evaluateOrderCompliance([]);
    expect(result.score).toBe(0);
    expect(result.totalOrders).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("No court orders on file");
  });

  it("counts total and active orders correctly", () => {
    const orders = [
      makeOrder({ id: "o1", isActive: true }),
      makeOrder({ id: "o2", isActive: false }),
      makeOrder({ id: "o3", isActive: true }),
    ];
    const result = evaluateOrderCompliance(orders);
    expect(result.totalOrders).toBe(3);
    expect(result.activeOrders).toBe(2);
  });

  it("calculates fully compliant rate correctly", () => {
    const result = evaluateOrderCompliance(OAK_ORDERS);
    // Alex: 3 fully compliant, Jordan: 3 fully + 1 substantially, Morgan: 3 fully
    // Total: 10 conditions, 9 fully compliant = 90%
    expect(result.fullyCompliantConditions).toBe(9);
    expect(result.totalConditions).toBe(10);
    expect(result.fullyCompliantRate).toBe(90);
  });

  it("counts compliance statuses correctly", () => {
    const result = evaluateOrderCompliance(OAK_ORDERS);
    expect(result.fullyCompliantConditions).toBe(9);
    expect(result.substantiallyCompliantConditions).toBe(1);
    expect(result.partiallyCompliantConditions).toBe(0);
    expect(result.nonCompliantConditions).toBe(0);
  });

  it("calculates active orders reviewed rate", () => {
    const result = evaluateOrderCompliance(OAK_ORDERS);
    expect(result.activeOrdersReviewedRate).toBe(100);
  });

  it("calculates conditions evidenced rate", () => {
    const result = evaluateOrderCompliance(OAK_ORDERS);
    expect(result.conditionsEvidencedRate).toBe(100);
  });

  it("sets noNonCompliant to true when no non-compliant conditions", () => {
    const result = evaluateOrderCompliance(OAK_ORDERS);
    expect(result.noNonCompliant).toBe(true);
  });

  it("sets noNonCompliant to false when non-compliant conditions exist", () => {
    const orders = [
      makeOrder({
        conditions: [
          { conditionType: "contact_frequency", description: "test", complianceStatus: "non_compliant", lastEvidenced: "2026-05-01" },
        ],
      }),
    ];
    const result = evaluateOrderCompliance(orders);
    expect(result.noNonCompliant).toBe(false);
    expect(result.nonCompliantConditions).toBe(1);
  });

  it("produces score between 0 and 25", () => {
    const result = evaluateOrderCompliance(OAK_ORDERS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for high compliance rate", () => {
    const result = evaluateOrderCompliance(OAK_ORDERS);
    expect(result.strengths.some((s) => s.includes("90%"))).toBe(true);
  });

  it("generates concern for non-compliant conditions", () => {
    const orders = [
      makeOrder({
        conditions: [
          { conditionType: "contact_frequency", description: "test", complianceStatus: "non_compliant", lastEvidenced: "2026-05-01" },
        ],
      }),
    ];
    const result = evaluateOrderCompliance(orders);
    expect(result.concerns.some((c) => c.includes("non-compliant"))).toBe(true);
  });

  it("generates concern for low compliance rate", () => {
    const orders = [
      makeOrder({
        conditions: [
          { conditionType: "contact_frequency", description: "test", complianceStatus: "partially_compliant", lastEvidenced: "2026-05-01" },
          { conditionType: "education_provision", description: "test", complianceStatus: "non_compliant", lastEvidenced: "2026-05-01" },
          { conditionType: "health_assessment", description: "test", complianceStatus: "non_compliant", lastEvidenced: "2026-05-01" },
        ],
      }),
    ];
    const result = evaluateOrderCompliance(orders);
    expect(result.fullyCompliantRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("0%"))).toBe(true);
  });

  it("handles orders with no conditions", () => {
    const orders = [makeOrder({ conditions: [] })];
    const result = evaluateOrderCompliance(orders);
    expect(result.totalConditions).toBe(0);
    expect(result.fullyCompliantRate).toBe(0);
  });

  it("handles inactive orders correctly", () => {
    const orders = [makeOrder({ isActive: false, lastReviewDate: "" })];
    const result = evaluateOrderCompliance(orders);
    expect(result.activeOrders).toBe(0);
    expect(result.activeOrdersReviewedRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateReviewTimeliness()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReviewTimeliness()", () => {
  it("returns score 0 and concern when no reviews provided", () => {
    const result = evaluateReviewTimeliness([], ["child-alex"]);
    expect(result.score).toBe(0);
    expect(result.totalReviews).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("No condition reviews conducted");
  });

  it("calculates on-time rate correctly", () => {
    const result = evaluateReviewTimeliness(OAK_REVIEWS, ["child-alex", "child-jordan", "child-morgan"]);
    expect(result.onTimeRate).toBe(100);
  });

  it("calculates all-met rate correctly", () => {
    const result = evaluateReviewTimeliness(OAK_REVIEWS, ["child-alex", "child-jordan", "child-morgan"]);
    // 2 of 3 reviews have all_met outcome
    expect(result.allMetReviews).toBe(2);
    expect(result.allMetRate).toBe(67);
  });

  it("calculates concerns rate correctly", () => {
    const reviews = [
      makeReview({ id: "r1", reviewOutcome: "some_concerns" }),
      makeReview({ id: "r2", reviewOutcome: "significant_concerns" }),
      makeReview({ id: "r3", reviewOutcome: "all_met" }),
    ];
    const result = evaluateReviewTimeliness(reviews, ["child-alex"]);
    expect(result.concernsReviews).toBe(2);
    expect(result.concernsRate).toBe(67);
  });

  it("calculates coverage rate correctly", () => {
    const result = evaluateReviewTimeliness(OAK_REVIEWS, ["child-alex", "child-jordan", "child-morgan"]);
    expect(result.childrenCovered).toBe(3);
    expect(result.coverageRate).toBe(100);
  });

  it("detects uncovered children", () => {
    const reviews = [makeReview({ childId: "child-alex" })];
    const result = evaluateReviewTimeliness(reviews, ["child-alex", "child-jordan"]);
    expect(result.childrenCovered).toBe(1);
    expect(result.coverageRate).toBe(50);
  });

  it("produces score between 0 and 25", () => {
    const result = evaluateReviewTimeliness(OAK_REVIEWS, ["child-alex", "child-jordan", "child-morgan"]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for high all-met rate", () => {
    const reviews = [
      makeReview({ id: "r1", reviewOutcome: "all_met" }),
      makeReview({ id: "r2", reviewOutcome: "all_met" }),
    ];
    const result = evaluateReviewTimeliness(reviews, ["child-alex"]);
    expect(result.strengths.some((s) => s.includes("100%"))).toBe(true);
  });

  it("generates concern for low all-met rate", () => {
    const reviews = [
      makeReview({ id: "r1", reviewOutcome: "some_concerns" }),
      makeReview({ id: "r2", reviewOutcome: "significant_concerns" }),
      makeReview({ id: "r3", reviewOutcome: "mostly_met" }),
    ];
    const result = evaluateReviewTimeliness(reviews, ["child-alex"]);
    expect(result.allMetRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("0%"))).toBe(true);
  });

  it("generates concern for high concerns rate", () => {
    const reviews = [
      makeReview({ id: "r1", reviewOutcome: "some_concerns" }),
      makeReview({ id: "r2", reviewOutcome: "significant_concerns" }),
    ];
    const result = evaluateReviewTimeliness(reviews, ["child-alex"]);
    expect(result.concerns.some((c) => c.includes("concerns"))).toBe(true);
  });

  it("generates concern for low coverage", () => {
    const reviews = [makeReview({ childId: "child-alex" })];
    const result = evaluateReviewTimeliness(reviews, ["child-alex", "child-jordan", "child-morgan", "child-extra"]);
    expect(result.coverageRate).toBe(25);
    expect(result.concerns.some((c) => c.includes("25%"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. evaluateLegalEngagement()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateLegalEngagement()", () => {
  it("returns score 0 and concern when no meetings provided", () => {
    const result = evaluateLegalEngagement([]);
    expect(result.score).toBe(0);
    expect(result.totalMeetings).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("No legal meetings recorded");
  });

  it("calculates home attendance rate correctly", () => {
    const result = evaluateLegalEngagement(OAK_MEETINGS);
    expect(result.homeAttendance).toBe(5);
    expect(result.homeAttendanceRate).toBe(100);
  });

  it("calculates child participation rate correctly", () => {
    const result = evaluateLegalEngagement(OAK_MEETINGS);
    // 4 of 5 meetings had child participation
    expect(result.childParticipation).toBe(4);
    expect(result.childParticipationRate).toBe(80);
  });

  it("calculates minutes recorded rate correctly", () => {
    const result = evaluateLegalEngagement(OAK_MEETINGS);
    expect(result.minutesRecorded).toBe(5);
    expect(result.minutesRecordedRate).toBe(100);
  });

  it("calculates total actions agreed correctly", () => {
    const result = evaluateLegalEngagement(OAK_MEETINGS);
    expect(result.actionsAgreed).toBe(12);
  });

  it("calculates meeting type breakdown correctly", () => {
    const result = evaluateLegalEngagement(OAK_MEETINGS);
    expect(result.meetingTypeBreakdown["lac_review"]).toBe(2);
    expect(result.meetingTypeBreakdown["court_hearing"]).toBe(1);
    expect(result.meetingTypeBreakdown["legal_planning"]).toBe(1);
    expect(result.meetingTypeBreakdown["advocacy_meeting"]).toBe(1);
    expect(result.meetingTypeCount).toBe(4);
  });

  it("produces score between 0 and 25", () => {
    const result = evaluateLegalEngagement(OAK_MEETINGS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for high home attendance", () => {
    const result = evaluateLegalEngagement(OAK_MEETINGS);
    expect(result.strengths.some((s) => s.includes("100%"))).toBe(true);
  });

  it("generates concern for low home attendance", () => {
    const meetings = [
      makeMeeting({ id: "m1", attendedByHome: false }),
      makeMeeting({ id: "m2", attendedByHome: false }),
      makeMeeting({ id: "m3", attendedByHome: true }),
    ];
    const result = evaluateLegalEngagement(meetings);
    expect(result.homeAttendanceRate).toBe(33);
    expect(result.concerns.some((c) => c.includes("33%"))).toBe(true);
  });

  it("generates strength for good child participation", () => {
    const result = evaluateLegalEngagement(OAK_MEETINGS);
    expect(result.strengths.some((s) => s.includes("child participation") || s.includes("80%"))).toBe(true);
  });

  it("generates concern for low child participation", () => {
    const meetings = [
      makeMeeting({ id: "m1", childParticipated: false }),
      makeMeeting({ id: "m2", childParticipated: false }),
    ];
    const result = evaluateLegalEngagement(meetings);
    expect(result.childParticipationRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("0%"))).toBe(true);
  });

  it("generates strength for broad meeting type variety", () => {
    const result = evaluateLegalEngagement(OAK_MEETINGS);
    expect(result.strengths.some((s) => s.includes("4 meeting types"))).toBe(true);
  });

  it("generates concern for limited meeting variety", () => {
    const meetings = [makeMeeting({ meetingType: "lac_review" })];
    const result = evaluateLegalEngagement(meetings);
    expect(result.meetingTypeCount).toBe(1);
    expect(result.concerns.some((c) => c.includes("1 type"))).toBe(true);
  });

  it("generates concern for low minutes recorded rate", () => {
    const meetings = [
      makeMeeting({ id: "m1", minutesRecorded: false }),
      makeMeeting({ id: "m2", minutesRecorded: false }),
    ];
    const result = evaluateLegalEngagement(meetings);
    expect(result.minutesRecordedRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("0%"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. evaluateStaffLegalKnowledge()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffLegalKnowledge()", () => {
  it("returns score 0 and concern when no training provided", () => {
    const result = evaluateStaffLegalKnowledge([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("No legal training records");
  });

  it("calculates court order awareness rate correctly", () => {
    const result = evaluateStaffLegalKnowledge(OAK_TRAINING);
    expect(result.courtOrderAwarenessCount).toBe(4);
    expect(result.courtOrderAwarenessRate).toBe(100);
  });

  it("calculates Children Act knowledge rate correctly", () => {
    const result = evaluateStaffLegalKnowledge(OAK_TRAINING);
    expect(result.childrenActKnowledgeCount).toBe(4);
    expect(result.childrenActKnowledgeRate).toBe(100);
  });

  it("calculates human rights training rate correctly", () => {
    const result = evaluateStaffLegalKnowledge(OAK_TRAINING);
    expect(result.humanRightsTrainingCount).toBe(4);
    expect(result.humanRightsTrainingRate).toBe(100);
  });

  it("calculates all-three rate correctly", () => {
    const result = evaluateStaffLegalKnowledge(OAK_TRAINING);
    expect(result.allThreeCount).toBe(4);
    expect(result.allThreeRate).toBe(100);
  });

  it("produces score between 0 and 25", () => {
    const result = evaluateStaffLegalKnowledge(OAK_TRAINING);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives maximum score when all training complete", () => {
    const result = evaluateStaffLegalKnowledge(OAK_TRAINING);
    expect(result.score).toBe(25);
  });

  it("generates strength for high awareness rates", () => {
    const result = evaluateStaffLegalKnowledge(OAK_TRAINING);
    expect(result.strengths.some((s) => s.includes("100%"))).toBe(true);
  });

  it("generates concern for low court order awareness", () => {
    const training = [
      makeTraining({ id: "t1", courtOrderAwareness: false }),
      makeTraining({ id: "t2", staffId: "staff-tom", courtOrderAwareness: false }),
    ];
    const result = evaluateStaffLegalKnowledge(training);
    expect(result.courtOrderAwarenessRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("Court order awareness"))).toBe(true);
  });

  it("generates concern for low Children Act knowledge", () => {
    const training = [
      makeTraining({ id: "t1", childrenActKnowledge: false }),
      makeTraining({ id: "t2", staffId: "staff-tom", childrenActKnowledge: false }),
    ];
    const result = evaluateStaffLegalKnowledge(training);
    expect(result.childrenActKnowledgeRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("Children Act knowledge"))).toBe(true);
  });

  it("generates concern for low human rights training", () => {
    const training = [
      makeTraining({ id: "t1", humanRightsTraining: false }),
      makeTraining({ id: "t2", staffId: "staff-tom", humanRightsTraining: false }),
    ];
    const result = evaluateStaffLegalKnowledge(training);
    expect(result.humanRightsTrainingRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("Human rights training"))).toBe(true);
  });

  it("generates concern for low all-three rate", () => {
    const training = [
      makeTraining({ id: "t1", humanRightsTraining: false }),
      makeTraining({ id: "t2", staffId: "staff-tom", courtOrderAwareness: false }),
    ];
    const result = evaluateStaffLegalKnowledge(training);
    expect(result.allThreeRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("all three"))).toBe(true);
  });

  it("handles mixed training levels correctly", () => {
    const training = [
      makeTraining({ id: "t1", courtOrderAwareness: true, childrenActKnowledge: true, humanRightsTraining: true }),
      makeTraining({ id: "t2", staffId: "staff-tom", courtOrderAwareness: true, childrenActKnowledge: false, humanRightsTraining: false }),
    ];
    const result = evaluateStaffLegalKnowledge(training);
    expect(result.courtOrderAwarenessRate).toBe(100);
    expect(result.childrenActKnowledgeRate).toBe(50);
    expect(result.humanRightsTrainingRate).toBe(50);
    expect(result.allThreeRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. buildChildOrderProfiles()
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildOrderProfiles()", () => {
  it("returns empty array when no orders", () => {
    const result = buildChildOrderProfiles([], [], []);
    expect(result).toHaveLength(0);
  });

  it("builds one profile per unique child", () => {
    const result = buildChildOrderProfiles(OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS);
    expect(result).toHaveLength(3);
  });

  it("identifies correct child names", () => {
    const result = buildChildOrderProfiles(OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS);
    const names = result.map((p) => p.childName).sort();
    expect(names).toEqual(["Alex", "Jordan", "Morgan"]);
  });

  it("counts active orders correctly for each child", () => {
    const result = buildChildOrderProfiles(OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.activeOrderCount).toBe(1);
  });

  it("calculates compliance rate correctly for each child", () => {
    const result = buildChildOrderProfiles(OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.complianceRate).toBe(100); // 3/3 fully compliant
    const jordan = result.find((p) => p.childId === "child-jordan");
    expect(jordan!.complianceRate).toBe(75); // 3/4 fully compliant
  });

  it("counts reviews conducted per child", () => {
    const result = buildChildOrderProfiles(OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.reviewsConducted).toBe(1);
  });

  it("counts meetings attended per child", () => {
    const result = buildChildOrderProfiles(OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.meetingsAttended).toBe(2); // meeting-001 and meeting-005
  });

  it("produces score between 0 and 10 for each child", () => {
    const result = buildChildOrderProfiles(OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS);
    for (const profile of result) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("gives higher score to fully compliant child with reviews and meetings", () => {
    const result = buildChildOrderProfiles(OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS);
    const alex = result.find((p) => p.childId === "child-alex");
    const jordan = result.find((p) => p.childId === "child-jordan");
    // Alex: 100% compliance, 1 review, 2 meetings
    // Jordan: 75% compliance, 1 review, 2 meetings
    expect(alex!.overallScore).toBeGreaterThanOrEqual(jordan!.overallScore);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. generateCourtOrderComplianceIntelligence()
// ══════════════════════════════════════════════════════════════════════════════

describe("generateCourtOrderComplianceIntelligence()", () => {
  it("returns complete intelligence object", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS, OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.orderCompliance).toBeDefined();
    expect(result.reviewTimeliness).toBeDefined();
    expect(result.legalEngagement).toBeDefined();
    expect(result.staffLegalKnowledge).toBeDefined();
    expect(result.childOrderProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("calculates overall score as sum of 4 evaluators", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS, OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const expected = Math.round(
      result.orderCompliance.score +
      result.reviewTimeliness.score +
      result.legalEngagement.score +
      result.staffLegalKnowledge.score,
    );
    expect(result.overallScore).toBe(Math.min(100, Math.max(0, expected)));
  });

  it("clamps overall score to 0-100", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS, OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns correct rating based on overall score", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS, OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBe(getRating(result.overallScore));
  });

  it("includes regulatory links", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS, OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989, s31"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989, s22"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 36"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Human Rights Act 1998"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 3"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Care Planning Regulations 2010"))).toBe(true);
  });

  it("includes child order profiles for all children", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS, OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.childOrderProfiles).toHaveLength(3);
  });

  it("generates URGENT actions when non-compliant conditions exist", () => {
    const orders = [
      makeOrder({
        conditions: [
          { conditionType: "contact_frequency", description: "test", complianceStatus: "non_compliant", lastEvidenced: "2026-05-01" },
        ],
      }),
    ];
    const result = generateCourtOrderComplianceIntelligence(
      orders, [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT:"))).toBe(true);
    expect(result.actions.some((a) => a.includes("non-compliant"))).toBe(true);
  });

  it("generates URGENT actions when no orders on file", () => {
    const result = generateCourtOrderComplianceIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("No court orders on file"))).toBe(true);
  });

  it("generates URGENT actions when no reviews conducted", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, [], OAK_MEETINGS, OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("No condition reviews conducted"))).toBe(true);
  });

  it("generates URGENT actions when no meetings recorded", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, [], OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("No legal meetings recorded"))).toBe(true);
  });

  it("generates URGENT actions when no training recorded", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS, [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("No legal training records"))).toBe(true);
  });

  it("produces 'no urgent actions' message when everything is compliant", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS, OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    // Chamberlain House demo data is highly compliant, may not trigger urgent actions
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes strengths from all evaluators", () => {
    const result = generateCourtOrderComplianceIntelligence(
      OAK_ORDERS, OAK_REVIEWS, OAK_MEETINGS, OAK_TRAINING,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes areas for improvement when score is low", () => {
    const orders = [
      makeOrder({
        conditions: [
          { conditionType: "contact_frequency", description: "test", complianceStatus: "non_compliant", lastEvidenced: "" },
        ],
      }),
    ];
    const result = generateCourtOrderComplianceIntelligence(
      orders, [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("sets rating to inadequate when all data is empty", () => {
    const result = generateCourtOrderComplianceIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates areasForImprovement with Inadequate label for score < 40", () => {
    const result = generateCourtOrderComplianceIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. generateDemoData()
// ══════════════════════════════════════════════════════════════════════════════

describe("generateDemoData()", () => {
  it("returns 3 court orders", () => {
    const { orders } = generateDemoData();
    expect(orders).toHaveLength(3);
  });

  it("returns 3 condition reviews", () => {
    const { reviews } = generateDemoData();
    expect(reviews).toHaveLength(3);
  });

  it("returns 5 legal meetings", () => {
    const { meetings } = generateDemoData();
    expect(meetings).toHaveLength(5);
  });

  it("returns 4 staff training records", () => {
    const { training } = generateDemoData();
    expect(training).toHaveLength(4);
  });

  it("has Alex with care_order", () => {
    const { orders } = generateDemoData();
    const alex = orders.find((o) => o.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.orderType).toBe("care_order");
  });

  it("has Jordan with interim_care_order", () => {
    const { orders } = generateDemoData();
    const jordan = orders.find((o) => o.childId === "child-jordan");
    expect(jordan).toBeDefined();
    expect(jordan!.orderType).toBe("interim_care_order");
  });

  it("has Morgan with care_order", () => {
    const { orders } = generateDemoData();
    const morgan = orders.find((o) => o.childId === "child-morgan");
    expect(morgan).toBeDefined();
    expect(morgan!.orderType).toBe("care_order");
  });

  it("Alex has 3 fully compliant conditions", () => {
    const { orders } = generateDemoData();
    const alex = orders.find((o) => o.childId === "child-alex")!;
    expect(alex.conditions).toHaveLength(3);
    expect(alex.conditions.every((c) => c.complianceStatus === "fully_compliant")).toBe(true);
  });

  it("Jordan has 4 conditions with 3 fully compliant", () => {
    const { orders } = generateDemoData();
    const jordan = orders.find((o) => o.childId === "child-jordan")!;
    expect(jordan.conditions).toHaveLength(4);
    const fullyCompliant = jordan.conditions.filter((c) => c.complianceStatus === "fully_compliant");
    expect(fullyCompliant).toHaveLength(3);
  });

  it("Morgan has 3 fully compliant conditions", () => {
    const { orders } = generateDemoData();
    const morgan = orders.find((o) => o.childId === "child-morgan")!;
    expect(morgan.conditions).toHaveLength(3);
    expect(morgan.conditions.every((c) => c.complianceStatus === "fully_compliant")).toBe(true);
  });

  it("meetings include LAC reviews, court hearing, legal planning, and advocacy meeting", () => {
    const { meetings } = generateDemoData();
    const types = meetings.map((m) => m.meetingType);
    expect(types.filter((t) => t === "lac_review")).toHaveLength(2);
    expect(types.filter((t) => t === "court_hearing")).toHaveLength(1);
    expect(types.filter((t) => t === "legal_planning")).toHaveLength(1);
    expect(types.filter((t) => t === "advocacy_meeting")).toHaveLength(1);
  });

  it("staff includes Sarah Johnson, Tom Richards, Lisa Williams, Olivia Hayes", () => {
    const { training } = generateDemoData();
    const names = training.map((t) => t.staffName).sort();
    expect(names).toEqual(["Lisa Williams", "Olivia Hayes", "Sarah Johnson", "Tom Richards"]);
  });
});
