// ==============================================================================
// CORNERSTONE -- HOME OUTDOOR & NATURE ENGAGEMENT INTELLIGENCE ENGINE
// Tracks outdoor activity quality -- outdoor activity frequency, nature-based
// learning, garden/allotment projects, environmental exploration, and outdoor
// safety management. Critical for Ofsted under Children's Homes Regulations
// 2015 (Reg 5 quality of care, Reg 6 quality and purpose of care standard,
// SCCIF experiences and progress).
// Pure deterministic engine -- no imports, no LLM, no external deps.
// Store keys: outdoorActivityRecords, natureLearningRecords,
//             gardenProjectRecords, explorationRecords, outdoorSafetyRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface OutdoorActivityRecordInput {
  id: string;
  child_id: string;
  activity_type: "walking" | "cycling" | "sports" | "free_play" | "water_activity" | "adventure" | "gardening" | "nature_walk" | "camping" | "other";
  date: string;
  duration_minutes: number;
  staff_led: boolean;
  child_initiated: boolean;
  location: "garden" | "park" | "woodland" | "beach" | "countryside" | "allotment" | "sports_facility" | "school_grounds" | "other";
  child_enjoyment: number; // 1-5
  weather_appropriate_clothing: boolean;
  risk_assessment_completed: boolean;
  participation_willing: boolean;
  skills_developed: string[];
  notes: string;
  created_at: string;
}

export interface NatureLearningRecordInput {
  id: string;
  child_id: string;
  topic: string; // e.g. "wildlife identification", "plant growing", "weather patterns"
  learning_type: "forest_school" | "nature_journal" | "wildlife_watch" | "eco_project" | "outdoor_science" | "foraging" | "conservation" | "other";
  date: string;
  duration_minutes: number;
  learning_objectives_set: boolean;
  learning_objectives_met: boolean;
  child_engagement: number; // 1-5
  child_voice_captured: boolean;
  linked_to_education: boolean;
  resources_provided: boolean;
  outcome_documented: boolean;
  created_at: string;
}

export interface GardenProjectRecordInput {
  id: string;
  child_id: string;
  project_name: string; // e.g. "vegetable patch", "flower bed", "composting"
  project_type: "vegetable_growing" | "flower_garden" | "composting" | "wildlife_habitat" | "allotment" | "herb_garden" | "sensory_garden" | "other";
  date: string;
  active: boolean;
  child_led: boolean;
  child_participation: boolean;
  responsibility_assigned: boolean;
  progress_documented: boolean;
  therapeutic_benefit_noted: boolean;
  harvest_used: boolean; // e.g. vegetables used in cooking
  skills_gained: string[];
  child_satisfaction: number; // 1-5
  created_at: string;
}

export interface ExplorationRecordInput {
  id: string;
  child_id: string;
  exploration_type: "local_walk" | "countryside_trip" | "beach_visit" | "woodland_exploration" | "river_walk" | "nature_reserve" | "farm_visit" | "park_visit" | "den_building" | "other";
  date: string;
  duration_minutes: number;
  new_environment: boolean;
  child_choice: boolean;
  sensory_engagement: boolean; // child engaged senses (touch, smell, sight, sound)
  discovery_documented: boolean;
  child_enjoyment: number; // 1-5
  staff_accompanied: boolean;
  educational_value: boolean;
  repeat_requested: boolean;
  created_at: string;
}

export interface OutdoorSafetyRecordInput {
  id: string;
  date: string;
  safety_type: "risk_assessment" | "equipment_check" | "weather_check" | "first_aid_kit" | "clothing_check" | "sun_safety" | "water_safety" | "supervision_ratio" | "emergency_plan" | "other";
  completed: boolean;
  compliant: boolean;
  issues_found: number;
  issues_resolved: number;
  staff_trained: boolean;
  linked_activity_id: string;
  review_date: string | null;
  notes: string;
  created_at: string;
}

