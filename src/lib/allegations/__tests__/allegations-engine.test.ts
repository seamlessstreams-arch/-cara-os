// ══════════════════════════════════════════════════════════════════════════════
// ALLEGATIONS AGAINST STAFF INTELLIGENCE — TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateAllegationsIntelligence,
  evaluateAllegationCompliance,
  analyseAllegationPatterns,
  buildAllegationStaffProfiles,
  getAllegationCategoryLabel,
  getAllegationOutcomeLabel,
  getStaffActionLabel,
  getSourceLabel,
} from "../allegations-engine";
import type {
  Allegation,
  StaffMember,
} from "../allegations-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

function makeStaff(): StaffMember[] {
  return [
    { id: "staff-001", name: "Sarah Johnson", role: "Senior RCW", startDate: "2024-03-01", dbsNumber: "DBS001", currentlyEmployed: true },
    { id: "staff-002", name: "Tom Richards", role: "RCW", startDate: "2025-01-15", dbsNumber: "DBS002", currentlyEmployed: true },
    { id: "staff-003", name: "Lisa Williams", role: "RCW", startDate: "2024-08-01", dbsNumber: "DBS003", currentlyEmployed: true },
    { id: "staff-004", name: "James Cooper", role: "Agency RCW", startDate: "2026-02-01", currentlyEmployed: false },
  ];
}

function makeCleanAllegations(): Allegation[] {
  // Single historic allegation, well managed, no issues
  return [
    {
      id: "alleg-001",
      staffId: "staff-004",
      category: "inappropriate_restraint",
      source: "child",
      dateReported: "2026-02-15",
      dateOfIncident: "2026-02-14",
      summary: "Alex alleged that agency worker used excessive force during a restraint incident",
      childrenInvolved: ["child-alex"],
      investigationStatus: "resolved",
      ladoReferralDate: "2026-02-15",
      ladoReferralTimely: true,
      policeInvolved: false,
      ofstedNotified: true,
      ofstedNotifiedDate: "2026-02-16",
      ofstedNotifiedTimely: true,
      placingAuthorityNotified: true,
      riNotified: true,
      outcome: "unsubstantiated",
      outcomeDate: "2026-03-15",
      staffAction: "training_required",
      dbsReferralMade: false,
      lessonsLearned: "Agency induction to include TCI refresher before commencing shift",
      policyReviewRequired: false,
      supportOfferedToChild: true,
      supportOfferedToStaff: true,
    },
  ];
}

