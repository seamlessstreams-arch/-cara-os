// ══════════════════════════════════════════════════════════════════════════════
// Cara Children's Privacy Intelligence Engine
//
// Deterministic engine for evaluating privacy protections for looked-after
// children — ensuring personal information is safeguarded, dignity is
// maintained, and children have appropriate private space and communication.
//
// Aligned to:
//   - CHR 2015 Reg 10 — The health and wellbeing standard
//   - CHR 2015 Reg 21 — Privacy and access
//   - Data Protection Act 2018 / UK GDPR
//   - Human Rights Act 1998 Art 8 — Right to respect for private life
//   - NMS 3 — Healthcare and wellbeing (privacy in care)
//   - SCCIF — Overall experiences: privacy and dignity
//   - Quality Standards 2015 — Standard 1 (child-centred care)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type PrivacyCategory =
  | "personal_space"
  | "confidentiality"
  | "dignity_care"
  | "data_protection"
  | "communication_privacy"
  | "medical_privacy"
  | "family_contact_privacy"
  | "digital_privacy";

export type PrivacyOutcome =
  | "fully_respected"
  | "minor_breach"
  | "significant_breach"
  | "privacy_violation"
  | "not_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface PrivacyRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: PrivacyCategory;
  outcome: PrivacyOutcome;
  personalSpaceRespected: boolean;
  confidentialityMaintained: boolean;
  dignityPreserved: boolean;
  consentObtained: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface PrivacyPolicy {
  privacyPolicy: boolean;
  confidentialityProcedure: boolean;
  dataProtectionPolicy: boolean;
  dignityInCarePolicy: boolean;
  consentFramework: boolean;
  digitalPrivacyPolicy: boolean;
  informationSharingProtocol: boolean;
}

export interface StaffPrivacyTraining {
  staffId: string;
  dataProtectionTraining: boolean;
  confidentialityAwareness: boolean;
  dignityInCareTraining: boolean;
  consentPractice: boolean;
  digitalPrivacySkills: boolean;
  informationSharingKnowledge: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface PrivacyQualityResult {
  overallScore: number;
  totalRecords: number;
  personalSpaceRespectedRate: number;
  confidentialityMaintainedRate: number;
  dignityPreservedRate: number;
  consentObtainedRate: number;
}

export interface PrivacyComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  confidentialityMaintainedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface PrivacyPolicyResult {
  overallScore: number;
  privacyPolicy: boolean;
  confidentialityProcedure: boolean;
  dataProtectionPolicy: boolean;
  dignityInCarePolicy: boolean;
  consentFramework: boolean;
  digitalPrivacyPolicy: boolean;
  informationSharingProtocol: boolean;
}

export interface StaffPrivacyReadinessResult {
  overallScore: number;
  totalStaff: number;
  dataProtectionTrainingRate: number;
  confidentialityAwarenessRate: number;
  dignityInCareTrainingRate: number;
  consentPracticeRate: number;
  digitalPrivacySkillsRate: number;
  informationSharingKnowledgeRate: number;
}

export interface ChildPrivacyProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  personalSpaceRespectedRate: number;
  confidentialityMaintainedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface PrivacyIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  privacyQuality: PrivacyQualityResult;
  privacyCompliance: PrivacyComplianceResult;
  privacyPolicy: PrivacyPolicyResult;
  staffReadiness: StaffPrivacyReadinessResult;
  childProfiles: ChildPrivacyProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

export function getPrivacyCategoryLabel(category: PrivacyCategory): string {
  const labels: Record<PrivacyCategory, string> = {
    personal_space: "Personal Space",
    confidentiality: "Confidentiality",
    dignity_care: "Dignity in Care",
    data_protection: "Data Protection",
    communication_privacy: "Communication Privacy",
    medical_privacy: "Medical Privacy",
    family_contact_privacy: "Family Contact Privacy",
    digital_privacy: "Digital Privacy",
  };
  return labels[category] ?? category;
}

export function getPrivacyOutcomeLabel(outcome: PrivacyOutcome): string {
  const labels: Record<PrivacyOutcome, string> = {
    fully_respected: "Fully Respected",
    minor_breach: "Minor Breach",
    significant_breach: "Significant Breach",
    privacy_violation: "Privacy Violation",
    not_applicable: "Not Applicable",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

// ── Evaluator 1: Privacy Quality (0-25) ──────────────────────────────────

export function evaluatePrivacyQuality(records: PrivacyRecord[]): PrivacyQualityResult {
  const total = records.length;
  if (total === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      personalSpaceRespectedRate: 0,
      confidentialityMaintainedRate: 0,
      dignityPreservedRate: 0,
      consentObtainedRate: 0,
    };
  }

  const personalSpaceRespectedRate = pct(records.filter((r) => r.personalSpaceRespected).length, total);
  const confidentialityMaintainedRate = pct(records.filter((r) => r.confidentialityMaintained).length, total);
  const dignityPreservedRate = pct(records.filter((r) => r.dignityPreserved).length, total);
  const consentObtainedRate = pct(records.filter((r) => r.consentObtained).length, total);

  // Weighted: personalSpaceRespectedRate(7) + confidentialityMaintainedRate(6) + dignityPreservedRate(6) + consentObtainedRate(6) = 25
  let score = 0;
  score += (personalSpaceRespectedRate / 100) * 7;
  score += (confidentialityMaintainedRate / 100) * 6;
  score += (dignityPreservedRate / 100) * 6;
  score += (consentObtainedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalRecords: total,
    personalSpaceRespectedRate,
    confidentialityMaintainedRate,
    dignityPreservedRate,
    consentObtainedRate,
  };
}

// ── Evaluator 2: Privacy Compliance (0-25) ───────────────────────────────

export function evaluatePrivacyCompliance(records: PrivacyRecord[]): PrivacyComplianceResult {
  const total = records.length;
  if (total === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      documentationRate: 0,
      timelyRecordingRate: 0,
      confidentialityMaintainedRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
    };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, total);
  const confidentialityMaintainedRate = pct(records.filter((r) => r.confidentialityMaintained).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  // Weighted: documentationRate(8) + timelyRecordingRate(7) + confidentialityMaintainedRate(5) + categoryDiversityRatio(5) = 25
  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (confidentialityMaintainedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalRecords: total,
    documentationRate,
    timelyRecordingRate,
    confidentialityMaintainedRate,
    categoryDiversityRatio,
    uniqueCategories,
  };
}

// ── Evaluator 3: Privacy Policy (0-25) ───────────────────────────────────

export function evaluatePrivacyPolicy(policy: PrivacyPolicy | null): PrivacyPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      privacyPolicy: false,
      confidentialityProcedure: false,
      dataProtectionPolicy: false,
      dignityInCarePolicy: false,
      consentFramework: false,
      digitalPrivacyPolicy: false,
      informationSharingProtocol: false,
    };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.privacyPolicy) score += 4;
  if (policy.confidentialityProcedure) score += 4;
  if (policy.dataProtectionPolicy) score += 4;
  if (policy.dignityInCarePolicy) score += 4;
  if (policy.consentFramework) score += 3;
  if (policy.digitalPrivacyPolicy) score += 3;
  if (policy.informationSharingProtocol) score += 3;

  return {
    overallScore: score,
    privacyPolicy: policy.privacyPolicy,
    confidentialityProcedure: policy.confidentialityProcedure,
    dataProtectionPolicy: policy.dataProtectionPolicy,
    dignityInCarePolicy: policy.dignityInCarePolicy,
    consentFramework: policy.consentFramework,
    digitalPrivacyPolicy: policy.digitalPrivacyPolicy,
    informationSharingProtocol: policy.informationSharingProtocol,
  };
}

