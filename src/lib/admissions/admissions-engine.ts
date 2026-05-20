// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Admissions Intelligence Engine
//
// Deterministic engine for evaluating the quality of the admissions process
// in children's homes — matching, planning, pre-admission assessments,
// transition planning, child participation, and impact assessment.
//
// Aligned to:
//   - CHR 2015 Reg 12 — The protection of children standard (matching)
//   - CHR 2015 Reg 14 — Placement plan
//   - CHR 2015 Reg 20 — Matching (placed children)
//   - SCCIF — Impact of other children, matching decisions
//   - Children Act 1989 — Welfare of the child
//   - Care Planning Regulations 2010
//   - DfE Guide to Children's Homes Regulations: Matching
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type AdmissionCategory =
  | "pre_admission_assessment"
  | "matching_process"
  | "transition_planning"
  | "child_participation"
  | "impact_assessment"
  | "placement_planning"
  | "family_consultation"
  | "information_gathering";

export type AdmissionOutcome =
  | "fully_completed"
  | "partially_completed"
  | "not_completed"
  | "deferred"
  | "emergency_override";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface AdmissionRecord {
  id: string;
  childId: string;
  childName: string;
  admissionDate: string;
  category: AdmissionCategory;
  thoroughAssessment: boolean;
  childConsulted: boolean;
  impactOnResidentsConsidered: boolean;
  transitionPlanInPlace: boolean;
  documentationComplete: boolean;
  timelyProcess: boolean;
}

export interface AdmissionPolicy {
  id: string;
  admissionsPolicy: boolean;
  matchingCriteria: boolean;
  transitionProtocol: boolean;
  impactAssessmentFramework: boolean;
  childParticipationGuidance: boolean;
  emergencyAdmissionProcedure: boolean;
  reviewSchedule: boolean;
}

export interface StaffAdmissionTraining {
  id: string;
  staffId: string;
  staffName: string;
  assessmentSkills: boolean;
  matchingExpertise: boolean;
  transitionPlanning: boolean;
  childParticipationSkills: boolean;
  riskAssessment: boolean;
  familyEngagement: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface AdmissionQualityResult {
  overallScore: number;
  rating: Rating;
  totalAdmissions: number;
  thoroughAssessmentRate: number;
  childConsultedRate: number;
  impactConsideredRate: number;
  transitionPlanRate: number;
}

export interface AdmissionComplianceResult {
  overallScore: number;
  rating: Rating;
  documentationRate: number;
  timelyRate: number;
  impactAssessmentRate: number;
  categoryDiversityRatio: number;
}

export interface AdmissionPolicyResult {
  overallScore: number;
  rating: Rating;
  admissionsPolicy: boolean;
  matchingCriteria: boolean;
  transitionProtocol: boolean;
  impactAssessmentFramework: boolean;
  childParticipationGuidance: boolean;
  emergencyAdmissionProcedure: boolean;
  reviewSchedule: boolean;
}

export interface StaffAdmissionReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  assessmentSkillsRate: number;
  matchingExpertiseRate: number;
  transitionPlanningRate: number;
  childParticipationRate: number;
  riskAssessmentRate: number;
  familyEngagementRate: number;
}

export interface ChildAdmissionProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  thoroughRate: number;
  childConsultedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface AdmissionsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  admissionQuality: AdmissionQualityResult;
  admissionCompliance: AdmissionComplianceResult;
  admissionPolicy: AdmissionPolicyResult;
  staffReadiness: StaffAdmissionReadinessResult;
  childProfiles: ChildAdmissionProfile[];
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

export function getAdmissionCategoryLabel(cat: AdmissionCategory): string {
  const labels: Record<AdmissionCategory, string> = {
    pre_admission_assessment: "Pre-Admission Assessment",
    matching_process: "Matching Process",
    transition_planning: "Transition Planning",
    child_participation: "Child Participation",
    impact_assessment: "Impact Assessment",
    placement_planning: "Placement Planning",
    family_consultation: "Family Consultation",
    information_gathering: "Information Gathering",
  };
  return labels[cat] ?? cat;
}

