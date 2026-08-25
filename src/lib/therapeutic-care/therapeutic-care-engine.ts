import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Therapeutic Care Intelligence Engine
//
// Evaluates quality and effectiveness of therapeutic interventions for
// looked-after children in residential care settings.
//
// Regulatory basis:
//   - CHR 2015 Reg 6 (quality of care standard)
//   - CHR 2015 Reg 14 (care planning standard)
//   - NICE CG28 (depression in children and young people)
//   - NICE CG26 (PTSD — post-traumatic stress disorder)
//   - SCCIF — social care common inspection framework
//   - NMS 6 (promoting good health and wellbeing)
//   - UNCRC Article 24 (right to health)
//   - UNCRC Article 39 (recovery and reintegration)
//
// Pure deterministic engine — no AI, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Definitions ─────────────────────────────────────────────────────────

export type TherapyType =
  | "cbt"
  | "dbt"
  | "play_therapy"
  | "art_therapy"
  | "emdr"
  | "family_therapy"
  | "group_therapy"
  | "life_story"
  | "psychodynamic"
  | "trauma_focused_cbt"
  | "sensory_integration"
  | "other";

export type TherapyProvider =
  | "in_house"
  | "camhs"
  | "private"
  | "nhs"
  | "voluntary_sector";

export type SessionOutcome =
  | "positive"
  | "good_progress"
  | "maintaining"
  | "no_change"
  | "deteriorated"
  | "did_not_attend";

export type TherapistRole =
  | "clinical_psychologist"
  | "counsellor"
  | "psychotherapist"
  | "art_therapist"
  | "play_therapist"
  | "occupational_therapist"
  | "social_worker";

export type ReferralStatus =
  | "pending"
  | "accepted"
  | "active"
  | "completed"
  | "discharged"
  | "waitlisted"
  | "refused";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface TherapySession {
  id: string;
  childId: string;
  childName: string;
  therapyType: TherapyType;
  provider: TherapyProvider;
  therapistRole: TherapistRole;
  sessionDate: string;
  durationMinutes: number;
  outcome: SessionOutcome;
  childEngaged: boolean;
  childConsented: boolean;
  goalsAddressed: boolean;
  keyWorkerBriefed: boolean;
  riskAssessmentUpdated: boolean;
}

export interface TherapyReferral {
  id: string;
  childId: string;
  childName: string;
  therapyType: TherapyType;
  provider: TherapyProvider;
  referralDate: string;
  status: ReferralStatus;
  waitTimeDays: number;
  assessmentDate?: string;
  startDate?: string;
  reasonForReferral: string;
}

export interface TherapyPlan {
  id: string;
  childId: string;
  childName: string;
  therapyType: TherapyType;
  goals: string[];
  goalsAchieved: number;
  planReviewDate: string;
  planIsCoProduced: boolean;
  childViewsIncluded: boolean;
  lastUpdated: string;
  updatedBy: string;
}

