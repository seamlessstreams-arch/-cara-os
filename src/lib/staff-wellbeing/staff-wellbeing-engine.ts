// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Staff Wellbeing Intelligence Engine
//
// Deterministic engine for evaluating staff wellbeing support quality in
// children's homes — supervision delivery, wellbeing monitoring, debriefing
// practice, and manager/supervisor training readiness.
//
// Aligned to:
//   - CHR 2015 Reg 31 — Fitness of workers
//   - CHR 2015 Reg 33 — Fitness of premises (staffing adequacy)
//   - SCCIF — Leadership and management
//   - Health and Safety at Work Act 1974 — Employer duty of care
//   - Management of Health and Safety at Work Regulations 1999
//   - Ofsted Workforce Expectations — Staff support and supervision
//   - DfE Guide to CRH — Staff wellbeing and retention
//
// Evidence shows that staff wellbeing directly impacts children's outcomes:
//   - High stress -> increased restraint use
//   - Burnout -> higher turnover -> placement disruption
//   - Poor supervision -> missed safeguarding signs
//   - Lack of debrief -> secondary trauma
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type StaffWellbeingCategory =
  | "supervision_support"
  | "workload_management"
  | "emotional_wellbeing"
  | "professional_development"
  | "team_cohesion"
  | "work_life_balance"
  | "resilience_support"
  | "recognition_reward";

