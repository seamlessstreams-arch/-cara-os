// ══════════════════════════════════════════════════════════════════════════════
// Cara — Equality & Diversity Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// Regulatory framework:
//   Equality Act 2010        — Protected characteristics; reasonable adjustments
//   CHR 2015 Reg 5           — Quality and purpose of care
//   CHR 2015 Reg 6           — The children's home is child-focused
//   CHR 2015 Reg 7           — Protection of children
//   UNCRC Article 2          — Non-discrimination
//   UNCRC Article 8          — Preservation of identity
//   UNCRC Article 30         — Right to enjoy own culture, religion, language
//   SCCIF                    — "Children are treated as individuals"
//   KCSIE 2024               — Keeping Children Safe in Education (equality)
//   NMS 7                    — Safeguarding and child protection
//
// Scoring breakdown (0–100):
//   Individual support:        30  — How well each child's characteristics are supported
//   Staff competency:          25  — EDI training compliance and breadth
//   Incident response:         25  — Resolution, learning, and escalation management
//   Accessibility/inclusion:   20  — Physical, communication, info, and activity access
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProtectedCharacteristic =
  | "age"
  | "disability"
  | "gender_reassignment"
  | "race"
  | "religion_or_belief"
  | "sex"
  | "sexual_orientation"
  | "pregnancy_and_maternity"
  | "marriage_and_civil_partnership";

export type SupportStatus =
  | "fully_supported"
  | "partially_supported"
  | "not_supported"
  | "not_applicable";

export type TrainingStatus =
  | "completed"
  | "booked"
  | "overdue"
  | "not_required";

export type IncidentCategory =
  | "discrimination"
  | "bullying"
  | "hate_incident"
  | "cultural_insensitivity"
  | "language_barrier"
  | "accessibility_barrier";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export type IncidentOutcome =
  | "resolved"
  | "ongoing"
  | "escalated"
  | "lessons_learned";

export type CulturalPlanStatus =
  | "active"
  | "review_due"
  | "not_in_place"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface ChildDiversityProfile {
  id: string;
  childId: string;
  childName: string;
  characteristics: {
    characteristic: ProtectedCharacteristic;
    details: string;
    supportStatus: SupportStatus;
  }[];
  culturalPlanStatus: CulturalPlanStatus;
  culturalPlanLastReviewed?: string;
  dietaryNeedsMet: boolean;
  religiousPracticeFacilitated: boolean;
  languageSupportProvided: boolean;
  identityWorkCompleted: boolean;
  lastAssessedDate: string;
  assessedBy: string;
}

export interface EDITrainingRecord {
  id: string;
  staffId: string;
  staffName: string;
  trainingType: string;
  status: TrainingStatus;
  completedDate?: string;
  expiryDate?: string;
}

export interface EDIIncident {
  id: string;
  reportDate: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  childInvolved: boolean;
  childId?: string;
  description: string;
  outcome: IncidentOutcome;
  lessonsIdentified: boolean;
  actionsTaken: string[];
}

export interface AccessibilityAudit {
  id: string;
  auditDate: string;
  physicalAccessScore: number;
  communicationAccessScore: number;
  informationAccessScore: number;
  activityAccessScore: number;
  auditor: string;
  improvementsIdentified: number;
  improvementsCompleted: number;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface IndividualSupportResult {
  totalChildren: number;
  fullySupported: number;
  partiallySupportedCount: number;
  notSupportedCount: number;
  fullySupportedRate: number;
  culturalPlanCoverage: number;
  dietaryRate: number;
  religiousRate: number;
  languageRate: number;
  identityWorkRate: number;
  allAssessedWithin90Days: boolean;
  score: number;
}

export interface StaffCompetencyResult {
  totalStaff: number;
  completedCount: number;
  completionRate: number;
  overdueCount: number;
  expiredCount: number;
  trainingTypes: string[];
  uniqueTrainingTypesCount: number;
  hasEqualityActTraining: boolean;
  hasCulturalCompetencyTraining: boolean;
  coverageRate: number;
  score: number;
}

export interface IncidentResponseResult {
  totalIncidents: number;
  resolvedCount: number;
  resolutionRate: number;
  lessonsIdentifiedCount: number;
  lessonsRate: number;
  averageActionsPerIncident: number;
  unresolvedCriticalOrHigh: number;
  escalatedCount: number;
  escalationRate: number;
  allLessonsIdentified: boolean;
  score: number;
}

export interface AccessibilityInclusionResult {
  totalAudits: number;
  latestPhysicalScore: number;
  latestCommunicationScore: number;
  latestInformationScore: number;
  latestActivityScore: number;
  improvementRate: number;
  allScoresAbove9: boolean;
  score: number;
}

export interface ChildEDISummary {
  childId: string;
  childName: string;
  characteristicCount: number;
  fullySupportedCount: number;
  supportRate: number;
  culturalPlanStatus: CulturalPlanStatus;
  dietaryNeedsMet: boolean;
  religiousPracticeFacilitated: boolean;
  languageSupportProvided: boolean;
  identityWorkCompleted: boolean;
  primaryConcern?: string;
}

export interface EqualityDiversityIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  individualSupport: IndividualSupportResult;
  staffCompetency: StaffCompetencyResult;
  incidentResponse: IncidentResponseResult;
  accessibilityInclusion: AccessibilityInclusionResult;
  childSummaries: ChildEDISummary[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Labels ────────────────────────────────────────────────────────────────────

const PROTECTED_CHARACTERISTIC_LABELS: Record<ProtectedCharacteristic, string> = {
  age: "Age",
  disability: "Disability",
  gender_reassignment: "Gender Reassignment",
  race: "Race",
  religion_or_belief: "Religion or Belief",
  sex: "Sex",
  sexual_orientation: "Sexual Orientation",
  pregnancy_and_maternity: "Pregnancy and Maternity",
  marriage_and_civil_partnership: "Marriage and Civil Partnership",
};

const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  fully_supported: "Fully Supported",
  partially_supported: "Partially Supported",
  not_supported: "Not Supported",
  not_applicable: "Not Applicable",
};

const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  completed: "Completed",
  booked: "Booked",
  overdue: "Overdue",
  not_required: "Not Required",
};

