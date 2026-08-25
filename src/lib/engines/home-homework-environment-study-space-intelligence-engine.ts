import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME HOMEWORK ENVIRONMENT & STUDY SPACE INTELLIGENCE ENGINE
// Monitors study environment quality — dedicated study space provision,
// noise-free environment, equipment availability, lighting adequacy,
// and child satisfaction with study conditions.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 8 (Education), Reg 5 (Engaging with the wider system),
// Reg 25 (Premises — suitability of living accommodation).
// SCCIF: "Children's experiences and progress in education".
// Store keys: studySpaceRecords, noiseEnvironmentRecords,
//             equipmentRecords, lightingRecords,
//             childSatisfactionRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StudySpaceRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  dedicated_space_available: boolean;
  space_type: "bedroom_desk" | "shared_study_room" | "dining_table" | "library_area" | "quiet_room" | "other";
  space_adequate_size: boolean;
  space_clean_tidy: boolean;
  space_free_from_distractions: boolean;
  private_when_needed: boolean;
  personalised_for_child: boolean;
  temperature_comfortable: boolean;
  ventilation_adequate: boolean;
  accessibility_suitable: boolean;
  storage_for_materials: boolean;
  assessed_by: string;
  issues_identified: string[];
  issues_resolved: boolean;
  resolution_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface NoiseEnvironmentRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  noise_level_acceptable: boolean;
  noise_source: "peers" | "staff" | "external" | "media" | "building_works" | "appliances" | "none" | "other";
  noise_mitigation_in_place: boolean;
  mitigation_type: string | null;
  mitigation_effective: boolean;
  time_of_assessment: "morning" | "afternoon" | "evening" | "weekend";
  child_reported_disturbance: boolean;
  impact_on_concentration: "none" | "mild" | "moderate" | "severe";
  staff_action_taken: boolean;
  action_description: string | null;
  follow_up_needed: boolean;
  follow_up_completed: boolean;
  assessed_by: string;
  created_at: string;
}

export interface EquipmentRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  desk_available: boolean;
  chair_suitable: boolean;
  computer_laptop_available: boolean;
  internet_access: boolean;
  printer_access: boolean;
  stationery_available: boolean;
  textbooks_available: boolean;
  calculator_available: boolean;
  art_supplies_available: boolean;
  specialist_equipment_needed: boolean;
  specialist_equipment_provided: boolean;
  equipment_condition: "excellent" | "good" | "fair" | "poor";
  equipment_age_appropriate: boolean;
  replacement_needed: boolean;
  replacement_actioned: boolean;
  assessed_by: string;
  notes: string | null;
  created_at: string;
}

export interface LightingRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  natural_light_adequate: boolean;
  artificial_light_adequate: boolean;
  desk_lamp_available: boolean;
  light_adjustable: boolean;
  glare_free: boolean;
  light_level_measured: boolean;
  light_level_lux: number | null;
  meets_recommended_standard: boolean;
  issues_identified: string[];
  issues_resolved: boolean;
  resolution_date: string | null;
  assessed_by: string;
  notes: string | null;
  created_at: string;
}

export interface ChildSatisfactionRecordInput {
  id: string;
  child_id: string;
  survey_date: string;
  overall_satisfaction: number; // 1-5
  space_satisfaction: number; // 1-5
  noise_satisfaction: number; // 1-5
  equipment_satisfaction: number; // 1-5
  lighting_satisfaction: number; // 1-5
  feels_able_to_concentrate: boolean;
  feels_supported_in_study: boolean;
  would_change_anything: boolean;
  change_suggestions: string | null;
  prefers_different_location: boolean;
  preferred_location: string | null;
  study_hours_per_week: number;
  homework_completion_rate_self_reported: number; // 0-100
  child_comments: string | null;
  collected_by: string;
  created_at: string;
}

