// ══════════════════════════════════════════════════════════════════���═══════════
// Safeguarding Engine — Tests
//
// Covers: escalation decisions, compliance evaluation, metrics calculation,
// timeline building, overdue detection, category classification.
// ═════════════════════════════════════════════════════════════════════��════════

import { describe, it, expect } from "vitest";
import {
  determineEscalation,
  evaluateConcernCompliance,
  calculateSafeguardingMetrics,
  buildSafeguardingTimeline,
  getOverdueConcerns,
  formatCategory,
  formatSeverity,
  formatStatus,
  requiresOfstedNotification,
  isHighRiskCategory,
} from "../safeguarding-engine";
import type {
  SafeguardingConcern,
  ChronologyEntry,
} from "../safeguarding-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

function makeConcern(overrides: Partial<SafeguardingConcern> = {}): SafeguardingConcern {
  return {
    id: "concern-001",
    childId: "child-001",
    childName: "Child A",
    homeId: "home-001",
    organisationId: "org-001",
    category: "physical_abuse",
    severity: "medium",
    status: "initial_concern",
    escalationLevel: 1,
    description: "Observed unexplained bruising on left arm.",
    raisedBy: "staff-001",
    raisedAt: "2026-05-17T09:00:00Z",
    dateOfConcern: "2026-05-17T08:30:00Z",
    evidenceOfHarm: ["Bruising on left arm, approximately 3cm diameter"],
    witnesses: ["staff-002"],
    immediateActions: ["Checked child is safe", "Photographed injury with consent"],
    dslConsulted: true,
    dslName: "Jane Smith",
    dslConsultedAt: "2026-05-17T09:30:00Z",
    referrals: [],
    assignedTo: "staff-rm-001",
    reviewDate: "2026-05-20T09:00:00Z",
    linkedConcerns: [],
    linkedIncidents: [],
    lastUpdatedBy: "staff-001",
    lastUpdatedAt: "2026-05-17T09:30:00Z",
    createdAt: "2026-05-17T09:00:00Z",
    ...overrides,
  };
}

