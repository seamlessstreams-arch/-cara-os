// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Night Care Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates overnight care quality across night checks, sleep monitoring,
// incident handling, bedtime routines, handovers, medication, and waking
// night support within a children's residential home.
//
// Regulatory basis:
//   CHR 2015 Reg 12 — Health and comfort of children
//   CHR 2015 Reg 34 — Safeguarding (night supervision)
//   NMS 7 — Staffing of children's homes
//   SCCIF — Overall experiences: safety at night
//   Children Act 1989 s.22 — Duty of care
//   Quality Standards 2015 — Standard 6 (safe and effective)
//   CHR 2015 Reg 40 — Notifiable events (night incidents)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type NightCareCategory =
  | "night_check"
  | "sleep_monitoring"
  | "night_incident"
  | "waking_night_support"
  | "night_medication"
  | "bedtime_routine"
  | "night_handover"
  | "disturbance_response";

export type NightCareOutcome =
  | "settled_night"
  | "minor_disturbance"
  | "significant_incident"
  | "support_provided"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<NightCareCategory, string> = {
  night_check: "Night Check",
  sleep_monitoring: "Sleep Monitoring",
  night_incident: "Night Incident",
  waking_night_support: "Waking Night Support",
  night_medication: "Night Medication",
  bedtime_routine: "Bedtime Routine",
  night_handover: "Night Handover",
  disturbance_response: "Disturbance Response",
};

const OUTCOME_LABELS: Record<NightCareOutcome, string> = {
  settled_night: "Settled Night",
  minor_disturbance: "Minor Disturbance",
  significant_incident: "Significant Incident",
  support_provided: "Support Provided",
  not_applicable: "Not Applicable",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Getters ────────────────────────────────────────────────────────────

export function getCategoryLabel(v: NightCareCategory): string {
  return CATEGORY_LABELS[v];
}

export function getOutcomeLabel(v: NightCareOutcome): string {
  return OUTCOME_LABELS[v];
}

export function getRatingLabel(v: Rating): string {
  return RATING_LABELS[v];
}

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface NightCareRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: NightCareCategory;
  outcome: NightCareOutcome;
  nightCheckCompleted: boolean;
  sleepPatternRecorded: boolean;
  incidentHandledAppropriately: boolean;
  childComfortChecked: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface NightCarePolicy {
  nightCarePolicy: boolean;
  sleepMonitoringGuidance: boolean;
  nightIncidentProcedure: boolean;
  wakingNightPolicy: boolean;
  nightMedicationProtocol: boolean;
  bedtimeRoutineGuidance: boolean;
  nightHandoverProcedure: boolean;
}

export interface NightCareStaffTraining {
  id: string;
  staffId: string;
  staffName: string;
  nightCareCompetency: boolean;
  sleepMonitoringSkills: boolean;
  nightIncidentResponse: boolean;
  nightMedicationHandling: boolean;
  childComfortTechniques: boolean;
  nightHandoverProcedure: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface QualityResult {
  overallScore: number;
  totalRecords: number;
  nightCheckCompletedRate: number;
  sleepPatternRecordedRate: number;
  incidentHandledAppropriatelyRate: number;
  childComfortCheckedRate: number;
}

export interface ComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  nightCheckCompletedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface PolicyResult {
  overallScore: number;
  nightCarePolicy: boolean;
  sleepMonitoringGuidance: boolean;
  nightIncidentProcedure: boolean;
  wakingNightPolicy: boolean;
  nightMedicationProtocol: boolean;
  bedtimeRoutineGuidance: boolean;
  nightHandoverProcedure: boolean;
}

export interface StaffReadinessResult {
  overallScore: number;
  totalStaff: number;
  nightCareCompetencyRate: number;
  sleepMonitoringSkillsRate: number;
  nightIncidentResponseRate: number;
  nightMedicationHandlingRate: number;
  childComfortTechniquesRate: number;
  nightHandoverProcedureRate: number;
}

export interface ChildNightCareProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  nightCheckCompletedRate: number;
  sleepPatternRecordedRate: number;
  uniqueCategories: number;
  overallScore: number;
}

export interface NightCareIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  quality: QualityResult;
  compliance: ComplianceResult;
  policy: PolicyResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildNightCareProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Calculate percentage, returning 0 if denominator is 0. */
export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

/** Map overall score (0-100) to Ofsted-style rating. */
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ─────────────────────────────────────────────

/**
 * Evaluates night care quality from record quality booleans.
 * Empty (no records) = 0.
 *
 * Weights:
 *   nightCheckCompletedRate       -> 0-7
 *   sleepPatternRecordedRate      -> 0-6
 *   incidentHandledAppropriatelyRate -> 0-6
 *   childComfortCheckedRate       -> 0-6
 */
export function evaluateQuality(records: NightCareRecord[]): QualityResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      nightCheckCompletedRate: 0,
      sleepPatternRecordedRate: 0,
      incidentHandledAppropriatelyRate: 0,
      childComfortCheckedRate: 0,
    };
  }

  const nightCheckCount = records.filter((r) => r.nightCheckCompleted).length;
  const sleepPatternCount = records.filter((r) => r.sleepPatternRecorded).length;
  const incidentCount = records.filter((r) => r.incidentHandledAppropriately).length;
  const comfortCount = records.filter((r) => r.childComfortChecked).length;

  const nightCheckCompletedRate = pct(nightCheckCount, records.length);
  const sleepPatternRecordedRate = pct(sleepPatternCount, records.length);
  const incidentHandledAppropriatelyRate = pct(incidentCount, records.length);
  const childComfortCheckedRate = pct(comfortCount, records.length);

  let score = 0;
  score += Math.round((nightCheckCompletedRate / 100) * 7);
  score += Math.round((sleepPatternRecordedRate / 100) * 6);
  score += Math.round((incidentHandledAppropriatelyRate / 100) * 6);
  score += Math.round((childComfortCheckedRate / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecords: records.length,
    nightCheckCompletedRate,
    sleepPatternRecordedRate,
    incidentHandledAppropriatelyRate,
    childComfortCheckedRate,
  };
}

