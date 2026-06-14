// ══════════════════════════════════════════════════════════════════════════════
// Cara Quality Ecology — QA Sampling Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  selectSamples,
  submitQAReview,
  calculateQAMetrics,
} from "../qa-sampling";
import type {
  QASampleSelection,
  StaffQAProfile,
  QAReviewInput,
  QAReview,
} from "../qa-sampling";
import type { ScheduledOccurrence, TaskTemplate } from "../types";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeOccurrence(overrides: Partial<ScheduledOccurrence> = {}): ScheduledOccurrence {
  return {
    id: "occ-1",
    templateId: "tpl-1",
    templateName: "Fire Check",
    homeId: "home-1",
    dueDate: "2026-05-16",
    scheduledAt: "2026-05-15T00:00:00Z",
    status: "approved",
    statusHistory: [],
    completedBy: "staff-1",
    completedAt: "2026-05-16T09:00:00Z",
    approvalLevel: 1,
    resubmissionCount: 0,
    qaRequired: true,
    evidenceTags: [],
    escalationLevel: 0,
    caraReviewed: false,
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<TaskTemplate> = {}): TaskTemplate {
  return {
    id: "tpl-1",
    name: "Fire Check",
    description: "Daily check",
    category: "H&S",
    version: 1,
    scheduleFrequency: "daily",
    completionRoles: ["rsw"],
    approvalLevel: 1,
    gracePeriodMinutes: 30,
    reminderMinutesBefore: 15,
    firstEscalationMinutes: 60,
    firstEscalationTo: "team_leader",
    requiresEvidence: true,
    requiresChildVoice: false,
    requiresManagerReview: false,
    qaRequired: true,
    qaSamplePercentage: 20,
    caraReviewRequired: false,
    filingLocation: "H&S > Fire",
    evidenceTags: [],
    regulationLinks: [],
    qualityStandardLinks: [],
    feedsAnnexA: false,
    feedsReg44: false,
    feedsReg45: false,
    sensitivity: "internal",
    selfApprovalAllowed: false,
    locksAfterApproval: true,
    retentionCategory: "6_years",
    active: true,
    homeIds: ["home-1"],
    childSpecific: false,
    ...overrides,
  };
}

function makeStaffProfile(overrides: Partial<StaffQAProfile> = {}): StaffQAProfile {
  return {
    userId: "staff-1",
    totalCompletions: 50,
    recentReturnCount: 0,
    isNewStaff: false,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// selectSamples
// ══════════════════════════════════════════════════════════════════════════════

describe("selectSamples", () => {
  describe("basic sampling", () => {
    it("returns empty for no eligible occurrences", () => {
      const result = selectSamples([], makeTemplate(), []);
      expect(result).toHaveLength(0);
    });

    it("skips already-sampled occurrences", () => {
      const occs = [
        makeOccurrence({ id: "occ-1", qaSampledAt: "2026-05-16T10:00:00Z" }),
      ];
      const result = selectSamples(occs, makeTemplate(), []);
      expect(result).toHaveLength(0);
    });

    it("only selects approved/locked/filed occurrences", () => {
      const occs = [
        makeOccurrence({ id: "occ-1", status: "submitted" }),
        makeOccurrence({ id: "occ-2", status: "in_progress" }),
        makeOccurrence({ id: "occ-3", status: "approved" }),
      ];
      const result = selectSamples(occs, makeTemplate(), []);
      expect(result).toHaveLength(1);
      expect(result[0].occurrenceId).toBe("occ-3");
    });

    it("respects sample percentage", () => {
      const occs = Array.from({ length: 10 }, (_, i) =>
        makeOccurrence({ id: `occ-${i}`, completedBy: `staff-${i}` }),
      );
      const tpl = makeTemplate({ qaSamplePercentage: 30 });
      const result = selectSamples(occs, tpl, []);
      expect(result.length).toBe(3); // 30% of 10
    });

    it("always selects at least 1", () => {
      const occs = [makeOccurrence()];
      const tpl = makeTemplate({ qaSamplePercentage: 1 }); // 1% of 1 rounds up to 1
      const result = selectSamples(occs, tpl, []);
      expect(result.length).toBe(1);
    });
  });

  describe("weighting", () => {
    it("prioritises new staff", () => {
      const occs = [
        makeOccurrence({ id: "occ-1", completedBy: "experienced" }),
        makeOccurrence({ id: "occ-2", completedBy: "newbie" }),
      ];
      const profiles = [
        makeStaffProfile({ userId: "experienced", isNewStaff: false }),
        makeStaffProfile({ userId: "newbie", isNewStaff: true }),
      ];
      const tpl = makeTemplate({ qaSamplePercentage: 50, qaRequired: false });
      const result = selectSamples(occs, tpl, profiles);
      // New staff should be first (higher weight)
      expect(result[0].completedBy).toBe("newbie");
      expect(result[0].reason).toBe("new_staff");
    });

    it("prioritises staff with high return rate", () => {
      const occs = [
        makeOccurrence({ id: "occ-1", completedBy: "good-staff" }),
        makeOccurrence({ id: "occ-2", completedBy: "returning-staff" }),
      ];
      const profiles = [
        makeStaffProfile({ userId: "good-staff", recentReturnCount: 0 }),
        makeStaffProfile({ userId: "returning-staff", recentReturnCount: 3 }),
      ];
      const tpl = makeTemplate({ qaSamplePercentage: 50, qaRequired: false });
      const result = selectSamples(occs, tpl, profiles);
      expect(result[0].completedBy).toBe("returning-staff");
      expect(result[0].reason).toBe("high_return_rate");
    });

    it("prioritises high approval level items", () => {
      const occs = [
        makeOccurrence({ id: "occ-1", approvalLevel: 0, completedBy: "s-1" }),
        makeOccurrence({ id: "occ-2", approvalLevel: 3, completedBy: "s-2" }),
      ];
      const tpl = makeTemplate({ qaSamplePercentage: 50, qaRequired: false });
      const result = selectSamples(occs, tpl, []);
      expect(result[0].occurrenceId).toBe("occ-2");
      expect(result[0].reason).toBe("high_risk");
    });

    it("marks regulatory for qaRequired templates", () => {
      const occs = [makeOccurrence()];
      const tpl = makeTemplate({ qaRequired: true });
      const result = selectSamples(occs, tpl, []);
      expect(result[0].reason).toBe("regulatory");
    });

    it("weights resubmitted work higher", () => {
      const occs = [
        makeOccurrence({ id: "occ-1", resubmissionCount: 0, completedBy: "s-1" }),
        makeOccurrence({ id: "occ-2", resubmissionCount: 2, completedBy: "s-2" }),
      ];
      const tpl = makeTemplate({ qaSamplePercentage: 50, qaRequired: false });
      const profiles = [
        makeStaffProfile({ userId: "s-1" }),
        makeStaffProfile({ userId: "s-2" }),
      ];
      const result = selectSamples(occs, tpl, profiles);
      expect(result[0].occurrenceId).toBe("occ-2");
    });
  });

  describe("sample metadata", () => {
    it("includes template info in selection", () => {
      const occs = [makeOccurrence()];
      const tpl = makeTemplate({ id: "fire-tpl", name: "Fire Safety Check" });
      const result = selectSamples(occs, tpl, []);
      expect(result[0].templateId).toBe("fire-tpl");
      expect(result[0].templateName).toBe("Fire Safety Check");
      expect(result[0].homeId).toBe("home-1");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// submitQAReview
// ══════════════════════════════════════════════════════════════════════════════

describe("submitQAReview", () => {
  describe("successful review", () => {
    it("submits a passing review (score 5)", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 5,
        findings: "Excellent record. All sections complete with detailed evidence.",
        actionsRequired: [],
        learningIdentified: ["Good practice model for team sharing"],
        followUpRequired: false,
      };
      const result = submitQAReview(input, "deputy_manager", FIXED_NOW);
      expect(result.success).toBe(true);
      expect(result.review?.qualityScore).toBe(5);
      expect(result.review?.qualityBand).toBe("outstanding");
      expect(result.review?.outcome).toBe("pass");
    });

    it("submits a good review (score 4)", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 4,
        findings: "Good record with minor areas for development.",
        actionsRequired: [],
        learningIdentified: [],
        followUpRequired: false,
      };
      const result = submitQAReview(input, "registered_manager", FIXED_NOW);
      expect(result.review?.qualityBand).toBe("good");
      expect(result.review?.outcome).toBe("pass");
    });

    it("submits with minor actions (score 3, few actions)", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 3,
        findings: "Adequate but needs improvement in child voice section.",
        actionsRequired: ["Add direct quotes from child"],
        learningIdentified: ["Child voice workshop"],
        followUpRequired: true,
        followUpDue: "2026-05-23",
      };
      const result = submitQAReview(input, "deputy_manager", FIXED_NOW);
      expect(result.review?.qualityBand).toBe("requires_improvement");
      expect(result.review?.outcome).toBe("minor_actions");
      expect(result.review?.followUpRequired).toBe(true);
    });

    it("submits with significant actions (score 2)", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 2,
        findings: "Multiple missing sections. No evidence attached.",
        actionsRequired: ["Complete all sections", "Attach evidence photos", "Add risk assessment reference"],
        learningIdentified: ["Recording standards training"],
        followUpRequired: true,
        followUpDue: "2026-05-20",
      };
      const result = submitQAReview(input, "deputy_manager", FIXED_NOW);
      expect(result.review?.qualityBand).toBe("inadequate");
      expect(result.review?.outcome).toBe("significant_actions");
    });

    it("submits a failing review (score 1)", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 1,
        findings: "Record is incomplete, inaccurate, and potentially misleading.",
        actionsRequired: ["Complete rewrite required", "Supervision discussion", "Capability concern"],
        learningIdentified: ["One-to-one coaching"],
        followUpRequired: true,
        followUpDue: "2026-05-18",
      };
      const result = submitQAReview(input, "registered_manager", FIXED_NOW);
      expect(result.review?.qualityBand).toBe("inadequate");
      expect(result.review?.outcome).toBe("fail");
    });
  });

  describe("validation", () => {
    it("rejects team_leader (requires deputy_manager+)", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 4,
        findings: "Good.",
        actionsRequired: [],
        learningIdentified: [],
        followUpRequired: false,
      };
      const result = submitQAReview(input, "team_leader", FIXED_NOW);
      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot perform QA reviews");
    });

    it("rejects rsw", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 4,
        findings: "Good.",
        actionsRequired: [],
        learningIdentified: [],
        followUpRequired: false,
      };
      const result = submitQAReview(input, "rsw", FIXED_NOW);
      expect(result.success).toBe(false);
    });

    it("rejects score below 1", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 0,
        findings: "Bad.",
        actionsRequired: [],
        learningIdentified: [],
        followUpRequired: false,
      };
      const result = submitQAReview(input, "deputy_manager", FIXED_NOW);
      expect(result.success).toBe(false);
      expect(result.error).toContain("between 1 and 5");
    });

    it("rejects score above 5", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 6,
        findings: "Amazing.",
        actionsRequired: [],
        learningIdentified: [],
        followUpRequired: false,
      };
      const result = submitQAReview(input, "deputy_manager", FIXED_NOW);
      expect(result.success).toBe(false);
    });

    it("rejects empty findings", () => {
      const input: QAReviewInput = {
        occurrenceId: "occ-1",
        reviewerId: "reviewer-1",
        qualityScore: 4,
        findings: "",
        actionsRequired: [],
        learningIdentified: [],
        followUpRequired: false,
      };
      const result = submitQAReview(input, "deputy_manager", FIXED_NOW);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Findings are required");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateQAMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateQAMetrics", () => {
  it("returns defaults for empty reviews", () => {
    const metrics = calculateQAMetrics([]);
    expect(metrics.totalSampled).toBe(0);
    expect(metrics.averageScore).toBe(0);
    expect(metrics.passRate).toBe(100);
  });

  it("calculates average score", () => {
    const reviews: QAReview[] = [
      makeReview({ qualityScore: 5 }),
      makeReview({ id: "qa-2", qualityScore: 3 }),
      makeReview({ id: "qa-3", qualityScore: 4 }),
    ];
    const metrics = calculateQAMetrics(reviews);
    expect(metrics.averageScore).toBe(4); // (5+3+4)/3 = 4.0
  });

  it("calculates pass rate (score >= 3)", () => {
    const reviews: QAReview[] = [
      makeReview({ qualityScore: 5 }),
      makeReview({ id: "qa-2", qualityScore: 2 }),
      makeReview({ id: "qa-3", qualityScore: 4 }),
      makeReview({ id: "qa-4", qualityScore: 1 }),
    ];
    const metrics = calculateQAMetrics(reviews);
    expect(metrics.passRate).toBe(50); // 2 out of 4 pass
  });

  it("counts quality band distribution", () => {
    const reviews: QAReview[] = [
      makeReview({ qualityBand: "outstanding" }),
      makeReview({ id: "qa-2", qualityBand: "good" }),
      makeReview({ id: "qa-3", qualityBand: "good" }),
      makeReview({ id: "qa-4", qualityBand: "requires_improvement" }),
      makeReview({ id: "qa-5", qualityBand: "inadequate" }),
    ];
    const metrics = calculateQAMetrics(reviews);
    expect(metrics.qualityBandDistribution.outstanding).toBe(1);
    expect(metrics.qualityBandDistribution.good).toBe(2);
    expect(metrics.qualityBandDistribution.requires_improvement).toBe(1);
    expect(metrics.qualityBandDistribution.inadequate).toBe(1);
  });

  it("counts total actions and learning", () => {
    const reviews: QAReview[] = [
      makeReview({ actionsRequired: ["a", "b"], learningIdentified: ["l1"] }),
      makeReview({ id: "qa-2", actionsRequired: ["c"], learningIdentified: ["l2", "l3"] }),
    ];
    const metrics = calculateQAMetrics(reviews);
    expect(metrics.totalActions).toBe(3);
    expect(metrics.totalLearning).toBe(3);
  });

  it("counts follow-ups outstanding", () => {
    const reviews: QAReview[] = [
      makeReview({ followUpRequired: true }),
      makeReview({ id: "qa-2", followUpRequired: false }),
      makeReview({ id: "qa-3", followUpRequired: true }),
    ];
    const metrics = calculateQAMetrics(reviews);
    expect(metrics.followUpsOutstanding).toBe(2);
  });
});

// ── Helper ─────────────────────────────────────────────────────────────────

function makeReview(overrides: Partial<QAReview> = {}): QAReview {
  return {
    id: "qa-1",
    occurrenceId: "occ-1",
    reviewerId: "reviewer-1",
    reviewedAt: FIXED_NOW,
    qualityScore: 4,
    qualityBand: "good",
    findings: "Good record.",
    actionsRequired: [],
    learningIdentified: [],
    followUpRequired: false,
    outcome: "pass",
    ...overrides,
  };
}
