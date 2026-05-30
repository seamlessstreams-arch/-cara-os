// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TEETH BRUSHING & ORAL ROUTINE INTELLIGENCE ENGINE
// Monitors oral hygiene routine quality — brushing schedule adherence, fluoride
// product use, staff supervision of brushing, toothbrush replacement tracking,
// and child independence in oral care.
// Measures brushing_adherence_rate, fluoride_use_rate, supervision_rate,
// toothbrush_replacement_rate, independence_rate, child_engagement_rate.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (Health care), Reg 5 (Quality of care standard).
// SCCIF: "Children's health and well-being are promoted".
// Store keys: brushingScheduleRecords, fluorideUseRecords,
//             supervisionRecords, toothbrushReplacementRecords,
//             independenceRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface BrushingScheduleRecordInput {
  id: string;
  child_id: string;
  date: string;
  morning_brushing_completed: boolean;
  evening_brushing_completed: boolean;
  brushing_duration_morning_seconds: number;
  brushing_duration_evening_seconds: number;
  morning_time_recorded: string | null;
  evening_time_recorded: string | null;
  brushing_technique_correct: boolean;
  child_reminded: boolean;
  child_refused: boolean;
  refusal_reason: string | null;
  alternative_offered: boolean;
  teeth_areas_covered: "all" | "partial" | "minimal" | "none";
  tongue_cleaned: boolean;
  mouthwash_used: boolean;
  flossing_completed: boolean;
  child_engaged: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface FluorideUseRecordInput {
  id: string;
  child_id: string;
  date: string;
  fluoride_toothpaste_used: boolean;
  fluoride_concentration_ppm: number;
  fluoride_concentration_appropriate: boolean;
  fluoride_mouthwash_used: boolean;
  fluoride_varnish_applied: boolean;
  varnish_applied_by: string | null;
  fluoride_supplement_given: boolean;
  supplement_prescribed: boolean;
  child_age_appropriate_product: boolean;
  child_spits_not_swallows: boolean;
  staff_supervised_application: boolean;
  product_in_date: boolean;
  product_brand: string | null;
  notes: string | null;
  created_at: string;
}

