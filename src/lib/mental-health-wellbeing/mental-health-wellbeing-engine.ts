// ══════════════════════════════════════════════════════════════════════════════
// Cara Mental Health & Wellbeing Intelligence Engine
//
// Deterministic engine for evaluating children's mental health assessments,
// therapeutic interventions, critical incident response, safety planning,
// and overall wellbeing profiles.
//
// Aligned to:
//   - CHR 2015 Reg 10  — Health and wellbeing of looked-after children
//   - NICE CG26        — Post-traumatic stress disorder (PTSD)
//   - NICE CG28        — Depression in children and young people
//   - SCCIF            — Experiences and progress (emotional wellbeing)
//   - UNCRC Article 24 — Right to the highest attainable standard of health
//
// Key principles:
//   - Every child has an up-to-date wellbeing assessment
//   - Multi-voice: child self-report, staff observation, clinical input
//   - Therapeutic interventions are accessible, timely, and child-centred
//   - Critical incidents are responded to swiftly with proper follow-up
//   - Safety plans are co-produced and reviewed regularly
//   - No child waits too long for mental health support
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type WellbeingDomain =
  | "emotional_regulation"
  | "anxiety"
  | "depression"
  | "self_harm"
  | "attachment"
  | "trauma_response"
  | "social_functioning"
  | "self_esteem"
  | "sleep"
  | "eating";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type MHInterventionType =
  | "camhs"
  | "private_therapy"
  | "in_house_therapeutic"
  | "art_therapy"
  | "play_therapy"
  | "cbt"
  | "emdr"
  | "dbt"
  | "medication"
  | "mindfulness"
  | "peer_support";

export type InterventionStatus =
  | "active"
  | "waiting_list"
  | "completed"
  | "discontinued"
  | "refused";

export type AssessmentTool =
  | "SDQ"
  | "RCADS"
  | "PHQ_A"
  | "GAD7"
  | "CORE_YP"
  | "bespoke"
  | "clinical_observation";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface WellbeingDomainScore {
  domain: WellbeingDomain;
  score: number;        // 1-10 (10 = best)
  riskLevel: RiskLevel;
  trend: "improving" | "stable" | "declining";
}

export interface WellbeingAssessment {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessor: string;
  assessmentTool: AssessmentTool;
  domains: WellbeingDomainScore[];
  overallScore: number;   // 1-10
  overallRisk: RiskLevel;
  childSelfReport: boolean;
  staffContribution: boolean;
  clinicalInput: boolean;
  recommendations: string[];
  nextAssessmentDate: string;
}

export interface TherapeuticIntervention {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  interventionType: MHInterventionType;
  provider: string;
  startDate: string;
  endDate?: string;
  status: InterventionStatus;
  sessionsPlanned: number;
  sessionsAttended: number;
  sessionsRescheduled: number;
  sessionsCancelled: number;
  childEngagement: number;  // 1-10
  progressNotes: string;
  measurableOutcomes: string[];
  waitingTimeDays?: number;
}

export interface CriticalIncident {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  date: string;
  type:
    | "self_harm"
    | "suicidal_ideation"
    | "mental_health_crisis"
    | "panic_attack"
    | "psychotic_episode"
    | "severe_regression"
    | "eating_disorder_crisis";
  severity: RiskLevel;
  responseTimeMins: number;
  professionalsCalled: string[];
  safetyPlanActivated: boolean;
  safetyPlanEffective?: boolean;
  followUpWithin24h: boolean;
  followUpWithin72h: boolean;
  camhsNotified: boolean;
  planUpdated: boolean;
}

