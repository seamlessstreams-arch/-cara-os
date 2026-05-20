// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Management Oversight Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Evaluates quality of management oversight in children's homes:
// registered manager's monitoring, auditing, Reg 44/45 visits,
// scrutiny of records, decision-making quality, and leadership.
//
// Regulatory framework:
//   CHR 2015 Reg 13  — Leadership and management
//   CHR 2015 Reg 44  — Independent person: visits
//   CHR 2015 Reg 45  — Review of quality of care
//   SCCIF            — Social Care Common Inspection Framework
//   Ofsted SCCIF     — Impact of leaders on outcomes
//   Children Act 1989 — Welfare of looked-after children
//   Children's Homes (England) Regulations 2015
//
// Scoring breakdown (0-100):
//   Oversight quality:    25  — Thoroughness, action plans, follow-up, documentation
//   Compliance:           25  — Frequency, coverage, timeliness, diversity
//   Policy framework:     25  — 7 governance policies in place
//   Staff readiness:      25  — Staff skills for oversight activities
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type OversightCategory =
  | "case_file_audit"
  | "practice_observation"
  | "reg44_monitoring"
  | "reg45_monitoring"
  | "incident_review"
  | "staff_supervision_audit"
  | "quality_assurance_check"
  | "outcomes_tracking";

export type OversightOutcome =
  | "compliant"
  | "partially_compliant"
  | "non_compliant"
  | "not_assessed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface OversightRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  category: OversightCategory;
  completedThoroughly: boolean;
  actionPlanCreated: boolean;
  followUpCompleted: boolean;
  childImpactAssessed: boolean;
  staffFeedbackGiven: boolean;
  documentedProperly: boolean;
}

export interface OversightPolicy {
  id: string;
  oversightFramework: boolean;
  auditSchedule: boolean;
  qualityAssurancePlan: boolean;
  incidentReviewProtocol: boolean;
  performanceMonitoring: boolean;
  regulatoryCompliancePlan: boolean;
  continuousImprovementPolicy: boolean;
}

export interface StaffOversightTraining {
  id: string;
  staffId: string;
  staffName: string;
  auditSkills: boolean;
  qualityAssuranceKnowledge: boolean;
  regulatoryAwareness: boolean;
  leadershipCapability: boolean;
  dataAnalysis: boolean;
  reflectivePractice: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface OversightQualityResult {
  overallScore: number; // 0-25
  totalRecords: number;
  thoroughRate: number;
  actionPlanRate: number;
  followUpRate: number;
  childImpactRate: number;
  staffFeedbackRate: number;
  documentationRate: number;
}

export interface OversightComplianceResult {
  overallScore: number; // 0-25
  totalRecords: number;
  frequencyRate: number;
  coverageRate: number;
  timelinessRate: number;
  categoryDiversityRate: number;
}

export interface OversightPolicyResult {
  overallScore: number; // 0-25
  oversightFramework: boolean;
  auditSchedule: boolean;
  qualityAssurancePlan: boolean;
  incidentReviewProtocol: boolean;
  performanceMonitoring: boolean;
  regulatoryCompliancePlan: boolean;
  continuousImprovementPolicy: boolean;
}

export interface StaffReadinessResult {
  overallScore: number; // 0-25
  totalStaff: number;
  auditSkillsRate: number;
  qualityAssuranceRate: number;
  regulatoryAwarenessRate: number;
  leadershipRate: number;
  dataAnalysisRate: number;
  reflectivePracticeRate: number;
}

export interface ChildOversightProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  overallScore: number; // 0-10
  frequencyScore: number;
  thoroughnessScore: number;
  followUpScore: number;
  diversityScore: number;
}

