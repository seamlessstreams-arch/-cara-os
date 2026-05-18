// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Incident Pattern Analysis Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no side-effects.
// Analyses incident data across a children's residential home to identify
// patterns, evaluate response quality, notification compliance, and
// post-incident processes.
//
// Regulatory framework:
//   CHR 2015 Reg 12  — The protection of children standard (behaviour management)
//   CHR 2015 Reg 40  — Notification of serious events
//   SCCIF            — Safety and wellbeing of children
//   UNCRC Article 19 — Protection from all forms of violence
//   NMS 3            — Safeguarding children
//   Working Together 2023  — Multi-agency safeguarding arrangements
//   KCSIE 2024       — Keeping Children Safe in Education
//   Restraint Reduction Network Standards
//
// Key principles:
//   - Every incident recorded, analysed, and learned from
//   - De-escalation attempted before any physical intervention
//   - Children debriefed after every incident in age-appropriate way
//   - Notifications made to relevant authorities without delay
//   - Post-incident support plans updated and reviewed
//   - Pattern analysis drives preventative strategies
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type IncidentCategory =
  | "physical_aggression"
  | "verbal_aggression"
  | "self_harm"
  | "absconding"
  | "property_damage"
  | "substance_misuse"
  | "sexual_behaviour"
  | "online_safety"
  | "bullying"
  | "criminal_activity";

export type IncidentSeverity = "critical" | "major" | "moderate" | "minor";

export type ResponseQuality =
  | "exemplary"
  | "appropriate"
  | "partially_appropriate"
  | "inadequate";

export type NotificationStatus =
  | "timely_and_complete"
  | "timely_incomplete"
  | "late"
  | "not_notified";

export type DeEscalationOutcome =
  | "successful"
  | "partially_successful"
  | "unsuccessful"
  | "not_attempted";

export type PostIncidentAction =
  | "debrief_completed"
  | "support_plan_updated"
  | "medical_attention"
  | "external_referral"
  | "no_action"
  | "pending";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface IncidentRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  time: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  staffPresent: string[];
  responseQuality: ResponseQuality;
  deEscalationAttempted: boolean;
  deEscalationOutcome: DeEscalationOutcome;
  restraintUsed: boolean;
  restraintDurationMinutes: number | null;
  injuryOccurred: boolean;
  injuryDetails: string | null;
  notificationStatus: NotificationStatus;
  postIncidentActions: PostIncidentAction[];
  childDebriefed: boolean;
  lessonsIdentified: boolean;
  managersInformed: boolean;
}

export interface IncidentTrend {
  id: string;
  childId: string;
  childName: string;
  periodStart: string;
  periodEnd: string;
  incidentCount: number;
  predominantCategory: IncidentCategory;
  escalating: boolean;
  triggerPatterns: string[];
}

export interface StaffResponse {
  id: string;
  incidentId: string;
  staffId: string;
  staffName: string;
  responseTimeMins: number;
  appropriateForce: boolean;
  bodyWornCameraUsed: boolean;
  reportCompletedTimely: boolean;
  debriedParticipated: boolean;
}

