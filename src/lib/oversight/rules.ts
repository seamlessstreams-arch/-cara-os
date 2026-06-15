// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT ENGINE · deterministic rules
//
// Turns the structured workflow input into findings, actions, escalation,
// risk/outcome and derived statuses. Wording is cautious and non-blaming:
// "possible practice gap", "the record indicates", "management review is
// required" — never "staff failed", "neglect" or "breach" (those are
// management conclusions, not engine outputs).
// ══════════════════════════════════════════════════════════════════════════════

import type {
  OversightInput,
  OversightAction,
  RiskLevel,
  OversightOutcome,
  WorkflowCompletionStatus,
  PlanAdherenceStatus,
  PracticeConcernLevel,
  ManagementResponseStatus,
  AssociatedPaperwork,
  ReferralOrNotification,
  PlanAdherenceContext,
  RecordingGap,
} from "./types";
import type { OversightScores } from "./scoring";

const RISK_ORDER: RiskLevel[] = ["low", "medium", "high", "critical"];
const maxRisk = (a: RiskLevel, b: RiskLevel): RiskLevel =>
  RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;

// ─── Risk level ────────────────────────────────────────────────────────────────

export function deriveRiskLevel(input: OversightInput, scores: OversightScores): RiskLevel {
  let risk: RiskLevel = input.existingRiskLevel ?? "low";

  // Safeguarding-critical signals.
  if (input.allegation || input.disclosure || input.exploitationConcern || input.selfHarmConcern) {
    risk = maxRisk(risk, "critical");
  }
  if (input.emergencyServicesInvolved || input.policeInvolved) risk = maxRisk(risk, "high");
  if (input.restraintUsed || input.injury || input.missingFromCare || input.medicationError) {
    risk = maxRisk(risk, "high");
  }
  if (input.recordType === "safeguarding" || input.recordType === "allegation") {
    risk = maxRisk(risk, "high");
  }
  if (input.repeatedPattern) risk = maxRisk(risk, "medium");

  // Low scores after a high-risk-typed event escalate the assessed risk.
  const lowestScore = Math.min(
    scores.evidenceQualityScore,
    scores.workflowScore,
    scores.planAdherenceScore,
    scores.referralCompletionScore,
    scores.policyComplianceScore,
  );
  if (lowestScore <= 20 && RISK_ORDER.indexOf(risk) >= 1) risk = maxRisk(risk, "high");

  // Child safety plan / keeping-me-safe not followed pushes risk up.
  const pa = input.planAdherenceContext;
  if (pa) {
    const safety = (pa.guidingDocumentChecks ?? []).filter(
      (c) =>
        (c.documentType === "child_safety_plan" || c.documentType === "keeping_me_safe_plan") &&
        c.wasFollowed === "not_followed",
    );
    if (safety.length) risk = maxRisk(risk, "high");
  }
  return risk;
}

// ─── Escalation ────────────────────────────────────────────────────────────────

