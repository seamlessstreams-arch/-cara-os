import { describe, it, expect } from "vitest";
import {
  pct, getRating,
  getVisitorTypeLabel, getVisitPurposeLabel, getVisitOutcomeLabel,
  getPartnershipRatingLabel, getActionStatusLabel, getRatingLabel,
  evaluateVisitQuality, evaluatePartnershipEffectiveness,
  evaluateReg44Compliance, evaluateActionResponse,
  buildChildVisitorProfiles, generateVisitorPartnershipQualityIntelligence,
} from "../visitor-partnership-quality-engine";
import type {
  VisitRecord, PartnershipAssessment, Reg44Visit, VisitorAction,
} from "../visitor-partnership-quality-engine";

// ── Helpers ──

describe("pct", () => {
  it("returns 0 when denominator is 0", () => { expect(pct(5, 0)).toBe(0); });
  it("calculates correctly", () => { expect(pct(3, 4)).toBe(75); });
  it("rounds", () => { expect(pct(1, 3)).toBe(33); });
  it("returns 100 for equal", () => { expect(pct(10, 10)).toBe(100); });
  it("returns 0 for zero num", () => { expect(pct(0, 5)).toBe(0); });
});

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); });
  it("good >= 60", () => { expect(getRating(60)).toBe("good"); });
  it("requires_improvement >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(39)).toBe("inadequate"); });
});

// ── Label Functions ──

describe("getVisitorTypeLabel", () => {
  it.each([
    ["reg44_visitor", "Reg 44 Visitor"], ["social_worker", "Social Worker"],
    ["iro", "IRO"], ["therapist", "Therapist"], ["advocate", "Advocate"],
    ["family_member", "Family Member"], ["education_professional", "Education Professional"],
    ["health_professional", "Health Professional"], ["ofsted_inspector", "Ofsted Inspector"],
    ["police_liaison", "Police Liaison"],
  ] as const)("%s → %s", (v, l) => { expect(getVisitorTypeLabel(v)).toBe(l); });
});

describe("getVisitPurposeLabel", () => {
  it.each([
    ["statutory_visit", "Statutory Visit"], ["review_meeting", "Review Meeting"],
    ["therapy_session", "Therapy Session"], ["care_planning", "Care Planning"],
    ["safeguarding", "Safeguarding"], ["education_support", "Education Support"],
    ["health_appointment", "Health Appointment"], ["family_contact", "Family Contact"],
    ["inspection", "Inspection"], ["general_support", "General Support"],
  ] as const)("%s → %s", (v, l) => { expect(getVisitPurposeLabel(v)).toBe(l); });
});

describe("getVisitOutcomeLabel", () => {
  it.each([
    ["positive", "Positive"], ["constructive", "Constructive"],
    ["concerns_raised", "Concerns Raised"], ["action_required", "Action Required"],
    ["follow_up_needed", "Follow-Up Needed"], ["cancelled", "Cancelled"], ["no_show", "No Show"],
  ] as const)("%s → %s", (v, l) => { expect(getVisitOutcomeLabel(v)).toBe(l); });
});

describe("getPartnershipRatingLabel", () => {
  it.each([
    ["excellent", "Excellent"], ["good", "Good"], ["adequate", "Adequate"], ["poor", "Poor"],
  ] as const)("%s → %s", (v, l) => { expect(getPartnershipRatingLabel(v)).toBe(l); });
});

describe("getActionStatusLabel", () => {
  it.each([
    ["completed", "Completed"], ["in_progress", "In Progress"],
    ["overdue", "Overdue"], ["not_started", "Not Started"],
  ] as const)("%s → %s", (v, l) => { expect(getActionStatusLabel(v)).toBe(l); });
});

describe("getRatingLabel", () => {
  it.each([
    ["outstanding", "Outstanding"], ["good", "Good"],
    ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"],
  ] as const)("%s → %s", (v, l) => { expect(getRatingLabel(v)).toBe(l); });
});

// ── Evaluators ──

