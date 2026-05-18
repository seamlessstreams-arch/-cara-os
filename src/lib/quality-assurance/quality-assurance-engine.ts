// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Quality Assurance & Continuous Improvement Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Maps to: CHR 2015 Reg 13 (leadership & management), Reg 45 (RI reviews),
// SCCIF effectiveness of leaders & managers, Working Together 2023
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type AuditArea =
  | "safeguarding"
  | "medication"
  | "care_planning"
  | "behaviour_management"
  | "health_wellbeing"
  | "education"
  | "premises"
  | "staffing"
  | "record_keeping"
  | "complaints"
  | "fire_safety"
  | "missing_children"
  | "contact_arrangements"
  | "key_working"
  | "children_rights";

export type AuditRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

export type ActionPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type ActionStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "overdue"
  | "deferred";

export type ImprovementStatus =
  | "planning"
  | "active"
  | "completed"
  | "paused"
  | "abandoned";

export type SelfEvaluationDomain =
  | "overall_experiences"
  | "help_and_protection"
  | "leadership_and_management";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface InternalAudit {
  id: string;
  homeId: string;
  auditArea: AuditArea;
  auditDate: string;
  conductedBy: string;
  rating: AuditRating;
  findingsCount: number;
  criticalFindings: number;
  strengthsIdentified: string[];
  areasForImprovement: string[];
  previousRating?: AuditRating;
  nextScheduledDate: string;
}

export interface ActionPlanItem {
  id: string;
  homeId: string;
  source: "internal_audit" | "reg44_visit" | "ofsted_inspection" | "complaint" | "incident" | "self_evaluation" | "ri_review";
  sourceId?: string;
  description: string;
  priority: ActionPriority;
  assignedTo: string;
  createdDate: string;
  targetDate: string;
  completedDate?: string;
  status: ActionStatus;
  evidenceOfCompletion?: string;
  impactAssessed: boolean;
}

export interface QualityImprovementInitiative {
  id: string;
  homeId: string;
  title: string;
  description: string;
  startDate: string;
  targetEndDate: string;
  completedDate?: string;
  status: ImprovementStatus;
  leadBy: string;
  linkedAuditAreas: AuditArea[];
  measurableOutcome: string;
  baselineMeasure?: string;
  currentMeasure?: string;
  targetMeasure: string;
  childrenInvolved: boolean;
  staffInvolved: boolean;
}

export interface SelfEvaluationRecord {
  id: string;
  homeId: string;
  domain: SelfEvaluationDomain;
  evaluationDate: string;
  evaluatedBy: string;
  currentRating: AuditRating;
  evidenceBase: string[];
  strengths: string[];
  areasForDevelopment: string[];
  improvementPriorities: string[];
  childVoiceIncluded: boolean;
  staffVoiceIncluded: boolean;
  externalFeedbackIncluded: boolean;
  nextReviewDate: string;
}

export interface QualityMonitoringRecord {
  id: string;
  homeId: string;
  monitoringType: "case_file_audit" | "observation" | "dip_sample" | "theme_review" | "compliance_check";
  date: string;
  conductedBy: string;
  area: AuditArea;
  sampleSize: number;
  complianceRate: number; // 0–100
  issuesFound: number;
  goodPracticeFound: number;
  followUpRequired: boolean;
  followUpCompleted?: boolean;
}

// ── Result Types ─────────────────────────────────────────────────────────────

export interface AuditCycleResult {
  totalAudits: number;
  areasAudited: number;
  totalAuditAreas: number;
  coverageRate: number;
  ratingBreakdown: Record<AuditRating, number>;
  averageFindings: number;
  criticalFindingsTotal: number;
  improvingAreas: string[];
  decliningAreas: string[];
  overallAuditScore: number;
}

export interface ActionTrackingResult {
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  inProgressActions: number;
  completionRate: number;
  overdueRate: number;
  averageCompletionDays: number;
  criticalActionsOverdue: number;
  sourceBreakdown: Record<string, number>;
  impactAssessedRate: number;
  overallActionScore: number;
}