export function getAdmissionOutcomeLabel(outcome: AdmissionOutcome): string {
  const labels: Record<AdmissionOutcome, string> = {
    fully_completed: "Fully Completed",
    partially_completed: "Partially Completed",
    not_completed: "Not Completed",
    deferred: "Deferred",
    emergency_override: "Emergency Override",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: AdmissionCategory[] = [
  "pre_admission_assessment", "matching_process", "transition_planning",
  "child_participation", "impact_assessment", "placement_planning",
  "family_consultation", "information_gathering",
];

// ── Evaluator 1: Admission Quality (0-25) ──────────────────────────────────

export function evaluateAdmissionQuality(records: AdmissionRecord[]): AdmissionQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalAdmissions: 0, thoroughAssessmentRate: 0, childConsultedRate: 0, impactConsideredRate: 0, transitionPlanRate: 0 };
  }

  const thoroughAssessmentRate = pct(records.filter((r) => r.thoroughAssessment).length, total);
  const childConsultedRate = pct(records.filter((r) => r.childConsulted).length, total);
  const impactConsideredRate = pct(records.filter((r) => r.impactOnResidentsConsidered).length, total);
  const transitionPlanRate = pct(records.filter((r) => r.transitionPlanInPlace).length, total);

  // Weighted: thoroughAssessmentRate 7 + childConsultedRate 6 + impactConsideredRate 6 + transitionPlanRate 6 = 25
  const raw = (thoroughAssessmentRate / 100) * 7 + (childConsultedRate / 100) * 6 + (impactConsideredRate / 100) * 6 + (transitionPlanRate / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalAdmissions: total, thoroughAssessmentRate, childConsultedRate, impactConsideredRate, transitionPlanRate };
}

// ── Evaluator 2: Admission Compliance (0-25) ──────────────────────────────

export function evaluateAdmissionCompliance(records: AdmissionRecord[]): AdmissionComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: 0, timelyRate: 0, impactAssessmentRate: 0, categoryDiversityRatio: 0 };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, total);
  const timelyRate = pct(records.filter((r) => r.timelyProcess).length, total);
  const impactAssessmentRate = pct(records.filter((r) => r.impactOnResidentsConsidered).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRate 7 + impactAssessmentRate 5 + categoryDiversityRatio 5 = 25
  const raw = (documentationRate / 100) * 8 + (timelyRate / 100) * 7 + (impactAssessmentRate / 100) * 5 + (categoryDiversityRatio / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyRate, impactAssessmentRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy & Governance (0-25) ────────────────────────────────

export function evaluateAdmissionPolicy(policy: AdmissionPolicy | null): AdmissionPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", admissionsPolicy: false, matchingCriteria: false, transitionProtocol: false, impactAssessmentFramework: false, childParticipationGuidance: false, emergencyAdmissionProcedure: false, reviewSchedule: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.admissionsPolicy) score += 4;
  if (policy.matchingCriteria) score += 4;
  if (policy.transitionProtocol) score += 4;
  if (policy.impactAssessmentFramework) score += 4;
  if (policy.childParticipationGuidance) score += 3;
  if (policy.emergencyAdmissionProcedure) score += 3;
  if (policy.reviewSchedule) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    admissionsPolicy: policy.admissionsPolicy,
    matchingCriteria: policy.matchingCriteria,
    transitionProtocol: policy.transitionProtocol,
    impactAssessmentFramework: policy.impactAssessmentFramework,
    childParticipationGuidance: policy.childParticipationGuidance,
    emergencyAdmissionProcedure: policy.emergencyAdmissionProcedure,
    reviewSchedule: policy.reviewSchedule,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffAdmissionReadiness(staff: StaffAdmissionTraining[]): StaffAdmissionReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, assessmentSkillsRate: 0, matchingExpertiseRate: 0, transitionPlanningRate: 0, childParticipationRate: 0, riskAssessmentRate: 0, familyEngagementRate: 0 };
  }

  const assessmentSkillsRate = pct(staff.filter((s) => s.assessmentSkills).length, count);
  const matchingExpertiseRate = pct(staff.filter((s) => s.matchingExpertise).length, count);
  const transitionPlanningRate = pct(staff.filter((s) => s.transitionPlanning).length, count);
  const childParticipationRate = pct(staff.filter((s) => s.childParticipationSkills).length, count);
  const riskAssessmentRate = pct(staff.filter((s) => s.riskAssessment).length, count);
  const familyEngagementRate = pct(staff.filter((s) => s.familyEngagement).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (assessmentSkillsRate / 100) * 6 +
    (matchingExpertiseRate / 100) * 5 +
    (transitionPlanningRate / 100) * 5 +
    (childParticipationRate / 100) * 4 +
    (riskAssessmentRate / 100) * 3 +
    (familyEngagementRate / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, assessmentSkillsRate, matchingExpertiseRate, transitionPlanningRate, childParticipationRate, riskAssessmentRate, familyEngagementRate };
}

// ── Child Profiles (0-10) ──────────────────────────────────────────────────