const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  discrimination: "Discrimination",
  bullying: "Bullying",
  hate_incident: "Hate Incident",
  cultural_insensitivity: "Cultural Insensitivity",
  language_barrier: "Language Barrier",
  accessibility_barrier: "Accessibility Barrier",
};

const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const INCIDENT_OUTCOME_LABELS: Record<IncidentOutcome, string> = {
  resolved: "Resolved",
  ongoing: "Ongoing",
  escalated: "Escalated",
  lessons_learned: "Lessons Learned",
};

const CULTURAL_PLAN_STATUS_LABELS: Record<CulturalPlanStatus, string> = {
  active: "Active",
  review_due: "Review Due",
  not_in_place: "Not in Place",
  not_applicable: "Not Applicable",
};

export function getProtectedCharacteristicLabel(c: ProtectedCharacteristic): string {
  return PROTECTED_CHARACTERISTIC_LABELS[c] ?? c.replace(/_/g, " ");
}

export function getSupportStatusLabel(s: SupportStatus): string {
  return SUPPORT_STATUS_LABELS[s] ?? s.replace(/_/g, " ");
}

export function getTrainingStatusLabel(s: TrainingStatus): string {
  return TRAINING_STATUS_LABELS[s] ?? s.replace(/_/g, " ");
}

export function getIncidentCategoryLabel(c: IncidentCategory): string {
  return INCIDENT_CATEGORY_LABELS[c] ?? c.replace(/_/g, " ");
}

export function getIncidentSeverityLabel(s: IncidentSeverity): string {
  return INCIDENT_SEVERITY_LABELS[s] ?? s.replace(/_/g, " ");
}

export function getIncidentOutcomeLabel(o: IncidentOutcome): string {
  return INCIDENT_OUTCOME_LABELS[o] ?? o.replace(/_/g, " ");
}

