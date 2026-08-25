import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Transition Readiness Intelligence Engine
//
// Evaluates transition/move preparation quality, key worker handovers,
// child readiness assessment, placement continuity, and support planning.
//
// Regulatory basis:
//   - CHR 2015 Reg 36 (leaving a children's home / transition)
//   - CHR 2015 Reg 14 (care planning standard)
//   - CA 1989 s22C (general duty of local authority in relation to placement)
//   - SCCIF — transition planning and preparation for adulthood
//   - UNCRC Article 12 (child participation in decisions)
//   - NICE CG28 (depression in children — transitions as risk factor)
//
// Pure deterministic engine — no AI, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Definitions ─────────────────────────────────────────────────────────

export type TransitionType =
  | "placement_move"
  | "step_down"
  | "step_up"
  | "return_home"
  | "foster_care"
  | "semi_independent"
  | "independent_living"
  | "adult_services"
  | "education_transition"
  | "emergency_move";

export type TransitionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "emergency";

export type ReadinessLevel =
  | "fully_ready"
  | "mostly_ready"
  | "partially_ready"
  | "not_ready"
  | "not_assessed";

export type HandoverQuality =
  | "comprehensive"
  | "adequate"
  | "basic"
  | "incomplete"
  | "not_completed";

export type SupportPlanStatus =
  | "in_place"
  | "in_development"
  | "not_started"
  | "not_required";

export type ChildFeelingAboutMove =
  | "positive"
  | "mixed"
  | "anxious"
  | "resistant"
  | "not_recorded";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface TransitionPlan {
  id: string;
  childId: string;
  childName: string;
  transitionType: TransitionType;
  status: TransitionStatus;
  plannedDate: string;
  actualDate?: string;
  receivingPlacementIdentified: boolean;
  visitToNewPlacementCompleted: boolean;
  introductoryVisitsCount: number;
  childInvolvedInPlanning: boolean;
  childViewsRecorded: boolean;
  childFeelingAboutMove: ChildFeelingAboutMove;
  parentCarerInvolved: boolean;
  socialWorkerInvolved: boolean;
  riskAssessmentUpdated: boolean;
  healthInfoTransferred: boolean;
  educationInfoTransferred: boolean;
  personalBelongingsArranged: boolean;
  lifeStoryWorkUpToDate: boolean;
  memoryBoxPrepared: boolean;
  goodbyesCelebrated: boolean;
}

export interface HandoverRecord {
  id: string;
  childId: string;
  transitionId: string;
  handoverDate: string;
  sendingKeyWorker: string;
  receivingKeyWorker?: string;
  quality: HandoverQuality;
  allDocumentsTransferred: boolean;
  carePlanShared: boolean;
  riskAssessmentShared: boolean;
  healthPassportShared: boolean;
  educationRecordsShared: boolean;
  personalHistoryShared: boolean;
  allergiesHighlighted: boolean;
  medicationInfoTransferred: boolean;
  keyRelationshipsDocumented: boolean;
  childPreferencesShared: boolean;
  triggersAndStrategiesShared: boolean;
}

export interface ReadinessAssessment {
  id: string;
  childId: string;
  transitionId: string;
  assessedDate: string;
  assessedBy: string;
  overallReadiness: ReadinessLevel;
  emotionalReadiness: ReadinessLevel;
  practicalReadiness: ReadinessLevel;
  socialReadiness: ReadinessLevel;
  educationalReadiness: ReadinessLevel;
  supportPlanStatus: SupportPlanStatus;
  contingencyPlanInPlace: boolean;
  professionalNetworkBriefed: boolean;
  familyNetworkBriefed: boolean;
}

