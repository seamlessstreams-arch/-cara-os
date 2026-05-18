// ==============================================================================
// Cornerstone -- Night Care Intelligence Engine
//
// Pure deterministic engine -- no AI, no external calls.
// Evaluates overnight care quality including:
//   - Monitoring checks (visual, listening, welfare, medication, security)
//   - Incident management during night hours
//   - Staffing adequacy and handover quality
//   - Sleep environment suitability
//
// Regulatory framework:
//   CHR 2015 Reg 34 -- employment of staff (night cover)
//   NMS 26 -- night care
//   SCCIF -- quality of care, experiences & progress
//   NICE Sleep Guidance -- evidence-based sleep support
// ==============================================================================

// -- Types -------------------------------------------------------------------

export type CheckType =
  | "visual_check"
  | "listening_check"
  | "welfare_check"
  | "medication_check"
  | "security_check";

export type CheckOutcome =
  | "child_sleeping"
  | "child_awake_settled"
  | "child_awake_unsettled"
  | "child_absent"
  | "concern_identified"
  | "intervention_required";

export type SleepQuality =
  | "good"
  | "fair"
  | "poor"
  | "disturbed"
  | "not_assessed";

export type NightIncidentType =
  | "sleep_disturbance"
  | "night_terror"
  | "self_harm_attempt"
  | "missing"
  | "medical_emergency"
  | "behavioural_incident"
  | "fire_alarm"
  | "intruder_alert";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export type StaffingLevel =
  | "adequate"
  | "minimum"
  | "below_minimum"
  | "lone_working";

export type HandoverQuality = "thorough" | "adequate" | "brief" | "missed";

export type NoiseLevel = "quiet" | "acceptable" | "noisy";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// -- Interfaces --------------------------------------------------------------

export interface NightCheck {
  id: string;
  childId: string;
  childName: string;
  date: string;
  time: string;
  checkType: CheckType;
  outcome: CheckOutcome;
  staffId: string;
  notes: string;
  doorOpenCheck: boolean;
  temperatureChecked: boolean;
}

export interface NightIncident {
  id: string;
  childId: string;
  date: string;
  time: string;
  incidentType: NightIncidentType;
  severity: IncidentSeverity;
  managedEffectively: boolean;
  supportProvided: boolean;
  managerNotified: boolean;
  recordedTimely: boolean;
  deEscalationUsed: boolean;
}

export interface NightStaffing {
  id: string;
  date: string;
  plannedStaff: number;
  actualStaff: number;
  staffingLevel: StaffingLevel;
  wakingNightStaff: number;
  sleepingInStaff: number;
  agencyStaffUsed: boolean;
  handoverCompleted: boolean;
  handoverQuality: HandoverQuality;
}

export interface SleepEnvironment {
  id: string;
  childId: string;
  roomTemperatureAppropriate: boolean;
  beddingClean: boolean;
  noiseLevel: NoiseLevel;
  lightingAppropriate: boolean;
  personalBelongingsAccessible: boolean;
  safetyChecked: boolean;
}

// -- Result Types ------------------------------------------------------------

export interface MonitoringQualityResult {
  totalChecks: number;
  averageChecksPerChild: number;
  welfareChecksIncluded: boolean;
  doorOpenCheckRate: number;
  temperatureCheckRate: number;
  concernFollowUpRate: number;
  documentationQuality: number;
  overallScore: number; // 0-25
}

export interface IncidentManagementResult {
  totalIncidents: number;
  managedEffectivelyRate: number;
  supportProvidedRate: number;
  managerNotifiedRate: number;
  recordedTimelyRate: number;
  deEscalationUsedRate: number;
  criticalIncidents: number;
  overallScore: number; // 0-25
}

export interface StaffingAdequacyResult {
  totalNights: number;
  adequateStaffingRate: number;
  loneWorkingNights: number;
  handoverCompletedRate: number;
  handoverQualityRate: number;
  agencyOnlyNights: number;
  overallScore: number; // 0-25
}