export interface HomeworkEnvironmentInput {
  today: string;
  total_children: number;
  study_space_records: StudySpaceRecordInput[];
  noise_environment_records: NoiseEnvironmentRecordInput[];
  equipment_records: EquipmentRecordInput[];
  lighting_records: LightingRecordInput[];
  child_satisfaction_records: ChildSatisfactionRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HomeworkEnvironmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HomeworkEnvironmentInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HomeworkEnvironmentRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeworkEnvironmentResult {
  study_rating: HomeworkEnvironmentRating;
  study_score: number | null;
  headline: string;
  total_space_assessments: number;
  total_noise_assessments: number;
  total_equipment_assessments: number;
  total_lighting_assessments: number;
  total_satisfaction_surveys: number;
  study_space_rate: number | null;
  noise_environment_rate: number | null;
  equipment_rate: number | null;
  lighting_rate: number | null;
  child_satisfaction_rate: number | null;
  utilisation_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: HomeworkEnvironmentRecommendation[];
  insights: HomeworkEnvironmentInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HomeworkEnvironmentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: HomeworkEnvironmentRating,
  score: number,
  headline: string,
): HomeworkEnvironmentResult {
  return {
    study_rating: rating,
    study_score: score,
    headline,
    total_space_assessments: 0,
    total_noise_assessments: 0,
    total_equipment_assessments: 0,
    total_lighting_assessments: 0,
    total_satisfaction_surveys: 0,
    study_space_rate: null,
    noise_environment_rate: null,
    equipment_rate: null,
    lighting_rate: null,
    child_satisfaction_rate: null,
    utilisation_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeworkEnvironmentStudySpace(
  input: HomeworkEnvironmentInput,
): HomeworkEnvironmentResult {
  const {
    total_children,
    study_space_records,
    noise_environment_records,
    equipment_records,
    lighting_records,
    child_satisfaction_records,
  } = input;

  // ── Special case: all empty + 0 children -> insufficient_data ──────────
  const allEmpty =
    study_space_records.length === 0 &&
    noise_environment_records.length === 0 &&
    equipment_records.length === 0 &&
    lighting_records.length === 0 &&
    child_satisfaction_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess homework environment and study space quality.",
    );
  }

  // ── Special case: all empty + children > 0 -> inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No homework environment or study space data recorded despite children on placement — study environment monitoring requires urgent attention.",
      ),
      concerns: [
        "No study space assessments, noise environment records, equipment audits, lighting checks, or child satisfaction surveys exist despite children being on placement — the home cannot evidence adequate study environment provision or support for children's education.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of study space provision, noise environment assessments, equipment audits, lighting checks, and child satisfaction surveys to evidence the home's support for children's education and homework needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 8 — Education",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has access to a dedicated, well-equipped study space with appropriate lighting and a noise-free environment, and that their satisfaction with study conditions is regularly assessed.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
      ],
      insights: [
        {
          text: "The complete absence of study environment records means Ofsted cannot verify that children have appropriate spaces for homework and study, that equipment is available, or that environmental conditions support concentration. This represents a fundamental gap in Reg 8 education support and Reg 25 premises suitability compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Study space metrics ---
  const totalSpaceAssessments = study_space_records.length;

  const spaceChecks = [
    (s: StudySpaceRecordInput) => s.dedicated_space_available,
    (s: StudySpaceRecordInput) => s.space_adequate_size,
    (s: StudySpaceRecordInput) => s.space_clean_tidy,
    (s: StudySpaceRecordInput) => s.space_free_from_distractions,
    (s: StudySpaceRecordInput) => s.private_when_needed,
    (s: StudySpaceRecordInput) => s.personalised_for_child,
    (s: StudySpaceRecordInput) => s.temperature_comfortable,
    (s: StudySpaceRecordInput) => s.ventilation_adequate,
    (s: StudySpaceRecordInput) => s.accessibility_suitable,
    (s: StudySpaceRecordInput) => s.storage_for_materials,
  ];
  const totalSpaceChecksPossible = totalSpaceAssessments * spaceChecks.length;
  let totalSpaceChecksPassed = 0;
  for (const rec of study_space_records) {
    for (const check of spaceChecks) {
      if (check(rec)) totalSpaceChecksPassed++;
    }
  }
  const studySpaceRate = rate(totalSpaceChecksPassed, totalSpaceChecksPossible);

  const dedicatedSpaceCount = study_space_records.filter((s) => s.dedicated_space_available).length;
  const dedicatedSpaceRate = rate(dedicatedSpaceCount, totalSpaceAssessments);

  const spaceIssuesIdentified = study_space_records.filter(
    (s) => s.issues_identified.length > 0,
  ).length;
  const spaceIssuesResolved = study_space_records.filter(
    (s) => s.issues_identified.length > 0 && s.issues_resolved,
  ).length;
  const spaceIssueResolutionRate = rate(spaceIssuesResolved, spaceIssuesIdentified);

  // --- Noise environment metrics ---
  const totalNoiseAssessments = noise_environment_records.length;

  const noiseAcceptableCount = noise_environment_records.filter((n) => n.noise_level_acceptable).length;
  const noiseEnvironmentRate = rate(noiseAcceptableCount, totalNoiseAssessments);

  const noiseMitigationInPlace = noise_environment_records.filter(
    (n) => !n.noise_level_acceptable && n.noise_mitigation_in_place,
  ).length;
  const noiseNeedingMitigation = noise_environment_records.filter(
    (n) => !n.noise_level_acceptable,
  ).length;
  const noiseMitigationRate = rate(noiseMitigationInPlace, noiseNeedingMitigation);

  const severeConcentrationImpact = noise_environment_records.filter(
    (n) => n.impact_on_concentration === "severe" || n.impact_on_concentration === "moderate",
  ).length;
  const concentrationImpactRate = rate(severeConcentrationImpact, totalNoiseAssessments);

  const noiseFollowUpNeeded = noise_environment_records.filter((n) => n.follow_up_needed).length;
  const noiseFollowUpCompleted = noise_environment_records.filter(
    (n) => n.follow_up_needed && n.follow_up_completed,
  ).length;
  const noiseFollowUpRate = rate(noiseFollowUpCompleted, noiseFollowUpNeeded);

  // --- Equipment metrics ---
  const totalEquipmentAssessments = equipment_records.length;

  const equipChecks = [
    (e: EquipmentRecordInput) => e.desk_available,
    (e: EquipmentRecordInput) => e.chair_suitable,
    (e: EquipmentRecordInput) => e.computer_laptop_available,
    (e: EquipmentRecordInput) => e.internet_access,
    (e: EquipmentRecordInput) => e.stationery_available,
    (e: EquipmentRecordInput) => e.textbooks_available,
    (e: EquipmentRecordInput) => e.equipment_age_appropriate,
  ];
  const totalEquipChecksPossible = totalEquipmentAssessments * equipChecks.length;
  let totalEquipChecksPassed = 0;
  for (const rec of equipment_records) {
    for (const check of equipChecks) {
      if (check(rec)) totalEquipChecksPassed++;
    }
  }
  const equipmentRate = rate(totalEquipChecksPassed, totalEquipChecksPossible);

  const computerAvailableCount = equipment_records.filter((e) => e.computer_laptop_available).length;
  const computerAvailabilityRate = rate(computerAvailableCount, totalEquipmentAssessments);

  const internetAccessCount = equipment_records.filter((e) => e.internet_access).length;
  const internetAccessRate = rate(internetAccessCount, totalEquipmentAssessments);

  const specialistNeeded = equipment_records.filter((e) => e.specialist_equipment_needed).length;
  const specialistProvided = equipment_records.filter(
    (e) => e.specialist_equipment_needed && e.specialist_equipment_provided,
  ).length;
  const specialistProvisionRate = rate(specialistProvided, specialistNeeded);

  const replacementNeeded = equipment_records.filter((e) => e.replacement_needed).length;
  const replacementActioned = equipment_records.filter(
    (e) => e.replacement_needed && e.replacement_actioned,
  ).length;
  const replacementActionRate = rate(replacementActioned, replacementNeeded);

  const poorConditionCount = equipment_records.filter(
    (e) => e.equipment_condition === "poor",
  ).length;
  const poorConditionRate = rate(poorConditionCount, totalEquipmentAssessments);

  const goodExcellentConditionCount = equipment_records.filter(
    (e) => e.equipment_condition === "excellent" || e.equipment_condition === "good",
  ).length;
  const goodConditionRate = rate(goodExcellentConditionCount, totalEquipmentAssessments);

  // --- Lighting metrics ---
  const totalLightingAssessments = lighting_records.length;

  const lightingChecks = [
    (l: LightingRecordInput) => l.natural_light_adequate,
    (l: LightingRecordInput) => l.artificial_light_adequate,
    (l: LightingRecordInput) => l.desk_lamp_available,
    (l: LightingRecordInput) => l.glare_free,
    (l: LightingRecordInput) => l.meets_recommended_standard,
  ];
  const totalLightChecksPossible = totalLightingAssessments * lightingChecks.length;
  let totalLightChecksPassed = 0;
  for (const rec of lighting_records) {
    for (const check of lightingChecks) {
      if (check(rec)) totalLightChecksPassed++;
    }
  }
  const lightingRate = rate(totalLightChecksPassed, totalLightChecksPossible);

  const deskLampCount = lighting_records.filter((l) => l.desk_lamp_available).length;
  const deskLampRate = rate(deskLampCount, totalLightingAssessments);

  // --- Child satisfaction metrics ---
  const totalSatisfactionSurveys = child_satisfaction_records.length;

  // Child satisfaction rate: proportion scoring 4 or 5 out of 5
  const satisfiedChildren = child_satisfaction_records.filter(
    (c) => c.overall_satisfaction >= 4,
  ).length;
  const childSatisfactionRate = rate(satisfiedChildren, totalSatisfactionSurveys);

  const canConcentrate = child_satisfaction_records.filter(
    (c) => c.feels_able_to_concentrate,
  ).length;
  const concentrationRate = rate(canConcentrate, totalSatisfactionSurveys);

  const feelsSupported = child_satisfaction_records.filter(
    (c) => c.feels_supported_in_study,
  ).length;
  const studySupportRate = rate(feelsSupported, totalSatisfactionSurveys);

  const wouldChange = child_satisfaction_records.filter(
    (c) => c.would_change_anything,
  ).length;
  const changeRequestRate = rate(wouldChange, totalSatisfactionSurveys);

  const prefersDifferent = child_satisfaction_records.filter(
    (c) => c.prefers_different_location,
  ).length;
  const locationDissatisfactionRate = rate(prefersDifferent, totalSatisfactionSurveys);

  const avgHomeworkCompletion =
    totalSatisfactionSurveys > 0
      ? Math.round(
          child_satisfaction_records.reduce(
            (sum, c) => sum + c.homework_completion_rate_self_reported,
            0,
          ) / totalSatisfactionSurveys,
        )
      : null;

  // --- Utilisation rate ---
  // How many unique children have at least one study space assessment
  const uniqueChildrenWithSpaces = new Set(
    study_space_records.map((s) => s.child_id),
  ).size;
  const utilisationRate =
    total_children > 0 ? rate(uniqueChildrenWithSpaces, total_children) : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: studySpaceRate (>=90: +4, >=70: +2) ---
  if (meets(studySpaceRate, 90)) score += 4;
  else if (meets(studySpaceRate, 70)) score += 2;

  // --- Bonus 2: noiseEnvironmentRate (>=90: +4, >=70: +2) ---
  if (meets(noiseEnvironmentRate, 90)) score += 4;
  else if (meets(noiseEnvironmentRate, 70)) score += 2;

  // --- Bonus 3: equipmentRate (>=90: +4, >=70: +2) ---
  if (meets(equipmentRate, 90)) score += 4;
  else if (meets(equipmentRate, 70)) score += 2;

  // --- Bonus 4: lightingRate (>=90: +3, >=70: +1) ---
  if (meets(lightingRate, 90)) score += 3;
  else if (meets(lightingRate, 70)) score += 1;

  // --- Bonus 5: childSatisfactionRate (>=90: +4, >=70: +2) ---
  if (meets(childSatisfactionRate, 90)) score += 4;
  else if (meets(childSatisfactionRate, 70)) score += 2;

  // --- Bonus 6: utilisationRate (>=80: +3, >=50: +1) ---
  if (meets(utilisationRate, 80)) score += 3;
  else if (meets(utilisationRate, 50)) score += 1;

  // --- Bonus 7: concentrationRate (>=90: +3, >=70: +1) ---
  if (meets(concentrationRate, 90)) score += 3;
  else if (meets(concentrationRate, 70)) score += 1;

  // --- Bonus 8: goodConditionRate (>=90: +3, >=70: +1) ---
  if (meets(goodConditionRate, 90)) score += 3;
  else if (meets(goodConditionRate, 70)) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // studySpaceRate < 50 -> -5
  if (below(studySpaceRate, 50) && totalSpaceAssessments > 0) score -= 5;

  // noiseEnvironmentRate < 50 -> -5
  if (below(noiseEnvironmentRate, 50) && totalNoiseAssessments > 0) score -= 5;

  // equipmentRate < 50 -> -5
  if (below(equipmentRate, 50) && totalEquipmentAssessments > 0) score -= 5;

  // concentrationImpactRate > 50 -> -3
  if (above(concentrationImpactRate, 50) && totalNoiseAssessments > 0) score -= 3;

  score = clamp(score, 0, 100);

  const study_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(studySpaceRate, 90) && totalSpaceAssessments > 0) {
    strengths.push(
      `${studySpaceRate}% study space quality — children have access to dedicated, well-maintained, distraction-free study spaces that are personalised and equipped with storage for materials.`,
    );
  } else if (meets(studySpaceRate, 70) && totalSpaceAssessments > 0) {
    strengths.push(
      `${studySpaceRate}% study space quality — the majority of study space standards are met, providing children with generally suitable environments for homework and study.`,
    );
  }

  if (meets(dedicatedSpaceRate, 90) && totalSpaceAssessments > 0) {
    strengths.push(
      `${dedicatedSpaceRate}% of children have a dedicated study space — the home prioritises providing every child with their own area for focused academic work.`,
    );
  } else if (meets(dedicatedSpaceRate, 70) && totalSpaceAssessments > 0) {
    strengths.push(
      `${dedicatedSpaceRate}% of children have a dedicated study space — most children benefit from a designated area for homework and study.`,
    );
  }

  if (meets(noiseEnvironmentRate, 90) && totalNoiseAssessments > 0) {
    strengths.push(
      `${noiseEnvironmentRate}% noise environment compliance — study areas consistently maintain acceptable noise levels, enabling children to concentrate effectively on their academic work.`,
    );
  } else if (meets(noiseEnvironmentRate, 70) && totalNoiseAssessments > 0) {
    strengths.push(
      `${noiseEnvironmentRate}% noise environment compliance — the home generally provides quiet study conditions for children.`,
    );
  }

  if (meets(equipmentRate, 90) && totalEquipmentAssessments > 0) {
    strengths.push(
      `${equipmentRate}% equipment availability — children consistently have access to desks, computers, internet, stationery, and age-appropriate study materials, demonstrating strong educational resource provision.`,
    );
  } else if (meets(equipmentRate, 70) && totalEquipmentAssessments > 0) {
    strengths.push(
      `${equipmentRate}% equipment availability — the home generally provides adequate study equipment and resources for children.`,
    );
  }

  if (meets(lightingRate, 90) && totalLightingAssessments > 0) {
    strengths.push(
      `${lightingRate}% lighting adequacy — study areas have excellent lighting with desk lamps, natural light, and glare-free conditions that meet recommended standards for focused study.`,
    );
  } else if (meets(lightingRate, 70) && totalLightingAssessments > 0) {
    strengths.push(
      `${lightingRate}% lighting adequacy — the majority of study areas meet lighting standards for comfortable studying.`,
    );
  }

  if (meets(childSatisfactionRate, 90) && totalSatisfactionSurveys > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction with study conditions — children report high levels of satisfaction with their homework environment, reflecting child-centred provision that meets individual needs.`,
    );
  } else if (meets(childSatisfactionRate, 70) && totalSatisfactionSurveys > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction — most children are satisfied with their study environment and conditions.`,
    );
  }