export interface PostTransitionSupport {
  id: string;
  childId: string;
  transitionId: string;
  followUpVisitCompleted: boolean;
  followUpVisitDate?: string;
  followUpWithin7Days: boolean;
  settlingInReviewCompleted: boolean;
  previousKeyWorkerContactMaintained: boolean;
  feedbackFromChild: boolean;
  feedbackFromNewPlacement: boolean;
  issuesIdentified: number;
  issuesResolved: number;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface TransitionPlanningResult {
  overallScore: number; // 0-30
  totalTransitions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  plannedTransitionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childInvolvementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  parentInvolvementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  visitCompletedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  infoTransferRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  goodbyesCelebratedRate: number | null;
}

export interface HandoverResult {
  overallScore: number; // 0-25
  totalHandovers: number;
  /** null when the population is empty — nothing measured, not 0%. */
  comprehensiveRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  documentTransferRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  carePlanSharedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  healthInfoRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  triggersSharedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childPreferencesRate: number | null;
}

export interface ReadinessResult {
  overallScore: number; // 0-25
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  fullyReadyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supportPlanRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  contingencyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  professionalBriefedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  emotionalReadinessGoodRate: number | null;
}

export interface PostTransitionResult {
  overallScore: number; // 0-20
  totalFollowUps: number;
  /** null when the population is empty — nothing measured, not 0%. */
  followUpCompletedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  within7DaysRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  settlingInReviewRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  previousKeyWorkerContactRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childFeedbackRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  issueResolutionRate: number | null;
}

export interface ChildTransitionProfile {
  childId: string;
  childName: string;
  transitionType: TransitionType;
  status: TransitionStatus;
  readinessLevel: ReadinessLevel;
  handoverQuality: HandoverQuality;
  childFeeling: ChildFeelingAboutMove;
  followUpCompleted: boolean;
  overallScore: number; // 0-10
}

export interface TransitionReadinessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  transitionPlanning: TransitionPlanningResult;
  handover: HandoverResult;
  readiness: ReadinessResult;
  postTransition: PostTransitionResult;
  childProfiles: ChildTransitionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Functions ──────────────────────────────────────────────────────────

const TRANSITION_TYPE_LABELS: Record<TransitionType, string> = {
  placement_move: "Placement Move",
  step_down: "Step Down",
  step_up: "Step Up",
  return_home: "Return Home",
  foster_care: "Foster Care",
  semi_independent: "Semi-Independent",
  independent_living: "Independent Living",
  adult_services: "Adult Services",
  education_transition: "Education Transition",
  emergency_move: "Emergency Move",
};

const TRANSITION_STATUS_LABELS: Record<TransitionStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  emergency: "Emergency",
};

const READINESS_LEVEL_LABELS: Record<ReadinessLevel, string> = {
  fully_ready: "Fully Ready",
  mostly_ready: "Mostly Ready",
  partially_ready: "Partially Ready",
  not_ready: "Not Ready",
  not_assessed: "Not Assessed",
};

const HANDOVER_QUALITY_LABELS: Record<HandoverQuality, string> = {
  comprehensive: "Comprehensive",
  adequate: "Adequate",
  basic: "Basic",
  incomplete: "Incomplete",
  not_completed: "Not Completed",
};

const SUPPORT_PLAN_STATUS_LABELS: Record<SupportPlanStatus, string> = {
  in_place: "In Place",
  in_development: "In Development",
  not_started: "Not Started",
  not_required: "Not Required",
};

const CHILD_FEELING_LABELS: Record<ChildFeelingAboutMove, string> = {
  positive: "Positive",
  mixed: "Mixed",
  anxious: "Anxious",
  resistant: "Resistant",
  not_recorded: "Not Recorded",
};

export function getTransitionTypeLabel(t: TransitionType): string {
  return TRANSITION_TYPE_LABELS[t] ?? t;
}

export function getTransitionStatusLabel(s: TransitionStatus): string {
  return TRANSITION_STATUS_LABELS[s] ?? s;
}

export function getReadinessLevelLabel(l: ReadinessLevel): string {
  return READINESS_LEVEL_LABELS[l] ?? l;
}

export function getHandoverQualityLabel(q: HandoverQuality): string {
  return HANDOVER_QUALITY_LABELS[q] ?? q;
}

export function getSupportPlanStatusLabel(s: SupportPlanStatus): string {
  return SUPPORT_PLAN_STATUS_LABELS[s] ?? s;
}

export function getChildFeelingLabel(f: ChildFeelingAboutMove): string {
  return CHILD_FEELING_LABELS[f] ?? f;
}

