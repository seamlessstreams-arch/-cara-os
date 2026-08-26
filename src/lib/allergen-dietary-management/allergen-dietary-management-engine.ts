import { below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// ALLERGEN & DIETARY MANAGEMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing the quality and compliance of
// allergen management and dietary requirement tracking in children's
// residential care. Covers allergy records, emergency response planning,
// cross-contamination prevention, meal planning, and staff competence.
//
// Regulatory basis:
//   - CHR 2015, Reg 10 — Health and wellbeing
//   - CHR 2015, Reg 12 — Safeguarding (risk to health)
//   - SCCIF — How well children are helped and protected
//   - NMS 4 — Safeguarding and promoting health
//   - Food Safety Act 1990 — Food safety obligations
//   - Natasha's Law (PPDS) 2021 — Allergen labelling
//   - UNCRC Article 24 — Right to the highest standard of health
//
// No AI. No external calls. Pure input → output.
// ==============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

export type AllergenType =
  | "nuts"
  | "peanuts"
  | "dairy"
  | "eggs"
  | "gluten"
  | "soya"
  | "shellfish"
  | "fish"
  | "sesame"
  | "celery"
  | "mustard"
  | "lupin"
  | "sulphites"
  | "molluscs"
  | "other";

export type DietaryRequirement =
  | "halal"
  | "kosher"
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "dairy_free"
  | "medical_diet"
  | "cultural_preference"
  | "none";

export type SeverityLevel =
  | "mild"
  | "moderate"
  | "severe"
  | "life_threatening";

export type EmergencyPlanStatus =
  | "current"
  | "expired"
  | "not_in_place"
  | "under_review";

export type MealComplianceStatus =
  | "fully_compliant"
  | "partially_compliant"
  | "non_compliant"
  | "not_assessed";

export type TrainingCompetence =
  | "fully_competent"
  | "needs_refresher"
  | "not_trained"
  | "in_training";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface ChildAllergenProfile {
  id: string;
  childId: string;
  childName: string;
  allergens: AllergenType[];
  severities: Record<string, SeverityLevel>;
  dietaryRequirements: DietaryRequirement[];
  emergencyPlanStatus: EmergencyPlanStatus;
  epiPenAvailable: boolean | null;
  epiPenExpiryDate: string | null;
  gpNotified: boolean;
  socialWorkerNotified: boolean;
  lastReviewDate: string;
  reviewDue: string;
}

export interface AllergenIncident {
  id: string;
  childId: string;
  childName: string;
  date: string;
  allergenInvolved: AllergenType;
  severity: SeverityLevel;
  crossContamination: boolean;
  staffResponseTimely: boolean;
  emergencyPlanFollowed: boolean;
  medicalAttentionRequired: boolean;
  hospitalVisit: boolean;
  rootCauseIdentified: boolean;
  preventiveMeasuresImplemented: boolean;
}

export interface MealPlanRecord {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  allergenLabelled: boolean;
  dietaryRequirementsMet: boolean;
  crossContaminationPrevented: boolean;
  childConsulted: boolean;
  complianceStatus: MealComplianceStatus;
}

export interface StaffAllergenTraining {
  id: string;
  staffId: string;
  staffName: string;
  allergenAwareness: boolean;
  epiPenTrained: boolean;
  epiPenExpiryDate: string | null;
  foodHygieneCertified: boolean;
  crossContaminationTrained: boolean;
  anaphylaxisTrained: boolean;
  competenceLevel: TrainingCompetence;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface AllergenDocumentationResult {
  overallScore: number;
  totalChildren: number;
  childrenWithAllergens: number;
  /** null when the population is empty — nothing measured, not 0%. */
  emergencyPlanCurrentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  epiPenAvailableRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  gpNotifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  socialWorkerNotifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reviewUpToDateRate: number | null;
  lifeThreatening: number;
}

export interface MealSafetyResult {
  overallScore: number;
  totalMeals: number;
  /** null when the population is empty — nothing measured, not 0%. */
  allergenLabelledRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  dietaryMetRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  crossContaminationPreventedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childConsultedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  fullyCompliantRate: number | null;
}

export interface IncidentResponseResult {
  overallScore: number;
  totalIncidents: number;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyResponseRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  emergencyPlanFollowedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  rootCauseIdentifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  preventiveMeasuresRate: number | null;
  hospitalVisitCount: number;
}

export interface StaffCompetenceResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  allergenAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  epiPenTrainedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  foodHygieneRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  crossContaminationTrainedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  anaphylaxisTrainedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  fullyCompetentRate: number | null;
}

export interface ChildAllergenSummary {
  childId: string;
  childName: string;
  allergenCount: number;
  hasLifeThreatening: boolean;
  emergencyPlanCurrent: boolean;
  epiPenAvailable: boolean;
  incidentCount: number;
  overallScore: number;
}

export interface AllergenDietaryManagementIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  allergenDocumentation: AllergenDocumentationResult;
  mealSafety: MealSafetyResult;
  incidentResponse: IncidentResponseResult;
  staffCompetence: StaffCompetenceResult;
  childSummaries: ChildAllergenSummary[];
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

const ALLERGEN_TYPE_LABELS: Record<AllergenType, string> = {
  nuts: "Tree Nuts",
  peanuts: "Peanuts",
  dairy: "Dairy",
  eggs: "Eggs",
  gluten: "Gluten",
  soya: "Soya",
  shellfish: "Shellfish",
  fish: "Fish",
  sesame: "Sesame",
  celery: "Celery",
  mustard: "Mustard",
  lupin: "Lupin",
  sulphites: "Sulphites",
  molluscs: "Molluscs",
  other: "Other",
};

const DIETARY_REQUIREMENT_LABELS: Record<DietaryRequirement, string> = {
  halal: "Halal",
  kosher: "Kosher",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  gluten_free: "Gluten Free",
  dairy_free: "Dairy Free",
  medical_diet: "Medical Diet",
  cultural_preference: "Cultural Preference",
  none: "None",
};

const SEVERITY_LEVEL_LABELS: Record<SeverityLevel, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  life_threatening: "Life Threatening",
};