  if (meets(concentrationRate, 90) && totalSatisfactionSurveys > 0) {
    strengths.push(
      `${concentrationRate}% of children feel able to concentrate — the study environment effectively supports focused academic engagement, a key indicator of suitable homework conditions.`,
    );
  } else if (meets(concentrationRate, 70) && totalSatisfactionSurveys > 0) {
    strengths.push(
      `${concentrationRate}% of children feel able to concentrate — most children can focus effectively in their study environment.`,
    );
  }

  if (meets(studySupportRate, 90) && totalSatisfactionSurveys > 0) {
    strengths.push(
      `${studySupportRate}% of children feel supported in their study — children experience consistent academic encouragement and practical support from staff.`,
    );
  } else if (meets(studySupportRate, 70) && totalSatisfactionSurveys > 0) {
    strengths.push(
      `${studySupportRate}% of children feel supported in study — the majority of children experience helpful staff support with homework.`,
    );
  }

  if (meets(computerAvailabilityRate, 90) && totalEquipmentAssessments > 0) {
    strengths.push(
      `${computerAvailabilityRate}% computer and laptop availability — children have consistent access to digital technology for homework, research, and online learning.`,
    );
  }

  if (meets(internetAccessRate, 90) && totalEquipmentAssessments > 0) {
    strengths.push(
      `${internetAccessRate}% internet access — children can reliably access online learning resources, school portals, and research materials to support their education.`,
    );
  }