// ── Utility ──────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluation Functions ─────────────────────────────────────────────────────

export function evaluateTransitionPlanning(
  plans: TransitionPlan[],
): TransitionPlanningResult {
  if (plans.length === 0) {
    return {
      overallScore: 30,
      totalTransitions: 0,
      plannedTransitionRate: 100,
      childInvolvementRate: 100,
      childViewsRate: 100,
      parentInvolvementRate: 100,
      visitCompletedRate: 100,
      riskAssessmentRate: 100,
      infoTransferRate: 100,
      goodbyesCelebratedRate: 100,
    };
  }

  let score = 0;
  const total = plans.length;

  // Planned transition rate (not emergency)
  const planned = plans.filter(
    (p) => p.status !== "emergency",
  ).length;
  const plannedTransitionRate = rate(planned, total);
  if (meets(plannedTransitionRate, 90)) score += 5;
  else if (meets(plannedTransitionRate, 70)) score += 3;

  // Child involvement
  const childInvolved = plans.filter(
    (p) => p.childInvolvedInPlanning,
  ).length;
  const childInvolvementRate = rate(childInvolved, total);
  if (meets(childInvolvementRate, 90)) score += 5;
  else if (meets(childInvolvementRate, 70)) score += 3;

  // Child views recorded
  const viewsRecorded = plans.filter(
    (p) => p.childViewsRecorded,
  ).length;
  const childViewsRate = rate(viewsRecorded, total);
  if (meets(childViewsRate, 90)) score += 4;
  else if (meets(childViewsRate, 70)) score += 2;

  // Parent/carer involvement
  const parentInvolved = plans.filter(
    (p) => p.parentCarerInvolved,
  ).length;
  const parentInvolvementRate = rate(parentInvolved, total);
  if (meets(parentInvolvementRate, 80)) score += 3;
  else if (meets(parentInvolvementRate, 60)) score += 2;

  // Visit to new placement
  const visitCompleted = plans.filter(
    (p) => p.visitToNewPlacementCompleted,
  ).length;
  const visitCompletedRate = rate(visitCompleted, total);
  if (meets(visitCompletedRate, 80)) score += 3;
  else if (meets(visitCompletedRate, 60)) score += 2;

  // Risk assessment updated
  const riskUpdated = plans.filter(
    (p) => p.riskAssessmentUpdated,
  ).length;
  const riskAssessmentRate = rate(riskUpdated, total);
  if (meets(riskAssessmentRate, 90)) score += 3;
  else if (meets(riskAssessmentRate, 70)) score += 2;

  // Info transfer (health + education)
  const healthTransferred = plans.filter(
    (p) => p.healthInfoTransferred,
  ).length;
  const eduTransferred = plans.filter(
    (p) => p.educationInfoTransferred,
  ).length;
  const infoTransferRate = rate(
    healthTransferred + eduTransferred,
    total * 2,
  );
  if (meets(infoTransferRate, 90)) score += 4;
  else if (meets(infoTransferRate, 70)) score += 2;

  // Goodbyes celebrated
  const goodbyes = plans.filter(
    (p) => p.goodbyesCelebrated,
  ).length;
  const goodbyesCelebratedRate = rate(goodbyes, total);
  if (meets(goodbyesCelebratedRate, 80)) score += 3;
  else if (meets(goodbyesCelebratedRate, 50)) score += 1;

  return {
    overallScore: Math.min(score, 30),
    totalTransitions: total,
    plannedTransitionRate,
    childInvolvementRate,
    childViewsRate,
    parentInvolvementRate,
    visitCompletedRate,
    riskAssessmentRate,
    infoTransferRate,
    goodbyesCelebratedRate,
  };
}

