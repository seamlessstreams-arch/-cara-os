// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Trauma-Informed Care Intelligence Engine
//
// Deterministic engine for evaluating trauma-informed care practice across
// a children's residential home. Scores staff competency, practice quality,
// environmental adaptations, clinical consultation, and trauma screening.
//
// Aligned to:
//   - CHR 2015 Reg 6  — Quality of care
//   - CHR 2015 Reg 10 — Positive relationships
//   - CHR 2015 Reg 12 — Protection of children
//   - SCCIF            — Quality of Care judgement area
//   - NICE CG26        — Post-traumatic stress disorder (PTSD)
//   - Working Together 2023 — Multi-agency safeguarding
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type TraumaPrinciple =
  | "safety"
  | "trustworthiness"
  | "choice"
  | "collaboration"
  | "empowerment"
  | "cultural_sensitivity";

export type PracticeIndicator =
  | "predictable_routines"
  | "safe_spaces"
  | "emotional_regulation_support"
  | "co_regulation"
  | "sensory_awareness"
  | "relationship_repair"
  | "therapeutic_parenting"
  | "life_story_work"
  | "psychoeducation"
  | "strengths_based_language";

export type StaffCompetencyLevel =
  | "awareness"
  | "informed"
  | "responsive"
  | "specialist";

export type OfstedRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface TraumaTrainingRecord {
  id: string;
  staffId: string;
  staffName: string;
  trainingType: string;
  completedDate: string;
  expiryDate?: string;
  level: StaffCompetencyLevel;
  provider: string;
}

export interface TherapeuticInterventionRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  interventionType: string;
  deliveredBy: string;
  traumaPrinciplesApplied: TraumaPrinciple[];
  practiceIndicators: PracticeIndicator[];
  childResponse: "positive" | "neutral" | "distressed" | "refused";
  durationMinutes: number;
  notes?: string;
}

export interface EnvironmentalAdaptation {
  id: string;
  area: string;
  adaptation: string;
  traumaPrinciple: TraumaPrinciple;
  implementedDate: string;
  reviewDate: string;
  status: "active" | "needs_review" | "planned";
  childSpecific?: string;
}

export interface ConsultationRecord {
  id: string;
  date: string;
  consultantName: string;
  consultationType:
    | "clinical_psychologist"
    | "therapist"
    | "social_worker"
    | "CAMHS"
    | "other";
  childrenDiscussed: string[];
  recommendations: string[];
  actionsAgreed: string[];
  actionsCompleted: boolean;
}

export interface TraumaScreening {
  id: string;
  childId: string;
  childName: string;
  screeningDate: string;
  screenedBy: string;
  traumaHistoryDocumented: boolean;
  triggersIdentified: string[];
  copingStrategiesIdentified: string[];
  therapeuticNeedsAssessed: boolean;
  referralMade: boolean;
  nextReviewDate: string;
}

// ── Evaluation Result Interfaces ───────────────────────────────────────────

export interface StaffCompetencyEvaluation {
  trainingCoverageRate: number;
  averageCompetencyScore: number;
  averageCompetencyLevel: StaffCompetencyLevel;
  specialistCount: number;
  specialistAvailable: boolean;
  expiredTrainingCount: number;
  expiringWithin30Days: number;
  staffCount: number;
  trainedStaffCount: number;
  levelBreakdown: Record<StaffCompetencyLevel, number>;
  score: number;
}

export interface PracticeQualityEvaluation {
  principleCoverage: number;
  principlesUsed: TraumaPrinciple[];
  principlesMissing: TraumaPrinciple[];
  indicatorFrequency: Record<string, number>;
  indicatorsUsed: PracticeIndicator[];
  indicatorsMissing: PracticeIndicator[];
  indicatorCoverage: number;
  childResponseBreakdown: Record<string, number>;
  positiveResponseRate: number;
  interventionVariety: number;
  interventionTypes: string[];
  perChildQuality: PerChildQuality[];
  totalInterventions: number;
  score: number;
}

export interface PerChildQuality {
  childId: string;
  childName: string;
  interventionCount: number;
  positiveResponseRate: number;
  principlesApplied: TraumaPrinciple[];
  principleGaps: TraumaPrinciple[];
}

export interface EnvironmentEvaluation {
  totalAdaptations: number;
  activeAdaptations: number;
  adaptationCoverage: number;
  principleAlignment: Record<TraumaPrinciple, number>;
  principlesCovered: TraumaPrinciple[];
  principlesGap: TraumaPrinciple[];
  reviewCurrency: number;
  overdueReviews: number;
  childSpecificCount: number;
  childSpecificRate: number;
  plannedAdaptations: number;
  score: number;
}