export function getCulturalPlanStatusLabel(s: CulturalPlanStatus): string {
  return CULTURAL_PLAN_STATUS_LABELS[s] ?? s.replace(/_/g, " ");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Core Evaluation Functions ─────────────────────────────────────────────────

/**
 * Evaluates how well each child's protected characteristics are individually
 * supported, including cultural plans, dietary, religious, language, and
 * identity work.
 *
 * Score 0–30:
 *   +8  for % children fully supported across all characteristics
 *   +5  for cultural plan coverage (active or not_applicable)
 *   +4  dietary needs met rate
 *   +4  religious practice facilitated rate
 *   +3  language support provided rate
 *   +3  identity work completed rate
 *   +3  bonus — all children assessed within 90 days
 */
export function evaluateIndividualSupport(
  profiles: ChildDiversityProfile[],
  periodEnd: string,
): IndividualSupportResult {
  const totalChildren = profiles.length;

  if (totalChildren === 0) {
    return {
      totalChildren: 0,
      fullySupported: 0,
      partiallySupportedCount: 0,
      notSupportedCount: 0,
      fullySupportedRate: 0,
      culturalPlanCoverage: 0,
      dietaryRate: 0,
      religiousRate: 0,
      languageRate: 0,
      identityWorkRate: 0,
      allAssessedWithin90Days: false,
      score: 0,
    };
  }

  // Fully supported: every characteristic for this child is fully_supported or not_applicable
  const fullySupported = profiles.filter((p) =>
    p.characteristics.length > 0 &&
    p.characteristics.every(
      (c) => c.supportStatus === "fully_supported" || c.supportStatus === "not_applicable",
    ),
  ).length;

  const partiallySupportedCount = profiles.filter((p) =>
    p.characteristics.some((c) => c.supportStatus === "partially_supported") &&
    !p.characteristics.some((c) => c.supportStatus === "not_supported"),
  ).length;

  const notSupportedCount = profiles.filter((p) =>
    p.characteristics.some((c) => c.supportStatus === "not_supported"),
  ).length;

  const fullySupportedRate = pct(fullySupported, totalChildren);

  // Cultural plan coverage: active or not_applicable
  const culturalPlanOk = profiles.filter(
    (p) => p.culturalPlanStatus === "active" || p.culturalPlanStatus === "not_applicable",
  ).length;
  const culturalPlanCoverage = pct(culturalPlanOk, totalChildren);

  // Rates
  const dietaryRate = pct(
    profiles.filter((p) => p.dietaryNeedsMet).length,
    totalChildren,
  );
  const religiousRate = pct(
    profiles.filter((p) => p.religiousPracticeFacilitated).length,
    totalChildren,
  );
  const languageRate = pct(
    profiles.filter((p) => p.languageSupportProvided).length,
    totalChildren,
  );
  const identityWorkRate = pct(
    profiles.filter((p) => p.identityWorkCompleted).length,
    totalChildren,
  );

  // Assessed within 90 days
  const allAssessedWithin90Days = profiles.every(
    (p) => daysBetween(p.lastAssessedDate, periodEnd) <= 90,
  );

  // Scoring
  let score = 0;
  score += Math.round((fullySupportedRate / 100) * 8);
  score += Math.round((culturalPlanCoverage / 100) * 5);
  score += Math.round((dietaryRate / 100) * 4);
  score += Math.round((religiousRate / 100) * 4);
  score += Math.round((languageRate / 100) * 3);
  score += Math.round((identityWorkRate / 100) * 3);
  if (allAssessedWithin90Days) score += 3;

  score = clamp(score, 0, 30);

  return {
    totalChildren,
    fullySupported,
    partiallySupportedCount,
    notSupportedCount,
    fullySupportedRate,
    culturalPlanCoverage,
    dietaryRate,
    religiousRate,
    languageRate,
    identityWorkRate,
    allAssessedWithin90Days,
    score,
  };
}

/**
 * Evaluates staff EDI training competency.
 *
 * Score 0–25:
 *   +10/7/4  completion rate tiers (≥90% / ≥70% / ≥50%)
 *   +5       no overdue training
 *   +4       coverage — 3+ unique training types
 *   +3       no expired training
 *   +3       bonus — has both equality_act and cultural_competency
 */
export function evaluateStaffCompetency(
  trainingRecords: EDITrainingRecord[],
  totalStaff: number,
): StaffCompetencyResult {
  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      completedCount: 0,
      completionRate: 0,
      overdueCount: 0,
      expiredCount: 0,
      trainingTypes: [],
      uniqueTrainingTypesCount: 0,
      hasEqualityActTraining: false,
      hasCulturalCompetencyTraining: false,
      coverageRate: 0,
      score: 0,
    };
  }

  const completed = trainingRecords.filter((r) => r.status === "completed");
  // Unique staff who have completed training
  const staffWithCompletedTraining = new Set(completed.map((r) => r.staffId));
  const completedCount = staffWithCompletedTraining.size;
  const completionRate = pct(completedCount, totalStaff);

  const overdueCount = trainingRecords.filter((r) => r.status === "overdue").length;

  // Expired: completed but past expiry
  const now = new Date().toISOString().slice(0, 10);
  const expiredCount = trainingRecords.filter(
    (r) => r.status === "completed" && r.expiryDate && r.expiryDate < now,
  ).length;

  // Training types
  const trainingTypesSet = new Set(completed.map((r) => r.trainingType));
  const trainingTypes = Array.from(trainingTypesSet).sort();
  const uniqueTrainingTypesCount = trainingTypes.length;

  const hasEqualityActTraining = trainingTypes.some(
    (t) => t.toLowerCase().includes("equality") && t.toLowerCase().includes("act"),
  );
  const hasCulturalCompetencyTraining = trainingTypes.some(
    (t) => t.toLowerCase().includes("cultural") && t.toLowerCase().includes("competency"),
  );

  // Coverage rate: staff with at least one completed training / total staff
  const coverageRate = completionRate;

  // Scoring
  let score = 0;

  // Completion rate tiers
  if (completionRate >= 90) score += 10;
  else if (completionRate >= 70) score += 7;
  else if (completionRate >= 50) score += 4;

  // No overdue
  if (overdueCount === 0) score += 5;

  // Coverage: 3+ unique training types
  if (uniqueTrainingTypesCount >= 3) score += 4;

  // No expired
  if (expiredCount === 0) score += 3;

  // Bonus: both equality_act and cultural_competency
  if (hasEqualityActTraining && hasCulturalCompetencyTraining) score += 3;

  score = clamp(score, 0, 25);

  return {
    totalStaff,
    completedCount,
    completionRate,
    overdueCount,
    expiredCount,
    trainingTypes,
    uniqueTrainingTypesCount,
    hasEqualityActTraining,
    hasCulturalCompetencyTraining,
    coverageRate,
    score,
  };
}

