// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Family Contact & Communication Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateFamilyContactIntelligence,
  evaluateContactCompliance,
  evaluateContactQuality,
  evaluateContactImpact,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getFamilyMemberLabel,
  getImpactIndicatorLabel,
} from "../family-contact-engine";
import type {
  ContactArrangement,
  ContactSession,
  ContactReview,
} from "../family-contact-engine";

// ── Fixtures ───────────────────────────────────────────────────────────────

const makeArrangement = (overrides: Partial<ContactArrangement> = {}): ContactArrangement => ({
  id: "arr-1",
  childId: "child-1",
  childName: "Alex",
  familyMemberId: "fm-1",
  familyMemberName: "Mum (Jane)",
  familyMemberType: "mother",
  contactType: "supervised_visit",
  agreedFrequency: "weekly",
  isCourtOrdered: true,
  supervisedRequired: true,
  placingAuthorityAgreed: true,
  startDate: "2026-01-01",
  reviewDate: "2026-06-01",
  ...overrides,
});

const makeSession = (overrides: Partial<ContactSession> = {}): ContactSession => ({
  id: "sess-1",
  arrangementId: "arr-1",
  childId: "child-1",
  scheduledDate: "2026-05-10",
  scheduledTime: "14:00",
  actualDate: "2026-05-10",
  duration: 60,
  contactType: "supervised_visit",
  outcome: "positive",
  familyMemberPresent: true,
  supervisorPresent: true,
  childPrepared: true,
  impactIndicators: ["settled_after", "positive_mood"],
  childVoiceRecorded: true,
  childWishesFeelings: "Alex said they enjoyed seeing Mum",
  placingAuthorityInformed: true,
  ...overrides,
});

const makeReview = (overrides: Partial<ContactReview> = {}): ContactReview => ({
  id: "rev-1",
  arrangementId: "arr-1",
  reviewDate: "2026-05-15",
  reviewedBy: "Darren Laville (RM)",
  overallAssessment: "meeting_needs",
  childViewConsidered: true,
  frequencyAppropriate: true,
  typeAppropriate: true,
  nextReviewDate: "2026-08-15",
  ...overrides,
});

// ── evaluateContactCompliance ──────────────────────────────────────────────

describe("evaluateContactCompliance", () => {
  it("returns 100% court-ordered compliance when all sessions honoured", () => {
    const arrangements = [makeArrangement({ isCourtOrdered: true })];
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", outcome: "positive" }),
      makeSession({ id: "s2", scheduledDate: "2026-05-12", outcome: "mixed" }),
    ];

    const result = evaluateContactCompliance(arrangements, sessions, "2026-05-01", "2026-05-18");
    expect(result.courtOrderedComplianceRate).toBe(100);
    expect(result.courtOrderedCompliant).toBe(1);
  });

  it("flags non-compliance when home cancels court-ordered contact", () => {
    const arrangements = [makeArrangement({ isCourtOrdered: true })];
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", outcome: "positive" }),
      makeSession({ id: "s2", scheduledDate: "2026-05-12", outcome: "cancelled_by_home" }),
      makeSession({ id: "s3", scheduledDate: "2026-05-14", outcome: "cancelled_by_home" }),
      makeSession({ id: "s4", scheduledDate: "2026-05-16", outcome: "cancelled_by_home" }),
    ];

    const result = evaluateContactCompliance(arrangements, sessions, "2026-05-01", "2026-05-18");
    expect(result.courtOrderedComplianceRate).toBe(0);
    expect(result.cancellationsByHome).toBe(3);
  });

  it("tracks all cancellation types", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", outcome: "cancelled_by_family" }),
      makeSession({ id: "s2", scheduledDate: "2026-05-07", outcome: "cancelled_by_home" }),
      makeSession({ id: "s3", scheduledDate: "2026-05-09", outcome: "child_refused" }),
      makeSession({ id: "s4", scheduledDate: "2026-05-11", outcome: "no_show" }),
    ];

    const result = evaluateContactCompliance([], sessions, "2026-05-01", "2026-05-18");
    expect(result.cancellationsByFamily).toBe(1);
    expect(result.cancellationsByHome).toBe(1);
    expect(result.childRefusals).toBe(1);
    expect(result.noShows).toBe(1);
  });

  it("calculates completion rate", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", outcome: "positive" }),
      makeSession({ id: "s2", scheduledDate: "2026-05-08", outcome: "mixed" }),
      makeSession({ id: "s3", scheduledDate: "2026-05-11", outcome: "cancelled_by_home" }),
      makeSession({ id: "s4", scheduledDate: "2026-05-14", outcome: "no_show" }),
    ];

    const result = evaluateContactCompliance([], sessions, "2026-05-01", "2026-05-18");
    // 2 completed (positive + mixed) out of 4 = 50%
    expect(result.completionRate).toBe(50);
  });

  it("filters to period", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-04-30", outcome: "positive" }), // outside
      makeSession({ id: "s2", scheduledDate: "2026-05-10", outcome: "positive" }),
    ];

    const result = evaluateContactCompliance([], sessions, "2026-05-01", "2026-05-18");
    expect(result.sessionsScheduled).toBe(1);
  });
});

