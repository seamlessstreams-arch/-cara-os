/* ──────────────────────────────────────────────────────────────
   Fire Safety Intelligence Engine

   Pure deterministic engine for evaluating fire safety compliance
   in children's residential care homes, covering fire drills,
   equipment checks, risk assessments, evacuation plans, alarm
   tests, staff training, fire door checks, and emergency lighting.

   Regulatory basis:
     - Regulatory Reform (Fire Safety) Order 2005
     - CHR 2015 Reg 25 — Fire precautions
     - CHR 2015 Reg 44 — Independent person: visits
     - SCCIF — Safety: fire safety compliance
     - NMS 10 — Premises and safety
     - Health and Safety at Work Act 1974 — Fire safety duties
     - Quality Standards 2015 — Standard 6 (safe premises)

   No AI. No external calls. Pure input -> output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type FireSafetyCategory =
  | "fire_drill"
  | "equipment_check"
  | "risk_assessment"
  | "evacuation_plan"
  | "fire_alarm_test"
  | "staff_training_session"
  | "fire_door_check"
  | "emergency_lighting_check";

export type FireSafetyOutcome =
  | "fully_compliant"
  | "minor_issue"
  | "significant_issue"
  | "action_required"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const fireSafetyCategoryLabels: Record<FireSafetyCategory, string> = {
  fire_drill: "Fire Drill",
  equipment_check: "Equipment Check",
  risk_assessment: "Risk Assessment",
  evacuation_plan: "Evacuation Plan",
  fire_alarm_test: "Fire Alarm Test",
  staff_training_session: "Staff Training Session",
  fire_door_check: "Fire Door Check",
  emergency_lighting_check: "Emergency Lighting Check",
};

const fireSafetyOutcomeLabels: Record<FireSafetyOutcome, string> = {
  fully_compliant: "Fully Compliant",
  minor_issue: "Minor Issue",
  significant_issue: "Significant Issue",
  action_required: "Action Required",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getFireSafetyCategoryLabel(category: FireSafetyCategory): string {
  return fireSafetyCategoryLabels[category];
}

export function getFireSafetyOutcomeLabel(outcome: FireSafetyOutcome): string {
  return fireSafetyOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface FireSafetyRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: FireSafetyCategory;
  outcome: FireSafetyOutcome;
  drillCompletedSuccessfully: boolean;
  allChildrenAccounted: boolean;
  evacuationTimeRecorded: boolean;
  equipmentFunctional: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface FireSafetyPolicy {
  fireSafetyPolicy: boolean;
  evacuationProcedure: boolean;
  fireRiskAssessmentPolicy: boolean;
  equipmentMaintenancePolicy: boolean;
  drillFrequencyGuidance: boolean;
  emergencyLightingPolicy: boolean;
  fireAlarmTestingPolicy: boolean;
}

export interface FireSafetyStaffTraining {
  staffId: string;
  fireWardenTraining: boolean;
  evacuationProcedureKnowledge: boolean;
  fireExtinguisherUse: boolean;
  fireRiskAssessment: boolean;
  alarmSystemKnowledge: boolean;
  firstAidFireInjury: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface FireSafetyQualityResult {
  totalRecords: number;
  drillCompletedSuccessfullyRate: number;
  allChildrenAccountedRate: number;
  evacuationTimeRecordedRate: number;
  equipmentFunctionalRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface FireSafetyComplianceResult {
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  allChildrenAccountedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface FireSafetyPolicyResult {
  fireSafetyPolicy: boolean;
  evacuationProcedure: boolean;
  fireRiskAssessmentPolicy: boolean;
  equipmentMaintenancePolicy: boolean;
  drillFrequencyGuidance: boolean;
  emergencyLightingPolicy: boolean;
  fireAlarmTestingPolicy: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface FireSafetyStaffReadinessResult {
  totalStaff: number;
  fireWardenTrainingRate: number;
  evacuationProcedureKnowledgeRate: number;
  fireExtinguisherUseRate: number;
  fireRiskAssessmentRate: number;
  alarmSystemKnowledgeRate: number;
  firstAidFireInjuryRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildFireSafetyProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  drillCompletedSuccessfullyRate: number;
  allChildrenAccountedRate: number;
  uniqueCategories: number;
  fireSafetyScore: number;
}

export interface FireSafetyIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  quality: FireSafetyQualityResult;
  compliance: FireSafetyComplianceResult;
  policy: FireSafetyPolicyResult;
  staffReadiness: FireSafetyStaffReadinessResult;
  childProfiles: ChildFireSafetyProfile[];
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

export function evaluateFireSafetyQuality(
  records: FireSafetyRecord[],
): FireSafetyQualityResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      drillCompletedSuccessfullyRate: 0,
      allChildrenAccountedRate: 0,
      evacuationTimeRecordedRate: 0,
      equipmentFunctionalRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No fire safety records — quality cannot be assessed"],
    };
  }

  const drillCount = records.filter((r) => r.drillCompletedSuccessfully).length;
  const drillCompletedSuccessfullyRate = pct(drillCount, totalRecords);

  const accountedCount = records.filter((r) => r.allChildrenAccounted).length;
  const allChildrenAccountedRate = pct(accountedCount, totalRecords);

  const evacTimeCount = records.filter((r) => r.evacuationTimeRecorded).length;
  const evacuationTimeRecordedRate = pct(evacTimeCount, totalRecords);

  const equipCount = records.filter((r) => r.equipmentFunctional).length;
  const equipmentFunctionalRate = pct(equipCount, totalRecords);

  // Weights: drillCompletedSuccessfullyRate 7 + allChildrenAccountedRate 6 + evacuationTimeRecordedRate 6 + equipmentFunctionalRate 6 = 25
  let score = 0;
  score += (drillCompletedSuccessfullyRate / 100) * 7;
  score += (allChildrenAccountedRate / 100) * 6;
  score += (evacuationTimeRecordedRate / 100) * 6;
  score += (equipmentFunctionalRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (drillCompletedSuccessfullyRate >= 80) {
    strengths.push("Strong drill completion: " + drillCompletedSuccessfullyRate + "% of drills completed successfully");
  } else if (drillCompletedSuccessfullyRate < 50) {
    concerns.push("Drill completion rate at " + drillCompletedSuccessfullyRate + "% — drills not consistently successful");
  }

  if (allChildrenAccountedRate >= 80) {
    strengths.push("Excellent child accountability: " + allChildrenAccountedRate + "% of records show all children accounted for");
  } else if (allChildrenAccountedRate < 50) {
    concerns.push("Child accountability rate at " + allChildrenAccountedRate + "% — children not consistently accounted for");
  }

  if (evacuationTimeRecordedRate >= 90) {
    strengths.push("Thorough evacuation time recording: " + evacuationTimeRecordedRate + "% of records have evacuation times");
  } else if (evacuationTimeRecordedRate < 60) {
    concerns.push("Evacuation time recording at " + evacuationTimeRecordedRate + "% — evacuation times not consistently recorded");
  }

  if (equipmentFunctionalRate >= 80) {
    strengths.push("Good equipment functionality: " + equipmentFunctionalRate + "% of checks show equipment functional");
  } else if (equipmentFunctionalRate < 50) {
    concerns.push("Equipment functionality at " + equipmentFunctionalRate + "% — equipment not consistently functional");
  }

  return {
    totalRecords,
    drillCompletedSuccessfullyRate,
    allChildrenAccountedRate,
    evacuationTimeRecordedRate,
    equipmentFunctionalRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateFireSafetyCompliance(
  records: FireSafetyRecord[],
): FireSafetyComplianceResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      documentationRate: 0,
      timelyRecordingRate: 0,
      allChildrenAccountedRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
      score: 0,
      strengths: [],
      concerns: ["No fire safety records — compliance cannot be assessed"],
    };
  }

  const docCount = records.filter((r) => r.documentationComplete).length;
  const documentationRate = pct(docCount, totalRecords);

  const timelyCount = records.filter((r) => r.timelyRecording).length;
  const timelyRecordingRate = pct(timelyCount, totalRecords);

  const accountedCount = records.filter((r) => r.allChildrenAccounted).length;
  const allChildrenAccountedRate = pct(accountedCount, totalRecords);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  // Weights: documentationRate 8 + timelyRecordingRate 7 + allChildrenAccountedRate 5 + categoryDiversityRatio 5 = 25
  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (allChildrenAccountedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (documentationRate >= 90) {
    strengths.push("Excellent documentation: " + documentationRate + "% of fire safety records fully documented");
  } else if (documentationRate < 50) {
    concerns.push("Documentation rate at " + documentationRate + "% — fire safety records incomplete");
  }

  if (timelyRecordingRate >= 90) {
    strengths.push("Timely recording: " + timelyRecordingRate + "% of fire safety activities recorded promptly");
  } else if (timelyRecordingRate < 50) {
    concerns.push("Timely recording rate at " + timelyRecordingRate + "% — records not completed promptly");
  }

  if (allChildrenAccountedRate >= 90) {
    strengths.push("Strong child accountability in compliance: " + allChildrenAccountedRate + "% of records show all children accounted for");
  } else if (allChildrenAccountedRate < 50) {
    concerns.push("Child accountability in compliance at " + allChildrenAccountedRate + "% — accountability procedures need strengthening");
  }

  if (uniqueCategories >= 6) {
    strengths.push("Comprehensive fire safety coverage: " + uniqueCategories + " of 8 categories represented");
  } else if (uniqueCategories <= 2) {
    concerns.push("Only " + uniqueCategories + " fire safety category(ies) covered — limited scope of fire safety activity");
  }

  return {
    totalRecords,
    documentationRate,
    timelyRecordingRate,
    allChildrenAccountedRate,
    categoryDiversityRatio,
    uniqueCategories,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateFireSafetyPolicy(
  policy: FireSafetyPolicy | null,
): FireSafetyPolicyResult {
  if (policy === null) {
    return {
      fireSafetyPolicy: false,
      evacuationProcedure: false,
      fireRiskAssessmentPolicy: false,
      equipmentMaintenancePolicy: false,
      drillFrequencyGuidance: false,
      emergencyLightingPolicy: false,
      fireAlarmTestingPolicy: false,
      score: 0,
      strengths: [],
      concerns: ["No fire safety policy in place — URGENT: develop comprehensive fire safety policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.fireSafetyPolicy) score += 4;
  if (policy.evacuationProcedure) score += 4;
  if (policy.fireRiskAssessmentPolicy) score += 4;
  if (policy.equipmentMaintenancePolicy) score += 4;
  if (policy.drillFrequencyGuidance) score += 3;
  if (policy.emergencyLightingPolicy) score += 3;
  if (policy.fireAlarmTestingPolicy) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.fireSafetyPolicy,
    policy.evacuationProcedure,
    policy.fireRiskAssessmentPolicy,
    policy.equipmentMaintenancePolicy,
    policy.drillFrequencyGuidance,
    policy.emergencyLightingPolicy,
    policy.fireAlarmTestingPolicy,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete fire safety policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 fire safety policy components in place");
  }

  if (!policy.fireSafetyPolicy) {
    concerns.push("No overarching fire safety policy — foundational gap in fire safety governance");
  }
  if (!policy.evacuationProcedure) {
    concerns.push("No evacuation procedure documented — staff and children may be at risk during emergencies");
  }
  if (!policy.fireRiskAssessmentPolicy) {
    concerns.push("No fire risk assessment policy — risk assessments may not be carried out consistently");
  }
  if (!policy.equipmentMaintenancePolicy) {
    concerns.push("No equipment maintenance policy — fire safety equipment may not be properly maintained");
  }
  if (!policy.drillFrequencyGuidance) {
    concerns.push("No drill frequency guidance — drills may not be conducted regularly");
  }
  if (!policy.emergencyLightingPolicy) {
    concerns.push("No emergency lighting policy — lighting checks may not be regular");
  }
  if (!policy.fireAlarmTestingPolicy) {
    concerns.push("No fire alarm testing policy — alarms may not be tested at required intervals");
  }

  return {
    fireSafetyPolicy: policy.fireSafetyPolicy,
    evacuationProcedure: policy.evacuationProcedure,
    fireRiskAssessmentPolicy: policy.fireRiskAssessmentPolicy,
    equipmentMaintenancePolicy: policy.equipmentMaintenancePolicy,
    drillFrequencyGuidance: policy.drillFrequencyGuidance,
    emergencyLightingPolicy: policy.emergencyLightingPolicy,
    fireAlarmTestingPolicy: policy.fireAlarmTestingPolicy,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateFireSafetyStaffReadiness(
  training: FireSafetyStaffTraining[],
): FireSafetyStaffReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      fireWardenTrainingRate: 0,
      evacuationProcedureKnowledgeRate: 0,
      fireExtinguisherUseRate: 0,
      fireRiskAssessmentRate: 0,
      alarmSystemKnowledgeRate: 0,
      firstAidFireInjuryRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule fire safety training for all staff"],
    };
  }

  const wardenCount = training.filter((t) => t.fireWardenTraining).length;
  const fireWardenTrainingRate = pct(wardenCount, totalStaff);

  const evacCount = training.filter((t) => t.evacuationProcedureKnowledge).length;
  const evacuationProcedureKnowledgeRate = pct(evacCount, totalStaff);

  const extinguisherCount = training.filter((t) => t.fireExtinguisherUse).length;
  const fireExtinguisherUseRate = pct(extinguisherCount, totalStaff);

  const riskCount = training.filter((t) => t.fireRiskAssessment).length;
  const fireRiskAssessmentRate = pct(riskCount, totalStaff);

  const alarmCount = training.filter((t) => t.alarmSystemKnowledge).length;
  const alarmSystemKnowledgeRate = pct(alarmCount, totalStaff);

  const firstAidCount = training.filter((t) => t.firstAidFireInjury).length;
  const firstAidFireInjuryRate = pct(firstAidCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (fireWardenTrainingRate / 100) * 6;
  score += (evacuationProcedureKnowledgeRate / 100) * 5;
  score += (fireExtinguisherUseRate / 100) * 5;
  score += (fireRiskAssessmentRate / 100) * 4;
  score += (alarmSystemKnowledgeRate / 100) * 3;
  score += (firstAidFireInjuryRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (fireWardenTrainingRate >= 80) {
    strengths.push("Strong fire warden training: " + fireWardenTrainingRate + "% of staff trained");
  } else if (fireWardenTrainingRate < 50) {
    concerns.push("Fire warden training at " + fireWardenTrainingRate + "% — more staff need fire warden certification");
  }

  if (evacuationProcedureKnowledgeRate >= 80) {
    strengths.push("Good evacuation procedure knowledge: " + evacuationProcedureKnowledgeRate + "% of staff");
  } else if (evacuationProcedureKnowledgeRate < 50) {
    concerns.push("Evacuation procedure knowledge at " + evacuationProcedureKnowledgeRate + "% — staff training gap");
  }

  if (fireExtinguisherUseRate >= 80) {
    strengths.push("Staff confident with fire extinguishers: " + fireExtinguisherUseRate + "%");
  } else if (fireExtinguisherUseRate < 50) {
    concerns.push("Fire extinguisher training at " + fireExtinguisherUseRate + "% — practical training needed");
  }

  if (fireRiskAssessmentRate >= 80) {
    strengths.push("Good fire risk assessment skills: " + fireRiskAssessmentRate + "% of staff");
  } else if (fireRiskAssessmentRate < 50) {
    concerns.push("Fire risk assessment skills at " + fireRiskAssessmentRate + "% — upskilling required");
  }

  if (alarmSystemKnowledgeRate >= 80) {
    strengths.push("Strong alarm system knowledge: " + alarmSystemKnowledgeRate + "% of staff");
  } else if (alarmSystemKnowledgeRate < 50) {
    concerns.push("Alarm system knowledge at " + alarmSystemKnowledgeRate + "% — staff need familiarisation");
  }

  if (firstAidFireInjuryRate >= 80) {
    strengths.push("Good first aid for fire injury skills: " + firstAidFireInjuryRate + "% of staff");
  } else if (firstAidFireInjuryRate < 50) {
    concerns.push("First aid for fire injury at " + firstAidFireInjuryRate + "% — training recommended");
  }

  return {
    totalStaff,
    fireWardenTrainingRate,
    evacuationProcedureKnowledgeRate,
    fireExtinguisherUseRate,
    fireRiskAssessmentRate,
    alarmSystemKnowledgeRate,
    firstAidFireInjuryRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Fire Safety Profiles ─────────────────────────────────────

export function buildChildFireSafetyProfiles(
  records: FireSafetyRecord[],
): ChildFireSafetyProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: FireSafetyRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;

    const drillCount = child.records.filter((r) => r.drillCompletedSuccessfully).length;
    const drillCompletedSuccessfullyRate = pct(drillCount, totalRecords);

    const accountedCount = child.records.filter((r) => r.allChildrenAccounted).length;
    const allChildrenAccountedRate = pct(accountedCount, totalRecords);

    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const uniqueCategories = uniqueCategoriesSet.size;

    // frequency: >=10 records -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    // rate1 (drillCompletedSuccessfullyRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (drillCompletedSuccessfullyRate >= 80) rate1Score = 3;
    else if (drillCompletedSuccessfullyRate >= 60) rate1Score = 2;
    else if (drillCompletedSuccessfullyRate >= 40) rate1Score = 1;

    // rate2 (allChildrenAccountedRate): same thresholds
    let rate2Score = 0;
    if (allChildrenAccountedRate >= 80) rate2Score = 3;
    else if (allChildrenAccountedRate >= 60) rate2Score = 2;
    else if (allChildrenAccountedRate >= 40) rate2Score = 1;

    // diversity (unique categories): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (uniqueCategories >= 4) diversityBonus = 2;
    else if (uniqueCategories >= 2) diversityBonus = 1;

    const fireSafetyScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalRecords,
      drillCompletedSuccessfullyRate,
      allChildrenAccountedRate,
      uniqueCategories,
      fireSafetyScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateFireSafetyIntelligence(
  records: FireSafetyRecord[],
  policy: FireSafetyPolicy | null,
  training: FireSafetyStaffTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): FireSafetyIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter records to period
  const periodRecords = records.filter(
    (r) => withinPeriod(r.date, periodStart, periodEnd),
  );

  // Evaluate each layer
  const quality = evaluateFireSafetyQuality(periodRecords);
  const compliance = evaluateFireSafetyCompliance(periodRecords);
  const policyResult = evaluateFireSafetyPolicy(policy);
  const staffReadiness = evaluateFireSafetyStaffReadiness(training);

  // Build child profiles
  const childProfiles = buildChildFireSafetyProfiles(periodRecords);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      quality.score +
      compliance.score +
      policyResult.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    quality, compliance, policyResult, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    quality, compliance, policyResult, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    quality, compliance, policyResult, staffReadiness, childProfiles,
  );

  // Regulatory links
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
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

// ── Aggregate Strengths ──────────────────────────────────────────────────

function aggregateStrengths(
  quality: FireSafetyQualityResult,
  compliance: FireSafetyComplianceResult,
  policy: FireSafetyPolicyResult,
  staff: FireSafetyStaffReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall fire safety management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall fire safety management rated Good (" + overallScore + "/100)");
  }

  if (quality.score >= 20) {
    strengths.push("Fire safety quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Fire safety compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Fire safety policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff fire safety readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: FireSafetyQualityResult,
  compliance: FireSafetyComplianceResult,
  policy: FireSafetyPolicyResult,
  staff: FireSafetyStaffReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall fire safety management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall fire safety management Requires Improvement (" + overallScore + "/100)");
  }

  if (quality.score < 15) {
    areas.push("Fire safety quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Fire safety compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Fire safety policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff fire safety readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: FireSafetyQualityResult,
  compliance: FireSafetyComplianceResult,
  policy: FireSafetyPolicyResult,
  staff: FireSafetyStaffReadinessResult,
  childProfiles: ChildFireSafetyProfile[],
): string[] {
  const actions: string[] = [];

  // URGENT when policy score = 0
  if (policy.score === 0) {
    actions.push("URGENT: No fire safety policy in place — develop and implement comprehensive fire safety policy immediately");
  }

  // URGENT when staff score = 0
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff fire safety training records — schedule fire safety training for all staff immediately");
  }

  // Conditional on rates < 50
  if (quality.totalRecords > 0 && quality.drillCompletedSuccessfullyRate < 50) {
    actions.push("HIGH: Drill completion rate at " + quality.drillCompletedSuccessfullyRate + "% — review drill procedures and ensure drills are completed successfully");
  }

  if (quality.totalRecords > 0 && quality.allChildrenAccountedRate < 50) {
    actions.push("HIGH: Child accountability rate at " + quality.allChildrenAccountedRate + "% — strengthen roll-call and accountability procedures");
  }

  if (compliance.totalRecords > 0 && compliance.documentationRate < 50) {
    actions.push("HIGH: Documentation rate at " + compliance.documentationRate + "% — ensure all fire safety activities are fully documented");
  }

  if (compliance.totalRecords > 0 && compliance.timelyRecordingRate < 50) {
    actions.push("HIGH: Timely recording rate at " + compliance.timelyRecordingRate + "% — records must be completed promptly after activities");
  }

  if (quality.totalRecords > 0 && quality.evacuationTimeRecordedRate < 50) {
    actions.push("MEDIUM: Evacuation time recording at " + quality.evacuationTimeRecordedRate + "% — record evacuation times for all drills");
  }

  if (quality.totalRecords > 0 && quality.equipmentFunctionalRate < 50) {
    actions.push("MEDIUM: Equipment functionality at " + quality.equipmentFunctionalRate + "% — arrange urgent equipment inspections and repairs");
  }

  if (staff.totalStaff > 0 && staff.fireWardenTrainingRate < 50) {
    actions.push("MEDIUM: Fire warden training at " + staff.fireWardenTrainingRate + "% — schedule fire warden training for more staff");
  }

  // Children with low scores
  const lowScoreChildren = childProfiles.filter((p) => p.fireSafetyScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low fire safety scores — review individual fire safety provisions");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Fire safety systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ─────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "Regulatory Reform (Fire Safety) Order 2005",
    "CHR 2015 Reg 25 — Fire precautions",
    "CHR 2015 Reg 44 — Independent person: visits",
    "SCCIF — Safety: fire safety compliance",
    "NMS 10 — Premises and safety",
    "Health and Safety at Work Act 1974 — Fire safety duties",
    "Quality Standards 2015 — Standard 6 (safe premises)",
  ];
}