export interface ManagementOversightIntelligence {
  overallScore: number; // 0-100, capped
  rating: Rating;
  oversightQuality: OversightQualityResult;
  compliance: OversightComplianceResult;
  policyFramework: OversightPolicyResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildOversightProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Calculate percentage, returning 0 if denominator is 0. */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Map overall score (0-100) to Ofsted-style rating. */
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getOversightCategoryLabel(category: OversightCategory): string {
  const labels: Record<OversightCategory, string> = {
    case_file_audit: "Case File Audit",
    practice_observation: "Practice Observation",
    reg44_monitoring: "Reg 44 Monitoring",
    reg45_monitoring: "Reg 45 Monitoring",
    incident_review: "Incident Review",
    staff_supervision_audit: "Staff Supervision Audit",
    quality_assurance_check: "Quality Assurance Check",
    outcomes_tracking: "Outcomes Tracking",
  };
  return labels[category] || category;
}

export function getOversightOutcomeLabel(outcome: OversightOutcome): string {
  const labels: Record<OversightOutcome, string> = {
    compliant: "Compliant",
    partially_compliant: "Partially Compliant",
    non_compliant: "Non-Compliant",
    not_assessed: "Not Assessed",
  };
  return labels[outcome] || outcome;
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] || rating;
}

// ── Evaluator 1: Oversight Quality (0-25) ───────────────────────────────────

/**
 * Evaluates the quality of oversight activities.
 *
 * 4 rates weighted:
 *   thoroughRate     → 0-7
 *   actionPlanRate   → 0-6
 *   followUpRate     → 0-6
 *   documentationRate → 0-6
 *
 * Total: 7+6+6+6 = 25
 * Empty data = 0.
 */
export function evaluateOversightQuality(
  records: OversightRecord[],
): OversightQualityResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      thoroughRate: 0,
      actionPlanRate: 0,
      followUpRate: 0,
      childImpactRate: 0,
      staffFeedbackRate: 0,
      documentationRate: 0,
    };
  }

  const n = records.length;
  const thoroughRate = pct(records.filter((r) => r.completedThoroughly).length, n);
  const actionPlanRate = pct(records.filter((r) => r.actionPlanCreated).length, n);
  const followUpRate = pct(records.filter((r) => r.followUpCompleted).length, n);
  const childImpactRate = pct(records.filter((r) => r.childImpactAssessed).length, n);
  const staffFeedbackRate = pct(records.filter((r) => r.staffFeedbackGiven).length, n);
  const documentationRate = pct(records.filter((r) => r.documentedProperly).length, n);

  // Scoring
  const thoroughScore = Math.round((thoroughRate / 100) * 7);
  const actionPlanScore = Math.round((actionPlanRate / 100) * 6);
  const followUpScore = Math.round((followUpRate / 100) * 6);
  const documentationScore = Math.round((documentationRate / 100) * 6);

  const overallScore = Math.min(
    25,
    Math.max(0, thoroughScore + actionPlanScore + followUpScore + documentationScore),
  );

  return {
    overallScore,
    totalRecords: n,
    thoroughRate,
    actionPlanRate,
    followUpRate,
    childImpactRate,
    staffFeedbackRate,
    documentationRate,
  };
}

// ── Evaluator 2: Compliance (0-25) ──────────────────────────────────────────

/**
 * Evaluates oversight compliance against expected standards.
 *
 * 4 rates weighted:
 *   frequencyRate        → 0-8   (records per month target)
 *   coverageRate         → 0-7   (children covered / total children)
 *   timelinessRate       → 0-5   (% completed with follow-up on time)
 *   categoryDiversityRate → 0-5  (unique categories / total categories * 100)
 *
 * Total: 8+7+5+5 = 25
 * Empty data = 0.
 */