export interface ImprovementResult {
  totalInitiatives: number;
  activeInitiatives: number;
  completedInitiatives: number;
  completionRate: number;
  childInvolvementRate: number;
  staffInvolvementRate: number;
  measurableOutcomeRate: number;
  linkedToAuditRate: number;
  overallImprovementScore: number;
}

export interface SelfEvaluationResult {
  totalEvaluations: number;
  domainsCovered: number;
  totalDomains: number;
  averageRating: number;
  childVoiceRate: number;
  staffVoiceRate: number;
  externalFeedbackRate: number;
  ratingBreakdown: Record<AuditRating, number>;
  overallSelfEvalScore: number;
}

export interface MonitoringResult {
  totalMonitoring: number;
  averageComplianceRate: number;
  followUpRequiredRate: number;
  followUpCompletedRate: number;
  areaBreakdown: Record<string, number>;
  overallMonitoringScore: number;
}

export interface QualityAssuranceIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: AuditRating;
  auditCycle: AuditCycleResult;
  actionTracking: ActionTrackingResult;
  improvement: ImprovementResult;
  selfEvaluation: SelfEvaluationResult;
  monitoring: MonitoringResult;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_AUDIT_AREAS: AuditArea[] = [
  "safeguarding", "medication", "care_planning", "behaviour_management",
  "health_wellbeing", "education", "premises", "staffing",
  "record_keeping", "complaints", "fire_safety", "missing_children",
  "contact_arrangements", "key_working", "children_rights",
];

const RATING_SCORES: Record<AuditRating, number> = {
  outstanding: 4,
  good: 3,
  requires_improvement: 2,
  inadequate: 1,
};

const ALL_SELF_EVAL_DOMAINS: SelfEvaluationDomain[] = [
  "overall_experiences",
  "help_and_protection",
  "leadership_and_management",
];

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateAuditCycle(
  audits: InternalAudit[],
): AuditCycleResult {
  if (audits.length === 0) {
    return {
      totalAudits: 0, areasAudited: 0, totalAuditAreas: ALL_AUDIT_AREAS.length,
      coverageRate: 0, ratingBreakdown: { outstanding: 0, good: 0, requires_improvement: 0, inadequate: 0 },
      averageFindings: 0, criticalFindingsTotal: 0,
      improvingAreas: [], decliningAreas: [], overallAuditScore: 0,
    };
  }

  const areasAudited = new Set(audits.map((a) => a.auditArea));
  const coverageRate = areasAudited.size / ALL_AUDIT_AREAS.length;

  const ratingBreakdown: Record<AuditRating, number> = {
    outstanding: 0, good: 0, requires_improvement: 0, inadequate: 0,
  };
  let totalFindings = 0;
  let criticalTotal = 0;

  for (const a of audits) {
    ratingBreakdown[a.rating]++;
    totalFindings += a.findingsCount;
    criticalTotal += a.criticalFindings;
  }

  // Track improving/declining areas (compare with previous rating if available)
  const improvingAreas: string[] = [];
  const decliningAreas: string[] = [];

  for (const a of audits) {
    if (a.previousRating) {
      const current = RATING_SCORES[a.rating];
      const previous = RATING_SCORES[a.previousRating];
      if (current > previous) improvingAreas.push(a.auditArea);
      else if (current < previous) decliningAreas.push(a.auditArea);
    }
  }

  // Score: coverage (30) + rating quality (40) + critical findings (30)
  const coverageScore = coverageRate * 30;
  const totalRatingScore = audits.reduce((s, a) => s + RATING_SCORES[a.rating], 0);
  const avgRatingScore = totalRatingScore / audits.length;
  const ratingScore = (avgRatingScore / 4) * 40;
  const criticalPenalty = Math.min(criticalTotal * 5, 30);
  const findingScore = Math.max(30 - criticalPenalty, 0);

  return {
    totalAudits: audits.length,
    areasAudited: areasAudited.size,
    totalAuditAreas: ALL_AUDIT_AREAS.length,
    coverageRate: Math.round(coverageRate * 100),
    ratingBreakdown,
    averageFindings: Math.round((totalFindings / audits.length) * 10) / 10,
    criticalFindingsTotal: criticalTotal,
    improvingAreas,
    decliningAreas,
    overallAuditScore: Math.round(coverageScore + ratingScore + findingScore),
  };
}

