// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Workforce Intelligence Engine
//
// Deterministic engine for evaluating workforce compliance quality in
// children's homes — DBS checks, qualifications, mandatory training,
// supervision records, and staff readiness for workforce management.
//
// Aligned to:
//   - CHR 2015 Reg 31 — Fitness of workers
//   - CHR 2015 Reg 32 — Employment of staff
//   - CHR 2015 Reg 33 — Fitness of premises (staffing adequacy)
//   - CHR 2015 Reg 40(3) — Staff qualification records
//   - DfE Guide to CRH — Staffing requirements
//   - SCCIF — Leadership and management (staffing judgement)
//   - Keeping Children Safe in Education 2024 — DBS and vetting
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type WorkforceCategory =
  | "dbs_compliance"
  | "qualification_level"
  | "mandatory_training"
  | "safeguarding_training"
  | "supervision_record"
  | "restraint_training"
  | "first_aid_certification"
  | "medication_competency";

export type WorkforceOutcome =
  | "compliant"
  | "action_needed"
  | "non_compliant"
  | "expired"
  | "exempt";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface WorkforceRecord {
  id: string;
  homeId: string;
  date: string;
  staffId: string;
  staffName: string;
  category: WorkforceCategory;
  outcome: WorkforceOutcome;
  // Quality flags (4)
  dbsCurrent: boolean;                 // quality rate 1, weight 7
  qualificationMet: boolean;           // quality rate 2, weight 6
  trainingUpToDate: boolean;           // quality rate 3, weight 6
  supervisionCurrent: boolean;         // quality rate 4, weight 6
  // Compliance flags (2 — other 2 are computed)
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface WorkforcePolicy {
  saferRecruitmentPolicy: boolean;        // 4
  dbsRenewalPolicy: boolean;              // 4
  qualificationFramework: boolean;        // 4
  mandatoryTrainingPolicy: boolean;       // 4
  supervisionPolicy: boolean;             // 3
  agencyStaffPolicy: boolean;             // 3
  workforceDevStrategy: boolean;          // 3
}

export interface StaffWorkforceTraining {
  staffId: string;
  saferRecruitment: boolean;        // 6
  dbsProcessKnowledge: boolean;     // 5
  qualificationAssessment: boolean; // 5
  supervisionSkills: boolean;       // 4
  trainingCoordination: boolean;    // 3
  regulatoryCompliance: boolean;    // 2
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface WorkforceQualityResult {
  overallScore: number;
  rating: Rating;
  totalRecords: number;
  dbsCurrentRate: number;
  qualificationMetRate: number;
  trainingUpToDateRate: number;
  supervisionCurrentRate: number;
}

export interface WorkforceComplianceResult {
  overallScore: number;
  rating: Rating;
  documentationRate: number;
  timelyRecordingRate: number;
  supervisionCurrentRate: number;
  categoryDiversityRatio: number;
}

export interface WorkforcePolicyResult {
  overallScore: number;
  rating: Rating;
  saferRecruitmentPolicy: boolean;
  dbsRenewalPolicy: boolean;
  qualificationFramework: boolean;
  mandatoryTrainingPolicy: boolean;
  supervisionPolicy: boolean;
  agencyStaffPolicy: boolean;
  workforceDevStrategy: boolean;
}

export interface StaffWorkforceReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  saferRecruitmentRate: number;
  dbsProcessKnowledgeRate: number;
  qualificationAssessmentRate: number;
  supervisionSkillsRate: number;
  trainingCoordinationRate: number;
  regulatoryComplianceRate: number;
}

export interface StaffWorkforceProfile {
  staffId: string;
  staffName: string;
  totalRecords: number;
  dbsCurrentRate: number;
  qualificationMetRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface WorkforceIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  workforceQuality: WorkforceQualityResult;
  workforceCompliance: WorkforceComplianceResult;
  workforcePolicy: WorkforcePolicyResult;
  staffReadiness: StaffWorkforceReadinessResult;
  staffProfiles: StaffWorkforceProfile[];
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

export function getWorkforceCategoryLabel(cat: WorkforceCategory): string {
  const labels: Record<WorkforceCategory, string> = {
    dbs_compliance: "DBS Compliance",
    qualification_level: "Qualification Level",
    mandatory_training: "Mandatory Training",
    safeguarding_training: "Safeguarding Training",
    supervision_record: "Supervision Record",
    restraint_training: "Restraint Training",
    first_aid_certification: "First Aid Certification",
    medication_competency: "Medication Competency",
  };
  return labels[cat] ?? cat;
}

export function getWorkforceOutcomeLabel(outcome: WorkforceOutcome): string {
  const labels: Record<WorkforceOutcome, string> = {
    compliant: "Compliant",
    action_needed: "Action Needed",
    non_compliant: "Non-Compliant",
    expired: "Expired",
    exempt: "Exempt",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: WorkforceCategory[] = [
  "dbs_compliance", "qualification_level", "mandatory_training", "safeguarding_training",
  "supervision_record", "restraint_training", "first_aid_certification", "medication_competency",
];

// ── Evaluator 1: Workforce Quality (0-25) ─────────────────────────────────

export function evaluateWorkforceQuality(records: WorkforceRecord[]): WorkforceQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalRecords: 0, dbsCurrentRate: 0, qualificationMetRate: 0, trainingUpToDateRate: 0, supervisionCurrentRate: 0 };
  }

  const dbsCurrentRate = pct(records.filter((r) => r.dbsCurrent).length, total);
  const qualificationMetRate = pct(records.filter((r) => r.qualificationMet).length, total);
  const trainingUpToDateRate = pct(records.filter((r) => r.trainingUpToDate).length, total);
  const supervisionCurrentRate = pct(records.filter((r) => r.supervisionCurrent).length, total);

  // Weighted: dbsCurrentRate 7 + qualificationMetRate 6 + trainingUpToDateRate 6 + supervisionCurrentRate 6 = 25
  const raw = (dbsCurrentRate / 100) * 7 + (qualificationMetRate / 100) * 6 + (trainingUpToDateRate / 100) * 6 + (supervisionCurrentRate / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalRecords: total, dbsCurrentRate, qualificationMetRate, trainingUpToDateRate, supervisionCurrentRate };
}

// ── Evaluator 2: Workforce Compliance (0-25) ──────────────────────────────

export function evaluateWorkforceCompliance(records: WorkforceRecord[]): WorkforceComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: 0, timelyRecordingRate: 0, supervisionCurrentRate: 0, categoryDiversityRatio: 0 };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, total);
  const supervisionCurrentRate = pct(records.filter((r) => r.supervisionCurrent).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRecordingRate 7 + supervisionCurrentRate 5 + categoryDiversityRatio 5 = 25
  const raw = (documentationRate / 100) * 8 + (timelyRecordingRate / 100) * 7 + (supervisionCurrentRate / 100) * 5 + (categoryDiversityRatio / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyRecordingRate, supervisionCurrentRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy & Governance (0-25) ────────────────────────────────

export function evaluateWorkforcePolicy(policy: WorkforcePolicy | null): WorkforcePolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", saferRecruitmentPolicy: false, dbsRenewalPolicy: false, qualificationFramework: false, mandatoryTrainingPolicy: false, supervisionPolicy: false, agencyStaffPolicy: false, workforceDevStrategy: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.saferRecruitmentPolicy) score += 4;
  if (policy.dbsRenewalPolicy) score += 4;
  if (policy.qualificationFramework) score += 4;
  if (policy.mandatoryTrainingPolicy) score += 4;
  if (policy.supervisionPolicy) score += 3;
  if (policy.agencyStaffPolicy) score += 3;
  if (policy.workforceDevStrategy) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    saferRecruitmentPolicy: policy.saferRecruitmentPolicy,
    dbsRenewalPolicy: policy.dbsRenewalPolicy,
    qualificationFramework: policy.qualificationFramework,
    mandatoryTrainingPolicy: policy.mandatoryTrainingPolicy,
    supervisionPolicy: policy.supervisionPolicy,
    agencyStaffPolicy: policy.agencyStaffPolicy,
    workforceDevStrategy: policy.workforceDevStrategy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffWorkforceReadiness(staff: StaffWorkforceTraining[]): StaffWorkforceReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, saferRecruitmentRate: 0, dbsProcessKnowledgeRate: 0, qualificationAssessmentRate: 0, supervisionSkillsRate: 0, trainingCoordinationRate: 0, regulatoryComplianceRate: 0 };
  }

  const saferRecruitmentRate = pct(staff.filter((s) => s.saferRecruitment).length, count);
  const dbsProcessKnowledgeRate = pct(staff.filter((s) => s.dbsProcessKnowledge).length, count);
  const qualificationAssessmentRate = pct(staff.filter((s) => s.qualificationAssessment).length, count);
  const supervisionSkillsRate = pct(staff.filter((s) => s.supervisionSkills).length, count);
  const trainingCoordinationRate = pct(staff.filter((s) => s.trainingCoordination).length, count);
  const regulatoryComplianceRate = pct(staff.filter((s) => s.regulatoryCompliance).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (saferRecruitmentRate / 100) * 6 +
    (dbsProcessKnowledgeRate / 100) * 5 +
    (qualificationAssessmentRate / 100) * 5 +
    (supervisionSkillsRate / 100) * 4 +
    (trainingCoordinationRate / 100) * 3 +
    (regulatoryComplianceRate / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, saferRecruitmentRate, dbsProcessKnowledgeRate, qualificationAssessmentRate, supervisionSkillsRate, trainingCoordinationRate, regulatoryComplianceRate };
}

