// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Behaviour & Positive Relationships Engine
//
// Deterministic engine for tracking behaviour patterns, de-escalation success
// rates, positive reinforcement programmes, reward systems, and behaviour
// support plan compliance.
//
// Aligned to:
//   - CHR 2015 Reg 19 — Behaviour management
//   - CHR 2015 Reg 20 — Restraint (last resort only)
//   - CHR 2015 Reg 35 — Behaviour management policy
//   - SCCIF — Children's behaviour is well managed using positive strategies
//   - Reducing the Need for Restraint and Restrictive Intervention (DfE 2019)
//
// Key principles:
//   - Positive reinforcement > punishment
//   - De-escalation before restraint
//   - Behaviour understood in context of trauma
//   - Every child has an individualised behaviour support plan
//   - Restraint always debriefed, recorded, reviewed
//   - Children involved in creating their own strategies
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type BehaviourSeverity = "low" | "medium" | "high" | "critical";

export type BehaviourType =
  | "verbal_aggression"
  | "physical_aggression"
  | "self_harm"
  | "property_damage"
  | "absconding"
  | "substance_use"
  | "sexualised_behaviour"
  | "non_compliance"
  | "bullying"
  | "emotional_dysregulation"
  | "other";

export type InterventionType =
  | "verbal_reassurance"
  | "distraction"
  | "offer_space"
  | "planned_ignoring"
  | "de_escalation_script"
  | "sensory_regulation"
  | "physical_intervention"
  | "separation"
  | "repair_conversation"
  | "reward_offered"
  | "natural_consequence"
  | "restorative_meeting"
  | "other";

export type RestraintType = "standing" | "seated" | "ground" | "supine" | "side" | "other";

export type PositiveEventType =
  | "reward_earned"
  | "target_met"
  | "prosocial_behaviour"
  | "emotional_regulation"
  | "helping_others"
  | "academic_achievement"
  | "community_participation"
  | "conflict_resolution"
  | "independence_milestone";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface BehaviourIncident {
  id: string;
  childId: string;
  childName: string;
  homeId: string;
  date: string;
  time: string;
  severity: BehaviourSeverity;
  type: BehaviourType;
  description: string;
  antecedent?: string;                  // ABC model: what happened before
  behaviour: string;                    // ABC model: what the child did
  consequence: string;                  // ABC model: what happened after
  interventionsUsed: InterventionType[];
  deEscalationAttempted: boolean;
  deEscalationSuccessful?: boolean;
  restraintUsed: boolean;
  restraintType?: RestraintType;
  restraintDuration?: number;           // minutes
  restraintDebriefChild?: boolean;
  restraintDebriefStaff?: boolean;
  injuryOccurred: boolean;
  injuryDetails?: string;
  triggers: string[];
  staffInvolved: string[];
  witnesses: string[];
  followUpActions: string[];
  recordedBy: string;
  recordedAt: string;
}

export interface PositiveEvent {
  id: string;
  childId: string;
  childName: string;
  homeId: string;
  date: string;
  type: PositiveEventType;
  description: string;
  rewardGiven?: string;
  acknowledgedBy: string;
  sharedWithTeam: boolean;
  recordedBy: string;
}