export function evaluateActionTracking(
  actions: ActionPlanItem[],
  referenceDate: string,
): ActionTrackingResult {
  if (actions.length === 0) {
    return {
      totalActions: 0, completedActions: 0, overdueActions: 0,
      inProgressActions: 0, completionRate: 0, overdueRate: 0,
      averageCompletionDays: 0, criticalActionsOverdue: 0,
      sourceBreakdown: {}, impactAssessedRate: 0, overallActionScore: 0,
    };
  }

  let completed = 0;
  let overdue = 0;
  let inProgress = 0;
  let criticalOverdue = 0;
  let impactAssessed = 0;
  let totalCompletionDays = 0;
  let completedWithDates = 0;
  const sourceBreakdown: Record<string, number> = {};

  for (const a of actions) {
    sourceBreakdown[a.source] = (sourceBreakdown[a.source] || 0) + 1;

    if (a.status === "completed") {
      completed++;
      if (a.completedDate) {
        const created = new Date(a.createdDate).getTime();
        const done = new Date(a.completedDate).getTime();
        totalCompletionDays += (done - created) / (1000 * 60 * 60 * 24);
        completedWithDates++;
      }
    } else if (a.status === "overdue" || (a.status === "open" || a.status === "in_progress") && a.targetDate < referenceDate) {
      overdue++;
      if (a.priority === "critical") criticalOverdue++;
    } else if (a.status === "in_progress") {
      inProgress++;
    }

    if (a.impactAssessed) impactAssessed++;
  }

  const completionRate = completed / actions.length;
  const overdueRate = overdue / actions.length;
  const avgCompletionDays = completedWithDates > 0
    ? totalCompletionDays / completedWithDates
    : 0;
  const impactRate = completed > 0 ? impactAssessed / actions.length : 0;

  // Score: completion (40) + overdue penalty (30) + impact assessment (30)
  const completionScore = completionRate * 40;
  const overduePenalty = Math.min(overdueRate * 50, 30);
  const overdueScore = Math.max(30 - overduePenalty, 0);
  const criticalPenalty = criticalOverdue * 10;
  const impactScore = impactRate * 30;

  const overallActionScore = Math.round(
    Math.max(completionScore + overdueScore + impactScore - criticalPenalty, 0),
  );

  return {
    totalActions: actions.length,
    completedActions: completed,
    overdueActions: overdue,
    inProgressActions: inProgress,
    completionRate: Math.round(completionRate * 100),
    overdueRate: Math.round(overdueRate * 100),
    averageCompletionDays: Math.round(avgCompletionDays),
    criticalActionsOverdue: criticalOverdue,
    sourceBreakdown,
    impactAssessedRate: Math.round(impactRate * 100),
    overallActionScore: Math.min(overallActionScore, 100),
  };
}

export function evaluateImprovement(
  initiatives: QualityImprovementInitiative[],
): ImprovementResult {
  if (initiatives.length === 0) {
    return {
      totalInitiatives: 0, activeInitiatives: 0, completedInitiatives: 0,
      completionRate: 0, childInvolvementRate: 0, staffInvolvementRate: 0,
      measurableOutcomeRate: 0, linkedToAuditRate: 0, overallImprovementScore: 0,
    };
  }

  let active = 0;
  let completed = 0;
  let childInvolved = 0;
  let staffInvolved = 0;
  let hasMeasurable = 0;
  let linkedToAudit = 0;

  for (const i of initiatives) {
    if (i.status === "active") active++;
    if (i.status === "completed") completed++;
    if (i.childrenInvolved) childInvolved++;
    if (i.staffInvolved) staffInvolved++;
    if (i.currentMeasure) hasMeasurable++;
    if (i.linkedAuditAreas.length > 0) linkedToAudit++;
  }

  const n = initiatives.length;
  const completableTotal = initiatives.filter(
    (i) => i.status === "completed" || i.status === "active" || i.status === "paused",
  ).length;
  const completionRate = completableTotal > 0 ? completed / completableTotal : 0;

  // Score: activity (20) + completion (25) + involvement (25) + measurability (15) + audit link (15)
  const activityScore = Math.min(active / 2, 1) * 20;
  const completionScore = completionRate * 25;
  const involvementScore =
    ((childInvolved / n + staffInvolved / n) / 2) * 25;
  const measurableScore = (hasMeasurable / n) * 15;
  const auditLinkScore = (linkedToAudit / n) * 15;

  return {
    totalInitiatives: n,
    activeInitiatives: active,
    completedInitiatives: completed,
    completionRate: Math.round(completionRate * 100),
    childInvolvementRate: Math.round((childInvolved / n) * 100),
    staffInvolvementRate: Math.round((staffInvolved / n) * 100),
    measurableOutcomeRate: Math.round((hasMeasurable / n) * 100),
    linkedToAuditRate: Math.round((linkedToAudit / n) * 100),
    overallImprovementScore: Math.round(
      activityScore + completionScore + involvementScore + measurableScore + auditLinkScore,
    ),
  };
}