// ── evaluateContactQuality ─────────────────────────────────────────────────

describe("evaluateContactQuality", () => {
  it("calculates positive outcome rate", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", outcome: "positive" }),
      makeSession({ id: "s2", scheduledDate: "2026-05-08", outcome: "positive" }),
      makeSession({ id: "s3", scheduledDate: "2026-05-11", outcome: "mixed" }),
    ];

    const result = evaluateContactQuality(sessions, "2026-05-01", "2026-05-18");
    expect(result.positiveRate).toBe(67); // 2/3
  });

  it("excludes cancelled sessions from quality metrics", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", outcome: "positive" }),
      makeSession({ id: "s2", scheduledDate: "2026-05-08", outcome: "cancelled_by_family" }),
    ];

    const result = evaluateContactQuality(sessions, "2026-05-01", "2026-05-18");
    expect(result.totalSessions).toBe(1);
    expect(result.positiveRate).toBe(100);
  });

  it("tracks child preparation rate", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", childPrepared: true }),
      makeSession({ id: "s2", scheduledDate: "2026-05-08", childPrepared: false }),
    ];

    const result = evaluateContactQuality(sessions, "2026-05-01", "2026-05-18");
    expect(result.childPreparedRate).toBe(50);
  });

  it("tracks child voice recorded rate", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", childVoiceRecorded: true }),
      makeSession({ id: "s2", scheduledDate: "2026-05-08", childVoiceRecorded: true }),
      makeSession({ id: "s3", scheduledDate: "2026-05-11", childVoiceRecorded: false }),
    ];

    const result = evaluateContactQuality(sessions, "2026-05-01", "2026-05-18");
    expect(result.childVoiceRecordedRate).toBe(67);
  });

  it("calculates average duration", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", duration: 60 }),
      makeSession({ id: "s2", scheduledDate: "2026-05-08", duration: 90 }),
    ];

    const result = evaluateContactQuality(sessions, "2026-05-01", "2026-05-18");
    expect(result.averageDurationMinutes).toBe(75);
  });
});

// ── evaluateContactImpact ──────────────────────────────────────────────────

describe("evaluateContactImpact", () => {
  it("calculates settled-after rate", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", impactIndicators: ["settled_after"] }),
      makeSession({ id: "s2", scheduledDate: "2026-05-08", impactIndicators: ["settled_after", "positive_mood"] }),
      makeSession({ id: "s3", scheduledDate: "2026-05-11", impactIndicators: ["dysregulated_after"] }),
    ];

    const result = evaluateContactImpact(sessions, [], "2026-05-01", "2026-05-18");
    expect(result.settledAfterRate).toBe(67); // 2/3
  });

  it("identifies high-risk impact indicators", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", impactIndicators: ["dysregulated_after", "self_harm_risk"] }),
      makeSession({ id: "s2", scheduledDate: "2026-05-08", impactIndicators: ["absconding_risk"] }),
    ];

    const result = evaluateContactImpact(sessions, [], "2026-05-01", "2026-05-18");
    expect(result.highRiskImpacts.length).toBeGreaterThan(0);
    expect(result.highRiskImpacts.some((h) => h.indicator === "self_harm_risk")).toBe(true);
  });

  it("builds impact patterns per family member", () => {
    const arrangements = [makeArrangement({ id: "arr-1", familyMemberName: "Mum (Jane)" })];
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", arrangementId: "arr-1", impactIndicators: ["settled_after"] }),
      makeSession({ id: "s2", scheduledDate: "2026-05-12", arrangementId: "arr-1", impactIndicators: ["settled_after", "positive_mood"] }),
    ];

    const result = evaluateContactImpact(sessions, arrangements, "2026-05-01", "2026-05-18");
    expect(result.impactPatterns.length).toBeGreaterThan(0);
    expect(result.impactPatterns[0].familyMember).toBe("Mum (Jane)");
    expect(result.impactPatterns[0].predominantImpact).toBe("positive");
  });

  it("handles sessions with no impact data", () => {
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", impactIndicators: [] }),
    ];

    const result = evaluateContactImpact(sessions, [], "2026-05-01", "2026-05-18");
    expect(result.sessionsWithImpactData).toBe(0);
    expect(result.settledAfterRate).toBe(0);
  });
});

// ── generateFamilyContactIntelligence ──────────────────────────────────────

