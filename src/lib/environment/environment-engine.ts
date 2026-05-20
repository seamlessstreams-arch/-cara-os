/* ──────────────────────────────────────────────────────────────
   Environment Intelligence Engine

   Pure deterministic engine for evaluating the quality and safety
   of the physical environment, premises, bedrooms, communal spaces,
   outdoor areas, accessibility, and maintenance in children's homes.

   Regulatory basis:
     - CHR 2015 Reg 12 — The health and well-being standard
     - CHR 2015 Reg 13 — The protection of children standard
     - CHR 2015 Reg 25 — Premises (maintained, safe, suitable)
     - SCCIF — Experiences and progress of children (safe environment)
     - Health and Safety at Work Act 1974
     - Regulatory Reform (Fire Safety) Order 2005
     - The Equality Act 2010 — Accessibility and reasonable adjustments

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type EnvironmentCategory =
  | "bedroom_personalisation"
  | "communal_spaces"
  | "outdoor_areas"
  | "safety_compliance"
  | "cleanliness_hygiene"
  | "maintenance_repairs"
  | "accessibility"
  | "sensory_environment";

export type EnvironmentOutcome =
  | "fully_met"
  | "partially_met"
  | "not_met"
  | "in_progress"
  | "not_applicable"
  | "deferred";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const environmentCategoryLabels: Record<EnvironmentCategory, string> = {
  bedroom_personalisation: "Bedroom Personalisation",
  communal_spaces: "Communal Spaces",
  outdoor_areas: "Outdoor Areas",
  safety_compliance: "Safety Compliance",
  cleanliness_hygiene: "Cleanliness & Hygiene",
  maintenance_repairs: "Maintenance & Repairs",
  accessibility: "Accessibility",
  sensory_environment: "Sensory Environment",
};

const environmentOutcomeLabels: Record<EnvironmentOutcome, string> = {
  fully_met: "Fully Met",
  partially_met: "Partially Met",
  not_met: "Not Met",
  in_progress: "In Progress",
  not_applicable: "Not Applicable",
  deferred: "Deferred",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getEnvironmentCategoryLabel(category: EnvironmentCategory): string {
  return environmentCategoryLabels[category];
}

export function getEnvironmentOutcomeLabel(outcome: EnvironmentOutcome): string {
  return environmentOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface EnvironmentRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  category: EnvironmentCategory;
  adequate: boolean;
  childInvolved: boolean;
  actionTaken: boolean;
  documented: boolean;
  timelyCompletion: boolean;
  childFeedbackSought: boolean;
}

export interface EnvironmentPolicy {
  id: string;
  environmentPolicy: boolean;
  bedroomStandards: boolean;
  communalSpaceGuidelines: boolean;
  outdoorAreaMaintenance: boolean;
  healthSafetyCompliance: boolean;
  accessibilityPlan: boolean;
  regularInspectionSchedule: boolean;
}

export interface StaffEnvironmentTraining {
  id: string;
  staffId: string;
  staffName: string;
  environmentalAwareness: boolean;
  healthSafetyKnowledge: boolean;
  maintenanceSkills: boolean;
  childParticipation: boolean;
  riskAssessment: boolean;
  infectionControl: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface EnvironmentQualityResult {
  totalRecords: number;
  adequateRate: number;
  childInvolvedRate: number;
  documentedRate: number;
  childFeedbackSoughtRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface EnvironmentComplianceResult {
  totalRecords: number;
  actionTakenRate: number;
  timelyCompletionRate: number;
  adequateRate: number;
  categoryDiversityRate: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface EnvironmentPolicyResult {
  environmentPolicy: boolean;
  bedroomStandards: boolean;
  communalSpaceGuidelines: boolean;
  outdoorAreaMaintenance: boolean;
  healthSafetyCompliance: boolean;
  accessibilityPlan: boolean;
  regularInspectionSchedule: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface StaffEnvironmentReadinessResult {
  totalStaff: number;
  environmentalAwarenessRate: number;
  healthSafetyKnowledgeRate: number;
  maintenanceSkillsRate: number;
  childParticipationRate: number;
  riskAssessmentRate: number;
  infectionControlRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildEnvironmentProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  adequateRate: number;
  childInvolvedRate: number;
  uniqueCategories: number;
  environmentScore: number;
}

export interface EnvironmentIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  environmentQuality: EnvironmentQualityResult;
  environmentCompliance: EnvironmentComplianceResult;
  environmentPolicy: EnvironmentPolicyResult;
  staffReadiness: StaffEnvironmentReadinessResult;
  childProfiles: ChildEnvironmentProfile[];
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

// ── Evaluator 1: Environment Quality (0-25) ──────────────────────────────

export function evaluateEnvironmentQuality(
  records: EnvironmentRecord[],
): EnvironmentQualityResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      adequateRate: 0,
      childInvolvedRate: 0,
      documentedRate: 0,
      childFeedbackSoughtRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No environment records logged — environment quality cannot be assessed"],
    };
  }

  const adequateCount = records.filter((r) => r.adequate).length;
  const adequateRate = pct(adequateCount, totalRecords);

  const childInvolvedCount = records.filter((r) => r.childInvolved).length;
  const childInvolvedRate = pct(childInvolvedCount, totalRecords);

  const documentedCount = records.filter((r) => r.documented).length;
  const documentedRate = pct(documentedCount, totalRecords);

  const feedbackCount = records.filter((r) => r.childFeedbackSought).length;
  const childFeedbackSoughtRate = pct(feedbackCount, totalRecords);

  // Weights: adequateRate 7 + childInvolvedRate 6 + documentedRate 6 + childFeedbackSoughtRate 6 = 25
  let score = 0;
  score += (adequateRate / 100) * 7;
  score += (childInvolvedRate / 100) * 6;
  score += (documentedRate / 100) * 6;
  score += (childFeedbackSoughtRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (adequateRate >= 80) {
    strengths.push("Strong environment adequacy: " + adequateRate + "% of assessments meet standards");
  } else if (adequateRate < 50) {
    concerns.push("Environment adequacy rate at " + adequateRate + "% — significant improvement needed");
  }

  if (childInvolvedRate >= 80) {
    strengths.push("Excellent child involvement: " + childInvolvedRate + "% of assessments involved children");
  } else if (childInvolvedRate < 50) {
    concerns.push("Child involvement rate at " + childInvolvedRate + "% — children not consistently included in environment decisions");
  }

  if (documentedRate >= 90) {
    strengths.push("Thorough documentation: " + documentedRate + "% of environment checks fully documented");
  } else if (documentedRate < 60) {
    concerns.push("Documentation rate at " + documentedRate + "% — environment records incomplete");
  }

  if (childFeedbackSoughtRate >= 80) {
    strengths.push("Good feedback practice: " + childFeedbackSoughtRate + "% of assessments sought child feedback");
  } else if (childFeedbackSoughtRate < 50) {
    concerns.push("Child feedback sought at " + childFeedbackSoughtRate + "% — children's views on their environment not consistently gathered");
  }

  return {
    totalRecords,
    adequateRate,
    childInvolvedRate,
    documentedRate,
    childFeedbackSoughtRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Environment Compliance (0-25) ──────────────────────────

export function evaluateEnvironmentCompliance(
  records: EnvironmentRecord[],
): EnvironmentComplianceResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      actionTakenRate: 0,
      timelyCompletionRate: 0,
      adequateRate: 0,
      categoryDiversityRate: 0,
      uniqueCategories: 0,
      score: 0,
      strengths: [],
      concerns: ["No environment records logged — compliance cannot be assessed"],
    };
  }

  const actionTakenCount = records.filter((r) => r.actionTaken).length;
  const actionTakenRate = pct(actionTakenCount, totalRecords);

  const timelyCount = records.filter((r) => r.timelyCompletion).length;
  const timelyCompletionRate = pct(timelyCount, totalRecords);

  const adequateCount = records.filter((r) => r.adequate).length;
  const adequateRate = pct(adequateCount, totalRecords);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRate = pct(uniqueCategories, 8);

  // Weights: actionTakenRate 8 + timelyCompletionRate 7 + adequateRate 5 + categoryDiversityRate 5 = 25
  let score = 0;
  score += (actionTakenRate / 100) * 8;
  score += (timelyCompletionRate / 100) * 7;
  score += (adequateRate / 100) * 5;
  score += (categoryDiversityRate / 100) * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (actionTakenRate >= 90) {
    strengths.push("Excellent action response: " + actionTakenRate + "% of identified issues had actions taken");
  } else if (actionTakenRate < 50) {
    concerns.push("Action taken rate at " + actionTakenRate + "% — identified issues not consistently addressed");
  }

  if (timelyCompletionRate >= 90) {
    strengths.push("Strong timely completion: " + timelyCompletionRate + "% of environment tasks completed on time");
  } else if (timelyCompletionRate < 50) {
    concerns.push("Timely completion rate at " + timelyCompletionRate + "% — environment tasks delayed");
  }

  if (adequateRate >= 80) {
    strengths.push("Good compliance standard: " + adequateRate + "% of checks met adequacy threshold");
  } else if (adequateRate < 50) {
    concerns.push("Adequacy rate at " + adequateRate + "% — environment standards not consistently met");
  }

  if (uniqueCategories >= 6) {
    strengths.push("Comprehensive environment coverage: " + uniqueCategories + " of 8 categories assessed");
  } else if (uniqueCategories <= 2) {
    concerns.push("Only " + uniqueCategories + " environment category(ies) covered — limited scope of assessment");
  }

  return {
    totalRecords,
    actionTakenRate,
    timelyCompletionRate,
    adequateRate,
    categoryDiversityRate,
    uniqueCategories,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Environment Policy (0-25) ──────────────────────────────

export function evaluateEnvironmentPolicy(
  policy: EnvironmentPolicy | null,
): EnvironmentPolicyResult {
  if (policy === null) {
    return {
      environmentPolicy: false,
      bedroomStandards: false,
      communalSpaceGuidelines: false,
      outdoorAreaMaintenance: false,
      healthSafetyCompliance: false,
      accessibilityPlan: false,
      regularInspectionSchedule: false,
      score: 0,
      strengths: [],
      concerns: ["No environment policy in place — URGENT: develop comprehensive environment policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.environmentPolicy) score += 4;
  if (policy.bedroomStandards) score += 4;
  if (policy.communalSpaceGuidelines) score += 4;
  if (policy.outdoorAreaMaintenance) score += 4;
  if (policy.healthSafetyCompliance) score += 3;
  if (policy.accessibilityPlan) score += 3;
  if (policy.regularInspectionSchedule) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.environmentPolicy,
    policy.bedroomStandards,
    policy.communalSpaceGuidelines,
    policy.outdoorAreaMaintenance,
    policy.healthSafetyCompliance,
    policy.accessibilityPlan,
    policy.regularInspectionSchedule,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete environment policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 environment policy components in place");
  }

  if (!policy.environmentPolicy) {
    concerns.push("No overarching environment policy — staff may be unclear about environment standards");
  }
  if (!policy.bedroomStandards) {
    concerns.push("No bedroom standards policy — personalisation and quality may be inconsistent");
  }
  if (!policy.communalSpaceGuidelines) {
    concerns.push("No communal space guidelines — shared areas may not meet required standards");
  }
  if (!policy.outdoorAreaMaintenance) {
    concerns.push("No outdoor area maintenance policy — outdoor spaces may deteriorate");
  }
  if (!policy.healthSafetyCompliance) {
    concerns.push("No health and safety compliance framework — risk of regulatory non-compliance");
  }
  if (!policy.accessibilityPlan) {
    concerns.push("No accessibility plan — premises may not meet the needs of all children");
  }
  if (!policy.regularInspectionSchedule) {
    concerns.push("No regular inspection schedule — environment issues may go undetected");
  }

  return {
    environmentPolicy: policy.environmentPolicy,
    bedroomStandards: policy.bedroomStandards,
    communalSpaceGuidelines: policy.communalSpaceGuidelines,
    outdoorAreaMaintenance: policy.outdoorAreaMaintenance,
    healthSafetyCompliance: policy.healthSafetyCompliance,
    accessibilityPlan: policy.accessibilityPlan,
    regularInspectionSchedule: policy.regularInspectionSchedule,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Environment Readiness (0-25) ─────────────────────

export function evaluateStaffEnvironmentReadiness(
  training: StaffEnvironmentTraining[],
): StaffEnvironmentReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      environmentalAwarenessRate: 0,
      healthSafetyKnowledgeRate: 0,
      maintenanceSkillsRate: 0,
      childParticipationRate: 0,
      riskAssessmentRate: 0,
      infectionControlRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule environment training for all staff"],
    };
  }

  const awarenessCount = training.filter((t) => t.environmentalAwareness).length;
  const environmentalAwarenessRate = pct(awarenessCount, totalStaff);

  const hskCount = training.filter((t) => t.healthSafetyKnowledge).length;
  const healthSafetyKnowledgeRate = pct(hskCount, totalStaff);

  const maintCount = training.filter((t) => t.maintenanceSkills).length;
  const maintenanceSkillsRate = pct(maintCount, totalStaff);

  const participationCount = training.filter((t) => t.childParticipation).length;
  const childParticipationRate = pct(participationCount, totalStaff);

  const riskCount = training.filter((t) => t.riskAssessment).length;
  const riskAssessmentRate = pct(riskCount, totalStaff);

  const infectionCount = training.filter((t) => t.infectionControl).length;
  const infectionControlRate = pct(infectionCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (environmentalAwarenessRate / 100) * 6;
  score += (healthSafetyKnowledgeRate / 100) * 5;
  score += (maintenanceSkillsRate / 100) * 5;
  score += (childParticipationRate / 100) * 4;
  score += (riskAssessmentRate / 100) * 3;
  score += (infectionControlRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (environmentalAwarenessRate >= 80) {
    strengths.push("Strong environmental awareness: " + environmentalAwarenessRate + "% of staff");
  } else if (environmentalAwarenessRate < 50) {
    concerns.push("Environmental awareness at " + environmentalAwarenessRate + "% — foundational training needed");
  }

  if (healthSafetyKnowledgeRate >= 80) {
    strengths.push("Good health and safety knowledge: " + healthSafetyKnowledgeRate + "% of staff");
  } else if (healthSafetyKnowledgeRate < 50) {
    concerns.push("Health and safety knowledge at " + healthSafetyKnowledgeRate + "% — staff may not recognise hazards");
  }

  if (maintenanceSkillsRate >= 80) {
    strengths.push("Staff maintenance skills strong: " + maintenanceSkillsRate + "%");
  } else if (maintenanceSkillsRate < 50) {
    concerns.push("Maintenance skills at " + maintenanceSkillsRate + "% — basic repairs may be delayed");
  }

  if (childParticipationRate >= 80) {
    strengths.push("Good child participation skills: " + childParticipationRate + "% of staff skilled in involving children");
  } else if (childParticipationRate < 50) {
    concerns.push("Child participation skills at " + childParticipationRate + "% — children may not be adequately involved in environment decisions");
  }

  if (riskAssessmentRate >= 80) {
    strengths.push("Strong risk assessment capability: " + riskAssessmentRate + "% of staff");
  } else if (riskAssessmentRate < 50) {
    concerns.push("Risk assessment capability at " + riskAssessmentRate + "% — environmental risks may be overlooked");
  }

  if (infectionControlRate >= 80) {
    strengths.push("Good infection control knowledge: " + infectionControlRate + "% of staff");
  } else if (infectionControlRate < 50) {
    concerns.push("Infection control knowledge at " + infectionControlRate + "% — hygiene standards may not be maintained");
  }

  return {
    totalStaff,
    environmentalAwarenessRate,
    healthSafetyKnowledgeRate,
    maintenanceSkillsRate,
    childParticipationRate,
    riskAssessmentRate,
    infectionControlRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Environment Profiles ────────────────────────────────────

export function buildChildEnvironmentProfiles(
  records: EnvironmentRecord[],
): ChildEnvironmentProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: EnvironmentRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;

    const adequateCount = child.records.filter((r) => r.adequate).length;
    const adequateRate = pct(adequateCount, totalRecords);

    const involvedCount = child.records.filter((r) => r.childInvolved).length;
    const childInvolvedRate = pct(involvedCount, totalRecords);

    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const uniqueCategories = uniqueCategoriesSet.size;

    // frequency: >=10 records -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    // rate1 (adequateRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (adequateRate >= 80) rate1Score = 3;
    else if (adequateRate >= 60) rate1Score = 2;
    else if (adequateRate >= 40) rate1Score = 1;

    // rate2 (childInvolvedRate): same thresholds
    let rate2Score = 0;
    if (childInvolvedRate >= 80) rate2Score = 3;
    else if (childInvolvedRate >= 60) rate2Score = 2;
    else if (childInvolvedRate >= 40) rate2Score = 1;

    // diversity (unique categories): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (uniqueCategories >= 4) diversityBonus = 2;
    else if (uniqueCategories >= 2) diversityBonus = 1;

    const environmentScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalRecords,
      adequateRate,
      childInvolvedRate,
      uniqueCategories,
      environmentScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateEnvironmentIntelligence(
  records: EnvironmentRecord[],
  policy: EnvironmentPolicy | null,
  training: StaffEnvironmentTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EnvironmentIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter records to period
  const periodRecords = records.filter(
    (r) => r.date >= periodStart && r.date <= periodEnd,
  );

  // Evaluate each layer
  const environmentQuality = evaluateEnvironmentQuality(periodRecords);
  const environmentCompliance = evaluateEnvironmentCompliance(periodRecords);
  const envPolicy = evaluateEnvironmentPolicy(policy);
  const staffReadiness = evaluateStaffEnvironmentReadiness(training);

  // Build child profiles
  const childProfiles = buildChildEnvironmentProfiles(periodRecords);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      environmentQuality.score +
      environmentCompliance.score +
      envPolicy.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    environmentQuality, environmentCompliance, envPolicy, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    environmentQuality, environmentCompliance, envPolicy, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    environmentQuality, environmentCompliance, envPolicy, staffReadiness, childProfiles,
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
    environmentQuality,
    environmentCompliance,
    environmentPolicy: envPolicy,
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
  quality: EnvironmentQualityResult,
  compliance: EnvironmentComplianceResult,
  policy: EnvironmentPolicyResult,
  staff: StaffEnvironmentReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall environment management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall environment management rated Good (" + overallScore + "/100)");
  }

  // Include evaluators with score >= 20
  if (quality.score >= 20) {
    strengths.push("Environment quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Environment compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Environment policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff environment readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: EnvironmentQualityResult,
  compliance: EnvironmentComplianceResult,
  policy: EnvironmentPolicyResult,
  staff: StaffEnvironmentReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall environment management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall environment management Requires Improvement (" + overallScore + "/100)");
  }

  // Include evaluators with score < 15
  if (quality.score < 15) {
    areas.push("Environment quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Environment compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Environment policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff environment readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: EnvironmentQualityResult,
  compliance: EnvironmentComplianceResult,
  policy: EnvironmentPolicyResult,
  staff: StaffEnvironmentReadinessResult,
  childProfiles: ChildEnvironmentProfile[],
): string[] {
  const actions: string[] = [];

  // URGENT when policy score = 0
  if (policy.score === 0) {
    actions.push("URGENT: No environment policy in place — develop and implement comprehensive environment policy immediately");
  }

  // URGENT when staff score = 0
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff environment training records — schedule environment and health & safety training for all staff immediately");
  }

  // Conditional on rates < 50
  if (quality.totalRecords > 0 && quality.adequateRate < 50) {
    actions.push("HIGH: Environment adequacy rate at " + quality.adequateRate + "% — review and improve physical environment standards across the home");
  }

  if (quality.totalRecords > 0 && quality.childInvolvedRate < 50) {
    actions.push("HIGH: Child involvement rate at " + quality.childInvolvedRate + "% — embed child participation in all environment assessments and decisions");
  }

  if (compliance.totalRecords > 0 && compliance.actionTakenRate < 50) {
    actions.push("HIGH: Action taken rate at " + compliance.actionTakenRate + "% — strengthen follow-through on identified environment issues");
  }

  if (compliance.totalRecords > 0 && compliance.timelyCompletionRate < 50) {
    actions.push("HIGH: Timely completion rate at " + compliance.timelyCompletionRate + "% — review processes to ensure environment tasks are completed promptly");
  }

  if (quality.totalRecords > 0 && quality.documentedRate < 50) {
    actions.push("MEDIUM: Documentation rate at " + quality.documentedRate + "% — improve environment record-keeping practices");
  }

  if (quality.totalRecords > 0 && quality.childFeedbackSoughtRate < 50) {
    actions.push("MEDIUM: Child feedback sought at " + quality.childFeedbackSoughtRate + "% — ensure children's views on their environment are regularly gathered");
  }

  if (staff.totalStaff > 0 && staff.environmentalAwarenessRate < 50) {
    actions.push("MEDIUM: Staff environmental awareness at " + staff.environmentalAwarenessRate + "% — schedule refresher training on environment standards");
  }

  // Children with low scores
  const lowScoreChildren = childProfiles.filter((p) => p.environmentScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low environment scores — review individual environment and bedroom personalisation arrangements");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Environment systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ─────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 12 — The health and well-being standard",
    "CHR 2015 Regulation 13 — The protection of children standard",
    "CHR 2015 Regulation 25 — Premises (maintained, safe, suitable for purpose)",
    "SCCIF — Experiences and progress of children (safe, well-maintained environment)",
    "Health and Safety at Work Act 1974 — Employer duties for safe premises",
    "Regulatory Reform (Fire Safety) Order 2005 — Fire safety in residential premises",
    "The Equality Act 2010 — Accessibility and reasonable adjustments for disabled children",
  ];
}