export interface PatternIndicator {
  id: string;
  homeId: string;
  category: IncidentCategory;
  frequency: "daily" | "weekly" | "monthly" | "occasional" | "rare";
  peakTime: "morning" | "afternoon" | "evening" | "night" | "varied";
  environmentalTrigger: string | null;
  seasonalPattern: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface IncidentResponseResult {
  overallScore: number; // 0-25
  totalIncidents: number;
  criticalIncidentCount: number;
  majorIncidentCount: number;
  responseQualityRate: number; // %
  deEscalationSuccessRate: number; // %
  childDebriefRate: number; // %
  restraintRate: number; // %
  averageResponseTimeMins: number;
}

export interface NotificationComplianceResult {
  overallScore: number; // 0-25
  totalNotifiable: number;
  timelyCompleteRate: number; // %
  lateNotificationCount: number;
  notNotifiedCount: number;
  managersInformedRate: number; // %
}

export interface PatternAnalysisResult {
  overallScore: number; // 0-25
  trendsAnalysed: number;
  escalatingChildCount: number;
  predominantCategory: IncidentCategory | "none";
  lessonsIdentifiedRate: number; // %
  triggerPatternsIdentified: number;
  environmentalFactorsCount: number;
}

export interface PostIncidentResult {
  overallScore: number; // 0-25
  totalPostIncident: number;
  debriefCompletionRate: number; // %
  supportPlanUpdateRate: number; // %
  medicalAttentionRate: number; // %
  externalReferralRate: number; // %
  noActionCount: number;
}

export interface ChildIncidentProfile {
  childId: string;
  childName: string;
  incidentCount: number;
  criticalCount: number;
  predominantCategory: IncidentCategory | "none";
  escalating: boolean;
  deEscalationSuccessRate: number; // %
  restraintCount: number;
  overallScore: number; // 0-10
}

export interface IncidentPatternAnalysisIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100
  rating: Rating;
  incidentResponse: IncidentResponseResult;
  notificationCompliance: NotificationComplianceResult;
  patternAnalysis: PatternAnalysisResult;
  postIncident: PostIncidentResult;
  childProfiles: ChildIncidentProfile[];
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ────────────────────────────────────────────────────────

export function getIncidentCategoryLabel(category: IncidentCategory): string {
  const labels: Record<IncidentCategory, string> = {
    physical_aggression: "Physical Aggression",
    verbal_aggression: "Verbal Aggression",
    self_harm: "Self-Harm",
    absconding: "Absconding",
    property_damage: "Property Damage",
    substance_misuse: "Substance Misuse",
    sexual_behaviour: "Sexual Behaviour",
    online_safety: "Online Safety",
    bullying: "Bullying",
    criminal_activity: "Criminal Activity",
  };
  return labels[category] ?? category;
}

export function getIncidentSeverityLabel(severity: IncidentSeverity): string {
  const labels: Record<IncidentSeverity, string> = {
    critical: "Critical",
    major: "Major",
    moderate: "Moderate",
    minor: "Minor",
  };
  return labels[severity] ?? severity;
}

export function getResponseQualityLabel(quality: ResponseQuality): string {
  const labels: Record<ResponseQuality, string> = {
    exemplary: "Exemplary",
    appropriate: "Appropriate",
    partially_appropriate: "Partially Appropriate",
    inadequate: "Inadequate",
  };
  return labels[quality] ?? quality;
}

export function getNotificationStatusLabel(status: NotificationStatus): string {
  const labels: Record<NotificationStatus, string> = {
    timely_and_complete: "Timely & Complete",
    timely_incomplete: "Timely but Incomplete",
    late: "Late",
    not_notified: "Not Notified",
  };
  return labels[status] ?? status;
}

export function getDeEscalationOutcomeLabel(outcome: DeEscalationOutcome): string {
  const labels: Record<DeEscalationOutcome, string> = {
    successful: "Successful",
    partially_successful: "Partially Successful",
    unsuccessful: "Unsuccessful",
    not_attempted: "Not Attempted",
  };
  return labels[outcome] ?? outcome;
}

export function getPostIncidentActionLabel(action: PostIncidentAction): string {
  const labels: Record<PostIncidentAction, string> = {
    debrief_completed: "Debrief Completed",
    support_plan_updated: "Support Plan Updated",
    medical_attention: "Medical Attention",
    external_referral: "External Referral",
    no_action: "No Action Taken",
    pending: "Pending",
  };
  return labels[action] ?? action;
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] ?? rating;
}

// ── Evaluator 1: Incident Response ─────────────────────────────────────────

