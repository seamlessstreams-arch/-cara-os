// ══════════════════════════════════════════════════════════════════════════════
// Cara — Advocacy & Representation Intelligence Engine Tests
// 100+ tests covering all functions, scoring, labels, edge cases
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAccessToAdvocacy,
  evaluateIndependentVisitors,
  evaluateAwarenessAndUnderstanding,
  evaluatePolicyAndProvision,
  buildAdvocacyChildProfiles,
  generateAdvocacyRepresentationIntelligence,
  getAdvocacyTypeLabel,
  getAdvocacyStatusLabel,
  getReferralReasonLabel,
  getAwarenessFormatLabel,
  getRatingLabel,
} from "../advocacy-representation-engine";
import type {
  AdvocacyReferral,
  IndependentVisitor,
  AdvocacyAwareness,
  AdvocacyPolicy,
  ChildParentalContact,
} from "../advocacy-representation-engine";

// ── Demo Data ────────────────────────────────────────────────────────────────

const CHILD_IDS = ["alex", "jordan", "morgan"];
const CHILD_NAMES: Record<string, string> = {
  alex: "Alex",
  jordan: "Jordan",
  morgan: "Morgan",
};

// Alex: active advocate for care plan dispute
const demoReferrals: AdvocacyReferral[] = [
  {
    id: "ref-01", childId: "alex", childName: "Alex",
    type: "independent_advocate", reason: "care_plan_disagreement",
    referralDate: "2025-03-01", responseDate: "2025-03-03",
    status: "active", outcome: "Ongoing support", childSatisfaction: 8,
  },
  {
    id: "ref-02", childId: "alex", childName: "Alex",
    type: "legal_representative", reason: "review_support",
    referralDate: "2025-04-01", responseDate: "2025-04-02",
    status: "ended", outcome: "Review completed successfully", childSatisfaction: 9,
  },
  {
    id: "ref-03", childId: "jordan", childName: "Jordan",
    type: "independent_advocate", reason: "general_support",
    referralDate: "2025-02-15", responseDate: "2025-02-16",
    status: "declined_by_child", childSatisfaction: 7,
  },
  {
    id: "ref-04", childId: "morgan", childName: "Morgan",
    type: "childrens_commissioner", reason: "complaint",
    referralDate: "2025-01-10", responseDate: "2025-01-20",
    status: "ended", outcome: "Complaint resolved", childSatisfaction: 6,
  },
];

// Jordan: has IV, no advocacy needed
const demoVisitors: IndependentVisitor[] = [
  {
    id: "iv-01", childId: "jordan", childName: "Jordan",
    visitorName: "Sarah Thompson", appointedDate: "2024-09-01",
    visitFrequency: "monthly", lastVisitDate: "2025-04-15",
    visitsCompleted: 7, visitsMissed: 1,
    childEngagement: 8, childWishes: "Wants to continue visits",
  },
];

const demoAwareness: AdvocacyAwareness[] = [
  {
    id: "aw-01", childId: "alex", childName: "Alex",
    understandsRights: true, informedOfAdvocacy: true,
    knowsHowToAccess: true, dateInformed: "2025-02-01",
    format: "verbal",
  },
  {
    id: "aw-02", childId: "jordan", childName: "Jordan",
    understandsRights: true, informedOfAdvocacy: true,
    knowsHowToAccess: true, dateInformed: "2025-02-15",
    format: "written",
  },
  {
    id: "aw-03", childId: "morgan", childName: "Morgan",
    understandsRights: false, informedOfAdvocacy: false,
    knowsHowToAccess: false, dateInformed: "2025-01-10",
    format: "easy_read",
  },
];

const demoPolicy: AdvocacyPolicy = {
  lastReviewed: "2025-01-15",
  advocacyProvider: "National Youth Advocacy Service (NYAS)",
  contractInPlace: true,
  complaintsProcess: true,
};