export interface ConsultationEvaluation {
  totalConsultations: number;
  consultationFrequencyPerMonth: number;
  actionCompletionRate: number;
  childrenCoverage: number;
  childrenDiscussedIds: string[];
  childrenNotDiscussed: string[];
  specialistVariety: number;
  consultationTypes: string[];
  totalActionsAgreed: number;
  totalActionsCompleted: number;
  score: number;
}

export interface TraumaScreeningEvaluation {
  screeningCoverage: number;
  childrenScreened: string[];
  childrenNotScreened: string[];
  triggerDocumentationRate: number;
  copingStrategyRate: number;
  therapeuticNeedsAssessedRate: number;
  referralRate: number;
  averageTriggersPerChild: number;
  averageCopingStrategiesPerChild: number;
  overdueReviews: number;
  score: number;
}

export interface RegulatoryLink {
  regulation: string;
  description: string;
  relevance: string;
}

export interface TraumaInformedIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  overallScore: number;
  rating: OfstedRating;
  staffCompetency: StaffCompetencyEvaluation;
  practiceQuality: PracticeQualityEvaluation;
  environment: EnvironmentEvaluation;
  consultation: ConsultationEvaluation;
  traumaScreening: TraumaScreeningEvaluation;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: RegulatoryLink[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_PRINCIPLES: TraumaPrinciple[] = [
  "safety",
  "trustworthiness",
  "choice",
  "collaboration",
  "empowerment",
  "cultural_sensitivity",
];

const ALL_INDICATORS: PracticeIndicator[] = [
  "predictable_routines",
  "safe_spaces",
  "emotional_regulation_support",
  "co_regulation",
  "sensory_awareness",
  "relationship_repair",
  "therapeutic_parenting",
  "life_story_work",
  "psychoeducation",
  "strengths_based_language",
];

const COMPETENCY_SCORES: Record<StaffCompetencyLevel, number> = {
  awareness: 1,
  informed: 2,
  responsive: 3,
  specialist: 4,
};

const COMPETENCY_LEVEL_FROM_SCORE: [number, StaffCompetencyLevel][] = [
  [3.5, "specialist"],
  [2.5, "responsive"],
  [1.5, "informed"],
  [0, "awareness"],
];

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr)];
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / msPerDay
  );
}

function monthsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return (
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth()) +
    (e.getDate() >= s.getDate() ? 0 : -1)
  );
}

// ── 1. Staff Competency Evaluation ─────────────────────────────────────────

export function evaluateStaffCompetency(
  training: TraumaTrainingRecord[],
  referenceDate?: string
): StaffCompetencyEvaluation {
  const refDate = referenceDate ?? new Date().toISOString();

  if (training.length === 0) {
    return {
      trainingCoverageRate: 0,
      averageCompetencyScore: 0,
      averageCompetencyLevel: "awareness",
      specialistCount: 0,
      specialistAvailable: false,
      expiredTrainingCount: 0,
      expiringWithin30Days: 0,
      staffCount: 0,
      trainedStaffCount: 0,
      levelBreakdown: { awareness: 0, informed: 0, responsive: 0, specialist: 0 },
      score: 0,
    };
  }

  // Group by staff — take highest level per staff member
  const staffMap = new Map<string, { level: StaffCompetencyLevel; records: TraumaTrainingRecord[] }>();
  for (const rec of training) {
    const existing = staffMap.get(rec.staffId);
    if (!existing) {
      staffMap.set(rec.staffId, { level: rec.level, records: [rec] });
    } else {
      existing.records.push(rec);
      if (COMPETENCY_SCORES[rec.level] > COMPETENCY_SCORES[existing.level]) {
        existing.level = rec.level;
      }
    }
  }

  const staffCount = staffMap.size;
  const levels = [...staffMap.values()].map((s) => s.level);
  const levelBreakdown: Record<StaffCompetencyLevel, number> = {
    awareness: 0,
    informed: 0,
    responsive: 0,
    specialist: 0,
  };
  for (const l of levels) {
    levelBreakdown[l]++;
  }

  const specialistCount = levelBreakdown.specialist;
  const avgScore =
    levels.reduce((sum, l) => sum + COMPETENCY_SCORES[l], 0) / levels.length;
  const avgLevel =
    COMPETENCY_LEVEL_FROM_SCORE.find(([threshold]) => avgScore >= threshold)?.[1] ??
    "awareness";

  // Expiry tracking
  let expiredCount = 0;
  let expiringWithin30 = 0;
  for (const rec of training) {
    if (rec.expiryDate) {
      const daysToExpiry = daysBetween(refDate, rec.expiryDate);
      if (daysToExpiry < 0) expiredCount++;
      else if (daysToExpiry <= 30) expiringWithin30++;
    }
  }

  // Training coverage: percentage of staff at informed or above
  const trainedStaffCount = levels.filter(
    (l) => COMPETENCY_SCORES[l] >= COMPETENCY_SCORES.informed
  ).length;
  const trainingCoverageRate = round2((trainedStaffCount / staffCount) * 100);

  // Score (max 20)
  // Coverage: up to 8 points
  const coveragePts = (trainingCoverageRate / 100) * 8;
  // Average level: up to 6 points (4 levels, score 1-4 mapped to 0-6)
  const levelPts = ((avgScore - 1) / 3) * 6;
  // Specialist available: 3 points
  const specialistPts = specialistCount > 0 ? 3 : 0;
  // No expired training: 3 points (lose points for expired)
  const expiryPenalty = Math.min(expiredCount * 1, 3);
  const expiryPts = 3 - expiryPenalty;

  const score = round2(clamp(coveragePts + levelPts + specialistPts + expiryPts, 0, 20));

  return {
    trainingCoverageRate,
    averageCompetencyScore: round2(avgScore),
    averageCompetencyLevel: avgLevel,
    specialistCount,
    specialistAvailable: specialistCount > 0,
    expiredTrainingCount: expiredCount,
    expiringWithin30Days: expiringWithin30,
    staffCount,
    trainedStaffCount,
    levelBreakdown,
    score,
  };
}

