// ==============================================================================
// CORNERSTONE -- HOME WEEKLY PLANNER & ACTIVITY SCHEDULE INTELLIGENCE ENGINE
// Home-level engine measuring weekly planning quality -- schedule creation
// timeliness, activity variety, child input in planning, schedule communication
// effectiveness, and adherence to planned activities.
// Pure deterministic engine -- no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 5 (Engaging, activities & relationships),
//             Reg 6 (Quality of care standard),
//             Reg 7 (Child's plan).
// SCCIF: "Experiences and progress of children."
// Store keys: scheduleCreationRecords, activityVarietyRecords,
//             childInputRecords, communicationRecords, adherenceRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface ScheduleCreationRecordInput {
  id: string;
  week_commencing: string;
  created_date: string;
  created_by: string;
  days_before_week_start: number;
  includes_all_children: boolean;
  includes_morning: boolean;
  includes_afternoon: boolean;
  includes_evening: boolean;
  includes_weekend: boolean;
  total_activities_planned: number;
  approved_by_manager: boolean;
  revision_count: number;
  created_at: string;
}

export interface ActivityVarietyRecordInput {
  id: string;
  week_commencing: string;
  category: string;
  activity_title: string;
  is_indoor: boolean;
  is_outdoor: boolean;
  is_group: boolean;
  is_individual: boolean;
  is_educational: boolean;
  is_recreational: boolean;
  is_therapeutic: boolean;
  is_life_skills: boolean;
  is_cultural: boolean;
  is_physical: boolean;
  is_creative: boolean;
  is_community: boolean;
  age_appropriate: boolean;
  new_activity: boolean;
  child_satisfaction: number; // 1-5
  created_at: string;
}

export interface ChildInputRecordInput {
  id: string;
  child_id: string;
  child_name: string;
  week_commencing: string;
  consulted_before_planning: boolean;
  preferences_recorded: boolean;
  suggestions_included: number;
  suggestions_acted_on: number;
  attended_planning_session: boolean;
  feedback_given_after: boolean;
  felt_listened_to: boolean;
  satisfaction_score: number; // 1-5
  created_at: string;
}

export interface CommunicationRecordInput {
  id: string;
  week_commencing: string;
  schedule_displayed: boolean;
  shared_with_children: boolean;
  shared_with_staff: boolean;
  shared_with_carers: boolean;
  shared_before_week_start: boolean;
  format_accessible: boolean;
  changes_communicated: boolean;
  child_friendly_format: boolean;
  digital_copy_available: boolean;
  created_at: string;
}

export interface AdherenceRecordInput {
  id: string;
  week_commencing: string;
  activity_title: string;
  was_planned: boolean;
  was_delivered: boolean;
  delivered_as_planned: boolean;
  reason_not_delivered: string;
  alternative_provided: boolean;
  child_informed_of_change: boolean;
  child_satisfaction: number; // 1-5
  staff_id: string;
  created_at: string;
}