export function evaluateOversightCompliance(
  records: OversightRecord[],
  totalChildren: number,
): OversightComplianceResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      frequencyRate: 0,
      coverageRate: 0,
      timelinessRate: 0,
      categoryDiversityRate: 0,
    };
  }

  const n = records.length;

  // Frequency: treat 10+ records as 100%, 5+ as 50%, below as proportional
  const frequencyRate = n >= 10 ? 100 : n >= 5 ? 50 + Math.round(((n - 5) / 5) * 50) : Math.round((n / 5) * 50);

  // Coverage: unique children with records / total children expected
  const uniqueChildren = new Set(records.map((r) => r.childId)).size;
  const coverageRate = totalChildren > 0 ? pct(uniqueChildren, totalChildren) : (uniqueChildren > 0 ? 100 : 0);

  // Timeliness: % of records where follow-up was completed (proxy for timely completion)
  const timelinessRate = pct(records.filter((r) => r.followUpCompleted).length, n);

  // Category diversity: unique categories used / total possible categories * 100
  const ALL_CATEGORIES: OversightCategory[] = [
    "case_file_audit",
    "practice_observation",
    "reg44_monitoring",
    "reg45_monitoring",
    "incident_review",
    "staff_supervision_audit",
    "quality_assurance_check",
    "outcomes_tracking",
  ];
  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRate = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Scoring
  const frequencyScore = Math.round((frequencyRate / 100) * 8);
  const coverageScore = Math.round((coverageRate / 100) * 7);
  const timelinessScore = Math.round((timelinessRate / 100) * 5);
  const diversityScore = Math.round((categoryDiversityRate / 100) * 5);

  const overallScore = Math.min(
    25,
    Math.max(0, frequencyScore + coverageScore + timelinessScore + diversityScore),
  );

  return {
    overallScore,
    totalRecords: n,
    frequencyRate,
    coverageRate,
    timelinessRate,
    categoryDiversityRate,
  };
}

// ── Evaluator 3: Policy Framework (0-25) ────────────────────────────────────

/**
 * Evaluates the policy framework supporting oversight.
 *
 * 7 booleans weighted:
 *   oversightFramework         → 4
 *   auditSchedule              → 4
 *   qualityAssurancePlan       → 4
 *   incidentReviewProtocol     → 4
 *   performanceMonitoring      → 3
 *   regulatoryCompliancePlan   → 3
 *   continuousImprovementPolicy → 3
 *
 * Total: 4+4+4+4+3+3+3 = 25
 * Null policy = all false, score 0.
 */
export function evaluateOversightPolicy(
  policy: OversightPolicy | null,
): OversightPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      oversightFramework: false,
      auditSchedule: false,
      qualityAssurancePlan: false,
      incidentReviewProtocol: false,
      performanceMonitoring: false,
      regulatoryCompliancePlan: false,
      continuousImprovementPolicy: false,
    };
  }

  let score = 0;
  if (policy.oversightFramework) score += 4;
  if (policy.auditSchedule) score += 4;
  if (policy.qualityAssurancePlan) score += 4;
  if (policy.incidentReviewProtocol) score += 4;
  if (policy.performanceMonitoring) score += 3;
  if (policy.regulatoryCompliancePlan) score += 3;
  if (policy.continuousImprovementPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    oversightFramework: policy.oversightFramework,
    auditSchedule: policy.auditSchedule,
    qualityAssurancePlan: policy.qualityAssurancePlan,
    incidentReviewProtocol: policy.incidentReviewProtocol,
    performanceMonitoring: policy.performanceMonitoring,
    regulatoryCompliancePlan: policy.regulatoryCompliancePlan,
    continuousImprovementPolicy: policy.continuousImprovementPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ─────────────────────────────────────

/**
 * Evaluates staff readiness for oversight activities.
 *
 * 6 skills weighted:
 *   auditSkills              → 6
 *   qualityAssuranceKnowledge → 5
 *   regulatoryAwareness      → 5
 *   leadershipCapability     → 4
 *   dataAnalysis             → 3
 *   reflectivePractice       → 2
 *
 * Total: 6+5+5+4+3+2 = 25
 * Empty array = 0.
 */
export function evaluateStaffReadiness(
  staff: StaffOversightTraining[],
): StaffReadinessResult {
  if (staff.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      auditSkillsRate: 0,
      qualityAssuranceRate: 0,
      regulatoryAwarenessRate: 0,
      leadershipRate: 0,
      dataAnalysisRate: 0,
      reflectivePracticeRate: 0,
    };
  }

  const n = staff.length;
  const auditSkillsRate = pct(staff.filter((s) => s.auditSkills).length, n);
  const qualityAssuranceRate = pct(staff.filter((s) => s.qualityAssuranceKnowledge).length, n);
  const regulatoryAwarenessRate = pct(staff.filter((s) => s.regulatoryAwareness).length, n);
  const leadershipRate = pct(staff.filter((s) => s.leadershipCapability).length, n);
  const dataAnalysisRate = pct(staff.filter((s) => s.dataAnalysis).length, n);
  const reflectivePracticeRate = pct(staff.filter((s) => s.reflectivePractice).length, n);

  // Scoring
  const auditScore = Math.round((auditSkillsRate / 100) * 6);
  const qaScore = Math.round((qualityAssuranceRate / 100) * 5);
  const regScore = Math.round((regulatoryAwarenessRate / 100) * 5);
  const leaderScore = Math.round((leadershipRate / 100) * 4);
  const dataScore = Math.round((dataAnalysisRate / 100) * 3);
  const reflectiveScore = Math.round((reflectivePracticeRate / 100) * 2);

  const overallScore = Math.min(
    25,
    Math.max(0, auditScore + qaScore + regScore + leaderScore + dataScore + reflectiveScore),
  );

  return {
    overallScore,
    totalStaff: n,
    auditSkillsRate,
    qualityAssuranceRate,
    regulatoryAwarenessRate,
    leadershipRate,
    dataAnalysisRate,
    reflectivePracticeRate,
  };
}