export interface SleepEnvironmentResult {
  totalAssessments: number;
  temperatureAppropriateRate: number;
  beddingCleanRate: number;
  noiseAcceptableRate: number;
  lightingAppropriateRate: number;
  safetyCheckedRate: number;
  personalBelongingsRate: number;
  overallScore: number; // 0-25
}

export interface NightCareIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  monitoringQuality: MonitoringQualityResult;
  incidentManagement: IncidentManagementResult;
  staffingAdequacy: StaffingAdequacyResult;
  sleepEnvironment: SleepEnvironmentResult;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -----------------------------------------------------------------

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

// -- Label Functions ---------------------------------------------------------

export function getCheckTypeLabel(t: CheckType): string {
  const labels: Record<CheckType, string> = {
    visual_check: "Visual Check",
    listening_check: "Listening Check",
    welfare_check: "Welfare Check",
    medication_check: "Medication Check",
    security_check: "Security Check",
  };
  return labels[t] || t;
}

export function getCheckOutcomeLabel(o: CheckOutcome): string {
  const labels: Record<CheckOutcome, string> = {
    child_sleeping: "Child Sleeping",
    child_awake_settled: "Child Awake (Settled)",
    child_awake_unsettled: "Child Awake (Unsettled)",
    child_absent: "Child Absent",
    concern_identified: "Concern Identified",
    intervention_required: "Intervention Required",
  };
  return labels[o] || o;
}

export function getSleepQualityLabel(q: SleepQuality): string {
  const labels: Record<SleepQuality, string> = {
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    disturbed: "Disturbed",
    not_assessed: "Not Assessed",
  };
  return labels[q] || q;
}

export function getNightIncidentTypeLabel(t: NightIncidentType): string {
  const labels: Record<NightIncidentType, string> = {
    sleep_disturbance: "Sleep Disturbance",
    night_terror: "Night Terror",
    self_harm_attempt: "Self-Harm Attempt",
    missing: "Missing",
    medical_emergency: "Medical Emergency",
    behavioural_incident: "Behavioural Incident",
    fire_alarm: "Fire Alarm",
    intruder_alert: "Intruder Alert",
  };
  return labels[t] || t;
}

export function getStaffingLevelLabel(l: StaffingLevel): string {
  const labels: Record<StaffingLevel, string> = {
    adequate: "Adequate",
    minimum: "Minimum",
    below_minimum: "Below Minimum",
    lone_working: "Lone Working",
  };
  return labels[l] || l;
}

export function getHandoverQualityLabel(q: HandoverQuality): string {
  const labels: Record<HandoverQuality, string> = {
    thorough: "Thorough",
    adequate: "Adequate",
    brief: "Brief",
    missed: "Missed",
  };
  return labels[q] || q;
}

// -- Core Evaluation Functions -----------------------------------------------

/**
 * Evaluate monitoring quality -- are night checks frequent, thorough, and
 * well-documented? Includes welfare checks, door/temperature checks, and
 * concern follow-up.
 * Score: 0-25
 */
