import { above, below, meanOf, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// Pet Therapy & Animal Interaction Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home manages therapeutic animal interactions:
//   1. Session Quality (engagement, therapeutic benefit, consistency)
//   2. Animal Welfare (health checks, welfare standards, environment)
//   3. Risk Management (assessments, allergies, hygiene, supervision)
//   4. Staff Readiness (training, animal handling, therapeutic awareness)
//
// Regulatory: CHR 2015 Reg 10 (health and wellbeing), CHR 2015 Reg 12
//             (positive relationships), SCCIF, Animal Welfare Act 2006,
//             NMS 3, Health and Safety at Work Act 1974, NICE CG170
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type AnimalType =
  | "dog"
  | "cat"
  | "horse"
  | "rabbit"
  | "guinea_pig"
  | "fish"
  | "bird"
  | "farm_animal"
  | "other";

export type SessionType =
  | "structured_therapy"
  | "informal_interaction"
  | "equine_therapy"
  | "animal_assisted_learning"
  | "care_responsibility"
  | "visiting_animal"
  | "other";

export type TherapeuticBenefit =
  | "significant"
  | "moderate"
  | "some"
  | "minimal"
  | "not_assessed";

export type WelfareStatus =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "concern_raised";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const animalTypeLabels: Record<AnimalType, string> = {
  dog: "Dog",
  cat: "Cat",
  horse: "Horse",
  rabbit: "Rabbit",
  guinea_pig: "Guinea Pig",
  fish: "Fish",
  bird: "Bird",
  farm_animal: "Farm Animal",
  other: "Other",
};

const sessionTypeLabels: Record<SessionType, string> = {
  structured_therapy: "Structured Therapy",
  informal_interaction: "Informal Interaction",
  equine_therapy: "Equine Therapy",
  animal_assisted_learning: "Animal Assisted Learning",
  care_responsibility: "Care Responsibility",
  visiting_animal: "Visiting Animal",
  other: "Other",
};

const therapeuticBenefitLabels: Record<TherapeuticBenefit, string> = {
  significant: "Significant",
  moderate: "Moderate",
  some: "Some",
  minimal: "Minimal",
  not_assessed: "Not Assessed",
};

const welfareStatusLabels: Record<WelfareStatus, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
  concern_raised: "Concern Raised",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getAnimalTypeLabel(t: AnimalType): string {
  return animalTypeLabels[t] ?? t;
}
export function getSessionTypeLabel(t: SessionType): string {
  return sessionTypeLabels[t] ?? t;
}
export function getTherapeuticBenefitLabel(b: TherapeuticBenefit): string {
  return therapeuticBenefitLabels[b] ?? b;
}
export function getWelfareStatusLabel(s: WelfareStatus): string {
  return welfareStatusLabels[s] ?? s;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface AnimalSession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  animalType: AnimalType;
  sessionType: SessionType;
  facilitatedBy: string;
  therapeuticBenefit: TherapeuticBenefit;
  childEngaged: boolean;
  riskAssessmentCompleted: boolean;
  supervisedThroughout: boolean;
  hygieneProtocolFollowed: boolean;
}

export interface AnimalWelfareCheck {
  id: string;
  animalType: AnimalType;
  animalName: string;
  checkDate: string;
  checkedBy: string;
  welfareStatus: WelfareStatus;
  veterinaryUpToDate: boolean;
  vaccinationsCurrentt: boolean;
  livingConditionsAdequate: boolean;
  dietAppropriate: boolean;
  exerciseProvided: boolean;
}

export interface AnimalRiskAssessment {
  id: string;
  assessmentDate: string;
  assessedBy: string;
  allergyScreeningCompleted: boolean;
  zoonoticRiskAssessed: boolean;
  biteRiskAssessed: boolean;
  hygieneProtocolInPlace: boolean;
  insuranceCurrent: boolean;
  emergencyPlanInPlace: boolean;
}

export interface StaffAnimalTraining {
  id: string;
  staffId: string;
  staffName: string;
  animalHandling: boolean;
  therapeuticAnimalUse: boolean;
  animalWelfare: boolean;
  riskAssessment: boolean;
  hygieneProtocols: boolean;
  allergyAwareness: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface SessionQualityResult {
  overallScore: number;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  therapeuticBenefitRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childEngagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supervisionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  hygieneRate: number | null;
}

export interface AnimalWelfareResult {
  overallScore: number;
  totalChecks: number;
  /** null when the population is empty — nothing measured, not 0%. */
  welfareGoodRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  veterinaryRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  vaccinationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  livingConditionsRate: number | null;
}

export interface RiskManagementResult {
  overallScore: number;
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  allergyScreeningRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  zoonoticRiskRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  hygieneProtocolRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  insuranceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  emergencyPlanRate: number | null;
}

export interface StaffAnimalReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  animalHandlingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  therapeuticUseRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  animalWelfareRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  hygieneRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  allergyRate: number | null;
}

export interface ChildAnimalProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  therapeuticBenefitPositive: boolean;
  engagementRate: number;
  overallScore: number;
}

export interface PetTherapyAnimalInteractionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sessionQuality: SessionQualityResult;
  animalWelfare: AnimalWelfareResult;
  riskManagement: RiskManagementResult;
  staffAnimalReadiness: StaffAnimalReadinessResult;
  childProfiles: ChildAnimalProfile[];
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
 * Evaluates session quality and therapeutic benefit.
 * Empty = 0 (no sessions = no evidence of animal-assisted therapy).
 *
 *   Therapeutic benefit rate (significant + moderate)  → 0-7
 *   Child engagement rate                              → 0-6
 *   Risk assessment completion rate                    → 0-6
 *   Supervision + hygiene combined rate                → 0-6
 */
export function evaluateSessionQuality(
  sessions: AnimalSession[],
): SessionQualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      therapeuticBenefitRate: null,
      childEngagementRate: null,
      riskAssessmentRate: null,
      supervisionRate: null,
      hygieneRate: null,
    };
  }

  let score = 0;

  const beneficial = sessions.filter(
    (s) =>
      s.therapeuticBenefit === "significant" ||
      s.therapeuticBenefit === "moderate",
  ).length;
  const therapeuticBenefitRate = rate(beneficial, sessions.length);
  if (meets(therapeuticBenefitRate, 80)) score += 7;
  else if (meets(therapeuticBenefitRate, 60)) score += 5;
  else if (meets(therapeuticBenefitRate, 40)) score += 3;
  else if (above(therapeuticBenefitRate, 0)) score += 1;

  const engaged = sessions.filter((s) => s.childEngaged).length;
  const childEngagementRate = rate(engaged, sessions.length);
  if (meets(childEngagementRate, 90)) score += 6;
  else if (meets(childEngagementRate, 70)) score += 4;
  else if (meets(childEngagementRate, 50)) score += 3;
  else if (above(childEngagementRate, 0)) score += 1;

  const riskAssessed = sessions.filter(
    (s) => s.riskAssessmentCompleted,
  ).length;
  const riskAssessmentRate = rate(riskAssessed, sessions.length);
  if (meets(riskAssessmentRate, 90)) score += 6;
  else if (meets(riskAssessmentRate, 70)) score += 4;
  else if (meets(riskAssessmentRate, 50)) score += 3;
  else if (above(riskAssessmentRate, 0)) score += 1;

  const supervised = sessions.filter(
    (s) => s.supervisedThroughout,
  ).length;
  const supervisionRate = rate(supervised, sessions.length);
  const hygienic = sessions.filter(
    (s) => s.hygieneProtocolFollowed,
  ).length;
  const hygieneRate = rate(hygienic, sessions.length);
  const combinedSafetyRate = meanOf([supervisionRate, hygieneRate]) ?? 0; // unmeasured earns no bonus
  if (combinedSafetyRate >= 90) score += 6;
  else if (combinedSafetyRate >= 70) score += 4;
  else if (combinedSafetyRate >= 50) score += 3;
  else if (combinedSafetyRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalSessions: sessions.length,
    therapeuticBenefitRate,
    childEngagementRate,
    riskAssessmentRate,
    supervisionRate,
    hygieneRate,
  };
}

