// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Inspection — Readiness Assessment Engine
//
// Deterministic engine aggregating all compliance domains into a single
// Ofsted inspection readiness score, aligned to the Social Care Common
// Inspection Framework (SCCIF) judgement areas:
//
//   1. Overall effectiveness
//   2. The impact of leaders on outcomes for children
//   3. How well children and young people are helped and protected
//   4. The positive contribution of the residential experience
//
// Each domain maps to specific Cornerstone modules and generates an
// evidence-based assessment with action priorities.
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type OfstedJudgement =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

export type ReadinessDomain =
  | "leadership_management"
  | "safeguarding"
  | "children_outcomes"
  | "residential_experience"
  | "workforce"
  | "records_compliance"
  | "regulatory_reports"
  | "safer_recruitment";

export type EvidenceStrength = "strong" | "adequate" | "weak" | "absent";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface DomainAssessment {
  domain: ReadinessDomain;
  label: string;
  score: number;                   // 1-4 (1=inadequate, 4=outstanding)
  judgement: OfstedJudgement;
  evidenceStrength: EvidenceStrength;
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  keyMetrics: { label: string; value: string | number; status: "good" | "warning" | "critical" }[];
  sccifRef: string;
}

export interface InspectionReadinessResult {
  homeId: string;
  assessedAt: string;
  overallScore: number;            // 1-4 weighted average
  overallJudgement: OfstedJudgement;
  domains: DomainAssessment[];
  criticalActions: string[];       // highest priority actions
  strengthsSummary: string[];      // top strengths to highlight
  riskFactors: string[];           // things that could trigger inspection
  inspectionLikelihood: "low" | "medium" | "high";  // based on risk factors
  dayssinceLastInspection: number | null;
  readinessPercentage: number;     // 0-100
}

// ── Input Interfaces (from other modules) ──────────────────────────────────

export interface InspectionInputs {
  homeId: string;
  lastInspectionDate?: string;

  // Quality Ecology
  qualityCompliance: number;       // % of records on time
  overdueRecords: number;
  filedRecords: number;
  averageQAScore: number;          // 1-5
  returnRate: number;              // % returned for improvement

  // Safeguarding
  safeguardingIncidents: number;
  safeguardingReferrals: number;
  disclosuresHandled: number;
  missingEpisodes: number;
  returnInterviewsCompleted: number;
  returnInterviewsRequired: number;

  // Workforce
  trainingComplianceRate: number;  // %
  supervisionComplianceRate: number; // %
  vacancyRate: number;             // %
  agencyUsageRate: number;         // %
  turnoverRate: number;            // %
  qualificationRate: number;       // %
  staffWithExpiredTraining: number;

  // Regulatory
  reg44CompletedThisYear: number;
  reg44Expected: number;
  reg44OverdueActions: number;
  reg45UpToDate: boolean;
  notificationComplianceRate: number; // %
  lastReg44Judgement?: OfstedJudgement;

  // Safer Recruitment
  recruitmentBlockers: number;
  dbsExpired: number;
  dbsExpiringSoon: number;
  schedule2ComplianceRate: number; // %

  // Records & Filing
  retentionComplianceRate: number; // %
  documentsOnHold: number;
  pendingDestruction: number;
  recordCompleteness: number;      // % of required fields complete

  // Children's Experience
  childrenViews: "positive" | "mixed" | "negative" | "not_gathered";
  complaintsInPeriod: number;
  complaintsResolvedOnTime: number;
  childProgressRating: number;     // 1-5 average
  activitiesPerWeek: number;
  keyworkerSessionsCompliance: number; // %
}

// ── Core: Calculate Inspection Readiness ──────────────────────────────────