export interface OutdoorNatureInput {
  today: string;
  total_children: number;
  outdoor_activity_records: OutdoorActivityRecordInput[];
  nature_learning_records: NatureLearningRecordInput[];
  garden_project_records: GardenProjectRecordInput[];
  exploration_records: ExplorationRecordInput[];
  outdoor_safety_records: OutdoorSafetyRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type OutdoorNatureRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface OutdoorNatureInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface OutdoorNatureRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface OutdoorNatureResult {
  outdoor_rating: OutdoorNatureRating;
  outdoor_score: number;
  headline: string;
  outdoor_frequency_rate: number;
  nature_learning_rate: number;
  garden_participation_rate: number;
  exploration_diversity_rate: number;
  safety_compliance_rate: number;
  child_enjoyment_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: OutdoorNatureRecommendation[];
  insights: OutdoorNatureInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): OutdoorNatureRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: OutdoorNatureRating,
  score: number,
  headline: string,
): OutdoorNatureResult {
  return {
    outdoor_rating: rating,
    outdoor_score: score,
    headline,
    outdoor_frequency_rate: 0,
    nature_learning_rate: 0,
    garden_participation_rate: 0,
    exploration_diversity_rate: 0,
    safety_compliance_rate: 0,
    child_enjoyment_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeOutdoorNatureEngagement(
  input: OutdoorNatureInput,
): OutdoorNatureResult {
  const {
    total_children,
    outdoor_activity_records,
    nature_learning_records,
    garden_project_records,
    exploration_records,
    outdoor_safety_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    outdoor_activity_records.length === 0 &&
    nature_learning_records.length === 0 &&
    garden_project_records.length === 0 &&
    exploration_records.length === 0 &&
    outdoor_safety_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess outdoor and nature engagement.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No outdoor or nature engagement data recorded despite children on placement -- outdoor activity provision, nature-based learning, and environmental exploration require urgent attention.",
      ),
      concerns: [
        "No outdoor activity, nature learning, garden project, exploration, or outdoor safety records exist despite children being on placement -- the home cannot evidence that children have regular access to outdoor experiences and nature-based activities.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of outdoor activities, nature-based learning, garden projects, environmental exploration, and outdoor safety management to evidence the home's commitment to children's outdoor experiences and physical wellbeing.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Develop an outdoor activity programme that provides every child with regular opportunities for outdoor play, nature exploration, and environmental learning, embedded in each child's care plan.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 6 -- Quality and purpose of care standard",
        },
      ],
      insights: [
        {
          text: "The complete absence of outdoor and nature engagement records means Ofsted cannot verify that children enjoy regular outdoor experiences, physical activity, and connection with the natural environment. This represents a fundamental gap in evidencing quality of care under Reg 5 and Reg 6.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Outdoor activity frequency ---
  const totalOutdoorRecords = outdoor_activity_records.length;
  const uniqueChildrenOutdoor = new Set(
    outdoor_activity_records.map((r) => r.child_id),
  ).size;
  const outdoorFrequencyRate = pct(uniqueChildrenOutdoor, total_children);

  const willingParticipation = outdoor_activity_records.filter((r) => r.participation_willing).length;
  const willingRate = pct(willingParticipation, totalOutdoorRecords);

  const childInitiatedOutdoor = outdoor_activity_records.filter((r) => r.child_initiated).length;
  const childInitiatedRate = pct(childInitiatedOutdoor, totalOutdoorRecords);

  const staffLedOutdoor = outdoor_activity_records.filter((r) => r.staff_led).length;
  const staffLedRate = pct(staffLedOutdoor, totalOutdoorRecords);

  const outdoorEnjoymentSum = outdoor_activity_records.reduce(
    (sum, r) => sum + r.child_enjoyment, 0,
  );
  const outdoorEnjoymentAvg =
    totalOutdoorRecords > 0
      ? Math.round((outdoorEnjoymentSum / totalOutdoorRecords) * 100) / 100
      : 0;

  const weatherAppropriate = outdoor_activity_records.filter((r) => r.weather_appropriate_clothing).length;
  const weatherClothingRate = pct(weatherAppropriate, totalOutdoorRecords);

  const riskAssessedActivities = outdoor_activity_records.filter((r) => r.risk_assessment_completed).length;
  const activityRiskAssessmentRate = pct(riskAssessedActivities, totalOutdoorRecords);

  const uniqueLocations = new Set(
    outdoor_activity_records.map((r) => r.location),
  ).size;

  const uniqueActivityTypes = new Set(
    outdoor_activity_records.map((r) => r.activity_type),
  ).size;

  const activitiesWithSkills = outdoor_activity_records.filter((r) => r.skills_developed.length > 0).length;
  const skillsDevelopmentRate = pct(activitiesWithSkills, totalOutdoorRecords);

  // --- Nature-based learning ---
  const totalNatureLearning = nature_learning_records.length;
  const uniqueChildrenNature = new Set(
    nature_learning_records.map((r) => r.child_id),
  ).size;

  const objectivesSet = nature_learning_records.filter((r) => r.learning_objectives_set).length;
  const objectivesSetRate = pct(objectivesSet, totalNatureLearning);

  const objectivesMet = nature_learning_records.filter((r) => r.learning_objectives_met).length;
  const objectivesMetRate = pct(objectivesMet, totalNatureLearning);

  const natureEngagementSum = nature_learning_records.reduce(
    (sum, r) => sum + r.child_engagement, 0,
  );
  const natureEngagementAvg =
    totalNatureLearning > 0
      ? Math.round((natureEngagementSum / totalNatureLearning) * 100) / 100
      : 0;

  const natureVoiceCaptured = nature_learning_records.filter((r) => r.child_voice_captured).length;
  const natureVoiceRate = pct(natureVoiceCaptured, totalNatureLearning);

  const linkedToEducation = nature_learning_records.filter((r) => r.linked_to_education).length;
  const educationLinkRate = pct(linkedToEducation, totalNatureLearning);

  const natureResourcesProvided = nature_learning_records.filter((r) => r.resources_provided).length;
  const natureResourceRate = pct(natureResourcesProvided, totalNatureLearning);

  const outcomesDocumented = nature_learning_records.filter((r) => r.outcome_documented).length;
  const outcomeDocRate = pct(outcomesDocumented, totalNatureLearning);

  const natureLearningRate =
    totalNatureLearning > 0
      ? Math.round((objectivesMetRate + pct(uniqueChildrenNature, total_children) + outcomeDocRate) / 3)
      : 0;

  const uniqueLearningTypes = new Set(
    nature_learning_records.map((r) => r.learning_type),
  ).size;

  // --- Garden/allotment projects ---
  const totalGardenRecords = garden_project_records.length;
  const uniqueChildrenGarden = new Set(
    garden_project_records.map((r) => r.child_id),
  ).size;

  const gardenParticipating = garden_project_records.filter((r) => r.child_participation).length;
  const gardenParticipationRate = pct(gardenParticipating, totalGardenRecords);

  const gardenChildLed = garden_project_records.filter((r) => r.child_led).length;
  const gardenChildLedRate = pct(gardenChildLed, totalGardenRecords);

  const gardenActive = garden_project_records.filter((r) => r.active).length;
  const gardenActiveRate = pct(gardenActive, totalGardenRecords);

  const responsibilityAssigned = garden_project_records.filter((r) => r.responsibility_assigned).length;
  const responsibilityRate = pct(responsibilityAssigned, totalGardenRecords);

  const progressDocumented = garden_project_records.filter((r) => r.progress_documented).length;
  const gardenProgressDocRate = pct(progressDocumented, totalGardenRecords);

  const therapeuticBenefit = garden_project_records.filter((r) => r.therapeutic_benefit_noted).length;
  const therapeuticRate = pct(therapeuticBenefit, totalGardenRecords);

  const harvestUsed = garden_project_records.filter((r) => r.harvest_used).length;
  const harvestUsedRate = pct(harvestUsed, totalGardenRecords);

  const gardenSatisfactionSum = garden_project_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const gardenSatisfactionAvg =
    totalGardenRecords > 0
      ? Math.round((gardenSatisfactionSum / totalGardenRecords) * 100) / 100
      : 0;

  const gardenWithSkills = garden_project_records.filter((r) => r.skills_gained.length > 0).length;
  const gardenSkillsRate = pct(gardenWithSkills, totalGardenRecords);

  const uniqueProjectTypes = new Set(
    garden_project_records.map((r) => r.project_type),
  ).size;

  // --- Environmental exploration diversity ---
  const totalExplorationRecords = exploration_records.length;
  const uniqueChildrenExploration = new Set(
    exploration_records.map((r) => r.child_id),
  ).size;

  const newEnvironments = exploration_records.filter((r) => r.new_environment).length;
  const newEnvironmentRate = pct(newEnvironments, totalExplorationRecords);

  const childChoiceExploration = exploration_records.filter((r) => r.child_choice).length;
  const childChoiceRate = pct(childChoiceExploration, totalExplorationRecords);

  const sensoryEngaged = exploration_records.filter((r) => r.sensory_engagement).length;
  const sensoryEngagementRate = pct(sensoryEngaged, totalExplorationRecords);

  const discoveryDocumented = exploration_records.filter((r) => r.discovery_documented).length;
  const discoveryDocRate = pct(discoveryDocumented, totalExplorationRecords);

  const explorationEnjoymentSum = exploration_records.reduce(
    (sum, r) => sum + r.child_enjoyment, 0,
  );
  const explorationEnjoymentAvg =
    totalExplorationRecords > 0
      ? Math.round((explorationEnjoymentSum / totalExplorationRecords) * 100) / 100
      : 0;

  const educationalExploration = exploration_records.filter((r) => r.educational_value).length;
  const educationalExplorationRate = pct(educationalExploration, totalExplorationRecords);

  const repeatRequested = exploration_records.filter((r) => r.repeat_requested).length;
  const repeatRequestRate = pct(repeatRequested, totalExplorationRecords);

  const uniqueExplorationTypes = new Set(
    exploration_records.map((r) => r.exploration_type),
  ).size;

  const explorationDiversityRate =
    totalExplorationRecords > 0
      ? Math.round((newEnvironmentRate + pct(uniqueExplorationTypes, 5) + sensoryEngagementRate) / 3)
      : 0;

  // --- Outdoor safety compliance ---
  const totalSafetyRecords = outdoor_safety_records.length;

  const safetyCompleted = outdoor_safety_records.filter((r) => r.completed).length;
  const safetyCompletionRate = pct(safetyCompleted, totalSafetyRecords);

  const safetyCompliant = outdoor_safety_records.filter((r) => r.compliant).length;
  const safetyComplianceRate = pct(safetyCompliant, totalSafetyRecords);

  const totalSafetyIssues = outdoor_safety_records.reduce(
    (sum, r) => sum + r.issues_found, 0,
  );
  const totalSafetyIssuesResolved = outdoor_safety_records.reduce(
    (sum, r) => sum + r.issues_resolved, 0,
  );
  const safetyIssueResolutionRate = pct(totalSafetyIssuesResolved, totalSafetyIssues);

  const safetyStaffTrained = outdoor_safety_records.filter((r) => r.staff_trained).length;
  const safetyTrainingRate = pct(safetyStaffTrained, totalSafetyRecords);

  const uniqueSafetyTypes = new Set(
    outdoor_safety_records.map((r) => r.safety_type),
  ).size;

  // --- Child enjoyment composite ---
  const enjoymentCount =
    (totalOutdoorRecords > 0 ? 1 : 0) +
    (totalExplorationRecords > 0 ? 1 : 0) +
    (totalGardenRecords > 0 ? 1 : 0);
  const enjoymentSumComposite =
    (totalOutdoorRecords > 0 ? outdoorEnjoymentAvg : 0) +
    (totalExplorationRecords > 0 ? explorationEnjoymentAvg : 0) +
    (totalGardenRecords > 0 ? gardenSatisfactionAvg : 0);
  const childEnjoymentAvg =
    enjoymentCount > 0
      ? Math.round((enjoymentSumComposite / enjoymentCount) * 100) / 100
      : 0;
  const childEnjoymentRate = enjoymentCount > 0 ? Math.round((childEnjoymentAvg / 5) * 100) : 0;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: outdoorFrequencyRate (>=90: +4, >=70: +2) ---
  if (outdoorFrequencyRate >= 90) score += 4;
  else if (outdoorFrequencyRate >= 70) score += 2;

  // --- Bonus 2: natureLearningRate (>=80: +3, >=60: +1) ---
  if (natureLearningRate >= 80) score += 3;
  else if (natureLearningRate >= 60) score += 1;

  // --- Bonus 3: gardenParticipationRate (>=90: +3, >=70: +1) ---
  if (gardenParticipationRate >= 90) score += 3;
  else if (gardenParticipationRate >= 70) score += 1;

  // --- Bonus 4: explorationDiversityRate (>=80: +3, >=60: +1) ---
  if (explorationDiversityRate >= 80) score += 3;
  else if (explorationDiversityRate >= 60) score += 1;

  // --- Bonus 5: safetyComplianceRate (>=95: +4, >=80: +2) ---
  if (safetyComplianceRate >= 95) score += 4;
  else if (safetyComplianceRate >= 80) score += 2;

  // --- Bonus 6: childEnjoymentRate (>=80: +3, >=60: +1) ---
  if (childEnjoymentRate >= 80) score += 3;
  else if (childEnjoymentRate >= 60) score += 1;

  // --- Bonus 7: childInitiatedRate (>=50: +3, >=30: +1) ---
  if (childInitiatedRate >= 50) score += 3;
  else if (childInitiatedRate >= 30) score += 1;

  // --- Bonus 8: educationLinkRate (>=70: +3, >=50: +1) ---
  if (educationLinkRate >= 70) score += 3;
  else if (educationLinkRate >= 50) score += 1;

  // --- Bonus 9: safetyIssueResolutionRate (>=90: +2, >=70: +1) ---
  if (safetyIssueResolutionRate >= 90 && totalSafetyIssues > 0) score += 2;
  else if (safetyIssueResolutionRate >= 70 && totalSafetyIssues > 0) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // outdoorFrequencyRate < 40 -> -5
  if (outdoorFrequencyRate < 40 && totalOutdoorRecords > 0) score -= 5;

  // safetyComplianceRate < 50 -> -5
  if (safetyComplianceRate < 50 && totalSafetyRecords > 0) score -= 5;

  // natureLearningRate < 30 -> -4
  if (natureLearningRate < 30 && totalNatureLearning > 0) score -= 4;

  // childEnjoymentRate < 40 -> -4
  if (childEnjoymentRate < 40 && enjoymentCount > 0) score -= 4;

  score = clamp(score, 0, 100);

  const outdoor_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (outdoorFrequencyRate >= 90 && totalOutdoorRecords > 0) {
    strengths.push(
      `${outdoorFrequencyRate}% of children have recorded outdoor activity -- the home demonstrates excellent commitment to ensuring every child accesses regular outdoor experiences.`,
    );
  } else if (outdoorFrequencyRate >= 70 && totalOutdoorRecords > 0) {
    strengths.push(
      `${outdoorFrequencyRate}% of children participate in outdoor activities -- most children are accessing regular outdoor experiences.`,
    );
  }

  if (willingRate >= 90 && totalOutdoorRecords > 0) {
    strengths.push(
      `${willingRate}% willing participation rate -- children are enthusiastic about outdoor activities, suggesting the programme is well-matched to their interests.`,
    );
  }

  if (childInitiatedRate >= 50 && totalOutdoorRecords > 0) {
    strengths.push(
      `${childInitiatedRate}% of outdoor activities are child-initiated -- children are empowered to choose and lead their own outdoor experiences.`,
    );
  }

  if (outdoorEnjoymentAvg >= 4.0 && totalOutdoorRecords > 0) {
    strengths.push(
      `Children's enjoyment of outdoor activities averages ${outdoorEnjoymentAvg}/5 -- children genuinely enjoy their time outdoors, evidencing positive wellbeing outcomes.`,
    );
  }

  if (uniqueLocations >= 5 && totalOutdoorRecords > 0) {
    strengths.push(
      `Outdoor activities take place across ${uniqueLocations} different locations -- children experience diverse outdoor environments.`,
    );
  }

  if (uniqueActivityTypes >= 5 && totalOutdoorRecords > 0) {
    strengths.push(
      `${uniqueActivityTypes} different types of outdoor activity offered -- the programme provides rich variety and breadth of outdoor experiences.`,
    );
  }

  if (skillsDevelopmentRate >= 70 && totalOutdoorRecords > 0) {
    strengths.push(
      `Skills development documented in ${skillsDevelopmentRate}% of outdoor activities -- outdoor time is used purposefully to build children's capabilities and confidence.`,
    );
  }

  if (weatherClothingRate >= 90 && totalOutdoorRecords > 0) {
    strengths.push(
      `${weatherClothingRate}% of activities have weather-appropriate clothing provided -- children are properly equipped for outdoor conditions.`,
    );
  }

  if (natureLearningRate >= 80 && totalNatureLearning > 0) {
    strengths.push(
      `Nature learning rate at ${natureLearningRate}% -- nature-based learning is well planned, delivered, and documented with strong outcomes for children.`,
    );
  } else if (natureLearningRate >= 60 && totalNatureLearning > 0) {
    strengths.push(
      `Nature learning rate at ${natureLearningRate}% -- good progress in embedding nature-based learning into children's experiences.`,
    );
  }

  if (objectivesMetRate >= 80 && totalNatureLearning > 0) {
    strengths.push(
      `${objectivesMetRate}% of nature learning objectives met -- structured nature education is delivering meaningful outcomes for children.`,
    );
  }

  if (natureEngagementAvg >= 4.0 && totalNatureLearning > 0) {
    strengths.push(
      `Children's engagement with nature learning averages ${natureEngagementAvg}/5 -- children are actively interested and involved in nature-based education.`,
    );
  }

  if (educationLinkRate >= 70 && totalNatureLearning > 0) {
    strengths.push(
      `${educationLinkRate}% of nature learning linked to formal education -- the home effectively bridges outdoor learning with children's educational progress.`,
    );
  }

  if (uniqueLearningTypes >= 4 && totalNatureLearning > 0) {
    strengths.push(
      `${uniqueLearningTypes} different nature learning approaches used -- children benefit from diverse methods including forest school, wildlife watching, and eco-projects.`,
    );
  }

  if (gardenParticipationRate >= 90 && totalGardenRecords > 0) {
    strengths.push(
      `${gardenParticipationRate}% garden project participation -- children are actively engaged in growing, nurturing, and sustaining garden projects.`,
    );
  } else if (gardenParticipationRate >= 70 && totalGardenRecords > 0) {
    strengths.push(
      `${gardenParticipationRate}% participation in garden projects -- most children engage meaningfully with gardening and growing activities.`,
    );
  }

  if (gardenChildLedRate >= 50 && totalGardenRecords > 0) {
    strengths.push(
      `${gardenChildLedRate}% of garden projects are child-led -- children take ownership and responsibility for their growing projects.`,
    );
  }

  if (therapeuticRate >= 60 && totalGardenRecords > 0) {
    strengths.push(
      `Therapeutic benefit noted in ${therapeuticRate}% of garden activities -- gardening is effectively used to support children's emotional wellbeing and regulation.`,
    );
  }

  if (harvestUsedRate >= 50 && totalGardenRecords > 0) {
    strengths.push(
      `Harvest used in cooking/home life in ${harvestUsedRate}% of projects -- children see tangible results from their growing efforts, building pride and life skills.`,
    );
  }

  if (gardenSatisfactionAvg >= 4.0 && totalGardenRecords > 0) {
    strengths.push(
      `Children's satisfaction with garden projects averages ${gardenSatisfactionAvg}/5 -- children find gardening rewarding and enjoyable.`,
    );
  }

  if (explorationDiversityRate >= 80 && totalExplorationRecords > 0) {
    strengths.push(
      `Exploration diversity rate at ${explorationDiversityRate}% -- children experience a rich variety of natural environments and exploration activities.`,
    );
  } else if (explorationDiversityRate >= 60 && totalExplorationRecords > 0) {
    strengths.push(
      `Exploration diversity rate at ${explorationDiversityRate}% -- good range of environmental exploration opportunities for children.`,
    );
  }

  if (newEnvironmentRate >= 50 && totalExplorationRecords > 0) {
    strengths.push(
      `${newEnvironmentRate}% of explorations involve new environments -- children regularly discover and experience unfamiliar natural settings.`,
    );
  }

  if (sensoryEngagementRate >= 70 && totalExplorationRecords > 0) {
    strengths.push(
      `Sensory engagement documented in ${sensoryEngagementRate}% of explorations -- children are fully immersing themselves in the natural world.`,
    );
  }

  if (childChoiceRate >= 60 && totalExplorationRecords > 0) {
    strengths.push(
      `${childChoiceRate}% of explorations reflect children's choices -- the exploration programme is genuinely child-centred.`,
    );
  }

  if (repeatRequestRate >= 40 && totalExplorationRecords > 0) {
    strengths.push(
      `${repeatRequestRate}% of explorations have repeat requests -- children enjoy their experiences enough to want to return, demonstrating positive engagement.`,
    );
  }

  if (safetyComplianceRate >= 95 && totalSafetyRecords > 0) {
    strengths.push(
      `${safetyComplianceRate}% outdoor safety compliance -- excellent safety management ensures children can enjoy outdoor activities with confidence.`,
    );
  } else if (safetyComplianceRate >= 80 && totalSafetyRecords > 0) {
    strengths.push(
      `${safetyComplianceRate}% outdoor safety compliance -- robust safety arrangements support children's outdoor experiences.`,
    );
  }

  if (safetyIssueResolutionRate >= 90 && totalSafetyIssues > 0) {
    strengths.push(
      `${safetyIssueResolutionRate}% of outdoor safety issues resolved -- the home responds effectively and promptly to safety concerns.`,
    );
  }

  if (safetyTrainingRate >= 80 && totalSafetyRecords > 0) {
    strengths.push(
      `${safetyTrainingRate}% of safety checks involve trained staff -- outdoor safety is underpinned by competent, knowledgeable staff.`,
    );
  }

  if (activityRiskAssessmentRate >= 90 && totalOutdoorRecords > 0) {
    strengths.push(
      `Risk assessments completed for ${activityRiskAssessmentRate}% of outdoor activities -- thorough risk management enables children to enjoy adventurous outdoor experiences safely.`,
    );
  }

  if (childEnjoymentRate >= 80 && enjoymentCount > 0) {
    strengths.push(
      `Composite child enjoyment rate at ${childEnjoymentRate}% -- children consistently derive pleasure and satisfaction from their outdoor and nature experiences.`,
    );
  }

  if (natureVoiceRate >= 80 && totalNatureLearning > 0) {
    strengths.push(
      `Child voice captured in ${natureVoiceRate}% of nature learning sessions -- children's views genuinely shape their nature-based education.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (outdoorFrequencyRate < 40 && totalOutdoorRecords > 0) {
    concerns.push(
      `Only ${outdoorFrequencyRate}% of children have recorded outdoor activity -- the majority of children are not evidenced as accessing regular outdoor experiences, denying them the physical and emotional benefits of time in nature.`,
    );
  } else if (outdoorFrequencyRate < 70 && outdoorFrequencyRate >= 40 && totalOutdoorRecords > 0) {
    concerns.push(
      `Outdoor activity coverage at ${outdoorFrequencyRate}% -- some children are not regularly accessing outdoor experiences.`,
    );
  }

  if (outdoorEnjoymentAvg < 3.0 && totalOutdoorRecords > 0) {
    concerns.push(
      `Children's enjoyment of outdoor activities averages only ${outdoorEnjoymentAvg}/5 -- activities may not be well-matched to children's interests or abilities.`,
    );
  }

  if (willingRate < 50 && totalOutdoorRecords > 0) {
    concerns.push(
      `Only ${willingRate}% willing participation in outdoor activities -- many children are reluctant to engage, which may indicate activities are not appealing or accessible.`,
    );
  }

  if (weatherClothingRate < 70 && totalOutdoorRecords > 0) {
    concerns.push(
      `Weather-appropriate clothing provided in only ${weatherClothingRate}% of outdoor activities -- children may be deterred from or uncomfortable during outdoor time.`,
    );
  }

  if (activityRiskAssessmentRate < 50 && totalOutdoorRecords > 0) {
    concerns.push(
      `Risk assessments completed for only ${activityRiskAssessmentRate}% of outdoor activities -- insufficient risk management places children at potential risk during outdoor experiences.`,
    );
  }

  if (natureLearningRate < 30 && totalNatureLearning > 0) {
    concerns.push(
      `Nature learning rate at only ${natureLearningRate}% -- nature-based education is poorly planned, delivered, or documented, missing opportunities for children's development.`,
    );
  } else if (natureLearningRate < 60 && natureLearningRate >= 30 && totalNatureLearning > 0) {
    concerns.push(
      `Nature learning rate at ${natureLearningRate}% -- nature-based learning needs strengthening to maximise educational and developmental outcomes.`,
    );
  }

  if (objectivesMetRate < 50 && totalNatureLearning > 0) {
    concerns.push(
      `Only ${objectivesMetRate}% of nature learning objectives met -- structured nature education is not delivering intended outcomes for children.`,
    );
  }

  if (natureEngagementAvg < 3.0 && totalNatureLearning > 0) {
    concerns.push(
      `Children's engagement with nature learning averages only ${natureEngagementAvg}/5 -- nature-based activities are not capturing children's interest.`,
    );
  }

  if (educationLinkRate < 30 && totalNatureLearning > 0) {
    concerns.push(
      `Only ${educationLinkRate}% of nature learning linked to formal education -- opportunities to connect outdoor learning with educational progress are being missed.`,
    );
  }

  if (gardenParticipationRate < 40 && totalGardenRecords > 0) {
    concerns.push(
      `Only ${gardenParticipationRate}% garden project participation -- the majority of children are not engaging with garden and growing activities.`,
    );
  } else if (gardenParticipationRate < 70 && gardenParticipationRate >= 40 && totalGardenRecords > 0) {
    concerns.push(
      `Garden participation at ${gardenParticipationRate}% -- not all children are engaging with garden projects and growing activities.`,
    );
  }

  if (gardenActiveRate < 50 && totalGardenRecords > 0) {
    concerns.push(
      `Only ${gardenActiveRate}% of garden projects are active -- many projects appear to have stalled or been abandoned, wasting opportunities for ongoing engagement.`,
    );
  }

  if (explorationDiversityRate < 30 && totalExplorationRecords > 0) {
    concerns.push(
      `Exploration diversity rate at only ${explorationDiversityRate}% -- children are not experiencing a sufficient variety of natural environments and exploration activities.`,
    );
  } else if (explorationDiversityRate < 60 && explorationDiversityRate >= 30 && totalExplorationRecords > 0) {
    concerns.push(
      `Exploration diversity at ${explorationDiversityRate}% -- the range of environmental exploration experiences needs broadening.`,
    );
  }

  if (newEnvironmentRate < 20 && totalExplorationRecords > 0) {
    concerns.push(
      `Only ${newEnvironmentRate}% of explorations involve new environments -- children are not being exposed to new natural settings, limiting their environmental awareness.`,
    );
  }

  if (sensoryEngagementRate < 40 && totalExplorationRecords > 0) {
    concerns.push(
      `Sensory engagement documented in only ${sensoryEngagementRate}% of explorations -- children are not fully immersing in outdoor experiences.`,
    );
  }

  if (safetyComplianceRate < 50 && totalSafetyRecords > 0) {
    concerns.push(
      `Only ${safetyComplianceRate}% outdoor safety compliance -- the majority of safety checks are non-compliant, creating unacceptable risk for children during outdoor activities.`,
    );
  } else if (safetyComplianceRate < 80 && safetyComplianceRate >= 50 && totalSafetyRecords > 0) {
    concerns.push(
      `Outdoor safety compliance at ${safetyComplianceRate}% -- safety management needs strengthening to ensure children are protected during outdoor activities.`,
    );
  }

  if (safetyIssueResolutionRate < 50 && totalSafetyIssues > 0) {
    concerns.push(
      `Only ${safetyIssueResolutionRate}% of outdoor safety issues resolved -- unresolved safety issues represent ongoing risk to children.`,
    );
  }

  if (safetyTrainingRate < 50 && totalSafetyRecords > 0) {
    concerns.push(
      `Only ${safetyTrainingRate}% of safety checks involve trained staff -- insufficient outdoor safety training compromises children's safety.`,
    );
  }

  if (childEnjoymentRate < 40 && enjoymentCount > 0) {
    concerns.push(
      `Composite child enjoyment rate at only ${childEnjoymentRate}% -- children are not finding outdoor and nature experiences satisfying, suggesting the programme needs redesigning around children's interests.`,
    );
  } else if (childEnjoymentRate < 60 && childEnjoymentRate >= 40 && enjoymentCount > 0) {
    concerns.push(
      `Child enjoyment rate at ${childEnjoymentRate}% -- outdoor and nature experiences are not consistently enjoyable for children.`,
    );
  }

  if (totalOutdoorRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No outdoor activity records despite children being on placement -- the home may not be recording or providing regular outdoor experiences for children.",
    );
  }

  if (totalNatureLearning === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No nature-based learning records -- the home has not documented any nature education activities, missing opportunities to connect children with the natural world.",
    );
  }

  if (totalSafetyRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No outdoor safety records -- the home cannot evidence that outdoor safety management is in place, including risk assessments, equipment checks, and supervision arrangements.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: OutdoorNatureRecommendation[] = [];
  let rank = 0;

  if (outdoorFrequencyRate < 40 && totalOutdoorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review outdoor activity provision to ensure every child has regular, recorded access to outdoor experiences -- develop an outdoor activity timetable that provides at least daily outdoor time for all children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (safetyComplianceRate < 50 && totalSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately review and strengthen outdoor safety management -- ensure all outdoor activities have completed risk assessments, equipment checks, and appropriate supervision ratios before children participate.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (activityRiskAssessmentRate < 50 && totalOutdoorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete risk assessments for all outdoor activities -- every outdoor experience must have a documented risk assessment to ensure children can enjoy activities safely.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (childEnjoymentRate < 40 && enjoymentCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Redesign the outdoor programme around children's interests and preferences -- consult children about the types of outdoor activities they enjoy and find meaningful. Low enjoyment suggests activities are not child-centred.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (totalSafetyRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish outdoor safety management records immediately -- implement risk assessments, equipment checks, weather assessments, and supervision ratio documentation for all outdoor activities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (natureLearningRate < 30 && totalNatureLearning > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen nature-based learning by setting clear learning objectives, documenting outcomes, and ensuring all children can participate. Consider forest school or wildlife watch programmes to embed structured nature education.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality and purpose of care standard",
    });
  }

  if (safetyIssueResolutionRate < 50 && totalSafetyIssues > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address all unresolved outdoor safety issues as a priority -- track each issue to resolution and ensure corrective actions are documented and verified before activities resume.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (outdoorFrequencyRate >= 40 && outdoorFrequencyRate < 70 && totalOutdoorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase outdoor activity participation to cover at least 70% of children -- review barriers to participation and ensure rotas and staffing enable regular outdoor time for every child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (gardenParticipationRate < 40 && totalGardenRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop garden and growing projects that appeal to children's interests -- offer variety (vegetables, flowers, wildlife habitats) and assign individual responsibilities to build ownership and engagement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality and purpose of care standard",
    });
  }

  if (explorationDiversityRate < 30 && totalExplorationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Broaden the range of environmental exploration experiences -- introduce visits to woodlands, beaches, farms, nature reserves, and rivers. Encourage children to choose destinations and plan exploration activities.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (educationLinkRate < 30 && totalNatureLearning > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Link nature-based learning to children's educational plans -- collaborate with schools and tutors to connect outdoor learning with curriculum subjects, maximising educational benefit.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality and purpose of care standard",
    });
  }

  if (safetyTrainingRate < 50 && totalSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide outdoor safety training for all staff involved in outdoor activities -- training should cover risk assessment, first aid, weather-appropriate preparation, water safety, and supervision ratios.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (weatherClothingRate < 70 && totalOutdoorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children have access to weather-appropriate outdoor clothing -- stock waterproofs, sun hats, warm layers, and suitable footwear so weather does not prevent outdoor activity.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (natureLearningRate >= 30 && natureLearningRate < 60 && totalNatureLearning > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve nature learning outcomes by ensuring clear objectives are set and met for each session, and that learning is documented and reviewed with children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality and purpose of care standard",
    });
  }

  if (gardenParticipationRate >= 40 && gardenParticipationRate < 70 && totalGardenRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase garden project participation by involving children in project planning, offering seasonal activities, and celebrating harvests through cooking and sharing.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality and purpose of care standard",
    });
  }

  if (explorationDiversityRate >= 30 && explorationDiversityRate < 60 && totalExplorationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand the diversity of exploration experiences -- introduce new types of environmental exploration such as den building, foraging walks, or river studies to enrich children's connection with nature.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (totalOutdoorRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording all outdoor activities with details of participation, child enjoyment, and skills developed to evidence the home's outdoor activity provision.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (totalNatureLearning === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce nature-based learning opportunities and record activities, objectives, and outcomes to demonstrate how the home connects children with the natural environment.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality and purpose of care standard",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: OutdoorNatureInsight[] = [];

  // --- Critical insights ---

  if (outdoorFrequencyRate < 40 && totalOutdoorRecords > 0) {
    insights.push({
      text: `Only ${outdoorFrequencyRate}% of children have recorded outdoor activity. Ofsted expects children to enjoy regular access to outdoor experiences as part of quality care. Limited outdoor provision restricts children's physical health, emotional regulation, and sense of adventure -- a direct concern under Reg 5.`,
      severity: "critical",
    });
  }

  if (safetyComplianceRate < 50 && totalSafetyRecords > 0) {
    insights.push({
      text: `Only ${safetyComplianceRate}% outdoor safety compliance. Failing to maintain safe outdoor environments places children at unacceptable risk. Ofsted will view non-compliant safety management as a fundamental failure to protect children during outdoor activities.`,
      severity: "critical",
    });
  }

  if (activityRiskAssessmentRate < 50 && totalOutdoorRecords > 0) {
    insights.push({
      text: `Risk assessments completed for only ${activityRiskAssessmentRate}% of outdoor activities. Without adequate risk assessment, the home cannot demonstrate that outdoor activities are safely planned and managed -- this will be a significant concern at inspection.`,
      severity: "critical",
    });
  }

  if (childEnjoymentRate < 40 && enjoymentCount > 0) {
    insights.push({
      text: `Child enjoyment rate at only ${childEnjoymentRate}%. When children do not enjoy outdoor experiences, the programme is failing in its fundamental purpose. Ofsted expects outdoor activities to be enriching, enjoyable, and matched to children's interests and developmental needs.`,
      severity: "critical",
    });
  }

  if (totalOutdoorRecords === 0 && totalSafetyRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No outdoor activity or safety records despite children being on placement. Ofsted may interpret the absence of records as evidence that children do not have regular access to outdoor experiences and that outdoor safety is not managed -- this is a significant omission under Reg 5.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (outdoorFrequencyRate >= 40 && outdoorFrequencyRate < 70 && totalOutdoorRecords > 0) {
    insights.push({
      text: `Outdoor activity coverage at ${outdoorFrequencyRate}% -- improving but some children are missing out on regular outdoor experiences. Each child should have daily access to outdoor time as a minimum standard.`,
      severity: "warning",
    });
  }

  if (natureLearningRate >= 30 && natureLearningRate < 80 && totalNatureLearning > 0) {
    insights.push({
      text: `Nature learning rate at ${natureLearningRate}% -- nature-based education is partially effective but not yet consistently delivering strong outcomes for all children.`,
      severity: "warning",
    });
  }

  if (gardenParticipationRate >= 40 && gardenParticipationRate < 70 && totalGardenRecords > 0) {
    insights.push({
      text: `Garden participation at ${gardenParticipationRate}% -- some children are engaged with growing projects but participation needs to be more inclusive and sustained.`,
      severity: "warning",
    });
  }

  if (explorationDiversityRate >= 30 && explorationDiversityRate < 60 && totalExplorationRecords > 0) {
    insights.push({
      text: `Exploration diversity at ${explorationDiversityRate}% -- children would benefit from a wider range of environments and exploration types to build their confidence and connection with nature.`,
      severity: "warning",
    });
  }

  if (safetyComplianceRate >= 50 && safetyComplianceRate < 80 && totalSafetyRecords > 0) {
    insights.push({
      text: `Outdoor safety compliance at ${safetyComplianceRate}% -- while most checks are completed, gaps in compliance create avoidable risk. Consistent safety management is essential for enabling adventurous outdoor activity.`,
      severity: "warning",
    });
  }

  if (childEnjoymentRate >= 40 && childEnjoymentRate < 60 && enjoymentCount > 0) {
    insights.push({
      text: `Child enjoyment rate at ${childEnjoymentRate}% -- outdoor experiences are not consistently enjoyable. Consider consulting children more actively about what outdoor activities they would find rewarding.`,
      severity: "warning",
    });
  }

  if (educationLinkRate >= 30 && educationLinkRate < 70 && totalNatureLearning > 0) {
    insights.push({
      text: `Education link rate at ${educationLinkRate}% -- some nature learning connects to formal education but there is scope to strengthen this link, enhancing children's academic and personal development.`,
      severity: "warning",
    });
  }

  if (safetyIssueResolutionRate >= 50 && safetyIssueResolutionRate < 90 && totalSafetyIssues > 0) {
    insights.push({
      text: `Safety issue resolution at ${safetyIssueResolutionRate}% -- while most issues are addressed, unresolved safety concerns should be tracked and closed promptly to maintain safe outdoor environments.`,
      severity: "warning",
    });
  }

  if (weatherClothingRate >= 50 && weatherClothingRate < 90 && totalOutdoorRecords > 0) {
    insights.push({
      text: `Weather-appropriate clothing at ${weatherClothingRate}% -- ensuring children are properly equipped for all weather conditions prevents discomfort and barriers to outdoor activity.`,
      severity: "warning",
    });
  }

  // --- Diversity insights ---
  if (uniqueActivityTypes >= 6 && uniqueLocations >= 5 && totalOutdoorRecords > 0) {
    insights.push({
      text: `The home offers ${uniqueActivityTypes} activity types across ${uniqueLocations} different locations -- this breadth provides children with rich and varied outdoor experiences that build resilience, confidence, and a love of the natural world.`,
      severity: "positive",
    });
  }

  // --- Positive insights ---

  if (outdoor_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding outdoor and nature engagement -- children enjoy regular, diverse, and safe outdoor experiences with strong nature-based learning and genuine connection to the natural environment. This is compelling evidence of quality care under Reg 5 and Reg 6.",
      severity: "positive",
    });
  }

  if (outdoorFrequencyRate >= 90 && childEnjoymentRate >= 80 && totalOutdoorRecords > 0 && enjoymentCount > 0) {
    insights.push({
      text: `${outdoorFrequencyRate}% outdoor coverage with ${childEnjoymentRate}% child enjoyment -- children are not only accessing regular outdoor experiences but genuinely enjoying them. Ofsted will recognise this as evidence of child-centred, enriching care.`,
      severity: "positive",
    });
  }

  if (safetyComplianceRate >= 95 && activityRiskAssessmentRate >= 90 && totalSafetyRecords > 0 && totalOutdoorRecords > 0) {
    insights.push({
      text: `${safetyComplianceRate}% safety compliance with ${activityRiskAssessmentRate}% risk assessment completion -- the home demonstrates that robust safety management enables rather than restricts adventurous outdoor activity. This is exemplary practice.`,
      severity: "positive",
    });
  }

  if (natureLearningRate >= 80 && educationLinkRate >= 70 && totalNatureLearning > 0) {
    insights.push({
      text: `Nature learning rate at ${natureLearningRate}% with ${educationLinkRate}% education linkage -- the home effectively uses nature-based learning to support children's educational and personal development. This bridges outdoor experiences with formal learning outcomes.`,
      severity: "positive",
    });
  }

  if (gardenParticipationRate >= 90 && gardenChildLedRate >= 50 && totalGardenRecords > 0) {
    insights.push({
      text: `${gardenParticipationRate}% garden participation with ${gardenChildLedRate}% child-led projects -- children take genuine ownership of growing projects, developing responsibility, patience, and practical life skills. This is outstanding practice.`,
      severity: "positive",
    });
  }

  if (explorationDiversityRate >= 80 && newEnvironmentRate >= 50 && totalExplorationRecords > 0) {
    insights.push({
      text: `Exploration diversity at ${explorationDiversityRate}% with ${newEnvironmentRate}% new environments -- children regularly discover unfamiliar natural settings, building environmental awareness, confidence, and a sense of adventure.`,
      severity: "positive",
    });
  }

  if (childInitiatedRate >= 50 && childChoiceRate >= 60 && totalOutdoorRecords > 0 && totalExplorationRecords > 0) {
    insights.push({
      text: `${childInitiatedRate}% child-initiated outdoor activities and ${childChoiceRate}% child-choice explorations -- the outdoor programme is genuinely shaped by children's interests and preferences. This exemplifies the child-centred approach Ofsted expects.`,
      severity: "positive",
    });
  }

  if (therapeuticRate >= 60 && gardenSatisfactionAvg >= 4.0 && totalGardenRecords > 0) {
    insights.push({
      text: `Therapeutic benefit noted in ${therapeuticRate}% of garden activities with ${gardenSatisfactionAvg}/5 satisfaction -- gardening is effectively used as a therapeutic tool, supporting children's emotional wellbeing, regulation, and sense of achievement.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (outdoor_rating === "outstanding") {
    headline =
      "Outstanding outdoor and nature engagement -- children enjoy regular, diverse, and safe outdoor experiences with strong nature-based learning and environmental exploration.";
  } else if (outdoor_rating === "good") {
    headline = `Good outdoor and nature engagement -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (outdoor_rating === "adequate") {
    headline = `Adequate outdoor and nature engagement -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children benefit fully from outdoor experiences and nature-based activities.`;
  } else {
    headline = `Outdoor and nature engagement is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children have regular, safe, and enriching outdoor experiences.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    outdoor_rating,
    outdoor_score: score,
    headline,
    outdoor_frequency_rate: outdoorFrequencyRate,
    nature_learning_rate: natureLearningRate,
    garden_participation_rate: gardenParticipationRate,
    exploration_diversity_rate: explorationDiversityRate,
    safety_compliance_rate: safetyComplianceRate,
    child_enjoyment_rate: childEnjoymentRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