export interface TherapeuticEnvironment {
  id: string;
  quietSpaceAvailable: boolean;
  sensoryRoomAvailable: boolean;
  outdoorTherapeuticSpace: boolean;
  staffTrainedInTherapeuticApproaches: boolean;
  therapyRoomPrivate: boolean;
  childCanRequestTherapy: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface SessionQualityResult {
  overallScore: number; // 0-25
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  attendanceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveOutcomeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childEngagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  consentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  keyWorkerBriefingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  goalsAddressedRate: number | null;
}

export interface ReferralEfficiencyResult {
  overallScore: number; // 0-25
  totalReferrals: number;
  averageWaitTimeDays: number;
  /** null when the population is empty — nothing measured, not 0%. */
  acceptanceRate: number | null;
  activeReferrals: number;
  waitlistedCount: number;
}

export interface TherapyPlanningResult {
  overallScore: number; // 0-25
  totalPlans: number;
  /** null when the population is empty — nothing measured, not 0%. */
  planReviewRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  coProducedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewsIncludedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  goalsAchievedRate: number | null;
}

export interface TherapeuticEnvironmentResult {
  overallScore: number; // 0-25
  quietSpaceAvailable: boolean;
  sensoryRoomAvailable: boolean;
  outdoorTherapeuticSpace: boolean;
  staffTrained: boolean;
  therapyRoomPrivate: boolean;
  childCanRequestTherapy: boolean;
}

export interface TherapeuticCareIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sessionQuality: SessionQualityResult;
  referralEfficiency: ReferralEfficiencyResult;
  therapyPlanning: TherapyPlanningResult;
  therapeuticEnvironment: TherapeuticEnvironmentResult;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Maps ──────────────────────────────────────────────────────────────

const THERAPY_TYPE_LABELS: Record<TherapyType, string> = {
  cbt: "Cognitive Behavioural Therapy",
  dbt: "Dialectical Behaviour Therapy",
  play_therapy: "Play Therapy",
  art_therapy: "Art Therapy",
  emdr: "EMDR",
  family_therapy: "Family Therapy",
  group_therapy: "Group Therapy",
  life_story: "Life Story Work",
  psychodynamic: "Psychodynamic Therapy",
  trauma_focused_cbt: "Trauma-Focused CBT",
  sensory_integration: "Sensory Integration",
  other: "Other",
};

const THERAPY_PROVIDER_LABELS: Record<TherapyProvider, string> = {
  in_house: "In-House",
  camhs: "CAMHS",
  private: "Private",
  nhs: "NHS",
  voluntary_sector: "Voluntary Sector",
};

const SESSION_OUTCOME_LABELS: Record<SessionOutcome, string> = {
  positive: "Positive",
  good_progress: "Good Progress",
  maintaining: "Maintaining",
  no_change: "No Change",
  deteriorated: "Deteriorated",
  did_not_attend: "Did Not Attend",
};

const THERAPIST_ROLE_LABELS: Record<TherapistRole, string> = {
  clinical_psychologist: "Clinical Psychologist",
  counsellor: "Counsellor",
  psychotherapist: "Psychotherapist",
  art_therapist: "Art Therapist",
  play_therapist: "Play Therapist",
  occupational_therapist: "Occupational Therapist",
  social_worker: "Social Worker",
};

const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  active: "Active",
  completed: "Completed",
  discharged: "Discharged",
  waitlisted: "Waitlisted",
  refused: "Refused",
};

export function getTherapyTypeLabel(t: TherapyType): string {
  return THERAPY_TYPE_LABELS[t] ?? t;
}

export function getTherapyProviderLabel(p: TherapyProvider): string {
  return THERAPY_PROVIDER_LABELS[p] ?? p;
}

export function getSessionOutcomeLabel(o: SessionOutcome): string {
  return SESSION_OUTCOME_LABELS[o] ?? o;
}

export function getTherapistRoleLabel(r: TherapistRole): string {
  return THERAPIST_ROLE_LABELS[r] ?? r;
}

export function getReferralStatusLabel(s: ReferralStatus): string {
  return REFERRAL_STATUS_LABELS[s] ?? s;
}

// ── Utility ──────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluation Functions ─────────────────────────────────────────────────────

/**
 * Evaluates session quality: attendance, outcomes, engagement, consent,
 * key worker briefing, and goals addressed.
 * Max score: 25.  Empty sessions = 0 (need to record therapy).
 */