// ── 2. Practice Quality Evaluation ─────────────────────────────────────────

export function evaluatePracticeQuality(
  interventions: TherapeuticInterventionRecord[]
): PracticeQualityEvaluation {
  if (interventions.length === 0) {
    return {
      principleCoverage: 0,
      principlesUsed: [],
      principlesMissing: [...ALL_PRINCIPLES],
      indicatorFrequency: {},
      indicatorsUsed: [],
      indicatorsMissing: [...ALL_INDICATORS],
      indicatorCoverage: 0,
      childResponseBreakdown: { positive: 0, neutral: 0, distressed: 0, refused: 0 },
      positiveResponseRate: 0,
      interventionVariety: 0,
      interventionTypes: [],
      perChildQuality: [],
      totalInterventions: 0,
      score: 0,
    };
  }

  // Principles
  const allUsedPrinciples = new Set<TraumaPrinciple>();
  for (const i of interventions) {
    for (const p of i.traumaPrinciplesApplied) {
      allUsedPrinciples.add(p);
    }
  }
  const principlesUsed = ALL_PRINCIPLES.filter((p) => allUsedPrinciples.has(p));
  const principlesMissing = ALL_PRINCIPLES.filter((p) => !allUsedPrinciples.has(p));
  const principleCoverage = round2((principlesUsed.length / ALL_PRINCIPLES.length) * 100);

  // Indicators
  const indicatorCounts: Record<string, number> = {};
  const allUsedIndicators = new Set<PracticeIndicator>();
  for (const i of interventions) {
    for (const ind of i.practiceIndicators) {
      allUsedIndicators.add(ind);
      indicatorCounts[ind] = (indicatorCounts[ind] ?? 0) + 1;
    }
  }
  const indicatorsUsed = ALL_INDICATORS.filter((ind) => allUsedIndicators.has(ind));
  const indicatorsMissing = ALL_INDICATORS.filter((ind) => !allUsedIndicators.has(ind));
  const indicatorCoverage = round2((indicatorsUsed.length / ALL_INDICATORS.length) * 100);

  // Child responses
  const responseBreakdown: Record<string, number> = {
    positive: 0,
    neutral: 0,
    distressed: 0,
    refused: 0,
  };
  for (const i of interventions) {
    responseBreakdown[i.childResponse]++;
  }
  const positiveResponseRate = round2(
    (responseBreakdown.positive / interventions.length) * 100
  );

  // Intervention variety
  const interventionTypes = uniqueStrings(interventions.map((i) => i.interventionType));
  const interventionVariety = interventionTypes.length;

  // Per-child quality
  const childMap = new Map<string, TherapeuticInterventionRecord[]>();
  for (const i of interventions) {
    const existing = childMap.get(i.childId) ?? [];
    existing.push(i);
    childMap.set(i.childId, existing);
  }

  const perChildQuality: PerChildQuality[] = [];
  for (const [childId, childInterventions] of childMap) {
    const childPrinciples = new Set<TraumaPrinciple>();
    let positiveCount = 0;
    for (const ci of childInterventions) {
      for (const p of ci.traumaPrinciplesApplied) childPrinciples.add(p);
      if (ci.childResponse === "positive") positiveCount++;
    }
    const applied = ALL_PRINCIPLES.filter((p) => childPrinciples.has(p));
    const gaps = ALL_PRINCIPLES.filter((p) => !childPrinciples.has(p));

    perChildQuality.push({
      childId,
      childName: childInterventions[0].childName,
      interventionCount: childInterventions.length,
      positiveResponseRate: round2((positiveCount / childInterventions.length) * 100),
      principlesApplied: applied,
      principleGaps: gaps,
    });
  }

  // Score (max 30)
  // Principle coverage: up to 10 points
  const principlePts = (principleCoverage / 100) * 10;
  // Indicator coverage: up to 8 points
  const indicatorPts = (indicatorCoverage / 100) * 8;
  // Positive response rate: up to 7 points
  const responsePts = (positiveResponseRate / 100) * 7;
  // Intervention variety: up to 5 points (5+ types = full marks)
  const varietyPts = Math.min(interventionVariety / 5, 1) * 5;

  const score = round2(clamp(principlePts + indicatorPts + responsePts + varietyPts, 0, 30));

  return {
    principleCoverage,
    principlesUsed,
    principlesMissing,
    indicatorFrequency: indicatorCounts,
    indicatorsUsed,
    indicatorsMissing,
    indicatorCoverage,
    childResponseBreakdown: responseBreakdown,
    positiveResponseRate,
    interventionVariety,
    interventionTypes,
    perChildQuality,
    totalInterventions: interventions.length,
    score,
  };
}

