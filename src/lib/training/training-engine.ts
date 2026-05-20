// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Training Intelligence Engine
//
// Deterministic engine for evaluating training management quality in
// children's homes — completion rates, assessment outcomes, policy
// governance, and HR/training manager competency.
//
// Aligned to:
//   - CHR 2015 Reg 31 — Fitness of workers
//   - CHR 2015 Reg 32 — Employment of staff (training requirements)
//   - CHR 2015 Reg 33 — Fitness of premises (staff competency)
//   - SCCIF — Leadership and management (workforce development)
//   - DfE Guide to CRH — Training requirements
//   - Working Together to Safeguard Children 2023 — Multi-agency training
//   - Keeping Children Safe in Education 2024 — Safeguarding training
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type TrainingCategory =
  | "safeguarding"
  | "first_aid"
  | "restraint_techniques"
  | "medication_management"
  | "fire_safety"
  | "health_and_safety"
  | "equality_diversity"
  | "therapeutic_care";

export type TrainingOutcome =
  | "completed"
  | "in_progress"
  | "expired"
  | "not_started"
  | "exempt";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface TrainingRecord {
  id: string;
  homeId: string;
  date: string;
  staffId: string;
  staffName: string;
  category: TrainingCategory;
  outcome: TrainingOutcome;
  completedOnTime: boolean;          // quality rate 1, weight 7
  assessmentPassed: boolean;         // quality rate 2, weight 6
  practicalComponentDone: boolean;   // quality rate 3, weight 6
  certificateObtained: boolean;      // quality rate 4, weight 6
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface TrainingPolicy {
  mandatoryTrainingPolicy: boolean;       // 4
  trainingNeedsAnalysis: boolean;         // 4
  refresherSchedulePolicy: boolean;       // 4
  inductionTrainingFramework: boolean;    // 4
  trainingRecordKeeping: boolean;         // 3
  externalTrainingApproval: boolean;      // 3
  trainingBudgetPolicy: boolean;          // 3
}

export interface StaffTrainingCompetency {
  staffId: string;
  trainingNeedsAssessment: boolean;  // 6
  deliverySkills: boolean;           // 5
  complianceMonitoring: boolean;     // 5
  recordManagement: boolean;         // 4
  qualityAssurance: boolean;         // 3
  budgetManagement: boolean;         // 2
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface TrainingQualityResult {
  overallScore: number;
  rating: Rating;
  totalRecords: number;
  completedOnTimeRate: number;
  assessmentPassedRate: number;
  practicalComponentDoneRate: number;
  certificateObtainedRate: number;
}

export interface TrainingComplianceResult {
  overallScore: number;
  rating: Rating;
  documentationRate: number;
  timelyRecordingRate: number;
  completedOnTimeRate: number;
  categoryDiversityRatio: number;
}

export interface TrainingPolicyResult {
  overallScore: number;
  rating: Rating;
  mandatoryTrainingPolicy: boolean;
  trainingNeedsAnalysis: boolean;
  refresherSchedulePolicy: boolean;
  inductionTrainingFramework: boolean;
  trainingRecordKeeping: boolean;
  externalTrainingApproval: boolean;
  trainingBudgetPolicy: boolean;
}

export interface StaffTrainingReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  trainingNeedsAssessmentRate: number;
  deliverySkillsRate: number;
  complianceMonitoringRate: number;
  recordManagementRate: number;
  qualityAssuranceRate: number;
  budgetManagementRate: number;
}

export interface StaffTrainingProfile {
  staffId: string;
  staffName: string;
  totalRecords: number;
  completedOnTimeRate: number;
  assessmentPassedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface TrainingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  trainingQuality: TrainingQualityResult;
  trainingCompliance: TrainingComplianceResult;
  trainingPolicy: TrainingPolicyResult;
  staffReadiness: StaffTrainingReadinessResult;
  staffProfiles: StaffTrainingProfile[];
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

export function getTrainingCategoryLabel(cat: TrainingCategory): string {
  const labels: Record<TrainingCategory, string> = {
    safeguarding: "Safeguarding",
    first_aid: "First Aid",
    restraint_techniques: "Restraint Techniques",
    medication_management: "Medication Management",
    fire_safety: "Fire Safety",
    health_and_safety: "Health and Safety",
    equality_diversity: "Equality Diversity",
    therapeutic_care: "Therapeutic Care",
  };
  return labels[cat] ?? cat;
}

export function getTrainingOutcomeLabel(outcome: TrainingOutcome): string {
  const labels: Record<TrainingOutcome, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    expired: "Expired",
    not_started: "Not Started",
    exempt: "Exempt",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: TrainingCategory[] = [
  "safeguarding", "first_aid", "restraint_techniques", "medication_management",
  "fire_safety", "health_and_safety", "equality_diversity", "therapeutic_care",
];

// ── Evaluator 1: Training Quality (0-25) ──────────────────────────────────

export function evaluateTrainingQuality(records: TrainingRecord[]): TrainingQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalRecords: 0, completedOnTimeRate: 0, assessmentPassedRate: 0, practicalComponentDoneRate: 0, certificateObtainedRate: 0 };
  }

  const completedOnTimeRate = pct(records.filter((r) => r.completedOnTime).length, total);
  const assessmentPassedRate = pct(records.filter((r) => r.assessmentPassed).length, total);
  const practicalComponentDoneRate = pct(records.filter((r) => r.practicalComponentDone).length, total);
  const certificateObtainedRate = pct(records.filter((r) => r.certificateObtained).length, total);

  // Weighted: completedOnTimeRate 7 + assessmentPassedRate 6 + practicalComponentDoneRate 6 + certificateObtainedRate 6 = 25
  const raw = (completedOnTimeRate / 100) * 7 + (assessmentPassedRate / 100) * 6 + (practicalComponentDoneRate / 100) * 6 + (certificateObtainedRate / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalRecords: total, completedOnTimeRate, assessmentPassedRate, practicalComponentDoneRate, certificateObtainedRate };
}

