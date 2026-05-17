// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Inspection — Readiness Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  calculateInspectionReadiness,
  scoreToJudgement,
  getDomainLabel,
} from "../readiness-engine";
import type { InspectionInputs } from "../readiness-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeInputs(overrides: Partial<InspectionInputs> = {}): InspectionInputs {
  return {
    homeId: "home-oak",
    lastInspectionDate: "2025-11-15T00:00:00Z",

    // Quality Ecology — good
    qualityCompliance: 95,
    overdueRecords: 1,
    filedRecords: 450,
    averageQAScore: 4.2,
    returnRate: 8,

    // Safeguarding — good
    safeguardingIncidents: 2,
    safeguardingReferrals: 1,
    disclosuresHandled: 1,
    missingEpisodes: 2,
    returnInterviewsCompleted: 2,
    returnInterviewsRequired: 2,

    // Workforce — good
    trainingComplianceRate: 90,
    supervisionComplianceRate: 85,
    vacancyRate: 10,
    agencyUsageRate: 15,
    turnoverRate: 18,
    qualificationRate: 80,
    staffWithExpiredTraining: 0,

    // Regulatory — good
    reg44CompletedThisYear: 5,
    reg44Expected: 5,
    reg44OverdueActions: 0,
    reg45UpToDate: true,
    notificationComplianceRate: 100,
    lastReg44Judgement: "good",

    // Safer Recruitment — good
    recruitmentBlockers: 0,
    dbsExpired: 0,
    dbsExpiringSoon: 1,
    schedule2ComplianceRate: 95,

    // Records — good
    retentionComplianceRate: 95,
    documentsOnHold: 1,
    pendingDestruction: 0,
    recordCompleteness: 92,

    // Children's Experience — good
    childrenViews: "positive",
    complaintsInPeriod: 1,
    complaintsResolvedOnTime: 1,
    childProgressRating: 4.0,
    activitiesPerWeek: 6,
    keyworkerSessionsCompliance: 90,

    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// calculateInspectionReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateInspectionReadiness", () => {
  describe("overall assessment", () => {
    it("returns good or outstanding judgement for well-performing home", () => {
      const result = calculateInspectionReadiness(makeInputs(), FIXED_NOW);
      expect(["good", "outstanding"]).toContain(result.overallJudgement);
      expect(result.overallScore).toBeGreaterThanOrEqual(3.0);
      expect(result.readinessPercentage).toBeGreaterThanOrEqual(75);
    });

    it("generates 8 domain assessments", () => {
      const result = calculateInspectionReadiness(makeInputs(), FIXED_NOW);
      expect(result.domains).toHaveLength(8);
    });

    it("sets homeId and timestamp", () => {
      const result = calculateInspectionReadiness(makeInputs(), FIXED_NOW);
      expect(result.homeId).toBe("home-oak");
      expect(result.assessedAt).toBe(FIXED_NOW);
    });

    it("calculates days since last inspection", () => {
      const result = calculateInspectionReadiness(makeInputs(), FIXED_NOW);
      expect(result.dayssinceLastInspection).toBeGreaterThan(180);
    });

    it("returns null for days when no last inspection", () => {
      const result = calculateInspectionReadiness(
        makeInputs({ lastInspectionDate: undefined }),
        FIXED_NOW,
      );
      expect(result.dayssinceLastInspection).toBeNull();
    });
  });

  describe("outstanding performance", () => {
    it("rates outstanding for exceptional inputs", () => {
      const inputs = makeInputs({
        qualityCompliance: 99,
        averageQAScore: 4.8,
        supervisionComplianceRate: 100,
        trainingComplianceRate: 100,
        vacancyRate: 0,
        agencyUsageRate: 0,
        turnoverRate: 5,
        qualificationRate: 100,
        dbsExpired: 0,
        dbsExpiringSoon: 0,
        schedule2ComplianceRate: 100,
        retentionComplianceRate: 100,
        recordCompleteness: 98,
        overdueRecords: 0,
        childProgressRating: 4.8,
        activitiesPerWeek: 8,
        keyworkerSessionsCompliance: 100,
        childrenViews: "positive",
        complaintsInPeriod: 0,
        reg44OverdueActions: 0,
        reg45UpToDate: true,
        notificationComplianceRate: 100,
        staffWithExpiredTraining: 0,
        missingEpisodes: 0,
      });
      const result = calculateInspectionReadiness(inputs, FIXED_NOW);
      expect(result.overallScore).toBeGreaterThanOrEqual(3.0);
      expect(result.readinessPercentage).toBe(100);
      expect(result.inspectionLikelihood).toBe("low");
    });
  });

  describe("poor performance detection", () => {
    it("detects critical issues with expired DBS", () => {
      const result = calculateInspectionReadiness(
        makeInputs({ dbsExpired: 2 }),
        FIXED_NOW,
      );
      expect(result.riskFactors.some(r => r.includes("DBS"))).toBe(true);
      const safeguarding = result.domains.find(d => d.domain === "safeguarding");
      expect(safeguarding?.concerns.some(c => c.includes("expired DBS"))).toBe(true);
    });

    it("detects inadequate performance", () => {
      const inputs = makeInputs({
        qualityCompliance: 50,
        trainingComplianceRate: 40,
        supervisionComplianceRate: 30,
        vacancyRate: 40,
        dbsExpired: 3,
        missingEpisodes: 8,
        reg45UpToDate: false,
        notificationComplianceRate: 60,
        childrenViews: "negative",
        childProgressRating: 1.5,
        overdueRecords: 20,
        recordCompleteness: 50,
        turnoverRate: 50,
      });
      const result = calculateInspectionReadiness(inputs, FIXED_NOW);
      expect(result.overallScore).toBeLessThan(2.5);
      expect(result.criticalActions.length).toBeGreaterThan(0);
      expect(result.inspectionLikelihood).toBe("high");
    });

    it("flags high missing episodes as risk factor", () => {
      const result = calculateInspectionReadiness(
        makeInputs({ missingEpisodes: 6 }),
        FIXED_NOW,
      );
      expect(result.riskFactors.some(r => r.includes("missing"))).toBe(true);
    });

    it("flags late notifications as risk factor", () => {
      const result = calculateInspectionReadiness(
        makeInputs({ notificationComplianceRate: 80 }),
        FIXED_NOW,
      );
      expect(result.riskFactors.some(r => r.includes("notification"))).toBe(true);
    });
  });

  describe("inspection likelihood", () => {
    it("returns low for no risk factors", () => {
      const result = calculateInspectionReadiness(makeInputs(), FIXED_NOW);
      expect(result.inspectionLikelihood).toBe("low");
    });

    it("returns medium for 2-3 risk factors", () => {
      const result = calculateInspectionReadiness(
        makeInputs({
          dbsExpired: 1,
          missingEpisodes: 5,
          reg45UpToDate: false,
        }),
        FIXED_NOW,
      );
      expect(result.inspectionLikelihood).toBe("medium");
    });

    it("returns high for 4+ risk factors", () => {
      const result = calculateInspectionReadiness(
        makeInputs({
          dbsExpired: 1,
          missingEpisodes: 5,
          notificationComplianceRate: 70,
          reg45UpToDate: false,
          turnoverRate: 50,
        }),
        FIXED_NOW,
      );
      expect(result.inspectionLikelihood).toBe("high");
    });
  });

  describe("domain-specific assessments", () => {
    it("leadership domain uses QA and supervision metrics", () => {
      const result = calculateInspectionReadiness(makeInputs(), FIXED_NOW);
      const leadership = result.domains.find(d => d.domain === "leadership_management");
      expect(leadership).toBeDefined();
      expect(leadership?.keyMetrics.some(m => m.label === "QA Score")).toBe(true);
      expect(leadership?.keyMetrics.some(m => m.label === "Supervision")).toBe(true);
    });

    it("safeguarding domain tracks return interviews", () => {
      const result = calculateInspectionReadiness(
        makeInputs({ returnInterviewsCompleted: 1, returnInterviewsRequired: 2 }),
        FIXED_NOW,
      );
      const safeguarding = result.domains.find(d => d.domain === "safeguarding");
      expect(safeguarding?.concerns.some(c => c.includes("Return interview"))).toBe(true);
    });

    it("workforce domain flags high vacancy", () => {
      const result = calculateInspectionReadiness(
        makeInputs({ vacancyRate: 30 }),
        FIXED_NOW,
      );
      const workforce = result.domains.find(d => d.domain === "workforce");
      expect(workforce?.concerns.some(c => c.includes("Vacancy"))).toBe(true);
    });

    it("children outcomes domain uses children views", () => {
      const result = calculateInspectionReadiness(
        makeInputs({ childrenViews: "negative" }),
        FIXED_NOW,
      );
      const outcomes = result.domains.find(d => d.domain === "children_outcomes");
      expect(outcomes?.concerns.some(c => c.includes("negative"))).toBe(true);
    });

    it("regulatory reports flags overdue Reg 45", () => {
      const result = calculateInspectionReadiness(
        makeInputs({ reg45UpToDate: false }),
        FIXED_NOW,
      );
      const regulatory = result.domains.find(d => d.domain === "regulatory_reports");
      expect(regulatory?.concerns.some(c => c.includes("Reg 45"))).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("scoreToJudgement maps correctly", () => {
    expect(scoreToJudgement(4.0)).toBe("outstanding");
    expect(scoreToJudgement(3.5)).toBe("outstanding");
    expect(scoreToJudgement(3.0)).toBe("good");
    expect(scoreToJudgement(2.5)).toBe("good");
    expect(scoreToJudgement(2.0)).toBe("requires_improvement");
    expect(scoreToJudgement(1.5)).toBe("requires_improvement");
    expect(scoreToJudgement(1.0)).toBe("inadequate");
  });

  it("getDomainLabel returns labels for all domains", () => {
    expect(getDomainLabel("leadership_management")).toBe("Leadership & Management");
    expect(getDomainLabel("safeguarding")).toBe("Safeguarding");
    expect(getDomainLabel("children_outcomes")).toBe("Children's Outcomes");
    expect(getDomainLabel("workforce")).toBe("Workforce");
  });
});
