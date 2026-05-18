// ==============================================================================
// Cornerstone Safeguarding Oversight Intelligence Engine
//
// Evaluates the quality and comprehensiveness of safeguarding arrangements,
// including DBS compliance, training currency, referral management,
// designated safeguarding lead oversight, and multi-agency coordination.
//
// Regulatory basis:
//   CHR 2015 Reg 12 — the protection of children standard
//   CHR 2015 Reg 32 — fitness of workers
//   KCSIE 2024 — Keeping Children Safe in Education (applied to residential)
//   Working Together 2023 — multi-agency safeguarding
//   SCCIF — safety of children
//   NMS 3 — safeguarding children
//   UNCRC Article 19 — protection from violence, abuse, neglect
//   CA 1989 s47 — duty to investigate
//
// Pure deterministic engine — no AI, no external calls.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type DBSStatus =
  | "enhanced_current"
  | "enhanced_expiring"
  | "enhanced_expired"
  | "basic_only"
  | "not_completed"
  | "update_service";

export type SafeguardingTrainingLevel =
  | "level_3_current"
  | "level_2_current"
  | "level_1_current"
  | "refresher_due"
  | "expired"
  | "not_completed";

export type ReferralType =
  | "lado"
  | "mash"
  | "police"
  | "social_care"
  | "prevent"
  | "channel"
  | "camhs"
  | "nspcc"
  | "internal_safeguarding";

export type ReferralOutcome =
  | "action_taken"
  | "no_further_action"
  | "ongoing_investigation"
  | "referred_on"
  | "awaiting_outcome"
  | "withdrawn";

export type ConcernCategory =
  | "physical_abuse"
  | "emotional_abuse"
  | "sexual_abuse"
  | "neglect"
  | "exploitation"
  | "radicalisation"
  | "online_harm"
  | "peer_on_peer"
  | "self_harm"
  | "domestic_abuse"
  | "honour_based"
  | "fgm"
  | "trafficking";

export type ConcernPriority =
  | "immediate"
  | "high"
  | "medium"
  | "low";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface StaffSafeguardingRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  dbsStatus: DBSStatus;
  dbsDate: string | null;
  trainingLevel: SafeguardingTrainingLevel;
  lastTrainingDate: string | null;
  designatedSafeguardingLead: boolean;
  deputyDSL: boolean;
  saferRecruitmentTrained: boolean;
  preventTrained: boolean;
}

export interface SafeguardingReferral {
  id: string;
  childId: string | null;
  childName: string | null;
  referralType: ReferralType;
  outcome: ReferralOutcome;
  dateReferred: string;
  dateOutcome: string | null;
  referredBy: string;
  concernCategory: ConcernCategory;
  concernPriority: ConcernPriority;
  timelyReferral: boolean;
  managementInformed: boolean;
  parentNotified: boolean;
  childInformed: boolean;
  recordedAppropriately: boolean;
}

export interface SafeguardingAudit {
  id: string;
  homeId: string;
  auditDate: string;
  auditor: string;
  policiesUpToDate: boolean;
  riskAssessmentsCurrentForAllChildren: boolean;
  bodyMapProtocolFollowed: boolean;
  whistleblowingPolicyAccessible: boolean;
  childrenKnowHowToComplain: boolean;
  safeguardingDisplayed: boolean;
  visitorsSignedIn: boolean;
  mobilePhonePolicy: boolean;
  photographyPolicy: boolean;
  overallCompliant: boolean;
}