// ── Evaluator 2: Training Compliance (0-25) ───────────────────────────────

export function evaluateTrainingCompliance(records: TrainingRecord[]): TrainingComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: 0, timelyRecordingRate: 0, completedOnTimeRate: 0, categoryDiversityRatio: 0 };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, total);
  const completedOnTimeRate = pct(records.filter((r) => r.completedOnTime).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRecordingRate 7 + completedOnTimeRate 5 + categoryDiversityRatio 5 = 25
  const raw = (documentationRate / 100) * 8 + (timelyRecordingRate / 100) * 7 + (completedOnTimeRate / 100) * 5 + (categoryDiversityRatio / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyRecordingRate, completedOnTimeRate, categoryDiversityRatio };
}

// ── Evaluator 3: Training Policy & Governance (0-25) ──────────────────────

export function evaluateTrainingPolicy(policy: TrainingPolicy | null): TrainingPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", mandatoryTrainingPolicy: false, trainingNeedsAnalysis: false, refresherSchedulePolicy: false, inductionTrainingFramework: false, trainingRecordKeeping: false, externalTrainingApproval: false, trainingBudgetPolicy: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.mandatoryTrainingPolicy) score += 4;
  if (policy.trainingNeedsAnalysis) score += 4;
  if (policy.refresherSchedulePolicy) score += 4;
  if (policy.inductionTrainingFramework) score += 4;
  if (policy.trainingRecordKeeping) score += 3;
  if (policy.externalTrainingApproval) score += 3;
  if (policy.trainingBudgetPolicy) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    mandatoryTrainingPolicy: policy.mandatoryTrainingPolicy,
    trainingNeedsAnalysis: policy.trainingNeedsAnalysis,
    refresherSchedulePolicy: policy.refresherSchedulePolicy,
    inductionTrainingFramework: policy.inductionTrainingFramework,
    trainingRecordKeeping: policy.trainingRecordKeeping,
    externalTrainingApproval: policy.externalTrainingApproval,
    trainingBudgetPolicy: policy.trainingBudgetPolicy,
  };
}

// ── Evaluator 4: Staff Training Readiness (0-25) ──────────────────────────

export function evaluateStaffTrainingReadiness(staff: StaffTrainingCompetency[]): StaffTrainingReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, trainingNeedsAssessmentRate: 0, deliverySkillsRate: 0, complianceMonitoringRate: 0, recordManagementRate: 0, qualityAssuranceRate: 0, budgetManagementRate: 0 };
  }

  const trainingNeedsAssessmentRate = pct(staff.filter((s) => s.trainingNeedsAssessment).length, count);
  const deliverySkillsRate = pct(staff.filter((s) => s.deliverySkills).length, count);
  const complianceMonitoringRate = pct(staff.filter((s) => s.complianceMonitoring).length, count);
  const recordManagementRate = pct(staff.filter((s) => s.recordManagement).length, count);
  const qualityAssuranceRate = pct(staff.filter((s) => s.qualityAssurance).length, count);
  const budgetManagementRate = pct(staff.filter((s) => s.budgetManagement).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (trainingNeedsAssessmentRate / 100) * 6 +
    (deliverySkillsRate / 100) * 5 +
    (complianceMonitoringRate / 100) * 5 +
    (recordManagementRate / 100) * 4 +
    (qualityAssuranceRate / 100) * 3 +
    (budgetManagementRate / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, trainingNeedsAssessmentRate, deliverySkillsRate, complianceMonitoringRate, recordManagementRate, qualityAssuranceRate, budgetManagementRate };
}

// ── Staff Profiles (0-10) ─────────────────────────────────────────────────

