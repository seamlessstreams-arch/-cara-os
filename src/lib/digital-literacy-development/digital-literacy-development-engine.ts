import { below, meets, rate } from "@/lib/metrics/rate";
// Digital Literacy Development Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type SessionType =
  | "online_safety"
  | "coding_skills"
  | "digital_creativity"
  | "research_skills"
  | "social_media_awareness"
  | "cyberbullying_education"
  | "privacy_management"
  | "digital_communication";

export type CompetencyLevel =
  | "advanced"
  | "proficient"
  | "developing"
  | "beginner"
  | "not_assessed";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  online_safety: "Online Safety",
  coding_skills: "Coding Skills",
  digital_creativity: "Digital Creativity",
  research_skills: "Research Skills",
  social_media_awareness: "Social Media Awareness",
  cyberbullying_education: "Cyberbullying Education",
  privacy_management: "Privacy Management",
  digital_communication: "Digital Communication",
};

const COMPETENCY_LEVEL_LABELS: Record<CompetencyLevel, string> = {
  advanced: "Advanced",
  proficient: "Proficient",
  developing: "Developing",
  beginner: "Beginner",
  not_assessed: "Not Assessed",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSessionTypeLabel(v: SessionType): string { return SESSION_TYPE_LABELS[v]; }
export function getCompetencyLevelLabel(v: CompetencyLevel): string { return COMPETENCY_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface DigitalSession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  sessionType: SessionType;
  competencyLevel: CompetencyLevel;
  onlineSafetyDemonstrated: boolean;
  ageAppropriateContent: boolean;
  supervisedAccess: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  progressRecorded: boolean;
}

export interface DigitalPolicy {
  id: string;
  onlineSafetyPolicy: boolean;
  deviceUsageGuidelines: boolean;
  socialMediaPolicy: boolean;
  ageVerificationProtocol: boolean;
  monitoringFramework: boolean;
  incidentResponsePlan: boolean;
  regularReview: boolean;
}

export interface StaffDigitalTraining {
  id: string;
  staffId: string;
  staffName: string;
  onlineSafety: boolean;
  digitalLiteracy: boolean;
  socialMediaAwareness: boolean;
  cyberbullyingResponse: boolean;
  privacyProtection: boolean;
  monitoringSkills: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface DigitalQualityResult {
  overallScore: number;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  competencyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  onlineSafetyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  ageAppropriateRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supervisedAccessRate: number | null;
}

export interface DigitalComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffSupportedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  progressRecordedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  sessionTypeDiversityRatio: number | null;
}

export interface DigitalPolicyResult {
  overallScore: number;
  onlineSafetyPolicy: boolean;
  deviceUsageGuidelines: boolean;
  socialMediaPolicy: boolean;
  ageVerificationProtocol: boolean;
  monitoringFramework: boolean;
  incidentResponsePlan: boolean;
  regularReview: boolean;
}

export interface StaffDigitalReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  onlineSafetyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  digitalLiteracyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  socialMediaAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  cyberbullyingResponseRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  privacyProtectionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  monitoringSkillsRate: number | null;
}

export interface ChildDigitalProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  competencyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  onlineSafetyRate: number | null;
  overallScore: number;
}

export interface DigitalLiteracyDevelopmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  digitalQuality: DigitalQualityResult;
  digitalCompliance: DigitalComplianceResult;
  digitalPolicy: DigitalPolicyResult;
  staffDigitalReadiness: StaffDigitalReadinessResult;
  childProfiles: ChildDigitalProfile[];
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

export function evaluateDigitalQuality(sessions: DigitalSession[]): DigitalQualityResult {
  if (sessions.length === 0) {
    return { overallScore: 0, totalSessions: 0, competencyRate: null, onlineSafetyRate: null, ageAppropriateRate: null, supervisedAccessRate: null };
  }

  const total = sessions.length;
  const competentCount = sessions.filter((s) => s.competencyLevel === "advanced" || s.competencyLevel === "proficient").length;
  const safetyCount = sessions.filter((s) => s.onlineSafetyDemonstrated).length;
  const ageCount = sessions.filter((s) => s.ageAppropriateContent).length;
  const supervisedCount = sessions.filter((s) => s.supervisedAccess).length;

  const competencyRate = rate(competentCount, total);
  const onlineSafetyRate = rate(safetyCount, total);
  const ageAppropriateRate = rate(ageCount, total);
  const supervisedAccessRate = rate(supervisedCount, total);

  const compScore = Math.round(((competencyRate ?? 0) / 100) * 7);
  const safetyScore = Math.round(((onlineSafetyRate ?? 0) / 100) * 6);
  const ageScore = Math.round(((ageAppropriateRate ?? 0) / 100) * 6);
  const supScore = Math.round(((supervisedAccessRate ?? 0) / 100) * 6);

  const overallScore = Math.min(25, compScore + safetyScore + ageScore + supScore);

  return { overallScore, totalSessions: total, competencyRate, onlineSafetyRate, ageAppropriateRate, supervisedAccessRate };
}