export function evaluateIncidentResponse(
  incidents: IncidentRecord[],
  staffResponses: StaffResponse[],
): IncidentResponseResult {
  const MAX_SCORE = 25;

  if (incidents.length === 0) {
    return {
      overallScore: MAX_SCORE,
      totalIncidents: 0,
      criticalIncidentCount: 0,
      majorIncidentCount: 0,
      responseQualityRate: 0,
      deEscalationSuccessRate: 0,
      childDebriefRate: 0,
      restraintRate: 0,
      averageResponseTimeMins: 0,
    };
  }

  const total = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const majorCount = incidents.filter((i) => i.severity === "major").length;

  // Response quality: exemplary or appropriate = good
  const goodResponses = incidents.filter(
    (i) => i.responseQuality === "exemplary" || i.responseQuality === "appropriate",
  ).length;
  const responseQualityRate = pct(goodResponses, total);

  // De-escalation success rate (only among those where attempted)
  const deEscAttempted = incidents.filter((i) => i.deEscalationAttempted);
  const deEscSuccessful = deEscAttempted.filter(
    (i) => i.deEscalationOutcome === "successful" || i.deEscalationOutcome === "partially_successful",
  ).length;
  const deEscalationSuccessRate = pct(deEscSuccessful, deEscAttempted.length);

  // Child debrief rate
  const childDebriefed = incidents.filter((i) => i.childDebriefed).length;
  const childDebriefRate = pct(childDebriefed, total);

  // Restraint rate
  const restraintUsed = incidents.filter((i) => i.restraintUsed).length;
  const restraintRate = pct(restraintUsed, total);

  // Average response time from staff responses
  const avgResponseTime =
    staffResponses.length > 0
      ? Math.round(
          staffResponses.reduce((sum, s) => sum + s.responseTimeMins, 0) / staffResponses.length,
        )
      : 0;

  // Score calculation
  // Response quality contributes up to 8 points
  let score = (responseQualityRate / 100) * 8;

  // De-escalation success contributes up to 7 points
  if (deEscAttempted.length > 0) {
    score += (deEscalationSuccessRate / 100) * 7;
  } else {
    // No de-escalation attempted is concerning if there were incidents
    score += 0;
  }

  // Child debrief contributes up to 5 points
  score += (childDebriefRate / 100) * 5;

  // Low restraint rate contributes up to 5 points (lower is better)
  const lowRestraintFactor = restraintRate === 0 ? 1 : Math.max(0, 1 - restraintRate / 100);
  score += lowRestraintFactor * 5;

  // Penalties
  score -= criticalCount * 3;
  score -= majorCount * 1;

  return {
    overallScore: clamp(Math.round(score), 0, MAX_SCORE),
    totalIncidents: total,
    criticalIncidentCount: criticalCount,
    majorIncidentCount: majorCount,
    responseQualityRate,
    deEscalationSuccessRate,
    childDebriefRate,
    restraintRate,
    averageResponseTimeMins: avgResponseTime,
  };
}

// ── Evaluator 2: Notification Compliance ───────────────────────────────────

export function evaluateNotificationCompliance(
  incidents: IncidentRecord[],
): NotificationComplianceResult {
  const MAX_SCORE = 25;

  if (incidents.length === 0) {
    return {
      overallScore: MAX_SCORE,
      totalNotifiable: 0,
      timelyCompleteRate: 0,
      lateNotificationCount: 0,
      notNotifiedCount: 0,
      managersInformedRate: 0,
    };
  }

  const total = incidents.length;

  const timelyComplete = incidents.filter(
    (i) => i.notificationStatus === "timely_and_complete",
  ).length;
  const timelyCompleteRate = pct(timelyComplete, total);

  const lateNotificationCount = incidents.filter(
    (i) => i.notificationStatus === "late",
  ).length;

  const notNotifiedCount = incidents.filter(
    (i) => i.notificationStatus === "not_notified",
  ).length;

  const managersInformed = incidents.filter((i) => i.managersInformed).length;
  const managersInformedRate = pct(managersInformed, total);

  // Score calculation
  // Timely + complete rate contributes up to 15 points
  let score = (timelyCompleteRate / 100) * 15;

  // Managers informed rate contributes up to 10 points
  score += (managersInformedRate / 100) * 10;

  // Penalties for not-notified incidents
  score -= notNotifiedCount * 5;

  return {
    overallScore: clamp(Math.round(score), 0, MAX_SCORE),
    totalNotifiable: total,
    timelyCompleteRate,
    lateNotificationCount,
    notNotifiedCount,
    managersInformedRate,
  };
}