/**
 * Evaluates how EDI incidents are responded to and learned from.
 *
 * Score 0–25:
 *   No incidents:  score = 20, +5 bonus
 *   With incidents:
 *     +8  resolution rate ≥ 90%
 *     +5  lessons identified ≥ 80%
 *     +4  average actions per incident ≥ 2
 *     +3  no unresolved critical/high
 *     +3  escalation rate < 20%
 *     +2  all lessons identified
 */
export function evaluateIncidentResponse(
  incidents: EDIIncident[],
): IncidentResponseResult {
  const totalIncidents = incidents.length;

  if (totalIncidents === 0) {
    return {
      totalIncidents: 0,
      resolvedCount: 0,
      resolutionRate: 0,
      lessonsIdentifiedCount: 0,
      lessonsRate: 0,
      averageActionsPerIncident: 0,
      unresolvedCriticalOrHigh: 0,
      escalatedCount: 0,
      escalationRate: 0,
      allLessonsIdentified: true,
      score: 25,
    };
  }

  const resolvedCount = incidents.filter(
    (i) => i.outcome === "resolved" || i.outcome === "lessons_learned",
  ).length;
  const resolutionRate = pct(resolvedCount, totalIncidents);

  const lessonsIdentifiedCount = incidents.filter((i) => i.lessonsIdentified).length;
  const lessonsRate = pct(lessonsIdentifiedCount, totalIncidents);

  const totalActions = incidents.reduce((sum, i) => sum + i.actionsTaken.length, 0);
  const averageActionsPerIncident =
    Math.round((totalActions / totalIncidents) * 10) / 10;

  const unresolvedCriticalOrHigh = incidents.filter(
    (i) =>
      (i.severity === "critical" || i.severity === "high") &&
      i.outcome !== "resolved" &&
      i.outcome !== "lessons_learned",
  ).length;

  const escalatedCount = incidents.filter((i) => i.outcome === "escalated").length;
  const escalationRate = pct(escalatedCount, totalIncidents);

  const allLessonsIdentified = incidents.every((i) => i.lessonsIdentified);

  // Scoring
  let score = 0;
  if (resolutionRate >= 90) score += 8;
  if (lessonsRate >= 80) score += 5;
  if (averageActionsPerIncident >= 2) score += 4;
  if (unresolvedCriticalOrHigh === 0) score += 3;
  if (escalationRate < 20) score += 3;
  if (allLessonsIdentified) score += 2;

  score = clamp(score, 0, 25);

  return {
    totalIncidents,
    resolvedCount,
    resolutionRate,
    lessonsIdentifiedCount,
    lessonsRate,
    averageActionsPerIncident,
    unresolvedCriticalOrHigh,
    escalatedCount,
    escalationRate,
    allLessonsIdentified,
    score,
  };
}

/**
 * Evaluates accessibility and inclusion based on audit scores.
 *
 * Score 0–20:
 *   No audits: 0
 *   +5  latest physical access score ≥ 8
 *   +4  latest communication access score ≥ 8
 *   +3  latest information access score ≥ 8
 *   +3  latest activity access score ≥ 8
 *   +3  improvement completion rate ≥ 80%
 *   +2  bonus — all latest scores ≥ 9
 */