const mkVisit = (overrides: Partial<VisitRecord> = {}): VisitRecord => ({
  id: "v1", visitorType: "social_worker", visitorName: "SW Smith", visitPurpose: "statutory_visit",
  date: "2026-03-01", childId: "c1", childName: "Alex", outcome: "positive",
  reportProvided: true, recommendationsCount: 0, childSeen: true, childSpokenToAlone: true,
  duration: 60, followUpDate: null, ...overrides,
});

describe("evaluateVisitQuality", () => {
  it("returns 0 for empty", () => {
    const r = evaluateVisitQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalVisits).toBe(0);
  });

  it("scores well for perfect visits", () => {
    const visits = [mkVisit(), mkVisit({ id: "v2", date: "2026-03-15" })];
    const r = evaluateVisitQuality(visits);
    expect(r.overallScore).toBeGreaterThanOrEqual(20);
    expect(r.positiveOutcomeRate).toBe(100);
    expect(r.childSeenRate).toBe(100);
  });

  it("penalises cancellations", () => {
    const visits = [
      mkVisit({ outcome: "cancelled", childSeen: false, childSpokenToAlone: null, reportProvided: false }),
      mkVisit({ id: "v2", outcome: "no_show", childSeen: false, childSpokenToAlone: null, reportProvided: false }),
      mkVisit({ id: "v3" }),
    ];
    const r = evaluateVisitQuality(visits);
    expect(r.cancellationRate).toBe(67);
    expect(r.overallScore).toBeLessThan(15);
  });

  it("tracks child spoken alone rate", () => {
    const visits = [
      mkVisit({ childSpokenToAlone: true }),
      mkVisit({ id: "v2", childSpokenToAlone: false }),
      mkVisit({ id: "v3", childSpokenToAlone: null }), // not applicable
    ];
    const r = evaluateVisitQuality(visits);
    expect(r.childSpokenAloneRate).toBe(50); // 1 of 2 applicable
  });

  it("tracks visitor distribution", () => {
    const visits = [
      mkVisit({ visitorType: "social_worker" }),
      mkVisit({ id: "v2", visitorType: "therapist" }),
      mkVisit({ id: "v3", visitorType: "social_worker" }),
    ];
    const r = evaluateVisitQuality(visits);
    expect(r.visitorDistribution.social_worker).toBe(2);
    expect(r.visitorDistribution.therapist).toBe(1);
  });

  it("caps at 25", () => {
    const visits = Array.from({ length: 20 }, (_, i): VisitRecord => mkVisit({ id: `v${i}` }));
    const r = evaluateVisitQuality(visits);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });
});

const mkPartnership = (overrides: Partial<PartnershipAssessment> = {}): PartnershipAssessment => ({
  id: "pa1", partnerAgency: "CAMHS", partnerType: "therapist", assessmentDate: "2026-03-01",
  partnershipRating: "excellent", informationSharingEffective: true, jointPlanningEvident: true,
  responsiveToRequests: true, attendsReviewMeetings: true, childFocused: true, challengeAccepted: true,
  ...overrides,
});

describe("evaluatePartnershipEffectiveness", () => {
  it("returns 0 for empty", () => {
    const r = evaluatePartnershipEffectiveness([]);
    expect(r.overallScore).toBe(0);
  });

  it("scores well for excellent partnerships", () => {
    const r = evaluatePartnershipEffectiveness([mkPartnership(), mkPartnership({ id: "pa2" })]);
    expect(r.overallScore).toBe(25);
    expect(r.excellentGoodRate).toBe(100);
  });

  it("handles poor partnerships", () => {
    const r = evaluatePartnershipEffectiveness([
      mkPartnership({ partnershipRating: "poor", informationSharingEffective: false, jointPlanningEvident: false, responsiveToRequests: false, childFocused: false, challengeAccepted: false }),
    ]);
    expect(r.excellentGoodRate).toBe(0);
    expect(r.overallScore).toBeLessThan(10);
  });

  it("calculates mixed ratings", () => {
    const r = evaluatePartnershipEffectiveness([
      mkPartnership(),
      mkPartnership({ id: "pa2", partnershipRating: "poor", childFocused: false }),
    ]);
    expect(r.excellentGoodRate).toBe(50);
    expect(r.childFocusedRate).toBe(50);
  });
});