// ── Child Profiles ──────────────────────────────────────────────────────────

/**
 * Build per-child oversight profiles.
 *
 * Score 0-10:
 *   freq: >=10 → 2, >=5 → 1, else 0
 *   thoroughnessScore (completedThoroughly rate): >=80 → 3, >=60 → 2, >=40 → 1, else 0
 *   followUpScore (followUpCompleted rate): >=80 → 3, >=60 → 2, >=40 → 1, else 0
 *   diversityScore (unique categories): >=4 → 2, >=2 → 1, else 0
 *   Cap at 10.
 */
export function buildChildOversightProfiles(
  records: OversightRecord[],
): ChildOversightProfile[] {
  const childMap = new Map<string, OversightRecord[]>();
  for (const r of records) {
    const existing = childMap.get(r.childId) ?? [];
    existing.push(r);
    childMap.set(r.childId, existing);
  }

  const profiles: ChildOversightProfile[] = [];

  for (const [childId, childRecords] of childMap) {
    const childName = childRecords[0].childName;
    const totalRecords = childRecords.length;

    // Frequency score
    let freq = 0;
    if (totalRecords >= 10) freq = 2;
    else if (totalRecords >= 5) freq = 1;

    // Thoroughness score
    const thoroughRate = pct(childRecords.filter((r) => r.completedThoroughly).length, totalRecords);
    let thoroughnessScore = 0;
    if (thoroughRate >= 80) thoroughnessScore = 3;
    else if (thoroughRate >= 60) thoroughnessScore = 2;
    else if (thoroughRate >= 40) thoroughnessScore = 1;

    // Follow-up score
    const followUpRate = pct(childRecords.filter((r) => r.followUpCompleted).length, totalRecords);
    let followUpScore = 0;
    if (followUpRate >= 80) followUpScore = 3;
    else if (followUpRate >= 60) followUpScore = 2;
    else if (followUpRate >= 40) followUpScore = 1;

    // Diversity score
    const uniqueCategories = new Set(childRecords.map((r) => r.category)).size;
    let diversityScore = 0;
    if (uniqueCategories >= 4) diversityScore = 2;
    else if (uniqueCategories >= 2) diversityScore = 1;

    const overallScore = Math.min(10, freq + thoroughnessScore + followUpScore + diversityScore);

    profiles.push({
      childId,
      childName,
      totalRecords,
      overallScore,
      frequencyScore: freq,
      thoroughnessScore,
      followUpScore,
      diversityScore,
    });
  }

  // Sort by total records descending
  profiles.sort((a, b) => b.totalRecords - a.totalRecords);

  return profiles;
}