export function evaluateSelfEvaluation(
  evaluations: SelfEvaluationRecord[],
): SelfEvaluationResult {
  if (evaluations.length === 0) {
    return {
      totalEvaluations: 0, domainsCovered: 0,
      totalDomains: ALL_SELF_EVAL_DOMAINS.length,
      averageRating: 0, childVoiceRate: 0, staffVoiceRate: 0,
      externalFeedbackRate: 0,
      ratingBreakdown: { outstanding: 0, good: 0, requires_improvement: 0, inadequate: 0 },
      overallSelfEvalScore: 0,
    };
  }

  const domains = new Set(evaluations.map((e) => e.domain));
  const ratingBreakdown: Record<AuditRating, number> = {
    outstanding: 0, good: 0, requires_improvement: 0, inadequate: 0,
  };

  let totalRating = 0;
  let childVoice = 0;
  let staffVoice = 0;
  let externalFeedback = 0;

  for (const e of evaluations) {
    ratingBreakdown[e.currentRating]++;
    totalRating += RATING_SCORES[e.currentRating];
    if (e.childVoiceIncluded) childVoice++;
    if (e.staffVoiceIncluded) staffVoice++;
    if (e.externalFeedbackIncluded) externalFeedback++;
  }

  const n = evaluations.length;
  const domainsCovered = domains.size;
  const coverageRate = domainsCovered / ALL_SELF_EVAL_DOMAINS.length;
  const avgRating = totalRating / n;
  const childVoiceRate = childVoice / n;
  const staffVoiceRate = staffVoice / n;
  const externalRate = externalFeedback / n;

  // Score: coverage (25) + quality (30) + voice (25) + external (20)
  const coverageScore = coverageRate * 25;
  const qualityScore = (avgRating / 4) * 30;
  const voiceScore = ((childVoiceRate + staffVoiceRate) / 2) * 25;
  const externalScore = externalRate * 20;

  return {
    totalEvaluations: n,
    domainsCovered,
    totalDomains: ALL_SELF_EVAL_DOMAINS.length,
    averageRating: Math.round(avgRating * 10) / 10,
    childVoiceRate: Math.round(childVoiceRate * 100),
    staffVoiceRate: Math.round(staffVoiceRate * 100),
    externalFeedbackRate: Math.round(externalRate * 100),
    ratingBreakdown,
    overallSelfEvalScore: Math.round(
      coverageScore + qualityScore + voiceScore + externalScore,
    ),
  };
}