  if (meets(specialistProvisionRate, 90) && specialistNeeded > 0) {
    strengths.push(
      `${specialistProvisionRate}% specialist equipment provision — where children require specialised equipment for their education, the home ensures it is provided and available.`,
    );
  }

  if (meets(deskLampRate, 90) && totalLightingAssessments > 0) {
    strengths.push(
      `${deskLampRate}% desk lamp availability — every study area is equipped with focused task lighting to support comfortable reading and writing.`,
    );
  }

  if (meets(spaceIssueResolutionRate, 90) && spaceIssuesIdentified > 0) {
    strengths.push(
      `${spaceIssueResolutionRate}% of study space issues resolved — identified problems with study environments are addressed promptly, ensuring children's learning is not disrupted.`,
    );
  }

  if (meets(noiseMitigationRate, 90) && noiseNeedingMitigation > 0) {
    strengths.push(
      `${noiseMitigationRate}% noise mitigation in place where needed — the home proactively addresses noise issues to protect children's study time.`,
    );
  }

  if ((avgHomeworkCompletion ?? 0) >= 85 && totalSatisfactionSurveys > 0) {
    strengths.push(
      `Average self-reported homework completion at ${avgHomeworkCompletion}% — children's high homework completion rate reflects effective study environment support and academic engagement.`,
    );
  } else if ((avgHomeworkCompletion ?? 0) >= 70 && totalSatisfactionSurveys > 0) {
    strengths.push(
      `Average self-reported homework completion at ${avgHomeworkCompletion}% — most children are completing their homework, indicating reasonable study support.`,
    );
  }

  if (meets(goodConditionRate, 90) && totalEquipmentAssessments > 0) {
    strengths.push(
      `${goodConditionRate}% of equipment in good or excellent condition — study resources are well maintained and fit for purpose.`,
    );
  }

  if (meets(utilisationRate, 80) && total_children > 0) {
    strengths.push(
      `${utilisationRate}% study space utilisation coverage — the home has assessed and provided study environments for the vast majority of children on placement.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(studySpaceRate, 50) && totalSpaceAssessments > 0) {
    concerns.push(
      `Only ${studySpaceRate}% study space quality — the majority of study space standards are not met, meaning children lack appropriate environments for homework and academic study. This directly undermines educational progress.`,
    );
  } else if (below(studySpaceRate, 70) && meets(studySpaceRate, 50) && totalSpaceAssessments > 0) {
    concerns.push(
      `Study space quality at ${studySpaceRate}% — some study space standards are not consistently met, which may affect children's ability to complete homework effectively.`,
    );
  }