export function deriveEscalation(
  input: OversightInput,
  scores: OversightScores,
  risk: RiskLevel,
): { escalationRequired: boolean; escalationReasons: string[] } {
  const reasons: string[] = [];
  const wf = input.workflowCompletionContext;
  const highRiskEvent = risk === "high" || risk === "critical";

  if (input.allegation || input.disclosure) {
    reasons.push("An allegation or disclosure requires senior safeguarding review.");
  }
  if (input.exploitationConcern) reasons.push("A possible exploitation concern requires senior safeguarding review.");

  // High-risk event with an incomplete workflow.
  if (highRiskEvent && wf && (wf.workflowStatus === "incomplete" || wf.workflowStatus === "partially_complete")) {
    reasons.push("The workflow is not complete following a high-risk event.");
  }

  // Physical intervention without debrief / injury check.
  if (input.restraintUsed) {
    if (wf?.childDebrief?.required && wf.childDebrief.status === "required_not_completed") {
      reasons.push("Physical intervention without an evidenced child debrief.");
    }
    if (wf?.staffDebrief?.required && wf.staffDebrief.status === "required_not_completed") {
      reasons.push("Physical intervention without an evidenced staff debrief.");
    }
    if (input.injuriesRecordedOrRuledOut === false) {
      reasons.push("Physical intervention without an injury check / body map where required.");
    }
  }

  // Missing episode without return discussion / notification evidence.
  if (input.missingFromCare) {
    const ret = wf?.childDebrief;
    if (ret?.required && ret.status === "required_not_completed") {
      reasons.push("Missing-from-care episode without an evidenced return-home discussion.");
    }
    const refs = input.referralContext?.referralsAndNotifications ?? [];
    const laOrPolice = refs.filter(
      (r) => (r.type === "police" || r.type === "local_authority_designated_officer" || r.type === "placing_authority") && r.required && !r.completed,
    );
    if (laOrPolice.length) reasons.push("Missing-from-care notification to police / local authority is unclear or outstanding.");
  }

  // Medication error without follow-up paperwork.
  if (input.medicationError && scores.workflowScore <= 40) {
    reasons.push("Medication error without evidenced medication follow-up paperwork.");
  }

  // Referrals required but not completed.
  if ((input.referralContext?.referralsRequiredButNotCompleted ?? []).length) {
    reasons.push("A required referral/notification has not been completed.");
  }

  // Plans not followed.
  const unjustified = input.planAdherenceContext?.unjustifiedDeviationsFromPlan ?? [];
  if (unjustified.length) reasons.push("The agreed plan was not followed without a recorded rationale.");
  if (input.repeatedPattern && scores.planAdherenceScore <= 60) {
    reasons.push("Repeated plan non-adherence requires senior review.");
  }

  // Serious staff practice / policy.
  if (staffDebriefSeriousConcern(input)) {
    reasons.push("The staff debrief identified a serious practice concern.");
  }
  if ((input.policyComplianceContext?.possiblePolicyFailures ?? []).length && highRiskEvent) {
    reasons.push("A possible policy failure in a high-risk event requires management review.");
  }
  if (input.policyComplianceContext?.requiresSeniorLeadershipReview) {
    reasons.push("Policy compliance concern flagged for senior leadership review.");
  }

  // Management accountability.
  const ma = input.managementAccountabilityContext;
  if (ma?.responsibleIndividualOversightRequired && !ma.responsibleIndividualOversightCompleted) {
    reasons.push("Responsible Individual oversight is required but not yet completed.");
  }

  // Action-tracker drift after a significant event.
  if (highRiskEvent && wf && wf.actionTrackerUpdated === false) {
    reasons.push("The action tracker has not been updated after a significant event.");
  }

  return { escalationRequired: reasons.length > 0, escalationReasons: reasons };
}

/** A staff debrief that flags further management action or policy/plan issues. */
function staffDebriefSeriousConcern(input: OversightInput): boolean {
  const sd = input.workflowCompletionContext?.staffDebrief;
  return !!(sd && (sd.furtherManagementActionRequired || (sd.policyOrPlanIssuesIdentified ?? []).length));
}

// ─── Findings builders ───────────────────────────────────────────────────────

export interface RuleFindings {
  evidenceFindings: string[];
  workflowFindings: string[];
  associatedPaperworkFindings: string[];
  staffDebriefFindings: string[];
  childDebriefFindings: string[];
  keyWorkFollowUpFindings: string[];
  practiceResponseFindings: string[];
  planAdherenceFindings: string[];
  referralFindings: string[];
  policyComplianceFindings: string[];
  managementAccountabilityFindings: string[];
  positivePracticeFindings: string[];
  dignityAndTrustFindings: string[];
  preventabilityFindings: string[];
  missingEvidence: string[];
  requiredActions: OversightAction[];
  staffPracticeActions: OversightAction[];
  supportRecommendations: OversightAction[];
  outstandingWorkflowActions: OversightAction[];
  outstandingPaperwork: AssociatedPaperwork[];
  referralsOutstanding: ReferralOrNotification[];
}