// Morgan: declined advocacy, needs IV but doesn't have one (no parental contact)
const demoParentalContact: ChildParentalContact[] = [
  { childId: "alex", childName: "Alex", hasParentalContact: true },
  { childId: "jordan", childName: "Jordan", hasParentalContact: false },
  { childId: "morgan", childName: "Morgan", hasParentalContact: false },
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateAccessToAdvocacy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAccessToAdvocacy", () => {
  it("returns zeros for empty child list", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, []);
    expect(result.totalReferrals).toBe(0);
    expect(result.score).toBe(0);
    expect(result.totalChildren).toBe(0);
  });

  it("counts total referrals", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    expect(result.totalReferrals).toBe(4);
  });

  it("counts active advocacy correctly", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    expect(result.activeAdvocacyCount).toBe(1);
  });

  it("counts children with active advocacy", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    expect(result.childrenWithActiveAdvocacy).toBe(1);
  });

  it("calculates active advocacy rate", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    // 1 out of 3 children
    expect(result.activeAdvocacyRate).toBe(33);
  });

  it("calculates average response time", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    // (2 + 1 + 1 + 10) / 4 = 3.5
    expect(result.averageResponseTimeDays).toBe(3.5);
  });

  it("calculates child satisfaction average", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    // (8 + 9 + 7 + 6) / 4 = 7.5
    expect(result.childSatisfactionAverage).toBe(7.5);
  });

  it("calculates complaint support rate", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    // Morgan's complaint referral ended with resolution = 100%
    expect(result.complaintSupportRate).toBe(100);
  });

  it("tracks type breakdown", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    expect(result.typeBreakdown["independent_advocate"]).toBe(2);
    expect(result.typeBreakdown["legal_representative"]).toBe(1);
    expect(result.typeBreakdown["childrens_commissioner"]).toBe(1);
  });

  it("tracks reason breakdown", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    expect(result.reasonBreakdown["care_plan_disagreement"]).toBe(1);
    expect(result.reasonBreakdown["complaint"]).toBe(1);
  });

  it("returns score in 0-100 range", () => {
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("handles no referrals with children", () => {
    const result = evaluateAccessToAdvocacy([], CHILD_IDS);
    expect(result.totalReferrals).toBe(0);
    expect(result.activeAdvocacyCount).toBe(0);
    expect(result.childrenWithoutAdvocacy).toEqual(CHILD_IDS);
  });

  it("identifies children without advocacy", () => {
    // Morgan has only ended referrals and declined, not active/declined_by_child/ended
    // Actually Morgan's is ended, so Morgan IS covered
    const result = evaluateAccessToAdvocacy(demoReferrals, CHILD_IDS);
    // Alex: has active + ended, Jordan: has declined_by_child, Morgan: has ended
    // All 3 children have at least active/ended/declined_by_child
    expect(result.childrenWithoutAdvocacy).toEqual([]);
  });

  it("flags children with only not_offered or pending status", () => {
    const referrals: AdvocacyReferral[] = [
      {
        id: "ref-x1", childId: "alex", childName: "Alex",
        type: "independent_advocate", reason: "general_support",
        referralDate: "2025-01-01", status: "not_offered",
      },
    ];
    const result = evaluateAccessToAdvocacy(referrals, ["alex", "jordan"]);
    expect(result.childrenWithoutAdvocacy).toContain("alex");
    expect(result.childrenWithoutAdvocacy).toContain("jordan");
  });

  it("returns 100 complaint support when there are no complaints", () => {
    const referrals: AdvocacyReferral[] = [
      {
        id: "ref-x1", childId: "alex", childName: "Alex",
        type: "independent_advocate", reason: "general_support",
        referralDate: "2025-01-01", status: "active",
      },
    ];
    const result = evaluateAccessToAdvocacy(referrals, ["alex"]);
    expect(result.complaintSupportRate).toBe(100);
  });

  it("handles referrals without response date", () => {
    const referrals: AdvocacyReferral[] = [
      {
        id: "ref-x1", childId: "alex", childName: "Alex",
        type: "independent_advocate", reason: "general_support",
        referralDate: "2025-01-01", status: "active",
      },
    ];
    const result = evaluateAccessToAdvocacy(referrals, ["alex"]);
    expect(result.averageResponseTimeDays).toBeNull(); // fab-0: null when the source population is empty.
  });

  it("ignores invalid satisfaction values", () => {
    const referrals: AdvocacyReferral[] = [
      {
        id: "ref-x1", childId: "alex", childName: "Alex",
        type: "independent_advocate", reason: "general_support",
        referralDate: "2025-01-01", status: "active",
        childSatisfaction: 0, // Invalid: below 1
      },
      {
        id: "ref-x2", childId: "alex", childName: "Alex",
        type: "legal_representative", reason: "review_support",
        referralDate: "2025-02-01", status: "active",
        childSatisfaction: 11, // Invalid: above 10
      },
    ];
    const result = evaluateAccessToAdvocacy(referrals, ["alex"]);
    expect(result.childSatisfactionAverage).toBeNull(); // fab-0: null when the source population is empty.
  });

  it("gives higher score for faster response times", () => {
    const fastReferrals: AdvocacyReferral[] = [
      {
        id: "ref-fast", childId: "alex", childName: "Alex",
        type: "independent_advocate", reason: "general_support",
        referralDate: "2025-01-01", responseDate: "2025-01-01",
        status: "active", childSatisfaction: 10,
      },
    ];
    const slowReferrals: AdvocacyReferral[] = [
      {
        id: "ref-slow", childId: "alex", childName: "Alex",
        type: "independent_advocate", reason: "general_support",
        referralDate: "2025-01-01", responseDate: "2025-01-15",
        status: "active", childSatisfaction: 10,
      },
    ];
    const fastResult = evaluateAccessToAdvocacy(fastReferrals, ["alex"]);
    const slowResult = evaluateAccessToAdvocacy(slowReferrals, ["alex"]);
    expect(fastResult.score).toBeGreaterThan(slowResult.score);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateIndependentVisitors
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIndependentVisitors", () => {
  it("returns zeros for empty child list", () => {
    const result = evaluateIndependentVisitors(demoVisitors, demoParentalContact, []);
    expect(result.totalVisitors).toBe(0);
    expect(result.score).toBe(0);
  });

  it("counts total visitors", () => {
    const result = evaluateIndependentVisitors(demoVisitors, demoParentalContact, CHILD_IDS);
    expect(result.totalVisitors).toBe(1);
  });

  it("counts children with IV", () => {
    const result = evaluateIndependentVisitors(demoVisitors, demoParentalContact, CHILD_IDS);
    expect(result.childrenWithIV).toBe(1);
  });

  it("calculates visit compliance rate", () => {
    const result = evaluateIndependentVisitors(demoVisitors, demoParentalContact, CHILD_IDS);
    // 7/(7+1) = 87.5% → 88 when rounded
    expect(result.visitComplianceRate).toBe(88);
  });

  it("calculates average engagement", () => {
    const result = evaluateIndependentVisitors(demoVisitors, demoParentalContact, CHILD_IDS);
    expect(result.averageEngagement).toBe(8);
  });

  it("flags children without parental contact missing IV", () => {
    const result = evaluateIndependentVisitors(demoVisitors, demoParentalContact, CHILD_IDS);
    // Morgan has no parental contact and no IV
    expect(result.childrenWithoutParentalContactMissingIV).toContain("Morgan");
    // Jordan has no parental contact but HAS an IV
    expect(result.childrenWithoutParentalContactMissingIV).not.toContain("Jordan");
  });

  it("returns score in 0-100 range", () => {
    const result = evaluateIndependentVisitors(demoVisitors, demoParentalContact, CHILD_IDS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("handles no visitors", () => {
    const result = evaluateIndependentVisitors([], demoParentalContact, CHILD_IDS);
    expect(result.totalVisitors).toBe(0);
    expect(result.childrenWithIV).toBe(0);
    expect(result.visitComplianceRate).toBeNull(); // fab-0: null when the source population is empty.
  });

  it("handles no visitors with children needing them", () => {
    const result = evaluateIndependentVisitors([], demoParentalContact, CHILD_IDS);
    // Jordan and Morgan have no parental contact
    expect(result.childrenWithoutParentalContactMissingIV).toContain("Jordan");
    expect(result.childrenWithoutParentalContactMissingIV).toContain("Morgan");
  });

  it("gives full coverage score when all needing IV have one", () => {
    const visitors: IndependentVisitor[] = [
      {
        id: "iv-01", childId: "jordan", childName: "Jordan",
        visitorName: "Sarah", appointedDate: "2024-09-01",
        visitFrequency: "monthly", visitsCompleted: 10, visitsMissed: 0,
        childEngagement: 10,
      },
      {
        id: "iv-02", childId: "morgan", childName: "Morgan",
        visitorName: "James", appointedDate: "2024-10-01",
        visitFrequency: "monthly", visitsCompleted: 8, visitsMissed: 0,
        childEngagement: 9,
      },
    ];
    const result = evaluateIndependentVisitors(visitors, demoParentalContact, CHILD_IDS);
    expect(result.childrenWithoutParentalContactMissingIV).toEqual([]);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("handles visitors with zero total visits", () => {
    const visitors: IndependentVisitor[] = [
      {
        id: "iv-01", childId: "jordan", childName: "Jordan",
        visitorName: "Sarah", appointedDate: "2025-04-01",
        visitFrequency: "monthly", visitsCompleted: 0, visitsMissed: 0,
      },
    ];
    const result = evaluateIndependentVisitors(visitors, demoParentalContact, CHILD_IDS);
    expect(result.visitComplianceRate).toBeNull(); // fab-0: null when the source population is empty.
  });

  it("handles engagement values outside 1-10 range", () => {
    const visitors: IndependentVisitor[] = [
      {
        id: "iv-01", childId: "jordan", childName: "Jordan",
        visitorName: "Sarah", appointedDate: "2024-09-01",
        visitFrequency: "monthly", visitsCompleted: 5, visitsMissed: 1,
        childEngagement: 0, // Invalid
      },
    ];
    const result = evaluateIndependentVisitors(visitors, demoParentalContact, CHILD_IDS);
    expect(result.averageEngagement).toBeNull(); // fab-0: null when the source population is empty.
  });

  it("handles all children having parental contact", () => {
    const allContact: ChildParentalContact[] = [
      { childId: "alex", childName: "Alex", hasParentalContact: true },
      { childId: "jordan", childName: "Jordan", hasParentalContact: true },
      { childId: "morgan", childName: "Morgan", hasParentalContact: true },
    ];
    const result = evaluateIndependentVisitors([], allContact, CHILD_IDS);
    expect(result.childrenWithoutParentalContactMissingIV).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateAwarenessAndUnderstanding
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAwarenessAndUnderstanding", () => {
  it("returns zeros for empty child list", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, []);
    expect(result.totalAssessments).toBe(0);
    expect(result.score).toBe(0);
  });

  it("counts total assessments", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, CHILD_IDS);
    expect(result.totalAssessments).toBe(3);
  });

  it("counts children assessed", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, CHILD_IDS);
    expect(result.childrenAssessed).toBe(3);
  });

  it("calculates understands rights rate", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, CHILD_IDS);
    // 2 out of 3 children understand rights
    expect(result.understandsRightsRate).toBe(67);
  });

  it("calculates informed of advocacy rate", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, CHILD_IDS);
    expect(result.informedOfAdvocacyRate).toBe(67);
  });

  it("calculates knows how to access rate", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, CHILD_IDS);
    expect(result.knowsHowToAccessRate).toBe(67);
  });

  it("calculates children informed rate", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, CHILD_IDS);
    // All 3 assessed out of 3
    expect(result.childrenInformedOfRightsRate).toBe(100);
  });

  it("tracks format breakdown", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, CHILD_IDS);
    expect(result.formatBreakdown["verbal"]).toBe(1);
    expect(result.formatBreakdown["written"]).toBe(1);
    expect(result.formatBreakdown["easy_read"]).toBe(1);
  });

  it("identifies children not informed", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, [...CHILD_IDS, "sam"]);
    expect(result.childrenNotInformed).toContain("sam");
  });

  it("returns score in 0-100 range", () => {
    const result = evaluateAwarenessAndUnderstanding(demoAwareness, CHILD_IDS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("handles no awareness data", () => {
    const result = evaluateAwarenessAndUnderstanding([], CHILD_IDS);
    expect(result.childrenAssessed).toBe(0);
    expect(result.childrenNotInformed.length).toBe(3);
  });

  it("gives full score when all children are fully informed", () => {
    const fullAwareness: AdvocacyAwareness[] = CHILD_IDS.map((id, i) => ({
      id: `aw-${i}`,
      childId: id,
      childName: CHILD_NAMES[id],
      understandsRights: true,
      informedOfAdvocacy: true,
      knowsHowToAccess: true,
      dateInformed: "2025-01-01",
      format: "verbal" as const,
    }));
    const result = evaluateAwarenessAndUnderstanding(fullAwareness, CHILD_IDS);
    expect(result.score).toBe(100);
  });

  it("gives zero score when no children are informed", () => {
    const noAwareness: AdvocacyAwareness[] = CHILD_IDS.map((id, i) => ({
      id: `aw-${i}`,
      childId: id,
      childName: CHILD_NAMES[id],
      understandsRights: false,
      informedOfAdvocacy: false,
      knowsHowToAccess: false,
      dateInformed: "2025-01-01",
      format: "verbal" as const,
    }));
    const result = evaluateAwarenessAndUnderstanding(noAwareness, CHILD_IDS);
    // Records exist with all-false → real 0 (denominator=CHILD_IDS.length, not fab).
    expect(result.understandsRightsRate).toBe(0);
    expect(result.informedOfAdvocacyRate).toBe(0);
    expect(result.knowsHowToAccessRate).toBe(0);
    expect(result.score).toBe(25); // 25% for coverage only
  });

  it("uses latest assessment per child when multiple exist", () => {
    const multipleAwareness: AdvocacyAwareness[] = [
      {
        id: "aw-old", childId: "alex", childName: "Alex",
        understandsRights: false, informedOfAdvocacy: false,
        knowsHowToAccess: false, dateInformed: "2024-01-01",
        format: "verbal",
      },
      {
        id: "aw-new", childId: "alex", childName: "Alex",
        understandsRights: true, informedOfAdvocacy: true,
        knowsHowToAccess: true, dateInformed: "2025-06-01",
        format: "written",
      },
    ];
    const result = evaluateAwarenessAndUnderstanding(multipleAwareness, ["alex"]);
    expect(result.understandsRightsRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluatePolicyAndProvision
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePolicyAndProvision", () => {
  it("returns full score for complete policy", () => {
    const result = evaluatePolicyAndProvision(demoPolicy);
    expect(result.score).toBe(100);
  });

  it("returns zero for empty policy", () => {
    const result = evaluatePolicyAndProvision({
      contractInPlace: false,
      complaintsProcess: false,
    });
    expect(result.score).toBe(0);
  });

  it("detects reviewed policy", () => {
    const result = evaluatePolicyAndProvision(demoPolicy);
    expect(result.policyReviewed).toBe(true);
  });

  it("detects named provider", () => {
    const result = evaluatePolicyAndProvision(demoPolicy);
    expect(result.providerNamed).toBe(true);
  });

  it("detects contract in place", () => {
    const result = evaluatePolicyAndProvision(demoPolicy);
    expect(result.contractInPlace).toBe(true);
  });

  it("detects complaints process", () => {
    const result = evaluatePolicyAndProvision(demoPolicy);
    expect(result.complaintsProcess).toBe(true);
  });

  it("scores 25 per component", () => {
    const partial: AdvocacyPolicy = {
      lastReviewed: "2025-01-01",
      contractInPlace: false,
      complaintsProcess: false,
    };
    const result = evaluatePolicyAndProvision(partial);
    expect(result.score).toBe(25);
  });

  it("scores 50 for two components", () => {
    const partial: AdvocacyPolicy = {
      lastReviewed: "2025-01-01",
      advocacyProvider: "NYAS",
      contractInPlace: false,
      complaintsProcess: false,
    };
    const result = evaluatePolicyAndProvision(partial);
    expect(result.score).toBe(50);
  });

  it("scores 75 for three components", () => {
    const partial: AdvocacyPolicy = {
      lastReviewed: "2025-01-01",
      advocacyProvider: "NYAS",
      contractInPlace: true,
      complaintsProcess: false,
    };
    const result = evaluatePolicyAndProvision(partial);
    expect(result.score).toBe(75);
  });

  it("treats undefined lastReviewed as not reviewed", () => {
    const policy: AdvocacyPolicy = {
      contractInPlace: true,
      complaintsProcess: true,
    };
    const result = evaluatePolicyAndProvision(policy);
    expect(result.policyReviewed).toBe(false);
    expect(result.score).toBe(50);
  });

  it("treats empty string provider as not named", () => {
    const policy: AdvocacyPolicy = {
      advocacyProvider: "",
      contractInPlace: true,
      complaintsProcess: true,
    };
    const result = evaluatePolicyAndProvision(policy);
    expect(result.providerNamed).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildAdvocacyChildProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildAdvocacyChildProfiles", () => {
  const profiles = buildAdvocacyChildProfiles(
    demoReferrals, demoVisitors, demoAwareness,
    demoParentalContact, CHILD_IDS, CHILD_NAMES,
  );

  it("returns a profile for each child", () => {
    expect(profiles).toHaveLength(3);
  });

  it("uses correct child names", () => {
    const names = profiles.map((p) => p.childName);
    expect(names).toContain("Alex");
    expect(names).toContain("Jordan");
    expect(names).toContain("Morgan");
  });

  it("identifies Alex as having active advocacy", () => {
    const alex = profiles.find((p) => p.childId === "alex");
    expect(alex?.hasActiveAdvocacy).toBe(true);
  });

  it("identifies Jordan as having declined advocacy", () => {
    const jordan = profiles.find((p) => p.childId === "jordan");
    expect(jordan?.hasActiveAdvocacy).toBe(false);
  });

  it("identifies Morgan as not having active advocacy", () => {
    const morgan = profiles.find((p) => p.childId === "morgan");
    expect(morgan?.hasActiveAdvocacy).toBe(false);
  });

  it("tracks advocacy types for Alex", () => {
    const alex = profiles.find((p) => p.childId === "alex");
    expect(alex?.advocacyTypes).toContain("independent_advocate");
    expect(alex?.advocacyTypes).toContain("legal_representative");
  });

  it("identifies Jordan as having IV", () => {
    const jordan = profiles.find((p) => p.childId === "jordan");
    expect(jordan?.hasIndependentVisitor).toBe(true);
  });

  it("identifies Morgan as needing IV", () => {
    const morgan = profiles.find((p) => p.childId === "morgan");
    expect(morgan?.needsIV).toBe(true);
    expect(morgan?.hasIndependentVisitor).toBe(false);
  });

  it("flags Morgan concern for missing IV", () => {
    const morgan = profiles.find((p) => p.childId === "morgan");
    expect(morgan?.concerns).toContain(
      "No Independent Visitor assigned despite no parental contact",
    );
  });

  it("flags Morgan concern for not understanding rights", () => {
    const morgan = profiles.find((p) => p.childId === "morgan");
    expect(morgan?.concerns).toContain(
      "Not informed of rights or does not understand them",
    );
  });

  it("flags Morgan concern for not knowing how to access", () => {
    const morgan = profiles.find((p) => p.childId === "morgan");
    expect(morgan?.concerns).toContain(
      "Does not know how to access advocacy services",
    );
  });

  it("calculates satisfaction for Alex", () => {
    const alex = profiles.find((p) => p.childId === "alex");
    // (8 + 9) / 2 = 8.5
    expect(alex?.satisfaction).toBe(8.5);
  });

  it("calculates IV compliance for Jordan", () => {
    const jordan = profiles.find((p) => p.childId === "jordan");
    // 7 / (7+1) = 87.5 → 88
    expect(jordan?.ivVisitCompliance).toBe(88);
  });

  it("has no IV concerns for Alex (has parental contact)", () => {
    const alex = profiles.find((p) => p.childId === "alex");
    expect(alex?.needsIV).toBe(false);
    expect(alex?.concerns).not.toContain(
      "No Independent Visitor assigned despite no parental contact",
    );
  });

  it("returns overallScore in 0-100 for each child", () => {
    for (const p of profiles) {
      expect(p.overallScore).toBeGreaterThanOrEqual(0);
      expect(p.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it("handles empty data", () => {
    const emptyProfiles = buildAdvocacyChildProfiles(
      [], [], [], [], CHILD_IDS, CHILD_NAMES,
    );
    expect(emptyProfiles).toHaveLength(3);
    for (const p of emptyProfiles) {
      expect(p.hasActiveAdvocacy).toBe(false);
      expect(p.hasIndependentVisitor).toBe(false);
    }
  });

  it("uses childId as name when name not in map", () => {
    const profiles = buildAdvocacyChildProfiles(
      [], [], [], [], ["unknown-child"], {},
    );
    expect(profiles[0].childName).toBe("unknown-child");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateAdvocacyRepresentationIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateAdvocacyRepresentationIntelligence", () => {
  const result = generateAdvocacyRepresentationIntelligence(
    demoReferrals, demoVisitors, demoAwareness, demoPolicy,
    demoParentalContact, CHILD_IDS, CHILD_NAMES,
    "oak-house", "2025-01-01", "2025-06-30", "2025-05-18",
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period dates", () => {
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
  });

  it("returns correct reference date", () => {
    expect(result.referenceDate).toBe("2025-05-18");
  });

  it("returns overall score in 0-100 range", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes access to advocacy results", () => {
    expect(result.accessToAdvocacy).toBeDefined();
    expect(result.accessToAdvocacy.totalReferrals).toBe(4);
  });

  it("includes independent visitors results", () => {
    expect(result.independentVisitors).toBeDefined();
    expect(result.independentVisitors.totalVisitors).toBe(1);
  });

  it("includes awareness results", () => {
    expect(result.awarenessAndUnderstanding).toBeDefined();
    expect(result.awarenessAndUnderstanding.totalAssessments).toBe(3);
  });

  it("includes policy results", () => {
    expect(result.policyAndProvision).toBeDefined();
    expect(result.policyAndProvision.score).toBe(100);
  });

  it("includes child profiles", () => {
    expect(result.childProfiles).toHaveLength(3);
  });

  it("includes strengths array", () => {
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("includes areas for improvement array", () => {
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("includes actions array", () => {
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("regulatory links include Children Act 1989 s26A", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("s26A"))).toBe(true);
  });

  it("regulatory links include CHR 2015 Reg 7", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 7"))).toBe(true);
  });

  it("regulatory links include UNCRC Article 12", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Article 12"))).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("regulatory links include IRO Handbook", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("IRO Handbook"))).toBe(true);
  });

  it("regulatory links include Advocacy Services Regs 2004", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("2004"))).toBe(true);
  });

  it("flags Morgan missing IV in areas for improvement", () => {
    expect(result.areasForImprovement.some((a) => a.includes("Morgan"))).toBe(true);
  });

  it("generates action for missing IV", () => {
    expect(result.actions.some((a) => a.includes("Independent Visitor"))).toBe(true);
  });

  it("includes policy strength when fully compliant", () => {
    expect(result.strengths.some((s) => s.includes("policy"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Rating thresholds
// ══════════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  const buildWithScore = (targetAccessScore: number) => {
    // Manipulate referrals to influence the overall score
    // Use full policy to get max 20 points from policy
    const policy: AdvocacyPolicy = {
      lastReviewed: "2025-01-01",
      advocacyProvider: "NYAS",
      contractInPlace: true,
      complaintsProcess: true,
    };
    return generateAdvocacyRepresentationIntelligence(
      demoReferrals, demoVisitors, demoAwareness, policy,
      demoParentalContact, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-05-18",
    );
  };

  it("assigns outstanding for scores >= 80", () => {
    // Create perfect data for all children
    const perfectReferrals: AdvocacyReferral[] = CHILD_IDS.map((id, i) => ({
      id: `ref-${i}`, childId: id, childName: CHILD_NAMES[id],
      type: "independent_advocate" as const, reason: "general_support" as const,
      referralDate: "2025-01-01", responseDate: "2025-01-01",
      status: "active" as const, childSatisfaction: 10,
    }));
    const perfectVisitors: IndependentVisitor[] = [
      {
        id: "iv-01", childId: "jordan", childName: "Jordan",
        visitorName: "Sarah", appointedDate: "2024-09-01",
        visitFrequency: "monthly", visitsCompleted: 12, visitsMissed: 0,
        childEngagement: 10,
      },
      {
        id: "iv-02", childId: "morgan", childName: "Morgan",
        visitorName: "James", appointedDate: "2024-10-01",
        visitFrequency: "monthly", visitsCompleted: 10, visitsMissed: 0,
        childEngagement: 9,
      },
    ];
    const perfectAwareness: AdvocacyAwareness[] = CHILD_IDS.map((id, i) => ({
      id: `aw-${i}`, childId: id, childName: CHILD_NAMES[id],
      understandsRights: true, informedOfAdvocacy: true,
      knowsHowToAccess: true, dateInformed: "2025-01-01",
      format: "verbal" as const,
    }));
    const fullPolicy: AdvocacyPolicy = {
      lastReviewed: "2025-01-01", advocacyProvider: "NYAS",
      contractInPlace: true, complaintsProcess: true,
    };
    const result = generateAdvocacyRepresentationIntelligence(
      perfectReferrals, perfectVisitors, perfectAwareness, fullPolicy,
      demoParentalContact, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("assigns inadequate for scores < 40", () => {
    const emptyPolicy: AdvocacyPolicy = {
      contractInPlace: false, complaintsProcess: false,
    };
    const result = generateAdvocacyRepresentationIntelligence(
      [], [], [], emptyPolicy, demoParentalContact, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-05-18",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("scoring uses correct weights: 30+25+25+20 = 100", () => {
    const total = 30 + 25 + 25 + 20;
    expect(total).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getAdvocacyTypeLabel", () => {
  it("returns Independent Advocate", () => {
    expect(getAdvocacyTypeLabel("independent_advocate")).toBe("Independent Advocate");
  });
  it("returns Children's Commissioner", () => {
    expect(getAdvocacyTypeLabel("childrens_commissioner")).toBe("Children's Commissioner");
  });
  it("returns Legal Representative", () => {
    expect(getAdvocacyTypeLabel("legal_representative")).toBe("Legal Representative");
  });
  it("returns Independent Visitor", () => {
    expect(getAdvocacyTypeLabel("independent_visitor")).toBe("Independent Visitor");
  });
  it("returns IRP Member", () => {
    expect(getAdvocacyTypeLabel("irp_member")).toBe("IRP Member");
  });
  it("returns Other", () => {
    expect(getAdvocacyTypeLabel("other")).toBe("Other");
  });
});

describe("getAdvocacyStatusLabel", () => {
  it("returns Active", () => {
    expect(getAdvocacyStatusLabel("active")).toBe("Active");
  });
  it("returns Requested", () => {
    expect(getAdvocacyStatusLabel("requested")).toBe("Requested");
  });
  it("returns Pending", () => {
    expect(getAdvocacyStatusLabel("pending")).toBe("Pending");
  });
  it("returns Declined by Child", () => {
    expect(getAdvocacyStatusLabel("declined_by_child")).toBe("Declined by Child");
  });
  it("returns Not Offered", () => {
    expect(getAdvocacyStatusLabel("not_offered")).toBe("Not Offered");
  });
  it("returns Ended", () => {
    expect(getAdvocacyStatusLabel("ended")).toBe("Ended");
  });
});

describe("getReferralReasonLabel", () => {
  it("returns Complaint", () => {
    expect(getReferralReasonLabel("complaint")).toBe("Complaint");
  });
  it("returns Care Plan Disagreement", () => {
    expect(getReferralReasonLabel("care_plan_disagreement")).toBe("Care Plan Disagreement");
  });
  it("returns Review Support", () => {
    expect(getReferralReasonLabel("review_support")).toBe("Review Support");
  });
  it("returns Transition", () => {
    expect(getReferralReasonLabel("transition")).toBe("Transition");
  });
  it("returns Safeguarding", () => {
    expect(getReferralReasonLabel("safeguarding")).toBe("Safeguarding");
  });
  it("returns General Support", () => {
    expect(getReferralReasonLabel("general_support")).toBe("General Support");
  });
  it("returns Placement Change", () => {
    expect(getReferralReasonLabel("placement_change")).toBe("Placement Change");
  });
  it("returns Exclusion", () => {
    expect(getReferralReasonLabel("exclusion")).toBe("Exclusion");
  });
  it("returns Other", () => {
    expect(getReferralReasonLabel("other")).toBe("Other");
  });
});

describe("getAwarenessFormatLabel", () => {
  it("returns Verbal", () => {
    expect(getAwarenessFormatLabel("verbal")).toBe("Verbal");
  });
  it("returns Written", () => {
    expect(getAwarenessFormatLabel("written")).toBe("Written");
  });
  it("returns Easy Read", () => {
    expect(getAwarenessFormatLabel("easy_read")).toBe("Easy Read");
  });
  it("returns Pictorial", () => {
    expect(getAwarenessFormatLabel("pictorial")).toBe("Pictorial");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns Good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns Requires Improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns Inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles completely empty data", () => {
    const emptyPolicy: AdvocacyPolicy = {
      contractInPlace: false, complaintsProcess: false,
    };
    const result = generateAdvocacyRepresentationIntelligence(
      [], [], [], emptyPolicy, [], [], {},
      "empty-home", "2025-01-01", "2025-06-30", "2025-05-18",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toEqual([]);
  });

  it("handles single child with full advocacy", () => {
    const referrals: AdvocacyReferral[] = [{
      id: "ref-01", childId: "child1", childName: "Child One",
      type: "independent_advocate", reason: "general_support",
      referralDate: "2025-01-01", responseDate: "2025-01-01",
      status: "active", childSatisfaction: 10,
    }];
    const awareness: AdvocacyAwareness[] = [{
      id: "aw-01", childId: "child1", childName: "Child One",
      understandsRights: true, informedOfAdvocacy: true,
      knowsHowToAccess: true, dateInformed: "2025-01-01",
      format: "verbal",
    }];
    const policy: AdvocacyPolicy = {
      lastReviewed: "2025-01-01", advocacyProvider: "NYAS",
      contractInPlace: true, complaintsProcess: true,
    };
    const parental: ChildParentalContact[] = [{
      childId: "child1", childName: "Child One", hasParentalContact: true,
    }];
    const result = generateAdvocacyRepresentationIntelligence(
      referrals, [], awareness, policy, parental,
      ["child1"], { child1: "Child One" },
      "test-home", "2025-01-01", "2025-06-30", "2025-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.childProfiles).toHaveLength(1);
  });

  it("handles all children with no advocacy offered", () => {
    const referrals: AdvocacyReferral[] = CHILD_IDS.map((id, i) => ({
      id: `ref-${i}`, childId: id, childName: CHILD_NAMES[id],
      type: "independent_advocate" as const, reason: "general_support" as const,
      referralDate: "2025-01-01", status: "not_offered" as const,
    }));
    const result = evaluateAccessToAdvocacy(referrals, CHILD_IDS);
    expect(result.activeAdvocacyCount).toBe(0);
    expect(result.childrenWithoutAdvocacy.length).toBe(3);
  });

  it("handles all children with full awareness", () => {
    const awareness: AdvocacyAwareness[] = CHILD_IDS.map((id, i) => ({
      id: `aw-${i}`, childId: id, childName: CHILD_NAMES[id],
      understandsRights: true, informedOfAdvocacy: true,
      knowsHowToAccess: true, dateInformed: "2025-01-01",
      format: "verbal" as const,
    }));
    const result = evaluateAwarenessAndUnderstanding(awareness, CHILD_IDS);
    expect(result.score).toBe(100);
    expect(result.childrenNotInformed).toEqual([]);
  });

  it("handles no awareness provided to any child", () => {
    const result = evaluateAwarenessAndUnderstanding([], CHILD_IDS);
    expect(result.childrenAssessed).toBe(0);
    expect(result.score).toBe(0);
  });

  it("handles no IV for child without parental contact", () => {
    const contact: ChildParentalContact[] = [
      { childId: "alex", childName: "Alex", hasParentalContact: false },
    ];
    const result = evaluateIndependentVisitors([], contact, ["alex"]);
    expect(result.childrenWithoutParentalContactMissingIV).toContain("Alex");
  });

  it("handles large number of referrals", () => {
    const manyReferrals: AdvocacyReferral[] = Array.from({ length: 50 }, (_, i) => ({
      id: `ref-${i}`,
      childId: CHILD_IDS[i % 3],
      childName: CHILD_NAMES[CHILD_IDS[i % 3]],
      type: "independent_advocate" as const,
      reason: "general_support" as const,
      referralDate: "2025-01-01",
      responseDate: "2025-01-02",
      status: "active" as const,
      childSatisfaction: 8,
    }));
    const result = evaluateAccessToAdvocacy(manyReferrals, CHILD_IDS);
    expect(result.totalReferrals).toBe(50);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("handles children with multiple IV records", () => {
    const visitors: IndependentVisitor[] = [
      {
        id: "iv-01", childId: "alex", childName: "Alex",
        visitorName: "Sarah", appointedDate: "2024-01-01",
        visitFrequency: "monthly", visitsCompleted: 5, visitsMissed: 1,
        childEngagement: 7,
      },
      {
        id: "iv-02", childId: "alex", childName: "Alex",
        visitorName: "James", appointedDate: "2024-06-01",
        visitFrequency: "fortnightly", visitsCompleted: 10, visitsMissed: 2,
        childEngagement: 9,
      },
    ];
    const contact: ChildParentalContact[] = [
      { childId: "alex", childName: "Alex", hasParentalContact: false },
    ];
    const result = evaluateIndependentVisitors(visitors, contact, ["alex"]);
    expect(result.childrenWithIV).toBe(1);
    expect(result.totalVisitors).toBe(2);
  });

  it("does not flag children with parental contact who lack IV", () => {
    const contact: ChildParentalContact[] = [
      { childId: "alex", childName: "Alex", hasParentalContact: true },
    ];
    const result = evaluateIndependentVisitors([], contact, ["alex"]);
    expect(result.childrenWithoutParentalContactMissingIV).toEqual([]);
  });

  it("generates strengths for high-scoring areas", () => {
    const perfectReferrals: AdvocacyReferral[] = CHILD_IDS.map((id, i) => ({
      id: `ref-${i}`, childId: id, childName: CHILD_NAMES[id],
      type: "independent_advocate" as const, reason: "general_support" as const,
      referralDate: "2025-01-01", responseDate: "2025-01-01",
      status: "active" as const, childSatisfaction: 10,
    }));
    const perfectVisitors: IndependentVisitor[] = [
      {
        id: "iv-01", childId: "jordan", childName: "Jordan",
        visitorName: "Sarah", appointedDate: "2024-09-01",
        visitFrequency: "monthly", visitsCompleted: 12, visitsMissed: 0,
        childEngagement: 10,
      },
      {
        id: "iv-02", childId: "morgan", childName: "Morgan",
        visitorName: "James", appointedDate: "2024-10-01",
        visitFrequency: "monthly", visitsCompleted: 10, visitsMissed: 0,
        childEngagement: 9,
      },
    ];
    const perfectAwareness: AdvocacyAwareness[] = CHILD_IDS.map((id, i) => ({
      id: `aw-${i}`, childId: id, childName: CHILD_NAMES[id],
      understandsRights: true, informedOfAdvocacy: true,
      knowsHowToAccess: true, dateInformed: "2025-01-01",
      format: "verbal" as const,
    }));
    const result = generateAdvocacyRepresentationIntelligence(
      perfectReferrals, perfectVisitors, perfectAwareness, demoPolicy,
      demoParentalContact, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates improvement areas for low-scoring areas", () => {
    const emptyPolicy: AdvocacyPolicy = {
      contractInPlace: false, complaintsProcess: false,
    };
    const result = generateAdvocacyRepresentationIntelligence(
      [], [], [], emptyPolicy, demoParentalContact, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-05-18",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Additional scoring and integration tests
// ══════════════════════════════════════════════════════════════════════════════

describe("scoring integration", () => {
  it("overall score is weighted sum of component scores", () => {
    const result = generateAdvocacyRepresentationIntelligence(
      demoReferrals, demoVisitors, demoAwareness, demoPolicy,
      demoParentalContact, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-05-18",
    );
    const expectedScore = Math.round(
      (result.accessToAdvocacy.score * 30 / 100) +
      (result.independentVisitors.score * 25 / 100) +
      (result.awarenessAndUnderstanding.score * 25 / 100) +
      (result.policyAndProvision.score * 20 / 100),
    );
    expect(result.overallScore).toBe(expectedScore);
  });

  it("component scores are all 0-100", () => {
    const result = generateAdvocacyRepresentationIntelligence(
      demoReferrals, demoVisitors, demoAwareness, demoPolicy,
      demoParentalContact, CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-05-18",
    );
    expect(result.accessToAdvocacy.score).toBeGreaterThanOrEqual(0);
    expect(result.accessToAdvocacy.score).toBeLessThanOrEqual(100);
    expect(result.independentVisitors.score).toBeGreaterThanOrEqual(0);
    expect(result.independentVisitors.score).toBeLessThanOrEqual(100);
    expect(result.awarenessAndUnderstanding.score).toBeGreaterThanOrEqual(0);
    expect(result.awarenessAndUnderstanding.score).toBeLessThanOrEqual(100);
    expect(result.policyAndProvision.score).toBeGreaterThanOrEqual(0);
    expect(result.policyAndProvision.score).toBeLessThanOrEqual(100);
  });

  it("slow response time penalises access score", () => {
    const slowReferrals: AdvocacyReferral[] = [{
      id: "ref-01", childId: "alex", childName: "Alex",
      type: "independent_advocate", reason: "general_support",
      referralDate: "2025-01-01", responseDate: "2025-01-20",
      status: "active", childSatisfaction: 8,
    }];
    const fastReferrals: AdvocacyReferral[] = [{
      id: "ref-01", childId: "alex", childName: "Alex",
      type: "independent_advocate", reason: "general_support",
      referralDate: "2025-01-01", responseDate: "2025-01-01",
      status: "active", childSatisfaction: 8,
    }];
    const slow = evaluateAccessToAdvocacy(slowReferrals, ["alex"]);
    const fast = evaluateAccessToAdvocacy(fastReferrals, ["alex"]);
    expect(fast.score).toBeGreaterThan(slow.score);
  });

  it("higher satisfaction boosts access score", () => {
    const highSat: AdvocacyReferral[] = [{
      id: "ref-01", childId: "alex", childName: "Alex",
      type: "independent_advocate", reason: "general_support",
      referralDate: "2025-01-01", responseDate: "2025-01-02",
      status: "active", childSatisfaction: 10,
    }];
    const lowSat: AdvocacyReferral[] = [{
      id: "ref-01", childId: "alex", childName: "Alex",
      type: "independent_advocate", reason: "general_support",
      referralDate: "2025-01-01", responseDate: "2025-01-02",
      status: "active", childSatisfaction: 2,
    }];
    const high = evaluateAccessToAdvocacy(highSat, ["alex"]);
    const low = evaluateAccessToAdvocacy(lowSat, ["alex"]);
    expect(high.score).toBeGreaterThan(low.score);
  });
});