export function evaluateDigitalCompliance(sessions: DigitalSession[]): DigitalComplianceResult {
  if (sessions.length === 0) {
    return { overallScore: 0, documentedRate: null, staffSupportedRate: null, progressRecordedRate: null, sessionTypeDiversityRatio: 0 };
  }

  const total = sessions.length;
  const documentedCount = sessions.filter((s) => s.documentedInPlan).length;
  const staffCount = sessions.filter((s) => s.staffSupported).length;
  const progressCount = sessions.filter((s) => s.progressRecorded).length;
  const uniqueTypes = new Set(sessions.map((s) => s.sessionType)).size;
  const diversityRatio = rate(uniqueTypes, 8);

  const documentedRate = rate(documentedCount, total);
  const staffSupportedRate = rate(staffCount, total);
  const progressRecordedRate = rate(progressCount, total);

  const docScore = Math.round(((documentedRate ?? 0) / 100) * 8);
  const staffScore = Math.round(((staffSupportedRate ?? 0) / 100) * 7);
  const progScore = Math.round(((progressRecordedRate ?? 0) / 100) * 5);
  const divScore = Math.round((diversityRatio! / 100) * 5);

  const overallScore = Math.min(25, docScore + staffScore + progScore + divScore);

  return { overallScore, documentedRate, staffSupportedRate, progressRecordedRate, sessionTypeDiversityRatio: diversityRatio };
}