// ── 3. Environment Evaluation ──────────────────────────────────────────────

export function evaluateEnvironment(
  adaptations: EnvironmentalAdaptation[],
  referenceDate: string
): EnvironmentEvaluation {
  if (adaptations.length === 0) {
    return {
      totalAdaptations: 0,
      activeAdaptations: 0,
      adaptationCoverage: 0,
      principleAlignment: Object.fromEntries(
        ALL_PRINCIPLES.map((p) => [p, 0])
      ) as Record<TraumaPrinciple, number>,
      principlesCovered: [],
      principlesGap: [...ALL_PRINCIPLES],
      reviewCurrency: 0,
      overdueReviews: 0,
      childSpecificCount: 0,
      childSpecificRate: 0,
      plannedAdaptations: 0,
      score: 0,
    };
  }

  const activeAdaptations = adaptations.filter((a) => a.status === "active").length;
  const plannedAdaptations = adaptations.filter((a) => a.status === "planned").length;

  // Principle alignment
  const principleAlignment = Object.fromEntries(
    ALL_PRINCIPLES.map((p) => [p, 0])
  ) as Record<TraumaPrinciple, number>;
  for (const a of adaptations) {
    principleAlignment[a.traumaPrinciple]++;
  }
  const principlesCovered = ALL_PRINCIPLES.filter((p) => principleAlignment[p] > 0);
  const principlesGap = ALL_PRINCIPLES.filter((p) => principleAlignment[p] === 0);
  const adaptationCoverage = round2((principlesCovered.length / ALL_PRINCIPLES.length) * 100);

  // Review currency
  let overdueReviews = 0;
  for (const a of adaptations) {
    if (a.status !== "planned") {
      const daysUntilReview = daysBetween(referenceDate, a.reviewDate);
      if (daysUntilReview < 0) overdueReviews++;
    }
  }
  const reviewableCount = adaptations.filter((a) => a.status !== "planned").length;
  const reviewCurrency = reviewableCount > 0
    ? round2(((reviewableCount - overdueReviews) / reviewableCount) * 100)
    : 100;

  // Child-specific
  const childSpecificCount = adaptations.filter((a) => a.childSpecific).length;
  const childSpecificRate = round2((childSpecificCount / adaptations.length) * 100);

  // Score (max 15)
  // Adaptation coverage (principles): up to 5 points
  const coveragePts = (adaptationCoverage / 100) * 5;
  // Review currency: up to 4 points
  const reviewPts = (reviewCurrency / 100) * 4;
  // Child-specific adaptations: up to 3 points (>30% = full)
  const childSpecPts = Math.min(childSpecificRate / 30, 1) * 3;
  // Active adaptations count: up to 3 points (6+ = full)
  const activePts = Math.min(activeAdaptations / 6, 1) * 3;

  const score = round2(clamp(coveragePts + reviewPts + childSpecPts + activePts, 0, 15));

  return {
    totalAdaptations: adaptations.length,
    activeAdaptations,
    adaptationCoverage,
    principleAlignment,
    principlesCovered,
    principlesGap,
    reviewCurrency,
    overdueReviews,
    childSpecificCount,
    childSpecificRate,
    plannedAdaptations,
    score,
  };
}

