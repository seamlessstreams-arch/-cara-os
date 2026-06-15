// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT ENGINE · professional templates
//
// Deterministic builder for the inspection-ready professional management
// oversight. Assembles the spec's 25-section structure from the already-computed
// findings, scores, actions and Cara Intelligence. Pure string assembly — no
// AI. Empty sections are skipped so the narrative stays readable.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  OversightInput,
  OversightAction,
  RiskLevel,
  OversightOutcome,
  PlanAdherenceStatus,
  WorkflowCompletionStatus,
} from "../types";
import type { OversightScores } from "../scoring";
import type { RuleFindings } from "../rules";
import type { CaraIntelligenceFindings } from "../cara-intelligence";

export interface ProfessionalTemplateInput {
  input: OversightInput;
  scores: OversightScores;
  findings: RuleFindings;
  intelligence: CaraIntelligenceFindings;
  risk: RiskLevel;
  outcome: OversightOutcome;
  planAdherenceStatus: PlanAdherenceStatus;
  workflowCompletionStatus: WorkflowCompletionStatus;
  escalationReasons: string[];
}

const child = (i: OversightInput) => i.childName ?? "the child";
const reviewer = (i: OversightInput) => i.reviewedByRole?.replace(/_/g, " ") ?? "the manager";

function workflowStatusPhrase(s: WorkflowCompletionStatus): string {
  switch (s) {
    case "complete": return "complete";
    case "mostly_complete": return "mostly complete with minor gaps";
    case "partially_complete": return "partially complete";
    case "incomplete": return "incomplete";
    case "not_applicable": return "not applicable for this record";
    default: return "unclear";
  }
}

function adherencePhrase(s: PlanAdherenceStatus): string {
  switch (s) {
    case "followed": return "the relevant plans appear to have been followed";
    case "partially_followed": return "the relevant plans were partially followed";
    case "not_followed": return "the record indicates the relevant plans were not followed and rationale is required";
    case "unclear": return "it is unclear whether the relevant plans were followed";
    default: return "plan adherence is not applicable to this record";
  }
}

function outcomePhrase(o: OversightOutcome): string {
  switch (o) {
    case "satisfactory": return "Satisfactory — the professional response is assessed as appropriate and proportionate.";
    case "requires_clarification": return "Requires clarification — some elements need to be clarified before this can be assured.";
    case "requires_action": return "Requires action — specific actions are required and have been set out below.";
    case "requires_escalation": return "Requires escalation — this has been escalated for senior review.";
    case "senior_review_required": return "Senior review required — this requires Registered Manager / Responsible Individual oversight.";
  }
}

function actionLines(actions: OversightAction[]): string {
  return actions
    .map((a) => `• ${a.action} (responsible: ${a.responsibleRole.replace(/_/g, " ")}, by: ${a.timescale}${a.impactReviewRequired ? "; impact review required" : ""}).`)
    .join("\n");
}

