// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT ENGINE · API-call recommendation
//
// Standard oversight is ALWAYS produced deterministically. This module only
// decides whether to RECOMMEND enhanced AI/API drafting (it never calls one) —
// for the specific high-complexity / high-risk cases the spec defines, where
// deterministic templates may be insufficient and a human + richer drafting are
// warranted. The recommendation is advisory; the deterministic oversight stands.
// ══════════════════════════════════════════════════════════════════════════════

import type { OversightInput, RiskLevel } from "./types";
import type { OversightScores } from "./scoring";

export interface ApiRecommendation {
  apiCallRecommended: boolean;
  apiCallReason?: string;
}

export function recommendApiCall(
  input: OversightInput,
  scores: OversightScores,
  risk: RiskLevel,
): ApiRecommendation {
  const reasons: string[] = [];

  if (risk === "critical") reasons.push("the record is critical risk");
  if (input.contradictoryInformation) reasons.push("the record contains contradictory information");
  if (input.allegation || input.disclosure) reasons.push("an allegation or disclosure is present");
  if (input.exploitationConcern) reasons.push("a possible exploitation / significant-harm concern is present");

  const highRisk = risk === "high" || risk === "critical";
  if (highRisk && scores.evidenceQualityScore <= 40) {
    reasons.push("evidence is insufficient but the record is high risk");
  }
  if (input.managerRequestedEnhancedDrafting) reasons.push("the manager requested enhanced drafting");
  if (input.recordType === "other") reasons.push("the record type is unknown / unmapped");

  // Complex multi-agency wording.
  const multiAgency =
    (input.referralContext?.externalProfessionalsToUpdate?.length ?? 0) >= 3 ||
    input.referralContext?.multiAgencyFollowUpRequired;
  if (multiAgency && highRisk) reasons.push("the oversight requires complex multi-agency wording");

  // Child-facing version for a highly sensitive safeguarding matter.
  const wantsChild = input.oversightMode === "child_addressed" || input.oversightMode === "both";
  if (wantsChild && (input.allegation || input.disclosure || input.exploitationConcern || risk === "critical")) {
    reasons.push("a child-facing version is requested for a highly sensitive safeguarding matter");
  }

  // Missing Cara Intelligence but high risk.
  const hasIntel = !!(input.childContext || input.recentContext || input.patternContext);
  if (!hasIntel && highRisk) reasons.push("Cara Intelligence context is missing but the record is high risk");

  // Contradictory associated paperwork.
  if ((input.workflowCompletionContext?.workflowConsistencyConcerns?.length ?? 0) > 0) {
    reasons.push("associated paperwork contains contradictory information");
  }

  // Child debrief raises a NEW safeguarding concern (a worry the child raised + safeguarding signals).
  const cd = input.workflowCompletionContext?.childDebrief;
  if (cd && (cd.childWorries?.length ?? 0) > 0 && (input.recordType === "safeguarding" || input.exploitationConcern || input.disclosure)) {
    reasons.push("the child debrief raises a possible new safeguarding concern");
  }

  // Staff debrief serious practice concern.
  const sd = input.workflowCompletionContext?.staffDebrief;
  if (sd?.furtherManagementActionRequired && highRisk) reasons.push("the staff debrief raises a serious practice concern");

  // Workflow incomplete after a critical event.
  if (risk === "critical" && scores.workflowScore < 80) reasons.push("the workflow is incomplete after a critical event");

  // Possible serious staff practice failure.
  if ((input.policyComplianceContext?.possiblePolicyFailures?.length ?? 0) > 0 && highRisk) {
    reasons.push("a possible serious staff practice / policy failure is identified in a high-risk event");
  }

  // Policy compliance unclear in a critical/high-risk event.
  const pc = input.policyComplianceContext;
  if (highRisk && pc && (pc.policyStepsFollowed?.length ?? 0) === 0 && (pc.policyStepsNotFollowed?.length ?? 0) === 0 && (pc.relevantPolicies?.length ?? 0) > 0) {
    reasons.push("policy compliance is unclear in a high-risk event");
  }

  // Cannot determine whether a plan deviation was reasonable.
  const pa = input.planAdherenceContext;
  const unclearDeviation = (pa?.guidingDocumentChecks ?? []).some(
    (c) => c.wasFollowed === "not_followed" && !c.rationaleForNotFollowing,
  );
  if (unclearDeviation && highRisk) {
    reasons.push("the system cannot determine whether deviation from the child's plan was reasonable");
  }

  if (reasons.length === 0) return { apiCallRecommended: false };
  return {
    apiCallRecommended: true,
    apiCallReason: `Enhanced drafting is recommended (the deterministic oversight still applies) because ${reasons.join("; ")}.`,
  };
}