export function evaluateDigitalPolicy(policy: DigitalPolicy | null): DigitalPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      onlineSafetyPolicy: false,
      deviceUsageGuidelines: false,
      socialMediaPolicy: false,
      ageVerificationProtocol: false,
      monitoringFramework: false,
      incidentResponsePlan: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.onlineSafetyPolicy) score += 4;
  if (policy.deviceUsageGuidelines) score += 4;
  if (policy.socialMediaPolicy) score += 4;
  if (policy.ageVerificationProtocol) score += 4;
  if (policy.monitoringFramework) score += 3;
  if (policy.incidentResponsePlan) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    onlineSafetyPolicy: policy.onlineSafetyPolicy,
    deviceUsageGuidelines: policy.deviceUsageGuidelines,
    socialMediaPolicy: policy.socialMediaPolicy,
    ageVerificationProtocol: policy.ageVerificationProtocol,
    monitoringFramework: policy.monitoringFramework,
    incidentResponsePlan: policy.incidentResponsePlan,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffDigitalReadiness(training: StaffDigitalTraining[]): StaffDigitalReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, onlineSafetyRate: null, digitalLiteracyRate: null, socialMediaAwarenessRate: null, cyberbullyingResponseRate: null, privacyProtectionRate: null, monitoringSkillsRate: null };
  }

  const total = training.length;
  const osCount = training.filter((t) => t.onlineSafety).length;
  const dlCount = training.filter((t) => t.digitalLiteracy).length;
  const smCount = training.filter((t) => t.socialMediaAwareness).length;
  const cbCount = training.filter((t) => t.cyberbullyingResponse).length;
  const ppCount = training.filter((t) => t.privacyProtection).length;
  const msCount = training.filter((t) => t.monitoringSkills).length;

  const onlineSafetyRate = rate(osCount, total);
  const digitalLiteracyRate = rate(dlCount, total);
  const socialMediaAwarenessRate = rate(smCount, total);
  const cyberbullyingResponseRate = rate(cbCount, total);
  const privacyProtectionRate = rate(ppCount, total);
  const monitoringSkillsRate = rate(msCount, total);

  const s1 = Math.round(((onlineSafetyRate ?? 0) / 100) * 6);
  const s2 = Math.round(((digitalLiteracyRate ?? 0) / 100) * 5);
  const s3 = Math.round(((socialMediaAwarenessRate ?? 0) / 100) * 5);
  const s4 = Math.round(((cyberbullyingResponseRate ?? 0) / 100) * 4);
  const s5 = Math.round(((privacyProtectionRate ?? 0) / 100) * 3);
  const s6 = Math.round(((monitoringSkillsRate ?? 0) / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, onlineSafetyRate, digitalLiteracyRate, socialMediaAwarenessRate, cyberbullyingResponseRate, privacyProtectionRate, monitoringSkillsRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildDigitalProfiles(sessions: DigitalSession[]): ChildDigitalProfile[] {
  if (sessions.length === 0) return [];

  const grouped = new Map<string, DigitalSession[]>();
  for (const s of sessions) {
    if (!grouped.has(s.childId)) grouped.set(s.childId, []);
    grouped.get(s.childId)!.push(s);
  }

  const profiles: ChildDigitalProfile[] = [];

  for (const [childId, sess] of grouped) {
    const childName = sess[0].childName;
    const total = sess.length;
    const competentCount = sess.filter((s) => s.competencyLevel === "advanced" || s.competencyLevel === "proficient").length;
    const safetyCount = sess.filter((s) => s.onlineSafetyDemonstrated).length;

    const competencyRate = rate(competentCount, total);
    const onlineSafetyRate = rate(safetyCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let compScore = 0;
    if (meets(competencyRate, 80)) compScore = 3;
    else if (meets(competencyRate, 60)) compScore = 2;
    else if (meets(competencyRate, 40)) compScore = 1;

    let safetyScore = 0;
    if (meets(onlineSafetyRate, 80)) safetyScore = 3;
    else if (meets(onlineSafetyRate, 60)) safetyScore = 2;
    else if (meets(onlineSafetyRate, 40)) safetyScore = 1;

    const uniqueTypes = new Set(sess.map((s) => s.sessionType)).size;
    let divBonus = 0;
    if (uniqueTypes >= 4) divBonus = 2;
    else if (uniqueTypes >= 2) divBonus = 1;

    const overallScore = Math.min(10, freqScore + compScore + safetyScore + divBonus);

    profiles.push({ childId, childName, totalSessions: total, competencyRate, onlineSafetyRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateDigitalLiteracyDevelopmentIntelligence(
  sessions: DigitalSession[],
  policy: DigitalPolicy | null,
  training: StaffDigitalTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): DigitalLiteracyDevelopmentIntelligence {
  const digitalQuality = evaluateDigitalQuality(sessions);
  const digitalCompliance = evaluateDigitalCompliance(sessions);
  const digitalPolicy = evaluateDigitalPolicy(policy);
  const staffDigitalReadiness = evaluateStaffDigitalReadiness(training);

  const overallScore = Math.min(100, digitalQuality.overallScore + digitalCompliance.overallScore + digitalPolicy.overallScore + staffDigitalReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildDigitalProfiles(sessions);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (meets(digitalQuality.competencyRate, 80)) strengths.push("Strong digital competency levels — children are demonstrating advanced or proficient skills");
  if (meets(digitalQuality.onlineSafetyRate, 80)) strengths.push("Online safety is consistently demonstrated across digital sessions");
  if (meets(digitalQuality.ageAppropriateRate, 80)) strengths.push("Age-appropriate content use is well managed and evidenced");
  if (meets(digitalCompliance.documentedRate, 80)) strengths.push("Excellent documentation of digital literacy development in care plans");

  if (sessions.length > 0 && below(digitalQuality.competencyRate, 60)) areasForImprovement.push("Digital competency levels need improvement — review skill development programme");
  if (sessions.length > 0 && below(digitalQuality.onlineSafetyRate, 60)) areasForImprovement.push("Online safety not consistently demonstrated — strengthen safety education");
  if (sessions.length > 0 && below(digitalCompliance.progressRecordedRate, 60)) areasForImprovement.push("Progress recording needs improvement — embed recording into session workflow");
  if (sessions.length > 0 && below(digitalQuality.supervisedAccessRate, 60)) areasForImprovement.push("Supervised access rates are low — review supervision arrangements");

  if (sessions.length === 0) actions.push("No digital literacy session records found — develop and implement digital skills programme");
  if (!policy) actions.push("URGENT: No digital literacy policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff digital training recorded — arrange training for all staff");
  if (sessions.length > 0 && below(digitalCompliance.staffSupportedRate, 60)) actions.push("Improve staff support during digital literacy sessions");
  if (sessions.length > 0 && below(digitalQuality.onlineSafetyRate, 60)) actions.push("Strengthen online safety education across all digital activities");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 5 — Engaging with the wider community (digital inclusion)",
    "CHR 2015 Regulation 12 — The protection of children standard (online safety)",
    "SCCIF — Experiences and progress of children and young people",
    "NMS 12 — Contact and access to communications (including digital)",
    "KCSIE 2024 — Online safety and filtering",
    "UNCRC Article 17 — Access to information and media",
    "UK Online Safety Act 2023 — Duties regarding children",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    digitalQuality, digitalCompliance, digitalPolicy, staffDigitalReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