const EMERGENCY_PLAN_STATUS_LABELS: Record<EmergencyPlanStatus, string> = {
  current: "Current",
  expired: "Expired",
  not_in_place: "Not In Place",
  under_review: "Under Review",
};

const MEAL_COMPLIANCE_STATUS_LABELS: Record<MealComplianceStatus, string> = {
  fully_compliant: "Fully Compliant",
  partially_compliant: "Partially Compliant",
  non_compliant: "Non-Compliant",
  not_assessed: "Not Assessed",
};

const TRAINING_COMPETENCE_LABELS: Record<TrainingCompetence, string> = {
  fully_competent: "Fully Competent",
  needs_refresher: "Needs Refresher",
  not_trained: "Not Trained",
  in_training: "In Training",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getAllergenTypeLabel(v: AllergenType): string { return ALLERGEN_TYPE_LABELS[v]; }
export function getDietaryRequirementLabel(v: DietaryRequirement): string { return DIETARY_REQUIREMENT_LABELS[v]; }
export function getSeverityLevelLabel(v: SeverityLevel): string { return SEVERITY_LEVEL_LABELS[v]; }
export function getEmergencyPlanStatusLabel(v: EmergencyPlanStatus): string { return EMERGENCY_PLAN_STATUS_LABELS[v]; }
export function getMealComplianceStatusLabel(v: MealComplianceStatus): string { return MEAL_COMPLIANCE_STATUS_LABELS[v]; }
export function getTrainingCompetenceLabel(v: TrainingCompetence): string { return TRAINING_COMPETENCE_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Evaluators ─────────────────────────────────────────────────────────────

/**
 * Evaluates allergen documentation quality.
 * Empty profiles = 0 (no records = non-compliant, you must document even if
 * a child has no known allergies — their profile should record "none").
 */
export function evaluateAllergenDocumentation(
  profiles: ChildAllergenProfile[],
): AllergenDocumentationResult {
  if (profiles.length === 0) {
    return {
      overallScore: 0,
      totalChildren: 0,
      childrenWithAllergens: 0,
      emergencyPlanCurrentRate: null,
      epiPenAvailableRate: null,
      gpNotifiedRate: null,
      socialWorkerNotifiedRate: null,
      reviewUpToDateRate: null,
      lifeThreatening: 0,
    };
  }

  const withAllergens = profiles.filter((p) => p.allergens.length > 0);
  let emergencyCurrent = 0;
  let epiPenAvailable = 0;
  let gpNotified = 0;
  let swNotified = 0;
  let reviewUpToDate = 0;
  let lifeThreatening = 0;

  // Count profiles needing EpiPen (life-threatening or severe)
  let needsEpiPen = 0;

  for (const p of withAllergens) {
    if (p.emergencyPlanStatus === "current") emergencyCurrent++;
    if (p.gpNotified) gpNotified++;
    if (p.socialWorkerNotified) swNotified++;

    const severities = Object.values(p.severities);
    const hasLifeThreatening = severities.some((s) => s === "life_threatening");
    const hasSevere = severities.some((s) => s === "severe");

    if (hasLifeThreatening) lifeThreatening++;

    if (hasLifeThreatening || hasSevere) {
      needsEpiPen++;
      if (p.epiPenAvailable === true) epiPenAvailable++;
    }
  }

  // Review up to date — all profiles regardless of allergen status
  for (const p of profiles) {
    if (p.reviewDue >= p.lastReviewDate) reviewUpToDate++;
  }

  const emergencyPlanCurrentRate = rate(emergencyCurrent, withAllergens.length);
  const epiPenAvailableRate = rate(epiPenAvailable, needsEpiPen);
  const gpNotifiedRate = rate(gpNotified, withAllergens.length);
  const socialWorkerNotifiedRate = rate(swNotified, withAllergens.length);
  const reviewUpToDateRate = rate(reviewUpToDate, profiles.length);

  // Scoring: emergency plans (0-7), epiPen (0-5), GP notified (0-4),
  // SW notified (0-4), review up to date (0-5)
  let score = 0;
  score += Math.round(((emergencyPlanCurrentRate ?? 0) / 100) * 7);
  score += Math.round(((epiPenAvailableRate ?? 0) / 100) * 5);
  score += Math.round(((gpNotifiedRate ?? 0) / 100) * 4);
  score += Math.round(((socialWorkerNotifiedRate ?? 0) / 100) * 4);
  score += Math.round(((reviewUpToDateRate ?? 0) / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalChildren: profiles.length,
    childrenWithAllergens: withAllergens.length,
    emergencyPlanCurrentRate,
    epiPenAvailableRate,
    gpNotifiedRate,
    socialWorkerNotifiedRate,
    reviewUpToDateRate,
    lifeThreatening,
  };
}

/**
 * Evaluates meal safety compliance.
 * Empty meals = 0 (no meal records = non-compliant).
 */
export function evaluateMealSafety(meals: MealPlanRecord[]): MealSafetyResult {
  if (meals.length === 0) {
    return {
      overallScore: 0,
      totalMeals: 0,
      allergenLabelledRate: null,
      dietaryMetRate: null,
      crossContaminationPreventedRate: null,
      childConsultedRate: null,
      fullyCompliantRate: null,
    };
  }

  let labelled = 0;
  let dietaryMet = 0;
  let crossPrevented = 0;
  let consulted = 0;
  let fullyCompliant = 0;

  for (const m of meals) {
    if (m.allergenLabelled) labelled++;
    if (m.dietaryRequirementsMet) dietaryMet++;
    if (m.crossContaminationPrevented) crossPrevented++;
    if (m.childConsulted) consulted++;
    if (m.complianceStatus === "fully_compliant") fullyCompliant++;
  }

  const allergenLabelledRate = rate(labelled, meals.length);
  const dietaryMetRate = rate(dietaryMet, meals.length);
  const crossContaminationPreventedRate = rate(crossPrevented, meals.length);
  const childConsultedRate = rate(consulted, meals.length);
  const fullyCompliantRate = rate(fullyCompliant, meals.length);

  // Scoring: allergen labelled (0-7), dietary met (0-6), cross-contamination (0-5),
  // child consulted (0-4), fully compliant (0-3)
  let score = 0;
  score += Math.round(((allergenLabelledRate ?? 0) / 100) * 7);
  score += Math.round(((dietaryMetRate ?? 0) / 100) * 6);
  score += Math.round(((crossContaminationPreventedRate ?? 0) / 100) * 5);
  score += Math.round(((childConsultedRate ?? 0) / 100) * 4);
  score += Math.round(((fullyCompliantRate ?? 0) / 100) * 3);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalMeals: meals.length,
    allergenLabelledRate,
    dietaryMetRate,
    crossContaminationPreventedRate,
    childConsultedRate,
    fullyCompliantRate,
  };
}

/**
 * Evaluates incident response quality.
 * Empty incidents = 25 (no allergic reactions = excellent safety record).
 */
export function evaluateIncidentResponse(
  incidents: AllergenIncident[],
): IncidentResponseResult {
  if (incidents.length === 0) {
    return {
      overallScore: 25,
      totalIncidents: 0,
      timelyResponseRate: null,
      emergencyPlanFollowedRate: null,
      rootCauseIdentifiedRate: null,
      preventiveMeasuresRate: null,
      hospitalVisitCount: 0,
    };
  }

  let timely = 0;
  let planFollowed = 0;
  let rootCause = 0;
  let preventive = 0;
  let hospitalVisits = 0;

  for (const inc of incidents) {
    if (inc.staffResponseTimely) timely++;
    if (inc.emergencyPlanFollowed) planFollowed++;
    if (inc.rootCauseIdentified) rootCause++;
    if (inc.preventiveMeasuresImplemented) preventive++;
    if (inc.hospitalVisit) hospitalVisits++;
  }

  const timelyResponseRate = rate(timely, incidents.length);
  const emergencyPlanFollowedRate = rate(planFollowed, incidents.length);
  const rootCauseIdentifiedRate = rate(rootCause, incidents.length);
  const preventiveMeasuresRate = rate(preventive, incidents.length);

  // Scoring: timely response (0-8), plan followed (0-7), root cause (0-5),
  // preventive measures (0-5)
  let score = 0;
  score += Math.round(((timelyResponseRate ?? 0) / 100) * 8);
  score += Math.round(((emergencyPlanFollowedRate ?? 0) / 100) * 7);
  score += Math.round(((rootCauseIdentifiedRate ?? 0) / 100) * 5);
  score += Math.round(((preventiveMeasuresRate ?? 0) / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalIncidents: incidents.length,
    timelyResponseRate,
    emergencyPlanFollowedRate,
    rootCauseIdentifiedRate,
    preventiveMeasuresRate,
    hospitalVisitCount: hospitalVisits,
  };
}

/**
 * Evaluates staff competence in allergen management.
 * Empty training = 0 (no trained staff = non-compliant).
 */
export function evaluateStaffCompetence(
  training: StaffAllergenTraining[],
): StaffCompetenceResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      allergenAwarenessRate: null,
      epiPenTrainedRate: null,
      foodHygieneRate: null,
      crossContaminationTrainedRate: null,
      anaphylaxisTrainedRate: null,
      fullyCompetentRate: null,
    };
  }

  let allergenAwareness = 0;
  let epiPenTrained = 0;
  let foodHygiene = 0;
  let crossContamination = 0;
  let anaphylaxis = 0;
  let fullyCompetent = 0;

  for (const t of training) {
    if (t.allergenAwareness) allergenAwareness++;
    if (t.epiPenTrained) epiPenTrained++;
    if (t.foodHygieneCertified) foodHygiene++;
    if (t.crossContaminationTrained) crossContamination++;
    if (t.anaphylaxisTrained) anaphylaxis++;
    if (t.competenceLevel === "fully_competent") fullyCompetent++;
  }

  const allergenAwarenessRate = rate(allergenAwareness, training.length);
  const epiPenTrainedRate = rate(epiPenTrained, training.length);
  const foodHygieneRate = rate(foodHygiene, training.length);
  const crossContaminationTrainedRate = rate(crossContamination, training.length);
  const anaphylaxisTrainedRate = rate(anaphylaxis, training.length);
  const fullyCompetentRate = rate(fullyCompetent, training.length);

  // Scoring: allergen awareness (0-7), epiPen (0-5), food hygiene (0-5),
  // cross-contamination (0-4), anaphylaxis (0-4)
  let score = 0;
  score += Math.round(((allergenAwarenessRate ?? 0) / 100) * 7);
  score += Math.round(((epiPenTrainedRate ?? 0) / 100) * 5);
  score += Math.round(((foodHygieneRate ?? 0) / 100) * 5);
  score += Math.round(((crossContaminationTrainedRate ?? 0) / 100) * 4);
  score += Math.round(((anaphylaxisTrainedRate ?? 0) / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    allergenAwarenessRate,
    epiPenTrainedRate,
    foodHygieneRate,
    crossContaminationTrainedRate,
    anaphylaxisTrainedRate,
    fullyCompetentRate,
  };
}

// ── Child Summaries ───────────────────────────────────────────────────────

export function buildChildAllergenSummaries(
  profiles: ChildAllergenProfile[],
  incidents: AllergenIncident[],
): ChildAllergenSummary[] {
  return profiles
    .filter((p) => p.allergens.length > 0)
    .map((p) => {
      const childIncidents = incidents.filter((i) => i.childId === p.childId);
      const severities = Object.values(p.severities);
      const hasLifeThreatening = severities.some((s) => s === "life_threatening");

      // Score 0-10
      let score = 0;
      if (p.emergencyPlanStatus === "current") score += 3;
      else if (p.emergencyPlanStatus === "under_review") score += 1;
      if (p.gpNotified) score += 2;
      if (p.socialWorkerNotified) score += 1;
      if (hasLifeThreatening || severities.some((s) => s === "severe")) {
        if (p.epiPenAvailable === true) score += 2;
      } else {
        score += 2; // No EpiPen needed = OK
      }
      if (childIncidents.length === 0) score += 2;
      else if (childIncidents.every((i) => i.staffResponseTimely)) score += 1;

      return {
        childId: p.childId,
        childName: p.childName,
        allergenCount: p.allergens.length,
        hasLifeThreatening,
        emergencyPlanCurrent: p.emergencyPlanStatus === "current",
        epiPenAvailable: p.epiPenAvailable === true,
        incidentCount: childIncidents.length,
        overallScore: Math.min(10, score),
      };
    });
}

// ── Main Function ──────────────────────────────────────────────────────────

export function generateAllergenDietaryManagementIntelligence(
  profiles: ChildAllergenProfile[],
  meals: MealPlanRecord[],
  incidents: AllergenIncident[],
  training: StaffAllergenTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): AllergenDietaryManagementIntelligence {
  const allergenDocumentation = evaluateAllergenDocumentation(profiles);
  const mealSafety = evaluateMealSafety(meals);
  const incidentResponse = evaluateIncidentResponse(incidents);
  const staffCompetence = evaluateStaffCompetence(training);

  const rawScore =
    allergenDocumentation.overallScore +
    mealSafety.overallScore +
    incidentResponse.overallScore +
    staffCompetence.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childSummaries = buildChildAllergenSummaries(profiles, incidents);

  // ── Strengths ──
  const strengths: string[] = [];
  const withAllergens = profiles.filter((p) => p.allergens.length > 0);
  if (withAllergens.length > 0 && allergenDocumentation.emergencyPlanCurrentRate === 100)
    strengths.push("All children with allergens have current emergency plans");
  if (withAllergens.length > 0 && allergenDocumentation.gpNotifiedRate === 100)
    strengths.push("GP notification complete for all children with allergens");
  if (meals.length > 0 && mealSafety.allergenLabelledRate === 100)
    strengths.push("100% allergen labelling compliance across all meals");
  if (meals.length > 0 && meets(mealSafety.crossContaminationPreventedRate, 95))
    strengths.push("Excellent cross-contamination prevention at " + mealSafety.crossContaminationPreventedRate + "%");
  if (incidents.length === 0 && profiles.length > 0)
    strengths.push("No allergen incidents in the reporting period — effective prevention");
  if (incidents.length > 0 && incidentResponse.timelyResponseRate === 100)
    strengths.push("All allergen incidents received timely staff response");
  if (training.length > 0 && staffCompetence.allergenAwarenessRate === 100)
    strengths.push("All staff have allergen awareness training");
  if (training.length > 0 && staffCompetence.fullyCompetentRate === 100)
    strengths.push("All staff assessed as fully competent in allergen management");
  if (meals.length > 0 && meets(mealSafety.childConsultedRate, 90))
    strengths.push("Children consistently consulted about meals and dietary preferences");

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (profiles.length === 0)
    areasForImprovement.push("No allergen profiles on record — all children should have documented allergen status");
  if (withAllergens.length > 0 && below(allergenDocumentation.emergencyPlanCurrentRate, 100))
    areasForImprovement.push("Emergency plan currency at " + allergenDocumentation.emergencyPlanCurrentRate + "% — all should be current");
  if (meals.length > 0 && below(mealSafety.allergenLabelledRate, 100))
    areasForImprovement.push("Allergen labelling compliance at " + mealSafety.allergenLabelledRate + "% — must be 100% (Natasha's Law)");
  if (meals.length > 0 && below(mealSafety.dietaryMetRate, 90))
    areasForImprovement.push("Dietary requirements met in only " + mealSafety.dietaryMetRate + "% of meals");
  if (training.length > 0 && below(staffCompetence.epiPenTrainedRate, 100))
    areasForImprovement.push("EpiPen training coverage at " + staffCompetence.epiPenTrainedRate + "% — all staff should be trained");
  if (training.length === 0)
    areasForImprovement.push("No staff allergen training records — all staff require training");
  if (meals.length === 0 && profiles.length > 0)
    areasForImprovement.push("No meal plan records — meal safety documentation required");
  if (meals.length > 0 && below(mealSafety.childConsultedRate, 70))
    areasForImprovement.push("Children consulted about meals in only " + mealSafety.childConsultedRate + "% of cases");

  // ── Actions ──
  const actions: string[] = [];
  const lifeThreatProfiles = profiles.filter((p) =>
    Object.values(p.severities).some((s) => s === "life_threatening"),
  );
  const ltMissingPlan = lifeThreatProfiles.filter((p) =>
    p.emergencyPlanStatus !== "current",
  );
  if (ltMissingPlan.length > 0)
    actions.push("URGENT: " + ltMissingPlan.length + " child(ren) with life-threatening allergies have no current emergency plan");
  const ltMissingEpiPen = lifeThreatProfiles.filter((p) => p.epiPenAvailable !== true);
  if (ltMissingEpiPen.length > 0)
    actions.push("URGENT: " + ltMissingEpiPen.length + " child(ren) with life-threatening allergies have no EpiPen available");
  if (training.length > 0 && below(staffCompetence.anaphylaxisTrainedRate, 75))
    actions.push("URGENT: Only " + staffCompetence.anaphylaxisTrainedRate + "% staff trained in anaphylaxis response — all must complete training");
  if (incidents.length > 0 && below(incidentResponse.rootCauseIdentifiedRate, 100))
    actions.push("Complete root cause analysis for all allergen incidents — " + (100 - (incidentResponse.rootCauseIdentifiedRate ?? 0)) + "% outstanding");
  if (meals.length > 0 && below(mealSafety.allergenLabelledRate, 100))
    actions.push("Achieve 100% allergen labelling — legal requirement under Natasha's Law (PPDS) 2021");
  if (profiles.length === 0)
    actions.push("Create allergen profiles for all children — even children with no known allergens should have a documented 'none' record");
  if (below(allergenDocumentation.reviewUpToDateRate, 100) && profiles.length > 0)
    actions.push("Schedule allergen profile reviews for overdue children — " + (100 - (allergenDocumentation.reviewUpToDateRate ?? 0)) + "% overdue");
  if (incidents.length > 0 && below(incidentResponse.preventiveMeasuresRate, 100))
    actions.push("Implement preventive measures for all allergen incidents — " + (100 - (incidentResponse.preventiveMeasuresRate ?? 0)) + "% without measures");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 10 — Health and wellbeing: dietary needs and allergen management",
    "CHR 2015, Reg 12 — Safeguarding: protecting children from health risks including allergens",
    "SCCIF — How well children are helped and protected: allergen safety systems",
    "NMS 4 — Safeguarding and promoting health: nutritional needs and medical diets",
    "Food Safety Act 1990 — Duty of care in food preparation and allergen management",
    "Natasha's Law (PPDS) 2021 — Mandatory allergen labelling on pre-packed foods",
    "UNCRC Article 24 — Right to the highest standard of health and nutrition",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    allergenDocumentation,
    mealSafety,
    incidentResponse,
    staffCompetence,
    childSummaries,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