export interface BehaviourSupportPlan {
  id: string;
  childId: string;
  childName: string;
  homeId: string;
  createdAt: string;
  reviewDate: string;
  lastReviewedAt?: string;
  isActive: boolean;
  knownTriggers: string[];
  earlyWarningSignals: string[];
  deEscalationStrategies: string[];
  preferredInterventions: InterventionType[];
  rewardTargets: string[];
  restrictedPracticeThreshold: string;
  childContributed: boolean;              // child's voice in their plan
  socialWorkerAgreed: boolean;
  parentCarerInformed: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ChildBehaviourAnalysis {
  childId: string;
  childName: string;
  totalIncidents: number;
  incidentsLast30Days: number;
  incidentTrend: "increasing" | "stable" | "decreasing";
  severityBreakdown: Record<BehaviourSeverity, number>;
  commonTriggers: string[];
  commonTypes: BehaviourType[];
  deEscalationRate: number;             // % successful de-escalation
  restraintCount: number;
  restraintCountLast30Days: number;
  restraintReduction: boolean;
  positiveEventsCount: number;
  positiveToNegativeRatio: number;      // want > 5:1
  hasSupportPlan: boolean;
  supportPlanCurrent: boolean;
  supportPlanChildVoice: boolean;
  issues: string[];
  recommendations: string[];
}

export interface HomeBehaviourMetrics {
  homeId: string;
  childCount: number;
  totalIncidents: number;
  incidentsLast30Days: number;
  incidentTrend: "increasing" | "stable" | "decreasing";
  averageSeverity: number;              // 1-4 mapped from severity levels
  deEscalationSuccessRate: number;      // %
  restraintCount: number;
  restraintCountLast30Days: number;
  restraintReductionTrend: boolean;
  totalPositiveEvents: number;
  positiveEventsLast30Days: number;
  overallPositiveRatio: number;         // positive events / incidents
  supportPlanComplianceRate: number;    // % with current plans
  childVoiceInPlans: number;            // %
  debriefComplianceRate: number;        // % restraints debriefed
  childrenOfConcern: { childId: string; childName: string; reason: string }[];
  commonTriggers: string[];
  topInterventions: { type: InterventionType; count: number }[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const SUPPORT_PLAN_REVIEW_DAYS = 90;     // review every 3 months
const POSITIVE_RATIO_TARGET = 5;          // 5:1 positive to negative
const HIGH_INCIDENT_THRESHOLD_30D = 5;    // concern if >5 incidents in 30d
const RESTRAINT_CONCERN_THRESHOLD_30D = 2;
const SEVERITY_MAP: Record<BehaviourSeverity, number> = {
  low: 1, medium: 2, high: 3, critical: 4,
};

// ── Core: Analyse Child Behaviour ──────────────────────────────────────────

export function analyseChildBehaviour(
  incidents: BehaviourIncident[],
  positiveEvents: PositiveEvent[],
  supportPlans: BehaviourSupportPlan[],
  childId: string,
  now?: string,
): ChildBehaviourAnalysis {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = currentTime - 60 * 24 * 60 * 60 * 1000;

  const childIncidents = incidents.filter(i => i.childId === childId);
  const childPositive = positiveEvents.filter(p => p.childId === childId);
  const childPlans = supportPlans.filter(p => p.childId === childId && p.isActive);

  const incidentsLast30 = childIncidents.filter(i => new Date(i.date).getTime() > thirtyDaysAgo);
  const incidentsPrev30 = childIncidents.filter(
    i => new Date(i.date).getTime() > sixtyDaysAgo && new Date(i.date).getTime() <= thirtyDaysAgo
  );

  // Trend
  let incidentTrend: "increasing" | "stable" | "decreasing" = "stable";
  if (incidentsLast30.length > incidentsPrev30.length + 2) incidentTrend = "increasing";
  else if (incidentsLast30.length < incidentsPrev30.length - 1) incidentTrend = "decreasing";

  // Severity breakdown
  const severityBreakdown: Record<BehaviourSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const i of childIncidents) severityBreakdown[i.severity]++;

  // Common triggers
  const triggerCounts = new Map<string, number>();
  for (const i of childIncidents) {
    for (const t of i.triggers) {
      triggerCounts.set(t, (triggerCounts.get(t) ?? 0) + 1);
    }
  }
  const commonTriggers = Array.from(triggerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  // Common types
  const typeCounts = new Map<BehaviourType, number>();
  for (const i of childIncidents) typeCounts.set(i.type, (typeCounts.get(i.type) ?? 0) + 1);
  const commonTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  // De-escalation rate
  const deEscAttempted = childIncidents.filter(i => i.deEscalationAttempted);
  const deEscSuccessful = deEscAttempted.filter(i => i.deEscalationSuccessful);
  const deEscalationRate = deEscAttempted.length > 0
    ? Math.round((deEscSuccessful.length / deEscAttempted.length) * 100)
    : 0;

  // Restraint
  const restraintIncidents = childIncidents.filter(i => i.restraintUsed);
  const restraintLast30 = restraintIncidents.filter(i => new Date(i.date).getTime() > thirtyDaysAgo);
  const restraintPrev30 = restraintIncidents.filter(
    i => new Date(i.date).getTime() > sixtyDaysAgo && new Date(i.date).getTime() <= thirtyDaysAgo
  );
  const restraintReduction = restraintLast30.length < restraintPrev30.length;

  // Positive ratio
  const positiveLast30 = childPositive.filter(p => new Date(p.date).getTime() > thirtyDaysAgo);
  const positiveToNegativeRatio = incidentsLast30.length > 0
    ? Math.round((positiveLast30.length / incidentsLast30.length) * 10) / 10
    : positiveLast30.length > 0 ? positiveLast30.length : 0;

  // Support plan
  const activePlan = childPlans[0];
  const hasSupportPlan = !!activePlan;
  const supportPlanCurrent = activePlan
    ? new Date(activePlan.reviewDate).getTime() > currentTime ||
      (activePlan.lastReviewedAt
        ? (currentTime - new Date(activePlan.lastReviewedAt).getTime()) < SUPPORT_PLAN_REVIEW_DAYS * 24 * 60 * 60 * 1000
        : false)
    : false;
  const supportPlanChildVoice = activePlan?.childContributed ?? false;

  // Issues & recommendations
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (incidentsLast30.length > HIGH_INCIDENT_THRESHOLD_30D) {
    issues.push(`${incidentsLast30.length} incidents in 30 days (threshold: ${HIGH_INCIDENT_THRESHOLD_30D})`);
  }
  if (restraintLast30.length > RESTRAINT_CONCERN_THRESHOLD_30D) {
    issues.push(`${restraintLast30.length} restraints in 30 days — review BSP urgently`);
  }
  if (!hasSupportPlan) {
    issues.push("No active behaviour support plan");
    recommendations.push("Create individualised behaviour support plan");
  } else if (!supportPlanCurrent) {
    issues.push("Behaviour support plan overdue for review");
    recommendations.push("Review and update BSP within 7 days");
  }
  if (incidentTrend === "increasing") {
    issues.push("Incident frequency increasing");
    recommendations.push("Schedule multi-agency behaviour review");
  }
  if (positiveToNegativeRatio < POSITIVE_RATIO_TARGET && incidentsLast30.length > 0) {
    recommendations.push(`Increase positive interactions (currently ${positiveToNegativeRatio}:1, target 5:1)`);
  }
  if (hasSupportPlan && !supportPlanChildVoice) {
    recommendations.push("Include child's voice in BSP review");
  }
  if (deEscalationRate < 60 && deEscAttempted.length >= 3) {
    recommendations.push("Review de-escalation strategies — success rate below 60%");
  }

  const childName = childIncidents[0]?.childName ?? childPositive[0]?.childName ?? childId;

  return {
    childId,
    childName,
    totalIncidents: childIncidents.length,
    incidentsLast30Days: incidentsLast30.length,
    incidentTrend,
    severityBreakdown,
    commonTriggers,
    commonTypes,
    deEscalationRate,
    restraintCount: restraintIncidents.length,
    restraintCountLast30Days: restraintLast30.length,
    restraintReduction,
    positiveEventsCount: childPositive.length,
    positiveToNegativeRatio,
    hasSupportPlan,
    supportPlanCurrent,
    supportPlanChildVoice,
    issues,
    recommendations,
  };
}

// ── Core: Calculate Home Metrics ────────────────────────────────────────────

export function calculateHomeBehaviourMetrics(
  incidents: BehaviourIncident[],
  positiveEvents: PositiveEvent[],
  supportPlans: BehaviourSupportPlan[],
  homeId: string,
  now?: string,
): HomeBehaviourMetrics {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = currentTime - 60 * 24 * 60 * 60 * 1000;

  const homeIncidents = incidents.filter(i => i.homeId === homeId);
  const homePositive = positiveEvents.filter(p => p.homeId === homeId);
  const homePlans = supportPlans.filter(p => p.homeId === homeId);

  const incidentsLast30 = homeIncidents.filter(i => new Date(i.date).getTime() > thirtyDaysAgo);
  const incidentsPrev30 = homeIncidents.filter(
    i => new Date(i.date).getTime() > sixtyDaysAgo && new Date(i.date).getTime() <= thirtyDaysAgo
  );
  const positiveLast30 = homePositive.filter(p => new Date(p.date).getTime() > thirtyDaysAgo);

  // Unique children
  const childIds = new Set([
    ...homeIncidents.map(i => i.childId),
    ...homePositive.map(p => p.childId),
  ]);
  const childCount = childIds.size;

  // Trend
  let incidentTrend: "increasing" | "stable" | "decreasing" = "stable";
  if (incidentsLast30.length > incidentsPrev30.length + 2) incidentTrend = "increasing";
  else if (incidentsLast30.length < incidentsPrev30.length - 1) incidentTrend = "decreasing";

  // Average severity
  const avgSeverity = homeIncidents.length > 0
    ? Math.round((homeIncidents.reduce((s, i) => s + SEVERITY_MAP[i.severity], 0) / homeIncidents.length) * 10) / 10
    : 0;

  // De-escalation
  const deEscAttempted = homeIncidents.filter(i => i.deEscalationAttempted);
  const deEscSuccessful = deEscAttempted.filter(i => i.deEscalationSuccessful);
  const deEscalationSuccessRate = deEscAttempted.length > 0
    ? Math.round((deEscSuccessful.length / deEscAttempted.length) * 100)
    : 0;

  // Restraint
  const restraints = homeIncidents.filter(i => i.restraintUsed);
  const restraintsLast30 = restraints.filter(i => new Date(i.date).getTime() > thirtyDaysAgo);
  const restraintsPrev30 = restraints.filter(
    i => new Date(i.date).getTime() > sixtyDaysAgo && new Date(i.date).getTime() <= thirtyDaysAgo
  );
  const restraintReductionTrend = restraintsLast30.length <= restraintsPrev30.length;

  // Debrief compliance
  const restraintDebriefed = restraints.filter(i => i.restraintDebriefChild && i.restraintDebriefStaff);
  const debriefComplianceRate = restraints.length > 0
    ? Math.round((restraintDebriefed.length / restraints.length) * 100)
    : 100;

  // Positive ratio
  const overallPositiveRatio = incidentsLast30.length > 0
    ? Math.round((positiveLast30.length / incidentsLast30.length) * 10) / 10
    : positiveLast30.length;

  // Support plan compliance
  const activePlans = homePlans.filter(p => p.isActive);
  const currentPlans = activePlans.filter(p => {
    if (new Date(p.reviewDate).getTime() > currentTime) return true;
    if (p.lastReviewedAt) {
      return (currentTime - new Date(p.lastReviewedAt).getTime()) < SUPPORT_PLAN_REVIEW_DAYS * 24 * 60 * 60 * 1000;
    }
    return false;
  });
  const supportPlanComplianceRate = activePlans.length > 0
    ? Math.round((currentPlans.length / activePlans.length) * 100)
    : 0;

  // Child voice
  const plansWithVoice = activePlans.filter(p => p.childContributed);
  const childVoiceInPlans = activePlans.length > 0
    ? Math.round((plansWithVoice.length / activePlans.length) * 100)
    : 0;

  // Children of concern
  const childrenOfConcern: { childId: string; childName: string; reason: string }[] = [];
  for (const cid of childIds) {
    const childInc30 = incidentsLast30.filter(i => i.childId === cid);
    const childRestraint30 = childInc30.filter(i => i.restraintUsed);
    if (childInc30.length > HIGH_INCIDENT_THRESHOLD_30D) {
      const name = childInc30[0]?.childName ?? cid;
      childrenOfConcern.push({ childId: cid, childName: name, reason: `${childInc30.length} incidents in 30 days` });
    } else if (childRestraint30.length > RESTRAINT_CONCERN_THRESHOLD_30D) {
      const name = childRestraint30[0]?.childName ?? cid;
      childrenOfConcern.push({ childId: cid, childName: name, reason: `${childRestraint30.length} restraints in 30 days` });
    }
  }

  // Common triggers
  const triggerCounts = new Map<string, number>();
  for (const i of homeIncidents) {
    for (const t of i.triggers) triggerCounts.set(t, (triggerCounts.get(t) ?? 0) + 1);
  }
  const commonTriggers = Array.from(triggerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  // Top interventions
  const interventionCounts = new Map<InterventionType, number>();
  for (const i of homeIncidents) {
    for (const int of i.interventionsUsed) {
      interventionCounts.set(int, (interventionCounts.get(int) ?? 0) + 1);
    }
  }
  const topInterventions = Array.from(interventionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  return {
    homeId,
    childCount,
    totalIncidents: homeIncidents.length,
    incidentsLast30Days: incidentsLast30.length,
    incidentTrend,
    averageSeverity: avgSeverity,
    deEscalationSuccessRate,
    restraintCount: restraints.length,
    restraintCountLast30Days: restraintsLast30.length,
    restraintReductionTrend,
    totalPositiveEvents: homePositive.length,
    positiveEventsLast30Days: positiveLast30.length,
    overallPositiveRatio,
    supportPlanComplianceRate,
    childVoiceInPlans,
    debriefComplianceRate,
    childrenOfConcern,
    commonTriggers,
    topInterventions,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function getSeverityLabel(severity: BehaviourSeverity): string {
  const labels: Record<BehaviourSeverity, string> = {
    low: "Low", medium: "Medium", high: "High", critical: "Critical",
  };
  return labels[severity];
}

export function getBehaviourTypeLabel(type: BehaviourType): string {
  const labels: Record<BehaviourType, string> = {
    verbal_aggression: "Verbal Aggression",
    physical_aggression: "Physical Aggression",
    self_harm: "Self-Harm",
    property_damage: "Property Damage",
    absconding: "Absconding",
    substance_use: "Substance Use",
    sexualised_behaviour: "Sexualised Behaviour",
    non_compliance: "Non-Compliance",
    bullying: "Bullying",
    emotional_dysregulation: "Emotional Dysregulation",
    other: "Other",
  };
  return labels[type] ?? type;
}

export function getInterventionLabel(type: InterventionType): string {
  const labels: Record<InterventionType, string> = {
    verbal_reassurance: "Verbal Reassurance",
    distraction: "Distraction",
    offer_space: "Offer Space",
    planned_ignoring: "Planned Ignoring",
    de_escalation_script: "De-escalation Script",
    sensory_regulation: "Sensory Regulation",
    physical_intervention: "Physical Intervention",
    separation: "Separation",
    repair_conversation: "Repair Conversation",
    reward_offered: "Reward Offered",
    natural_consequence: "Natural Consequence",
    restorative_meeting: "Restorative Meeting",
    other: "Other",
  };
  return labels[type] ?? type;
}