export function evaluateSessionQuality(
  sessions: TherapySession[],
): SessionQualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      attendanceRate: null,
      positiveOutcomeRate: null,
      childEngagementRate: null,
      consentRate: null,
      keyWorkerBriefingRate: null,
      goalsAddressedRate: null,
    };
  }

  let score = 0;

  // Attendance rate (sessions that were not DNA)
  const attended = sessions.filter(
    (s) => s.outcome !== "did_not_attend",
  ).length;
  const attendanceRate = rate(attended, sessions.length);
  // +5 for >= 90%, +3 for >= 75%, +1 for >= 60%
  if (meets(attendanceRate, 90)) score += 5;
  else if (meets(attendanceRate, 75)) score += 3;
  else if (meets(attendanceRate, 60)) score += 1;

  // Positive outcome rate (positive or good_progress)
  const positiveOutcomes = sessions.filter(
    (s) => s.outcome === "positive" || s.outcome === "good_progress",
  ).length;
  const positiveOutcomeRate = rate(positiveOutcomes, sessions.length);
  // +5 for >= 70%, +3 for >= 50%, +1 for >= 30%
  if (meets(positiveOutcomeRate, 70)) score += 5;
  else if (meets(positiveOutcomeRate, 50)) score += 3;
  else if (meets(positiveOutcomeRate, 30)) score += 1;

  // Child engagement rate
  const engaged = sessions.filter((s) => s.childEngaged).length;
  const childEngagementRate = rate(engaged, sessions.length);
  // +4 for >= 85%, +2 for >= 65%
  if (meets(childEngagementRate, 85)) score += 4;
  else if (meets(childEngagementRate, 65)) score += 2;

  // Consent rate
  const consented = sessions.filter((s) => s.childConsented).length;
  const consentRate = rate(consented, sessions.length);
  // +4 for >= 95%, +2 for >= 80%
  if (meets(consentRate, 95)) score += 4;
  else if (meets(consentRate, 80)) score += 2;

  // Key worker briefing rate
  const briefed = sessions.filter((s) => s.keyWorkerBriefed).length;
  const keyWorkerBriefingRate = rate(briefed, sessions.length);
  // +4 for >= 90%, +2 for >= 70%
  if (meets(keyWorkerBriefingRate, 90)) score += 4;
  else if (meets(keyWorkerBriefingRate, 70)) score += 2;

  // Goals addressed rate
  const goalsAddressed = sessions.filter((s) => s.goalsAddressed).length;
  const goalsAddressedRate = rate(goalsAddressed, sessions.length);
  // +3 for >= 85%, +2 for >= 65%, +1 for >= 45%
  if (meets(goalsAddressedRate, 85)) score += 3;
  else if (meets(goalsAddressedRate, 65)) score += 2;
  else if (meets(goalsAddressedRate, 45)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalSessions: sessions.length,
    attendanceRate,
    positiveOutcomeRate,
    childEngagementRate,
    consentRate,
    keyWorkerBriefingRate,
    goalsAddressedRate,
  };
}

/**
 * Evaluates referral efficiency: wait times, acceptance rates, active count,
 * waitlisted count.
 * Max score: 25.  Empty referrals = 25 (no referrals needed = positive).
 */
export function evaluateReferralEfficiency(
  referrals: TherapyReferral[],
): ReferralEfficiencyResult {
  if (referrals.length === 0) {
    return {
      overallScore: 25,
      totalReferrals: 0,
      averageWaitTimeDays: 0,
      acceptanceRate: null,
      activeReferrals: 0,
      waitlistedCount: 0,
    };
  }

  let score = 0;

  // Average wait time
  const totalWait = referrals.reduce((sum, r) => sum + r.waitTimeDays, 0);
  const averageWaitTimeDays = Math.round(totalWait / referrals.length);
  // +8 for <= 14 days, +5 for <= 28, +3 for <= 56, +1 for <= 90
  if (averageWaitTimeDays <= 14) score += 8;
  else if (averageWaitTimeDays <= 28) score += 5;
  else if (averageWaitTimeDays <= 56) score += 3;
  else if (averageWaitTimeDays <= 90) score += 1;

  // Acceptance rate (accepted, active, completed, discharged)
  const accepted = referrals.filter(
    (r) =>
      r.status === "accepted" ||
      r.status === "active" ||
      r.status === "completed" ||
      r.status === "discharged",
  ).length;
  const acceptanceRate = rate(accepted, referrals.length);
  // +7 for >= 90%, +5 for >= 70%, +3 for >= 50%
  if (meets(acceptanceRate, 90)) score += 7;
  else if (meets(acceptanceRate, 70)) score += 5;
  else if (meets(acceptanceRate, 50)) score += 3;

  // Active referrals (positive that children are actively in therapy)
  const activeReferrals = referrals.filter(
    (r) => r.status === "active",
  ).length;
  // +5 for active referrals present, +3 for at least 1
  if (activeReferrals >= 2) score += 5;
  else if (activeReferrals >= 1) score += 3;

  // Waitlisted count (penalty if high)
  const waitlistedCount = referrals.filter(
    (r) => r.status === "waitlisted",
  ).length;
  // +5 for 0 waitlisted, +3 for <= 1, +1 for <= 2
  if (waitlistedCount === 0) score += 5;
  else if (waitlistedCount <= 1) score += 3;
  else if (waitlistedCount <= 2) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalReferrals: referrals.length,
    averageWaitTimeDays,
    acceptanceRate,
    activeReferrals,
    waitlistedCount,
  };
}