/**
 * Evaluates animal welfare standards.
 * Empty = 0 (no welfare checks = no evidence of animal care).
 *
 *   Welfare good+ rate (excellent + good)  → 0-7
 *   Veterinary up to date rate             → 0-6
 *   Vaccination current rate               → 0-6
 *   Living conditions adequate rate        → 0-6
 */
export function evaluateAnimalWelfare(
  checks: AnimalWelfareCheck[],
): AnimalWelfareResult {
  if (checks.length === 0) {
    return {
      overallScore: 0,
      totalChecks: 0,
      welfareGoodRate: null,
      veterinaryRate: null,
      vaccinationRate: null,
      livingConditionsRate: null,
    };
  }

  let score = 0;

  const good = checks.filter(
    (c) => c.welfareStatus === "excellent" || c.welfareStatus === "good",
  ).length;
  const welfareGoodRate = rate(good, checks.length);
  if (meets(welfareGoodRate, 90)) score += 7;
  else if (meets(welfareGoodRate, 70)) score += 5;
  else if (meets(welfareGoodRate, 50)) score += 3;
  else if (above(welfareGoodRate, 0)) score += 1;

  const vet = checks.filter((c) => c.veterinaryUpToDate).length;
  const veterinaryRate = rate(vet, checks.length);
  if (meets(veterinaryRate, 90)) score += 6;
  else if (meets(veterinaryRate, 70)) score += 4;
  else if (meets(veterinaryRate, 50)) score += 3;
  else if (above(veterinaryRate, 0)) score += 1;

  const vax = checks.filter((c) => c.vaccinationsCurrentt).length;
  const vaccinationRate = rate(vax, checks.length);
  if (meets(vaccinationRate, 90)) score += 6;
  else if (meets(vaccinationRate, 70)) score += 4;
  else if (meets(vaccinationRate, 50)) score += 3;
  else if (above(vaccinationRate, 0)) score += 1;

  const conditions = checks.filter(
    (c) => c.livingConditionsAdequate,
  ).length;
  const livingConditionsRate = rate(conditions, checks.length);
  if (meets(livingConditionsRate, 90)) score += 6;
  else if (meets(livingConditionsRate, 70)) score += 4;
  else if (meets(livingConditionsRate, 50)) score += 3;
  else if (above(livingConditionsRate, 0)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalChecks: checks.length,
    welfareGoodRate,
    veterinaryRate,
    vaccinationRate,
    livingConditionsRate,
  };
}

/**
 * Evaluates risk management for animal interactions.
 * Empty = 0 (no risk assessments = no evidence of risk management).
 *
 *   Allergy screening rate      → 0-7
 *   Zoonotic risk assessed rate → 0-6
 *   Hygiene protocol rate       → 0-6
 *   Insurance + emergency plan  → 0-6
 */
