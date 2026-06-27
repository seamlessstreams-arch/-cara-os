// ══════════════════════════════════════════════════════════════════════════════
// Cara Agent Learning & Cost Reduction Layer
//
// Deterministic engine for observing, evaluating, and learning from specialist
// agent outputs over time — to progressively reduce dependency on paid agents
// by building Cara's own internal capability.
//
// Purpose:
//   - Track what each agent is used for, inputs/outputs/boundaries
//   - Log approved outputs, manager corrections, rejections
//   - Build internal capability profiles per agent
//   - Evaluate readiness for internal replacement
//   - Manage shadow mode testing pipeline
//   - Calculate cost savings and risk levels
//
// Cara learns ONLY from:
//   - Cara-owned data
//   - Authorised outputs
//   - Approved manager corrections
//   - Approved internal workflows
//   - Approved training examples
//   - Legally usable open-source models
//   - Permitted API responses stored under agreed terms
//   - Human-reviewed examples
//
// Cara must NEVER:
//   - Copy, steal, or reverse-engineer proprietary models
//   - Automatically replace paid agents for high-risk workflows
//   - Replace an external agent without passing evaluation testing
//
// Replacement Pipeline:
//   1. Observation phase
//   2. Shadow mode
//   3. Manager review
//   4. Evaluation testing
//   5. Limited rollout
//   6. Full rollout
//   7. Ongoing monitoring
//
// Target State:
//   Cara becomes a self-owned Cara AI operating system where most
//   repeatable work is handled internally, while premium external models are
//   reserved only for complex, high-risk, specialist, or quality-critical tasks.
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ReplacementStatus =
  | "external_only"          // fully reliant on paid agent
  | "observing"              // logging inputs/outputs, building profile
  | "shadow_mode"            // internal model running silently alongside
  | "partial_internal"       // some tasks handled internally
  | "internal_preferred"     // internal handles most, external fallback
  | "external_fallback_only" // internal primary, external only for edge cases
  | "retired";               // external agent no longer needed

