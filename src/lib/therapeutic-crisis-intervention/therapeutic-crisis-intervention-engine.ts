import { above, below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// THERAPEUTIC CRISIS INTERVENTION INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well a children's residential
// home manages crisis situations using therapeutic approaches, including
// de-escalation, physical interventions (restraints), and post-incident
// learning.
//
// Regulatory basis:
//   - CHR 2015 Reg 12 — The protection of children standard
//   - CHR 2015 Reg 19 — Behaviour management policies and records
//   - CHR 2015 Reg 20 — Restraint and deprivation of liberty
//   - SCCIF — Overall experiences and progress of children
//   - Children Act 1989 — Welfare of the child
//   - Reducing the Need for Restraint and Restrictive Intervention (2019)
//   - NMS 12 — Promoting positive behaviour and relationships
//
// No AI. No external calls. No randomness. No Date.now(). Pure input -> output.
// ==============================================================================

// -- Type Unions ---------------------------------------------------------------

export type InterventionType =
  | "verbal_de_escalation"
  | "distraction"
  | "planned_ignoring"
  | "time_away"
  | "guided_physical"
  | "restrictive_physical"
  | "mechanical_restraint"
  | "medical_intervention";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type DeescalationOutcome =
  | "successful"
  | "partially_successful"
  | "escalated"
  | "physical_intervention_required";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label Maps ----------------------------------------------------------------

const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  verbal_de_escalation: "Verbal De-escalation",
  distraction: "Distraction",
  planned_ignoring: "Planned Ignoring",
  time_away: "Time Away",
  guided_physical: "Guided Physical",
  restrictive_physical: "Restrictive Physical",
  mechanical_restraint: "Mechanical Restraint",
  medical_intervention: "Medical Intervention",
};

const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const DEESCALATION_OUTCOME_LABELS: Record<DeescalationOutcome, string> = {
  successful: "Successful",
  partially_successful: "Partially Successful",
  escalated: "Escalated",
  physical_intervention_required: "Physical Intervention Required",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label Getters -------------------------------------------------------------

export function getInterventionTypeLabel(v: InterventionType): string {
  return INTERVENTION_TYPE_LABELS[v];
}

export function getIncidentSeverityLabel(v: IncidentSeverity): string {
  return INCIDENT_SEVERITY_LABELS[v];
}

export function getDeescalationOutcomeLabel(v: DeescalationOutcome): string {
  return DEESCALATION_OUTCOME_LABELS[v];
}

export function getRatingLabel(v: Rating): string {
  return RATING_LABELS[v];
}

// -- Input Interfaces ----------------------------------------------------------

export interface CrisisIncident {
  id: string;
  childId: string;
  childName: string;
  incidentDate: string;
  interventionType: InterventionType;
  severity: IncidentSeverity;
  deescalationAttempted: boolean;
  deescalationOutcome: DeescalationOutcome;
  physicalInterventionUsed: boolean;
  physicalInterventionJustified: boolean;
  physicalInterventionDuration: number | null;
  childDebrief: boolean;
  staffDebrief: boolean;
  bodyMapCompleted: boolean;
  parentNotified: boolean;
  regulatorNotified: boolean;
  lessonsLearned: boolean;
  recordedTimely: boolean;
}

export interface CrisisPolicy {
  id: string;
  therapeuticApproachDocumented: boolean;
  deescalationProtocol: boolean;
  physicalInterventionPolicy: boolean;
  postIncidentProcess: boolean;
  bodyMapRequirement: boolean;
  notificationProtocol: boolean;
  reviewSchedule: boolean;
}

export interface StaffCrisisTraining {
  id: string;
  staffId: string;
  staffName: string;
  therapeuticApproach: boolean;
  deescalation: boolean;
  physicalIntervention: boolean;
  postIncidentSupport: boolean;
  recordKeeping: boolean;
  bodyMapping: boolean;
}

// -- Result Interfaces ---------------------------------------------------------

export interface DeescalationEffectivenessResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  deescalationAttemptRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  deescalationSuccessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  physicalInterventionRate: number | null;
  severityDistribution: Record<IncidentSeverity, number>;
}

