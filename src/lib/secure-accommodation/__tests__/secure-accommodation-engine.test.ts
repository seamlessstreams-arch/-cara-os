// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Secure Accommodation Intelligence — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateOrderCompliance,
  evaluateWelfareReviewQuality,
  evaluateChildWelfare,
  evaluateDischargePreparedness,
  buildChildSecureProfiles,
  generateSecureAccommodationIntelligence,
  getRating,
  getSecureOrderStatusLabel,
  getWelfareReviewStatusLabel,
  getReviewParticipantLabel,
  getRestrictionJustificationLabel,
  getProgressOutcomeLabel,
  getDischargeReadinessLabel,
} from "../secure-accommodation-engine";
import type {
  SecureAccommodationOrder,
  WelfareReview,
  ChildWelfare,
  DischargeAssessment,
  SecureOrderStatus,
  WelfareReviewStatus,
  ReviewParticipant,
  RestrictionJustification,
  ProgressOutcome,
  DischargeReadiness,
} from "../secure-accommodation-engine";

// ── Constants ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

// ── Factories ────────────────────────────────────────────────────────────────

function makeOrder(
  overrides: Partial<SecureAccommodationOrder> = {},
): SecureAccommodationOrder {
  return {
    id: "ord-001",
    childId: "child-morgan",
    childName: "Morgan",
    orderStatus: "active",
    orderDate: "2026-01-15",
    expiryDate: "2026-04-15",
    courtName: "Family Court — Manchester",
    justification: ["risk_to_self"],
    maximumPeriodDays: 91,
    localAuthorityApplicant: "Greater Manchester LA",
    s25CriteriaDocumented: true,
    leastRestrictiveConsidered: true,
    ...overrides,
  };
}

function makeReview(overrides: Partial<WelfareReview> = {}): WelfareReview {
  return {
    id: "rev-001",
    childId: "child-morgan",
    orderId: "ord-001",
    reviewDate: "2026-02-15",
    status: "completed_on_time",
    reviewedBy: "Darren Laville",
    participants: ["child", "social_worker", "iro", "advocate"],
    childViewsRecorded: true,
    childAttended: true,
    progressOutcome: "positive_progress",
    recommendationsMade: 3,
    recommendationsActioned: 3,
    continueSecureRecommended: true,
    alternativesConsidered: true,
    nextReviewDue: "2026-03-15",
    ...overrides,
  };
}

function makeWelfare(overrides: Partial<ChildWelfare> = {}): ChildWelfare {
  return {
    id: "wel-001",
    childId: "child-morgan",
    educationProvided: true,
    educationHoursPerWeek: 25,
    therapeuticSupportInPlace: true,
    therapySessions: 8,
    familyContactMaintained: true,
    contactFrequency: "weekly",
    healthNeedsMet: true,
    physicalActivityAccess: true,
    outsideTimeMinutesPerDay: 90,
    personalBelongingsAccessible: true,
    privacyRespected: true,
    culturalNeedsMet: true,
    complaintsMechanismAvailable: true,
    ...overrides,
  };
}

function makeDischargeAssessment(
  overrides: Partial<DischargeAssessment> = {},
): DischargeAssessment {
  return {
    id: "dis-001",
    childId: "child-morgan",
    orderId: "ord-001",
    assessmentDate: "2026-04-01",
    assessedBy: "Sarah Johnson",
    readiness: "nearly_ready",
    transitionPlanInPlace: true,
    receivingPlacementIdentified: true,
    supportNetworkMapped: true,
    riskManagementPlanUpdated: true,
    childViewsOnDischarge: true,
    ...overrides,
  };
}

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────

// Morgan (15) — active s25 order (risk to self), 2 welfare reviews
// Alex (14) — no orders
// Jordan (13) — no orders

const DEMO_ORDERS: SecureAccommodationOrder[] = [
  makeOrder({
    id: "ord-morgan-01",
    childId: "child-morgan",
    childName: "Morgan",
    orderStatus: "active",
    orderDate: "2026-01-15",
    expiryDate: "2026-04-15",
    courtName: "Family Court — Manchester",
    justification: ["risk_to_self"],
    maximumPeriodDays: 91,
    localAuthorityApplicant: "Greater Manchester LA",
    s25CriteriaDocumented: true,
    leastRestrictiveConsidered: true,
  }),
];

const DEMO_REVIEWS: WelfareReview[] = [
  makeReview({
    id: "rev-morgan-01",
    childId: "child-morgan",
    orderId: "ord-morgan-01",
    reviewDate: "2026-02-15",
    status: "completed_on_time",
    reviewedBy: "Darren Laville",
    participants: ["child", "parent", "social_worker", "iro", "advocate"],
    childViewsRecorded: true,
    childAttended: true,
    progressOutcome: "positive_progress",
    recommendationsMade: 4,
    recommendationsActioned: 3,
    continueSecureRecommended: true,
    alternativesConsidered: true,
    nextReviewDue: "2026-03-15",
  }),
  makeReview({
    id: "rev-morgan-02",
    childId: "child-morgan",
    orderId: "ord-morgan-01",
    reviewDate: "2026-03-15",
    status: "completed_on_time",
    reviewedBy: "Darren Laville",
    participants: ["child", "parent", "social_worker", "iro", "advocate", "legal_representative"],
    childViewsRecorded: true,
    childAttended: true,
    progressOutcome: "positive_progress",
    recommendationsMade: 3,
    recommendationsActioned: 3,
    continueSecureRecommended: false,
    alternativesConsidered: true,
    nextReviewDue: "2026-04-15",
  }),
];

const DEMO_WELFARE: ChildWelfare[] = [
  makeWelfare({
    id: "wel-morgan",
    childId: "child-morgan",
    educationProvided: true,
    educationHoursPerWeek: 25,
    therapeuticSupportInPlace: true,
    therapySessions: 12,
    familyContactMaintained: true,
    contactFrequency: "weekly",
    healthNeedsMet: true,
    physicalActivityAccess: true,
    outsideTimeMinutesPerDay: 90,
    personalBelongingsAccessible: true,
    privacyRespected: true,
    culturalNeedsMet: true,
    complaintsMechanismAvailable: true,
  }),
];

