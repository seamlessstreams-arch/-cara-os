// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT ENGINE (deterministic, workflow-based)
//
// The heart of the workflow-based management assurance system. Pure functions:
//   generateManagementOversight(input)  → professional + (safe) child-addressed
//   generateTaskOversight(input)        → per-task oversight prompt + status
//   generateWorkflowSignOff(input)      → blockers, role gate, audit entry
//
// No API calls. Enhanced AI drafting is only ever RECOMMENDED (see
// api-recommendation.ts). Additive to src/lib/cara/managementOversightEngine.ts.
// ══════════════════════════════════════════════════════════════════════════════

import {
  OVERSIGHT_ENGINE_VERSION,
  type OversightInput,
  type OversightResult,
  type TaskOversightInput,
  type TaskOversightResult,
  type TaskOversightStatus,
  type WorkflowSignOffInput,
  type WorkflowSignOffResult,
  type SignOffBlocker,
  type SignOffRole,
  type OversightAction,
  type RiskLevel,
} from "./types";
import { computeScores } from "./scoring";
import {
  deriveRiskLevel,
  deriveEscalation,
  buildFindings,
  buildRecordingGaps,
  deriveWorkflowCompletionStatus,
  derivePlanAdherenceStatus,
  derivePracticeConcernLevel,
  deriveManagementResponseStatus,
  deriveOutcome,
} from "./rules";
import { buildCaraIntelligence } from "./cara-intelligence";
import { recommendApiCall } from "./api-recommendation";
import { buildProfessionalOversight } from "./templates/professional-templates";
import {
  buildChildAddressedOversight,
  shouldSuppressChildAddressed,
} from "./templates/child-addressed-templates";

function isoNow(today?: string): string {
  return today ?? new Date().toISOString().slice(0, 10);
}

// ─── Regulatory + QA tagging ───────────────────────────────────────────────────

function regulatoryTags(input: OversightInput): string[] {
  const tags = new Set<string>();
  if (input.restraintUsed || input.recordType === "physical_intervention") tags.add("CHR 2015 Reg 35 — Behaviour management & restraint");
  if (input.missingFromCare || input.recordType === "missing_episode") tags.add("CHR 2015 Reg 35 — Missing from care");
  if (input.recordType === "safeguarding" || input.allegation || input.disclosure || input.exploitationConcern) tags.add("CHR 2015 Reg 12 — Protection of children");
  if (input.medicationError || input.recordType === "medication") tags.add("CHR 2015 Reg 23 — Health & wellbeing (medication)");
  if (input.recordType === "complaint") tags.add("CHR 2015 Reg 39 — Complaints");
  // Reg 40 notification (always 'consider').
  if (input.allegation || input.disclosure || input.restraintUsed || input.missingFromCare || input.emergencyServicesInvolved || input.recordType === "safeguarding") {
    tags.add("CHR 2015 Reg 40 — Notification of significant events (manager to consider)");
  }
  tags.add("CHR 2015 Reg 44/45 — Independent & internal review evidence");
  return [...tags];
}

function qualityAssuranceRoutes(input: OversightInput, escalationRequired: boolean, positivePractice: boolean): string[] {
  const routes = new Set<string>();
  const q = input.qualityAssuranceRouting;
  if (q?.includeInReg44Summary) routes.add("Reg 44 summary");
  if (q?.includeInReg45Review) routes.add("Reg 45 review");
  if (q?.includeInHomeDevelopmentPlan) routes.add("Home development plan");
  if (q?.includeInTeamMeeting) routes.add("Team meeting");
  if (q?.includeInStaffSupervision) routes.add("Staff supervision");
  if (q?.includeInChildReview) routes.add("Child's review");

  // Derived routing from findings.
  if (input.repeatedPattern || (input.patternContext?.repeatedThemes?.length ?? 0) > 0) {
    routes.add("Reg 45 review");
    routes.add("Team meeting");
    routes.add("Child's review");
  }
  if ((input.planAdherenceContext?.unjustifiedDeviationsFromPlan?.length ?? 0) > 0) {
    routes.add("Staff supervision");
    routes.add("Home development plan");
  }
  if ((input.policyComplianceContext?.possiblePolicyFailures?.length ?? 0) > 0) {
    routes.add("Manager audit");
    routes.add("Staff supervision");
  }
  if (escalationRequired) routes.add("Reg 44 summary");
  if (positivePractice) routes.add("Team meeting (positive learning)");
  if (input.missingFromCare) routes.add("Risk dashboard");
  if (input.allegation || input.disclosure || input.exploitationConcern) routes.add("Safeguarding tracker");
  return [...routes];
}