// ── Evaluator 4: Staff Privacy Readiness (0-25) ──────────────────────────

export function evaluateStaffPrivacyReadiness(staff: StaffPrivacyTraining[]): StaffPrivacyReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      dataProtectionTrainingRate: 0,
      confidentialityAwarenessRate: 0,
      dignityInCareTrainingRate: 0,
      consentPracticeRate: 0,
      digitalPrivacySkillsRate: 0,
      informationSharingKnowledgeRate: 0,
    };
  }

  const dataProtectionTrainingRate = pct(staff.filter((s) => s.dataProtectionTraining).length, count);
  const confidentialityAwarenessRate = pct(staff.filter((s) => s.confidentialityAwareness).length, count);
  const dignityInCareTrainingRate = pct(staff.filter((s) => s.dignityInCareTraining).length, count);
  const consentPracticeRate = pct(staff.filter((s) => s.consentPractice).length, count);
  const digitalPrivacySkillsRate = pct(staff.filter((s) => s.digitalPrivacySkills).length, count);
  const informationSharingKnowledgeRate = pct(staff.filter((s) => s.informationSharingKnowledge).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (dataProtectionTrainingRate / 100) * 6;
  score += (confidentialityAwarenessRate / 100) * 5;
  score += (dignityInCareTrainingRate / 100) * 5;
  score += (consentPracticeRate / 100) * 4;
  score += (digitalPrivacySkillsRate / 100) * 3;
  score += (informationSharingKnowledgeRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalStaff: count,
    dataProtectionTrainingRate,
    confidentialityAwarenessRate,
    dignityInCareTrainingRate,
    consentPracticeRate,
    digitalPrivacySkillsRate,
    informationSharingKnowledgeRate,
  };
}

// ── Child Privacy Profiles (0-10) ────────────────────────────────────────