export function evaluateAccessibilityInclusion(
  audits: AccessibilityAudit[],
): AccessibilityInclusionResult {
  if (audits.length === 0) {
    return {
      totalAudits: 0,
      latestPhysicalScore: 0,
      latestCommunicationScore: 0,
      latestInformationScore: 0,
      latestActivityScore: 0,
      improvementRate: 0,
      allScoresAbove9: false,
      score: 0,
    };
  }

  // Sort audits by date descending to get latest
  const sorted = [...audits].sort((a, b) => b.auditDate.localeCompare(a.auditDate));
  const latest = sorted[0];

  const latestPhysicalScore = latest.physicalAccessScore;
  const latestCommunicationScore = latest.communicationAccessScore;
  const latestInformationScore = latest.informationAccessScore;
  const latestActivityScore = latest.activityAccessScore;

  // Improvement rate across all audits
  const totalIdentified = audits.reduce((s, a) => s + a.improvementsIdentified, 0);
  const totalCompleted = audits.reduce((s, a) => s + a.improvementsCompleted, 0);
  const improvementRate = pct(totalCompleted, totalIdentified);

  const allScoresAbove9 =
    latestPhysicalScore >= 9 &&
    latestCommunicationScore >= 9 &&
    latestInformationScore >= 9 &&
    latestActivityScore >= 9;

  // Scoring
  let score = 0;
  if (latestPhysicalScore >= 8) score += 5;
  if (latestCommunicationScore >= 8) score += 4;
  if (latestInformationScore >= 8) score += 3;
  if (latestActivityScore >= 8) score += 3;
  if (improvementRate >= 80) score += 3;
  if (allScoresAbove9) score += 2;

  score = clamp(score, 0, 20);

  return {
    totalAudits: audits.length,
    latestPhysicalScore,
    latestCommunicationScore,
    latestInformationScore,
    latestActivityScore,
    improvementRate,
    allScoresAbove9,
    score,
  };
}

// ── Child Summaries ───────────────────────────────────────────────────────────

function buildChildSummaries(profiles: ChildDiversityProfile[]): ChildEDISummary[] {
  return profiles.map((p) => {
    const applicableChars = p.characteristics.filter(
      (c) => c.supportStatus !== "not_applicable",
    );
    const fullySupportedCount = applicableChars.filter(
      (c) => c.supportStatus === "fully_supported",
    ).length;
    const supportRate = pct(fullySupportedCount, applicableChars.length);

    // Primary concern
    let primaryConcern: string | undefined;
    const notSupported = p.characteristics.filter(
      (c) => c.supportStatus === "not_supported",
    );
    if (notSupported.length > 0) {
      primaryConcern = `${notSupported.length} protected characteristic${notSupported.length !== 1 ? "s" : ""} not supported`;
    } else if (p.culturalPlanStatus === "not_in_place") {
      primaryConcern = "Cultural support plan not in place";
    } else if (p.culturalPlanStatus === "review_due") {
      primaryConcern = "Cultural support plan review overdue";
    } else if (!p.dietaryNeedsMet) {
      primaryConcern = "Dietary needs not being met";
    } else if (!p.religiousPracticeFacilitated) {
      primaryConcern = "Religious practice not being facilitated";
    } else if (!p.languageSupportProvided) {
      primaryConcern = "Language support not provided";
    } else if (!p.identityWorkCompleted) {
      primaryConcern = "Identity work not yet completed";
    }

    return {
      childId: p.childId,
      childName: p.childName,
      characteristicCount: p.characteristics.length,
      fullySupportedCount,
      supportRate,
      culturalPlanStatus: p.culturalPlanStatus,
      dietaryNeedsMet: p.dietaryNeedsMet,
      religiousPracticeFacilitated: p.religiousPracticeFacilitated,
      languageSupportProvided: p.languageSupportProvided,
      identityWorkCompleted: p.identityWorkCompleted,
      primaryConcern,
    };
  });
}

// ── Strengths / Areas / Actions ───────────────────────────────────────────────

