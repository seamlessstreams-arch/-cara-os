import { below, meets, rate } from "@/lib/metrics/rate";
// Safeguarding Referral Quality Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type ReferralType =
  | "section_47"
  | "section_17"
  | "lado"
  | "police_referral"
  | "multi_agency"
  | "early_help"
  | "internal_concern"
  | "external_disclosure";

export type ReferralOutcome =
  | "appropriate_action"
  | "investigation_opened"
  | "no_further_action"
  | "escalated"
  | "pending";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const REFERRAL_TYPE_LABELS: Record<ReferralType, string> = {
  section_47: "Section 47 Enquiry",
  section_17: "Section 17 Assessment",
  lado: "LADO Referral",
  police_referral: "Police Referral",
  multi_agency: "Multi-Agency Referral",
  early_help: "Early Help Assessment",
  internal_concern: "Internal Concern",
  external_disclosure: "External Disclosure",
};

const REFERRAL_OUTCOME_LABELS: Record<ReferralOutcome, string> = {
  appropriate_action: "Appropriate Action",
  investigation_opened: "Investigation Opened",
  no_further_action: "No Further Action",
  escalated: "Escalated",
  pending: "Pending",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getReferralTypeLabel(v: ReferralType): string { return REFERRAL_TYPE_LABELS[v]; }
export function getReferralOutcomeLabel(v: ReferralOutcome): string { return REFERRAL_OUTCOME_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface SafeguardingReferral {
  id: string;
  childId: string;
  childName: string;
  referralDate: string;
  referralType: ReferralType;
  referralOutcome: ReferralOutcome;
  timelyResponse: boolean;
  multiAgencyEngaged: boolean;
  childInformed: boolean;
  documentedInRecord: boolean;
  managementOversight: boolean;
  lessonsLearned: boolean;
}

export interface SafeguardingPolicy {
  id: string;
  safeguardingProcedure: boolean;
  referralThresholds: boolean;
  multiAgencyProtocol: boolean;
  whistleblowingPolicy: boolean;
  escalationPathway: boolean;
  learningFromCases: boolean;
  regularReview: boolean;
}

export interface StaffSafeguardingTraining {
  id: string;
  staffId: string;
  staffName: string;
  safeguardingLevel3: boolean;
  referralProcesses: boolean;
  multiAgencyWorking: boolean;
  recognisingAbuse: boolean;
  recordKeeping: boolean;
  whistleblowing: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface ReferralQualityResult {
  overallScore: number;
  totalReferrals: number;
  /** null when the population is empty — nothing measured, not 0%. */
  appropriateOutcomeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyResponseRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multiAgencyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childInformedRate: number | null;
}

export interface ReferralComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  managementOversightRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  lessonsLearnedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  referralTypeDiversityRatio: number | null;
}

export interface SafeguardingPolicyResult {
  overallScore: number;
  safeguardingProcedure: boolean;
  referralThresholds: boolean;
  multiAgencyProtocol: boolean;
  whistleblowingPolicy: boolean;
  escalationPathway: boolean;
  learningFromCases: boolean;
  regularReview: boolean;
}

export interface StaffSafeguardingReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingLevel3Rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  referralProcessesRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multiAgencyWorkingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recognisingAbuseRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordKeepingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  whistleblowingRate: number | null;
}

export interface ChildSafeguardingProfile {
  childId: string;
  childName: string;
  totalReferrals: number;
  /** null when the population is empty — nothing measured, not 0%. */
  appropriateOutcomeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyResponseRate: number | null;
  overallScore: number;
}

export interface SafeguardingReferralQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  referralQuality: ReferralQualityResult;
  referralCompliance: ReferralComplianceResult;
  safeguardingPolicy: SafeguardingPolicyResult;
  staffSafeguardingReadiness: StaffSafeguardingReadinessResult;
  childProfiles: ChildSafeguardingProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluators ───────────────────────────────────────────────────────────────

export function evaluateReferralQuality(referrals: SafeguardingReferral[]): ReferralQualityResult {
  if (referrals.length === 0) {
    return { overallScore: 0, totalReferrals: 0, appropriateOutcomeRate: null, timelyResponseRate: null, multiAgencyRate: null, childInformedRate: null };
  }

  const total = referrals.length;
  const appropriateCount = referrals.filter((r) => r.referralOutcome === "appropriate_action" || r.referralOutcome === "investigation_opened").length;
  const timelyCount = referrals.filter((r) => r.timelyResponse).length;
  const multiAgencyCount = referrals.filter((r) => r.multiAgencyEngaged).length;
  const informedCount = referrals.filter((r) => r.childInformed).length;

  const appropriateOutcomeRate = rate(appropriateCount, total);
  const timelyResponseRate = rate(timelyCount, total);
  const multiAgencyRate = rate(multiAgencyCount, total);
  const childInformedRate = rate(informedCount, total);

  const appScore = Math.round(((appropriateOutcomeRate ?? 0) / 100) * 7);
  const timScore = Math.round(((timelyResponseRate ?? 0) / 100) * 6);
  const maScore = Math.round(((multiAgencyRate ?? 0) / 100) * 6);
  const infScore = Math.round(((childInformedRate ?? 0) / 100) * 6);

  const overallScore = Math.min(25, appScore + timScore + maScore + infScore);

  return { overallScore, totalReferrals: total, appropriateOutcomeRate, timelyResponseRate, multiAgencyRate, childInformedRate };
}

export function evaluateReferralCompliance(referrals: SafeguardingReferral[]): ReferralComplianceResult {
  if (referrals.length === 0) {
    return { overallScore: 0, documentedRate: null, managementOversightRate: null, lessonsLearnedRate: null, referralTypeDiversityRatio: 0 };
  }

  const total = referrals.length;
  const documentedCount = referrals.filter((r) => r.documentedInRecord).length;
  const oversightCount = referrals.filter((r) => r.managementOversight).length;
  const lessonsCount = referrals.filter((r) => r.lessonsLearned).length;
  const uniqueTypes = new Set(referrals.map((r) => r.referralType)).size;
  const diversityRatio = rate(uniqueTypes, 8);

  const documentedRate = rate(documentedCount, total);
  const managementOversightRate = rate(oversightCount, total);
  const lessonsLearnedRate = rate(lessonsCount, total);

  const docScore = Math.round(((documentedRate ?? 0) / 100) * 8);
  const ovScore = Math.round(((managementOversightRate ?? 0) / 100) * 7);
  const lesScore = Math.round(((lessonsLearnedRate ?? 0) / 100) * 5);
  const divScore = Math.round((diversityRatio! / 100) * 5);

  const overallScore = Math.min(25, docScore + ovScore + lesScore + divScore);

  return { overallScore, documentedRate, managementOversightRate, lessonsLearnedRate, referralTypeDiversityRatio: diversityRatio };
}

export function evaluateSafeguardingPolicy(policy: SafeguardingPolicy | null): SafeguardingPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      safeguardingProcedure: false,
      referralThresholds: false,
      multiAgencyProtocol: false,
      whistleblowingPolicy: false,
      escalationPathway: false,
      learningFromCases: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.safeguardingProcedure) score += 4;
  if (policy.referralThresholds) score += 4;
  if (policy.multiAgencyProtocol) score += 4;
  if (policy.whistleblowingPolicy) score += 4;
  if (policy.escalationPathway) score += 3;
  if (policy.learningFromCases) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    safeguardingProcedure: policy.safeguardingProcedure,
    referralThresholds: policy.referralThresholds,
    multiAgencyProtocol: policy.multiAgencyProtocol,
    whistleblowingPolicy: policy.whistleblowingPolicy,
    escalationPathway: policy.escalationPathway,
    learningFromCases: policy.learningFromCases,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffSafeguardingReadiness(training: StaffSafeguardingTraining[]): StaffSafeguardingReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, safeguardingLevel3Rate: null, referralProcessesRate: null, multiAgencyWorkingRate: null, recognisingAbuseRate: null, recordKeepingRate: null, whistleblowingRate: null };
  }

  const total = training.length;
  const sg3Count = training.filter((t) => t.safeguardingLevel3).length;
  const rpCount = training.filter((t) => t.referralProcesses).length;
  const maCount = training.filter((t) => t.multiAgencyWorking).length;
  const raCount = training.filter((t) => t.recognisingAbuse).length;
  const rkCount = training.filter((t) => t.recordKeeping).length;
  const wbCount = training.filter((t) => t.whistleblowing).length;

  const safeguardingLevel3Rate = rate(sg3Count, total);
  const referralProcessesRate = rate(rpCount, total);
  const multiAgencyWorkingRate = rate(maCount, total);
  const recognisingAbuseRate = rate(raCount, total);
  const recordKeepingRate = rate(rkCount, total);
  const whistleblowingRate = rate(wbCount, total);

  const s1 = Math.round(((safeguardingLevel3Rate ?? 0) / 100) * 6);
  const s2 = Math.round(((referralProcessesRate ?? 0) / 100) * 5);
  const s3 = Math.round(((multiAgencyWorkingRate ?? 0) / 100) * 5);
  const s4 = Math.round(((recognisingAbuseRate ?? 0) / 100) * 4);
  const s5 = Math.round(((recordKeepingRate ?? 0) / 100) * 3);
  const s6 = Math.round(((whistleblowingRate ?? 0) / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, safeguardingLevel3Rate, referralProcessesRate, multiAgencyWorkingRate, recognisingAbuseRate, recordKeepingRate, whistleblowingRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildSafeguardingProfiles(referrals: SafeguardingReferral[]): ChildSafeguardingProfile[] {
  if (referrals.length === 0) return [];

  const grouped = new Map<string, SafeguardingReferral[]>();
  for (const r of referrals) {
    if (!grouped.has(r.childId)) grouped.set(r.childId, []);
    grouped.get(r.childId)!.push(r);
  }

  const profiles: ChildSafeguardingProfile[] = [];

  for (const [childId, refs] of grouped) {
    const childName = refs[0].childName;
    const total = refs.length;
    const appropriateCount = refs.filter((r) => r.referralOutcome === "appropriate_action" || r.referralOutcome === "investigation_opened").length;
    const timelyCount = refs.filter((r) => r.timelyResponse).length;

    const appropriateOutcomeRate = rate(appropriateCount, total);
    const timelyResponseRate = rate(timelyCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let appScore = 0;
    if (meets(appropriateOutcomeRate, 80)) appScore = 3;
    else if (meets(appropriateOutcomeRate, 60)) appScore = 2;
    else if (meets(appropriateOutcomeRate, 40)) appScore = 1;

    let timScore = 0;
    if (meets(timelyResponseRate, 80)) timScore = 3;
    else if (meets(timelyResponseRate, 60)) timScore = 2;
    else if (meets(timelyResponseRate, 40)) timScore = 1;

    const uniqueTypes = new Set(refs.map((r) => r.referralType)).size;
    let divScore = 0;
    if (uniqueTypes >= 4) divScore = 2;
    else if (uniqueTypes >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + appScore + timScore + divScore);

    profiles.push({ childId, childName, totalReferrals: total, appropriateOutcomeRate, timelyResponseRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateSafeguardingReferralQualityIntelligence(
  referrals: SafeguardingReferral[],
  policy: SafeguardingPolicy | null,
  training: StaffSafeguardingTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SafeguardingReferralQualityIntelligence {
  const referralQuality = evaluateReferralQuality(referrals);
  const referralCompliance = evaluateReferralCompliance(referrals);
  const safeguardingPolicy = evaluateSafeguardingPolicy(policy);
  const staffSafeguardingReadiness = evaluateStaffSafeguardingReadiness(training);

  const overallScore = Math.min(100, referralQuality.overallScore + referralCompliance.overallScore + safeguardingPolicy.overallScore + staffSafeguardingReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildSafeguardingProfiles(referrals);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (meets(referralQuality.appropriateOutcomeRate, 80)) strengths.push("Strong safeguarding referral outcomes — referrals consistently result in appropriate action");
  if (meets(referralQuality.timelyResponseRate, 80)) strengths.push("Timely responses to safeguarding concerns are consistently achieved");
  if (meets(referralQuality.multiAgencyRate, 80)) strengths.push("Multi-agency engagement is strong across safeguarding referrals");
  if (meets(referralCompliance.documentedRate, 80)) strengths.push("Excellent documentation of safeguarding referrals and outcomes");

  if (referrals.length > 0 && below(referralQuality.appropriateOutcomeRate, 60)) areasForImprovement.push("Referral outcomes need improvement — review threshold application and referral quality");
  if (referrals.length > 0 && below(referralQuality.timelyResponseRate, 60)) areasForImprovement.push("Timeliness of safeguarding responses needs improvement — review escalation processes");
  if (referrals.length > 0 && below(referralQuality.childInformedRate, 60)) areasForImprovement.push("Children not consistently informed about safeguarding processes — embed participation");
  if (referrals.length > 0 && below(referralCompliance.managementOversightRate, 60)) areasForImprovement.push("Management oversight of referrals needs strengthening");

  if (referrals.length === 0) actions.push("No safeguarding referral records found — ensure all concerns are recorded and tracked");
  if (!policy) actions.push("URGENT: No safeguarding policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff safeguarding training recorded — arrange training for all staff");
  if (referrals.length > 0 && below(referralCompliance.lessonsLearnedRate, 60)) actions.push("Strengthen learning from safeguarding cases and referral outcomes");
  if (referrals.length > 0 && below(referralQuality.multiAgencyRate, 60)) actions.push("Improve multi-agency engagement in safeguarding referrals");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 12 — The protection of children standard",
    "CHR 2015 Regulation 13 — Leadership and management",
    "SCCIF — Safety of children and young people",
    "NMS 5 — Safeguarding: child protection",
    "Children Act 1989 — Section 47 and Section 17",
    "Working Together to Safeguard Children 2023",
    "Keeping Children Safe in Education 2024",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    referralQuality, referralCompliance, safeguardingPolicy, staffSafeguardingReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
