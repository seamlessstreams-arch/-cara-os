// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Critical Incident Review Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses how effectively the home reviews and learns from significant
// incidents, restraints, missing episodes, complaints, and near misses:
//   • Debrief timeliness & quality
//   • Learning identification & implementation
//   • Practice change tracking
//   • Pattern recognition & trend analysis
//
// Regulatory framework:
//   CHR 2015 Reg 40 (notification of events), Reg 45 (review of quality of care)
//   SCCIF (learning culture, continuous improvement)
//   Working Together 2023 (learning reviews)
//   Reg 35 (behaviour management — restraint debrief)
//   UNCRC Article 3 (best interests of the child)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type IncidentType =
  | "restraint"
  | "missing_episode"
  | "serious_injury"
  | "safeguarding_concern"
  | "medication_error"
  | "complaint"
  | "near_miss"
  | "property_damage"
  | "self_harm"
  | "allegation"
  | "police_involvement"
  | "other";

export type DebriefStatus =
  | "completed_on_time"
  | "completed_late"
  | "not_completed"
  | "in_progress"
  | "not_required";

export type LearningStatus =
  | "identified"
  | "action_planned"
  | "implemented"
  | "embedded"
  | "not_identified";

export type PracticeChangeType =
  | "policy_update"
  | "procedure_change"
  | "training_delivered"
  | "supervision_topic"
  | "team_meeting_discussion"
  | "risk_assessment_updated"
  | "care_plan_updated"
  | "environment_change"
  | "staffing_change"
  | "other";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface CriticalIncident {
  id: string;
  homeId: string;
  childId?: string;
  childName?: string;
  incidentDate: string;
  incidentType: IncidentType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  staffInvolved: string[];
  notifiedToOfsted: boolean;
  notifiedToLA: boolean;
}

export interface IncidentDebrief {
  id: string;
  homeId: string;
  incidentId: string;
  debriefDate: string;
  facilitatedBy: string;
  attendees: string[];
  childIncluded: boolean;
  childViews?: string;
  status: DebriefStatus;
  immediateActionsIdentified: string[];
  rootCauseIdentified: boolean;
  contributingFactorsIdentified: string[];
  targetDebriefDate?: string; // When debrief should have happened
}

export interface LearningOutcome {
  id: string;
  homeId: string;
  incidentId: string;
  learningDescription: string;
  status: LearningStatus;
  identifiedDate: string;
  responsiblePerson: string;
  implementationDate?: string;
  evidenceOfImplementation?: string;
  sharedWithTeam: boolean;
  sharedInSupervision: boolean;
}

export interface PracticeChange {
  id: string;
  homeId: string;
  learningOutcomeId: string;
  changeType: PracticeChangeType;
  description: string;
  implementedDate: string;
  implementedBy: string;
  impactAssessed: boolean;
  impactPositive?: boolean;
  sustainabilityReviewDate?: string;
}

export interface TrendAnalysis {
  incidentType: IncidentType;
  count: number;
  trend: "increasing" | "stable" | "decreasing";
  previousPeriodCount: number;
}

// ── Result Types ────────────────────────────────────────────────────────────

export interface DebriefQualityResult {
  totalIncidents: number;
  debriefRequired: number;
  debriefedOnTime: number;
  debriefedLate: number;
  notDebriefed: number;
  debriefCompletionRate: number;    // %
  timelyDebriefRate: number;        // %
  childIncludedRate: number;        // %
  rootCauseIdentifiedRate: number;  // %
  overallScore: number;             // 0–30
}

export interface LearningIdentificationResult {
  totalLearnings: number;
  identified: number;
  actionPlanned: number;
  implemented: number;
  embedded: number;
  notIdentified: number;
  implementationRate: number;       // %
  sharedWithTeamRate: number;       // %
  sharedInSupervisionRate: number;  // %
  overallScore: number;             // 0–25
}