export function buildStaffTrainingProfiles(records: TrainingRecord[]): StaffTrainingProfile[] {
  const grouped = new Map<string, TrainingRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.staffId) || [];
    arr.push(r);
    grouped.set(r.staffId, arr);
  }

  const profiles: StaffTrainingProfile[] = [];
  for (const [staffId, recs] of grouped) {
    const staffName = recs[0].staffName;
    const totalRecords = recs.length;

    const completedOnTimeRate = pct(recs.filter((r) => r.completedOnTime).length, totalRecords);
    const assessmentPassedRate = pct(recs.filter((r) => r.assessmentPassed).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10->2, >=5->1] + rate1 completedOnTimeRate [>=80->3, >=60->2, >=40->1] + rate2 assessmentPassedRate [same] + diversity [>=4->2, >=2->1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (completedOnTimeRate >= 80) score += 3;
    else if (completedOnTimeRate >= 60) score += 2;
    else if (completedOnTimeRate >= 40) score += 1;

    if (assessmentPassedRate >= 80) score += 3;
    else if (assessmentPassedRate >= 60) score += 2;
    else if (assessmentPassedRate >= 40) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      staffId,
      staffName,
      totalRecords,
      completedOnTimeRate,
      assessmentPassedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ─────────────────────────────────────────

export function generateTrainingIntelligence(
  records: TrainingRecord[],
  policy: TrainingPolicy | null,
  staff: StaffTrainingCompetency[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): TrainingIntelligence {
  const trainingQuality = evaluateTrainingQuality(records);
  const trainingCompliance = evaluateTrainingCompliance(records);
  const trainingPolicy = evaluateTrainingPolicy(policy);
  const staffReadiness = evaluateStaffTrainingReadiness(staff);
  const staffProfiles = buildStaffTrainingProfiles(records);

  const overallScore = Math.min(
    100,
    trainingQuality.overallScore + trainingCompliance.overallScore + trainingPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (trainingQuality.completedOnTimeRate >= 80) strengths.push("Training is consistently completed on time across the home");
  if (trainingQuality.assessmentPassedRate >= 80) strengths.push("Assessment pass rates are strong across training programmes");
  if (trainingQuality.practicalComponentDoneRate >= 80) strengths.push("Practical training components are routinely completed");
  if (trainingQuality.certificateObtainedRate >= 80) strengths.push("Training certificates are consistently obtained and recorded");
  if (trainingCompliance.documentationRate >= 80) strengths.push("Training documentation is thorough and complete");
  if (trainingCompliance.timelyRecordingRate >= 80) strengths.push("Training records are kept up to date in a timely manner");
  if (staffReadiness.trainingNeedsAssessmentRate >= 80) strengths.push("Staff have strong training needs assessment capabilities");
  if (staffReadiness.deliverySkillsRate >= 80) strengths.push("Training delivery skills are well developed across the team");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (trainingQuality.completedOnTimeRate < 60) areasForImprovement.push("Training completion timelines are not being met consistently");
  if (trainingQuality.assessmentPassedRate < 60) areasForImprovement.push("Assessment pass rates need improvement across training programmes");
  if (trainingQuality.practicalComponentDoneRate < 60) areasForImprovement.push("Practical training components are not being completed consistently");
  if (trainingQuality.certificateObtainedRate < 60) areasForImprovement.push("Certificate acquisition needs to be improved");
  if (trainingCompliance.documentationRate < 60) areasForImprovement.push("Training documentation is incomplete or inconsistent");
  if (trainingCompliance.timelyRecordingRate < 60) areasForImprovement.push("Training records are not being updated in a timely manner");
  if (staffReadiness.trainingNeedsAssessmentRate < 60) areasForImprovement.push("Staff training needs assessment capability needs development");
  if (staffReadiness.deliverySkillsRate < 60) areasForImprovement.push("Training delivery skills need improvement across the team");

  // Actions
  const actions: string[] = [];
  if (trainingPolicy.overallScore === 0) actions.push("URGENT: Establish a mandatory training policy — CHR 2015 Reg 32 requires documented training procedures for all staff");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Develop training management competencies — effective training delivery depends on skilled coordinators");
  if (trainingQuality.completedOnTimeRate < 50) actions.push("Ensure all mandatory training is completed within required timescales — CHR 2015 Reg 31 requires staff fitness");
  if (trainingQuality.assessmentPassedRate < 50) actions.push("Review training assessment processes — staff must demonstrate competency through assessment");
  if (trainingCompliance.documentationRate < 50) actions.push("Improve training documentation — all training must be fully recorded and evidenced");
  if (trainingCompliance.timelyRecordingRate < 50) actions.push("Implement systematic recording of training — timely records support Reg 44 reporting");
  if (trainingQuality.certificateObtainedRate < 50) actions.push("Ensure all training certifications are obtained and filed appropriately");
  if (staffReadiness.complianceMonitoringRate < 50) actions.push("Strengthen compliance monitoring — regular audits ensure training requirements are met");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 31 — Fitness of workers",
    "CHR 2015 Reg 32 — Employment of staff (training requirements)",
    "CHR 2015 Reg 33 — Fitness of premises (staff competency)",
    "SCCIF — Leadership and management (workforce development)",
    "DfE Guide to CRH — Training requirements",
    "Working Together to Safeguard Children 2023 — Multi-agency training",
    "Keeping Children Safe in Education 2024 — Safeguarding training",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    trainingQuality,
    trainingCompliance,
    trainingPolicy,
    staffReadiness,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