// ── Evaluator 2: Compliance (0-25) ──────────────────────────────────────────

/**
 * Evaluates compliance from documentation, timeliness, domain rate and diversity.
 * Empty (no records) = 0.
 *
 * Weights:
 *   documentationRate         -> 0-8
 *   timelyRecordingRate       -> 0-7
 *   nightCheckCompletedRate   -> 0-5
 *   categoryDiversityRatio    -> 0-5
 */
export function evaluateCompliance(records: NightCareRecord[]): ComplianceResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      documentationRate: 0,
      timelyRecordingRate: 0,
      nightCheckCompletedRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
    };
  }

  const documentedCount = records.filter((r) => r.documentationComplete).length;
  const documentationRate = pct(documentedCount, records.length);

  const timelyCount = records.filter((r) => r.timelyRecording).length;
  const timelyRecordingRate = pct(timelyCount, records.length);

  const nightCheckCount = records.filter((r) => r.nightCheckCompleted).length;
  const nightCheckCompletedRate = pct(nightCheckCount, records.length);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (nightCheckCompletedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalRecords: records.length,
    documentationRate,
    timelyRecordingRate,
    nightCheckCompletedRate,
    categoryDiversityRatio,
    uniqueCategories,
  };
}

// ── Evaluator 3: Policy (0-25) ──────────────────────────────────────────────

/**
 * Evaluates night care policy completeness.
 * Null = all false, score 0.
 *
 * 7 boolean fields weighted 4+4+4+4+3+3+3 = 25:
 *   nightCarePolicy:           4
 *   sleepMonitoringGuidance:   4
 *   nightIncidentProcedure:    4
 *   wakingNightPolicy:         4
 *   nightMedicationProtocol:   3
 *   bedtimeRoutineGuidance:    3
 *   nightHandoverProcedure:    3
 */
export function evaluatePolicy(policy: NightCarePolicy | null): PolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      nightCarePolicy: false,
      sleepMonitoringGuidance: false,
      nightIncidentProcedure: false,
      wakingNightPolicy: false,
      nightMedicationProtocol: false,
      bedtimeRoutineGuidance: false,
      nightHandoverProcedure: false,
    };
  }

  let score = 0;
  if (policy.nightCarePolicy) score += 4;
  if (policy.sleepMonitoringGuidance) score += 4;
  if (policy.nightIncidentProcedure) score += 4;
  if (policy.wakingNightPolicy) score += 4;
  if (policy.nightMedicationProtocol) score += 3;
  if (policy.bedtimeRoutineGuidance) score += 3;
  if (policy.nightHandoverProcedure) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    nightCarePolicy: policy.nightCarePolicy,
    sleepMonitoringGuidance: policy.sleepMonitoringGuidance,
    nightIncidentProcedure: policy.nightIncidentProcedure,
    wakingNightPolicy: policy.wakingNightPolicy,
    nightMedicationProtocol: policy.nightMedicationProtocol,
    bedtimeRoutineGuidance: policy.bedtimeRoutineGuidance,
    nightHandoverProcedure: policy.nightHandoverProcedure,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ─────────────────────────────────────