export function evaluateRiskManagement(
  assessments: AnimalRiskAssessment[],
): RiskManagementResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      allergyScreeningRate: null,
      zoonoticRiskRate: null,
      hygieneProtocolRate: null,
      insuranceRate: null,
      emergencyPlanRate: null,
    };
  }

  let score = 0;

  const allergy = assessments.filter(
    (a) => a.allergyScreeningCompleted,
  ).length;
  const allergyScreeningRate = rate(allergy, assessments.length);
  if (meets(allergyScreeningRate, 90)) score += 7;
  else if (meets(allergyScreeningRate, 70)) score += 5;
  else if (meets(allergyScreeningRate, 50)) score += 3;
  else if (above(allergyScreeningRate, 0)) score += 1;

  const zoonotic = assessments.filter(
    (a) => a.zoonoticRiskAssessed,
  ).length;
  const zoonoticRiskRate = rate(zoonotic, assessments.length);
  if (meets(zoonoticRiskRate, 90)) score += 6;
  else if (meets(zoonoticRiskRate, 70)) score += 4;
  else if (meets(zoonoticRiskRate, 50)) score += 3;
  else if (above(zoonoticRiskRate, 0)) score += 1;

  const hygiene = assessments.filter(
    (a) => a.hygieneProtocolInPlace,
  ).length;
  const hygieneProtocolRate = rate(hygiene, assessments.length);
  if (meets(hygieneProtocolRate, 90)) score += 6;
  else if (meets(hygieneProtocolRate, 70)) score += 4;
  else if (meets(hygieneProtocolRate, 50)) score += 3;
  else if (above(hygieneProtocolRate, 0)) score += 1;

  const insurance = assessments.filter(
    (a) => a.insuranceCurrent,
  ).length;
  const insuranceRate = rate(insurance, assessments.length);
  const emergency = assessments.filter(
    (a) => a.emergencyPlanInPlace,
  ).length;
  const emergencyPlanRate = rate(emergency, assessments.length);
  const combinedRate = meanOf([insuranceRate, emergencyPlanRate]) ?? 0;
  if (combinedRate >= 90) score += 6;
  else if (combinedRate >= 70) score += 4;
  else if (combinedRate >= 50) score += 3;
  else if (combinedRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalAssessments: assessments.length,
    allergyScreeningRate,
    zoonoticRiskRate,
    hygieneProtocolRate,
    insuranceRate,
    emergencyPlanRate,
  };
}

/**
 * Evaluates staff training on animal-assisted therapy.
 * Empty = 0 (no trained staff = no readiness).
 *
 *   Animal handling rate           → 0-6
 *   Therapeutic animal use rate    → 0-5
 *   Animal welfare awareness rate  → 0-5
 *   Risk assessment rate           → 0-4
 *   Hygiene protocols rate         → 0-3
 *   Allergy awareness rate         → 0-2
 */
