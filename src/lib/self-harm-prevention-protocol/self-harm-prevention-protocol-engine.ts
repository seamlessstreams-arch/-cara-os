import { below, rate } from "@/lib/metrics/rate";
// ==============================================================================
// SELF-HARM PREVENTION PROTOCOL INTELLIGENCE ENGINE
//
// Pure deterministic engine for assessing how effectively a children's
// residential home prevents self-harm and supports children at risk. Covers
// risk assessment quality, safety planning, intervention response, and
// staff competence.
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — Health: ensuring physical and mental health needs met
//   - KCSIE 2024 — Keeping Children Safe in Education (mental health awareness)
//   - SCCIF — Overall experiences and progress of children
//   - NMS 3 — Health and wellbeing: promoting emotional and mental health
//   - NICE Self-Harm Guidelines — Clinical guidance on self-harm assessment/management
//   - UNCRC Article 6 — Right to life, survival and development
//   - UNCRC Article 19 — Protection from all forms of harm
//
// No AI. No external calls. Pure input → output.
// ==============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "very_high";

export type SelfHarmType =
  | "cutting"
  | "burning"
  | "overdose"
  | "head_banging"
  | "hair_pulling"
  | "poisoning"
  | "ligature"
  | "other";

export type InterventionOutcome =
  | "prevented"
  | "interrupted"
  | "required_medical"
  | "hospitalised";

export type SafetyPlanStatus = "current" | "overdue" | "not_in_place";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface ChildRiskProfile {
  id: string;
  childId: string;
  childName: string;
  riskLevel: RiskLevel;
  assessmentDate: string;
  assessedBy: string;
  reviewDate: string;
  reviewCurrent: boolean;
  safetyPlanStatus: SafetyPlanStatus;
  triggersIdentified: string[];
  copingStrategiesDocumented: string[];
  emergencyContactsRecorded: boolean;
  professionalSupportInPlace: boolean;
}

export interface SelfHarmIncident {
  id: string;
  childId: string;
  childName: string;
  date: string;
  selfHarmType: SelfHarmType;
  severity: RiskLevel;
  interventionOutcome: InterventionOutcome;
  staffResponded: string[];
  immediateActionTaken: boolean;
  medicalAssessmentCompleted: boolean;
  parentNotified: boolean;
  socialWorkerNotified: boolean;
  debriefCompleted: boolean;
  safetyPlanUpdated: boolean;
}

export interface EnvironmentalSafetyCheck {
  id: string;
  checkDate: string;
  checkedBy: string;
  ligaturePointsAssessed: boolean;
  sharpObjectsSecured: boolean;
  medicationSecured: boolean;
  bathroomProductsSecured: boolean;
  windowRestrictorsChecked: boolean;
  overallCompliant: boolean;
}

export interface StaffSelfHarmTraining {
  id: string;
  staffId: string;
  staffName: string;
  selfHarmAwareness: boolean;
  riskAssessmentTrained: boolean;
  safetyPlanningTrained: boolean;
  crisisInterventionTrained: boolean;
  postventionTrained: boolean;
  mentalHealthFirstAid: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface RiskAssessmentQualityResult {
  overallScore: number;
  totalProfiles: number;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reviewCurrentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  triggersIdentifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  professionalSupportRate: number | null;
}

export interface SafetyPlanningResult {
  overallScore: number;
  totalProfiles: number;
  /** null when the population is empty — nothing measured, not 0%. */
  safetyPlanInPlaceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  copingStrategiesRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  emergencyContactsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  environmentalComplianceRate: number | null;
  totalChecks: number;
}

export interface IncidentResponseResult {
  overallScore: number;
  totalIncidents: number;
  /** null when the population is empty — nothing measured, not 0%. */
  immediateActionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  medicalAssessmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  debriefCompletedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safetyPlanUpdatedRate: number | null;
}

export interface StaffCompetenceResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  selfHarmAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  crisisInterventionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safetyPlanningRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  mentalHealthFirstAidRate: number | null;
}