export interface WeeklyPlannerInput {
  today: string;
  total_children: number;
  schedule_creation_records: ScheduleCreationRecordInput[];
  activity_variety_records: ActivityVarietyRecordInput[];
  child_input_records: ChildInputRecordInput[];
  communication_records: CommunicationRecordInput[];
  adherence_records: AdherenceRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type WeeklyPlannerRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface WeeklyPlannerInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface WeeklyPlannerRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface WeeklyPlannerResult {
  planner_rating: WeeklyPlannerRating;
  planner_score: number;
  headline: string;
  schedule_timeliness_rate: number;
  activity_variety_rate: number;
  child_input_rate: number;
  communication_rate: number;
  adherence_rate: number;
  child_satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: WeeklyPlannerRecommendation[];
  insights: WeeklyPlannerInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): WeeklyPlannerRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: WeeklyPlannerRating,
  score: number,
  headline: string,
): WeeklyPlannerResult {
  return {
    planner_rating: rating,
    planner_score: score,
    headline,
    schedule_timeliness_rate: 0,
    activity_variety_rate: 0,
    child_input_rate: 0,
    communication_rate: 0,
    adherence_rate: 0,
    child_satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeWeeklyPlannerActivitySchedule(
  input: WeeklyPlannerInput,
): WeeklyPlannerResult {
  const {
    total_children,
    schedule_creation_records,
    activity_variety_records,
    child_input_records,
    communication_records,
    adherence_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    schedule_creation_records.length === 0 &&
    activity_variety_records.length === 0 &&
    child_input_records.length === 0 &&
    communication_records.length === 0 &&
    adherence_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess weekly planner and activity schedule quality.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No weekly planner or activity schedule data recorded despite children on placement -- schedule creation, activity variety, child input, communication, and adherence require urgent attention.",
      ),
      concerns: [
        "No schedule creation, activity variety, child input, communication, or adherence records exist despite children being on placement -- the home cannot evidence that weekly planning is taking place or that children are accessing a structured programme of activities.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a structured weekly planning process immediately -- create a weekly activity schedule that covers morning, afternoon, evening, and weekend periods, is informed by children's preferences, and is communicated to all staff and children before the week begins.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
        },
        {
          rank: 2,
          recommendation:
            "Establish recording systems for schedule creation, activity variety, child input in planning, schedule communication, and adherence monitoring to evidence compliance with Reg 5 and Reg 6.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 6 -- Quality of care standard",
        },
      ],
      insights: [
        {
          text: "The complete absence of weekly planner and activity schedule records means Ofsted cannot verify that children are receiving a structured, varied, and child-centred programme of activities. This represents a fundamental gap in Reg 5 and Reg 6 compliance and would be flagged at inspection.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Schedule creation timeliness ---
  const totalSchedules = schedule_creation_records.length;
  const timelySchedules = schedule_creation_records.filter(
    (r) => r.days_before_week_start >= 2,
  ).length;
  const scheduleTimelinessRate = pct(timelySchedules, totalSchedules);

  const schedulesIncludingAllChildren = schedule_creation_records.filter(
    (r) => r.includes_all_children,
  ).length;
  const allChildrenInclusionRate = pct(schedulesIncludingAllChildren, totalSchedules);

  const fullCoverageSchedules = schedule_creation_records.filter(
    (r) => r.includes_morning && r.includes_afternoon && r.includes_evening,
  ).length;
  const fullCoverageRate = pct(fullCoverageSchedules, totalSchedules);

  const weekendSchedules = schedule_creation_records.filter(
    (r) => r.includes_weekend,
  ).length;
  const weekendCoverageRate = pct(weekendSchedules, totalSchedules);

  const approvedSchedules = schedule_creation_records.filter(
    (r) => r.approved_by_manager,
  ).length;
  const managerApprovalRate = pct(approvedSchedules, totalSchedules);

  const totalActivitiesPlanned = schedule_creation_records.reduce(
    (sum, r) => sum + r.total_activities_planned, 0,
  );
  const avgActivitiesPerWeek =
    totalSchedules > 0
      ? Math.round((totalActivitiesPlanned / totalSchedules) * 10) / 10
      : 0;

  const highRevisionSchedules = schedule_creation_records.filter(
    (r) => r.revision_count >= 3,
  ).length;
  const highRevisionRate = pct(highRevisionSchedules, totalSchedules);

  // --- Activity variety ---
  const totalVarietyRecords = activity_variety_records.length;
  const uniqueCategories = new Set(
    activity_variety_records.map((r) => r.category),
  );
  const uniqueCategoryCount = uniqueCategories.size;

  const outdoorActivities = activity_variety_records.filter((r) => r.is_outdoor).length;
  const outdoorRate = pct(outdoorActivities, totalVarietyRecords);

  const indoorActivities = activity_variety_records.filter((r) => r.is_indoor).length;
  const indoorRate = pct(indoorActivities, totalVarietyRecords);

  const groupActivities = activity_variety_records.filter((r) => r.is_group).length;
  const groupRate = pct(groupActivities, totalVarietyRecords);

  const individualActivities = activity_variety_records.filter((r) => r.is_individual).length;
  const individualRate = pct(individualActivities, totalVarietyRecords);

  const educationalActivities = activity_variety_records.filter((r) => r.is_educational).length;
  const educationalRate = pct(educationalActivities, totalVarietyRecords);

  const recreationalActivities = activity_variety_records.filter((r) => r.is_recreational).length;
  const recreationalRate = pct(recreationalActivities, totalVarietyRecords);

  const therapeuticActivities = activity_variety_records.filter((r) => r.is_therapeutic).length;
  const therapeuticRate = pct(therapeuticActivities, totalVarietyRecords);

  const lifeSkillsActivities = activity_variety_records.filter((r) => r.is_life_skills).length;
  const lifeSkillsRate = pct(lifeSkillsActivities, totalVarietyRecords);

  const culturalActivities = activity_variety_records.filter((r) => r.is_cultural).length;
  const culturalRate = pct(culturalActivities, totalVarietyRecords);

  const physicalActivities = activity_variety_records.filter((r) => r.is_physical).length;
  const physicalRate = pct(physicalActivities, totalVarietyRecords);

  const creativeActivities = activity_variety_records.filter((r) => r.is_creative).length;
  const creativeRate = pct(creativeActivities, totalVarietyRecords);

  const communityActivities = activity_variety_records.filter((r) => r.is_community).length;
  const communityRate = pct(communityActivities, totalVarietyRecords);

  const ageAppropriateActivities = activity_variety_records.filter((r) => r.age_appropriate).length;
  const ageAppropriateRate = pct(ageAppropriateActivities, totalVarietyRecords);

  const newActivities = activity_variety_records.filter((r) => r.new_activity).length;
  const newActivityRate = pct(newActivities, totalVarietyRecords);

  // Count how many distinct "type flags" are represented
  const typeFlags = [
    outdoorActivities > 0,
    indoorActivities > 0,
    groupActivities > 0,
    individualActivities > 0,
    educationalActivities > 0,
    recreationalActivities > 0,
    therapeuticActivities > 0,
    lifeSkillsActivities > 0,
    culturalActivities > 0,
    physicalActivities > 0,
    creativeActivities > 0,
    communityActivities > 0,
  ].filter(Boolean).length;

  // Variety rate: combination of category count and type coverage
  const activityVarietyRate =
    totalVarietyRecords > 0
      ? clamp(Math.round(((uniqueCategoryCount / Math.max(totalVarietyRecords, 1)) * 50) + ((typeFlags / 12) * 50)), 0, 100)
      : 0;

  // Activity satisfaction from variety records
  const varietySatisfactionSum = activity_variety_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const varietySatisfactionAvg =
    totalVarietyRecords > 0
      ? Math.round((varietySatisfactionSum / totalVarietyRecords) * 100) / 100
      : 0;

  // --- Child input in planning ---
  const totalChildInputRecords = child_input_records.length;
  const consultedBeforePlanning = child_input_records.filter(
    (r) => r.consulted_before_planning,
  ).length;
  const consultationRate = pct(consultedBeforePlanning, totalChildInputRecords);

  const preferencesRecorded = child_input_records.filter(
    (r) => r.preferences_recorded,
  ).length;
  const preferencesRate = pct(preferencesRecorded, totalChildInputRecords);

  const totalSuggestions = child_input_records.reduce(
    (sum, r) => sum + r.suggestions_included, 0,
  );
  const totalSuggestionsActedOn = child_input_records.reduce(
    (sum, r) => sum + r.suggestions_acted_on, 0,
  );
  const suggestionActedRate = pct(totalSuggestionsActedOn, totalSuggestions);

  const attendedPlanningSession = child_input_records.filter(
    (r) => r.attended_planning_session,
  ).length;
  const planningSessionAttendanceRate = pct(attendedPlanningSession, totalChildInputRecords);

  const feedbackGivenAfter = child_input_records.filter(
    (r) => r.feedback_given_after,
  ).length;
  const feedbackRate = pct(feedbackGivenAfter, totalChildInputRecords);

  const feltListenedTo = child_input_records.filter(
    (r) => r.felt_listened_to,
  ).length;
  const feltListenedToRate = pct(feltListenedTo, totalChildInputRecords);

  const childInputSatisfactionSum = child_input_records.reduce(
    (sum, r) => sum + r.satisfaction_score, 0,
  );
  const childInputSatisfactionAvg =
    totalChildInputRecords > 0
      ? Math.round((childInputSatisfactionSum / totalChildInputRecords) * 100) / 100
      : 0;

  // Composite child input rate
  const childInputRate =
    totalChildInputRecords > 0
      ? Math.round((consultationRate + preferencesRate + feltListenedToRate) / 3)
      : 0;

  // Unique children consulted
  const uniqueChildrenConsulted = new Set(
    child_input_records.filter((r) => r.consulted_before_planning).map((r) => r.child_id),
  ).size;

  // --- Communication effectiveness ---
  const totalCommunicationRecords = communication_records.length;
  const schedulesDisplayed = communication_records.filter(
    (r) => r.schedule_displayed,
  ).length;
  const displayRate = pct(schedulesDisplayed, totalCommunicationRecords);

  const sharedWithChildren = communication_records.filter(
    (r) => r.shared_with_children,
  ).length;
  const childShareRate = pct(sharedWithChildren, totalCommunicationRecords);

  const sharedWithStaff = communication_records.filter(
    (r) => r.shared_with_staff,
  ).length;
  const staffShareRate = pct(sharedWithStaff, totalCommunicationRecords);

  const sharedWithCarers = communication_records.filter(
    (r) => r.shared_with_carers,
  ).length;
  const carerShareRate = pct(sharedWithCarers, totalCommunicationRecords);

  const sharedBeforeWeek = communication_records.filter(
    (r) => r.shared_before_week_start,
  ).length;
  const earlyShareRate = pct(sharedBeforeWeek, totalCommunicationRecords);

  const formatAccessible = communication_records.filter(
    (r) => r.format_accessible,
  ).length;
  const accessibilityRate = pct(formatAccessible, totalCommunicationRecords);

  const changesCommunicated = communication_records.filter(
    (r) => r.changes_communicated,
  ).length;
  const changeCommunicationRate = pct(changesCommunicated, totalCommunicationRecords);

  const childFriendlyFormat = communication_records.filter(
    (r) => r.child_friendly_format,
  ).length;
  const childFriendlyRate = pct(childFriendlyFormat, totalCommunicationRecords);

  const digitalCopyAvailable = communication_records.filter(
    (r) => r.digital_copy_available,
  ).length;
  const digitalAvailabilityRate = pct(digitalCopyAvailable, totalCommunicationRecords);

  // Composite communication rate
  const communicationRate =
    totalCommunicationRecords > 0
      ? Math.round((displayRate + childShareRate + staffShareRate + earlyShareRate) / 4)
      : 0;

  // --- Adherence to planned activities ---
  const totalAdherenceRecords = adherence_records.length;
  const plannedActivities = adherence_records.filter(
    (r) => r.was_planned,
  ).length;
  const deliveredActivities = adherence_records.filter(
    (r) => r.was_delivered,
  ).length;
  const deliveryRate = pct(deliveredActivities, totalAdherenceRecords);

  const deliveredAsPlanned = adherence_records.filter(
    (r) => r.delivered_as_planned,
  ).length;
  const asPlannedRate = pct(deliveredAsPlanned, totalAdherenceRecords);

  const notDelivered = adherence_records.filter(
    (r) => r.was_planned && !r.was_delivered,
  ).length;
  const nonDeliveryRate = pct(notDelivered, plannedActivities);

  const alternativeProvided = adherence_records.filter(
    (r) => r.was_planned && !r.was_delivered && r.alternative_provided,
  ).length;
  const alternativeRate = pct(alternativeProvided, notDelivered);

  const childInformedOfChange = adherence_records.filter(
    (r) => r.was_planned && !r.delivered_as_planned && r.child_informed_of_change,
  ).length;
  const changesNotAsPlanned = adherence_records.filter(
    (r) => r.was_planned && !r.delivered_as_planned,
  ).length;
  const childInformedRate = pct(childInformedOfChange, changesNotAsPlanned);

  const adherenceSatisfactionSum = adherence_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const adherenceSatisfactionAvg =
    totalAdherenceRecords > 0
      ? Math.round((adherenceSatisfactionSum / totalAdherenceRecords) * 100) / 100
      : 0;

  // Composite adherence rate
  const adherenceRate =
    totalAdherenceRecords > 0
      ? Math.round((deliveryRate + asPlannedRate) / 2)
      : 0;

  const uniqueStaffDelivering = new Set(
    adherence_records.filter((r) => r.staff_id).map((r) => r.staff_id),
  ).size;

  // --- Child satisfaction composite ---
  const satisfactionDenominator =
    (totalVarietyRecords > 0 ? 1 : 0) +
    (totalChildInputRecords > 0 ? 1 : 0) +
    (totalAdherenceRecords > 0 ? 1 : 0);

  const satisfactionNumerator =
    (totalVarietyRecords > 0 ? pct(Math.round(varietySatisfactionAvg), 5) : 0) +
    (totalChildInputRecords > 0 ? pct(Math.round(childInputSatisfactionAvg), 5) : 0) +
    (totalAdherenceRecords > 0 ? pct(Math.round(adherenceSatisfactionAvg), 5) : 0);

  const childSatisfactionRate =
    satisfactionDenominator > 0
      ? Math.round(satisfactionNumerator / satisfactionDenominator)
      : 0;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: scheduleTimelinessRate (>=90: +5, >=70: +3) ---
  if (scheduleTimelinessRate >= 90) score += 5;
  else if (scheduleTimelinessRate >= 70) score += 3;

  // --- Bonus 2: activityVarietyRate (>=80: +4, >=60: +2) ---
  if (activityVarietyRate >= 80) score += 4;
  else if (activityVarietyRate >= 60) score += 2;

  // --- Bonus 3: childInputRate (>=80: +5, >=60: +3) ---
  if (childInputRate >= 80) score += 5;
  else if (childInputRate >= 60) score += 3;

  // --- Bonus 4: communicationRate (>=90: +4, >=70: +2) ---
  if (communicationRate >= 90) score += 4;
  else if (communicationRate >= 70) score += 2;

  // --- Bonus 5: adherenceRate (>=90: +4, >=70: +2) ---
  if (adherenceRate >= 90) score += 4;
  else if (adherenceRate >= 70) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=80: +3, >=60: +1) ---
  if (childSatisfactionRate >= 80) score += 3;
  else if (childSatisfactionRate >= 60) score += 1;

  // --- Bonus 7: fullCoverageRate (>=90: +3, >=70: +1) ---
  if (fullCoverageRate >= 90) score += 3;
  else if (fullCoverageRate >= 70) score += 1;

  // --- Bonus 8: managerApprovalRate (>=90: +2, >=70: +1) ---
  if (managerApprovalRate >= 90) score += 2;
  else if (managerApprovalRate >= 70) score += 1;

  // --- Bonus 9: weekendCoverageRate (>=90: +2, >=70: +1) ---
  if (weekendCoverageRate >= 90) score += 2;
  else if (weekendCoverageRate >= 70) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // scheduleTimelinessRate < 50 -> -5
  if (scheduleTimelinessRate < 50 && schedule_creation_records.length > 0) score -= 5;

  // childInputRate < 40 -> -5
  if (childInputRate < 40 && child_input_records.length > 0) score -= 5;

  // adherenceRate < 50 -> -5
  if (adherenceRate < 50 && adherence_records.length > 0) score -= 5;

  // communicationRate < 50 -> -4
  if (communicationRate < 50 && communication_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const planner_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (scheduleTimelinessRate >= 90 && totalSchedules > 0) {
    strengths.push(
      `${scheduleTimelinessRate}% of weekly schedules created at least 2 days before the week begins -- excellent forward planning ensures staff and children know what to expect and can prepare accordingly.`,
    );
  } else if (scheduleTimelinessRate >= 70 && totalSchedules > 0) {
    strengths.push(
      `${scheduleTimelinessRate}% schedule timeliness rate -- most weekly schedules are created in advance, demonstrating good planning practice.`,
    );
  }

  if (fullCoverageRate >= 90 && totalSchedules > 0) {
    strengths.push(
      `${fullCoverageRate}% of schedules cover morning, afternoon, and evening periods -- children have a structured programme throughout the day with clear expectations and varied opportunities.`,
    );
  }

  if (weekendCoverageRate >= 90 && totalSchedules > 0) {
    strengths.push(
      `${weekendCoverageRate}% of schedules include weekend planning -- weekends are not left unstructured, ensuring children have activities and experiences throughout the entire week.`,
    );
  }

  if (allChildrenInclusionRate >= 90 && totalSchedules > 0) {
    strengths.push(
      `${allChildrenInclusionRate}% of schedules include all children -- inclusive planning ensures every child has access to a personalised programme of activities.`,
    );
  }

  if (managerApprovalRate >= 90 && totalSchedules > 0) {
    strengths.push(
      `${managerApprovalRate}% of schedules approved by the manager -- management oversight of weekly planning ensures quality assurance and accountability.`,
    );
  }

  if (uniqueCategoryCount >= 6 && totalVarietyRecords > 0) {
    strengths.push(
      `Activities span ${uniqueCategoryCount} different categories -- the home provides a rich and varied programme covering a wide range of experiences and opportunities.`,
    );
  } else if (uniqueCategoryCount >= 4 && totalVarietyRecords > 0) {
    strengths.push(
      `Activities cover ${uniqueCategoryCount} different categories -- good variety in the activity programme provides children with diverse experiences.`,
    );
  }

  if (typeFlags >= 8 && totalVarietyRecords > 0) {
    strengths.push(
      `Activities include ${typeFlags} different types (outdoor, indoor, group, individual, educational, recreational, therapeutic, life skills, cultural, physical, creative, community) -- exceptional breadth of provision.`,
    );
  }

  if (newActivityRate >= 20 && totalVarietyRecords > 0) {
    strengths.push(
      `${newActivityRate}% of activities are new experiences -- the home regularly introduces fresh activities that broaden children's horizons and build confidence.`,
    );
  }

  if (ageAppropriateRate >= 95 && totalVarietyRecords > 0) {
    strengths.push(
      `${ageAppropriateRate}% of activities are age-appropriate -- careful matching of activities to children's developmental stages demonstrates thoughtful, child-centred planning.`,
    );
  }

  if (consultationRate >= 90 && totalChildInputRecords > 0) {
    strengths.push(
      `${consultationRate}% of children consulted before weekly planning -- children's voices genuinely shape the activity programme, demonstrating person-centred care.`,
    );
  } else if (consultationRate >= 70 && totalChildInputRecords > 0) {
    strengths.push(
      `${consultationRate}% child consultation rate -- most children are consulted about what they want to do, which is good practice under Reg 7.`,
    );
  }

  if (feltListenedToRate >= 90 && totalChildInputRecords > 0) {
    strengths.push(
      `${feltListenedToRate}% of children feel listened to in the planning process -- children perceive that their input matters and is acted upon, building trust and engagement.`,
    );
  }

  if (suggestionActedRate >= 80 && totalSuggestions > 0) {
    strengths.push(
      `${suggestionActedRate}% of children's suggestions acted upon -- the home demonstrates genuine responsiveness to children's preferences and ideas.`,
    );
  }

  if (planningSessionAttendanceRate >= 80 && totalChildInputRecords > 0) {
    strengths.push(
      `${planningSessionAttendanceRate}% attendance at planning sessions -- children actively participate in shaping their own weekly programme.`,
    );
  }

  if (displayRate >= 90 && totalCommunicationRecords > 0) {
    strengths.push(
      `${displayRate}% of schedules displayed in the home -- children and staff can see the planned programme at a glance, promoting predictability and routine.`,
    );
  }

  if (childShareRate >= 90 && totalCommunicationRecords > 0) {
    strengths.push(
      `${childShareRate}% of schedules shared directly with children -- children are kept informed about what is planned for them, respecting their right to know and participate.`,
    );
  }

  if (earlyShareRate >= 90 && totalCommunicationRecords > 0) {
    strengths.push(
      `${earlyShareRate}% of schedules shared before the week starts -- advance communication allows children and staff to prepare and builds a sense of anticipation.`,
    );
  }

  if (childFriendlyRate >= 90 && totalCommunicationRecords > 0) {
    strengths.push(
      `${childFriendlyRate}% of schedules presented in a child-friendly format -- accessible communication ensures all children can understand and engage with the planned programme.`,
    );
  }

  if (changeCommunicationRate >= 90 && totalCommunicationRecords > 0) {
    strengths.push(
      `${changeCommunicationRate}% of schedule changes communicated effectively -- when plans change, children and staff are kept informed, maintaining trust and transparency.`,
    );
  }

  if (deliveryRate >= 90 && totalAdherenceRecords > 0) {
    strengths.push(
      `${deliveryRate}% of planned activities delivered -- the home follows through on its planned programme, demonstrating reliability and commitment to children's experiences.`,
    );
  } else if (deliveryRate >= 70 && totalAdherenceRecords > 0) {
    strengths.push(
      `${deliveryRate}% activity delivery rate -- most planned activities are carried out as intended.`,
    );
  }

  if (asPlannedRate >= 90 && totalAdherenceRecords > 0) {
    strengths.push(
      `${asPlannedRate}% of activities delivered exactly as planned -- excellent adherence to the weekly schedule demonstrates strong organisational discipline and reliability.`,
    );
  }

  if (alternativeRate >= 80 && notDelivered > 0) {
    strengths.push(
      `${alternativeRate}% of cancelled activities had alternatives provided -- when plans change, the home ensures children still receive meaningful experiences.`,
    );
  }

  if (childInformedRate >= 90 && changesNotAsPlanned > 0) {
    strengths.push(
      `${childInformedRate}% of changes communicated to children -- children are kept informed when plans change, respecting their autonomy and reducing anxiety.`,
    );
  }

  if (childSatisfactionRate >= 80) {
    strengths.push(
      `Overall child satisfaction rate at ${childSatisfactionRate}% -- children are satisfied with the planning process, activity variety, and delivery of the weekly programme.`,
    );
  }

  if (feedbackRate >= 80 && totalChildInputRecords > 0) {
    strengths.push(
      `${feedbackRate}% of children provide feedback after activities -- post-activity feedback is systematically captured, informing future planning and continuous improvement.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (scheduleTimelinessRate < 50 && totalSchedules > 0) {
    concerns.push(
      `Only ${scheduleTimelinessRate}% of weekly schedules created on time -- schedules are frequently produced late, leaving staff and children uncertain about what is planned. Ofsted expects proactive, forward-looking planning under Reg 5.`,
    );
  } else if (scheduleTimelinessRate < 70 && scheduleTimelinessRate >= 50 && totalSchedules > 0) {
    concerns.push(
      `Schedule timeliness at ${scheduleTimelinessRate}% -- some schedules are not created far enough in advance for effective preparation.`,
    );
  }

  if (fullCoverageRate < 50 && totalSchedules > 0) {
    concerns.push(
      `Only ${fullCoverageRate}% of schedules cover morning, afternoon, and evening periods -- significant gaps in the daily programme mean children may have unstructured time without meaningful activities.`,
    );
  }

  if (weekendCoverageRate < 50 && totalSchedules > 0) {
    concerns.push(
      `Only ${weekendCoverageRate}% of schedules include weekend activities -- weekends are frequently unplanned, which can lead to boredom, unstructured time, and missed enrichment opportunities.`,
    );
  }

  if (allChildrenInclusionRate < 70 && totalSchedules > 0) {
    concerns.push(
      `Only ${allChildrenInclusionRate}% of schedules include all children -- some children are not accounted for in weekly planning, risking exclusion from the activity programme.`,
    );
  }

  if (managerApprovalRate < 50 && totalSchedules > 0) {
    concerns.push(
      `Only ${managerApprovalRate}% of schedules approved by the manager -- lack of management oversight reduces quality assurance and accountability in weekly planning.`,
    );
  }

  if (uniqueCategoryCount <= 2 && totalVarietyRecords >= 3) {
    concerns.push(
      `Activities limited to ${uniqueCategoryCount} categor${uniqueCategoryCount === 1 ? "y" : "ies"} -- Ofsted expects a varied programme covering educational, recreational, physical, creative, cultural, and community experiences.`,
    );
  }

  if (typeFlags <= 3 && totalVarietyRecords >= 3) {
    concerns.push(
      `Only ${typeFlags} activity types represented -- the programme lacks variety in the kinds of experiences offered. Children need a balanced mix of outdoor, indoor, group, individual, educational, and recreational activities.`,
    );
  }

  if (ageAppropriateRate < 70 && totalVarietyRecords > 0) {
    concerns.push(
      `Only ${ageAppropriateRate}% of activities are age-appropriate -- activities that do not match children's developmental stages risk disengagement or harm.`,
    );
  }

  if (newActivityRate === 0 && totalVarietyRecords >= 3) {
    concerns.push(
      "No new activities introduced -- children benefit from trying new things to build confidence, broaden horizons, and discover new interests. A static programme risks stagnation.",
    );
  }

  if (consultationRate < 50 && totalChildInputRecords > 0) {
    concerns.push(
      `Only ${consultationRate}% of children consulted before planning -- the majority of children's preferences are not captured, undermining the child-centred approach required by Reg 7.`,
    );
  } else if (consultationRate < 70 && consultationRate >= 50 && totalChildInputRecords > 0) {
    concerns.push(
      `Child consultation rate at ${consultationRate}% -- some children are not being asked about their preferences for the weekly programme.`,
    );
  }

  if (feltListenedToRate < 50 && totalChildInputRecords > 0) {
    concerns.push(
      `Only ${feltListenedToRate}% of children feel listened to in planning -- children do not perceive that their input shapes the activity programme. This is a significant concern under Reg 7 (child's voice).`,
    );
  }

  if (suggestionActedRate < 50 && totalSuggestions > 0) {
    concerns.push(
      `Only ${suggestionActedRate}% of children's suggestions acted upon -- children may feel their contributions are tokenistic if suggestions are consistently ignored.`,
    );
  }

  if (displayRate < 50 && totalCommunicationRecords > 0) {
    concerns.push(
      `Only ${displayRate}% of schedules displayed in the home -- children and staff cannot easily see what is planned, reducing predictability and routine.`,
    );
  }

  if (childShareRate < 50 && totalCommunicationRecords > 0) {
    concerns.push(
      `Only ${childShareRate}% of schedules shared with children -- children have a right to know what activities are available to them. Poor communication undermines engagement.`,
    );
  }

  if (earlyShareRate < 50 && totalCommunicationRecords > 0) {
    concerns.push(
      `Only ${earlyShareRate}% of schedules shared before the week starts -- late communication prevents children and staff from preparing and reduces the schedule's effectiveness.`,
    );
  }

  if (childFriendlyRate < 50 && totalCommunicationRecords > 0) {
    concerns.push(
      `Only ${childFriendlyRate}% of schedules in child-friendly format -- inaccessible communication means some children may not understand or engage with the planned programme.`,
    );
  }

  if (deliveryRate < 50 && totalAdherenceRecords > 0) {
    concerns.push(
      `Only ${deliveryRate}% of planned activities delivered -- the majority of planned activities do not take place, rendering the weekly schedule ineffective and eroding children's trust in the planning process.`,
    );
  } else if (deliveryRate < 70 && deliveryRate >= 50 && totalAdherenceRecords > 0) {
    concerns.push(
      `Activity delivery rate at ${deliveryRate}% -- a significant proportion of planned activities are not carried out, which undermines the purpose of weekly planning.`,
    );
  }

  if (asPlannedRate < 50 && totalAdherenceRecords > 0) {
    concerns.push(
      `Only ${asPlannedRate}% of activities delivered as planned -- frequent deviations from the schedule suggest planning is aspirational rather than realistic, or that staffing and resources are insufficient.`,
    );
  }

  if (alternativeRate < 50 && notDelivered >= 2) {
    concerns.push(
      `Only ${alternativeRate}% of cancelled activities had alternatives provided -- when plans change, children should still receive meaningful experiences. Failing to provide alternatives leaves children without activities.`,
    );
  }

  if (childInformedRate < 50 && changesNotAsPlanned >= 2) {
    concerns.push(
      `Only ${childInformedRate}% of schedule changes communicated to children -- children are not being told when plans change, which can cause confusion, disappointment, and anxiety.`,
    );
  }

  if (childSatisfactionRate < 50 && satisfactionDenominator > 0) {
    concerns.push(
      `Overall child satisfaction rate at only ${childSatisfactionRate}% -- children are not satisfied with the weekly planning process. Their views should drive improvement.`,
    );
  }

  if (totalSchedules === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No schedule creation records despite children being on placement -- the home may not be creating weekly activity schedules, denying children a structured programme of activities.",
    );
  }

  if (totalChildInputRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child input records for weekly planning -- there is no evidence that children are consulted about what activities they want or that their preferences shape the programme.",
    );
  }

  if (totalCommunicationRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No communication records for weekly schedules -- there is no evidence that schedules are shared with children, staff, or carers.",
    );
  }

  if (totalAdherenceRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No adherence records -- there is no evidence that planned activities are actually delivered or that the home monitors whether the schedule is followed.",
    );
  }

  if (highRevisionRate >= 50 && totalSchedules >= 3) {
    concerns.push(
      `${highRevisionRate}% of schedules revised 3 or more times -- excessive revisions suggest poor initial planning or chronic resource issues that undermine schedule stability.`,
    );
  }

  if (feedbackRate < 30 && totalChildInputRecords > 0) {
    concerns.push(
      `Only ${feedbackRate}% of children provide feedback after activities -- without post-activity feedback, the home cannot learn from children's experiences or improve future planning.`,
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: WeeklyPlannerRecommendation[] = [];
  let rank = 0;

  if (totalSchedules === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin creating weekly activity schedules immediately -- each week should have a documented schedule covering morning, afternoon, evening, and weekend periods with a named range of activities for all children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (scheduleTimelinessRate < 50 && totalSchedules > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a planning cycle that ensures weekly schedules are completed at least 2 days before the week begins -- late planning prevents preparation and reduces the quality of activity delivery.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (totalChildInputRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a structured process for capturing children's input in weekly planning -- use house meetings, keywork sessions, or a suggestions board to ensure every child's preferences inform the activity programme.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (consultationRate < 50 && totalChildInputRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child consultation before weekly planning to at least 70% -- every child should be asked about their preferences and interests before the schedule is finalised.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (feltListenedToRate < 50 && totalChildInputRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address why children do not feel listened to in the planning process -- review how suggestions are captured, acknowledged, and acted upon. Provide visible feedback showing children how their input shaped the schedule.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (deliveryRate < 50 && totalAdherenceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review why planned activities are not being delivered -- identify barriers (staffing, transport, resources) and create realistic schedules that the home can consistently deliver.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (uniqueCategoryCount <= 2 && totalVarietyRecords >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Diversify the activity programme to include at least 5 different categories -- aim for a balance of educational, recreational, physical, creative, cultural, community, life skills, and therapeutic activities.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (totalCommunicationRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a schedule communication process -- display the weekly schedule in communal areas, share it with children in a child-friendly format, and ensure all staff receive a copy before the week begins.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care standard",
    });
  }

  if (displayRate < 50 && totalCommunicationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Display weekly schedules in communal areas of the home so children and staff can reference them at any time -- visibility promotes predictability, routine, and engagement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care standard",
    });
  }

  if (childShareRate < 50 && totalCommunicationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Share weekly schedules directly with every child using age-appropriate, accessible formats -- children have a right to know what activities are available and when.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (childFriendlyRate < 50 && totalCommunicationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Present schedules in child-friendly formats -- use visual aids, pictures, colour coding, or digital displays to ensure every child can understand and engage with the weekly programme.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (alternativeRate < 50 && notDelivered >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure alternative activities are provided whenever a planned activity cannot take place -- children should never be left without meaningful experiences due to schedule changes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (childInformedRate < 50 && changesNotAsPlanned >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Communicate all schedule changes to children promptly and explain why the change was necessary -- transparency builds trust and reduces anxiety around uncertainty.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (totalAdherenceRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement activity adherence monitoring -- track whether each planned activity was delivered, delivered as planned, and whether alternatives were provided when plans changed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care standard",
    });
  }

  if (fullCoverageRate < 50 && totalSchedules > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend schedule coverage to include morning, afternoon, and evening periods -- a full-day programme ensures children have structured activities and experiences throughout the day.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (weekendCoverageRate < 50 && totalSchedules > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include weekend activities in weekly schedules -- weekends are critical for enrichment, community engagement, and leisure, and should not be left unplanned.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (managerApprovalRate < 50 && totalSchedules > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Require manager approval of weekly schedules before distribution -- management oversight ensures quality, balance, and alignment with each child's care plan.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care standard",
    });
  }

  if (suggestionActedRate < 50 && totalSuggestions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Act on more of children's suggestions -- when children see their ideas in the schedule, they feel valued and more engaged. Where suggestions cannot be accommodated, explain why.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (newActivityRate === 0 && totalVarietyRecords >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce at least one new activity each week to keep the programme fresh, broaden children's experiences, and support aspirational thinking.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (feedbackRate < 30 && totalChildInputRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase post-activity feedback capture to at least 50% -- use simple satisfaction scales, verbal check-ins, or digital feedback tools to learn from children's experiences.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (scheduleTimelinessRate >= 50 && scheduleTimelinessRate < 70 && totalSchedules > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve schedule timeliness to at least 70% -- aim to complete all weekly schedules by Thursday of the preceding week to allow adequate preparation time.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (deliveryRate >= 50 && deliveryRate < 70 && totalAdherenceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase activity delivery rate to at least 70% -- review staffing, transport, and resource availability to ensure more planned activities are carried out.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging, activities & relationships",
    });
  }

  if (ageAppropriateRate < 70 && totalVarietyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review activity planning to ensure all activities are age-appropriate -- match activities to each child's developmental stage, interests, and abilities to maximise engagement and benefit.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care standard",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: WeeklyPlannerInsight[] = [];

  // --- Critical insights ---

  if (scheduleTimelinessRate < 50 && totalSchedules > 0) {
    insights.push({
      text: `Only ${scheduleTimelinessRate}% of weekly schedules created on time. Ofsted expects evidence of proactive, forward-looking planning that gives children structure and predictability. Consistently late schedule creation suggests reactive rather than planned care, which would be flagged under Reg 5.`,
      severity: "critical",
    });
  }

  if (deliveryRate < 50 && totalAdherenceRecords > 0) {
    insights.push({
      text: `Only ${deliveryRate}% of planned activities actually delivered. A weekly schedule that is routinely not followed is worse than no schedule at all -- it erodes children's trust and creates disappointment. Ofsted will view this as evidence that the home's planning is not translating into meaningful experiences for children.`,
      severity: "critical",
    });
  }

  if (consultationRate < 50 && totalChildInputRecords > 0) {
    insights.push({
      text: `Only ${consultationRate}% of children consulted before planning. CHR 2015 Reg 7 requires that children's wishes and feelings are sought and acted upon. A planning process that does not routinely consult children is not child-centred and would be criticised by Ofsted.`,
      severity: "critical",
    });
  }

  if (feltListenedToRate < 50 && totalChildInputRecords > 0) {
    insights.push({
      text: `Only ${feltListenedToRate}% of children feel listened to in planning. Even where consultation occurs, children perceive that their views are not valued. This undermines the child's voice requirement under Reg 7 and SCCIF and suggests tokenistic engagement.`,
      severity: "critical",
    });
  }

  if (communicationRate < 50 && totalCommunicationRecords > 0) {
    insights.push({
      text: `Schedule communication rate at only ${communicationRate}%. Children and staff are not consistently informed about what is planned, reducing the schedule's effectiveness. Ofsted expects clear, timely communication of the activity programme to all stakeholders.`,
      severity: "critical",
    });
  }

  if (totalSchedules === 0 && totalChildInputRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No schedule creation or child input records despite children being on placement. Ofsted may interpret the absence of records as evidence that weekly planning does not take place and that children's preferences are not captured -- this is a significant gap in Reg 5, Reg 6, and Reg 7 compliance.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (scheduleTimelinessRate >= 50 && scheduleTimelinessRate < 70 && totalSchedules > 0) {
    insights.push({
      text: `Schedule timeliness at ${scheduleTimelinessRate}% -- improving but some schedules are still created too late for effective preparation. Aim for at least 70% to ensure staff and children can plan ahead.`,
      severity: "warning",
    });
  }

  if (fullCoverageRate >= 50 && fullCoverageRate < 90 && totalSchedules > 0) {
    insights.push({
      text: `Full-day coverage at ${fullCoverageRate}% -- some schedules do not cover all periods of the day. Gaps in the daily programme can lead to unstructured time and missed opportunities.`,
      severity: "warning",
    });
  }

  if (weekendCoverageRate >= 50 && weekendCoverageRate < 90 && totalSchedules > 0) {
    insights.push({
      text: `Weekend coverage at ${weekendCoverageRate}% -- some schedules do not include weekend planning. Weekends are important for leisure, community engagement, and enrichment activities.`,
      severity: "warning",
    });
  }

  if (uniqueCategoryCount >= 3 && uniqueCategoryCount < 6 && totalVarietyRecords > 0) {
    insights.push({
      text: `Activities cover ${uniqueCategoryCount} categories -- reasonable variety but scope to broaden further. Ofsted looks for a programme that includes educational, recreational, physical, creative, cultural, and community experiences.`,
      severity: "warning",
    });
  }

  if (consultationRate >= 50 && consultationRate < 70 && totalChildInputRecords > 0) {
    insights.push({
      text: `Child consultation at ${consultationRate}% -- some children are being consulted but the process needs to become more consistent to meet Reg 7 expectations.`,
      severity: "warning",
    });
  }

  if (deliveryRate >= 50 && deliveryRate < 70 && totalAdherenceRecords > 0) {
    insights.push({
      text: `Activity delivery rate at ${deliveryRate}% -- a notable proportion of planned activities are not taking place. Review resource availability and plan realistically to improve follow-through.`,
      severity: "warning",
    });
  }

  if (asPlannedRate >= 50 && asPlannedRate < 70 && totalAdherenceRecords > 0) {
    insights.push({
      text: `${asPlannedRate}% of activities delivered as planned -- frequent modifications suggest either over-ambitious planning or resource constraints that need addressing.`,
      severity: "warning",
    });
  }

  if (childSatisfactionRate >= 50 && childSatisfactionRate < 80 && satisfactionDenominator > 0) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% -- while acceptable, there is room to improve how children experience the planning and delivery of weekly activities.`,
      severity: "warning",
    });
  }

  if (childShareRate >= 50 && childShareRate < 90 && totalCommunicationRecords > 0) {
    insights.push({
      text: `Schedule sharing with children at ${childShareRate}% -- not all children are consistently receiving advance information about the weekly programme. Every child should know what is planned for them.`,
      severity: "warning",
    });
  }

  if (suggestionActedRate >= 50 && suggestionActedRate < 80 && totalSuggestions > 0) {
    insights.push({
      text: `${suggestionActedRate}% of children's suggestions acted upon -- while some input is incorporated, children need to see more of their ideas reflected in the schedule to feel genuinely involved.`,
      severity: "warning",
    });
  }

  if (ageAppropriateRate >= 70 && ageAppropriateRate < 95 && totalVarietyRecords > 0) {
    insights.push({
      text: `Age appropriateness at ${ageAppropriateRate}% -- most activities are well-matched but some may not suit all children's developmental stages. Review activities for each child's individual needs.`,
      severity: "warning",
    });
  }

  if (highRevisionRate >= 30 && highRevisionRate < 50 && totalSchedules >= 3) {
    insights.push({
      text: `${highRevisionRate}% of schedules revised 3 or more times -- frequent revisions may indicate that initial planning is not robust or that external factors are disrupting the programme.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (planner_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding weekly planning and activity scheduling -- schedules are created on time, activities are varied and child-centred, children's input shapes the programme, communication is effective, and planned activities are consistently delivered. This is strong evidence for Reg 5, Reg 6, and Reg 7 compliance.",
      severity: "positive",
    });
  }

  if (scheduleTimelinessRate >= 90 && adherenceRate >= 90 && totalSchedules > 0 && totalAdherenceRecords > 0) {
    insights.push({
      text: `${scheduleTimelinessRate}% schedule timeliness with ${adherenceRate}% adherence -- the home plans ahead and follows through. Children experience a reliable, predictable programme of activities. This demonstrates the kind of proactive, organised care that Ofsted expects under Reg 5.`,
      severity: "positive",
    });
  }

  if (consultationRate >= 90 && feltListenedToRate >= 90 && totalChildInputRecords > 0) {
    insights.push({
      text: `${consultationRate}% consultation with ${feltListenedToRate}% of children feeling listened to -- the planning process is genuinely child-centred. Children's voices shape the activity programme and they perceive that their input matters. This is exemplary Reg 7 practice.`,
      severity: "positive",
    });
  }

  if (communicationRate >= 90 && totalCommunicationRecords > 0) {
    insights.push({
      text: `Schedule communication at ${communicationRate}% -- all stakeholders are consistently informed about the weekly programme. Children, staff, and carers know what to expect, promoting predictability, routine, and effective preparation.`,
      severity: "positive",
    });
  }

  if (deliveryRate >= 90 && asPlannedRate >= 90 && totalAdherenceRecords > 0) {
    insights.push({
      text: `${deliveryRate}% delivery rate with ${asPlannedRate}% delivered as planned -- exceptional adherence to the weekly schedule. Children can trust that promised activities will happen, building reliability and positive expectations.`,
      severity: "positive",
    });
  }

  if (childSatisfactionRate >= 80 && satisfactionDenominator >= 2) {
    insights.push({
      text: `Overall child satisfaction at ${childSatisfactionRate}% across planning, variety, and delivery -- children are satisfied with the weekly programme. Their positive experience is the strongest indicator that planning is effective and child-centred.`,
      severity: "positive",
    });
  }

  if (uniqueCategoryCount >= 6 && typeFlags >= 8 && totalVarietyRecords > 0) {
    insights.push({
      text: `${uniqueCategoryCount} activity categories with ${typeFlags} different types -- the home provides an exceptionally varied programme that offers children diverse experiences across educational, recreational, physical, creative, cultural, therapeutic, community, and life skills domains.`,
      severity: "positive",
    });
  }

  if (suggestionActedRate >= 80 && planningSessionAttendanceRate >= 80 && totalChildInputRecords > 0 && totalSuggestions > 0) {
    insights.push({
      text: `${suggestionActedRate}% of suggestions acted upon with ${planningSessionAttendanceRate}% planning session attendance -- children are empowered to co-create their weekly programme. This level of participation demonstrates outstanding child-centred practice.`,
      severity: "positive",
    });
  }

  if (alternativeRate >= 80 && childInformedRate >= 90 && notDelivered > 0 && changesNotAsPlanned > 0) {
    insights.push({
      text: `${alternativeRate}% alternatives provided with ${childInformedRate}% of changes communicated to children -- even when plans change, the home ensures children still receive meaningful experiences and are kept informed. This demonstrates resilient, responsive planning.`,
      severity: "positive",
    });
  }

  if (feedbackRate >= 80 && totalChildInputRecords > 0) {
    insights.push({
      text: `${feedbackRate}% post-activity feedback capture -- the home systematically learns from children's experiences to improve future planning. This continuous improvement cycle is evidence of reflective practice valued by Ofsted.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (planner_rating === "outstanding") {
    headline =
      "Outstanding weekly planning and activity scheduling -- schedules are timely, varied, child-informed, well-communicated, and consistently delivered.";
  } else if (planner_rating === "good") {
    headline = `Good weekly planning and activity scheduling -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (planner_rating === "adequate") {
    headline = `Adequate weekly planning and activity scheduling -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children receive a structured, varied, and child-centred programme.`;
  } else {
    headline = `Weekly planning and activity scheduling is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children receive a structured programme of activities.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    planner_rating,
    planner_score: score,
    headline,
    schedule_timeliness_rate: scheduleTimelinessRate,
    activity_variety_rate: activityVarietyRate,
    child_input_rate: childInputRate,
    communication_rate: communicationRate,
    adherence_rate: adherenceRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