// ── Evaluator 3: Pattern Analysis ──────────────────────────────────────────

export function evaluatePatternAnalysis(
  incidents: IncidentRecord[],
  trends: IncidentTrend[],
  patterns: PatternIndicator[],
): PatternAnalysisResult {
  const MAX_SCORE = 25;

  if (incidents.length === 0 && trends.length === 0 && patterns.length === 0) {
    return {
      overallScore: MAX_SCORE,
      trendsAnalysed: 0,
      escalatingChildCount: 0,
      predominantCategory: "none",
      lessonsIdentifiedRate: 0,
      triggerPatternsIdentified: 0,
      environmentalFactorsCount: 0,
    };
  }

  const trendsAnalysed = trends.length;
  const escalatingChildCount = trends.filter((t) => t.escalating).length;

  // Predominant category from incidents
  const categoryCounts: Partial<Record<IncidentCategory, number>> = {};
  for (const inc of incidents) {
    categoryCounts[inc.category] = (categoryCounts[inc.category] ?? 0) + 1;
  }
  let predominantCategory: IncidentCategory | "none" = "none";
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      predominantCategory = cat as IncidentCategory;
    }
  }

  // Lessons identified rate
  const lessonsIdentified = incidents.filter((i) => i.lessonsIdentified).length;
  const lessonsIdentifiedRate = pct(lessonsIdentified, incidents.length);

  // Trigger patterns from trends
  const allTriggers = new Set<string>();
  for (const trend of trends) {
    for (const trigger of trend.triggerPatterns) {
      allTriggers.add(trigger);
    }
  }
  const triggerPatternsIdentified = allTriggers.size;

  // Environmental factors from patterns
  const environmentalFactorsCount = patterns.filter(
    (p) => p.environmentalTrigger !== null,
  ).length;

  // Score calculation
  // Lessons identified rate contributes up to 12 points
  let score = incidents.length > 0 ? (lessonsIdentifiedRate / 100) * 12 : 12;

  // Trigger patterns identified contributes up to 8 points (more patterns = better understanding)
  const triggerScore = Math.min(triggerPatternsIdentified, 5) / 5;
  score += triggerScore * 8;

  // Environmental factors identified contributes up to 5 points
  const envScore = Math.min(environmentalFactorsCount, 3) / 3;
  score += envScore * 5;

  // Penalties for escalating children
  score -= escalatingChildCount * 3;

  return {
    overallScore: clamp(Math.round(score), 0, MAX_SCORE),
    trendsAnalysed,
    escalatingChildCount,
    predominantCategory,
    lessonsIdentifiedRate,
    triggerPatternsIdentified,
    environmentalFactorsCount,
  };
}

// ── Evaluator 4: Post-Incident ─────────────────────────────────────────────