// ─── Main generator ────────────────────────────────────────────────────────────

export function generateManagementOversight(input: OversightInput): OversightResult {
  const scores = computeScores(input);
  const risk = deriveRiskLevel(input, scores);
  const intelligence = buildCaraIntelligence(input);
  const findings = buildFindings(input, scores, risk);
  const recordingGaps = buildRecordingGaps(input);
  const escalation = deriveEscalation(input, scores, risk);

  const workflowCompletionStatus = deriveWorkflowCompletionStatus(input, scores);
  const planAdherenceStatus = derivePlanAdherenceStatus(input, scores);
  const practiceConcernLevel = derivePracticeConcernLevel(input, scores, escalation);
  const managementResponseStatus = deriveManagementResponseStatus(input, scores);
  const outcome = deriveOutcome(input, scores, risk, escalation, findings);
  const api = recommendApiCall(input, scores, risk);

  const positivePractice = findings.positivePracticeFindings.length > 0;
  const policyFailurePossible = (input.policyComplianceContext?.possiblePolicyFailures?.length ?? 0) > 0;

  // ── Professional oversight ───────────────────────────────────────────────
  let professionalOversight: string | undefined;
  if (input.oversightMode === "professional" || input.oversightMode === "both") {
    professionalOversight = buildProfessionalOversight({
      input,
      scores,
      findings,
      intelligence,
      risk,
      outcome,
      planAdherenceStatus,
      workflowCompletionStatus,
      escalationReasons: escalation.escalationReasons,
      recordingGaps,
    });
  }

  // ── Child-addressed oversight (with safety gate) ─────────────────────────
  let childAddressedOversight: string | undefined;
  let childAddressedSuppressed = false;
  let childAddressedSuppressionReason: string | undefined;
  if (input.oversightMode === "child_addressed" || input.oversightMode === "both") {
    const gate = shouldSuppressChildAddressed(input, risk);
    if (gate.suppressed) {
      childAddressedSuppressed = true;
      childAddressedSuppressionReason = gate.reason;
    } else {
      childAddressedOversight = buildChildAddressedOversight(input);
    }
  }

  return {
    professionalOversight,
    childAddressedOversight,

    riskLevel: risk,
    oversightOutcome: outcome,
    evidenceQualityScore: scores.evidenceQualityScore,
    workflowScore: scores.workflowScore,
    planAdherenceScore: scores.planAdherenceScore,
    practiceResponseScore: scores.practiceResponseScore,
    referralCompletionScore: scores.referralCompletionScore,
    policyComplianceScore: scores.policyComplianceScore,

    missingEvidence: findings.missingEvidence,
    recordingGaps,
    requiredActions: findings.requiredActions,
    staffPracticeActions: findings.staffPracticeActions,
    supportRecommendations: findings.supportRecommendations,
    outstandingWorkflowActions: findings.outstandingWorkflowActions,

    escalationRequired: escalation.escalationRequired,
    escalationReasons: escalation.escalationReasons,

    regulatoryTags: regulatoryTags(input),
    therapeuticTags: intelligence.therapeuticTags,
    qualityAssuranceRoutes: qualityAssuranceRoutes(input, escalation.escalationRequired, positivePractice),

    evidenceFindings: findings.evidenceFindings,
    workflowFindings: findings.workflowFindings,
    associatedPaperworkFindings: findings.associatedPaperworkFindings,
    staffDebriefFindings: findings.staffDebriefFindings,
    childDebriefFindings: findings.childDebriefFindings,
    keyWorkFollowUpFindings: findings.keyWorkFollowUpFindings,
    practiceResponseFindings: findings.practiceResponseFindings,
    planAdherenceFindings: findings.planAdherenceFindings,
    referralFindings: findings.referralFindings,
    policyComplianceFindings: findings.policyComplianceFindings,
    managementAccountabilityFindings: findings.managementAccountabilityFindings,
    patternFindings: intelligence.patternFindings,
    livedExperienceConsiderations: intelligence.livedExperienceConsiderations,
    professionalCuriosityFindings: intelligence.professionalCuriosityFindings,
    positivePracticeFindings: findings.positivePracticeFindings,
    dignityAndTrustFindings: findings.dignityAndTrustFindings,
    preventabilityFindings: findings.preventabilityFindings,

    workflowCompletionStatus,
    planAdherenceStatus,
    practiceConcernLevel,
    managementResponseStatus,

    outstandingPaperwork: findings.outstandingPaperwork,
    referralsOutstanding: findings.referralsOutstanding,

    policyFailurePossible,
    childAddressedSuppressed,
    childAddressedSuppressionReason,

    apiCallRecommended: api.apiCallRecommended,
    apiCallReason: api.apiCallReason,

    engineVersion: OVERSIGHT_ENGINE_VERSION,
    generatedAt: isoNow(),
  };
}