export type AgentType =
  | "regulatory_compliance"
  | "safeguarding_analysis"
  | "therapeutic_guidance"
  | "report_generation"
  | "risk_assessment"
  | "care_planning"
  | "evidence_synthesis"
  | "communication_drafting"
  | "data_analysis"
  | "quality_assurance"
  | "training_support"
  | "document_review";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ResolutionTier =
  | "cornerstone_native_rules"    // handled by deterministic engine logic
  | "cornerstone_local_model"     // handled by local AI model
  | "cornerstone_rag"             // handled by RAG knowledge base
  | "cornerstone_finetuned"       // handled by fine-tuned model
  | "external_paid_model"         // requires premium external AI
  | "human_review_only";          // requires human decision

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface AgentCapabilityProfile {
  id: string;
  organisationId: string;
  agentName: string;
  agentType: AgentType;
  currentProvider: string;               // e.g. "anthropic_claude"
  internalReplacementStatus: ReplacementStatus;
  // Scope
  taskScope: string;                     // what the agent does
  triggerConditions: string[];           // when the agent is invoked
  requiredInputs: string[];             // data it needs
  outputSchema: string;                 // what it produces
  // Boundaries
  safetyBoundaries: string[];           // what it must never do
  approvalRules: string[];              // when human approval needed
  confidenceThreshold: number;          // 0-100, minimum confidence to act
  // Performance
  averageCostPerRun: number;            // £ per invocation
  averageLatency: number;               // ms
  successRate: number;                  // 0-100%
  failureRate: number;                  // 0-100%
  commonFailures: string[];
  // Learning
  approvedPromptPatterns: string[];
  approvedTrainingExamples: number;     // count of validated examples
  managerCorrections: number;           // count of corrections logged
  rejectedOutputs: number;             // count of rejected outputs
  // Shadow Mode
  internalModelCandidate: string | null;  // e.g. "cornerstone-reg-v2"
  shadowModeEnabled: boolean;
  shadowAccuracyScore: number;          // 0-100%
  shadowSafetyScore: number;            // 0-100%
  shadowCostSavingEstimate: number;     // £/month
  // Replacement
  replacementReadinessScore: number;    // 0-100
  replacementApprovedBy: string | null;
  replacementApprovedAt: string | null;
  riskLevel: RiskLevel;
  // Timestamps
  lastEvaluatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReplacementRequirement {
  criterion: string;
  required: boolean;
  met: boolean;
  evidence?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface AgentReadinessResult {
  agentId: string;
  agentName: string;
  currentStatus: ReplacementStatus;
  recommendedNextStatus: ReplacementStatus | null;
  readinessScore: number;               // 0-100
  // Requirements check
  requirements: ReplacementRequirement[];
  requirementsMet: number;
  requirementsTotal: number;
  allCriticalMet: boolean;
  // Cost analysis
  currentMonthlyCost: number;
  projectedMonthlyCost: number;
  monthlySaving: number;
  annualSaving: number;
  // Risk
  riskLevel: RiskLevel;
  riskFactors: string[];
  // Recommendations
  recommendations: string[];
  blockers: string[];
  // Resolution tier
  recommendedTier: ResolutionTier;
}

export interface OrganisationLearningMetrics {
  organisationId: string;
  // Agents
  totalAgents: number;
  agentsByStatus: Record<ReplacementStatus, number>;
  // Cost
  totalCurrentMonthlyCost: number;
  totalProjectedMonthlyCost: number;
  totalMonthlySaving: number;
  totalAnnualSaving: number;
  costReductionRate: number;            // %
  // Readiness
  agentsReadyForShadow: number;
  agentsInShadowMode: number;
  agentsPartiallyInternal: number;
  agentsFullyInternal: number;
  // Quality
  averageShadowAccuracy: number;
  averageShadowSafety: number;
  averageSuccessRate: number;
  // Learning
  totalTrainingExamples: number;
  totalManagerCorrections: number;
  totalRejectedOutputs: number;
  // Risk
  highRiskAgents: number;
  criticalRiskAgents: number;
  // Recommendations
  topReplacementCandidates: { agentName: string; readinessScore: number; monthlySaving: number }[];
  issues: string[];
  warnings: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const SHADOW_ACCURACY_THRESHOLD = 90;     // must be >= 90% accurate
const SHADOW_SAFETY_THRESHOLD = 95;       // must be >= 95% safe
const MIN_TRAINING_EXAMPLES = 50;         // minimum approved examples
const MIN_SUCCESS_RATE = 85;              // minimum success rate for replacement
const COST_SAVING_MINIMUM = 0.20;         // at least 20% cost reduction to justify

// ── Core: Evaluate Agent Readiness ──────────────────────────────────────────

export function evaluateAgentReadiness(
  profile: AgentCapabilityProfile,
): AgentReadinessResult {
  const requirements: ReplacementRequirement[] = [];
  const recommendations: string[] = [];
  const blockers: string[] = [];
  const riskFactors: string[] = [];

  // Requirement: Accuracy
  const accuracyMet = profile.shadowAccuracyScore >= SHADOW_ACCURACY_THRESHOLD;
  requirements.push({
    criterion: "Equal or better accuracy",
    required: true,
    met: accuracyMet,
    evidence: `Shadow accuracy: ${profile.shadowAccuracyScore}% (threshold: ${SHADOW_ACCURACY_THRESHOLD}%)`,
  });
  if (!accuracyMet) blockers.push(`Shadow accuracy ${profile.shadowAccuracyScore}% below threshold ${SHADOW_ACCURACY_THRESHOLD}%`);

  // Requirement: Safety
  const safetyMet = profile.shadowSafetyScore >= SHADOW_SAFETY_THRESHOLD;
  requirements.push({
    criterion: "Acceptable safeguarding safety",
    required: true,
    met: safetyMet,
    evidence: `Shadow safety: ${profile.shadowSafetyScore}% (threshold: ${SHADOW_SAFETY_THRESHOLD}%)`,
  });
  if (!safetyMet) blockers.push(`Shadow safety ${profile.shadowSafetyScore}% below threshold ${SHADOW_SAFETY_THRESHOLD}%`);

  // Requirement: Training examples
  const examplesMet = profile.approvedTrainingExamples >= MIN_TRAINING_EXAMPLES;
  requirements.push({
    criterion: "Sufficient approved training examples",
    required: true,
    met: examplesMet,
    evidence: `${profile.approvedTrainingExamples} examples (minimum: ${MIN_TRAINING_EXAMPLES})`,
  });
  if (!examplesMet) recommendations.push(`Collect ${MIN_TRAINING_EXAMPLES - profile.approvedTrainingExamples} more approved examples`);

  // Requirement: Success rate
  const successMet = profile.successRate >= MIN_SUCCESS_RATE;
  requirements.push({
    criterion: "Reliable performance",
    required: true,
    met: successMet,
    evidence: `Success rate: ${profile.successRate}% (minimum: ${MIN_SUCCESS_RATE}%)`,
  });

  // Requirement: Cost saving
  const estimatedInternalCost = profile.averageCostPerRun * 0.3; // assume 70% saving
  const costSavingRate = profile.averageCostPerRun > 0
    ? (profile.averageCostPerRun - estimatedInternalCost) / profile.averageCostPerRun
    : 0;
  const costMet = costSavingRate >= COST_SAVING_MINIMUM;
  requirements.push({
    criterion: "Lower cost",
    required: false,
    met: costMet,
    evidence: `Estimated saving: ${Math.round(costSavingRate * 100)}% (minimum: ${COST_SAVING_MINIMUM * 100}%)`,
  });

  // Requirement: Human approval
  const approvalMet = profile.replacementApprovedBy !== null;
  requirements.push({
    criterion: "Human approval workflow",
    required: true,
    met: approvalMet,
    evidence: approvalMet ? `Approved by ${profile.replacementApprovedBy}` : "Not yet approved",
  });
  if (!approvalMet && accuracyMet && safetyMet) {
    recommendations.push("Ready for manager approval review");
  }

  // Requirement: Auditability
  const auditMet = profile.approvedPromptPatterns.length > 0 && profile.approvedTrainingExamples > 0;
  requirements.push({
    criterion: "Full auditability",
    required: true,
    met: auditMet,
    evidence: `${profile.approvedPromptPatterns.length} approved patterns, ${profile.approvedTrainingExamples} examples`,
  });

  // Risk assessment
  if (profile.riskLevel === "critical") {
    riskFactors.push("Critical risk category — requires extensive evaluation");
    blockers.push("Critical risk agents require additional governance sign-off");
  }
  if (profile.riskLevel === "high") {
    riskFactors.push("High risk — therapeutic/safeguarding implications");
  }
  if (profile.failureRate > 10) {
    riskFactors.push(`Elevated failure rate: ${profile.failureRate}%`);
  }
  if (profile.rejectedOutputs > profile.approvedTrainingExamples * 0.1) {
    riskFactors.push("High rejection ratio — quality concerns");
  }

  // Calculate readiness score
  const requirementsMet = requirements.filter(r => r.met).length;
  const requirementsTotal = requirements.length;
  const criticalRequirements = requirements.filter(r => r.required);
  const allCriticalMet = criticalRequirements.every(r => r.met);

  let readinessScore = Math.round((requirementsMet / requirementsTotal) * 70);
  if (profile.shadowModeEnabled) readinessScore += 10;
  if (profile.shadowAccuracyScore >= 95) readinessScore += 10;
  if (profile.shadowSafetyScore >= 98) readinessScore += 10;
  readinessScore = Math.min(100, readinessScore);

  // Determine recommended next status
  let recommendedNextStatus: ReplacementStatus | null = null;
  if (profile.internalReplacementStatus === "external_only" && profile.approvedTrainingExamples >= 10) {
    recommendedNextStatus = "observing";
    recommendations.push("Sufficient initial data — move to observation phase");
  } else if (profile.internalReplacementStatus === "observing" && examplesMet && profile.internalModelCandidate) {
    recommendedNextStatus = "shadow_mode";
    recommendations.push("Ready for shadow mode testing");
  } else if (profile.internalReplacementStatus === "shadow_mode" && allCriticalMet && approvalMet) {
    recommendedNextStatus = "partial_internal";
    recommendations.push("Shadow testing passed — begin limited rollout");
  } else if (profile.internalReplacementStatus === "partial_internal" && readinessScore >= 90) {
    recommendedNextStatus = "internal_preferred";
    recommendations.push("Strong performance — can become internal preferred");
  } else if (profile.internalReplacementStatus === "internal_preferred" && readinessScore >= 95) {
    recommendedNextStatus = "external_fallback_only";
    recommendations.push("Excellent performance — external only as fallback");
  }

  // Cost analysis (monthly estimates based on 100 invocations/month)
  const monthlyInvocations = 100;
  const currentMonthlyCost = profile.averageCostPerRun * monthlyInvocations;
  const projectedMonthlyCost = currentMonthlyCost * 0.3; // 70% saving assumed
  const monthlySaving = currentMonthlyCost - projectedMonthlyCost;
  const annualSaving = monthlySaving * 12;

  // Determine recommended resolution tier
  let recommendedTier: ResolutionTier = "external_paid_model";
  if (profile.riskLevel === "critical") {
    recommendedTier = "human_review_only";
  } else if (readinessScore >= 90 && allCriticalMet) {
    recommendedTier = "cornerstone_finetuned";
  } else if (readinessScore >= 70 && safetyMet) {
    recommendedTier = "cornerstone_rag";
  } else if (profile.internalReplacementStatus === "observing") {
    recommendedTier = "external_paid_model";
  }

  return {
    agentId: profile.id,
    agentName: profile.agentName,
    currentStatus: profile.internalReplacementStatus,
    recommendedNextStatus,
    readinessScore,
    requirements,
    requirementsMet,
    requirementsTotal,
    allCriticalMet,
    currentMonthlyCost,
    projectedMonthlyCost,
    monthlySaving,
    annualSaving,
    riskLevel: profile.riskLevel,
    riskFactors,
    recommendations,
    blockers,
    recommendedTier,
  };
}

// ── Core: Calculate Organisation Learning Metrics ────────────────────────────

export function calculateOrganisationLearningMetrics(
  profiles: AgentCapabilityProfile[],
  organisationId: string,
): OrganisationLearningMetrics {
  const orgProfiles = profiles.filter(p => p.organisationId === organisationId);
  const totalAgents = orgProfiles.length;
  const issues: string[] = [];
  const warnings: string[] = [];

  if (totalAgents === 0) {
    return {
      organisationId,
      totalAgents: 0,
      agentsByStatus: {
        external_only: 0, observing: 0, shadow_mode: 0,
        partial_internal: 0, internal_preferred: 0,
        external_fallback_only: 0, retired: 0,
      },
      totalCurrentMonthlyCost: 0,
      totalProjectedMonthlyCost: 0,
      totalMonthlySaving: 0,
      totalAnnualSaving: 0,
      costReductionRate: 0,
      agentsReadyForShadow: 0,
      agentsInShadowMode: 0,
      agentsPartiallyInternal: 0,
      agentsFullyInternal: 0,
      averageShadowAccuracy: 0,
      averageShadowSafety: 0,
      averageSuccessRate: 0,
      totalTrainingExamples: 0,
      totalManagerCorrections: 0,
      totalRejectedOutputs: 0,
      highRiskAgents: 0,
      criticalRiskAgents: 0,
      topReplacementCandidates: [],
      issues,
      warnings,
    };
  }

  const results = orgProfiles.map(p => evaluateAgentReadiness(p));

  // Status counts
  const agentsByStatus: Record<ReplacementStatus, number> = {
    external_only: 0, observing: 0, shadow_mode: 0,
    partial_internal: 0, internal_preferred: 0,
    external_fallback_only: 0, retired: 0,
  };
  orgProfiles.forEach(p => { agentsByStatus[p.internalReplacementStatus]++; });

  // Cost
  const monthlyInvocations = 100;
  const totalCurrentMonthlyCost = orgProfiles.reduce((s, p) => s + (p.averageCostPerRun * monthlyInvocations), 0);
  const totalProjectedMonthlyCost = totalCurrentMonthlyCost * 0.3;
  const totalMonthlySaving = totalCurrentMonthlyCost - totalProjectedMonthlyCost;
  const totalAnnualSaving = totalMonthlySaving * 12;
  const costReductionRate = totalCurrentMonthlyCost > 0
    ? Math.round((totalMonthlySaving / totalCurrentMonthlyCost) * 100)
    : 0;

  // Readiness
  const agentsReadyForShadow = results.filter(
    r => r.currentStatus === "observing" && r.recommendedNextStatus === "shadow_mode"
  ).length;
  const agentsInShadowMode = agentsByStatus.shadow_mode;
  const agentsPartiallyInternal = agentsByStatus.partial_internal;
  const agentsFullyInternal = agentsByStatus.internal_preferred + agentsByStatus.external_fallback_only + agentsByStatus.retired;

  // Quality
  const shadowProfiles = orgProfiles.filter(p => p.shadowModeEnabled);
  const averageShadowAccuracy = shadowProfiles.length > 0
    ? Math.round(shadowProfiles.reduce((s, p) => s + p.shadowAccuracyScore, 0) / shadowProfiles.length)
    : 0;
  const averageShadowSafety = shadowProfiles.length > 0
    ? Math.round(shadowProfiles.reduce((s, p) => s + p.shadowSafetyScore, 0) / shadowProfiles.length)
    : 0;
  const averageSuccessRate = Math.round(
    orgProfiles.reduce((s, p) => s + p.successRate, 0) / totalAgents
  );

  // Learning
  const totalTrainingExamples = orgProfiles.reduce((s, p) => s + p.approvedTrainingExamples, 0);
  const totalManagerCorrections = orgProfiles.reduce((s, p) => s + p.managerCorrections, 0);
  const totalRejectedOutputs = orgProfiles.reduce((s, p) => s + p.rejectedOutputs, 0);

  // Risk
  const highRiskAgents = orgProfiles.filter(p => p.riskLevel === "high").length;
  const criticalRiskAgents = orgProfiles.filter(p => p.riskLevel === "critical").length;

  // Top candidates for replacement
  const topReplacementCandidates = results
    .filter(r => r.currentStatus !== "retired" && r.currentStatus !== "external_fallback_only")
    .sort((a, b) => b.readinessScore - a.readinessScore)
    .slice(0, 5)
    .map(r => ({ agentName: r.agentName, readinessScore: r.readinessScore, monthlySaving: r.monthlySaving }));

  // Issues and warnings
  if (agentsByStatus.external_only === totalAgents) {
    issues.push("All agents still fully external — begin observation phase");
  }
  if (criticalRiskAgents > 0) {
    warnings.push(`${criticalRiskAgents} agent(s) at critical risk level — require additional governance`);
  }
  if (totalRejectedOutputs > totalTrainingExamples * 0.2) {
    warnings.push("High rejection ratio across agents — review quality pipeline");
  }
  if (agentsReadyForShadow > 0) {
    warnings.push(`${agentsReadyForShadow} agent(s) ready to enter shadow mode`);
  }

  return {
    organisationId,
    totalAgents,
    agentsByStatus,
    totalCurrentMonthlyCost,
    totalProjectedMonthlyCost,
    totalMonthlySaving,
    totalAnnualSaving,
    costReductionRate,
    agentsReadyForShadow,
    agentsInShadowMode,
    agentsPartiallyInternal,
    agentsFullyInternal,
    averageShadowAccuracy,
    averageShadowSafety,
    averageSuccessRate,
    totalTrainingExamples,
    totalManagerCorrections,
    totalRejectedOutputs,
    highRiskAgents,
    criticalRiskAgents,
    topReplacementCandidates,
    issues,
    warnings,
  };
}

// ── Label Helpers ────────────────────────────────────────────────────────

export function getReplacementStatusLabel(status: ReplacementStatus): string {
  const labels: Record<ReplacementStatus, string> = {
    external_only: "External Only",
    observing: "Observing",
    shadow_mode: "Shadow Mode",
    partial_internal: "Partial Internal",
    internal_preferred: "Internal Preferred",
    external_fallback_only: "External Fallback Only",
    retired: "Retired",
  };
  return labels[status] ?? status;
}

export function getAgentTypeLabel(type: AgentType): string {
  const labels: Record<AgentType, string> = {
    regulatory_compliance: "Regulatory Compliance",
    safeguarding_analysis: "Safeguarding Analysis",
    therapeutic_guidance: "Therapeutic Guidance",
    report_generation: "Report Generation",
    risk_assessment: "Risk Assessment",
    care_planning: "Care Planning",
    evidence_synthesis: "Evidence Synthesis",
    communication_drafting: "Communication Drafting",
    data_analysis: "Data Analysis",
    quality_assurance: "Quality Assurance",
    training_support: "Training Support",
    document_review: "Document Review",
  };
  return labels[type] ?? type;
}

export function getResolutionTierLabel(tier: ResolutionTier): string {
  const labels: Record<ResolutionTier, string> = {
    cornerstone_native_rules: "Cara Native Rules",
    cornerstone_local_model: "Cara Local Model",
    cornerstone_rag: "Cara RAG",
    cornerstone_finetuned: "Cara Fine-tuned",
    external_paid_model: "External Paid Model",
    human_review_only: "Human Review Only",
  };
  return labels[tier] ?? tier;
}

export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };
  return labels[level] ?? level;
}