export function evaluatePostIncident(
  incidents: IncidentRecord[],
): PostIncidentResult {
  const MAX_SCORE = 25;

  if (incidents.length === 0) {
    return {
      overallScore: MAX_SCORE,
      totalPostIncident: 0,
      debriefCompletionRate: 0,
      supportPlanUpdateRate: 0,
      medicalAttentionRate: 0,
      externalReferralRate: 0,
      noActionCount: 0,
    };
  }

  const total = incidents.length;
  const allActions = incidents.flatMap((i) => i.postIncidentActions);

  const debriefCount = incidents.filter((i) =>
    i.postIncidentActions.includes("debrief_completed"),
  ).length;
  const debriefCompletionRate = pct(debriefCount, total);

  const supportPlanCount = incidents.filter((i) =>
    i.postIncidentActions.includes("support_plan_updated"),
  ).length;
  const supportPlanUpdateRate = pct(supportPlanCount, total);

  const medicalCount = incidents.filter((i) =>
    i.postIncidentActions.includes("medical_attention"),
  ).length;
  const medicalAttentionRate = pct(medicalCount, total);

  const referralCount = incidents.filter((i) =>
    i.postIncidentActions.includes("external_referral"),
  ).length;
  const externalReferralRate = pct(referralCount, total);

  const noActionCount = incidents.filter((i) =>
    i.postIncidentActions.includes("no_action"),
  ).length;

  // Score calculation
  // Debrief completion contributes up to 10 points
  let score = (debriefCompletionRate / 100) * 10;

  // Support plan updates contribute up to 8 points
  score += (supportPlanUpdateRate / 100) * 8;

  // Medical attention when injury occurred contributes up to 4 points
  const injuryIncidents = incidents.filter((i) => i.injuryOccurred);
  if (injuryIncidents.length > 0) {
    const medicalForInjury = injuryIncidents.filter((i) =>
      i.postIncidentActions.includes("medical_attention"),
    ).length;
    score += (pct(medicalForInjury, injuryIncidents.length) / 100) * 4;
  } else {
    score += 4; // No injuries = full marks for this component
  }

  // Remaining 3 points for general follow-through (no_action penalty)
  const noActionRate = noActionCount / total;
  score += (1 - noActionRate) * 3;

  return {
    overallScore: clamp(Math.round(score), 0, MAX_SCORE),
    totalPostIncident: total,
    debriefCompletionRate,
    supportPlanUpdateRate,
    medicalAttentionRate,
    externalReferralRate,
    noActionCount,
  };
}

// ── Build Child Incident Profiles ──────────────────────────────────────────

export function buildChildIncidentProfiles(
  incidents: IncidentRecord[],
  trends: IncidentTrend[],
): ChildIncidentProfile[] {
  // Group incidents by childId
  const byChild = new Map<string, IncidentRecord[]>();
  for (const inc of incidents) {
    const list = byChild.get(inc.childId) ?? [];
    list.push(inc);
    byChild.set(inc.childId, list);
  }

  // Build a map of escalating status from trends
  const escalatingMap = new Map<string, boolean>();
  for (const trend of trends) {
    if (trend.escalating) {
      escalatingMap.set(trend.childId, true);
    }
  }

  const profiles: ChildIncidentProfile[] = [];

  for (const [childId, childIncidents] of byChild) {
    const childName = childIncidents[0].childName;
    const incidentCount = childIncidents.length;
    const criticalCount = childIncidents.filter((i) => i.severity === "critical").length;

    // Predominant category
    const catCounts: Partial<Record<IncidentCategory, number>> = {};
    for (const inc of childIncidents) {
      catCounts[inc.category] = (catCounts[inc.category] ?? 0) + 1;
    }
    let predominantCategory: IncidentCategory | "none" = "none";
    let maxCat = 0;
    for (const [cat, count] of Object.entries(catCounts)) {
      if (count > maxCat) {
        maxCat = count;
        predominantCategory = cat as IncidentCategory;
      }
    }

    const escalating = escalatingMap.get(childId) ?? false;

    // De-escalation success rate for this child
    const deEscAttempted = childIncidents.filter((i) => i.deEscalationAttempted);
    const deEscSuccess = deEscAttempted.filter(
      (i) =>
        i.deEscalationOutcome === "successful" ||
        i.deEscalationOutcome === "partially_successful",
    ).length;
    const deEscalationSuccessRate = pct(deEscSuccess, deEscAttempted.length);

    const restraintCount = childIncidents.filter((i) => i.restraintUsed).length;

    // Overall score for this child (0-10)
    // Higher is better. Based on: low incident count, no criticals, de-escalation works, no restraint, not escalating
    let childScore = 10;
    // Penalty for incidents
    childScore -= Math.min(incidentCount, 5) * 0.5; // up to -2.5
    // Penalty for critical incidents
    childScore -= criticalCount * 2;
    // Bonus for high de-escalation success
    if (deEscAttempted.length > 0) {
      childScore += (deEscalationSuccessRate / 100) * 2 - 1; // -1 to +1
    }
    // Penalty for restraint usage
    childScore -= restraintCount * 0.5;
    // Penalty for escalating
    if (escalating) childScore -= 2;

    profiles.push({
      childId,
      childName,
      incidentCount,
      criticalCount,
      predominantCategory,
      escalating,
      deEscalationSuccessRate,
      restraintCount,
      overallScore: clamp(Math.round(childScore * 10) / 10, 0, 10),
    });
  }

  // Sort by overallScore ascending (most concerning first)
  profiles.sort((a, b) => a.overallScore - b.overallScore);

  return profiles;
}