function generateStrengths(
  support: IndividualSupportResult,
  competency: StaffCompetencyResult,
  incidents: IncidentResponseResult,
  accessibility: AccessibilityInclusionResult,
): string[] {
  const strengths: string[] = [];

  if (support.fullySupportedRate === 100) {
    strengths.push("All children's protected characteristics are fully supported");
  }
  if (support.culturalPlanCoverage === 100) {
    strengths.push("Cultural support plans are in place for all children who need them");
  }
  if (support.dietaryRate === 100 && support.religiousRate === 100) {
    strengths.push("Dietary and religious needs are met for all children");
  }
  if (support.allAssessedWithin90Days) {
    strengths.push("All equality assessments are up to date (within 90 days)");
  }
  if (competency.completionRate >= 90) {
    strengths.push("Excellent staff EDI training completion rate");
  }
  if (competency.overdueCount === 0 && competency.totalStaff > 0) {
    strengths.push("No overdue EDI training across the staff team");
  }
  if (competency.hasEqualityActTraining && competency.hasCulturalCompetencyTraining) {
    strengths.push("Staff trained in both Equality Act and cultural competency");
  }
  if (incidents.totalIncidents === 0) {
    strengths.push("No EDI incidents recorded in the period");
  }
  if (incidents.totalIncidents > 0 && incidents.resolutionRate === 100) {
    strengths.push("All EDI incidents have been fully resolved");
  }
  if (incidents.allLessonsIdentified && incidents.totalIncidents > 0) {
    strengths.push("Lessons identified from all incidents — strong learning culture");
  }
  if (accessibility.allScoresAbove9) {
    strengths.push("Excellent accessibility scores across all domains");
  }
  if (accessibility.improvementRate >= 80 && accessibility.totalAudits > 0) {
    strengths.push("Strong completion rate for identified accessibility improvements");
  }

  if (strengths.length === 0) {
    strengths.push("No significant strengths identified in this period");
  }

  return strengths;
}

function generateAreasForDevelopment(
  support: IndividualSupportResult,
  competency: StaffCompetencyResult,
  incidents: IncidentResponseResult,
  accessibility: AccessibilityInclusionResult,
): string[] {
  const areas: string[] = [];

  if (support.fullySupportedRate < 100 && support.totalChildren > 0) {
    areas.push(
      `${support.totalChildren - support.fullySupported} child${support.totalChildren - support.fullySupported !== 1 ? "ren" : ""} have characteristics not yet fully supported`,
    );
  }
  if (support.culturalPlanCoverage < 100 && support.totalChildren > 0) {
    areas.push("Cultural support plan coverage needs improvement");
  }
  if (support.identityWorkRate < 100 && support.totalChildren > 0) {
    areas.push("Identity work not yet completed for all children");
  }
  if (!support.allAssessedWithin90Days && support.totalChildren > 0) {
    areas.push("Some equality assessments are overdue for review");
  }
  if (competency.completionRate < 90 && competency.totalStaff > 0) {
    areas.push("Staff EDI training completion rate below target");
  }
  if (competency.uniqueTrainingTypesCount < 3) {
    areas.push("Limited variety of EDI training types — broaden training programme");
  }
  if (incidents.totalIncidents > 0 && incidents.resolutionRate < 90) {
    areas.push("Incident resolution rate requires improvement");
  }
  if (incidents.totalIncidents > 0 && incidents.lessonsRate < 80) {
    areas.push("Lessons not consistently identified from EDI incidents");
  }
  if (accessibility.totalAudits === 0) {
    areas.push("No accessibility audits completed — schedule an audit");
  }
  if (accessibility.improvementRate < 80 && accessibility.totalAudits > 0) {
    areas.push("Accessibility improvement completion rate below target");
  }

  return areas;
}

function generateImmediateActions(
  support: IndividualSupportResult,
  competency: StaffCompetencyResult,
  incidents: IncidentResponseResult,
  accessibility: AccessibilityInclusionResult,
  childSummaries: ChildEDISummary[],
): string[] {
  const actions: string[] = [];

  // Unsupported characteristics
  const unsupported = childSummaries.filter(
    (c) => c.supportRate < 100 && c.characteristicCount > 0,
  );
  if (unsupported.length > 0) {
    actions.push(
      `Review support arrangements for ${unsupported.map((c) => c.childName).join(", ")}`,
    );
  }

  // Missing cultural plans
  const missingPlans = childSummaries.filter(
    (c) => c.culturalPlanStatus === "not_in_place",
  );
  if (missingPlans.length > 0) {
    actions.push(
      `Create cultural support plans for ${missingPlans.map((c) => c.childName).join(", ")}`,
    );
  }

  // Overdue training
  if (competency.overdueCount > 0) {
    actions.push(`Address ${competency.overdueCount} overdue EDI training record${competency.overdueCount !== 1 ? "s" : ""}`);
  }

  // Unresolved critical/high incidents
  if (incidents.unresolvedCriticalOrHigh > 0) {
    actions.push(
      `Urgently resolve ${incidents.unresolvedCriticalOrHigh} critical/high severity EDI incident${incidents.unresolvedCriticalOrHigh !== 1 ? "s" : ""}`,
    );
  }

  // Accessibility audit needed
  if (accessibility.totalAudits === 0) {
    actions.push("Commission an accessibility audit of the home");
  }

  // Expired training
  if (competency.expiredCount > 0) {
    actions.push(
      `Renew ${competency.expiredCount} expired EDI training certificate${competency.expiredCount !== 1 ? "s" : ""}`,
    );
  }

  return actions;
}