export function calculateInspectionReadiness(
  inputs: InspectionInputs,
  now?: string,
): InspectionReadinessResult {
  const timestamp = now ?? new Date().toISOString();

  const domains: DomainAssessment[] = [
    assessLeadership(inputs),
    assessSafeguarding(inputs),
    assessChildrenOutcomes(inputs),
    assessResidentialExperience(inputs),
    assessWorkforce(inputs),
    assessRecordsCompliance(inputs),
    assessRegulatoryReports(inputs),
    assessSaferRecruitment(inputs),
  ];

  // Calculate overall score (weighted)
  const weights: Record<ReadinessDomain, number> = {
    leadership_management: 1.5,
    safeguarding: 2.0,
    children_outcomes: 2.0,
    residential_experience: 1.5,
    workforce: 1.0,
    records_compliance: 0.8,
    regulatory_reports: 1.0,
    safer_recruitment: 1.2,
  };

  let totalWeight = 0;
  let weightedSum = 0;
  for (const domain of domains) {
    const weight = weights[domain.domain];
    weightedSum += domain.score * weight;
    totalWeight += weight;
  }

  const overallScore = Math.round((weightedSum / totalWeight) * 10) / 10;
  const overallJudgement = scoreToJudgement(overallScore);

  // Aggregate critical actions (from domains with score <= 2)
  const criticalActions = domains
    .filter(d => d.score <= 2)
    .flatMap(d => d.immediateActions)
    .slice(0, 10);

  // Top strengths
  const strengthsSummary = domains
    .filter(d => d.score >= 3)
    .flatMap(d => d.strengths)
    .slice(0, 8);

  // Risk factors that could trigger inspection
  const riskFactors = identifyRiskFactors(inputs, domains);

  // Inspection likelihood
  const inspectionLikelihood = calculateInspectionLikelihood(inputs, riskFactors);

  // Days since last inspection
  const dayssinceLastInspection = inputs.lastInspectionDate
    ? Math.floor((new Date(timestamp).getTime() - new Date(inputs.lastInspectionDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  // Readiness percentage (domains scoring good+ vs total)
  const goodDomains = domains.filter(d => d.score >= 3).length;
  const readinessPercentage = Math.round((goodDomains / domains.length) * 100);

  return {
    homeId: inputs.homeId,
    assessedAt: timestamp,
    overallScore,
    overallJudgement,
    domains,
    criticalActions,
    strengthsSummary,
    riskFactors,
    inspectionLikelihood,
    dayssinceLastInspection,
    readinessPercentage,
  };
}

// ── Domain Assessments ────────────────────────────────────────────────────

function assessLeadership(inputs: InspectionInputs): DomainAssessment {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  const metrics: DomainAssessment["keyMetrics"] = [];

  // Quality assurance
  if (inputs.averageQAScore >= 4) strengths.push("QA scores consistently good/outstanding");
  else if (inputs.averageQAScore < 3) concerns.push("QA scores below acceptable level");

  if (inputs.qualityCompliance >= 95) strengths.push("Near-complete record compliance");
  else if (inputs.qualityCompliance < 80) {
    concerns.push("Record completion below 80%");
    actions.push("Improve record submission timeliness");
  }

  if (inputs.reg45UpToDate) strengths.push("Reg 45 quality review up to date");
  else concerns.push("Reg 45 quality review overdue");

  if (inputs.supervisionComplianceRate >= 90) strengths.push("Strong supervision culture");
  else if (inputs.supervisionComplianceRate < 70) {
    concerns.push("Supervision compliance below 70%");
    actions.push("Restore monthly supervision schedule for all staff");
  }

  metrics.push(
    { label: "QA Score", value: inputs.averageQAScore.toFixed(1), status: inputs.averageQAScore >= 4 ? "good" : inputs.averageQAScore >= 3 ? "warning" : "critical" },
    { label: "Record Compliance", value: `${inputs.qualityCompliance}%`, status: inputs.qualityCompliance >= 90 ? "good" : inputs.qualityCompliance >= 75 ? "warning" : "critical" },
    { label: "Supervision", value: `${inputs.supervisionComplianceRate}%`, status: inputs.supervisionComplianceRate >= 85 ? "good" : inputs.supervisionComplianceRate >= 70 ? "warning" : "critical" },
  );

  const score = calculateDomainScore(strengths.length, concerns.length, actions.length);

  return {
    domain: "leadership_management",
    label: "Leadership & Management",
    score,
    judgement: scoreToJudgement(score),
    evidenceStrength: strengths.length >= 3 ? "strong" : strengths.length >= 1 ? "adequate" : "weak",
    strengths,
    concerns,
    immediateActions: actions,
    keyMetrics: metrics,
    sccifRef: "SCCIF: Impact of leaders on outcomes",
  };
}

function assessSafeguarding(inputs: InspectionInputs): DomainAssessment {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  const metrics: DomainAssessment["keyMetrics"] = [];

  // Return interviews
  const riRate = inputs.returnInterviewsRequired > 0
    ? Math.round((inputs.returnInterviewsCompleted / inputs.returnInterviewsRequired) * 100)
    : 100;

  if (riRate >= 100) strengths.push("All return interviews completed");
  else if (riRate < 80) {
    concerns.push("Return interview completion below 80%");
    actions.push("Complete outstanding return interviews within 72 hours");
  }

  // Missing episodes
  if (inputs.missingEpisodes === 0) strengths.push("No missing episodes in period");
  else if (inputs.missingEpisodes > 5) concerns.push(`${inputs.missingEpisodes} missing episodes — pattern analysis needed`);

  // DBS compliance
  if (inputs.dbsExpired === 0) strengths.push("All DBS checks current");
  else {
    concerns.push(`${inputs.dbsExpired} staff with expired DBS`);
    actions.push("URGENT: Renew expired DBS checks or suspend from unsupervised duties");
  }

  // Training
  if (inputs.staffWithExpiredTraining === 0) strengths.push("All safeguarding training current");
  else concerns.push(`${inputs.staffWithExpiredTraining} staff with expired training`);

  metrics.push(
    { label: "Return Interviews", value: `${riRate}%`, status: riRate >= 100 ? "good" : riRate >= 80 ? "warning" : "critical" },
    { label: "Missing Episodes", value: inputs.missingEpisodes, status: inputs.missingEpisodes === 0 ? "good" : inputs.missingEpisodes <= 3 ? "warning" : "critical" },
    { label: "DBS Expired", value: inputs.dbsExpired, status: inputs.dbsExpired === 0 ? "good" : "critical" },
  );

  const score = calculateDomainScore(strengths.length, concerns.length, actions.length);

  return {
    domain: "safeguarding",
    label: "Safeguarding",
    score,
    judgement: scoreToJudgement(score),
    evidenceStrength: strengths.length >= 2 ? "strong" : strengths.length >= 1 ? "adequate" : "weak",
    strengths,
    concerns,
    immediateActions: actions,
    keyMetrics: metrics,
    sccifRef: "SCCIF: How well children are helped and protected",
  };
}

function assessChildrenOutcomes(inputs: InspectionInputs): DomainAssessment {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  const metrics: DomainAssessment["keyMetrics"] = [];

  // Children's views
  if (inputs.childrenViews === "positive") strengths.push("Children report positive experiences");
  else if (inputs.childrenViews === "negative") {
    concerns.push("Children reporting negative experiences");
    actions.push("Conduct individual listening sessions with each child");
  }

  // Progress rating
  if (inputs.childProgressRating >= 4) strengths.push("Strong child progress across outcomes");
  else if (inputs.childProgressRating < 3) {
    concerns.push("Child progress below expectations");
    actions.push("Review care plans and set SMART targets");
  }

  // Keyworker sessions
  if (inputs.keyworkerSessionsCompliance >= 90) strengths.push("Consistent keyworker engagement");
  else if (inputs.keyworkerSessionsCompliance < 70) {
    concerns.push("Keyworker session compliance below 70%");
    actions.push("Ensure keyworker sessions are prioritised in rota");
  }

  // Complaints
  const complaintsRate = inputs.complaintsInPeriod > 0
    ? Math.round((inputs.complaintsResolvedOnTime / inputs.complaintsInPeriod) * 100)
    : 100;
  if (complaintsRate >= 100 && inputs.complaintsInPeriod > 0) {
    strengths.push("All complaints resolved within timescale");
  }

  metrics.push(
    { label: "Progress Rating", value: inputs.childProgressRating.toFixed(1), status: inputs.childProgressRating >= 4 ? "good" : inputs.childProgressRating >= 3 ? "warning" : "critical" },
    { label: "Children's Views", value: inputs.childrenViews, status: inputs.childrenViews === "positive" ? "good" : inputs.childrenViews === "mixed" ? "warning" : "critical" },
    { label: "Keyworker Compliance", value: `${inputs.keyworkerSessionsCompliance}%`, status: inputs.keyworkerSessionsCompliance >= 85 ? "good" : inputs.keyworkerSessionsCompliance >= 70 ? "warning" : "critical" },
  );

  const score = calculateDomainScore(strengths.length, concerns.length, actions.length);

  return {
    domain: "children_outcomes",
    label: "Children's Outcomes",
    score,
    judgement: scoreToJudgement(score),
    evidenceStrength: inputs.childrenViews !== "not_gathered" ? "strong" : "absent",
    strengths,
    concerns,
    immediateActions: actions,
    keyMetrics: metrics,
    sccifRef: "SCCIF: Positive contribution of the residential experience",
  };
}

function assessResidentialExperience(inputs: InspectionInputs): DomainAssessment {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  const metrics: DomainAssessment["keyMetrics"] = [];

  if (inputs.activitiesPerWeek >= 5) strengths.push("Rich activities programme");
  else if (inputs.activitiesPerWeek < 3) {
    concerns.push("Limited activities offered");
    actions.push("Develop weekly activities plan including community engagement");
  }

  if (inputs.childrenViews === "positive") strengths.push("Positive residential experience reported");

  // Low complaints
  if (inputs.complaintsInPeriod <= 1) strengths.push("Minimal complaints indicates contentment");
  else if (inputs.complaintsInPeriod > 5) concerns.push("Higher than average complaints volume");

  metrics.push(
    { label: "Activities/Week", value: inputs.activitiesPerWeek, status: inputs.activitiesPerWeek >= 5 ? "good" : inputs.activitiesPerWeek >= 3 ? "warning" : "critical" },
    { label: "Complaints", value: inputs.complaintsInPeriod, status: inputs.complaintsInPeriod <= 2 ? "good" : inputs.complaintsInPeriod <= 5 ? "warning" : "critical" },
  );

  const score = calculateDomainScore(strengths.length, concerns.length, actions.length);

  return {
    domain: "residential_experience",
    label: "Residential Experience",
    score,
    judgement: scoreToJudgement(score),
    evidenceStrength: strengths.length >= 2 ? "strong" : "adequate",
    strengths,
    concerns,
    immediateActions: actions,
    keyMetrics: metrics,
    sccifRef: "SCCIF: Positive contribution of the residential experience",
  };
}

function assessWorkforce(inputs: InspectionInputs): DomainAssessment {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  const metrics: DomainAssessment["keyMetrics"] = [];

  if (inputs.trainingComplianceRate >= 90) strengths.push("High training compliance");
  else if (inputs.trainingComplianceRate < 70) {
    concerns.push("Training compliance below acceptable level");
    actions.push("Book all outstanding mandatory training within 14 days");
  }

  if (inputs.vacancyRate === 0) strengths.push("Fully staffed");
  else if (inputs.vacancyRate > 20) {
    concerns.push(`Vacancy rate ${inputs.vacancyRate}% — impacting continuity`);
    actions.push("Escalate recruitment drive");
  }

  if (inputs.agencyUsageRate <= 10) strengths.push("Minimal agency reliance");
  else if (inputs.agencyUsageRate > 30) concerns.push("High agency dependency reduces consistency");

  if (inputs.turnoverRate <= 15) strengths.push("Good staff retention");
  else if (inputs.turnoverRate > 30) concerns.push("High turnover rate impacting stability");

  if (inputs.qualificationRate >= 80) strengths.push("Majority staff at required qualification level");

  metrics.push(
    { label: "Training", value: `${inputs.trainingComplianceRate}%`, status: inputs.trainingComplianceRate >= 85 ? "good" : inputs.trainingComplianceRate >= 70 ? "warning" : "critical" },
    { label: "Vacancy", value: `${inputs.vacancyRate}%`, status: inputs.vacancyRate <= 10 ? "good" : inputs.vacancyRate <= 20 ? "warning" : "critical" },
    { label: "Agency", value: `${inputs.agencyUsageRate}%`, status: inputs.agencyUsageRate <= 15 ? "good" : inputs.agencyUsageRate <= 30 ? "warning" : "critical" },
    { label: "Turnover", value: `${inputs.turnoverRate}%`, status: inputs.turnoverRate <= 20 ? "good" : inputs.turnoverRate <= 35 ? "warning" : "critical" },
  );

  const score = calculateDomainScore(strengths.length, concerns.length, actions.length);

  return {
    domain: "workforce",
    label: "Workforce",
    score,
    judgement: scoreToJudgement(score),
    evidenceStrength: strengths.length >= 3 ? "strong" : strengths.length >= 1 ? "adequate" : "weak",
    strengths,
    concerns,
    immediateActions: actions,
    keyMetrics: metrics,
    sccifRef: "CHR 2015 Reg 32/33",
  };
}

function assessRecordsCompliance(inputs: InspectionInputs): DomainAssessment {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  const metrics: DomainAssessment["keyMetrics"] = [];

  if (inputs.retentionComplianceRate >= 95) strengths.push("Excellent retention policy compliance");
  else if (inputs.retentionComplianceRate < 80) concerns.push("Retention compliance needs attention");

  if (inputs.recordCompleteness >= 95) strengths.push("Records substantially complete");
  else if (inputs.recordCompleteness < 80) {
    concerns.push("Record completeness below standard");
    actions.push("Complete all outstanding record fields");
  }

  if (inputs.overdueRecords === 0) strengths.push("No overdue records");
  else if (inputs.overdueRecords > 5) {
    concerns.push(`${inputs.overdueRecords} overdue records`);
    actions.push("Clear overdue record backlog");
  }

  metrics.push(
    { label: "Retention", value: `${inputs.retentionComplianceRate}%`, status: inputs.retentionComplianceRate >= 90 ? "good" : inputs.retentionComplianceRate >= 75 ? "warning" : "critical" },
    { label: "Completeness", value: `${inputs.recordCompleteness}%`, status: inputs.recordCompleteness >= 90 ? "good" : inputs.recordCompleteness >= 75 ? "warning" : "critical" },
    { label: "Overdue", value: inputs.overdueRecords, status: inputs.overdueRecords === 0 ? "good" : inputs.overdueRecords <= 3 ? "warning" : "critical" },
  );

  const score = calculateDomainScore(strengths.length, concerns.length, actions.length);

  return {
    domain: "records_compliance",
    label: "Records & Compliance",
    score,
    judgement: scoreToJudgement(score),
    evidenceStrength: strengths.length >= 2 ? "strong" : "adequate",
    strengths,
    concerns,
    immediateActions: actions,
    keyMetrics: metrics,
    sccifRef: "CHR 2015 Schedule 3",
  };
}

function assessRegulatoryReports(inputs: InspectionInputs): DomainAssessment {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  const metrics: DomainAssessment["keyMetrics"] = [];

  const reg44Rate = inputs.reg44Expected > 0
    ? Math.round((inputs.reg44CompletedThisYear / inputs.reg44Expected) * 100)
    : 100;

  if (reg44Rate >= 100) strengths.push("All Reg 44 visits completed on schedule");
  else if (reg44Rate < 80) {
    concerns.push("Reg 44 visit schedule not maintained");
    actions.push("Schedule catch-up Reg 44 visit immediately");
  }

  if (inputs.reg45UpToDate) strengths.push("Reg 45 quality review current");
  else {
    concerns.push("Reg 45 review overdue");
    actions.push("Commission Reg 45 quality review");
  }

  if (inputs.notificationComplianceRate >= 100) strengths.push("All notifications made within timescale");
  else if (inputs.notificationComplianceRate < 90) concerns.push("Some notifications made late");

  if (inputs.reg44OverdueActions === 0) strengths.push("All Reg 44 action points addressed");
  else concerns.push(`${inputs.reg44OverdueActions} overdue Reg 44 action points`);

  metrics.push(
    { label: "Reg 44 Rate", value: `${reg44Rate}%`, status: reg44Rate >= 90 ? "good" : reg44Rate >= 75 ? "warning" : "critical" },
    { label: "Reg 45", value: inputs.reg45UpToDate ? "Current" : "Overdue", status: inputs.reg45UpToDate ? "good" : "critical" },
    { label: "Notifications", value: `${inputs.notificationComplianceRate}%`, status: inputs.notificationComplianceRate >= 95 ? "good" : inputs.notificationComplianceRate >= 80 ? "warning" : "critical" },
  );

  const score = calculateDomainScore(strengths.length, concerns.length, actions.length);

  return {
    domain: "regulatory_reports",
    label: "Regulatory Reports",
    score,
    judgement: scoreToJudgement(score),
    evidenceStrength: strengths.length >= 3 ? "strong" : "adequate",
    strengths,
    concerns,
    immediateActions: actions,
    keyMetrics: metrics,
    sccifRef: "CHR 2015 Reg 44/45",
  };
}

function assessSaferRecruitment(inputs: InspectionInputs): DomainAssessment {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  const metrics: DomainAssessment["keyMetrics"] = [];

  if (inputs.schedule2ComplianceRate >= 95) strengths.push("Schedule 2 requirements substantially met");
  else if (inputs.schedule2ComplianceRate < 80) {
    concerns.push("Schedule 2 compliance below acceptable level");
    actions.push("Complete all outstanding Schedule 2 checks");
  }

  if (inputs.dbsExpired === 0 && inputs.dbsExpiringSoon === 0) {
    strengths.push("All DBS checks current with no imminent expiries");
  } else if (inputs.dbsExpired > 0) {
    concerns.push(`${inputs.dbsExpired} expired DBS — Reg 32 breach`);
    actions.push("IMMEDIATE: Address expired DBS checks");
  }

  if (inputs.recruitmentBlockers === 0) strengths.push("No candidates blocked in recruitment pipeline");
  else concerns.push(`${inputs.recruitmentBlockers} candidates with recruitment blockers`);

  metrics.push(
    { label: "Schedule 2", value: `${inputs.schedule2ComplianceRate}%`, status: inputs.schedule2ComplianceRate >= 90 ? "good" : inputs.schedule2ComplianceRate >= 75 ? "warning" : "critical" },
    { label: "DBS Status", value: inputs.dbsExpired === 0 ? "All Current" : `${inputs.dbsExpired} Expired`, status: inputs.dbsExpired === 0 ? "good" : "critical" },
    { label: "Blocked", value: inputs.recruitmentBlockers, status: inputs.recruitmentBlockers === 0 ? "good" : inputs.recruitmentBlockers <= 2 ? "warning" : "critical" },
  );

  const score = calculateDomainScore(strengths.length, concerns.length, actions.length);

  return {
    domain: "safer_recruitment",
    label: "Safer Recruitment",
    score,
    judgement: scoreToJudgement(score),
    evidenceStrength: strengths.length >= 2 ? "strong" : "adequate",
    strengths,
    concerns,
    immediateActions: actions,
    keyMetrics: metrics,
    sccifRef: "CHR 2015 Reg 34, Schedule 2",
  };
}

// ── Risk Factors ──────────────────────────────────────────────────────────

function identifyRiskFactors(inputs: InspectionInputs, domains: DomainAssessment[]): string[] {
  const factors: string[] = [];

  if (inputs.dbsExpired > 0) factors.push("Expired DBS — regulatory compliance failure");
  if (inputs.missingEpisodes > 3) factors.push("Elevated missing episodes");
  if (inputs.safeguardingIncidents > 5) factors.push("High safeguarding incident count");
  if (inputs.notificationComplianceRate < 90) factors.push("Late statutory notifications");
  if (!inputs.reg45UpToDate) factors.push("Overdue Reg 45 review");
  if (inputs.vacancyRate > 25) factors.push("High vacancy rate affecting care capacity");
  if (inputs.turnoverRate > 40) factors.push("Very high staff turnover");
  if (inputs.complaintsInPeriod > 5) factors.push("Elevated complaints volume");
  if (domains.some(d => d.score <= 1)) factors.push("At least one domain rated inadequate");

  return factors;
}

function calculateInspectionLikelihood(inputs: InspectionInputs, riskFactors: string[]): "low" | "medium" | "high" {
  if (riskFactors.length >= 4) return "high";
  if (riskFactors.length >= 2) return "medium";
  return "low";
}

// ── Score Helpers ─────────────────────────────────────────────────────────

function calculateDomainScore(strengths: number, concerns: number, criticalActions: number): number {
  // Base score from balance of strengths vs concerns
  let score = 3; // start at "good"

  if (strengths >= 4 && concerns === 0) score = 4; // outstanding
  else if (strengths >= 3 && concerns <= 1) score = 3.5;
  else if (strengths >= 2 && concerns <= 1) score = 3;
  else if (concerns >= 3 || criticalActions >= 2) score = 2;
  else if (concerns >= 2) score = 2.5;
  else if (concerns === 1) score = 3;

  // Critical actions reduce score
  if (criticalActions >= 3) score = Math.min(score, 1.5);
  else if (criticalActions >= 1) score = Math.min(score, 2.5);

  return Math.round(score * 10) / 10;
}

export function scoreToJudgement(score: number): OfstedJudgement {
  if (score >= 3.5) return "outstanding";
  if (score >= 2.5) return "good";
  if (score >= 1.5) return "requires_improvement";
  return "inadequate";
}

// ── Exports for testing ───────────────────────────────────────────────────

export function getDomainLabel(domain: ReadinessDomain): string {
  const labels: Record<ReadinessDomain, string> = {
    leadership_management: "Leadership & Management",
    safeguarding: "Safeguarding",
    children_outcomes: "Children's Outcomes",
    residential_experience: "Residential Experience",
    workforce: "Workforce",
    records_compliance: "Records & Compliance",
    regulatory_reports: "Regulatory Reports",
    safer_recruitment: "Safer Recruitment",
  };
  return labels[domain];
}
