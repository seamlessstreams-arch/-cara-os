// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Culture, Identity & Diversity Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// Regulatory framework:
//   CHR 2015 Reg 11(2)(b) — Positive relationships; cultural, religious,
//                            linguistic background
//   CHR 2015 Reg 5        — Engaging with quality & purpose of care
//   Equality Act 2010      — Protected characteristics monitoring
//   UNCRC Article 2        — Non-discrimination
//   UNCRC Article 8        — Preservation of identity
//   UNCRC Article 14       — Freedom of thought, conscience, religion
//   UNCRC Article 29       — Education directed to cultural identity
//   UNCRC Article 30       — Right to enjoy own culture, religion, language
//   SCCIF                  — "Children develop a strong sense of identity"
//   Working Together 2023  — Culturally sensitive assessment & planning
//
// Scoring breakdown (0–100):
//   Identity needs assessed:   20  — Are all children's needs recorded?
//   Activity provision:        25  — Regular identity-supporting activities
//   Needs met rate:            20  — % of identified needs actively supported
//   Staff competence:          15  — Diversity/equality training compliance
//   Incident handling:         10  — How well discriminatory incidents managed
//   Consistency:               10  — Balanced support across all children
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type IdentityDimension =
  | "ethnic_heritage"
  | "religious_belief"
  | "language"
  | "gender_identity"
  | "sexual_orientation"
  | "disability"
  | "cultural_traditions";

export type IdentityActivityType =
  | "worship_facilitated"
  | "cultural_food_provided"
  | "language_support"
  | "heritage_activity"
  | "celebration_observed"
  | "identity_exploration"
  | "cultural_mentor"
  | "community_link"
  | "resource_provision"
  | "life_story_identity";

export type DiversityIncidentType =
  | "racism"
  | "homophobia"
  | "transphobia"
  | "religious_prejudice"
  | "disability_prejudice"
  | "cultural_insensitivity"
  | "microaggression";

export type IncidentPerpetrator =
  | "child"
  | "staff"
  | "visitor"
  | "external";

export type TrainingType =
  | "equality_diversity"
  | "cultural_competence"
  | "anti_racism"
  | "lgbtq_awareness"
  | "disability_awareness"
  | "religious_literacy"
  | "unconscious_bias";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface CultureChild {
  id: string;
  name: string;
  dateOfBirth: string;
  ethnicHeritage?: string;
  religion?: string;
  firstLanguage?: string;
  additionalLanguages?: string[];
  genderIdentity?: string;
  pronouns?: string;
  disability?: string;
  culturalTraditions?: string[];
  dietaryRequirements?: string[];
  currentPlacement: boolean;
}

export interface IdentityNeedsAssessment {
  childId: string;
  assessmentDate: string;
  dimensionsAssessed: IdentityDimension[];
  needsIdentified: IdentityNeed[];
  reviewDueDate: string;
  assessedBy: string;
}

export interface IdentityNeed {
  dimension: IdentityDimension;
  description: string;
  priority: "high" | "medium" | "low";
  status: "met" | "partially_met" | "unmet" | "not_assessed";
  supportPlan?: string;
}

export interface IdentityActivity {
  id: string;
  childId: string;
  date: string;
  activityType: IdentityActivityType;
  dimension: IdentityDimension;
  description: string;
  childEngaged: boolean;
  childInitiated: boolean;
  outcome?: string;
}

export interface DiversityIncident {
  id: string;
  date: string;
  incidentType: DiversityIncidentType;
  perpetrator: IncidentPerpetrator;
  victimChildIds: string[];
  reported: boolean;
  reportedDate?: string;
  investigated: boolean;
  investigationOutcome?: string;
  resolved: boolean;
  resolvedDate?: string;
  actionsTaken: string[];
  lessonLearned?: string;
}