/** Build the professional management oversight as a structured, section-headed narrative. */
export function buildProfessionalOversight(t: ProfessionalTemplateInput): string {
  const { input: i, scores, findings: f, intelligence: intel, risk, outcome } = t;
  const recordLabel = i.recordType.replace(/_/g, " ");
  const sections: string[] = [];
  const add = (heading: string, body: string | string[]) => {
    const text = Array.isArray(body) ? body.filter(Boolean).join("\n") : body;
    if (text && text.trim()) sections.push(`${heading}\n${text}`);
  };

  // 1. Review statement
  add(
    "1. Management review",
    `I (${reviewer(i)}) have reviewed the ${recordLabel} record for ${child(i)}${i.recordDate ? ` dated ${i.recordDate}` : ""}, including the connected workflow, associated records, debriefs, referrals, plan adherence and actions.`,
  );

  // 2. Evidence sources reviewed
  if (i.evidenceSourcesReviewed?.length) {
    add("2. Evidence sources reviewed", `The evidence reviewed includes: ${i.evidenceSourcesReviewed.map((s) => s.title ?? s.type.replace(/_/g, " ")).join(", ")}.`);
  }

  // 3. Evidence quality judgement
  add("3. Evidence quality", [
    `The quality of the record is assessed as ${scores.evidenceQualityScore}/100.`,
    ...f.evidenceFindings,
    ...(f.missingEvidence.length ? [`Gaps: ${f.missingEvidence.join(" ")}`] : []),
  ]);

  // 4–5. Workflow + associated paperwork
  add("4. Paperwork workflow", [
    `The paperwork workflow is assessed as ${workflowStatusPhrase(t.workflowCompletionStatus)} (workflow score ${scores.workflowScore}/100).`,
    ...f.workflowFindings,
  ]);
  add("5. Associated paperwork", f.associatedPaperworkFindings);

  // 6–7. Staff / management actions
  add("6. Staff and team actions", f.practiceResponseFindings);
  add("7. Management actions", f.managementAccountabilityFindings);

  // 8–9. Debriefs
  add("8. Staff debrief", f.staffDebriefFindings);
  add("9. Child debrief", f.childDebriefFindings);

  // 10. Key-work / direct work
  add("10. Key-work and direct work", f.keyWorkFollowUpFindings);

  // 11. Lived experience + recent context
  add("11. The child's lived experience and recent context", intel.livedExperienceConsiderations);

  // 12. Pattern analysis
  add("12. Pattern analysis", intel.patternFindings);

  // 13. Therapeutic model
  add("13. Therapeutic model", intel.professionalCuriosityFindings);

  // 14. Plan adherence
  add("14. Plan adherence", [
    `Overall, ${adherencePhrase(t.planAdherenceStatus)} (plan adherence score ${scores.planAdherenceScore}/100).`,
    ...f.planAdherenceFindings,
  ]);

  // 15. Policy compliance
  add("15. Policy compliance", [
    `Policy compliance is assessed at ${scores.policyComplianceScore}/100.`,
    ...f.policyComplianceFindings,
  ]);

  // 16. Referrals / notifications
  add("16. Referrals and notifications", [
    `Required referrals/notifications are assessed at ${scores.referralCompletionScore}/100.`,
    ...f.referralFindings,
  ]);

  // 17. Proportionality
  add("17. Proportionality and least-restrictive practice", f.dignityAndTrustFindings);

  // 18–19. Child impact + safeguarding/risk
  add("18. Child impact", [
    ...f.positivePracticeFindings,
    ...f.preventabilityFindings,
  ]);
  add("19. Safeguarding and risk", `From a safeguarding and risk perspective, the assessed risk level is ${risk}.${t.escalationReasons.length ? " Escalation reasons: " + t.escalationReasons.join(" ") : ""}`);

  // 20. Practice and leadership judgement
  add("20. Management oversight judgement", outcomePhrase(outcome));

  // 21. Required compliance actions
  add("21. Required actions", f.requiredActions.length || f.staffPracticeActions.length ? actionLines([...f.requiredActions, ...f.staffPracticeActions]) : "No further compliance actions are required at this time.");

  // 22. Support recommendations
  add("22. Support recommendations", f.supportRecommendations.length ? actionLines(f.supportRecommendations) : "");

  // 23. Responsible person and timescale
  const owners = [...f.requiredActions, ...f.staffPracticeActions];
  add("23. Responsible person and timescale", owners.length
    ? `Actions have been assigned with responsible roles and timescales; the action tracker must be updated and reviewed for impact.`
    : "");

  // 24. Review, action tracking and learning
  add("24. Review, action tracking and learning", `Learning from this event should be reflected in the child's plan, risk assessment, staff guidance, supervision or home development records where required.${t.outcome !== "satisfactory" ? " The action tracker must be updated and the impact of actions reviewed." : ""}`);

  // 25. Sign-off statement
  add("25. Sign-off", "I confirm this workflow has been reviewed at the appropriate management level. Outstanding actions have been assigned with timescales, and any escalation required has been identified.");

  return sections.join("\n\n");
}
