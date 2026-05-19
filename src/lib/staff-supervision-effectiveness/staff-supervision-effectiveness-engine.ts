// Staff Supervision Effectiveness Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type SupervisionType =
  | "formal_one_to_one"
  | "group_supervision"
  | "reflective_practice"
  | "case_discussion"
  | "clinical_supervision"
  | "ad_hoc_support"
  | "peer_supervision"
  | "management_supervision";

export type SupervisionOutcome =
  | "very_effective"
  | "effective"
  | "partially_effective"
  | "ineffective"
  | "not_attended";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const SUPERVISION_TYPE_LABELS: Record<SupervisionType, string> = {
  formal_one_to_one: "Formal One-to-One",
  group_supervision: "Group Supervision",
  reflective_practice: "Reflective Practice",
  case_discussion: "Case Discussion",
  clinical_supervision: "Clinical Supervision",
  ad_hoc_support: "Ad Hoc Support",
  peer_supervision: "Peer Supervision",
  management_supervision: "Management Supervision",
};

const SUPERVISION_OUTCOME_LABELS: Record<SupervisionOutcome, string> = {
  very_effective: "Very Effective",
  effective: "Effective",
  partially_effective: "Partially Effective",
  ineffective: "Ineffective",
  not_attended: "Not Attended",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSupervisionTypeLabel(v: SupervisionType): string { return SUPERVISION_TYPE_LABELS[v]; }
export function getSupervisionOutcomeLabel(v: SupervisionOutcome): string { return SUPERVISION_OUTCOME_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface SupervisionSession {
  id: string;
  staffId: string;
  staffName: string;
  supervisorId: string;
  supervisorName: string;
  sessionDate: string;
  supervisionType: SupervisionType;
  supervisionOutcome: SupervisionOutcome;
  safeguardingDiscussed: boolean;
  wellbeingChecked: boolean;
  actionPointsSet: boolean;
  previousActionsReviewed: boolean;
  documentedInRecord: boolean;
  staffSatisfied: boolean;
}

export interface SupervisionPolicy {
  id: string;
  supervisionFramework: boolean;
  frequencyStandards: boolean;
  safeguardingRequirement: boolean;
  reflectivePracticeModel: boolean;
  documentationStandards: boolean;
  escalationProcedure: boolean;
  regularReview: boolean;
}

export interface SupervisorTraining {
  id: string;
  staffId: string;
  staffName: string;
  supervisionSkills: boolean;
  reflectivePractice: boolean;
  safeguardingOversight: boolean;
  performanceManagement: boolean;
  wellbeingSupport: boolean;
  documentationSkills: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface SessionEffectivenessResult {
  overallScore: number;
  totalSessions: number;
  effectivenessRate: number;
  safeguardingRate: number;
  wellbeingRate: number;
  actionPointsRate: number;
}

export interface SupervisionComplianceResult {
  overallScore: number;
  previousActionsReviewedRate: number;
  documentedRate: number;
  staffSatisfactionRate: number;
  typeDiversityRatio: number;
}

export interface SupervisionPolicyResult {
  overallScore: number;
  supervisionFramework: boolean;
  frequencyStandards: boolean;
  safeguardingRequirement: boolean;
  reflectivePracticeModel: boolean;
  documentationStandards: boolean;
  escalationProcedure: boolean;
  regularReview: boolean;
}

export interface SupervisorReadinessResult {
  overallScore: number;
  totalSupervisors: number;
  supervisionSkillsRate: number;
  reflectivePracticeRate: number;
  safeguardingOversightRate: number;
  performanceManagementRate: number;
  wellbeingSupportRate: number;
  documentationRate: number;
}

export interface StaffSupervisionProfile {
  staffId: string;
  staffName: string;
  totalSessions: number;
  effectivenessRate: number;
  safeguardingRate: number;
  overallScore: number;
}

export interface StaffSupervisionEffectivenessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sessionEffectiveness: SessionEffectivenessResult;
  supervisionCompliance: SupervisionComplianceResult;
  supervisionPolicy: SupervisionPolicyResult;
  supervisorReadiness: SupervisorReadinessResult;
  staffProfiles: StaffSupervisionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluators ───────────────────────────────────────────────────────────────

export function evaluateSessionEffectiveness(sessions: SupervisionSession[]): SessionEffectivenessResult {
  if (sessions.length === 0) {
    return { overallScore: 0, totalSessions: 0, effectivenessRate: 0, safeguardingRate: 0, wellbeingRate: 0, actionPointsRate: 0 };
  }

  const total = sessions.length;
  const effectiveCount = sessions.filter((s) => s.supervisionOutcome === "very_effective" || s.supervisionOutcome === "effective").length;
  const safeguardingCount = sessions.filter((s) => s.safeguardingDiscussed).length;
  const wellbeingCount = sessions.filter((s) => s.wellbeingChecked).length;
  const actionCount = sessions.filter((s) => s.actionPointsSet).length;

  const effectivenessRate = pct(effectiveCount, total);
  const safeguardingRate = pct(safeguardingCount, total);
  const wellbeingRate = pct(wellbeingCount, total);
  const actionPointsRate = pct(actionCount, total);

  const effScore = Math.round((effectivenessRate / 100) * 7);
  const safScore = Math.round((safeguardingRate / 100) * 6);
  const wellScore = Math.round((wellbeingRate / 100) * 6);
  const actScore = Math.round((actionPointsRate / 100) * 6);

  const overallScore = Math.min(25, effScore + safScore + wellScore + actScore);

  return { overallScore, totalSessions: total, effectivenessRate, safeguardingRate, wellbeingRate, actionPointsRate };
}

export function evaluateSupervisionCompliance(sessions: SupervisionSession[]): SupervisionComplianceResult {
  if (sessions.length === 0) {
    return { overallScore: 0, previousActionsReviewedRate: 0, documentedRate: 0, staffSatisfactionRate: 0, typeDiversityRatio: 0 };
  }

  const total = sessions.length;
  const reviewedCount = sessions.filter((s) => s.previousActionsReviewed).length;
  const documentedCount = sessions.filter((s) => s.documentedInRecord).length;
  const satisfiedCount = sessions.filter((s) => s.staffSatisfied).length;
  const uniqueTypes = new Set(sessions.map((s) => s.supervisionType)).size;
  const diversityRatio = pct(uniqueTypes, 8);

  const previousActionsReviewedRate = pct(reviewedCount, total);
  const documentedRate = pct(documentedCount, total);
  const staffSatisfactionRate = pct(satisfiedCount, total);

  const revScore = Math.round((previousActionsReviewedRate / 100) * 8);
  const docScore = Math.round((documentedRate / 100) * 7);
  const satScore = Math.round((staffSatisfactionRate / 100) * 5);
  const divScore = Math.round((diversityRatio / 100) * 5);

  const overallScore = Math.min(25, revScore + docScore + satScore + divScore);

  return { overallScore, previousActionsReviewedRate, documentedRate, staffSatisfactionRate, typeDiversityRatio: diversityRatio };
}

export function evaluateSupervisionPolicy(policy: SupervisionPolicy | null): SupervisionPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      supervisionFramework: false,
      frequencyStandards: false,
      safeguardingRequirement: false,
      reflectivePracticeModel: false,
      documentationStandards: false,
      escalationProcedure: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.supervisionFramework) score += 4;
  if (policy.frequencyStandards) score += 4;
  if (policy.safeguardingRequirement) score += 4;
  if (policy.reflectivePracticeModel) score += 4;
  if (policy.documentationStandards) score += 3;
  if (policy.escalationProcedure) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    supervisionFramework: policy.supervisionFramework,
    frequencyStandards: policy.frequencyStandards,
    safeguardingRequirement: policy.safeguardingRequirement,
    reflectivePracticeModel: policy.reflectivePracticeModel,
    documentationStandards: policy.documentationStandards,
    escalationProcedure: policy.escalationProcedure,
    regularReview: policy.regularReview,
  };
}