export type StaffWellbeingOutcome =
  | "thriving"
  | "managing"
  | "struggling"
  | "at_risk"
  | "on_leave";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface StaffWellbeingRecord {
  id: string;
  homeId: string;
  date: string;
  staffId: string;
  staffName: string;
  category: StaffWellbeingCategory;
  outcome: StaffWellbeingOutcome;
  supervisionReceived: boolean;       // quality rate 1, weight 7
  wellbeingChecked: boolean;          // quality rate 2, weight 6
  debriefOffered: boolean;            // quality rate 3, weight 6
  supportAccessed: boolean;           // quality rate 4, weight 6
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface StaffWellbeingPolicy {
  staffWellbeingPolicy: boolean;           // 4
  supervisionFramework: boolean;           // 4
  debriefingProtocol: boolean;             // 4
  employeeAssistanceProgramme: boolean;    // 4
  workloadManagementPolicy: boolean;       // 3
  sicknessAbsencePolicy: boolean;          // 3
  recognitionScheme: boolean;              // 3
}

export interface StaffWellbeingTraining {
  staffId: string;
  supervisionDelivery: boolean;       // 6
  wellbeingAssessment: boolean;       // 5
  debriefingSkills: boolean;          // 5
  stressManagement: boolean;          // 4
  teamBuilding: boolean;              // 3
  conflictMediation: boolean;         // 2
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface StaffWellbeingQualityResult {
  overallScore: number;
  rating: Rating;
  totalRecords: number;
  supervisionReceivedRate: number;
  wellbeingCheckedRate: number;
  debriefOfferedRate: number;
  supportAccessedRate: number;
}

export interface StaffWellbeingComplianceResult {
  overallScore: number;
  rating: Rating;
  documentationRate: number;
  timelyRecordingRate: number;
  supervisionReceivedRate: number;
  categoryDiversityRatio: number;
}

export interface StaffWellbeingPolicyResult {
  overallScore: number;
  rating: Rating;
  staffWellbeingPolicy: boolean;
  supervisionFramework: boolean;
  debriefingProtocol: boolean;
  employeeAssistanceProgramme: boolean;
  workloadManagementPolicy: boolean;
  sicknessAbsencePolicy: boolean;
  recognitionScheme: boolean;
}

export interface StaffWellbeingReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  supervisionDeliveryRate: number;
  wellbeingAssessmentRate: number;
  debriefingSkillsRate: number;
  stressManagementRate: number;
  teamBuildingRate: number;
  conflictMediationRate: number;
}

export interface StaffWellbeingProfile {
  staffId: string;
  staffName: string;
  totalRecords: number;
  supervisionReceivedRate: number;
  wellbeingCheckedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface StaffWellbeingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  wellbeingQuality: StaffWellbeingQualityResult;
  wellbeingCompliance: StaffWellbeingComplianceResult;
  wellbeingPolicy: StaffWellbeingPolicyResult;
  staffReadiness: StaffWellbeingReadinessResult;
  staffProfiles: StaffWellbeingProfile[];
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

export function getStaffWellbeingCategoryLabel(cat: StaffWellbeingCategory): string {
  const labels: Record<StaffWellbeingCategory, string> = {
    supervision_support: "Supervision Support",
    workload_management: "Workload Management",
    emotional_wellbeing: "Emotional Wellbeing",
    professional_development: "Professional Development",
    team_cohesion: "Team Cohesion",
    work_life_balance: "Work Life Balance",
    resilience_support: "Resilience Support",
    recognition_reward: "Recognition Reward",
  };
  return labels[cat] ?? cat;
}

export function getStaffWellbeingOutcomeLabel(outcome: StaffWellbeingOutcome): string {
  const labels: Record<StaffWellbeingOutcome, string> = {
    thriving: "Thriving",
    managing: "Managing",
    struggling: "Struggling",
    at_risk: "At Risk",
    on_leave: "On Leave",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: StaffWellbeingCategory[] = [
  "supervision_support", "workload_management", "emotional_wellbeing", "professional_development",
  "team_cohesion", "work_life_balance", "resilience_support", "recognition_reward",
];

// ── Evaluator 1: Wellbeing Quality (0-25) ─────────────────────────────────

export function evaluateWellbeingQuality(records: StaffWellbeingRecord[]): StaffWellbeingQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalRecords: 0, supervisionReceivedRate: 0, wellbeingCheckedRate: 0, debriefOfferedRate: 0, supportAccessedRate: 0 };
  }

  const supervisionReceivedRate = pct(records.filter((r) => r.supervisionReceived).length, total);
  const wellbeingCheckedRate = pct(records.filter((r) => r.wellbeingChecked).length, total);
  const debriefOfferedRate = pct(records.filter((r) => r.debriefOffered).length, total);
  const supportAccessedRate = pct(records.filter((r) => r.supportAccessed).length, total);

  // Weighted: supervisionReceivedRate 7 + wellbeingCheckedRate 6 + debriefOfferedRate 6 + supportAccessedRate 6 = 25
  const raw = (supervisionReceivedRate / 100) * 7 + (wellbeingCheckedRate / 100) * 6 + (debriefOfferedRate / 100) * 6 + (supportAccessedRate / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalRecords: total, supervisionReceivedRate, wellbeingCheckedRate, debriefOfferedRate, supportAccessedRate };
}

// ── Evaluator 2: Wellbeing Compliance (0-25) ──────────────────────────────

export function evaluateWellbeingCompliance(records: StaffWellbeingRecord[]): StaffWellbeingComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: 0, timelyRecordingRate: 0, supervisionReceivedRate: 0, categoryDiversityRatio: 0 };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, total);
  const supervisionReceivedRate = pct(records.filter((r) => r.supervisionReceived).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRecordingRate 7 + supervisionReceivedRate 5 + categoryDiversityRatio 5 = 25
  const raw = (documentationRate / 100) * 8 + (timelyRecordingRate / 100) * 7 + (supervisionReceivedRate / 100) * 5 + (categoryDiversityRatio / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyRecordingRate, supervisionReceivedRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy & Governance (0-25) ───────────────────────────────

export function evaluateWellbeingPolicy(policy: StaffWellbeingPolicy | null): StaffWellbeingPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", staffWellbeingPolicy: false, supervisionFramework: false, debriefingProtocol: false, employeeAssistanceProgramme: false, workloadManagementPolicy: false, sicknessAbsencePolicy: false, recognitionScheme: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.staffWellbeingPolicy) score += 4;
  if (policy.supervisionFramework) score += 4;
  if (policy.debriefingProtocol) score += 4;
  if (policy.employeeAssistanceProgramme) score += 4;
  if (policy.workloadManagementPolicy) score += 3;
  if (policy.sicknessAbsencePolicy) score += 3;
  if (policy.recognitionScheme) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    staffWellbeingPolicy: policy.staffWellbeingPolicy,
    supervisionFramework: policy.supervisionFramework,
    debriefingProtocol: policy.debriefingProtocol,
    employeeAssistanceProgramme: policy.employeeAssistanceProgramme,
    workloadManagementPolicy: policy.workloadManagementPolicy,
    sicknessAbsencePolicy: policy.sicknessAbsencePolicy,
    recognitionScheme: policy.recognitionScheme,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ───────────────────────────────────

export function evaluateStaffWellbeingReadiness(staff: StaffWellbeingTraining[]): StaffWellbeingReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, supervisionDeliveryRate: 0, wellbeingAssessmentRate: 0, debriefingSkillsRate: 0, stressManagementRate: 0, teamBuildingRate: 0, conflictMediationRate: 0 };
  }

  const supervisionDeliveryRate = pct(staff.filter((s) => s.supervisionDelivery).length, count);
  const wellbeingAssessmentRate = pct(staff.filter((s) => s.wellbeingAssessment).length, count);
  const debriefingSkillsRate = pct(staff.filter((s) => s.debriefingSkills).length, count);
  const stressManagementRate = pct(staff.filter((s) => s.stressManagement).length, count);
  const teamBuildingRate = pct(staff.filter((s) => s.teamBuilding).length, count);
  const conflictMediationRate = pct(staff.filter((s) => s.conflictMediation).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (supervisionDeliveryRate / 100) * 6 +
    (wellbeingAssessmentRate / 100) * 5 +
    (debriefingSkillsRate / 100) * 5 +
    (stressManagementRate / 100) * 4 +
    (teamBuildingRate / 100) * 3 +
    (conflictMediationRate / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, supervisionDeliveryRate, wellbeingAssessmentRate, debriefingSkillsRate, stressManagementRate, teamBuildingRate, conflictMediationRate };
}