/**
 * Evaluates staff readiness from training records.
 * Empty = 0.
 *
 * 6 skill rates weighted 6+5+5+4+3+2 = 25:
 *   nightCareCompetencyRate:      6
 *   sleepMonitoringSkillsRate:    5
 *   nightIncidentResponseRate:    5
 *   nightMedicationHandlingRate:  4
 *   childComfortTechniquesRate:   3
 *   nightHandoverProcedureRate:   2
 */
export function evaluateStaffReadiness(
  training: NightCareStaffTraining[],
): StaffReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      nightCareCompetencyRate: 0,
      sleepMonitoringSkillsRate: 0,
      nightIncidentResponseRate: 0,
      nightMedicationHandlingRate: 0,
      childComfortTechniquesRate: 0,
      nightHandoverProcedureRate: 0,
    };
  }

  let competency = 0;
  let sleepSkills = 0;
  let incidentResponse = 0;
  let medicationHandling = 0;
  let comfortTechniques = 0;
  let handoverProcedure = 0;

  for (const t of training) {
    if (t.nightCareCompetency) competency++;
    if (t.sleepMonitoringSkills) sleepSkills++;
    if (t.nightIncidentResponse) incidentResponse++;
    if (t.nightMedicationHandling) medicationHandling++;
    if (t.childComfortTechniques) comfortTechniques++;
    if (t.nightHandoverProcedure) handoverProcedure++;
  }

  const nightCareCompetencyRate = pct(competency, training.length);
  const sleepMonitoringSkillsRate = pct(sleepSkills, training.length);
  const nightIncidentResponseRate = pct(incidentResponse, training.length);
  const nightMedicationHandlingRate = pct(medicationHandling, training.length);
  const childComfortTechniquesRate = pct(comfortTechniques, training.length);
  const nightHandoverProcedureRate = pct(handoverProcedure, training.length);

  let score = 0;
  score += Math.round((nightCareCompetencyRate / 100) * 6);
  score += Math.round((sleepMonitoringSkillsRate / 100) * 5);
  score += Math.round((nightIncidentResponseRate / 100) * 5);
  score += Math.round((nightMedicationHandlingRate / 100) * 4);
  score += Math.round((childComfortTechniquesRate / 100) * 3);
  score += Math.round((nightHandoverProcedureRate / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    nightCareCompetencyRate,
    sleepMonitoringSkillsRate,
    nightIncidentResponseRate,
    nightMedicationHandlingRate,
    childComfortTechniquesRate,
    nightHandoverProcedureRate,
  };
}

// ── Child Profiles ──────────────────────────────────────────────────────────

/**
 * Builds per-child night care profiles from record data.
 * Each child scored 0-10:
 *   frequency [>=10 -> 2, >=5 -> 1]
 *   + rate1 nightCheckCompletedRate [>=80 -> 3, >=60 -> 2, >=40 -> 1]
 *   + rate2 sleepPatternRecordedRate [same thresholds]
 *   + diversity uniqueCategories [>=4 -> 2, >=2 -> 1]
 */