export function evaluateSupervisorReadiness(training: SupervisorTraining[]): SupervisorReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalSupervisors: 0, supervisionSkillsRate: 0, reflectivePracticeRate: 0, safeguardingOversightRate: 0, performanceManagementRate: 0, wellbeingSupportRate: 0, documentationRate: 0 };
  }

  const total = training.length;
  const skillsCount = training.filter((t) => t.supervisionSkills).length;
  const reflectiveCount = training.filter((t) => t.reflectivePractice).length;
  const safeguardingCount = training.filter((t) => t.safeguardingOversight).length;
  const perfCount = training.filter((t) => t.performanceManagement).length;
  const wellbeingCount = training.filter((t) => t.wellbeingSupport).length;
  const docCount = training.filter((t) => t.documentationSkills).length;

  const supervisionSkillsRate = pct(skillsCount, total);
  const reflectivePracticeRate = pct(reflectiveCount, total);
  const safeguardingOversightRate = pct(safeguardingCount, total);
  const performanceManagementRate = pct(perfCount, total);
  const wellbeingSupportRate = pct(wellbeingCount, total);
  const documentationRate = pct(docCount, total);

  const s1 = Math.round((supervisionSkillsRate / 100) * 6);
  const s2 = Math.round((reflectivePracticeRate / 100) * 5);
  const s3 = Math.round((safeguardingOversightRate / 100) * 5);
  const s4 = Math.round((performanceManagementRate / 100) * 4);
  const s5 = Math.round((wellbeingSupportRate / 100) * 3);
  const s6 = Math.round((documentationRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalSupervisors: total, supervisionSkillsRate, reflectivePracticeRate, safeguardingOversightRate, performanceManagementRate, wellbeingSupportRate, documentationRate };
}

// ── Staff profiles ───────────────────────────────────────────────────────────