// ── 4. Consultation Evaluation ─────────────────────────────────────────────

export function evaluateConsultation(
  consultations: ConsultationRecord[],
  childIds?: string[],
  periodStart?: string,
  periodEnd?: string
): ConsultationEvaluation {
  if (consultations.length === 0) {
    return {
      totalConsultations: 0,
      consultationFrequencyPerMonth: 0,
      actionCompletionRate: 0,
      childrenCoverage: 0,
      childrenDiscussedIds: [],
      childrenNotDiscussed: childIds ?? [],
      specialistVariety: 0,
      consultationTypes: [],
      totalActionsAgreed: 0,
      totalActionsCompleted: 0,
      score: 0,
    };
  }

  // Frequency per month
  let months = 1;
  if (periodStart && periodEnd) {
    months = Math.max(monthsBetween(periodStart, periodEnd), 1);
  }
  const consultationFrequencyPerMonth = round2(consultations.length / months);

  // Actions
  const totalActionsAgreed = consultations.reduce(
    (sum, c) => sum + c.actionsAgreed.length,
    0
  );
  const totalActionsCompleted = consultations.filter(
    (c) => c.actionsCompleted
  ).length * (totalActionsAgreed > 0 ? totalActionsAgreed / consultations.length : 0);

  // More accurate: count completed consultations' actions
  let completedActions = 0;
  let totalActions = 0;
  for (const c of consultations) {
    totalActions += c.actionsAgreed.length;
    if (c.actionsCompleted) {
      completedActions += c.actionsAgreed.length;
    }
  }
  const actionCompletionRate =
    totalActions > 0 ? round2((completedActions / totalActions) * 100) : 0;

  // Children coverage
  const childrenDiscussedIds = uniqueStrings(
    consultations.flatMap((c) => c.childrenDiscussed)
  );
  const allChildIds = childIds ?? childrenDiscussedIds;
  const childrenNotDiscussed = allChildIds.filter(
    (id) => !childrenDiscussedIds.includes(id)
  );
  const childrenCoverage =
    allChildIds.length > 0
      ? round2((childrenDiscussedIds.length / allChildIds.length) * 100)
      : 0;

  // Specialist variety
  const consultationTypes = uniqueStrings(
    consultations.map((c) => c.consultationType)
  );
  const specialistVariety = consultationTypes.length;

  // Score (max 15)
  // Frequency: up to 5 points (1+/month = full)
  const frequencyPts = Math.min(consultationFrequencyPerMonth, 1) * 5;
  // Action completion: up to 4 points
  const actionPts = (actionCompletionRate / 100) * 4;
  // Children coverage: up to 3 points
  const coveragePts = (childrenCoverage / 100) * 3;
  // Specialist variety: up to 3 points (3+ types = full)
  const varietyPts = Math.min(specialistVariety / 3, 1) * 3;

  const score = round2(
    clamp(frequencyPts + actionPts + coveragePts + varietyPts, 0, 15)
  );

  return {
    totalConsultations: consultations.length,
    consultationFrequencyPerMonth,
    actionCompletionRate,
    childrenCoverage,
    childrenDiscussedIds,
    childrenNotDiscussed,
    specialistVariety,
    consultationTypes,
    totalActionsAgreed: totalActions,
    totalActionsCompleted: completedActions,
    score,
  };
}

// ── 5. Trauma Screening Evaluation ─────────────────────────────────────────