const emptyFindings = (): RuleFindings => ({
  evidenceFindings: [],
  workflowFindings: [],
  associatedPaperworkFindings: [],
  staffDebriefFindings: [],
  childDebriefFindings: [],
  keyWorkFollowUpFindings: [],
  practiceResponseFindings: [],
  planAdherenceFindings: [],
  referralFindings: [],
  policyComplianceFindings: [],
  managementAccountabilityFindings: [],
  positivePracticeFindings: [],
  dignityAndTrustFindings: [],
  preventabilityFindings: [],
  missingEvidence: [],
  requiredActions: [],
  staffPracticeActions: [],
  supportRecommendations: [],
  outstandingWorkflowActions: [],
  outstandingPaperwork: [],
  referralsOutstanding: [],
});

function action(
  a: string,
  role: string,
  timescale: string,
  priority: RiskLevel,
  extra?: Partial<OversightAction>,
): OversightAction {
  return { action: a, responsibleRole: role, timescale, priority, ...extra };
}

export function buildFindings(input: OversightInput, scores: OversightScores, risk: RiskLevel): RuleFindings {
  const f = emptyFindings();

  // ── Evidence (main record) ──────────────────────────────────────────────
  if (input.evidenceSourcesReviewed?.length) {
    const reviewed = input.evidenceSourcesReviewed.filter((s) => s.reviewed).length;
    f.evidenceFindings.push(
      `${reviewed} of ${input.evidenceSourcesReviewed.length} evidence source(s) recorded as reviewed.`,
    );
  }
  const evMissing: Array<[boolean | undefined, string]> = [
    [input.antecedentsIncluded, "antecedents / what was happening beforehand"],
    [input.childVoiceCaptured, "the child's voice"],
    [input.childPresentationRecorded, "the child's presentation"],
    [input.staffActionsRecorded, "the actions staff took"],
  ];
  for (const [flag, label] of evMissing) {
    if (flag === false) f.missingEvidence.push(`The record does not evidence ${label}.`);
  }
  if (scores.evidenceQualityScore < 60) {
    f.requiredActions.push(
      action(
        "Strengthen the record so the chronology, child's voice, presentation and staff actions are clearly evidenced.",
        input.reviewedByRole ?? "shift_lead",
        "48 hours",
        risk === "low" ? "medium" : "high",
        { source: "evidence" },
      ),
    );
  }

  // ── Plan adherence ──────────────────────────────────────────────────────
  buildPlanAdherenceFindings(input.planAdherenceContext, f, risk);

  // ── Practice response ───────────────────────────────────────────────────
  const pr = input.practiceResponseContext;
  if (pr) {
    if ((pr.plannedStrategiesUsed ?? []).length) {
      f.positivePracticeFindings.push(
        `Staff used the child's planned strategies (${pr.plannedStrategiesUsed!.join(", ")}); this should be reinforced through handover and team briefing.`,
      );
    }
    if ((pr.plannedStrategiesNotUsed ?? []).length && !pr.reasonStrategiesNotUsed) {
      f.practiceResponseFindings.push(
        "The record indicates that one or more planned strategies were not used and no rationale is recorded. Staff rationale is required.",
      );
      f.staffPracticeActions.push(
        action(
          "Obtain and record staff rationale where the agreed strategy was not used, and consider whether the plan remains workable.",
          "deputy_manager",
          "5 working days",
          "medium",
          { source: "practice_response" },
        ),
      );
    } else if ((pr.plannedStrategiesNotUsed ?? []).length && pr.reasonStrategiesNotUsed) {
      f.practiceResponseFindings.push(
        `A planned strategy was not used; a rationale is recorded (“${pr.reasonStrategiesNotUsed}”). This appears reasonable on the information available and does not in itself indicate a practice failure.`,
      );
    }
    if (pr.staffActionsTaken === undefined && pr.immediateSafetyActionsTaken === undefined) {
      f.practiceResponseFindings.push("It is unclear what actions staff took; this requires clarification.");
    }
  }

  // ── Referrals / notifications ───────────────────────────────────────────
  const refs = input.referralContext?.referralsAndNotifications ?? [];
  for (const r of refs) {
    if (!r.required) continue;
    if (r.completed) {
      f.referralFindings.push(`Required ${r.type.replace(/_/g, " ")} notification/referral is recorded as completed.`);
    } else {
      f.referralFindings.push(`Required ${r.type.replace(/_/g, " ")} notification/referral is NOT evidenced as completed.`);
      f.referralsOutstanding.push(r);
      f.requiredActions.push(
        action(
          `Complete and evidence the required ${r.type.replace(/_/g, " ")} notification/referral.`,
          "registered_manager",
          "24 hours",
          "high",
          { source: "referral" },
        ),
      );
    }
  }
  for (const r of input.referralContext?.referralsCompletedLate ?? []) {
    f.referralFindings.push(`A ${r.type.replace(/_/g, " ")} notification/referral was completed late; the reason should be reviewed.`);
  }

  // ── Policy compliance ───────────────────────────────────────────────────
  const pc = input.policyComplianceContext;
  if (pc) {
    if ((pc.policyStepsNotFollowed ?? []).length) {
      f.policyComplianceFindings.push(
        `The record does not evidence that the following policy step(s) were completed: ${pc.policyStepsNotFollowed!.join("; ")}. Management review is required to determine whether the expected procedure was followed.`,
      );
    }
    if ((pc.possiblePolicyFailures ?? []).length) {
      f.policyComplianceFindings.push(
        `Possible policy compliance concern identified: ${pc.possiblePolicyFailures!.join("; ")}.`,
      );
      f.requiredActions.push(
        action(
          "Undertake a management review of policy compliance for this event and record the findings.",
          "registered_manager",
          "5 working days",
          "high",
          { source: "policy" },
        ),
      );
    }
    if (pc.requiresStaffSupervision) {
      f.supportRecommendations.push(
        action("Reflect on this event in the staff member's next supervision.", "deputy_manager", "next supervision", "medium", { source: "policy" }),
      );
    }
    if (pc.requiresRetraining) {
      f.staffPracticeActions.push(
        action("Arrange refresher training where a learning need is identified.", "registered_manager", "1 month", "medium", { source: "policy" }),
      );
    }
  }

  // ── Workflow / paperwork / debriefs / key-work ──────────────────────────
  buildWorkflowFindings(input, f, risk);

  // ── Management accountability ───────────────────────────────────────────
  const ma = input.managementAccountabilityContext;
  if (ma) {
    if (ma.managementResponseStatus === "insufficient") {
      f.managementAccountabilityFindings.push("Management response is assessed as insufficient and requires strengthening.");
    }
    if (ma.responsibleIndividualOversightRequired && !ma.responsibleIndividualOversightCompleted) {
      f.managementAccountabilityFindings.push("Responsible Individual oversight is required but not yet recorded.");
      f.requiredActions.push(
        action("Complete Responsible Individual oversight of this workflow.", "responsible_individual", "5 working days", "high", { source: "management" }),
      );
    }
    for (const a of ma.managementActionsOutstanding ?? []) f.outstandingWorkflowActions.push(a);
  }

  // ── Proportionality (restraint / restrictive practice) ──────────────────
  const prop = input.proportionalityAssessment;
  if (prop && (input.restraintUsed || input.recordType === "physical_intervention" || input.recordType === "room_search")) {
    if (prop.leastRestrictiveOptionConsidered && prop.interventionProportionate && prop.dignityMaintained) {
      f.positivePracticeFindings.push("The intervention is recorded as necessary, proportionate and least-restrictive, with the child's dignity maintained.");
    } else {
      f.dignityAndTrustFindings.push(
        "Management review should confirm that the intervention was necessary, proportionate, least-restrictive and that the child's dignity was maintained.",
      );
    }
  }

  // ── Preventability ──────────────────────────────────────────────────────
  if (input.repeatedPattern) {
    f.preventabilityFindings.push(
      "This event reflects a repeated pattern; management oversight should consider what could reduce the likelihood of recurrence.",
    );
  }

  return f;
}