// ── Strengths / Areas / Actions Generators ─────────────────────────────────

function generateStrengths(
  ir: IncidentResponseResult,
  nc: NotificationComplianceResult,
  pa: PatternAnalysisResult,
  pi: PostIncidentResult,
  totalIncidents: number,
): string[] {
  const strengths: string[] = [];

  if (totalIncidents === 0) {
    strengths.push("No incidents recorded during the assessment period — an excellent outcome indicating a settled, well-managed home environment");
  }

  if (ir.overallScore >= 20 && totalIncidents > 0) {
    strengths.push("Incident response quality is consistently high, demonstrating skilled and proportionate staff interventions");
  }

  if (ir.responseQualityRate >= 90 && totalIncidents > 0) {
    strengths.push(`Response quality rated exemplary or appropriate in ${ir.responseQualityRate}% of incidents`);
  }

  if (ir.deEscalationSuccessRate >= 80 && totalIncidents > 0) {
    strengths.push(`De-escalation strategies are effective, with a ${ir.deEscalationSuccessRate}% success rate showing staff skill in managing behaviour without physical intervention`);
  }

  if (ir.childDebriefRate >= 90 && totalIncidents > 0) {
    strengths.push(`Children are consistently debriefed after incidents (${ir.childDebriefRate}%), ensuring their voice is heard and emotional recovery is supported`);
  }

  if (ir.restraintRate === 0 && totalIncidents > 0) {
    strengths.push("No restraint used during the period, reflecting commitment to the Restraint Reduction Network Standards");
  }

  if (nc.overallScore >= 20 && nc.totalNotifiable > 0) {
    strengths.push("Notification compliance is strong, with relevant authorities informed in a timely and complete manner");
  }

  if (nc.timelyCompleteRate >= 90 && nc.totalNotifiable > 0) {
    strengths.push(`${nc.timelyCompleteRate}% of notifications were timely and complete, meeting Reg 40 requirements`);
  }

  if (nc.managersInformedRate >= 95 && nc.totalNotifiable > 0) {
    strengths.push("Managers are consistently informed of all incidents, ensuring effective oversight and governance");
  }

  if (pa.overallScore >= 20) {
    strengths.push("Pattern analysis is thorough, with trends identified and environmental triggers understood");
  }

  if (pa.lessonsIdentifiedRate >= 90 && totalIncidents > 0) {
    strengths.push(`Lessons are identified from ${pa.lessonsIdentifiedRate}% of incidents, demonstrating a strong learning culture`);
  }

  if (pa.escalatingChildCount === 0 && totalIncidents > 0) {
    strengths.push("No children showing escalating incident patterns — interventions and support plans appear effective");
  }

  if (pi.overallScore >= 20 && totalIncidents > 0) {
    strengths.push("Post-incident processes are robust, with debriefs completed and support plans updated consistently");
  }

  if (pi.debriefCompletionRate >= 90 && totalIncidents > 0) {
    strengths.push(`Post-incident debriefs are completed for ${pi.debriefCompletionRate}% of incidents`);
  }

  if (pi.noActionCount === 0 && totalIncidents > 0) {
    strengths.push("Every incident has resulted in follow-up action, demonstrating a proactive approach to safeguarding");
  }

  return strengths;
}