export function evaluateHandover(
  handovers: HandoverRecord[],
): HandoverResult {
  if (handovers.length === 0) {
    return {
      overallScore: 25,
      totalHandovers: 0,
      comprehensiveRate: 100,
      documentTransferRate: 100,
      carePlanSharedRate: 100,
      healthInfoRate: 100,
      triggersSharedRate: 100,
      childPreferencesRate: 100,
    };
  }

  let score = 0;
  const total = handovers.length;

  const comprehensive = handovers.filter(
    (h) => h.quality === "comprehensive" || h.quality === "adequate",
  ).length;
  const comprehensiveRate = rate(comprehensive, total);
  if (meets(comprehensiveRate, 90)) score += 6;
  else if (meets(comprehensiveRate, 70)) score += 4;
  else if (meets(comprehensiveRate, 50)) score += 2;

  const docsTransferred = handovers.filter(
    (h) => h.allDocumentsTransferred,
  ).length;
  const documentTransferRate = rate(docsTransferred, total);
  if (meets(documentTransferRate, 90)) score += 4;
  else if (meets(documentTransferRate, 70)) score += 2;

  const carePlan = handovers.filter((h) => h.carePlanShared).length;
  const carePlanSharedRate = rate(carePlan, total);
  if (meets(carePlanSharedRate, 95)) score += 4;
  else if (meets(carePlanSharedRate, 80)) score += 2;

  const healthInfo = handovers.filter(
    (h) => h.healthPassportShared && h.medicationInfoTransferred,
  ).length;
  const healthInfoRate = rate(healthInfo, total);
  if (meets(healthInfoRate, 90)) score += 4;
  else if (meets(healthInfoRate, 70)) score += 2;

  const triggers = handovers.filter(
    (h) => h.triggersAndStrategiesShared,
  ).length;
  const triggersSharedRate = rate(triggers, total);
  if (meets(triggersSharedRate, 90)) score += 4;
  else if (meets(triggersSharedRate, 70)) score += 2;

  const prefs = handovers.filter(
    (h) => h.childPreferencesShared,
  ).length;
  const childPreferencesRate = rate(prefs, total);
  if (meets(childPreferencesRate, 90)) score += 3;
  else if (meets(childPreferencesRate, 70)) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalHandovers: total,
    comprehensiveRate,
    documentTransferRate,
    carePlanSharedRate,
    healthInfoRate,
    triggersSharedRate,
    childPreferencesRate,
  };
}

export function evaluateReadiness(
  assessments: ReadinessAssessment[],
): ReadinessResult {
  if (assessments.length === 0) {
    return {
      overallScore: 25,
      totalAssessments: 0,
      fullyReadyRate: 100,
      supportPlanRate: 100,
      contingencyRate: 100,
      professionalBriefedRate: 100,
      emotionalReadinessGoodRate: 100,
    };
  }

  let score = 0;
  const total = assessments.length;

  const fullyReady = assessments.filter(
    (a) =>
      a.overallReadiness === "fully_ready" ||
      a.overallReadiness === "mostly_ready",
  ).length;
  const fullyReadyRate = rate(fullyReady, total);
  if (meets(fullyReadyRate, 80)) score += 6;
  else if (meets(fullyReadyRate, 60)) score += 4;
  else if (meets(fullyReadyRate, 40)) score += 2;

  const supportPlan = assessments.filter(
    (a) =>
      a.supportPlanStatus === "in_place" ||
      a.supportPlanStatus === "not_required",
  ).length;
  const supportPlanRate = rate(supportPlan, total);
  if (meets(supportPlanRate, 90)) score += 5;
  else if (meets(supportPlanRate, 70)) score += 3;

  const contingency = assessments.filter(
    (a) => a.contingencyPlanInPlace,
  ).length;
  const contingencyRate = rate(contingency, total);
  if (meets(contingencyRate, 90)) score += 4;
  else if (meets(contingencyRate, 70)) score += 2;

  const profBriefed = assessments.filter(
    (a) => a.professionalNetworkBriefed,
  ).length;
  const professionalBriefedRate = rate(profBriefed, total);
  if (meets(professionalBriefedRate, 90)) score += 5;
  else if (meets(professionalBriefedRate, 70)) score += 3;

  const emotionalGood = assessments.filter(
    (a) =>
      a.emotionalReadiness === "fully_ready" ||
      a.emotionalReadiness === "mostly_ready",
  ).length;
  const emotionalReadinessGoodRate = rate(emotionalGood, total);
  if (meets(emotionalReadinessGoodRate, 80)) score += 5;
  else if (meets(emotionalReadinessGoodRate, 60)) score += 3;
  else if (meets(emotionalReadinessGoodRate, 40)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalAssessments: total,
    fullyReadyRate,
    supportPlanRate,
    contingencyRate,
    professionalBriefedRate,
    emotionalReadinessGoodRate,
  };
}