export interface DSLOversight {
  id: string;
  dslName: string;
  reviewDate: string;
  openCasesReviewed: number;
  openCasesTotal: number;
  supervisionOfConcerns: boolean;
  multiAgencyAttendance: boolean;
  trainingDelivered: boolean;
  policyReviewCompleted: boolean;
  incidentDebriefsConducted: boolean;
  staffSupportProvided: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface WorkforceSafetyResult {
  overallScore: number; // 0-25
  totalStaff: number;
  enhancedDBSRate: number; // %
  currentTrainingRate: number; // %
  saferRecruitmentRate: number; // %
  preventTrainedRate: number; // %
  expiredDBSCount: number;
  expiredTrainingCount: number;
  hasDSL: boolean;
  hasDeputyDSL: boolean;
}

export interface ReferralQualityResult {
  overallScore: number; // 0-25
  totalReferrals: number;
  timelyReferralRate: number; // %
  managementInformedRate: number; // %
  recordedAppropriatelyRate: number; // %
  actionTakenRate: number; // %
  immediateHighCount: number;
  awaitingOutcomeCount: number;
}

export interface AuditComplianceResult {
  overallScore: number; // 0-25
  totalAudits: number;
  overallCompliantRate: number; // %
  policiesUpToDateRate: number; // %
  riskAssessmentsCurrentRate: number; // %
  childrenKnowComplainRate: number; // %
  visitorSignInRate: number; // %
}

export interface DSLOversightResult {
  overallScore: number; // 0-25
  totalReviews: number;
  caseReviewRate: number; // %
  supervisionRate: number; // %
  multiAgencyRate: number; // %
  trainingDeliveredRate: number; // %
  policyReviewRate: number; // %
}

export interface StaffSafeguardingProfile {
  staffId: string;
  staffName: string;
  role: string;
  dbsStatus: DBSStatus;
  trainingLevel: SafeguardingTrainingLevel;
  isDSL: boolean;
  isDeputyDSL: boolean;
  compliant: boolean;
}

export interface SafeguardingOversightIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  workforceSafety: WorkforceSafetyResult;
  referralQuality: ReferralQualityResult;
  auditCompliance: AuditComplianceResult;
  dslOversight: DSLOversightResult;
  staffProfiles: StaffSafeguardingProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function cap(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Functions ----------------------------------------------------------

const DBS_STATUS_LABELS: Record<DBSStatus, string> = {
  enhanced_current: "Enhanced (Current)",
  enhanced_expiring: "Enhanced (Expiring)",
  enhanced_expired: "Enhanced (Expired)",
  basic_only: "Basic Only",
  not_completed: "Not Completed",
  update_service: "Update Service",
};

const TRAINING_LEVEL_LABELS: Record<SafeguardingTrainingLevel, string> = {
  level_3_current: "Level 3 (Current)",
  level_2_current: "Level 2 (Current)",
  level_1_current: "Level 1 (Current)",
  refresher_due: "Refresher Due",
  expired: "Expired",
  not_completed: "Not Completed",
};

const REFERRAL_TYPE_LABELS: Record<ReferralType, string> = {
  lado: "LADO",
  mash: "MASH",
  police: "Police",
  social_care: "Social Care",
  prevent: "Prevent",
  channel: "Channel",
  camhs: "CAMHS",
  nspcc: "NSPCC",
  internal_safeguarding: "Internal Safeguarding",
};

const REFERRAL_OUTCOME_LABELS: Record<ReferralOutcome, string> = {
  action_taken: "Action Taken",
  no_further_action: "No Further Action",
  ongoing_investigation: "Ongoing Investigation",
  referred_on: "Referred On",
  awaiting_outcome: "Awaiting Outcome",
  withdrawn: "Withdrawn",
};

const CONCERN_CATEGORY_LABELS: Record<ConcernCategory, string> = {
  physical_abuse: "Physical Abuse",
  emotional_abuse: "Emotional Abuse",
  sexual_abuse: "Sexual Abuse",
  neglect: "Neglect",
  exploitation: "Exploitation",
  radicalisation: "Radicalisation",
  online_harm: "Online Harm",
  peer_on_peer: "Peer-on-Peer",
  self_harm: "Self-Harm",
  domestic_abuse: "Domestic Abuse",
  honour_based: "Honour-Based",
  fgm: "FGM",
  trafficking: "Trafficking",
};

const CONCERN_PRIORITY_LABELS: Record<ConcernPriority, string> = {
  immediate: "Immediate",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getDBSStatusLabel(status: DBSStatus): string {
  return DBS_STATUS_LABELS[status];
}

export function getTrainingLevelLabel(level: SafeguardingTrainingLevel): string {
  return TRAINING_LEVEL_LABELS[level];
}

export function getReferralTypeLabel(type: ReferralType): string {
  return REFERRAL_TYPE_LABELS[type];
}

export function getReferralOutcomeLabel(outcome: ReferralOutcome): string {
  return REFERRAL_OUTCOME_LABELS[outcome];
}

export function getConcernCategoryLabel(category: ConcernCategory): string {
  return CONCERN_CATEGORY_LABELS[category];
}

export function getConcernPriorityLabel(priority: ConcernPriority): string {
  return CONCERN_PRIORITY_LABELS[priority];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

// -- Evaluators ---------------------------------------------------------------

export function evaluateWorkforceSafety(
  staff: StaffSafeguardingRecord[],
): WorkforceSafetyResult {
  if (staff.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      enhancedDBSRate: 0,
      currentTrainingRate: 0,
      saferRecruitmentRate: 0,
      preventTrainedRate: 0,
      expiredDBSCount: 0,
      expiredTrainingCount: 0,
      hasDSL: false,
      hasDeputyDSL: false,
    };
  }

  const enhancedDBS = staff.filter(
    (s) => s.dbsStatus === "enhanced_current" || s.dbsStatus === "update_service",
  ).length;
  const enhancedDBSRate = pct(enhancedDBS, staff.length);

  const currentTraining = staff.filter(
    (s) =>
      s.trainingLevel === "level_3_current" ||
      s.trainingLevel === "level_2_current" ||
      s.trainingLevel === "level_1_current",
  ).length;
  const currentTrainingRate = pct(currentTraining, staff.length);

  const saferRecruitment = staff.filter((s) => s.saferRecruitmentTrained).length;
  const saferRecruitmentRate = pct(saferRecruitment, staff.length);

  const preventTrained = staff.filter((s) => s.preventTrained).length;
  const preventTrainedRate = pct(preventTrained, staff.length);

  const expiredDBSCount = staff.filter(
    (s) => s.dbsStatus === "enhanced_expired" || s.dbsStatus === "not_completed",
  ).length;
  const expiredTrainingCount = staff.filter(
    (s) => s.trainingLevel === "expired" || s.trainingLevel === "not_completed",
  ).length;

  const hasDSL = staff.some((s) => s.designatedSafeguardingLead);
  const hasDeputyDSL = staff.some((s) => s.deputyDSL);

  // Score calculation
  let score = 0;
  // Enhanced DBS rate (0-7)
  score += Math.round((enhancedDBSRate / 100) * 7);
  // Current training rate (0-6)
  score += Math.round((currentTrainingRate / 100) * 6);
  // Safer recruitment (0-4)
  score += Math.round((saferRecruitmentRate / 100) * 4);
  // Prevent training (0-3)
  score += Math.round((preventTrainedRate / 100) * 3);
  // DSL in place (0-3)
  if (hasDSL) score += 2;
  if (hasDeputyDSL) score += 1;
  // DSL at level 3 (0-2)
  const dslAtLevel3 = staff.some(
    (s) => s.designatedSafeguardingLead && s.trainingLevel === "level_3_current",
  );
  if (dslAtLevel3) score += 2;

  // Penalties
  score -= expiredDBSCount * 3;
  score -= expiredTrainingCount * 2;

  return {
    overallScore: cap(score, 0, 25),
    totalStaff: staff.length,
    enhancedDBSRate,
    currentTrainingRate,
    saferRecruitmentRate,
    preventTrainedRate,
    expiredDBSCount,
    expiredTrainingCount,
    hasDSL,
    hasDeputyDSL,
  };
}

export function evaluateReferralQuality(
  referrals: SafeguardingReferral[],
): ReferralQualityResult {
  if (referrals.length === 0) {
    return {
      overallScore: 25,
      totalReferrals: 0,
      timelyReferralRate: 0,
      managementInformedRate: 0,
      recordedAppropriatelyRate: 0,
      actionTakenRate: 0,
      immediateHighCount: 0,
      awaitingOutcomeCount: 0,
    };
  }

  const timely = referrals.filter((r) => r.timelyReferral).length;
  const timelyReferralRate = pct(timely, referrals.length);

  const managementInformed = referrals.filter((r) => r.managementInformed).length;
  const managementInformedRate = pct(managementInformed, referrals.length);

  const recorded = referrals.filter((r) => r.recordedAppropriately).length;
  const recordedAppropriatelyRate = pct(recorded, referrals.length);

  const withOutcome = referrals.filter((r) => r.outcome !== "awaiting_outcome");
  const actionTaken = withOutcome.filter((r) => r.outcome === "action_taken" || r.outcome === "referred_on").length;
  const actionTakenRate = pct(actionTaken, withOutcome.length);

  const immediateHighCount = referrals.filter(
    (r) => r.concernPriority === "immediate" || r.concernPriority === "high",
  ).length;
  const awaitingOutcomeCount = referrals.filter((r) => r.outcome === "awaiting_outcome").length;

  // Score calculation
  let score = 0;
  // Timely referral rate (0-8)
  score += Math.round((timelyReferralRate / 100) * 8);
  // Management informed (0-5)
  score += Math.round((managementInformedRate / 100) * 5);
  // Recorded appropriately (0-5)
  score += Math.round((recordedAppropriatelyRate / 100) * 5);
  // Action taken rate (0-4)
  score += Math.round((actionTakenRate / 100) * 4);
  // Child informed bonus (0-3)
  const childInformed = referrals.filter((r) => r.childInformed).length;
  score += Math.round((pct(childInformed, referrals.length) / 100) * 3);

  // Penalty for late immediate/high referrals
  const lateUrgent = referrals.filter(
    (r) => (r.concernPriority === "immediate" || r.concernPriority === "high") && !r.timelyReferral,
  ).length;
  score -= lateUrgent * 3;

  return {
    overallScore: cap(score, 0, 25),
    totalReferrals: referrals.length,
    timelyReferralRate,
    managementInformedRate,
    recordedAppropriatelyRate,
    actionTakenRate,
    immediateHighCount,
    awaitingOutcomeCount,
  };
}

export function evaluateAuditCompliance(
  audits: SafeguardingAudit[],
): AuditComplianceResult {
  if (audits.length === 0) {
    return {
      overallScore: 0,
      totalAudits: 0,
      overallCompliantRate: 0,
      policiesUpToDateRate: 0,
      riskAssessmentsCurrentRate: 0,
      childrenKnowComplainRate: 0,
      visitorSignInRate: 0,
    };
  }

  const compliant = audits.filter((a) => a.overallCompliant).length;
  const overallCompliantRate = pct(compliant, audits.length);

  const policiesUpToDate = audits.filter((a) => a.policiesUpToDate).length;
  const policiesUpToDateRate = pct(policiesUpToDate, audits.length);

  const riskCurrent = audits.filter((a) => a.riskAssessmentsCurrentForAllChildren).length;
  const riskAssessmentsCurrentRate = pct(riskCurrent, audits.length);

  const childrenKnow = audits.filter((a) => a.childrenKnowHowToComplain).length;
  const childrenKnowComplainRate = pct(childrenKnow, audits.length);

  const visitorSign = audits.filter((a) => a.visitorsSignedIn).length;
  const visitorSignInRate = pct(visitorSign, audits.length);

  // Score calculation
  let score = 0;
  // Overall compliance (0-8)
  score += Math.round((overallCompliantRate / 100) * 8);
  // Policies (0-5)
  score += Math.round((policiesUpToDateRate / 100) * 5);
  // Risk assessments (0-5)
  score += Math.round((riskAssessmentsCurrentRate / 100) * 5);
  // Children know how to complain (0-4)
  score += Math.round((childrenKnowComplainRate / 100) * 4);
  // Visitor sign-in (0-3)
  score += Math.round((visitorSignInRate / 100) * 3);

  return {
    overallScore: cap(score, 0, 25),
    totalAudits: audits.length,
    overallCompliantRate,
    policiesUpToDateRate,
    riskAssessmentsCurrentRate,
    childrenKnowComplainRate,
    visitorSignInRate,
  };
}

export function evaluateDSLOversight(
  reviews: DSLOversight[],
): DSLOversightResult {
  if (reviews.length === 0) {
    return {
      overallScore: 0,
      totalReviews: 0,
      caseReviewRate: 0,
      supervisionRate: 0,
      multiAgencyRate: 0,
      trainingDeliveredRate: 0,
      policyReviewRate: 0,
    };
  }

  const totalOpenCases = reviews.reduce((s, r) => s + r.openCasesTotal, 0);
  const totalReviewed = reviews.reduce((s, r) => s + r.openCasesReviewed, 0);
  const caseReviewRate = pct(totalReviewed, totalOpenCases);

  const supervision = reviews.filter((r) => r.supervisionOfConcerns).length;
  const supervisionRate = pct(supervision, reviews.length);

  const multiAgency = reviews.filter((r) => r.multiAgencyAttendance).length;
  const multiAgencyRate = pct(multiAgency, reviews.length);

  const trainingDelivered = reviews.filter((r) => r.trainingDelivered).length;
  const trainingDeliveredRate = pct(trainingDelivered, reviews.length);

  const policyReview = reviews.filter((r) => r.policyReviewCompleted).length;
  const policyReviewRate = pct(policyReview, reviews.length);

  // Score calculation
  let score = 0;
  // Case review rate (0-7)
  score += Math.round((caseReviewRate / 100) * 7);
  // Supervision (0-5)
  score += Math.round((supervisionRate / 100) * 5);
  // Multi-agency (0-5)
  score += Math.round((multiAgencyRate / 100) * 5);
  // Training delivered (0-4)
  score += Math.round((trainingDeliveredRate / 100) * 4);
  // Policy review (0-4)
  score += Math.round((policyReviewRate / 100) * 4);

  return {
    overallScore: cap(score, 0, 25),
    totalReviews: reviews.length,
    caseReviewRate,
    supervisionRate,
    multiAgencyRate,
    trainingDeliveredRate,
    policyReviewRate,
  };
}

// -- Staff Profiles -----------------------------------------------------------

export function buildStaffSafeguardingProfiles(
  staff: StaffSafeguardingRecord[],
): StaffSafeguardingProfile[] {
  return staff.map((s) => {
    const dbsOk = s.dbsStatus === "enhanced_current" || s.dbsStatus === "update_service";
    const trainingOk =
      s.trainingLevel === "level_3_current" ||
      s.trainingLevel === "level_2_current" ||
      s.trainingLevel === "level_1_current";

    return {
      staffId: s.staffId,
      staffName: s.staffName,
      role: s.role,
      dbsStatus: s.dbsStatus,
      trainingLevel: s.trainingLevel,
      isDSL: s.designatedSafeguardingLead,
      isDeputyDSL: s.deputyDSL,
      compliant: dbsOk && trainingOk,
    };
  });
}

// -- Strengths / Areas / Actions ----------------------------------------------

function generateStrengths(
  workforce: WorkforceSafetyResult,
  referral: ReferralQualityResult,
  audit: AuditComplianceResult,
  dsl: DSLOversightResult,
): string[] {
  const strengths: string[] = [];

  if (workforce.enhancedDBSRate >= 100) {
    strengths.push("All staff have current enhanced DBS checks in place");
  }
  if (workforce.currentTrainingRate >= 100) {
    strengths.push("100% of staff have current safeguarding training");
  }
  if (workforce.hasDSL && workforce.hasDeputyDSL) {
    strengths.push("Designated Safeguarding Lead and Deputy DSL both in post");
  }
  if (workforce.saferRecruitmentRate >= 80) {
    strengths.push(`${workforce.saferRecruitmentRate}% of staff trained in safer recruitment`);
  }
  if (workforce.preventTrainedRate >= 80) {
    strengths.push(`Prevent training completed by ${workforce.preventTrainedRate}% of staff`);
  }
  if (referral.totalReferrals > 0 && referral.timelyReferralRate >= 90) {
    strengths.push(`Excellent referral timeliness at ${referral.timelyReferralRate}%`);
  }
  if (referral.totalReferrals > 0 && referral.recordedAppropriatelyRate >= 90) {
    strengths.push(`Safeguarding referrals consistently recorded appropriately (${referral.recordedAppropriatelyRate}%)`);
  }
  if (referral.totalReferrals === 0) {
    strengths.push("No safeguarding referrals required during this period — proactive preventive approach");
  }
  if (audit.totalAudits > 0 && audit.overallCompliantRate >= 90) {
    strengths.push(`Safeguarding audits show ${audit.overallCompliantRate}% overall compliance`);
  }
  if (dsl.totalReviews > 0 && dsl.caseReviewRate >= 90) {
    strengths.push(`DSL reviewed ${dsl.caseReviewRate}% of open cases — strong oversight`);
  }
  if (dsl.totalReviews > 0 && dsl.multiAgencyRate >= 80) {
    strengths.push(`Active multi-agency engagement at ${dsl.multiAgencyRate}%`);
  }

  return strengths;
}

function generateAreasForImprovement(
  workforce: WorkforceSafetyResult,
  referral: ReferralQualityResult,
  audit: AuditComplianceResult,
  dsl: DSLOversightResult,
): string[] {
  const areas: string[] = [];

  if (workforce.totalStaff === 0) {
    areas.push("No staff safeguarding records found — workforce safeguarding data must be recorded");
  }
  if (workforce.expiredDBSCount > 0) {
    areas.push(`${workforce.expiredDBSCount} staff member(s) have expired or missing DBS checks`);
  }
  if (workforce.expiredTrainingCount > 0) {
    areas.push(`${workforce.expiredTrainingCount} staff member(s) have expired or missing safeguarding training`);
  }
  if (!workforce.hasDSL) {
    areas.push("No Designated Safeguarding Lead identified — this is a regulatory requirement");
  }
  if (workforce.hasDSL && !workforce.hasDeputyDSL) {
    areas.push("No Deputy DSL in place — cover arrangements needed for DSL absence");
  }
  if (workforce.saferRecruitmentRate < 50 && workforce.totalStaff > 0) {
    areas.push(`Only ${workforce.saferRecruitmentRate}% of staff trained in safer recruitment`);
  }
  if (referral.totalReferrals > 0 && referral.timelyReferralRate < 80) {
    areas.push(`Referral timeliness at ${referral.timelyReferralRate}% — needs improvement`);
  }
  if (referral.awaitingOutcomeCount > 2) {
    areas.push(`${referral.awaitingOutcomeCount} referrals still awaiting outcome — follow-up needed`);
  }
  if (audit.totalAudits === 0) {
    areas.push("No safeguarding audits completed — regular auditing is essential");
  }
  if (audit.totalAudits > 0 && audit.overallCompliantRate < 80) {
    areas.push(`Safeguarding audit compliance at ${audit.overallCompliantRate}% — action plan required`);
  }
  if (audit.totalAudits > 0 && audit.riskAssessmentsCurrentRate < 100) {
    areas.push(`Risk assessments not current for all children (${audit.riskAssessmentsCurrentRate}%)`);
  }
  if (dsl.totalReviews === 0) {
    areas.push("No DSL oversight reviews recorded — DSL must demonstrate active case oversight");
  }
  if (dsl.totalReviews > 0 && dsl.caseReviewRate < 80) {
    areas.push(`DSL case review coverage at ${dsl.caseReviewRate}% — all open cases should be reviewed`);
  }

  return areas;
}

function generateActions(
  workforce: WorkforceSafetyResult,
  referral: ReferralQualityResult,
  audit: AuditComplianceResult,
  dsl: DSLOversightResult,
  profiles: StaffSafeguardingProfile[],
): string[] {
  const actions: string[] = [];

  if (workforce.expiredDBSCount > 0) {
    const names = profiles
      .filter((p) => p.dbsStatus === "enhanced_expired" || p.dbsStatus === "not_completed")
      .map((p) => p.staffName);
    actions.push(`URGENT: Renew expired DBS checks for ${names.join(", ")}`);
  }
  if (!workforce.hasDSL) {
    actions.push("URGENT: Appoint a Designated Safeguarding Lead immediately — regulatory requirement");
  }
  if (workforce.expiredTrainingCount > 0) {
    const names = profiles
      .filter((p) => p.trainingLevel === "expired" || p.trainingLevel === "not_completed")
      .map((p) => p.staffName);
    actions.push(`URGENT: Complete safeguarding training for ${names.join(", ")}`);
  }

  if (!workforce.hasDeputyDSL && workforce.hasDSL) {
    actions.push("Appoint a Deputy DSL to provide cover during DSL absence");
  }
  if (workforce.saferRecruitmentRate < 100 && workforce.totalStaff > 0) {
    actions.push("Ensure all staff involved in recruitment complete safer recruitment training");
  }
  if (workforce.preventTrainedRate < 100 && workforce.totalStaff > 0) {
    actions.push("Roll out Prevent training to all staff members");
  }
  if (referral.totalReferrals > 0 && referral.timelyReferralRate < 100) {
    actions.push("Review referral processes to ensure all concerns are referred within required timescales");
  }
  if (referral.awaitingOutcomeCount > 0) {
    actions.push(`Follow up on ${referral.awaitingOutcomeCount} referral(s) awaiting outcome`);
  }
  if (audit.totalAudits === 0) {
    actions.push("Schedule quarterly safeguarding audits with documented findings and action plans");
  }
  if (audit.totalAudits > 0 && audit.riskAssessmentsCurrentRate < 100) {
    actions.push("Update risk assessments for all children to ensure they are current");
  }
  if (dsl.totalReviews === 0) {
    actions.push("DSL to implement monthly oversight reviews of all open safeguarding cases");
  }

  return actions;
}

function generateRegulatoryLinks(
  workforce: WorkforceSafetyResult,
  referral: ReferralQualityResult,
): string[] {
  const links: string[] = [
    "CHR 2015 Reg 12 — The protection of children standard: safeguarding arrangements must be effective",
    "CHR 2015 Reg 32 — Fitness of workers: DBS checks, training, and safer recruitment",
    "KCSIE 2024 — Keeping Children Safe in Education: safeguarding training and awareness requirements",
    "SCCIF — Safety of children: effectiveness of safeguarding arrangements",
    "NMS 3 — Safeguarding children: policies, procedures, and practice",
    "Working Together 2023 — Multi-agency safeguarding arrangements and information sharing",
    "UNCRC Article 19 — Protection from all forms of violence, abuse, neglect, and exploitation",
  ];

  if (referral.totalReferrals > 0) {
    links.push("CA 1989 s47 — Duty to investigate where there is reasonable cause for concern");
  }

  if (!workforce.hasDSL) {
    links.push("Statutory guidance requires a Designated Safeguarding Lead to be in post at all times");
  }

  return links;
}

// -- Main Function ------------------------------------------------------------

export function generateSafeguardingOversightIntelligence(
  staff: StaffSafeguardingRecord[],
  referrals: SafeguardingReferral[],
  audits: SafeguardingAudit[],
  dslReviews: DSLOversight[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SafeguardingOversightIntelligence {
  const workforceResult = evaluateWorkforceSafety(staff);
  const referralResult = evaluateReferralQuality(referrals);
  const auditResult = evaluateAuditCompliance(audits);
  const dslResult = evaluateDSLOversight(dslReviews);

  const overallScore = cap(
    workforceResult.overallScore +
      referralResult.overallScore +
      auditResult.overallScore +
      dslResult.overallScore,
    0,
    100,
  );
  const rating = getRating(overallScore);

  const staffProfiles = buildStaffSafeguardingProfiles(staff);

  const strengths = generateStrengths(workforceResult, referralResult, auditResult, dslResult);
  const areasForImprovement = generateAreasForImprovement(workforceResult, referralResult, auditResult, dslResult);
  const actions = generateActions(workforceResult, referralResult, auditResult, dslResult, staffProfiles);
  const regulatoryLinks = generateRegulatoryLinks(workforceResult, referralResult);

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    workforceSafety: workforceResult,
    referralQuality: referralResult,
    auditCompliance: auditResult,
    dslOversight: dslResult,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