export interface StaffDiversityTraining {
  staffId: string;
  staffName: string;
  trainingType: TrainingType;
  completionDate: string;
  expiryDate?: string;
  certificateHeld: boolean;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface IdentitySupportResult {
  totalChildren: number;
  childrenWithAssessment: number;
  assessmentRate: number;
  totalNeedsIdentified: number;
  needsMet: number;
  needsPartiallyMet: number;
  needsUnmet: number;
  needsMetRate: number;
  dimensionCoverage: Record<IdentityDimension, number>;
}

export interface ActivityProvisionResult {
  totalActivities: number;
  activitiesPerChild: number;
  childEngagementRate: number;
  childInitiatedRate: number;
  activityTypeBreakdown: { activityType: IdentityActivityType; count: number }[];
  dimensionBreakdown: { dimension: IdentityDimension; count: number }[];
  childrenWithNoActivities: string[];
}

export interface IncidentAnalysisResult {
  totalIncidents: number;
  reportedRate: number;
  investigatedRate: number;
  resolvedRate: number;
  averageResolutionDays: number;
  typeBreakdown: { incidentType: DiversityIncidentType; count: number }[];
  perpetratorBreakdown: { perpetrator: IncidentPerpetrator; count: number }[];
  staffIncidents: number;
  lessonsRecorded: number;
}

export interface StaffCompetenceResult {
  totalStaff: number;
  staffWithTraining: number;
  trainingRate: number;
  expiredTraining: number;
  trainingTypeBreakdown: { trainingType: TrainingType; count: number }[];
  staffMissingTraining: string[];
}

export interface ChildIdentityProfile {
  childId: string;
  childName: string;
  hasAssessment: boolean;
  assessmentOverdue: boolean;
  needsIdentified: number;
  needsMet: number;
  needsUnmet: number;
  needsMetRate: number;
  activitiesCount: number;
  activityEngagementRate: number;
  childInitiatedCount: number;
  dimensionsCovered: IdentityDimension[];
  dimensionGaps: IdentityDimension[];
  incidentsAsVictim: number;
  primaryConcern?: string;
}

export interface CultureIdentityIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  identitySupport: IdentitySupportResult;
  activityProvision: ActivityProvisionResult;
  incidentAnalysis: IncidentAnalysisResult;
  staffCompetence: StaffCompetenceResult;
  childProfiles: ChildIdentityProfile[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Labels ────────────────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<IdentityDimension, string> = {
  ethnic_heritage: "Ethnic Heritage",
  religious_belief: "Religious Belief",
  language: "Language",
  gender_identity: "Gender Identity",
  sexual_orientation: "Sexual Orientation",
  disability: "Disability",
  cultural_traditions: "Cultural Traditions",
};

const ACTIVITY_TYPE_LABELS: Record<IdentityActivityType, string> = {
  worship_facilitated: "Worship Facilitated",
  cultural_food_provided: "Cultural Food Provided",
  language_support: "Language Support",
  heritage_activity: "Heritage Activity",
  celebration_observed: "Celebration Observed",
  identity_exploration: "Identity Exploration",
  cultural_mentor: "Cultural Mentor",
  community_link: "Community Link",
  resource_provision: "Resource Provision",
  life_story_identity: "Life Story / Identity Work",
};

const INCIDENT_TYPE_LABELS: Record<DiversityIncidentType, string> = {
  racism: "Racism",
  homophobia: "Homophobia",
  transphobia: "Transphobia",
  religious_prejudice: "Religious Prejudice",
  disability_prejudice: "Disability Prejudice",
  cultural_insensitivity: "Cultural Insensitivity",
  microaggression: "Microaggression",
};

const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  equality_diversity: "Equality & Diversity",
  cultural_competence: "Cultural Competence",
  anti_racism: "Anti-Racism",
  lgbtq_awareness: "LGBTQ+ Awareness",
  disability_awareness: "Disability Awareness",
  religious_literacy: "Religious Literacy",
  unconscious_bias: "Unconscious Bias",
};

export function getIdentityDimensionLabel(d: IdentityDimension): string {
  return DIMENSION_LABELS[d] ?? d.replace(/_/g, " ");
}

export function getActivityTypeLabel(t: IdentityActivityType): string {
  return ACTIVITY_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getIncidentTypeLabel(t: DiversityIncidentType): string {
  return INCIDENT_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getTrainingTypeLabel(t: TrainingType): string {
  return TRAINING_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Evaluates how well identity needs are assessed and met across all children.
 */
export function evaluateIdentitySupport(
  children: CultureChild[],
  assessments: IdentityNeedsAssessment[],
  currentDate: string,
): IdentitySupportResult {
  const placed = children.filter((c) => c.currentPlacement);
  const totalChildren = placed.length;

  // Which children have an assessment?
  const childrenWithAssessmentSet = new Set(
    assessments
      .filter((a) => placed.some((c) => c.id === a.childId))
      .map((a) => a.childId),
  );
  const childrenWithAssessment = childrenWithAssessmentSet.size;
  const assessmentRate = pct(childrenWithAssessment, totalChildren);

  // Aggregate needs across all assessments
  const allNeeds: IdentityNeed[] = assessments
    .filter((a) => placed.some((c) => c.id === a.childId))
    .flatMap((a) => a.needsIdentified);

  const totalNeedsIdentified = allNeeds.length;
  const needsMet = allNeeds.filter((n) => n.status === "met").length;
  const needsPartiallyMet = allNeeds.filter(
    (n) => n.status === "partially_met",
  ).length;
  const needsUnmet = allNeeds.filter((n) => n.status === "unmet").length;
  const assessedNeeds = allNeeds.filter(
    (n) => n.status !== "not_assessed",
  ).length;
  const needsMetRate = pct(needsMet, assessedNeeds);

  // Dimension coverage: how many children have each dimension assessed
  const dimensionCoverage: Record<IdentityDimension, number> = {
    ethnic_heritage: 0,
    religious_belief: 0,
    language: 0,
    gender_identity: 0,
    sexual_orientation: 0,
    disability: 0,
    cultural_traditions: 0,
  };

  for (const a of assessments) {
    if (!placed.some((c) => c.id === a.childId)) continue;
    for (const dim of a.dimensionsAssessed) {
      dimensionCoverage[dim] = (dimensionCoverage[dim] ?? 0) + 1;
    }
  }

  return {
    totalChildren,
    childrenWithAssessment,
    assessmentRate,
    totalNeedsIdentified,
    needsMet,
    needsPartiallyMet,
    needsUnmet,
    needsMetRate,
    dimensionCoverage,
  };
}

/**
 * Evaluates provision of identity-supporting activities.
 */
export function evaluateActivityProvision(
  children: CultureChild[],
  activities: IdentityActivity[],
  periodStart: string,
  periodEnd: string,
): ActivityProvisionResult {
  const placed = children.filter((c) => c.currentPlacement);
  const periodActivities = activities.filter(
    (a) =>
      inPeriod(a.date, periodStart, periodEnd) &&
      placed.some((c) => c.id === a.childId),
  );

  const totalActivities = periodActivities.length;
  const activitiesPerChild =
    placed.length === 0
      ? 0
      : Math.round((totalActivities / placed.length) * 10) / 10;

  const engaged = periodActivities.filter((a) => a.childEngaged).length;
  const childEngagementRate = pct(engaged, totalActivities);
  const initiated = periodActivities.filter((a) => a.childInitiated).length;
  const childInitiatedRate = pct(initiated, totalActivities);

  // Activity type breakdown
  const typeCounts = new Map<IdentityActivityType, number>();
  for (const a of periodActivities) {
    typeCounts.set(a.activityType, (typeCounts.get(a.activityType) ?? 0) + 1);
  }
  const activityTypeBreakdown = Array.from(typeCounts.entries())
    .map(([activityType, count]) => ({ activityType, count }))
    .sort((a, b) => b.count - a.count);

  // Dimension breakdown
  const dimCounts = new Map<IdentityDimension, number>();
  for (const a of periodActivities) {
    dimCounts.set(a.dimension, (dimCounts.get(a.dimension) ?? 0) + 1);
  }
  const dimensionBreakdown = Array.from(dimCounts.entries())
    .map(([dimension, count]) => ({ dimension, count }))
    .sort((a, b) => b.count - a.count);

  // Children with no activities
  const childrenWithActivities = new Set(
    periodActivities.map((a) => a.childId),
  );
  const childrenWithNoActivities = placed
    .filter((c) => !childrenWithActivities.has(c.id))
    .map((c) => c.name);

  return {
    totalActivities,
    activitiesPerChild,
    childEngagementRate,
    childInitiatedRate,
    activityTypeBreakdown,
    dimensionBreakdown,
    childrenWithNoActivities,
  };
}

/**
 * Analyses diversity/discriminatory incidents.
 */
export function analyseDiversityIncidents(
  incidents: DiversityIncident[],
  periodStart: string,
  periodEnd: string,
): IncidentAnalysisResult {
  const periodIncidents = incidents.filter((i) =>
    inPeriod(i.date, periodStart, periodEnd),
  );
  const totalIncidents = periodIncidents.length;

  const reported = periodIncidents.filter((i) => i.reported).length;
  const investigated = periodIncidents.filter((i) => i.investigated).length;
  const resolved = periodIncidents.filter((i) => i.resolved).length;
  const reportedRate = pct(reported, totalIncidents);
  const investigatedRate = pct(investigated, totalIncidents);
  const resolvedRate = pct(resolved, totalIncidents);

  // Average resolution days (for resolved incidents)
  const resolvedIncidents = periodIncidents.filter(
    (i) => i.resolved && i.resolvedDate,
  );
  const totalResolutionDays = resolvedIncidents.reduce(
    (sum, i) => sum + daysBetween(i.date, i.resolvedDate!),
    0,
  );
  const averageResolutionDays =
    resolvedIncidents.length === 0
      ? 0
      : Math.round(totalResolutionDays / resolvedIncidents.length);

  // Type breakdown
  const typeCounts = new Map<DiversityIncidentType, number>();
  for (const i of periodIncidents) {
    typeCounts.set(i.incidentType, (typeCounts.get(i.incidentType) ?? 0) + 1);
  }
  const typeBreakdown = Array.from(typeCounts.entries())
    .map(([incidentType, count]) => ({ incidentType, count }))
    .sort((a, b) => b.count - a.count);

  // Perpetrator breakdown
  const perpCounts = new Map<IncidentPerpetrator, number>();
  for (const i of periodIncidents) {
    perpCounts.set(i.perpetrator, (perpCounts.get(i.perpetrator) ?? 0) + 1);
  }
  const perpetratorBreakdown = Array.from(perpCounts.entries())
    .map(([perpetrator, count]) => ({ perpetrator, count }))
    .sort((a, b) => b.count - a.count);

  const staffIncidents = periodIncidents.filter(
    (i) => i.perpetrator === "staff",
  ).length;
  const lessonsRecorded = periodIncidents.filter(
    (i) => i.lessonLearned && i.lessonLearned.trim().length > 0,
  ).length;

  return {
    totalIncidents,
    reportedRate,
    investigatedRate,
    resolvedRate,
    averageResolutionDays,
    typeBreakdown,
    perpetratorBreakdown,
    staffIncidents,
    lessonsRecorded,
  };
}

/**
 * Evaluates staff diversity/equality training competence.
 */
export function evaluateStaffCompetence(
  training: StaffDiversityTraining[],
  staffIds: string[],
  currentDate: string,
): StaffCompetenceResult {
  const totalStaff = staffIds.length;

  // Staff who have at least one training record
  const staffWithTrainingSet = new Set(training.map((t) => t.staffId));
  const staffWithTraining = staffIds.filter((id) =>
    staffWithTrainingSet.has(id),
  ).length;
  const trainingRate = pct(staffWithTraining, totalStaff);

  // Expired training
  const expiredTraining = training.filter(
    (t) => t.expiryDate && t.expiryDate < currentDate,
  ).length;

  // Training type breakdown
  const typeCounts = new Map<TrainingType, number>();
  for (const t of training) {
    typeCounts.set(t.trainingType, (typeCounts.get(t.trainingType) ?? 0) + 1);
  }
  const trainingTypeBreakdown = Array.from(typeCounts.entries())
    .map(([trainingType, count]) => ({ trainingType, count }))
    .sort((a, b) => b.count - a.count);

  // Staff missing training
  const staffMissingTraining = staffIds.filter(
    (id) => !staffWithTrainingSet.has(id),
  );

  return {
    totalStaff,
    staffWithTraining,
    trainingRate,
    expiredTraining,
    trainingTypeBreakdown,
    staffMissingTraining,
  };
}

/**
 * Builds per-child identity support profiles.
 */
export function buildChildIdentityProfiles(
  children: CultureChild[],
  assessments: IdentityNeedsAssessment[],
  activities: IdentityActivity[],
  incidents: DiversityIncident[],
  periodStart: string,
  periodEnd: string,
  currentDate: string,
): ChildIdentityProfile[] {
  const placed = children.filter((c) => c.currentPlacement);
  const ALL_DIMENSIONS: IdentityDimension[] = [
    "ethnic_heritage",
    "religious_belief",
    "language",
    "gender_identity",
    "sexual_orientation",
    "disability",
    "cultural_traditions",
  ];

  return placed.map((child) => {
    // Assessment
    const childAssessments = assessments.filter(
      (a) => a.childId === child.id,
    );
    const hasAssessment = childAssessments.length > 0;
    const latestAssessment = childAssessments.sort(
      (a, b) => b.assessmentDate.localeCompare(a.assessmentDate),
    )[0];
    const assessmentOverdue = hasAssessment
      ? latestAssessment.reviewDueDate < currentDate
      : false;

    // Needs
    const allNeeds = childAssessments.flatMap((a) => a.needsIdentified);
    const needsIdentified = allNeeds.length;
    const needsMet = allNeeds.filter((n) => n.status === "met").length;
    const needsUnmet = allNeeds.filter((n) => n.status === "unmet").length;
    const assessedNeeds = allNeeds.filter(
      (n) => n.status !== "not_assessed",
    ).length;
    const needsMetRate = pct(needsMet, assessedNeeds);

    // Activities
    const childActivities = activities.filter(
      (a) =>
        a.childId === child.id && inPeriod(a.date, periodStart, periodEnd),
    );
    const activitiesCount = childActivities.length;
    const engaged = childActivities.filter((a) => a.childEngaged).length;
    const activityEngagementRate = pct(engaged, activitiesCount);
    const childInitiatedCount = childActivities.filter(
      (a) => a.childInitiated,
    ).length;

    // Dimensions covered by activities
    const dimensionsCoveredSet = new Set(
      childActivities.map((a) => a.dimension),
    );
    // Also add assessed dimensions
    if (latestAssessment) {
      for (const dim of latestAssessment.dimensionsAssessed) {
        dimensionsCoveredSet.add(dim);
      }
    }
    const dimensionsCovered = ALL_DIMENSIONS.filter((d) =>
      dimensionsCoveredSet.has(d),
    );
    const dimensionGaps = ALL_DIMENSIONS.filter(
      (d) => !dimensionsCoveredSet.has(d),
    );

    // Incidents as victim
    const periodIncidents = incidents.filter((i) =>
      inPeriod(i.date, periodStart, periodEnd),
    );
    const incidentsAsVictim = periodIncidents.filter((i) =>
      i.victimChildIds.includes(child.id),
    ).length;

    // Primary concern determination
    let primaryConcern: string | undefined;
    if (!hasAssessment) {
      primaryConcern = "No identity needs assessment on record";
    } else if (needsUnmet >= 3) {
      primaryConcern = `${needsUnmet} unmet identity needs require urgent attention`;
    } else if (incidentsAsVictim >= 2) {
      primaryConcern = `${incidentsAsVictim} discriminatory incidents as victim`;
    } else if (activitiesCount === 0) {
      primaryConcern = "No identity-supporting activities in period";
    } else if (assessmentOverdue) {
      primaryConcern = "Identity needs assessment overdue for review";
    }

    return {
      childId: child.id,
      childName: child.name,
      hasAssessment,
      assessmentOverdue,
      needsIdentified,
      needsMet,
      needsUnmet,
      needsMetRate,
      activitiesCount,
      activityEngagementRate,
      childInitiatedCount,
      dimensionsCovered,
      dimensionGaps,
      incidentsAsVictim,
      primaryConcern,
    };
  });
}

// ── Main Intelligence Function ────────────────────────────────────────────────

export function generateCultureIdentityIntelligence(
  children: CultureChild[],
  assessments: IdentityNeedsAssessment[],
  activities: IdentityActivity[],
  incidents: DiversityIncident[],
  training: StaffDiversityTraining[],
  staffIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): CultureIdentityIntelligenceResult {
  const currentDate = periodEnd;

  const identitySupport = evaluateIdentitySupport(
    children,
    assessments,
    currentDate,
  );
  const activityProvision = evaluateActivityProvision(
    children,
    activities,
    periodStart,
    periodEnd,
  );
  const incidentAnalysis = analyseDiversityIncidents(
    incidents,
    periodStart,
    periodEnd,
  );
  const staffCompetence = evaluateStaffCompetence(
    training,
    staffIds,
    currentDate,
  );
  const childProfiles = buildChildIdentityProfiles(
    children,
    assessments,
    activities,
    incidents,
    periodStart,
    periodEnd,
    currentDate,
  );

  // ── Scoring ──────────────────────────────────────────────────────────────

  // 1. Identity needs assessed (20)
  let assessmentScore = 0;
  if (identitySupport.assessmentRate === 100) assessmentScore = 20;
  else if (identitySupport.assessmentRate >= 80) assessmentScore = 15;
  else if (identitySupport.assessmentRate >= 60) assessmentScore = 10;
  else if (identitySupport.assessmentRate >= 40) assessmentScore = 5;
  else assessmentScore = 0;

  // 2. Activity provision (25)
  let activityScore = 0;
  const activitiesPerChild = activityProvision.activitiesPerChild;
  if (activitiesPerChild >= 6) activityScore = 15;
  else if (activitiesPerChild >= 4) activityScore = 12;
  else if (activitiesPerChild >= 2) activityScore = 8;
  else if (activitiesPerChild >= 1) activityScore = 4;
  else activityScore = 0;

  // Engagement bonus
  if (activityProvision.childEngagementRate >= 80) activityScore += 5;
  else if (activityProvision.childEngagementRate >= 60) activityScore += 3;
  else if (activityProvision.childEngagementRate >= 40) activityScore += 1;

  // Child-initiated bonus
  if (activityProvision.childInitiatedRate >= 30) activityScore += 5;
  else if (activityProvision.childInitiatedRate >= 15) activityScore += 3;
  else if (activityProvision.childInitiatedRate >= 5) activityScore += 1;

  activityScore = Math.min(activityScore, 25);

  // 3. Needs met rate (20)
  let needsMetScore = 0;
  if (identitySupport.totalNeedsIdentified === 0) {
    // No needs identified — neutral if assessments done, penalty if not
    needsMetScore = identitySupport.assessmentRate >= 80 ? 15 : 5;
  } else {
    if (identitySupport.needsMetRate >= 90) needsMetScore = 20;
    else if (identitySupport.needsMetRate >= 75) needsMetScore = 15;
    else if (identitySupport.needsMetRate >= 60) needsMetScore = 10;
    else if (identitySupport.needsMetRate >= 40) needsMetScore = 5;
    else needsMetScore = 0;
  }

  // 4. Staff competence (15)
  let staffScore = 0;
  if (staffCompetence.trainingRate >= 90) staffScore = 12;
  else if (staffCompetence.trainingRate >= 75) staffScore = 9;
  else if (staffCompetence.trainingRate >= 50) staffScore = 6;
  else if (staffCompetence.trainingRate >= 25) staffScore = 3;
  else staffScore = 0;

  // Expired training penalty
  if (staffCompetence.expiredTraining > 0) {
    const expiredPenalty = Math.min(staffCompetence.expiredTraining * 2, 5);
    staffScore = Math.max(0, staffScore - expiredPenalty);
  }

  // Training diversity bonus (multiple types covered)
  if (staffCompetence.trainingTypeBreakdown.length >= 4) staffScore += 3;
  else if (staffCompetence.trainingTypeBreakdown.length >= 2) staffScore += 1;

  staffScore = Math.min(staffScore, 15);

  // 5. Incident handling (10)
  let incidentScore = 10; // Start perfect, deduct for issues
  if (incidentAnalysis.totalIncidents > 0) {
    // Reporting failures
    if (incidentAnalysis.reportedRate < 100) {
      incidentScore -= 3;
    }
    // Investigation gaps
    if (incidentAnalysis.investigatedRate < 100) {
      incidentScore -= 2;
    }
    // Resolution rate
    if (incidentAnalysis.resolvedRate < 80) {
      incidentScore -= 2;
    }
    // Staff as perpetrator is serious
    if (incidentAnalysis.staffIncidents > 0) {
      incidentScore -= Math.min(incidentAnalysis.staffIncidents * 2, 4);
    }
    // Lessons not recorded
    if (
      incidentAnalysis.lessonsRecorded <
      Math.ceil(incidentAnalysis.totalIncidents / 2)
    ) {
      incidentScore -= 1;
    }
  }
  incidentScore = Math.max(0, incidentScore);

  // 6. Consistency (10) — balanced support across children
  let consistencyScore = 10;
  const profiles = childProfiles;
  if (profiles.length > 0) {
    const withConcerns = profiles.filter((p) => p.primaryConcern).length;
    const concernRate = withConcerns / profiles.length;
    if (concernRate > 0.5) consistencyScore -= 5;
    else if (concernRate > 0.25) consistencyScore -= 2;

    // Large variance in activities per child
    const actCounts = profiles.map((p) => p.activitiesCount);
    const maxAct = Math.max(...actCounts);
    const minAct = Math.min(...actCounts);
    if (maxAct > 0 && minAct === 0) consistencyScore -= 3;
    else if (maxAct > 0 && maxAct - minAct > 4) consistencyScore -= 2;
  }
  consistencyScore = Math.max(0, consistencyScore);

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      assessmentScore +
        activityScore +
        needsMetScore +
        staffScore +
        incidentScore +
        consistencyScore,
    ),
  );

  // ── Rating ──────────────────────────────────────────────────────────────
  const rating: CultureIdentityIntelligenceResult["rating"] =
    overallScore >= 85
      ? "outstanding"
      : overallScore >= 65
        ? "good"
        : overallScore >= 45
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ─────────────────────────────────────────
  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  if (identitySupport.assessmentRate === 100) {
    strengths.push(
      "All children have identity needs assessments on record",
    );
  }
  if (identitySupport.needsMetRate >= 80) {
    strengths.push(
      `${identitySupport.needsMetRate}% of identified identity needs are being met`,
    );
  }
  if (activityProvision.childEngagementRate >= 80) {
    strengths.push(
      "High child engagement rate in identity-supporting activities",
    );
  }
  if (activityProvision.childInitiatedRate >= 25) {
    strengths.push(
      "Children are initiating their own identity-related activities",
    );
  }
  if (staffCompetence.trainingRate >= 90) {
    strengths.push(
      "Excellent staff diversity and equality training compliance",
    );
  }
  if (
    incidentAnalysis.totalIncidents > 0 &&
    incidentAnalysis.resolvedRate === 100
  ) {
    strengths.push("All diversity incidents fully investigated and resolved");
  }
  if (incidentAnalysis.totalIncidents === 0) {
    strengths.push("No discriminatory incidents recorded in period");
  }
  if (strengths.length === 0) {
    strengths.push("No significant strengths identified in this period");
  }

  // Areas for development
  if (identitySupport.assessmentRate < 100) {
    areasForDevelopment.push(
      `${identitySupport.totalChildren - identitySupport.childrenWithAssessment} child${identitySupport.totalChildren - identitySupport.childrenWithAssessment !== 1 ? "ren" : ""} lack identity needs assessments`,
    );
  }
  if (identitySupport.needsUnmet > 0) {
    areasForDevelopment.push(
      `${identitySupport.needsUnmet} identity need${identitySupport.needsUnmet !== 1 ? "s" : ""} remain unmet`,
    );
  }
  if (activityProvision.childrenWithNoActivities.length > 0) {
    areasForDevelopment.push(
      `${activityProvision.childrenWithNoActivities.join(", ")} had no identity-supporting activities`,
    );
  }
  if (staffCompetence.trainingRate < 80) {
    areasForDevelopment.push(
      `Staff diversity training coverage is ${staffCompetence.trainingRate}% (target: 100%)`,
    );
  }
  if (staffCompetence.expiredTraining > 0) {
    areasForDevelopment.push(
      `${staffCompetence.expiredTraining} staff training record${staffCompetence.expiredTraining !== 1 ? "s" : ""} expired`,
    );
  }
  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified");
  }

  // Immediate actions
  const childrenMissingAssessment = childProfiles.filter(
    (p) => !p.hasAssessment,
  );
  if (childrenMissingAssessment.length > 0) {
    immediateActions.push(
      `URGENT: Complete identity needs assessments for ${childrenMissingAssessment.map((p) => p.childName).join(", ")} — Reg 11 requirement`,
    );
  }

  const childrenWithMultipleIncidents = childProfiles.filter(
    (p) => p.incidentsAsVictim >= 2,
  );
  if (childrenWithMultipleIncidents.length > 0) {
    immediateActions.push(
      `URGENT: ${childrenWithMultipleIncidents.map((p) => p.childName).join(", ")} experienced multiple discriminatory incidents — enhanced support needed`,
    );
  }

  if (
    incidentAnalysis.totalIncidents > 0 &&
    incidentAnalysis.reportedRate < 100
  ) {
    immediateActions.push(
      "HIGH: Unreported diversity incidents detected — review incident recording procedures",
    );
  }
  if (incidentAnalysis.staffIncidents > 0) {
    immediateActions.push(
      "HIGH: Staff-perpetrated discriminatory incident(s) — ensure supervision addresses equality practice",
    );
  }

  const childrenWithUnmetNeeds = childProfiles.filter(
    (p) => p.needsUnmet >= 2,
  );
  if (childrenWithUnmetNeeds.length > 0) {
    immediateActions.push(
      `MEDIUM: Develop support plans for unmet identity needs: ${childrenWithUnmetNeeds.map((p) => p.childName).join(", ")}`,
    );
  }

  if (staffCompetence.staffMissingTraining.length > 0) {
    immediateActions.push(
      `MEDIUM: Schedule diversity training for ${staffCompetence.staffMissingTraining.length} untrained staff member${staffCompetence.staffMissingTraining.length !== 1 ? "s" : ""}`,
    );
  }

  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — maintain current excellent practice",
    );
  }

  // ── Regulatory Links ──────────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 11(2)(b) — Consider religious, racial, cultural and linguistic needs",
    "CHR 2015 Reg 5 — Quality and purpose of care, including identity development",
    "Equality Act 2010 — Duty to eliminate discrimination, advance equality",
    "UNCRC Article 8 — Right to preservation of identity",
    "UNCRC Article 30 — Rights of children from ethnic, religious or linguistic minorities",
    "SCCIF — Children develop a strong sense of their identity",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    identitySupport,
    activityProvision,
    incidentAnalysis,
    staffCompetence,
    childProfiles,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