export function evaluateMonitoringQuality(
  checks: NightCheck[],
  totalChildren: number,
): MonitoringQualityResult {
  if (checks.length === 0) {
    return {
      totalChecks: 0,
      averageChecksPerChild: 0,
      welfareChecksIncluded: false,
      doorOpenCheckRate: 0,
      temperatureCheckRate: 0,
      concernFollowUpRate: 0,
      documentationQuality: 0,
      overallScore: 0, // No checks is bad
    };
  }

  // Group checks by child to calculate average per child per night
  const childNights = new Map<string, Set<string>>();
  for (const check of checks) {
    const key = check.childId;
    if (!childNights.has(key)) childNights.set(key, new Set());
    childNights.get(key)!.add(check.date);
  }

  // Calculate average checks per child per night
  let totalChecksPerChildPerNight = 0;
  let childNightCount = 0;
  for (const [childId, dates] of childNights) {
    for (const date of dates) {
      const checksForChildNight = checks.filter(
        (c) => c.childId === childId && c.date === date,
      ).length;
      totalChecksPerChildPerNight += checksForChildNight;
      childNightCount++;
    }
  }
  const avgChecksPerChild =
    childNightCount > 0
      ? Math.round((totalChecksPerChildPerNight / childNightCount) * 10) / 10
      : 0;

  // Welfare checks included
  const welfareChecks = checks.filter((c) => c.checkType === "welfare_check");
  const welfareChecksIncluded = welfareChecks.length > 0;

  // Door open check rate
  const doorOpenCount = checks.filter((c) => c.doorOpenCheck).length;
  const doorOpenCheckRate = pct(doorOpenCount, checks.length);

  // Temperature check rate
  const tempCount = checks.filter((c) => c.temperatureChecked).length;
  const temperatureCheckRate = pct(tempCount, checks.length);

  // Concern follow-up: checks that identified a concern or required intervention
  const concernChecks = checks.filter(
    (c) =>
      c.outcome === "concern_identified" ||
      c.outcome === "intervention_required",
  );
  // For concern follow-up, we check if there is a subsequent check for the same child on the same night
  let followedUp = 0;
  for (const concern of concernChecks) {
    const subsequentCheck = checks.find(
      (c) =>
        c.childId === concern.childId &&
        c.date === concern.date &&
        c.time > concern.time &&
        c.id !== concern.id,
    );
    if (subsequentCheck) followedUp++;
  }
  const concernFollowUpRate = pct(followedUp, concernChecks.length);

  // Documentation quality: checks with non-empty notes
  const documentedChecks = checks.filter(
    (c) => c.notes && c.notes.trim().length > 0,
  );
  const documentationQuality = pct(documentedChecks.length, checks.length);

  // Scoring -- 25 points max
  let score = 0;

  // Check frequency: +8 if avg >= 4 per child per night
  if (avgChecksPerChild >= 4) score += 8;
  else if (avgChecksPerChild >= 3) score += 6;
  else if (avgChecksPerChild >= 2) score += 4;
  else if (avgChecksPerChild >= 1) score += 2;

  // Welfare checks included: +5
  if (welfareChecksIncluded) score += 5;

  // Door/temperature checks rate: +4 (combined)
  const combinedDoorTempRate = (doorOpenCheckRate + temperatureCheckRate) / 2;
  score += (combinedDoorTempRate / 100) * 4;

  // Concern follow-up rate: +4
  if (concernChecks.length === 0) {
    score += 4; // No concerns = full marks for follow-up
  } else {
    score += (concernFollowUpRate / 100) * 4;
  }

  // Documentation quality: +4
  score += (documentationQuality / 100) * 4;

  return {
    totalChecks: checks.length,
    averageChecksPerChild: avgChecksPerChild,
    welfareChecksIncluded,
    doorOpenCheckRate,
    temperatureCheckRate,
    concernFollowUpRate,
    documentationQuality,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate incident management -- were night incidents handled effectively,
 * with appropriate support, notification, and recording?
 * Score: 0-25
 */
export function evaluateIncidentManagement(
  incidents: NightIncident[],
): IncidentManagementResult {
  if (incidents.length === 0) {
    return {
      totalIncidents: 0,
      managedEffectivelyRate: 0,
      supportProvidedRate: 0,
      managerNotifiedRate: 0,
      recordedTimelyRate: 0,
      deEscalationUsedRate: 0,
      criticalIncidents: 0,
      overallScore: 25, // No incidents = full marks (20 base + 5 bonus)
    };
  }

  const managedCount = incidents.filter((i) => i.managedEffectively).length;
  const managedRate = pct(managedCount, incidents.length);

  const supportCount = incidents.filter((i) => i.supportProvided).length;
  const supportRate = pct(supportCount, incidents.length);

  const managerCount = incidents.filter((i) => i.managerNotified).length;
  const managerRate = pct(managerCount, incidents.length);

  const recordedCount = incidents.filter((i) => i.recordedTimely).length;
  const recordedRate = pct(recordedCount, incidents.length);

  const deEscCount = incidents.filter((i) => i.deEscalationUsed).length;
  const deEscRate = pct(deEscCount, incidents.length);

  const criticalCount = incidents.filter(
    (i) => i.severity === "critical",
  ).length;

  // Scoring -- 25 points max
  let score = 0;

  // Managed effectively >= 90%: +7
  if (managedRate >= 90) score += 7;
  else score += (managedRate / 100) * 7;

  // Support provided: +5
  score += (supportRate / 100) * 5;

  // Manager notified: +4
  score += (managerRate / 100) * 4;

  // Recorded timely >= 90%: +4
  if (recordedRate >= 90) score += 4;
  else score += (recordedRate / 100) * 4;

  // De-escalation used: +3
  score += (deEscRate / 100) * 3;

  // No critical incidents: +2
  if (criticalCount === 0) score += 2;

  return {
    totalIncidents: incidents.length,
    managedEffectivelyRate: managedRate,
    supportProvidedRate: supportRate,
    managerNotifiedRate: managerRate,
    recordedTimelyRate: recordedRate,
    deEscalationUsedRate: deEscRate,
    criticalIncidents: criticalCount,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate staffing adequacy -- are night shifts properly staffed, with
 * thorough handovers and no lone working?
 * Score: 0-25
 */
export function evaluateStaffingAdequacy(
  staffing: NightStaffing[],
): StaffingAdequacyResult {
  if (staffing.length === 0) {
    return {
      totalNights: 0,
      adequateStaffingRate: 0,
      loneWorkingNights: 0,
      handoverCompletedRate: 0,
      handoverQualityRate: 0,
      agencyOnlyNights: 0,
      overallScore: 0, // No staffing data = cannot assess
    };
  }

  const adequateCount = staffing.filter(
    (s) => s.staffingLevel === "adequate",
  ).length;
  const adequateRate = pct(adequateCount, staffing.length);

  const loneWorkingCount = staffing.filter(
    (s) => s.staffingLevel === "lone_working",
  ).length;

  const handoverCompleted = staffing.filter(
    (s) => s.handoverCompleted,
  ).length;
  const handoverCompletedRate = pct(handoverCompleted, staffing.length);

  // Handover quality: thorough or adequate counts as good
  const goodHandoverCount = staffing.filter(
    (s) =>
      s.handoverQuality === "thorough" || s.handoverQuality === "adequate",
  ).length;
  const handoverQualityRate = pct(goodHandoverCount, staffing.length);

  // Agency-only nights: nights where agency was used AND actual staff is only agency
  // (simplified: count nights where agencyStaffUsed AND actualStaff == 0 is unlikely,
  // so we count nights where agencyStaffUsed && wakingNightStaff + sleepingInStaff === 0
  // but more practically, any night where agency is the sole staffing type)
  const agencyOnlyNights = staffing.filter(
    (s) =>
      s.agencyStaffUsed &&
      s.wakingNightStaff === 0 &&
      s.sleepingInStaff === 0,
  ).length;

  // Scoring -- 25 points max
  let score = 0;

  // Adequate staffing >= 90%: +8
  if (adequateRate >= 90) score += 8;
  else score += (adequateRate / 100) * 8;

  // No lone working: +5
  if (loneWorkingCount === 0) score += 5;
  else {
    const loneWorkingRate = pct(loneWorkingCount, staffing.length);
    score += ((100 - loneWorkingRate) / 100) * 5;
  }

  // Handover completed >= 95%: +4
  if (handoverCompletedRate >= 95) score += 4;
  else score += (handoverCompletedRate / 100) * 4;

  // Handover quality (thorough/adequate): +4
  score += (handoverQualityRate / 100) * 4;

  // No agency-only nights: +4
  if (agencyOnlyNights === 0) score += 4;
  else {
    const agencyOnlyRate = pct(agencyOnlyNights, staffing.length);
    score += ((100 - agencyOnlyRate) / 100) * 4;
  }

  return {
    totalNights: staffing.length,
    adequateStaffingRate: adequateRate,
    loneWorkingNights: loneWorkingCount,
    handoverCompletedRate: handoverCompletedRate,
    handoverQualityRate: handoverQualityRate,
    agencyOnlyNights,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate sleep environment -- are bedrooms safe, comfortable, and
 * conducive to good sleep?
 * Score: 0-25
 */
export function evaluateSleepEnvironment(
  environments: SleepEnvironment[],
): SleepEnvironmentResult {
  if (environments.length === 0) {
    return {
      totalAssessments: 0,
      temperatureAppropriateRate: 0,
      beddingCleanRate: 0,
      noiseAcceptableRate: 0,
      lightingAppropriateRate: 0,
      safetyCheckedRate: 0,
      personalBelongingsRate: 0,
      overallScore: 0, // No assessments = cannot assess
    };
  }

  const tempOk = environments.filter(
    (e) => e.roomTemperatureAppropriate,
  ).length;
  const tempRate = pct(tempOk, environments.length);

  const beddingOk = environments.filter((e) => e.beddingClean).length;
  const beddingRate = pct(beddingOk, environments.length);

  const noiseOk = environments.filter(
    (e) => e.noiseLevel === "quiet" || e.noiseLevel === "acceptable",
  ).length;
  const noiseRate = pct(noiseOk, environments.length);

  const lightingOk = environments.filter(
    (e) => e.lightingAppropriate,
  ).length;
  const lightingRate = pct(lightingOk, environments.length);

  const safetyOk = environments.filter((e) => e.safetyChecked).length;
  const safetyRate = pct(safetyOk, environments.length);

  const belongingsOk = environments.filter(
    (e) => e.personalBelongingsAccessible,
  ).length;
  const belongingsRate = pct(belongingsOk, environments.length);

  // Scoring -- 25 points max
  let score = 0;

  // Temperature appropriate: +6
  score += (tempRate / 100) * 6;

  // Bedding clean: +5
  score += (beddingRate / 100) * 5;

  // Noise acceptable: +4
  score += (noiseRate / 100) * 4;

  // Lighting appropriate: +4
  score += (lightingRate / 100) * 4;

  // Safety checked: +3
  score += (safetyRate / 100) * 3;

  // Personal belongings accessible: +3
  score += (belongingsRate / 100) * 3;

  return {
    totalAssessments: environments.length,
    temperatureAppropriateRate: tempRate,
    beddingCleanRate: beddingRate,
    noiseAcceptableRate: noiseRate,
    lightingAppropriateRate: lightingRate,
    safetyCheckedRate: safetyRate,
    personalBelongingsRate: belongingsRate,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

// -- Main Intelligence Function ----------------------------------------------

export function generateNightCareIntelligence(
  checks: NightCheck[],
  incidents: NightIncident[],
  staffing: NightStaffing[],
  environments: SleepEnvironment[],
  totalChildren: number,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): NightCareIntelligence {
  const monitoringQuality = evaluateMonitoringQuality(checks, totalChildren);
  const incidentManagement = evaluateIncidentManagement(incidents);
  const staffingAdequacy = evaluateStaffingAdequacy(staffing);
  const sleepEnvironment = evaluateSleepEnvironment(environments);

  const rawScore =
    monitoringQuality.overallScore +
    incidentManagement.overallScore +
    staffingAdequacy.overallScore +
    sleepEnvironment.overallScore;

  const overallScore = Math.round(clamp(rawScore, 0, 100) * 10) / 10;
  const rating = ratingFromScore(overallScore);

  // -- Strengths --
  const strengths: string[] = [];

  if (monitoringQuality.averageChecksPerChild >= 4) {
    strengths.push(
      "Night monitoring checks are frequent, exceeding the recommended minimum of 4 per child per night",
    );
  }
  if (monitoringQuality.welfareChecksIncluded) {
    strengths.push(
      "Welfare checks are routinely included in the night monitoring regime",
    );
  }
  if (monitoringQuality.documentationQuality >= 90) {
    strengths.push(
      "Night check documentation is thorough, with detailed notes for each observation",
    );
  }
  if (monitoringQuality.doorOpenCheckRate >= 90) {
    strengths.push(
      "Door-open checks are consistently performed, respecting children's privacy while ensuring safety",
    );
  }
  if (incidentManagement.totalIncidents === 0) {
    strengths.push(
      "No night-time incidents recorded during the period, indicating a calm and well-managed environment",
    );
  } else {
    if (incidentManagement.managedEffectivelyRate >= 90) {
      strengths.push(
        "Night incidents are consistently managed effectively by staff",
      );
    }
    if (incidentManagement.deEscalationUsedRate >= 90) {
      strengths.push(
        "De-escalation techniques are routinely used during night-time incidents",
      );
    }
  }
  if (
    staffingAdequacy.totalNights > 0 &&
    staffingAdequacy.adequateStaffingRate >= 90
  ) {
    strengths.push(
      "Night staffing levels are consistently adequate, meeting regulatory requirements",
    );
  }
  if (
    staffingAdequacy.totalNights > 0 &&
    staffingAdequacy.loneWorkingNights === 0
  ) {
    strengths.push(
      "No lone working during night shifts, ensuring staff safety and support",
    );
  }
  if (
    staffingAdequacy.totalNights > 0 &&
    staffingAdequacy.handoverCompletedRate >= 95
  ) {
    strengths.push(
      "Night-to-day handovers are consistently completed, ensuring continuity of care",
    );
  }
  if (
    sleepEnvironment.totalAssessments > 0 &&
    sleepEnvironment.temperatureAppropriateRate >= 90
  ) {
    strengths.push(
      "Bedroom temperatures are consistently appropriate for restful sleep",
    );
  }
  if (
    sleepEnvironment.totalAssessments > 0 &&
    sleepEnvironment.beddingCleanRate >= 95
  ) {
    strengths.push(
      "Bedding is maintained to a high standard of cleanliness and comfort",
    );
  }

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];

  if (
    monitoringQuality.totalChecks > 0 &&
    monitoringQuality.averageChecksPerChild < 3
  ) {
    areasForImprovement.push(
      "Night check frequency is below recommended levels -- aim for at least 4 checks per child per night",
    );
  }
  if (monitoringQuality.totalChecks === 0) {
    areasForImprovement.push(
      "No night monitoring checks were recorded during the period",
    );
  }
  if (
    monitoringQuality.totalChecks > 0 &&
    !monitoringQuality.welfareChecksIncluded
  ) {
    areasForImprovement.push(
      "Welfare checks are not included in the night monitoring regime",
    );
  }
  if (
    monitoringQuality.totalChecks > 0 &&
    monitoringQuality.documentationQuality < 70
  ) {
    areasForImprovement.push(
      "Night check documentation needs improvement -- staff should record meaningful observations",
    );
  }
  if (
    incidentManagement.totalIncidents > 0 &&
    incidentManagement.managedEffectivelyRate < 80
  ) {
    areasForImprovement.push(
      "Night incident management effectiveness is below acceptable threshold",
    );
  }
  if (
    incidentManagement.totalIncidents > 0 &&
    incidentManagement.recordedTimelyRate < 80
  ) {
    areasForImprovement.push(
      "Night incidents are not consistently recorded in a timely manner",
    );
  }
  if (incidentManagement.criticalIncidents > 0) {
    areasForImprovement.push(
      `${incidentManagement.criticalIncidents} critical incident(s) occurred during night hours -- review prevention strategies`,
    );
  }
  if (
    staffingAdequacy.totalNights > 0 &&
    staffingAdequacy.adequateStaffingRate < 80
  ) {
    areasForImprovement.push(
      "Night staffing levels are frequently below adequate levels",
    );
  }
  if (staffingAdequacy.loneWorkingNights > 0) {
    areasForImprovement.push(
      `Lone working occurred on ${staffingAdequacy.loneWorkingNights} night(s) -- this presents a risk to staff and children`,
    );
  }
  if (
    staffingAdequacy.totalNights > 0 &&
    staffingAdequacy.handoverCompletedRate < 90
  ) {
    areasForImprovement.push(
      "Night-to-day handovers are not consistently completed",
    );
  }
  if (staffingAdequacy.agencyOnlyNights > 0) {
    areasForImprovement.push(
      `Agency-only staffing occurred on ${staffingAdequacy.agencyOnlyNights} night(s) -- children deserve familiar care staff`,
    );
  }
  if (
    sleepEnvironment.totalAssessments > 0 &&
    sleepEnvironment.temperatureAppropriateRate < 80
  ) {
    areasForImprovement.push(
      "Room temperatures are not consistently appropriate for sleep",
    );
  }
  if (
    sleepEnvironment.totalAssessments > 0 &&
    sleepEnvironment.noiseAcceptableRate < 80
  ) {
    areasForImprovement.push(
      "Noise levels are frequently above acceptable levels for restful sleep",
    );
  }

  // -- Actions --
  const actions: string[] = [];

  if (monitoringQuality.totalChecks === 0) {
    actions.push(
      "URGENT: Implement a structured night monitoring check regime immediately",
    );
  }
  if (incidentManagement.criticalIncidents > 0) {
    actions.push(
      "URGENT: Review all critical night-time incidents and implement prevention strategies",
    );
  }
  if (staffingAdequacy.loneWorkingNights > 0) {
    actions.push(
      "URGENT: Eliminate lone working during night shifts -- review staffing rota and contingency plans",
    );
  }
  if (
    staffingAdequacy.totalNights > 0 &&
    staffingAdequacy.adequateStaffingRate < 80
  ) {
    actions.push(
      "HIGH: Review night staffing levels and recruitment to ensure adequate cover",
    );
  }
  if (
    monitoringQuality.totalChecks > 0 &&
    monitoringQuality.averageChecksPerChild < 3
  ) {
    actions.push(
      "HIGH: Increase night check frequency to meet the minimum of 4 checks per child per night",
    );
  }
  if (
    incidentManagement.totalIncidents > 0 &&
    incidentManagement.recordedTimelyRate < 80
  ) {
    actions.push(
      "HIGH: Provide training on timely recording of night incidents",
    );
  }
  if (
    staffingAdequacy.totalNights > 0 &&
    staffingAdequacy.handoverCompletedRate < 90
  ) {
    actions.push(
      "MEDIUM: Implement a structured handover checklist for night-to-day transitions",
    );
  }
  if (
    monitoringQuality.totalChecks > 0 &&
    monitoringQuality.documentationQuality < 70
  ) {
    actions.push(
      "MEDIUM: Provide guidance to night staff on recording meaningful check observations",
    );
  }
  if (
    sleepEnvironment.totalAssessments > 0 &&
    sleepEnvironment.temperatureAppropriateRate < 80
  ) {
    actions.push(
      "MEDIUM: Review heating/cooling arrangements to ensure appropriate bedroom temperatures",
    );
  }
  if (staffingAdequacy.agencyOnlyNights > 0) {
    actions.push(
      "LOW: Reduce reliance on agency-only night staffing through permanent recruitment",
    );
  }

  // -- Regulatory Links --
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 34 -- employment of staff, ensuring sufficient night cover for children's needs",
    "NMS 26 -- night care, children are adequately supervised and supported during the night",
    "SCCIF -- quality of care, children's experiences and progress including overnight",
    "NICE Sleep Guidance -- evidence-based approaches to supporting healthy sleep in children",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    monitoringQuality,
    incidentManagement,
    staffingAdequacy,
    sleepEnvironment,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