// ─── Task-level oversight ──────────────────────────────────────────────────────

export function generateTaskOversight(input: TaskOversightInput): TaskOversightResult {
  const label = input.taskName;
  const highRisk = input.riskRelevance === "high" || input.riskRelevance === "critical";

  // Not required → not applicable.
  if (!input.required) {
    return {
      taskName: label,
      oversightStatus: "not_applicable",
      suggestedOversight: `${label} is not required for this workflow.`,
      escalationRequired: false,
      includeInSignOff: false,
    };
  }

  let status: TaskOversightStatus;
  let suggested: string;
  let requiredAction: OversightAction | undefined;
  let escalationRequired = false;

  if (!input.completed) {
    status = highRisk ? "requires_action" : "requires_clarification";
    suggested = `${label} was required but is not yet evidenced. ${highRisk ? "Given the risk involved, this should be completed and recorded as a priority." : "This should be completed and recorded so the workflow is assured."}`;
    requiredAction = {
      action: `Complete and evidence: ${label}.`,
      responsibleRole: input.completedByRole ?? "shift_lead",
      timescale: highRisk ? "48 hours" : "5 working days",
      priority: highRisk ? "high" : "medium",
      source: "task",
    };
    escalationRequired = highRisk && !!input.affectsChildSafetyOrDignity;
    if (escalationRequired) status = "escalated";
  } else if (input.consistentWithWorkflow === false) {
    status = "requires_clarification";
    suggested = `${label} is complete but appears inconsistent with other workflow records; clarification is required to resolve the discrepancy.`;
  } else if (input.completedLate) {
    status = "reviewed_satisfactory";
    suggested = `${label} was completed (recorded late). The reason for the delay should be noted, but the task itself is evidenced.`;
  } else {
    status = "reviewed_satisfactory";
    suggested = `${label} was completed${input.completedByRole ? ` by ${input.completedByRole.replace(/_/g, " ")}` : ""}${input.completedAt ? ` on ${input.completedAt}` : ""} and the evidence is satisfactory.`;
  }

  return {
    taskName: label,
    oversightStatus: status,
    suggestedOversight: suggested,
    requiredAction,
    escalationRequired,
    // The not_applicable case returns early above, so a required task always
    // belongs in the sign-off picture.
    includeInSignOff: true,
  };
}

// ─── Workflow sign-off ─────────────────────────────────────────────────────────

const ROLE_RANK: Record<SignOffRole, number> = {
  support_worker: 0,
  senior_support_worker: 1,
  shift_lead: 2,
  team_leader: 3,
  deputy_manager: 4,
  registered_manager: 5,
  responsible_individual: 6,
  senior_leadership: 6,
};

/** Minimum role allowed to sign off at a given risk level. */
function minRoleForRisk(risk: RiskLevel): SignOffRole {
  switch (risk) {
    case "low": return "team_leader";
    case "medium": return "deputy_manager";
    case "high": return "registered_manager";
    case "critical": return "registered_manager";
  }
}

export const SIGN_OFF_STATEMENT =
  "I confirm that I have reviewed the workflow, associated records, debriefs, referrals, plan adherence, actions and management oversight. Outstanding actions have been assigned with timescales, and any escalation required has been identified.";

/** Build a concise oversight note to record against the source record on sign-off. */
export function buildSignOffNote(finalProfessionalOversight: string, signedOffByRole: SignOffRole): string {
  const trimmed = (finalProfessionalOversight ?? "").trim().replace(/\s+/g, " ");
  const summary = trimmed.length > 400 ? `${trimmed.slice(0, 397)}…` : trimmed;
  const attribution = `[Signed off via Workflow Assurance by ${signedOffByRole.replace(/_/g, " ")}.]`;
  return summary ? `${summary}\n\n${attribution}` : attribution;
}

