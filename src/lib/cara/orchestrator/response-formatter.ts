// ══════════════════════════════════════════════════════════════════════════════
// Cara ORCHESTRATOR — RESPONSE FORMATTER
//
// Formats raw AI output into the structured CaraResponse. Attaches:
// - Evidence citations
// - Suggested actions derived from the output
// - Risk badge
// - Approval requirements
// - Safety notes
// - Source trail
//
// This is the final transformation before the response is returned to the
// caller. It ensures every response has a consistent shape regardless of
// which agent or model produced it.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraRequest,
  CaraResponse,
  CostEntry,
  EvidenceItem,
  ModelProfileId,
  RiskLevel,
  RouteDecision,
  SafetyReview,
  SuggestedAction,
} from "./types";

// ── Confidence Calculation ────────────────────────────────────────────────

function calculateConfidence(input: {
  evidenceCount: number;
  riskLevel: RiskLevel;
  safetyWarnings: number;
  hasChildContext: boolean;
}): number {
  const { evidenceCount, riskLevel, safetyWarnings, hasChildContext } = input;

  // Base confidence from evidence availability
  let confidence = 50;

  // Evidence boosts confidence
  if (evidenceCount >= 5) confidence += 25;
  else if (evidenceCount >= 3) confidence += 15;
  else if (evidenceCount >= 1) confidence += 5;
  else confidence -= 20; // No evidence significantly reduces confidence

  // Child context helps
  if (hasChildContext) confidence += 5;

  // Risk level reduces confidence (uncertainty in high-risk domains)
  if (riskLevel === "critical") confidence -= 15;
  else if (riskLevel === "high") confidence -= 10;

  // Safety warnings reduce confidence
  confidence -= safetyWarnings * 5;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, confidence));
}

// ── Suggested Actions Extraction ──────────────────────────────────────────

function extractSuggestedActions(
  rawOutput: string,
  riskLevel: RiskLevel,
  routeDecision: RouteDecision,
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Always suggest manager review for high/critical risk
  if (riskLevel === "critical") {
    actions.push({
      title: "Immediate manager review required",
      description: "This output involves critical safeguarding themes and must be reviewed by the Registered Manager before any action is taken.",
      ownerRole: "registered_manager",
      priority: "immediate",
      actionType: "escalate",
      rationale: "Critical risk level — mandatory review before commitment.",
    });
  } else if (riskLevel === "high") {
    actions.push({
      title: "Manager review recommended",
      description: "This output involves high-risk themes. Manager review is recommended before acting on any suggestions.",
      ownerRole: "registered_manager",
      priority: "today",
      actionType: "review",
      rationale: "High risk level — review recommended before action.",
    });
  }

  // Safeguarding escalation
  if (routeDecision.requiresSafeguardingEscalation) {
    actions.push({
      title: "Consider safeguarding escalation",
      description: "Critical safeguarding indicators detected. Consider whether LADO, police, or Ofsted notification is required.",
      ownerRole: "registered_manager",
      priority: "immediate",
      actionType: "escalate",
      rationale: "Critical safeguarding themes detected in query or response.",
    });
  }

  // Evidence gap action
  if (routeDecision.requiresRAG) {
    const evidenceMentions = rawOutput.match(/\[Evidence \d+\]/g);
    if (!evidenceMentions || evidenceMentions.length === 0) {
      actions.push({
        title: "Review evidence base",
        description: "The response does not reference specific evidence items. Consider whether additional records need to be created or located.",
        ownerRole: "senior",
        priority: "this_week",
        actionType: "review",
        rationale: "No evidence citations found in response.",
      });
    }
  }

  return actions;
}

// ── Main Formatter ────────────────────────────────────────────────────────

export function formatResponse(input: {
  rawOutput: string;
  request: CaraRequest;
  routeDecision: RouteDecision;
  safetyReview: SafetyReview;
  evidence: EvidenceItem[];
  auditId: string;
  cost?: CostEntry;
}): CaraResponse {
  const { rawOutput, request, routeDecision, safetyReview, evidence, auditId, cost } = input;

  // Use sanitised output if available, otherwise raw
  const answer = safetyReview.sanitisedOutput ?? rawOutput;

  // Calculate confidence
  const confidence = calculateConfidence({
    evidenceCount: evidence.length,
    riskLevel: routeDecision.riskLevel,
    safetyWarnings: safetyReview.warnings.length,
    hasChildContext: !!request.childId,
  });

  // Extract suggested actions
  const suggestedActions = extractSuggestedActions(
    answer,
    routeDecision.riskLevel,
    routeDecision,
  );

  // Determine if save is allowed
  const canSave = routeDecision.canAutoSave &&
    !safetyReview.blocked &&
    routeDecision.riskLevel !== "critical" &&
    request.saveIntent === true;

  // Determine approval requirement
  const requiresApproval = routeDecision.requiresHumanApproval ||
    safetyReview.managerApprovalRequired;

  // Determine escalation recommendation
  const escalationRecommended = safetyReview.escalationRequired ||
    routeDecision.requiresSafeguardingEscalation;

  // Compile safety notes
  const safetyNotes = [
    ...safetyReview.safetyNotes,
    ...safetyReview.warnings.map((w) => `Warning: ${w}`),
  ];

  return {
    answer,
    agentUsed: routeDecision.requiredAgent,
    modelProfile: routeDecision.requiredModelProfile,
    riskLevel: routeDecision.riskLevel,
    confidence,
    evidenceUsed: evidence,
    suggestedActions,
    requiresApproval,
    canSave,
    escalationRecommended,
    safetyNotes,
    auditId,
    blocked: safetyReview.blocked,
    blockReason: safetyReview.blockReason,
    cost,
  };
}

// ── Blocked Response Formatter ────────────────────────────────────────────

export function formatBlockedResponse(input: {
  blockReason: string;
  blockedAnswer: string;
  request: CaraRequest;
  routeDecision: RouteDecision;
  safetyReview: SafetyReview;
  evidence: EvidenceItem[];
  auditId: string;
  cost?: CostEntry;
}): CaraResponse {
  const { blockReason, blockedAnswer, request, routeDecision, safetyReview, evidence, auditId, cost } = input;

  return {
    answer: blockedAnswer,
    agentUsed: routeDecision.requiredAgent,
    modelProfile: routeDecision.requiredModelProfile,
    riskLevel: routeDecision.riskLevel,
    confidence: 0,
    evidenceUsed: evidence,
    suggestedActions: [{
      title: "Seek direct manager support",
      description: "This query triggered a safety block. Speak to your Registered Manager directly for guidance on this matter.",
      ownerRole: "registered_manager",
      priority: "immediate",
      actionType: "escalate",
      rationale: blockReason,
    }],
    requiresApproval: true,
    canSave: false,
    escalationRecommended: safetyReview.escalationRequired,
    safetyNotes: [
      `Response blocked: ${blockReason}`,
      ...safetyReview.safetyNotes,
    ],
    auditId,
    blocked: true,
    blockReason,
    cost,
  };
}