export function buildStaffSupervisionProfiles(sessions: SupervisionSession[]): StaffSupervisionProfile[] {
  if (sessions.length === 0) return [];

  const grouped = new Map<string, SupervisionSession[]>();
  for (const s of sessions) {
    if (!grouped.has(s.staffId)) grouped.set(s.staffId, []);
    grouped.get(s.staffId)!.push(s);
  }

  const profiles: StaffSupervisionProfile[] = [];

  for (const [staffId, sess] of grouped) {
    const staffName = sess[0].staffName;
    const total = sess.length;
    const effectiveCount = sess.filter((s) => s.supervisionOutcome === "very_effective" || s.supervisionOutcome === "effective").length;
    const safeguardingCount = sess.filter((s) => s.safeguardingDiscussed).length;

    const effectivenessRate = pct(effectiveCount, total);
    const safeguardingRate = pct(safeguardingCount, total);

    // Score 0-10: frequency(0-2), effectiveness(0-3), safeguarding(0-3), consistency(0-2)
    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let effScore = 0;
    if (effectivenessRate >= 80) effScore = 3;
    else if (effectivenessRate >= 60) effScore = 2;
    else if (effectivenessRate >= 40) effScore = 1;

    let safScore = 0;
    if (safeguardingRate >= 80) safScore = 3;
    else if (safeguardingRate >= 60) safScore = 2;
    else if (safeguardingRate >= 40) safScore = 1;

    // Consistency: same supervisor
    const uniqueSupervisors = new Set(sess.map((s) => s.supervisorId)).size;
    let conScore = 0;
    if (uniqueSupervisors === 1) conScore = 2;
    else if (uniqueSupervisors <= 2) conScore = 1;

    const overallScore = Math.min(10, freqScore + effScore + safScore + conScore);

    profiles.push({ staffId, staffName, totalSessions: total, effectivenessRate, safeguardingRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateStaffSupervisionEffectivenessIntelligence(
  sessions: SupervisionSession[],
  policy: SupervisionPolicy | null,
  training: SupervisorTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): StaffSupervisionEffectivenessIntelligence {
  const sessionEffectiveness = evaluateSessionEffectiveness(sessions);
  const supervisionCompliance = evaluateSupervisionCompliance(sessions);
  const supervisionPolicy = evaluateSupervisionPolicy(policy);
  const supervisorReadiness = evaluateSupervisorReadiness(training);

  const overallScore = Math.min(100, sessionEffectiveness.overallScore + supervisionCompliance.overallScore + supervisionPolicy.overallScore + supervisorReadiness.overallScore);
  const rating = getRating(overallScore);

  const staffProfiles = buildStaffSupervisionProfiles(sessions);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (sessionEffectiveness.effectivenessRate >= 80) strengths.push("Strong supervision effectiveness — sessions are consistently productive and outcome-focused");
  if (sessionEffectiveness.safeguardingRate >= 80) strengths.push("Safeguarding is consistently discussed in supervision sessions");
  if (sessionEffectiveness.wellbeingRate >= 80) strengths.push("Staff wellbeing is regularly checked during supervision");
  if (supervisionCompliance.documentedRate >= 80) strengths.push("Excellent documentation of supervision sessions");

  if (sessions.length > 0 && sessionEffectiveness.effectivenessRate < 60) areasForImprovement.push("Supervision effectiveness needs improvement — review session structure and content");
  if (sessions.length > 0 && sessionEffectiveness.safeguardingRate < 60) areasForImprovement.push("Safeguarding is not consistently discussed in supervision — embed in standard agenda");
  if (sessions.length > 0 && supervisionCompliance.staffSatisfactionRate < 60) areasForImprovement.push("Staff satisfaction with supervision is low — seek feedback and adapt approach");
  if (sessions.length > 0 && supervisionCompliance.previousActionsReviewedRate < 60) areasForImprovement.push("Previous action points are not consistently reviewed — improve follow-through");

  if (sessions.length === 0) actions.push("No supervision session records found — ensure regular supervision is taking place and recorded");
  if (!policy) actions.push("URGENT: No supervision policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No supervisor training recorded — arrange training for all supervisors");
  if (sessions.length > 0 && sessionEffectiveness.actionPointsRate < 60) actions.push("Improve action point setting in supervision sessions");
  if (sessions.length > 0 && sessionEffectiveness.wellbeingRate < 60) actions.push("Embed staff wellbeing checks into every supervision session");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 13 — Leadership and management",
    "CHR 2015 Regulation 33 — Employment of staff",
    "SCCIF — Impact of leaders on practice",
    "NMS 17 — Staffing: supervision",
    "Children Act 1989 — Welfare and safeguarding",
    "Working Together to Safeguard Children 2023",
    "Skills for Care — Effective supervision guide",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    sessionEffectiveness, supervisionCompliance, supervisionPolicy, supervisorReadiness,
    staffProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