export function deriveSignOffBlockers(result: OversightResult, input: WorkflowSignOffInput): SignOffBlocker[] {
  const blockers: SignOffBlocker[] = [];
  const r = result;

  if (!input.finalProfessionalOversight || !input.finalProfessionalOversight.trim()) {
    blockers.push({ code: "no_oversight", description: "Final professional oversight is blank.", mandatory: true });
  }
  if (r.referralsOutstanding.length) {
    blockers.push({ code: "referrals_outstanding", description: `${r.referralsOutstanding.length} required referral/notification outstanding.`, mandatory: true });
  }
  if (r.outstandingPaperwork.some((p) => p.required)) {
    blockers.push({ code: "paperwork_outstanding", description: "Required associated paperwork is outstanding.", mandatory: true });
  }
  // Required actions without owner or timescale.
  const allActions = [...r.requiredActions, ...r.staffPracticeActions, ...r.outstandingWorkflowActions];
  if (allActions.some((a) => !a.responsibleRole)) {
    blockers.push({ code: "action_no_owner", description: "A required action has no responsible owner.", mandatory: true });
  }
  if (allActions.some((a) => !a.timescale)) {
    blockers.push({ code: "action_no_timescale", description: "A required action has no timescale.", mandatory: true });
  }
  if (!input.confirmActionsAssigned) {
    blockers.push({ code: "confirm_actions", description: "Confirmation that actions are assigned is required.", mandatory: true });
  }
  if (!input.confirmTimescalesRecorded) {
    blockers.push({ code: "confirm_timescales", description: "Confirmation that timescales are recorded is required.", mandatory: true });
  }
  if (r.escalationRequired && !input.confirmRisksEscalated) {
    blockers.push({ code: "confirm_escalation", description: "Confirmation that outstanding risks are escalated is required.", mandatory: true });
  }
  // Child-addressed unsafe but not suppressed.
  if ((input.oversightChildModeRequested ?? false) && !r.childAddressedSuppressed && !input.confirmChildFacingSafeOrSuppressed) {
    blockers.push({ code: "child_facing_unconfirmed", description: "Child-facing wording must be confirmed safe or suppressed.", mandatory: true });
  }
  if (input.contradictionsUnresolved) {
    blockers.push({ code: "contradictions", description: "Contradictory records remain unresolved.", mandatory: true });
  }
  return blockers;
}

export function generateWorkflowSignOff(input: WorkflowSignOffInput): WorkflowSignOffResult {
  const r = input.oversightResult;
  const blockers = deriveSignOffBlockers(r, input);
  const requiresSeniorReview = r.oversightOutcome === "senior_review_required" || r.riskLevel === "critical";

  const minRole = minRoleForRisk(r.riskLevel);
  const roleAuthorised = ROLE_RANK[input.signOffRole] >= ROLE_RANK[minRole];

  const mandatoryBlockers = blockers.filter((b) => b.mandatory);
  const overrideUsed = mandatoryBlockers.length > 0 && !!input.overrideReason;

  // Sign-off allowed when: role authorised, AND (no mandatory blockers OR a
  // valid override by a sufficiently-senior role with a recorded reason).
  const overrideAllowed = overrideUsed && ROLE_RANK[input.signOffRole] >= ROLE_RANK["registered_manager"];
  const canSign = roleAuthorised && (mandatoryBlockers.length === 0 || overrideAllowed);

  if (!roleAuthorised) {
    return {
      signed: false,
      blockers,
      requiresSeniorReview,
      roleAuthorised: false,
      overrideUsed: false,
      signOffStatement: SIGN_OFF_STATEMENT,
      reason: `Sign-off at risk level "${r.riskLevel}" requires at least a ${minRole.replace(/_/g, " ")}.`,
    };
  }
  if (!canSign) {
    return {
      signed: false,
      blockers,
      requiresSeniorReview,
      roleAuthorised: true,
      overrideUsed: false,
      signOffStatement: SIGN_OFF_STATEMENT,
      reason: `${mandatoryBlockers.length} mandatory blocker(s) prevent sign-off. A Registered Manager may override with a recorded reason.`,
    };
  }

  const auditEntry = {
    signedOffByUserId: input.signedOffByUserId,
    signedOffByRole: input.signOffRole,
    signedOffAt: isoNow(input.today),
    finalProfessionalOversight: input.finalProfessionalOversight,
    childAddressedOversight: input.childAddressedOversight,
    childAddressedSuppressed: r.childAddressedSuppressed,
    suppressionReason: r.childAddressedSuppressionReason,
    outstandingActions: [...r.requiredActions, ...r.outstandingWorkflowActions],
    escalationRequired: r.escalationRequired,
    escalationReasons: r.escalationReasons,
    overrideUsed,
    overrideReason: input.overrideReason,
    qualityAssuranceRoutes: r.qualityAssuranceRoutes,
  };

  return {
    signed: true,
    blockers,
    requiresSeniorReview,
    roleAuthorised: true,
    overrideUsed,
    auditEntry,
    signOffStatement: SIGN_OFF_STATEMENT,
  };
}