export interface PostIncidentPracticeResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  childDebriefRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffDebriefRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  bodyMapCompletionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  lessonsLearnedRate: number | null;
}

export interface CrisisPolicyResult {
  overallScore: number;
  therapeuticApproachDocumented: boolean;
  deescalationProtocol: boolean;
  physicalInterventionPolicy: boolean;
  postIncidentProcess: boolean;
  bodyMapRequirement: boolean;
  notificationProtocol: boolean;
  reviewSchedule: boolean;
}

export interface StaffCrisisReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  therapeuticApproachRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  deescalationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  physicalInterventionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  postIncidentSupportRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordKeepingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  bodyMappingRate: number | null;
}

export interface ChildCrisisProfile {
  childId: string;
  childName: string;
  totalIncidents: number;
  physicalInterventions: number;
  deescalationSuccessRate: number;
  debriefRate: number;
  overallScore: number;
}

export interface TherapeuticCrisisInterventionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  deescalationEffectiveness: DeescalationEffectivenessResult;
  postIncidentPractice: PostIncidentPracticeResult;
  crisisPolicy: CrisisPolicyResult;
  staffCrisisReadiness: StaffCrisisReadinessResult;
  childProfiles: ChildCrisisProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates de-escalation effectiveness across crisis incidents.
 * Empty (no incidents) = 25 — no incidents is ideal, measuring ABSENCE of crises.
 *
 * - De-escalation attempt rate -> 0-7
 * - Successful/partially_successful de-escalation rate -> 0-6
 * - Low physical intervention usage rate -> 0-6
 * - Severity distribution (lower is better) -> 0-6
 */
export function evaluateDeescalationEffectiveness(
  incidents: CrisisIncident[],
): DeescalationEffectivenessResult {
  if (incidents.length === 0) {
    return {
      overallScore: 25,
      deescalationAttemptRate: null,
      deescalationSuccessRate: null,
      physicalInterventionRate: null,
      severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
    };
  }

  let deescAttempted = 0;
  let deescSuccessful = 0;
  let physicalUsed = 0;
  const sevCounts: Record<IncidentSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };

  for (const inc of incidents) {
    if (inc.deescalationAttempted) deescAttempted++;
    if (
      inc.deescalationOutcome === "successful" ||
      inc.deescalationOutcome === "partially_successful"
    ) {
      deescSuccessful++;
    }
    if (inc.physicalInterventionUsed) physicalUsed++;
    sevCounts[inc.severity]++;
  }

  const deescalationAttemptRate = rate(deescAttempted, incidents.length);
  const deescalationSuccessRate = rate(deescSuccessful, incidents.length);
  const physicalInterventionRate = rate(physicalUsed, incidents.length);

  // De-escalation attempt rate -> 0-7
  let score = 0;
  score += Math.round((deescalationAttemptRate! / 100) * 7);

  // Successful/partially_successful de-escalation rate -> 0-6
  score += Math.round((deescalationSuccessRate! / 100) * 6);

  // Low physical intervention usage rate -> 0-6
  if (physicalInterventionRate === 0) score += 6;
  else if (physicalInterventionRate! <= 15) score += 5;
  else if (physicalInterventionRate! <= 30) score += 4;
  else if (physicalInterventionRate! <= 50) score += 2;
  else if (physicalInterventionRate! <= 75) score += 1;

  // Severity distribution (lower is better) -> 0-6
  const total = incidents.length;
  const lowMedRate = rate(sevCounts.low + sevCounts.medium, total);
  if (meets(lowMedRate, 90)) score += 6;
  else if (meets(lowMedRate, 75)) score += 5;
  else if (meets(lowMedRate, 60)) score += 4;
  else if (meets(lowMedRate, 40)) score += 2;
  else if (meets(lowMedRate, 20)) score += 1;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    deescalationAttemptRate,
    deescalationSuccessRate,
    physicalInterventionRate,
    severityDistribution: sevCounts,
  };
}

/**
 * Evaluates post-incident practice quality.
 * Empty (no incidents) = 25 — no incidents to review is ideal.
 *
 * - Child debrief completion rate -> 0-7
 * - Staff debrief completion rate -> 0-6
 * - Body map completion (when physical intervention used) -> 0-6
 * - Timely recording + lessons learned -> 0-6
 */