// ─── Recording gaps ────────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<RecordingGap["severity"], number> = { significant: 0, moderate: 1, minor: 2 };

/**
 * Identify documentation/recording gaps across the whole workflow. Cautious,
 * "critical friend" wording — these are prompts for the manager to confirm or
 * close, not conclusions. A recording gap means the record does not *evidence*
 * something, which is itself a finding worth surfacing.
 */
export function buildRecordingGaps(input: OversightInput): RecordingGap[] {
  const gaps: RecordingGap[] = [];
  const add = (area: string, gap: string, severity: RecordingGap["severity"]) => gaps.push({ area, gap, severity });

  const behaviourLed =
    input.recordType === "incident" ||
    input.recordType === "physical_intervention" ||
    input.recordType === "sanction_or_consequence";
  const highStakes =
    input.existingRiskLevel === "high" ||
    input.existingRiskLevel === "critical" ||
    !!input.restraintUsed ||
    !!input.allegation ||
    !!input.disclosure ||
    !!input.missingFromCare;

  // ── Core record completeness ────────────────────────────────────────────
  if (input.chronologyClear === false) add("Chronology", "The record does not clearly set out what happened and in what order.", "moderate");
  if (behaviourLed && input.antecedentsIncluded === false)
    add("Antecedents", "What was happening beforehand (antecedents / triggers) is not clearly recorded.", highStakes ? "significant" : "moderate");
  if (input.staffActionsRecorded === false) add("Staff actions", "The actions staff took are not clearly recorded.", "moderate");
  if (input.childVoiceCaptured === false)
    add("Child's voice", "The child's voice or perspective is not evidenced in this record.", highStakes ? "significant" : "moderate");
  if (input.childPresentationRecorded === false) add("Child's presentation", "The child's presentation / wellbeing at the time is not recorded.", "minor");
  if (input.responsiblePersonRecorded === false) add("Accountability", "The responsible person / recorder is not clearly identified.", "minor");
  if (input.timescaleRecorded === false) add("Timing", "The date / time of the event is not clearly recorded.", "minor");

  // ── Safety-specific records ─────────────────────────────────────────────
  if ((input.injury || input.restraintUsed) && input.injuriesRecordedOrRuledOut === false)
    add("Injury check", "An injury check / body map is not evidenced where one would be expected.", "significant");
  if (
    (input.allegation || input.disclosure || input.missingFromCare || input.restraintUsed || input.recordType === "safeguarding") &&
    input.notificationsCompleted === false
  )
    add("Notifications", "No notifications are recorded for an event that would usually require them.", "significant");

  // ── Closure, learning and oversight ─────────────────────────────────────
  if (input.outcomeRecorded === false) add("Outcome", "The record is closed but no outcome is recorded.", "moderate");
  if (highStakes && input.lessonsLearnedRecorded === false) add("Learning", "No learning / lessons are recorded for a significant event.", "moderate");
  if (input.managementActionRecorded === false) add("Manager oversight", "Manager oversight is required but no oversight note is recorded.", "moderate");

  // ── Timeliness / consistency ────────────────────────────────────────────
  if (input.lateRecording) add("Timeliness", "The record appears to have been completed late; the reason should be noted.", "minor");
  if (input.contradictoryInformation) add("Consistency", "The records contain contradictory information that needs reconciling.", "significant");

  // ── Workflow paperwork + debriefs ───────────────────────────────────────
  for (const p of input.workflowCompletionContext?.associatedPaperwork ?? []) {
    if (p.required && (p.status === "outstanding" || p.status === "unclear")) {
      add("Associated paperwork", `${p.paperworkType.replace(/_/g, " ")} is ${p.status === "unclear" ? "unclear" : "outstanding"}.`, "moderate");
    }
  }
  const sd = input.workflowCompletionContext?.staffDebrief;
  if (sd?.required && sd.status === "required_not_completed") add("Staff debrief", "A staff debrief is required but is not yet recorded.", "moderate");
  const cd = input.workflowCompletionContext?.childDebrief;
  if (cd?.required && cd.status === "required_not_completed")
    add("Child debrief", "A child debrief is required but is not yet recorded.", highStakes ? "significant" : "moderate");

  // Dedupe by area+gap, then order by severity (significant first).
  const seen = new Set<string>();
  return gaps
    .filter((g) => {
      const k = `${g.area}|${g.gap}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

function buildPlanAdherenceFindings(pa: PlanAdherenceContext | undefined, f: RuleFindings, risk: RiskLevel): void {
  if (!pa) return;
  for (const c of pa.guidingDocumentChecks ?? []) {
    const docName = c.documentName ?? c.documentType.replace(/_/g, " ");
    if (c.wasFollowed === "followed") {
      f.planAdherenceFindings.push(`The ${docName} appears to have been followed.`);
    } else if (c.wasFollowed === "partially_followed") {
      f.planAdherenceFindings.push(`The ${docName} was only partially followed; management review is required.`);
    } else if (c.wasFollowed === "not_followed") {
      f.planAdherenceFindings.push(
        `The record indicates the ${docName} was not followed${c.rationaleForNotFollowing ? ` (recorded rationale: “${c.rationaleForNotFollowing}”)` : " and no rationale is recorded"}. Staff rationale is required where the agreed plan was not followed.`,
      );
      f.requiredActions.push(
        action(
          `Review adherence to the ${docName}, obtain staff rationale and update the document if it no longer reflects the child's needs.`,
          "deputy_manager",
          "5 working days",
          risk === "critical" ? "critical" : "high",
          { source: "plan_adherence" },
        ),
      );
    } else if (c.wasFollowed === "unclear") {
      f.planAdherenceFindings.push(`It is unclear whether the ${docName} was followed; this requires clarification.`);
    }
  }
  for (const doc of pa.documentsRequiringUpdate ?? []) {
    f.requiredActions.push(
      action(`Update the ${doc} to reflect learning from this event.`, "deputy_manager", "10 working days", "medium", { source: "plan_adherence" }),
    );
  }
}