export interface WellbeingSafetyPlan {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  createdDate: string;
  lastReviewDate: string;
  nextReviewDate: string;
  status: "current" | "under_review" | "expired";
  childInvolved: boolean;
  parentInvolved: boolean;
  keyProfessionalInvolved: boolean;
  triggersIdentified: string[];
  copingStrategies: string[];
  supportContacts: string[];
  professionalContacts: string[];
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface WellbeingAssessmentResult {
  totalAssessments: number;
  childrenAssessed: number;
  coverageRate: number;          // % of children with assessment
  currencyRate: number;          // % of assessments current (within 6 months)
  averageOverallScore: number;   // 1-10
  riskDistribution: Record<RiskLevel, number>;
  domainAnalysis: {
    domain: WellbeingDomain;
    averageScore: number;
    childrenAtRisk: number;      // moderate+ risk
    trendBreakdown: Record<"improving" | "stable" | "declining", number>;
  }[];
  multiVoiceRate: number;        // % with all 3 voices (child, staff, clinical)
  childSelfReportRate: number;
  staffContributionRate: number;
  clinicalInputRate: number;
  assessmentToolBreakdown: Record<string, number>;
  overdueAssessments: { childId: string; childName: string; lastAssessmentDate: string }[];
}

export interface TherapeuticInterventionResult {
  totalInterventions: number;
  childrenWithIntervention: number;
  accessRate: number;             // % of children accessing at least 1 intervention
  activeInterventions: number;
  waitingListCount: number;
  averageWaitingTimeDays: number;
  attendanceRate: number;         // sessionsAttended / sessionsPlanned %
  rescheduledRate: number;
  cancelledRate: number;
  averageEngagement: number;      // 1-10
  completedCount: number;
  discontinuedCount: number;
  refusedCount: number;
  interventionTypeBreakdown: Record<string, number>;
  childrenOnWaitingList: { childId: string; childName: string; waitingTimeDays: number }[];
}

export interface CriticalIncidentResult {
  totalIncidents: number;
  incidentTypeBreakdown: Record<string, number>;
  severityBreakdown: Record<RiskLevel, number>;
  averageResponseTimeMins: number;
  responseWithin15MinRate: number;   // % responded within 15 mins
  safetyPlanActivationRate: number;  // % where plan was activated
  safetyPlanEffectivenessRate: number;
  followUp24hRate: number;
  followUp72hRate: number;
  camhsNotificationRate: number;
  planUpdatedRate: number;
  childrenWithIncidents: number;
  repeatIncidentChildren: { childId: string; childName: string; count: number }[];
}

export interface SafetyPlanningResult {
  totalPlans: number;
  childrenWithPlan: number;
  coverageRate: number;              // % of children with a plan
  currentPlanRate: number;           // % plans marked current
  expiredPlanCount: number;
  underReviewCount: number;
  childInvolvementRate: number;
  parentInvolvementRate: number;
  keyProfessionalRate: number;
  multiVoiceRate: number;            // % with child + professional + parent
  averageTriggersIdentified: number;
  averageCopingStrategies: number;
  overdueReviews: { childId: string; childName: string; nextReviewDate: string }[];
}

export interface ChildWellbeingProfile {
  childId: string;
  childName: string;
  latestOverallScore: number;
  latestOverallRisk: RiskLevel;
  domainRisks: { domain: WellbeingDomain; score: number; riskLevel: RiskLevel; trend: string }[];
  activeInterventions: { type: MHInterventionType; provider: string; engagement: number }[];
  waitingListInterventions: { type: MHInterventionType; waitingTimeDays: number }[];
  incidentCount: number;
  latestIncidentDate?: string;
  hasSafetyPlan: boolean;
  safetyPlanStatus?: "current" | "under_review" | "expired";
  overallTrend: "improving" | "stable" | "declining";
  concerns: string[];
  recommendations: string[];
}

export interface MentalHealthWellbeingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  assessmentResult: WellbeingAssessmentResult;
  interventionResult: TherapeuticInterventionResult;
  incidentResult: CriticalIncidentResult;
  safetyPlanResult: SafetyPlanningResult;
  childProfiles: ChildWellbeingProfile[];
  scoring: {
    assessmentScore: number;
    interventionScore: number;
    incidentResponseScore: number;
    safetyPlanScore: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const ASSESSMENT_CURRENCY_MONTHS = 6;
const RESPONSE_TIME_TARGET_MINS = 15;
const MAX_ACCEPTABLE_WAITING_DAYS = 56; // 8 weeks (NICE recommendation)

// ── Helper: clamp to 0..100 ───────────────────────────────────────────────

function clamp0100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

// ── Helper: round to 1 decimal ────────────────────────────────────────────

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ── Helper: months between two dates ──────────────────────────────────────

function monthsBetween(from: string, to: string): number {
  const d1 = new Date(from);
  const d2 = new Date(to);
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateWellbeingAssessments
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateWellbeingAssessments(
  assessments: WellbeingAssessment[],
  childIds: string[],
  referenceDate: string,
): WellbeingAssessmentResult {

  if (assessments.length === 0) {
    const overdueAssessments = childIds.map(id => ({
      childId: id,
      childName: id,
      lastAssessmentDate: "never",
    }));
    return {
      totalAssessments: 0,
      childrenAssessed: 0,
      coverageRate: 0,
      currencyRate: 0,
      averageOverallScore: 0,
      riskDistribution: { low: 0, moderate: 0, high: 0, critical: 0 },
      domainAnalysis: [],
      multiVoiceRate: 0,
      childSelfReportRate: 0,
      staffContributionRate: 0,
      clinicalInputRate: 0,
      assessmentToolBreakdown: {},
      overdueAssessments,
    };
  }

  // Latest assessment per child
  const latestByChild = new Map<string, WellbeingAssessment>();
  for (const a of assessments) {
    const existing = latestByChild.get(a.childId);
    if (!existing || new Date(a.assessmentDate).getTime() > new Date(existing.assessmentDate).getTime()) {
      latestByChild.set(a.childId, a);
    }
  }

  const childrenAssessed = latestByChild.size;
  const coverageRate = childIds.length > 0
    ? r1((childrenAssessed / childIds.length) * 100)
    : 0;

  // Currency: latest assessment within N months
  let currentCount = 0;
  const overdueAssessments: { childId: string; childName: string; lastAssessmentDate: string }[] = [];

  for (const cid of childIds) {
    const latest = latestByChild.get(cid);
    if (!latest) {
      overdueAssessments.push({ childId: cid, childName: cid, lastAssessmentDate: "never" });
      continue;
    }
    const ageMonths = monthsBetween(latest.assessmentDate, referenceDate);
    if (ageMonths < ASSESSMENT_CURRENCY_MONTHS) {
      currentCount++;
    } else {
      overdueAssessments.push({
        childId: cid,
        childName: latest.childName,
        lastAssessmentDate: latest.assessmentDate,
      });
    }
  }
  const currencyRate = childIds.length > 0
    ? r1((currentCount / childIds.length) * 100)
    : 0;

  // Average overall score (from latest per child)
  const latestValues = Array.from(latestByChild.values());
  const averageOverallScore = latestValues.length > 0
    ? r1(latestValues.reduce((s, a) => s + a.overallScore, 0) / latestValues.length)
    : 0;

  // Risk distribution (from latest per child)
  const riskDistribution: Record<RiskLevel, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
  for (const a of latestValues) {
    riskDistribution[a.overallRisk]++;
  }

  // Domain analysis (aggregate across latest assessments)
  const domainMap = new Map<WellbeingDomain, { scores: number[]; risks: number; trends: Record<string, number> }>();
  for (const a of latestValues) {
    for (const d of a.domains) {
      let entry = domainMap.get(d.domain);
      if (!entry) {
        entry = { scores: [], risks: 0, trends: { improving: 0, stable: 0, declining: 0 } };
        domainMap.set(d.domain, entry);
      }
      entry.scores.push(d.score);
      if (d.riskLevel === "moderate" || d.riskLevel === "high" || d.riskLevel === "critical") {
        entry.risks++;
      }
      entry.trends[d.trend]++;
    }
  }

  const domainAnalysis = Array.from(domainMap.entries()).map(([domain, data]) => ({
    domain,
    averageScore: r1(data.scores.reduce((s, v) => s + v, 0) / data.scores.length),
    childrenAtRisk: data.risks,
    trendBreakdown: data.trends as Record<"improving" | "stable" | "declining", number>,
  }));

  // Multi-voice metrics
  const multiVoiceCount = latestValues.filter(a => a.childSelfReport && a.staffContribution && a.clinicalInput).length;
  const multiVoiceRate = latestValues.length > 0
    ? r1((multiVoiceCount / latestValues.length) * 100)
    : 0;
  const childSelfReportRate = latestValues.length > 0
    ? r1((latestValues.filter(a => a.childSelfReport).length / latestValues.length) * 100)
    : 0;
  const staffContributionRate = latestValues.length > 0
    ? r1((latestValues.filter(a => a.staffContribution).length / latestValues.length) * 100)
    : 0;
  const clinicalInputRate = latestValues.length > 0
    ? r1((latestValues.filter(a => a.clinicalInput).length / latestValues.length) * 100)
    : 0;

  // Assessment tool breakdown
  const assessmentToolBreakdown: Record<string, number> = {};
  for (const a of assessments) {
    assessmentToolBreakdown[a.assessmentTool] = (assessmentToolBreakdown[a.assessmentTool] ?? 0) + 1;
  }

  return {
    totalAssessments: assessments.length,
    childrenAssessed,
    coverageRate,
    currencyRate,
    averageOverallScore,
    riskDistribution,
    domainAnalysis,
    multiVoiceRate,
    childSelfReportRate,
    staffContributionRate,
    clinicalInputRate,
    assessmentToolBreakdown,
    overdueAssessments,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateTherapeuticInterventions
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateTherapeuticInterventions(
  interventions: TherapeuticIntervention[],
  childIds: string[],
): TherapeuticInterventionResult {
  if (interventions.length === 0) {
    return {
      totalInterventions: 0,
      childrenWithIntervention: 0,
      accessRate: 0,
      activeInterventions: 0,
      waitingListCount: 0,
      averageWaitingTimeDays: 0,
      attendanceRate: 0,
      rescheduledRate: 0,
      cancelledRate: 0,
      averageEngagement: 0,
      completedCount: 0,
      discontinuedCount: 0,
      refusedCount: 0,
      interventionTypeBreakdown: {},
      childrenOnWaitingList: [],
    };
  }

  const childrenWithIntervention = new Set(interventions.map(i => i.childId)).size;
  const accessRate = childIds.length > 0
    ? r1((childrenWithIntervention / childIds.length) * 100)
    : 0;

  const activeInterventions = interventions.filter(i => i.status === "active").length;
  const waitingList = interventions.filter(i => i.status === "waiting_list");
  const waitingListCount = waitingList.length;

  const waitingTimes = waitingList.filter(i => i.waitingTimeDays !== undefined).map(i => i.waitingTimeDays!);
  const averageWaitingTimeDays = waitingTimes.length > 0
    ? r1(waitingTimes.reduce((s, d) => s + d, 0) / waitingTimes.length)
    : 0;

  // Attendance across all interventions
  const totalPlanned = interventions.reduce((s, i) => s + i.sessionsPlanned, 0);
  const totalAttended = interventions.reduce((s, i) => s + i.sessionsAttended, 0);
  const totalRescheduled = interventions.reduce((s, i) => s + i.sessionsRescheduled, 0);
  const totalCancelled = interventions.reduce((s, i) => s + i.sessionsCancelled, 0);

  const attendanceRate = totalPlanned > 0 ? r1((totalAttended / totalPlanned) * 100) : 0;
  const rescheduledRate = totalPlanned > 0 ? r1((totalRescheduled / totalPlanned) * 100) : 0;
  const cancelledRate = totalPlanned > 0 ? r1((totalCancelled / totalPlanned) * 100) : 0;

  // Engagement
  const engagementScores = interventions.filter(i => i.status === "active" || i.status === "completed");
  const averageEngagement = engagementScores.length > 0
    ? r1(engagementScores.reduce((s, i) => s + i.childEngagement, 0) / engagementScores.length)
    : 0;

  const completedCount = interventions.filter(i => i.status === "completed").length;
  const discontinuedCount = interventions.filter(i => i.status === "discontinued").length;
  const refusedCount = interventions.filter(i => i.status === "refused").length;

  // Type breakdown
  const interventionTypeBreakdown: Record<string, number> = {};
  for (const i of interventions) {
    interventionTypeBreakdown[i.interventionType] = (interventionTypeBreakdown[i.interventionType] ?? 0) + 1;
  }

  // Children on waiting list
  const childWaitMap = new Map<string, { childId: string; childName: string; waitingTimeDays: number }>();
  for (const i of waitingList) {
    const existing = childWaitMap.get(i.childId);
    const days = i.waitingTimeDays ?? 0;
    if (!existing || days > existing.waitingTimeDays) {
      childWaitMap.set(i.childId, { childId: i.childId, childName: i.childName, waitingTimeDays: days });
    }
  }

  return {
    totalInterventions: interventions.length,
    childrenWithIntervention,
    accessRate,
    activeInterventions,
    waitingListCount,
    averageWaitingTimeDays,
    attendanceRate,
    rescheduledRate,
    cancelledRate,
    averageEngagement,
    completedCount,
    discontinuedCount,
    refusedCount,
    interventionTypeBreakdown,
    childrenOnWaitingList: Array.from(childWaitMap.values()),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateCriticalIncidents
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateCriticalIncidents(
  incidents: CriticalIncident[],
): CriticalIncidentResult {
  if (incidents.length === 0) {
    return {
      totalIncidents: 0,
      incidentTypeBreakdown: {},
      severityBreakdown: { low: 0, moderate: 0, high: 0, critical: 0 },
      averageResponseTimeMins: 0,
      responseWithin15MinRate: 0,
      safetyPlanActivationRate: 0,
      safetyPlanEffectivenessRate: 0,
      followUp24hRate: 0,
      followUp72hRate: 0,
      camhsNotificationRate: 0,
      planUpdatedRate: 0,
      childrenWithIncidents: 0,
      repeatIncidentChildren: [],
    };
  }

  // Type breakdown
  const incidentTypeBreakdown: Record<string, number> = {};
  for (const i of incidents) {
    incidentTypeBreakdown[i.type] = (incidentTypeBreakdown[i.type] ?? 0) + 1;
  }

  // Severity
  const severityBreakdown: Record<RiskLevel, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
  for (const i of incidents) severityBreakdown[i.severity]++;

  // Response time
  const responseTimes = incidents.map(i => i.responseTimeMins);
  const averageResponseTimeMins = r1(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length);
  const responseWithin15MinRate = r1(
    (incidents.filter(i => i.responseTimeMins <= RESPONSE_TIME_TARGET_MINS).length / incidents.length) * 100
  );

  // Safety plan activation
  const safetyPlanActivationRate = r1(
    (incidents.filter(i => i.safetyPlanActivated).length / incidents.length) * 100
  );
  const activatedIncidents = incidents.filter(i => i.safetyPlanActivated);
  const effectiveCount = activatedIncidents.filter(i => i.safetyPlanEffective === true).length;
  const safetyPlanEffectivenessRate = activatedIncidents.length > 0
    ? r1((effectiveCount / activatedIncidents.length) * 100)
    : 0;

  // Follow-up rates
  const followUp24hRate = r1((incidents.filter(i => i.followUpWithin24h).length / incidents.length) * 100);
  const followUp72hRate = r1((incidents.filter(i => i.followUpWithin72h).length / incidents.length) * 100);

  // CAMHS notification
  const camhsNotificationRate = r1((incidents.filter(i => i.camhsNotified).length / incidents.length) * 100);

  // Plan updated
  const planUpdatedRate = r1((incidents.filter(i => i.planUpdated).length / incidents.length) * 100);

  // Children with incidents
  const childCounts = new Map<string, { name: string; count: number }>();
  for (const i of incidents) {
    const existing = childCounts.get(i.childId);
    if (existing) {
      existing.count++;
    } else {
      childCounts.set(i.childId, { name: i.childName, count: 1 });
    }
  }
  const childrenWithIncidents = childCounts.size;

  const repeatIncidentChildren = Array.from(childCounts.entries())
    .filter(([, v]) => v.count > 1)
    .map(([childId, v]) => ({ childId, childName: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalIncidents: incidents.length,
    incidentTypeBreakdown,
    severityBreakdown,
    averageResponseTimeMins,
    responseWithin15MinRate,
    safetyPlanActivationRate,
    safetyPlanEffectivenessRate,
    followUp24hRate,
    followUp72hRate,
    camhsNotificationRate,
    planUpdatedRate,
    childrenWithIncidents,
    repeatIncidentChildren,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateSafetyPlanning
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateSafetyPlanning(
  plans: WellbeingSafetyPlan[],
  childIds: string[],
  referenceDate: string,
): SafetyPlanningResult {
  if (plans.length === 0) {
    return {
      totalPlans: 0,
      childrenWithPlan: 0,
      coverageRate: 0,
      currentPlanRate: 0,
      expiredPlanCount: 0,
      underReviewCount: 0,
      childInvolvementRate: 0,
      parentInvolvementRate: 0,
      keyProfessionalRate: 0,
      multiVoiceRate: 0,
      averageTriggersIdentified: 0,
      averageCopingStrategies: 0,
      overdueReviews: [],
    };
  }

  const refTime = new Date(referenceDate).getTime();

  // Latest plan per child
  const latestByChild = new Map<string, WellbeingSafetyPlan>();
  for (const p of plans) {
    const existing = latestByChild.get(p.childId);
    if (!existing || new Date(p.createdDate).getTime() > new Date(existing.createdDate).getTime()) {
      latestByChild.set(p.childId, p);
    }
  }

  const childrenWithPlan = latestByChild.size;
  const coverageRate = childIds.length > 0
    ? r1((childrenWithPlan / childIds.length) * 100)
    : 0;

  const latestPlans = Array.from(latestByChild.values());

  const currentCount = latestPlans.filter(p => p.status === "current").length;
  const currentPlanRate = latestPlans.length > 0
    ? r1((currentCount / latestPlans.length) * 100)
    : 0;

  const expiredPlanCount = latestPlans.filter(p => p.status === "expired").length;
  const underReviewCount = latestPlans.filter(p => p.status === "under_review").length;

  // Involvement rates
  const childInvolvementRate = latestPlans.length > 0
    ? r1((latestPlans.filter(p => p.childInvolved).length / latestPlans.length) * 100)
    : 0;
  const parentInvolvementRate = latestPlans.length > 0
    ? r1((latestPlans.filter(p => p.parentInvolved).length / latestPlans.length) * 100)
    : 0;
  const keyProfessionalRate = latestPlans.length > 0
    ? r1((latestPlans.filter(p => p.keyProfessionalInvolved).length / latestPlans.length) * 100)
    : 0;

  // Multi-voice: child + parent + professional
  const multiVoiceCount = latestPlans.filter(p => p.childInvolved && p.parentInvolved && p.keyProfessionalInvolved).length;
  const multiVoiceRate = latestPlans.length > 0
    ? r1((multiVoiceCount / latestPlans.length) * 100)
    : 0;

  // Average triggers and coping strategies
  const averageTriggersIdentified = latestPlans.length > 0
    ? r1(latestPlans.reduce((s, p) => s + p.triggersIdentified.length, 0) / latestPlans.length)
    : 0;
  const averageCopingStrategies = latestPlans.length > 0
    ? r1(latestPlans.reduce((s, p) => s + p.copingStrategies.length, 0) / latestPlans.length)
    : 0;

  // Overdue reviews
  const overdueReviews: { childId: string; childName: string; nextReviewDate: string }[] = [];
  for (const p of latestPlans) {
    if (new Date(p.nextReviewDate).getTime() < refTime) {
      overdueReviews.push({
        childId: p.childId,
        childName: p.childName,
        nextReviewDate: p.nextReviewDate,
      });
    }
  }

  return {
    totalPlans: plans.length,
    childrenWithPlan,
    coverageRate,
    currentPlanRate,
    expiredPlanCount,
    underReviewCount,
    childInvolvementRate,
    parentInvolvementRate,
    keyProfessionalRate,
    multiVoiceRate,
    averageTriggersIdentified,
    averageCopingStrategies,
    overdueReviews,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildWellbeingProfiles
// ══════════════════════════════════════════════════════════════════════════════

export function buildChildWellbeingProfiles(
  assessments: WellbeingAssessment[],
  interventions: TherapeuticIntervention[],
  incidents: CriticalIncident[],
  plans: WellbeingSafetyPlan[],
  childIds: string[],
): ChildWellbeingProfile[] {
  return childIds.map(childId => {
    // Latest assessment
    const childAssessments = assessments
      .filter(a => a.childId === childId)
      .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
    const latestAssessment = childAssessments[0];

    const latestOverallScore = latestAssessment?.overallScore ?? 0;
    const latestOverallRisk = latestAssessment?.overallRisk ?? "low";

    const domainRisks = (latestAssessment?.domains ?? []).map(d => ({
      domain: d.domain,
      score: d.score,
      riskLevel: d.riskLevel,
      trend: d.trend,
    }));

    // Interventions
    const childInterventions = interventions.filter(i => i.childId === childId);
    const activeInterventions = childInterventions
      .filter(i => i.status === "active")
      .map(i => ({ type: i.interventionType, provider: i.provider, engagement: i.childEngagement }));
    const waitingListInterventions = childInterventions
      .filter(i => i.status === "waiting_list")
      .map(i => ({ type: i.interventionType, waitingTimeDays: i.waitingTimeDays ?? 0 }));

    // Incidents
    const childIncidents = incidents.filter(i => i.childId === childId);
    const incidentCount = childIncidents.length;
    const sortedIncidents = [...childIncidents].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestIncidentDate = sortedIncidents[0]?.date;

    // Safety plan
    const childPlans = plans
      .filter(p => p.childId === childId)
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    const latestPlan = childPlans[0];
    const hasSafetyPlan = !!latestPlan;
    const safetyPlanStatus = latestPlan?.status;

    // Overall trend: check domain trends from latest assessment
    let overallTrend: "improving" | "stable" | "declining" = "stable";
    if (latestAssessment) {
      const trendCounts = { improving: 0, stable: 0, declining: 0 };
      for (const d of latestAssessment.domains) {
        trendCounts[d.trend]++;
      }
      if (trendCounts.declining > trendCounts.improving && trendCounts.declining >= trendCounts.stable) {
        overallTrend = "declining";
      } else if (trendCounts.improving > trendCounts.declining && trendCounts.improving >= trendCounts.stable) {
        overallTrend = "improving";
      }
    }

    // Concerns and recommendations
    const concerns: string[] = [];
    const recommendations: string[] = [];

    if (latestOverallRisk === "critical") {
      concerns.push("Overall wellbeing risk is critical — immediate multi-agency review needed");
    } else if (latestOverallRisk === "high") {
      concerns.push("Overall wellbeing risk is high — close monitoring required");
    }

    const decliningDomains = domainRisks.filter(d => d.trend === "declining");
    for (const d of decliningDomains) {
      concerns.push(`${d.domain.replace(/_/g, " ")} is declining (score: ${d.score}/10)`);
    }

    if (incidentCount > 0 && childIncidents.some(i => i.severity === "critical" || i.severity === "high")) {
      concerns.push(`${incidentCount} critical/high severity incident(s) recorded`);
    }

    if (waitingListInterventions.length > 0) {
      const maxWait = Math.max(...waitingListInterventions.map(w => w.waitingTimeDays));
      if (maxWait > MAX_ACCEPTABLE_WAITING_DAYS) {
        concerns.push(`Waiting ${maxWait} days for therapy (NICE target: ${MAX_ACCEPTABLE_WAITING_DAYS} days)`);
      }
      recommendations.push("Chase waiting list referrals and explore interim support options");
    }

    if (!hasSafetyPlan && (latestOverallRisk === "high" || latestOverallRisk === "critical")) {
      concerns.push("No safety plan in place despite high/critical risk");
      recommendations.push("Create co-produced safety plan as priority");
    }

    if (safetyPlanStatus === "expired") {
      concerns.push("Safety plan has expired and needs review");
      recommendations.push("Review and update safety plan urgently");
    }

    if (overallTrend === "declining") {
      recommendations.push("Schedule comprehensive wellbeing review");
    }

    if (activeInterventions.length > 0) {
      const lowEngagement = activeInterventions.filter(a => a.engagement < 5);
      for (const le of lowEngagement) {
        concerns.push(`Low engagement (${le.engagement}/10) in ${le.type.replace(/_/g, " ")}`);
        recommendations.push(`Review approach for ${le.type.replace(/_/g, " ")} — explore child's preferences`);
      }
    }

    if (!latestAssessment) {
      concerns.push("No wellbeing assessment on record");
      recommendations.push("Complete initial wellbeing assessment using validated tool");
    }

    const childName = latestAssessment?.childName
      ?? childInterventions[0]?.childName
      ?? childIncidents[0]?.childName
      ?? childPlans[0]?.childName
      ?? childId;

    return {
      childId,
      childName,
      latestOverallScore,
      latestOverallRisk,
      domainRisks,
      activeInterventions,
      waitingListInterventions,
      incidentCount,
      latestIncidentDate,
      hasSafetyPlan,
      safetyPlanStatus,
      overallTrend,
      concerns,
      recommendations,
    };
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateMentalHealthIntelligence — Main orchestrator
// ══════════════════════════════════════════════════════════════════════════════

export function generateMentalHealthIntelligence(
  assessments: WellbeingAssessment[],
  interventions: TherapeuticIntervention[],
  incidents: CriticalIncident[],
  plans: WellbeingSafetyPlan[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): MentalHealthWellbeingIntelligence {
  // Filter to period
  const periodAssessments = assessments.filter(a => {
    const t = new Date(a.assessmentDate).getTime();
    return t >= new Date(periodStart).getTime() && t <= new Date(periodEnd).getTime();
  });
  const periodIncidents = incidents.filter(i => {
    const t = new Date(i.date).getTime();
    return t >= new Date(periodStart).getTime() && t <= new Date(periodEnd).getTime();
  });

  // Evaluate each dimension
  const assessmentResult = evaluateWellbeingAssessments(periodAssessments, childIds, referenceDate);
  const interventionResult = evaluateTherapeuticInterventions(interventions, childIds);
  const incidentResult = evaluateCriticalIncidents(periodIncidents);
  const safetyPlanResult = evaluateSafetyPlanning(plans, childIds, referenceDate);
  const childProfiles = buildChildWellbeingProfiles(assessments, interventions, incidents, plans, childIds);

  // ── Scoring (100 points total) ──

  // Assessment score (25 points)
  // Coverage: 8 pts, Currency: 7 pts, Multi-voice: 10 pts
  const coveragePts = (assessmentResult.coverageRate / 100) * 8;
  const currencyPts = (assessmentResult.currencyRate / 100) * 7;
  const multiVoicePts = (assessmentResult.multiVoiceRate / 100) * 10;
  const assessmentScore = clamp0100(r1((coveragePts + currencyPts + multiVoicePts) / 25 * 100));

  // Intervention score (25 points)
  // Access rate: 7 pts, Attendance: 7 pts, Engagement: 6 pts, Waiting times: 5 pts
  const accessPts = (interventionResult.accessRate / 100) * 7;
  const attendancePts = (interventionResult.attendanceRate / 100) * 7;
  const engagementPts = (interventionResult.averageEngagement / 10) * 6;
  // Waiting time: 5 pts if avg <= 28 days, linear decay to 0 at 112 days
  let waitPts = 5;
  if (interventionResult.averageWaitingTimeDays > 28) {
    waitPts = Math.max(0, 5 * (1 - (interventionResult.averageWaitingTimeDays - 28) / 84));
  }
  // When there are no interventions at all but children exist, access rate is 0 which yields low score
  const interventionScore = interventions.length === 0 && childIds.length > 0
    ? 0
    : clamp0100(r1((accessPts + attendancePts + engagementPts + waitPts) / 25 * 100));

  // Incident response score (25 points)
  // Response time: 7 pts, Follow-up 24h: 6 pts, CAMHS notification: 6 pts, Plan updated: 6 pts
  let incidentResponseScore: number;
  if (periodIncidents.length === 0) {
    // No incidents = full marks for response quality (nothing to respond to is good)
    incidentResponseScore = 100;
  } else {
    const respPts = (incidentResult.responseWithin15MinRate / 100) * 7;
    const fu24Pts = (incidentResult.followUp24hRate / 100) * 6;
    const camhsPts = (incidentResult.camhsNotificationRate / 100) * 6;
    const planUpPts = (incidentResult.planUpdatedRate / 100) * 6;
    incidentResponseScore = clamp0100(r1((respPts + fu24Pts + camhsPts + planUpPts) / 25 * 100));
  }

  // Safety planning score (25 points)
  // Coverage: 8 pts, Currency: 7 pts, Child involvement: 10 pts
  const spCoveragePts = (safetyPlanResult.coverageRate / 100) * 8;
  const spCurrencyPts = (safetyPlanResult.currentPlanRate / 100) * 7;
  const spChildPts = (safetyPlanResult.childInvolvementRate / 100) * 10;
  const safetyPlanScore = clamp0100(r1((spCoveragePts + spCurrencyPts + spChildPts) / 25 * 100));

  // Overall score (weighted equally, then average to 0-100)
  const overallScore = clamp0100(r1(
    (assessmentScore * 0.25) +
    (interventionScore * 0.25) +
    (incidentResponseScore * 0.25) +
    (safetyPlanScore * 0.25)
  ));

  // Rating
  let rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  if (overallScore >= 80) rating = "outstanding";
  else if (overallScore >= 60) rating = "good";
  else if (overallScore >= 40) rating = "requires_improvement";
  else rating = "inadequate";

  // Strengths
  const strengths: string[] = [];
  if (assessmentResult.coverageRate >= 90) strengths.push("High wellbeing assessment coverage across all children");
  if (assessmentResult.multiVoiceRate >= 80) strengths.push("Strong multi-voice approach in assessments (child, staff, clinical)");
  if (interventionResult.attendanceRate >= 85) strengths.push("Excellent therapy attendance rates");
  if (interventionResult.averageEngagement >= 7) strengths.push("Good child engagement with therapeutic interventions");
  if (incidentResult.totalIncidents > 0 && incidentResult.responseWithin15MinRate >= 90) {
    strengths.push("Rapid response to mental health crises (within 15 minutes)");
  }
  if (incidentResult.totalIncidents > 0 && incidentResult.followUp24hRate >= 90) {
    strengths.push("Consistent follow-up within 24 hours of critical incidents");
  }
  if (safetyPlanResult.childInvolvementRate >= 90) strengths.push("Strong child participation in safety planning");
  if (safetyPlanResult.multiVoiceRate >= 80) strengths.push("Co-produced safety plans with child, parent, and professional input");
  if (assessmentResult.currencyRate >= 90) strengths.push("Wellbeing assessments kept up to date");
  if (interventionResult.averageWaitingTimeDays <= 28 && interventionResult.waitingListCount > 0) {
    strengths.push("Short waiting times for therapeutic support");
  }

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (assessmentResult.coverageRate < 80) areasForImprovement.push("Wellbeing assessment coverage below 80% — some children not assessed");
  if (assessmentResult.currencyRate < 80) areasForImprovement.push("Some assessments are overdue for review");
  if (assessmentResult.multiVoiceRate < 60) areasForImprovement.push("Multi-voice approach needs strengthening — ensure child, staff, and clinical perspectives are captured");
  if (interventionResult.attendanceRate < 70) areasForImprovement.push("Therapy session attendance needs improvement");
  if (interventionResult.averageWaitingTimeDays > MAX_ACCEPTABLE_WAITING_DAYS) {
    areasForImprovement.push(`Average waiting time (${interventionResult.averageWaitingTimeDays} days) exceeds NICE target of ${MAX_ACCEPTABLE_WAITING_DAYS} days`);
  }
  if (incidentResult.totalIncidents > 0 && incidentResult.followUp24hRate < 80) {
    areasForImprovement.push("Follow-up within 24 hours of incidents needs improvement");
  }
  if (incidentResult.totalIncidents > 0 && incidentResult.camhsNotificationRate < 90) {
    areasForImprovement.push("CAMHS notification rate should be improved for all critical incidents");
  }
  if (safetyPlanResult.coverageRate < 80) areasForImprovement.push("Safety plan coverage needs to improve — high-risk children must have plans");
  if (safetyPlanResult.currentPlanRate < 80) areasForImprovement.push("Some safety plans have expired and need review");
  if (safetyPlanResult.childInvolvementRate < 70) areasForImprovement.push("Children not sufficiently involved in their safety planning");

  // Actions
  const actions: string[] = [];
  if (assessmentResult.overdueAssessments.length > 0) {
    actions.push(`Complete overdue wellbeing assessments for ${assessmentResult.overdueAssessments.length} child(ren)`);
  }
  if (interventionResult.childrenOnWaitingList.length > 0) {
    actions.push(`Chase referrals for ${interventionResult.childrenOnWaitingList.length} child(ren) on waiting lists`);
  }
  if (safetyPlanResult.overdueReviews.length > 0) {
    actions.push(`Review safety plans for ${safetyPlanResult.overdueReviews.length} child(ren) with overdue reviews`);
  }
  if (safetyPlanResult.expiredPlanCount > 0) {
    actions.push(`Renew ${safetyPlanResult.expiredPlanCount} expired safety plan(s)`);
  }
  const highRiskNoPlans = childProfiles.filter(
    c => (c.latestOverallRisk === "high" || c.latestOverallRisk === "critical") && !c.hasSafetyPlan
  );
  if (highRiskNoPlans.length > 0) {
    actions.push(`Create safety plans for ${highRiskNoPlans.length} high/critical-risk child(ren) without one`);
  }
  const decliningChildren = childProfiles.filter(c => c.overallTrend === "declining");
  if (decliningChildren.length > 0) {
    actions.push(`Schedule wellbeing reviews for ${decliningChildren.length} child(ren) with declining trends`);
  }
  if (incidentResult.repeatIncidentChildren.length > 0) {
    actions.push(`Review intervention plans for ${incidentResult.repeatIncidentChildren.length} child(ren) with repeat incidents`);
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — Duty to promote health and wellbeing of looked-after children",
    "NICE CG26 — Post-traumatic stress disorder (PTSD): recognition and management",
    "NICE CG28 — Depression in children and young people: identification and management",
    "SCCIF — Experiences and progress: emotional wellbeing and mental health of children",
    "UNCRC Article 24 — Right to the highest attainable standard of health",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    assessmentResult,
    interventionResult,
    incidentResult,
    safetyPlanResult,
    childProfiles,
    scoring: {
      assessmentScore,
      interventionScore,
      incidentResponseScore,
      safetyPlanScore,
    },
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