/**
 * Evaluates therapy planning: plan reviews, co-production, child views,
 * goals achieved.
 * Max score: 25.  Empty plans = 0.
 */
export function evaluateTherapyPlanning(
  plans: TherapyPlan[],
): TherapyPlanningResult {
  if (plans.length === 0) {
    return {
      overallScore: 0,
      totalPlans: 0,
      planReviewRate: null,
      coProducedRate: null,
      childViewsIncludedRate: null,
      goalsAchievedRate: null,
    };
  }

  let score = 0;

  // Plan review rate — plans reviewed within date (planReviewDate not in the past)
  const now = new Date();
  const reviewed = plans.filter(
    (p) => new Date(p.planReviewDate) >= now || new Date(p.lastUpdated) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  ).length;
  const planReviewRate = rate(reviewed, plans.length);
  // +7 for >= 90%, +5 for >= 70%, +3 for >= 50%
  if (meets(planReviewRate, 90)) score += 7;
  else if (meets(planReviewRate, 70)) score += 5;
  else if (meets(planReviewRate, 50)) score += 3;

  // Co-produced rate
  const coProduced = plans.filter((p) => p.planIsCoProduced).length;
  const coProducedRate = rate(coProduced, plans.length);
  // +6 for >= 90%, +4 for >= 70%, +2 for >= 50%
  if (meets(coProducedRate, 90)) score += 6;
  else if (meets(coProducedRate, 70)) score += 4;
  else if (meets(coProducedRate, 50)) score += 2;

  // Child views included rate
  const childViews = plans.filter((p) => p.childViewsIncluded).length;
  const childViewsIncludedRate = rate(childViews, plans.length);
  // +6 for >= 90%, +4 for >= 70%, +2 for >= 50%
  if (meets(childViewsIncludedRate, 90)) score += 6;
  else if (meets(childViewsIncludedRate, 70)) score += 4;
  else if (meets(childViewsIncludedRate, 50)) score += 2;

  // Goals achieved rate
  const totalGoals = plans.reduce((sum, p) => sum + p.goals.length, 0);
  const totalAchieved = plans.reduce((sum, p) => sum + p.goalsAchieved, 0);
  const goalsAchievedRate = rate(totalAchieved, totalGoals);
  // +6 for >= 75%, +4 for >= 50%, +2 for >= 30%
  if (meets(goalsAchievedRate, 75)) score += 6;
  else if (meets(goalsAchievedRate, 50)) score += 4;
  else if (meets(goalsAchievedRate, 30)) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalPlans: plans.length,
    planReviewRate,
    coProducedRate,
    childViewsIncludedRate,
    goalsAchievedRate,
  };
}

/**
 * Evaluates therapeutic environment: quiet space, sensory room, outdoor space,
 * trained staff, therapy room privacy, child can request therapy.
 * Max score: 25.  Empty environments = 0.
 */
