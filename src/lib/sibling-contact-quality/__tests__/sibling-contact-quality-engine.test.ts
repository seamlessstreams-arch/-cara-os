import { describe, it, expect } from "vitest";
import {
  generateSiblingContactQualityIntelligence,
  evaluateContactFrequency,
  evaluateContactQuality,
  evaluateReviewCompliance,
  evaluateStaffReadiness,
  buildChildSiblingProfiles,
  pct,
  getRating,
  getContactTypeLabel,
  getContactQualityLabel,
  getBarrierTypeLabel,
  getContactOutcomeLabel,
  getFrequencyComplianceLabel,
  getRatingLabel,
} from "../sibling-contact-quality-engine";
import type {
  SiblingRelationship,
  SiblingContactSession,
  SiblingContactReview,
  StaffSiblingTraining,
} from "../sibling-contact-quality-engine";

// ── Helpers ───────────────────────────────────────────────────────────────

function mkRelationship(overrides: Partial<SiblingRelationship> = {}): SiblingRelationship {
  return {
    id: "sr-1",
    childId: "child-1",
    childName: "Alex",
    siblingId: "sib-1",
    siblingName: "Sam",
    siblingPlacement: "different_home",
    contactPlanExists: true,
    plannedFrequency: "Monthly",
    frequencyCompliance: "meets_plan",
    lastContactDate: "2026-04-15",
    relationshipQuality: "strong",
    ...overrides,
  };
}

function mkSession(overrides: Partial<SiblingContactSession> = {}): SiblingContactSession {
  return {
    id: "sc-1",
    childId: "child-1",
    childName: "Alex",
    siblingId: "sib-1",
    siblingName: "Sam",
    date: "2026-04-15",
    contactType: "face_to_face",
    duration: 60,
    qualityRating: "good",
    outcome: "positive",
    childViewSought: true,
    childEnjoyedContact: true,
    siblingViewSought: true,
    facilitatedBy: "Sarah Johnson",
    barriers: ["none"],
    followUpActions: [],
    ...overrides,
  };
}

function mkReview(overrides: Partial<SiblingContactReview> = {}): SiblingContactReview {
  return {
    id: "scr-1",
    childId: "child-1",
    childName: "Alex",
    reviewDate: "2026-04-01",
    reviewedBy: "Darren Laville",
    allSiblingsConsidered: true,
    contactPlanUpdated: true,
    childViewsIncluded: true,
    barriersAddressed: true,
    outcomeSatisfactory: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffSiblingTraining> = {}): StaffSiblingTraining {
  return {
    id: "sst-1",
    staffId: "staff-1",
    staffName: "Staff A",
    siblingRelationshipAwareness: true,
    facilitatingContactSkills: true,
    managingDifficultContact: true,
    childViewsTraining: true,
    legalFrameworkKnowledge: true,
    ...overrides,
  };
}

// ── pct ───────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 for 0/0", () => expect(pct(0, 0)).toBe(0));
  it("calculates correctly", () => expect(pct(3, 4)).toBe(75));
  it("rounds", () => expect(pct(1, 3)).toBe(33));
  it("full", () => expect(pct(5, 5)).toBe(100));
});

// ── getRating ─────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("outstanding >= 80", () => expect(getRating(80)).toBe("outstanding"));
  it("good >= 60", () => expect(getRating(60)).toBe("good"));
  it("requires_improvement >= 40", () => expect(getRating(40)).toBe("requires_improvement"));
  it("inadequate < 40", () => expect(getRating(39)).toBe("inadequate"));
});

// ── Label functions ───────────────────────────────────────────────────────

