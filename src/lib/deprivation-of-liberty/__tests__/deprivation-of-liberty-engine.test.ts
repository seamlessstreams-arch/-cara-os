// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Deprivation of Liberty Intelligence — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAuthorisationCompliance,
  evaluateProportionality,
  evaluateReviewSafeguards,
  evaluateRightsProtection,
  buildChildDoLSProfiles,
  generateDeprivationOfLibertyIntelligence,
  getRating,
  getRestrictionTypeLabel,
  getAuthorisationStatusLabel,
  getReviewOutcomeLabel,
  getProportionalityLabel,
  getChildViewStatusLabel,
  getSafeguardTypeLabel,
} from "../deprivation-of-liberty-engine";
import type {
  RestrictionRecord,
  DoLSReview,
  ChildRightsSafeguard,
  LegalCompliance,
  RestrictionType,
  AuthorisationStatus,
  ReviewOutcome,
  ProportionalityAssessment,
  ChildViewStatus,
  SafeguardType,
} from "../deprivation-of-liberty-engine";

// ── Constants ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

// ── Factories ────────────────────────────────────────────────────────────────

function makeRestriction(
  overrides: Partial<RestrictionRecord> = {},
): RestrictionRecord {
  return {
    id: "rest-001",
    childId: "child-morgan",
    childName: "Morgan",
    restrictionType: "continuous_supervision",
    startDate: "2026-02-01",
    isActive: true,
    authorisationStatus: "court_authorised",
    authorisedBy: "Family Court",
    authorisationDate: "2026-01-28",
    authorisationExpiryDate: "2026-07-28",
    proportionality: "proportionate",
    bestInterestsAssessmentCompleted: true,
    leastRestrictiveOptionConsidered: true,
    riskAssessmentLinked: true,
    ...overrides,
  };
}

function makeReview(overrides: Partial<DoLSReview> = {}): DoLSReview {
  return {
    id: "rev-001",
    restrictionId: "rest-001",
    childId: "child-morgan",
    reviewDate: "2026-03-15",
    reviewedBy: "Darren Laville",
    outcome: "continued",
    childViewStatus: "views_obtained",
    familyConsulted: true,
    independentPersonInvolved: true,
    proportionalityReassessed: true,
    nextReviewDue: "2026-06-15",
    lessRestrictiveAlternativesConsidered: true,
    ...overrides,
  };
}

function makeSafeguard(
  overrides: Partial<ChildRightsSafeguard> = {},
): ChildRightsSafeguard {
  return {
    id: "sg-001",
    childId: "child-morgan",
    restrictionId: "rest-001",
    safeguardType: "advocacy",
    inPlace: true,
    arrangedDate: "2026-02-01",
    providerName: "National Youth Advocacy Service",
    ...overrides,
  };
}

function makeLegalCompliance(
  overrides: Partial<LegalCompliance> = {},
): LegalCompliance {
  return {
    id: "leg-001",
    childId: "child-morgan",
    courtOrderInPlace: true,
    courtOrderExpiryDate: "2026-07-28",
    s25ApplicationMade: false,
    s25Outcome: "not_applicable",
    localAuthorityNotified: true,
    ofstedNotified: true,
    cafeassInvolved: true,
    lastLegalReviewDate: "2026-03-15",
    ...overrides,
  };
}

// ── Oak House Demo Data ──────────────────────────────────────────────────────

// Morgan (15) — court-authorised continuous supervision due to self-harm risk
// Alex (14) — technology monitoring (lower-level, LA authorised)
// Jordan (13) — no restrictions

const DEMO_RESTRICTIONS: RestrictionRecord[] = [
  makeRestriction({
    id: "rest-morgan-01",
    childId: "child-morgan",
    childName: "Morgan",
    restrictionType: "continuous_supervision",
    startDate: "2026-02-01",
    isActive: true,
    authorisationStatus: "court_authorised",
    authorisedBy: "Family Court",
    authorisationDate: "2026-01-28",
    authorisationExpiryDate: "2026-07-28",
    proportionality: "proportionate",
    bestInterestsAssessmentCompleted: true,
    leastRestrictiveOptionConsidered: true,
    riskAssessmentLinked: true,
  }),
  makeRestriction({
    id: "rest-morgan-02",
    childId: "child-morgan",
    childName: "Morgan",
    restrictionType: "locked_doors",
    startDate: "2026-02-01",
    isActive: true,
    authorisationStatus: "court_authorised",
    authorisedBy: "Family Court",
    authorisationDate: "2026-01-28",
    authorisationExpiryDate: "2026-07-28",
    proportionality: "proportionate",
    bestInterestsAssessmentCompleted: true,
    leastRestrictiveOptionConsidered: true,
    riskAssessmentLinked: true,
  }),
  makeRestriction({
    id: "rest-alex-01",
    childId: "child-alex",
    childName: "Alex",
    restrictionType: "technology_monitoring",
    startDate: "2026-03-01",
    isActive: true,
    authorisationStatus: "local_authority_authorised",
    authorisedBy: "Placing Authority SW",
    authorisationDate: "2026-02-28",
    authorisationExpiryDate: "2026-08-28",
    proportionality: "proportionate",
    bestInterestsAssessmentCompleted: true,
    leastRestrictiveOptionConsidered: true,
    riskAssessmentLinked: true,
  }),
];