// ── Staff Profiles (0-10) ─────────────────────────────────────────────────

export function buildStaffWellbeingProfiles(records: StaffWellbeingRecord[]): StaffWellbeingProfile[] {
  const grouped = new Map<string, StaffWellbeingRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.staffId) || [];
    arr.push(r);
    grouped.set(r.staffId, arr);
  }

  const profiles: StaffWellbeingProfile[] = [];
  for (const [staffId, recs] of grouped) {
    const staffName = recs[0].staffName;
    const totalRecords = recs.length;

    const supervisionReceivedRate = pct(recs.filter((r) => r.supervisionReceived).length, totalRecords);
    const wellbeingCheckedRate = pct(recs.filter((r) => r.wellbeingChecked).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10->2, >=5->1] + rate1 supervisionReceivedRate [>=80->3, >=60->2, >=40->1] + rate2 wellbeingCheckedRate [same] + diversity [>=4->2, >=2->1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (supervisionReceivedRate >= 80) score += 3;
    else if (supervisionReceivedRate >= 60) score += 2;
    else if (supervisionReceivedRate >= 40) score += 1;

    if (wellbeingCheckedRate >= 80) score += 3;
    else if (wellbeingCheckedRate >= 60) score += 2;
    else if (wellbeingCheckedRate >= 40) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      staffId,
      staffName,
      totalRecords,
      supervisionReceivedRate,
      wellbeingCheckedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ─────────────────────────────────────────

export function generateStaffWellbeingIntelligence(
  records: StaffWellbeingRecord[],
  policy: StaffWellbeingPolicy | null,
  staff: StaffWellbeingTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): StaffWellbeingIntelligence {
  const wellbeingQuality = evaluateWellbeingQuality(records);
  const wellbeingCompliance = evaluateWellbeingCompliance(records);
  const wellbeingPolicy = evaluateWellbeingPolicy(policy);
  const staffReadiness = evaluateStaffWellbeingReadiness(staff);
  const staffProfiles = buildStaffWellbeingProfiles(records);

  const overallScore = Math.min(
    100,
    wellbeingQuality.overallScore + wellbeingCompliance.overallScore + wellbeingPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (wellbeingQuality.supervisionReceivedRate >= 80) strengths.push("Staff consistently receive supervision as required");
  if (wellbeingQuality.wellbeingCheckedRate >= 80) strengths.push("Wellbeing check-ins are routinely conducted with staff");
  if (wellbeingQuality.debriefOfferedRate >= 80) strengths.push("Debriefing is consistently offered following incidents");
  if (wellbeingQuality.supportAccessedRate >= 80) strengths.push("Staff are accessing available support services");
  if (wellbeingCompliance.documentationRate >= 80) strengths.push("Wellbeing documentation is thorough and complete");
  if (wellbeingCompliance.timelyRecordingRate >= 80) strengths.push("Wellbeing records are completed within required timescales");
  if (staffReadiness.supervisionDeliveryRate >= 80) strengths.push("Managers are well trained in supervision delivery");
  if (staffReadiness.wellbeingAssessmentRate >= 80) strengths.push("Managers are skilled in wellbeing assessment");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (wellbeingQuality.supervisionReceivedRate < 60) areasForImprovement.push("Staff are not consistently receiving supervision");
  if (wellbeingQuality.wellbeingCheckedRate < 60) areasForImprovement.push("Wellbeing check-ins are not being conducted regularly");
  if (wellbeingQuality.debriefOfferedRate < 60) areasForImprovement.push("Debriefing is not being offered consistently after incidents");
  if (wellbeingQuality.supportAccessedRate < 60) areasForImprovement.push("Staff are not accessing available support services");
  if (wellbeingCompliance.documentationRate < 60) areasForImprovement.push("Wellbeing documentation is incomplete or inconsistent");
  if (wellbeingCompliance.timelyRecordingRate < 60) areasForImprovement.push("Wellbeing records are not being completed promptly");
  if (staffReadiness.supervisionDeliveryRate < 60) areasForImprovement.push("Managers need more training in supervision delivery");
  if (staffReadiness.wellbeingAssessmentRate < 60) areasForImprovement.push("Managers need development in wellbeing assessment skills");

  // Actions
  const actions: string[] = [];
  if (wellbeingPolicy.overallScore === 0) actions.push("URGENT: Establish a staff wellbeing policy — CHR 2015 Reg 31 requires employers to ensure fitness of workers");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide supervision and wellbeing training to all managers — staff cannot be supported without skilled supervisors");
  if (wellbeingQuality.supervisionReceivedRate < 50) actions.push("Ensure all staff receive regular supervision — SCCIF leadership and management standard requires effective oversight");
  if (wellbeingQuality.wellbeingCheckedRate < 50) actions.push("Implement systematic wellbeing check-ins for all staff — Health and Safety at Work Act 1974 duty of care");
  if (wellbeingCompliance.documentationRate < 50) actions.push("Improve wellbeing documentation — all supervision and support must be fully recorded");
  if (wellbeingCompliance.timelyRecordingRate < 50) actions.push("Review recording timescales — wellbeing records should be completed promptly");
  if (wellbeingQuality.debriefOfferedRate < 50) actions.push("Ensure debriefing is offered after all significant incidents — Management of H&S Regulations 1999");
  if (staffReadiness.debriefingSkillsRate < 50) actions.push("Train managers in debriefing skills — effective debriefing prevents secondary trauma");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 31 — Fitness of workers",
    "CHR 2015 Reg 33 — Fitness of premises (staffing adequacy)",
    "SCCIF — Leadership and management",
    "Health and Safety at Work Act 1974 — Employer duty of care",
    "Management of Health and Safety at Work Regulations 1999",
    "Ofsted Workforce Expectations — Staff support and supervision",
    "DfE Guide to CRH — Staff wellbeing and retention",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    wellbeingQuality,
    wellbeingCompliance,
    wellbeingPolicy,
    staffReadiness,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
