// ══════════════════════════════════════════════════════════════════════════════
// ARIA Agent Learning & Cost Reduction Layer — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAgentReadiness,
  calculateOrganisationLearningMetrics,
  getReplacementStatusLabel,
  getAgentTypeLabel,
  getResolutionTierLabel,
  getRiskLevelLabel,
} from "../aria-learning-engine";
import type { AgentCapabilityProfile } from "../aria-learning-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<AgentCapabilityProfile> = {}): AgentCapabilityProfile {
  return {
    id: "agent-001",
    organisationId: "org-cornerstone",
    agentName: "Regulatory Compliance Checker",
    agentType: "regulatory_compliance",
    currentProvider: "anthropic_claude",
    internalReplacementStatus: "shadow_mode",
    taskScope: "Evaluate compliance of care records against CHR 2015",
    triggerConditions: ["New care record submitted", "Monthly compliance audit"],
    requiredInputs: ["care_record", "regulation_reference", "child_profile"],
    outputSchema: "ComplianceResult with issues[], warnings[], score",
    safetyBoundaries: ["Never auto-approve non-compliant records", "Always flag safeguarding gaps"],
    approvalRules: ["Manager must review any non-compliant finding", "Critical issues escalate to RI"],
    confidenceThreshold: 85,
    averageCostPerRun: 0.15,
    averageLatency: 2500,
    successRate: 92,
    failureRate: 8,
    commonFailures: ["Ambiguous regulation interpretation", "Missing context from partial records"],
    approvedPromptPatterns: ["structured_compliance_check_v3", "regulatory_gap_analysis_v2"],
    approvedTrainingExamples: 120,
    managerCorrections: 15,
    rejectedOutputs: 4,
    internalModelCandidate: "cornerstone-reg-v2",
    shadowModeEnabled: true,
    shadowAccuracyScore: 91,
    shadowSafetyScore: 97,
    shadowCostSavingEstimate: 85,
    replacementReadinessScore: 78,
    replacementApprovedBy: "Darren Laville",
    replacementApprovedAt: "2026-05-01T10:00:00Z",
    riskLevel: "medium",
    lastEvaluatedAt: "2026-05-15T10:00:00Z",
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-05-15T10:00:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Agent Readiness Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAgentReadiness", () => {
  it("evaluates a well-performing shadow agent", () => {
    const result = evaluateAgentReadiness(makeProfile());
    expect(result.readinessScore).toBeGreaterThan(70);
    expect(result.allCriticalMet).toBe(true);
    expect(result.currentStatus).toBe("shadow_mode");
    expect(result.recommendedNextStatus).toBe("partial_internal");
    expect(result.monthlySaving).toBeGreaterThan(0);
  });

  it("blocks replacement with low accuracy", () => {
    const profile = makeProfile({ shadowAccuracyScore: 75 });
    const result = evaluateAgentReadiness(profile);
    expect(result.allCriticalMet).toBe(false);
    expect(result.blockers.some(b => b.includes("accuracy"))).toBe(true);
  });

  it("blocks replacement with low safety", () => {
    const profile = makeProfile({ shadowSafetyScore: 80 });
    const result = evaluateAgentReadiness(profile);
    expect(result.allCriticalMet).toBe(false);
    expect(result.blockers.some(b => b.includes("safety"))).toBe(true);
  });

  it("recommends observation phase for new agents", () => {
    const profile = makeProfile({
      internalReplacementStatus: "external_only",
      approvedTrainingExamples: 15,
    });
    const result = evaluateAgentReadiness(profile);
    expect(result.recommendedNextStatus).toBe("observing");
    expect(result.recommendations.some(r => r.includes("observation"))).toBe(true);
  });

  it("recommends shadow mode for observed agents with enough data", () => {
    const profile = makeProfile({
      internalReplacementStatus: "observing",
      approvedTrainingExamples: 60,
      internalModelCandidate: "cornerstone-reg-v2",
    });
    const result = evaluateAgentReadiness(profile);
    expect(result.recommendedNextStatus).toBe("shadow_mode");
  });

  it("blocks critical risk agents from auto-replacement", () => {
    const profile = makeProfile({ riskLevel: "critical" });
    const result = evaluateAgentReadiness(profile);
    expect(result.riskFactors.some(f => f.includes("Critical"))).toBe(true);
    expect(result.blockers.some(b => b.includes("governance"))).toBe(true);
    expect(result.recommendedTier).toBe("human_review_only");
  });

  it("flags agents without human approval", () => {
    const profile = makeProfile({
      replacementApprovedBy: null,
      replacementApprovedAt: null,
    });
    const result = evaluateAgentReadiness(profile);
    const approvalReq = result.requirements.find(r => r.criterion.includes("approval"));
    expect(approvalReq?.met).toBe(false);
  });

  it("recommends collecting more examples when insufficient", () => {
    const profile = makeProfile({ approvedTrainingExamples: 30 });
    const result = evaluateAgentReadiness(profile);
    expect(result.recommendations.some(r => r.includes("more approved examples"))).toBe(true);
  });

  it("calculates cost savings correctly", () => {
    const profile = makeProfile({ averageCostPerRun: 0.20 });
    const result = evaluateAgentReadiness(profile);
    // 100 invocations * £0.20 = £20/month current
    expect(result.currentMonthlyCost).toBe(20);
    // 70% saving → £6/month projected
    expect(result.projectedMonthlyCost).toBe(6);
    expect(result.monthlySaving).toBe(14);
    expect(result.annualSaving).toBe(168);
  });

  it("caps readiness score at 100", () => {
    const profile = makeProfile({
      shadowModeEnabled: true,
      shadowAccuracyScore: 99,
      shadowSafetyScore: 99,
      successRate: 99,
      approvedTrainingExamples: 500,
    });
    const result = evaluateAgentReadiness(profile);
    expect(result.readinessScore).toBeLessThanOrEqual(100);
  });

  it("recommends appropriate resolution tier for ready agents", () => {
    const profile = makeProfile({
      shadowAccuracyScore: 95,
      shadowSafetyScore: 98,
      riskLevel: "low",
    });
    const result = evaluateAgentReadiness(profile);
    expect(result.recommendedTier).toBe("cornerstone_finetuned");
  });

  it("recommends RAG for partially ready agents", () => {
    const profile = makeProfile({
      shadowAccuracyScore: 91,
      shadowSafetyScore: 96,
      riskLevel: "low",
      replacementApprovedBy: null,
      approvedTrainingExamples: 55,
    });
    const result = evaluateAgentReadiness(profile);
    // Safety met + readiness >= 70 but not all critical met (no approval) → RAG tier
    expect(result.recommendedTier).toBe("cornerstone_rag");
  });

  it("warns about high failure rate", () => {
    const profile = makeProfile({ failureRate: 15 });
    const result = evaluateAgentReadiness(profile);
    expect(result.riskFactors.some(f => f.includes("failure rate"))).toBe(true);
  });

  it("warns about high rejection ratio", () => {
    const profile = makeProfile({
      rejectedOutputs: 50,
      approvedTrainingExamples: 100,
    });
    const result = evaluateAgentReadiness(profile);
    expect(result.riskFactors.some(f => f.includes("rejection"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Organisation Learning Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateOrganisationLearningMetrics", () => {
  it("calculates metrics for organisation", () => {
    const profiles = [
      makeProfile({ id: "a1", agentName: "Compliance Checker" }),
      makeProfile({ id: "a2", agentName: "Report Writer", internalReplacementStatus: "external_only" }),
      makeProfile({ id: "a3", agentName: "Risk Analyzer", internalReplacementStatus: "internal_preferred" }),
    ];
    const result = calculateOrganisationLearningMetrics(profiles, "org-cornerstone");
    expect(result.totalAgents).toBe(3);
    expect(result.agentsByStatus.shadow_mode).toBe(1);
    expect(result.agentsByStatus.external_only).toBe(1);
    expect(result.agentsByStatus.internal_preferred).toBe(1);
    expect(result.totalCurrentMonthlyCost).toBeGreaterThan(0);
    expect(result.costReductionRate).toBe(70);
  });

  it("identifies top replacement candidates", () => {
    const profiles = [
      makeProfile({ id: "a1", agentName: "High Ready", shadowAccuracyScore: 96, shadowSafetyScore: 99 }),
      makeProfile({ id: "a2", agentName: "Low Ready", shadowAccuracyScore: 70, shadowSafetyScore: 80, internalReplacementStatus: "observing" }),
    ];
    const result = calculateOrganisationLearningMetrics(profiles, "org-cornerstone");
    expect(result.topReplacementCandidates[0].agentName).toBe("High Ready");
    expect(result.topReplacementCandidates[0].readinessScore).toBeGreaterThan(result.topReplacementCandidates[1].readinessScore);
  });

  it("counts shadow mode agents", () => {
    const profiles = [
      makeProfile({ id: "a1", shadowModeEnabled: true, internalReplacementStatus: "shadow_mode" }),
      makeProfile({ id: "a2", shadowModeEnabled: true, internalReplacementStatus: "shadow_mode" }),
      makeProfile({ id: "a3", shadowModeEnabled: false, internalReplacementStatus: "external_only" }),
    ];
    const result = calculateOrganisationLearningMetrics(profiles, "org-cornerstone");
    expect(result.agentsInShadowMode).toBe(2);
  });

  it("tallies learning data", () => {
    const profiles = [
      makeProfile({ id: "a1", approvedTrainingExamples: 100, managerCorrections: 10, rejectedOutputs: 5 }),
      makeProfile({ id: "a2", approvedTrainingExamples: 80, managerCorrections: 20, rejectedOutputs: 3 }),
    ];
    const result = calculateOrganisationLearningMetrics(profiles, "org-cornerstone");
    expect(result.totalTrainingExamples).toBe(180);
    expect(result.totalManagerCorrections).toBe(30);
    expect(result.totalRejectedOutputs).toBe(8);
  });

  it("flags all-external as issue", () => {
    const profiles = [
      makeProfile({ id: "a1", internalReplacementStatus: "external_only" }),
      makeProfile({ id: "a2", internalReplacementStatus: "external_only" }),
    ];
    const result = calculateOrganisationLearningMetrics(profiles, "org-cornerstone");
    expect(result.issues.some(i => i.includes("All agents still fully external"))).toBe(true);
  });

  it("warns about critical risk agents", () => {
    const profiles = [
      makeProfile({ id: "a1", riskLevel: "critical" }),
    ];
    const result = calculateOrganisationLearningMetrics(profiles, "org-cornerstone");
    expect(result.criticalRiskAgents).toBe(1);
    expect(result.warnings.some(w => w.includes("critical risk"))).toBe(true);
  });

  it("handles empty profiles", () => {
    const result = calculateOrganisationLearningMetrics([], "org-cornerstone");
    expect(result.totalAgents).toBe(0);
    expect(result.totalCurrentMonthlyCost).toBe(0);
    expect(result.costReductionRate).toBe(0);
  });

  it("calculates average shadow scores", () => {
    const profiles = [
      makeProfile({ id: "a1", shadowModeEnabled: true, shadowAccuracyScore: 90, shadowSafetyScore: 96 }),
      makeProfile({ id: "a2", shadowModeEnabled: true, shadowAccuracyScore: 94, shadowSafetyScore: 98 }),
      makeProfile({ id: "a3", shadowModeEnabled: false, shadowAccuracyScore: 0, shadowSafetyScore: 0 }),
    ];
    const result = calculateOrganisationLearningMetrics(profiles, "org-cornerstone");
    expect(result.averageShadowAccuracy).toBe(92);
    expect(result.averageShadowSafety).toBe(97);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("Label helpers", () => {
  it("getReplacementStatusLabel returns readable labels", () => {
    expect(getReplacementStatusLabel("shadow_mode")).toBe("Shadow Mode");
    expect(getReplacementStatusLabel("external_fallback_only")).toBe("External Fallback Only");
  });

  it("getAgentTypeLabel returns readable labels", () => {
    expect(getAgentTypeLabel("regulatory_compliance")).toBe("Regulatory Compliance");
    expect(getAgentTypeLabel("therapeutic_guidance")).toBe("Therapeutic Guidance");
  });

  it("getResolutionTierLabel returns readable labels", () => {
    expect(getResolutionTierLabel("cornerstone_finetuned")).toBe("Cornerstone Fine-tuned");
    expect(getResolutionTierLabel("human_review_only")).toBe("Human Review Only");
  });

  it("getRiskLevelLabel returns readable labels", () => {
    expect(getRiskLevelLabel("critical")).toBe("Critical");
    expect(getRiskLevelLabel("low")).toBe("Low");
  });
});