export function evaluatePostIncidentPractice(
  incidents: CrisisIncident[],
): PostIncidentPracticeResult {
  if (incidents.length === 0) {
    return {
      overallScore: 25,
      childDebriefRate: null,
      staffDebriefRate: null,
      bodyMapCompletionRate: null,
      timelyRecordingRate: null,
      lessonsLearnedRate: null,
    };
  }

  let childDebriefs = 0;
  let staffDebriefs = 0;
  let timelyRecords = 0;
  let lessonsLearned = 0;

  const physicalIncidents: CrisisIncident[] = [];
  let bodyMapsCompleted = 0;

  for (const inc of incidents) {
    if (inc.childDebrief) childDebriefs++;
    if (inc.staffDebrief) staffDebriefs++;
    if (inc.recordedTimely) timelyRecords++;
    if (inc.lessonsLearned) lessonsLearned++;
    if (inc.physicalInterventionUsed) {
      physicalIncidents.push(inc);
      if (inc.bodyMapCompleted) bodyMapsCompleted++;
    }
  }

  const childDebriefRate = rate(childDebriefs, incidents.length);
  const staffDebriefRate = rate(staffDebriefs, incidents.length);
  const bodyMapCompletionRate = rate(bodyMapsCompleted, physicalIncidents.length);
  const timelyRecordingRate = rate(timelyRecords, incidents.length);
  const lessonsLearnedRate = rate(lessonsLearned, incidents.length);

  // Child debrief completion rate -> 0-7
  let score = 0;
  score += Math.round(((childDebriefRate ?? 0) / 100) * 7);

  // Staff debrief completion rate -> 0-6
  score += Math.round(((staffDebriefRate ?? 0) / 100) * 6);

  // Body map completion (when physical intervention used) -> 0-6
  if (physicalIncidents.length === 0) {
    score += 6; // No physical interventions = best case
  } else {
    score += Math.round((bodyMapCompletionRate! / 100) * 6);
  }

  // Timely recording + lessons learned -> 0-6
  const combinedRate = Math.round((timelyRecordingRate! + lessonsLearnedRate!) / 2);
  score += Math.round((combinedRate / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    childDebriefRate,
    staffDebriefRate,
    bodyMapCompletionRate,
    timelyRecordingRate,
    lessonsLearnedRate,
  };
}

/**
 * Evaluates crisis policy completeness.
 * Null = 0 — no policy is non-compliant.
 *
 * 7 boolean fields scored at different weights totalling 25:
 * - therapeuticApproachDocumented: 5
 * - deescalationProtocol: 4
 * - physicalInterventionPolicy: 4
 * - postIncidentProcess: 4
 * - bodyMapRequirement: 3
 * - notificationProtocol: 3
 * - reviewSchedule: 2
 */
export function evaluateCrisisPolicy(
  policy: CrisisPolicy | null,
): CrisisPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      therapeuticApproachDocumented: false,
      deescalationProtocol: false,
      physicalInterventionPolicy: false,
      postIncidentProcess: false,
      bodyMapRequirement: false,
      notificationProtocol: false,
      reviewSchedule: false,
    };
  }

  let score = 0;
  if (policy.therapeuticApproachDocumented) score += 5;
  if (policy.deescalationProtocol) score += 4;
  if (policy.physicalInterventionPolicy) score += 4;
  if (policy.postIncidentProcess) score += 4;
  if (policy.bodyMapRequirement) score += 3;
  if (policy.notificationProtocol) score += 3;
  if (policy.reviewSchedule) score += 2;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    therapeuticApproachDocumented: policy.therapeuticApproachDocumented,
    deescalationProtocol: policy.deescalationProtocol,
    physicalInterventionPolicy: policy.physicalInterventionPolicy,
    postIncidentProcess: policy.postIncidentProcess,
    bodyMapRequirement: policy.bodyMapRequirement,
    notificationProtocol: policy.notificationProtocol,
    reviewSchedule: policy.reviewSchedule,
  };
}