  if (below(dedicatedSpaceRate, 50) && totalSpaceAssessments > 0) {
    concerns.push(
      `Only ${dedicatedSpaceRate}% of children have a dedicated study space — many children lack a designated area for homework, forcing them to study in unsuitable shared spaces or their bedrooms without proper desk facilities.`,
    );
  } else if (below(dedicatedSpaceRate, 70) && meets(dedicatedSpaceRate, 50) && totalSpaceAssessments > 0) {
    concerns.push(
      `Dedicated study space provision at ${dedicatedSpaceRate}% — a notable proportion of children do not have a designated area for focused academic work.`,
    );
  }

  if (below(noiseEnvironmentRate, 50) && totalNoiseAssessments > 0) {
    concerns.push(
      `Only ${noiseEnvironmentRate}% noise environment compliance — study areas are frequently noisy, preventing children from concentrating on homework. This represents a significant barrier to educational achievement.`,
    );
  } else if (below(noiseEnvironmentRate, 70) && meets(noiseEnvironmentRate, 50) && totalNoiseAssessments > 0) {
    concerns.push(
      `Noise environment compliance at ${noiseEnvironmentRate}% — noise levels in study areas are not consistently acceptable, affecting some children's concentration.`,
    );
  }

  if (below(equipmentRate, 50) && totalEquipmentAssessments > 0) {
    concerns.push(
      `Only ${equipmentRate}% equipment availability — children lack essential study equipment including desks, computers, internet access, and stationery. Without adequate resources, children cannot complete homework to the expected standard.`,
    );
  } else if (below(equipmentRate, 70) && meets(equipmentRate, 50) && totalEquipmentAssessments > 0) {
    concerns.push(
      `Equipment availability at ${equipmentRate}% — some children lack access to essential study equipment, which may hinder their academic progress.`,
    );
  }

  if (below(lightingRate, 50) && totalLightingAssessments > 0) {
    concerns.push(
      `Only ${lightingRate}% lighting adequacy — study areas have poor lighting conditions, with insufficient natural light, absent desk lamps, or glare issues. Poor lighting causes eye strain and fatigue, undermining children's ability to study effectively.`,
    );
  } else if (below(lightingRate, 70) && meets(lightingRate, 50) && totalLightingAssessments > 0) {
    concerns.push(
      `Lighting adequacy at ${lightingRate}% — some study areas do not meet recommended lighting standards, which may affect children's comfort and concentration during study.`,
    );
  }