// ── Master Generator ────────────────────────────────────────────────────────

export function generateManagementOversightIntelligence(
  records: OversightRecord[],
  policy: OversightPolicy | null,
  staff: StaffOversightTraining[],
  totalChildren: number,
): ManagementOversightIntelligence {
  const oversightQuality = evaluateOversightQuality(records);
  const compliance = evaluateOversightCompliance(records, totalChildren);
  const policyFramework = evaluateOversightPolicy(policy);
  const staffReadiness = evaluateStaffReadiness(staff);
  const childProfiles = buildChildOversightProfiles(records);

  // Overall score: sum of 4 evaluators (each 0-25) = 0-100
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      oversightQuality.overallScore +
        compliance.overallScore +
        policyFramework.overallScore +
        staffReadiness.overallScore,
    ),
  );

  const rating = getRating(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];

  if (oversightQuality.thoroughRate >= 80 && oversightQuality.totalRecords > 0) {
    strengths.push(
      "Oversight activities are consistently thorough, demonstrating robust management scrutiny",
    );
  }
  if (oversightQuality.actionPlanRate >= 80 && oversightQuality.totalRecords > 0) {
    strengths.push(
      "Action plans are routinely created following oversight activities, ensuring issues are tracked to resolution",
    );
  }
  if (oversightQuality.followUpRate >= 80 && oversightQuality.totalRecords > 0) {
    strengths.push(
      "Follow-up completion is strong, showing management accountability and drive for improvement",
    );
  }
  if (oversightQuality.documentationRate >= 80 && oversightQuality.totalRecords > 0) {
    strengths.push(
      "Oversight activities are well-documented, providing a clear audit trail for Ofsted inspection",
    );
  }
  if (compliance.coverageRate >= 80) {
    strengths.push(
      "Oversight covers the majority of children in the home, ensuring no child is overlooked",
    );
  }
  if (compliance.categoryDiversityRate >= 80) {
    strengths.push(
      "A diverse range of oversight activities is undertaken, reflecting comprehensive management monitoring",
    );
  }
  if (policyFramework.overallScore >= 20) {
    strengths.push(
      "The policy framework for oversight is robust with key governance documents in place",
    );
  }
  if (staffReadiness.overallScore >= 20) {
    strengths.push(
      "Staff demonstrate strong readiness for oversight activities with good skills coverage",
    );
  }
  if (staffReadiness.auditSkillsRate >= 80 && staffReadiness.totalStaff > 0) {
    strengths.push(
      "Audit skills are well-developed across the staff team, supporting effective quality monitoring",
    );
  }
  if (staffReadiness.regulatoryAwarenessRate >= 80 && staffReadiness.totalStaff > 0) {
    strengths.push(
      "Staff have strong regulatory awareness, enabling informed oversight of compliance requirements",
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "No significant strengths identified — management oversight requires development",
    );
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];

  if (oversightQuality.thoroughRate < 60 && oversightQuality.totalRecords > 0) {
    areasForImprovement.push(
      `Only ${oversightQuality.thoroughRate}% of oversight activities completed thoroughly — rigour must improve`,
    );
  }
  if (oversightQuality.actionPlanRate < 60 && oversightQuality.totalRecords > 0) {
    areasForImprovement.push(
      `Action plans created in only ${oversightQuality.actionPlanRate}% of oversight activities — improvement actions must be documented`,
    );
  }
  if (oversightQuality.followUpRate < 60 && oversightQuality.totalRecords > 0) {
    areasForImprovement.push(
      `Follow-up completed in only ${oversightQuality.followUpRate}% of cases — management must ensure actions are tracked to completion`,
    );
  }
  if (oversightQuality.documentationRate < 60 && oversightQuality.totalRecords > 0) {
    areasForImprovement.push(
      `Documentation rate at ${oversightQuality.documentationRate}% — all oversight must be properly recorded for regulatory evidence`,
    );
  }
  if (compliance.coverageRate < 60) {
    areasForImprovement.push(
      `Oversight coverage of children at ${compliance.coverageRate}% — all children must be included in management monitoring`,
    );
  }
  if (compliance.categoryDiversityRate < 60) {
    areasForImprovement.push(
      `Category diversity at ${compliance.categoryDiversityRate}% — oversight should span all monitoring types including Reg 44/45`,
    );
  }
  if (staffReadiness.auditSkillsRate < 60 && staffReadiness.totalStaff > 0) {
    areasForImprovement.push(
      `Only ${staffReadiness.auditSkillsRate}% of staff have audit skills — training is needed to support effective oversight`,
    );
  }
  if (staffReadiness.regulatoryAwarenessRate < 60 && staffReadiness.totalStaff > 0) {
    areasForImprovement.push(
      `Regulatory awareness at ${staffReadiness.regulatoryAwarenessRate}% — staff need better understanding of CHR 2015 requirements`,
    );
  }

  if (areasForImprovement.length === 0) {
    areasForImprovement.push("No significant areas for improvement identified");
  }

  // ── Actions ──
  const actions: string[] = [];

  if (policyFramework.overallScore === 0) {
    actions.push(
      "URGENT: No oversight policy framework in place — develop and implement governance policies immediately",
    );
  }
  if (staffReadiness.overallScore === 0) {
    actions.push(
      "URGENT: No staff trained in oversight skills — commission management oversight training programme immediately",
    );
  }
  if (oversightQuality.overallScore < 13 && oversightQuality.totalRecords > 0) {
    actions.push(
      "Review and improve oversight quality — implement standardised templates and quality expectations for all monitoring activities",
    );
  }
  if (compliance.overallScore < 13) {
    actions.push(
      "Increase oversight frequency and coverage — develop a monthly monitoring schedule covering all children and activity types",
    );
  }
  if (compliance.frequencyRate < 50) {
    actions.push(
      "Oversight frequency is below expected levels — ensure minimum monthly monitoring activities are completed",
    );
  }
  if (compliance.categoryDiversityRate < 50) {
    actions.push(
      "Diversify oversight activities — ensure Reg 44 visits, Reg 45 reviews, case file audits and practice observations are all undertaken",
    );
  }
  if (!policyFramework.oversightFramework && policy !== null) {
    actions.push(
      "Develop an oversight framework policy setting out the registered manager's monitoring responsibilities",
    );
  }
  if (!policyFramework.auditSchedule && policy !== null) {
    actions.push(
      "Create an audit schedule with planned dates for all oversight activities across the year",
    );
  }
  if (staffReadiness.leadershipRate < 50 && staffReadiness.totalStaff > 0) {
    actions.push(
      "Invest in leadership development for oversight staff to strengthen management capability",
    );
  }
  if (records.length === 0) {
    actions.push(
      "URGENT: No oversight records found — begin systematic management monitoring immediately",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "Continue embedding robust management oversight practices across the home",
    );
  }

  // ── Regulatory Links ──
  const regulatoryLinks = [
    "CHR 2015 Reg 13 — Leadership and management: the registered person must manage the home to consistently promote children's welfare",
    "CHR 2015 Reg 44 — Independent person: visits to monitor the home's operation and report to Ofsted",
    "CHR 2015 Reg 45 — Review of quality of care: the registered person must review and improve quality of care at least every 6 months",
    "SCCIF — Social Care Common Inspection Framework: effectiveness of leaders and managers",
    "Ofsted SCCIF — Impact of leaders on outcomes for children and young people",
    "Children Act 1989 — Duty to safeguard and promote the welfare of looked-after children",
    "Children's Homes (England) Regulations 2015 — Overarching regulatory framework for children's residential care",
  ];

  return {
    overallScore,
    rating,
    oversightQuality,
    compliance,
    policyFramework,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