// ── Staff Profiles (0-10) ──────────────────────────────────────────────────

export function buildStaffWorkforceProfiles(records: WorkforceRecord[]): StaffWorkforceProfile[] {
  const grouped = new Map<string, WorkforceRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.staffId) || [];
    arr.push(r);
    grouped.set(r.staffId, arr);
  }

  const profiles: StaffWorkforceProfile[] = [];
  for (const [staffId, recs] of grouped) {
    const staffName = recs[0].staffName;
    const totalRecords = recs.length;

    const dbsCurrentRate = pct(recs.filter((r) => r.dbsCurrent).length, totalRecords);
    const qualificationMetRate = pct(recs.filter((r) => r.qualificationMet).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10 -> 2, >=5 -> 1] + rate1 dbsCurrentRate [>=80 -> 3, >=60 -> 2, >=40 -> 1] + rate2 qualificationMetRate [same] + diversity [>=4 -> 2, >=2 -> 1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (dbsCurrentRate >= 80) score += 3;
    else if (dbsCurrentRate >= 60) score += 2;
    else if (dbsCurrentRate >= 40) score += 1;

    if (qualificationMetRate >= 80) score += 3;
    else if (qualificationMetRate >= 60) score += 2;
    else if (qualificationMetRate >= 40) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      staffId,
      staffName,
      totalRecords,
      dbsCurrentRate,
      qualificationMetRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ──────────────────────────────────────────

export function generateWorkforceIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: WorkforceRecord[];
  policy: WorkforcePolicy | null;
  staff: StaffWorkforceTraining[];
}): WorkforceIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const workforceQuality = evaluateWorkforceQuality(records);
  const workforceCompliance = evaluateWorkforceCompliance(records);
  const workforcePolicy = evaluateWorkforcePolicy(policy);
  const staffReadiness = evaluateStaffWorkforceReadiness(staff);
  const staffProfiles = buildStaffWorkforceProfiles(records);

  const overallScore = Math.min(
    100,
    workforceQuality.overallScore + workforceCompliance.overallScore + workforcePolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (workforceQuality.dbsCurrentRate >= 80) strengths.push("DBS checks are consistently current across the workforce");
  if (workforceQuality.qualificationMetRate >= 80) strengths.push("Staff qualification levels meet regulatory requirements");
  if (workforceQuality.trainingUpToDateRate >= 80) strengths.push("Mandatory training is up to date for the majority of staff");
  if (workforceQuality.supervisionCurrentRate >= 80) strengths.push("Supervision records are maintained within required timescales");
  if (workforceCompliance.documentationRate >= 80) strengths.push("Workforce documentation is thorough and complete");
  if (workforceCompliance.timelyRecordingRate >= 80) strengths.push("Recording of workforce compliance is timely and accurate");
  if (staffReadiness.saferRecruitmentRate >= 80) strengths.push("Staff have strong safer recruitment knowledge");
  if (staffReadiness.dbsProcessKnowledgeRate >= 80) strengths.push("Staff are well trained in DBS processes and requirements");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (workforceQuality.dbsCurrentRate < 60) areasForImprovement.push("DBS checks are not consistently current across the workforce");
  if (workforceQuality.qualificationMetRate < 60) areasForImprovement.push("Staff qualification levels need improvement to meet regulatory standards");
  if (workforceQuality.trainingUpToDateRate < 60) areasForImprovement.push("Mandatory training compliance is below acceptable levels");
  if (workforceQuality.supervisionCurrentRate < 60) areasForImprovement.push("Supervision records are not being maintained within required timescales");
  if (workforceCompliance.documentationRate < 60) areasForImprovement.push("Workforce documentation is incomplete or inconsistent");
  if (workforceCompliance.timelyRecordingRate < 60) areasForImprovement.push("Recording of workforce compliance is not timely");
  if (staffReadiness.saferRecruitmentRate < 60) areasForImprovement.push("Staff safer recruitment knowledge needs development");
  if (staffReadiness.dbsProcessKnowledgeRate < 60) areasForImprovement.push("Staff need more training in DBS processes");

  // Actions
  const actions: string[] = [];
  if (workforcePolicy.overallScore === 0) actions.push("URGENT: Establish workforce policies — CHR 2015 Reg 31/32 require documented safer recruitment and staffing procedures");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide workforce management training to all HR/management staff — compliance depends on skilled practitioners");
  if (workforceQuality.dbsCurrentRate < 50) actions.push("Ensure all staff DBS checks are current — Keeping Children Safe in Education 2024 requires enhanced DBS for all staff");
  if (workforceQuality.qualificationMetRate < 50) actions.push("Review staff qualification levels — CHR 2015 Reg 32 requires appropriate qualifications");
  if (workforceCompliance.documentationRate < 50) actions.push("Improve workforce documentation — all compliance records must be fully maintained");
  if (workforceCompliance.timelyRecordingRate < 50) actions.push("Review recording timescales — workforce compliance should be recorded promptly");
  if (workforceQuality.trainingUpToDateRate < 50) actions.push("Ensure mandatory training is renewed within required timescales for all staff");
  if (staffReadiness.supervisionSkillsRate < 50) actions.push("Train management staff in supervision skills — regular supervision is essential for staff development");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 31 — Fitness of workers",
    "CHR 2015 Reg 32 — Employment of staff",
    "CHR 2015 Reg 33 — Fitness of premises (staffing adequacy)",
    "CHR 2015 Reg 40(3) — Staff qualification records",
    "DfE Guide to CRH — Staffing requirements",
    "SCCIF — Leadership and management (staffing judgement)",
    "Keeping Children Safe in Education 2024 — DBS and vetting",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    workforceQuality,
    workforceCompliance,
    workforcePolicy,
    staffReadiness,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