const DEMO_DISCHARGE: DischargeAssessment[] = [
  makeDischargeAssessment({
    id: "dis-morgan-01",
    childId: "child-morgan",
    orderId: "ord-morgan-01",
    assessmentDate: "2026-04-01",
    assessedBy: "Sarah Johnson",
    readiness: "nearly_ready",
    transitionPlanInPlace: true,
    receivingPlacementIdentified: true,
    supportNetworkMapped: true,
    riskManagementPlanUpdated: true,
    childViewsOnDischarge: true,
  }),
];

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Secure Accommodation Intelligence Engine", () => {
  // ── Label Functions ──────────────────────────────────────────────────────

  describe("getSecureOrderStatusLabel", () => {
    it("returns correct label for active", () => {
      expect(getSecureOrderStatusLabel("active")).toBe("Active");
    });

    it("returns correct label for expired", () => {
      expect(getSecureOrderStatusLabel("expired")).toBe("Expired");
    });

    it("returns correct label for pending", () => {
      expect(getSecureOrderStatusLabel("pending")).toBe("Pending");
    });

    it("returns correct label for refused", () => {
      expect(getSecureOrderStatusLabel("refused")).toBe("Refused");
    });

    it("returns correct label for not_required", () => {
      expect(getSecureOrderStatusLabel("not_required")).toBe("Not Required");
    });

    it("returns correct label for revoked", () => {
      expect(getSecureOrderStatusLabel("revoked")).toBe("Revoked");
    });

    it("returns correct label for all statuses", () => {
      const statuses: SecureOrderStatus[] = [
        "active", "expired", "pending", "refused", "not_required", "revoked",
      ];
      for (const s of statuses) {
        expect(getSecureOrderStatusLabel(s)).toBeTruthy();
      }
    });
  });

  describe("getWelfareReviewStatusLabel", () => {
    it("returns correct label for completed_on_time", () => {
      expect(getWelfareReviewStatusLabel("completed_on_time")).toBe("Completed on Time");
    });

    it("returns correct label for completed_late", () => {
      expect(getWelfareReviewStatusLabel("completed_late")).toBe("Completed Late");
    });

    it("returns correct label for overdue", () => {
      expect(getWelfareReviewStatusLabel("overdue")).toBe("Overdue");
    });

    it("returns correct label for not_due", () => {
      expect(getWelfareReviewStatusLabel("not_due")).toBe("Not Due");
    });

    it("returns correct label for all statuses", () => {
      const statuses: WelfareReviewStatus[] = [
        "completed_on_time", "completed_late", "overdue", "not_due",
      ];
      for (const s of statuses) {
        expect(getWelfareReviewStatusLabel(s)).toBeTruthy();
      }
    });
  });

  describe("getReviewParticipantLabel", () => {
    it("returns correct label for child", () => {
      expect(getReviewParticipantLabel("child")).toBe("Child");
    });

    it("returns correct label for iro", () => {
      expect(getReviewParticipantLabel("iro")).toBe("Independent Reviewing Officer");
    });

    it("returns correct label for legal_representative", () => {
      expect(getReviewParticipantLabel("legal_representative")).toBe("Legal Representative");
    });

    it("returns correct label for all participants", () => {
      const participants: ReviewParticipant[] = [
        "child", "parent", "social_worker", "iro", "advocate",
        "legal_representative", "guardian",
      ];
      for (const p of participants) {
        expect(getReviewParticipantLabel(p)).toBeTruthy();
      }
    });
  });

  describe("getRestrictionJustificationLabel", () => {
    it("returns correct label for risk_to_self", () => {
      expect(getRestrictionJustificationLabel("risk_to_self")).toBe("Risk to Self");
    });

    it("returns correct label for exploitation_risk", () => {
      expect(getRestrictionJustificationLabel("exploitation_risk")).toBe("Exploitation Risk");
    });

    it("returns correct label for absconding_risk", () => {
      expect(getRestrictionJustificationLabel("absconding_risk")).toBe("Absconding Risk");
    });

    it("returns correct label for all justifications", () => {
      const justifications: RestrictionJustification[] = [
        "risk_to_self", "risk_to_others", "absconding_risk",
        "criminal_activity", "exploitation_risk",
      ];
      for (const j of justifications) {
        expect(getRestrictionJustificationLabel(j)).toBeTruthy();
      }
    });
  });

  describe("getProgressOutcomeLabel", () => {
    it("returns correct label for positive_progress", () => {
      expect(getProgressOutcomeLabel("positive_progress")).toBe("Positive Progress");
    });

    it("returns correct label for deteriorating", () => {
      expect(getProgressOutcomeLabel("deteriorating")).toBe("Deteriorating");
    });

    it("returns correct label for all outcomes", () => {
      const outcomes: ProgressOutcome[] = [
        "positive_progress", "stable", "deteriorating", "insufficient_evidence",
      ];
      for (const o of outcomes) {
        expect(getProgressOutcomeLabel(o)).toBeTruthy();
      }
    });
  });

  describe("getDischargeReadinessLabel", () => {
    it("returns correct label for ready", () => {
      expect(getDischargeReadinessLabel("ready")).toBe("Ready");
    });

    it("returns correct label for nearly_ready", () => {
      expect(getDischargeReadinessLabel("nearly_ready")).toBe("Nearly Ready");
    });

    it("returns correct label for not_ready", () => {
      expect(getDischargeReadinessLabel("not_ready")).toBe("Not Ready");
    });

    it("returns correct label for requires_assessment", () => {
      expect(getDischargeReadinessLabel("requires_assessment")).toBe("Requires Assessment");
    });

    it("returns correct label for all readiness statuses", () => {
      const statuses: DischargeReadiness[] = [
        "ready", "nearly_ready", "not_ready", "requires_assessment",
      ];
      for (const r of statuses) {
        expect(getDischargeReadinessLabel(r)).toBeTruthy();
      }
    });
  });

  // ── getRating ────────────────────────────────────────────────────────────

  describe("getRating", () => {
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
      expect(getRating(0)).toBe("inadequate");
      expect(getRating(39)).toBe("inadequate");
    });
  });

  // ── evaluateOrderCompliance ──────────────────────────────────────────────

  describe("evaluateOrderCompliance", () => {
    it("returns max score 30 for empty orders (no restrictions needed)", () => {
      const result = evaluateOrderCompliance([]);
      expect(result.overallScore).toBe(30);
      expect(result.totalOrders).toBe(0);
      expect(result.activeOrders).toBe(0);
      expect(result.s25CriteriaRate).toBe(100);
      expect(result.leastRestrictiveRate).toBe(100);
      expect(result.expiredWithoutRenewal).toBe(0);
      expect(result.justificationsDocumentedRate).toBe(100);
      expect(result.refusedOrders).toBe(0);
    });

    it("returns max score 30 for fully compliant single order", () => {
      const result = evaluateOrderCompliance([makeOrder()]);
      expect(result.overallScore).toBe(30);
    });

    it("awards +10 when all orders have s25 criteria documented", () => {
      const orders = [
        makeOrder({ id: "o1", s25CriteriaDocumented: true }),
        makeOrder({ id: "o2", s25CriteriaDocumented: true }),
      ];
      const result = evaluateOrderCompliance(orders);
      expect(result.s25CriteriaRate).toBe(100);
    });

    it("does not award s25 points when not all documented", () => {
      const orders = [
        makeOrder({ id: "o1", s25CriteriaDocumented: true }),
        makeOrder({ id: "o2", s25CriteriaDocumented: false }),
      ];
      const result = evaluateOrderCompliance(orders);
      expect(result.s25CriteriaRate).toBe(50);
      // Score should be less than max since s25 criteria not fully documented
      expect(result.overallScore).toBeLessThan(30);
    });

    it("awards +8 when all orders have least restrictive considered", () => {
      const orders = [
        makeOrder({ id: "o1", leastRestrictiveConsidered: true }),
        makeOrder({ id: "o2", leastRestrictiveConsidered: true }),
      ];
      const result = evaluateOrderCompliance(orders);
      expect(result.leastRestrictiveRate).toBe(100);
    });

    it("reduces score when least restrictive not all considered", () => {
      const order = makeOrder({ leastRestrictiveConsidered: false });
      const result = evaluateOrderCompliance([order]);
      expect(result.leastRestrictiveRate).toBe(0);
      expect(result.overallScore).toBeLessThan(30);
    });

    it("awards +5 when no expired orders", () => {
      const orders = [makeOrder({ orderStatus: "active" })];
      const result = evaluateOrderCompliance(orders);
      expect(result.expiredWithoutRenewal).toBe(0);
    });

    it("penalises expired orders", () => {
      const orders = [makeOrder({ orderStatus: "expired" })];
      const result = evaluateOrderCompliance(orders);
      expect(result.expiredWithoutRenewal).toBe(1);
      expect(result.overallScore).toBeLessThan(30);
    });

    it("awards +4 when all justifications documented", () => {
      const orders = [
        makeOrder({ id: "o1", justification: ["risk_to_self"] }),
        makeOrder({ id: "o2", justification: ["risk_to_others", "absconding_risk"] }),
      ];
      const result = evaluateOrderCompliance(orders);
      expect(result.justificationsDocumentedRate).toBe(100);
    });

    it("penalises missing justifications", () => {
      const orders = [makeOrder({ justification: [] })];
      const result = evaluateOrderCompliance(orders);
      expect(result.justificationsDocumentedRate).toBe(0);
      expect(result.overallScore).toBeLessThan(30);
    });

    it("awards +3 when no refused orders", () => {
      const orders = [makeOrder({ orderStatus: "active" })];
      const result = evaluateOrderCompliance(orders);
      expect(result.refusedOrders).toBe(0);
    });

    it("penalises refused orders", () => {
      const orders = [makeOrder({ orderStatus: "refused" })];
      const result = evaluateOrderCompliance(orders);
      expect(result.refusedOrders).toBe(1);
      expect(result.overallScore).toBeLessThan(30);
    });

    it("counts active orders correctly", () => {
      const orders = [
        makeOrder({ id: "o1", orderStatus: "active" }),
        makeOrder({ id: "o2", orderStatus: "expired" }),
        makeOrder({ id: "o3", orderStatus: "active" }),
      ];
      const result = evaluateOrderCompliance(orders);
      expect(result.totalOrders).toBe(3);
      expect(result.activeOrders).toBe(2);
    });

    it("clamps score to 30 maximum", () => {
      const result = evaluateOrderCompliance([makeOrder()]);
      expect(result.overallScore).toBeLessThanOrEqual(30);
    });

    it("handles multiple issues lowering score", () => {
      const orders = [
        makeOrder({
          id: "o1",
          orderStatus: "expired",
          s25CriteriaDocumented: false,
          leastRestrictiveConsidered: false,
          justification: [],
        }),
        makeOrder({
          id: "o2",
          orderStatus: "refused",
          s25CriteriaDocumented: false,
          leastRestrictiveConsidered: false,
          justification: [],
        }),
      ];
      const result = evaluateOrderCompliance(orders);
      expect(result.overallScore).toBe(0);
      expect(result.s25CriteriaRate).toBe(0);
      expect(result.leastRestrictiveRate).toBe(0);
      expect(result.justificationsDocumentedRate).toBe(0);
      expect(result.expiredWithoutRenewal).toBe(1);
      expect(result.refusedOrders).toBe(1);
    });

    it("handles pending orders correctly", () => {
      const orders = [makeOrder({ orderStatus: "pending" })];
      const result = evaluateOrderCompliance(orders);
      expect(result.activeOrders).toBe(0);
      expect(result.totalOrders).toBe(1);
    });

    it("handles revoked orders", () => {
      const orders = [makeOrder({ orderStatus: "revoked" })];
      const result = evaluateOrderCompliance(orders);
      expect(result.activeOrders).toBe(0);
    });

    it("handles not_required orders", () => {
      const orders = [makeOrder({ orderStatus: "not_required" })];
      const result = evaluateOrderCompliance(orders);
      expect(result.activeOrders).toBe(0);
    });
  });

  // ── evaluateWelfareReviewQuality ─────────────────────────────────────────

  describe("evaluateWelfareReviewQuality", () => {
    it("returns max score 25 for empty reviews", () => {
      const result = evaluateWelfareReviewQuality([]);
      expect(result.overallScore).toBe(25);
      expect(result.totalReviews).toBe(0);
      expect(result.timelinessRate).toBe(100);
      expect(result.childViewsRate).toBe(100);
      expect(result.childAttendanceRate).toBe(100);
      expect(result.alternativesConsideredRate).toBe(100);
      expect(result.recommendationsActionedRate).toBe(100);
      expect(result.averageParticipantTypes).toBe(0);
    });

    it("returns max score 25 for perfect reviews", () => {
      const reviews = [makeReview()];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.overallScore).toBe(25);
    });

    it("awards +6 when timeliness rate >= 90%", () => {
      const reviews = [
        makeReview({ id: "r1", status: "completed_on_time" }),
        makeReview({ id: "r2", status: "completed_on_time" }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.timelinessRate).toBe(100);
    });

    it("reduces score for late reviews", () => {
      const reviews = [
        makeReview({ id: "r1", status: "completed_late" }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.timelinessRate).toBe(0);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("counts not_due as timely", () => {
      const reviews = [
        makeReview({ id: "r1", status: "not_due" }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.timelinessRate).toBe(100);
    });

    it("awards +4 when child views rate >= 90%", () => {
      const reviews = [
        makeReview({ id: "r1", childViewsRecorded: true }),
        makeReview({ id: "r2", childViewsRecorded: true }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.childViewsRate).toBe(100);
    });

    it("reduces score when child views not recorded", () => {
      const reviews = [
        makeReview({ id: "r1", childViewsRecorded: false }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.childViewsRate).toBe(0);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("awards +4 when child attendance >= 80%", () => {
      const reviews = [
        makeReview({ id: "r1", childAttended: true }),
        makeReview({ id: "r2", childAttended: true }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.childAttendanceRate).toBe(100);
    });

    it("reduces score for low attendance", () => {
      const reviews = [
        makeReview({ id: "r1", childAttended: false }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.childAttendanceRate).toBe(0);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("awards +4 when alternatives considered rate >= 90%", () => {
      const reviews = [
        makeReview({ id: "r1", alternativesConsidered: true }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.alternativesConsideredRate).toBe(100);
    });

    it("reduces score when alternatives not considered", () => {
      const reviews = [
        makeReview({ id: "r1", alternativesConsidered: false }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.alternativesConsideredRate).toBe(0);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("awards +4 when recommendations actioned rate >= 80%", () => {
      const reviews = [
        makeReview({ id: "r1", recommendationsMade: 5, recommendationsActioned: 4 }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.recommendationsActionedRate).toBe(80);
    });

    it("reduces score for low recommendations actioned rate", () => {
      const reviews = [
        makeReview({ id: "r1", recommendationsMade: 10, recommendationsActioned: 2 }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.recommendationsActionedRate).toBe(20);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("handles zero recommendations made", () => {
      const reviews = [
        makeReview({ id: "r1", recommendationsMade: 0, recommendationsActioned: 0 }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.recommendationsActionedRate).toBe(0);
    });

    it("awards +3 when average participant types >= 4", () => {
      const reviews = [
        makeReview({
          id: "r1",
          participants: ["child", "parent", "social_worker", "iro"],
        }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.averageParticipantTypes).toBe(4);
    });

    it("reduces score for low participant variety", () => {
      const reviews = [
        makeReview({
          id: "r1",
          participants: ["child", "social_worker"],
        }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.averageParticipantTypes).toBe(2);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("clamps score to 25 maximum", () => {
      const result = evaluateWelfareReviewQuality([makeReview()]);
      expect(result.overallScore).toBeLessThanOrEqual(25);
    });

    it("handles overdue reviews", () => {
      const reviews = [
        makeReview({ id: "r1", status: "overdue" }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.timelinessRate).toBe(0);
    });

    it("calculates participant types correctly with duplicates in participants", () => {
      const reviews = [
        makeReview({
          id: "r1",
          participants: ["child", "child", "social_worker", "iro", "advocate"],
        }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      // Set removes duplicates, so 4 unique types
      expect(result.averageParticipantTypes).toBe(4);
    });

    it("handles all poor quality reviews", () => {
      const reviews = [
        makeReview({
          id: "r1",
          status: "overdue",
          childViewsRecorded: false,
          childAttended: false,
          alternativesConsidered: false,
          recommendationsMade: 5,
          recommendationsActioned: 0,
          participants: ["social_worker"],
        }),
      ];
      const result = evaluateWelfareReviewQuality(reviews);
      expect(result.overallScore).toBe(0);
    });
  });

  // ── evaluateChildWelfare ─────────────────────────────────────────────────

  describe("evaluateChildWelfare", () => {
    it("returns max score 25 for empty welfare data", () => {
      const result = evaluateChildWelfare([]);
      expect(result.overallScore).toBe(25);
      expect(result.totalChildren).toBe(0);
      expect(result.educationRate).toBe(100);
    });

    it("returns max score 25 for fully met welfare needs", () => {
      const result = evaluateChildWelfare([makeWelfare()]);
      expect(result.overallScore).toBe(25);
    });

    it("awards +4 for 100% education rate", () => {
      const welfare = [
        makeWelfare({ id: "w1", educationProvided: true }),
        makeWelfare({ id: "w2", childId: "child-alex", educationProvided: true }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.educationRate).toBe(100);
    });

    it("reduces score when education not provided to all", () => {
      const welfare = [
        makeWelfare({ id: "w1", educationProvided: true }),
        makeWelfare({ id: "w2", childId: "child-alex", educationProvided: false }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.educationRate).toBe(50);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("awards +3 for education hours >= 15/week for all", () => {
      const welfare = [
        makeWelfare({ id: "w1", educationHoursPerWeek: 25 }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.educationHoursAdequateRate).toBe(100);
    });

    it("reduces score for inadequate education hours", () => {
      const welfare = [
        makeWelfare({ id: "w1", educationHoursPerWeek: 10 }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.educationHoursAdequateRate).toBe(0);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("awards +4 for 100% therapeutic support", () => {
      const welfare = [
        makeWelfare({ id: "w1", therapeuticSupportInPlace: true }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.therapeuticSupportRate).toBe(100);
    });

    it("reduces score when therapeutic support missing", () => {
      const welfare = [
        makeWelfare({ id: "w1", therapeuticSupportInPlace: false }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.therapeuticSupportRate).toBe(0);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("awards +3 for 100% family contact", () => {
      const welfare = [
        makeWelfare({ id: "w1", familyContactMaintained: true }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.familyContactRate).toBe(100);
    });

    it("reduces score when family contact not maintained", () => {
      const welfare = [
        makeWelfare({ id: "w1", familyContactMaintained: false }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.familyContactRate).toBe(0);
    });

    it("awards +3 for 100% health needs met", () => {
      const welfare = [
        makeWelfare({ id: "w1", healthNeedsMet: true }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.healthNeedsRate).toBe(100);
    });

    it("reduces score when health needs not met", () => {
      const welfare = [
        makeWelfare({ id: "w1", healthNeedsMet: false }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.healthNeedsRate).toBe(0);
    });

    it("awards +3 for outside time >= 60 minutes for all", () => {
      const welfare = [
        makeWelfare({ id: "w1", outsideTimeMinutesPerDay: 60 }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.outsideTimeAdequateRate).toBe(100);
    });

    it("reduces score for insufficient outside time", () => {
      const welfare = [
        makeWelfare({ id: "w1", outsideTimeMinutesPerDay: 30 }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.outsideTimeAdequateRate).toBe(0);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("awards +3 for 100% privacy respected", () => {
      const welfare = [
        makeWelfare({ id: "w1", privacyRespected: true }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.privacyRate).toBe(100);
    });

    it("reduces score when privacy not respected", () => {
      const welfare = [
        makeWelfare({ id: "w1", privacyRespected: false }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.privacyRate).toBe(0);
    });

    it("awards +2 for 100% complaints available", () => {
      const welfare = [
        makeWelfare({ id: "w1", complaintsMechanismAvailable: true }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.complaintsAvailableRate).toBe(100);
    });

    it("reduces score when complaints mechanism not available", () => {
      const welfare = [
        makeWelfare({ id: "w1", complaintsMechanismAvailable: false }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.complaintsAvailableRate).toBe(0);
    });

    it("clamps score to 25 maximum", () => {
      const result = evaluateChildWelfare([makeWelfare()]);
      expect(result.overallScore).toBeLessThanOrEqual(25);
    });

    it("handles multiple children with mixed welfare", () => {
      const welfare = [
        makeWelfare({ id: "w1", childId: "child-morgan" }),
        makeWelfare({
          id: "w2",
          childId: "child-alex",
          educationProvided: false,
          therapeuticSupportInPlace: false,
          outsideTimeMinutesPerDay: 20,
        }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.totalChildren).toBe(2);
      expect(result.educationRate).toBe(50);
      expect(result.therapeuticSupportRate).toBe(50);
      expect(result.outsideTimeAdequateRate).toBe(50);
    });

    it("returns score 0 when all welfare needs unmet", () => {
      const welfare = [
        makeWelfare({
          id: "w1",
          educationProvided: false,
          educationHoursPerWeek: 0,
          therapeuticSupportInPlace: false,
          familyContactMaintained: false,
          healthNeedsMet: false,
          outsideTimeMinutesPerDay: 0,
          privacyRespected: false,
          complaintsMechanismAvailable: false,
        }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.overallScore).toBe(0);
    });

    it("boundary: exactly 15 hours education counts as adequate", () => {
      const welfare = [
        makeWelfare({ id: "w1", educationHoursPerWeek: 15 }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.educationHoursAdequateRate).toBe(100);
    });

    it("boundary: exactly 60 minutes outside time counts as adequate", () => {
      const welfare = [
        makeWelfare({ id: "w1", outsideTimeMinutesPerDay: 60 }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.outsideTimeAdequateRate).toBe(100);
    });

    it("boundary: 14 hours education counts as inadequate", () => {
      const welfare = [
        makeWelfare({ id: "w1", educationHoursPerWeek: 14 }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.educationHoursAdequateRate).toBe(0);
    });

    it("boundary: 59 minutes outside time counts as inadequate", () => {
      const welfare = [
        makeWelfare({ id: "w1", outsideTimeMinutesPerDay: 59 }),
      ];
      const result = evaluateChildWelfare(welfare);
      expect(result.outsideTimeAdequateRate).toBe(0);
    });
  });

  // ── evaluateDischargePreparedness ────────────────────────────────────────

  describe("evaluateDischargePreparedness", () => {
    it("returns max score 20 for empty assessments", () => {
      const result = evaluateDischargePreparedness([]);
      expect(result.overallScore).toBe(20);
      expect(result.totalAssessments).toBe(0);
      expect(result.transitionPlanRate).toBe(100);
      expect(result.receivingPlacementRate).toBe(100);
      expect(result.supportNetworkRate).toBe(100);
      expect(result.riskManagementRate).toBe(100);
      expect(result.childViewsRate).toBe(100);
    });

    it("returns max score 20 for fully prepared assessments", () => {
      const result = evaluateDischargePreparedness([makeDischargeAssessment()]);
      expect(result.overallScore).toBe(20);
    });

    it("awards +5 for 100% transition plan rate", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", transitionPlanInPlace: true }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.transitionPlanRate).toBe(100);
    });

    it("reduces score when transition plan missing", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", transitionPlanInPlace: false }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.transitionPlanRate).toBe(0);
      expect(result.overallScore).toBeLessThan(20);
    });

    it("awards +4 for 100% receiving placement rate", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", receivingPlacementIdentified: true }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.receivingPlacementRate).toBe(100);
    });

    it("reduces score when receiving placement not identified", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", receivingPlacementIdentified: false }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.receivingPlacementRate).toBe(0);
      expect(result.overallScore).toBeLessThan(20);
    });

    it("awards +4 for 100% support network mapped", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", supportNetworkMapped: true }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.supportNetworkRate).toBe(100);
    });

    it("reduces score when support network not mapped", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", supportNetworkMapped: false }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.supportNetworkRate).toBe(0);
      expect(result.overallScore).toBeLessThan(20);
    });

    it("awards +4 for 100% risk management updated", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", riskManagementPlanUpdated: true }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.riskManagementRate).toBe(100);
    });

    it("reduces score when risk management not updated", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", riskManagementPlanUpdated: false }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.riskManagementRate).toBe(0);
    });

    it("awards +3 for 100% child views on discharge", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", childViewsOnDischarge: true }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.childViewsRate).toBe(100);
    });

    it("reduces score when child views not obtained", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", childViewsOnDischarge: false }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.childViewsRate).toBe(0);
    });

    it("clamps score to 20 maximum", () => {
      const result = evaluateDischargePreparedness([makeDischargeAssessment()]);
      expect(result.overallScore).toBeLessThanOrEqual(20);
    });

    it("handles completely unprepared assessments", () => {
      const assessments = [
        makeDischargeAssessment({
          id: "d1",
          transitionPlanInPlace: false,
          receivingPlacementIdentified: false,
          supportNetworkMapped: false,
          riskManagementPlanUpdated: false,
          childViewsOnDischarge: false,
        }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.overallScore).toBe(0);
    });

    it("handles multiple assessments with mixed quality", () => {
      const assessments = [
        makeDischargeAssessment({
          id: "d1",
          transitionPlanInPlace: true,
          receivingPlacementIdentified: true,
          supportNetworkMapped: true,
          riskManagementPlanUpdated: true,
          childViewsOnDischarge: true,
        }),
        makeDischargeAssessment({
          id: "d2",
          childId: "child-alex",
          transitionPlanInPlace: false,
          receivingPlacementIdentified: false,
          supportNetworkMapped: false,
          riskManagementPlanUpdated: false,
          childViewsOnDischarge: false,
        }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.totalAssessments).toBe(2);
      expect(result.transitionPlanRate).toBe(50);
      expect(result.overallScore).toBe(0); // None at 100%
    });

    it("handles readiness states correctly", () => {
      const assessments = [
        makeDischargeAssessment({ id: "d1", readiness: "ready" }),
        makeDischargeAssessment({ id: "d2", readiness: "not_ready" }),
        makeDischargeAssessment({ id: "d3", readiness: "requires_assessment" }),
      ];
      const result = evaluateDischargePreparedness(assessments);
      expect(result.totalAssessments).toBe(3);
    });
  });

  // ── buildChildSecureProfiles ─────────────────────────────────────────────

  describe("buildChildSecureProfiles", () => {
    it("returns empty array for no orders", () => {
      const profiles = buildChildSecureProfiles([], [], []);
      expect(profiles).toHaveLength(0);
    });

    it("builds profile for single child with active order", () => {
      const profiles = buildChildSecureProfiles(
        [makeOrder()],
        [makeReview()],
        [makeDischargeAssessment()],
      );
      expect(profiles).toHaveLength(1);
      expect(profiles[0].childId).toBe("child-morgan");
      expect(profiles[0].childName).toBe("Morgan");
      expect(profiles[0].hasActiveOrder).toBe(true);
      expect(profiles[0].orderStatus).toBe("active");
      expect(profiles[0].reviewsCompleted).toBe(1);
    });

    it("detects inactive order status", () => {
      const profiles = buildChildSecureProfiles(
        [makeOrder({ orderStatus: "expired" })],
        [],
        [],
      );
      expect(profiles[0].hasActiveOrder).toBe(false);
      expect(profiles[0].orderStatus).toBe("expired");
    });

    it("reports latest progress outcome from reviews", () => {
      const profiles = buildChildSecureProfiles(
        [makeOrder()],
        [
          makeReview({ id: "r1", reviewDate: "2026-02-01", progressOutcome: "stable" }),
          makeReview({ id: "r2", reviewDate: "2026-03-01", progressOutcome: "positive_progress" }),
        ],
        [],
      );
      expect(profiles[0].latestProgress).toBe("positive_progress");
    });

    it("reports none for progress when no reviews", () => {
      const profiles = buildChildSecureProfiles(
        [makeOrder()],
        [],
        [],
      );
      expect(profiles[0].latestProgress).toBe("none");
    });

    it("reports discharge readiness from latest assessment", () => {
      const profiles = buildChildSecureProfiles(
        [makeOrder()],
        [],
        [
          makeDischargeAssessment({ id: "d1", assessmentDate: "2026-03-01", readiness: "not_ready" }),
          makeDischargeAssessment({ id: "d2", assessmentDate: "2026-04-01", readiness: "nearly_ready" }),
        ],
      );
      expect(profiles[0].dischargeReadiness).toBe("nearly_ready");
    });

    it("reports not_assessed when no discharge assessments", () => {
      const profiles = buildChildSecureProfiles(
        [makeOrder()],
        [],
        [],
      );
      expect(profiles[0].dischargeReadiness).toBe("not_assessed");
    });

    it("scores higher for positive progress", () => {
      const profilePositive = buildChildSecureProfiles(
        [makeOrder()],
        [makeReview({ progressOutcome: "positive_progress" })],
        [makeDischargeAssessment({ readiness: "nearly_ready" })],
      );
      const profileDeteriorate = buildChildSecureProfiles(
        [makeOrder()],
        [makeReview({ progressOutcome: "deteriorating" })],
        [],
      );
      expect(profilePositive[0].overallScore).toBeGreaterThan(
        profileDeteriorate[0].overallScore,
      );
    });

    it("clamps profile score between 0 and 10", () => {
      const profiles = buildChildSecureProfiles(
        [makeOrder()],
        [makeReview()],
        [makeDischargeAssessment({ readiness: "ready" })],
      );
      expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
      expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    });

    it("handles multiple children", () => {
      const orders = [
        makeOrder({ id: "o1", childId: "child-morgan", childName: "Morgan" }),
        makeOrder({ id: "o2", childId: "child-alex", childName: "Alex" }),
      ];
      const profiles = buildChildSecureProfiles(orders, [], []);
      expect(profiles).toHaveLength(2);
      const ids = profiles.map((p) => p.childId);
      expect(ids).toContain("child-morgan");
      expect(ids).toContain("child-alex");
    });

    it("counts reviews per child", () => {
      const orders = [
        makeOrder({ id: "o1", childId: "child-morgan", childName: "Morgan" }),
      ];
      const reviews = [
        makeReview({ id: "r1", childId: "child-morgan" }),
        makeReview({ id: "r2", childId: "child-morgan" }),
        makeReview({ id: "r3", childId: "child-morgan" }),
      ];
      const profiles = buildChildSecureProfiles(orders, reviews, []);
      expect(profiles[0].reviewsCompleted).toBe(3);
    });

    it("does not count reviews for other children", () => {
      const orders = [
        makeOrder({ id: "o1", childId: "child-morgan", childName: "Morgan" }),
        makeOrder({ id: "o2", childId: "child-alex", childName: "Alex" }),
      ];
      const reviews = [
        makeReview({ id: "r1", childId: "child-morgan" }),
        makeReview({ id: "r2", childId: "child-alex" }),
      ];
      const profiles = buildChildSecureProfiles(orders, reviews, []);
      const morgan = profiles.find((p) => p.childId === "child-morgan");
      expect(morgan?.reviewsCompleted).toBe(1);
    });

    it("awards bonus for no active order (positive outcome)", () => {
      const profileNoOrder = buildChildSecureProfiles(
        [makeOrder({ orderStatus: "expired" })],
        [],
        [],
      );
      const profileActive = buildChildSecureProfiles(
        [makeOrder({ orderStatus: "active", s25CriteriaDocumented: false, leastRestrictiveConsidered: false })],
        [],
        [],
      );
      expect(profileNoOrder[0].overallScore).toBeGreaterThanOrEqual(
        profileActive[0].overallScore,
      );
    });
  });

  // ── Demo Data Integration ────────────────────────────────────────────────

  describe("Demo Data — Chamberlain House", () => {
    it("generates intelligence from demo data without errors", () => {
      const result = generateSecureAccommodationIntelligence(
        DEMO_ORDERS,
        DEMO_REVIEWS,
        DEMO_WELFARE,
        DEMO_DISCHARGE,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result).toBeDefined();
      expect(result.homeId).toBe("oak-house");
    });

    it("scores Chamberlain House demo data highly", () => {
      const result = generateSecureAccommodationIntelligence(
        DEMO_ORDERS,
        DEMO_REVIEWS,
        DEMO_WELFARE,
        DEMO_DISCHARGE,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.rating).toBe("outstanding");
    });

    it("generates child profiles from demo data", () => {
      const result = generateSecureAccommodationIntelligence(
        DEMO_ORDERS,
        DEMO_REVIEWS,
        DEMO_WELFARE,
        DEMO_DISCHARGE,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.childProfiles.length).toBeGreaterThanOrEqual(1);
      const morgan = result.childProfiles.find(
        (p) => p.childId === "child-morgan",
      );
      expect(morgan).toBeDefined();
      expect(morgan!.childName).toBe("Morgan");
      expect(morgan!.hasActiveOrder).toBe(true);
    });

    it("includes strengths from demo data", () => {
      const result = generateSecureAccommodationIntelligence(
        DEMO_ORDERS,
        DEMO_REVIEWS,
        DEMO_WELFARE,
        DEMO_DISCHARGE,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it("includes regulatory links", () => {
      const result = generateSecureAccommodationIntelligence(
        DEMO_ORDERS,
        DEMO_REVIEWS,
        DEMO_WELFARE,
        DEMO_DISCHARGE,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.regulatoryLinks.length).toBeGreaterThan(0);
      expect(result.regulatoryLinks.some((l) => l.includes("s25"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("ECHR"))).toBe(true);
    });

    it("period dates pass through correctly", () => {
      const result = generateSecureAccommodationIntelligence(
        DEMO_ORDERS,
        DEMO_REVIEWS,
        DEMO_WELFARE,
        DEMO_DISCHARGE,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.periodStart).toBe(PERIOD_START);
      expect(result.periodEnd).toBe(PERIOD_END);
    });
  });

  // ── generateSecureAccommodationIntelligence ──────────────────────────────

  describe("generateSecureAccommodationIntelligence", () => {
    it("returns max score 100 for no data (no restrictions needed)", () => {
      const result = generateSecureAccommodationIntelligence(
        [],
        [],
        [],
        [],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.overallScore).toBe(100);
      expect(result.rating).toBe("outstanding");
    });

    it("clamps overall score to 100", () => {
      const result = generateSecureAccommodationIntelligence(
        [],
        [],
        [],
        [],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it("sums sub-scores correctly", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview()],
        [makeWelfare()],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      const expectedSum =
        result.orderCompliance.overallScore +
        result.welfareReviewQuality.overallScore +
        result.childWelfare.overallScore +
        result.dischargePreparedness.overallScore;
      expect(result.overallScore).toBe(Math.min(expectedSum, 100));
    });

    it("generates actions for poor compliance", () => {
      const result = generateSecureAccommodationIntelligence(
        [
          makeOrder({
            orderStatus: "expired",
            s25CriteriaDocumented: false,
            leastRestrictiveConsidered: false,
          }),
        ],
        [
          makeReview({
            status: "overdue",
            childViewsRecorded: false,
            childAttended: false,
            alternativesConsidered: false,
            recommendationsMade: 5,
            recommendationsActioned: 0,
            participants: ["social_worker"],
          }),
        ],
        [
          makeWelfare({
            educationProvided: false,
            educationHoursPerWeek: 0,
            therapeuticSupportInPlace: false,
            outsideTimeMinutesPerDay: 20,
          }),
        ],
        [
          makeDischargeAssessment({
            transitionPlanInPlace: false,
            childViewsOnDischarge: false,
          }),
        ],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.areasForImprovement.length).toBeGreaterThan(0);
    });

    it("generates appropriate rating for mid-range score", () => {
      // Force a mid-range score by partially failing
      const result = generateSecureAccommodationIntelligence(
        [
          makeOrder({
            s25CriteriaDocumented: false,
            leastRestrictiveConsidered: false,
            justification: [],
          }),
        ],
        [],
        [],
        [],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      // Should still be relatively high because 3 of 4 sub-scores are max (no data)
      // order compliance: missing s25, least restrictive, justifications = some reduced
      expect(result.overallScore).toBeLessThan(100);
    });

    it("includes homeId in result", () => {
      const result = generateSecureAccommodationIntelligence(
        [],
        [],
        [],
        [],
        "my-home-123",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.homeId).toBe("my-home-123");
    });

    it("handles large data sets", () => {
      const orders = Array.from({ length: 20 }, (_, i) =>
        makeOrder({ id: `ord-${i}`, childId: `child-${i}`, childName: `Child ${i}` }),
      );
      const reviews = Array.from({ length: 40 }, (_, i) =>
        makeReview({ id: `rev-${i}`, childId: `child-${i % 20}`, orderId: `ord-${i % 20}` }),
      );
      const welfare = Array.from({ length: 20 }, (_, i) =>
        makeWelfare({ id: `wel-${i}`, childId: `child-${i}` }),
      );
      const discharge = Array.from({ length: 20 }, (_, i) =>
        makeDischargeAssessment({ id: `dis-${i}`, childId: `child-${i}`, orderId: `ord-${i}` }),
      );
      const result = generateSecureAccommodationIntelligence(
        orders,
        reviews,
        welfare,
        discharge,
        "large-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.childProfiles).toHaveLength(20);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it("no orders produces strength about no restrictions", () => {
      const result = generateSecureAccommodationIntelligence(
        [],
        [],
        [],
        [],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.strengths.some((s) => s.includes("No secure accommodation orders"))).toBe(true);
    });

    it("generates areas for improvement for expired orders", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder({ orderStatus: "expired" })],
        [],
        [],
        [],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.areasForImprovement.some((a) => a.includes("expired"))).toBe(true);
    });

    it("generates urgent action for expired orders", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder({ orderStatus: "expired" })],
        [],
        [],
        [],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
    });

    it("rating is inadequate for very poor scores", () => {
      const result = generateSecureAccommodationIntelligence(
        [
          makeOrder({
            orderStatus: "expired",
            s25CriteriaDocumented: false,
            leastRestrictiveConsidered: false,
            justification: [],
          }),
          makeOrder({
            id: "o2",
            orderStatus: "refused",
            s25CriteriaDocumented: false,
            leastRestrictiveConsidered: false,
            justification: [],
          }),
        ],
        [
          makeReview({
            status: "overdue",
            childViewsRecorded: false,
            childAttended: false,
            alternativesConsidered: false,
            recommendationsMade: 10,
            recommendationsActioned: 0,
            participants: ["social_worker"],
          }),
        ],
        [
          makeWelfare({
            educationProvided: false,
            educationHoursPerWeek: 0,
            therapeuticSupportInPlace: false,
            familyContactMaintained: false,
            healthNeedsMet: false,
            outsideTimeMinutesPerDay: 0,
            privacyRespected: false,
            complaintsMechanismAvailable: false,
          }),
        ],
        [
          makeDischargeAssessment({
            transitionPlanInPlace: false,
            receivingPlacementIdentified: false,
            supportNetworkMapped: false,
            riskManagementPlanUpdated: false,
            childViewsOnDischarge: false,
          }),
        ],
        "bad-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.overallScore).toBeLessThan(40);
      expect(result.rating).toBe("inadequate");
    });
  });

  // ── Strengths Generation ─────────────────────────────────────────────────

  describe("Strengths generation", () => {
    it("includes s25 criteria strength when fully documented", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder({ s25CriteriaDocumented: true })],
        [makeReview()],
        [makeWelfare()],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.strengths.some((s) => s.includes("s25"))).toBe(true);
    });

    it("includes education strength when provided", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview()],
        [makeWelfare({ educationProvided: true })],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.strengths.some((s) => s.includes("Education") || s.includes("education"))).toBe(true);
    });

    it("includes therapeutic support strength", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview()],
        [makeWelfare({ therapeuticSupportInPlace: true })],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.strengths.some((s) => s.includes("Therapeutic") || s.includes("therapeutic"))).toBe(true);
    });
  });

  // ── Areas for Improvement Generation ─────────────────────────────────────

  describe("Areas for improvement generation", () => {
    it("flags low child views rate", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview({ childViewsRecorded: false })],
        [makeWelfare()],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.areasForImprovement.some((a) => a.includes("views"))).toBe(true);
    });

    it("flags refused orders", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder({ orderStatus: "refused" })],
        [],
        [],
        [],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.areasForImprovement.some((a) => a.includes("refused"))).toBe(true);
    });

    it("flags inadequate education", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview()],
        [makeWelfare({ educationProvided: false })],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.areasForImprovement.some((a) => a.includes("Education") || a.includes("education"))).toBe(true);
    });

    it("flags transition plan issues", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview()],
        [makeWelfare()],
        [makeDischargeAssessment({ transitionPlanInPlace: false })],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.areasForImprovement.some((a) => a.includes("Transition") || a.includes("transition"))).toBe(true);
    });
  });

  // ── Actions Generation ───────────────────────────────────────────────────

  describe("Actions generation", () => {
    it("generates education action when not provided", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview()],
        [makeWelfare({ educationProvided: false })],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.actions.some((a) => a.includes("education") || a.includes("Education"))).toBe(true);
    });

    it("generates therapeutic support action when missing", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview()],
        [makeWelfare({ therapeuticSupportInPlace: false })],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.actions.some((a) => a.includes("therapeutic") || a.includes("Therapeutic"))).toBe(true);
    });

    it("generates s25 documentation action when incomplete", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder({ s25CriteriaDocumented: false })],
        [makeReview()],
        [makeWelfare()],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.actions.some((a) => a.includes("s25"))).toBe(true);
    });

    it("generates outside time action when inadequate", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview()],
        [makeWelfare({ outsideTimeMinutesPerDay: 20 })],
        [makeDischargeAssessment()],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.actions.some((a) => a.includes("outside time") || a.includes("outside"))).toBe(true);
    });

    it("generates child views action for discharge", () => {
      const result = generateSecureAccommodationIntelligence(
        [makeOrder()],
        [makeReview()],
        [makeWelfare()],
        [makeDischargeAssessment({ childViewsOnDischarge: false })],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.actions.some((a) => a.includes("views") || a.includes("discharge"))).toBe(true);
    });
  });
});