function makeProblemAllegations(): Allegation[] {
  return [
    // Allegation 1: Physical abuse — LADO referral made but late
    {
      id: "alleg-p01",
      staffId: "staff-002",
      category: "physical_abuse",
      source: "child",
      dateReported: "2026-03-10",
      dateOfIncident: "2026-03-09",
      summary: "Jordan alleged Tom pushed them during a confrontation about bedtime",
      childrenInvolved: ["child-jordan"],
      investigationStatus: "resolved",
      ladoReferralDate: "2026-03-12",
      ladoReferralTimely: false, // Not within 1 working day
      policeInvolved: false,
      ofstedNotified: true,
      ofstedNotifiedDate: "2026-03-11",
      ofstedNotifiedTimely: true,
      placingAuthorityNotified: true,
      riNotified: true,
      outcome: "unsubstantiated",
      outcomeDate: "2026-04-10",
      staffAction: "supervision_enhanced",
      supportOfferedToChild: true,
      supportOfferedToStaff: true,
      policyReviewRequired: false,
    },
    // Allegation 2: Professional boundary — no LADO referral made
    {
      id: "alleg-p02",
      staffId: "staff-002",
      category: "professional_boundary",
      source: "staff_member",
      dateReported: "2026-04-05",
      summary: "Colleague reported Tom giving personal phone number to a young person",
      childrenInvolved: ["child-morgan"],
      investigationStatus: "resolved",
      policeInvolved: false,
      ofstedNotified: false,
      placingAuthorityNotified: true,
      riNotified: false,
      outcome: "substantiated",
      outcomeDate: "2026-04-20",
      staffAction: "written_warning",
      lessonsLearned: "All staff reminded of personal device policy. Policy updated.",
      supportOfferedToChild: false, // Gap
      supportOfferedToStaff: true,
      policyReviewRequired: true,
    },
    // Allegation 3: Failure to safeguard — substantiated, DBS required but not done
    {
      id: "alleg-p03",
      staffId: "staff-002",
      category: "failure_to_safeguard",
      source: "placing_authority",
      dateReported: "2026-05-01",
      summary: "Placing authority raised concern that Tom failed to report a disclosure made by Jordan",
      childrenInvolved: ["child-jordan"],
      investigationStatus: "lado_referral_made",
      ladoReferralDate: "2026-05-01",
      ladoReferralTimely: true,
      policeInvolved: false,
      ofstedNotified: true,
      ofstedNotifiedDate: "2026-05-02",
      ofstedNotifiedTimely: true,
      placingAuthorityNotified: true,
      riNotified: true,
      outcome: "ongoing",
      staffAction: "suspended",
      supportOfferedToChild: true,
      supportOfferedToStaff: true,
      policyReviewRequired: true,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// evaluateAllegationCompliance
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateAllegationCompliance", () => {
  it("reports clean compliance for well-managed allegation", () => {
    const allegations = makeCleanAllegations();
    const result = evaluateAllegationCompliance(allegations, PERIOD_START, PERIOD_END);

    expect(result.totalAllegations).toBe(1);
    expect(result.ladoReferralsMade).toBe(1);
    expect(result.ladoReferralsRequired).toBe(1);
    expect(result.ladoTimelinessRate).toBe(100);
    expect(result.placingAuthorityNotifiedRate).toBe(100);
    expect(result.riNotifiedRate).toBe(100);
  });

  it("detects LADO referral gaps", () => {
    const allegations = makeProblemAllegations();
    const result = evaluateAllegationCompliance(allegations, PERIOD_START, PERIOD_END);

    // physical_abuse and failure_to_safeguard both require LADO
    expect(result.ladoReferralsRequired).toBe(2);
    expect(result.ladoReferralsMade).toBe(2); // Both were made
    // But one was late
    expect(result.ladoTimelinessRate).toBe(50);
  });

  it("detects Ofsted notification gaps", () => {
    const allegations = makeProblemAllegations();
    const result = evaluateAllegationCompliance(allegations, PERIOD_START, PERIOD_END);

    // physical_abuse and failure_to_safeguard require Ofsted notification
    expect(result.ofstedNotificationsRequired).toBe(2);
    expect(result.ofstedNotifications).toBe(2);
  });

  it("returns full compliance for empty period", () => {
    const result = evaluateAllegationCompliance([], PERIOD_START, PERIOD_END);

    expect(result.totalAllegations).toBe(0);
    expect(result.ladoTimelinessRate).toBe(100);
    expect(result.placingAuthorityNotifiedRate).toBe(100);
  });

  it("filters allegations to period range", () => {
    const outOfRange: Allegation[] = [
      {
        ...makeCleanAllegations()[0],
        id: "out-of-range",
        dateReported: "2025-06-01",
      },
    ];
    const result = evaluateAllegationCompliance(outOfRange, PERIOD_START, PERIOD_END);
    expect(result.totalAllegations).toBe(0);
  });

  it("tracks placing authority and RI notification rates", () => {
    const allegations = makeProblemAllegations();
    const result = evaluateAllegationCompliance(allegations, PERIOD_START, PERIOD_END);

    // 3 allegations, all PA notified = 100%
    expect(result.placingAuthorityNotifiedRate).toBe(100);
    // 3 allegations, 2 RI notified = 67%
    expect(result.riNotifiedRate).toBe(67);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// analyseAllegationPatterns
// ═══════════════════════════════════════════════════════════════════════════

describe("analyseAllegationPatterns", () => {
  it("builds category breakdown correctly", () => {
    const allegations = makeProblemAllegations();
    const staff = makeStaff();
    const result = analyseAllegationPatterns(allegations, staff, PERIOD_START, PERIOD_END);

    expect(result.categoryBreakdown.length).toBeGreaterThan(0);
    const physical = result.categoryBreakdown.find((c) => c.category === "physical_abuse");
    expect(physical).toBeDefined();
    expect(physical!.count).toBe(1);
  });

  it("builds source breakdown correctly", () => {
    const allegations = makeProblemAllegations();
    const staff = makeStaff();
    const result = analyseAllegationPatterns(allegations, staff, PERIOD_START, PERIOD_END);

    expect(result.sourceBreakdown.length).toBeGreaterThan(0);
    const childSource = result.sourceBreakdown.find((s) => s.source === "child");
    expect(childSource).toBeDefined();
  });

  it("detects staff with multiple allegations", () => {
    const allegations = makeProblemAllegations();
    const staff = makeStaff();
    const result = analyseAllegationPatterns(allegations, staff, PERIOD_START, PERIOD_END);

    expect(result.staffWithMultiple.length).toBe(1);
    expect(result.staffWithMultiple[0].staffName).toBe("Tom Richards");
    expect(result.staffWithMultiple[0].count).toBe(3);
  });

  it("calculates average resolution days", () => {
    const allegations = makeProblemAllegations();
    const staff = makeStaff();
    const result = analyseAllegationPatterns(allegations, staff, PERIOD_START, PERIOD_END);

    // alleg-p01: 2026-03-10 → 2026-04-10 = 31 days
    // alleg-p02: 2026-04-05 → 2026-04-20 = 15 days
    // alleg-p03 is ongoing, excluded
    expect(result.averageResolutionDays).toBe(23); // (31+15)/2 = 23
  });

  it("counts ongoing allegations", () => {
    const allegations = makeProblemAllegations();
    const staff = makeStaff();
    const result = analyseAllegationPatterns(allegations, staff, PERIOD_START, PERIOD_END);

    expect(result.ongoingCount).toBe(1);
  });

  it("returns empty breakdowns for no allegations", () => {
    const result = analyseAllegationPatterns([], makeStaff(), PERIOD_START, PERIOD_END);
    expect(result.categoryBreakdown).toHaveLength(0);
    expect(result.staffWithMultiple).toHaveLength(0);
    expect(result.averageResolutionDays).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// buildAllegationStaffProfiles
// ═══════════════════════════════════════════════════════════════════════════

describe("buildAllegationStaffProfiles", () => {
  it("builds profiles for staff with allegations", () => {
    const allegations = makeProblemAllegations();
    const staff = makeStaff();
    const profiles = buildAllegationStaffProfiles(allegations, staff, PERIOD_START, PERIOD_END);

    expect(profiles).toHaveLength(1); // All 3 are against Tom
    expect(profiles[0].staffName).toBe("Tom Richards");
    expect(profiles[0].allegationCount).toBe(3);
  });

  it("flags staff with multiple allegations as high risk", () => {
    const allegations = makeProblemAllegations();
    const staff = makeStaff();
    const profiles = buildAllegationStaffProfiles(allegations, staff, PERIOD_START, PERIOD_END);

    expect(profiles[0].isHighRisk).toBe(true);
    expect(profiles[0].riskReason).toContain("3 allegations");
  });

  it("flags substantiated allegation as high risk", () => {
    const allegations: Allegation[] = [{
      id: "sub-001",
      staffId: "staff-003",
      category: "neglect",
      source: "placing_authority",
      dateReported: "2026-03-01",
      summary: "Failed to administer medication",
      childrenInvolved: ["child-morgan"],
      investigationStatus: "resolved",
      ladoReferralDate: "2026-03-01",
      ladoReferralTimely: true,
      policeInvolved: false,
      ofstedNotified: true,
      ofstedNotifiedDate: "2026-03-02",
      ofstedNotifiedTimely: true,
      placingAuthorityNotified: true,
      riNotified: true,
      outcome: "substantiated",
      outcomeDate: "2026-04-01",
      staffAction: "final_warning",
      dbsReferralMade: false,
      supportOfferedToChild: true,
      supportOfferedToStaff: true,
      policyReviewRequired: true,
    }];
    const staff = makeStaff();
    const profiles = buildAllegationStaffProfiles(allegations, staff, PERIOD_START, PERIOD_END);

    expect(profiles[0].isHighRisk).toBe(true);
    expect(profiles[0].riskReason).toContain("Substantiated");
  });

  it("flags serious categories as high risk even with single allegation", () => {
    const allegations: Allegation[] = [{
      id: "serious-001",
      staffId: "staff-003",
      category: "sexual_abuse",
      source: "child",
      dateReported: "2026-04-01",
      summary: "Allegation of inappropriate touching",
      childrenInvolved: ["child-jordan"],
      investigationStatus: "police_investigation",
      ladoReferralDate: "2026-04-01",
      ladoReferralTimely: true,
      policeInvolved: true,
      ofstedNotified: true,
      ofstedNotifiedDate: "2026-04-01",
      ofstedNotifiedTimely: true,
      placingAuthorityNotified: true,
      riNotified: true,
      outcome: "ongoing",
      staffAction: "suspended",
      supportOfferedToChild: true,
      supportOfferedToStaff: true,
      policyReviewRequired: true,
    }];
    const staff = makeStaff();
    const profiles = buildAllegationStaffProfiles(allegations, staff, PERIOD_START, PERIOD_END);

    expect(profiles[0].isHighRisk).toBe(true);
    expect(profiles[0].riskReason).toContain("sexual/physical abuse");
  });

  it("returns empty for no allegations", () => {
    const profiles = buildAllegationStaffProfiles([], makeStaff(), PERIOD_START, PERIOD_END);
    expect(profiles).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// generateAllegationsIntelligence (integration)
// ═══════════════════════════════════════════════════════════════════════════

describe("generateAllegationsIntelligence", () => {
  it("produces complete result with all fields", () => {
    const result = generateAllegationsIntelligence(
      makeCleanAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.homeId).toBe("oak-house");
    expect(typeof result.overallScore).toBe("number");
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.compliance).toBeDefined();
    expect(result.patterns).toBeDefined();
    expect(result.staffProfiles).toBeDefined();
  });

  it("scores high for well-managed single allegation", () => {
    const result = generateAllegationsIntelligence(
      makeCleanAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(70);
  });

  it("scores lower for problem allegations than clean scenario", () => {
    const clean = generateAllegationsIntelligence(
      makeCleanAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );
    const problem = generateAllegationsIntelligence(
      makeProblemAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(problem.overallScore).toBeLessThan(clean.overallScore);
    // Has substantiated allegation and high-risk staff — score is penalised
    expect(problem.overallScore).toBeLessThanOrEqual(95);
  });

  it("generates appropriate strengths for clean scenario", () => {
    const result = generateAllegationsIntelligence(
      makeCleanAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates concerns for problem scenario", () => {
    const result = generateAllegationsIntelligence(
      makeProblemAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns.some((c) => c.includes("Tom Richards"))).toBe(true);
  });

  it("generates immediate actions for compliance gaps", () => {
    const result = generateAllegationsIntelligence(
      makeProblemAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    // Tom is high risk but has action already (suspended), so no gap there
    // But child support was missed for alleg-p02
    expect(result.immediateActions.some((a) => a.includes("child support"))).toBe(true);
  });

  it("produces no-action message when zero allegations", () => {
    const result = generateAllegationsIntelligence(
      [], makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.immediateActions.some((a) => a.includes("No immediate actions"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("No allegations received"))).toBe(true);
  });

  it("includes relevant regulatory links", () => {
    const result = generateAllegationsIntelligence(
      makeProblemAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.regulatoryLinks.some((l) => l.includes("Reg 37"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 40"))).toBe(true);
  });

  it("tracks child and staff support rates", () => {
    const result = generateAllegationsIntelligence(
      makeProblemAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    // 3 allegations, 2 child supported = 67%
    expect(result.childSupportRate).toBe(67);
    // All 3 have staff support
    expect(result.staffSupportRate).toBe(100);
  });

  it("includes whistleblowing regulatory link when staff report", () => {
    const result = generateAllegationsIntelligence(
      makeProblemAllegations(), makeStaff(), "oak-house", PERIOD_START, PERIOD_END,
    );

    // alleg-p02 source is "staff_member"
    expect(result.regulatoryLinks.some((l) => l.includes("Whistleblowing"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Label Utilities
// ═══════════════════════════════════════════════════════════════════════════

describe("label utilities", () => {
  it("getAllegationCategoryLabel returns correct labels", () => {
    expect(getAllegationCategoryLabel("physical_abuse")).toBe("Physical Abuse");
    expect(getAllegationCategoryLabel("sexual_abuse")).toBe("Sexual Abuse");
    expect(getAllegationCategoryLabel("failure_to_safeguard")).toBe("Failure to Safeguard");
    expect(getAllegationCategoryLabel("whistleblowing")).toBe("Whistleblowing");
  });

  it("getAllegationOutcomeLabel returns correct labels", () => {
    expect(getAllegationOutcomeLabel("substantiated")).toBe("Substantiated");
    expect(getAllegationOutcomeLabel("ongoing")).toBe("Ongoing");
    expect(getAllegationOutcomeLabel("unfounded")).toBe("Unfounded");
  });

  it("getStaffActionLabel returns correct labels", () => {
    expect(getStaffActionLabel("suspended")).toBe("Suspended");
    expect(getStaffActionLabel("dismissed")).toBe("Dismissed");
    expect(getStaffActionLabel("dbs_referral")).toBe("DBS Referral");
  });

  it("getSourceLabel returns correct labels", () => {
    expect(getSourceLabel("child")).toBe("Child");
    expect(getSourceLabel("staff_member")).toBe("Staff Member");
    expect(getSourceLabel("anonymous")).toBe("Anonymous");
  });
});