function generateAreasForImprovement(
  ir: IncidentResponseResult,
  nc: NotificationComplianceResult,
  pa: PatternAnalysisResult,
  pi: PostIncidentResult,
  totalIncidents: number,
): string[] {
  const areas: string[] = [];

  if (ir.overallScore < 15 && totalIncidents > 0) {
    areas.push("Incident response quality requires significant improvement to meet regulatory expectations");
  }

  if (ir.responseQualityRate < 70 && totalIncidents > 0) {
    areas.push(`Only ${ir.responseQualityRate}% of incident responses are rated as appropriate or better — staff training in de-escalation and incident management should be prioritised`);
  }

  if (ir.deEscalationSuccessRate < 60 && totalIncidents > 0) {
    areas.push(`De-escalation success rate is ${ir.deEscalationSuccessRate}% — review de-escalation strategies and consider additional training`);
  }

  if (ir.childDebriefRate < 70 && totalIncidents > 0) {
    areas.push(`Only ${ir.childDebriefRate}% of children were debriefed after incidents — this must improve to ensure children's voices are heard (UNCRC Article 19)`);
  }

  if (ir.restraintRate > 30 && totalIncidents > 0) {
    areas.push(`Restraint was used in ${ir.restraintRate}% of incidents — this rate is concerning and should be reviewed against Restraint Reduction Network Standards`);
  }

  if (nc.overallScore < 15 && nc.totalNotifiable > 0) {
    areas.push("Notification compliance falls below expected standards and must be addressed urgently");
  }

  if (nc.notNotifiedCount > 0) {
    areas.push(`${nc.notNotifiedCount} incident(s) were not notified to relevant authorities — this is a serious regulatory concern under Reg 40`);
  }

  if (nc.lateNotificationCount > 0) {
    areas.push(`${nc.lateNotificationCount} notification(s) were made late — procedures should be reviewed to ensure timely reporting`);
  }

  if (nc.managersInformedRate < 80 && nc.totalNotifiable > 0) {
    areas.push(`Managers were informed in only ${nc.managersInformedRate}% of incidents — oversight and governance must improve`);
  }

  if (pa.escalatingChildCount > 0) {
    areas.push(`${pa.escalatingChildCount} child(ren) showing escalating incident patterns — individual support plans require urgent review`);
  }

  if (pa.lessonsIdentifiedRate < 60 && totalIncidents > 0) {
    areas.push(`Lessons are identified in only ${pa.lessonsIdentifiedRate}% of incidents — a learning culture must be embedded`);
  }

  if (pi.overallScore < 15 && totalIncidents > 0) {
    areas.push("Post-incident processes need strengthening to ensure proper follow-up after every incident");
  }

  if (pi.debriefCompletionRate < 70 && totalIncidents > 0) {
    areas.push(`Post-incident debrief completion is only ${pi.debriefCompletionRate}% — debriefs must be completed for all incidents`);
  }

  if (pi.noActionCount > 0) {
    areas.push(`${pi.noActionCount} incident(s) resulted in no follow-up action — this is unacceptable and must be addressed immediately`);
  }

  return areas;
}