  if (below(childSatisfactionRate, 50) && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction with study conditions — the majority of children are dissatisfied with their homework environment. Children's negative perceptions of their study space directly affect motivation and academic engagement.`,
    );
  } else if (below(childSatisfactionRate, 70) && meets(childSatisfactionRate, 50) && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not satisfied with their study conditions, indicating unmet needs.`,
    );
  }

  if (below(concentrationRate, 50) && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Only ${concentrationRate}% of children feel able to concentrate — the majority of children report difficulty focusing in their study environment, a fundamental failure of homework environment provision.`,
    );
  } else if (below(concentrationRate, 70) && meets(concentrationRate, 50) && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Concentration ability at ${concentrationRate}% — some children struggle to focus in their study environment, suggesting environmental barriers to effective study.`,
    );
  }

  if (above(concentrationImpactRate, 50) && totalNoiseAssessments > 0) {
    concerns.push(
      `${concentrationImpactRate}% of noise assessments show moderate or severe concentration impact — persistent noise disruption is a significant barrier to children's academic progress and homework completion.`,
    );
  } else if (above(concentrationImpactRate, 30) && concentrationImpactRate! <= 50 && totalNoiseAssessments > 0) {
    concerns.push(
      `${concentrationImpactRate}% of noise assessments show moderate or severe concentration impact — noise is affecting some children's ability to study effectively.`,
    );
  }

  if (above(poorConditionRate, 30) && totalEquipmentAssessments > 0) {
    concerns.push(
      `${poorConditionRate}% of equipment in poor condition — study resources are deteriorating, and children are expected to work with inadequate tools.`,
    );
  }

  if ((avgHomeworkCompletion ?? 0) < 50 && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Average self-reported homework completion at only ${avgHomeworkCompletion}% — children are not completing homework, which may reflect inadequate study environment support, equipment shortages, or insufficient staff encouragement.`,
    );
  } else if ((avgHomeworkCompletion ?? 0) < 70 && (avgHomeworkCompletion ?? 0) >= 50 && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Average homework completion at ${avgHomeworkCompletion}% — homework completion is below expected levels, suggesting barriers in the study environment.`,
    );
  }

  if (below(studySupportRate, 50) && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Only ${studySupportRate}% of children feel supported in their study — children do not feel staff are helping them with homework, which may indicate a lack of engagement with educational support responsibilities.`,
    );
  } else if (below(studySupportRate, 70) && meets(studySupportRate, 50) && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Study support perception at ${studySupportRate}% — some children do not feel adequately supported in their homework and study.`,
    );
  }

  if (above(locationDissatisfactionRate, 50) && totalSatisfactionSurveys > 0) {
    concerns.push(
      `${locationDissatisfactionRate}% of children would prefer a different study location — the current study space arrangements are not meeting children's preferences and needs.`,
    );
  }

  if (totalSpaceAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No study space assessments recorded despite children being on placement — the home cannot evidence that appropriate study environments are provided for children's educational needs.",
    );
  }

  if (totalEquipmentAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No equipment assessments recorded — the home cannot evidence that children have access to necessary study equipment and resources for homework completion.",
    );
  }

  if (totalLightingAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No lighting assessments recorded — the home cannot demonstrate that study areas meet appropriate lighting standards for comfortable and effective study.",
    );
  }

  if (totalNoiseAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No noise environment assessments recorded — the home cannot evidence that study areas provide noise-free conditions conducive to concentration and learning.",
    );
  }

  if (totalSatisfactionSurveys === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child satisfaction surveys on study conditions — children's views about their homework environment have not been sought, undermining the voice of the child in education provision.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: HomeworkEnvironmentRecommendation[] = [];
  let rank = 0;

  if (below(studySpaceRate, 50) && totalSpaceAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and improve study space provision for all children — ensure every child has access to a dedicated, adequately sized, clean, distraction-free study area with appropriate furniture, storage, and personalisation. Children cannot achieve educationally without suitable homework environments.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (below(noiseEnvironmentRate, 50) && totalNoiseAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate noise management strategies in study areas — identify and address all noise sources, establish quiet study times, provide noise-cancelling resources, and ensure staff enforce noise-free zones during homework periods.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (below(equipmentRate, 50) && totalEquipmentAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Procure essential study equipment urgently — ensure every child has access to a desk, suitable chair, computer or laptop, internet connection, stationery, and age-appropriate textbooks. Equipment gaps directly prevent children from completing homework.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (above(concentrationImpactRate, 50) && totalNoiseAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an urgent review of noise impact on children's study — when more than half of assessments show moderate or severe concentration impact, the home must take immediate steps to protect children's study time, including environmental changes, scheduling, and potentially physical improvements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(childSatisfactionRate, 50) && totalSatisfactionSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult children individually about their study environment preferences and barriers — low satisfaction indicates homework conditions are not meeting children's needs and must be redesigned with their input to promote educational engagement.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(lightingRate, 50) && totalLightingAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately improve lighting in all study areas — provide desk lamps, address glare, maximise natural light, and ensure lighting meets recommended standards. Poor lighting directly causes eye strain and fatigue that undermine academic work.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(concentrationRate, 50) && totalSatisfactionSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate why children cannot concentrate and implement environment changes — conduct individual assessments of each child's study needs, address noise, lighting, equipment, and privacy barriers, and monitor improvement.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (totalSpaceAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence immediate study space assessments for every child on placement — document the availability, quality, and suitability of each child's homework environment to evidence Reg 8 education support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (totalEquipmentAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin systematic equipment audits for all children's study areas — record the availability and condition of desks, chairs, computers, internet access, and learning materials.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (totalLightingAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct lighting assessments for all study areas — ensure every homework space has adequate natural and artificial lighting with desk lamps and glare-free conditions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalNoiseAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement noise environment assessments across all study times — document noise levels, sources, and their impact on children's concentration during homework periods.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (totalSatisfactionSurveys === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Seek children's views on their study conditions — conduct satisfaction surveys asking about space, noise, equipment, lighting, and support to ensure homework environments reflect children's needs and preferences.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(studySupportRate, 50) && totalSatisfactionSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train and support staff to provide meaningful homework assistance — ensure staff understand their role in supporting children's education, offering encouragement, helping with organisation, and creating a positive study culture.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (below(noiseFollowUpRate, 50) && noiseFollowUpNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a follow-up action tracker for noise issues — ensure all identified noise problems are addressed and documented to prevent recurring disruption to children's study time.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    meets(studySpaceRate, 50) &&
    below(studySpaceRate, 70) &&
    totalSpaceAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve study space quality to at least 70% — review each child's study area and address gaps in size, tidiness, distraction management, privacy, personalisation, and storage provision.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    meets(noiseEnvironmentRate, 50) &&
    below(noiseEnvironmentRate, 70) &&
    totalNoiseAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance noise management to achieve at least 70% compliance — identify and address remaining noise sources during study times, consider scheduling adjustments and physical improvements.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    meets(equipmentRate, 50) &&
    below(equipmentRate, 70) &&
    totalEquipmentAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand equipment provision to meet at least 70% of standards — prioritise computer and internet access, followed by stationery, textbooks, and age-appropriate learning resources.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    meets(lightingRate, 50) &&
    below(lightingRate, 70) &&
    totalLightingAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve lighting standards in study areas — provide desk lamps where absent, address glare issues, and ensure all spaces meet recommended lux levels for academic work.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(childSatisfactionRate, 50) &&
    below(childSatisfactionRate, 70) &&
    totalSatisfactionSurveys > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Seek regular child feedback on study conditions and adapt accordingly — aim to increase satisfaction above 70% by responding to children's suggestions and preferences about their homework environment.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    below(utilisationRate, 50) &&
    total_children > 0 &&
    totalSpaceAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend study space provision assessments to cover all children on placement — assess every child's homework environment needs and ensure suitable spaces are available and allocated.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (above(poorConditionRate, 30) && totalEquipmentAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace equipment in poor condition — children should not be expected to study with deteriorating resources. Implement a replacement schedule and monitor equipment condition regularly.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (above(locationDissatisfactionRate, 50) && totalSatisfactionSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review study location arrangements with children — when the majority prefer a different location, the home should explore alternative spaces and give children genuine choice about where they study.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(replacementActionRate, 50) && replacementNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Action outstanding equipment replacements — identified replacement needs are not being followed through, leaving children without functional study resources.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: HomeworkEnvironmentInsight[] = [];

  // -- Critical insights --

  if (below(studySpaceRate, 50) && totalSpaceAssessments > 0) {
    insights.push({
      text: `Only ${studySpaceRate}% study space quality. Ofsted expects children in residential care to have access to suitable environments for homework and study. Inadequate study spaces directly undermine children's educational progress, their ability to complete homework, and their motivation to engage with learning.`,
      severity: "critical",
    });
  }

  if (below(noiseEnvironmentRate, 50) && totalNoiseAssessments > 0) {
    insights.push({
      text: `Only ${noiseEnvironmentRate}% noise environment compliance. Persistent noise in study areas prevents children from concentrating, completing homework, and developing the study skills they need for educational success. The home must treat noise management as a fundamental educational support requirement.`,
      severity: "critical",
    });
  }

  if (below(equipmentRate, 50) && totalEquipmentAssessments > 0) {
    insights.push({
      text: `Only ${equipmentRate}% equipment availability. Without adequate desks, computers, internet access, and stationery, children cannot be expected to complete homework to the standard expected by their schools. This equipment gap places looked-after children at a direct disadvantage compared to their peers.`,
      severity: "critical",
    });
  }

  if (above(concentrationImpactRate, 50) && totalNoiseAssessments > 0) {
    insights.push({
      text: `${concentrationImpactRate}% of noise assessments show moderate or severe concentration impact. Chronic inability to concentrate during study time has compounding effects on educational attainment, self-esteem, and children's belief in their own academic potential. This requires systemic intervention.`,
      severity: "critical",
    });
  }

  if (below(lightingRate, 50) && totalLightingAssessments > 0) {
    insights.push({
      text: `Only ${lightingRate}% lighting adequacy. Poor lighting in study areas causes eye strain, headaches, and fatigue, all of which reduce children's ability and willingness to engage with homework. Lighting standards for study spaces are a basic premises requirement under Reg 25.`,
      severity: "critical",
    });
  }

  if (below(childSatisfactionRate, 50) && totalSatisfactionSurveys > 0) {
    insights.push({
      text: `Only ${childSatisfactionRate}% child satisfaction with study conditions. When the majority of children are dissatisfied with their homework environment, the home cannot claim to be promoting children's education effectively. Children's negative experiences with study conditions directly affect their motivation to learn.`,
      severity: "critical",
    });
  }

  if (totalSpaceAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No study space assessments exist despite children being on placement. Without study space assessments, the home cannot evidence that children have suitable environments for homework. This is a fundamental gap in education support evidence for Reg 8 compliance.",
      severity: "critical",
    });
  }

  if (totalEquipmentAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No equipment assessments recorded. The home cannot demonstrate that children have the tools they need for educational achievement. Lack of equipment audits means resource gaps go unidentified and unaddressed.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(studySpaceRate, 50) &&
    below(studySpaceRate, 70) &&
    totalSpaceAssessments > 0
  ) {
    insights.push({
      text: `Study space quality at ${studySpaceRate}% — improving but inconsistent. Some children are not benefiting from the dedicated, well-equipped study environments that promote educational engagement. Review individual assessments to identify which standards are most frequently unmet.`,
      severity: "warning",
    });
  }

  if (
    meets(noiseEnvironmentRate, 50) &&
    below(noiseEnvironmentRate, 70) &&
    totalNoiseAssessments > 0
  ) {
    insights.push({
      text: `Noise environment compliance at ${noiseEnvironmentRate}% — noise remains a barrier for some children. Consider whether noise issues are concentrated at particular times of day, in specific rooms, or from particular sources that can be targeted.`,
      severity: "warning",
    });
  }

  if (
    meets(equipmentRate, 50) &&
    below(equipmentRate, 70) &&
    totalEquipmentAssessments > 0
  ) {
    insights.push({
      text: `Equipment availability at ${equipmentRate}% — some children lack key study resources. Consider which specific items are most frequently absent and prioritise procurement of computers, internet access, and basic stationery.`,
      severity: "warning",
    });
  }

  if (
    meets(lightingRate, 50) &&
    below(lightingRate, 70) &&
    totalLightingAssessments > 0
  ) {
    insights.push({
      text: `Lighting adequacy at ${lightingRate}% — some study areas fall short of recommended standards. Focus on providing desk lamps where absent and addressing glare issues that reduce visual comfort during study.`,
      severity: "warning",
    });
  }

  if (
    meets(childSatisfactionRate, 50) &&
    below(childSatisfactionRate, 70) &&
    totalSatisfactionSurveys > 0
  ) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children do not feel their study conditions are adequate. Their feedback should drive targeted improvements to space, equipment, noise, and lighting provision.`,
      severity: "warning",
    });
  }

  if (
    meets(concentrationRate, 50) &&
    below(concentrationRate, 70) &&
    totalSatisfactionSurveys > 0
  ) {
    insights.push({
      text: `Concentration ability at ${concentrationRate}% — some children report difficulty focusing during study time. Investigate whether noise, lighting, distractions, or emotional factors are contributing to concentration problems.`,
      severity: "warning",
    });
  }

  if (
    meets(studySupportRate, 50) &&
    below(studySupportRate, 70) &&
    totalSatisfactionSurveys > 0
  ) {
    insights.push({
      text: `Study support perception at ${studySupportRate}% — some children do not feel staff are helping with homework. Staff training on educational support and creating a positive study culture may address this gap.`,
      severity: "warning",
    });
  }

  if (
    (avgHomeworkCompletion ?? 0) >= 50 &&
    (avgHomeworkCompletion ?? 0) < 70 &&
    totalSatisfactionSurveys > 0
  ) {
    insights.push({
      text: `Average homework completion at ${avgHomeworkCompletion}% — below expected levels. Consider whether environment barriers (space, noise, equipment, lighting) are contributing factors or whether additional academic support is needed.`,
      severity: "warning",
    });
  }

  if (above(changeRequestRate, 50) && totalSatisfactionSurveys > 0) {
    insights.push({
      text: `${changeRequestRate}% of children would change something about their study environment — the majority of children see room for improvement in their homework conditions. Reviewing their specific suggestions could yield targeted, child-centred improvements.`,
      severity: "warning",
    });
  }

  if (above(poorConditionRate, 20) && poorConditionRate! <= 30 && totalEquipmentAssessments > 0) {
    insights.push({
      text: `${poorConditionRate}% of equipment in poor condition — deteriorating resources need attention before they fail entirely. A proactive replacement programme would prevent disruption to children's study.`,
      severity: "warning",
    });
  }

  // Noise source analysis
  const noiseSources: Record<string, number> = {};
  for (const n of noise_environment_records) {
    if (n.noise_source !== "none") {
      noiseSources[n.noise_source] = (noiseSources[n.noise_source] ?? 0) + 1;
    }
  }
  const topNoiseSources = Object.entries(noiseSources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topNoiseSources.length > 0) {
    const formatted = topNoiseSources
      .map(([source, count]) => `${source.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common noise sources: ${formatted}. Understanding noise patterns enables targeted interventions — recurring sources can be addressed through scheduling, physical improvements, or behavioural management.`,
      severity: "warning",
    });
  }

  // Study space type analysis
  const spaceTypes: Record<string, number> = {};
  for (const s of study_space_records) {
    spaceTypes[s.space_type] = (spaceTypes[s.space_type] ?? 0) + 1;
  }
  const topSpaceTypes = Object.entries(spaceTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topSpaceTypes.length > 0) {
    const formatted = topSpaceTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Study space types in use: ${formatted}. The mix of space types can inform whether children have genuine choice about where they study and whether the home provides varied, appropriate options.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (study_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding homework environment and study space provision — children have dedicated, well-equipped, quiet, and well-lit study areas. Child satisfaction is high and the environment actively promotes educational engagement. This is strong evidence for Reg 8 education support and Reg 25 premises suitability.",
      severity: "positive",
    });
  }

  if (
    meets(studySpaceRate, 90) &&
    meets(noiseEnvironmentRate, 90) &&
    totalSpaceAssessments > 0 &&
    totalNoiseAssessments > 0
  ) {
    insights.push({
      text: `${studySpaceRate}% study space quality with ${noiseEnvironmentRate}% noise compliance — the combination of high-quality study spaces and noise-free conditions creates an environment where children can truly focus on their education. This dual standard is hallmark of outstanding provision.`,
      severity: "positive",
    });
  }

  if (
    meets(equipmentRate, 90) &&
    meets(computerAvailabilityRate, 90) &&
    totalEquipmentAssessments > 0
  ) {
    insights.push({
      text: `${equipmentRate}% equipment availability with ${computerAvailabilityRate}% computer access — children have comprehensive access to study equipment including digital technology, placing them on an equal footing with peers in education.`,
      severity: "positive",
    });
  }

  if (
    meets(lightingRate, 90) &&
    totalLightingAssessments > 0
  ) {
    insights.push({
      text: `${lightingRate}% lighting adequacy — study areas consistently meet high lighting standards. Proper lighting supports visual comfort, reduces fatigue, and enables sustained periods of focused study.`,
      severity: "positive",
    });
  }

  if (
    meets(childSatisfactionRate, 90) &&
    meets(concentrationRate, 90) &&
    totalSatisfactionSurveys > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction with ${concentrationRate}% concentration ability — children feel their study environment works for them and can focus effectively. This child-centred approach to educational provision is exactly what Ofsted expects under Reg 8.`,
      severity: "positive",
    });
  }

  if (
    meets(childSatisfactionRate, 90) &&
    totalSatisfactionSurveys > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction with study conditions — children feel well-provided for in their homework environment. High satisfaction drives motivation, engagement, and academic confidence.`,
      severity: "positive",
    });
  }

  if (
    meets(studySupportRate, 90) &&
    totalSatisfactionSurveys > 0
  ) {
    insights.push({
      text: `${studySupportRate}% of children feel supported in study — staff are actively engaging with children's educational needs, offering encouragement, and creating a culture that values academic achievement.`,
      severity: "positive",
    });
  }

  if (
    (avgHomeworkCompletion ?? 0) >= 85 &&
    totalSatisfactionSurveys > 0
  ) {
    insights.push({
      text: `Average homework completion at ${avgHomeworkCompletion}% — the high completion rate strongly suggests that the study environment, equipment, and staff support are effectively enabling children's academic engagement. This is a tangible outcome of good environment provision.`,
      severity: "positive",
    });
  }

  if (
    meets(specialistProvisionRate, 90) &&
    specialistNeeded > 0
  ) {
    insights.push({
      text: `${specialistProvisionRate}% specialist equipment provision — where children have specific educational needs requiring specialised equipment, the home consistently provides it. This demonstrates responsive, individualised education support.`,
      severity: "positive",
    });
  }

  if (
    meets(spaceIssueResolutionRate, 90) &&
    spaceIssuesIdentified > 0
  ) {
    insights.push({
      text: `${spaceIssueResolutionRate}% of study space issues resolved — the home acts promptly on identified problems, ensuring children's learning is not disrupted by persistent environment deficiencies.`,
      severity: "positive",
    });
  }

  if (
    meets(noiseMitigationRate, 90) &&
    noiseNeedingMitigation > 0
  ) {
    insights.push({
      text: `${noiseMitigationRate}% noise mitigation in place where needed — the home proactively addresses noise challenges to protect study time, demonstrating a genuine commitment to supporting children's education through environment management.`,
      severity: "positive",
    });
  }

  if (
    meets(utilisationRate, 80) &&
    total_children > 0
  ) {
    insights.push({
      text: `${utilisationRate}% study space coverage across children — the home has assessed and provisioned homework environments for the vast majority of children, ensuring equitable access to educational support.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (study_rating === "outstanding") {
    headline =
      "Outstanding homework environment and study space provision — children have dedicated, well-equipped, quiet, and well-lit study areas with high satisfaction and effective educational support.";
  } else if (study_rating === "good") {
    headline = `Good homework environment and study space provision — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (study_rating === "adequate") {
    headline = `Adequate homework environment provision — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children have suitable study conditions for educational progress.`;
  } else {
    headline = `Homework environment and study space provision is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children can study effectively.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    study_rating,
    study_score: score,
    headline,
    total_space_assessments: totalSpaceAssessments,
    total_noise_assessments: totalNoiseAssessments,
    total_equipment_assessments: totalEquipmentAssessments,
    total_lighting_assessments: totalLightingAssessments,
    total_satisfaction_surveys: totalSatisfactionSurveys,
    study_space_rate: studySpaceRate,
    noise_environment_rate: noiseEnvironmentRate,
    equipment_rate: equipmentRate,
    lighting_rate: lightingRate,
    child_satisfaction_rate: childSatisfactionRate,
    utilisation_rate: utilisationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