export interface SupervisionRecordInput {
  id: string;
  child_id: string;
  date: string;
  session_type: "morning" | "evening" | "both";
  staff_present_during_brushing: boolean;
  staff_guided_technique: boolean;
  staff_timed_brushing: boolean;
  child_age: number;
  supervision_level: "full" | "partial" | "verbal_prompt" | "independent_check" | "none";
  supervision_appropriate_for_age: boolean;
  positive_reinforcement_given: boolean;
  correction_needed: boolean;
  correction_accepted: boolean;
  handwashing_before_brushing: boolean;
  oral_health_discussion: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface ToothbrushReplacementRecordInput {
  id: string;
  child_id: string;
  replacement_date: string;
  previous_brush_start_date: string | null;
  days_since_last_replacement: number;
  replacement_reason: "scheduled" | "worn" | "illness" | "contamination" | "lost" | "new_admission" | "child_request";
  brush_type: "manual" | "electric" | "adaptive";
  brush_age_appropriate: boolean;
  brush_condition_at_replacement: "good" | "worn" | "frayed" | "heavily_worn" | "damaged";
  child_chose_own_brush: boolean;
  child_chose_own_toothpaste: boolean;
  personal_brush_storage_correct: boolean;
  brush_labelled: boolean;
  cost_covered: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface IndependenceRecordInput {
  id: string;
  child_id: string;
  date: string;
  child_age: number;
  brushes_independently: boolean;
  applies_toothpaste_independently: boolean;
  selects_own_products: boolean;
  initiates_brushing_without_prompt: boolean;
  completes_full_routine_independently: boolean;
  understands_importance_of_oral_care: boolean;
  can_explain_brushing_technique: boolean;
  manages_own_toothbrush_replacement: boolean;
  requests_dental_products_when_needed: boolean;
  independence_goal_set: boolean;
  independence_goal_met: boolean;
  progress_since_last_assessment: "improved" | "maintained" | "declined" | "first_assessment";
  independence_plan_in_place: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface TeethBrushingInput {
  today: string;
  total_children: number;
  brushing_schedule_records: BrushingScheduleRecordInput[];
  fluoride_use_records: FluorideUseRecordInput[];
  supervision_records: SupervisionRecordInput[];
  toothbrush_replacement_records: ToothbrushReplacementRecordInput[];
  independence_records: IndependenceRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TeethBrushingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TeethBrushingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface TeethBrushingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface TeethBrushingResult {
  brushing_rating: TeethBrushingRating;
  brushing_score: number;
  headline: string;
  total_brushing_records: number;
  total_fluoride_records: number;
  total_supervision_records: number;
  total_replacement_records: number;
  total_independence_records: number;
  brushing_adherence_rate: number;
  fluoride_use_rate: number;
  supervision_rate: number;
  toothbrush_replacement_rate: number;
  independence_rate: number;
  child_engagement_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: TeethBrushingRecommendation[];
  insights: TeethBrushingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): TeethBrushingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: TeethBrushingRating,
  score: number,
  headline: string,
): TeethBrushingResult {
  return {
    brushing_rating: rating,
    brushing_score: score,
    headline,
    total_brushing_records: 0,
    total_fluoride_records: 0,
    total_supervision_records: 0,
    total_replacement_records: 0,
    total_independence_records: 0,
    brushing_adherence_rate: 0,
    fluoride_use_rate: 0,
    supervision_rate: 0,
    toothbrush_replacement_rate: 0,
    independence_rate: 0,
    child_engagement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeTeethBrushingOralRoutine(
  input: TeethBrushingInput,
): TeethBrushingResult {
  const {
    total_children,
    brushing_schedule_records,
    fluoride_use_records,
    supervision_records,
    toothbrush_replacement_records,
    independence_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    brushing_schedule_records.length === 0 &&
    fluoride_use_records.length === 0 &&
    supervision_records.length === 0 &&
    toothbrush_replacement_records.length === 0 &&
    independence_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess teeth brushing and oral routine quality.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No teeth brushing or oral routine data recorded despite children on placement — oral hygiene management requires urgent attention.",
      ),
      concerns: [
        "No brushing schedule records, fluoride use records, supervision records, toothbrush replacement records, or independence records exist despite children being on placement — the home cannot evidence adequate management of children's oral hygiene routines.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of daily brushing schedules, fluoride product use, staff supervision of brushing, toothbrush replacement cycles, and children's oral care independence to evidence the home's management of oral hygiene routines.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has a personalised brushing schedule, age-appropriate fluoride products, and receives supervision appropriate to their age and needs as part of daily care routines.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
        },
      ],
      insights: [
        {
          text: "The complete absence of oral routine records means Ofsted cannot verify that children's daily brushing is happening, fluoride products are used appropriately, or staff are supervising oral care. This represents a fundamental gap in Reg 14 and Reg 5 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Brushing schedule metrics ---
  const totalBrushingRecords = brushing_schedule_records.length;

  const morningBrushingDone = brushing_schedule_records.filter((r) => r.morning_brushing_completed).length;
  const eveningBrushingDone = brushing_schedule_records.filter((r) => r.evening_brushing_completed).length;
  const bothBrushingsDone = brushing_schedule_records.filter(
    (r) => r.morning_brushing_completed && r.evening_brushing_completed,
  ).length;
  const morningBrushingRate = pct(morningBrushingDone, totalBrushingRecords);
  const eveningBrushingRate = pct(eveningBrushingDone, totalBrushingRecords);
  const bothBrushingRate = pct(bothBrushingsDone, totalBrushingRecords);

  // Duration: adequate = >= 120 seconds (2 minutes)
  const morningDurationAdequate = brushing_schedule_records.filter(
    (r) => r.morning_brushing_completed && r.brushing_duration_morning_seconds >= 120,
  ).length;
  const eveningDurationAdequate = brushing_schedule_records.filter(
    (r) => r.evening_brushing_completed && r.brushing_duration_evening_seconds >= 120,
  ).length;
  const morningDurationRate = pct(morningDurationAdequate, morningBrushingDone);
  const eveningDurationRate = pct(eveningDurationAdequate, eveningBrushingDone);
  const totalDurationAdequate = morningDurationAdequate + eveningDurationAdequate;
  const totalBrushingsDone = morningBrushingDone + eveningBrushingDone;
  const overallDurationRate = pct(totalDurationAdequate, totalBrushingsDone);

  const techniqueCorrect = brushing_schedule_records.filter((r) => r.brushing_technique_correct).length;
  const techniqueRate = pct(techniqueCorrect, totalBrushingRecords);

  const allAreasCovered = brushing_schedule_records.filter((r) => r.teeth_areas_covered === "all").length;
  const partialCovered = brushing_schedule_records.filter((r) => r.teeth_areas_covered === "partial").length;
  const areaCoverageRate = pct(allAreasCovered, totalBrushingRecords);

  const tongueCleaned = brushing_schedule_records.filter((r) => r.tongue_cleaned).length;
  const tongueCleanedRate = pct(tongueCleaned, totalBrushingRecords);

  const mouthwashUsed = brushing_schedule_records.filter((r) => r.mouthwash_used).length;
  const mouthwashRate = pct(mouthwashUsed, totalBrushingRecords);

  const flossingDone = brushing_schedule_records.filter((r) => r.flossing_completed).length;
  const flossingRate = pct(flossingDone, totalBrushingRecords);

  const childRefused = brushing_schedule_records.filter((r) => r.child_refused).length;
  const refusalRate = pct(childRefused, totalBrushingRecords);

  const alternativeOffered = brushing_schedule_records.filter(
    (r) => r.child_refused && r.alternative_offered,
  ).length;
  const alternativeOfferedRate = pct(alternativeOffered, childRefused);

  const childEngagedBrushing = brushing_schedule_records.filter((r) => r.child_engaged).length;
  const brushingEngagementRate = pct(childEngagedBrushing, totalBrushingRecords);

  // Composite brushing adherence: morning + evening + technique + engagement
  // weighted: bothBrushings (35%) + durationAdequate (25%) + technique (20%) + engagement (20%)
  const adherenceNumerator = bothBrushingsDone + totalDurationAdequate + techniqueCorrect + childEngagedBrushing;
  const adherenceDenominator = totalBrushingRecords + totalBrushingsDone + totalBrushingRecords + totalBrushingRecords;
  const brushingAdherenceRate = pct(adherenceNumerator, adherenceDenominator);

  // --- Fluoride use metrics ---
  const totalFluorideRecords = fluoride_use_records.length;

  const fluoridePasteUsed = fluoride_use_records.filter((r) => r.fluoride_toothpaste_used).length;
  const fluoridePasteRate = pct(fluoridePasteUsed, totalFluorideRecords);

  const fluorideConcentrationAppropriate = fluoride_use_records.filter(
    (r) => r.fluoride_concentration_appropriate,
  ).length;
  const concentrationAppropriateRate = pct(fluorideConcentrationAppropriate, totalFluorideRecords);

  const fluorideMouthwashUsed = fluoride_use_records.filter((r) => r.fluoride_mouthwash_used).length;
  const fluorideMouthwashRate = pct(fluorideMouthwashUsed, totalFluorideRecords);

  const fluorideVarnishApplied = fluoride_use_records.filter((r) => r.fluoride_varnish_applied).length;
  const varnishRate = pct(fluorideVarnishApplied, totalFluorideRecords);

  const ageAppropriateProduct = fluoride_use_records.filter((r) => r.child_age_appropriate_product).length;
  const ageAppropriateRate = pct(ageAppropriateProduct, totalFluorideRecords);

  const spitsNotSwallows = fluoride_use_records.filter((r) => r.child_spits_not_swallows).length;
  const spitRate = pct(spitsNotSwallows, totalFluorideRecords);

  const fluorideSupervised = fluoride_use_records.filter((r) => r.staff_supervised_application).length;
  const fluorideSupervisionRate = pct(fluorideSupervised, totalFluorideRecords);

  const productInDate = fluoride_use_records.filter((r) => r.product_in_date).length;
  const productInDateRate = pct(productInDate, totalFluorideRecords);

  const supplementGiven = fluoride_use_records.filter((r) => r.fluoride_supplement_given).length;
  const supplementPrescribed = fluoride_use_records.filter(
    (r) => r.fluoride_supplement_given && r.supplement_prescribed,
  ).length;
  const supplementComplianceRate = pct(supplementPrescribed, supplementGiven);

  // Composite fluoride use: paste + concentration appropriate + age appropriate + in date
  const fluorideNumerator = fluoridePasteUsed + fluorideConcentrationAppropriate + ageAppropriateProduct + productInDate;
  const fluorideDenominator = totalFluorideRecords * 4;
  const fluorideUseRate = pct(fluorideNumerator, fluorideDenominator);

  // --- Supervision metrics ---
  const totalSupervisionRecords = supervision_records.length;

  const staffPresent = supervision_records.filter((r) => r.staff_present_during_brushing).length;
  const staffPresentRate = pct(staffPresent, totalSupervisionRecords);

  const staffGuided = supervision_records.filter((r) => r.staff_guided_technique).length;
  const staffGuidedRate = pct(staffGuided, totalSupervisionRecords);

  const staffTimed = supervision_records.filter((r) => r.staff_timed_brushing).length;
  const staffTimedRate = pct(staffTimed, totalSupervisionRecords);

  const supervisionAppropriate = supervision_records.filter(
    (r) => r.supervision_appropriate_for_age,
  ).length;
  const supervisionAppropriateRate = pct(supervisionAppropriate, totalSupervisionRecords);

  const positiveReinforcement = supervision_records.filter((r) => r.positive_reinforcement_given).length;
  const reinforcementRate = pct(positiveReinforcement, totalSupervisionRecords);

  const correctionNeeded = supervision_records.filter((r) => r.correction_needed).length;
  const correctionAccepted = supervision_records.filter(
    (r) => r.correction_needed && r.correction_accepted,
  ).length;
  const correctionAcceptedRate = pct(correctionAccepted, correctionNeeded);

  const handwashingBefore = supervision_records.filter((r) => r.handwashing_before_brushing).length;
  const handwashingRate = pct(handwashingBefore, totalSupervisionRecords);

  const oralHealthDiscussion = supervision_records.filter((r) => r.oral_health_discussion).length;
  const oralDiscussionRate = pct(oralHealthDiscussion, totalSupervisionRecords);

  // Supervision level analysis
  const fullSupervision = supervision_records.filter((r) => r.supervision_level === "full").length;
  const partialSupervision = supervision_records.filter((r) => r.supervision_level === "partial").length;
  const verbalPrompt = supervision_records.filter((r) => r.supervision_level === "verbal_prompt").length;
  const independentCheck = supervision_records.filter((r) => r.supervision_level === "independent_check").length;
  const noSupervision = supervision_records.filter((r) => r.supervision_level === "none").length;

  // Composite supervision: present + appropriate + reinforcement + guided
  const supervisionNumerator = staffPresent + supervisionAppropriate + positiveReinforcement + staffGuided;
  const supervisionDenominator = totalSupervisionRecords * 4;
  const supervisionRate = pct(supervisionNumerator, supervisionDenominator);

  // --- Toothbrush replacement metrics ---
  const totalReplacementRecords = toothbrush_replacement_records.length;

  // On time = replaced within 90 days (3 months per NHS guidance)
  const replacedOnTime = toothbrush_replacement_records.filter(
    (r) => r.days_since_last_replacement <= 90,
  ).length;
  const replacedOnTimeRate = pct(replacedOnTime, totalReplacementRecords);

  const replacedOverdue = toothbrush_replacement_records.filter(
    (r) => r.days_since_last_replacement > 90,
  ).length;
  const overdueRate = pct(replacedOverdue, totalReplacementRecords);

  const brushAgeAppropriate = toothbrush_replacement_records.filter(
    (r) => r.brush_age_appropriate,
  ).length;
  const brushAgeAppropriateRate = pct(brushAgeAppropriate, totalReplacementRecords);

  const childChoseBrush = toothbrush_replacement_records.filter(
    (r) => r.child_chose_own_brush,
  ).length;
  const childChoseRate = pct(childChoseBrush, totalReplacementRecords);

  const childChoseToothpaste = toothbrush_replacement_records.filter(
    (r) => r.child_chose_own_toothpaste,
  ).length;
  const childChoseToothpasteRate = pct(childChoseToothpaste, totalReplacementRecords);

  const storageCorrect = toothbrush_replacement_records.filter(
    (r) => r.personal_brush_storage_correct,
  ).length;
  const storageCorrectRate = pct(storageCorrect, totalReplacementRecords);

  const brushLabelled = toothbrush_replacement_records.filter(
    (r) => r.brush_labelled,
  ).length;
  const brushLabelledRate = pct(brushLabelled, totalReplacementRecords);

  // Brush condition at replacement
  const replacedInGoodCondition = toothbrush_replacement_records.filter(
    (r) => r.brush_condition_at_replacement === "good" || r.brush_condition_at_replacement === "worn",
  ).length;
  const frayedOrWorse = toothbrush_replacement_records.filter(
    (r) => r.brush_condition_at_replacement === "frayed" || r.brush_condition_at_replacement === "heavily_worn" || r.brush_condition_at_replacement === "damaged",
  ).length;
  const poorConditionRate = pct(frayedOrWorse, totalReplacementRecords);

  // Brush type distribution
  const manualBrushes = toothbrush_replacement_records.filter((r) => r.brush_type === "manual").length;
  const electricBrushes = toothbrush_replacement_records.filter((r) => r.brush_type === "electric").length;
  const adaptiveBrushes = toothbrush_replacement_records.filter((r) => r.brush_type === "adaptive").length;

  // Composite toothbrush replacement: on time + age appropriate + storage + labelled
  const replacementNumerator = replacedOnTime + brushAgeAppropriate + storageCorrect + brushLabelled;
  const replacementDenominator = totalReplacementRecords * 4;
  const toothbrushReplacementRate = pct(replacementNumerator, replacementDenominator);

  // --- Independence metrics ---
  const totalIndependenceRecords = independence_records.length;

  const brushesIndependently = independence_records.filter(
    (r) => r.brushes_independently,
  ).length;
  const brushesIndependentlyRate = pct(brushesIndependently, totalIndependenceRecords);

  const appliesToothpaste = independence_records.filter(
    (r) => r.applies_toothpaste_independently,
  ).length;
  const appliesToothpasteRate = pct(appliesToothpaste, totalIndependenceRecords);

  const selectsProducts = independence_records.filter(
    (r) => r.selects_own_products,
  ).length;
  const selectsProductsRate = pct(selectsProducts, totalIndependenceRecords);

  const initiatesWithoutPrompt = independence_records.filter(
    (r) => r.initiates_brushing_without_prompt,
  ).length;
  const initiatesRate = pct(initiatesWithoutPrompt, totalIndependenceRecords);

  const completesFullRoutine = independence_records.filter(
    (r) => r.completes_full_routine_independently,
  ).length;
  const fullRoutineRate = pct(completesFullRoutine, totalIndependenceRecords);

  const understandsImportance = independence_records.filter(
    (r) => r.understands_importance_of_oral_care,
  ).length;
  const understandsRate = pct(understandsImportance, totalIndependenceRecords);

  const canExplainTechnique = independence_records.filter(
    (r) => r.can_explain_brushing_technique,
  ).length;
  const canExplainRate = pct(canExplainTechnique, totalIndependenceRecords);

  const managesReplacement = independence_records.filter(
    (r) => r.manages_own_toothbrush_replacement,
  ).length;
  const managesReplacementRate = pct(managesReplacement, totalIndependenceRecords);

  const requestsProducts = independence_records.filter(
    (r) => r.requests_dental_products_when_needed,
  ).length;
  const requestsProductsRate = pct(requestsProducts, totalIndependenceRecords);

  const goalSet = independence_records.filter((r) => r.independence_goal_set).length;
  const goalSetRate = pct(goalSet, totalIndependenceRecords);

  const goalMet = independence_records.filter(
    (r) => r.independence_goal_set && r.independence_goal_met,
  ).length;
  const goalMetRate = pct(goalMet, goalSet);

  const planInPlace = independence_records.filter((r) => r.independence_plan_in_place).length;
  const planRate = pct(planInPlace, totalIndependenceRecords);

  const improved = independence_records.filter(
    (r) => r.progress_since_last_assessment === "improved",
  ).length;
  const maintained = independence_records.filter(
    (r) => r.progress_since_last_assessment === "maintained",
  ).length;
  const declined = independence_records.filter(
    (r) => r.progress_since_last_assessment === "declined",
  ).length;
  const improvementRate = pct(improved, totalIndependenceRecords);

  // Composite independence: brushes independently + initiates without prompt + completes full routine + understands importance
  const independenceNumerator = brushesIndependently + initiatesWithoutPrompt + completesFullRoutine + understandsImportance;
  const independenceDenominator = totalIndependenceRecords * 4;
  const independenceRate = pct(independenceNumerator, independenceDenominator);

  // --- Child engagement composite ---
  // Across: brushing engagement + child chose brush + child understands importance
  let engagementNumerator = 0;
  let engagementDenominator = 0;

  if (totalBrushingRecords > 0) {
    engagementNumerator += childEngagedBrushing;
    engagementDenominator += totalBrushingRecords;
  }
  if (totalReplacementRecords > 0) {
    engagementNumerator += childChoseBrush;
    engagementDenominator += totalReplacementRecords;
  }
  if (totalIndependenceRecords > 0) {
    engagementNumerator += understandsImportance;
    engagementDenominator += totalIndependenceRecords;
  }
  if (totalSupervisionRecords > 0) {
    engagementNumerator += positiveReinforcement;
    engagementDenominator += totalSupervisionRecords;
  }

  const childEngagementRate = pct(engagementNumerator, engagementDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: brushingAdherenceRate (>=90: +4, >=70: +2) ---
  if (brushingAdherenceRate >= 90) score += 4;
  else if (brushingAdherenceRate >= 70) score += 2;

  // --- Bonus 2: fluorideUseRate (>=90: +4, >=70: +2) ---
  if (fluorideUseRate >= 90) score += 4;
  else if (fluorideUseRate >= 70) score += 2;

  // --- Bonus 3: supervisionRate (>=90: +3, >=70: +1) ---
  if (supervisionRate >= 90) score += 3;
  else if (supervisionRate >= 70) score += 1;

  // --- Bonus 4: toothbrushReplacementRate (>=85: +3, >=65: +1) ---
  if (toothbrushReplacementRate >= 85) score += 3;
  else if (toothbrushReplacementRate >= 65) score += 1;

  // --- Bonus 5: independenceRate (>=85: +3, >=65: +1) ---
  if (independenceRate >= 85) score += 3;
  else if (independenceRate >= 65) score += 1;

  // --- Bonus 6: childEngagementRate (>=90: +3, >=70: +1) ---
  if (childEngagementRate >= 90) score += 3;
  else if (childEngagementRate >= 70) score += 1;

  // --- Bonus 7: overallDurationRate (>=90: +3, >=70: +1) ---
  if (overallDurationRate >= 90) score += 3;
  else if (overallDurationRate >= 70) score += 1;

  // --- Bonus 8: replacedOnTimeRate (>=90: +2, >=70: +1) ---
  if (replacedOnTimeRate >= 90) score += 2;
  else if (replacedOnTimeRate >= 70) score += 1;

  // --- Bonus 9: reinforcementRate (>=90: +3, >=70: +1) ---
  if (reinforcementRate >= 90) score += 3;
  else if (reinforcementRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // brushingAdherenceRate < 50 → -5
  if (brushingAdherenceRate < 50 && brushing_schedule_records.length > 0) score -= 5;

  // fluorideUseRate < 40 → -5
  if (fluorideUseRate < 40 && fluoride_use_records.length > 0) score -= 5;

  // supervisionRate < 40 → -4
  if (supervisionRate < 40 && supervision_records.length > 0) score -= 4;

  // independenceRate < 40 → -4
  if (independenceRate < 40 && independence_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const brushing_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (brushingAdherenceRate >= 90 && totalBrushingRecords > 0) {
    strengths.push(
      `${brushingAdherenceRate}% brushing adherence — children consistently complete their brushing routines with adequate duration, correct technique, and positive engagement, demonstrating well-embedded oral hygiene habits.`,
    );
  } else if (brushingAdherenceRate >= 70 && totalBrushingRecords > 0) {
    strengths.push(
      `${brushingAdherenceRate}% brushing adherence — the home generally maintains good brushing routines for children across schedule, technique, and engagement.`,
    );
  }

  if (fluorideUseRate >= 90 && totalFluorideRecords > 0) {
    strengths.push(
      `${fluorideUseRate}% fluoride use compliance — children consistently use age-appropriate fluoride toothpaste at the correct concentration, with products kept in date, maximising protection against tooth decay.`,
    );
  } else if (fluorideUseRate >= 70 && totalFluorideRecords > 0) {
    strengths.push(
      `${fluorideUseRate}% fluoride use compliance — fluoride products are generally used appropriately across the home.`,
    );
  }

  if (supervisionRate >= 90 && totalSupervisionRecords > 0) {
    strengths.push(
      `${supervisionRate}% supervision quality — staff consistently supervise brushing appropriately for each child's age and needs, provide technique guidance, and deliver positive reinforcement.`,
    );
  } else if (supervisionRate >= 70 && totalSupervisionRecords > 0) {
    strengths.push(
      `${supervisionRate}% supervision quality — staff generally provide appropriate supervision and support during children's brushing routines.`,
    );
  }

  if (toothbrushReplacementRate >= 85 && totalReplacementRecords > 0) {
    strengths.push(
      `${toothbrushReplacementRate}% toothbrush replacement compliance — toothbrushes are replaced on schedule with age-appropriate options, stored correctly, and labelled, ensuring effective oral hygiene equipment.`,
    );
  } else if (toothbrushReplacementRate >= 65 && totalReplacementRecords > 0) {
    strengths.push(
      `${toothbrushReplacementRate}% toothbrush replacement compliance — the home generally maintains toothbrush replacement cycles and appropriate equipment.`,
    );
  }

  if (independenceRate >= 85 && totalIndependenceRecords > 0) {
    strengths.push(
      `${independenceRate}% oral care independence — children demonstrate strong independent oral care skills, initiating brushing without prompts, completing full routines independently, and understanding the importance of oral health.`,
    );
  } else if (independenceRate >= 65 && totalIndependenceRecords > 0) {
    strengths.push(
      `${independenceRate}% oral care independence — children are developing good independent oral care skills with appropriate staff support.`,
    );
  }

  if (childEngagementRate >= 90) {
    strengths.push(
      `${childEngagementRate}% child engagement across oral care — children actively participate in brushing routines, choose their own products, understand dental health, and respond positively to staff support.`,
    );
  } else if (childEngagementRate >= 70) {
    strengths.push(
      `${childEngagementRate}% child engagement — most children are positively engaged with their oral care routines.`,
    );
  }

  if (bothBrushingRate >= 90 && totalBrushingRecords > 0) {
    strengths.push(
      `${bothBrushingRate}% twice-daily brushing completion — children consistently complete both morning and evening brushing.`,
    );
  }

  if (overallDurationRate >= 90 && totalBrushingsDone > 0) {
    strengths.push(`${overallDurationRate}% brushing duration compliance — sessions consistently meet the recommended 2-minute minimum.`);
  } else if (overallDurationRate >= 70 && totalBrushingsDone > 0) {
    strengths.push(`${overallDurationRate}% brushing duration compliance — most sessions meet the recommended 2-minute minimum.`);
  }

  if (reinforcementRate >= 90 && totalSupervisionRecords > 0) {
    strengths.push(`${reinforcementRate}% positive reinforcement — staff consistently encourage children during oral care.`);
  }

  if (replacedOnTimeRate >= 90 && totalReplacementRecords > 0) {
    strengths.push(`${replacedOnTimeRate}% of toothbrushes replaced within the recommended 3-month cycle.`);
  }

  if (childChoseRate >= 80 && totalReplacementRecords > 0) {
    strengths.push(`${childChoseRate}% of children chose their own toothbrush — autonomy and personal preference are actively supported.`);
  }

  if (goalMetRate >= 80 && goalSet > 0) {
    strengths.push(`${goalMetRate}% independence goals met — children are meeting their oral care independence targets.`);
  }

  if (alternativeOfferedRate >= 90 && childRefused > 0) {
    strengths.push(`${alternativeOfferedRate}% of brushing refusals met with alternative approaches — flexible, child-centred care.`);
  }

  if (areaCoverageRate >= 90 && totalBrushingRecords > 0) {
    strengths.push(`${areaCoverageRate}% of brushing sessions achieve full teeth area coverage.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (brushingAdherenceRate < 50 && totalBrushingRecords > 0) {
    concerns.push(
      `Only ${brushingAdherenceRate}% brushing adherence — children's brushing routines are poorly maintained, with low completion rates, inadequate duration, poor technique, or disengagement. This directly compromises children's oral health and represents a failure to promote basic health care habits.`,
    );
  } else if (brushingAdherenceRate < 70 && brushingAdherenceRate >= 50 && totalBrushingRecords > 0) {
    concerns.push(
      `Brushing adherence at ${brushingAdherenceRate}% — brushing routine quality needs improvement across completion, duration, technique, or engagement to ensure children's oral health is properly supported.`,
    );
  }

  if (fluorideUseRate < 40 && totalFluorideRecords > 0) {
    concerns.push(
      `Fluoride use compliance at only ${fluorideUseRate}% — children are not consistently using fluoride toothpaste, products are at incorrect concentrations, or products are not age-appropriate. This significantly reduces protection against tooth decay.`,
    );
  } else if (fluorideUseRate < 70 && fluorideUseRate >= 40 && totalFluorideRecords > 0) {
    concerns.push(
      `Fluoride use compliance at ${fluorideUseRate}% — fluoride product selection, concentration, or management needs improvement to optimise children's dental protection.`,
    );
  }

  if (supervisionRate < 40 && totalSupervisionRecords > 0) {
    concerns.push(
      `Supervision quality at only ${supervisionRate}% — staff are not consistently present during brushing, supervision is not age-appropriate, and reinforcement is lacking. Young children require active supervision to ensure effective brushing.`,
    );
  } else if (supervisionRate < 70 && supervisionRate >= 40 && totalSupervisionRecords > 0) {
    concerns.push(
      `Supervision quality at ${supervisionRate}% — the consistency and quality of staff supervision during brushing routines needs strengthening.`,
    );
  }

  if (toothbrushReplacementRate < 50 && totalReplacementRecords > 0) {
    concerns.push(
      `Toothbrush replacement compliance at only ${toothbrushReplacementRate}% — toothbrushes are not being replaced on schedule, may not be age-appropriate, or are not stored correctly. Worn toothbrushes are ineffective at removing plaque and harbour bacteria.`,
    );
  } else if (toothbrushReplacementRate < 65 && toothbrushReplacementRate >= 50 && totalReplacementRecords > 0) {
    concerns.push(
      `Toothbrush replacement compliance at ${toothbrushReplacementRate}% — equipment maintenance and replacement cycles need attention.`,
    );
  }

  if (independenceRate < 40 && totalIndependenceRecords > 0) {
    concerns.push(
      `Oral care independence at only ${independenceRate}% — children are not developing adequate independent oral care skills. Without structured support to build independence, children will be unable to manage their own oral health when they leave care.`,
    );
  } else if (independenceRate < 65 && independenceRate >= 40 && totalIndependenceRecords > 0) {
    concerns.push(
      `Oral care independence at ${independenceRate}% — children's development of independent oral care skills needs more structured support and planning.`,
    );
  }

  if (childEngagementRate < 50) {
    concerns.push(
      `Child engagement with oral care at only ${childEngagementRate}% — children are not actively participating in or engaging with their oral hygiene routines, which undermines habit formation and may indicate the approach is not child-centred.`,
    );
  } else if (childEngagementRate < 70 && childEngagementRate >= 50) {
    concerns.push(
      `Child engagement at ${childEngagementRate}% — a notable proportion of children are not positively engaged with their oral care.`,
    );
  }

  if (bothBrushingRate < 50 && totalBrushingRecords > 0) {
    concerns.push(
      `Only ${bothBrushingRate}% twice-daily brushing completion — the majority of children are not completing both morning and evening brushing, the fundamental basis of oral health protection.`,
    );
  } else if (bothBrushingRate < 70 && bothBrushingRate >= 50 && totalBrushingRecords > 0) {
    concerns.push(
      `Twice-daily brushing at ${bothBrushingRate}% — a significant number of children are not completing both morning and evening brushing sessions.`,
    );
  }

  if (overallDurationRate < 50 && totalBrushingsDone > 0) {
    concerns.push(
      `Only ${overallDurationRate}% of brushing sessions meet the recommended 2-minute minimum — inadequate brushing duration reduces plaque removal effectiveness and increases the risk of cavities and gum disease.`,
    );
  } else if (overallDurationRate < 70 && overallDurationRate >= 50 && totalBrushingsDone > 0) {
    concerns.push(
      `Brushing duration compliance at ${overallDurationRate}% — not all brushing sessions are reaching the recommended 2-minute duration for effective cleaning.`,
    );
  }

  if (refusalRate > 30 && totalBrushingRecords > 0) {
    concerns.push(
      `${refusalRate}% brushing refusal rate — a significant proportion of brushing sessions involve child refusal, which may indicate underlying anxiety, sensory issues, or a need for alternative approaches to oral care.`,
    );
  } else if (refusalRate > 15 && refusalRate <= 30 && totalBrushingRecords > 0) {
    concerns.push(
      `Brushing refusal rate at ${refusalRate}% — some children are refusing to brush, requiring investigation into individual barriers and support needs.`,
    );
  }

  if (poorConditionRate > 40 && totalReplacementRecords > 0) {
    concerns.push(
      `${poorConditionRate}% of toothbrushes found frayed, heavily worn, or damaged at replacement — brushes are not being replaced frequently enough, meaning children are using ineffective equipment for oral hygiene.`,
    );
  }

  if (overdueRate > 40 && totalReplacementRecords > 0) {
    concerns.push(
      `${overdueRate}% of toothbrush replacements overdue beyond 90 days — the home is not maintaining the recommended 3-month replacement cycle, compromising brushing effectiveness.`,
    );
  }

  if (noSupervision > 0 && totalSupervisionRecords > 0) {
    const noSupRate = pct(noSupervision, totalSupervisionRecords);
    if (noSupRate > 20) {
      concerns.push(`${noSupRate}% of supervision records show no supervision at all — particularly concerning for younger children.`);
    }
  }

  if (totalBrushingRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push("No brushing schedule records exist despite children being on placement — the home cannot evidence daily brushing routines.");
  }

  if (totalFluorideRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push("No fluoride use records exist despite children being on placement — the home cannot evidence appropriate fluoride product use.");
  }

  if (totalSupervisionRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push("No supervision records exist despite children being on placement — the home cannot evidence staff supervision of brushing.");
  }

  if (totalReplacementRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push("No toothbrush replacement records exist — the home cannot evidence regular toothbrush replacement.");
  }

  if (declined > 0 && totalIndependenceRecords > 0) {
    const declineRate = pct(declined, totalIndependenceRecords);
    if (declineRate > 20) {
      concerns.push(`${declineRate}% of independence assessments show declining oral care skills — requires immediate review.`);
    }
  }

  if (productInDateRate < 70 && totalFluorideRecords > 0) {
    concerns.push(`Only ${productInDateRate}% of fluoride products in date — expired products may be ineffective.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: TeethBrushingRecommendation[] = [];
  let rank = 0;

  if (brushingAdherenceRate < 50 && totalBrushingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve brushing schedule adherence — ensure every child completes morning and evening brushing with adequate duration and correct technique. Review individual barriers and provide staff with brushing technique training.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (fluorideUseRate < 40 && totalFluorideRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children use age-appropriate fluoride toothpaste at the correct concentration — review product stock, check expiry dates, and ensure staff understand fluoride guidance for different age groups.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (supervisionRate < 40 && totalSupervisionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul brushing supervision arrangements — ensure staff are present during brushing for children who need it, provide age-appropriate supervision, offer technique guidance, and use positive reinforcement to encourage engagement.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (independenceRate < 40 && totalIndependenceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop structured independence plans for oral care — set achievable goals for each child to build brushing independence, teach technique, and gradually reduce supervision as competence grows, preparing children for life beyond care.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Preparing for adulthood",
    });
  }

  if (totalBrushingRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement daily brushing schedule recording for all children immediately — document morning and evening brushing completion, duration, technique, and engagement to evidence that the home promotes daily oral hygiene.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalFluorideRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording fluoride product use for all children — document toothpaste type, fluoride concentration, age-appropriateness, and product condition to evidence safe and effective fluoride use.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalSupervisionRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish brushing supervision recording — document staff presence, supervision level, technique guidance, and reinforcement to evidence that children receive appropriate support with oral care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (childEngagementRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve children's engagement with oral care — use age-appropriate rewards, let children choose their own toothbrush and toothpaste, make brushing a positive routine rather than a chore, and involve children in setting their own oral health goals.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (bothBrushingRate < 50 && totalBrushingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children complete both morning and evening brushing — twice-daily brushing is the minimum standard for oral health. Review scheduling, staffing at key times, and individual barriers to completing both sessions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (refusalRate > 30 && totalBrushingRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Address high brushing refusal rates — investigate individual reasons (sensory issues, anxiety, trauma, taste preferences) and develop personalised strategies with alternatives.", urgency: "soon", regulatory_ref: "SCCIF — Health and wellbeing" });
  }

  if (toothbrushReplacementRate < 50 && totalReplacementRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve toothbrush replacement management — implement a 3-monthly replacement calendar, ensure age-appropriate brushes, hygienic storage, and individual labelling.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 14 — Health care" });
  }

  if (brushingAdherenceRate >= 50 && brushingAdherenceRate < 70 && totalBrushingRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Strengthen brushing routine quality — focus on consistent 2-minute duration, correct technique, and increased child engagement.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard" });
  }

  if (fluorideUseRate >= 40 && fluorideUseRate < 70 && totalFluorideRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review fluoride product management — ensure products match each child's age group, check concentrations, and implement expiry checks.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 14 — Health care" });
  }

  if (supervisionRate >= 40 && supervisionRate < 70 && totalSupervisionRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve brushing supervision consistency — match staff presence to each child's needs, provide technique guidance, and embed positive reinforcement.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard" });
  }

  if (independenceRate >= 40 && independenceRate < 65 && totalIndependenceRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Strengthen oral care independence programmes — set clear, age-appropriate goals and provide step-by-step skill-building.", urgency: "planned", regulatory_ref: "SCCIF — Preparing for adulthood" });
  }

  if (childEngagementRate >= 50 && childEngagementRate < 70) {
    recommendations.push({ rank: ++rank, recommendation: "Increase children's active participation in oral care — involve children in choosing products, setting goals, and using timers or apps.", urgency: "planned", regulatory_ref: "SCCIF — Voice of the child" });
  }

  if (overallDurationRate < 70 && totalBrushingsDone > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve brushing duration to meet the 2-minute recommendation — provide timers or brushing apps and staff should time supervised sessions.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard" });
  }

  if (oralDiscussionRate < 50 && totalSupervisionRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Increase oral health education during brushing routines — use brushing time for age-appropriate conversations about dental health.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard" });
  }

  if (poorConditionRate > 40 && totalReplacementRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Increase toothbrush replacement frequency — high proportion found in poor condition indicates the 3-month cycle may need shortening.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 14 — Health care" });
  }

  if (planRate < 50 && totalIndependenceRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure all children have an oral care independence plan with documented goals and clear pathways for developing skills.", urgency: "planned", regulatory_ref: "SCCIF — Preparing for adulthood" });
  }

  if (toothbrushReplacementRate >= 50 && toothbrushReplacementRate < 65 && totalReplacementRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve toothbrush management — track replacement schedules, ensure hygienic labelled storage, and let children choose age-appropriate products.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 14 — Health care" });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: TeethBrushingInsight[] = [];

  // -- Critical insights --

  if (brushingAdherenceRate < 50 && totalBrushingRecords > 0) {
    insights.push({
      text: `Only ${brushingAdherenceRate}% brushing adherence. Ofsted expects looked-after children's basic health care needs to be met as part of daily care. When brushing routines are poorly maintained — low completion, inadequate duration, or poor technique — the home is failing in its fundamental duty to promote children's oral health under Reg 14.`,
      severity: "critical",
    });
  }

  if (fluorideUseRate < 40 && totalFluorideRecords > 0) {
    insights.push({
      text: `Fluoride use compliance at only ${fluorideUseRate}%. Fluoride is the single most effective preventive measure against tooth decay. When children are not using appropriate fluoride products, they lose the key protective benefit of brushing. The home must ensure every child uses age-appropriate fluoride toothpaste at the correct concentration.`,
      severity: "critical",
    });
  }

  if (supervisionRate < 40 && totalSupervisionRecords > 0) {
    insights.push({
      text: `Supervision quality at only ${supervisionRate}%. NHS guidance recommends supervised brushing for children under 7 and oversight for older children who need it. Without consistent, appropriate supervision, children may develop poor brushing habits, use incorrect technique, or skip brushing entirely.`,
      severity: "critical",
    });
  }

  if (independenceRate < 40 && totalIndependenceRecords > 0) {
    insights.push({
      text: `Oral care independence at only ${independenceRate}%. A core purpose of residential care is preparing children for adult life. When children leave care unable to manage their own oral hygiene independently, the home has failed in its preparation for adulthood obligations. This directly impacts SCCIF outcomes.`,
      severity: "critical",
    });
  }

  if (totalBrushingRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No brushing schedule records exist despite children being on placement. Without daily brushing records, the home cannot evidence that the most basic oral health routine is in place. This is a fundamental gap in Reg 14 compliance that Ofsted would expect to see addressed as a priority.",
      severity: "critical",
    });
  }

  if (totalFluorideRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No fluoride use records exist despite children being on placement. Without fluoride records, the home cannot demonstrate that children are using appropriate dental products. Given the importance of fluoride in preventing decay, this represents a significant gap in health care evidence.",
      severity: "critical",
    });
  }

  if (totalSupervisionRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No brushing supervision records exist despite children being on placement. The home cannot evidence that staff are providing appropriate oversight and support during children's oral care routines. For younger children especially, this is a safeguarding and health care concern.",
      severity: "critical",
    });
  }

  if (refusalRate > 40 && totalBrushingRecords > 0) {
    insights.push({
      text: `${refusalRate}% brushing refusal rate. High refusal rates may indicate sensory processing difficulties, previous trauma related to oral care, taste or texture aversions, or a power dynamic that requires a therapeutic approach. Each child who refuses needs an individual assessment and adapted oral care plan.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    brushingAdherenceRate >= 50 &&
    brushingAdherenceRate < 70 &&
    totalBrushingRecords > 0
  ) {
    insights.push({
      text: `Brushing adherence at ${brushingAdherenceRate}% — improving but inconsistent. Some children are not completing brushing routines to the expected standard, meaning their oral health is not optimally protected. Focus on duration, technique, and engagement to raise adherence.`,
      severity: "warning",
    });
  }

  if (
    fluorideUseRate >= 40 &&
    fluorideUseRate < 70 &&
    totalFluorideRecords > 0
  ) {
    insights.push({
      text: `Fluoride use compliance at ${fluorideUseRate}% — some children's fluoride protection is suboptimal. Review product selection, concentration matching, and expiry management to ensure every child receives effective fluoride protection.`,
      severity: "warning",
    });
  }

  if (
    supervisionRate >= 40 &&
    supervisionRate < 70 &&
    totalSupervisionRecords > 0
  ) {
    insights.push({
      text: `Supervision quality at ${supervisionRate}% — staff supervision during brushing is inconsistent. Some children may not be receiving the level of oversight they need, particularly younger children who require active guidance and technique correction.`,
      severity: "warning",
    });
  }

  if (
    independenceRate >= 40 &&
    independenceRate < 65 &&
    totalIndependenceRecords > 0
  ) {
    insights.push({
      text: `Oral care independence at ${independenceRate}% — children's development of self-managed oral care skills needs more structured support. Without clear goals and progressive skill-building, children may not develop the independence needed for life after care.`,
      severity: "warning",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70
  ) {
    insights.push({
      text: `Child engagement with oral care at ${childEngagementRate}% — some children are not positively participating in their oral hygiene routines. Low engagement often predicts poor long-term oral health habits. Consider personalising the approach for individual children.`,
      severity: "warning",
    });
  }

  if (
    bothBrushingRate >= 50 &&
    bothBrushingRate < 70 &&
    totalBrushingRecords > 0
  ) {
    insights.push({
      text: `Twice-daily brushing at ${bothBrushingRate}% — some children are completing only one brushing session per day. Twice-daily brushing is the foundation of oral health; morning brushing removes overnight bacterial build-up and evening brushing protects teeth during sleep.`,
      severity: "warning",
    });
  }

  if (
    overallDurationRate >= 50 &&
    overallDurationRate < 70 &&
    totalBrushingsDone > 0
  ) {
    insights.push({
      text: `Brushing duration compliance at ${overallDurationRate}% — many brushing sessions fall short of the 2-minute recommendation. Insufficient duration means plaque is not effectively removed, reducing the protective benefit of brushing even when children do brush.`,
      severity: "warning",
    });
  }

  if (
    toothbrushReplacementRate >= 50 &&
    toothbrushReplacementRate < 65 &&
    totalReplacementRecords > 0
  ) {
    insights.push({
      text: `Toothbrush replacement compliance at ${toothbrushReplacementRate}% — some aspects of toothbrush management need attention, whether replacement timing, age-appropriateness, storage, or labelling. Good equipment maintenance is essential for effective oral care.`,
      severity: "warning",
    });
  }

  if (
    refusalRate > 15 &&
    refusalRate <= 30 &&
    totalBrushingRecords > 0
  ) {
    insights.push({
      text: `Brushing refusal rate at ${refusalRate}% — some children are regularly refusing to brush. Staff should explore individual reasons and develop adapted approaches. For children with sensory needs, consider different toothbrush textures, toothpaste flavours, or brushing techniques.`,
      severity: "warning",
    });
  }

  if (
    overdueRate > 20 &&
    overdueRate <= 40 &&
    totalReplacementRecords > 0
  ) {
    insights.push({
      text: `${overdueRate}% of toothbrush replacements overdue beyond 90 days — some children are using brushes past their recommended lifespan. Worn bristles become less effective at cleaning and may harbour more bacteria.`,
      severity: "warning",
    });
  }

  if (oralDiscussionRate < 50 && totalSupervisionRecords > 0) {
    insights.push({
      text: `Oral health discussion at only ${oralDiscussionRate}% of supervision sessions — daily brushing time is an underused opportunity for informal oral health education. Regular, age-appropriate conversations about dental care build understanding and motivation.`,
      severity: "warning",
    });
  }

  if (
    areaCoverageRate < 70 &&
    totalBrushingRecords > 0
  ) {
    insights.push({
      text: `Only ${areaCoverageRate}% of brushing sessions achieve full teeth area coverage — many children are not brushing all tooth surfaces, leaving areas vulnerable to plaque build-up and decay. Staff should guide children to systematically brush all areas.`,
      severity: "warning",
    });
  }

  if (
    goalMetRate < 50 &&
    goalSet > 0
  ) {
    insights.push({
      text: `Only ${goalMetRate}% of independence goals met — many children are not achieving their oral care independence targets. Goals may need to be broken into smaller steps, or additional support provided to help children progress.`,
      severity: "warning",
    });
  }

  // Replacement reason analysis
  const reasonCounts: Record<string, number> = {};
  for (const r of toothbrush_replacement_records) {
    reasonCounts[r.replacement_reason] = (reasonCounts[r.replacement_reason] ?? 0) + 1;
  }
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topReasons.length > 0) {
    const formatted = topReasons
      .map(([reason, count]) => `${reason.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common toothbrush replacement reasons: ${formatted}. Understanding replacement patterns helps identify whether brushes are wearing out too quickly, being lost or contaminated, or being replaced proactively on schedule.`,
      severity: "warning",
    });
  }

  // Brush type distribution
  if (totalReplacementRecords > 0) {
    const types: string[] = [];
    if (manualBrushes > 0) types.push(`manual (${manualBrushes})`);
    if (electricBrushes > 0) types.push(`electric (${electricBrushes})`);
    if (adaptiveBrushes > 0) types.push(`adaptive (${adaptiveBrushes})`);
    if (types.length > 0) {
      insights.push({
        text: `Toothbrush type distribution: ${types.join(", ")}. Electric toothbrushes can improve brushing effectiveness for children who struggle with manual brushing technique. Consider whether individual children would benefit from different brush types.`,
        severity: "warning",
      });
    }
  }

  // Supervision level distribution
  if (totalSupervisionRecords > 0) {
    const levels: string[] = [];
    if (fullSupervision > 0) levels.push(`full (${fullSupervision})`);
    if (partialSupervision > 0) levels.push(`partial (${partialSupervision})`);
    if (verbalPrompt > 0) levels.push(`verbal prompt (${verbalPrompt})`);
    if (independentCheck > 0) levels.push(`independent check (${independentCheck})`);
    if (noSupervision > 0) levels.push(`none (${noSupervision})`);
    if (levels.length > 1) {
      insights.push({
        text: `Supervision level distribution: ${levels.join(", ")}. The mix of supervision levels should reflect children's ages and abilities — younger children need full supervision, while older children may need only verbal prompts or independent checks.`,
        severity: "warning",
      });
    }
  }

  // -- Positive insights --

  if (brushing_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding teeth brushing and oral routine management — children brush consistently with correct technique and adequate duration, fluoride products are used appropriately, staff supervision is well-matched to children's needs, equipment is maintained, and children are developing independent oral care skills. This is strong evidence for Reg 14 and Reg 5 compliance.",
      severity: "positive",
    });
  }

  if (brushingAdherenceRate >= 90 && fluorideUseRate >= 90 && totalBrushingRecords > 0 && totalFluorideRecords > 0) {
    insights.push({
      text: `${brushingAdherenceRate}% brushing adherence with ${fluorideUseRate}% fluoride compliance — consistent, high-quality brushing with appropriate fluoride use provides optimal protection against tooth decay and gum disease.`,
      severity: "positive",
    });
  }

  if (supervisionRate >= 90 && reinforcementRate >= 80 && totalSupervisionRecords > 0) {
    insights.push({
      text: `${supervisionRate}% supervision quality with ${reinforcementRate}% positive reinforcement — staff provide consistent, appropriate supervision that encourages children's ownership of their oral care.`,
      severity: "positive",
    });
  }

  if (independenceRate >= 85 && improvementRate >= 60 && totalIndependenceRecords > 0) {
    insights.push({
      text: `${independenceRate}% oral care independence with ${improvementRate}% showing improvement — children are developing strong independent oral hygiene skills for life after care.`,
      severity: "positive",
    });
  }

  if (childEngagementRate >= 90) {
    insights.push({
      text: `${childEngagementRate}% child engagement across oral care — children actively participate in brushing, choose products, and understand oral health importance.`,
      severity: "positive",
    });
  }

  if (bothBrushingRate >= 90 && overallDurationRate >= 85 && totalBrushingRecords > 0) {
    insights.push({
      text: `${bothBrushingRate}% twice-daily brushing with ${overallDurationRate}% meeting 2-minute duration — children consistently complete the full recommended routine.`,
      severity: "positive",
    });
  }

  if (goalMetRate >= 80 && planRate >= 80 && goalSet > 0 && totalIndependenceRecords > 0) {
    insights.push({
      text: `${goalMetRate}% independence goals met with ${planRate}% having plans in place — structured approach to building children's oral care independence demonstrates preparation for adulthood.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (brushing_rating === "outstanding") {
    headline =
      "Outstanding teeth brushing and oral routine management — children brush consistently with correct technique, fluoride products are used appropriately, and independence in oral care is actively developed.";
  } else if (brushing_rating === "good") {
    headline = `Good teeth brushing and oral routine management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (brushing_rating === "adequate") {
    headline = `Adequate teeth brushing and oral routine management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's oral hygiene needs are consistently met.`;
  } else {
    headline = `Teeth brushing and oral routine management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's oral hygiene is properly managed.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    brushing_rating,
    brushing_score: score,
    headline,
    total_brushing_records: totalBrushingRecords,
    total_fluoride_records: totalFluorideRecords,
    total_supervision_records: totalSupervisionRecords,
    total_replacement_records: totalReplacementRecords,
    total_independence_records: totalIndependenceRecords,
    brushing_adherence_rate: brushingAdherenceRate,
    fluoride_use_rate: fluorideUseRate,
    supervision_rate: supervisionRate,
    toothbrush_replacement_rate: toothbrushReplacementRate,
    independence_rate: independenceRate,
    child_engagement_rate: childEngagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
