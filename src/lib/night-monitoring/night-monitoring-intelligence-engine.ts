/* ──────────────────────────────────────────────────────────────
   Night Monitoring Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of overnight monitoring practices in children's
   residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 12 — Health and safety
     - CHR 2015 Reg 22 — Arrangements for supervision of children
     - CHR 2015 Reg 34 — Safeguarding (night supervision)
     - NMS 7 — Staffing of children's homes
     - SCCIF — Overall experiences: safety at night
     - Children Act 1989 s.22 — Duty of care
     - Quality Standards 2015 — Standard 6 (safe and effective)

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type NightMonitoringCategory =
  | "waking_night_check"
  | "sleep_observation"
  | "night_incident_response"
  | "medication_round"
  | "disturbance_management"
  | "handover_briefing"
  | "welfare_check"
  | "environmental_check";

export type NightMonitoringOutcome =
  | "all_settled"
  | "minor_disturbance"
  | "significant_incident"
  | "intervention_required"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const nightMonitoringCategoryLabels: Record<NightMonitoringCategory, string> = {
  waking_night_check: "Waking Night Check",
  sleep_observation: "Sleep Observation",
  night_incident_response: "Night Incident Response",
  medication_round: "Medication Round",
  disturbance_management: "Disturbance Management",
  handover_briefing: "Handover Briefing",
  welfare_check: "Welfare Check",
  environmental_check: "Environmental Check",
};

const nightMonitoringOutcomeLabels: Record<NightMonitoringOutcome, string> = {
  all_settled: "All Settled",
  minor_disturbance: "Minor Disturbance",
  significant_incident: "Significant Incident",
  intervention_required: "Intervention Required",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getNightMonitoringCategoryLabel(category: NightMonitoringCategory): string {
  return nightMonitoringCategoryLabels[category];
}

export function getNightMonitoringOutcomeLabel(outcome: NightMonitoringOutcome): string {
  return nightMonitoringOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface NightMonitoringRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: NightMonitoringCategory;
  outcome: NightMonitoringOutcome;
  checkCompletedOnTime: boolean;
  observationsRecorded: boolean;
  incidentEscalated: boolean;
  childWelfareConfirmed: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface NightMonitoringPolicy {
  nightMonitoringPolicy: boolean;
  wakingNightCheckFrequency: boolean;
  nightIncidentProcedure: boolean;
  nightMedicationProtocol: boolean;
  nightHandoverProcedure: boolean;
  sleepMonitoringGuidance: boolean;
  environmentalCheckPolicy: boolean;
}

export interface StaffNightMonitoringTraining {
  staffId: string;
  nightCareCompetency: boolean;
  nightIncidentManagement: boolean;
  sleepMonitoringSkills: boolean;
  nightMedicationHandling: boolean;
  childWelfareAssessment: boolean;
  nightHandoverProcedure: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface NightMonitoringQualityResult {
  overallScore: number;
  totalRecords: number;
  checkCompletedOnTimeRate: number;
  observationsRecordedRate: number;
  incidentEscalatedRate: number;
  childWelfareConfirmedRate: number;
}

export interface NightMonitoringComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  checkCompletedOnTimeRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface NightMonitoringPolicyResult {
  overallScore: number;
  nightMonitoringPolicy: boolean;
  wakingNightCheckFrequency: boolean;
  nightIncidentProcedure: boolean;
  nightMedicationProtocol: boolean;
  nightHandoverProcedure: boolean;
  sleepMonitoringGuidance: boolean;
  environmentalCheckPolicy: boolean;
}

export interface StaffNightMonitoringReadinessResult {
  overallScore: number;
  totalStaff: number;
  nightCareCompetencyRate: number;
  nightIncidentManagementRate: number;
  sleepMonitoringSkillsRate: number;
  nightMedicationHandlingRate: number;
  childWelfareAssessmentRate: number;
  nightHandoverProcedureRate: number;
}

export interface ChildNightMonitoringProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  checkCompletedOnTimeRate: number;
  observationsRecordedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface NightMonitoringIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  nightMonitoringQuality: NightMonitoringQualityResult;
  nightMonitoringCompliance: NightMonitoringComplianceResult;
  nightMonitoringPolicy: NightMonitoringPolicyResult;
  staffReadiness: StaffNightMonitoringReadinessResult;
  childProfiles: ChildNightMonitoringProfile[];
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

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluateNightMonitoringQuality(
  records: NightMonitoringRecord[],
): NightMonitoringQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, checkCompletedOnTimeRate: 0, observationsRecordedRate: 0, incidentEscalatedRate: 0, childWelfareConfirmedRate: 0 };
  }

  const checkCompletedOnTimeRate = pct(records.filter((r) => r.checkCompletedOnTime).length, n);
  const observationsRecordedRate = pct(records.filter((r) => r.observationsRecorded).length, n);
  const incidentEscalatedRate = pct(records.filter((r) => r.incidentEscalated).length, n);
  const childWelfareConfirmedRate = pct(records.filter((r) => r.childWelfareConfirmed).length, n);

  let score = 0;
  score += (checkCompletedOnTimeRate / 100) * 7;
  score += (observationsRecordedRate / 100) * 6;
  score += (incidentEscalatedRate / 100) * 6;
  score += (childWelfareConfirmedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, checkCompletedOnTimeRate, observationsRecordedRate, incidentEscalatedRate, childWelfareConfirmedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateNightMonitoringCompliance(
  records: NightMonitoringRecord[],
): NightMonitoringComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationRate: 0, timelyRecordingRate: 0, checkCompletedOnTimeRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const checkCompletedOnTimeRate = pct(records.filter((r) => r.checkCompletedOnTime).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (checkCompletedOnTimeRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationRate, timelyRecordingRate, checkCompletedOnTimeRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateNightMonitoringPolicy(
  policy: NightMonitoringPolicy | null,
): NightMonitoringPolicyResult {
  if (policy === null) {
    return { overallScore: 0, nightMonitoringPolicy: false, wakingNightCheckFrequency: false, nightIncidentProcedure: false, nightMedicationProtocol: false, nightHandoverProcedure: false, sleepMonitoringGuidance: false, environmentalCheckPolicy: false };
  }

  let score = 0;
  if (policy.nightMonitoringPolicy) score += 4;
  if (policy.wakingNightCheckFrequency) score += 4;
  if (policy.nightIncidentProcedure) score += 4;
  if (policy.nightMedicationProtocol) score += 4;
  if (policy.nightHandoverProcedure) score += 3;
  if (policy.sleepMonitoringGuidance) score += 3;
  if (policy.environmentalCheckPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    nightMonitoringPolicy: policy.nightMonitoringPolicy,
    wakingNightCheckFrequency: policy.wakingNightCheckFrequency,
    nightIncidentProcedure: policy.nightIncidentProcedure,
    nightMedicationProtocol: policy.nightMedicationProtocol,
    nightHandoverProcedure: policy.nightHandoverProcedure,
    sleepMonitoringGuidance: policy.sleepMonitoringGuidance,
    environmentalCheckPolicy: policy.environmentalCheckPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffNightMonitoringReadiness(
  training: StaffNightMonitoringTraining[],
): StaffNightMonitoringReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, nightCareCompetencyRate: 0, nightIncidentManagementRate: 0, sleepMonitoringSkillsRate: 0, nightMedicationHandlingRate: 0, childWelfareAssessmentRate: 0, nightHandoverProcedureRate: 0 };
  }

  const nightCareCompetencyRate = pct(training.filter((t) => t.nightCareCompetency).length, n);
  const nightIncidentManagementRate = pct(training.filter((t) => t.nightIncidentManagement).length, n);
  const sleepMonitoringSkillsRate = pct(training.filter((t) => t.sleepMonitoringSkills).length, n);
  const nightMedicationHandlingRate = pct(training.filter((t) => t.nightMedicationHandling).length, n);
  const childWelfareAssessmentRate = pct(training.filter((t) => t.childWelfareAssessment).length, n);
  const nightHandoverProcedureRate = pct(training.filter((t) => t.nightHandoverProcedure).length, n);

  let score = 0;
  score += (nightCareCompetencyRate / 100) * 6;
  score += (nightIncidentManagementRate / 100) * 5;
  score += (sleepMonitoringSkillsRate / 100) * 5;
  score += (nightMedicationHandlingRate / 100) * 4;
  score += (childWelfareAssessmentRate / 100) * 3;
  score += (nightHandoverProcedureRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, nightCareCompetencyRate, nightIncidentManagementRate, sleepMonitoringSkillsRate, nightMedicationHandlingRate, childWelfareAssessmentRate, nightHandoverProcedureRate };
}

// ── Build Child Night Monitoring Profiles ────────────────────────────────

export function buildChildNightMonitoringProfiles(
  records: NightMonitoringRecord[],
): ChildNightMonitoringProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: NightMonitoringRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const checkCompletedOnTimeRate = pct(child.records.filter((r) => r.checkCompletedOnTime).length, totalRecords);
    const observationsRecordedRate = pct(child.records.filter((r) => r.observationsRecorded).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (checkCompletedOnTimeRate >= 80) rate1Score = 3;
    else if (checkCompletedOnTimeRate >= 60) rate1Score = 2;
    else if (checkCompletedOnTimeRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (observationsRecordedRate >= 80) rate2Score = 3;
    else if (observationsRecordedRate >= 60) rate2Score = 2;
    else if (observationsRecordedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, checkCompletedOnTimeRate, observationsRecordedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateNightMonitoringIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: NightMonitoringRecord[];
  policy: NightMonitoringPolicy | null;
  staff: StaffNightMonitoringTraining[];
}

export function generateNightMonitoringIntelligence(
  input: GenerateNightMonitoringIntelligenceInput,
): NightMonitoringIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);

  const qualityResult = evaluateNightMonitoringQuality(periodRecords);
  const complianceResult = evaluateNightMonitoringCompliance(periodRecords);
  const policyResult = evaluateNightMonitoringPolicy(policy);
  const staffResult = evaluateStaffNightMonitoringReadiness(staff);

  const childProfiles = buildChildNightMonitoringProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Night monitoring rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Night monitoring rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Night monitoring quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Night monitoring compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Night monitoring policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff night monitoring readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.checkCompletedOnTimeRate >= 90) strengths.push("Night checks completed on time at " + qualityResult.checkCompletedOnTimeRate + "%");
  if (periodRecords.length > 0 && qualityResult.observationsRecordedRate >= 90) strengths.push("Observations recorded at " + qualityResult.observationsRecordedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Night monitoring rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Night monitoring Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Night monitoring quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Night monitoring compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Night monitoring policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff night monitoring readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.checkCompletedOnTimeRate < 80) areasForImprovement.push("Night check completion at " + qualityResult.checkCompletedOnTimeRate + "% — must improve for child safety");
  if (periodRecords.length === 0) areasForImprovement.push("No night monitoring records — monitoring must be documented");
  if (policy === null) areasForImprovement.push("No night monitoring policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff night monitoring training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No night monitoring policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff night monitoring training — schedule training for all night staff");
  if (periodRecords.length > 0 && qualityResult.checkCompletedOnTimeRate < 50) actions.push("HIGH: Night check completion at " + qualityResult.checkCompletedOnTimeRate + "% — review check schedules and staffing");
  if (periodRecords.length > 0 && qualityResult.observationsRecordedRate < 50) actions.push("HIGH: Observations recording at " + qualityResult.observationsRecordedRate + "% — ensure observations are consistently documented");
  if (periodRecords.length > 0 && complianceResult.documentationRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationRate + "% — all night activities must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.nightCareCompetencyRate < 50) actions.push("MEDIUM: Night care competency at " + staffResult.nightCareCompetencyRate + "% — schedule training for night staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low night monitoring scores — review individual overnight provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Night monitoring systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 12 — Health and safety",
    "CHR 2015 Reg 22 — Arrangements for supervision of children",
    "CHR 2015 Reg 34 — Safeguarding (night supervision)",
    "NMS 7 — Staffing of children's homes",
    "SCCIF — Overall experiences: safety at night",
    "Children Act 1989 s.22 — Duty of care",
    "Quality Standards 2015 — Standard 6 (safe and effective)",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    nightMonitoringQuality: qualityResult,
    nightMonitoringCompliance: complianceResult,
    nightMonitoringPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