/**
 * Evaluates staff crisis readiness from training records.
 * Empty = 0 — no trained staff is non-compliant.
 *
 * 6 boolean training fields scored at different weights totalling 25:
 * - therapeuticApproach: 5
 * - deescalation: 5
 * - physicalIntervention: 5
 * - postIncidentSupport: 4
 * - recordKeeping: 3
 * - bodyMapping: 3
 */
export function evaluateStaffCrisisReadiness(
  training: StaffCrisisTraining[],
): StaffCrisisReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      therapeuticApproachRate: null,
      deescalationRate: null,
      physicalInterventionRate: null,
      postIncidentSupportRate: null,
      recordKeepingRate: null,
      bodyMappingRate: null,
    };
  }

  let therapeutic = 0;
  let deescalation = 0;
  let physical = 0;
  let postIncident = 0;
  let recordKeeping = 0;
  let bodyMapping = 0;

  for (const t of training) {
    if (t.therapeuticApproach) therapeutic++;
    if (t.deescalation) deescalation++;
    if (t.physicalIntervention) physical++;
    if (t.postIncidentSupport) postIncident++;
    if (t.recordKeeping) recordKeeping++;
    if (t.bodyMapping) bodyMapping++;
  }

  const therapeuticApproachRate = rate(therapeutic, training.length);
  const deescalationRate = rate(deescalation, training.length);
  const physicalInterventionRate = rate(physical, training.length);
  const postIncidentSupportRate = rate(postIncident, training.length);
  const recordKeepingRate = rate(recordKeeping, training.length);
  const bodyMappingRate = rate(bodyMapping, training.length);

  let score = 0;
  score += Math.round((therapeuticApproachRate! / 100) * 5);
  score += Math.round(((deescalationRate ?? 0) / 100) * 5);
  score += Math.round(((physicalInterventionRate ?? 0) / 100) * 5);
  score += Math.round(((postIncidentSupportRate ?? 0) / 100) * 4);
  score += Math.round(((recordKeepingRate ?? 0) / 100) * 3);
  score += Math.round(((bodyMappingRate ?? 0) / 100) * 3);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    therapeuticApproachRate,
    deescalationRate,
    physicalInterventionRate,
    postIncidentSupportRate,
    recordKeepingRate,
    bodyMappingRate,
  };
}

// -- Child Crisis Profiles -----------------------------------------------------

/**
 * Builds per-child crisis profiles from incident data.
 * Each child: childId, childName, totalIncidents, physicalInterventions,
 * deescalationSuccessRate, debriefRate, overallScore (0-10).
 */
export function buildChildCrisisProfiles(
  incidents: CrisisIncident[],
): ChildCrisisProfile[] {
  const childMap = new Map<
    string,
    { childName: string; incidents: CrisisIncident[] }
  >();

  for (const inc of incidents) {
    const existing = childMap.get(inc.childId);
    if (existing) {
      existing.incidents.push(inc);
    } else {
      childMap.set(inc.childId, { childName: inc.childName, incidents: [inc] });
    }
  }

  return Array.from(childMap.entries()).map(([childId, data]) => {
    const childIncidents = data.incidents;
    const totalIncidents = childIncidents.length;

    const physicalInterventions = childIncidents.filter(
      (i) => i.physicalInterventionUsed,
    ).length;

    const deescSuccessful = childIncidents.filter(
      (i) =>
        i.deescalationOutcome === "successful" ||
        i.deescalationOutcome === "partially_successful",
    ).length;
    const deescalationSuccessRate = rate(deescSuccessful, totalIncidents)!;

    const debriefed = childIncidents.filter(
      (i) => i.childDebrief,
    ).length;
    const debriefRate = rate(debriefed, totalIncidents)!;

    // Score 0-10
    let score = 0;

    // Fewer incidents is better (0-3)
    if (totalIncidents === 0) score += 3;
    else if (totalIncidents <= 1) score += 3;
    else if (totalIncidents <= 3) score += 2;
    else if (totalIncidents <= 5) score += 1;

    // Low physical intervention rate (0-2)
    const physRate = rate(physicalInterventions, totalIncidents)!;
    if (physRate === 0) score += 2;
    else if (physRate! <= 25) score += 1;

    // De-escalation success rate (0-3)
    score += Math.round((deescalationSuccessRate! / 100) * 3);

    // Debrief rate (0-2)
    score += Math.round((debriefRate! / 100) * 2);

    return {
      childId,
      childName: data.childName,
      totalIncidents,
      physicalInterventions,
      deescalationSuccessRate,
      debriefRate,
      overallScore: Math.min(10, Math.max(0, score)),
    };
  });
}