export interface PracticeChangeResult {
  totalChanges: number;
  changesByType: Record<string, number>;
  impactAssessedRate: number;       // %
  positiveImpactRate: number;       // %
  sustainabilityReviewedRate: number; // %
  overallScore: number;             // 0–25
}

export interface TrendAnalysisResult {
  trends: TrendAnalysis[];
  totalIncidents: number;
  previousPeriodTotal: number;
  overallTrend: "increasing" | "stable" | "decreasing";
  highSeverityCount: number;
  criticalSeverityCount: number;
  repeatIncidentRate: number;       // % of children with >1 incident
  overallScore: number;             // 0–20
}

export interface CriticalIncidentReviewIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: Rating;
  debriefQuality: DebriefQualityResult;
  learningIdentification: LearningIdentificationResult;
  practiceChange: PracticeChangeResult;
  trendAnalysis: TrendAnalysisResult;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function ratingFromScore(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

function isInPeriod(date: string | undefined, start: string, end: string): boolean {
  if (!date) return false;
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getIncidentTypeLabel(t: IncidentType): string {
  const labels: Record<IncidentType, string> = {
    restraint: "Restraint",
    missing_episode: "Missing Episode",
    serious_injury: "Serious Injury",
    safeguarding_concern: "Safeguarding Concern",
    medication_error: "Medication Error",
    complaint: "Complaint",
    near_miss: "Near Miss",
    property_damage: "Property Damage",
    self_harm: "Self-Harm",
    allegation: "Allegation",
    police_involvement: "Police Involvement",
    other: "Other",
  };
  return labels[t] || t;
}

export function getDebriefStatusLabel(s: DebriefStatus): string {
  const labels: Record<DebriefStatus, string> = {
    completed_on_time: "Completed on Time",
    completed_late: "Completed Late",
    not_completed: "Not Completed",
    in_progress: "In Progress",
    not_required: "Not Required",
  };
  return labels[s] || s;
}

export function getLearningStatusLabel(s: LearningStatus): string {
  const labels: Record<LearningStatus, string> = {
    identified: "Identified",
    action_planned: "Action Planned",
    implemented: "Implemented",
    embedded: "Embedded in Practice",
    not_identified: "Not Identified",
  };
  return labels[s] || s;
}

export function getPracticeChangeTypeLabel(t: PracticeChangeType): string {
  const labels: Record<PracticeChangeType, string> = {
    policy_update: "Policy Update",
    procedure_change: "Procedure Change",
    training_delivered: "Training Delivered",
    supervision_topic: "Supervision Topic",
    team_meeting_discussion: "Team Meeting Discussion",
    risk_assessment_updated: "Risk Assessment Updated",
    care_plan_updated: "Care Plan Updated",
    environment_change: "Environment Change",
    staffing_change: "Staffing Change",
    other: "Other",
  };
  return labels[t] || t;
}

// ── Core Evaluation Functions ───────────────────────────────────────────────

/**
 * Evaluate debrief quality and timeliness.
 * After significant incidents, debriefs must happen promptly. For restraints,
 * this is typically within 24 hours. Child involvement is critical.
 * Score: 0–30
 */
export function evaluateDebriefQuality(
  incidents: CriticalIncident[],
  debriefs: IncidentDebrief[],
  periodStart: string,
  periodEnd: string,
): DebriefQualityResult {
  const periodIncidents = incidents.filter((i) => isInPeriod(i.incidentDate, periodStart, periodEnd));

  if (periodIncidents.length === 0) {
    return {
      totalIncidents: 0, debriefRequired: 0, debriefedOnTime: 0,
      debriefedLate: 0, notDebriefed: 0, debriefCompletionRate: 0,
      timelyDebriefRate: 0, childIncludedRate: 0, rootCauseIdentifiedRate: 0,
      overallScore: 0,
    };
  }

  // Match debriefs to incidents
  const debriefMap = new Map<string, IncidentDebrief>();
  for (const d of debriefs) {
    debriefMap.set(d.incidentId, d);
  }

  let debriefRequired = 0;
  let onTime = 0;
  let late = 0;
  let notDone = 0;
  let childIncluded = 0;
  let rootCause = 0;

  for (const inc of periodIncidents) {
    const debrief = debriefMap.get(inc.id);

    if (!debrief || debrief.status === "not_required") {
      // Low-severity incidents might not require debrief
      if (inc.severity === "low") continue;
      debriefRequired++;
      if (!debrief) {
        notDone++;
      }
      continue;
    }

    debriefRequired++;

    if (debrief.status === "completed_on_time") {
      onTime++;
    } else if (debrief.status === "completed_late") {
      late++;
    } else if (debrief.status === "not_completed") {
      notDone++;
    }

    if (debrief.childIncluded) childIncluded++;
    if (debrief.rootCauseIdentified) rootCause++;
  }

  const completionRate = pct(onTime + late, debriefRequired);
  const timelyRate = pct(onTime, debriefRequired);
  const completedDebriefs = debriefs.filter(
    (d) => d.status === "completed_on_time" || d.status === "completed_late",
  );
  const childRate = pct(childIncluded, completedDebriefs.length);
  const rootCauseRate = pct(rootCause, completedDebriefs.length);

  // Scoring — 30 points max
  let score = 0;
  score += (completionRate / 100) * 10;     // Completion: 10 pts
  score += (timelyRate / 100) * 8;          // Timeliness: 8 pts
  score += (childRate / 100) * 6;           // Child inclusion: 6 pts
  score += (rootCauseRate / 100) * 6;       // Root cause: 6 pts

  return {
    totalIncidents: periodIncidents.length,
    debriefRequired,
    debriefedOnTime: onTime,
    debriefedLate: late,
    notDebriefed: notDone,
    debriefCompletionRate: completionRate,
    timelyDebriefRate: timelyRate,
    childIncludedRate: childRate,
    rootCauseIdentifiedRate: rootCauseRate,
    overallScore: Math.round(clamp(score, 0, 30) * 10) / 10,
  };
}

/**
 * Evaluate learning identification and implementation.
 * Good homes don't just debrief — they identify specific learnings
 * and track them through to embedded practice.
 * Score: 0–25
 */
export function evaluateLearningIdentification(
  learnings: LearningOutcome[],
  periodStart: string,
  periodEnd: string,
): LearningIdentificationResult {
  const periodLearnings = learnings.filter((l) => isInPeriod(l.identifiedDate, periodStart, periodEnd));

  if (periodLearnings.length === 0) {
    return {
      totalLearnings: 0, identified: 0, actionPlanned: 0, implemented: 0,
      embedded: 0, notIdentified: 0, implementationRate: 0,
      sharedWithTeamRate: 0, sharedInSupervisionRate: 0, overallScore: 0,
    };
  }

  const identified = periodLearnings.filter((l) => l.status === "identified").length;
  const planned = periodLearnings.filter((l) => l.status === "action_planned").length;
  const implemented = periodLearnings.filter((l) => l.status === "implemented").length;
  const embedded = periodLearnings.filter((l) => l.status === "embedded").length;
  const notIdentified = periodLearnings.filter((l) => l.status === "not_identified").length;

  const implementationRate = pct(implemented + embedded, periodLearnings.length);
  const sharedTeam = periodLearnings.filter((l) => l.sharedWithTeam).length;
  const sharedTeamRate = pct(sharedTeam, periodLearnings.length);
  const sharedSupervision = periodLearnings.filter((l) => l.sharedInSupervision).length;
  const sharedSupervisionRate = pct(sharedSupervision, periodLearnings.length);

  // Scoring — 25 points max
  let score = 0;
  score += (implementationRate / 100) * 10;    // Implementation: 10 pts
  score += (sharedTeamRate / 100) * 6;          // Team sharing: 6 pts
  score += (sharedSupervisionRate / 100) * 5;   // Supervision: 5 pts

  // Bonus for embedded learnings: up to 4 pts
  if (periodLearnings.length > 0) {
    const embeddedRate = pct(embedded, periodLearnings.length);
    score += (embeddedRate / 100) * 4;
  }

  return {
    totalLearnings: periodLearnings.length,
    identified,
    actionPlanned: planned,
    implemented,
    embedded,
    notIdentified,
    implementationRate,
    sharedWithTeamRate: sharedTeamRate,
    sharedInSupervisionRate: sharedSupervisionRate,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate practice changes resulting from learning.
 * Score: 0–25
 */
export function evaluatePracticeChanges(
  changes: PracticeChange[],
  periodStart: string,
  periodEnd: string,
): PracticeChangeResult {
  const periodChanges = changes.filter((c) => isInPeriod(c.implementedDate, periodStart, periodEnd));

  if (periodChanges.length === 0) {
    return {
      totalChanges: 0, changesByType: {}, impactAssessedRate: 0,
      positiveImpactRate: 0, sustainabilityReviewedRate: 0, overallScore: 0,
    };
  }

  // Group by type
  const byType: Record<string, number> = {};
  for (const c of periodChanges) {
    byType[c.changeType] = (byType[c.changeType] || 0) + 1;
  }

  const impactAssessed = periodChanges.filter((c) => c.impactAssessed).length;
  const impactRate = pct(impactAssessed, periodChanges.length);

  const withPositive = periodChanges.filter((c) => c.impactAssessed && c.impactPositive === true).length;
  const positiveRate = pct(withPositive, impactAssessed);

  const withSustainability = periodChanges.filter((c) => c.sustainabilityReviewDate).length;
  const sustainabilityRate = pct(withSustainability, periodChanges.length);

  // Scoring — 25 points max
  let score = 0;

  // Having practice changes: up to 8 pts based on volume/variety
  const uniqueTypes = Object.keys(byType).length;
  score += Math.min(uniqueTypes, 5) * 1.6;

  // Impact assessment: up to 8 pts
  score += (impactRate / 100) * 8;

  // Positive impact: up to 5 pts
  if (impactAssessed > 0) {
    score += (positiveRate / 100) * 5;
  }

  // Sustainability review: up to 4 pts
  score += (sustainabilityRate / 100) * 4;

  return {
    totalChanges: periodChanges.length,
    changesByType: byType,
    impactAssessedRate: impactRate,
    positiveImpactRate: positiveRate,
    sustainabilityReviewedRate: sustainabilityRate,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate incident trends and patterns.
 * Score: 0–20
 */
export function evaluateTrendAnalysis(
  currentIncidents: CriticalIncident[],
  previousPeriodIncidents: CriticalIncident[],
  periodStart: string,
  periodEnd: string,
): TrendAnalysisResult {
  const current = currentIncidents.filter((i) => isInPeriod(i.incidentDate, periodStart, periodEnd));

  if (current.length === 0 && previousPeriodIncidents.length === 0) {
    return {
      trends: [], totalIncidents: 0, previousPeriodTotal: 0,
      overallTrend: "stable", highSeverityCount: 0, criticalSeverityCount: 0,
      repeatIncidentRate: 0, overallScore: 10, // Neutral — no incidents is positive
    };
  }

  // Build trends by type
  const currentByType = new Map<IncidentType, number>();
  for (const i of current) {
    currentByType.set(i.incidentType, (currentByType.get(i.incidentType) || 0) + 1);
  }

  const prevByType = new Map<IncidentType, number>();
  for (const i of previousPeriodIncidents) {
    prevByType.set(i.incidentType, (prevByType.get(i.incidentType) || 0) + 1);
  }

  const allTypes = new Set([...currentByType.keys(), ...prevByType.keys()]);
  const trends: TrendAnalysis[] = [];
  for (const t of allTypes) {
    const curr = currentByType.get(t) || 0;
    const prev = prevByType.get(t) || 0;
    let trend: "increasing" | "stable" | "decreasing" = "stable";
    if (curr > prev) trend = "increasing";
    else if (curr < prev) trend = "decreasing";
    trends.push({ incidentType: t, count: curr, trend, previousPeriodCount: prev });
  }

  const highSeverity = current.filter((i) => i.severity === "high").length;
  const criticalSeverity = current.filter((i) => i.severity === "critical").length;

  // Overall trend
  let overallTrend: "increasing" | "stable" | "decreasing" = "stable";
  if (current.length > previousPeriodIncidents.length) overallTrend = "increasing";
  else if (current.length < previousPeriodIncidents.length) overallTrend = "decreasing";

  // Repeat incidents: children with >1 incident
  const childIncidents = new Map<string, number>();
  for (const i of current) {
    if (i.childId) {
      childIncidents.set(i.childId, (childIncidents.get(i.childId) || 0) + 1);
    }
  }
  const uniqueChildren = childIncidents.size;
  const repeatChildren = [...childIncidents.values()].filter((c) => c > 1).length;
  const repeatRate = pct(repeatChildren, uniqueChildren);

  // Scoring — 20 points max
  let score = 10; // Start at midpoint

  // Decreasing trend bonus: +5
  if (overallTrend === "decreasing") score += 5;
  // Increasing trend penalty: -5
  else if (overallTrend === "increasing") score -= 5;

  // Low severity profile bonus: up to +5
  if (criticalSeverity === 0) score += 2;
  if (highSeverity === 0) score += 3;

  // High repeat rate penalty: -3
  if (repeatRate > 50) score -= 3;
  else if (repeatRate > 25) score -= 1;

  return {
    trends,
    totalIncidents: current.length,
    previousPeriodTotal: previousPeriodIncidents.length,
    overallTrend,
    highSeverityCount: highSeverity,
    criticalSeverityCount: criticalSeverity,
    repeatIncidentRate: repeatRate,
    overallScore: Math.round(clamp(score, 0, 20) * 10) / 10,
  };
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateCriticalIncidentReviewIntelligence(
  incidents: CriticalIncident[],
  debriefs: IncidentDebrief[],
  learnings: LearningOutcome[],
  practiceChanges: PracticeChange[],
  previousPeriodIncidents: CriticalIncident[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): CriticalIncidentReviewIntelligence {
  const debrief = evaluateDebriefQuality(incidents, debriefs, periodStart, periodEnd);
  const learning = evaluateLearningIdentification(learnings, periodStart, periodEnd);
  const practice = evaluatePracticeChanges(practiceChanges, periodStart, periodEnd);
  const trend = evaluateTrendAnalysis(incidents, previousPeriodIncidents, periodStart, periodEnd);

  const overallScore = Math.round(
    (debrief.overallScore + learning.overallScore + practice.overallScore + trend.overallScore) * 10,
  ) / 10;
  const rating = ratingFromScore(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];
  if (debrief.debriefCompletionRate >= 90 && debrief.debriefRequired > 0) {
    strengths.push("Excellent debrief completion rate — incidents are consistently reviewed");
  }
  if (debrief.timelyDebriefRate >= 85 && debrief.debriefRequired > 0) {
    strengths.push("Debriefs are conducted promptly after incidents, supporting timely learning");
  }
  if (debrief.childIncludedRate >= 80 && debrief.debriefRequired > 0) {
    strengths.push("Children are meaningfully included in incident debriefs, respecting their right to be heard");
  }
  if (debrief.rootCauseIdentifiedRate >= 80 && debrief.debriefRequired > 0) {
    strengths.push("Root cause analysis is consistently conducted, enabling deeper understanding");
  }
  if (learning.implementationRate >= 80 && learning.totalLearnings > 0) {
    strengths.push("Strong follow-through from learning to implementation — changes are actioned");
  }
  if (learning.sharedWithTeamRate >= 85 && learning.totalLearnings > 0) {
    strengths.push("Learning is consistently shared across the team, building a collective learning culture");
  }
  if (practice.totalChanges > 0 && practice.impactAssessedRate >= 80) {
    strengths.push("Practice changes are assessed for impact, ensuring evidence-based improvements");
  }
  if (trend.overallTrend === "decreasing") {
    strengths.push("Incident numbers are decreasing, suggesting preventative measures are effective");
  }
  if (trend.criticalSeverityCount === 0 && trend.totalIncidents > 0) {
    strengths.push("No critical severity incidents in the period — a positive safety indicator");
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (debrief.notDebriefed > 0) {
    areasForImprovement.push(`${debrief.notDebriefed} incident(s) have not been debriefed — all significant incidents require review`);
  }
  if (debrief.timelyDebriefRate < 75 && debrief.debriefRequired > 0) {
    areasForImprovement.push("Debriefs need to be conducted more promptly after incidents");
  }
  if (debrief.childIncludedRate < 60 && debrief.debriefRequired > 0) {
    areasForImprovement.push("Children should be more routinely included in incident debriefs");
  }
  if (learning.implementationRate < 60 && learning.totalLearnings > 0) {
    areasForImprovement.push("Learning from incidents is identified but not consistently implemented");
  }
  if (learning.sharedWithTeamRate < 70 && learning.totalLearnings > 0) {
    areasForImprovement.push("Learning needs to be shared more widely across the team");
  }
  if (practice.totalChanges === 0 && learning.totalLearnings > 0) {
    areasForImprovement.push("Learning has been identified but no practice changes have been implemented");
  }
  if (trend.overallTrend === "increasing") {
    areasForImprovement.push("Incident numbers are increasing — review preventative strategies");
  }
  if (trend.repeatIncidentRate > 30) {
    areasForImprovement.push("High repeat incident rate — patterns need deeper analysis and intervention");
  }

  // ── Actions ──
  const actions: string[] = [];
  if (debrief.notDebriefed > 0) {
    actions.push(`URGENT: Complete debriefs for ${debrief.notDebriefed} outstanding incident(s)`);
  }
  if (trend.criticalSeverityCount > 0) {
    actions.push(`URGENT: Review all ${trend.criticalSeverityCount} critical severity incident(s) for immediate learning`);
  }
  if (learning.totalLearnings > 0 && learning.implementationRate < 60) {
    actions.push("HIGH: Develop implementation plans for identified learning outcomes");
  }
  if (trend.overallTrend === "increasing") {
    actions.push("HIGH: Conduct a strategic review of incident patterns and prevention strategies");
  }
  if (debrief.childIncludedRate < 60 && debrief.debriefRequired > 0) {
    actions.push("MEDIUM: Review debrief processes to ensure children are supported to participate");
  }
  if (practice.totalChanges > 0 && practice.impactAssessedRate < 50) {
    actions.push("MEDIUM: Assess the impact of practice changes to ensure they are effective");
  }
  if (learning.sharedWithTeamRate < 70 && learning.totalLearnings > 0) {
    actions.push("LOW: Include incident learning as a standing agenda item in team meetings");
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 40 — notification of significant events to Ofsted and relevant bodies",
    "CHR 2015 Reg 45 — review of quality of care, including learning from incidents",
    "CHR 2015 Reg 35 — behaviour management, including post-restraint debriefs",
    "SCCIF — learning culture, continuous improvement, and effective leadership as key judgement criteria",
    "Working Together to Safeguard Children 2023 — learning reviews and multi-agency learning",
    "UNCRC Article 3 — best interests of the child as a primary consideration in incident response",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    debriefQuality: debrief,
    learningIdentification: learning,
    practiceChange: practice,
    trendAnalysis: trend,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