export function evaluateMonitoring(
  records: QualityMonitoringRecord[],
): MonitoringResult {
  if (records.length === 0) {
    return {
      totalMonitoring: 0, averageComplianceRate: 0,
      followUpRequiredRate: 0, followUpCompletedRate: 0,
      areaBreakdown: {}, overallMonitoringScore: 0,
    };
  }

  let totalCompliance = 0;
  let followUpRequired = 0;
  let followUpCompleted = 0;
  const areaBreakdown: Record<string, number> = {};

  for (const r of records) {
    totalCompliance += r.complianceRate;
    areaBreakdown[r.area] = (areaBreakdown[r.area] || 0) + 1;
    if (r.followUpRequired) {
      followUpRequired++;
      if (r.followUpCompleted) followUpCompleted++;
    }
  }

  const n = records.length;
  const avgCompliance = totalCompliance / n;
  const followUpRequiredRate = followUpRequired / n;
  const followUpCompletedRate = followUpRequired > 0
    ? followUpCompleted / followUpRequired
    : 1;

  // Score: compliance (50) + follow-up (30) + activity (20)
  const complianceScore = (avgCompliance / 100) * 50;
  const followUpScore = followUpCompletedRate * 30;
  const activityScore = Math.min(n / 6, 1) * 20; // Target 6+ monitoring activities

  return {
    totalMonitoring: n,
    averageComplianceRate: Math.round(avgCompliance),
    followUpRequiredRate: Math.round(followUpRequiredRate * 100),
    followUpCompletedRate: Math.round(followUpCompletedRate * 100),
    areaBreakdown,
    overallMonitoringScore: Math.round(
      complianceScore + followUpScore + activityScore,
    ),
  };
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateQualityAssuranceIntelligence(
  audits: InternalAudit[],
  actions: ActionPlanItem[],
  initiatives: QualityImprovementInitiative[],
  evaluations: SelfEvaluationRecord[],
  monitoring: QualityMonitoringRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): QualityAssuranceIntelligenceResult {
  const auditResult = evaluateAuditCycle(audits);
  const actionResult = evaluateActionTracking(actions, referenceDate);
  const improvementResult = evaluateImprovement(initiatives);
  const selfEvalResult = evaluateSelfEvaluation(evaluations);
  const monitoringResult = evaluateMonitoring(monitoring);

  // Weighted scoring (100 points):
  // Audit cycle: 25
  // Action tracking: 25
  // Improvement: 20
  // Self-evaluation: 15
  // Monitoring: 15
  const overallScore = Math.round(
    (auditResult.overallAuditScore * 0.25) +
    (actionResult.overallActionScore * 0.25) +
    (improvementResult.overallImprovementScore * 0.20) +
    (selfEvalResult.overallSelfEvalScore * 0.15) +
    (monitoringResult.overallMonitoringScore * 0.15),
  );

  const rating: AuditRating =
    overallScore >= 80 ? "outstanding"
    : overallScore >= 60 ? "good"
    : overallScore >= 40 ? "requires_improvement"
    : "inadequate";

  // Generate insights
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions2: string[] = [];

  // Strengths
  if (auditResult.overallAuditScore >= 80) {
    strengths.push("Comprehensive internal audit programme with strong coverage across all areas");
  }
  if (auditResult.improvingAreas.length > 0) {
    strengths.push(`Improving audit ratings in: ${auditResult.improvingAreas.map((a) => getAuditAreaLabel(a as AuditArea)).join(", ")}`);
  }
  if (actionResult.completionRate >= 80) {
    strengths.push("Strong action plan completion rate demonstrates follow-through on identified improvements");
  }
  if (improvementResult.childInvolvementRate >= 70) {
    strengths.push("Children actively involved in quality improvement initiatives");
  }
  if (selfEvalResult.childVoiceRate >= 80) {
    strengths.push("Self-evaluation processes consistently incorporate child voice");
  }
  if (monitoringResult.averageComplianceRate >= 90) {
    strengths.push("Quality monitoring shows consistently high compliance across audited areas");
  }
  if (actionResult.impactAssessedRate >= 70) {
    strengths.push("Impact of completed actions is systematically assessed to verify effectiveness");
  }

  // Areas for improvement
  if (auditResult.coverageRate < 80) {
    areasForImprovement.push(
      `Audit coverage at ${auditResult.coverageRate}% — ${ALL_AUDIT_AREAS.length - auditResult.areasAudited} area(s) not yet audited`,
    );
  }
  if (auditResult.criticalFindingsTotal > 0) {
    areasForImprovement.push(
      `${auditResult.criticalFindingsTotal} critical audit finding(s) require urgent attention`,
    );
  }
  if (auditResult.decliningAreas.length > 0) {
    areasForImprovement.push(
      `Declining audit ratings in: ${auditResult.decliningAreas.map((a) => getAuditAreaLabel(a as AuditArea)).join(", ")}`,
    );
  }
  if (actionResult.overdueActions > 0) {
    areasForImprovement.push(
      `${actionResult.overdueActions} action(s) overdue${actionResult.criticalActionsOverdue > 0 ? ` including ${actionResult.criticalActionsOverdue} critical` : ""}`,
    );
  }
  if (selfEvalResult.domainsCovered < ALL_SELF_EVAL_DOMAINS.length) {
    areasForImprovement.push(
      `Self-evaluation incomplete — ${ALL_SELF_EVAL_DOMAINS.length - selfEvalResult.domainsCovered} SCCIF domain(s) not evaluated`,
    );
  }
  if (monitoringResult.followUpCompletedRate < 80 && monitoringResult.followUpRequiredRate > 0) {
    areasForImprovement.push("Follow-up actions from quality monitoring not consistently completed");
  }

  // Actions
  if (auditResult.coverageRate < 100) {
    actions2.push("Schedule audits for uncovered areas to achieve full audit cycle completion");
  }
  if (actionResult.overdueRate > 20) {
    actions2.push("Implement fortnightly action plan review meetings to address overdue items");
  }
  if (improvementResult.measurableOutcomeRate < 80) {
    actions2.push("Ensure all improvement initiatives have measurable baseline and target outcomes");
  }
  if (selfEvalResult.overallSelfEvalScore < 70) {
    actions2.push("Complete self-evaluation across all three SCCIF domains with child and staff voice");
  }
  if (monitoringResult.totalMonitoring < 6) {
    actions2.push("Increase frequency of quality monitoring activities (target minimum 6 per period)");
  }
  if (actionResult.impactAssessedRate < 60) {
    actions2.push("Systematically assess impact of completed actions to close the quality improvement loop");
  }

  const regulatoryLinks = [
    "CHR 2015 Reg 13 — Leadership and management (quality of care monitoring)",
    "CHR 2015 Reg 45 — Review of quality of care (independent person)",
    "CHR 2015 Reg 35 — Fitness of premises (ongoing monitoring)",
    "SCCIF — Effectiveness of leaders and managers (self-evaluation, improvement)",
    "Working Together 2023 — Organisational safeguarding culture",
    "Ofsted Social Care Common Inspection Framework — Quality assurance systems",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    auditCycle: auditResult,
    actionTracking: actionResult,
    improvement: improvementResult,
    selfEvaluation: selfEvalResult,
    monitoring: monitoringResult,
    strengths,
    areasForImprovement,
    actions: actions2,
    regulatoryLinks,
  };
}

// ── Label Functions ──────────────────────────────────────────────────────────

export function getAuditAreaLabel(area: AuditArea): string {
  const labels: Record<AuditArea, string> = {
    safeguarding: "Safeguarding",
    medication: "Medication",
    care_planning: "Care Planning",
    behaviour_management: "Behaviour Management",
    health_wellbeing: "Health & Wellbeing",
    education: "Education",
    premises: "Premises",
    staffing: "Staffing",
    record_keeping: "Record Keeping",
    complaints: "Complaints",
    fire_safety: "Fire Safety",
    missing_children: "Missing Children",
    contact_arrangements: "Contact Arrangements",
    key_working: "Key Working",
    children_rights: "Children's Rights",
  };
  return labels[area] || area;
}

export function getActionPriorityLabel(priority: ActionPriority): string {
  const labels: Record<ActionPriority, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[priority] || priority;
}

export function getActionStatusLabel(status: ActionStatus): string {
  const labels: Record<ActionStatus, string> = {
    open: "Open",
    in_progress: "In Progress",
    completed: "Completed",
    overdue: "Overdue",
    deferred: "Deferred",
  };
  return labels[status] || status;
}

export function getSelfEvaluationDomainLabel(domain: SelfEvaluationDomain): string {
  const labels: Record<SelfEvaluationDomain, string> = {
    overall_experiences: "Overall Experiences & Progress",
    help_and_protection: "How Well Children Are Helped & Protected",
    leadership_and_management: "Effectiveness of Leaders & Managers",
  };
  return labels[domain] || domain;
}