describe("generateFamilyContactIntelligence", () => {
  it("produces good score for well-managed contact", () => {
    const arrangements = [
      makeArrangement({ id: "arr-1", isCourtOrdered: true }),
      makeArrangement({ id: "arr-2", childId: "child-2", childName: "Jordan", familyMemberName: "Dad (Steve)", familyMemberType: "father", isCourtOrdered: false }),
    ];
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", outcome: "positive", impactIndicators: ["settled_after"] }),
      makeSession({ id: "s2", scheduledDate: "2026-05-12", outcome: "positive", impactIndicators: ["settled_after", "positive_mood"] }),
      makeSession({ id: "s3", scheduledDate: "2026-05-08", arrangementId: "arr-2", childId: "child-2", outcome: "positive", impactIndicators: ["positive_mood"] }),
    ];
    const reviews = [makeReview()];

    const result = generateFamilyContactIntelligence(
      arrangements, sessions, reviews, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.rating).toMatch(/outstanding|good/);
    expect(result.compliance.courtOrderedComplianceRate).toBe(100);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("flags concerns when contact is distressing", () => {
    const arrangements = [makeArrangement()];
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", outcome: "distressing", impactIndicators: ["dysregulated_after", "aggressive_after"] }),
      makeSession({ id: "s2", scheduledDate: "2026-05-12", outcome: "negative", impactIndicators: ["withdrawn_after", "sleep_disrupted"] }),
      makeSession({ id: "s3", scheduledDate: "2026-05-14", outcome: "distressing", impactIndicators: ["self_harm_risk"] }),
    ];

    const result = generateFamilyContactIntelligence(
      arrangements, sessions, [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.impact.highRiskImpacts.length).toBeGreaterThan(0);
    const alexSummary = result.childSummaries.find((c) => c.childId === "child-1");
    expect(alexSummary?.primaryConcern).toBeDefined();
    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
  });

  it("identifies overdue contact reviews", () => {
    const arrangements = [makeArrangement({ reviewDate: "2026-05-10" })]; // due May 10
    const reviews: ContactReview[] = []; // no reviews done

    const result = generateFamilyContactIntelligence(
      arrangements, [], reviews, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.reviewsOverdue).toBe(1);
  });

  it("generates per-child summaries", () => {
    const arrangements = [
      makeArrangement({ id: "arr-1", childId: "child-1", childName: "Alex" }),
      makeArrangement({ id: "arr-2", childId: "child-2", childName: "Jordan", familyMemberName: "Dad" }),
    ];
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", childId: "child-1", arrangementId: "arr-1" }),
      makeSession({ id: "s2", scheduledDate: "2026-05-08", childId: "child-2", arrangementId: "arr-2" }),
    ];

    const result = generateFamilyContactIntelligence(
      arrangements, sessions, [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.childSummaries).toHaveLength(2);
    expect(result.childSummaries.some((c) => c.childName === "Alex")).toBe(true);
    expect(result.childSummaries.some((c) => c.childName === "Jordan")).toBe(true);
  });

  it("includes regulatory links", () => {
    const arrangements = [makeArrangement({ isCourtOrdered: true })];

    const result = generateFamilyContactIntelligence(
      arrangements, [], [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.regulatoryLinks.some((l) => l.includes("Reg 22"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("handles empty data", () => {
    const result = generateFamilyContactIntelligence(
      [], [], [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.childSummaries).toHaveLength(0);
  });

  it("flags child refusals as area for development", () => {
    const arrangements = [makeArrangement()];
    const sessions = [
      makeSession({ id: "s1", scheduledDate: "2026-05-05", outcome: "child_refused" }),
      makeSession({ id: "s2", scheduledDate: "2026-05-12", outcome: "child_refused" }),
      makeSession({ id: "s3", scheduledDate: "2026-05-14", outcome: "positive" }),
    ];

    const result = generateFamilyContactIntelligence(
      arrangements, sessions, [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.compliance.childRefusals).toBe(2);
    expect(result.areasForDevelopment.some((a) => a.includes("refusal"))).toBe(true);
  });

  it("populates metadata", () => {
    const result = generateFamilyContactIntelligence(
      [], [], [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-05-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.assessedAt).toBeTruthy();
  });
});

// ── Label Utilities ────────────────────────────────────────────────────────

describe("utility label functions", () => {
  it("getContactTypeLabel", () => {
    expect(getContactTypeLabel("supervised_visit")).toBe("Supervised Visit");
    expect(getContactTypeLabel("video_call")).toBe("Video Call");
    expect(getContactTypeLabel("overnight_stay")).toBe("Overnight Stay");
  });

  it("getContactOutcomeLabel", () => {
    expect(getContactOutcomeLabel("positive")).toBe("Positive");
    expect(getContactOutcomeLabel("cancelled_by_home")).toBe("Cancelled (Home)");
    expect(getContactOutcomeLabel("child_refused")).toBe("Child Refused");
  });

  it("getFamilyMemberLabel", () => {
    expect(getFamilyMemberLabel("mother")).toBe("Mother");
    expect(getFamilyMemberLabel("sibling")).toBe("Sibling");
  });

  it("getImpactIndicatorLabel", () => {
    expect(getImpactIndicatorLabel("settled_after")).toBe("Settled After Contact");
    expect(getImpactIndicatorLabel("self_harm_risk")).toBe("Self-Harm Risk");
    expect(getImpactIndicatorLabel("absconding_risk")).toBe("Absconding Risk");
  });
});