function generateActions(
  ir: IncidentResponseResult,
  nc: NotificationComplianceResult,
  pa: PatternAnalysisResult,
  pi: PostIncidentResult,
  childProfiles: ChildIncidentProfile[],
  totalIncidents: number,
): string[] {
  const actions: string[] = [];

  // Critical/urgent actions
  if (ir.criticalIncidentCount > 0) {
    actions.push(`URGENT: ${ir.criticalIncidentCount} critical incident(s) recorded — ensure all safeguarding protocols have been followed and Ofsted notified within 24 hours`);
  }

  if (nc.notNotifiedCount > 0) {
    actions.push(`URGENT: ${nc.notNotifiedCount} incident(s) not notified — complete outstanding Reg 40 notifications immediately`);
  }

  const escalatingChildren = childProfiles.filter((c) => c.escalating);
  if (escalatingChildren.length > 0) {
    for (const child of escalatingChildren) {
      actions.push(`URGENT: Review and update ${child.childName}'s behaviour support plan — escalating pattern identified`);
    }
  }

  if (pi.noActionCount > 0) {
    actions.push(`URGENT: Complete post-incident actions for ${pi.noActionCount} incident(s) where no follow-up has been recorded`);
  }

  // High priority
  if (ir.deEscalationSuccessRate < 50 && totalIncidents > 0) {
    actions.push("Schedule team training on de-escalation techniques within the next 4 weeks");
  }

  if (ir.childDebriefRate < 70 && totalIncidents > 0) {
    actions.push("Implement mandatory child debrief protocol following every incident — assign keyworker responsibility");
  }

  if (ir.restraintRate > 20 && totalIncidents > 0) {
    actions.push("Commission restraint reduction review and update physical intervention policy");
  }

  if (nc.lateNotificationCount > 0) {
    actions.push("Review notification procedures and ensure all staff understand Reg 40 reporting timescales");
  }

  if (nc.managersInformedRate < 80 && nc.totalNotifiable > 0) {
    actions.push("Establish clear escalation pathway to ensure managers are informed of all incidents within 1 hour");
  }

  if (pa.lessonsIdentifiedRate < 60 && totalIncidents > 0) {
    actions.push("Introduce structured incident review meetings to ensure lessons are identified and shared from every incident");
  }

  if (pi.debriefCompletionRate < 70 && totalIncidents > 0) {
    actions.push("Implement a post-incident checklist to ensure debriefs, support plan reviews, and follow-up actions are completed");
  }

  // General improvements
  if (ir.responseQualityRate < 80 && totalIncidents > 0) {
    actions.push("Arrange reflective practice sessions focusing on incident response quality and proportionality");
  }

  if (totalIncidents === 0) {
    actions.push("Continue current positive strategies and maintain vigilance — no incidents is an excellent outcome");
  }

  return actions;
}

// ── Regulatory Links ───────────────────────────────────────────────────────

function getRegulatorLinks(): string[] {
  return [
    "CHR 2015 Reg 12 — The protection of children standard (behaviour management)",
    "CHR 2015 Reg 40 — Notification of serious events",
    "SCCIF — Safety and wellbeing of children",
    "UNCRC Article 19 — Protection from all forms of violence",
    "NMS 3 — Safeguarding children",
    "Working Together 2023 — Multi-agency safeguarding arrangements",
    "KCSIE 2024 — Keeping Children Safe in Education",
    "Restraint Reduction Network Standards",
  ];
}

// ── Main Function ──────────────────────────────────────────────────────────

export function generateIncidentPatternAnalysisIntelligence(
  incidents: IncidentRecord[],
  trends: IncidentTrend[],
  staffResponses: StaffResponse[],
  patterns: PatternIndicator[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): IncidentPatternAnalysisIntelligence {
  const incidentResponse = evaluateIncidentResponse(incidents, staffResponses);
  const notificationCompliance = evaluateNotificationCompliance(incidents);
  const patternAnalysis = evaluatePatternAnalysis(incidents, trends, patterns);
  const postIncident = evaluatePostIncident(incidents);

  const overallScore = clamp(
    incidentResponse.overallScore +
      notificationCompliance.overallScore +
      patternAnalysis.overallScore +
      postIncident.overallScore,
    0,
    100,
  );

  const rating = getRating(overallScore);

  const childProfiles = buildChildIncidentProfiles(incidents, trends);

  const strengths = generateStrengths(
    incidentResponse,
    notificationCompliance,
    patternAnalysis,
    postIncident,
    incidents.length,
  );

  const areasForImprovement = generateAreasForImprovement(
    incidentResponse,
    notificationCompliance,
    patternAnalysis,
    postIncident,
    incidents.length,
  );

  const actions = generateActions(
    incidentResponse,
    notificationCompliance,
    patternAnalysis,
    postIncident,
    childProfiles,
    incidents.length,
  );

  const regulatoryLinks = getRegulatorLinks();

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    incidentResponse,
    notificationCompliance,
    patternAnalysis,
    postIncident,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
