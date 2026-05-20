// Location Assessment Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type AssessmentCategory =
  | "transport_links"
  | "education_access"
  | "health_services"
  | "community_safety"
  | "recreational_facilities"
  | "cultural_diversity"
  | "environmental_quality"
  | "emergency_services";

export type AssessmentOutcome =
  | "fully_adequate"
  | "mostly_adequate"
  | "partially_adequate"
  | "inadequate"
  | "not_assessed";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<AssessmentCategory, string> = {
  transport_links: "Transport Links",
  education_access: "Education Access",
  health_services: "Health Services",
  community_safety: "Community Safety",
  recreational_facilities: "Recreational Facilities",
  cultural_diversity: "Cultural Diversity",
  environmental_quality: "Environmental Quality",
  emergency_services: "Emergency Services",
};

const OUTCOME_LABELS: Record<AssessmentOutcome, string> = {
  fully_adequate: "Fully Adequate",
  mostly_adequate: "Mostly Adequate",
  partially_adequate: "Partially Adequate",
  inadequate: "Inadequate",
  not_assessed: "Not Assessed",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getCategoryLabel(v: AssessmentCategory): string { return CATEGORY_LABELS[v]; }
export function getOutcomeLabel(v: AssessmentOutcome): string { return OUTCOME_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── All categories constant ─────────────────────────────────────────────────

const ALL_CATEGORIES: AssessmentCategory[] = [
  "transport_links",
  "education_access",
  "health_services",
  "community_safety",
  "recreational_facilities",
  "cultural_diversity",
  "environmental_quality",
  "emergency_services",
];

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface LocationAssessmentRecord {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  category: AssessmentCategory;
  thoroughAssessment: boolean;
  childViewIncorporated: boolean;
  riskIdentified: boolean;
  mitigationsDocumented: boolean;
  documentationComplete: boolean;
  regulatoryAligned: boolean;
}

export interface LocationPolicy {
  id: string;
  locationAssessmentPolicy: boolean;
  communityRiskFramework: boolean;
  transportAccessPlan: boolean;
  serviceProximityGuidelines: boolean;
  environmentalSafetyProtocol: boolean;
  annualReviewSchedule: boolean;
  stakeholderConsultation: boolean;
}

export interface StaffLocationTraining {
  id: string;
  staffId: string;
  staffName: string;
  riskAssessmentSkills: boolean;
  communityMapping: boolean;
  safeguardingAwareness: boolean;
  regulatoryKnowledge: boolean;
  childConsultation: boolean;
  reportWriting: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface AssessmentQualityResult {
  overallScore: number;
  totalRecords: number;
  thoroughRate: number;
  childViewRate: number;
  riskIdentifiedRate: number;
  mitigationsRate: number;
}

export interface AssessmentComplianceResult {
  overallScore: number;
  documentationRate: number;
  regulatoryRate: number;
  mitigationsRate: number;
  categoryDiversityRatio: number;
}

export interface LocationPolicyResult {
  overallScore: number;
  locationAssessmentPolicy: boolean;
  communityRiskFramework: boolean;
  transportAccessPlan: boolean;
  serviceProximityGuidelines: boolean;
  environmentalSafetyProtocol: boolean;
  annualReviewSchedule: boolean;
  stakeholderConsultation: boolean;
}

export interface StaffLocationReadinessResult {
  overallScore: number;
  totalStaff: number;
  riskAssessmentRate: number;
  communityMappingRate: number;
  safeguardingRate: number;
  regulatoryRate: number;
  childConsultationRate: number;
  reportWritingRate: number;
}

export interface ChildLocationProfile {
  childId: string;
  childName: string;
  totalAssessments: number;
  thoroughRate: number;
  childViewRate: number;
  overallScore: number;
}

export interface LocationAssessmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  assessmentQuality: AssessmentQualityResult;
  assessmentCompliance: AssessmentComplianceResult;
  locationPolicy: LocationPolicyResult;
  staffLocationReadiness: StaffLocationReadinessResult;
  childProfiles: ChildLocationProfile[];
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

export function evaluateAssessmentQuality(records: LocationAssessmentRecord[]): AssessmentQualityResult {
  if (records.length === 0) {
    return { overallScore: 0, totalRecords: 0, thoroughRate: 0, childViewRate: 0, riskIdentifiedRate: 0, mitigationsRate: 0 };
  }

  const total = records.length;
  const thoroughCount = records.filter((r) => r.thoroughAssessment).length;
  const childViewCount = records.filter((r) => r.childViewIncorporated).length;
  const riskCount = records.filter((r) => r.riskIdentified).length;
  const mitigationsCount = records.filter((r) => r.mitigationsDocumented).length;

  const thoroughRate = pct(thoroughCount, total);
  const childViewRate = pct(childViewCount, total);
  const riskIdentifiedRate = pct(riskCount, total);
  const mitigationsRate = pct(mitigationsCount, total);

  const s1 = Math.round((thoroughRate / 100) * 7);
  const s2 = Math.round((childViewRate / 100) * 6);
  const s3 = Math.round((riskIdentifiedRate / 100) * 6);
  const s4 = Math.round((mitigationsRate / 100) * 6);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4);

  return { overallScore, totalRecords: total, thoroughRate, childViewRate, riskIdentifiedRate, mitigationsRate };
}

export function evaluateAssessmentCompliance(records: LocationAssessmentRecord[]): AssessmentComplianceResult {
  if (records.length === 0) {
    return { overallScore: 0, documentationRate: 0, regulatoryRate: 0, mitigationsRate: 0, categoryDiversityRatio: 0 };
  }

  const total = records.length;
  const documentedCount = records.filter((r) => r.documentationComplete).length;
  const regulatoryCount = records.filter((r) => r.regulatoryAligned).length;
  const mitigationsCount = records.filter((r) => r.mitigationsDocumented).length;
  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const diversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  const documentationRate = pct(documentedCount, total);
  const regulatoryRate = pct(regulatoryCount, total);
  const mitigationsRate = pct(mitigationsCount, total);

  const s1 = Math.round((documentationRate / 100) * 8);
  const s2 = Math.round((regulatoryRate / 100) * 7);
  const s3 = Math.round((mitigationsRate / 100) * 5);
  const s4 = Math.round((diversityRatio / 100) * 5);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4);

  return { overallScore, documentationRate, regulatoryRate, mitigationsRate, categoryDiversityRatio: diversityRatio };
}

export function evaluateLocationPolicy(policy: LocationPolicy | null): LocationPolicyResult {
  if (!policy) {
    return { overallScore: 0, locationAssessmentPolicy: false, communityRiskFramework: false, transportAccessPlan: false, serviceProximityGuidelines: false, environmentalSafetyProtocol: false, annualReviewSchedule: false, stakeholderConsultation: false };
  }

  let score = 0;
  if (policy.locationAssessmentPolicy) score += 4;
  if (policy.communityRiskFramework) score += 4;
  if (policy.transportAccessPlan) score += 4;
  if (policy.serviceProximityGuidelines) score += 4;
  if (policy.environmentalSafetyProtocol) score += 3;
  if (policy.annualReviewSchedule) score += 3;
  if (policy.stakeholderConsultation) score += 3;

  return {
    overallScore: Math.min(25, score),
    locationAssessmentPolicy: policy.locationAssessmentPolicy, communityRiskFramework: policy.communityRiskFramework,
    transportAccessPlan: policy.transportAccessPlan, serviceProximityGuidelines: policy.serviceProximityGuidelines,
    environmentalSafetyProtocol: policy.environmentalSafetyProtocol, annualReviewSchedule: policy.annualReviewSchedule,
    stakeholderConsultation: policy.stakeholderConsultation,
  };
}

export function evaluateStaffLocationReadiness(training: StaffLocationTraining[]): StaffLocationReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, riskAssessmentRate: 0, communityMappingRate: 0, safeguardingRate: 0, regulatoryRate: 0, childConsultationRate: 0, reportWritingRate: 0 };
  }

  const total = training.length;
  const raRate = pct(training.filter((t) => t.riskAssessmentSkills).length, total);
  const cmRate = pct(training.filter((t) => t.communityMapping).length, total);
  const saRate = pct(training.filter((t) => t.safeguardingAwareness).length, total);
  const rkRate = pct(training.filter((t) => t.regulatoryKnowledge).length, total);
  const ccRate = pct(training.filter((t) => t.childConsultation).length, total);
  const rwRate = pct(training.filter((t) => t.reportWriting).length, total);

  const s1 = Math.round((raRate / 100) * 6);
  const s2 = Math.round((cmRate / 100) * 5);
  const s3 = Math.round((saRate / 100) * 5);
  const s4 = Math.round((rkRate / 100) * 4);
  const s5 = Math.round((ccRate / 100) * 3);
  const s6 = Math.round((rwRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, riskAssessmentRate: raRate, communityMappingRate: cmRate, safeguardingRate: saRate, regulatoryRate: rkRate, childConsultationRate: ccRate, reportWritingRate: rwRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildLocationProfiles(records: LocationAssessmentRecord[]): ChildLocationProfile[] {
  if (records.length === 0) return [];

  const grouped = new Map<string, LocationAssessmentRecord[]>();
  for (const r of records) {
    if (!grouped.has(r.childId)) grouped.set(r.childId, []);
    grouped.get(r.childId)!.push(r);
  }

  const profiles: ChildLocationProfile[] = [];

  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const total = recs.length;
    const thoroughCount = recs.filter((r) => r.thoroughAssessment).length;
    const childViewCount = recs.filter((r) => r.childViewIncorporated).length;

    const thoroughRate = pct(thoroughCount, total);
    const childViewRate = pct(childViewCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let thScore = 0;
    if (thoroughRate >= 80) thScore = 3;
    else if (thoroughRate >= 60) thScore = 2;
    else if (thoroughRate >= 40) thScore = 1;

    let cvScore = 0;
    if (childViewRate >= 80) cvScore = 3;
    else if (childViewRate >= 60) cvScore = 2;
    else if (childViewRate >= 40) cvScore = 1;

    const uniqueCategories = new Set(recs.map((r) => r.category)).size;
    let divScore = 0;
    if (uniqueCategories >= 4) divScore = 2;
    else if (uniqueCategories >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + thScore + cvScore + divScore);

    profiles.push({ childId, childName, totalAssessments: total, thoroughRate, childViewRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateLocationAssessmentIntelligence(
  records: LocationAssessmentRecord[],
  policy: LocationPolicy | null,
  staff: StaffLocationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): LocationAssessmentIntelligence {
  const assessmentQuality = evaluateAssessmentQuality(records);
  const assessmentCompliance = evaluateAssessmentCompliance(records);
  const locationPolicy = evaluateLocationPolicy(policy);
  const staffLocationReadiness = evaluateStaffLocationReadiness(staff);

  const overallScore = Math.min(100, assessmentQuality.overallScore + assessmentCompliance.overallScore + locationPolicy.overallScore + staffLocationReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildLocationProfiles(records);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (assessmentQuality.thoroughRate >= 80) strengths.push("Location assessments are thorough and comprehensive across all areas");
  if (assessmentQuality.childViewRate >= 80) strengths.push("Children's views are consistently incorporated into location assessments");
  if (assessmentQuality.riskIdentifiedRate >= 80) strengths.push("Strong risk identification practice ensures location hazards are documented");
  if (assessmentCompliance.documentationRate >= 80) strengths.push("Assessment documentation is complete and well-maintained");

  if (records.length > 0 && assessmentQuality.thoroughRate < 60) areasForImprovement.push("Assessment thoroughness needs improvement — ensure all Annex A areas are covered");
  if (records.length > 0 && assessmentQuality.childViewRate < 60) areasForImprovement.push("Children's views are not sufficiently incorporated into location assessments");
  if (records.length > 0 && assessmentQuality.mitigationsRate < 60) areasForImprovement.push("Mitigations documentation is below expected levels — ensure all identified risks have recorded mitigations");
  if (records.length > 0 && assessmentCompliance.regulatoryRate < 60) areasForImprovement.push("Regulatory alignment needs strengthening across location assessments");

  if (records.length === 0) actions.push("No location assessment records found — begin tracking location assessments immediately");
  if (!policy) actions.push("URGENT: No location assessment policy in place — develop and implement immediately");
  if (staff.length === 0) actions.push("URGENT: No staff location training recorded — arrange training for all staff");
  if (records.length > 0 && assessmentQuality.riskIdentifiedRate < 50) actions.push("Improve risk identification processes in location assessments");
  if (records.length > 0 && assessmentCompliance.documentationRate < 50) actions.push("Strengthen documentation completeness for location assessment records");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 12 — The protection of children standard (location risk)",
    "CHR 2015 Reg 13 — The leadership and management standard",
    "SCCIF — Location and environment assessment",
    "CHR 2015 Reg 46 — Review of quality of care (includes location)",
    "Children Act 1989 — Welfare considerations",
    "National Minimum Standards for Children's Homes",
    "DfE Guide to Children's Homes Regulations",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    assessmentQuality, assessmentCompliance, locationPolicy, staffLocationReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