export interface ChildSelfHarmProfile {
  childId: string;
  childName: string;
  riskLevel: RiskLevel;
  safetyPlanStatus: SafetyPlanStatus;
  incidentsInPeriod: number;
  triggersIdentified: number;
  copingStrategies: number;
  overallScore: number;
}

export interface SelfHarmPreventionProtocolIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  riskAssessmentQuality: RiskAssessmentQualityResult;
  safetyPlanning: SafetyPlanningResult;
  incidentResponse: IncidentResponseResult;
  staffCompetence: StaffCompetenceResult;
  childProfiles: ChildSelfHarmProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ────────────────────────────────────────────────────────

const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

const SELF_HARM_TYPE_LABELS: Record<SelfHarmType, string> = {
  cutting: "Cutting",
  burning: "Burning",
  overdose: "Overdose",
  head_banging: "Head Banging",
  hair_pulling: "Hair Pulling",
  poisoning: "Poisoning",
  ligature: "Ligature",
  other: "Other",
};

const INTERVENTION_OUTCOME_LABELS: Record<InterventionOutcome, string> = {
  prevented: "Prevented",
  interrupted: "Interrupted",
  required_medical: "Required Medical",
  hospitalised: "Hospitalised",
};

const SAFETY_PLAN_STATUS_LABELS: Record<SafetyPlanStatus, string> = {
  current: "Current",
  overdue: "Overdue",
  not_in_place: "Not In Place",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRiskLevelLabel(v: RiskLevel): string { return RISK_LEVEL_LABELS[v]; }
export function getSelfHarmTypeLabel(v: SelfHarmType): string { return SELF_HARM_TYPE_LABELS[v]; }
export function getInterventionOutcomeLabel(v: InterventionOutcome): string { return INTERVENTION_OUTCOME_LABELS[v]; }
export function getSafetyPlanStatusLabel(v: SafetyPlanStatus): string { return SAFETY_PLAN_STATUS_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Evaluators ─────────────────────────────────────────────────────────────

/**
 * Evaluates risk assessment quality across child risk profiles.
 * Empty = 0 (no risk assessments = non-compliant).
 */
export function evaluateRiskAssessmentQuality(
  profiles: ChildRiskProfile[],
): RiskAssessmentQualityResult {
  if (profiles.length === 0) {
    return {
      overallScore: 0,
      totalProfiles: 0,
      riskAssessedRate: null,
      reviewCurrentRate: null,
      triggersIdentifiedRate: null,
      professionalSupportRate: null,
    };
  }

  // Risk assessed = every child has a profile (they all do if in the array),
  // but we check that assessedBy is populated and assessmentDate exists
  let riskAssessed = 0;
  let reviewCurrent = 0;
  let triggersIdentified = 0;
  let professionalSupport = 0;

  for (const p of profiles) {
    if (p.assessedBy && p.assessmentDate) riskAssessed++;
    if (p.reviewCurrent) reviewCurrent++;
    if (p.triggersIdentified.length > 0) triggersIdentified++;
    if (p.professionalSupportInPlace) professionalSupport++;
  }

  const riskAssessedRate = rate(riskAssessed, profiles.length);
  const reviewCurrentRate = rate(reviewCurrent, profiles.length);
  const triggersIdentifiedRate = rate(triggersIdentified, profiles.length);
  const professionalSupportRate = rate(professionalSupport, profiles.length);

  // Scoring: risk assessed per child (0-7), review current (0-6),
  // triggers identified (0-6), professional support (0-6)
  let score = 0;
  score += Math.round((riskAssessedRate! / 100) * 7);
  score += Math.round((reviewCurrentRate! / 100) * 6);
  score += Math.round((triggersIdentifiedRate! / 100) * 6);
  score += Math.round((professionalSupportRate! / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalProfiles: profiles.length,
    riskAssessedRate,
    reviewCurrentRate,
    triggersIdentifiedRate,
    professionalSupportRate,
  };
}

/**
 * Evaluates safety planning for children at risk.
 * Empty profiles = 0 (no safety plans = non-compliant).
 */
export function evaluateSafetyPlanning(
  profiles: ChildRiskProfile[],
  checks: EnvironmentalSafetyCheck[],
): SafetyPlanningResult {
  if (profiles.length === 0 && checks.length === 0) {
    return {
      overallScore: 0,
      totalProfiles: 0,
      safetyPlanInPlaceRate: null,
      copingStrategiesRate: null,
      emergencyContactsRate: null,
      environmentalComplianceRate: null,
      totalChecks: 0,
    };
  }

  let safetyPlanInPlace = 0;
  let copingStrategies = 0;
  let emergencyContacts = 0;

  for (const p of profiles) {
    if (p.safetyPlanStatus === "current") safetyPlanInPlace++;
    if (p.copingStrategiesDocumented.length > 0) copingStrategies++;
    if (p.emergencyContactsRecorded) emergencyContacts++;
  }

  let compliantChecks = 0;
  for (const c of checks) {
    if (c.overallCompliant) compliantChecks++;
  }

  const safetyPlanInPlaceRate = rate(safetyPlanInPlace, profiles.length);
  const copingStrategiesRate = rate(copingStrategies, profiles.length);
  const emergencyContactsRate = rate(emergencyContacts, profiles.length);
  const environmentalComplianceRate = rate(compliantChecks, checks.length);

  // Scoring: safety plan in place (0-7), coping strategies (0-6),
  // emergency contacts (0-6), environmental checks compliant (0-6)
  let score = 0;
  score += Math.round(((safetyPlanInPlaceRate ?? 0) / 100) * 7);
  score += Math.round(((copingStrategiesRate ?? 0) / 100) * 6);
  score += Math.round(((emergencyContactsRate ?? 0) / 100) * 6);
  score += Math.round(((environmentalComplianceRate ?? 0) / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalProfiles: profiles.length,
    safetyPlanInPlaceRate,
    copingStrategiesRate,
    emergencyContactsRate,
    environmentalComplianceRate,
    totalChecks: checks.length,
  };
}

/**
 * Evaluates incident response quality.
 * Empty (no incidents) = 25 (no incidents is excellent).
 */
export function evaluateIncidentResponse(
  incidents: SelfHarmIncident[],
): IncidentResponseResult {
  if (incidents.length === 0) {
    return {
      overallScore: 25,
      totalIncidents: 0,
      immediateActionRate: null,
      medicalAssessmentRate: null,
      debriefCompletedRate: null,
      safetyPlanUpdatedRate: null,
    };
  }

  let immediateAction = 0;
  let medicalAssessment = 0;
  let debriefCompleted = 0;
  let safetyPlanUpdated = 0;

  for (const inc of incidents) {
    if (inc.immediateActionTaken) immediateAction++;
    if (inc.medicalAssessmentCompleted) medicalAssessment++;
    if (inc.debriefCompleted) debriefCompleted++;
    if (inc.safetyPlanUpdated) safetyPlanUpdated++;
  }

  const immediateActionRate = rate(immediateAction, incidents.length);
  const medicalAssessmentRate = rate(medicalAssessment, incidents.length);
  const debriefCompletedRate = rate(debriefCompleted, incidents.length);
  const safetyPlanUpdatedRate = rate(safetyPlanUpdated, incidents.length);

  // Scoring: immediate action (0-7), medical assessment (0-7),
  // debrief completed (0-6), safety plan updated (0-5)
  let score = 0;
  score += Math.round((immediateActionRate! / 100) * 7);
  score += Math.round((medicalAssessmentRate! / 100) * 7);
  score += Math.round((debriefCompletedRate! / 100) * 6);
  score += Math.round((safetyPlanUpdatedRate! / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalIncidents: incidents.length,
    immediateActionRate,
    medicalAssessmentRate,
    debriefCompletedRate,
    safetyPlanUpdatedRate,
  };
}

/**
 * Evaluates staff competence in self-harm prevention.
 * Empty = 0 (no training records = non-compliant).
 */
export function evaluateStaffCompetence(
  training: StaffSelfHarmTraining[],
): StaffCompetenceResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      selfHarmAwarenessRate: null,
      riskAssessmentRate: null,
      crisisInterventionRate: null,
      safetyPlanningRate: null,
      mentalHealthFirstAidRate: null,
    };
  }

  let awareness = 0;
  let riskAssessment = 0;
  let crisisIntervention = 0;
  let safetyPlanning = 0;
  let mentalHealthFirstAid = 0;

  for (const t of training) {
    if (t.selfHarmAwareness) awareness++;
    if (t.riskAssessmentTrained) riskAssessment++;
    if (t.crisisInterventionTrained) crisisIntervention++;
    if (t.safetyPlanningTrained) safetyPlanning++;
    if (t.mentalHealthFirstAid) mentalHealthFirstAid++;
  }

  const selfHarmAwarenessRate = rate(awareness, training.length);
  const riskAssessmentRate = rate(riskAssessment, training.length);
  const crisisInterventionRate = rate(crisisIntervention, training.length);
  const safetyPlanningRate = rate(safetyPlanning, training.length);
  const mentalHealthFirstAidRate = rate(mentalHealthFirstAid, training.length);

  // Scoring: self-harm awareness (0-6), risk assessment (0-6),
  // crisis intervention (0-5), safety planning (0-4), mental health first aid (0-4)
  let score = 0;
  score += Math.round((selfHarmAwarenessRate! / 100) * 6);
  score += Math.round((riskAssessmentRate! / 100) * 6);
  score += Math.round((crisisInterventionRate! / 100) * 5);
  score += Math.round((safetyPlanningRate! / 100) * 4);
  score += Math.round(((mentalHealthFirstAidRate ?? 0) / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    selfHarmAwarenessRate,
    riskAssessmentRate,
    crisisInterventionRate,
    safetyPlanningRate,
    mentalHealthFirstAidRate,
  };
}

// ── Child Profiles ────────────────────────────────────────────────────────

export function buildChildSelfHarmProfiles(
  profiles: ChildRiskProfile[],
  incidents: SelfHarmIncident[],
): ChildSelfHarmProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const p of profiles) {
    childIds.add(p.childId);
    childNames.set(p.childId, p.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childProfile = profiles.find((p) => p.childId === childId)!;
    const childIncidents = incidents.filter((i) => i.childId === childId);

    // Score 0-10
    let score = 0;

    // Safety plan current (0-3)
    if (childProfile.safetyPlanStatus === "current") score += 3;
    else if (childProfile.safetyPlanStatus === "overdue") score += 1;

    // Review current (0-2)
    if (childProfile.reviewCurrent) score += 2;

    // Triggers identified (0-2)
    if (childProfile.triggersIdentified.length >= 3) score += 2;
    else if (childProfile.triggersIdentified.length > 0) score += 1;

    // Coping strategies documented (0-2)
    if (childProfile.copingStrategiesDocumented.length >= 3) score += 2;
    else if (childProfile.copingStrategiesDocumented.length > 0) score += 1;

    // No incidents or all incidents well-managed (0-1)
    if (childIncidents.length === 0) {
      score += 1;
    } else {
      const allDebriefed = childIncidents.every((i) => i.debriefCompleted);
      const allPlanUpdated = childIncidents.every((i) => i.safetyPlanUpdated);
      if (allDebriefed && allPlanUpdated) score += 1;
    }

    return {
      childId,
      childName: childNames.get(childId) || "Unknown",
      riskLevel: childProfile.riskLevel,
      safetyPlanStatus: childProfile.safetyPlanStatus,
      incidentsInPeriod: childIncidents.length,
      triggersIdentified: childProfile.triggersIdentified.length,
      copingStrategies: childProfile.copingStrategiesDocumented.length,
      overallScore: Math.min(10, score),
    };
  });
}

// ── Main Function ──────────────────────────────────────────────────────────

export function generateSelfHarmPreventionProtocolIntelligence(
  profiles: ChildRiskProfile[],
  incidents: SelfHarmIncident[],
  checks: EnvironmentalSafetyCheck[],
  training: StaffSelfHarmTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SelfHarmPreventionProtocolIntelligence {
  const riskAssessmentQuality = evaluateRiskAssessmentQuality(profiles);
  const safetyPlanning = evaluateSafetyPlanning(profiles, checks);
  const incidentResponse = evaluateIncidentResponse(incidents);
  const staffCompetence = evaluateStaffCompetence(training);

  const rawScore =
    riskAssessmentQuality.overallScore +
    safetyPlanning.overallScore +
    incidentResponse.overallScore +
    staffCompetence.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildSelfHarmProfiles(profiles, incidents);

  // ── Strengths ──
  const strengths: string[] = [];
  if (profiles.length > 0 && riskAssessmentQuality.riskAssessedRate === 100)
    strengths.push("Risk assessments completed for all children");
  if (profiles.length > 0 && riskAssessmentQuality.reviewCurrentRate === 100)
    strengths.push("All risk assessment reviews are current");
  if (profiles.length > 0 && riskAssessmentQuality.triggersIdentifiedRate === 100)
    strengths.push("Triggers identified for all children with risk profiles");
  if (profiles.length > 0 && safetyPlanning.safetyPlanInPlaceRate === 100)
    strengths.push("Safety plans in place and current for all children");
  if (profiles.length > 0 && safetyPlanning.emergencyContactsRate === 100)
    strengths.push("Emergency contacts recorded for all children");
  if (incidents.length === 0)
    strengths.push("No self-harm incidents recorded in period");
  if (incidents.length > 0 && incidentResponse.immediateActionRate === 100)
    strengths.push("Immediate action taken in all incidents");
  if (incidents.length > 0 && incidentResponse.debriefCompletedRate === 100)
    strengths.push("Debrief completed after every incident");
  if (incidents.length > 0 && incidentResponse.safetyPlanUpdatedRate === 100)
    strengths.push("Safety plans updated after every incident");
  if (checks.length > 0 && safetyPlanning.environmentalComplianceRate === 100)
    strengths.push("All environmental safety checks fully compliant");
  if (training.length > 0 && staffCompetence.selfHarmAwarenessRate === 100)
    strengths.push("All staff trained in self-harm awareness");
  if (training.length > 0 && staffCompetence.crisisInterventionRate === 100)
    strengths.push("All staff trained in crisis intervention");
  if (training.length > 0 && staffCompetence.mentalHealthFirstAidRate === 100)
    strengths.push("All staff hold mental health first aid qualification");

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (profiles.length === 0)
    areasForImprovement.push("No child risk profiles documented — all children should have risk assessments");
  if (profiles.length > 0 && below(riskAssessmentQuality.reviewCurrentRate, 100))
    areasForImprovement.push(100 - riskAssessmentQuality.reviewCurrentRate! + "% of risk assessment reviews are not current");
  if (profiles.length > 0 && below(riskAssessmentQuality.triggersIdentifiedRate, 100))
    areasForImprovement.push("Triggers not identified for " + (100 - riskAssessmentQuality.triggersIdentifiedRate!) + "% of children");
  if (profiles.length > 0 && below(safetyPlanning.safetyPlanInPlaceRate, 100))
    areasForImprovement.push("Safety plans not current for " + (100 - safetyPlanning.safetyPlanInPlaceRate!) + "% of children");
  if (profiles.length > 0 && below(safetyPlanning.copingStrategiesRate, 100))
    areasForImprovement.push("Coping strategies not documented for " + (100 - safetyPlanning.copingStrategiesRate!) + "% of children");
  if (incidents.length > 0 && below(incidentResponse.debriefCompletedRate, 100))
    areasForImprovement.push("Debrief not completed after " + (100 - incidentResponse.debriefCompletedRate!) + "% of incidents");
  if (incidents.length > 0 && below(incidentResponse.safetyPlanUpdatedRate, 100))
    areasForImprovement.push("Safety plan not updated after " + (100 - incidentResponse.safetyPlanUpdatedRate!) + "% of incidents");
  if (checks.length === 0)
    areasForImprovement.push("No environmental safety checks recorded — regular checks are required");
  if (checks.length > 0 && below(safetyPlanning.environmentalComplianceRate, 100))
    areasForImprovement.push(100 - safetyPlanning.environmentalComplianceRate! + "% of environmental safety checks non-compliant");
  if (training.length === 0)
    areasForImprovement.push("No staff training records for self-harm prevention");
  if (training.length > 0 && below(staffCompetence.selfHarmAwarenessRate, 100))
    areasForImprovement.push("Self-harm awareness training incomplete — only " + staffCompetence.selfHarmAwarenessRate + "% of staff trained");
  if (training.length > 0 && below(staffCompetence.mentalHealthFirstAidRate, 100))
    areasForImprovement.push("Mental health first aid qualification held by only " + staffCompetence.mentalHealthFirstAidRate + "% of staff");

  // ── Actions ──
  const actions: string[] = [];
  const noSafetyPlan = profiles.filter((p) => p.safetyPlanStatus === "not_in_place");
  if (noSafetyPlan.length > 0)
    actions.push("URGENT: " + noSafetyPlan.length + " child(ren) have no safety plan in place — create immediately");
  const overduePlans = profiles.filter((p) => p.safetyPlanStatus === "overdue");
  if (overduePlans.length > 0)
    actions.push("URGENT: " + overduePlans.length + " safety plan(s) overdue for review — schedule review immediately");
  const highRiskNoSupport = profiles.filter((p) => (p.riskLevel === "high" || p.riskLevel === "very_high") && !p.professionalSupportInPlace);
  if (highRiskNoSupport.length > 0)
    actions.push("URGENT: " + highRiskNoSupport.length + " high/very-high risk child(ren) without professional support — refer immediately");
  const hospitalised = incidents.filter((i) => i.interventionOutcome === "hospitalised");
  if (hospitalised.length > 0)
    actions.push("URGENT: " + hospitalised.length + " incident(s) resulted in hospitalisation — conduct serious incident review");
  const notDebriefed = incidents.filter((i) => !i.debriefCompleted);
  if (notDebriefed.length > 0)
    actions.push("Complete debrief for " + notDebriefed.length + " outstanding incident(s)");
  if (profiles.length === 0)
    actions.push("Complete risk assessments for all children — statutory requirement");
  if (profiles.length > 0 && below(riskAssessmentQuality.reviewCurrentRate, 100))
    actions.push("Bring all risk assessment reviews up to date");
  if (checks.length === 0)
    actions.push("Implement regular environmental safety checks");
  if (training.length === 0)
    actions.push("Arrange self-harm prevention training for all staff");
  if (training.length > 0 && below(staffCompetence.crisisInterventionRate, 75))
    actions.push("Arrange crisis intervention training — only " + staffCompetence.crisisInterventionRate + "% of staff trained");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 12 — Health: ensuring children's physical and mental health needs are met",
    "KCSIE 2024 — Mental health awareness and duty to safeguard children",
    "SCCIF — Overall experiences and progress: safety and wellbeing of children",
    "NMS 3 — Health and wellbeing: promoting emotional and mental health",
    "NICE Self-Harm Guidelines — Assessment, management and preventing recurrence",
    "UNCRC Article 6 — Right to life, survival and development",
    "UNCRC Article 19 — Protection from all forms of violence, injury or abuse",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    riskAssessmentQuality,
    safetyPlanning,
    incidentResponse,
    staffCompetence,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
