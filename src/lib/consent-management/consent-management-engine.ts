/* ──────────────────────────────────────────────────────────────
   Consent Management Intelligence Engine

   Pure deterministic engine — no AI, no external calls.
   Analyses how well a children's home manages consent processes:
     - Quality of consent records (obtained, documented, child views)
     - Compliance with consent procedures (parent consultation, reviews)
     - Policy framework robustness
     - Staff readiness to manage consent lawfully

   Regulatory basis:
     CHR 2015 Reg 20 — delegated authority
     Children Act 1989 s33(3) — parental responsibility
     Gillick v West Norfolk [1986] — competence to consent
     Mental Capacity Act 2005 — capacity assessment principles
     UK GDPR / DPA 2018 — data consent
     UNCRC Article 12 — right to be heard
     SCCIF — social care common inspection framework
   ────────────────────────────────────────────────────────────── */

// ── Type unions ─────────────────────────────────────────────────────────────

export type ConsentCategory =
  | "medical_treatment"
  | "dental_treatment"
  | "photography"
  | "social_media"
  | "educational_trips"
  | "overnight_stays"
  | "data_sharing"
  | "therapeutic_intervention";

export type ConsentStatus =
  | "obtained"
  | "pending"
  | "refused"
  | "expired"
  | "not_required";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input interfaces ────────────────────────────────────────────────────────

export interface ConsentRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string;
  category: ConsentCategory;
  status: ConsentStatus;
  childViewsSought: boolean;
  consentDocumented: boolean;
  expiryTracked: boolean;
  parentCarerConsulted: boolean;
  staffRecorded: boolean;
  reviewScheduled: boolean;
}

export interface ConsentPolicy {
  id: string;
  consentFramework: boolean;
  informedConsentGuidance: boolean;
  capacityAssessmentProtocol: boolean;
  gillikCompetenceProcess: boolean;
  consentRefusalProcess: boolean;
  dataConsentProtocol: boolean;
  regularReview: boolean;
}

export interface StaffConsentTraining {
  id: string;
  staffId: string;
  staffName: string;
  consentLawUnderstanding: boolean;
  capacityAssessment: boolean;
  gillikCompetence: boolean;
  documentationSkills: boolean;
  childParticipation: boolean;
  escalationProcess: boolean;
}

// ── Result interfaces ───────────────────────────────────────────────────────

export interface ConsentQualityResult {
  obtainedRate: number;
  childViewsRate: number;
  documentedRate: number;
  expiryTrackedRate: number;
  overallScore: number;
}

export interface ConsentComplianceResult {
  parentConsultedRate: number;
  staffRecordedRate: number;
  reviewScheduledRate: number;
  categoryDiversityRatio: number;
  overallScore: number;
}

export interface ConsentPolicyResult {
  consentFramework: boolean;
  informedConsentGuidance: boolean;
  capacityAssessmentProtocol: boolean;
  gillikCompetenceProcess: boolean;
  consentRefusalProcess: boolean;
  dataConsentProtocol: boolean;
  regularReview: boolean;
  overallScore: number;
}

export interface StaffConsentReadinessResult {
  consentLawRate: number;
  capacityAssessmentRate: number;
  gillikCompetenceRate: number;
  documentationSkillsRate: number;
  childParticipationRate: number;
  escalationProcessRate: number;
  overallScore: number;
}

export interface ChildConsentProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  obtainedRate: number;
  childViewsRate: number;
  uniqueCategories: number;
  overallScore: number;
}

export interface ConsentManagementIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  consentQuality: ConsentQualityResult;
  consentCompliance: ConsentComplianceResult;
  consentPolicy: ConsentPolicyResult;
  staffReadiness: StaffConsentReadinessResult;
  childProfiles: ChildConsentProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Label maps & getters ────────────────────────────────────────────────────

const consentCategoryLabels: Record<ConsentCategory, string> = {
  medical_treatment: "Medical Treatment",
  dental_treatment: "Dental Treatment",
  photography: "Photography",
  social_media: "Social Media",
  educational_trips: "Educational Trips",
  overnight_stays: "Overnight Stays",
  data_sharing: "Data Sharing",
  therapeutic_intervention: "Therapeutic Intervention",
};