const DEMO_REVIEWS: DoLSReview[] = [
  makeReview({
    id: "rev-morgan-01",
    restrictionId: "rest-morgan-01",
    childId: "child-morgan",
    reviewDate: "2026-03-15",
    reviewedBy: "Darren Laville",
    outcome: "continued",
    childViewStatus: "views_obtained",
    familyConsulted: true,
    independentPersonInvolved: true,
    proportionalityReassessed: true,
    nextReviewDue: "2026-06-15",
    lessRestrictiveAlternativesConsidered: true,
  }),
  makeReview({
    id: "rev-morgan-02",
    restrictionId: "rest-morgan-02",
    childId: "child-morgan",
    reviewDate: "2026-03-15",
    reviewedBy: "Darren Laville",
    outcome: "modified",
    childViewStatus: "views_obtained",
    familyConsulted: true,
    independentPersonInvolved: true,
    proportionalityReassessed: true,
    nextReviewDue: "2026-06-15",
    lessRestrictiveAlternativesConsidered: true,
  }),
  makeReview({
    id: "rev-alex-01",
    restrictionId: "rest-alex-01",
    childId: "child-alex",
    reviewDate: "2026-04-01",
    reviewedBy: "Sarah Johnson",
    outcome: "continued",
    childViewStatus: "views_obtained",
    familyConsulted: true,
    independentPersonInvolved: false,
    proportionalityReassessed: true,
    nextReviewDue: "2026-07-01",
    lessRestrictiveAlternativesConsidered: true,
  }),
];

const DEMO_SAFEGUARDS: ChildRightsSafeguard[] = [
  // Morgan — full safeguard suite
  makeSafeguard({ id: "sg-m01", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "advocacy", inPlace: true, providerName: "NYAS" }),
  makeSafeguard({ id: "sg-m02", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "legal_representation", inPlace: true, providerName: "Family Solicitor" }),
  makeSafeguard({ id: "sg-m03", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "rights_information_given", inPlace: true }),
  makeSafeguard({ id: "sg-m04", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "family_notification", inPlace: true }),
  makeSafeguard({ id: "sg-m05", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "ofsted_notification", inPlace: true }),
  makeSafeguard({ id: "sg-m06", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "independent_reviewer", inPlace: true, providerName: "IRO" }),
  // Alex — basic safeguards
  makeSafeguard({ id: "sg-a01", childId: "child-alex", restrictionId: "rest-alex-01", safeguardType: "advocacy", inPlace: true, providerName: "NYAS" }),
  makeSafeguard({ id: "sg-a02", childId: "child-alex", restrictionId: "rest-alex-01", safeguardType: "rights_information_given", inPlace: true }),
  makeSafeguard({ id: "sg-a03", childId: "child-alex", restrictionId: "rest-alex-01", safeguardType: "family_notification", inPlace: true }),
  makeSafeguard({ id: "sg-a04", childId: "child-alex", restrictionId: "rest-alex-01", safeguardType: "ofsted_notification", inPlace: true }),
];