export function buildChildPrivacyProfiles(records: PrivacyRecord[]): ChildPrivacyProfile[] {
  const grouped = new Map<string, PrivacyRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildPrivacyProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const personalSpaceRespectedRate = pct(recs.filter((r) => r.personalSpaceRespected).length, totalRecords);
    const confidentialityMaintainedRate = pct(recs.filter((r) => r.confidentialityMaintained).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10 -> 2, >=5 -> 1] + rate1 personalSpaceRespectedRate [>=80 -> 3, >=60 -> 2, >=40 -> 1]
    //   + rate2 confidentialityMaintainedRate [same] + diversity categoriesCovered [>=4 -> 2, >=2 -> 1], capped at 10
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (personalSpaceRespectedRate >= 80) score += 3;
    else if (personalSpaceRespectedRate >= 60) score += 2;
    else if (personalSpaceRespectedRate >= 40) score += 1;

    if (confidentialityMaintainedRate >= 80) score += 3;
    else if (confidentialityMaintainedRate >= 60) score += 2;
    else if (confidentialityMaintainedRate >= 40) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      personalSpaceRespectedRate,
      confidentialityMaintainedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ────────────────────────────────────────

export function generatePrivacyIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: PrivacyRecord[];
  policy: PrivacyPolicy | null;
  staff: StaffPrivacyTraining[];
}): PrivacyIntelligence {
  const { homeId, periodStart, periodEnd, policy, staff } = input;

  // Filter records to period
  const startMs = new Date(periodStart).getTime();
  const endMs = new Date(periodEnd).getTime();
  const records = input.records.filter((r) => {
    const d = new Date(r.date).getTime();
    return d >= startMs && d <= endMs;
  });

  const privacyQuality = evaluatePrivacyQuality(records);
  const privacyCompliance = evaluatePrivacyCompliance(records);
  const privacyPolicy = evaluatePrivacyPolicy(policy);
  const staffReadiness = evaluateStaffPrivacyReadiness(staff);
  const childProfiles = buildChildPrivacyProfiles(records);

  const overallScore = Math.min(
    100,
    privacyQuality.overallScore +
      privacyCompliance.overallScore +
      privacyPolicy.overallScore +
      staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (privacyQuality.personalSpaceRespectedRate >= 80) strengths.push("Personal space is consistently respected across the home");
  if (privacyQuality.confidentialityMaintainedRate >= 80) strengths.push("Confidentiality is well maintained in all privacy interactions");
  if (privacyQuality.dignityPreservedRate >= 80) strengths.push("Children's dignity is consistently preserved in care practices");
  if (privacyQuality.consentObtainedRate >= 80) strengths.push("Consent is routinely obtained before privacy-related decisions");
  if (privacyCompliance.documentationRate >= 80) strengths.push("Privacy records are thoroughly documented");
  if (privacyCompliance.timelyRecordingRate >= 80) strengths.push("Privacy events are recorded in a timely manner");
  if (staffReadiness.dataProtectionTrainingRate >= 80) strengths.push("Staff are well trained in data protection requirements");
  if (staffReadiness.confidentialityAwarenessRate >= 80) strengths.push("Strong confidentiality awareness across the team");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (privacyQuality.personalSpaceRespectedRate < 60) areasForImprovement.push("Personal space is not being consistently respected");
  if (privacyQuality.confidentialityMaintainedRate < 60) areasForImprovement.push("Confidentiality is not adequately maintained");
  if (privacyQuality.dignityPreservedRate < 60) areasForImprovement.push("Children's dignity is not consistently preserved");
  if (privacyQuality.consentObtainedRate < 60) areasForImprovement.push("Consent is not routinely obtained for privacy-related decisions");
  if (privacyCompliance.documentationRate < 60) areasForImprovement.push("Privacy documentation is incomplete or inconsistent");
  if (privacyCompliance.timelyRecordingRate < 60) areasForImprovement.push("Privacy records are not being completed promptly");
  if (staffReadiness.dataProtectionTrainingRate < 60) areasForImprovement.push("Staff need more training in data protection");
  if (staffReadiness.confidentialityAwarenessRate < 60) areasForImprovement.push("Staff confidentiality awareness requires development");

  // Actions
  const actions: string[] = [];
  if (privacyPolicy.overallScore === 0) actions.push("URGENT: Establish privacy and data protection policies — CHR 2015 Reg 21 requires documented privacy standards");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide privacy and data protection training to all staff — GDPR and Reg 21 compliance depends on skilled practitioners");
  if (privacyQuality.personalSpaceRespectedRate < 50) actions.push("Implement structured personal space protocols for all children — Reg 21 requires respect for privacy");
  if (privacyQuality.confidentialityMaintainedRate < 50) actions.push("Review and strengthen confidentiality procedures — information must be shared on a need-to-know basis");
  if (privacyCompliance.documentationRate < 50) actions.push("Improve privacy incident documentation — all privacy events must be fully recorded");
  if (privacyCompliance.timelyRecordingRate < 50) actions.push("Review recording timescales — privacy records should be completed within 24 hours");
  if (privacyQuality.consentObtainedRate < 50) actions.push("Ensure consent is obtained before privacy-impacting decisions — Human Rights Act 1998 Art 8");
  if (staffReadiness.dignityInCareTrainingRate < 50) actions.push("Provide dignity-in-care training — children's dignity must be preserved at all times");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and wellbeing standard",
    "CHR 2015 Reg 21 — Privacy and access",
    "Data Protection Act 2018 / UK GDPR",
    "Human Rights Act 1998 Art 8 — Right to respect for private life",
    "NMS 3 — Healthcare and wellbeing (privacy in care)",
    "SCCIF — Overall experiences: privacy and dignity",
    "Quality Standards 2015 — Standard 1 (child-centred care)",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    privacyQuality,
    privacyCompliance,
    privacyPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