describe("label functions", () => {
  it("contact type labels", () => {
    expect(getContactTypeLabel("face_to_face")).toBe("Face to Face");
    expect(getContactTypeLabel("overnight_stay")).toBe("Overnight Stay");
  });
  it("quality labels", () => {
    expect(getContactQualityLabel("excellent")).toBe("Excellent");
    expect(getContactQualityLabel("harmful")).toBe("Harmful");
  });
  it("barrier labels", () => {
    expect(getBarrierTypeLabel("distance")).toBe("Distance");
    expect(getBarrierTypeLabel("safeguarding_concern")).toBe("Safeguarding Concern");
  });
  it("outcome labels", () => {
    expect(getContactOutcomeLabel("positive")).toBe("Positive");
    expect(getContactOutcomeLabel("no_show")).toBe("No Show");
  });
  it("frequency compliance labels", () => {
    expect(getFrequencyComplianceLabel("meets_plan")).toBe("Meets Plan");
    expect(getFrequencyComplianceLabel("significantly_below")).toBe("Significantly Below");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateContactFrequency ──────────────────────────────────────────────

describe("evaluateContactFrequency", () => {
  it("returns 0 for empty relationships", () => {
    const result = evaluateContactFrequency([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRelationships).toBe(0);
  });

  it("scores high for all plans in place and met", () => {
    const rels = [mkRelationship(), mkRelationship({ id: "sr-2", siblingId: "sib-2", siblingName: "Jo" })];
    const result = evaluateContactFrequency(rels);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.contactPlanRate).toBe(100);
    expect(result.meetsOrExceedsPlanRate).toBe(100);
  });

  it("scores low when no contact plans", () => {
    const rels = [mkRelationship({ contactPlanExists: false, frequencyCompliance: "no_plan" })];
    const result = evaluateContactFrequency(rels);
    expect(result.overallScore).toBeLessThan(10);
    expect(result.noPlanRate).toBe(100);
  });

  it("penalises significantly below plan", () => {
    const rels = [mkRelationship({ frequencyCompliance: "significantly_below" })];
    const result = evaluateContactFrequency(rels);
    expect(result.significantlyBelowRate).toBe(100);
    expect(result.overallScore).toBeLessThan(20);
  });

  it("counts same home vs separated", () => {
    const rels = [
      mkRelationship({ id: "sr-1", siblingPlacement: "same_home" }),
      mkRelationship({ id: "sr-2", siblingPlacement: "different_home" }),
      mkRelationship({ id: "sr-3", siblingPlacement: "birth_family" }),
    ];
    const result = evaluateContactFrequency(rels);
    expect(result.sameHomeSiblings).toBe(1);
    expect(result.separatedSiblings).toBe(2);
  });

  it("gives bonus for exceeds plan", () => {
    const rels = [mkRelationship({ frequencyCompliance: "exceeds_plan" })];
    const result = evaluateContactFrequency(rels);
    expect(result.meetsOrExceedsPlanRate).toBe(100);
  });

  it("score capped at 25", () => {
    const result = evaluateContactFrequency([mkRelationship()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateContactQuality ────────────────────────────────────────────────

describe("evaluateContactQuality", () => {
  it("returns 0 for empty sessions", () => {
    const result = evaluateContactQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
  });

  it("scores high for all positive sessions", () => {
    const sessions = [mkSession(), mkSession({ id: "sc-2" })];
    const result = evaluateContactQuality(sessions);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.excellentGoodRate).toBe(100);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("scores low for poor quality sessions", () => {
    const sessions = [
      mkSession({ qualityRating: "poor", outcome: "negative", childViewSought: false, childEnjoyedContact: false }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.overallScore).toBeLessThan(10);
    expect(result.excellentGoodRate).toBe(0);
  });

  it("calculates cancellation rate", () => {
    const sessions = [
      mkSession({ id: "sc-1", outcome: "positive" }),
      mkSession({ id: "sc-2", outcome: "cancelled_by_child" }),
      mkSession({ id: "sc-3", outcome: "cancelled_by_authority" }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.cancellationRate).toBe(67);
  });

  it("calculates child enjoyed rate from non-null values", () => {
    const sessions = [
      mkSession({ id: "sc-1", childEnjoyedContact: true }),
      mkSession({ id: "sc-2", childEnjoyedContact: false }),
      mkSession({ id: "sc-3", childEnjoyedContact: null }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.childEnjoyedRate).toBe(50);
  });

  it("calculates average duration", () => {
    const sessions = [
      mkSession({ id: "sc-1", duration: 60 }),
      mkSession({ id: "sc-2", duration: 90 }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.averageDuration).toBe(75);
  });

  it("gives bonus for zero cancellations", () => {
    const full = evaluateContactQuality([mkSession({ outcome: "positive" })]);
    const cancelled = evaluateContactQuality([mkSession({ outcome: "cancelled_by_child" })]);
    expect(full.overallScore).toBeGreaterThan(cancelled.overallScore);
  });

  it("score capped at 25", () => {
    const result = evaluateContactQuality([mkSession()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateReviewCompliance ──────────────────────────────────────────────

describe("evaluateReviewCompliance", () => {
  it("returns 0 for empty reviews", () => {
    const result = evaluateReviewCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalReviews).toBe(0);
  });

  it("scores high for fully compliant reviews", () => {
    const reviews = [mkReview(), mkReview({ id: "scr-2" })];
    const result = evaluateReviewCompliance(reviews);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.allSiblingsConsideredRate).toBe(100);
    expect(result.childViewsIncludedRate).toBe(100);
  });

  it("scores low for non-compliant reviews", () => {
    const reviews = [
      mkReview({
        allSiblingsConsidered: false,
        contactPlanUpdated: false,
        childViewsIncluded: false,
        barriersAddressed: false,
        outcomeSatisfactory: false,
      }),
    ];
    const result = evaluateReviewCompliance(reviews);
    expect(result.overallScore).toBe(0);
  });

  it("handles mixed reviews", () => {
    const reviews = [
      mkReview({ id: "scr-1" }),
      mkReview({ id: "scr-2", allSiblingsConsidered: false, barriersAddressed: false }),
    ];
    const result = evaluateReviewCompliance(reviews);
    expect(result.allSiblingsConsideredRate).toBe(50);
    expect(result.barriersAddressedRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateReviewCompliance([mkReview()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffReadiness ────────────────────────────────────────────────

describe("evaluateStaffReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "sst-2", staffId: "s2" })];
    const result = evaluateStaffReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.siblingAwarenessRate).toBe(100);
  });

  it("scores low for untrained staff", () => {
    const training = [
      mkTraining({
        siblingRelationshipAwareness: false,
        facilitatingContactSkills: false,
        managingDifficultContact: false,
        childViewsTraining: false,
        legalFrameworkKnowledge: false,
      }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial rates", () => {
    const training = [
      mkTraining({ id: "sst-1", staffId: "s1" }),
      mkTraining({ id: "sst-2", staffId: "s2", siblingRelationshipAwareness: false, legalFrameworkKnowledge: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.siblingAwarenessRate).toBe(50);
    expect(result.legalKnowledgeRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffReadiness([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── buildChildSiblingProfiles ─────────────────────────────────────────────

describe("buildChildSiblingProfiles", () => {
  it("returns empty for no relationships", () => {
    expect(buildChildSiblingProfiles([], [])).toEqual([]);
  });

  it("groups by child", () => {
    const rels = [
      mkRelationship({ id: "sr-1", childId: "child-1", childName: "Alex" }),
      mkRelationship({ id: "sr-2", childId: "child-1", childName: "Alex", siblingId: "sib-2" }),
      mkRelationship({ id: "sr-3", childId: "child-2", childName: "Jordan" }),
    ];
    const profiles = buildChildSiblingProfiles(rels, []);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-1");
    expect(alex!.siblingCount).toBe(2);
  });

  it("counts separated siblings", () => {
    const rels = [
      mkRelationship({ id: "sr-1", siblingPlacement: "same_home" }),
      mkRelationship({ id: "sr-2", siblingPlacement: "different_home", siblingId: "sib-2" }),
    ];
    const profiles = buildChildSiblingProfiles(rels, []);
    expect(profiles[0].separatedCount).toBe(1);
  });

  it("counts sessions in period", () => {
    const rels = [mkRelationship()];
    const sessions = [
      mkSession({ id: "sc-1", childId: "child-1" }),
      mkSession({ id: "sc-2", childId: "child-1" }),
    ];
    const profiles = buildChildSiblingProfiles(rels, sessions);
    expect(profiles[0].sessionsInPeriod).toBe(2);
  });

  it("calculates positive outcome rate", () => {
    const rels = [mkRelationship()];
    const sessions = [
      mkSession({ id: "sc-1", childId: "child-1", outcome: "positive" }),
      mkSession({ id: "sc-2", childId: "child-1", outcome: "mixed" }),
    ];
    const profiles = buildChildSiblingProfiles(rels, sessions);
    expect(profiles[0].positiveOutcomeRate).toBe(50);
  });

  it("determines contact plan compliance", () => {
    const meetsRels = [mkRelationship({ frequencyCompliance: "meets_plan" })];
    const belowRels = [mkRelationship({ frequencyCompliance: "below_plan" })];
    const meetsProfiles = buildChildSiblingProfiles(meetsRels, []);
    const belowProfiles = buildChildSiblingProfiles(belowRels, []);
    expect(meetsProfiles[0].meetsContactPlan).toBe(true);
    expect(belowProfiles[0].meetsContactPlan).toBe(false);
  });

  it("score capped at 10", () => {
    const rels = [mkRelationship()];
    const sessions = [mkSession({ childId: "child-1" })];
    const profiles = buildChildSiblingProfiles(rels, sessions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });
});

// ── generateSiblingContactQualityIntelligence ─────────────────────────────

describe("generateSiblingContactQualityIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateSiblingContactQualityIntelligence(
      [mkRelationship()], [mkSession()], [mkReview()], [mkTraining()],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(
      result.contactFrequency.overallScore +
      result.contactQuality.overallScore +
      result.reviewCompliance.overallScore +
      result.staffReadiness.overallScore,
    );
  });

  it("returns inadequate with no data", () => {
    const result = generateSiblingContactQualityIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const rels = [mkRelationship(), mkRelationship({ id: "sr-2", childId: "child-2", childName: "Jordan" })];
    const sessions = Array.from({ length: 6 }, (_, i) => mkSession({ id: `sc-${i}` }));
    const reviews = [mkReview()];
    const training = [mkTraining(), mkTraining({ id: "sst-2", staffId: "s2" })];
    const result = generateSiblingContactQualityIntelligence(
      rels, sessions, reviews, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generateSiblingContactQualityIntelligence(
      [mkRelationship()], [mkSession()], [mkReview()], [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateSiblingContactQualityIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  // ── Strengths ──

  it("adds strength for contact plans", () => {
    const rels = [mkRelationship({ contactPlanExists: true })];
    const result = generateSiblingContactQualityIntelligence(rels, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Contact plans"))).toBe(true);
  });

  it("adds strength for child views sought", () => {
    const sessions = Array.from({ length: 3 }, (_, i) => mkSession({ id: `sc-${i}`, childViewSought: true }));
    const result = generateSiblingContactQualityIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("views consistently sought"))).toBe(true);
  });

  it("adds strength for no cancellations", () => {
    const sessions = [mkSession({ outcome: "positive" })];
    const result = generateSiblingContactQualityIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("No cancelled"))).toBe(true);
  });

  // ── Areas for improvement ──

  it("adds area for no relationships documented", () => {
    const result = generateSiblingContactQualityIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No sibling relationships documented"))).toBe(true);
  });

  it("adds area for no training", () => {
    const result = generateSiblingContactQualityIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No staff training"))).toBe(true);
  });

  // ── Actions ──

  it("adds URGENT for separated siblings with no contact", () => {
    const rels = [mkRelationship({ siblingPlacement: "different_home", lastContactDate: null })];
    const result = generateSiblingContactQualityIntelligence(rels, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("no recorded contact"))).toBe(true);
  });

  it("adds URGENT for harmful contact", () => {
    const sessions = [mkSession({ qualityRating: "harmful" })];
    const result = generateSiblingContactQualityIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("harmful"))).toBe(true);
  });

  it("adds URGENT for no contact plan", () => {
    const rels = [mkRelationship({ contactPlanExists: false, frequencyCompliance: "no_plan" })];
    const result = generateSiblingContactQualityIntelligence(rels, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("no contact plan"))).toBe(true);
  });

  // ── Regulatory links ──

  it("includes all regulatory links", () => {
    const result = generateSiblingContactQualityIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 13"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989, s34"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Adoption"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 8"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 9"))).toBe(true);
  });

  // ── Integration ──

  it("handles realistic mixed scenario", () => {
    const rels = [
      mkRelationship({ id: "sr-1", childId: "child-alex", childName: "Alex", siblingId: "sib-sam", siblingName: "Sam", siblingPlacement: "different_home", frequencyCompliance: "meets_plan" }),
      mkRelationship({ id: "sr-2", childId: "child-jordan", childName: "Jordan", siblingId: "sib-casey", siblingName: "Casey", siblingPlacement: "birth_family", frequencyCompliance: "below_plan" }),
      mkRelationship({ id: "sr-3", childId: "child-morgan", childName: "Morgan", siblingId: "sib-riley", siblingName: "Riley", siblingPlacement: "same_home", frequencyCompliance: "meets_plan" }),
    ];
    const sessions = [
      mkSession({ id: "sc-1", childId: "child-alex" }),
      mkSession({ id: "sc-2", childId: "child-alex", outcome: "positive", qualityRating: "excellent" }),
      mkSession({ id: "sc-3", childId: "child-jordan", outcome: "mixed", qualityRating: "adequate" }),
    ];
    const reviews = [mkReview({ childId: "child-alex" })];
    const training = [
      mkTraining({ id: "sst-1", staffId: "s1", staffName: "Sarah Johnson" }),
      mkTraining({ id: "sst-2", staffId: "s2", staffName: "Tom Richards" }),
    ];
    const result = generateSiblingContactQualityIntelligence(
      rels, sessions, reviews, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
  });
});
