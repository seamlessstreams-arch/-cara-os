// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME GARDEN & OUTDOOR SPACE MAINTENANCE INTELLIGENCE ENGINE
// Monitors garden and outdoor space quality — garden condition assessments,
// outdoor play equipment safety checks, space utilisation rates, child
// involvement in gardening, and environmental quality.
// Measures garden condition, equipment safety, space utilisation, child
// involvement, environmental quality, and child enjoyment.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises), Reg 5 (Engaging, activities & relationships).
// SCCIF: "Safety and well-being", "Experiences and progress".
// Store keys: gardenConditionRecords, equipmentSafetyRecords,
//             spaceUtilisationRecords, childInvolvementRecords,
//             environmentalQualityRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface GardenConditionRecordInput {
  id: string;
  date: string;
  assessor: string;
  area_name: string;
  area_type: "lawn" | "flower_bed" | "vegetable_patch" | "path" | "patio" | "fence" | "shed" | "greenhouse" | "pond" | "other";
  condition_rating: number; // 1-5
  cleanliness_rating: number; // 1-5
  safety_hazards_found: boolean;
  hazards_description: string;
  hazards_resolved: boolean;
  maintenance_required: boolean;
  maintenance_description: string;
  maintenance_completed: boolean;
  seasonal_tasks_completed: boolean;
  pest_issues_found: boolean;
  pest_issues_resolved: boolean;
  accessibility_adequate: boolean;
  photos_taken: boolean;
  notes: string;
  created_at: string;
}

export interface EquipmentSafetyRecordInput {
  id: string;
  date: string;
  inspector: string;
  equipment_name: string;
  equipment_type: "swing" | "slide" | "climbing_frame" | "trampoline" | "sandpit" | "water_feature" | "goal_post" | "bike_rack" | "bench" | "table" | "fence_gate" | "lighting" | "other";
  condition_rating: number; // 1-5
  safety_compliant: boolean;
  defects_found: boolean;
  defects_description: string;
  defects_resolved: boolean;
  out_of_service: boolean;
  last_professional_inspection: string | null;
  age_appropriate: boolean;
  surface_condition_safe: boolean;
  anchoring_secure: boolean;
  wear_and_tear_acceptable: boolean;
  manufacturer_guidelines_followed: boolean;
  notes: string;
  created_at: string;
}

export interface SpaceUtilisationRecordInput {
  id: string;
  date: string;
  recorder: string;
  space_name: string;
  space_type: "garden" | "playground" | "sports_area" | "quiet_area" | "growing_area" | "sensory_garden" | "wildlife_area" | "social_area" | "other";
  children_using: number;
  total_children_available: number;
  duration_minutes: number;
  activity_type: "free_play" | "organised_activity" | "gardening" | "sport" | "relaxation" | "learning" | "social" | "other";
  weather_suitable: boolean;
  staff_supervised: boolean;
  child_initiated: boolean;
  inclusive_access: boolean;
  enjoyment_observed: boolean;
  notes: string;
  created_at: string;
}

export interface ChildInvolvementRecordInput {
  id: string;
  child_id: string;
  date: string;
  activity_type: "planting" | "weeding" | "watering" | "harvesting" | "composting" | "wildlife_care" | "garden_design" | "maintenance" | "cooking_produce" | "nature_study" | "other";
  duration_minutes: number;
  engaged: boolean;
  enjoyment_level: number; // 1-5
  skills_developed: string[];
  responsibility_taken: boolean;
  therapeutic_benefit_noted: boolean;
  produce_harvested: boolean;
  child_chose_activity: boolean;
  supported_by_staff: boolean;
  linked_to_care_plan: boolean;
  notes: string;
  created_at: string;
}

export interface EnvironmentalQualityRecordInput {
  id: string;
  date: string;
  assessor: string;
  category: "air_quality" | "noise_level" | "light_level" | "biodiversity" | "water_quality" | "soil_quality" | "aesthetics" | "privacy" | "other";
  rating: number; // 1-5
  meets_standard: boolean;
  improvement_needed: boolean;
  improvement_description: string;
  improvement_completed: boolean;
  children_consulted: boolean;
  sensory_benefit: boolean;
  wildlife_observed: boolean;
  seasonal_variation_noted: boolean;
  external_factors_noted: string;
  notes: string;
  created_at: string;
}