export function evaluatePostTransition(
  supports: PostTransitionSupport[],
): PostTransitionResult {
  if (supports.length === 0) {
    return {
      overallScore: 20,
      totalFollowUps: 0,
      followUpCompletedRate: 100,
      within7DaysRate: 100,
      settlingInReviewRate: 100,
      previousKeyWorkerContactRate: 100,
      childFeedbackRate: 100,
      issueResolutionRate: 100,
    };
  }

  let score = 0;
  const total = supports.length;

  const followUpDone = supports.filter(
    (s) => s.followUpVisitCompleted,
  ).length;
  const followUpCompletedRate = rate(followUpDone, total);
  if (meets(followUpCompletedRate, 90)) score += 5;
  else if (meets(followUpCompletedRate, 70)) score += 3;

  const within7 = supports.filter(
    (s) => s.followUpWithin7Days,
  ).length;
  const within7DaysRate = rate(within7, total);
  if (meets(within7DaysRate, 90)) score += 4;
  else if (meets(within7DaysRate, 70)) score += 2;

  const settlingIn = supports.filter(
    (s) => s.settlingInReviewCompleted,
  ).length;
  const settlingInReviewRate = rate(settlingIn, total);
  if (meets(settlingInReviewRate, 90)) score += 3;
  else if (meets(settlingInReviewRate, 70)) score += 2;

  const keyWorkerContact = supports.filter(
    (s) => s.previousKeyWorkerContactMaintained,
  ).length;
  const previousKeyWorkerContactRate = rate(keyWorkerContact, total);
  if (meets(previousKeyWorkerContactRate, 80)) score += 3;
  else if (meets(previousKeyWorkerContactRate, 60)) score += 2;

  const childFeedback = supports.filter(
    (s) => s.feedbackFromChild,
  ).length;
  const childFeedbackRate = rate(childFeedback, total);
  if (meets(childFeedbackRate, 90)) score += 3;
  else if (meets(childFeedbackRate, 70)) score += 2;

  const totalIssues = supports.reduce(
    (s, p) => s + p.issuesIdentified,
    0,
  );
  const totalResolved = supports.reduce(
    (s, p) => s + p.issuesResolved,
    0,
  );
  const issueResolutionRate = rate(totalResolved, totalIssues);
  if (totalIssues === 0 || meets(issueResolutionRate, 90)) score += 2;
  else if (meets(issueResolutionRate, 70)) score += 1;

  return {
    overallScore: Math.min(score, 20),
    totalFollowUps: total,
    followUpCompletedRate,
    within7DaysRate,
    settlingInReviewRate,
    previousKeyWorkerContactRate,
    childFeedbackRate,
    issueResolutionRate,
  };
}

// ── Child Profiles ───────────────────────────────────────────────────────────

export function buildChildTransitionProfiles(
  plans: TransitionPlan[],
  handovers: HandoverRecord[],
  assessments: ReadinessAssessment[],
  supports: PostTransitionSupport[],
): ChildTransitionProfile[] {
  return plans.map((plan) => {
    const handover = handovers.find((h) => h.transitionId === plan.id);
    const assessment = assessments.find(
      (a) => a.transitionId === plan.id,
    );
    const support = supports.find(
      (s) => s.transitionId === plan.id,
    );

    let profileScore = 3;
    if (plan.childInvolvedInPlanning) profileScore += 1;
    if (plan.childViewsRecorded) profileScore += 1;
    if (handover && (handover.quality === "comprehensive" || handover.quality === "adequate"))
      profileScore += 1;
    if (assessment && (assessment.overallReadiness === "fully_ready" || assessment.overallReadiness === "mostly_ready"))
      profileScore += 1;
    if (support && support.followUpVisitCompleted) profileScore += 1;
    if (plan.goodbyesCelebrated) profileScore += 1;
    if (plan.riskAssessmentUpdated && plan.healthInfoTransferred) profileScore += 1;
    // Penalties
    if (plan.status === "emergency") profileScore -= 2;
    if (plan.childFeelingAboutMove === "resistant" && !plan.childViewsRecorded)
      profileScore -= 1;

    return {
      childId: plan.childId,
      childName: plan.childName,
      transitionType: plan.transitionType,
      status: plan.status,
      readinessLevel: assessment?.overallReadiness ?? "not_assessed",
      handoverQuality: handover?.quality ?? "not_completed",
      childFeeling: plan.childFeelingAboutMove,
      followUpCompleted: support?.followUpVisitCompleted ?? false,
      overallScore: Math.max(0, Math.min(profileScore, 10)),
    };
  });
}