function buildWorkflowFindings(input: OversightInput, f: RuleFindings, risk: RiskLevel): void {
  const wf = input.workflowCompletionContext;
  if (!wf) return;

  // Steps
  for (const s of wf.workflowSteps ?? []) {
    if (s.required && !s.completed) {
      f.workflowFindings.push(`Required workflow step “${s.stepName}” is not yet complete.`);
      f.outstandingWorkflowActions.push(
        action(`Complete the workflow step: ${s.stepName}.`, s.completedByRole ?? "shift_lead", "48 hours", risk === "low" ? "medium" : "high", { source: "workflow" }),
      );
    } else if (s.completed && s.completedLate) {
      f.workflowFindings.push(`Workflow step “${s.stepName}” was completed late.`);
    }
  }
  for (const c of wf.workflowConsistencyConcerns ?? []) {
    f.workflowFindings.push(`Consistency concern: ${c}`);
  }

  // Associated paperwork
  for (const p of wf.associatedPaperwork ?? []) {
    if (!p.required) continue;
    if (p.status === "outstanding" || p.status === "unclear") {
      f.associatedPaperworkFindings.push(`${labelPaperwork(p.paperworkType)} is ${p.status === "unclear" ? "unclear" : "outstanding"}.`);
      f.outstandingPaperwork.push(p);
      f.requiredActions.push(
        action(`Complete the ${labelPaperwork(p.paperworkType)}.`, p.completedByRole ?? "shift_lead", "48 hours", risk === "low" ? "medium" : "high", { source: "paperwork" }),
      );
    } else if (p.status === "completed_late") {
      f.associatedPaperworkFindings.push(`${labelPaperwork(p.paperworkType)} was completed late.`);
    } else if (p.status === "complete") {
      // quiet success
    }
  }

  // Staff debrief
  const sd = wf.staffDebrief;
  if (sd?.required) {
    if (sd.status === "required_completed" || sd.status === "completed_late") {
      if ((sd.practiceLearning ?? []).length) {
        f.staffDebriefFindings.push(`The staff debrief identified useful learning: ${sd.practiceLearning!.join("; ")}.`);
        f.positivePracticeFindings.push("Learning from the staff debrief should be reinforced through handover and team briefing.");
      } else {
        f.staffDebriefFindings.push("The staff debrief was completed.");
      }
      if (sd.furtherManagementActionRequired) {
        f.staffDebriefFindings.push("The staff debrief flagged that further management action is required.");
      }
    } else if (sd.status === "required_not_completed") {
      f.staffDebriefFindings.push("A staff debrief was required but is not yet evidenced. This limits learning from the event.");
      f.requiredActions.push(
        action("Complete and record a staff debrief, capturing practice learning and any support needs.", "shift_lead", "72 hours", risk === "low" ? "medium" : "high", { source: "staff_debrief" }),
      );
    }
  }

  // Child debrief
  const cd = wf.childDebrief;
  if (cd?.required) {
    if (cd.status === "required_completed" || cd.status === "completed_late") {
      if ((cd.childViews ?? []).length || (cd.childSaidHelped ?? []).length) {
        f.childDebriefFindings.push("The child's views were captured in a debrief and have informed the support plan where appropriate.");
      } else {
        f.childDebriefFindings.push("A child debrief is recorded as completed.");
      }
      for (const s of cd.childRequestedSupport ?? []) {
        f.supportRecommendations.push(action(`Respond to the support the child requested: ${s}.`, "key_worker", "1 week", "medium", { source: "child_debrief" }));
      }
    } else if (cd.status === "offered_declined") {
      f.childDebriefFindings.push("A debrief was offered and the child declined; this has been respected and recorded. A further opportunity should be offered when the child is ready.");
      f.supportRecommendations.push(action("Offer the child a further opportunity to talk when they are settled.", "key_worker", "1 week", "low", { source: "child_debrief" }));
    } else if (cd.status === "required_not_completed") {
      f.childDebriefFindings.push("A child debrief was required but is not yet evidenced. This limits management's understanding of the child's experience and whether the plan requires updating.");
      f.requiredActions.push(
        action("Offer the child a debrief sensitively when they are settled and record their views.", "key_worker", "48 hours", risk === "low" ? "medium" : "high", { source: "child_debrief" }),
      );
    }
  }

  // Key-work
  const kw = wf.keyWorkFollowUp;
  if (kw?.keyWorkRequired) {
    if (kw.keyWorkCompleted) {
      f.keyWorkFollowUpFindings.push(`Key-work follow-up was completed${kw.childVoiceCaptured ? ", capturing the child's voice and agreed actions" : ""}.`);
    } else {
      f.keyWorkFollowUpFindings.push("Key-work follow-up was required but is not yet completed.");
      f.requiredActions.push(
        action("Complete a key-work session to explore the child's views, what helped, what did not, and whether their plan needs updating.", "key_worker", "1 week", "medium", { source: "key_work" }),
      );
    }
  }

  // Action-tracker hygiene
  if (wf.actionTrackerUpdated === false) {
    f.workflowFindings.push("The action tracker has not been updated for this workflow.");
    f.requiredActions.push(action("Update the action tracker with owners, timescales and impact-review arrangements.", "deputy_manager", "48 hours", "medium", { source: "action_tracker" }));
  }
  if (wf.allActionsHaveTimescales === false) {
    f.workflowFindings.push("One or more actions do not have a recorded timescale.");
  }
  for (const a of wf.outstandingWorkflowActions ?? []) f.outstandingWorkflowActions.push(a);
}