export function evaluateStaffAnimalReadiness(
  training: StaffAnimalTraining[],
): StaffAnimalReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      animalHandlingRate: null,
      therapeuticUseRate: null,
      animalWelfareRate: null,
      riskAssessmentRate: null,
      hygieneRate: null,
      allergyRate: null,
    };
  }

  let score = 0;

  const handling = training.filter((t) => t.animalHandling).length;
  const animalHandlingRate = rate(handling, training.length);
  if (meets(animalHandlingRate, 90)) score += 6;
  else if (meets(animalHandlingRate, 70)) score += 4;
  else if (meets(animalHandlingRate, 50)) score += 3;
  else if (above(animalHandlingRate, 0)) score += 1;

  const therapeutic = training.filter(
    (t) => t.therapeuticAnimalUse,
  ).length;
  const therapeuticUseRate = rate(therapeutic, training.length);
  if (meets(therapeuticUseRate, 90)) score += 5;
  else if (meets(therapeuticUseRate, 70)) score += 3;
  else if (meets(therapeuticUseRate, 50)) score += 2;
  else if (above(therapeuticUseRate, 0)) score += 1;

  const welfare = training.filter((t) => t.animalWelfare).length;
  const animalWelfareRate = rate(welfare, training.length);
  if (meets(animalWelfareRate, 90)) score += 5;
  else if (meets(animalWelfareRate, 70)) score += 3;
  else if (meets(animalWelfareRate, 50)) score += 2;
  else if (above(animalWelfareRate, 0)) score += 1;

  const risk = training.filter((t) => t.riskAssessment).length;
  const riskAssessmentRate = rate(risk, training.length);
  if (meets(riskAssessmentRate, 90)) score += 4;
  else if (meets(riskAssessmentRate, 70)) score += 3;
  else if (meets(riskAssessmentRate, 50)) score += 2;
  else if (above(riskAssessmentRate, 0)) score += 1;

  const hygiene = training.filter((t) => t.hygieneProtocols).length;
  const hygieneRate = rate(hygiene, training.length);
  if (meets(hygieneRate, 90)) score += 3;
  else if (meets(hygieneRate, 70)) score += 2;
  else if (meets(hygieneRate, 50)) score += 1;

  const allergy = training.filter((t) => t.allergyAwareness).length;
  const allergyRate = rate(allergy, training.length);
  if (meets(allergyRate, 90)) score += 2;
  else if (meets(allergyRate, 70)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    animalHandlingRate,
    therapeuticUseRate,
    animalWelfareRate,
    riskAssessmentRate,
    hygieneRate,
    allergyRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildAnimalProfiles(
  sessions: AnimalSession[],
): ChildAnimalProfile[] {
  const childMap = new Map<
    string,
    { childId: string; childName: string; sessions: AnimalSession[] }
  >();

  for (const s of sessions) {
    if (!childMap.has(s.childId)) {
      childMap.set(s.childId, {
        childId: s.childId,
        childName: s.childName,
        sessions: [],
      });
    }
    childMap.get(s.childId)!.sessions.push(s);
  }

  return Array.from(childMap.values()).map((entry) => {
    let score = 0;

    // Sessions attended (0-3)
    if (entry.sessions.length >= 5) score += 3;
    else if (entry.sessions.length >= 3) score += 2;
    else if (entry.sessions.length >= 1) score += 1;

    // Therapeutic benefit (0-3)
    const beneficial = entry.sessions.filter(
      (s) =>
        s.therapeuticBenefit === "significant" ||
        s.therapeuticBenefit === "moderate",
    ).length;
    const benefitRate = rate(beneficial, entry.sessions.length);
    if (meets(benefitRate, 80)) score += 3;
    else if (meets(benefitRate, 50)) score += 2;
    else if (above(benefitRate, 0)) score += 1;

    // Engagement (0-2)
    const engaged = entry.sessions.filter((s) => s.childEngaged).length;
    const engagementRate = rate(engaged, entry.sessions.length)!;
    if (meets(engagementRate, 80)) score += 2;
    else if (meets(engagementRate, 50)) score += 1;

    // Safety (risk + supervision + hygiene) (0-2)
    const safeSession = entry.sessions.filter(
      (s) =>
        s.riskAssessmentCompleted &&
        s.supervisedThroughout &&
        s.hygieneProtocolFollowed,
    ).length;
    const safeRate = rate(safeSession, entry.sessions.length);
    if (meets(safeRate, 90)) score += 2;
    else if (meets(safeRate, 50)) score += 1;

    return {
      childId: entry.childId,
      childName: entry.childName,
      totalSessions: entry.sessions.length,
      therapeuticBenefitPositive: meets(benefitRate, 50),
      engagementRate,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generatePetTherapyAnimalInteractionIntelligence(
  sessions: AnimalSession[],
  welfareChecks: AnimalWelfareCheck[],
  riskAssessments: AnimalRiskAssessment[],
  training: StaffAnimalTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PetTherapyAnimalInteractionIntelligence {
  const sessionQuality = evaluateSessionQuality(sessions);
  const animalWelfare = evaluateAnimalWelfare(welfareChecks);
  const riskManagement = evaluateRiskManagement(riskAssessments);
  const staffAnimalReadiness = evaluateStaffAnimalReadiness(training);

  const rawScore =
    sessionQuality.overallScore +
    animalWelfare.overallScore +
    riskManagement.overallScore +
    staffAnimalReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildAnimalProfiles(sessions);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (meets(sessionQuality.therapeuticBenefitRate, 80) && sessions.length > 0) {
    strengths.push(
      "Strong therapeutic benefit from animal-assisted sessions — children benefiting significantly",
    );
  }
  if (meets(sessionQuality.childEngagementRate, 90) && sessions.length > 0) {
    strengths.push(
      "Excellent child engagement with animal therapy sessions",
    );
  }
  if (meets(animalWelfare.welfareGoodRate, 90) && welfareChecks.length > 0) {
    strengths.push(
      "Animal welfare standards consistently excellent or good",
    );
  }
  if (meets(animalWelfare.veterinaryRate, 90) && welfareChecks.length > 0) {
    strengths.push(
      "Veterinary care consistently up to date for all animals",
    );
  }
  if (meets(riskManagement.allergyScreeningRate, 90) && riskAssessments.length > 0) {
    strengths.push(
      "Comprehensive allergy screening completed for all animal interactions",
    );
  }
  if (
    meets(staffAnimalReadiness.animalHandlingRate, 90) &&
    training.length > 0
  ) {
    strengths.push(
      "Staff team fully trained in safe animal handling",
    );
  }
  if (
    meets(staffAnimalReadiness.therapeuticUseRate, 90) &&
    training.length > 0
  ) {
    strengths.push(
      "Staff team trained in therapeutic animal-assisted interventions",
    );
  }
  if (meets(sessionQuality.riskAssessmentRate, 90) && sessions.length > 0) {
    strengths.push(
      "Risk assessments consistently completed before animal sessions",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (below(sessionQuality.therapeuticBenefitRate, 60) && sessions.length > 0) {
    areasForImprovement.push(
      "Therapeutic benefit from animal sessions below expected standard — review session structure",
    );
  }
  if (below(sessionQuality.riskAssessmentRate, 70) && sessions.length > 0) {
    areasForImprovement.push(
      "Risk assessments not consistently completed before animal sessions",
    );
  }
  if (below(animalWelfare.welfareGoodRate, 70) && welfareChecks.length > 0) {
    areasForImprovement.push(
      "Animal welfare standards below expected level — review animal care practices",
    );
  }
  if (below(riskManagement.hygieneProtocolRate, 70) && riskAssessments.length > 0) {
    areasForImprovement.push(
      "Hygiene protocols not consistently in place for animal interactions",
    );
  }
  if (
    below(staffAnimalReadiness.therapeuticUseRate, 70) &&
    training.length > 0
  ) {
    areasForImprovement.push(
      "Staff training in therapeutic animal use needs strengthening",
    );
  }
  if (
    below(staffAnimalReadiness.allergyRate, 70) &&
    training.length > 0
  ) {
    areasForImprovement.push(
      "Staff allergy awareness training needs improvement",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (sessions.length === 0) {
    actions.push(
      "No animal interaction sessions recorded — consider implementing animal-assisted therapy programme",
    );
  }
  if (welfareChecks.length === 0 && sessions.length > 0) {
    actions.push(
      "URGENT: No animal welfare checks recorded — implement welfare monitoring immediately",
    );
  }
  if (riskAssessments.length === 0 && sessions.length > 0) {
    actions.push(
      "URGENT: No risk assessments recorded — complete before any further animal interactions",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff animal handling training records — deliver training before animal interactions continue",
    );
  }
  const poorWelfare = welfareChecks.filter(
    (c) => c.welfareStatus === "poor" || c.welfareStatus === "concern_raised",
  );
  if (poorWelfare.length > 0) {
    actions.push(
      `URGENT: ${poorWelfare.length} animal welfare concern(s) identified — review animal care arrangements immediately`,
    );
  }
  if (below(riskManagement.insuranceRate, 100) && riskAssessments.length > 0) {
    actions.push(
      "Ensure insurance cover is current for all animal interactions",
    );
  }
  if (below(sessionQuality.hygieneRate, 70) && sessions.length > 0) {
    actions.push(
      "Improve hygiene protocol compliance during animal sessions",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and wellbeing standard",
    "CHR 2015 Reg 12 — The positive relationships standard",
    "SCCIF — Social Care Common Inspection Framework (therapeutic provision)",
    "Animal Welfare Act 2006 — Duty of care to animals",
    "NMS 3 — National Minimum Standards (positive behaviour and therapeutic care)",
    "Health and Safety at Work Act 1974 — Risk assessment and safe practices",
    "NICE CG170 — Autism spectrum disorder in children (animal-assisted therapy evidence)",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sessionQuality,
    animalWelfare,
    riskManagement,
    staffAnimalReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