// ── Strengths / Areas / Actions ──────────────────────────────────────────────

function generateStrengths(
  tp: TransitionPlanningResult,
  ho: HandoverResult,
  rd: ReadinessResult,
  pt: PostTransitionResult,
): string[] {
  const strengths: string[] = [];

  if (tp.totalTransitions === 0) {
    strengths.push("No transitions in period — placement stability maintained");
  }

  if (meets(tp.childInvolvementRate, 90) && tp.totalTransitions > 0) {
    strengths.push("Excellent child participation — children involved in all transition planning");
  }

  if (meets(tp.childViewsRate, 90) && tp.totalTransitions > 0) {
    strengths.push("Child views consistently recorded in transition planning — strong UNCRC Art 12 compliance");
  }

  if (meets(tp.goodbyesCelebratedRate, 80) && tp.totalTransitions > 0) {
    strengths.push("Goodbyes and celebrations arranged — showing emotional sensitivity in transitions");
  }

  if (meets(ho.comprehensiveRate, 90) && ho.totalHandovers > 0) {
    strengths.push("Comprehensive handovers completed — ensuring continuity of care");
  }

  if (meets(ho.triggersSharedRate, 90) && ho.totalHandovers > 0) {
    strengths.push("Triggers and strategies consistently shared — protecting child safety through transitions");
  }

  if (meets(rd.fullyReadyRate, 80) && rd.totalAssessments > 0) {
    strengths.push("Strong readiness assessment practice — children well-prepared for transitions");
  }

  if (meets(pt.followUpCompletedRate, 90) && pt.totalFollowUps > 0) {
    strengths.push("Excellent post-transition follow-up — maintaining care beyond placement");
  }

  if (meets(pt.previousKeyWorkerContactRate, 80) && pt.totalFollowUps > 0) {
    strengths.push("Key worker relationships maintained after transition — supporting emotional continuity");
  }

  return strengths;
}

function generateAreasForImprovement(
  tp: TransitionPlanningResult,
  ho: HandoverResult,
  rd: ReadinessResult,
  pt: PostTransitionResult,
): string[] {
  const areas: string[] = [];

  if (below(tp.childInvolvementRate, 80) && tp.totalTransitions > 0) {
    areas.push(`Child involvement in transition planning at ${tp.childInvolvementRate}% — all children should participate`);
  }

  if (below(tp.visitCompletedRate, 70) && tp.totalTransitions > 0) {
    areas.push(`Only ${tp.visitCompletedRate}% of children visited new placements before moving`);
  }

  if (below(tp.plannedTransitionRate, 80) && tp.totalTransitions > 0) {
    areas.push(`${100 - tp.plannedTransitionRate!}% of transitions were emergency moves — planned transitions should be the norm`);
  }

  if (below(ho.comprehensiveRate, 80) && ho.totalHandovers > 0) {
    areas.push(`Only ${ho.comprehensiveRate}% of handovers rated comprehensive or adequate`);
  }

  if (below(ho.triggersSharedRate, 80) && ho.totalHandovers > 0) {
    areas.push(`Triggers and strategies shared in only ${ho.triggersSharedRate}% of handovers — critical safety information`);
  }

  if (below(rd.fullyReadyRate, 60) && rd.totalAssessments > 0) {
    areas.push(`Only ${rd.fullyReadyRate}% of children assessed as fully or mostly ready for transition`);
  }

  if (below(rd.contingencyRate, 80) && rd.totalAssessments > 0) {
    areas.push(`Contingency plans in place for only ${rd.contingencyRate}% of transitions`);
  }

  if (below(pt.followUpCompletedRate, 80) && pt.totalFollowUps > 0) {
    areas.push(`Post-transition follow-up completed for only ${pt.followUpCompletedRate}% of transitions`);
  }

  if (below(pt.childFeedbackRate, 80) && pt.totalFollowUps > 0) {
    areas.push(`Child feedback obtained in only ${pt.childFeedbackRate}% of transitions`);
  }

  return areas;
}