export function evaluateTraumaScreening(
  screenings: TraumaScreening[],
  childIds: string[],
  referenceDate?: string
): TraumaScreeningEvaluation {
  if (childIds.length === 0) {
    return {
      screeningCoverage: 0,
      childrenScreened: [],
      childrenNotScreened: [],
      triggerDocumentationRate: 0,
      copingStrategyRate: 0,
      therapeuticNeedsAssessedRate: 0,
      referralRate: 0,
      averageTriggersPerChild: 0,
      averageCopingStrategiesPerChild: 0,
      overdueReviews: 0,
      score: 0,
    };
  }

  const refDate = referenceDate ?? new Date().toISOString();

  // Get latest screening per child
  const latestScreenings = new Map<string, TraumaScreening>();
  for (const s of screenings) {
    const existing = latestScreenings.get(s.childId);
    if (!existing || s.screeningDate > existing.screeningDate) {
      latestScreenings.set(s.childId, s);
    }
  }

  const childrenScreened = childIds.filter((id) => latestScreenings.has(id));
  const childrenNotScreened = childIds.filter((id) => !latestScreenings.has(id));
  const screeningCoverage = round2(
    (childrenScreened.length / childIds.length) * 100
  );

  const latestList = [...latestScreenings.values()];

  // Trigger documentation
  const withTriggers = latestList.filter(
    (s) => s.triggersIdentified.length > 0
  ).length;
  const triggerDocumentationRate =
    latestList.length > 0
      ? round2((withTriggers / latestList.length) * 100)
      : 0;

  // Coping strategies
  const withCoping = latestList.filter(
    (s) => s.copingStrategiesIdentified.length > 0
  ).length;
  const copingStrategyRate =
    latestList.length > 0
      ? round2((withCoping / latestList.length) * 100)
      : 0;

  // Therapeutic needs assessed
  const needsAssessed = latestList.filter(
    (s) => s.therapeuticNeedsAssessed
  ).length;
  const therapeuticNeedsAssessedRate =
    latestList.length > 0
      ? round2((needsAssessed / latestList.length) * 100)
      : 0;

  // Referral rate
  const referrals = latestList.filter((s) => s.referralMade).length;
  const referralRate =
    latestList.length > 0
      ? round2((referrals / latestList.length) * 100)
      : 0;

  // Averages
  const totalTriggers = latestList.reduce(
    (sum, s) => sum + s.triggersIdentified.length,
    0
  );
  const totalCoping = latestList.reduce(
    (sum, s) => sum + s.copingStrategiesIdentified.length,
    0
  );
  const averageTriggersPerChild =
    latestList.length > 0 ? round2(totalTriggers / latestList.length) : 0;
  const averageCopingStrategiesPerChild =
    latestList.length > 0 ? round2(totalCoping / latestList.length) : 0;

  // Overdue reviews
  let overdueReviews = 0;
  for (const s of latestList) {
    if (daysBetween(refDate, s.nextReviewDate) < 0) {
      overdueReviews++;
    }
  }

  // Score (max 20)
  // Screening coverage: up to 8 points
  const coveragePts = (screeningCoverage / 100) * 8;
  // Trigger documentation: up to 4 points
  const triggerPts = (triggerDocumentationRate / 100) * 4;
  // Coping strategy identification: up to 4 points
  const copingPts = (copingStrategyRate / 100) * 4;
  // Therapeutic needs + referrals: up to 4 points
  const needsPts = (therapeuticNeedsAssessedRate / 100) * 2;
  // Referral is positive: up to 2 points (having made referrals where appropriate)
  const referralPts = (referralRate / 100) * 2;

  const score = round2(
    clamp(coveragePts + triggerPts + copingPts + needsPts + referralPts, 0, 20)
  );

  return {
    screeningCoverage,
    childrenScreened,
    childrenNotScreened,
    triggerDocumentationRate,
    copingStrategyRate,
    therapeuticNeedsAssessedRate,
    referralRate,
    averageTriggersPerChild,
    averageCopingStrategiesPerChild,
    overdueReviews,
    score,
  };
}

// ── 6. Full Intelligence Report ────────────────────────────────────────────