function labelPaperwork(t: AssociatedPaperwork["paperworkType"]): string {
  return t.replace(/_/g, " ");
}

// ─── Derived statuses ──────────────────────────────────────────────────────────

export function deriveWorkflowCompletionStatus(input: OversightInput, scores: OversightScores): WorkflowCompletionStatus {
  const wf = input.workflowCompletionContext;
  if (!wf) return "not_applicable";
  if (wf.workflowStatus) return wf.workflowStatus;
  const s = scores.workflowScore;
  if (s >= 95) return "complete";
  if (s >= 80) return "mostly_complete";
  if (s >= 50) return "partially_complete";
  return "incomplete";
}

export function derivePlanAdherenceStatus(input: OversightInput, scores: OversightScores): PlanAdherenceStatus {
  const pa = input.planAdherenceContext;
  if (!pa) return "not_applicable";
  if (pa.overallPlanAdherence) return pa.overallPlanAdherence;
  const s = scores.planAdherenceScore;
  if (s >= 95) return "followed";
  if (s >= 60) return "partially_followed";
  if (s >= 40) return "unclear";
  return "not_followed";
}

export function derivePracticeConcernLevel(
  input: OversightInput,
  scores: OversightScores,
  escalation: { escalationRequired: boolean },
): PracticeConcernLevel {
  if (input.allegation || input.disclosure || input.exploitationConcern) return "safeguarding_escalation_required";
  if ((input.policyComplianceContext?.possiblePolicyFailures ?? []).length && (scores.policyComplianceScore <= 40)) {
    return "serious_policy_failure";
  }
  if (escalation.escalationRequired || scores.practiceResponseScore <= 40 || scores.planAdherenceScore <= 40) {
    return "management_review_required";
  }
  if (scores.practiceResponseScore < 80 || scores.evidenceQualityScore < 80) return "practice_development_needed";
  if (scores.evidenceQualityScore < 95) return "minor_recording_gap";
  return "none";
}