export function buildChildAdmissionProfiles(records: AdmissionRecord[]): ChildAdmissionProfile[] {
  const grouped = new Map<string, AdmissionRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildAdmissionProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const thoroughRate = pct(recs.filter((r) => r.thoroughAssessment).length, totalRecords);
    const childConsultedRate = pct(recs.filter((r) => r.childConsulted).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10→2, >=5→1] + rate1 thoroughRate [>=80→3, >=60→2, >=40→1] + rate2 childConsultedRate [same] + diversity [>=4→2, >=2→1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (thoroughRate >= 80) score += 3;
    else if (thoroughRate >= 60) score += 2;
    else if (thoroughRate >= 40) score += 1;

    if (childConsultedRate >= 80) score += 3;
    else if (childConsultedRate >= 60) score += 2;
    else if (childConsultedRate >= 40) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      thoroughRate,
      childConsultedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ──────────────────────────────────────────

export function generateAdmissionsIntelligence(
  records: AdmissionRecord[],
  policy: AdmissionPolicy | null,
  staff: StaffAdmissionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): AdmissionsIntelligence {
  const admissionQuality = evaluateAdmissionQuality(records);
  const admissionCompliance = evaluateAdmissionCompliance(records);
  const admissionPolicy = evaluateAdmissionPolicy(policy);
  const staffReadiness = evaluateStaffAdmissionReadiness(staff);
  const childProfiles = buildChildAdmissionProfiles(records);

  const overallScore = Math.min(
    100,
    admissionQuality.overallScore + admissionCompliance.overallScore + admissionPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (admissionQuality.thoroughAssessmentRate >= 80) strengths.push("Thorough pre-admission assessments consistently completed");
  if (admissionQuality.childConsultedRate >= 80) strengths.push("Children are consistently consulted during the admissions process");
  if (admissionQuality.impactConsideredRate >= 80) strengths.push("Impact on existing residents is systematically assessed before admission");
  if (admissionQuality.transitionPlanRate >= 80) strengths.push("Transition plans are routinely in place for new admissions");
  if (admissionCompliance.documentationRate >= 80) strengths.push("Admissions documentation is thorough and complete");
  if (admissionCompliance.timelyRate >= 80) strengths.push("Admissions processes are completed within required timescales");
  if (staffReadiness.assessmentSkillsRate >= 80) strengths.push("Staff are well trained in assessment skills for admissions");
  if (staffReadiness.matchingExpertiseRate >= 80) strengths.push("Strong matching expertise across the team");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (admissionQuality.thoroughAssessmentRate < 60) areasForImprovement.push("Pre-admission assessments are not consistently thorough");
  if (admissionQuality.childConsultedRate < 60) areasForImprovement.push("Children are not being adequately consulted during admissions");
  if (admissionQuality.impactConsideredRate < 60) areasForImprovement.push("Impact on existing children is not being systematically considered");
  if (admissionQuality.transitionPlanRate < 60) areasForImprovement.push("Transition planning needs to be more consistently applied");
  if (admissionCompliance.documentationRate < 60) areasForImprovement.push("Admissions documentation is incomplete or inconsistent");
  if (admissionCompliance.timelyRate < 60) areasForImprovement.push("Admissions processes are taking too long to complete");
  if (staffReadiness.assessmentSkillsRate < 60) areasForImprovement.push("Staff assessment skills training needs improvement");
  if (staffReadiness.matchingExpertiseRate < 60) areasForImprovement.push("Staff matching expertise requires development");

  // Actions
  const actions: string[] = [];
  if (admissionPolicy.overallScore === 0) actions.push("URGENT: Establish a formal admissions policy — CHR 2015 Reg 12/14/20 require documented matching and placement processes");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide admissions and matching training to all staff — proper assessments depend on skilled practitioners");
  if (admissionQuality.childConsultedRate < 50) actions.push("Implement systematic child consultation in all admissions — existing children's views must be sought (SCCIF)");
  if (admissionQuality.impactConsideredRate < 50) actions.push("Ensure impact assessments are completed for every admission — CHR 2015 Reg 20 requires matching consideration");
  if (admissionCompliance.documentationRate < 50) actions.push("Improve admissions documentation — placement plans must be comprehensive (Reg 14)");
  if (admissionCompliance.timelyRate < 50) actions.push("Review admissions timescales — assessments should be completed before or within 72 hours of emergency placement");
  if (admissionQuality.transitionPlanRate < 50) actions.push("Develop transition plans for all new admissions to support settling-in");
  if (staffReadiness.familyEngagementRate < 50) actions.push("Train staff in family engagement during admissions — families should be involved from the start");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 12 — The protection of children standard (matching)",
    "CHR 2015 Reg 14 — Care planning (placement plan)",
    "CHR 2015 Reg 20 — Matching (placed children)",
    "SCCIF — Impact of other children, matching decisions",
    "Children Act 1989 — Welfare of the child",
    "Care Planning Regulations 2010",
    "DfE Guide to Children's Homes Regulations: Matching",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    admissionQuality,
    admissionCompliance,
    admissionPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
