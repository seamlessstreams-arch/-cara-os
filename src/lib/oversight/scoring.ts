// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT ENGINE · deterministic scoring
//
// Six independent 0–100 scores derived purely from the structured input. They
// feed risk level, oversight outcome, escalation and API-call recommendation.
// 100 excellent · 80 minor gaps · 60 partial · 40 incomplete · 20 serious gap
// after high risk · 0 critical failure.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  OversightInput,
  PlanAdherenceStatus,
  AssociatedPaperwork,
  WorkflowStep,
} from "./types";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Average of a set of boolean checks → 0–100 (no checks ⇒ neutral 60). */
function boolScore(checks: boolean[]): number {
  if (checks.length === 0) return 60;
  const met = checks.filter(Boolean).length;
  return clamp((met / checks.length) * 100);
}

/** Evidence quality of the MAIN record — completeness + clarity of the core flags. */
export function evidenceQualityScore(input: OversightInput): number {
  const checks: boolean[] = [];
  const push = (v: boolean | undefined) => {
    if (v !== undefined) checks.push(!!v);
  };
  push(input.chronologyClear);
  push(input.staffActionsRecorded);
  push(input.childVoiceCaptured);
  push(input.childPresentationRecorded);
  push(input.responsiblePersonRecorded);
  push(input.timescaleRecorded);
  // Antecedents matter most for behaviour-led record types.
  if (["incident", "physical_intervention", "sanction_or_consequence"].includes(input.recordType)) {
    push(input.antecedentsIncluded);
  }
  if (input.injury || input.restraintUsed) push(input.injuriesRecordedOrRuledOut);

  let score = boolScore(checks);
  // Reviewed evidence sources lift confidence; an unreviewed source with a
  // recorded concern pulls it down.
  const sources = input.evidenceSourcesReviewed ?? [];
  if (sources.length > 0) {
    const reviewedRate = sources.filter((s) => s.reviewed).length / sources.length;
    score = clamp(score * 0.8 + reviewedRate * 20);
  }
  if (sources.some((s) => s.concern && !s.reviewed)) score = clamp(score - 10);
  if (input.lateRecording) score = clamp(score - 15);
  if (input.contradictoryInformation) score = clamp(score - 20);
  return score;
}

function stepComplete(s: WorkflowStep): boolean {
  return !s.required || s.completed;
}

function paperworkComplete(p: AssociatedPaperwork): boolean {
  if (!p.required) return true;
  return p.status === "complete" || p.status === "completed_late" || p.status === "not_required";
}

/** Whole-workflow completion: required steps, associated paperwork, debriefs, actions. */
export function workflowScore(input: OversightInput): number {
  const wf = input.workflowCompletionContext;
  if (!wf) return 60; // no workflow data ⇒ neutral
  const parts: number[] = [];

  const steps = wf.workflowSteps ?? [];
  if (steps.length) {
    const required = steps.filter((s) => s.required);
    const base = required.length ? required : steps;
    parts.push(clamp((base.filter(stepComplete).length / base.length) * 100));
    // Late completion costs some marks.
    const late = base.filter((s) => s.completed && s.completedLate).length;
    if (late) parts[parts.length - 1] = clamp(parts[parts.length - 1] - late * 5);
  }

  const paperwork = wf.associatedPaperwork ?? [];
  if (paperwork.length) {
    const required = paperwork.filter((p) => p.required);
    const base = required.length ? required : paperwork;
    let pw = clamp((base.filter(paperworkComplete).length / base.length) * 100);
    const lateP = base.filter((p) => p.status === "completed_late").length;
    if (lateP) pw = clamp(pw - lateP * 5);
    parts.push(pw);
  }

  if (wf.staffDebrief?.required) {
    parts.push(debriefScore(wf.staffDebrief.status));
  }
  if (wf.childDebrief?.required) {
    parts.push(debriefScore(wf.childDebrief.status));
  }
  if (wf.keyWorkFollowUp?.keyWorkRequired) {
    parts.push(wf.keyWorkFollowUp.keyWorkCompleted ? 100 : 30);
  }

  // Action-tracker hygiene.
  const trackerChecks: boolean[] = [];
  if (wf.actionTrackerUpdated !== undefined) trackerChecks.push(wf.actionTrackerUpdated);
  if (wf.allActionsAssigned !== undefined) trackerChecks.push(wf.allActionsAssigned);
  if (wf.allActionsHaveTimescales !== undefined) trackerChecks.push(wf.allActionsHaveTimescales);
  if (trackerChecks.length) parts.push(boolScore(trackerChecks));

  if (parts.length === 0) return 60;
  let score = clamp(parts.reduce((a, b) => a + b, 0) / parts.length);
  if ((wf.workflowConsistencyConcerns ?? []).length) score = clamp(score - 15);
  if ((wf.outstandingWorkflowActions ?? []).length) score = clamp(score - 5 * wf.outstandingWorkflowActions!.length);
  return score;
}

