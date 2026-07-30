// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BATHROOM ACCESSIBILITY & ADAPTATIONS INTELLIGENCE ENGINE
// Measures bathroom adaptation adequacy, grab rail provision, non-slip surface
// compliance, wheelchair access, and child-specific modification tracking.
// Evaluates adaptation_adequacy, grab_rail provision, non_slip surfaces,
// wheelchair_access, child_modification completeness, and satisfaction.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises), Reg 5 (Engagement with parents/carers).
// SCCIF: "Safety", "Living in the home", "Quality of care".
// Store keys: adaptationRecords, grabRailRecords, nonSlipRecords,
//             wheelchairAccessRecords, modificationRecords
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meets } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AdaptationRecordInput {
  id: string;
  bathroom_id: string;
  child_id: string | null;
  adaptation_type:
    | "height_adjustment"
    | "doorway_widening"
    | "bath_hoist"
    | "level_access_shower"
    | "specialist_toilet"
    | "sensory_adaptation"
    | "visual_aid"
    | "temperature_control"
    | "other";
  installed: boolean;
  installation_date: string | null;
  last_inspection_date: string | null;
  inspection_passed: boolean;
  meets_child_needs: boolean;
  risk_assessed: boolean;
  documented: boolean;
  condition: "excellent" | "good" | "fair" | "poor" | "unusable";
  notes: string;
  created_at: string;
}

export interface GrabRailRecordInput {
  id: string;
  bathroom_id: string;
  location: "bath" | "shower" | "toilet" | "basin" | "doorway" | "corridor" | "other";
  installed: boolean;
  installation_date: string | null;
  last_inspection_date: string | null;
  inspection_passed: boolean;
  securely_fixed: boolean;
  correct_height: boolean;
  weight_tested: boolean;
  condition: "excellent" | "good" | "fair" | "poor" | "unusable";
  compliant_with_standard: boolean;
  notes: string;
  created_at: string;
}

export interface NonSlipRecordInput {
  id: string;
  bathroom_id: string;
  surface_type: "bath_mat" | "shower_mat" | "floor_tiles" | "bath_strips" | "shower_tray" | "step_treads" | "other";
  installed: boolean;
  installation_date: string | null;
  last_inspection_date: string | null;
  inspection_passed: boolean;
  slip_resistance_tested: boolean;
  meets_standard: boolean;
  condition: "excellent" | "good" | "fair" | "poor" | "unusable";
  replacement_due: boolean;
  notes: string;
  created_at: string;
}

export interface WheelchairAccessRecordInput {
  id: string;
  bathroom_id: string;
  doorway_width_mm: number;
  doorway_meets_standard: boolean;
  turning_circle_adequate: boolean;
  transfer_space_available: boolean;
  accessible_fixtures: boolean;
  emergency_pull_cord: boolean;
  floor_level_access: boolean;
  last_assessment_date: string | null;
  assessment_passed: boolean;
  child_specific: boolean;
  child_id: string | null;
  notes: string;
  created_at: string;
}

export interface ModificationRecordInput {
  id: string;
  bathroom_id: string;
  child_id: string;
  modification_type:
    | "step_stool"
    | "raised_toilet_seat"
    | "bath_seat"
    | "shower_chair"
    | "temperature_limiter"
    | "anti_scald_valve"
    | "visual_schedule"
    | "sensory_lighting"
    | "privacy_adaptation"
    | "other";
  installed: boolean;
  installation_date: string | null;
  last_review_date: string | null;
  meets_child_needs: boolean;
  child_consulted: boolean;
  care_plan_linked: boolean;
  condition: "excellent" | "good" | "fair" | "poor" | "unusable";
  satisfaction_rating: number; // 1-5
  notes: string;
  created_at: string;
}