export function evaluateTherapeuticEnvironment(
  environments: TherapeuticEnvironment[],
): TherapeuticEnvironmentResult {
  if (environments.length === 0) {
    return {
      overallScore: 0,
      quietSpaceAvailable: false,
      sensoryRoomAvailable: false,
      outdoorTherapeuticSpace: false,
      staffTrained: false,
      therapyRoomPrivate: false,
      childCanRequestTherapy: false,
    };
  }

  // Use first environment record (home-level assessment)
  const env = environments[0];
  let score = 0;

  const quietSpaceAvailable = env.quietSpaceAvailable;
  if (quietSpaceAvailable) score += 4;

  const sensoryRoomAvailable = env.sensoryRoomAvailable;
  if (sensoryRoomAvailable) score += 4;

  const outdoorTherapeuticSpace = env.outdoorTherapeuticSpace;
  if (outdoorTherapeuticSpace) score += 4;

  const staffTrained = env.staffTrainedInTherapeuticApproaches;
  if (staffTrained) score += 5;

  const therapyRoomPrivate = env.therapyRoomPrivate;
  if (therapyRoomPrivate) score += 4;

  const childCanRequestTherapy = env.childCanRequestTherapy;
  if (childCanRequestTherapy) score += 4;

  return {
    overallScore: Math.min(score, 25),
    quietSpaceAvailable,
    sensoryRoomAvailable,
    outdoorTherapeuticSpace,
    staffTrained,
    therapyRoomPrivate,
    childCanRequestTherapy,
  };
}

// ── Strengths / Areas / Actions ──────────────────────────────────────────────