export function buildChildNightCareProfiles(
  records: NightCareRecord[],
): ChildNightCareProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<
    string,
    { childId: string; childName: string; records: NightCareRecord[] }
  >();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;

    const nightCheckCount = child.records.filter((r) => r.nightCheckCompleted).length;
    const nightCheckCompletedRate = pct(nightCheckCount, totalRecords);

    const sleepPatternCount = child.records.filter((r) => r.sleepPatternRecorded).length;
    const sleepPatternRecordedRate = pct(sleepPatternCount, totalRecords);

    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const uniqueCategories = uniqueCategoriesSet.size;

    // frequency: >=10 records -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    // rate1 (nightCheckCompletedRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (nightCheckCompletedRate >= 80) rate1Score = 3;
    else if (nightCheckCompletedRate >= 60) rate1Score = 2;
    else if (nightCheckCompletedRate >= 40) rate1Score = 1;

    // rate2 (sleepPatternRecordedRate): same thresholds
    let rate2Score = 0;
    if (sleepPatternRecordedRate >= 80) rate2Score = 3;
    else if (sleepPatternRecordedRate >= 60) rate2Score = 2;
    else if (sleepPatternRecordedRate >= 40) rate2Score = 1;

    // diversity (unique categories): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (uniqueCategories >= 4) diversityBonus = 2;
    else if (uniqueCategories >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalRecords,
      nightCheckCompletedRate,
      sleepPatternRecordedRate,
      uniqueCategories,
      overallScore,
    };
  });
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateNightCareIntelligence(
  records: NightCareRecord[],
  policy: NightCarePolicy | null,
  training: NightCareStaffTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): NightCareIntelligence {
  const quality = evaluateQuality(records);
  const compliance = evaluateCompliance(records);
  const policyResult = evaluatePolicy(policy);
  const staffReadiness = evaluateStaffReadiness(training);

  const rawScore =
    quality.overallScore +
    compliance.overallScore +
    policyResult.overallScore +
    staffReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildNightCareProfiles(records);

  // ── Strengths ──
  const strengths: string[] = [];

  if (records.length > 0 && quality.nightCheckCompletedRate >= 90) {
    strengths.push(
      "Night checks consistently completed at " +
        quality.nightCheckCompletedRate +
        "%, ensuring children are safe and well overnight",
    );
  }
  if (records.length > 0 && quality.sleepPatternRecordedRate >= 90) {
    strengths.push(
      "Sleep patterns recorded at " +
        quality.sleepPatternRecordedRate +
        "%, supporting individual care planning",
    );
  }
  if (records.length > 0 && quality.incidentHandledAppropriatelyRate >= 90) {
    strengths.push(
      "Night incidents handled appropriately at " +
        quality.incidentHandledAppropriatelyRate +
        "%, demonstrating staff competence",
    );
  }
  if (records.length > 0 && quality.childComfortCheckedRate >= 90) {
    strengths.push(
      "Child comfort checked at " +
        quality.childComfortCheckedRate +
        "%, reflecting a nurturing night care approach",
    );
  }
  if (records.length > 0 && compliance.documentationRate === 100) {
    strengths.push(
      "Documentation rate at 100% — all night care activities fully recorded",
    );
  }
  if (records.length > 0 && compliance.timelyRecordingRate === 100) {
    strengths.push(
      "All night care records completed in a timely manner",
    );
  }
  if (records.length > 0 && compliance.uniqueCategories >= 6) {
    strengths.push(
      "Comprehensive night care coverage: " +
        compliance.uniqueCategories +
        " of 8 categories represented",
    );
  }
  if (policy !== null && policyResult.overallScore === 25) {
    strengths.push(
      "Comprehensive night care policy in place covering all required areas",
    );
  }
  if (training.length > 0 && staffReadiness.nightCareCompetencyRate === 100) {
    strengths.push(
      "All staff trained in night care competency",
    );
  }
  if (training.length > 0 && staffReadiness.nightIncidentResponseRate === 100) {
    strengths.push(
      "All staff trained in night incident response",
    );
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];

  if (records.length === 0) {
    areasForImprovement.push(
      "No night care records found — night care activities must be documented",
    );
  }
  if (records.length > 0 && quality.nightCheckCompletedRate < 80) {
    areasForImprovement.push(
      "Night check completion rate at " +
        quality.nightCheckCompletedRate +
        "% — must improve to ensure child safety",
    );
  }
  if (records.length > 0 && quality.sleepPatternRecordedRate < 80) {
    areasForImprovement.push(
      "Sleep pattern recording rate at " +
        quality.sleepPatternRecordedRate +
        "% — individual sleep data needed for care planning",
    );
  }
  if (records.length > 0 && quality.incidentHandledAppropriatelyRate < 80) {
    areasForImprovement.push(
      "Night incident handling rate at " +
        quality.incidentHandledAppropriatelyRate +
        "% — staff require additional incident management support",
    );
  }
  if (records.length > 0 && quality.childComfortCheckedRate < 80) {
    areasForImprovement.push(
      "Child comfort check rate at " +
        quality.childComfortCheckedRate +
        "% — children's wellbeing must be consistently monitored",
    );
  }
  if (records.length > 0 && compliance.documentationRate < 100) {
    areasForImprovement.push(
      "Documentation rate at " +
        compliance.documentationRate +
        "% — all night care activities must be fully recorded",
    );
  }
  if (records.length > 0 && compliance.timelyRecordingRate < 80) {
    areasForImprovement.push(
      "Timely recording rate at " +
        compliance.timelyRecordingRate +
        "% — records must be completed promptly",
    );
  }
  if (records.length > 0 && compliance.uniqueCategories <= 3) {
    areasForImprovement.push(
      "Only " +
        compliance.uniqueCategories +
        " night care categories covered — limited scope of overnight care activities",
    );
  }
  if (policy === null) {
    areasForImprovement.push(
      "No night care policy in place — statutory requirement",
    );
  }
  if (policy !== null && !policy.nightCarePolicy) {
    areasForImprovement.push(
      "Core night care policy not documented",
    );
  }
  if (policy !== null && !policy.nightIncidentProcedure) {
    areasForImprovement.push(
      "Night incident procedure missing from policy — safeguarding risk",
    );
  }
  if (training.length === 0) {
    areasForImprovement.push(
      "No staff night care training records — all staff must be trained",
    );
  }
  if (training.length > 0 && staffReadiness.nightCareCompetencyRate < 100) {
    areasForImprovement.push(
      "Only " +
        staffReadiness.nightCareCompetencyRate +
        "% of staff trained in night care competency — all staff require this training",
    );
  }
  if (training.length > 0 && staffReadiness.nightIncidentResponseRate < 75) {
    areasForImprovement.push(
      "Night incident response training completed by only " +
        staffReadiness.nightIncidentResponseRate +
        "% of staff",
    );
  }

  // ── Actions ──
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push(
      "URGENT: Implement structured night care recording immediately",
    );
  }
  if (records.length > 0 && quality.nightCheckCompletedRate < 80) {
    actions.push(
      "URGENT: Review night check procedures and ensure all checks are completed and recorded",
    );
  }
  if (records.length > 0 && quality.incidentHandledAppropriatelyRate < 80) {
    actions.push(
      "URGENT: Provide night incident management training to all night staff",
    );
  }
  if (records.length > 0 && quality.sleepPatternRecordedRate < 80) {
    actions.push(
      "Improve sleep pattern recording — integrate into standard night check procedures",
    );
  }
  if (records.length > 0 && quality.childComfortCheckedRate < 80) {
    actions.push(
      "Ensure child comfort is checked and recorded during every night care round",
    );
  }
  if (records.length > 0 && compliance.documentationRate < 100) {
    actions.push(
      "Ensure all night care activities are fully documented before end of shift",
    );
  }
  if (records.length > 0 && compliance.timelyRecordingRate < 80) {
    actions.push(
      "Improve timeliness of night care recording — records must be completed promptly",
    );
  }
  if (policy === null) {
    actions.push(
      "Develop and implement a comprehensive night care policy covering all 7 required areas",
    );
  }
  if (policy !== null && policyResult.overallScore < 25) {
    actions.push(
      "Review and update night care policy to address all gaps identified",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: Arrange night care training for all staff immediately",
    );
  }
  if (training.length > 0 && staffReadiness.nightCareCompetencyRate < 100) {
    actions.push(
      "Ensure all staff complete night care competency training — currently " +
        staffReadiness.nightCareCompetencyRate +
        "%",
    );
  }
  if (training.length > 0 && staffReadiness.nightIncidentResponseRate < 100) {
    actions.push(
      "Ensure all staff complete night incident response training — currently " +
        staffReadiness.nightIncidentResponseRate +
        "%",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 12 — Health and comfort of children",
    "CHR 2015 Reg 34 — Safeguarding (night supervision)",
    "NMS 7 — Staffing of children's homes",
    "SCCIF — Overall experiences: safety at night",
    "Children Act 1989 s.22 — Duty of care",
    "Quality Standards 2015 — Standard 6 (safe and effective)",
    "CHR 2015 Reg 40 — Notifiable events (night incidents)",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    quality,
    compliance,
    policy: policyResult,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