function makeReferral(overrides = {}) {
  return {
    id: "ref-001",
    concernId: "concern-001",
    destination: "local_authority_mash" as const,
    referralDate: "2026-05-17T10:00:00Z",
    referredBy: "staff-rm-001",
    referralMethod: "phone" as const,
    acknowledged: true,
    acknowledgedAt: "2026-05-17T11:00:00Z",
    responseReceived: true,
    responseDate: "2026-05-17T14:00:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Escalation Decision Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("determineEscalation", () => {
  it("escalates immediate severity to level 5", () => {
    const concern = makeConcern({ severity: "immediate" });
    const result = determineEscalation(concern);
    expect(result.recommendedLevel).toBe(5);
    expect(result.notifyRM).toBe(true);
    expect(result.notifyOfsted).toBe(true);
    expect(result.notifyPolice).toBe(true);
    expect(result.timeframe).toBe("immediate");
  });

  it("escalates high severity to level 3", () => {
    const concern = makeConcern({ severity: "high" });
    const result = determineEscalation(concern);
    expect(result.recommendedLevel).toBeGreaterThanOrEqual(3);
    expect(result.notifyRM).toBe(true);
    expect(result.timeframe).toBe("within_4_hours");
  });

  it("escalates medium severity to level 2", () => {
    const concern = makeConcern({ severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.recommendedLevel).toBe(2);
    expect(result.timeframe).toBe("within_24_hours");
  });

  it("always refers CSE to MASH and police", () => {
    const concern = makeConcern({ category: "child_sexual_exploitation", severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.referralsRequired).toContain("local_authority_mash");
    expect(result.referralsRequired).toContain("police");
    expect(result.referralsRequired).toContain("exploitation_hub");
    expect(result.notifyPolice).toBe(true);
    expect(result.notifyOfsted).toBe(true);
  });

  it("always refers CCE to MASH and police", () => {
    const concern = makeConcern({ category: "child_criminal_exploitation", severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.referralsRequired).toContain("police");
    expect(result.referralsRequired).toContain("exploitation_hub");
    expect(result.recommendedLevel).toBeGreaterThanOrEqual(4);
  });

  it("refers staff allegations to LADO", () => {
    const concern = makeConcern({ category: "allegation_against_staff", severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.referralsRequired).toContain("lado");
    expect(result.referralsRequired).toContain("local_authority_mash");
    expect(result.recommendedLevel).toBeGreaterThanOrEqual(4);
    expect(result.notifyOfsted).toBe(true);
    expect(result.timeframe).toBe("within_1_hour");
  });

  it("refers radicalisation to Prevent team", () => {
    const concern = makeConcern({ category: "radicalisation", severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.referralsRequired).toContain("prevent_team");
    expect(result.referralsRequired).toContain("local_authority_mash");
  });

  it("handles disclosure correctly", () => {
    const concern = makeConcern({ category: "disclosure", severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.referralsRequired).toContain("local_authority_mash");
    expect(result.immediateActions).toContain("Record child's exact words verbatim.");
    expect(result.immediateActions).toContain("Do not ask leading questions.");
    expect(result.recommendedLevel).toBeGreaterThanOrEqual(3);
  });

  it("escalates when child has 3+ active concerns (cumulative harm)", () => {
    const concern = makeConcern({ severity: "low" });
    const existing = [
      makeConcern({ id: "c2", status: "ongoing_monitoring" }),
      makeConcern({ id: "c3", status: "referral_made" }),
      makeConcern({ id: "c4", status: "information_gathering" }),
    ];
    const result = determineEscalation(concern, existing);
    expect(result.recommendedLevel).toBeGreaterThanOrEqual(3);
    expect(result.reasons.some(r => r.includes("cumulative harm"))).toBe(true);
  });

  it("handles self-harm with CAMHS referral", () => {
    const concern = makeConcern({ category: "self_harm", severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.referralsRequired).toContain("camhs");
    expect(result.immediateActions).toContain("Ensure immediate safety — remove means of self-harm.");
  });

  it("self-harm high severity also refers to MASH", () => {
    const concern = makeConcern({ category: "self_harm", severity: "high" });
    const result = determineEscalation(concern);
    expect(result.referralsRequired).toContain("camhs");
    expect(result.referralsRequired).toContain("local_authority_mash");
    expect(result.notifyRM).toBe(true);
  });

  it("sexual abuse escalates to level 4 minimum", () => {
    const concern = makeConcern({ category: "sexual_abuse", severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.recommendedLevel).toBeGreaterThanOrEqual(4);
    expect(result.notifyPolice).toBe(true);
  });

  it("trafficking requires police and exploitation hub", () => {
    const concern = makeConcern({ category: "trafficking", severity: "high" });
    const result = determineEscalation(concern);
    expect(result.referralsRequired).toContain("police");
    expect(result.notifyPolice).toBe(true);
    expect(result.recommendedLevel).toBeGreaterThanOrEqual(4);
  });

  it("contextual safeguarding adds mapping actions", () => {
    const concern = makeConcern({ category: "contextual_safeguarding", severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.immediateActions.some(a => a.includes("Map the external environment"))).toBe(true);
  });

  it("always includes DSL consultation for level 2+", () => {
    const concern = makeConcern({ severity: "medium" });
    const result = determineEscalation(concern);
    expect(result.immediateActions.some(a => a.includes("Designated Safeguarding Lead"))).toBe(true);
  });

  it("always includes social worker for level 3+", () => {
    const concern = makeConcern({ severity: "high" });
    const result = determineEscalation(concern);
    expect(result.referralsRequired).toContain("social_worker");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Compliance Evaluation Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateConcernCompliance", () => {
  it("marks fully compliant concern as compliant", () => {
    const concern = makeConcern();
    const result = evaluateConcernCompliance(concern);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("flags DSL not consulted for high severity", () => {
    const concern = makeConcern({ severity: "high", dslConsulted: false });
    const result = evaluateConcernCompliance(concern);
    expect(result.isCompliant).toBe(false);
    expect(result.dslConsultedTimely).toBe(false);
    expect(result.issues.some(i => i.includes("DSL not consulted"))).toBe(true);
  });

  it("flags late DSL consultation for immediate severity", () => {
    const concern = makeConcern({
      severity: "immediate",
      dslConsulted: true,
      raisedAt: "2026-05-17T09:00:00Z",
      dslConsultedAt: "2026-05-17T12:00:00Z", // 3 hours later
    });
    const result = evaluateConcernCompliance(concern);
    expect(result.dslConsultedTimely).toBe(false);
    expect(result.issues.some(i => i.includes("DSL consulted") && i.includes("after concern raised"))).toBe(true);
  });

  it("flags missing referral for always-refer categories", () => {
    const concern = makeConcern({ category: "sexual_abuse", referrals: [] });
    const result = evaluateConcernCompliance(concern);
    expect(result.referralTimely).toBe(false);
    expect(result.issues.some(i => i.includes("requires external referral"))).toBe(true);
  });

  it("flags late referral for immediate severity", () => {
    const concern = makeConcern({
      severity: "immediate",
      raisedAt: "2026-05-17T09:00:00Z",
      referrals: [makeReferral({ referralDate: "2026-05-17T14:00:00Z" })], // 5 hours later
    });
    const result = evaluateConcernCompliance(concern);
    expect(result.referralTimely).toBe(false);
    expect(result.issues.some(i => i.includes("required within"))).toBe(true);
  });

  it("flags no immediate actions recorded", () => {
    const concern = makeConcern({ immediateActions: [] });
    const result = evaluateConcernCompliance(concern);
    expect(result.actionsTaken).toBe(false);
    expect(result.issues.some(i => i.includes("No immediate actions"))).toBe(true);
  });

  it("flags missing child words for disclosure", () => {
    const concern = makeConcern({ category: "disclosure", childWords: "" });
    const result = evaluateConcernCompliance(concern);
    expect(result.childWordsRecorded).toBe(false);
    expect(result.issues.some(i => i.includes("exact words not recorded"))).toBe(true);
  });

  it("returns null for childWordsRecorded when not a disclosure", () => {
    const concern = makeConcern({ category: "physical_abuse" });
    const result = evaluateConcernCompliance(concern);
    expect(result.childWordsRecorded).toBe(null);
  });

  it("flags no evidence of harm", () => {
    const concern = makeConcern({ evidenceOfHarm: [] });
    const result = evaluateConcernCompliance(concern);
    expect(result.chronologyUpdated).toBe(false);
  });

  it("flags no review date for active concern", () => {
    const concern = makeConcern({ reviewDate: undefined, status: "ongoing_monitoring" });
    const result = evaluateConcernCompliance(concern);
    expect(result.reviewScheduled).toBe(false);
    expect(result.issues.some(i => i.includes("No review date"))).toBe(true);
  });

  it("does not flag review for closed concerns", () => {
    const concern = makeConcern({ reviewDate: undefined, status: "closed" });
    const result = evaluateConcernCompliance(concern);
    expect(result.reviewScheduled).toBe(false); // but no issue flagged
    expect(result.issues.filter(i => i.includes("review")).length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateSafeguardingMetrics", () => {
  const now = "2026-05-17T12:00:00Z";
  const concerns = [
    makeConcern({ id: "c1", severity: "high", status: "referral_made", raisedAt: "2026-05-15T10:00:00Z", escalationLevel: 3 }),
    makeConcern({ id: "c2", category: "self_harm", severity: "medium", status: "ongoing_monitoring", raisedAt: "2026-05-10T10:00:00Z", escalationLevel: 2 }),
    makeConcern({ id: "c3", category: "neglect", severity: "low", status: "closed", raisedAt: "2026-04-01T10:00:00Z", escalationLevel: 1 }),
    makeConcern({ id: "c4", category: "disclosure", severity: "high", status: "strategy_discussion", raisedAt: "2026-05-16T10:00:00Z", escalationLevel: 4, childId: "child-002", childName: "Child B" }),
  ];

  it("calculates total and active counts", () => {
    const result = calculateSafeguardingMetrics(concerns, "home-001", "org-001", now);
    expect(result.totalConcerns).toBe(4);
    expect(result.activeConcerns).toBe(3);
  });

  it("counts concerns this month correctly", () => {
    const result = calculateSafeguardingMetrics(concerns, "home-001", "org-001", now);
    expect(result.concernsThisMonth).toBe(3); // May 10, 15, 16
  });

  it("breaks down by category", () => {
    const result = calculateSafeguardingMetrics(concerns, "home-001", "org-001", now);
    expect(result.byCategory.length).toBeGreaterThanOrEqual(3);
  });

  it("breaks down by severity", () => {
    const result = calculateSafeguardingMetrics(concerns, "home-001", "org-001", now);
    const high = result.bySeverity.find(s => s.severity === "high");
    expect(high?.count).toBe(2);
  });

  it("counts referrals made", () => {
    const withReferrals = [
      makeConcern({ id: "c1", referrals: [makeReferral()] }),
      makeConcern({ id: "c2", referrals: [makeReferral({ id: "r2" }), makeReferral({ id: "r3" })] }),
    ];
    const result = calculateSafeguardingMetrics(withReferrals, "home-001", "org-001", now);
    expect(result.referralsMade).toBe(3);
  });

  it("calculates average escalation level", () => {
    const result = calculateSafeguardingMetrics(concerns, "home-001", "org-001", now);
    // (3+2+1+4)/4 = 2.5
    expect(result.averageEscalationLevel).toBe(2.5);
  });

  it("identifies child protection plans", () => {
    const cppConcerns = [
      makeConcern({ id: "c1", status: "child_protection_plan" }),
    ];
    const result = calculateSafeguardingMetrics(cppConcerns, "home-001", "org-001", now);
    expect(result.childProtectionPlans).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Timeline Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("buildSafeguardingTimeline", () => {
  it("detects cumulative harm (3+ active concerns)", () => {
    const concerns = [
      makeConcern({ id: "c1", status: "ongoing_monitoring" }),
      makeConcern({ id: "c2", status: "referral_made" }),
      makeConcern({ id: "c3", status: "information_gathering" }),
    ];
    const result = buildSafeguardingTimeline(concerns, [], "child-001");
    expect(result.riskIndicators.some(r => r.includes("cumulative harm"))).toBe(true);
  });

  it("flags exploitation concerns", () => {
    const concerns = [
      makeConcern({ id: "c1", category: "child_sexual_exploitation", status: "ongoing_monitoring" }),
    ];
    const result = buildSafeguardingTimeline(concerns, [], "child-001");
    expect(result.riskIndicators.some(r => r.includes("Exploitation"))).toBe(true);
  });

  it("flags repeat self-harm", () => {
    const concerns = [
      makeConcern({ id: "c1", category: "self_harm", status: "ongoing_monitoring" }),
      makeConcern({ id: "c2", category: "self_harm", status: "closed" }),
    ];
    const result = buildSafeguardingTimeline(concerns, [], "child-001");
    expect(result.riskIndicators.some(r => r.includes("self-harm"))).toBe(true);
  });

  it("detects escalating severity pattern", () => {
    const concerns = [
      makeConcern({ id: "c1", severity: "low", raisedAt: "2026-05-01T10:00:00Z", status: "closed" }),
      makeConcern({ id: "c2", severity: "medium", raisedAt: "2026-05-05T10:00:00Z", status: "closed" }),
      makeConcern({ id: "c3", severity: "high", raisedAt: "2026-05-10T10:00:00Z", status: "ongoing_monitoring" }),
    ];
    const result = buildSafeguardingTimeline(concerns, [], "child-001");
    expect(result.patternFlags.some(f => f.includes("Escalating pattern"))).toBe(true);
  });

  it("flags multiple concern categories", () => {
    const concerns = [
      makeConcern({ id: "c1", category: "physical_abuse" }),
      makeConcern({ id: "c2", category: "self_harm" }),
      makeConcern({ id: "c3", category: "online_harm" }),
      makeConcern({ id: "c4", category: "neglect" }),
    ];
    const result = buildSafeguardingTimeline(concerns, [], "child-001");
    expect(result.patternFlags.some(f => f.includes("different categories"))).toBe(true);
  });

  it("flags unresolved referrals", () => {
    const concerns = [
      makeConcern({ id: "c1", referrals: [makeReferral({ responseReceived: false })] }),
      makeConcern({ id: "c2", referrals: [makeReferral({ id: "r2", responseReceived: false })] }),
    ];
    const result = buildSafeguardingTimeline(concerns, [], "child-001");
    expect(result.patternFlags.some(f => f.includes("referrals without agency response"))).toBe(true);
  });

  it("sorts chronology by date descending", () => {
    const chronology: ChronologyEntry[] = [
      { id: "e1", childId: "child-001", date: "2026-05-10T10:00:00Z", category: "concern", description: "First", significance: "significant", source: "staff-001" },
      { id: "e2", childId: "child-001", date: "2026-05-15T10:00:00Z", category: "action", description: "Second", significance: "routine", source: "staff-001" },
    ];
    const result = buildSafeguardingTimeline([], chronology, "child-001");
    expect(result.entries[0].id).toBe("e2"); // most recent first
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Overdue Detection Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("getOverdueConcerns", () => {
  const now = "2026-05-17T12:00:00Z";

  it("detects overdue review dates", () => {
    const concerns = [
      makeConcern({ id: "c1", reviewDate: "2026-05-15T09:00:00Z", status: "ongoing_monitoring" }),
    ];
    const result = getOverdueConcerns(concerns, now);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("review");
    expect(result[0].overdueBy).toBe(2);
  });

  it("does not flag future review dates", () => {
    const concerns = [
      makeConcern({ id: "c1", reviewDate: "2026-05-20T09:00:00Z", status: "ongoing_monitoring" }),
    ];
    const result = getOverdueConcerns(concerns, now);
    expect(result.length).toBe(0);
  });

  it("flags concerns with no review scheduled (stale)", () => {
    const concerns = [
      makeConcern({
        id: "c1",
        reviewDate: undefined,
        severity: "medium",
        status: "ongoing_monitoring",
        lastUpdatedAt: "2026-05-01T09:00:00Z", // 16 days ago, > 7 day threshold
      }),
    ];
    const result = getOverdueConcerns(concerns, now);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("no_review_scheduled");
  });

  it("uses shorter threshold for high severity", () => {
    const concerns = [
      makeConcern({
        id: "c1",
        reviewDate: undefined,
        severity: "high",
        status: "referral_made",
        lastUpdatedAt: "2026-05-13T09:00:00Z", // 4 days ago, > 3 day threshold for high
      }),
    ];
    const result = getOverdueConcerns(concerns, now);
    expect(result.length).toBe(1);
  });

  it("detects unacknowledged referrals", () => {
    const concerns = [
      makeConcern({
        id: "c1",
        status: "referral_made",
        referrals: [makeReferral({
          acknowledged: false,
          referralDate: "2026-05-10T09:00:00Z", // 7 days ago
        })],
      }),
    ];
    const result = getOverdueConcerns(concerns, now);
    expect(result.some(r => r.type === "unacknowledged_referral")).toBe(true);
  });

  it("ignores closed concerns", () => {
    const concerns = [
      makeConcern({ id: "c1", status: "closed", reviewDate: "2026-05-10T09:00:00Z" }),
    ];
    const result = getOverdueConcerns(concerns, now);
    expect(result.length).toBe(0);
  });

  it("sorts by overdue days descending", () => {
    const concerns = [
      makeConcern({ id: "c1", reviewDate: "2026-05-15T09:00:00Z", status: "ongoing_monitoring" }), // 2 days
      makeConcern({ id: "c2", reviewDate: "2026-05-10T09:00:00Z", status: "ongoing_monitoring" }), // 7 days
    ];
    const result = getOverdueConcerns(concerns, now);
    expect(result[0].concern.id).toBe("c2");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Function Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("formatCategory returns readable labels", () => {
    expect(formatCategory("child_sexual_exploitation")).toBe("CSE");
    expect(formatCategory("child_criminal_exploitation")).toBe("CCE");
    expect(formatCategory("honour_based_abuse")).toBe("HBA/FGM");
    expect(formatCategory("allegation_against_staff")).toBe("Staff Allegation");
    expect(formatCategory("physical_abuse")).toBe("Physical Abuse");
  });

  it("formatSeverity returns readable labels", () => {
    expect(formatSeverity("low")).toBe("Low");
    expect(formatSeverity("immediate")).toBe("Immediate");
  });

  it("formatStatus returns readable labels", () => {
    expect(formatStatus("strategy_discussion")).toBe("Strategy Discussion");
    expect(formatStatus("child_protection_plan")).toBe("Child Protection Plan");
    expect(formatStatus("section_47_enquiry")).toBe("Section 47 Enquiry");
  });

  it("requiresOfstedNotification detects correct cases", () => {
    expect(requiresOfstedNotification(makeConcern({ escalationLevel: 4 }))).toBe(true);
    expect(requiresOfstedNotification(makeConcern({ severity: "immediate" }))).toBe(true);
    expect(requiresOfstedNotification(makeConcern({ category: "allegation_against_staff" }))).toBe(true);
    expect(requiresOfstedNotification(makeConcern({ category: "sexual_abuse" }))).toBe(true);
    expect(requiresOfstedNotification(makeConcern({ severity: "low", escalationLevel: 1, category: "other" }))).toBe(false);
  });

  it("isHighRiskCategory identifies correct categories", () => {
    expect(isHighRiskCategory("sexual_abuse")).toBe(true);
    expect(isHighRiskCategory("child_sexual_exploitation")).toBe(true);
    expect(isHighRiskCategory("trafficking")).toBe(true);
    expect(isHighRiskCategory("allegation_against_staff")).toBe(true);
    expect(isHighRiskCategory("self_harm")).toBe(false);
    expect(isHighRiskCategory("other")).toBe(false);
  });
});