export interface BathroomAccessibilityAdaptationsInput {
  today: string;
  total_children: number;
  adaptation_records: AdaptationRecordInput[];
  grab_rail_records: GrabRailRecordInput[];
  non_slip_records: NonSlipRecordInput[];
  wheelchair_records: WheelchairAccessRecordInput[];
  modification_records: ModificationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type BathroomAccessibilityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BathroomAccessibilityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface BathroomAccessibilityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface BathroomAccessibilityAdaptationsResult {
  bath_access_rating: BathroomAccessibilityRating;
  bath_access_score: number;
  headline: string;
  total_adaptation_records: number;
  total_grab_rail_records: number;
  total_non_slip_records: number;
  total_wheelchair_records: number;
  total_modification_records: number;
  // Null on empty across every composite rate — no source records ⇒ no signal.
  // "0% adaptation adequacy / 0% grab rails / 0% non-slip / 0% wheelchair
  // access / 0% child modifications / 0% satisfaction" would read as a
  // physically hostile bathroom environment, not "unmeasured". Fab-0 doctrine.
  adaptation_adequacy_rate: number | null;
  grab_rail_rate: number | null;
  non_slip_rate: number | null;
  wheelchair_access_rate: number | null;
  child_modification_rate: number | null;
  satisfaction_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: BathroomAccessibilityRecommendation[];
  insights: BathroomAccessibilityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): BathroomAccessibilityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: BathroomAccessibilityRating,
  score: number,
  headline: string,
): BathroomAccessibilityAdaptationsResult {
  return {
    bath_access_rating: rating,
    bath_access_score: score,
    headline,
    total_adaptation_records: 0,
    total_grab_rail_records: 0,
    total_non_slip_records: 0,
    total_wheelchair_records: 0,
    total_modification_records: 0,
    adaptation_adequacy_rate: null,
    grab_rail_rate: null,
    non_slip_rate: null,
    wheelchair_access_rate: null,
    child_modification_rate: null,
    satisfaction_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeBathroomAccessibilityAdaptations(
  input: BathroomAccessibilityAdaptationsInput,
): BathroomAccessibilityAdaptationsResult {
  const {
    total_children,
    adaptation_records,
    grab_rail_records,
    non_slip_records,
    wheelchair_records,
    modification_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    adaptation_records.length === 0 &&
    grab_rail_records.length === 0 &&
    non_slip_records.length === 0 &&
    wheelchair_records.length === 0 &&
    modification_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess bathroom accessibility and adaptations.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No bathroom accessibility or adaptation data recorded despite children on placement — bathroom safety and accessibility require urgent attention.",
      ),
      concerns: [
        "No adaptation records, grab rail records, non-slip surface records, wheelchair access records, or child modification records exist despite children being on placement — the home cannot evidence that bathrooms are safe, accessible, and adapted to meet children's individual needs.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of bathroom adaptations, grab rail provision, non-slip surfaces, wheelchair access assessments, and child-specific modifications to evidence the home's compliance with premises safety standards and individual care planning.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Conduct a full bathroom accessibility audit across all bathrooms in the home, identifying each child's individual needs and ensuring adaptations, grab rails, non-slip surfaces, and modifications are in place and documented.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Safety",
        },
      ],
      insights: [
        {
          text: "The complete absence of bathroom accessibility records means the home cannot demonstrate that bathrooms are safe, accessible, and adapted to children's individual needs. Under Reg 25, premises must be appropriate for the purpose of achieving the aims of the quality of care standards. Bathroom safety is a fundamental element of premises compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Adaptation adequacy metrics ---
  const totalAdaptationRecords = adaptation_records.length;
  const installedAdaptations = adaptation_records.filter((a) => a.installed).length;
  const installedRate = pct(installedAdaptations, totalAdaptationRecords);

  const adaptationsMeetingNeeds = adaptation_records.filter(
    (a) => a.installed && a.meets_child_needs,
  ).length;
  const adaptationMeetNeedsRate = pct(adaptationsMeetingNeeds, totalAdaptationRecords);

  const adaptationsInspectionPassed = adaptation_records.filter(
    (a) => a.installed && a.inspection_passed,
  ).length;
  const adaptationInspectionRate = pct(adaptationsInspectionPassed, totalAdaptationRecords);

  const adaptationsRiskAssessed = adaptation_records.filter(
    (a) => a.installed && a.risk_assessed,
  ).length;
  const adaptationRiskAssessedRate = pct(adaptationsRiskAssessed, totalAdaptationRecords);

  const adaptationsDocumented = adaptation_records.filter(
    (a) => a.installed && a.documented,
  ).length;
  const adaptationDocumentedRate = pct(adaptationsDocumented, totalAdaptationRecords);

  const adaptationsGoodCondition = adaptation_records.filter(
    (a) =>
      a.installed &&
      (a.condition === "excellent" || a.condition === "good"),
  ).length;
  const adaptationConditionRate = pct(adaptationsGoodCondition, totalAdaptationRecords);

  const adaptationsPoorCondition = adaptation_records.filter(
    (a) =>
      a.installed &&
      (a.condition === "poor" || a.condition === "unusable"),
  ).length;
  const adaptationPoorConditionRate = pct(adaptationsPoorCondition, totalAdaptationRecords);

  // Composite adaptation_adequacy_rate: installed + meets needs + inspection passed + documented
  const adaptationAdequacyRate: number | null =
    totalAdaptationRecords > 0
      ? Math.round(
          (installedRate + adaptationMeetNeedsRate + adaptationInspectionRate + adaptationDocumentedRate) / 4,
        )
      : null;

  // --- Grab rail metrics ---
  const totalGrabRailRecords = grab_rail_records.length;
  const installedGrabRails = grab_rail_records.filter((g) => g.installed).length;
  const grabRailInstalledRate = pct(installedGrabRails, totalGrabRailRecords);

  const securelyFixedGrabRails = grab_rail_records.filter(
    (g) => g.installed && g.securely_fixed,
  ).length;
  const securelyFixedRate = pct(securelyFixedGrabRails, totalGrabRailRecords);

  const correctHeightGrabRails = grab_rail_records.filter(
    (g) => g.installed && g.correct_height,
  ).length;
  const correctHeightRate = pct(correctHeightGrabRails, totalGrabRailRecords);

  const weightTestedGrabRails = grab_rail_records.filter(
    (g) => g.installed && g.weight_tested,
  ).length;
  const weightTestedRate = pct(weightTestedGrabRails, totalGrabRailRecords);

  const grabRailInspectionPassed = grab_rail_records.filter(
    (g) => g.installed && g.inspection_passed,
  ).length;
  const grabRailInspectionRate = pct(grabRailInspectionPassed, totalGrabRailRecords);

  const compliantGrabRails = grab_rail_records.filter(
    (g) => g.installed && g.compliant_with_standard,
  ).length;
  const grabRailComplianceRate = pct(compliantGrabRails, totalGrabRailRecords);

  const grabRailsGoodCondition = grab_rail_records.filter(
    (g) =>
      g.installed &&
      (g.condition === "excellent" || g.condition === "good"),
  ).length;
  const grabRailConditionRate = pct(grabRailsGoodCondition, totalGrabRailRecords);

  const grabRailsPoorCondition = grab_rail_records.filter(
    (g) =>
      g.installed &&
      (g.condition === "poor" || g.condition === "unusable"),
  ).length;
  const grabRailPoorConditionRate = pct(grabRailsPoorCondition, totalGrabRailRecords);

  // Composite grab_rail_rate: installed + securely fixed + correct height + inspection passed
  const grabRailRate: number | null =
    totalGrabRailRecords > 0
      ? Math.round(
          (grabRailInstalledRate + securelyFixedRate + correctHeightRate + grabRailInspectionRate) / 4,
        )
      : null;

  // --- Non-slip surface metrics ---
  const totalNonSlipRecords = non_slip_records.length;
  const installedNonSlip = non_slip_records.filter((n) => n.installed).length;
  const nonSlipInstalledRate = pct(installedNonSlip, totalNonSlipRecords);

  const nonSlipInspectionPassed = non_slip_records.filter(
    (n) => n.installed && n.inspection_passed,
  ).length;
  const nonSlipInspectionRate = pct(nonSlipInspectionPassed, totalNonSlipRecords);

  const slipResistanceTested = non_slip_records.filter(
    (n) => n.installed && n.slip_resistance_tested,
  ).length;
  const slipResistanceTestedRate = pct(slipResistanceTested, totalNonSlipRecords);

  const nonSlipMeetsStandard = non_slip_records.filter(
    (n) => n.installed && n.meets_standard,
  ).length;
  const nonSlipStandardRate = pct(nonSlipMeetsStandard, totalNonSlipRecords);

  const nonSlipGoodCondition = non_slip_records.filter(
    (n) =>
      n.installed &&
      (n.condition === "excellent" || n.condition === "good"),
  ).length;
  const nonSlipConditionRate = pct(nonSlipGoodCondition, totalNonSlipRecords);

  const nonSlipPoorCondition = non_slip_records.filter(
    (n) =>
      n.installed &&
      (n.condition === "poor" || n.condition === "unusable"),
  ).length;
  const nonSlipPoorConditionRate = pct(nonSlipPoorCondition, totalNonSlipRecords);

  const nonSlipReplacementDue = non_slip_records.filter(
    (n) => n.installed && n.replacement_due,
  ).length;
  const nonSlipReplacementDueRate = pct(nonSlipReplacementDue, totalNonSlipRecords);

  // Composite non_slip_rate: installed + inspection passed + meets standard + resistance tested
  const nonSlipRate: number | null =
    totalNonSlipRecords > 0
      ? Math.round(
          (nonSlipInstalledRate + nonSlipInspectionRate + nonSlipStandardRate + slipResistanceTestedRate) / 4,
        )
      : null;

  // --- Wheelchair access metrics ---
  const totalWheelchairRecords = wheelchair_records.length;
  const wheelchairDoorwayMeetsStandard = wheelchair_records.filter(
    (w) => w.doorway_meets_standard,
  ).length;
  const wheelchairDoorwayRate = pct(wheelchairDoorwayMeetsStandard, totalWheelchairRecords);

  const wheelchairTurningCircle = wheelchair_records.filter(
    (w) => w.turning_circle_adequate,
  ).length;
  const turningCircleRate = pct(wheelchairTurningCircle, totalWheelchairRecords);

  const wheelchairTransferSpace = wheelchair_records.filter(
    (w) => w.transfer_space_available,
  ).length;
  const transferSpaceRate = pct(wheelchairTransferSpace, totalWheelchairRecords);

  const wheelchairAccessibleFixtures = wheelchair_records.filter(
    (w) => w.accessible_fixtures,
  ).length;
  const accessibleFixturesRate = pct(wheelchairAccessibleFixtures, totalWheelchairRecords);

  const wheelchairEmergencyPullCord = wheelchair_records.filter(
    (w) => w.emergency_pull_cord,
  ).length;
  const emergencyPullCordRate = pct(wheelchairEmergencyPullCord, totalWheelchairRecords);

  const wheelchairFloorLevel = wheelchair_records.filter(
    (w) => w.floor_level_access,
  ).length;
  const floorLevelRate = pct(wheelchairFloorLevel, totalWheelchairRecords);

  const wheelchairAssessmentPassed = wheelchair_records.filter(
    (w) => w.assessment_passed,
  ).length;
  const wheelchairAssessmentRate = pct(wheelchairAssessmentPassed, totalWheelchairRecords);

  // Composite wheelchair_access_rate: doorway + turning circle + transfer space + assessment passed
  const wheelchairAccessRate: number | null =
    totalWheelchairRecords > 0
      ? Math.round(
          (wheelchairDoorwayRate + turningCircleRate + transferSpaceRate + wheelchairAssessmentRate) / 4,
        )
      : null;

  // --- Child modification metrics ---
  const totalModificationRecords = modification_records.length;
  const installedModifications = modification_records.filter((m) => m.installed).length;
  const modificationInstalledRate = pct(installedModifications, totalModificationRecords);

  const modificationsMeetingNeeds = modification_records.filter(
    (m) => m.installed && m.meets_child_needs,
  ).length;
  const modificationMeetNeedsRate = pct(modificationsMeetingNeeds, totalModificationRecords);

  const modificationsChildConsulted = modification_records.filter(
    (m) => m.installed && m.child_consulted,
  ).length;
  const modificationChildConsultedRate = pct(modificationsChildConsulted, totalModificationRecords);

  const modificationsCarePlanLinked = modification_records.filter(
    (m) => m.installed && m.care_plan_linked,
  ).length;
  const modificationCarePlanRate = pct(modificationsCarePlanLinked, totalModificationRecords);

  const modificationsGoodCondition = modification_records.filter(
    (m) =>
      m.installed &&
      (m.condition === "excellent" || m.condition === "good"),
  ).length;
  const modificationConditionRate = pct(modificationsGoodCondition, totalModificationRecords);

  const modificationsPoorCondition = modification_records.filter(
    (m) =>
      m.installed &&
      (m.condition === "poor" || m.condition === "unusable"),
  ).length;
  const modificationPoorConditionRate = pct(modificationsPoorCondition, totalModificationRecords);

  // Composite child_modification_rate: installed + meets needs + child consulted + care plan linked
  const childModificationRate: number | null =
    totalModificationRecords > 0
      ? Math.round(
          (modificationInstalledRate + modificationMeetNeedsRate + modificationChildConsultedRate + modificationCarePlanRate) / 4,
        )
      : null;

  // --- Satisfaction metrics ---
  const satisfactionRatings = modification_records
    .filter((m) => m.installed && m.satisfaction_rating >= 1 && m.satisfaction_rating <= 5);
  const satisfactionSum = satisfactionRatings.reduce(
    (sum, m) => sum + m.satisfaction_rating,
    0,
  );
  const avgSatisfaction: number | null =
    satisfactionRatings.length > 0
      ? Math.round((satisfactionSum / satisfactionRatings.length) * 100) / 100
      : null;
  // Convert satisfaction from 1-5 scale to percentage
  const satisfactionRate: number | null =
    satisfactionRatings.length > 0
      ? Math.round((avgSatisfaction! / 5) * 100)
      : null;

  // --- Unique children coverage ---
  const uniqueChildrenModified = new Set(
    modification_records.filter((m) => m.installed).map((m) => m.child_id),
  ).size;
  const childModificationCoverage =
    total_children > 0 ? pct(uniqueChildrenModified, total_children) : 0;

  // --- Unique bathrooms ---
  const allBathroomIds = new Set<string>();
  for (const a of adaptation_records) allBathroomIds.add(a.bathroom_id);
  for (const g of grab_rail_records) allBathroomIds.add(g.bathroom_id);
  for (const n of non_slip_records) allBathroomIds.add(n.bathroom_id);
  for (const w of wheelchair_records) allBathroomIds.add(w.bathroom_id);
  for (const m of modification_records) allBathroomIds.add(m.bathroom_id);
  const totalBathrooms = allBathroomIds.size;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: adaptationAdequacyRate (>=90: +5, >=70: +3) ---
  if (meets(adaptationAdequacyRate, 90)) score += 5;
  else if (meets(adaptationAdequacyRate, 70)) score += 3;

  // --- Bonus 2: grabRailRate (>=90: +5, >=70: +3) ---
  if (meets(grabRailRate, 90)) score += 5;
  else if (meets(grabRailRate, 70)) score += 3;

  // --- Bonus 3: nonSlipRate (>=90: +5, >=70: +3) ---
  if (meets(nonSlipRate, 90)) score += 5;
  else if (meets(nonSlipRate, 70)) score += 3;

  // --- Bonus 4: wheelchairAccessRate (>=90: +5, >=70: +2) ---
  if (meets(wheelchairAccessRate, 90)) score += 5;
  else if (meets(wheelchairAccessRate, 70)) score += 2;

  // --- Bonus 5: childModificationRate (>=90: +4, >=70: +2) ---
  if (meets(childModificationRate, 90)) score += 4;
  else if (meets(childModificationRate, 70)) score += 2;

  // --- Bonus 6: satisfactionRate (>=90: +4, >=70: +2) ---
  if (meets(satisfactionRate, 90)) score += 4;
  else if (meets(satisfactionRate, 70)) score += 2;

  // Max bonuses = 5+5+5+5+4+4 = 28 ✓

  // ── Penalties (4 guarded) ────────────────────────────────────────────

  // below(adaptationAdequacyRate, 40) → -5 (guarded)
  if (below(adaptationAdequacyRate, 40) && totalAdaptationRecords > 0) score -= 5;

  // below(grabRailRate, 40) → -5 (guarded)
  if (below(grabRailRate, 40) && totalGrabRailRecords > 0) score -= 5;

  // below(nonSlipRate, 40) → -5 (guarded)
  if (below(nonSlipRate, 40) && totalNonSlipRecords > 0) score -= 5;

  // below(wheelchairAccessRate, 40) → -3 (guarded)
  if (below(wheelchairAccessRate, 40) && totalWheelchairRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const bath_access_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(adaptationAdequacyRate, 90) && totalAdaptationRecords > 0) {
    strengths.push(
      `${adaptationAdequacyRate}% adaptation adequacy — bathroom adaptations are comprehensively installed, documented, inspected, and meeting children's individual needs.`,
    );
  } else if (meets(adaptationAdequacyRate, 70) && totalAdaptationRecords > 0) {
    strengths.push(
      `${adaptationAdequacyRate}% adaptation adequacy rate — the home maintains good standards of bathroom adaptation provision across its facilities.`,
    );
  }

  if (meets(grabRailRate, 90) && totalGrabRailRecords > 0) {
    strengths.push(
      `${grabRailRate}% grab rail compliance — grab rails are securely installed, correctly positioned, inspected, and providing safe support across all bathroom areas.`,
    );
  } else if (meets(grabRailRate, 70) && totalGrabRailRecords > 0) {
    strengths.push(
      `${grabRailRate}% grab rail provision rate — good standards of grab rail installation and maintenance across the home's bathrooms.`,
    );
  }

  if (meets(nonSlipRate, 90) && totalNonSlipRecords > 0) {
    strengths.push(
      `${nonSlipRate}% non-slip surface compliance — all bathroom non-slip surfaces are installed, tested, meeting standards, and in good condition.`,
    );
  } else if (meets(nonSlipRate, 70) && totalNonSlipRecords > 0) {
    strengths.push(
      `${nonSlipRate}% non-slip compliance rate — the home demonstrates good slip-prevention practice across its bathroom facilities.`,
    );
  }

  if (meets(wheelchairAccessRate, 90) && totalWheelchairRecords > 0) {
    strengths.push(
      `${wheelchairAccessRate}% wheelchair access compliance — bathroom wheelchair access meets standards for doorway width, turning circles, transfer space, and assessment requirements.`,
    );
  } else if (meets(wheelchairAccessRate, 70) && totalWheelchairRecords > 0) {
    strengths.push(
      `${wheelchairAccessRate}% wheelchair access rate — good provision of wheelchair-accessible bathroom facilities across the home.`,
    );
  }

  if (meets(childModificationRate, 90) && totalModificationRecords > 0) {
    strengths.push(
      `${childModificationRate}% child modification compliance — bathroom modifications are installed, meeting children's needs, informed by child consultation, and linked to care plans.`,
    );
  } else if (meets(childModificationRate, 70) && totalModificationRecords > 0) {
    strengths.push(
      `${childModificationRate}% child modification rate — good standards of child-specific bathroom modification provision and management.`,
    );
  }

  if (meets(satisfactionRate, 90) && satisfactionRatings.length > 0) {
    strengths.push(
      `${satisfactionRate}% satisfaction rate (avg ${avgSatisfaction}/5) — children are highly satisfied with their bathroom modifications, demonstrating person-centred adaptation practice.`,
    );
  } else if (meets(satisfactionRate, 70) && satisfactionRatings.length > 0) {
    strengths.push(
      `${satisfactionRate}% satisfaction rate — children report good satisfaction with bathroom modifications, indicating adaptations are meeting their needs.`,
    );
  }

  if (adaptationConditionRate >= 90 && totalAdaptationRecords > 0) {
    strengths.push(
      `${adaptationConditionRate}% of adaptations in excellent or good condition — bathroom adaptations are well-maintained and fit for purpose.`,
    );
  }

  if (grabRailConditionRate >= 90 && totalGrabRailRecords > 0) {
    strengths.push(
      `${grabRailConditionRate}% of grab rails in excellent or good condition — safety equipment is well-maintained, supporting ongoing safe use of bathrooms.`,
    );
  }

  if (grabRailComplianceRate >= 95 && totalGrabRailRecords > 0) {
    strengths.push(
      `${grabRailComplianceRate}% of grab rails compliant with safety standards — exemplary compliance with building and safety regulations.`,
    );
  }

  if (nonSlipStandardRate >= 95 && totalNonSlipRecords > 0) {
    strengths.push(
      `${nonSlipStandardRate}% of non-slip surfaces meeting safety standards — comprehensive slip-prevention across all bathroom areas.`,
    );
  }

  if (emergencyPullCordRate >= 90 && totalWheelchairRecords > 0) {
    strengths.push(
      `${emergencyPullCordRate}% of wheelchair-accessible bathrooms have emergency pull cords — ensuring safety and emergency response capability for vulnerable users.`,
    );
  }

  if (modificationChildConsultedRate >= 90 && totalModificationRecords > 0) {
    strengths.push(
      `${modificationChildConsultedRate}% of modifications informed by child consultation — the home consistently involves children in decisions about their bathroom adaptations, evidencing voice of the child.`,
    );
  }

  if (modificationCarePlanRate >= 90 && totalModificationRecords > 0) {
    strengths.push(
      `${modificationCarePlanRate}% of modifications linked to care plans — bathroom adaptations are integrated into individual care planning, demonstrating person-centred practice.`,
    );
  }

  if (childModificationCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has bathroom modifications assessed and in place — the home ensures equitable access and adaptation for all children in its care.",
    );
  } else if (childModificationCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${childModificationCoverage}% of children have bathroom modifications in place — strong coverage ensuring most children benefit from personalised bathroom adaptations.`,
    );
  }

  if (adaptationRiskAssessedRate >= 90 && totalAdaptationRecords > 0) {
    strengths.push(
      `${adaptationRiskAssessedRate}% of adaptations risk assessed — the home demonstrates thorough risk management of bathroom adaptation equipment.`,
    );
  }

  if (weightTestedRate >= 90 && totalGrabRailRecords > 0) {
    strengths.push(
      `${weightTestedRate}% of grab rails weight tested — comprehensive testing regime ensures grab rails are safe for use.`,
    );
  }

  if (floorLevelRate >= 90 && totalWheelchairRecords > 0) {
    strengths.push(
      `${floorLevelRate}% of wheelchair-accessible bathrooms have floor-level access — eliminating step hazards and enabling independent access for wheelchair users.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(adaptationAdequacyRate, 40) && totalAdaptationRecords > 0) {
    concerns.push(
      `Only ${adaptationAdequacyRate}% adaptation adequacy — bathroom adaptations are significantly failing in installation, documentation, inspection, or meeting children's needs. This represents a serious premises safety concern under Reg 25.`,
    );
  } else if (below(adaptationAdequacyRate, 70) && meets(adaptationAdequacyRate, 40) && totalAdaptationRecords > 0) {
    concerns.push(
      `Adaptation adequacy at ${adaptationAdequacyRate}% — bathroom adaptations are not consistently installed, documented, inspected, or meeting children's individual needs.`,
    );
  }

  if (below(grabRailRate, 40) && totalGrabRailRecords > 0) {
    concerns.push(
      `Only ${grabRailRate}% grab rail compliance — grab rails are failing in installation, secure fixing, correct positioning, or inspection. This creates a significant fall risk for children using bathrooms.`,
    );
  } else if (below(grabRailRate, 70) && meets(grabRailRate, 40) && totalGrabRailRecords > 0) {
    concerns.push(
      `Grab rail provision at ${grabRailRate}% — inconsistent installation, fixing, height positioning, or inspection of grab rails across the home's bathrooms.`,
    );
  }

  if (below(nonSlipRate, 40) && totalNonSlipRecords > 0) {
    concerns.push(
      `Only ${nonSlipRate}% non-slip compliance — non-slip surfaces are significantly failing in installation, testing, standards compliance, or condition. This creates a serious slip and fall hazard for children.`,
    );
  } else if (below(nonSlipRate, 70) && meets(nonSlipRate, 40) && totalNonSlipRecords > 0) {
    concerns.push(
      `Non-slip compliance at ${nonSlipRate}% — not all bathroom non-slip surfaces are consistently installed, tested, or meeting safety standards.`,
    );
  }

  if (below(wheelchairAccessRate, 40) && totalWheelchairRecords > 0) {
    concerns.push(
      `Only ${wheelchairAccessRate}% wheelchair access compliance — significant failures in doorway width, turning circles, transfer space, or assessment requirements. Children with mobility needs may not be able to safely or independently access bathroom facilities.`,
    );
  } else if (below(wheelchairAccessRate, 70) && meets(wheelchairAccessRate, 40) && totalWheelchairRecords > 0) {
    concerns.push(
      `Wheelchair access at ${wheelchairAccessRate}% — not all wheelchair-accessible bathrooms consistently meet standards for doorway width, turning circles, or transfer space.`,
    );
  }

  if (below(childModificationRate, 40) && totalModificationRecords > 0) {
    concerns.push(
      `Only ${childModificationRate}% child modification compliance — bathroom modifications are significantly failing in installation, meeting needs, child consultation, or care plan integration. Children's individual needs are not being met.`,
    );
  } else if (below(childModificationRate, 70) && meets(childModificationRate, 40) && totalModificationRecords > 0) {
    concerns.push(
      `Child modification rate at ${childModificationRate}% — not all bathroom modifications are consistently meeting children's needs, informed by consultation, or linked to care plans.`,
    );
  }

  if (below(satisfactionRate, 50) && satisfactionRatings.length > 0) {
    concerns.push(
      `Satisfaction rate at only ${satisfactionRate}% (avg ${avgSatisfaction}/5) — children are not satisfied with their bathroom modifications, indicating adaptations are not meeting their needs or preferences.`,
    );
  } else if (below(satisfactionRate, 70) && meets(satisfactionRate, 50) && satisfactionRatings.length > 0) {
    concerns.push(
      `Satisfaction at ${satisfactionRate}% — some children are not fully satisfied with bathroom modifications, suggesting adaptations may need review.`,
    );
  }

  if (adaptationPoorConditionRate >= 20 && totalAdaptationRecords > 0) {
    concerns.push(
      `${adaptationPoorConditionRate}% of adaptations in poor or unusable condition — deteriorating bathroom adaptations create safety risks and fail to meet children's needs.`,
    );
  }

  if (grabRailPoorConditionRate >= 20 && totalGrabRailRecords > 0) {
    concerns.push(
      `${grabRailPoorConditionRate}% of grab rails in poor or unusable condition — deteriorating grab rails create significant fall risks and must be replaced or repaired urgently.`,
    );
  }

  if (nonSlipPoorConditionRate >= 20 && totalNonSlipRecords > 0) {
    concerns.push(
      `${nonSlipPoorConditionRate}% of non-slip surfaces in poor or unusable condition — worn or damaged non-slip surfaces increase slip and fall risk.`,
    );
  }

  if (nonSlipReplacementDueRate >= 30 && totalNonSlipRecords > 0) {
    concerns.push(
      `${nonSlipReplacementDueRate}% of non-slip surfaces due for replacement — overdue replacements compromise bathroom safety.`,
    );
  }

  if (modificationChildConsultedRate < 50 && totalModificationRecords > 0) {
    concerns.push(
      `Only ${modificationChildConsultedRate}% of modifications informed by child consultation — children are not being adequately involved in decisions about their bathroom adaptations, undermining voice of the child.`,
    );
  }

  if (modificationCarePlanRate < 50 && totalModificationRecords > 0) {
    concerns.push(
      `Only ${modificationCarePlanRate}% of modifications linked to care plans — bathroom adaptations are not consistently integrated into individual care planning.`,
    );
  }

  if (emergencyPullCordRate < 50 && totalWheelchairRecords > 0) {
    concerns.push(
      `Only ${emergencyPullCordRate}% of wheelchair-accessible bathrooms have emergency pull cords — this is a significant safety concern for vulnerable users who may need emergency assistance.`,
    );
  }

  if (childModificationCoverage < 50 && total_children > 0 && totalModificationRecords > 0) {
    concerns.push(
      `Only ${childModificationCoverage}% of children have bathroom modifications in place — many children may not have individualised bathroom adaptations.`,
    );
  }

  if (adaptationRiskAssessedRate < 50 && totalAdaptationRecords > 0) {
    concerns.push(
      `Only ${adaptationRiskAssessedRate}% of adaptations risk assessed — inadequate risk assessment of bathroom adaptation equipment creates unmanaged hazards.`,
    );
  }

  if (weightTestedRate < 50 && totalGrabRailRecords > 0) {
    concerns.push(
      `Only ${weightTestedRate}% of grab rails weight tested — untested grab rails may fail under load, creating a serious fall risk.`,
    );
  }

  if (modificationPoorConditionRate >= 20 && totalModificationRecords > 0) {
    concerns.push(
      `${modificationPoorConditionRate}% of child modifications in poor or unusable condition — children's bathroom equipment is not being adequately maintained.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: BathroomAccessibilityRecommendation[] = [];
  let rank = 0;

  if (below(adaptationAdequacyRate, 40) && totalAdaptationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all bathroom adaptations — ensure every adaptation is properly installed, documented, inspected, risk assessed, and verified as meeting children's individual needs. Engage an occupational therapist where required.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(grabRailRate, 40) && totalGrabRailRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently audit all grab rails — ensure every rail is securely fixed, correctly positioned, weight tested, and compliant with safety standards. Replace any grab rails in poor or unusable condition immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(nonSlipRate, 40) && totalNonSlipRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all non-slip surfaces — ensure every surface is installed, slip-resistance tested, meeting standards, and in safe condition. Replace worn or damaged surfaces immediately to prevent slip and fall injuries.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (below(wheelchairAccessRate, 40) && totalWheelchairRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission an urgent wheelchair accessibility review of all bathrooms — address doorway widths, turning circles, transfer spaces, and floor-level access. Ensure every wheelchair-accessible bathroom meets DDA and building regulation standards.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(childModificationRate, 40) && totalModificationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all child-specific bathroom modifications — consult with each child about their needs and preferences, ensure modifications are installed, functioning, and linked to their care plan. Engage occupational therapy support where appropriate.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with parents and others",
    });
  }

  if (grabRailPoorConditionRate >= 20 && totalGrabRailRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace or repair all grab rails in poor or unusable condition immediately — deteriorating grab rails present an unacceptable fall risk and must be addressed as a safety priority.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (emergencyPullCordRate < 50 && totalWheelchairRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Install emergency pull cords in all wheelchair-accessible bathrooms — children with mobility needs must be able to summon emergency assistance when using bathroom facilities.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (adaptationRiskAssessedRate < 50 && totalAdaptationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct risk assessments for all bathroom adaptations — document hazards, control measures, and review dates to ensure adaptation equipment does not itself create risks for children.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (weightTestedRate < 50 && totalGrabRailRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a weight-testing programme for all grab rails — untested rails may fail under load. Establish a schedule of annual weight testing and record results.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (modificationChildConsultedRate < 50 && totalModificationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child is consulted about their bathroom modifications — voice of the child must inform adaptation decisions. Use age-appropriate consultation methods and record children's views.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with parents and others",
    });
  }

  if (modificationCarePlanRate < 50 && totalModificationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Link all bathroom modifications to individual care plans — adaptations must be recorded as part of the child's care planning to ensure continuity, review, and evidence of person-centred practice.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (nonSlipReplacementDueRate >= 30 && totalNonSlipRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace all non-slip surfaces that are overdue for replacement — establish a preventative replacement schedule to ensure surfaces are changed before they lose effectiveness.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (
    meets(adaptationAdequacyRate, 40) &&
    below(adaptationAdequacyRate, 70) &&
    totalAdaptationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve adaptation adequacy to at least 70% — review all adaptations for installation completeness, documentation, inspection status, and alignment with children's assessed needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(grabRailRate, 40) &&
    below(grabRailRate, 70) &&
    totalGrabRailRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve grab rail compliance to at least 70% — address gaps in installation, secure fixing, height positioning, and inspection across all bathroom grab rails.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(nonSlipRate, 40) &&
    below(nonSlipRate, 70) &&
    totalNonSlipRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve non-slip surface compliance to at least 70% — review installation, testing, standards compliance, and condition of all bathroom non-slip surfaces.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (
    meets(wheelchairAccessRate, 40) &&
    below(wheelchairAccessRate, 70) &&
    totalWheelchairRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve wheelchair access compliance — review doorway widths, turning circles, transfer spaces, and assessment records for all wheelchair-accessible bathrooms against current standards.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(childModificationRate, 40) &&
    below(childModificationRate, 70) &&
    totalModificationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve child modification compliance — ensure all modifications are fully installed, meeting children's needs, informed by consultation, and linked to care plans.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with parents and others",
    });
  }

  if (
    meets(satisfactionRate, 50) &&
    below(satisfactionRate, 70) &&
    satisfactionRatings.length > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review bathroom modifications with children who report lower satisfaction — identify what is not meeting their needs or preferences and co-produce improvement plans.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with parents and others",
    });
  }

  if (
    childModificationCoverage < 80 &&
    childModificationCoverage >= 50 &&
    total_children > 0 &&
    totalModificationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend bathroom modification coverage to reach all children — assess each child's bathroom accessibility needs and ensure individualised modifications are in place.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: BathroomAccessibilityInsight[] = [];

  // -- Critical insights --

  if (below(adaptationAdequacyRate, 40) && totalAdaptationRecords > 0) {
    insights.push({
      text: `Only ${adaptationAdequacyRate}% adaptation adequacy. Bathroom adaptations are failing to meet expected standards for installation, documentation, inspection, and meeting children's needs. Under Reg 25, premises must be suitable and maintained to an appropriate standard — inadequate bathroom adaptations directly compromise children's safety and dignity.`,
      severity: "critical",
    });
  }

  if (below(grabRailRate, 40) && totalGrabRailRecords > 0) {
    insights.push({
      text: `Only ${grabRailRate}% grab rail compliance. Grab rails are failing in installation, secure fixing, correct positioning, or inspection. Inadequate grab rail provision creates a significant fall risk in wet bathroom environments — this is a direct safety concern that could result in injury.`,
      severity: "critical",
    });
  }

  if (below(nonSlipRate, 40) && totalNonSlipRecords > 0) {
    insights.push({
      text: `Only ${nonSlipRate}% non-slip compliance. Non-slip surfaces are significantly below expected standards for installation, testing, and compliance. Slips and falls in bathrooms are one of the most common causes of injury in residential settings — this requires urgent remediation.`,
      severity: "critical",
    });
  }

  if (below(wheelchairAccessRate, 40) && totalWheelchairRecords > 0) {
    insights.push({
      text: `Only ${wheelchairAccessRate}% wheelchair access compliance. Children with mobility needs may not be able to safely or independently access bathroom facilities. This represents a failure in premises suitability under Reg 25 and potentially a discriminatory barrier to independence.`,
      severity: "critical",
    });
  }

  if (totalModificationRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No child-specific bathroom modification records despite children being on placement. Every child's individual bathroom needs should be assessed and recorded — the absence of any modification records suggests the home has not considered children's individual accessibility requirements.",
      severity: "critical",
    });
  }

  if (grabRailPoorConditionRate >= 30 && totalGrabRailRecords > 0) {
    insights.push({
      text: `${grabRailPoorConditionRate}% of grab rails in poor or unusable condition. Deteriorating grab rails in wet bathroom environments present an imminent fall hazard. These must be replaced or repaired before a child is injured.`,
      severity: "critical",
    });
  }

  if (nonSlipPoorConditionRate >= 30 && totalNonSlipRecords > 0) {
    insights.push({
      text: `${nonSlipPoorConditionRate}% of non-slip surfaces in poor or unusable condition. Worn or damaged non-slip surfaces provide a false sense of security — they must be replaced immediately to maintain slip prevention.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(adaptationAdequacyRate, 40) &&
    below(adaptationAdequacyRate, 70) &&
    totalAdaptationRecords > 0
  ) {
    insights.push({
      text: `Adaptation adequacy at ${adaptationAdequacyRate}% — improving but the home has not yet achieved consistent standards across all adaptation areas. Reviewing documentation, inspection, and needs-matching would strengthen compliance.`,
      severity: "warning",
    });
  }

  if (
    meets(grabRailRate, 40) &&
    below(grabRailRate, 70) &&
    totalGrabRailRecords > 0
  ) {
    insights.push({
      text: `Grab rail provision at ${grabRailRate}% — while some progress, gaps in secure fixing, correct height, or inspection mean not all grab rails provide reliable support. Systematic checking would improve safety.`,
      severity: "warning",
    });
  }

  if (
    meets(nonSlipRate, 40) &&
    below(nonSlipRate, 70) &&
    totalNonSlipRecords > 0
  ) {
    insights.push({
      text: `Non-slip compliance at ${nonSlipRate}% — inconsistent installation, testing, or standards compliance means slip prevention is not yet reliable across all bathrooms. A structured audit programme would help.`,
      severity: "warning",
    });
  }

  if (
    meets(wheelchairAccessRate, 40) &&
    below(wheelchairAccessRate, 70) &&
    totalWheelchairRecords > 0
  ) {
    insights.push({
      text: `Wheelchair access at ${wheelchairAccessRate}% — not all wheelchair-accessible bathrooms consistently meet standards. Review doorway widths, turning circles, and transfer spaces against current requirements.`,
      severity: "warning",
    });
  }

  if (
    meets(childModificationRate, 40) &&
    below(childModificationRate, 70) &&
    totalModificationRecords > 0
  ) {
    insights.push({
      text: `Child modification rate at ${childModificationRate}% — bathroom modifications exist but gaps in installation, needs matching, child consultation, or care plan integration mean the home is not yet delivering fully person-centred adaptation practice.`,
      severity: "warning",
    });
  }

  if (
    meets(satisfactionRate, 50) &&
    below(satisfactionRate, 70) &&
    satisfactionRatings.length > 0
  ) {
    insights.push({
      text: `Satisfaction at ${satisfactionRate}% — while some children are content with their bathroom modifications, moderate satisfaction suggests adaptations may not fully reflect children's preferences or needs. Review with individual children would be valuable.`,
      severity: "warning",
    });
  }

  if (
    nonSlipReplacementDueRate >= 20 &&
    nonSlipReplacementDueRate < 30 &&
    totalNonSlipRecords > 0
  ) {
    insights.push({
      text: `${nonSlipReplacementDueRate}% of non-slip surfaces due for replacement — while not yet critical, a backlog of replacements will progressively compromise slip prevention. Establish a scheduled replacement programme.`,
      severity: "warning",
    });
  }

  if (
    adaptationPoorConditionRate >= 10 &&
    adaptationPoorConditionRate < 20 &&
    totalAdaptationRecords > 0
  ) {
    insights.push({
      text: `${adaptationPoorConditionRate}% of adaptations in poor or unusable condition — some bathroom adaptations are deteriorating and will need attention before they become unsafe or non-functional.`,
      severity: "warning",
    });
  }

  if (
    modificationChildConsultedRate >= 50 &&
    modificationChildConsultedRate < 70 &&
    totalModificationRecords > 0
  ) {
    insights.push({
      text: `Child consultation rate at ${modificationChildConsultedRate}% — while some children have been consulted about their bathroom modifications, not all have had their voice heard. Strengthening consultation would improve person-centred practice.`,
      severity: "warning",
    });
  }

  if (
    modificationCarePlanRate >= 50 &&
    modificationCarePlanRate < 70 &&
    totalModificationRecords > 0
  ) {
    insights.push({
      text: `Care plan linking at ${modificationCarePlanRate}% — some bathroom modifications are not yet integrated into individual care plans. This gap means adaptations may not be reviewed or updated as children's needs change.`,
      severity: "warning",
    });
  }

  // Identify most common adaptation types
  const adaptationTypeCounts: Record<string, number> = {};
  for (const a of adaptation_records) {
    adaptationTypeCounts[a.adaptation_type] = (adaptationTypeCounts[a.adaptation_type] ?? 0) + 1;
  }
  const topAdaptationTypes = Object.entries(adaptationTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topAdaptationTypes.length > 0 && totalAdaptationRecords > 3) {
    const allTypes = [
      "height_adjustment", "doorway_widening", "bath_hoist", "level_access_shower",
      "specialist_toilet", "sensory_adaptation", "visual_aid", "temperature_control",
    ];
    const missingTypes = allTypes.filter(
      (t) => !adaptationTypeCounts[t] || adaptationTypeCounts[t] === 0,
    );
    if (missingTypes.length >= 4) {
      insights.push({
        text: `Adaptations concentrated in ${topAdaptationTypes.map(([t]) => t.replace(/_/g, " ")).join(", ")} — no recorded adaptations for ${missingTypes.slice(0, 3).map((t) => t.replace(/_/g, " ")).join(", ")}${missingTypes.length > 3 ? ` and ${missingTypes.length - 3} other types` : ""}. A broader assessment of all adaptation needs would strengthen the home's accessibility profile.`,
        severity: "warning",
      });
    }
  }

  // -- Positive insights --

  if (bath_access_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding bathroom accessibility and adaptations — adaptations are comprehensive, grab rails are secure and compliant, non-slip surfaces meet standards, wheelchair access is well-managed, and child-specific modifications are person-centred and well-maintained. This contributes positively to children's safety, dignity, and independence.",
      severity: "positive",
    });
  }

  if (
    meets(adaptationAdequacyRate, 90) &&
    adaptationConditionRate >= 90 &&
    totalAdaptationRecords > 0
  ) {
    insights.push({
      text: `${adaptationAdequacyRate}% adaptation adequacy with ${adaptationConditionRate}% in excellent or good condition — bathroom adaptations are comprehensively managed and well-maintained, evidencing a mature approach to premises accessibility.`,
      severity: "positive",
    });
  }

  if (
    meets(grabRailRate, 90) &&
    grabRailComplianceRate >= 95 &&
    totalGrabRailRecords > 0
  ) {
    insights.push({
      text: `${grabRailRate}% grab rail compliance with ${grabRailComplianceRate}% meeting safety standards — exemplary grab rail provision demonstrating rigorous attention to bathroom safety equipment.`,
      severity: "positive",
    });
  }

  if (
    meets(nonSlipRate, 90) &&
    nonSlipStandardRate >= 95 &&
    totalNonSlipRecords > 0
  ) {
    insights.push({
      text: `${nonSlipRate}% non-slip compliance with ${nonSlipStandardRate}% meeting safety standards — comprehensive and effective slip-prevention across all bathroom facilities.`,
      severity: "positive",
    });
  }

  if (
    meets(wheelchairAccessRate, 90) &&
    emergencyPullCordRate >= 90 &&
    totalWheelchairRecords > 0
  ) {
    insights.push({
      text: `${wheelchairAccessRate}% wheelchair access compliance with ${emergencyPullCordRate}% emergency pull cord provision — the home ensures wheelchair users can access bathrooms safely and independently with appropriate emergency provisions.`,
      severity: "positive",
    });
  }

  if (
    meets(childModificationRate, 90) &&
    modificationChildConsultedRate >= 90 &&
    totalModificationRecords > 0
  ) {
    insights.push({
      text: `${childModificationRate}% modification compliance with ${modificationChildConsultedRate}% informed by child consultation — bathroom modifications genuinely reflect children's views, needs, and preferences, evidencing outstanding person-centred practice.`,
      severity: "positive",
    });
  }

  if (
    meets(satisfactionRate, 90) &&
    satisfactionRatings.length > 0
  ) {
    insights.push({
      text: `${satisfactionRate}% satisfaction with bathroom modifications (avg ${avgSatisfaction}/5) — children are highly satisfied with their bathroom adaptations, demonstrating that modifications genuinely meet their needs and are delivered in a way that respects their preferences and dignity.`,
      severity: "positive",
    });
  }

  if (
    childModificationCoverage >= 100 &&
    total_children > 0 &&
    totalModificationRecords > 0
  ) {
    insights.push({
      text: "Every child has bathroom modifications assessed and in place — the home takes an equitable, inclusive approach to bathroom accessibility that ensures no child is overlooked. This is evidence of proactive, individualised premises management.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (bath_access_rating === "outstanding") {
    headline =
      "Outstanding bathroom accessibility and adaptations — adaptations are comprehensive, grab rails are compliant, non-slip surfaces meet standards, wheelchair access is well-managed, and child-specific modifications are person-centred.";
  } else if (bath_access_rating === "good") {
    headline = `Good bathroom accessibility and adaptations — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (bath_access_rating === "adequate") {
    headline = `Adequate bathroom accessibility and adaptations — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure safe, accessible, and individually adapted bathroom facilities.`;
  } else {
    headline = `Bathroom accessibility and adaptations are inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve bathroom safety, accessibility, and child-specific adaptations.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    bath_access_rating,
    bath_access_score: score,
    headline,
    total_adaptation_records: totalAdaptationRecords,
    total_grab_rail_records: totalGrabRailRecords,
    total_non_slip_records: totalNonSlipRecords,
    total_wheelchair_records: totalWheelchairRecords,
    total_modification_records: totalModificationRecords,
    adaptation_adequacy_rate: adaptationAdequacyRate,
    grab_rail_rate: grabRailRate,
    non_slip_rate: nonSlipRate,
    wheelchair_access_rate: wheelchairAccessRate,
    child_modification_rate: childModificationRate,
    satisfaction_rate: satisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