export function generateTraumaInformedIntelligence(
  training: TraumaTrainingRecord[],
  interventions: TherapeuticInterventionRecord[],
  adaptations: EnvironmentalAdaptation[],
  consultations: ConsultationRecord[],
  screenings: TraumaScreening[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string
): TraumaInformedIntelligence {
  const staffCompetency = evaluateStaffCompetency(training, referenceDate);
  const practiceQuality = evaluatePracticeQuality(interventions);
  const environment = evaluateEnvironment(adaptations, referenceDate);
  const consultation = evaluateConsultation(
    consultations,
    childIds,
    periodStart,
    periodEnd
  );
  const traumaScreening = evaluateTraumaScreening(
    screenings,
    childIds,
    referenceDate
  );

  // Overall score (max 100)
  const overallScore = round2(
    staffCompetency.score +
      practiceQuality.score +
      environment.score +
      consultation.score +
      traumaScreening.score
  );

  // Rating
  let rating: OfstedRating;
  if (overallScore >= 80) rating = "outstanding";
  else if (overallScore >= 60) rating = "good";
  else if (overallScore >= 40) rating = "requires_improvement";
  else rating = "inadequate";

  // Strengths
  const strengths: string[] = [];
  if (staffCompetency.specialistAvailable) {
    strengths.push("Specialist trauma-informed practitioner available on staff team");
  }
  if (staffCompetency.trainingCoverageRate >= 80) {
    strengths.push(
      `Strong training coverage: ${staffCompetency.trainingCoverageRate}% of staff trained to informed level or above`
    );
  }
  if (practiceQuality.principleCoverage >= 80) {
    strengths.push(
      `Excellent principle coverage: ${practiceQuality.principleCoverage}% of trauma-informed principles actively applied`
    );
  }
  if (practiceQuality.positiveResponseRate >= 70) {
    strengths.push(
      `High positive response rate: ${practiceQuality.positiveResponseRate}% of interventions received positively by children`
    );
  }
  if (environment.adaptationCoverage >= 80) {
    strengths.push(
      "Environmental adaptations cover a wide range of trauma-informed principles"
    );
  }
  if (environment.childSpecificRate > 0) {
    strengths.push(
      `${environment.childSpecificCount} child-specific environmental adaptations demonstrate individualised care`
    );
  }
  if (consultation.consultationFrequencyPerMonth >= 1) {
    strengths.push(
      "Regular clinical consultation supports evidence-based practice"
    );
  }
  if (consultation.actionCompletionRate >= 80) {
    strengths.push(
      `Strong follow-through on consultation recommendations (${consultation.actionCompletionRate}% actions completed)`
    );
  }
  if (traumaScreening.screeningCoverage >= 80) {
    strengths.push(
      `Comprehensive trauma screening: ${traumaScreening.screeningCoverage}% of children screened`
    );
  }
  if (traumaScreening.copingStrategyRate >= 80) {
    strengths.push(
      "Coping strategies identified for most children supports proactive care planning"
    );
  }
  if (staffCompetency.expiredTrainingCount === 0 && training.length > 0) {
    strengths.push("All staff training is within date — no expired certifications");
  }

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (staffCompetency.trainingCoverageRate < 80) {
    areasForImprovement.push(
      `Training coverage at ${staffCompetency.trainingCoverageRate}% — target 80% staff trained to informed level or above`
    );
  }
  if (!staffCompetency.specialistAvailable) {
    areasForImprovement.push(
      "No specialist-level trauma-informed practitioner on staff team"
    );
  }
  if (staffCompetency.expiredTrainingCount > 0) {
    areasForImprovement.push(
      `${staffCompetency.expiredTrainingCount} staff training record(s) have expired and require renewal`
    );
  }
  if (practiceQuality.principlesMissing.length > 0) {
    areasForImprovement.push(
      `Trauma-informed principles not yet evidenced: ${practiceQuality.principlesMissing.join(", ")}`
    );
  }
  if (practiceQuality.indicatorsMissing.length > 0 && practiceQuality.indicatorCoverage < 70) {
    areasForImprovement.push(
      `Practice indicator coverage at ${practiceQuality.indicatorCoverage}% — aim to embed all 10 indicators`
    );
  }
  if (practiceQuality.positiveResponseRate < 50) {
    areasForImprovement.push(
      `Low positive response rate (${practiceQuality.positiveResponseRate}%) may indicate need to review intervention approaches`
    );
  }
  if (environment.overdueReviews > 0) {
    areasForImprovement.push(
      `${environment.overdueReviews} environmental adaptation(s) have overdue reviews`
    );
  }
  if (environment.principlesGap.length > 0) {
    areasForImprovement.push(
      `Environmental adaptations do not yet address: ${environment.principlesGap.join(", ")}`
    );
  }
  if (consultation.consultationFrequencyPerMonth < 1) {
    areasForImprovement.push(
      "Clinical consultation frequency below recommended monthly minimum"
    );
  }
  if (consultation.childrenNotDiscussed.length > 0) {
    areasForImprovement.push(
      `${consultation.childrenNotDiscussed.length} child(ren) not discussed in any consultation during the period`
    );
  }
  if (consultation.actionCompletionRate < 60) {
    areasForImprovement.push(
      `Consultation action completion rate at ${consultation.actionCompletionRate}% — requires improvement`
    );
  }
  if (traumaScreening.screeningCoverage < 100) {
    areasForImprovement.push(
      `Trauma screening coverage at ${traumaScreening.screeningCoverage}% — all children should be screened`
    );
  }
  if (traumaScreening.overdueReviews > 0) {
    areasForImprovement.push(
      `${traumaScreening.overdueReviews} trauma screening review(s) are overdue`
    );
  }

  // Actions
  const actions: string[] = [];
  if (staffCompetency.expiredTrainingCount > 0) {
    actions.push(
      "Arrange refresher training for staff with expired trauma-informed certifications"
    );
  }
  if (staffCompetency.expiringWithin30Days > 0) {
    actions.push(
      `Book renewal training for ${staffCompetency.expiringWithin30Days} staff member(s) with training expiring within 30 days`
    );
  }
  if (!staffCompetency.specialistAvailable) {
    actions.push(
      "Identify and support a staff member to undertake specialist trauma-informed training"
    );
  }
  if (practiceQuality.principlesMissing.length > 0) {
    actions.push(
      "Incorporate missing trauma-informed principles into team practice through reflective sessions"
    );
  }
  if (practiceQuality.positiveResponseRate < 50) {
    actions.push(
      "Review intervention approaches with clinical consultant to improve child engagement"
    );
  }
  if (environment.overdueReviews > 0) {
    actions.push(
      "Complete overdue environmental adaptation reviews and update where needed"
    );
  }
  if (consultation.consultationFrequencyPerMonth < 1) {
    actions.push(
      "Schedule monthly clinical consultation sessions to maintain recommended frequency"
    );
  }
  if (consultation.childrenNotDiscussed.length > 0) {
    actions.push(
      "Ensure all children are discussed in clinical consultations over the next review period"
    );
  }
  if (traumaScreening.childrenNotScreened.length > 0) {
    actions.push(
      "Complete trauma screenings for all unscreened children as a priority"
    );
  }
  if (traumaScreening.overdueReviews > 0) {
    actions.push(
      "Schedule overdue trauma screening reviews to maintain assessment currency"
    );
  }
  if (practiceQuality.indicatorCoverage < 70) {
    actions.push(
      "Develop practice guidance to embed underused practice indicators across the team"
    );
  }

  // Regulatory links
  const regulatoryLinks: RegulatoryLink[] = [
    {
      regulation: "CHR 2015 Reg 6",
      description: "Quality of care standard",
      relevance:
        "Trauma-informed practice directly supports the quality of care provided, ensuring individualised, evidence-based approaches",
    },
    {
      regulation: "CHR 2015 Reg 10",
      description: "Positive relationships",
      relevance:
        "Trauma-informed principles of safety, trust, and collaboration underpin the development of positive relationships with children",
    },
    {
      regulation: "CHR 2015 Reg 12",
      description: "Protection of children",
      relevance:
        "Understanding trauma responses helps staff distinguish between challenging behaviour and distress, supporting proportionate safeguarding",
    },
    {
      regulation: "SCCIF Quality of Care",
      description: "Social Care Common Inspection Framework",
      relevance:
        "Inspectors assess whether care is informed by an understanding of the impact of trauma, abuse, and neglect",
    },
    {
      regulation: "NICE CG26",
      description: "Post-traumatic stress disorder (PTSD)",
      relevance:
        "Clinical guidance on recognition and treatment of PTSD informs screening, referral, and therapeutic intervention approaches",
    },
    {
      regulation: "Working Together 2023",
      description: "Multi-agency safeguarding arrangements",
      relevance:
        "Trauma-informed practice supports effective multi-agency working and information sharing to protect children",
    },
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    generatedAt: referenceDate,
    overallScore,
    rating,
    staffCompetency,
    practiceQuality,
    environment,
    consultation,
    traumaScreening,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Utility Functions ──────────────────────────────────────────────────────

export function getRatingLabel(rating: OfstedRating): string {
  const labels: Record<OfstedRating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating];
}

export function getRatingColour(rating: OfstedRating): string {
  const colours: Record<OfstedRating, string> = {
    outstanding: "text-green-600",
    good: "text-blue-600",
    requires_improvement: "text-amber-600",
    inadequate: "text-red-600",
  };
  return colours[rating];
}

export function getCompetencyLabel(level: StaffCompetencyLevel): string {
  const labels: Record<StaffCompetencyLevel, string> = {
    awareness: "Awareness",
    informed: "Informed",
    responsive: "Responsive",
    specialist: "Specialist",
  };
  return labels[level];
}

export function getPrincipleLabel(principle: TraumaPrinciple): string {
  const labels: Record<TraumaPrinciple, string> = {
    safety: "Safety",
    trustworthiness: "Trustworthiness",
    choice: "Choice",
    collaboration: "Collaboration",
    empowerment: "Empowerment",
    cultural_sensitivity: "Cultural Sensitivity",
  };
  return labels[principle];
}

export function getIndicatorLabel(indicator: PracticeIndicator): string {
  const labels: Record<PracticeIndicator, string> = {
    predictable_routines: "Predictable Routines",
    safe_spaces: "Safe Spaces",
    emotional_regulation_support: "Emotional Regulation Support",
    co_regulation: "Co-Regulation",
    sensory_awareness: "Sensory Awareness",
    relationship_repair: "Relationship Repair",
    therapeutic_parenting: "Therapeutic Parenting",
    life_story_work: "Life Story Work",
    psychoeducation: "Psychoeducation",
    strengths_based_language: "Strengths-Based Language",
  };
  return labels[indicator];
}