function generateActions(
  tp: TransitionPlanningResult,
  ho: HandoverResult,
  rd: ReadinessResult,
  pt: PostTransitionResult,
): string[] {
  const actions: string[] = [];

  if (below(tp.plannedTransitionRate, 70) && tp.totalTransitions > 0) {
    actions.push("URGENT: Reduce emergency moves — implement advance transition planning for all anticipated moves");
  }

  if (below(tp.childViewsRate, 80) && tp.totalTransitions > 0) {
    actions.push("Ensure child views are recorded for every transition — use age-appropriate tools where needed");
  }

  if (below(tp.riskAssessmentRate, 90) && tp.totalTransitions > 0) {
    actions.push("Update risk assessments for all transitions — receiving placements need current risk information");
  }

  if (below(ho.triggersSharedRate, 90) && ho.totalHandovers > 0) {
    actions.push("Include triggers and de-escalation strategies in every handover — critical for child safety");
  }

  if (below(ho.healthInfoRate, 90) && ho.totalHandovers > 0) {
    actions.push("Ensure health passports and medication information transferred for every transition");
  }

  if (below(rd.supportPlanRate, 80) && rd.totalAssessments > 0) {
    actions.push("Develop transition support plans for all children — identify needs before the move");
  }

  if (below(pt.within7DaysRate, 80) && pt.totalFollowUps > 0) {
    actions.push("Complete follow-up visits within 7 days of transition — early identification of settling-in issues");
  }

  if (below(tp.goodbyesCelebratedRate, 50) && tp.totalTransitions > 0) {
    actions.push("Celebrate goodbyes for every planned transition — therapeutic significance of endings");
  }

  return actions;
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateTransitionReadinessIntelligence(
  plans: TransitionPlan[],
  handovers: HandoverRecord[],
  assessments: ReadinessAssessment[],
  supports: PostTransitionSupport[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): TransitionReadinessIntelligence {
  const tpResult = evaluateTransitionPlanning(plans);
  const hoResult = evaluateHandover(handovers);
  const rdResult = evaluateReadiness(assessments);
  const ptResult = evaluatePostTransition(supports);

  const overallScore =
    tpResult.overallScore +
    hoResult.overallScore +
    rdResult.overallScore +
    ptResult.overallScore;

  const childProfiles = buildChildTransitionProfiles(
    plans,
    handovers,
    assessments,
    supports,
  );

  const strengths = generateStrengths(tpResult, hoResult, rdResult, ptResult);
  const areasForImprovement = generateAreasForImprovement(tpResult, hoResult, rdResult, ptResult);
  const actions = generateActions(tpResult, hoResult, rdResult, ptResult);

  const regulatoryLinks = [
    "CHR 2015 Reg 36 — leaving a children's home, transition planning requirements",
    "CHR 2015 Reg 14 — care planning standard, including transition as part of care plan",
    "CA 1989 s22C — general duty regarding placement decisions and transitions",
    "SCCIF — inspection of transition planning and preparation for independence",
    "UNCRC Article 12 — child participation in decisions affecting them, including moves",
    "NICE CG28 — transitions as risk factor for depression in children",
    "NMS 5 — meeting individual needs through careful transition planning",
    "Working Together 2023 — multi-agency approach to transition support",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore: Math.min(overallScore, 100),
    rating: getRating(overallScore),
    transitionPlanning: tpResult,
    handover: hoResult,
    readiness: rdResult,
    postTransition: ptResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