function debriefScore(status: string): number {
  switch (status) {
    case "required_completed":
      return 100;
    case "offered_declined":
      return 85;
    case "completed_late":
      return 70;
    case "unclear":
      return 40;
    case "required_not_completed":
      return 20;
    default:
      return 60;
  }
}

const ADHERENCE_VALUE: Record<PlanAdherenceStatus, number> = {
  followed: 100,
  partially_followed: 60,
  not_followed: 20,
  not_applicable: 100,
  unclear: 50,
};

/** Whether guiding documents (care plan, risk assessment, BSP, safety plan…) were followed. */
export function planAdherenceScore(input: OversightInput): number {
  const pa = input.planAdherenceContext;
  if (!pa) return 60;
  const checks = pa.guidingDocumentChecks ?? [];
  let score: number;
  if (checks.length) {
    score = clamp(
      checks.reduce((sum, c) => sum + ADHERENCE_VALUE[c.wasFollowed], 0) / checks.length,
    );
  } else if (pa.overallPlanAdherence) {
    score = ADHERENCE_VALUE[pa.overallPlanAdherence];
  } else {
    return 60;
  }
  if ((pa.unjustifiedDeviationsFromPlan ?? []).length) score = clamp(score - 15);
  if ((pa.planFailuresIdentified ?? []).length) score = clamp(score - 10 * pa.planFailuresIdentified!.length);
  return score;
}

/** Whether staff/management response was timely, proportionate and plan-aligned. */
export function practiceResponseScore(input: OversightInput): number {
  const pr = input.practiceResponseContext;
  if (!pr) return 60;
  const checks: boolean[] = [];
  const push = (v: boolean | undefined) => v !== undefined && checks.push(!!v);
  push(pr.staffReflectionCompleted);
  push(pr.childDebriefCompleted ?? pr.childDebriefOffered);
  push(pr.staffDebriefCompleted);
  push(pr.managerDebriefCompleted);
  if ((pr.staffActionsTaken ?? []).length) checks.push(true);
  if ((pr.immediateSafetyActionsTaken ?? []).length && (input.injury || input.restraintUsed || input.selfHarmConcern)) {
    checks.push(true);
  }
  let score = boolScore(checks);
  // Planned strategies not used without a rationale is a real practice gap.
  if ((pr.plannedStrategiesNotUsed ?? []).length && !pr.reasonStrategiesNotUsed) {
    score = clamp(score - 20);
  }
  if ((pr.plannedStrategiesUsed ?? []).length) score = clamp(score + 5);
  return score;
}

/** Whether required referrals/notifications were completed (and on time). */
export function referralCompletionScore(input: OversightInput): number {
  const refs = input.referralContext?.referralsAndNotifications ?? [];
  const required = refs.filter((r) => r.required);
  if (required.length === 0) return 100; // nothing required ⇒ complete
  const completed = required.filter((r) => r.completed).length;
  let score = clamp((completed / required.length) * 100);
  const late = (input.referralContext?.referralsCompletedLate ?? []).length;
  if (late) score = clamp(score - 10 * late);
  if ((input.referralContext?.referralsRequiredButNotCompleted ?? []).length) {
    score = clamp(score - 25);
  }
  return score;
}

/** Whether policy steps were followed and evidenced. */
export function policyComplianceScore(input: OversightInput): number {
  const pc = input.policyComplianceContext;
  if (!pc) return 60;
  const followed = (pc.policyStepsFollowed ?? []).length;
  const notFollowed = (pc.policyStepsNotFollowed ?? []).length;
  const total = followed + notFollowed;
  let score = total ? clamp((followed / total) * 100) : 60;
  if ((pc.possiblePolicyFailures ?? []).length) score = clamp(score - 25);
  if (pc.requiresSeniorLeadershipReview) score = clamp(score - 15);
  return score;
}

export interface OversightScores {
  evidenceQualityScore: number;
  workflowScore: number;
  planAdherenceScore: number;
  practiceResponseScore: number;
  referralCompletionScore: number;
  policyComplianceScore: number;
}

export function computeScores(input: OversightInput): OversightScores {
  return {
    evidenceQualityScore: evidenceQualityScore(input),
    workflowScore: workflowScore(input),
    planAdherenceScore: planAdherenceScore(input),
    practiceResponseScore: practiceResponseScore(input),
    referralCompletionScore: referralCompletionScore(input),
    policyComplianceScore: policyComplianceScore(input),
  };
}