// -- Main Orchestrator ---------------------------------------------------------

export function generateTherapeuticCrisisInterventionIntelligence(
  incidents: CrisisIncident[],
  policy: CrisisPolicy | null,
  training: StaffCrisisTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): TherapeuticCrisisInterventionIntelligence {
  const deescalationEffectiveness = evaluateDeescalationEffectiveness(incidents);
  const postIncidentPractice = evaluatePostIncidentPractice(incidents);
  const crisisPolicy = evaluateCrisisPolicy(policy);
  const staffCrisisReadiness = evaluateStaffCrisisReadiness(training);

  const rawScore =
    deescalationEffectiveness.overallScore +
    postIncidentPractice.overallScore +
    crisisPolicy.overallScore +
    staffCrisisReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildCrisisProfiles(incidents);

  // -- Strengths --
  const strengths: string[] = [];
  if (incidents.length === 0) {
    strengths.push(
      "No crisis incidents recorded in period — excellent preventative practice",
    );
  }
  if (
    incidents.length > 0 &&
    deescalationEffectiveness.deescalationAttemptRate === 100
  ) {
    strengths.push(
      "De-escalation attempted in 100% of crisis incidents",
    );
  }
  if (
    incidents.length > 0 &&
    meets(deescalationEffectiveness.deescalationSuccessRate, 75)
  ) {
    strengths.push(
      "High de-escalation success rate — " +
        deescalationEffectiveness.deescalationSuccessRate +
        "% resolved without escalation",
    );
  }
  if (
    incidents.length > 0 &&
    deescalationEffectiveness.physicalInterventionRate === 0
  ) {
    strengths.push(
      "No physical interventions used — therapeutic approaches consistently applied",
    );
  }
  if (incidents.length > 0 && postIncidentPractice.childDebriefRate === 100) {
    strengths.push(
      "Child debrief completed after every incident",
    );
  }
  if (incidents.length > 0 && postIncidentPractice.staffDebriefRate === 100) {
    strengths.push(
      "Staff debrief completed after every incident",
    );
  }
  if (incidents.length > 0 && postIncidentPractice.timelyRecordingRate === 100) {
    strengths.push(
      "All incidents recorded in a timely manner",
    );
  }
  if (policy !== null && crisisPolicy.overallScore === 25) {
    strengths.push(
      "Comprehensive crisis policy in place covering all required areas",
    );
  }
  if (training.length > 0 && staffCrisisReadiness.deescalationRate === 100) {
    strengths.push(
      "All staff trained in de-escalation techniques",
    );
  }
  if (
    training.length > 0 &&
    staffCrisisReadiness.therapeuticApproachRate === 100
  ) {
    strengths.push(
      "All staff trained in therapeutic approaches",
    );
  }

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (
    incidents.length > 0 &&
    below(deescalationEffectiveness.deescalationAttemptRate, 100)
  ) {
    areasForImprovement.push(
      "De-escalation not attempted in " +
        (100 - deescalationEffectiveness.deescalationAttemptRate!) +
        "% of incidents — must be first response",
    );
  }
  if (
    incidents.length > 0 &&
    above(deescalationEffectiveness.physicalInterventionRate, 30)
  ) {
    areasForImprovement.push(
      "Physical intervention rate at " +
        deescalationEffectiveness.physicalInterventionRate +
        "% — review therapeutic alternatives",
    );
  }
  if (policy === null) {
    areasForImprovement.push(
      "No crisis intervention policy in place — statutory requirement",
    );
  }
  if (
    policy !== null &&
    !policy.therapeuticApproachDocumented
  ) {
    areasForImprovement.push(
      "Therapeutic approach not documented in crisis policy",
    );
  }
  if (
    policy !== null &&
    !policy.deescalationProtocol
  ) {
    areasForImprovement.push(
      "De-escalation protocol missing from crisis policy",
    );
  }
  if (incidents.length > 0 && below(postIncidentPractice.childDebriefRate, 80)) {
    areasForImprovement.push(
      "Child debrief rate at " +
        postIncidentPractice.childDebriefRate +
        "% — target 100%",
    );
  }
  if (incidents.length > 0 && below(postIncidentPractice.staffDebriefRate, 80)) {
    areasForImprovement.push(
      "Staff debrief rate at " +
        postIncidentPractice.staffDebriefRate +
        "% — target 100%",
    );
  }
  if (training.length === 0) {
    areasForImprovement.push(
      "No staff crisis training records — all staff must be trained",
    );
  }
  if (training.length > 0 && below(staffCrisisReadiness.deescalationRate, 100)) {
    areasForImprovement.push(
      "Only " +
        staffCrisisReadiness.deescalationRate +
        "% of staff trained in de-escalation — all staff require this training",
    );
  }
  if (
    training.length > 0 &&
    below(staffCrisisReadiness.therapeuticApproachRate, 75)
  ) {
    areasForImprovement.push(
      "Therapeutic approach training completed by only " +
        staffCrisisReadiness.therapeuticApproachRate +
        "% of staff",
    );
  }

  // -- Actions --
  const actions: string[] = [];
  const criticalIncidents = incidents.filter(
    (i) => i.severity === "critical",
  );
  const physicalIncidents = incidents.filter(
    (i) => i.physicalInterventionUsed,
  );
  const unjustifiedPhysical = physicalIncidents.filter(
    (i) => !i.physicalInterventionJustified,
  );
  const noChildDebrief = incidents.filter((i) => !i.childDebrief);

  if (criticalIncidents.length > 0) {
    actions.push(
      "URGENT: " +
        criticalIncidents.length +
        " critical-severity incident(s) recorded — immediate management review required",
    );
  }
  if (unjustifiedPhysical.length > 0) {
    actions.push(
      "URGENT: " +
        unjustifiedPhysical.length +
        " physical intervention(s) not justified — safeguarding review needed",
    );
  }
  if (noChildDebrief.length > 0) {
    actions.push(
      "URGENT: " +
        noChildDebrief.length +
        " incident(s) without child debrief — complete as per post-incident protocol",
    );
  }
  if (
    physicalIncidents.length > 0 &&
    above(deescalationEffectiveness.physicalInterventionRate, 50)
  ) {
    actions.push(
      "URGENT: Physical intervention used in " +
        deescalationEffectiveness.physicalInterventionRate +
        "% of incidents — review restraint reduction strategy",
    );
  }
  if (policy === null) {
    actions.push(
      "Create crisis intervention policy — statutory requirement under CHR 2015 Reg 19",
    );
  }
  if (
    policy !== null &&
    !policy.reviewSchedule
  ) {
    actions.push(
      "Establish regular review schedule for crisis intervention policy",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: Arrange crisis intervention training for all staff immediately",
    );
  }
  if (
    training.length > 0 &&
    below(staffCrisisReadiness.physicalInterventionRate, 100)
  ) {
    actions.push(
      "Ensure all staff are trained in physical intervention techniques — currently " +
        staffCrisisReadiness.physicalInterventionRate +
        "%",
    );
  }
  if (
    training.length > 0 &&
    below(staffCrisisReadiness.bodyMappingRate, 100)
  ) {
    actions.push(
      "Ensure all staff are trained in body mapping — currently " +
        staffCrisisReadiness.bodyMappingRate +
        "%",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 12 — The protection of children standard",
    "CHR 2015 Reg 19 — Behaviour management policies and records",
    "CHR 2015 Reg 20 — Restraint and deprivation of liberty",
    "SCCIF — Overall experiences and progress of children and young people",
    "Children Act 1989 — Welfare of the child",
    "Reducing the Need for Restraint and Restrictive Intervention (2019)",
    "NMS 12 — Promoting positive behaviour and relationships",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    deescalationEffectiveness,
    postIncidentPractice,
    crisisPolicy,
    staffCrisisReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