export function getConsentCategoryLabel(c: ConsentCategory): string {
  return consentCategoryLabels[c] ?? c;
}

const consentStatusLabels: Record<ConsentStatus, string> = {
  obtained: "Obtained",
  pending: "Pending",
  refused: "Refused",
  expired: "Expired",
  not_required: "Not Required",
};

export function getConsentStatusLabel(s: ConsentStatus): string {
  return consentStatusLabels[s] ?? s;
}

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// ── Evaluator 1: Consent Quality (0–25) ─────────────────────────────────────

export function evaluateConsentQuality(records: ConsentRecord[]): ConsentQualityResult {
  if (records.length === 0) {
    return { obtainedRate: 0, childViewsRate: 0, documentedRate: 0, expiryTrackedRate: 0, overallScore: 0 };
  }

  const obtained = records.filter((r) => r.status === "obtained").length;
  const childViews = records.filter((r) => r.childViewsSought).length;
  const documented = records.filter((r) => r.consentDocumented).length;
  const expiryTracked = records.filter((r) => r.expiryTracked).length;

  const obtainedRate = pct(obtained, records.length);
  const childViewsRate = pct(childViews, records.length);
  const documentedRate = pct(documented, records.length);
  const expiryTrackedRate = pct(expiryTracked, records.length);

  const raw =
    (obtainedRate / 100) * 7 +
    (childViewsRate / 100) * 6 +
    (documentedRate / 100) * 6 +
    (expiryTrackedRate / 100) * 6;

  const overallScore = Math.min(Math.round(raw * 10) / 10, 25);

  return { obtainedRate, childViewsRate, documentedRate, expiryTrackedRate, overallScore };
}

// ── Evaluator 2: Consent Compliance (0–25) ──────────────────────────────────

export function evaluateConsentCompliance(records: ConsentRecord[]): ConsentComplianceResult {
  if (records.length === 0) {
    return { parentConsultedRate: 0, staffRecordedRate: 0, reviewScheduledRate: 0, categoryDiversityRatio: 0, overallScore: 0 };
  }

  const parentConsulted = records.filter((r) => r.parentCarerConsulted).length;
  const staffRecorded = records.filter((r) => r.staffRecorded).length;
  const reviewScheduled = records.filter((r) => r.reviewScheduled).length;
  const uniqueCategories = new Set(records.map((r) => r.category)).size;

  const parentConsultedRate = pct(parentConsulted, records.length);
  const staffRecordedRate = pct(staffRecorded, records.length);
  const reviewScheduledRate = pct(reviewScheduled, records.length);
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  const raw =
    (parentConsultedRate / 100) * 8 +
    (staffRecordedRate / 100) * 7 +
    (reviewScheduledRate / 100) * 5 +
    Math.min(categoryDiversityRatio, 1) * 5;

  const overallScore = Math.min(Math.round(raw * 10) / 10, 25);

  return { parentConsultedRate, staffRecordedRate, reviewScheduledRate, categoryDiversityRatio, overallScore };
}

// ── Evaluator 3: Consent Policy (0–25) ──────────────────────────────────────

export function evaluateConsentPolicy(policy: ConsentPolicy | null): ConsentPolicyResult {
  if (!policy) {
    return {
      consentFramework: false,
      informedConsentGuidance: false,
      capacityAssessmentProtocol: false,
      gillikCompetenceProcess: false,
      consentRefusalProcess: false,
      dataConsentProtocol: false,
      regularReview: false,
      overallScore: 0,
    };
  }

  let score = 0;
  if (policy.consentFramework) score += 4;
  if (policy.informedConsentGuidance) score += 4;
  if (policy.capacityAssessmentProtocol) score += 4;
  if (policy.gillikCompetenceProcess) score += 4;
  if (policy.consentRefusalProcess) score += 3;
  if (policy.dataConsentProtocol) score += 3;
  if (policy.regularReview) score += 3;

  return {
    consentFramework: policy.consentFramework,
    informedConsentGuidance: policy.informedConsentGuidance,
    capacityAssessmentProtocol: policy.capacityAssessmentProtocol,
    gillikCompetenceProcess: policy.gillikCompetenceProcess,
    consentRefusalProcess: policy.consentRefusalProcess,
    dataConsentProtocol: policy.dataConsentProtocol,
    regularReview: policy.regularReview,
    overallScore: score,
  };
}