const mkReg44 = (overrides: Partial<Reg44Visit> = {}): Reg44Visit => ({
  id: "r1", visitDate: "2026-03-01", visitorName: "IV Smith", childrenInterviewed: 3,
  totalChildren: 3, staffInterviewed: 2, reportTimely: true, issuesRaised: 1,
  issuesResolved: 1, previousRecommendationsReviewed: true, overallPositive: true,
  ...overrides,
});

describe("evaluateReg44Compliance", () => {
  it("returns 0 for empty", () => {
    const r = evaluateReg44Compliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalVisits).toBe(0);
  });

  it("scores well for compliant visits", () => {
    const r = evaluateReg44Compliance([mkReg44(), mkReg44({ id: "r2" })]);
    expect(r.overallScore).toBeGreaterThanOrEqual(20);
    expect(r.childInterviewRate).toBe(100);
    expect(r.reportTimelyRate).toBe(100);
  });

  it("tracks issue resolution", () => {
    const r = evaluateReg44Compliance([
      mkReg44({ issuesRaised: 4, issuesResolved: 2 }),
    ]);
    expect(r.issueResolutionRate).toBe(50);
  });

  it("handles late reports", () => {
    const r = evaluateReg44Compliance([
      mkReg44({ reportTimely: false }),
      mkReg44({ id: "r2", reportTimely: true }),
    ]);
    expect(r.reportTimelyRate).toBe(50);
  });

  it("tracks child interview rate across visits", () => {
    const r = evaluateReg44Compliance([
      mkReg44({ childrenInterviewed: 2, totalChildren: 3 }),
      mkReg44({ id: "r2", childrenInterviewed: 1, totalChildren: 3 }),
    ]);
    expect(r.childInterviewRate).toBe(50); // 3 of 6
  });
});

const mkAction = (overrides: Partial<VisitorAction> = {}): VisitorAction => ({
  id: "a1", visitId: "v1", visitorType: "social_worker", description: "Action",
  assignedTo: "Darren", dueDate: "2026-04-01", status: "completed",
  completedDate: "2026-03-25", ...overrides,
});