// ── Main Intelligence Function ────────────────────────────────────────────────

export function generateEqualityDiversityIntelligence(
  profiles: ChildDiversityProfile[],
  trainingRecords: EDITrainingRecord[],
  incidents: EDIIncident[],
  audits: AccessibilityAudit[],
  totalStaff: number,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EqualityDiversityIntelligenceResult {
  const individualSupport = evaluateIndividualSupport(profiles, periodEnd);
  const staffCompetency = evaluateStaffCompetency(trainingRecords, totalStaff);
  const incidentResponse = evaluateIncidentResponse(incidents);
  const accessibilityInclusion = evaluateAccessibilityInclusion(audits);
  const childSummaries = buildChildSummaries(profiles);

  const overallScore = clamp(
    individualSupport.score +
      staffCompetency.score +
      incidentResponse.score +
      accessibilityInclusion.score,
    0,
    100,
  );

  const rating: Rating =
    overallScore >= 85
      ? "outstanding"
      : overallScore >= 65
        ? "good"
        : overallScore >= 45
          ? "requires_improvement"
          : "inadequate";

  const strengths = generateStrengths(
    individualSupport,
    staffCompetency,
    incidentResponse,
    accessibilityInclusion,
  );
  const areasForDevelopment = generateAreasForDevelopment(
    individualSupport,
    staffCompetency,
    incidentResponse,
    accessibilityInclusion,
  );
  const immediateActions = generateImmediateActions(
    individualSupport,
    staffCompetency,
    incidentResponse,
    accessibilityInclusion,
    childSummaries,
  );

  const regulatoryLinks = [
    "Equality Act 2010 — Protected characteristics and reasonable adjustments",
    "CHR 2015 Reg 5 — Quality and purpose of care",
    "CHR 2015 Reg 6 — The children's home is child-focused",
    "CHR 2015 Reg 7 — Protection of children",
    "UNCRC Article 2 — Non-discrimination",
    "UNCRC Article 8 — Preservation of identity",
    "UNCRC Article 30 — Right to enjoy own culture, religion, language",
    "SCCIF — Children are treated as individuals",
    "KCSIE 2024 — Safeguarding and equality",
    "NMS 7 — Safeguarding and child protection",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    individualSupport,
    staffCompetency,
    incidentResponse,
    accessibilityInclusion,
    childSummaries,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Demo Data ─────────────────────────────────────────────────────────────────

export function getDemoProfiles(): ChildDiversityProfile[] {
  return [
    {
      id: "edp-1",
      childId: "child-alex",
      childName: "Alex",
      characteristics: [
        { characteristic: "race", details: "White British", supportStatus: "fully_supported" },
        { characteristic: "religion_or_belief", details: "Christianity", supportStatus: "fully_supported" },
        { characteristic: "age", details: "14 years old", supportStatus: "fully_supported" },
        { characteristic: "sex", details: "Male", supportStatus: "fully_supported" },
      ],
      culturalPlanStatus: "active",
      culturalPlanLastReviewed: "2026-04-10",
      dietaryNeedsMet: true,
      religiousPracticeFacilitated: true,
      languageSupportProvided: true,
      identityWorkCompleted: true,
      lastAssessedDate: "2026-04-10",
      assessedBy: "Sarah Johnson",
    },
    {
      id: "edp-2",
      childId: "child-jordan",
      childName: "Jordan",
      characteristics: [
        { characteristic: "race", details: "Mixed Heritage", supportStatus: "fully_supported" },
        { characteristic: "disability", details: "ADHD — reasonable adjustments in place", supportStatus: "fully_supported" },
        { characteristic: "religion_or_belief", details: "No religion", supportStatus: "not_applicable" },
        { characteristic: "age", details: "12 years old", supportStatus: "fully_supported" },
      ],
      culturalPlanStatus: "active",
      culturalPlanLastReviewed: "2026-03-20",
      dietaryNeedsMet: true,
      religiousPracticeFacilitated: true,
      languageSupportProvided: true,
      identityWorkCompleted: true,
      lastAssessedDate: "2026-03-20",
      assessedBy: "Tom Williams",
    },
    {
      id: "edp-3",
      childId: "child-morgan",
      childName: "Morgan",
      characteristics: [
        { characteristic: "race", details: "Black British", supportStatus: "fully_supported" },
        { characteristic: "religion_or_belief", details: "Islam — halal diet, prayer facilitated", supportStatus: "fully_supported" },
        { characteristic: "age", details: "15 years old", supportStatus: "fully_supported" },
        { characteristic: "sex", details: "Female", supportStatus: "fully_supported" },
      ],
      culturalPlanStatus: "active",
      culturalPlanLastReviewed: "2026-04-05",
      dietaryNeedsMet: true,
      religiousPracticeFacilitated: true,
      languageSupportProvided: true,
      identityWorkCompleted: true,
      lastAssessedDate: "2026-04-05",
      assessedBy: "Lisa Chen",
    },
  ];
}

export function getDemoTrainingRecords(): EDITrainingRecord[] {
  return [
    {
      id: "etr-1",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      trainingType: "Equality Act 2010",
      status: "completed",
      completedDate: "2026-01-15",
      expiryDate: "2027-01-15",
    },
    {
      id: "etr-2",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      trainingType: "Cultural Competency",
      status: "completed",
      completedDate: "2026-02-10",
      expiryDate: "2027-02-10",
    },
    {
      id: "etr-3",
      staffId: "staff-tom",
      staffName: "Tom Williams",
      trainingType: "Equality Act 2010",
      status: "completed",
      completedDate: "2026-01-20",
      expiryDate: "2027-01-20",
    },
    {
      id: "etr-4",
      staffId: "staff-tom",
      staffName: "Tom Williams",
      trainingType: "Cultural Competency",
      status: "completed",
      completedDate: "2026-02-15",
      expiryDate: "2027-02-15",
    },
    {
      id: "etr-5",
      staffId: "staff-tom",
      staffName: "Tom Williams",
      trainingType: "Unconscious Bias",
      status: "completed",
      completedDate: "2026-03-01",
      expiryDate: "2027-03-01",
    },
    {
      id: "etr-6",
      staffId: "staff-lisa",
      staffName: "Lisa Chen",
      trainingType: "Equality Act 2010",
      status: "completed",
      completedDate: "2026-01-25",
      expiryDate: "2027-01-25",
    },
    {
      id: "etr-7",
      staffId: "staff-lisa",
      staffName: "Lisa Chen",
      trainingType: "Cultural Competency",
      status: "completed",
      completedDate: "2026-02-20",
      expiryDate: "2027-02-20",
    },
    {
      id: "etr-8",
      staffId: "staff-darren",
      staffName: "Olivia Hayes",
      trainingType: "Equality Act 2010",
      status: "completed",
      completedDate: "2026-01-28",
      expiryDate: "2027-01-28",
    },
    {
      id: "etr-9",
      staffId: "staff-darren",
      staffName: "Olivia Hayes",
      trainingType: "Cultural Competency",
      status: "completed",
      completedDate: "2026-02-25",
      expiryDate: "2027-02-25",
    },
    {
      id: "etr-10",
      staffId: "staff-darren",
      staffName: "Olivia Hayes",
      trainingType: "Anti-Discriminatory Practice",
      status: "completed",
      completedDate: "2026-03-10",
      expiryDate: "2027-03-10",
    },
  ];
}

export function getDemoIncidents(): EDIIncident[] {
  return [
    {
      id: "edi-inc-1",
      reportDate: "2026-02-15",
      category: "cultural_insensitivity",
      severity: "low",
      childInvolved: true,
      childId: "child-morgan",
      description: "Peer comment about dietary requirements during meal time",
      outcome: "resolved",
      lessonsIdentified: true,
      actionsTaken: [
        "Spoke with both children individually",
        "Facilitated group discussion on respecting differences",
        "Updated meal-time guidance for staff",
      ],
    },
    {
      id: "edi-inc-2",
      reportDate: "2026-03-22",
      category: "bullying",
      severity: "medium",
      childInvolved: true,
      childId: "child-jordan",
      description: "Name-calling related to ADHD during activity session",
      outcome: "lessons_learned",
      lessonsIdentified: true,
      actionsTaken: [
        "Immediate intervention by staff",
        "Restorative conversation between children",
        "Staff briefing on disability awareness",
        "Updated behaviour support plan",
      ],
    },
  ];
}

export function getDemoAudits(): AccessibilityAudit[] {
  return [
    {
      id: "aa-1",
      auditDate: "2026-01-20",
      physicalAccessScore: 8,
      communicationAccessScore: 9,
      informationAccessScore: 8,
      activityAccessScore: 9,
      auditor: "External Accessibility Consultant",
      improvementsIdentified: 5,
      improvementsCompleted: 4,
    },
    {
      id: "aa-2",
      auditDate: "2026-04-15",
      physicalAccessScore: 9,
      communicationAccessScore: 9,
      informationAccessScore: 9,
      activityAccessScore: 9,
      auditor: "Sarah Johnson",
      improvementsIdentified: 3,
      improvementsCompleted: 3,
    },
  ];
}