const DEMO_LEGAL: LegalCompliance[] = [
  makeLegalCompliance({
    id: "leg-morgan",
    childId: "child-morgan",
    courtOrderInPlace: true,
    courtOrderExpiryDate: "2026-07-28",
    s25ApplicationMade: false,
    s25Outcome: "not_applicable",
    localAuthorityNotified: true,
    ofstedNotified: true,
    cafeassInvolved: true,
    lastLegalReviewDate: "2026-03-15",
  }),
  makeLegalCompliance({
    id: "leg-alex",
    childId: "child-alex",
    courtOrderInPlace: false,
    s25ApplicationMade: false,
    s25Outcome: "not_applicable",
    localAuthorityNotified: true,
    ofstedNotified: true,
    cafeassInvolved: false,
    lastLegalReviewDate: "2026-04-01",
  }),
];

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Deprivation of Liberty Intelligence Engine", () => {
  // ── Label Functions ──────────────────────────────────────────────────────

  describe("getRestrictionTypeLabel", () => {
    it("returns correct label for locked_doors", () => {
      expect(getRestrictionTypeLabel("locked_doors")).toBe("Locked Doors");
    });

    it("returns correct label for continuous_supervision", () => {
      expect(getRestrictionTypeLabel("continuous_supervision")).toBe("Continuous Supervision");
    });

    it("returns correct label for seclusion", () => {
      expect(getRestrictionTypeLabel("seclusion")).toBe("Seclusion");
    });

    it("returns correct label for chemical_restraint", () => {
      expect(getRestrictionTypeLabel("chemical_restraint")).toBe("Chemical Restraint");
    });

    it("returns correct label for all restriction types", () => {
      const types: RestrictionType[] = [
        "locked_doors", "continuous_supervision", "medication_covert",
        "movement_restriction", "technology_monitoring", "seclusion",
        "physical_restraint", "chemical_restraint", "environmental_restriction",
        "communication_restriction",
      ];
      for (const t of types) {
        expect(getRestrictionTypeLabel(t)).toBeTruthy();
      }
    });
  });

  describe("getAuthorisationStatusLabel", () => {
    it("returns correct label for court_authorised", () => {
      expect(getAuthorisationStatusLabel("court_authorised")).toBe("Court Authorised");
    });

    it("returns correct label for expired", () => {
      expect(getAuthorisationStatusLabel("expired")).toBe("Expired");
    });

    it("returns correct label for all statuses", () => {
      const statuses: AuthorisationStatus[] = [
        "court_authorised", "local_authority_authorised", "pending_application",
        "not_required", "expired", "refused", "under_review",
      ];
      for (const s of statuses) {
        expect(getAuthorisationStatusLabel(s)).toBeTruthy();
      }
    });
  });

  describe("getReviewOutcomeLabel", () => {
    it("returns correct labels for all outcomes", () => {
      const outcomes: ReviewOutcome[] = ["continued", "modified", "ceased", "escalated", "deferred"];
      for (const o of outcomes) {
        expect(getReviewOutcomeLabel(o)).toBeTruthy();
      }
    });
  });

  describe("getProportionalityLabel", () => {
    it("returns Proportionate for proportionate", () => {
      expect(getProportionalityLabel("proportionate")).toBe("Proportionate");
    });

    it("returns Disproportionate for disproportionate", () => {
      expect(getProportionalityLabel("disproportionate")).toBe("Disproportionate");
    });

    it("returns all labels", () => {
      const values: ProportionalityAssessment[] = [
        "proportionate", "potentially_disproportionate", "disproportionate", "not_assessed",
      ];
      for (const v of values) {
        expect(getProportionalityLabel(v)).toBeTruthy();
      }
    });
  });

  describe("getChildViewStatusLabel", () => {
    it("returns correct labels", () => {
      const values: ChildViewStatus[] = [
        "views_obtained", "views_sought_not_obtained", "views_not_sought", "non_verbal_observation_used",
      ];
      for (const v of values) {
        expect(getChildViewStatusLabel(v)).toBeTruthy();
      }
    });
  });

  describe("getSafeguardTypeLabel", () => {
    it("returns correct labels for all safeguard types", () => {
      const types: SafeguardType[] = [
        "independent_reviewer", "advocacy", "legal_representation",
        "family_notification", "local_authority_notification",
        "ofsted_notification", "rights_information_given", "complaints_process_explained",
      ];
      for (const t of types) {
        expect(getSafeguardTypeLabel(t)).toBeTruthy();
      }
    });
  });

  describe("getRating", () => {
    it("returns outstanding for score ≥ 80", () => {
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

  // ── evaluateAuthorisationCompliance ────────────────────────────────────

  describe("evaluateAuthorisationCompliance", () => {
    it("returns max score for no restrictions", () => {
      const result = evaluateAuthorisationCompliance([]);
      expect(result.overallScore).toBe(30);
      expect(result.totalRestrictions).toBe(0);
      expect(result.authorisedRate).toBe(100);
    });

    it("scores high for all authorised restrictions with full compliance", () => {
      const result = evaluateAuthorisationCompliance(DEMO_RESTRICTIONS);
      expect(result.overallScore).toBeGreaterThanOrEqual(20);
      expect(result.authorisedRate).toBe(100);
      expect(result.expiredAuthorisations).toBe(0);
      expect(result.bestInterestsRate).toBe(100);
      expect(result.leastRestrictiveRate).toBe(100);
    });

    it("counts active restrictions correctly", () => {
      const result = evaluateAuthorisationCompliance(DEMO_RESTRICTIONS);
      expect(result.activeRestrictions).toBe(3);
    });

    it("counts total restrictions", () => {
      const result = evaluateAuthorisationCompliance(DEMO_RESTRICTIONS);
      expect(result.totalRestrictions).toBe(3);
    });

    it("penalises expired authorisations", () => {
      const restrictions = [
        makeRestriction({ authorisationStatus: "expired" }),
      ];
      const result = evaluateAuthorisationCompliance(restrictions);
      expect(result.expiredAuthorisations).toBe(1);
      // No +4 bonus for no expired
      expect(result.overallScore).toBeLessThan(30);
    });

    it("penalises low authorisation rate", () => {
      const restrictions = [
        makeRestriction({ id: "r1", authorisationStatus: "pending_application" }),
        makeRestriction({ id: "r2", authorisationStatus: "pending_application" }),
        makeRestriction({ id: "r3", authorisationStatus: "court_authorised" }),
      ];
      const result = evaluateAuthorisationCompliance(restrictions);
      expect(result.authorisedRate).toBeLessThan(50);
    });

    it("penalises missing best interests assessments", () => {
      const restrictions = [
        makeRestriction({ bestInterestsAssessmentCompleted: false }),
      ];
      const result = evaluateAuthorisationCompliance(restrictions);
      expect(result.bestInterestsRate).toBe(0);
    });

    it("penalises when least restrictive not considered", () => {
      const restrictions = [
        makeRestriction({ leastRestrictiveOptionConsidered: false }),
      ];
      const result = evaluateAuthorisationCompliance(restrictions);
      expect(result.leastRestrictiveRate).toBe(0);
    });

    it("penalises refused authorisations", () => {
      const restrictions = [
        makeRestriction({ authorisationStatus: "refused" }),
      ];
      const result = evaluateAuthorisationCompliance(restrictions);
      // No +2 bonus for refused=0
      expect(result.overallScore).toBeLessThan(25);
    });

    it("handles mix of authorisation statuses", () => {
      const restrictions = [
        makeRestriction({ id: "r1", authorisationStatus: "court_authorised" }),
        makeRestriction({ id: "r2", authorisationStatus: "not_required" }),
        makeRestriction({ id: "r3", authorisationStatus: "pending_application" }),
      ];
      const result = evaluateAuthorisationCompliance(restrictions);
      expect(result.authorisedRate).toBe(67);
      expect(result.pendingApplications).toBe(1);
    });

    it("calculates risk assessment rate", () => {
      const restrictions = [
        makeRestriction({ id: "r1", riskAssessmentLinked: true }),
        makeRestriction({ id: "r2", riskAssessmentLinked: false }),
      ];
      const result = evaluateAuthorisationCompliance(restrictions);
      expect(result.riskAssessmentRate).toBe(50);
    });
  });

  // ── evaluateProportionality ────────────────────────────────────────────

  describe("evaluateProportionality", () => {
    it("returns max score for no restrictions", () => {
      const result = evaluateProportionality([], PERIOD_END);
      expect(result.overallScore).toBe(25);
      expect(result.proportionateRate).toBe(100);
    });

    it("scores high for all proportionate restrictions", () => {
      const result = evaluateProportionality(DEMO_RESTRICTIONS, PERIOD_END);
      expect(result.overallScore).toBeGreaterThanOrEqual(18);
      expect(result.proportionateRate).toBe(100);
      expect(result.disproportionateCount).toBe(0);
    });

    it("penalises disproportionate restrictions", () => {
      const restrictions = [
        makeRestriction({ proportionality: "disproportionate" }),
      ];
      const result = evaluateProportionality(restrictions, PERIOD_END);
      expect(result.disproportionateCount).toBe(1);
      expect(result.proportionateRate).toBe(0);
    });

    it("counts not_assessed restrictions", () => {
      const restrictions = [
        makeRestriction({ proportionality: "not_assessed" }),
      ];
      const result = evaluateProportionality(restrictions, PERIOD_END);
      expect(result.notAssessedCount).toBe(1);
    });

    it("builds restriction type breakdown", () => {
      const result = evaluateProportionality(DEMO_RESTRICTIONS, PERIOD_END);
      expect(result.restrictionTypeBreakdown.continuous_supervision).toBe(1);
      expect(result.restrictionTypeBreakdown.locked_doors).toBe(1);
      expect(result.restrictionTypeBreakdown.technology_monitoring).toBe(1);
    });

    it("calculates average active duration", () => {
      const restrictions = [
        makeRestriction({ startDate: "2026-04-01", isActive: true }),
      ];
      const result = evaluateProportionality(restrictions, "2026-05-01");
      expect(result.averageActiveDurationDays).toBe(30);
    });

    it("penalises severe restriction types (seclusion)", () => {
      const restrictions = [
        makeRestriction({ restrictionType: "seclusion", proportionality: "proportionate", leastRestrictiveOptionConsidered: true }),
      ];
      const result = evaluateProportionality(restrictions, PERIOD_END);
      // No +3 for no seclusion/chemical
      const restrictionsNoSeclusion = [
        makeRestriction({ restrictionType: "locked_doors", proportionality: "proportionate", leastRestrictiveOptionConsidered: true }),
      ];
      const resultNoSeclusion = evaluateProportionality(restrictionsNoSeclusion, PERIOD_END);
      expect(resultNoSeclusion.overallScore).toBeGreaterThan(result.overallScore);
    });

    it("penalises severe restriction types (chemical_restraint)", () => {
      const restrictions = [
        makeRestriction({ restrictionType: "chemical_restraint", proportionality: "proportionate", leastRestrictiveOptionConsidered: true }),
      ];
      const result = evaluateProportionality(restrictions, PERIOD_END);
      expect(result.overallScore).toBeLessThan(25);
    });

    it("gives bonus for all having least restrictive option considered", () => {
      const all = [
        makeRestriction({ id: "r1", leastRestrictiveOptionConsidered: true }),
        makeRestriction({ id: "r2", leastRestrictiveOptionConsidered: true }),
      ];
      const partial = [
        makeRestriction({ id: "r1", leastRestrictiveOptionConsidered: true }),
        makeRestriction({ id: "r2", leastRestrictiveOptionConsidered: false }),
      ];
      const resultAll = evaluateProportionality(all, PERIOD_END);
      const resultPartial = evaluateProportionality(partial, PERIOD_END);
      expect(resultAll.overallScore).toBeGreaterThan(resultPartial.overallScore);
    });

    it("handles long-duration active restrictions", () => {
      const restrictions = [
        makeRestriction({ startDate: "2025-01-01", isActive: true }),
      ];
      const result = evaluateProportionality(restrictions, "2026-05-18");
      expect(result.averageActiveDurationDays).toBeGreaterThan(90);
      // No duration bonus
    });
  });

  // ── evaluateReviewSafeguards ───────────────────────────────────────────

  describe("evaluateReviewSafeguards", () => {
    it("returns max score when no active restrictions and no reviews", () => {
      const result = evaluateReviewSafeguards([], [], PERIOD_END);
      expect(result.overallScore).toBe(25);
    });

    it("returns 0 when active restrictions but no reviews", () => {
      const result = evaluateReviewSafeguards([], DEMO_RESTRICTIONS, PERIOD_END);
      expect(result.overallScore).toBe(0);
      expect(result.overdueReviews).toBe(3);
    });

    it("scores well for demo data with comprehensive reviews", () => {
      const result = evaluateReviewSafeguards(DEMO_REVIEWS, DEMO_RESTRICTIONS, PERIOD_END);
      expect(result.overallScore).toBeGreaterThanOrEqual(15);
      expect(result.totalReviews).toBe(3);
    });

    it("calculates child views rate", () => {
      const result = evaluateReviewSafeguards(DEMO_REVIEWS, DEMO_RESTRICTIONS, PERIOD_END);
      expect(result.childViewsRate).toBe(100);
    });

    it("penalises when child views not sought", () => {
      const reviews = [
        makeReview({ childViewStatus: "views_not_sought" }),
      ];
      const result = evaluateReviewSafeguards(reviews, [makeRestriction()], PERIOD_END);
      expect(result.childViewsRate).toBe(0);
    });

    it("accepts non-verbal observation as valid", () => {
      const reviews = [
        makeReview({ childViewStatus: "non_verbal_observation_used" }),
      ];
      const result = evaluateReviewSafeguards(reviews, [makeRestriction()], PERIOD_END);
      expect(result.childViewsRate).toBe(100);
    });

    it("calculates family consulted rate", () => {
      const reviews = [
        makeReview({ id: "r1", familyConsulted: true }),
        makeReview({ id: "r2", familyConsulted: false }),
      ];
      const result = evaluateReviewSafeguards(reviews, [makeRestriction()], PERIOD_END);
      expect(result.familyConsultedRate).toBe(50);
    });

    it("calculates independent involvement rate", () => {
      const result = evaluateReviewSafeguards(DEMO_REVIEWS, DEMO_RESTRICTIONS, PERIOD_END);
      // 2 of 3 reviews have independent person
      expect(result.independentInvolvementRate).toBe(67);
    });

    it("calculates proportionality reassessed rate", () => {
      const result = evaluateReviewSafeguards(DEMO_REVIEWS, DEMO_RESTRICTIONS, PERIOD_END);
      expect(result.proportionalityReassessedRate).toBe(100);
    });

    it("calculates less restrictive considered rate", () => {
      const result = evaluateReviewSafeguards(DEMO_REVIEWS, DEMO_RESTRICTIONS, PERIOD_END);
      expect(result.lessRestrictiveConsideredRate).toBe(100);
    });

    it("builds review outcome breakdown", () => {
      const result = evaluateReviewSafeguards(DEMO_REVIEWS, DEMO_RESTRICTIONS, PERIOD_END);
      expect(result.reviewOutcomeBreakdown.continued).toBe(2);
      expect(result.reviewOutcomeBreakdown.modified).toBe(1);
    });

    it("gives bonus for modification/cessation outcomes", () => {
      const withModification = [
        makeReview({ outcome: "modified" }),
      ];
      const withoutModification = [
        makeReview({ outcome: "continued" }),
      ];
      const r1 = evaluateReviewSafeguards(withModification, [makeRestriction()], PERIOD_END);
      const r2 = evaluateReviewSafeguards(withoutModification, [makeRestriction()], PERIOD_END);
      expect(r1.overallScore).toBeGreaterThanOrEqual(r2.overallScore);
    });

    it("detects overdue reviews", () => {
      const reviews = [
        makeReview({ nextReviewDue: "2026-01-01" }), // overdue
      ];
      const result = evaluateReviewSafeguards(reviews, [makeRestriction()], PERIOD_END);
      expect(result.overdueReviews).toBe(1);
    });
  });

  // ── evaluateRightsProtection ───────────────────────────────────────────

  describe("evaluateRightsProtection", () => {
    it("returns max score when no restrictions", () => {
      const result = evaluateRightsProtection([], [], []);
      expect(result.overallScore).toBe(20);
    });

    it("scores well for demo data with comprehensive safeguards", () => {
      const result = evaluateRightsProtection(DEMO_SAFEGUARDS, DEMO_LEGAL, DEMO_RESTRICTIONS);
      expect(result.overallScore).toBeGreaterThanOrEqual(14);
      expect(result.advocacyRate).toBe(100);
      expect(result.ofstedNotificationRate).toBe(100);
    });

    it("calculates safeguard coverage", () => {
      const result = evaluateRightsProtection(DEMO_SAFEGUARDS, DEMO_LEGAL, DEMO_RESTRICTIONS);
      expect(result.safeguardCoverage).toBe(100);
    });

    it("calculates rights information rate", () => {
      const result = evaluateRightsProtection(DEMO_SAFEGUARDS, DEMO_LEGAL, DEMO_RESTRICTIONS);
      expect(result.rightsInformationRate).toBe(100);
    });

    it("calculates family notification rate", () => {
      const result = evaluateRightsProtection(DEMO_SAFEGUARDS, DEMO_LEGAL, DEMO_RESTRICTIONS);
      expect(result.familyNotificationRate).toBe(100);
    });

    it("penalises missing advocacy", () => {
      const safeguards = DEMO_SAFEGUARDS.filter(
        (s) => s.safeguardType !== "advocacy",
      );
      const result = evaluateRightsProtection(safeguards, DEMO_LEGAL, DEMO_RESTRICTIONS);
      expect(result.advocacyRate).toBe(0);
      expect(result.overallScore).toBeLessThan(20);
    });

    it("penalises missing safeguards", () => {
      const result = evaluateRightsProtection([], DEMO_LEGAL, DEMO_RESTRICTIONS);
      expect(result.safeguardCoverage).toBe(0);
      expect(result.advocacyRate).toBe(0);
      expect(result.overallScore).toBeLessThan(10);
    });

    it("calculates court order compliance", () => {
      const result = evaluateRightsProtection(DEMO_SAFEGUARDS, DEMO_LEGAL, DEMO_RESTRICTIONS);
      expect(result.courtOrderComplianceRate).toBe(100);
    });

    it("penalises non-notified court orders", () => {
      const legal = [
        makeLegalCompliance({
          courtOrderInPlace: true,
          localAuthorityNotified: false,
          ofstedNotified: false,
        }),
      ];
      const result = evaluateRightsProtection(DEMO_SAFEGUARDS, legal, DEMO_RESTRICTIONS);
      expect(result.courtOrderComplianceRate).toBe(0);
    });

    it("gives legal rep bonus when all court-order children have representation", () => {
      const result = evaluateRightsProtection(DEMO_SAFEGUARDS, DEMO_LEGAL, DEMO_RESTRICTIONS);
      // Morgan has legal rep and court order
      expect(result.overallScore).toBeGreaterThanOrEqual(14);
    });

    it("handles children with restrictions but no safeguards", () => {
      const restrictions = [makeRestriction()];
      const result = evaluateRightsProtection([], [], restrictions);
      expect(result.safeguardCoverage).toBe(0);
      expect(result.overallScore).toBeLessThan(10);
    });
  });

  // ── buildChildDoLSProfiles ─────────────────────────────────────────────

  describe("buildChildDoLSProfiles", () => {
    it("builds profiles for all children with restrictions", () => {
      const profiles = buildChildDoLSProfiles(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        PERIOD_END,
      );
      expect(profiles.length).toBe(2); // Morgan and Alex
    });

    it("returns empty array for no restrictions", () => {
      const profiles = buildChildDoLSProfiles([], [], [], PERIOD_END);
      expect(profiles.length).toBe(0);
    });

    it("includes correct child names", () => {
      const profiles = buildChildDoLSProfiles(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        PERIOD_END,
      );
      const names = profiles.map((p) => p.childName).sort();
      expect(names).toEqual(["Alex", "Morgan"]);
    });

    it("counts active restrictions per child", () => {
      const profiles = buildChildDoLSProfiles(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        PERIOD_END,
      );
      const morgan = profiles.find((p) => p.childId === "child-morgan")!;
      expect(morgan.activeRestrictions).toBe(2);

      const alex = profiles.find((p) => p.childId === "child-alex")!;
      expect(alex.activeRestrictions).toBe(1);
    });

    it("checks authorisation status per child", () => {
      const profiles = buildChildDoLSProfiles(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        PERIOD_END,
      );
      const morgan = profiles.find((p) => p.childId === "child-morgan")!;
      expect(morgan.allAuthorised).toBe(true);
    });

    it("detects unauthorised restrictions", () => {
      const restrictions = [
        makeRestriction({ authorisationStatus: "pending_application" }),
      ];
      const profiles = buildChildDoLSProfiles(restrictions, [], [], PERIOD_END);
      expect(profiles[0].allAuthorised).toBe(false);
    });

    it("reports worst proportionality status", () => {
      const restrictions = [
        makeRestriction({ id: "r1", childId: "c1", childName: "Test", proportionality: "proportionate" }),
        makeRestriction({ id: "r2", childId: "c1", childName: "Test", proportionality: "potentially_disproportionate" }),
      ];
      const profiles = buildChildDoLSProfiles(restrictions, [], [], PERIOD_END);
      expect(profiles[0].proportionalityStatus).toBe("potentially_disproportionate");
    });

    it("reports disproportionate as worst", () => {
      const restrictions = [
        makeRestriction({ id: "r1", childId: "c1", childName: "Test", proportionality: "proportionate" }),
        makeRestriction({ id: "r2", childId: "c1", childName: "Test", proportionality: "disproportionate" }),
      ];
      const profiles = buildChildDoLSProfiles(restrictions, [], [], PERIOD_END);
      expect(profiles[0].proportionalityStatus).toBe("disproportionate");
    });

    it("checks review status", () => {
      const profiles = buildChildDoLSProfiles(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        PERIOD_END,
      );
      const morgan = profiles.find((p) => p.childId === "child-morgan")!;
      expect(morgan.reviewsUpToDate).toBe(true);
    });

    it("detects overdue reviews", () => {
      const reviews = [
        makeReview({ childId: "child-morgan", nextReviewDue: "2026-01-01" }),
      ];
      const profiles = buildChildDoLSProfiles(
        [makeRestriction()],
        reviews,
        [],
        PERIOD_END,
      );
      expect(profiles[0].reviewsUpToDate).toBe(false);
    });

    it("counts safeguards in place", () => {
      const profiles = buildChildDoLSProfiles(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        PERIOD_END,
      );
      const morgan = profiles.find((p) => p.childId === "child-morgan")!;
      expect(morgan.safeguardsInPlace).toBe(4);
      expect(morgan.safeguardsRequired).toBe(4);
    });

    it("scores profiles 0-10", () => {
      const profiles = buildChildDoLSProfiles(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        PERIOD_END,
      );
      for (const p of profiles) {
        expect(p.overallScore).toBeGreaterThanOrEqual(0);
        expect(p.overallScore).toBeLessThanOrEqual(10);
      }
    });

    it("penalises unauthorised restrictions in profile score", () => {
      const restrictions = [
        makeRestriction({ authorisationStatus: "pending_application" }),
      ];
      const profiles = buildChildDoLSProfiles(restrictions, [], [], PERIOD_END);
      expect(profiles[0].overallScore).toBeLessThanOrEqual(5);
    });

    it("penalises disproportionate in profile score", () => {
      const restrictions = [
        makeRestriction({ proportionality: "disproportionate" }),
      ];
      const profiles = buildChildDoLSProfiles(restrictions, [], [], PERIOD_END);
      expect(profiles[0].overallScore).toBeLessThanOrEqual(5);
    });
  });

  // ── Full Integration ───────────────────────────────────────────────────

  describe("generateDeprivationOfLibertyIntelligence", () => {
    it("produces valid output for Oak House demo data", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        DEMO_LEGAL,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.homeId).toBe("oak-house");
      expect(result.periodStart).toBe(PERIOD_START);
      expect(result.periodEnd).toBe(PERIOD_END);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    });

    it("returns all 4 sub-results", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        DEMO_LEGAL,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.authorisationCompliance).toBeDefined();
      expect(result.proportionality).toBeDefined();
      expect(result.reviewSafeguards).toBeDefined();
      expect(result.rightsProtection).toBeDefined();
    });

    it("overall score is sum of 4 components", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        DEMO_LEGAL,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );

      const expectedSum =
        result.authorisationCompliance.overallScore +
        result.proportionality.overallScore +
        result.reviewSafeguards.overallScore +
        result.rightsProtection.overallScore;

      expect(result.overallScore).toBe(Math.min(expectedSum, 100));
    });

    it("produces child profiles", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        DEMO_LEGAL,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.childProfiles.length).toBe(2);
    });

    it("generates strengths for good practice", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        DEMO_LEGAL,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it("generates regulatory links", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        DEMO_LEGAL,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(8);
      expect(result.regulatoryLinks.some((l) => l.includes("ECHR Article 5"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 37"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("Reg 20"))).toBe(true);
    });

    it("generates actions when issues exist", () => {
      const restrictions = [
        makeRestriction({ authorisationStatus: "expired", proportionality: "disproportionate", bestInterestsAssessmentCompleted: false }),
      ];
      const result = generateDeprivationOfLibertyIntelligence(
        restrictions,
        [],
        [],
        [],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
    });

    it("generates areas for improvement when needed", () => {
      const restrictions = [
        makeRestriction({
          authorisationStatus: "expired",
          proportionality: "not_assessed",
          bestInterestsAssessmentCompleted: false,
        }),
      ];
      const result = generateDeprivationOfLibertyIntelligence(
        restrictions,
        [],
        [],
        [],
        "test-home",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.areasForImprovement.length).toBeGreaterThan(0);
    });

    // ── Edge Cases ─────────────────────────────────────────────────────

    it("handles empty data — maximum score (no restrictions is ideal)", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        [],
        [],
        [],
        [],
        "empty-home",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.overallScore).toBe(100);
      expect(result.rating).toBe("outstanding");
      expect(result.childProfiles.length).toBe(0);
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it("worst case — all indicators failing", () => {
      const restrictions = [
        makeRestriction({
          id: "r1",
          authorisationStatus: "expired",
          proportionality: "disproportionate",
          bestInterestsAssessmentCompleted: false,
          leastRestrictiveOptionConsidered: false,
          riskAssessmentLinked: false,
          restrictionType: "seclusion",
        }),
        makeRestriction({
          id: "r2",
          childId: "child-alex",
          childName: "Alex",
          authorisationStatus: "refused",
          proportionality: "not_assessed",
          bestInterestsAssessmentCompleted: false,
          leastRestrictiveOptionConsidered: false,
          riskAssessmentLinked: false,
          restrictionType: "chemical_restraint",
        }),
      ];

      const result = generateDeprivationOfLibertyIntelligence(
        restrictions,
        [],
        [],
        [],
        "worst-home",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.overallScore).toBeLessThan(20);
      expect(result.rating).toBe("inadequate");
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.areasForImprovement.length).toBeGreaterThan(0);
    });

    it("single child, single restriction, well-managed", () => {
      const restrictions = [makeRestriction()];
      const reviews = [makeReview()];
      const safeguards = [
        makeSafeguard({ safeguardType: "advocacy" }),
        makeSafeguard({ id: "sg-2", safeguardType: "rights_information_given" }),
        makeSafeguard({ id: "sg-3", safeguardType: "family_notification" }),
        makeSafeguard({ id: "sg-4", safeguardType: "ofsted_notification" }),
      ];
      const legal = [makeLegalCompliance()];

      const result = generateDeprivationOfLibertyIntelligence(
        restrictions,
        reviews,
        safeguards,
        legal,
        "single-home",
        PERIOD_START,
        PERIOD_END,
      );

      expect(result.overallScore).toBeGreaterThanOrEqual(60);
      expect(result.childProfiles.length).toBe(1);
    });

    it("clamped to 100 max", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        [],
        [],
        [],
        [],
        "test",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it("strength generated for no restrictions", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        [],
        [],
        [],
        [],
        "test",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No deprivation of liberty restrictions"),
        ]),
      );
    });

    it("strength for excellent authorisation", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        DEMO_LEGAL,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("authorisation compliance"),
        ]),
      );
    });

    it("action for expired authorisations starts with URGENT", () => {
      const restrictions = [makeRestriction({ authorisationStatus: "expired" })];
      const result = generateDeprivationOfLibertyIntelligence(
        restrictions,
        [],
        [],
        [],
        "test",
        PERIOD_START,
        PERIOD_END,
      );
      const urgentAction = result.actions.find((a) => a.includes("expired"));
      expect(urgentAction).toBeDefined();
      expect(urgentAction!.startsWith("URGENT")).toBe(true);
    });

    it("action for disproportionate restrictions starts with URGENT", () => {
      const restrictions = [makeRestriction({ proportionality: "disproportionate" })];
      const result = generateDeprivationOfLibertyIntelligence(
        restrictions,
        [],
        [],
        [],
        "test",
        PERIOD_START,
        PERIOD_END,
      );
      const urgentAction = result.actions.find((a) => a.includes("disproportionate"));
      expect(urgentAction).toBeDefined();
      expect(urgentAction!.startsWith("URGENT")).toBe(true);
    });

    it("area for improvement when Ofsted notification missing", () => {
      const safeguards = DEMO_SAFEGUARDS.filter(
        (s) => s.safeguardType !== "ofsted_notification",
      );
      const result = generateDeprivationOfLibertyIntelligence(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        safeguards,
        DEMO_LEGAL,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );
      expect(result.areasForImprovement).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Ofsted notification"),
        ]),
      );
    });

    it("demo data produces good or outstanding rating", () => {
      const result = generateDeprivationOfLibertyIntelligence(
        DEMO_RESTRICTIONS,
        DEMO_REVIEWS,
        DEMO_SAFEGUARDS,
        DEMO_LEGAL,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
      );
      expect(["outstanding", "good"]).toContain(result.rating);
    });
  });
});