describe("evaluateActionResponse", () => {
  it("returns 0 for empty", () => {
    const r = evaluateActionResponse([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalActions).toBe(0);
  });

  it("scores well for all completed", () => {
    const r = evaluateActionResponse([mkAction(), mkAction({ id: "a2" })]);
    expect(r.completedRate).toBe(100);
    expect(r.overdueCount).toBe(0);
    expect(r.overallScore).toBeGreaterThanOrEqual(15);
  });

  it("penalises overdue actions", () => {
    const r = evaluateActionResponse([
      mkAction({ status: "overdue", completedDate: null }),
      mkAction({ id: "a2", status: "overdue", completedDate: null }),
      mkAction({ id: "a3", status: "overdue", completedDate: null }),
    ]);
    expect(r.overdueCount).toBe(3);
    expect(r.completedRate).toBe(0);
  });

  it("tracks completion by visitor type", () => {
    const r = evaluateActionResponse([
      mkAction({ visitorType: "social_worker" }),
      mkAction({ id: "a2", visitorType: "social_worker", status: "overdue", completedDate: null }),
      mkAction({ id: "a3", visitorType: "reg44_visitor" }),
    ]);
    expect(r.completionByVisitorType.social_worker).toBe(50);
    expect(r.completionByVisitorType.reg44_visitor).toBe(100);
  });

  it("counts in-progress actions", () => {
    const r = evaluateActionResponse([
      mkAction({ status: "in_progress", completedDate: null }),
    ]);
    expect(r.inProgressCount).toBe(1);
  });
});

// ── Child Profiles ──

describe("buildChildVisitorProfiles", () => {
  it("returns empty for no visits", () => {
    expect(buildChildVisitorProfiles([])).toEqual([]);
  });

  it("returns empty for visits without childId", () => {
    expect(buildChildVisitorProfiles([mkVisit({ childId: null, childName: null })])).toEqual([]);
  });

  it("builds profile from child-specific visits", () => {
    const visits = [
      mkVisit({ childId: "c1", childName: "Alex", visitorType: "social_worker" }),
      mkVisit({ id: "v2", childId: "c1", childName: "Alex", visitorType: "therapist" }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].socialWorkerVisits).toBe(1);
    expect(profiles[0].therapistVisits).toBe(1);
    expect(profiles[0].totalVisits).toBe(2);
  });

  it("builds profiles for multiple children", () => {
    const visits = [
      mkVisit({ childId: "c1", childName: "Alex" }),
      mkVisit({ id: "v2", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles).toHaveLength(2);
  });

  it("calculates child seen rate per child", () => {
    const visits = [
      mkVisit({ childId: "c1", childSeen: true }),
      mkVisit({ id: "v2", childId: "c1", childSeen: false }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles[0].childSeenRate).toBe(50);
  });

  it("caps profile score at 10", () => {
    const visits = Array.from({ length: 10 }, (_, i): VisitRecord => mkVisit({
      id: `v${i}`, childId: "c1", childName: "Alex",
      visitorType: i % 2 === 0 ? "social_worker" : "therapist",
    }));
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });
});

// ── Main Function ──

describe("generateVisitorPartnershipQualityIntelligence", () => {
  const goodVisits: VisitRecord[] = [
    mkVisit({ childId: "c1", childName: "Alex" }),
    mkVisit({ id: "v2", childId: "c1", childName: "Alex", visitorType: "therapist", visitPurpose: "therapy_session" }),
    mkVisit({ id: "v3", childId: "c2", childName: "Jordan", visitorType: "social_worker" }),
  ];
  const goodPartnerships: PartnershipAssessment[] = [mkPartnership()];
  const goodReg44s: Reg44Visit[] = [mkReg44()];
  const goodActions: VisitorAction[] = [mkAction(), mkAction({ id: "a2" })];

  it("returns correct structure", () => {
    const r = generateVisitorPartnershipQualityIntelligence(
      goodVisits, goodPartnerships, goodReg44s, goodActions, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.homeId).toBe("oak-house");
    expect(r).toHaveProperty("overallScore");
    expect(r).toHaveProperty("rating");
    expect(r).toHaveProperty("visitQuality");
    expect(r).toHaveProperty("partnershipEffectiveness");
    expect(r).toHaveProperty("reg44Compliance");
    expect(r).toHaveProperty("actionResponse");
    expect(r).toHaveProperty("childProfiles");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("areasForImprovement");
    expect(r).toHaveProperty("actions");
    expect(r).toHaveProperty("regulatoryLinks");
  });

  it("scores well for good data", () => {
    const r = generateVisitorPartnershipQualityIntelligence(
      goodVisits, goodPartnerships, goodReg44s, goodActions, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(60);
    expect(r.rating).toBe("outstanding");
  });

  it("scores inadequate for empty data", () => {
    const r = generateVisitorPartnershipQualityIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("caps at 100", () => {
    const r = generateVisitorPartnershipQualityIntelligence(
      goodVisits, goodPartnerships, goodReg44s, goodActions, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates strengths for good data", () => {
    const r = generateVisitorPartnershipQualityIntelligence(
      goodVisits, goodPartnerships, goodReg44s, goodActions, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions for no Reg 44 visits", () => {
    const r = generateVisitorPartnershipQualityIntelligence(
      goodVisits, goodPartnerships, [], goodActions, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.actions.some((a) => a.includes("URGENT") && a.includes("Reg 44"))).toBe(true);
  });

  it("includes regulatory links", () => {
    const r = generateVisitorPartnershipQualityIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 44"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 45"))).toBe(true);
  });

  it("generates child profiles", () => {
    const r = generateVisitorPartnershipQualityIntelligence(
      goodVisits, goodPartnerships, goodReg44s, goodActions, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.childProfiles.length).toBe(2);
  });

  it("generates areas for improvement for problem data", () => {
    const badVisits = [
      mkVisit({ childSeen: false, outcome: "cancelled", reportProvided: false }),
    ];
    const r = generateVisitorPartnershipQualityIntelligence(
      badVisits, [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
});