function generateStrengths(
  session: SessionQualityResult,
  referral: ReferralEfficiencyResult,
  planning: TherapyPlanningResult,
  environment: TherapeuticEnvironmentResult,
): string[] {
  const strengths: string[] = [];

  if (meets(session.attendanceRate, 90) && session.totalSessions > 0) {
    strengths.push(
      "Excellent therapy attendance rate — children consistently attending scheduled sessions",
    );
  }

  if (meets(session.positiveOutcomeRate, 70) && session.totalSessions > 0) {
    strengths.push(
      "Strong positive outcome rate — therapy interventions showing measurable impact",
    );
  }

  if (meets(session.childEngagementRate, 85) && session.totalSessions > 0) {
    strengths.push(
      "High child engagement in therapy sessions — children actively participating in their therapeutic journey",
    );
  }

  if (meets(session.consentRate, 95) && session.totalSessions > 0) {
    strengths.push(
      "Outstanding consent practice — children's right to consent consistently upheld",
    );
  }

  if (meets(session.keyWorkerBriefingRate, 90) && session.totalSessions > 0) {
    strengths.push(
      "Key workers consistently briefed following therapy sessions — strong communication between therapists and care team",
    );
  }

  if (referral.averageWaitTimeDays <= 14 && referral.totalReferrals > 0) {
    strengths.push(
      "Excellent referral wait times — children accessing therapy quickly when needed",
    );
  }

  if (meets(referral.acceptanceRate, 90) && referral.totalReferrals > 0) {
    strengths.push(
      "High referral acceptance rate — appropriate referrals being made with strong supporting evidence",
    );
  }

  if (meets(planning.coProducedRate, 90) && planning.totalPlans > 0) {
    strengths.push(
      "Therapy plans consistently co-produced — children and professionals collaborating on treatment goals",
    );
  }

  if (meets(planning.childViewsIncludedRate, 90) && planning.totalPlans > 0) {
    strengths.push(
      "Children's views consistently included in therapy planning — voice of the child embedded in practice",
    );
  }

  if (meets(planning.goalsAchievedRate, 75) && planning.totalPlans > 0) {
    strengths.push(
      "Strong goal achievement rate — therapeutic interventions effectively meeting planned objectives",
    );
  }

  if (environment.staffTrained) {
    strengths.push(
      "Staff trained in therapeutic approaches — creating a therapeutically informed care environment",
    );
  }

  if (environment.sensoryRoomAvailable && environment.quietSpaceAvailable) {
    strengths.push(
      "Dedicated sensory room and quiet space available — supporting children's emotional regulation needs",
    );
  }

  if (environment.childCanRequestTherapy) {
    strengths.push(
      "Children can proactively request therapy — empowering children to seek support when needed",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  session: SessionQualityResult,
  referral: ReferralEfficiencyResult,
  planning: TherapyPlanningResult,
  environment: TherapeuticEnvironmentResult,
): string[] {
  const areas: string[] = [];

  if (session.totalSessions === 0) {
    areas.push(
      "No therapy sessions recorded — therapeutic interventions should be documented",
    );
  }

  if (below(session.attendanceRate, 75) && session.totalSessions > 0) {
    areas.push(
      `Therapy attendance rate at ${session.attendanceRate}% — missed sessions reduce therapeutic effectiveness`,
    );
  }

  if (below(session.positiveOutcomeRate, 50) && session.totalSessions > 0) {
    areas.push(
      `Only ${session.positiveOutcomeRate}% of sessions have positive outcomes — review therapeutic approach and appropriateness`,
    );
  }

  if (below(session.childEngagementRate, 65) && session.totalSessions > 0) {
    areas.push(
      `Child engagement at ${session.childEngagementRate}% — consider whether therapy modality suits individual children`,
    );
  }

  if (below(session.consentRate, 80) && session.totalSessions > 0) {
    areas.push(
      `Consent rate at ${session.consentRate}% — all children must be supported to understand and consent to therapy`,
    );
  }

  if (below(session.keyWorkerBriefingRate, 70) && session.totalSessions > 0) {
    areas.push(
      `Key worker briefing rate at ${session.keyWorkerBriefingRate}% — care team must be kept informed following sessions`,
    );
  }

  if (referral.averageWaitTimeDays > 56 && referral.totalReferrals > 0) {
    areas.push(
      `Average referral wait time of ${referral.averageWaitTimeDays} days — children waiting too long for therapy`,
    );
  }

  if (referral.waitlistedCount > 1) {
    areas.push(
      `${referral.waitlistedCount} children currently waitlisted — explore alternative providers to reduce delays`,
    );
  }

  if (planning.totalPlans === 0) {
    areas.push(
      "No therapy plans in place — all children receiving therapy should have documented treatment plans",
    );
  }

  if (below(planning.coProducedRate, 70) && planning.totalPlans > 0) {
    areas.push(
      `Only ${planning.coProducedRate}% of therapy plans co-produced — plans should be developed collaboratively`,
    );
  }

  if (below(planning.childViewsIncludedRate, 70) && planning.totalPlans > 0) {
    areas.push(
      `Children's views included in only ${planning.childViewsIncludedRate}% of plans — voice of the child must be central`,
    );
  }

  if (below(planning.goalsAchievedRate, 30) && planning.totalPlans > 0) {
    areas.push(
      `Goals achieved rate at ${planning.goalsAchievedRate}% — review whether goals are realistic and therapy approach is effective`,
    );
  }

  if (!environment.staffTrained) {
    areas.push(
      "Staff not trained in therapeutic approaches — care team needs therapeutic awareness training",
    );
  }

  if (!environment.quietSpaceAvailable) {
    areas.push(
      "No dedicated quiet space available — children need access to calm, regulated environments",
    );
  }

  if (!environment.therapyRoomPrivate) {
    areas.push(
      "Therapy room lacks appropriate privacy — confidential therapeutic sessions require a private space",
    );
  }

  if (!environment.childCanRequestTherapy) {
    areas.push(
      "Children cannot proactively request therapy — processes should empower children to seek support",
    );
  }

  return areas;
}

function generateActions(
  session: SessionQualityResult,
  referral: ReferralEfficiencyResult,
  planning: TherapyPlanningResult,
  environment: TherapeuticEnvironmentResult,
): string[] {
  const actions: string[] = [];

  if (session.totalSessions === 0) {
    actions.push(
      "URGENT: Implement therapy session recording — Reg 6 requires documentation of therapeutic care provided",
    );
  }

  if (below(session.attendanceRate, 75) && session.totalSessions > 0) {
    actions.push(
      "Review reasons for missed therapy sessions with each child — develop strategies to support attendance",
    );
  }

  if (below(session.positiveOutcomeRate, 50) && session.totalSessions > 0) {
    actions.push(
      "Arrange clinical review of therapy approaches — consider whether alternative modalities would better meet children's needs",
    );
  }

  if (below(session.keyWorkerBriefingRate, 70) && session.totalSessions > 0) {
    actions.push(
      "Establish protocol for post-session key worker briefings — ensure care continuity between therapy and daily care",
    );
  }

  if (referral.averageWaitTimeDays > 56 && referral.totalReferrals > 0) {
    actions.push(
      "Escalate long referral wait times with commissioning team — explore spot-purchase or alternative providers",
    );
  }

  if (referral.waitlistedCount > 1) {
    actions.push(
      "Review waitlisted referrals and explore interim therapeutic support options while children wait",
    );
  }

  if (planning.totalPlans === 0) {
    actions.push(
      "URGENT: Develop therapy plans for all children accessing therapeutic interventions — Reg 14 requires care planning",
    );
  }

  if (below(planning.coProducedRate, 70) && planning.totalPlans > 0) {
    actions.push(
      "Embed co-production in therapy planning — involve children and their key workers in goal-setting",
    );
  }

  if (below(planning.childViewsIncludedRate, 70) && planning.totalPlans > 0) {
    actions.push(
      "Develop child-friendly tools for capturing children's views on their therapy — UNCRC Article 12 participation right",
    );
  }

  if (below(planning.goalsAchievedRate, 30) && planning.totalPlans > 0) {
    actions.push(
      "Review therapeutic goals with clinical supervision — ensure goals are SMART and achievable within timeframes",
    );
  }

  if (!environment.staffTrained) {
    actions.push(
      "Commission therapeutic approaches training for all care staff — trauma-informed care, attachment, and de-escalation",
    );
  }

  if (!environment.quietSpaceAvailable) {
    actions.push(
      "Designate and equip a quiet space within the home for children to self-regulate",
    );
  }

  if (!environment.sensoryRoomAvailable) {
    actions.push(
      "Consider developing a sensory room to support children with sensory processing and regulation needs",
    );
  }

  if (!environment.therapyRoomPrivate) {
    actions.push(
      "Ensure therapy room provides appropriate privacy and confidentiality for therapeutic sessions",
    );
  }

  if (!environment.childCanRequestTherapy) {
    actions.push(
      "Implement a clear process for children to request therapy — display information in child-friendly formats",
    );
  }

  return actions;
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateTherapeuticCareIntelligence(
  sessions: TherapySession[],
  referrals: TherapyReferral[],
  plans: TherapyPlan[],
  environments: TherapeuticEnvironment[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): TherapeuticCareIntelligence {
  const sessionResult = evaluateSessionQuality(sessions);
  const referralResult = evaluateReferralEfficiency(referrals);
  const planningResult = evaluateTherapyPlanning(plans);
  const environmentResult = evaluateTherapeuticEnvironment(environments);

  const overallScore =
    sessionResult.overallScore +
    referralResult.overallScore +
    planningResult.overallScore +
    environmentResult.overallScore;

  const strengths = generateStrengths(
    sessionResult,
    referralResult,
    planningResult,
    environmentResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    sessionResult,
    referralResult,
    planningResult,
    environmentResult,
  );
  const actions = generateActions(
    sessionResult,
    referralResult,
    planningResult,
    environmentResult,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 6 — quality of care standard including therapeutic support",
    "CHR 2015 Reg 14 — care planning standard including therapeutic needs",
    "NICE CG28 — depression in children and young people: identification and management",
    "NICE CG26 — post-traumatic stress disorder (PTSD) treatment guidance",
    "SCCIF — inspection of therapeutic care and emotional wellbeing outcomes",
    "NMS 6 — promoting good health and wellbeing including mental health",
    "UNCRC Article 24 — right to the highest attainable standard of health",
    "UNCRC Article 39 — right to recovery and social reintegration for child victims",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore: Math.min(overallScore, 100),
    rating: getRating(overallScore),
    sessionQuality: sessionResult,
    referralEfficiency: referralResult,
    therapyPlanning: planningResult,
    therapeuticEnvironment: environmentResult,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