export function deriveManagementResponseStatus(input: OversightInput, scores: OversightScores): ManagementResponseStatus {
  const ma = input.managementAccountabilityContext;
  if (ma?.managementResponseStatus) return ma.managementResponseStatus;
  if (scores.workflowScore <= 20) return "senior_review_required";
  if (scores.workflowScore < 60) return "insufficient";
  if (scores.workflowScore < 80) return "partially_appropriate";
  return "appropriate";
}

export function deriveOutcome(
  input: OversightInput,
  scores: OversightScores,
  risk: RiskLevel,
  escalation: { escalationRequired: boolean },
  findings: RuleFindings,
): OversightOutcome {
  if (input.allegation || input.disclosure || input.exploitationConcern) return "senior_review_required";
  if (escalation.escalationRequired) return "requires_escalation";
  if (findings.requiredActions.length || findings.staffPracticeActions.length) return "requires_action";

  // Only weigh dimensions that actually apply to this record. A missing
  // workflow/plan/referral/policy context scores a neutral 60 ("no data"),
  // which must not, on its own, force a clarification on an otherwise clean
  // record (e.g. a fully-evidenced daily log).
  const applicable: number[] = [scores.evidenceQualityScore];
  if (input.workflowCompletionContext) applicable.push(scores.workflowScore);
  if (input.planAdherenceContext) applicable.push(scores.planAdherenceScore);
  if (input.referralContext) applicable.push(scores.referralCompletionScore);
  if (input.policyComplianceContext) applicable.push(scores.policyComplianceScore);
  const minScore = Math.min(...applicable);

  if (minScore < 80 || input.contradictoryInformation || findings.missingEvidence.length > 0) {
    return "requires_clarification";
  }
  return "satisfactory";
}

// Re-export the standalone helper under the name the escalation rule expects.
export { staffDebriefSeriousConcern };