// ── Evaluator 4: Staff Consent Readiness (0–25) ─────────────────────────────

export function evaluateStaffConsentReadiness(training: StaffConsentTraining[]): StaffConsentReadinessResult {
  if (training.length === 0) {
    return {
      consentLawRate: 0,
      capacityAssessmentRate: 0,
      gillikCompetenceRate: 0,
      documentationSkillsRate: 0,
      childParticipationRate: 0,
      escalationProcessRate: 0,
      overallScore: 0,
    };
  }

  const consentLaw = training.filter((t) => t.consentLawUnderstanding).length;
  const capacity = training.filter((t) => t.capacityAssessment).length;
  const gillik = training.filter((t) => t.gillikCompetence).length;
  const docs = training.filter((t) => t.documentationSkills).length;
  const childPart = training.filter((t) => t.childParticipation).length;
  const escalation = training.filter((t) => t.escalationProcess).length;

  const consentLawRate = pct(consentLaw, training.length);
  const capacityAssessmentRate = pct(capacity, training.length);
  const gillikCompetenceRate = pct(gillik, training.length);
  const documentationSkillsRate = pct(docs, training.length);
  const childParticipationRate = pct(childPart, training.length);
  const escalationProcessRate = pct(escalation, training.length);

  const raw =
    (consentLawRate / 100) * 6 +
    (capacityAssessmentRate / 100) * 5 +
    (gillikCompetenceRate / 100) * 5 +
    (documentationSkillsRate / 100) * 4 +
    (childParticipationRate / 100) * 3 +
    (escalationProcessRate / 100) * 2;

  const overallScore = Math.min(Math.round(raw * 10) / 10, 25);

  return {
    consentLawRate,
    capacityAssessmentRate,
    gillikCompetenceRate,
    documentationSkillsRate,
    childParticipationRate,
    escalationProcessRate,
    overallScore,
  };
}

// ── Child profiles ──────────────────────────────────────────────────────────

export function buildChildConsentProfiles(records: ConsentRecord[]): ChildConsentProfile[] {
  if (records.length === 0) return [];

  const groups = new Map<string, ConsentRecord[]>();
  for (const r of records) {
    const arr = groups.get(r.childId) ?? [];
    arr.push(r);
    groups.set(r.childId, arr);
  }

  const profiles: ChildConsentProfile[] = [];
  for (const [childId, childRecords] of groups) {
    const childName = childRecords[0].childName;
    const totalRecords = childRecords.length;
    const obtained = childRecords.filter((r) => r.status === "obtained").length;
    const childViews = childRecords.filter((r) => r.childViewsSought).length;
    const uniqueCategories = new Set(childRecords.map((r) => r.category)).size;

    const obtainedRate = pct(obtained, totalRecords);
    const childViewsRate = pct(childViews, totalRecords);

    // Score 0–10
    let score = 0;

    // freq: >= 10 records -> 2, >= 5 -> 1, else 0
    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    // rate1 (obtainedRate): >= 80 -> 3, >= 60 -> 2, >= 40 -> 1, else 0
    if (obtainedRate >= 80) score += 3;
    else if (obtainedRate >= 60) score += 2;
    else if (obtainedRate >= 40) score += 1;

    // rate2 (childViewsRate): same thresholds
    if (childViewsRate >= 80) score += 3;
    else if (childViewsRate >= 60) score += 2;
    else if (childViewsRate >= 40) score += 1;

    // diversity (unique categories): >= 4 -> 2, >= 2 -> 1, else 0
    if (uniqueCategories >= 4) score += 2;
    else if (uniqueCategories >= 2) score += 1;

    // Cap at 10
    score = Math.min(score, 10);

    profiles.push({ childId, childName, totalRecords, obtainedRate, childViewsRate, uniqueCategories, overallScore: score });
  }

  return profiles;
}

// ── Master generator ────────────────────────────────────────────────────────