export interface GardenOutdoorInput {
  today: string;
  total_children: number;
  garden_condition_records: GardenConditionRecordInput[];
  equipment_safety_records: EquipmentSafetyRecordInput[];
  space_utilisation_records: SpaceUtilisationRecordInput[];
  child_involvement_records: ChildInvolvementRecordInput[];
  environmental_quality_records: EnvironmentalQualityRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type GardenOutdoorRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface GardenOutdoorInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface GardenOutdoorRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface GardenOutdoorResult {
  garden_rating: GardenOutdoorRating;
  garden_score: number;
  headline: string;
  total_garden_condition_records: number;
  total_equipment_safety_records: number;
  total_space_utilisation_records: number;
  total_child_involvement_records: number;
  total_environmental_quality_records: number;
  garden_condition_rate: number;
  equipment_safety_rate: number;
  space_utilisation_rate: number;
  child_involvement_rate: number;
  environmental_quality_rate: number;
  child_enjoyment_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: GardenOutdoorRecommendation[];
  insights: GardenOutdoorInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): GardenOutdoorRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: GardenOutdoorRating,
  score: number,
  headline: string,
): GardenOutdoorResult {
  return {
    garden_rating: rating,
    garden_score: score,
    headline,
    total_garden_condition_records: 0,
    total_equipment_safety_records: 0,
    total_space_utilisation_records: 0,
    total_child_involvement_records: 0,
    total_environmental_quality_records: 0,
    garden_condition_rate: 0,
    equipment_safety_rate: 0,
    space_utilisation_rate: 0,
    child_involvement_rate: 0,
    environmental_quality_rate: 0,
    child_enjoyment_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeGardenOutdoorSpaceMaintenance(
  input: GardenOutdoorInput,
): GardenOutdoorResult {
  const {
    total_children,
    garden_condition_records,
    equipment_safety_records,
    space_utilisation_records,
    child_involvement_records,
    environmental_quality_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    garden_condition_records.length === 0 &&
    equipment_safety_records.length === 0 &&
    space_utilisation_records.length === 0 &&
    child_involvement_records.length === 0 &&
    environmental_quality_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess garden and outdoor space maintenance.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No garden or outdoor space maintenance data recorded despite children on placement — garden condition, equipment safety, and outdoor engagement require urgent attention.",
      ),
      concerns: [
        "No garden condition assessments, equipment safety checks, space utilisation records, child involvement records, or environmental quality assessments exist despite children being on placement — the home cannot evidence safe, maintained outdoor spaces or children's engagement with nature.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of garden condition assessments, outdoor play equipment safety checks, space utilisation, child involvement in gardening, and environmental quality monitoring to evidence safe, well-maintained outdoor spaces that support children's development.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Develop a garden and outdoor activities programme that engages children in gardening, outdoor play, and environmental learning as part of their daily experience, wellbeing, and personal development.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities and relationships",
        },
      ],
      insights: [
        {
          text: "The complete absence of garden and outdoor space maintenance records means the home cannot demonstrate safe outdoor premises, regular equipment safety checks, or children's engagement with outdoor spaces. This represents a gap in premises safety and children's experiences.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Garden condition metrics ---
  const totalGardenConditionRecords = garden_condition_records.length;

  const goodConditionCount = garden_condition_records.filter(
    (g) => g.condition_rating >= 4,
  ).length;
  const gardenConditionRate = pct(goodConditionCount, totalGardenConditionRecords);

  const goodCleanlinessCount = garden_condition_records.filter(
    (g) => g.cleanliness_rating >= 4,
  ).length;
  const cleanlinessRate = pct(goodCleanlinessCount, totalGardenConditionRecords);

  const hazardsFoundCount = garden_condition_records.filter(
    (g) => g.safety_hazards_found,
  ).length;
  const hazardRate = pct(hazardsFoundCount, totalGardenConditionRecords);

  const hazardsResolvedCount = garden_condition_records.filter(
    (g) => g.safety_hazards_found && g.hazards_resolved,
  ).length;
  const hazardResolutionRate = pct(hazardsResolvedCount, hazardsFoundCount);

  const maintenanceRequiredCount = garden_condition_records.filter(
    (g) => g.maintenance_required,
  ).length;
  const maintenanceCompletedCount = garden_condition_records.filter(
    (g) => g.maintenance_required && g.maintenance_completed,
  ).length;
  const maintenanceCompletionRate = pct(maintenanceCompletedCount, maintenanceRequiredCount);

  const seasonalTasksCompletedCount = garden_condition_records.filter(
    (g) => g.seasonal_tasks_completed,
  ).length;
  const seasonalTaskRate = pct(seasonalTasksCompletedCount, totalGardenConditionRecords);

  const pestIssuesCount = garden_condition_records.filter(
    (g) => g.pest_issues_found,
  ).length;
  const pestResolvedCount = garden_condition_records.filter(
    (g) => g.pest_issues_found && g.pest_issues_resolved,
  ).length;
  const pestResolutionRate = pct(pestResolvedCount, pestIssuesCount);

  const accessibilityAdequateCount = garden_condition_records.filter(
    (g) => g.accessibility_adequate,
  ).length;
  const accessibilityRate = pct(accessibilityAdequateCount, totalGardenConditionRecords);

  const photosCount = garden_condition_records.filter(
    (g) => g.photos_taken,
  ).length;
  const photosRate = pct(photosCount, totalGardenConditionRecords);

  const avgConditionRating =
    totalGardenConditionRecords > 0
      ? Math.round(
          (garden_condition_records.reduce((sum, g) => sum + g.condition_rating, 0) /
            totalGardenConditionRecords) *
            100,
        ) / 100
      : 0;

  const avgCleanlinessRating =
    totalGardenConditionRecords > 0
      ? Math.round(
          (garden_condition_records.reduce((sum, g) => sum + g.cleanliness_rating, 0) /
            totalGardenConditionRecords) *
            100,
        ) / 100
      : 0;

  // --- Equipment safety metrics ---
  const totalEquipmentSafetyRecords = equipment_safety_records.length;

  const safetyCompliantCount = equipment_safety_records.filter(
    (e) => e.safety_compliant,
  ).length;
  const equipmentSafetyRate = pct(safetyCompliantCount, totalEquipmentSafetyRecords);

  const defectsFoundCount = equipment_safety_records.filter(
    (e) => e.defects_found,
  ).length;
  const defectRate = pct(defectsFoundCount, totalEquipmentSafetyRecords);

  const defectsResolvedCount = equipment_safety_records.filter(
    (e) => e.defects_found && e.defects_resolved,
  ).length;
  const defectResolutionRate = pct(defectsResolvedCount, defectsFoundCount);

  const outOfServiceCount = equipment_safety_records.filter(
    (e) => e.out_of_service,
  ).length;
  const outOfServiceRate = pct(outOfServiceCount, totalEquipmentSafetyRecords);

  const ageAppropriateCount = equipment_safety_records.filter(
    (e) => e.age_appropriate,
  ).length;
  const ageAppropriateRate = pct(ageAppropriateCount, totalEquipmentSafetyRecords);

  const surfaceSafeCount = equipment_safety_records.filter(
    (e) => e.surface_condition_safe,
  ).length;
  const surfaceSafeRate = pct(surfaceSafeCount, totalEquipmentSafetyRecords);

  const anchoringSecureCount = equipment_safety_records.filter(
    (e) => e.anchoring_secure,
  ).length;
  const anchoringSecureRate = pct(anchoringSecureCount, totalEquipmentSafetyRecords);

  const wearAcceptableCount = equipment_safety_records.filter(
    (e) => e.wear_and_tear_acceptable,
  ).length;
  const wearAcceptableRate = pct(wearAcceptableCount, totalEquipmentSafetyRecords);

  const guidelinesFollowedCount = equipment_safety_records.filter(
    (e) => e.manufacturer_guidelines_followed,
  ).length;
  const guidelinesFollowedRate = pct(guidelinesFollowedCount, totalEquipmentSafetyRecords);

  const goodEquipmentConditionCount = equipment_safety_records.filter(
    (e) => e.condition_rating >= 4,
  ).length;
  const equipmentConditionRate = pct(goodEquipmentConditionCount, totalEquipmentSafetyRecords);

  const hasProfessionalInspection = equipment_safety_records.filter(
    (e) => e.last_professional_inspection !== null && e.last_professional_inspection !== "",
  ).length;
  const professionalInspectionRate = pct(hasProfessionalInspection, totalEquipmentSafetyRecords);

  // --- Space utilisation metrics ---
  const totalSpaceUtilisationRecords = space_utilisation_records.length;

  const totalChildrenUsing = space_utilisation_records.reduce(
    (sum, s) => sum + s.children_using,
    0,
  );
  const totalChildrenAvailable = space_utilisation_records.reduce(
    (sum, s) => sum + s.total_children_available,
    0,
  );
  const spaceUtilisationRate = pct(totalChildrenUsing, totalChildrenAvailable);

  const staffSupervisedCount = space_utilisation_records.filter(
    (s) => s.staff_supervised,
  ).length;
  const staffSupervisionRate = pct(staffSupervisedCount, totalSpaceUtilisationRecords);

  const childInitiatedCount = space_utilisation_records.filter(
    (s) => s.child_initiated,
  ).length;
  const childInitiatedRate = pct(childInitiatedCount, totalSpaceUtilisationRecords);

  const inclusiveAccessCount = space_utilisation_records.filter(
    (s) => s.inclusive_access,
  ).length;
  const inclusiveAccessRate = pct(inclusiveAccessCount, totalSpaceUtilisationRecords);

  const enjoymentObservedCount = space_utilisation_records.filter(
    (s) => s.enjoyment_observed,
  ).length;
  const enjoymentObservedRate = pct(enjoymentObservedCount, totalSpaceUtilisationRecords);

  const weatherSuitableCount = space_utilisation_records.filter(
    (s) => s.weather_suitable,
  ).length;
  const weatherSuitableRate = pct(weatherSuitableCount, totalSpaceUtilisationRecords);

  // Count unique space types used
  const uniqueSpaceTypes = new Set(
    space_utilisation_records.map((s) => s.space_type),
  ).size;

  // Count unique activity types
  const uniqueActivityTypes = new Set(
    space_utilisation_records.map((s) => s.activity_type),
  ).size;

  const avgDuration =
    totalSpaceUtilisationRecords > 0
      ? Math.round(
          space_utilisation_records.reduce((sum, s) => sum + s.duration_minutes, 0) /
            totalSpaceUtilisationRecords,
        )
      : 0;

  // --- Child involvement metrics ---
  const totalChildInvolvementRecords = child_involvement_records.length;

  const engagedInvolvementCount = child_involvement_records.filter(
    (c) => c.engaged,
  ).length;
  const childInvolvementRate = pct(engagedInvolvementCount, totalChildInvolvementRecords);

  const uniqueChildrenInvolved = new Set(
    child_involvement_records.filter((c) => c.engaged).map((c) => c.child_id),
  ).size;
  const childCoverage = total_children > 0 ? pct(uniqueChildrenInvolved, total_children) : 0;

  const responsibilityTakenCount = child_involvement_records.filter(
    (c) => c.responsibility_taken,
  ).length;
  const responsibilityRate = pct(responsibilityTakenCount, totalChildInvolvementRecords);

  const therapeuticBenefitCount = child_involvement_records.filter(
    (c) => c.therapeutic_benefit_noted,
  ).length;
  const therapeuticBenefitRate = pct(therapeuticBenefitCount, totalChildInvolvementRecords);

  const produceHarvestedCount = child_involvement_records.filter(
    (c) => c.produce_harvested,
  ).length;
  const produceHarvestedRate = pct(produceHarvestedCount, totalChildInvolvementRecords);

  const childChoseCount = child_involvement_records.filter(
    (c) => c.child_chose_activity,
  ).length;
  const childChoiceRate = pct(childChoseCount, totalChildInvolvementRecords);

  const staffSupportedCount = child_involvement_records.filter(
    (c) => c.supported_by_staff,
  ).length;
  const staffSupportRate = pct(staffSupportedCount, totalChildInvolvementRecords);

  const linkedToCarePlanCount = child_involvement_records.filter(
    (c) => c.linked_to_care_plan,
  ).length;
  const carePlanLinkRate = pct(linkedToCarePlanCount, totalChildInvolvementRecords);

  const avgEnjoymentLevel =
    totalChildInvolvementRecords > 0
      ? Math.round(
          (child_involvement_records.reduce((sum, c) => sum + c.enjoyment_level, 0) /
            totalChildInvolvementRecords) *
            100,
        ) / 100
      : 0;

  // Count unique activity types in child involvement
  const uniqueInvolvementActivities = new Set(
    child_involvement_records.map((c) => c.activity_type),
  ).size;

  // Skills developed count
  const totalSkillsDeveloped = child_involvement_records.reduce(
    (sum, c) => sum + (c.skills_developed?.length ?? 0),
    0,
  );

  // --- Environmental quality metrics ---
  const totalEnvironmentalQualityRecords = environmental_quality_records.length;

  const meetsStandardCount = environmental_quality_records.filter(
    (e) => e.meets_standard,
  ).length;
  const environmentalQualityRate = pct(meetsStandardCount, totalEnvironmentalQualityRecords);

  const improvementNeededCount = environmental_quality_records.filter(
    (e) => e.improvement_needed,
  ).length;
  const improvementCompletedCount = environmental_quality_records.filter(
    (e) => e.improvement_needed && e.improvement_completed,
  ).length;
  const improvementCompletionRate = pct(improvementCompletedCount, improvementNeededCount);

  const childrenConsultedCount = environmental_quality_records.filter(
    (e) => e.children_consulted,
  ).length;
  const childrenConsultedRate = pct(childrenConsultedCount, totalEnvironmentalQualityRecords);

  const sensoryBenefitCount = environmental_quality_records.filter(
    (e) => e.sensory_benefit,
  ).length;
  const sensoryBenefitRate = pct(sensoryBenefitCount, totalEnvironmentalQualityRecords);

  const wildlifeObservedCount = environmental_quality_records.filter(
    (e) => e.wildlife_observed,
  ).length;
  const wildlifeRate = pct(wildlifeObservedCount, totalEnvironmentalQualityRecords);

  const avgEnvironmentalRating =
    totalEnvironmentalQualityRecords > 0
      ? Math.round(
          (environmental_quality_records.reduce((sum, e) => sum + e.rating, 0) /
            totalEnvironmentalQualityRecords) *
            100,
        ) / 100
      : 0;

  // Count unique environmental categories assessed
  const uniqueEnvCategories = new Set(
    environmental_quality_records.map((e) => e.category),
  ).size;

  // --- Child enjoyment composite ---
  // Composite of enjoyment observed in spaces + child enjoyment level in involvement + child choice
  const childEnjoymentNumerators: number[] = [];
  const childEnjoymentDenominators: number[] = [];

  if (totalSpaceUtilisationRecords > 0) {
    childEnjoymentNumerators.push(enjoymentObservedCount);
    childEnjoymentDenominators.push(totalSpaceUtilisationRecords);
  }
  if (totalChildInvolvementRecords > 0) {
    const highEnjoyment = child_involvement_records.filter(
      (c) => c.enjoyment_level >= 4,
    ).length;
    childEnjoymentNumerators.push(highEnjoyment);
    childEnjoymentDenominators.push(totalChildInvolvementRecords);
  }
  if (totalChildInvolvementRecords > 0) {
    childEnjoymentNumerators.push(childChoseCount);
    childEnjoymentDenominators.push(totalChildInvolvementRecords);
  }

  const totalEnjoymentNum = childEnjoymentNumerators.reduce((a, b) => a + b, 0);
  const totalEnjoymentDenom = childEnjoymentDenominators.reduce((a, b) => a + b, 0);
  const childEnjoymentRate = pct(totalEnjoymentNum, totalEnjoymentDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: gardenConditionRate (>=90: +4, >=70: +2) ---
  if (gardenConditionRate >= 90) score += 4;
  else if (gardenConditionRate >= 70) score += 2;

  // --- Bonus 2: equipmentSafetyRate (>=95: +5, >=80: +3) ---
  if (equipmentSafetyRate >= 95) score += 5;
  else if (equipmentSafetyRate >= 80) score += 3;

  // --- Bonus 3: spaceUtilisationRate (>=80: +3, >=60: +1) ---
  if (spaceUtilisationRate >= 80) score += 3;
  else if (spaceUtilisationRate >= 60) score += 1;

  // --- Bonus 4: childInvolvementRate (>=90: +3, >=70: +1) ---
  if (childInvolvementRate >= 90) score += 3;
  else if (childInvolvementRate >= 70) score += 1;

  // --- Bonus 5: environmentalQualityRate (>=90: +3, >=70: +1) ---
  if (environmentalQualityRate >= 90) score += 3;
  else if (environmentalQualityRate >= 70) score += 1;

  // --- Bonus 6: childEnjoymentRate (>=90: +3, >=70: +1) ---
  if (childEnjoymentRate >= 90) score += 3;
  else if (childEnjoymentRate >= 70) score += 1;

  // --- Bonus 7: hazardResolutionRate (>=95: +3, >=80: +1) ---
  if (hazardResolutionRate >= 95 && hazardsFoundCount > 0) score += 3;
  else if (hazardResolutionRate >= 80 && hazardsFoundCount > 0) score += 1;

  // --- Bonus 8: defectResolutionRate (>=95: +2, >=80: +1) ---
  if (defectResolutionRate >= 95 && defectsFoundCount > 0) score += 2;
  else if (defectResolutionRate >= 80 && defectsFoundCount > 0) score += 1;

  // --- Bonus 9: avgEnjoymentLevel (>=4.0: +2, >=3.0: +1) ---
  if (avgEnjoymentLevel >= 4.0 && totalChildInvolvementRecords > 0) score += 2;
  else if (avgEnjoymentLevel >= 3.0 && totalChildInvolvementRecords > 0) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // equipmentSafetyRate < 50 → -6 (guarded)
  if (equipmentSafetyRate < 50 && equipment_safety_records.length > 0) score -= 6;

  // gardenConditionRate < 40 → -5 (guarded)
  if (gardenConditionRate < 40 && garden_condition_records.length > 0) score -= 5;

  // childInvolvementRate < 30 → -4 (guarded)
  if (childInvolvementRate < 30 && child_involvement_records.length > 0) score -= 4;

  // environmentalQualityRate < 40 → -3 (guarded)
  if (environmentalQualityRate < 40 && environmental_quality_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const garden_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (gardenConditionRate >= 90 && totalGardenConditionRecords > 0) {
    strengths.push(
      `${gardenConditionRate}% of garden areas in good or excellent condition — the home maintains high-quality outdoor spaces that provide a positive living environment for children.`,
    );
  } else if (gardenConditionRate >= 70 && totalGardenConditionRecords > 0) {
    strengths.push(
      `${gardenConditionRate}% garden condition rate — the home generally maintains its outdoor spaces to a good standard, supporting children's access to quality outside areas.`,
    );
  }

  if (equipmentSafetyRate >= 95 && totalEquipmentSafetyRecords > 0) {
    strengths.push(
      `${equipmentSafetyRate}% equipment safety compliance — outdoor play equipment is consistently maintained to safety standards, ensuring children can play safely.`,
    );
  } else if (equipmentSafetyRate >= 80 && totalEquipmentSafetyRecords > 0) {
    strengths.push(
      `${equipmentSafetyRate}% equipment safety compliance rate — the home demonstrates strong commitment to outdoor play equipment safety through regular checking and maintenance.`,
    );
  }

  if (spaceUtilisationRate >= 80 && totalSpaceUtilisationRecords > 0) {
    strengths.push(
      `${spaceUtilisationRate}% outdoor space utilisation — children are actively using the home's outdoor spaces, indicating well-designed, accessible, and inviting environments.`,
    );
  } else if (spaceUtilisationRate >= 60 && totalSpaceUtilisationRecords > 0) {
    strengths.push(
      `${spaceUtilisationRate}% space utilisation rate — outdoor spaces are being used regularly by children, demonstrating good access and encouragement of outdoor activity.`,
    );
  }

  if (childInvolvementRate >= 90 && totalChildInvolvementRecords > 0) {
    strengths.push(
      `${childInvolvementRate}% child engagement in garden activities — children are enthusiastically involved in gardening, developing practical skills, responsibility, and connection with nature.`,
    );
  } else if (childInvolvementRate >= 70 && totalChildInvolvementRecords > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in gardening activities — good levels of children's engagement with growing, nature, and outdoor responsibilities.`,
    );
  }

  if (environmentalQualityRate >= 90 && totalEnvironmentalQualityRecords > 0) {
    strengths.push(
      `${environmentalQualityRate}% of environmental quality assessments meet standards — the home provides excellent outdoor environmental quality supporting children's wellbeing and sensory experiences.`,
    );
  } else if (environmentalQualityRate >= 70 && totalEnvironmentalQualityRecords > 0) {
    strengths.push(
      `${environmentalQualityRate}% environmental quality rate — the outdoor environment generally meets quality standards, providing a positive space for children.`,
    );
  }

  if (childEnjoymentRate >= 90 && totalEnjoymentDenom > 0) {
    strengths.push(
      `${childEnjoymentRate}% child enjoyment across outdoor activities — children genuinely enjoy their time in the garden and outdoor spaces, indicating these areas are meeting their needs and interests.`,
    );
  } else if (childEnjoymentRate >= 70 && totalEnjoymentDenom > 0) {
    strengths.push(
      `${childEnjoymentRate}% child enjoyment rate in outdoor activities — most children show positive responses to garden and outdoor experiences.`,
    );
  }

  if (hazardResolutionRate >= 95 && hazardsFoundCount > 0) {
    strengths.push(
      `${hazardResolutionRate}% of garden safety hazards resolved — the home responds effectively to identified risks, maintaining safe outdoor spaces for children.`,
    );
  } else if (hazardResolutionRate >= 80 && hazardsFoundCount > 0) {
    strengths.push(
      `${hazardResolutionRate}% hazard resolution rate — the home generally addresses identified garden safety hazards promptly.`,
    );
  }

  if (defectResolutionRate >= 95 && defectsFoundCount > 0) {
    strengths.push(
      `${defectResolutionRate}% of equipment defects resolved — identified equipment issues are being addressed promptly, maintaining safe play environments.`,
    );
  } else if (defectResolutionRate >= 80 && defectsFoundCount > 0) {
    strengths.push(
      `${defectResolutionRate}% equipment defect resolution — most identified equipment issues are addressed, supporting ongoing safety.`,
    );
  }

  if (maintenanceCompletionRate >= 90 && maintenanceRequiredCount > 0) {
    strengths.push(
      `${maintenanceCompletionRate}% of required garden maintenance completed — the home follows through on maintenance tasks to keep outdoor spaces in good order.`,
    );
  } else if (maintenanceCompletionRate >= 70 && maintenanceRequiredCount > 0) {
    strengths.push(
      `${maintenanceCompletionRate}% maintenance completion rate — the home generally completes required garden maintenance tasks.`,
    );
  }

  if (avgEnjoymentLevel >= 4.0 && totalChildInvolvementRecords > 0) {
    strengths.push(
      `Children's enjoyment level averaging ${avgEnjoymentLevel}/5 in garden activities — gardening provides genuine pleasure and therapeutic benefit, contributing positively to children's wellbeing.`,
    );
  } else if (avgEnjoymentLevel >= 3.0 && totalChildInvolvementRecords > 0) {
    strengths.push(
      `Children's enjoyment level averaging ${avgEnjoymentLevel}/5 — garden activities are generally enjoyable experiences for the children.`,
    );
  }

  if (childCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has been involved in garden activities — outdoor engagement is embedded in the home's approach to children's development and daily life.",
    );
  } else if (childCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${childCoverage}% of children have participated in garden activities — strong coverage ensuring most children benefit from outdoor engagement and nature-based experiences.`,
    );
  }

  if (therapeuticBenefitRate >= 70 && totalChildInvolvementRecords > 0) {
    strengths.push(
      `Therapeutic benefit noted in ${therapeuticBenefitRate}% of garden activities — outdoor engagement is contributing meaningfully to children's emotional wellbeing and regulation.`,
    );
  }

  if (inclusiveAccessRate >= 90 && totalSpaceUtilisationRecords > 0) {
    strengths.push(
      `${inclusiveAccessRate}% inclusive access across outdoor spaces — the home ensures outdoor areas are accessible to all children regardless of ability or need.`,
    );
  }

  if (wildlifeRate >= 70 && totalEnvironmentalQualityRecords > 0) {
    strengths.push(
      `Wildlife observed in ${wildlifeRate}% of environmental quality assessments — the garden supports biodiversity, providing children with direct experiences of nature and wildlife.`,
    );
  }

  if (produceHarvestedRate >= 50 && totalChildInvolvementRecords > 0) {
    strengths.push(
      `Produce harvested in ${produceHarvestedRate}% of garden activities — children experience the full cycle of growing, from planting to harvest, developing practical life skills.`,
    );
  }

  if (carePlanLinkRate >= 60 && totalChildInvolvementRecords > 0) {
    strengths.push(
      `${carePlanLinkRate}% of garden activities linked to care plans — outdoor engagement is purposefully connected to individual children's developmental goals.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (equipmentSafetyRate < 50 && totalEquipmentSafetyRecords > 0) {
    concerns.push(
      `Only ${equipmentSafetyRate}% equipment safety compliance — the majority of outdoor play equipment does not meet safety standards, posing an unacceptable risk to children's physical safety.`,
    );
  } else if (equipmentSafetyRate < 80 && equipmentSafetyRate >= 50 && totalEquipmentSafetyRecords > 0) {
    concerns.push(
      `Equipment safety compliance at ${equipmentSafetyRate}% — not all outdoor play equipment meets safety requirements, creating potential risks for children during outdoor play.`,
    );
  }

  if (gardenConditionRate < 40 && totalGardenConditionRecords > 0) {
    concerns.push(
      `Only ${gardenConditionRate}% of garden areas in good condition — outdoor spaces are poorly maintained, failing to provide children with a quality living environment and safe outdoor access.`,
    );
  } else if (gardenConditionRate < 70 && gardenConditionRate >= 40 && totalGardenConditionRecords > 0) {
    concerns.push(
      `Garden condition rate at ${gardenConditionRate}% — outdoor spaces are not consistently maintained to a good standard, affecting children's experience of their living environment.`,
    );
  }

  if (childInvolvementRate < 30 && totalChildInvolvementRecords > 0) {
    concerns.push(
      `Only ${childInvolvementRate}% child engagement in garden activities — children are not meaningfully involved in gardening, missing valuable opportunities for skill development, therapeutic benefit, and connection with nature.`,
    );
  } else if (childInvolvementRate < 70 && childInvolvementRate >= 30 && totalChildInvolvementRecords > 0) {
    concerns.push(
      `Child involvement in garden activities at ${childInvolvementRate}% — not all children are engaging with outdoor gardening activities, suggesting barriers to participation.`,
    );
  }

  if (environmentalQualityRate < 40 && totalEnvironmentalQualityRecords > 0) {
    concerns.push(
      `Only ${environmentalQualityRate}% of environmental quality assessments meet standards — the outdoor environment falls below expected quality, potentially affecting children's wellbeing and enjoyment of outdoor spaces.`,
    );
  } else if (environmentalQualityRate < 70 && environmentalQualityRate >= 40 && totalEnvironmentalQualityRecords > 0) {
    concerns.push(
      `Environmental quality rate at ${environmentalQualityRate}% — the outdoor environment does not consistently meet quality standards across all assessment areas.`,
    );
  }

  if (spaceUtilisationRate < 40 && totalSpaceUtilisationRecords > 0) {
    concerns.push(
      `Only ${spaceUtilisationRate}% outdoor space utilisation — the garden and outdoor areas are significantly underused, suggesting they may be inaccessible, uninviting, or not promoted to children.`,
    );
  } else if (spaceUtilisationRate < 60 && spaceUtilisationRate >= 40 && totalSpaceUtilisationRecords > 0) {
    concerns.push(
      `Space utilisation at ${spaceUtilisationRate}% — outdoor spaces are not being fully used by children, indicating potential barriers to access or engagement.`,
    );
  }

  if (childEnjoymentRate < 40 && totalEnjoymentDenom > 0) {
    concerns.push(
      `Only ${childEnjoymentRate}% child enjoyment in outdoor activities — children are not finding outdoor experiences enjoyable, which may indicate the spaces or activities do not meet their interests or needs.`,
    );
  } else if (childEnjoymentRate < 70 && childEnjoymentRate >= 40 && totalEnjoymentDenom > 0) {
    concerns.push(
      `Child enjoyment in outdoor activities at ${childEnjoymentRate}% — not all children are experiencing positive outdoor encounters, suggesting scope for improvement.`,
    );
  }

  if (hazardResolutionRate < 70 && hazardsFoundCount > 0) {
    concerns.push(
      `Only ${hazardResolutionRate}% of identified garden hazards resolved — unresolved safety hazards in outdoor spaces present ongoing risks to children's physical safety.`,
    );
  }

  if (defectResolutionRate < 70 && defectsFoundCount > 0) {
    concerns.push(
      `Only ${defectResolutionRate}% of equipment defects resolved — unresolved defects in outdoor play equipment are a safeguarding concern that must be addressed urgently.`,
    );
  }

  if (maintenanceCompletionRate < 50 && maintenanceRequiredCount > 0) {
    concerns.push(
      `Only ${maintenanceCompletionRate}% of required garden maintenance completed — incomplete maintenance means outdoor spaces deteriorate, affecting children's living environment.`,
    );
  } else if (maintenanceCompletionRate < 70 && maintenanceCompletionRate >= 50 && maintenanceRequiredCount > 0) {
    concerns.push(
      `Garden maintenance completion at ${maintenanceCompletionRate}% — some required maintenance is not being completed, risking gradual deterioration of outdoor spaces.`,
    );
  }

  if (anchoringSecureRate < 80 && totalEquipmentSafetyRecords > 0) {
    concerns.push(
      `Only ${anchoringSecureRate}% of equipment anchoring assessed as secure — insecure anchoring of play equipment presents a serious safety risk.`,
    );
  }

  if (childCoverage < 50 && total_children > 0 && totalChildInvolvementRecords > 0) {
    concerns.push(
      `Only ${childCoverage}% of children have been involved in garden activities — many children are missing out on the developmental and therapeutic benefits of outdoor engagement.`,
    );
  }

  if (staffSupervisionRate < 70 && totalSpaceUtilisationRecords > 0) {
    concerns.push(
      `Staff supervision of outdoor spaces at only ${staffSupervisionRate}% — insufficient supervision during outdoor play may compromise children's safety.`,
    );
  }

  if (professionalInspectionRate < 50 && totalEquipmentSafetyRecords > 0) {
    concerns.push(
      `Only ${professionalInspectionRate}% of equipment has a recorded professional inspection — without regular professional safety inspections, the home cannot fully evidence equipment safety compliance.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: GardenOutdoorRecommendation[] = [];
  let rank = 0;

  if (equipmentSafetyRate < 50 && totalEquipmentSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all outdoor play equipment — remove or isolate any non-compliant items immediately, arrange professional safety inspections, and implement a structured equipment maintenance schedule to ensure all play equipment meets safety standards before children use it.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (defectResolutionRate < 70 && defectsFoundCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address all outstanding equipment defects immediately — where defects cannot be repaired promptly, equipment must be taken out of service and clearly marked as unavailable until repairs are completed and verified safe.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (hazardResolutionRate < 70 && hazardsFoundCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Resolve all outstanding garden safety hazards urgently — unresolved hazards in outdoor spaces present direct risks to children's physical safety and must be addressed or the affected areas made inaccessible until rectified.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (gardenConditionRate < 40 && totalGardenConditionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and implement a comprehensive garden improvement plan — prioritise areas requiring immediate attention, schedule regular maintenance, and consider professional landscaping support to bring outdoor spaces to an acceptable standard for a children's home.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (surfaceSafeRate < 70 && totalEquipmentSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assess and improve all play surface conditions — ensure impact-absorbing surfaces meet BS EN 1177 standards around all play equipment to reduce injury risk from falls.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (anchoringSecureRate < 80 && totalEquipmentSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Inspect and secure all equipment anchoring points — loose or insecure equipment fixings pose a serious risk of collapse or tipping and must be rectified before continued use.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (childInvolvementRate < 30 && totalChildInvolvementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop strategies to increase children's engagement in garden activities — explore barriers to involvement, create age-appropriate and interest-led gardening opportunities, and consider therapeutic horticulture approaches for children who may benefit from structured outdoor engagement.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities and relationships",
    });
  }

  if (environmentalQualityRate < 40 && totalEnvironmentalQualityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve outdoor environmental quality — assess air quality, noise levels, biodiversity, privacy, and aesthetics to ensure the garden provides a positive, health-promoting environment for children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (staffSupervisionRate < 70 && totalSpaceUtilisationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure adequate staff supervision during outdoor activities — review staffing arrangements to guarantee children are appropriately supervised while using outdoor spaces, balancing safety with encouraging independent play.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety and well-being",
    });
  }

  if (
    equipmentSafetyRate >= 50 &&
    equipmentSafetyRate < 80 &&
    totalEquipmentSafetyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve equipment safety compliance to at least 80% — schedule regular safety checks, address non-compliant items, and ensure manufacturer guidelines are followed for all outdoor play equipment.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    gardenConditionRate >= 40 &&
    gardenConditionRate < 70 &&
    totalGardenConditionRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular garden maintenance schedule with clear responsibilities — assign maintenance tasks, set seasonal priorities, and monitor completion to progressively improve garden condition across all areas.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (maintenanceCompletionRate < 70 && maintenanceRequiredCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve garden maintenance completion rates — track outstanding maintenance tasks, assign clear ownership, and establish timescales for completion to prevent outdoor spaces from deteriorating.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (professionalInspectionRate < 50 && totalEquipmentSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Arrange professional safety inspections for all outdoor play equipment — annual inspections by qualified inspectors (RPII registered) provide assurance that equipment meets safety standards and identify issues that visual checks may miss.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    spaceUtilisationRate < 60 &&
    totalSpaceUtilisationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate why outdoor spaces are underused and develop an action plan — consider whether spaces are inviting, accessible, weather-protected, and whether children are being encouraged and supported to use them regularly.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities and relationships",
    });
  }

  if (
    childInvolvementRate >= 30 &&
    childInvolvementRate < 70 &&
    totalChildInvolvementRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Diversify garden involvement opportunities to increase engagement — offer a range of activities from planting and harvesting to wildlife observation and outdoor cooking, matching activities to individual children's interests and abilities.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities and relationships",
    });
  }

  if (
    environmentalQualityRate >= 40 &&
    environmentalQualityRate < 70 &&
    totalEnvironmentalQualityRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop an outdoor environment improvement plan addressing areas below standard — consult children about what they would like from outdoor spaces and prioritise improvements that enhance both environmental quality and children's enjoyment.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    childCoverage < 80 &&
    childCoverage >= 50 &&
    total_children > 0 &&
    totalChildInvolvementRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend garden activity participation to reach all children — identify those not yet involved and create personalised, accessible opportunities that connect outdoor engagement to their interests and developmental goals.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities and relationships",
    });
  }

  if (
    childEnjoymentRate >= 40 &&
    childEnjoymentRate < 70 &&
    totalEnjoymentDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore ways to increase children's enjoyment of outdoor spaces — consult with children about their preferences, consider adding new features or activities, and ensure outdoor time feels like a positive choice rather than an obligation.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (improvementCompletionRate < 70 && improvementNeededCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Track and complete identified environmental improvements — assign ownership and timescales for each improvement action and monitor progress to ensure the outdoor environment is continually enhanced.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: GardenOutdoorInsight[] = [];

  // -- Critical insights --

  if (equipmentSafetyRate < 50 && totalEquipmentSafetyRecords > 0) {
    insights.push({
      text: `Only ${equipmentSafetyRate}% equipment safety compliance. The majority of outdoor play equipment fails to meet safety standards — this is a serious safeguarding concern. Ofsted expects children's homes to maintain safe premises under Reg 25, and equipment that poses injury risk must be removed from use immediately pending repair or replacement.`,
      severity: "critical",
    });
  }

  if (gardenConditionRate < 40 && totalGardenConditionRecords > 0) {
    insights.push({
      text: `Only ${gardenConditionRate}% of garden areas in good condition. Poorly maintained outdoor spaces fail to provide the quality living environment children deserve. Under Reg 25 premises must be maintained to a standard appropriate for the purpose of the home — children should have access to clean, safe, well-kept outdoor areas.`,
      severity: "critical",
    });
  }

  if (defectResolutionRate < 50 && defectsFoundCount > 0) {
    insights.push({
      text: `Only ${defectResolutionRate}% of equipment defects resolved. Unrepaired defects in outdoor play equipment represent direct physical risks to children. Each unresolved defect is a potential accident — the home must demonstrate that it responds to identified safety issues promptly and effectively.`,
      severity: "critical",
    });
  }

  if (hazardResolutionRate < 50 && hazardsFoundCount > 0) {
    insights.push({
      text: `Only ${hazardResolutionRate}% of garden safety hazards resolved. Unresolved hazards in outdoor spaces mean children are exposed to avoidable risks. The home's duty of care requires that identified safety concerns are addressed promptly — the current resolution rate is inadequate.`,
      severity: "critical",
    });
  }

  if (childInvolvementRate < 30 && totalChildInvolvementRecords > 0) {
    insights.push({
      text: `Only ${childInvolvementRate}% child engagement in garden activities. Children are not meaningfully involved in gardening or outdoor activities, missing opportunities for skill development, therapeutic benefit, physical activity, and connection with nature that support their overall wellbeing and development.`,
      severity: "critical",
    });
  }

  if (totalChildInvolvementRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No child involvement in garden activities recorded despite children being on placement. Garden-based activities can offer significant developmental and therapeutic benefits — the home should develop an outdoor engagement programme that creates meaningful opportunities for children to connect with nature.",
      severity: "critical",
    });
  }

  if (totalEquipmentSafetyRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No outdoor equipment safety checks recorded despite children being on placement. Regular safety inspection of play equipment is essential to prevent injury — the home must implement a structured inspection regime covering all outdoor play and sports equipment.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    equipmentSafetyRate >= 50 &&
    equipmentSafetyRate < 80 &&
    totalEquipmentSafetyRecords > 0
  ) {
    insights.push({
      text: `Equipment safety compliance at ${equipmentSafetyRate}% — improving but not yet meeting expected standards. Regular safety checks, prompt defect resolution, and professional inspections are needed to ensure all outdoor play equipment is consistently safe for children.`,
      severity: "warning",
    });
  }

  if (
    gardenConditionRate >= 40 &&
    gardenConditionRate < 70 &&
    totalGardenConditionRecords > 0
  ) {
    insights.push({
      text: `Garden condition rate at ${gardenConditionRate}% — outdoor spaces need consistent maintenance attention. A regular maintenance schedule with seasonal planning would help bring all areas to an acceptable standard and maintain them throughout the year.`,
      severity: "warning",
    });
  }

  if (
    childInvolvementRate >= 30 &&
    childInvolvementRate < 70 &&
    totalChildInvolvementRecords > 0
  ) {
    insights.push({
      text: `Child involvement in garden activities at ${childInvolvementRate}% — some children are engaging with outdoor activities but many are not. Diversifying activities and removing barriers to participation could significantly increase children's connection with nature and outdoor spaces.`,
      severity: "warning",
    });
  }

  if (
    environmentalQualityRate >= 40 &&
    environmentalQualityRate < 70 &&
    totalEnvironmentalQualityRecords > 0
  ) {
    insights.push({
      text: `Environmental quality rate at ${environmentalQualityRate}% — the outdoor environment does not consistently meet quality standards. Targeted improvements based on assessment findings would enhance the garden as a space for wellbeing, play, and learning.`,
      severity: "warning",
    });
  }

  if (
    spaceUtilisationRate >= 40 &&
    spaceUtilisationRate < 60 &&
    totalSpaceUtilisationRecords > 0
  ) {
    insights.push({
      text: `Space utilisation at ${spaceUtilisationRate}% — outdoor spaces exist but are not being fully used. Investigating whether spaces are inviting, accessible, and promoted to children could reveal simple changes that increase engagement and enjoyment.`,
      severity: "warning",
    });
  }

  if (
    childEnjoymentRate >= 40 &&
    childEnjoymentRate < 70 &&
    totalEnjoymentDenom > 0
  ) {
    insights.push({
      text: `Child enjoyment in outdoor activities at ${childEnjoymentRate}% — not all children are finding outdoor experiences positive. Consulting children about their preferences and adapting spaces and activities accordingly could transform outdoor engagement.`,
      severity: "warning",
    });
  }

  if (
    maintenanceCompletionRate >= 50 &&
    maintenanceCompletionRate < 70 &&
    maintenanceRequiredCount > 0
  ) {
    insights.push({
      text: `Garden maintenance completion at ${maintenanceCompletionRate}% — some required maintenance tasks are outstanding. Without consistent follow-through, outdoor spaces will gradually deteriorate, affecting both safety and children's enjoyment.`,
      severity: "warning",
    });
  }

  if (
    avgEnjoymentLevel >= 2.0 &&
    avgEnjoymentLevel < 3.0 &&
    totalChildInvolvementRecords > 0
  ) {
    insights.push({
      text: `Children's enjoyment level averaging ${avgEnjoymentLevel}/5 in garden activities — activities exist but are not consistently enjoyable for children. Reviewing activity design and incorporating children's preferences could significantly improve this.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (garden_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding garden and outdoor space maintenance — outdoor areas are well-maintained, equipment is safely managed, children are actively engaged in gardening, and environmental quality supports wellbeing. This contributes positively to children's daily experiences and development.",
      severity: "positive",
    });
  }

  if (
    equipmentSafetyRate >= 95 &&
    defectResolutionRate >= 95 &&
    totalEquipmentSafetyRecords > 0 &&
    defectsFoundCount > 0
  ) {
    insights.push({
      text: `${equipmentSafetyRate}% equipment safety compliance with ${defectResolutionRate}% of defects resolved — the home demonstrates an exemplary approach to outdoor equipment safety, ensuring children can play with confidence in well-maintained, regularly inspected equipment.`,
      severity: "positive",
    });
  }

  if (
    gardenConditionRate >= 90 &&
    cleanlinessRate >= 90 &&
    totalGardenConditionRecords > 0
  ) {
    insights.push({
      text: `${gardenConditionRate}% garden condition with ${cleanlinessRate}% cleanliness — outdoor spaces are consistently well-maintained and clean, providing children with a quality living environment that supports their wellbeing and enjoyment.`,
      severity: "positive",
    });
  }

  if (
    childInvolvementRate >= 90 &&
    avgEnjoymentLevel >= 4.0 &&
    totalChildInvolvementRecords > 0
  ) {
    insights.push({
      text: `${childInvolvementRate}% child engagement with enjoyment averaging ${avgEnjoymentLevel}/5 — children are genuinely engaged in and enjoying garden activities, demonstrating that outdoor involvement is meeting their needs and contributing to positive daily experiences.`,
      severity: "positive",
    });
  }

  if (
    childCoverage >= 100 &&
    total_children > 0 &&
    totalChildInvolvementRecords > 0
  ) {
    insights.push({
      text: "Every child has been involved in garden activities — outdoor engagement is a truly inclusive part of the home's approach to children's development. This demonstrates that nature-based activities are embedded in practice, not tokenistic.",
      severity: "positive",
    });
  }

  if (
    spaceUtilisationRate >= 80 &&
    uniqueSpaceTypes >= 4 &&
    totalSpaceUtilisationRecords > 0
  ) {
    insights.push({
      text: `${spaceUtilisationRate}% space utilisation across ${uniqueSpaceTypes} different outdoor space types — outdoor areas are well-used and diverse, providing children with varied environments for play, learning, relaxation, and social interaction.`,
      severity: "positive",
    });
  }

  if (
    environmentalQualityRate >= 90 &&
    sensoryBenefitRate >= 70 &&
    totalEnvironmentalQualityRecords > 0
  ) {
    insights.push({
      text: `${environmentalQualityRate}% environmental quality with sensory benefits noted in ${sensoryBenefitRate}% of assessments — the outdoor environment provides a rich, health-promoting space that actively supports children's sensory development and emotional wellbeing.`,
      severity: "positive",
    });
  }

  if (
    hazardResolutionRate >= 95 &&
    maintenanceCompletionRate >= 90 &&
    hazardsFoundCount > 0 &&
    maintenanceRequiredCount > 0
  ) {
    insights.push({
      text: `${hazardResolutionRate}% hazard resolution with ${maintenanceCompletionRate}% maintenance completion — the home demonstrates excellent follow-through on safety and maintenance actions, ensuring outdoor spaces remain safe and well-maintained over time.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (garden_rating === "outstanding") {
    headline =
      "Outstanding garden and outdoor space maintenance — outdoor areas are well-maintained, equipment is safely managed, children are actively engaged in gardening, and environmental quality supports wellbeing and development.";
  } else if (garden_rating === "good") {
    headline = `Good garden and outdoor space maintenance — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (garden_rating === "adequate") {
    headline = `Adequate garden and outdoor space maintenance — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure safe, well-maintained outdoor spaces and children's engagement with nature.`;
  } else {
    headline = `Garden and outdoor space maintenance is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve outdoor safety, garden condition, equipment maintenance, and children's outdoor experiences.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    garden_rating,
    garden_score: score,
    headline,
    total_garden_condition_records: totalGardenConditionRecords,
    total_equipment_safety_records: totalEquipmentSafetyRecords,
    total_space_utilisation_records: totalSpaceUtilisationRecords,
    total_child_involvement_records: totalChildInvolvementRecords,
    total_environmental_quality_records: totalEnvironmentalQualityRecords,
    garden_condition_rate: gardenConditionRate,
    equipment_safety_rate: equipmentSafetyRate,
    space_utilisation_rate: spaceUtilisationRate,
    child_involvement_rate: childInvolvementRate,
    environmental_quality_rate: environmentalQualityRate,
    child_enjoyment_rate: childEnjoymentRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