export function generateConsentManagementIntelligence(
  records: ConsentRecord[],
  policy: ConsentPolicy | null,
  training: StaffConsentTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ConsentManagementIntelligence {
  const consentQuality = evaluateConsentQuality(records);
  const consentCompliance = evaluateConsentCompliance(records);
  const consentPolicy = evaluateConsentPolicy(policy);
  const staffReadiness = evaluateStaffConsentReadiness(training);
  const childProfiles = buildChildConsentProfiles(records);

  const rawTotal =
    consentQuality.overallScore +
    consentCompliance.overallScore +
    consentPolicy.overallScore +
    staffReadiness.overallScore;

  const overallScore = Math.min(Math.round(rawTotal * 10) / 10, 100);
  const rating = getRating(overallScore);

  // ── Strengths: evaluator score >= 20 ──
  const strengths: string[] = [];
  if (consentQuality.overallScore >= 20) {
    strengths.push("Consent records are of high quality with strong documentation, child views sought, and expiry tracking in place");
  }
  if (consentCompliance.overallScore >= 20) {
    strengths.push("Excellent compliance with consent procedures including parent consultation, staff recording, and review scheduling");
  }
  if (consentPolicy.overallScore >= 20) {
    strengths.push("Comprehensive consent policy framework is in place covering all key areas of consent management");
  }
  if (staffReadiness.overallScore >= 20) {
    strengths.push("Staff demonstrate strong readiness in consent law, capacity assessment, and child participation");
  }

  // ── Areas for improvement: evaluator score < 15 ──
  const areasForImprovement: string[] = [];
  if (consentQuality.overallScore < 15) {
    areasForImprovement.push("Consent record quality needs improvement — ensure all consents are obtained, documented, and child views are sought");
  }
  if (consentCompliance.overallScore < 15) {
    areasForImprovement.push("Consent compliance requires attention — strengthen parent consultation, staff recording, and review scheduling");
  }
  if (consentPolicy.overallScore < 15) {
    areasForImprovement.push("Consent policy framework is incomplete — review and strengthen consent policies and protocols");
  }
  if (staffReadiness.overallScore < 15) {
    areasForImprovement.push("Staff consent training is insufficient — invest in training for consent law, capacity assessment, and Gillick competence");
  }

  // ── Actions ──
  const actions: string[] = [];

  // URGENT when policy score = 0 or staff score = 0
  if (consentPolicy.overallScore === 0) {
    actions.push("URGENT: No consent policy framework in place — develop and implement a comprehensive consent policy immediately");
  }
  if (staffReadiness.overallScore === 0) {
    actions.push("URGENT: No staff have completed consent training — arrange mandatory consent management training for all staff");
  }

  // Conditional on rates < 50
  if (records.length > 0 && consentQuality.obtainedRate < 50) {
    actions.push("Increase the rate of obtained consents — currently below 50%, review all pending and expired consent records");
  }
  if (records.length > 0 && consentQuality.childViewsRate < 50) {
    actions.push("Improve child participation in consent processes — child views are sought in fewer than 50% of records");
  }
  if (records.length > 0 && consentQuality.documentedRate < 50) {
    actions.push("Strengthen consent documentation — fewer than 50% of consent decisions are properly documented");
  }
  if (records.length > 0 && consentCompliance.parentConsultedRate < 50) {
    actions.push("Ensure parents and carers are consulted on consent decisions — consultation rate is below 50%");
  }
  if (records.length > 0 && consentCompliance.staffRecordedRate < 50) {
    actions.push("Improve staff recording of consent decisions — recording rate is below 50%");
  }
  if (records.length > 0 && consentCompliance.reviewScheduledRate < 50) {
    actions.push("Schedule regular reviews for consent records — review scheduling rate is below 50%");
  }

  // ── Regulatory links: exactly 7 ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 20 — delegated authority to make day-to-day decisions about a child's upbringing",
    "Children Act 1989 s33(3) — local authority exercise of parental responsibility and consent",
    "Gillick v West Norfolk and Wisbech AHA [1986] — children's competence to consent to treatment",
    "Mental Capacity Act 2005 — principles for assessing capacity to consent",
    "UK GDPR / Data Protection Act 2018 — lawful basis for processing children's data and consent requirements",
    "UNCRC Article 12 — the right of the child to express views in all matters affecting them",
    "SCCIF — Ofsted evaluates how effectively consent processes support children's welfare and rights",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    consentQuality,
    consentCompliance,
    consentPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
